import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import '../models/liuyao_models.dart';

/// DeepSeek API服务类
class DeepSeekService {
  static const String _baseUrl = 'https://api.deepseek.com';
  static const String _backendUrl = 'https://api.mybazi.net'; // 外网生产地址

  // 缓存API密钥，避免重复获取
  String? _cachedApiKey;
  DateTime? _keyExpireTime;
  static const Duration _keyValidDuration = Duration(hours: 1); // 密钥缓存1小时

  /// 从后台获取API密钥（带缓存机制）
  Future<String> _getApiKey() async {
    // 检查缓存是否有效
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
          .timeout(const Duration(seconds: 10)); // 添加超时限制

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final apiKey = data['apiKey'] ?? '';

        // 缓存密钥和过期时间
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

  static final DeepSeekService _instance = DeepSeekService._internal();
  factory DeepSeekService() => _instance;
  DeepSeekService._internal();

  /// 优化提示词，减少不必要的内容以提高响应速度
  String _optimizePrompt(String originalPrompt) {
    // 移除冗余的描述性文字，保留核心信息
    String optimized = originalPrompt
        .replaceAll(RegExp(r'你是一位精通.*?请根据以下信息.*?：'), '')
        .replaceAll(RegExp(r'请从以下几个方面进行深度分析：.*'), '')
        .replaceAll(RegExp(r'请用专业而易懂的语言.*'), '')
        .replaceAll(RegExp(r'字数控制在.*'), '')
        .trim();

    // 如果优化后的提示词太短，返回原始提示词的简化版本
    if (optimized.length < 100) {
      return originalPrompt.length > 800
          ? originalPrompt.substring(0, 800)
          : originalPrompt;
    }

    // 限制最大长度为800字符
    return optimized.length > 800 ? optimized.substring(0, 800) : optimized;
  }

  /// 获取深度卦象分析 - 流式输出版本
  Future<String> getDeepAnalysis({
    required String question,
    required Hexagram originalHexagram,
    Hexagram? changedHexagram,
    required List<int> changingLines,
    required List<Yao> yaos,
    Function(String)? onStreamData,
  }) async {
    try {
      final prompt = _buildAnalysisPrompt(
        question: question,
        originalHexagram: originalHexagram,
        changedHexagram: changedHexagram,
        changingLines: changingLines,
        yaos: yaos,
      );

      final response = await _callDeepSeekAPI(
        prompt,
        onStreamData: onStreamData,
      );
      return response;
    } catch (e) {
      // 如果API调用失败，返回基础分析
      final fallbackAnalysis = _getFallbackAnalysis(
        originalHexagram,
        changingLines,
        question,
      );
      // 如果有流式回调，模拟流式输出
      if (onStreamData != null) {
        _simulateStreamOutput(fallbackAnalysis, onStreamData);
      }
      return fallbackAnalysis;
    }
  }

  /// 构建分析提示词
  String _buildAnalysisPrompt({
    required String question,
    required Hexagram originalHexagram,
    Hexagram? changedHexagram,
    required List<int> changingLines,
    required List<Yao> yaos,
  }) {
    final prompt = StringBuffer();

    prompt.writeln('你是一位精通六爻占卜的大师，请根据以下信息为用户提供专业的卦象分析：');
    prompt.writeln();
    prompt.writeln('占卜问题：$question');
    prompt.writeln();

    // 本卦信息
    prompt.writeln('本卦：${originalHexagram.fullName}');
    prompt.writeln('卦辞：${originalHexagram.description}');
    prompt.writeln('象辞：${originalHexagram.image}');
    prompt.writeln(
      '上卦：${originalHexagram.upperTrigram.name}（${originalHexagram.upperTrigram.attribute}）',
    );
    prompt.writeln(
      '下卦：${originalHexagram.lowerTrigram.name}（${originalHexagram.lowerTrigram.attribute}）',
    );
    prompt.writeln();

    // 爻象信息
    prompt.writeln('六爻详情：');
    for (int i = 5; i >= 0; i--) {
      final yao = yaos[i];
      final yaoName = ['初爻', '二爻', '三爻', '四爻', '五爻', '上爻'][i];
      final isChanging = yao.type.isChanging ? '（动爻）' : '';
      prompt.writeln(
        '$yaoName：${yao.type.name} ${yao.type.symbol} $isChanging',
      );
      if (i < originalHexagram.yaoTexts.length) {
        prompt.writeln('  爻辞：${originalHexagram.yaoTexts[i]}');
      }
    }
    prompt.writeln();

    // 变卦信息
    if (changedHexagram != null && changingLines.isNotEmpty) {
      prompt.writeln('变卦：${changedHexagram.fullName}');
      prompt.writeln('变卦卦辞：${changedHexagram.description}');
      final yaoNames = ['初爻', '二爻', '三爻', '四爻', '五爻', '上爻'];
      prompt.writeln(
        '动爻位置：${changingLines.where((i) => i >= 0 && i < yaoNames.length).map((i) => yaoNames[i]).join('、')}',
      );
      prompt.writeln();
    }

    prompt.writeln('请从以下几个方面进行深度分析：');
    prompt.writeln('1. 卦象整体含义和象征');
    prompt.writeln('2. 针对具体问题的解答');
    prompt.writeln('3. 动爻的特殊意义（如有）');
    prompt.writeln('4. 时机和趋势分析');
    prompt.writeln('5. 具体的行动建议');
    prompt.writeln('6. 需要注意的事项');
    prompt.writeln();
    prompt.writeln('请用专业而易懂的语言，结合传统六爻理论，给出详细的分析。字数控制在500-800字之间。');

    return prompt.toString();
  }

  /// 调用DeepSeek API（优化版本）
  Future<String> _callDeepSeekAPI(
    String prompt, {
    Function(String)? onStreamData,
  }) async {
    final apiKey = await _getApiKey();

    final headers = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $apiKey',
    };

    // 优化提示词长度，减少不必要的内容
    final optimizedPrompt = _optimizePrompt(prompt);

    final body = json.encode({
      'model': 'deepseek-chat',
      'messages': [
        {'role': 'system', 'content': '你是六爻占卜大师，请简洁专业地分析卦象。'},
        {'role': 'user', 'content': optimizedPrompt},
      ],
      'max_tokens': 600, // 减少token数量，提高响应速度
      'temperature': 0.5, // 降低随机性，提高一致性和速度
      'stream': onStreamData != null, // 根据是否有回调决定是否启用流式
    });

    if (onStreamData != null) {
      // 流式调用
      return await _callStreamingAPI(headers, body, onStreamData);
    } else {
      // 非流式调用（保持兼容性）
      final response = await http
          .post(
            Uri.parse('$_baseUrl/chat/completions'),
            headers: headers,
            body: body,
          )
          .timeout(
            const Duration(seconds: 45), // 优化超时时间
            onTimeout: () {
              throw HttpException('DeepSeek API响应超时，请稍后重试');
            },
          );

      return _processNonStreamResponse(response);
    }
  }

