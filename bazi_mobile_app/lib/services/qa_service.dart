import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import '../utils/shared_preferences_helper.dart';

/// 问答服务类
class QAService {
  static const String _baseUrl = 'https://api.mybazi.net';

  /// 获取问答回答（流式输出）
  static Future<String> getAnswer({
    required String question,
    required Map<String, dynamic> baziData,
    required Function(String) onStreamData,
    String? userToken, // 添加用户token参数
  }) async {
    final token = userToken; // 直接使用传入的token

    final request = http.Request('POST', Uri.parse('$_baseUrl/api/qa'));

    request.headers.addAll({
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
      if (token != null) 'Authorization': 'Bearer $token',
    });

    // 构建请求数据，包含用户问题和八字信息
    final requestData = {
      'question': question, // 用户问题
      'baziData': baziData, // 完整的八字数据
    };

    request.body = jsonEncode(requestData);

    try {
      print('🚀 开始发送问答请求到: $_baseUrl/api/qa');
      print('📝 请求数据: ${request.body}');

      final streamedResponse = await request.send().timeout(
        const Duration(seconds: 120),
        onTimeout: () {
          throw Exception('流式API响应超时');
        },
      );

      print('📡 收到响应状态码: ${streamedResponse.statusCode}');
      if (streamedResponse.statusCode != 200) {
        print('❌ 流式API调用失败: ${streamedResponse.statusCode}');
        if (streamedResponse.statusCode == 401) {
          return '用户认证失败，请重新登录后再试。';
        } else if (streamedResponse.statusCode == 403) {
          return '今日免费问答次数已用完，请明天再试或购买更多次数。';
        } else {
          return '抱歉，当前服务繁忙，请稍后再试。';
        }
      }

      String fullContent = '';
      print('📥 开始接收流式数据...');

      await for (final chunk in streamedResponse.stream.transform(
        utf8.decoder,
      )) {
        print('📦 收到数据块: $chunk');
        final lines = chunk.split('\n');

        for (final line in lines) {
          if (line.startsWith('data: ')) {
            final data = line.substring(6).trim();
            print('📄 处理数据行: $data');

            if (data == '[DONE]') {
              print('✅ 流式数据接收完成');
              break;
            }

            try {
              final jsonData = jsonDecode(data);
              final delta = jsonData['choices']?[0]?['delta'];
              final content = delta?['content'];

              if (content != null && content.isNotEmpty) {
                print('💬 收到内容: $content');
                fullContent += content;
                print('🔄 准备调用onStreamData回调，内容: $content');
                print('🔍 onStreamData函数类型: ${onStreamData.runtimeType}');
                onStreamData(content);
                print('✅ onStreamData回调已调用');
              }
            } catch (e) {
              print('⚠️ JSON解析错误: $e, 数据: $data');
              continue;
            }
          }
        }
      }

      print('📝 完整内容长度: ${fullContent.length}');

      // 清理结果中的AI相关文字
      final cleanedContent = _cleanAnalysisText(fullContent);

      return _prepareMarkdownContent(
        cleanedContent.isNotEmpty ? cleanedContent : '抱歉，未能获取到有效回答，请重新提问。',
      );
    } catch (e) {
      print('❌ 流式API调用失败: $e');
      print('❌ 错误类型: ${e.runtimeType}');
      return '抱歉，网络连接异常，请检查网络后重试。错误：$e';
    }
  }

  /// 准备Markdown内容（参考财富分析的处理方式）
  static String _prepareMarkdownContent(String content) {
    if (content.isEmpty) return content;

    // 移除可能的乱码符号
    String cleanContent = content
        .replaceAll(RegExp(r'[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]'), '')
        .replaceAll(RegExp(r'[^\x20-\x7E\u4e00-\u9fff\n\r\t]'), '')
        .trim();

    // 处理中文数字标题
    cleanContent = cleanContent.replaceAllMapped(
      RegExp(r'^([一二三四五六七八九十]+[、.]\s*)(.+)', multiLine: true),
      (match) => '## ${match.group(2)}',
    );

    // 处理数字标题
    cleanContent = cleanContent.replaceAllMapped(
      RegExp(r'^(\d+[、.]\s*)(.+)', multiLine: true),
      (match) => '### ${match.group(2)}',
    );

    // 处理列表项
    cleanContent = cleanContent.replaceAllMapped(
      RegExp(r'^[-•]\s*(.+)', multiLine: true),
      (match) => '- ${match.group(1)}',
    );

    // 确保段落之间有适当的间距
    cleanContent = cleanContent.replaceAll(RegExp(r'\n{3,}'), '\n\n');

    // Markdown内容预处理
    return cleanContent
        .replaceAll('\n\n', '\n')
        .replaceAll(RegExp(r'^\s+', multiLine: true), '')
        .trim();
  }

