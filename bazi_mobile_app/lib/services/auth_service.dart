import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:sign_in_with_apple/sign_in_with_apple.dart';
import '../models/user_models.dart';
import 'bazi_api_service.dart';
// Web平台存储将通过kIsWeb检查和动态访问实现

/// 用户认证服务
/// 管理用户登录状态、Token存储和Apple Sign In集成
class AuthService extends ChangeNotifier {
  static const String _tokenKey = 'auth_token';
  static const String _userKey = 'user_data';
  static const String _settingsKey = 'user_settings';
  static const String _rememberMeKey = 'remember_me';
  static const String _savedUsernameKey = 'saved_username';
  static const String _savedPasswordKey = 'saved_password';

  final BaziApiService _apiService = BaziApiService();
  SharedPreferences? _prefs;

  User? _currentUser;
  String? _token;
  UserSettings _settings = UserSettings();
  bool _isLoading = false;

  // Getters
  User? get currentUser => _currentUser;
  String? get token => _token;
  UserSettings get settings => _settings;
  bool get isLoading => _isLoading;
  bool get isLoggedIn => _currentUser != null && _token != null;

  /// 初始化认证服务
  Future<void> initialize() async {
    _prefs = await SharedPreferences.getInstance();

    // 调试：显示所有存储的键值
    if (kIsWeb) {
      final allKeys = _prefs?.getKeys() ?? {};
      print('🔍 Web环境下所有存储的键: $allKeys');
      for (String key in allKeys) {
        final value = _prefs?.get(key);
        print('🔍 键: $key, 值: $value');
      }

      // Web环境下优先从localStorage加载凭据
      await _loadFromWebStorage();
    }

    // 首先加载存储的认证信息（token和用户数据）
    await _loadStoredAuth();
    await _loadSettings();

    // 检查保存的凭据但不自动登录，只记录状态
    final credentials = await _getSavedCredentials();
    final hasRememberMe = credentials['rememberMe'] as bool;
    final savedUsername = credentials['username'] as String?;
    final savedPassword = credentials['password'] as String?;

    print(
      '🔍 检查保存的凭据: rememberMe=$hasRememberMe, username=$savedUsername, password=${savedPassword != null ? '已保存' : '未保存'}',
    );

    if (hasRememberMe && savedUsername != null && savedPassword != null) {
      print('🔍 发现保存的登录凭据，但不自动登录，需要用户主动登录');
    } else {
      print('🔍 未发现保存的登录凭据，需要重新登录并勾选"记住我"');
    }
  }

  /// 加载存储的认证信息（仅检查，不自动设置登录状态）
  Future<void> _loadStoredAuth() async {
    try {
      final token = _prefs?.getString(_tokenKey);
      final userData = _prefs?.getString(_userKey);

      if (token != null && userData != null && userData.isNotEmpty) {
        // 验证JSON数据的完整性
        final Map<String, dynamic> userMap = json.decode(userData);

        debugPrint('🔍 发现保存的认证信息，但不自动登录');
        debugPrint('🔍 保存的用户数据内容: $userMap');
        
        // 检查核心字段是否存在
        if (userMap['id'] == null || userMap['username'] == null) {
          debugPrint('用户数据不完整，清除存储的认证信息');
          await _clearAuthDataOnly();
        }
        // 注意：不再自动设置_token和_currentUser，需要用户主动登录
      } else {
        debugPrint('🔍 未发现保存的认证信息');
      }
    } catch (e) {
      debugPrint('加载认证信息失败: $e');
      // 只清除token和用户数据，保留保存的用户名密码
      await _clearAuthDataOnly();
    }
  }

  /// 验证token有效性
  Future<bool> _validateToken() async {
    if (_token == null) return false;

    try {
      await _apiService.getUserInfo(_token!);
      return true;
    } catch (e) {
      debugPrint('Token验证失败: $e');
      return false;
    }
  }

  /// 清除存储的认证信息
  Future<void> _clearStoredAuth() async {
    await _prefs?.remove(_tokenKey);
    await _prefs?.remove(_userKey);
    await _prefs?.remove(_rememberMeKey);
    await _prefs?.remove(_savedUsernameKey);
    await _prefs?.remove(_savedPasswordKey);
  }

