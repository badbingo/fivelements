import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import '../models/bazi_model.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';
import '../services/bazi_api_service.dart';
import '../utils/bazi_calculator.dart';

class AppProvider with ChangeNotifier {
  UserModel? _user;
  BaziModel? _currentBazi;
  WealthAnalysis? _currentAnalysis;
  FateAnalysis? _currentFateAnalysis;
  bool _isLoading = false;
  String _errorMessage = '';
  List<BaziRecord> _recentRecords = [];

  AppProvider() {
    // 初始化时清除错误状态
    _errorMessage = '';
    // 延迟加载头像设置，但不自动加载用户数据
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadSelectedZodiac();
      // 注意：不再自动加载用户数据，需要用户主动登录
    });
  }

  // 从SharedPreferences加载头像设置
  Future<void> _loadSelectedZodiac() async {
    final prefs = await SharedPreferences.getInstance();
    final newZodiac = prefs.getString('selected_zodiac') ?? 'dragon';
    print('🔍 AppProvider加载头像: $newZodiac (当前: $_selectedZodiac)');
    _selectedZodiac = newZodiac;
    notifyListeners();
    print('✅ AppProvider头像已更新并通知监听者');
  }

  // Getters
  UserModel? get user => _user;
  BaziModel? get currentBazi => _currentBazi;
  WealthAnalysis? get currentAnalysis => _currentAnalysis;
  FateAnalysis? get currentFateAnalysis => _currentFateAnalysis;
  bool get isLoading => _isLoading;
  String get errorMessage => _errorMessage;
  bool get isLoggedIn => _user != null && _user!.token != null;
  double get balance => _user?.balance ?? 0.0;
  List<BaziRecord> get recentRecords => _recentRecords;

  // 头像更新通知
  String _selectedZodiac = 'dragon';
  String get selectedZodiac => _selectedZodiac;

  Future<void> updateSelectedZodiac(String zodiac) async {
    _selectedZodiac = zodiac;

    // 保存到本地存储
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('selected_zodiac', zodiac);

    // 同步到服务器
    await syncAvatarToServer(zodiac);

    notifyListeners();
  }

  // 重新加载头像设置（公共方法）
  Future<void> reloadSelectedZodiac() async {
    await _loadSelectedZodiac();
  }

  // 设置加载状态
  void setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }

  // 设置错误信息
  void setError(String error) {
    _errorMessage = error;
    notifyListeners();
  }

  // 清除错误信息
  void clearError() {
    _errorMessage = '';
    notifyListeners();
  }

  // 设置用户信息（用于外部登录后同步用户数据）
  Future<void> setUserInfo(UserModel user) async {
    _user = user;
    await _saveUserToLocal();
    notifyListeners();
  }

  // 从AuthService同步用户信息
  Future<void> syncUserFromAuthService(dynamic authService) async {
    if (authService.currentUser != null && authService.token != null) {
      // 保留现有的个人八字信息和token（如果AuthService的token为空）
      final existingPersonalBazi = _user?.personalBazi;
      final existingToken = _user?.token;

      print(
        '🔍 同步用户信息: AuthService token=${authService.token != null ? '有效' : '无效'}, 现有token=${existingToken != null ? '有效' : '无效'}',
      );
      print('🔍 AuthService token值: ${authService.token}');
      print('🔍 现有token值: $existingToken');

      final finalToken = authService.token ?? existingToken;
      print('🔍 最终使用的token: $finalToken');

      final user = UserModel(
        id: authService.currentUser.id,
        username: authService.currentUser.username,
        balance: authService.currentUser.balance,
        token: finalToken, // 使用明确的finalToken变量
        personalBazi: existingPersonalBazi, // 保留现有的个人八字信息
      );

      print('🔍 创建的UserModel token: ${user.token}');

      _user = user;
      print('🔍 赋值后_user.token: ${_user?.token}');
      await _saveUserToLocal();
      print('🔍 保存后_user.token: ${_user?.token}');

      // 按顺序执行异步操作，避免竞态条件
      try {
        // 先从服务器加载最新的用户资料（包括个人八字信息）
        await loadUserProfileFromServer();
        print('✅ 同步后从服务器加载用户资料成功');

        // 然后更新余额（如果需要的话）
        // updateBalance方法会在其他地方被调用，这里不需要重复调用
      } catch (e) {
        print('⚠️ 同步后从服务器加载用户资料失败: $e');
      }

      // 同步后重新加载用户记录
      await loadRecentRecords();
      notifyListeners();
    } else {
      print('⚠️ AuthService用户信息或token无效，跳过同步');
    }
  }

  // 清除用户信息
  Future<void> clearUserInfo() async {
    _user = null;

    _recentRecords = [];

    // 清除本地存储
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('user_data');
    
    // 清除QA相关缓存
    await prefs.remove('daily_question_count');
    await prefs.remove('last_question_date');
    await prefs.remove('qa_history');
    print('🔍 AppProvider - 已清除QA相关缓存');

    notifyListeners();
  }

  // 用户登录
  Future<bool> login(String username, String password) async {
    try {
      setLoading(true);
      clearError();

      final response = await ApiService.login(username, password);

      if (response['success'] == true) {
        _user = UserModel(
          id: response['user']['id'],
          username: response['user']['username'],
          balance: (response['user']['balance'] ?? 0.0).toDouble(),
          token: response['token'],
        );

        // 保存登录信息到本地
        await _saveUserToLocal();

        // 从服务器加载用户资料
        try {
          await loadUserProfileFromServer();
          print('✅ 用户资料已从服务器加载');
        } catch (e) {
          print('⚠️ 从服务器加载用户资料失败: $e');
          // 即使加载失败也不影响登录
        }

        setLoading(false);
        return true;
      } else {
        setError(response['message'] ?? '登录失败');
        setLoading(false);
        return false;
      }
    } catch (e) {
      setError('登录失败: $e');
      setLoading(false);
      return false;
    }
  }

  // 用户注册
  Future<bool> register(String username, String email, String password) async {
    try {
      setLoading(true);
      clearError();

      final response = await ApiService.register(username, email, password);

      if (response['success'] == true) {
        setLoading(false);
        return true;
      } else {
        setError(response['message'] ?? '注册失败');
        setLoading(false);
        return false;
      }
    } catch (e) {
      setError('注册失败: $e');
      setLoading(false);
      return false;
    }
  }

  // 用户登出
  Future<void> logout() async {
    _user = null;
    _currentBazi = null;
    _currentAnalysis = null;
    _currentFateAnalysis = null;
    _recentRecords = [];

    // 只清除用户相关的本地存储，保留头像设置
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('user_data');
    
    // 清除QA相关缓存
    await prefs.remove('daily_question_count');
    await prefs.remove('last_question_date');
    await prefs.remove('qa_history');
    print('🔍 AppProvider - 登出时已清除QA相关缓存');
    
    // 注意：不清除 'selected_zodiac'，保留用户的头像选择

    notifyListeners();
  }

  // 更新用户余额
  bool _isUpdatingBalance = false; // 添加锁定标志

  Future<void> updateBalance() async {
    // 防止重复执行
    if (_isUpdatingBalance) {
      print('⚠️ updateBalance已在执行中，跳过重复调用');
      return;
    }

    _isUpdatingBalance = true;

    try {
      print('🔍 updateBalance方法开始执行');
      print('🔍 当前_user对象: ${_user?.toJson()}');

      if (_user?.token == null) {
        print('⚠️ 用户token为空，跳过服务器同步');
        return;
      }

      // 在方法开始时保存当前用户的完整状态
      final currentUser = _user!;
      final savedToken = currentUser.token!;
      final savedPersonalBazi = currentUser.personalBazi;

      print('🔍 updateBalance开始，使用保存的token: $savedToken');
      print(
        '🔍 updateBalance开始时的personalBazi: ${savedPersonalBazi?.name ?? 'null'}',
      );
      print(
        '🔍 updateBalance开始时的完整personalBazi: ${savedPersonalBazi?.toJson()}',
      );

      final balance = await ApiService.getUserBalance(savedToken);
      print('🔍 从服务器获取余额: $balance');

      // 使用保存的数据创建新的UserModel，确保不会丢失任何信息
      _user = UserModel(
        id: currentUser.id,
        username: currentUser.username,
        balance: balance,
        token: savedToken, // 使用保存的token
        personalBazi: savedPersonalBazi, // 保留个人八字信息
      );

      print('🔍 创建新UserModel后的token: ${_user!.token}');
      print('🔍 创建新UserModel后的personalBazi: ${_user!.personalBazi?.name}');
      await _saveUserToLocal();
      notifyListeners();
      print('✅ updateBalance执行完成');
    } catch (e) {
      print('❌ updateBalance错误: $e');
      setError('更新余额失败: $e');
    } finally {
      _isUpdatingBalance = false; // 释放锁定
    }
  }

  // 设置当前八字
  void setCurrentBazi(BaziModel bazi) {
    _currentBazi = bazi;
    notifyListeners();
  }

  // 计算财富分析
  Future<void> calculateWealth() async {
    if (_currentBazi == null) {
      setError('请先输入八字信息');
      return;
    }

    try {
      setLoading(true);
      clearError();

      // 本地计算（可选）
      final localResult = BaziCalculator.analyzeWealth(_currentBazi!.toJson());
      _currentAnalysis = WealthAnalysis.fromJson(localResult);

      // 如果需要更精确的计算，可以调用后端API
      // final analysis = await ApiService.calculateWealth(_currentBazi!);
      // _currentAnalysis = analysis;

      setLoading(false);
    } catch (e) {
      setError('计算失败: $e');
      setLoading(false);
    }
  }

  // 计算命格分析
  Future<void> calculateFate() async {
    if (_currentBazi == null) {
      setError('请先输入八字信息');
      return;
    }

    try {
      setLoading(true);
      clearError();

      // 本地计算
      final localResult = BaziCalculator.analyzeFate(_currentBazi!.toJson());
      _currentFateAnalysis = FateAnalysis.fromJson(localResult);

      setLoading(false);
    } catch (e) {
      setError('命格计算失败: $e');
      setLoading(false);
    }
  }

  // 支付功能
  Future<bool> processPayment(double amount, String description) async {
    if (_user?.token == null) {
      setError('请先登录');
      return false;
    }

    try {
      setLoading(true);
      clearError();

      final response = await ApiService.deductBalance(
        _user!.token!,
        amount,
        description,
      );

      if (response['success'] == true) {
        // 更新余额
        await updateBalance();
        setLoading(false);
        return true;
      } else {
        setError(response['message'] ?? '支付失败');
        setLoading(false);
        return false;
      }
    } catch (e) {
      setError('支付失败: $e');
      setLoading(false);
      return false;
    }
  }

  // 充值功能
  Future<Map<String, dynamic>?> processRecharge(double amount) async {
    if (_user?.token == null) {
      setError('请先登录');
      return null;
    }

    try {
      setLoading(true);
      clearError();

      // 创建充值订单
      final orderResponse = await ApiService.createRechargeOrder(
        _user!.token!,
        amount,
      );

      if (orderResponse['success'] == true) {
        setLoading(false);
        return orderResponse;
      } else {
        setError(orderResponse['message'] ?? '创建充值订单失败');
        setLoading(false);
        return null;
      }
    } catch (e) {
      setError('充值失败: $e');
      setLoading(false);
      return null;
    }
  }

  // 验证充值结果
  Future<bool> verifyRecharge(String orderId) async {
    if (_user?.token == null) {
      setError('请先登录');
      return false;
    }

    try {
      setLoading(true);
      clearError();

      final response = await ApiService.verifyRecharge(_user!.token!, orderId);

      if (response['success'] == true) {
        // 更新余额
        await updateBalance();
        setLoading(false);
        return true;
      } else {
        setError(response['message'] ?? '充值验证失败');
        setLoading(false);
        return false;
      }
    } catch (e) {
      setError('充值验证失败: $e');
      setLoading(false);
      return false;
    }
  }

  // 模拟充值（用于测试）
  Future<bool> simulateRecharge(double amount) async {
    if (_user?.token == null) {
      setError('请先登录');
      return false;
    }

    try {
      setLoading(true);
      clearError();

      final response = await ApiService.simulateRecharge(_user!.token!, amount);

      if (response['success'] == true) {
        // 更新余额
        await updateBalance();
        setLoading(false);
        return true;
      } else {
        setError(response['message'] ?? '模拟充值失败');
        setLoading(false);
        return false;
      }
    } catch (e) {
      setError('模拟充值失败: $e');
      setLoading(false);
      return false;
    }
  }

  // 保存用户信息到本地
  Future<void> _saveUserToLocal() async {
    if (_user == null) return;

    final prefs = await SharedPreferences.getInstance();
    final userData = _user!.toJson();
    print('🔍 准备保存用户数据到本地: $userData');
    await prefs.setString('user_data', json.encode(userData));
    print('✅ 用户数据已保存到本地存储');
  }

  // 从本地加载用户信息
  Future<void> loadUserFromStorage() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final userData = prefs.getString('user_data');

      if (userData != null) {
        final jsonMap = json.decode(userData);
        print('🔍 从本地存储加载的用户数据: $jsonMap');

        // 创建UserModel对象
        _user = UserModel.fromJson(jsonMap);
        print('🔍 创建UserModel后的token: ${_user?.token}');

        // 如果本地存储的token为空，尝试从AuthService获取token
        if (_user?.token == null) {
          print('⚠️ 本地存储的token为空，尝试从AuthService获取');
          try {
            // 导入AuthService并获取token
            final authService = AuthService();
            await authService.initialize();

            if (authService.token != null && authService.currentUser != null) {
              print('🔍 从AuthService获取到token: ${authService.token}');
              // 使用AuthService的token更新用户对象
              _user = _user!.copyWith(token: authService.token);
              print('🔍 更新后的_user.token: ${_user?.token}');
              // 保存更新后的用户数据
              await _saveUserToLocal();
            } else {
              print('⚠️ AuthService中也没有有效的token');
            }
          } catch (e) {
            print('⚠️ 从AuthService获取token失败: $e');
          }
        }

        // 如果用户已登录，尝试从服务器加载最新的用户资料（包括个人八字信息）
        if (_user?.token != null) {
          try {
            print('🔍 开始从服务器同步用户资料，token: ${_user!.token}');
            await loadUserProfileFromServer();
            print('✅ 从服务器同步用户资料成功');
          } catch (e) {
            print('⚠️ 从服务器同步用户资料失败: $e');
            print('⚠️ 异常详情: ${e.toString()}');
            // 即使同步失败也不影响本地数据加载
          }
        } else {
          print('⚠️ 用户token为空，跳过服务器同步');
        }

        notifyListeners();
      }
    } catch (e) {
      // 忽略加载错误
      print('Error loading user from storage: $e');
    }
  }

  // 初始化应用
  Future<void> initializeApp() async {
    await loadUserFromStorage();
    // 确保在用户信息加载后再加载对应用户的记录
    await loadRecentRecords();
  }

  // 添加最近记录（仅本地存储，不同步到数据库）
  void addLocalRecentRecord(
    String name,
    String gender,
    String birthDate,
    String birthTime, {
    String type = 'bazi',
    String title = '',
    String summary = '',
    double cost = 0.0,
  }) {
    // 检查是否已存在同名记录，如果存在则先删除
    _recentRecords.removeWhere((record) => record.name == name);

    final record = BaziRecord(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      name: name,
      gender: gender,
      birthDate: birthDate,
      birthTime: birthTime,
      type: type,
      title: title.isEmpty ? '$name的八字测算' : title,
      summary: summary,
      cost: cost,
      createdAt: DateTime.now(),
    );

    _recentRecords.insert(0, record);
    if (_recentRecords.length > 10) {
      _recentRecords.removeLast();
    }

    _saveRecentRecords();
    notifyListeners();
  }

  // 添加最近记录（保持原有功能，用于其他需要同步到数据库的场景）
  void addRecentRecord(
    String name,
    String gender,
    String birthDate,
    String birthTime, {
    String type = 'bazi',
    String title = '',
    String summary = '',
    double cost = 0.0,
  }) {
    // 检查是否已存在同名记录，如果存在则先删除
    _recentRecords.removeWhere((record) => record.name == name);

    final record = BaziRecord(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      name: name,
      gender: gender,
      birthDate: birthDate,
      birthTime: birthTime,
      type: type,
      title: title.isEmpty ? '$name的八字测算' : title,
      summary: summary,
      cost: cost,
      createdAt: DateTime.now(),
    );

    _recentRecords.insert(0, record);
    if (_recentRecords.length > 10) {
      _recentRecords.removeLast();
    }

    _saveRecentRecords();
    notifyListeners();
  }

  // 加载记录
  void loadRecord(BaziRecord record) {
    // 这里可以设置当前的八字数据
    notifyListeners();
  }

  // 删除记录
  void deleteRecord(BaziRecord record) {
    _recentRecords.remove(record);
    _saveRecentRecords();
    notifyListeners();
  }

  // 通过ID删除记录
  void removeRecentRecord(String recordId) {
    _recentRecords.removeWhere((record) => record.id == recordId);
    _saveRecentRecords();
    notifyListeners();
  }

  // 设置个人八字信息
  Future<void> setPersonalBazi(PersonalBaziInfo baziInfo) async {
    if (_user != null) {
      _user = _user!.copyWith(personalBazi: baziInfo);
      await _saveUserToLocal();
      // 同步到服务器
      await _syncPersonalBaziToServer(baziInfo);
      notifyListeners();
    }
  }

  // 获取个人八字信息
  PersonalBaziInfo? get personalBazi => _user?.personalBazi;

  // 清除个人八字信息
  Future<void> clearPersonalBazi() async {
    if (_user != null) {
      _user = _user!.copyWith(personalBazi: null);
      await _saveUserToLocal();
      notifyListeners();
    }
  }

  // 更新个人八字信息
  Future<void> updatePersonalBazi({
    String? name,
    String? birthDate,
    String? birthTime,
    String? gender,
    String? solarDate,
    String? lunarDate,
    BaziModel? baziData,
  }) async {
    if (_user?.personalBazi != null) {
      final updatedBazi = _user!.personalBazi!.copyWith(
        name: name,
        birthDate: birthDate,
        birthTime: birthTime,
        gender: gender,
        solarDate: solarDate,
        lunarDate: lunarDate,
        baziData: baziData,
        updatedAt: DateTime.now(),
      );
      await setPersonalBazi(updatedBazi);
    }
  }

  // 同步个人八字信息到服务器
  Future<void> _syncPersonalBaziToServer(PersonalBaziInfo baziInfo) async {
    if (_user?.token == null) return;

    try {
      final apiService = BaziApiService();
      final profileData = {
        'real_name': baziInfo.name,
        'gender': baziInfo.gender,
        'birth_date': baziInfo.birthDate,
        'birth_time': baziInfo.birthTime,
        'birth_location': '', // 暂时为空，PersonalBaziInfo中没有此字段
        'lunar_date': baziInfo.lunarDate,
        'bazi_chart': baziInfo.baziData != null
            ? json.encode(baziInfo.baziData!.toJson())
            : null,
        'bazi_info': json.encode(baziInfo.toJson()),
      };

      await apiService.updateUserProfile(_user!.token!, profileData);
    } catch (e) {
      print('同步个人八字到服务器失败: $e');
      // 不抛出异常，允许本地保存成功
    }
  }

  // 同步头像到服务器
  Future<void> syncAvatarToServer(String zodiac) async {
    if (_user?.token == null) return;

    try {
      final apiService = BaziApiService();
      await apiService.updateUserProfile(_user!.token!, {'avatar': zodiac});
    } catch (e) {
      print('同步头像到服务器失败: $e');
    }
  }

  // 更新用户名
  Future<bool> updateUsername(String newUsername) async {
    if (_user?.token == null) return false;

    try {
      final apiService = BaziApiService();
      final result = await apiService.updateUserProfile(_user!.token!, {
        'name': newUsername,
      });

      // 更新本地用户信息
      _user = _user!.copyWith(username: newUsername);
      await _saveUserToLocal();
      notifyListeners();

      return true;
    } catch (e) {
      print('更新用户名失败: $e');
      return false;
    }
  }

  // 从服务器加载用户资料
  Future<void> loadUserProfileFromServer() async {
    print('🔍 开始loadUserProfileFromServer，当前用户token: ${_user?.token}');
    if (_user?.token == null) {
      print('⚠️ loadUserProfileFromServer: 用户token为空，退出');
      return;
    }

    try {
      print('🔍 调用BaziApiService.getUserProfile');
      final apiService = BaziApiService();
      final profileData = await apiService.getUserProfile(_user!.token!);
      print('🔍 从服务器获取用户资料成功: ${profileData.keys.toList()}');

      // 更新头像
      if (profileData['avatar'] != null) {
        _selectedZodiac = profileData['avatar'];
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('selected_zodiac', _selectedZodiac);
        print('🔍 头像已更新: $_selectedZodiac');
      }

      // 更新个人八字信息
      print('🔍 从服务器获取的用户资料: ${profileData.keys.toList()}');
      print('🔍 bazi_info字段值: ${profileData['bazi_info']}');

      if (profileData['bazi_info'] != null) {
        try {
          final baziInfoJson = json.decode(profileData['bazi_info']);
          print('🔍 解析后的八字信息JSON: $baziInfoJson');
          final baziInfo = PersonalBaziInfo.fromJson(baziInfoJson);
          print('✅ 八字信息解析成功: ${baziInfo.name}');
          print('🔍 copyWith前的用户token: ${_user?.token}');
          _user = _user!.copyWith(
            personalBazi: baziInfo,
            token: _user!.token, // 明确保留token
          );
          print('✅ 用户八字信息已更新');
          print('🔍 更新后的用户personalBazi: ${_user?.personalBazi?.name}');
          print('🔍 更新后的用户token: ${_user?.token}');
        } catch (e) {
          print('❌ 解析八字信息失败: $e');
        }
      } else {
        print('⚠️ 服务器返回的bazi_info为空');
      }

      await _saveUserToLocal();
      print('🔍 保存到本地后的用户数据: ${_user?.toJson()}');
      notifyListeners();
      print('✅ 已通知所有监听者数据更新');
      print('✅ loadUserProfileFromServer执行完成');
    } catch (e) {
      print('❌ loadUserProfileFromServer异常: $e');
      print('❌ 异常类型: ${e.runtimeType}');
      print('❌ 异常堆栈: ${StackTrace.current}');
      rethrow; // 重新抛出异常以便上层捕获
    }
  }

  // 保存最近记录到本地
  Future<void> _saveRecentRecords() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final recordsJson = _recentRecords.map((r) => r.toJson()).toList();
      // 使用用户ID作为存储键的一部分，确保每个用户的记录分开存储
      final storageKey = _user != null
          ? 'recent_records_${_user!.id}'
          : 'recent_records';
      await prefs.setString(storageKey, json.encode(recordsJson));
    } catch (e) {
      // 忽略保存错误
    }
  }

  // 从本地加载最近记录
  Future<void> loadRecentRecords() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      // 使用用户ID作为存储键的一部分，加载对应用户的记录
      final storageKey = _user != null
          ? 'recent_records_${_user!.id}'
          : 'recent_records';
      final recordsData = prefs.getString(storageKey);

      if (recordsData != null) {
        final List<dynamic> recordsList = json.decode(recordsData);
        _recentRecords = recordsList
            .map((r) => BaziRecord.fromJson(r))
            .toList();
      } else {
        // 如果没有找到用户专属记录，清空记录列表
        _recentRecords = [];
      }
      notifyListeners();
    } catch (e) {
      // 忽略加载错误，但确保记录列表被清空
      _recentRecords = [];
      notifyListeners();
    }
  }

  // 检查登录状态
  Future<bool> checkLoginStatus() async {
    await loadUserFromStorage();
    return isLoggedIn;
  }
}

// 八字记录模型
class BaziRecord {
  final String id;
  final String name;
  final String gender;
  final String birthDate;
  final String birthTime;
  final String type;
  final String title;
  final String summary;
  final double cost;
  final DateTime createdAt;

  BaziRecord({
    required this.id,
    required this.name,
    required this.gender,
    required this.birthDate,
    required this.birthTime,
    required this.type,
    required this.title,
    required this.summary,
    required this.cost,
    required this.createdAt,
  });

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'gender': gender,
      'birthDate': birthDate,
      'birthTime': birthTime,
      'type': type,
      'title': title,
      'summary': summary,
      'cost': cost,
      'createdAt': createdAt.toIso8601String(),
    };
  }

  factory BaziRecord.fromJson(Map<String, dynamic> json) {
    return BaziRecord(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      gender: json['gender'] ?? '',
      birthDate: json['birthDate'] ?? '',
      birthTime: json['birthTime'] ?? '',
      type: json['type'] ?? 'bazi',
      title: json['title'] ?? '',
      summary: json['summary'] ?? '',
      cost: (json['cost'] ?? 0.0).toDouble(),
      createdAt: DateTime.parse(
        json['createdAt'] ?? DateTime.now().toIso8601String(),
      ),
    );
  }
}
