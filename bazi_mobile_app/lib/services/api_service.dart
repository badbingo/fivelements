import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/bazi_model.dart';

class ApiService {
  static const String baseUrl = 'https://api.mybazi.net'; // 外网生产地址

  // 用户认证相关
  static Future<Map<String, dynamic>> login(
    String username,
    String password,
  ) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/login'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'username': username, 'password': password}),
      );

      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        throw Exception('登录失败: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('网络错误: $e');
    }
  }

  static Future<Map<String, dynamic>> register(
    String username,
    String email,
    String password,
  ) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/register'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'username': username,
          'email': email,
          'password': password,
        }),
      );

      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        throw Exception('注册失败: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('网络错误: $e');
    }
  }

  // 获取用户余额
  static Future<double> getUserBalance(String token) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/user/balance'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return (data['balance'] ?? 0.0).toDouble();
      } else {
        throw Exception('获取余额失败: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('网络错误: $e');
    }
  }

  // 扣费接口
  static Future<Map<String, dynamic>> deductBalance(
    String token,
    double amount,
    String description,
  ) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/user/deduct'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: json.encode({'amount': amount, 'description': description}),
      );

      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        throw Exception('扣费失败: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('网络错误: $e');
    }
  }

  // 八字计算相关
  static Future<WealthAnalysis> calculateWealth(BaziModel bazi) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/calculate/wealth'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode(bazi.toJson()),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return WealthAnalysis.fromJson(data);
      } else {
        throw Exception('财富计算失败: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('网络错误: $e');
    }
  }

  // 支付相关
  static Future<Map<String, dynamic>> createPaymentOrder(
    String token,
    double amount,
    String type,
  ) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/payment/create'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: json.encode({'amount': amount, 'type': type}),
      );

      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        throw Exception('创建支付订单失败: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('网络错误: $e');
    }
  }

  static Future<Map<String, dynamic>> verifyPayment(String orderId) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/payment/verify/$orderId'),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        throw Exception('支付验证失败: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('网络错误: $e');
    }
  }

  // 充值相关API
  static Future<Map<String, dynamic>> createRechargeOrder(
    String token,
    double amount,
  ) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/recharge/orders'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: json.encode({'amount': amount}),
      );

      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        throw Exception('创建充值订单失败: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('网络错误: $e');
    }
  }

  static Future<Map<String, dynamic>> verifyRecharge(
    String token,
    String orderId,
  ) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/recharge/verify'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: json.encode({'orderId': orderId}),
      );

      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        throw Exception('充值验证失败: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('网络错误: $e');
    }
  }

  // 模拟充值成功（用于测试）
  static Future<Map<String, dynamic>> simulateRecharge(
    String token,
    double amount,
  ) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/recharge/simulate'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: json.encode({'amount': amount}),
      );

      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        throw Exception('模拟充值失败: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('网络错误: $e');
    }
  }

  // 保存解锁记录到服务器
  static Future<void> saveUnlockRecord(
    String token,
    String baziHash,
    String feature,
  ) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/user/unlock-record'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: json.encode({
          'baziHash': baziHash,
          'feature': feature,
          'unlockedAt': DateTime.now().toIso8601String(),
        }),
      );

      if (response.statusCode != 200) {
        throw Exception('保存解锁记录失败: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('网络错误: $e');
    }
  }
}