  /// 清理分析文本
  static String _cleanAnalysisText(String text) {
    return text
        .replaceAll(RegExp(r'以上内容由.*?生成.*?仅供参考', caseSensitive: false), '')
        .replaceAll(RegExp(r'DeepSeek', caseSensitive: false), '')
        .replaceAll(RegExp(r'\bAI\b', caseSensitive: false), '')
        .replaceAll(RegExp(r'仅供参考', caseSensitive: false), '')
        .replaceAll(RegExp(r'，仅供娱乐参考。', caseSensitive: false), '')
        .replaceAll(RegExp(r'人工智能', caseSensitive: false), '科技');
  }

  /// 获取问答历史（本地缓存）
  static Future<List<Map<String, dynamic>>> getQAHistory() async {
    try {
      // 这里可以从本地存储或服务器获取历史记录
      // 暂时返回空列表
      return [];
    } catch (e) {
      print('获取问答历史失败: $e');
      return [];
    }
  }

  /// 保存问答记录（本地缓存）
  static Future<void> saveQARecord({
    required String question,
    required String answer,
  }) async {
    try {
      // 这里可以保存到本地存储或服务器
      print('保存问答记录: $question');
    } catch (e) {
      print('保存问答记录失败: $e');
    }
  }

  /// 检查每日问答次数
  static Future<int> getDailyQuestionCount() async {
    try {
      final token = await SharedPreferencesHelper.getToken();
      print('🔍 QA Service - 获取问答次数，token: ${token?.substring(0, 20)}...');
      
      if (token == null) {
        print('🔍 QA Service - 未登录，使用本地存储');
        final localCount = await SharedPreferencesHelper.getDailyQuestionCount();
        print('🔍 QA Service - 本地存储次数: $localCount');
        return localCount;
      }

      print('🔍 QA Service - 调用API: $_baseUrl/api/user/daily-usage');
      final response = await http.get(
        Uri.parse('$_baseUrl/api/user/daily-usage'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      print('🔍 QA Service - API响应状态: ${response.statusCode}');
      print('🔍 QA Service - API响应内容: ${response.body}');

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final count = data['dailyUsageCount'] ?? 0;
        print('🔍 QA Service - 服务器返回次数: $count');
        return count;
      } else {
        print('🔍 QA Service - API失败，回退到本地存储');
        final localCount = await SharedPreferencesHelper.getDailyQuestionCount();
        print('🔍 QA Service - 本地存储次数: $localCount');
        return localCount;
      }
    } catch (e) {
      print('🔍 QA Service - 获取每日问答次数失败: $e');
      final localCount = await SharedPreferencesHelper.getDailyQuestionCount();
      print('🔍 QA Service - 异常时本地存储次数: $localCount');
      return localCount;
    }
  }

  /// 更新每日问答次数
  static Future<void> updateDailyQuestionCount(int count) async {
    try {
      final token = await SharedPreferencesHelper.getToken();
      if (token == null) {
        // 未登录用户使用本地存储
        await SharedPreferencesHelper.saveDailyQuestionCount(count);
        return;
      }

      final response = await http.post(
        Uri.parse('$_baseUrl/api/user/update-daily-usage'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: json.encode({'dailyUsageCount': count}),
      );

      if (response.statusCode != 200) {
        // API失败时回退到本地存储
        await SharedPreferencesHelper.saveDailyQuestionCount(count);
      }
    } catch (e) {
      print('更新每日问答次数失败: $e');
      // 出错时回退到本地存储
      await SharedPreferencesHelper.saveDailyQuestionCount(count);
    }
  }

  /// 检查用户余额
  static Future<double> getUserBalance() async {
    try {
      final token = await SharedPreferencesHelper.getToken();
      if (token == null) return 0.0;

      final response = await http.get(
        Uri.parse('$_baseUrl/api/user/balance'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return (data['balance'] ?? 0.0).toDouble();
      }
      return 0.0;
    } catch (e) {
      print('获取用户余额失败: $e');
      return 0.0;
    }
  }

  /// 处理问答付费（扣费1美元）
  static Future<bool> processQuestionPayment() async {
    try {
      final token = await SharedPreferencesHelper.getToken();
      if (token == null) return false;

      // 检查余额是否足够
      final balance = await getUserBalance();
      if (balance < 1.0) {
        return false; // 余额不足
      }

      // 购买问答包
      final response = await http.post(
        Uri.parse('$_baseUrl/api/user/purchase-qa-package'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: json.encode({
          'packageType': 'standard', // 标准包：10个问题1美元
        }),
      );

      return response.statusCode == 200;
    } catch (e) {
      print('问答付费处理失败: $e');
      return false;
    }
  }

  /// 购买问答包（10个问题1美元）
  static Future<bool> purchaseQuestionPackage() async {
    try {
      final success = await processQuestionPayment();
      if (success) {
        // 重置每日问答次数，给用户10次新的机会
        await updateDailyQuestionCount(0);
        return true;
      }
      return false;
    } catch (e) {
      print('购买问答包失败: $e');
      return false;
    }
  }
}