  /// 处理非流式响应
  String _processNonStreamResponse(http.Response response) {
    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      final content = data['choices'][0]['message']['content'];

      if (content != null) {
        // 清理免责声明和AI相关文字
        String cleaned = content
            .replaceAll(RegExp(r'以上内容由.*?生成.*?仅供参考.*?'), '')
            .replaceAll(RegExp(r'.*?DeepSeek.*?生成.*?'), '')
            .replaceAll(RegExp(r'.*?AI.*?生成.*?'), '')
            .replaceAll(RegExp(r'仅供参考.*'), '')
            .replaceAll(RegExp(r'，仅供娱乐参考。'), '')
            .replaceAll(RegExp(r'.*?人工智能.*?'), '')
            .trim();
        return cleaned.isNotEmpty ? cleaned : '分析生成失败，请稍后重试。';
      }

      return '分析生成失败，请稍后重试。';
    } else {
      throw HttpException('API调用失败: ${response.statusCode}');
    }
  }

  /// 流式API调用
  Future<String> _callStreamingAPI(
    Map<String, String> headers,
    String body,
    Function(String) onStreamData,
  ) async {
    final request = http.Request(
      'POST',
      Uri.parse('$_baseUrl/chat/completions'),
    );
    request.headers.addAll(headers);
    request.body = body;

    final streamedResponse = await request.send().timeout(
      const Duration(seconds: 120),
      onTimeout: () {
        throw HttpException('流式API响应超时');
      },
    );

    if (streamedResponse.statusCode != 200) {
      throw HttpException('流式API调用失败: ${streamedResponse.statusCode}');
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
              onStreamData(content);
            }
          } catch (e) {
            // 忽略JSON解析错误
            continue;
          }
        }
      }
    }

    // 清理结果中的DeepSeek相关文字
    String cleaned = fullContent
        .replaceAll(RegExp(r'以上内容由.*?生成.*?仅供参考.*?'), '')
        .replaceAll(RegExp(r'.*?DeepSeek.*?生成.*?'), '')
        .replaceAll(RegExp(r'.*?AI.*?生成.*?'), '')
        .replaceAll(RegExp(r'仅供参考.*'), '')
        .replaceAll(RegExp(r'，仅供娱乐参考。'), '')
        .replaceAll(RegExp(r'.*?人工智能.*?'), '')
        .trim();

    return cleaned.isNotEmpty ? cleaned : '分析生成失败，请稍后重试。';
  }

  /// 模拟流式输出
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

  /// 获取备用分析（当API调用失败时使用）
  String _getFallbackAnalysis(
    Hexagram hexagram,
    List<int> changingLines,
    String question,
  ) {
    final analysis = StringBuffer();

    analysis.writeln('【卦象分析】');
    analysis.writeln('本卦：${hexagram.fullName}');
    analysis.writeln(hexagram.description);
    analysis.writeln();

    analysis.writeln('【象辞解读】');
    analysis.writeln(hexagram.image);
    analysis.writeln();

    analysis.writeln('【针对问题的解答】');
    analysis.writeln('根据"$question"这个问题，结合${hexagram.fullName}的卦象特点：');

    // 根据卦象给出基础分析
    switch (hexagram.name) {
      case '乾':
        analysis.writeln(
          '乾卦为纯阳之卦，象征天道刚健。对于您的问题，显示出强烈的主动性和创造力。此时正是发挥个人能力、积极进取的好时机。但需注意刚过易折，要在坚持中保持适度的灵活性。',
        );
        break;
      case '坤':
        analysis.writeln(
          '坤卦为纯阴之卦，象征大地的包容与承载。对于您的问题，建议以柔顺、包容的态度来处理。顺应自然规律，厚德载物，通过坚持和耐心来获得成功。',
        );
        break;
      case '既济':
        analysis.writeln(
          '既济卦表示事情已经达到一个相对完美的状态，但正因为如此，更需要保持警觉。成功之后要居安思危，防止因为得意而导致失败。',
        );
        break;
      default:
        analysis.writeln(
          '此卦显示事情正处于发展变化之中，需要根据具体情况灵活应对。上卦${hexagram.upperTrigram.name}代表外在环境，下卦${hexagram.lowerTrigram.name}代表内在状态，两者的结合为您指明了方向。',
        );
    }
    analysis.writeln();

    if (changingLines.isNotEmpty) {
      analysis.writeln('【动爻分析】');
      analysis.writeln('本卦有${changingLines.length}个动爻，表示事情正在发生变化：');
      for (final line in changingLines) {
        final yaoNames = ['初爻', '二爻', '三爻', '四爻', '五爻', '上爻'];
        analysis.writeln('${yaoNames[line]}发动：${hexagram.yaoTexts[line]}');
      }
      analysis.writeln('动爻提示您要抓住变化的机遇，适时调整策略。');
      analysis.writeln();
    }

    analysis.writeln('【行动建议】');
    analysis.writeln('1. 保持内心的平静和清醒，不被外界干扰');
    analysis.writeln('2. 根据卦象指示，选择合适的时机行动');
    analysis.writeln('3. 注意内外环境的协调，做到知己知彼');
    analysis.writeln('4. 保持谦逊和学习的态度，持续改进');

    return analysis.toString();
  }

  /// 获取卦象的吉凶判断
  String getFortuneJudgment(Hexagram hexagram, List<int> changingLines) {
    // 简化的吉凶判断逻辑
    final upperElement = hexagram.upperTrigram.element;
    final lowerElement = hexagram.lowerTrigram.element;

    if (_isElementsHarmonious(upperElement, lowerElement)) {
      if (changingLines.isEmpty) {
        return '吉：卦象和谐稳定，利于发展';
      } else if (changingLines.length <= 2) {
        return '中吉：有变化但总体向好';
      } else {
        return '平：变化较多，需谨慎应对';
      }
    } else {
      if (changingLines.isEmpty) {
        return '平：需要调和内外矛盾';
      } else {
        return '凶：变化中有阻碍，需化解';
      }
    }
  }

  bool _isElementsHarmonious(String element1, String element2) {
    // 五行相生相克的简化判断
    const harmony = {
      '木': ['水', '火'],
      '火': ['木', '土'],
      '土': ['火', '金'],
      '金': ['土', '水'],
      '水': ['金', '木'],
    };

    return (harmony[element1]?.contains(element2) ?? false) ||
        (harmony[element2]?.contains(element1) ?? false);
  }

  /// 获取时间建议
  String getTimingAdvice(Hexagram hexagram, List<int> changingLines) {
    if (changingLines.isEmpty) {
      return '当前时机稳定，可按既定计划进行，不宜急躁冒进。';
    } else if (changingLines.length == 1) {
      return '正值变化之时，是采取行动的好时机，但要把握分寸。';
    } else if (changingLines.length <= 3) {
      return '变化较多，建议分步骤进行，不宜一次性大动作。';
    } else {
      return '变化剧烈，建议暂缓行动，等待时机明朗后再做决定。';
    }
  }
}
