import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;

/// 流式DeepSeek API服务类
class StreamingDeepSeekService {
  static const String _baseUrl = 'https://api.deepseek.com';
  static const String _backendUrl = 'https://api.mybazi.net';

  // 缓存API密钥
  String? _cachedApiKey;
  DateTime? _keyExpireTime;
  static const Duration _keyValidDuration = Duration(hours: 1);

  /// 从后台获取API密钥（带缓存机制）
  Future<String> _getApiKey() async {
    if (_cachedApiKey != null &&
        _keyExpireTime != null &&
        DateTime.now().isBefore(_keyExpireTime!)) {
      return _cachedApiKey!;
    }

    try {
      final response = await http
          .get(
            Uri.parse('$_backendUrl/api/deepseek-key'),
            headers: {'Content-Type': 'application/json'},
          )
          .timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final apiKey = data['apiKey'] ?? '';

        _cachedApiKey = apiKey;
        _keyExpireTime = DateTime.now().add(_keyValidDuration);

        return apiKey;
      } else {
        throw HttpException('获取API密钥失败: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('无法连接到后台服务: $e');
    }
  }

  static final StreamingDeepSeekService _instance =
      StreamingDeepSeekService._internal();
  factory StreamingDeepSeekService() => _instance;
  StreamingDeepSeekService._internal();

  /// 流式调用DeepSeek API
  /// [onData] 回调函数，每次接收到新数据时调用
  /// [onComplete] 完成回调函数
  /// [onError] 错误回调函数
  Future<void> streamAnalysis({
    required String prompt,
    required Function(String chunk) onData,
    required Function(String fullText) onComplete,
    required Function(String error) onError,
  }) async {
    try {
      final apiKey = await _getApiKey();

      final headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $apiKey',
        'Accept': 'text/event-stream',
      };

      final optimizedPrompt = _optimizePrompt(prompt);

      final body = json.encode({
        'model': 'deepseek-chat',
        'messages': [
          {'role': 'system', 'content': '你是专业的命理师，请简洁专业地分析。'},
          {'role': 'user', 'content': optimizedPrompt},
        ],
        'max_tokens': 800,
        'temperature': 0.5,
        'stream': true, // 启用流式输出
      });

      final request =
          http.Request('POST', Uri.parse('$_baseUrl/chat/completions'))
            ..headers.addAll(headers)
            ..body = body;

      final streamedResponse = await request.send().timeout(
        const Duration(seconds: 60),
        onTimeout: () {
          throw HttpException('流式API响应超时');
        },
      );

      if (streamedResponse.statusCode != 200) {
        throw HttpException('API调用失败: ${streamedResponse.statusCode}');
      }

      String fullText = '';

      // 监听流式数据
      await for (final chunk in streamedResponse.stream.transform(
        utf8.decoder,
      )) {
        final lines = chunk.split('\n');

        for (final line in lines) {
          if (line.startsWith('data: ')) {
            final data = line.substring(6).trim();

            if (data == '[DONE]') {
              // 流式传输完成
              final cleanedText = _cleanResponse(fullText);
              onComplete(cleanedText);
              return;
            }

            try {
              final jsonData = json.decode(data);
              final delta = jsonData['choices']?[0]?['delta'];
              final content = delta?['content'];

              if (content != null && content.isNotEmpty) {
                fullText += content;
                // 实时回调新接收到的文本片段
                onData(content);
              }
            } catch (e) {
              // 忽略JSON解析错误，继续处理下一行
              continue;
            }
          }
        }
      }

      // 如果没有收到[DONE]信号，也要完成回调
      if (fullText.isNotEmpty) {
        final cleanedText = _cleanResponse(fullText);
        onComplete(cleanedText);
      }
    } catch (e) {
      onError('流式分析失败: ${e.toString()}');
    }
  }

  /// 优化提示词
  String _optimizePrompt(String prompt) {
    // 移除多余的空格和换行
    return prompt
        .replaceAll(RegExp(r'\s+'), ' ')
        .replaceAll(RegExp(r'请详细分析'), '请分析')
        .replaceAll(RegExp(r'详细解读'), '解读')
        .trim();
  }

  /// 清理响应内容
  String _cleanResponse(String content) {
    return content
        .replaceAll(RegExp(r'以上内容由.*?生成.*?仅供参考.*?'), '')
        .replaceAll(RegExp(r'.*?DeepSeek.*?生成.*?'), '')
        .replaceAll(RegExp(r'.*?AI.*?生成.*?'), '')
        .replaceAll(RegExp(r'仅供参考.*'), '')
        .replaceAll(RegExp(r'，仅供娱乐参考。'), '')
        .replaceAll(RegExp(r'.*?人工智能.*?'), '')
        .trim();
  }

  /// 非流式调用（兼容现有代码）
  Future<String> getAnalysis(String prompt) async {
    String result = '';

    await streamAnalysis(
      prompt: prompt,
      onData: (chunk) {
        // 在非流式模式下，我们只收集数据，不做实时显示
      },
      onComplete: (fullText) {
        result = fullText;
      },
      onError: (error) {
        throw Exception(error);
      },
    );

    return result;
  }

  /// 获取流式八字分析
  Future<Map<String, dynamic>> getStreamingAnalysis(
    Map<String, dynamic> baziData,
    String analysisType, {
    required Function(String) onStreamData,
  }) async {
    final prompt = _generateAnalysisPrompt(baziData, analysisType);
    String fullAnalysis = '';

    await streamAnalysis(
      prompt: prompt,
      onData: (chunk) {
        onStreamData(chunk);
      },
      onComplete: (fullText) {
        fullAnalysis = fullText;
      },
      onError: (error) {
        throw Exception(error);
      },
    );

    return {
      'analysis': fullAnalysis,
      'analysisType': analysisType,
      'timestamp': DateTime.now().toIso8601String(),
    };
  }

  /// 生成八字分析提示词
  String _generateAnalysisPrompt(
    Map<String, dynamic> baziData,
    String analysisType,
  ) {
    final String prompt;

    switch (analysisType) {
      case 'personality':
        prompt = '请根据八字${baziData['bazi']}分析此人的性格特点和个性特征。';
        break;
      case 'career':
        prompt = '请根据八字${baziData['bazi']}分析此人的事业运势和职业发展方向。';
        break;
      case 'wealth':
        prompt = '请根据八字${baziData['bazi']}分析此人的财运状况和理财建议。';
        break;
      case 'health':
        prompt = '请根据八字${baziData['bazi']}分析此人的健康状况和养生建议。';
        break;
      case 'marriage':
        prompt = '请根据八字${baziData['bazi']}分析此人的婚姻感情运势。';
        break;
      case 'study':
        prompt = '请根据八字${baziData['bazi']}分析此人的学业运势和学习能力。';
        break;
      case 'luck':
        prompt = '请根据八字${baziData['bazi']}分析此人的整体运势走向。';
        break;
      case 'mingge':
        prompt = '请根据八字${baziData['bazi']}分析此人的命格特点和人生格局。';
        break;
      case 'comprehensive':
        prompt = '请根据八字${baziData['bazi']}进行全面的命理分析。';
        break;
      default:
        prompt = '请根据八字${baziData['bazi']}进行命理分析。';
    }

    return prompt;
  }
}
