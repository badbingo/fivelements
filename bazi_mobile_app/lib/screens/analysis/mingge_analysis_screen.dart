import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:http/http.dart' as http;
import '../../models/bazi_models.dart';
import '../../services/mingge_analysis_service.dart';
import '../../services/deepseek_cache_service.dart';
import '../../services/share_service.dart';
import '../../services/strength_analysis_service.dart';

class MinggeAnalysisScreen extends StatefulWidget {
  final BaziInput input;
  final BaziResult result;

  const MinggeAnalysisScreen({
    super.key,
    required this.input,
    required this.result,
  });

  @override
  State<MinggeAnalysisScreen> createState() => _MinggeAnalysisScreenState();
}

class _MinggeAnalysisScreenState extends State<MinggeAnalysisScreen> {
  late Map<String, dynamic> minggeAnalysis;
  bool _isLoading = true;
  bool _isLoadingAdvice = false;
  late Map<String, String> _pillars;

  @override
  void initState() {
    super.initState();
    _calculateMinggeLevel();
  }

  Future<void> _calculateMinggeLevel() async {
    setState(() {
      _isLoading = true;
    });

    try {
      // 从result.paipan中提取天干地支信息
      List<String> stems = [
        widget.result.paipan.yearPillar.isNotEmpty
            ? widget.result.paipan.yearPillar[0]
            : '甲',
        widget.result.paipan.monthPillar.isNotEmpty
            ? widget.result.paipan.monthPillar[0]
            : '甲',
        widget.result.paipan.dayPillar.isNotEmpty
            ? widget.result.paipan.dayPillar[0]
            : '甲',
        widget.result.paipan.hourPillar.isNotEmpty
            ? widget.result.paipan.hourPillar[0]
            : '甲',
      ];

      List<String> branches = [
        widget.result.paipan.yearPillar.length > 1
            ? widget.result.paipan.yearPillar[1]
            : '子',
        widget.result.paipan.monthPillar.length > 1
            ? widget.result.paipan.monthPillar[1]
            : '子',
        widget.result.paipan.dayPillar.length > 1
            ? widget.result.paipan.dayPillar[1]
            : '子',
        widget.result.paipan.hourPillar.length > 1
            ? widget.result.paipan.hourPillar[1]
            : '子',
      ];

      // 计算命格等级
      _pillars = {
        'year': '${stems[0]}${branches[0]}',
        'month': '${stems[1]}${branches[1]}',
        'day': '${stems[2]}${branches[2]}',
        'hour': '${stems[3]}${branches[3]}',
      };

      minggeAnalysis = MinggeAnalysisService.analyzeMingge(_pillars);
    } catch (e) {
      print('命格分析计算失败: $e');
      // 设置默认值以防止错误
      minggeAnalysis = {
        'score': 0.0,
        'level': '未知',
        'description': '计算失败，请稍后重试',
        'breakdown': {},
      };
    }

    setState(() {
      _isLoading = false;
    });
  }