  /// 只清除认证数据，保留记住我的设置
  Future<void> _clearAuthDataOnly() async {
    await _prefs?.remove(_tokenKey);
    await _prefs?.remove(_userKey);
    _token = null;
    _currentUser = null;
    notifyListeners();
  }

  /// 用户登录
  Future<AuthResult> login(
    String username,
    String password, {
    bool rememberMe = false,
  }) async {
    _setLoading(true);

    try {
      final result = await _apiService.login(username, password);

      if (result.success && result.token != null && result.user != null) {
        // 无论是否记住，都保存token和用户数据到本地存储（用于会话管理）
        await _saveAuthData(result.token!, result.user!);

        // 只有勾选"记住我"时才保存用户名密码凭据
        if (rememberMe) {
          await _saveToWebStorage(username, password, true);
          await _saveCredentialsWithRetry(username, password);
          print('🔐 登录成功，已保存凭据');
        } else {
          // 如果没有勾选记住我，确保清除rememberMe标记和保存的凭据
          await _saveToWebStorage('', '', false);
          await _prefs?.setBool(_rememberMeKey, false);
          await _prefs?.remove(_savedUsernameKey);
          await _prefs?.remove(_savedPasswordKey);
          print('🔐 登录成功，未勾选记住我，已清除凭据');
        }

        // 设置当前会话的用户信息
        _token = result.token;
        _currentUser = result.user;
        notifyListeners();
      }

      return result;
    } catch (e) {
      return AuthResult(success: false, message: '登录失败: $e');
    } finally {
      _setLoading(false);
    }
  }

  /// 用户注册
  Future<AuthResult> register(RegisterRequest request) async {
    _setLoading(true);

    try {
      if (!request.isValid) {
        return AuthResult(success: false, message: '请填写完整信息并同意服务条款');
      }

      final result = await _apiService.register(
        request.username,
        request.email,
        request.password,
      );

      if (result.success && result.token != null && result.user != null) {
        await _saveAuthData(result.token!, result.user!);
        _token = result.token;
        _currentUser = result.user;
        notifyListeners();
      }

      return result;
    } catch (e) {
      return AuthResult(success: false, message: '注册失败: $e');
    } finally {
      _setLoading(false);
    }
  }

