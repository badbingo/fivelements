import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/bazi_models.dart';
import '../models/user_models.dart';
import 'deepseek_cache_service.dart';

/// 八字API服务类
/// 负责与现有网页后台进行数据交互
class BaziApiService {
  static const String _baseUrl = 'https://api.mybazi.net'; // 外网生产地址
  static const String _webAssetsUrl = 'https://mybazi.net';

  // 单例模式
  static final BaziApiService _instance = BaziApiService._internal();
  factory BaziApiService() => _instance;
  BaziApiService._internal();

  /// HTTP客户端
  final http.Client _client = http.Client();
  final DeepSeekCacheService _cacheService = DeepSeekCacheService();

  /// 通用请求头
  Map<String, String> get _headers => {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  /// 带认证的请求头
  Map<String, String> _authHeaders(String? token) => {
    ..._headers,
    if (token != null) 'Authorization': 'Bearer $token',
  };

  // ==================== 八字计算相关API ====================

  /// 计算八字
  /// 调用现有的JavaScript计算逻辑
  Future<BaziResult> calculateBazi(BaziInput input) async {
    try {
      final response = await _client.post(
        Uri.parse('$_baseUrl/api/calculate'),
        headers: _headers,
        body: json.encode(input.toJson()),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return BaziResult.fromJson(data);
      } else {
        throw ApiException('计算失败: ${response.statusCode}');
      }
    } catch (e) {
      throw ApiException('网络错误: $e');
    }
  }

  /// 获取八字详细分析
  /// 返回HTML内容用于WebView显示
  Future<String> getDetailedAnalysis(String baziId) async {
    try {
      final response = await _client.get(
        Uri.parse('$_webAssetsUrl/baziphone.html?id=$baziId'),
        headers: _headers,
      );

      if (response.statusCode == 200) {
        return response.body;
      } else {
        throw ApiException('获取详细分析失败: ${response.statusCode}');
      }
    } catch (e) {
      throw ApiException('网络错误: $e');
    }
  }

  /// 获取AI详细分析（九个模块）- 流式输出版本
  /// 调用DeepSeek API进行实时分析，支持缓存和流式输出
  Future<Map<String, dynamic>> getAIDetailedAnalysis(
    Map<String, dynamic> baziData,
    String analysisType, {
    Function(String)? onStreamData,
  }) async {
    try {
      // 首先检查缓存
      final cachedResult = await _cacheService.getCachedDetailedAnalysis(
        baziData,
        analysisType,
      );

      if (cachedResult != null) {
        print('✅ 使用缓存的$analysisType分析结果');
        // 如果有流式回调，模拟流式输出缓存内容
        if (onStreamData != null) {
          final content =
              cachedResult['content'] ?? cachedResult['analysis'] ?? '';
          _simulateStreamOutput(content, onStreamData);
        }
        return cachedResult;
      }

      // 缓存未命中，调用流式API
      print('🔄 调用流式API获取$analysisType分析结果');
      return await _getStreamingAnalysis(baziData, analysisType, onStreamData);
    } catch (e) {
      throw ApiException('网络错误: $e');
    }
  }

  /// 流式分析方法
  Future<Map<String, dynamic>> _getStreamingAnalysis(
    Map<String, dynamic> baziData,
    String analysisType,
    Function(String)? onStreamData,
  ) async {
    final request = http.Request(
      'POST',
      Uri.parse('$_baseUrl/api/detailed-analysis'),
    );

    request.headers.addAll({
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
    });

    request.body = json.encode({
      'baziData': baziData,
      'analysisType': analysisType,
    });

    final streamedResponse = await request.send().timeout(
      const Duration(seconds: 120),
      onTimeout: () {
        throw ApiException('流式API响应超时');
      },
    );

    if (streamedResponse.statusCode != 200) {
      throw ApiException('流式API调用失败: ${streamedResponse.statusCode}');
    }

    String fullContent = '';

    await for (final chunk in streamedResponse.stream.transform(utf8.decoder)) {
      final lines = chunk.split('\n');

      for (final line in lines) {
        if (line.startsWith('data: ')) {
          final data = line.substring(6).trim();

          if (data == '[DONE]') {
            break;
          }

          try {
            final jsonData = json.decode(data);
            final delta = jsonData['choices']?[0]?['delta'];
            final content = delta?['content'];

            if (content != null && content.isNotEmpty) {
              fullContent += content;
              onStreamData?.call(content);
            }
          } catch (e) {
            // 忽略JSON解析错误
            continue;
          }
        }
      }
    }

    // 清理结果中的DeepSeek相关文字
    final cleanedContent = _cleanAnalysisText(fullContent);

    final result = {
      'analysisType': analysisType,
      'content': cleanedContent,
      'analysis': cleanedContent,
      'timestamp': DateTime.now().toIso8601String(),
    };

    // 缓存API响应结果
    await _cacheService.cacheDetailedAnalysis(baziData, analysisType, result);

    return result;
  }

  /// 模拟流式输出缓存内容
  void _simulateStreamOutput(String content, Function(String) onStreamData) {
    const chunkSize = 10;
    for (int i = 0; i < content.length; i += chunkSize) {
      final end = (i + chunkSize < content.length)
          ? i + chunkSize
          : content.length;
      final chunk = content.substring(i, end);
      Future.delayed(Duration(milliseconds: 50 * (i ~/ chunkSize)), () {
        onStreamData(chunk);
      });
    }
  }

  /// 获取五行分析数据
  Future<WuxingAnalysis> getWuxingAnalysis(BaziInput input) async {
    try {
      final response = await _client.post(
        Uri.parse('$_baseUrl/api/wuxing'),
        headers: _headers,
        body: json.encode(input.toJson()),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return WuxingAnalysis.fromJson(data);
      } else {
        throw ApiException('五行分析失败: ${response.statusCode}');
      }
    } catch (e) {
      throw ApiException('网络错误: $e');
    }
  }

  /// 清理分析文本中的DeepSeek相关内容
  String _cleanAnalysisText(String text) {
    return text
        .replaceAll(RegExp(r'以上内容由.*?生成.*?仅供参考', caseSensitive: false), '')
        .replaceAll(RegExp(r'DeepSeek', caseSensitive: false), '')
        .replaceAll(RegExp(r'\bAI\b', caseSensitive: false), '')
        .replaceAll(RegExp(r'仅供参考', caseSensitive: false), '')
        .replaceAll(RegExp(r'，仅供娱乐参考。', caseSensitive: false), '')
        .replaceAll(RegExp(r'人工智能', caseSensitive: false), '科技');
  }

  // ==================== 用户认证相关API ====================

  /// 用户登录
  Future<AuthResult> login(String username, String password) async {
    try {
      final response = await _client.post(
        Uri.parse('$_baseUrl/api/login'),
        headers: _headers,
        body: json.encode({'name': username, 'password': password}),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return AuthResult.fromJson(data);
      } else {
        throw ApiException('登录失败: ${response.statusCode}');
      }
    } catch (e) {
      throw ApiException('网络错误: $e');
    }
  }

  /// 用户注册
  Future<AuthResult> register(
    String username,
    String email,
    String password,
  ) async {
    try {
      final response = await _client.post(
        Uri.parse('$_baseUrl/api/register'),
        headers: _headers,
        body: json.encode({
          'username': username,
          'email': email,
          'password': password,
        }),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return AuthResult.fromJson(data);
      } else {
        // 解析错误响应
        String errorMessage = '注册失败';
        try {
          final errorData = json.decode(response.body);
          if (errorData['error'] != null) {
            errorMessage = errorData['error'];
          }
        } catch (e) {
          // 如果无法解析错误响应，使用默认消息
          errorMessage = '注册失败: ${response.statusCode}';
        }

        return AuthResult(success: false, message: errorMessage);
      }
    } catch (e) {
      return AuthResult(success: false, message: '网络错误: $e');
    }
  }

  /// Apple登录
  Future<AuthResult> appleSignIn(AppleCredential credential) async {
    try {
      final response = await _client.post(
        Uri.parse('$_baseUrl/api/apple-signin'),
        headers: _headers,
        body: json.encode({
          'appleId': credential.user,
          'email': credential.email,
          'name': credential.givenName != null && credential.familyName != null
              ? '${credential.givenName} ${credential.familyName}'
              : null,
          'identityToken': credential.identityToken,
        }),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return AuthResult.fromJson(data);
      } else {
        print('Apple登录失败 - 状态码: ${response.statusCode}');
        print('响应内容: ${response.body}');
        throw ApiException(
          'Apple登录失败: ${response.statusCode} - ${response.body}',
        );
      }
    } catch (e) {
      throw ApiException('网络错误: $e');
    }
  }

  /// 获取用户信息
  Future<User> getUserInfo(String token) async {
    try {
      final response = await _client.get(
        Uri.parse('$_baseUrl/api/user/profile'),
        headers: _authHeaders(token),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return User.fromJson(data);
      } else {
        throw ApiException('获取用户信息失败: ${response.statusCode}');
      }
    } catch (e) {
      throw ApiException('网络错误: $e');
    }
  }

  /// 获取用户余额
  Future<double> getUserBalance(String token) async {
    try {
      final response = await _client.get(
        Uri.parse('$_baseUrl/api/user/balance'),
        headers: _authHeaders(token),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return (data['balance'] ?? 0.0).toDouble();
      } else {
        throw ApiException('获取余额失败: ${response.statusCode}');
      }
    } catch (e) {
      throw ApiException('网络错误: $e');
    }
  }

  // ==================== 历史记录相关API ====================

  /// 获取用户历史记录
  Future<List<BaziRecord>> getHistory(
    String token, {
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final response = await _client.get(
        Uri.parse('$_baseUrl/api/history?page=$page&limit=$limit'),
        headers: _authHeaders(token),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final List<dynamic> records = data['records'] ?? [];
        return records.map((record) => BaziRecord.fromJson(record)).toList();
      } else {
        throw ApiException('获取历史记录失败: ${response.statusCode}');
      }
    } catch (e) {
      throw ApiException('网络错误: $e');
    }
  }

  /// 保存八字记录
  Future<String> saveBaziRecord(
    String token,
    BaziInput input,
    BaziResult result,
  ) async {
    try {
      final response = await _client.post(
        Uri.parse('$_baseUrl/api/save-record'),
        headers: _authHeaders(token),
        body: json.encode({
          'input': input.toJson(),
          'result': result.toJson(),
          'timestamp': DateTime.now().toIso8601String(),
        }),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['recordId'];
      } else {
        throw ApiException('保存记录失败: ${response.statusCode}');
      }
    } catch (e) {
      throw ApiException('网络错误: $e');
    }
  }

  /// 删除历史记录
  Future<void> deleteRecord(String token, String recordId) async {
    try {
      final response = await _client.delete(
        Uri.parse('$_baseUrl/api/record/$recordId'),
        headers: _authHeaders(token),
      );

      if (response.statusCode != 200) {
        throw ApiException('删除记录失败: ${response.statusCode}');
      }
    } catch (e) {
      throw ApiException('网络错误: $e');
    }
  }

  // ==================== 支付相关API ====================

  /// 创建支付订单
  Future<PaymentOrder> createPaymentOrder(
    String token,
    double amount,
    String paymentMethod,
  ) async {
    try {
      final response = await _client.post(
        Uri.parse('$_baseUrl/api/create-payment'),
        headers: _authHeaders(token),
        body: json.encode({'amount': amount, 'paymentMethod': paymentMethod}),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return PaymentOrder.fromJson(data);
      } else {
        throw ApiException('创建支付订单失败: ${response.statusCode}');
      }
    } catch (e) {
      throw ApiException('网络错误: $e');
    }
  }

  /// 验证支付结果
  Future<bool> verifyPayment(String token, String orderId) async {
    try {
      final response = await _client.post(
        Uri.parse('$_baseUrl/api/verify-payment'),
        headers: _authHeaders(token),
        body: json.encode({'orderId': orderId}),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['success'] ?? false;
      } else {
        return false;
      }
    } catch (e) {
      return false;
    }
  }

  // ==================== 工具方法 ====================

  /// 检查网络连接
  Future<bool> checkConnection() async {
    try {
      final response = await _client
          .get(Uri.parse('$_baseUrl/api/health'), headers: _headers)
          .timeout(const Duration(seconds: 5));

      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }

  /// 获取用户资料
  Future<Map<String, dynamic>> getUserProfile(String token) async {
    try {
      final response = await _client.get(
        Uri.parse('$_baseUrl/api/user/profile'),
        headers: _authHeaders(token),
      );

      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        throw ApiException('获取用户资料失败: ${response.statusCode}');
      }
    } catch (e) {
      throw ApiException('网络错误: $e');
    }
  }

  /// 更新用户资料
  Future<Map<String, dynamic>> updateUserProfile(
    String token,
    Map<String, dynamic> profileData,
  ) async {
    try {
      final response = await _client.put(
        Uri.parse('$_baseUrl/api/user/profile'),
        headers: _authHeaders(token),
        body: json.encode(profileData),
      );

      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        throw ApiException('更新用户资料失败: ${response.statusCode}');
      }
    } catch (e) {
      throw ApiException('网络错误: $e');
    }
  }

  /// 释放资源
  void dispose() {
    _client.close();
  }
}

/// API异常类
class ApiException implements Exception {
  final String message;

  ApiException(this.message);

  @override
  String toString() => 'ApiException: $message';
}

/// Apple登录凭证
class AppleCredential {
  final String user;
  final String? email;
  final String? givenName;
  final String? familyName;
  final String? identityToken;

  AppleCredential({
    required this.user,
    this.email,
    this.givenName,
    this.familyName,
    this.identityToken,
  });
}

/// 支付订单
class PaymentOrder {
  final String orderId;
  final double amount;
  final String paymentMethod;
  final String status;
  final DateTime createdAt;

  PaymentOrder({
    required this.orderId,
    required this.amount,
    required this.paymentMethod,
    required this.status,
    required this.createdAt,
  });

  factory PaymentOrder.fromJson(Map<String, dynamic> json) {
    return PaymentOrder(
      orderId: json['orderId'],
      amount: (json['amount'] ?? 0.0).toDouble(),
      paymentMethod: json['paymentMethod'],
      status: json['status'],
      createdAt: DateTime.parse(json['createdAt']),
    );
  }
}