  Future<void> _getMinggeAdvice() async {
    setState(() {
      _isLoadingAdvice = true;
      // 清空之前的建议内容，准备接收流式数据
      minggeAnalysis = {...minggeAnalysis, 'advice': ''};
    });

    try {
      // 构建完整的命主信息
      final fullBaziData = _buildFullBaziData();

      // 调用API获取命格总体分析 - 使用流式输出
      final advice = await _getMinggeAdviceFromAPI(
        fullBaziData,
        minggeAnalysis['score'] as double,
        minggeAnalysis['level'] as String,
        onStreamData: (chunk) {
          if (mounted) {
            setState(() {
              final currentAdvice = minggeAnalysis['advice']?.toString() ?? '';
              final newContent = currentAdvice + chunk;
              // 对累积的完整内容进行实时清理
              final cleanedContent = _cleanStreamingContent(newContent);
              minggeAnalysis = {...minggeAnalysis, 'advice': cleanedContent};
            });
          }
        },
      );

      if (mounted) {
        setState(() {
          minggeAnalysis = {...minggeAnalysis, 'advice': advice};
        });
      }
    } catch (e) {
      print('获取命格总体分析失败: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('获取命格总体分析失败，请稍后重试'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }

    if (mounted) {
      setState(() {
        _isLoadingAdvice = false;
      });
    }
  }

  // 构建完整的命主信息
  Map<String, dynamic> _buildFullBaziData() {
    return {
      'name': widget.input.name,
      'gender': widget.input.gender,
      'birthDate':
          '${widget.input.birthDate.year}年${widget.input.birthDate.month}月${widget.input.birthDate.day}日 ${widget.input.birthTime}',
      'birthPlace': widget.input.birthPlace ?? '未知',
      'luckStartingTime': widget.result.luckStartingTime ?? '未知',
      'currentDayun': widget.result.currentDayun ?? '未知',
      'strengthType':
          widget.result.strengthAnalysis?.original.strengthType ?? '未知',
      'pillars': _pillars,
      'dayMaster': widget.result.paipan.dayPillar.isNotEmpty
          ? widget.result.paipan.dayPillar[0]
          : '未知',
      'strengthAnalysis': {
        'original': {
          'strengthType':
              widget.result.strengthAnalysis?.original.strengthType ?? '未知',
          'strengthPercentage':
              widget.result.strengthAnalysis?.original.strengthPercentage ??
              0.0,
          'levelDescription':
              widget.result.strengthAnalysis?.original.levelDescription ?? '未知',
          'supportStrength':
              widget.result.strengthAnalysis?.original.supportStrength ?? 0,
          'weakenStrength':
              widget.result.strengthAnalysis?.original.weakenStrength ?? 0,
          'monthScore':
              widget.result.strengthAnalysis?.original.monthScore ?? 0,
        },
      },
      'wuxing': widget.result.wuxing,
      'dayun': widget.result.dayun,
      'liunian': widget.result.liunian,
      'minggeScore': minggeAnalysis['score'],
      'minggeLevel': minggeAnalysis['level'],
    };
  }

  // 调用API获取命格总体分析 - 流式输出版本
  Future<String> _getMinggeAdviceFromAPI(
    Map<String, dynamic> fullBaziData,
    double score,
    String level, {
    Function(String)? onStreamData,
  }) async {
    final cacheService = DeepSeekCacheService();

    try {
      // 首先检查缓存
      final cachedResult = await cacheService.getCachedMinggeAnalysis(
        fullBaziData,
      );
      if (cachedResult != null) {
        print('✅ 使用缓存的命格分析结果');
        // 如果有流式回调，模拟流式输出缓存内容
        if (onStreamData != null) {
          _simulateStreamOutput(cachedResult, onStreamData);
        }
        return cachedResult;
      }

      print('🔄 调用流式API获取命格分析结果');
      
      // 直接调用StrengthAnalysisService计算准确的身强身弱
      String accurateStrengthType = '未知';
      try {
        // 从pillars中提取天干地支
        final pillars = fullBaziData['pillars'] as Map<String, String>? ?? {};
        if (pillars.isNotEmpty) {
          final yearPillar = pillars['年柱'] ?? pillars['year'] ?? '';
          final monthPillar = pillars['月柱'] ?? pillars['month'] ?? '';
          final dayPillar = pillars['日柱'] ?? pillars['day'] ?? '';
          final hourPillar = pillars['时柱'] ?? pillars['hour'] ?? '';

          if (yearPillar.length >= 2 &&
              monthPillar.length >= 2 &&
              dayPillar.length >= 2 &&
              hourPillar.length >= 2) {
            final stems = [
              yearPillar[0],
              monthPillar[0],
              dayPillar[0],
              hourPillar[0],
            ];
            final branches = [
              yearPillar[1],
              monthPillar[1],
              dayPillar[1],
              hourPillar[1],
            ];

            final originalAnalysis =
                StrengthAnalysisService.calculateOriginalStrength(
                  stems,
                  branches,
                );
            accurateStrengthType = originalAnalysis.strengthType;
            print('✅ 使用StrengthAnalysisService计算的身强身弱: $accurateStrengthType');
          }
        }
      } catch (e) {
        print('⚠️ 计算身强身弱失败，使用原有数据: $e');
        accurateStrengthType = fullBaziData['strengthType'] ?? '未知';
      }
      
      // 构建完整的命主信息，参考财富分析的数据结构
      final baziData = {
        'name': fullBaziData['name'] ?? '未知',
        'gender': fullBaziData['gender'] ?? '未知',
        'birthDate': fullBaziData['birthDate'] ?? '未知',
        'birthPlace': fullBaziData['birthPlace'] ?? '未知',
        'lunarDate': fullBaziData['lunarDate'] ?? '未知',
        'zodiac': fullBaziData['zodiac'] ?? '未知',
        'constellation': fullBaziData['constellation'] ?? '未知',
        'luckStartingTime': fullBaziData['luckStartingTime'] ?? '未知',
        'currentDayun': fullBaziData['currentDayun'] ?? '未知',
        'strengthType': accurateStrengthType, // 使用准确计算的身强身弱结果
        'currentTime': DateTime.now().toIso8601String(),
        'currentYear': DateTime.now().year,
        'currentMonth': DateTime.now().month,
        'currentDay': DateTime.now().day,
        'paipan': {
          'yearPillar': fullBaziData['pillars']?['年柱'] ?? fullBaziData['pillars']?['year'] ?? '未知',
          'monthPillar': fullBaziData['pillars']?['月柱'] ?? fullBaziData['pillars']?['month'] ?? '未知',
          'dayPillar': fullBaziData['pillars']?['日柱'] ?? fullBaziData['pillars']?['day'] ?? '未知',
          'hourPillar': fullBaziData['pillars']?['时柱'] ?? fullBaziData['pillars']?['hour'] ?? '未知',
          'dayMaster': fullBaziData['dayMaster'] ?? '未知',
          'yearNayin': fullBaziData['yearNayin'] ?? '未知',
        },
        'strengthAnalysis': fullBaziData['strengthAnalysis'],
        'wuxing': fullBaziData['wuxing'],
        'dayun': fullBaziData['dayun'],
        'liunian': fullBaziData['liunian'],
        'minggeScore': score,
        'minggeLevel': level,
      };

      print('🔍 发送到API的数据: ${json.encode(baziData)}');

      // 调用流式DeepSeek API
      return await _getStreamingMinggeAnalysis(
        baziData,
        score,
        level,
        fullBaziData,
        cacheService,
        onStreamData,
      );
    } catch (e) {
      print('获取命格总体分析失败: $e');
      final defaultAnalysis = _getDefaultMinggeAnalysis(score, level);
      await cacheService.cacheMinggeAnalysis(fullBaziData, defaultAnalysis);
      return defaultAnalysis;
    }
  }

  // 流式API调用方法
  Future<String> _getStreamingMinggeAnalysis(
    Map<String, dynamic> baziData,
    double score,
    String level,
    Map<String, dynamic> fullBaziData,
    DeepSeekCacheService cacheService,
    Function(String)? onStreamData,
  ) async {
    try {
      final request = http.Request(
        'POST',
        Uri.parse('https://api.mybazi.net/api/detailed-analysis'),
      );
      request.headers.addAll({
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      });
      request.body = json.encode({
        'baziData': baziData,
        'analysisType': 'mingge',
      });

      final streamedResponse = await request.send();
      final completer = Completer<String>();
      final buffer = StringBuffer();

      if (streamedResponse.statusCode == 200) {
        streamedResponse.stream
            .transform(utf8.decoder)
            .transform(const LineSplitter())
            .listen(
              (line) {
                if (line.startsWith('data: ')) {
                  final data = line.substring(6);
                  if (data == '[DONE]') {
                    final fullContent = buffer.toString();
                    if (fullContent.isNotEmpty) {
                      cacheService.cacheMinggeAnalysis(
                        fullBaziData,
                        fullContent,
                      );
                      completer.complete(fullContent);
                    } else {
                      final defaultAnalysis = _getDefaultMinggeAnalysis(
                        score,
                        level,
                      );
                      cacheService.cacheMinggeAnalysis(
                        fullBaziData,
                        defaultAnalysis,
                      );
                      completer.complete(defaultAnalysis);
                    }
                    return;
                  }
                  try {
                    final jsonData = json.decode(data);
                    // 解析DeepSeek API的流式响应格式
                    final choices = jsonData['choices'] as List?;
                    if (choices != null && choices.isNotEmpty) {
                      final delta =
                          choices[0]['delta'] as Map<String, dynamic>?;
                      final content = delta?['content'] ?? '';
                      if (content.isNotEmpty) {
                        buffer.write(content);
                        onStreamData?.call(content);
                      }
                    }
                  } catch (e) {
                    print('解析流式数据失败: $e, 数据: $data');
                  }
                }
              },
              onError: (error) {
                print('流式数据接收错误: $error');
                final defaultAnalysis = _getDefaultMinggeAnalysis(score, level);
                completer.complete(defaultAnalysis);
              },
              onDone: () {
                if (!completer.isCompleted) {
                  final fullContent = buffer.toString();
                  if (fullContent.isNotEmpty) {
                    cacheService.cacheMinggeAnalysis(fullBaziData, fullContent);
                    completer.complete(fullContent);
                  } else {
                    final defaultAnalysis = _getDefaultMinggeAnalysis(
                      score,
                      level,
                    );
                    cacheService.cacheMinggeAnalysis(
                      fullBaziData,
                      defaultAnalysis,
                    );
                    completer.complete(defaultAnalysis);
                  }
                }
              },
            );
      } else {
        final defaultAnalysis = _getDefaultMinggeAnalysis(score, level);
        completer.complete(defaultAnalysis);
      }

      return await completer.future;
    } catch (e) {
      print('流式API调用失败: $e');
      final defaultAnalysis = _getDefaultMinggeAnalysis(score, level);
      return defaultAnalysis;
    }
  }

  // 模拟流式输出缓存内容
  void _simulateStreamOutput(String content, Function(String) onStreamData) {
    final words = content.split('');
    int index = 0;
    Timer.periodic(const Duration(milliseconds: 50), (timer) {
      if (index < words.length) {
        onStreamData(words[index]);
        index++;
      } else {
        timer.cancel();
      }
    });
  }

  // 简化的内容清理方法（与财富等级分析页面保持一致）
  String _cleanStreamingContent(String content) {
    return content
        .replaceAll(RegExp(r'以上内容由.*?生成.*?仅供参考', caseSensitive: false), '')
        .replaceAll(RegExp(r'DeepSeek', caseSensitive: false), '')
        .replaceAll(RegExp(r'\bAI\b', caseSensitive: false), '')
        .replaceAll(RegExp(r'仅供参考', caseSensitive: false), '')
        .replaceAll(RegExp(r'，仅供娱乐参考。', caseSensitive: false), '')
        .replaceAll(RegExp(r'人工智能', caseSensitive: false), '科技')
        .trim();
  }

  // 默认命格总体分析
  String _getDefaultMinggeAnalysis(double score, String level) {
    return '''
### 一、命主命格等级评分分析

您的命格等级为：$level（$score分）

${_getScoreAnalysis(score)}

### 二、命格总体特征分析

${_getPersonalityAnalysis(score)}

### 三、人生发展建议

${_getLifeAdvice(score)}
''';
  }

  String _getScoreAnalysis(double score) {
    if (score >= 90) {
      return '您的命格层次极高，天赋异禀，具有非凡的领导才能和创造力。命中贵人运强，容易得到他人帮助，一生富贵荣华，功成名就。';
    } else if (score >= 80) {
      return '您的命格优秀，才华出众，具备成功的基础条件。五行配置较为均衡，格局清晰，事业有成，财运亨通。';
    } else if (score >= 70) {
      return '您的命格良好，聪明能干，做事踏实稳重。虽然可能会遇到一些挑战，但总体运势向好，生活安稳，小有成就。';
    } else if (score >= 60) {
      return '您的命格平常，勤劳踏实，为人诚实可靠。通过自身努力可以获得稳定的生活，衣食无忧，家庭和睦。';
    } else if (score >= 50) {
      return '您的命格一般，人生会有起伏波折，但只要保持积极心态，努力奋斗，仍能过上平稳的生活。';
    } else {
      return '您的命格需要特别关注，人生可能会遇到较多挑战。建议多行善事，积累福德，通过不断努力来改善运势。';
    }
  }

  String _getPersonalityAnalysis(double score) {
    if (score >= 80) {
      return '性格特点：天生具有领导气质，思维敏捷，决断力强。为人大气，有远见，善于把握机遇。但需注意不要过于自信，要保持谦逊的态度。';
    } else if (score >= 60) {
      return '性格特点：为人稳重踏实，做事认真负责。具有一定的组织能力和执行力，人际关系良好。建议在稳中求进的同时，适当增强创新意识。';
    } else {
      return '性格特点：为人朴实，做事勤恳。虽然可能缺乏一些天赋优势，但胜在坚持不懈。建议多学习新知识，扩大视野，提升自身能力。';
    }
  }

  String _getLifeAdvice(double score) {
    if (score >= 80) {
      return '发展建议：您具备成功的天赋条件，建议在事业上积极进取，把握重大机遇。同时要注重品德修养，广结善缘，这样才能长久保持成功。';
    } else if (score >= 60) {
      return '发展建议：专注于自己的专业领域，持续学习提升。制定明确的目标，脚踏实地地工作，注重人际关系的建立，机会来临时要果断把握。';
    } else {
      return '发展建议：要有耐心和毅力，通过不断努力来改善运势。多学习新技能，扩大社交圈，保持积极乐观的心态。同时要谨慎行事，避免冲动决定。';
    }
  }

  /// 分享命格分析结果
  Future<void> _shareMinggeAnalysis() async {
    if (_isLoading) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('分析还在进行中，请稍后再试'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    // 获取分析内容
    final adviceData = minggeAnalysis['advice'];
    String analysisContent;

    if (adviceData != null && adviceData.toString().isNotEmpty) {
      analysisContent = adviceData.toString();
    } else {
      // 如果没有深度分析，使用默认分析内容
      analysisContent = _getDefaultMinggeAnalysis(
        minggeAnalysis['score'] as double,
        minggeAnalysis['level'] as String,
      );
    }

    await ShareService.shareMinggeAnalysis(
      context: context,
      name: widget.input.name,
      score: minggeAnalysis['score'] as double,
      level: minggeAnalysis['level'] as String,
      analysis: analysisContent,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      appBar: AppBar(
        title: Text('${widget.input.name}的命格等级'),
        backgroundColor: const Color(0xFF6B73FF),
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(
                valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF6B73FF)),
              ),
            )
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // 命格等级总览卡片
                  _buildMinggeOverviewCard(),
                  const SizedBox(height: 16),

                  // 评分构成详情卡片
                  _buildScoreDetailsCard(),
                  const SizedBox(height: 16),

                  // 基础模块评分卡片
                  _buildBaseModulesCard(),
                  const SizedBox(height: 16),

                  // 进阶与修正评分卡片
                  _buildAdvancedModulesCard(),
                  const SizedBox(height: 16),

                  // 格局与特效评分卡片
                  _buildSpecialPatternsCard(),
                  const SizedBox(height: 16),

                  // 命格总体分析卡片
                  _buildMinggeAdviceCard(),
                  const SizedBox(height: 24),
                ],
              ),
            ),
    );
  }

  Widget _buildMinggeOverviewCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF6B73FF), Color(0xFF9B59B6)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF6B73FF).withOpacity(0.3),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.star, color: Colors.white, size: 28),
              const SizedBox(width: 12),
              Text(
                '${widget.input.name}的命格等级',
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    '总分',
                    style: TextStyle(fontSize: 14, color: Colors.white70),
                  ),
                  Text(
                    '${minggeAnalysis['score']}分',
                    style: const TextStyle(
                      fontSize: 32,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                ],
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  const Text(
                    '等级',
                    style: TextStyle(fontSize: 14, color: Colors.white70),
                  ),
                  Text(
                    minggeAnalysis['level'] ?? '未知',
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.2),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              minggeAnalysis['description'] ?? '命格分析中...',
              style: const TextStyle(
                fontSize: 14,
                color: Colors.white,
                height: 1.4,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMinggeAdviceCard() {
    // 处理 advice 字段的类型，可能是 String 或 List<String>
    final adviceData = minggeAnalysis['advice'];
    String advice = '';

    if (adviceData is String) {
      advice = adviceData;
    } else if (adviceData is List<String>) {
      advice = adviceData.join('\n');
    } else if (adviceData is List) {
      advice = adviceData.map((e) => e.toString()).join('\n');
    }

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.lightbulb, color: Color(0xFF6B73FF), size: 24),
              SizedBox(width: 8),
              Text(
                '命格总体分析',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Colors.black87,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (advice.isNotEmpty)
            _buildAdviceContent(advice)
          else if (_isLoadingAdvice)
            const Row(
              children: [
                SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    valueColor: AlwaysStoppedAnimation<Color>(
                      Color(0xFF6B73FF),
                    ),
                  ),
                ),
                SizedBox(width: 12),
                Text(
                  '正在生成个性化命格总体分析...',
                  style: TextStyle(fontSize: 14, color: Colors.grey),
                ),
              ],
            )
          else
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  '点击下方按钮获取基于您八字的专业命格总体分析',
                  style: TextStyle(fontSize: 14, color: Colors.grey),
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _getMinggeAdvice,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF6B73FF),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    child: const Text(
                      '获取命格总体分析',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          // 如果有分析内容，显示分享按钮
          if (minggeAnalysis['advice'] != null &&
              minggeAnalysis['advice'].toString().isNotEmpty) ...[
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: _shareMinggeAnalysis,
                icon: const Icon(Icons.share, size: 18),
                label: const Text('分享命格分析'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.green.shade600,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildAdviceContent(String advice) {
    // 尝试解析三个板块的内容
    final sections = _parseAdviceSections(advice);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (sections['score_analysis']?.isNotEmpty == true)
          _buildAdviceSection(
            '命格等级评分分析',
            sections['score_analysis']!,
            Icons.assessment,
            const Color(0xFF3498db),
          ),
        if (sections['overall_analysis']?.isNotEmpty == true)
          _buildAdviceSection(
            '命格总体特征分析',
            sections['overall_analysis']!,
            Icons.psychology,
            const Color(0xFF27ae60),
          ),
        if (sections['life_advice']?.isNotEmpty == true)
          _buildAdviceSection(
            '人生发展建议',
            sections['life_advice']!,
            Icons.lightbulb,
            const Color(0xFFf39c12),
          ),
        // 如果无法解析出三个板块，则显示原始内容
        if (sections.values.every((v) => v?.isEmpty != false))
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.grey.shade50,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Colors.grey.shade200),
            ),
            child: _buildFormattedContent(_cleanAndFormatContent(advice)),
          ),
      ],
    );
  }

  Widget _buildAdviceSection(
    String title,
    String content,
    IconData icon,
    Color color,
  ) {
    // 清理和格式化内容
    final cleanedContent = _cleanAndFormatContent(content);

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withOpacity(0.05),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: color, size: 20),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  title,
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: color,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          _buildFormattedContent(cleanedContent),
        ],
      ),
    );
  }

  // 准备Markdown内容
  String _prepareMarkdownContent(String content) {
    // 使用与财富等级分析页面相同的简化清理方法
    String cleaned = _cleanStreamingContent(content);

    // 转换为标准Markdown格式
    // 将中文数字标题转换为Markdown标题
    cleaned = cleaned.replaceAll(
      RegExp(r'^([一二三四五六七八九十]+、.*)$', multiLine: true),
      r'## \1',
    );
    cleaned = cleaned.replaceAll(
      RegExp(r'^(\([一二三四五六七八九十]+\).*)$', multiLine: true),
      r'### \1',
    );

    // 确保列表项格式正确
    cleaned = cleaned.replaceAll(RegExp(r'^\s*[•·]\s*', multiLine: true), '- ');

    return cleaned.trim();
  }

  // 清理和格式化内容（保持兼容性）
  String _cleanAndFormatContent(String content) {
    return _prepareMarkdownContent(content);
  }

  // 构建格式化的内容
  Widget _buildFormattedContent(String content) {
    return MarkdownBody(
      data: content,
      selectable: true,
      styleSheet: MarkdownStyleSheet(
        h1: const TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.bold,
          color: Color(0xFF6366F1),
          height: 1.4,
        ),
        h2: const TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.bold,
          color: Color(0xFF6366F1),
          height: 1.4,
        ),
        h3: const TextStyle(
          fontSize: 15,
          fontWeight: FontWeight.w600,
          color: Color(0xFF6366F1),
          height: 1.4,
        ),
        p: const TextStyle(fontSize: 14, color: Colors.black87, height: 1.6),
        listBullet: const TextStyle(
          fontSize: 14,
          color: Colors.black87,
          height: 1.6,
        ),
        strong: const TextStyle(
          fontWeight: FontWeight.bold,
          color: Colors.black87,
        ),
        em: const TextStyle(fontStyle: FontStyle.italic, color: Colors.black87),
        blockquote: const TextStyle(
          fontSize: 14,
          color: Color(0xFF6B7280),
          fontStyle: FontStyle.italic,
        ),
        code: const TextStyle(
          fontSize: 13,
          fontFamily: 'monospace',
          backgroundColor: Color(0xFFF3F4F6),
        ),
        h1Padding: const EdgeInsets.only(top: 16, bottom: 8),
        h2Padding: const EdgeInsets.only(top: 16, bottom: 8),
        h3Padding: const EdgeInsets.only(top: 12, bottom: 6),
        pPadding: const EdgeInsets.only(bottom: 8),
        listIndent: 16,
        blockquotePadding: const EdgeInsets.all(12),
        codeblockPadding: const EdgeInsets.all(12),
      ),
    );
  }

  Map<String, String?> _parseAdviceSections(String advice) {
    final Map<String, String?> sections = {
      'score_analysis': null,
      'overall_analysis': null,
      'life_advice': null,
    };

    // 尝试按照标题分割内容
    final patterns = {
      'score_analysis': [r'一[、.]?\s*命格等级评分分析', r'命格等级评分分析', r'命格等级.*?分析'],
      'overall_analysis': [
        r'二[、.]?\s*命格总体特征分析',
        r'命格总体特征分析',
        r'命格.*?特征.*?分析',
        r'总体.*?命格.*?分析',
      ],
      'life_advice': [r'三[、.]?\s*人生发展建议', r'人生发展建议', r'人生.*?建议'],
    };

    for (final entry in patterns.entries) {
      final key = entry.key;
      final patternList = entry.value;

      for (final pattern in patternList) {
        final regex = RegExp(pattern, caseSensitive: false);
        final match = regex.firstMatch(advice);
        if (match != null) {
          final startIndex = match.start;
          // 找到下一个标题的位置
          int? endIndex;
          for (final otherEntry in patterns.entries) {
            if (otherEntry.key == key) continue;
            for (final otherPattern in otherEntry.value) {
              final otherRegex = RegExp(otherPattern, caseSensitive: false);
              final otherMatch = otherRegex.firstMatch(
                advice.substring(startIndex + match.group(0)!.length),
              );
              if (otherMatch != null) {
                final otherStartIndex =
                    startIndex + match.group(0)!.length + otherMatch.start;
                if (endIndex == null || otherStartIndex < endIndex) {
                  endIndex = otherStartIndex;
                }
              }
            }
          }

          final content = advice
              .substring(
                startIndex + match.group(0)!.length,
                endIndex ?? advice.length,
              )
              .trim();

          if (content.isNotEmpty) {
            sections[key] = content;
          }
          break;
        }
      }
    }

    return sections;
  }

  Widget _buildScoreDetailsCard() {
    final breakdown =
        minggeAnalysis['breakdown'] as Map<String, dynamic>? ?? {};

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.calculate, color: Color(0xFF6B73FF), size: 24),
              SizedBox(width: 8),
              Text(
                '命格等级评分构成',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Colors.black87,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _buildScoreItem(
            '基础评分',
            breakdown['基础评分'] ?? 0,
            const Color(0xFF3498db),
          ),
          _buildScoreItem(
            '最终得分',
            breakdown['总分'] ?? 0,
            const Color(0xFF6B73FF),
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.grey.shade50,
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Text(
              '命格等级评分采用传统八字理论结合现代评分体系，从多个维度综合评估命格的优劣。分数越高表示命格层次越高，人生发展潜力越大。',
              style: TextStyle(fontSize: 12, color: Colors.grey, height: 1.4),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBaseModulesCard() {
    final breakdown =
        minggeAnalysis['breakdown'] as Map<String, dynamic>? ?? {};

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.foundation, color: Color(0xFF3498db), size: 24),
              SizedBox(width: 8),
              Text(
                '基础模块评分',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Colors.black87,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _buildScoreItem(
            '季节助力',
            breakdown['季节助力'] ?? 0,
            const Color(0xFF3498db),
          ),
          _buildScoreItem(
            '五行平衡',
            breakdown['五行平衡'] ?? 0,
            const Color(0xFF27ae60),
          ),
          _buildScoreItem(
            '格局结构',
            breakdown['格局结构'] ?? 0,
            const Color(0xFF9b59b6),
          ),
          _buildScoreItem(
            '十神影响',
            breakdown['十神影响'] ?? 0,
            const Color(0xFFe67e22),
          ),
          _buildScoreItem(
            '组合刑冲',
            breakdown['组合刑冲'] ?? 0,
            const Color(0xFFe74c3c),
          ),
          _buildScoreItem(
            '调候用神',
            breakdown['调候用神'] ?? 0,
            const Color(0xFF16a085),
          ),
        ],
      ),
    );
  }

  Widget _buildAdvancedModulesCard() {
    final breakdown =
        minggeAnalysis['breakdown'] as Map<String, dynamic>? ?? {};

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.tune, color: Color(0xFF27ae60), size: 24),
              SizedBox(width: 8),
              Text(
                '进阶与修正评分',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Colors.black87,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _buildScoreItem(
            '日主强弱',
            breakdown['日主强弱'] ?? 0,
            const Color(0xFF3498db),
          ),
          _buildScoreItem(
            '用神得力',
            breakdown['用神得力'] ?? 0,
            const Color(0xFF27ae60),
          ),
          _buildScoreItem(
            '忌神制约',
            breakdown['忌神制约'] ?? 0,
            const Color(0xFF9b59b6),
          ),
          _buildScoreItem(
            '空亡减分',
            breakdown['空亡减分'] ?? 0,
            const Color(0xFFe74c3c),
          ),
          _buildScoreItem(
            '流年助力',
            breakdown['流年助力'] ?? 0,
            const Color(0xFFe67e22),
          ),
          _buildScoreItem(
            '大运配合',
            breakdown['大运配合'] ?? 0,
            const Color(0xFF16a085),
          ),
        ],
      ),
    );
  }

  Widget _buildSpecialPatternsCard() {
    final breakdown =
        minggeAnalysis['breakdown'] as Map<String, dynamic>? ?? {};

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.auto_awesome, color: Color(0xFF9b59b6), size: 24),
              SizedBox(width: 8),
              Text(
                '格局与特效评分',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Colors.black87,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _buildScoreItem(
            '贵人助力',
            breakdown['贵人助力'] ?? 0,
            const Color(0xFF3498db),
          ),
          _buildScoreItem(
            '特殊格局',
            breakdown['特殊格局'] ?? 0,
            const Color(0xFF9b59b6),
          ),
          _buildScoreItem(
            '命格层次',
            breakdown['命格层次'] ?? 0,
            const Color(0xFFe67e22),
          ),
        ],
      ),
    );
  }

  Widget _buildScoreItem(String label, num score, Color color) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: const TextStyle(fontSize: 14, color: Colors.black87),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(4),
            ),
            child: Text(
              '${score.toStringAsFixed(0)} 分',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