  /// Apple登录
  Future<AuthResult> signInWithApple() async {
    _setLoading(true);
    debugPrint('🍎 开始Apple登录流程');

    try {
      // 检查Apple登录可用性
      debugPrint('🍎 检查Apple登录可用性');
      final isAvailable = await SignInWithApple.isAvailable();
      debugPrint('🍎 Apple登录可用性: $isAvailable');
      if (!isAvailable) {
        debugPrint('🍎 ❌ 此设备不支持Apple登录');
        return AuthResult(success: false, message: '此设备不支持Apple登录');
      }

      // 获取Apple凭证
      debugPrint('🍎 开始获取Apple凭证');
      final credential = await SignInWithApple.getAppleIDCredential(
        scopes: [
          AppleIDAuthorizationScopes.email,
          AppleIDAuthorizationScopes.fullName,
        ],
      );
      debugPrint('🍎 ✅ Apple凭证获取成功');
      debugPrint('🍎 用户ID: ${credential.userIdentifier}');
      debugPrint('🍎 邮箱: ${credential.email}');
      debugPrint('🍎 姓名: ${credential.givenName} ${credential.familyName}');

      // 转换为API格式
      final appleCredential = AppleCredential(
        user: credential.userIdentifier ?? '',
        email: credential.email,
        givenName: credential.givenName,
        familyName: credential.familyName,
        identityToken: credential.identityToken,
      );
      debugPrint('🍎 凭证转换完成，准备调用后台API');

      // 调用后台API，增加重试机制处理网络权限问题
      late AuthResult result;
      int retryCount = 0;
      const maxRetries = 3;
      
      do {
        try {
          result = await _apiService.appleSignIn(appleCredential);
          break; // 成功则跳出循环
        } catch (e) {
          retryCount++;
          debugPrint('🍎 ⚠️ API调用失败 (尝试 $retryCount/$maxRetries): $e');
          
          if (retryCount < maxRetries && 
              (e.toString().contains('network') || 
               e.toString().contains('connection') ||
               e.toString().contains('timeout'))) {
            debugPrint('🍎 🔄 等待2秒后重试...');
            await Future.delayed(const Duration(seconds: 2));
            continue;
          } else {
            rethrow; // 重试次数用完或非网络错误，抛出异常
          }
        }
      } while (retryCount < maxRetries);
      
      debugPrint(
        '🍎 后台API调用结果: success=${result.success}, message=${result.message}',
      );

      if (result.success && result.token != null && result.user != null) {
        debugPrint('🍎 ✅ Apple登录成功，保存认证数据');
        await _saveAuthData(result.token!, result.user!);
        _token = result.token;
        _currentUser = result.user;
        notifyListeners();
        
        // 额外延迟确保状态同步
        await Future.delayed(const Duration(milliseconds: 500));
        debugPrint('🍎 ✅ 登录状态已同步');
      } else {
        debugPrint('🍎 ❌ Apple登录失败: ${result.message}');
      }

      return result;
    } catch (e) {
      // 首先检查是否为用户取消操作，避免显示错误日志
      if (e.toString().contains('SignInWithAppleAuthorizationException') &&
          (e.toString().contains('1001') ||
              e.toString().contains('canceled'))) {
        debugPrint('🍎 ℹ️ 用户取消了Apple登录授权');
        return AuthResult(success: false, message: null); // 不显示错误消息
      }

      // 其他异常才显示错误日志
      debugPrint('🍎 ❌ Apple登录异常: $e');
      debugPrint('🍎 ❌ 异常类型: ${e.runtimeType}');

      if (e.toString().contains('SignInWithAppleAuthorizationException')) {
        debugPrint('🍎 ❌ 这是Apple授权异常');
      }

      return AuthResult(success: false, message: 'Apple登录失败: $e');
    } finally {
      _setLoading(false);
      debugPrint('🍎 Apple登录流程结束');
    }
  }

  /// 密码重置
  Future<bool> resetPassword(String email) async {
    _setLoading(true);

    try {
      // 这里需要调用后台API发送重置邮件
      // 暂时返回true，实际需要实现API调用
      await Future.delayed(const Duration(seconds: 2));
      return true;
    } catch (e) {
      debugPrint('密码重置失败: $e');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  /// 刷新用户信息
  Future<void> refreshUserInfo() async {
    if (_token == null) return;

    try {
      final user = await _apiService.getUserInfo(_token!);
      _currentUser = user;
      await _saveUserData(user);
      notifyListeners();
    } catch (e) {
      debugPrint('刷新用户信息失败: $e');
    }
  }

  /// 更新用户余额
  Future<void> refreshBalance() async {
    if (_token == null || _currentUser == null) return;

    try {
      final balance = await _apiService.getUserBalance(_token!);
      _currentUser = _currentUser!.copyWith(balance: balance);
      await _saveUserData(_currentUser!);
      notifyListeners();
    } catch (e) {
      debugPrint('刷新余额失败: $e');
    }
  }

  /// 用户登出
  Future<void> logout() async {
    _setLoading(true);

    try {
      // 只清除token和用户数据，保留记住我的设置和保存的凭据
      await _prefs?.remove(_tokenKey);
      await _prefs?.remove(_userKey);

      // 清除内存数据
      _token = null;
      _currentUser = null;

      notifyListeners();
    } catch (e) {
      debugPrint('登出失败: $e');
    } finally {
      _setLoading(false);
    }
  }

  /// 保存认证数据
  Future<void> _saveAuthData(String token, User user) async {
    await _prefs?.setString(_tokenKey, token);
    await _saveUserData(user);
  }

  /// 保存用户数据
  Future<void> _saveUserData(User user) async {
    await _prefs?.setString(_userKey, json.encode(user.toJson()));
  }

  /// 加载用户设置
  Future<void> _loadSettings() async {
    try {
      final settingsData = _prefs?.getString(_settingsKey);
      if (settingsData != null) {
        _settings = UserSettings.fromJson(json.decode(settingsData));
      }
    } catch (e) {
      debugPrint('加载设置失败: $e');
      _settings = UserSettings();
    }
  }

  /// 更新用户设置
  Future<void> updateSettings(UserSettings newSettings) async {
    try {
      _settings = newSettings;
      await _prefs?.setString(_settingsKey, json.encode(_settings.toJson()));
      notifyListeners();
    } catch (e) {
      debugPrint('保存设置失败: $e');
    }
  }

  /// 设置加载状态
  void _setLoading(bool loading) {
    if (_isLoading != loading) {
      _isLoading = loading;
      notifyListeners();
    }
  }

  /// 检查网络连接
  Future<bool> checkConnection() async {
    return await _apiService.checkConnection();
  }

  /// 获取保存的用户名
  String? getSavedUsername() {
    return _prefs?.getString(_savedUsernameKey);
  }

  /// 获取保存的密码
  String? getSavedPassword() {
    return _prefs?.getString(_savedPasswordKey);
  }

  /// 检查是否启用了记住我功能
  bool isRememberMeEnabled() {
    return _prefs?.getBool(_rememberMeKey) ?? false;
  }

  /// 移动平台凭据管理（已移除Web localStorage支持）
  Future<void> _loadFromWebStorage() async {
    // 在移动平台上不需要Web存储
    return;
  }

  /// 移动平台凭据保存（已移除Web localStorage支持）
  Future<void> _saveToWebStorage(
    String username,
    String password,
    bool rememberMe,
  ) async {
    // 在移动平台上不需要Web存储
    return;
  }

  /// 获取保存的凭据（使用SharedPreferences）
  Future<Map<String, dynamic>> _getSavedCredentials() async {
    // 使用SharedPreferences获取凭据
    return {
      'rememberMe': _prefs?.getBool(_rememberMeKey) ?? false,
      'username': _prefs?.getString(_savedUsernameKey),
      'password': _prefs?.getString(_savedPasswordKey),
    };
  }

  /// 使用重试机制保存凭据
  Future<void> _saveCredentialsWithRetry(
    String username,
    String password,
  ) async {
    const maxRetries = 3;
    const baseDelay = Duration(milliseconds: 100);

    for (int attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // 保存凭据到SharedPreferences
        await _prefs?.setBool(_rememberMeKey, true);
        await _prefs?.setString(_savedUsernameKey, username);
        await _prefs?.setString(_savedPasswordKey, password);

        // Web环境下同时保存到localStorage作为备份
        if (kIsWeb) {
          await _saveToWebStorage(username, password, true);
          await Future.delayed(
            Duration(milliseconds: baseDelay.inMilliseconds * (attempt + 1)),
          );
        }

        // 验证保存是否成功
        final savedRememberMe = _prefs?.getBool(_rememberMeKey) ?? false;
        final savedUser = _prefs?.getString(_savedUsernameKey);
        final savedPass = _prefs?.getString(_savedPasswordKey);

        if (savedRememberMe && savedUser == username && savedPass == password) {
          print('✅ 凭据保存成功 (尝试 ${attempt + 1}/$maxRetries)');
          return;
        } else {
          print('⚠️ 凭据保存验证失败 (尝试 ${attempt + 1}/$maxRetries)');
          if (attempt < maxRetries - 1) {
            await Future.delayed(Duration(milliseconds: 50 * (attempt + 1)));
          }
        }
      } catch (e) {
        print('❌ 保存凭据出错 (尝试 ${attempt + 1}/$maxRetries): $e');
        if (attempt < maxRetries - 1) {
          await Future.delayed(Duration(milliseconds: 100 * (attempt + 1)));
        }
      }
    }

    print('❌ 凭据保存最终失败，已达到最大重试次数');
  }

  @override
  void dispose() {
    _apiService.dispose();
    super.dispose();
  }
}
