import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'deepseek_cache_service.dart';
import 'strength_analysis_service.dart';

class WealthAnalysisService {
  // 全局变量，用于缓存评分详情
  static Map<String, dynamic>? _wealthScoreDetails;
  static double _wealthScoreValue = 0;

  // 天干五行属性
  static const Map<String, String> stemElements = {
    '甲': '木',
    '乙': '木',
    '丙': '火',
    '丁': '火',
    '戊': '土',
    '己': '土',
    '庚': '金',
    '辛': '金',
    '壬': '水',
    '癸': '水',
  };

  // 地支五行属性
  static const Map<String, String> branchElements = {
    '子': '水',
    '丑': '土',
    '寅': '木',
    '卯': '木',
    '辰': '土',
    '巳': '火',
    '午': '火',
    '未': '土',
    '申': '金',
    '酉': '金',
    '戌': '土',
    '亥': '水',
  };

  // 地支藏干
  static const Map<String, List<String>> branchHiddenStems = {
    '子': ['癸'],
    '丑': ['己', '癸', '辛'],
    '寅': ['甲', '丙', '戊'],
    '卯': ['乙'],
    '辰': ['戊', '乙', '癸'],
    '巳': ['丙', '庚', '戊'],
    '午': ['丁', '己'],
    '未': ['己', '丁', '乙'],
    '申': ['庚', '壬', '戊'],
    '酉': ['辛'],
    '戌': ['戊', '辛', '丁'],
    '亥': ['壬', '甲'],
  };

  // 十神映射表
  static const Map<String, String> tenGodMap = {
    // 甲日主
    '甲甲': '比肩', '甲乙': '劫财', '甲丙': '食神', '甲丁': '伤官', '甲戊': '偏财',
    '甲己': '正财', '甲庚': '七杀', '甲辛': '正官', '甲壬': '偏印', '甲癸': '正印',
    // 乙日主
    '乙乙': '比肩', '乙甲': '劫财', '乙丁': '食神', '乙丙': '伤官', '乙己': '偏财',
    '乙戊': '正财', '乙辛': '七杀', '乙庚': '正官', '乙癸': '偏印', '乙壬': '正印',
    // 丙日主
    '丙丙': '比肩', '丙丁': '劫财', '丙戊': '食神', '丙己': '伤官', '丙庚': '偏财',
    '丙辛': '正财', '丙壬': '七杀', '丙癸': '正官', '丙甲': '偏印', '丙乙': '正印',
    // 丁日主
    '丁丁': '比肩', '丁丙': '劫财', '丁己': '食神', '丁戊': '伤官', '丁辛': '偏财',
    '丁庚': '正财', '丁癸': '七杀', '丁壬': '正官', '丁乙': '偏印', '丁甲': '正印',
    // 戊日主
    '戊戊': '比肩', '戊己': '劫财', '戊庚': '食神', '戊辛': '伤官', '戊壬': '偏财',
    '戊癸': '正财', '戊甲': '七杀', '戊乙': '正官', '戊丙': '偏印', '戊丁': '正印',
    // 己日主
    '己己': '比肩', '己戊': '劫财', '己辛': '食神', '己庚': '伤官', '己癸': '偏财',
    '己壬': '正财', '己乙': '七杀', '己甲': '正官', '己丁': '偏印', '己丙': '正印',
    // 庚日主
    '庚庚': '比肩', '庚辛': '劫财', '庚壬': '食神', '庚癸': '伤官', '庚甲': '偏财',
    '庚乙': '正财', '庚丙': '七杀', '庚丁': '正官', '庚戊': '偏印', '庚己': '正印',
    // 辛日主
    '辛辛': '比肩', '辛庚': '劫财', '辛癸': '食神', '辛壬': '伤官', '辛乙': '偏财',
    '辛甲': '正财', '辛丁': '七杀', '辛丙': '正官', '辛己': '偏印', '辛戊': '正印',
    // 壬日主
    '壬壬': '比肩', '壬癸': '劫财', '壬甲': '食神', '壬乙': '伤官', '壬丙': '偏财',
    '壬丁': '正财', '壬戊': '七杀', '壬己': '正官', '壬庚': '偏印', '壬辛': '正印',
    // 癸日主
    '癸癸': '比肩', '癸壬': '劫财', '癸乙': '食神', '癸甲': '伤官', '癸丁': '偏财',
    '癸丙': '正财', '癸己': '七杀', '癸戊': '正官', '癸辛': '偏印', '癸庚': '正印',
  };

  // API调用获取求财建议 - 流式输出版本
  static Future<String> getWealthAdviceFromAPI(
    Map<String, dynamic> fullBaziData,
    double score,
    String level, {
    Function(String)? onStreamData,
  }) async {
    final cacheService = DeepSeekCacheService();

    try {
      // 首先检查缓存
      final cachedResult = await cacheService.getCachedWealthAnalysis(
        fullBaziData,
      );
      if (cachedResult != null) {
        print('✅ 使用缓存的财富分析结果');
        // 如果有流式回调，模拟流式输出缓存内容
        if (onStreamData != null) {
          _simulateStreamOutput(cachedResult, onStreamData);
        }
        return cachedResult;
      }

      print('🔄 调用流式API获取财富分析结果');

      // 直接调用StrengthAnalysisService计算准确的身强身弱
      String accurateStrengthType = '未知';
      try {
        // 从pillars中提取天干地支
        final pillars = fullBaziData['pillars'] as Map<String, String>? ?? {};
        if (pillars.isNotEmpty) {
          final yearPillar = pillars['year'] ?? '';
          final monthPillar = pillars['month'] ?? '';
          final dayPillar = pillars['day'] ?? '';
          final hourPillar = pillars['hour'] ?? '';

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

      // 构建完整的命主信息，参考后端API的数据结构
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
          'yearPillar': fullBaziData['pillars']?['year'] ?? '未知',
          'monthPillar': fullBaziData['pillars']?['month'] ?? '未知',
          'dayPillar': fullBaziData['pillars']?['day'] ?? '未知',
          'hourPillar': fullBaziData['pillars']?['hour'] ?? '未知',
          'dayMaster': fullBaziData['dayMaster'] ?? '未知',
          'yearNayin': fullBaziData['yearNayin'] ?? '未知',
        },
        'strengthAnalysis': fullBaziData['strengthAnalysis'],
        'wuxing': fullBaziData['wuxing'],
        'dayun': fullBaziData['dayun'],
        'liunian': fullBaziData['liunian'],
        'wealthScore': score,
        'wealthLevel': level,
      };

      // 调用流式DeepSeek API
      return await _getStreamingWealthAnalysis(
        baziData,
        score,
        level,
        fullBaziData,
        cacheService,
        onStreamData,
      );
    } catch (e) {
      print('获取求财建议失败: $e');
      final defaultAnalysis = _getDefaultThreePartAnalysisAsString(
        score,
        level,
      );
      await cacheService.cacheWealthAnalysis(fullBaziData, defaultAnalysis);
      return defaultAnalysis;
    }
  }

  /// 流式财富分析方法
  static Future<String> _getStreamingWealthAnalysis(
    Map<String, dynamic> baziData,
    double score,
    String level,
    Map<String, dynamic> fullBaziData,
    DeepSeekCacheService cacheService,
    Function(String)? onStreamData,
  ) async {
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
      'analysisType': 'career', // 使用career类型来获取财富相关分析
    });

    try {
      final streamedResponse = await request.send().timeout(
        const Duration(seconds: 120),
        onTimeout: () {
          throw Exception('流式API响应超时');
        },
      );

      if (streamedResponse.statusCode != 200) {
        print('流式API调用失败: ${streamedResponse.statusCode}');
        final defaultAnalysis = _getDefaultThreePartAnalysisAsString(
          score,
          level,
        );
        await cacheService.cacheWealthAnalysis(fullBaziData, defaultAnalysis);
        return defaultAnalysis;
      }

      String fullContent = '';

      await for (final chunk in streamedResponse.stream.transform(
        utf8.decoder,
      )) {
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

      // 如果API返回了完整的分析内容，缓存并返回
      if (cleanedContent.isNotEmpty && cleanedContent.length > 100) {
        await cacheService.cacheWealthAnalysis(fullBaziData, cleanedContent);
        return cleanedContent;
      }

      // 如果API返回内容不完整，返回默认的三板块分析
      final defaultAnalysis = _getDefaultThreePartAnalysisAsString(
        score,
        level,
      );
      await cacheService.cacheWealthAnalysis(fullBaziData, defaultAnalysis);
      return defaultAnalysis;
    } catch (e) {
      print('流式API调用失败: $e');
      final defaultAnalysis = _getDefaultThreePartAnalysisAsString(
        score,
        level,
      );
      await cacheService.cacheWealthAnalysis(fullBaziData, defaultAnalysis);
      return defaultAnalysis;
    }
  }

  /// 模拟流式输出缓存内容
  static void _simulateStreamOutput(
    String content,
    Function(String) onStreamData,
  ) {
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

  // 获取默认的三板块分析（返回String）
  static String _getDefaultThreePartAnalysisAsString(
    double score,
    String level,
  ) {
    return '''
## 一、命主财富等级评分分析

您的财富等级为$level，综合评分$score分。

**财星分布分析：**
${_getWealthStarAnalysis(score)}

**财库状态：**
${_getWealthVaultAnalysis(score)}

**承载能力：**
${_getCapacityAnalysis(score)}

**整体格局：**
${_getOverallPatternAnalysis(score)}

## 二、当前十年大运求财建议

**大运影响分析：**
${_getCurrentLuckAnalysis(score)}

**投资理财方向：**
${_getInvestmentDirection(score)}

**事业发展时机：**
${_getCareerTiming(score)}

**财务风险提示：**
${_getFinancialRisks(score)}

**合作建议：**
${_getCooperationAdvice(score)}

## 三、今年求财建议

**今年财运走势：**
${_getThisYearTrend(score)}

**最佳求财时机：**
${_getBestTiming(score)}

**适合投资类型：**
${_getSuitableInvestments(score)}

**风险规避：**
${_getRiskAvoidance(score)}
''';
  }

  // 获取默认的三板块分析（返回List<String>，保持向后兼容）
  static List<String> _getDefaultThreePartAnalysis(double score, String level) {
    return [_getDefaultThreePartAnalysisAsString(score, level)];
  }

  // 财星分布分析
  static String _getWealthStarAnalysis(double score) {
    if (score >= 80) {
      return '财星配置优良，正偏财均有体现，财源广进。财星得地有力，具备良好的聚财能力。';
    } else if (score >= 60) {
      return '财星配置中等，以正财为主，收入相对稳定。需要通过努力工作来获得财富。';
    } else {
      return '财星力量偏弱，求财需要付出更多努力。建议专注于技能提升，以劳动换取财富。';
    }
  }

  // 财库状态分析
  static String _getWealthVaultAnalysis(double score) {
    if (score >= 80) {
      return '财库状态良好，有聚财之象。善于积累财富，不易散财。';
    } else if (score >= 60) {
      return '财库中等，需要注意理财规划。建议建立储蓄习惯，避免冲动消费。';
    } else {
      return '财库偏弱，容易散财。需要特别注意财务管理，避免不必要的支出。';
    }
  }

  // 承载能力分析
  static String _getCapacityAnalysis(double score) {
    if (score >= 80) {
      return '日主强健，能够承载大财。适合从事高收入行业或大额投资。';
    } else if (score >= 60) {
      return '承载能力中等，适合稳步发展。不宜过度投资，以免超出承受能力。';
    } else {
      return '承载能力有限，宜量力而行。建议从小额投资开始，逐步积累经验。';
    }
  }

  // 整体格局分析
  static String _getOverallPatternAnalysis(double score) {
    if (score >= 80) {
      return '整体财富格局优秀，具备成为富翁的潜质。建议把握机遇，积极进取。';
    } else if (score >= 60) {
      return '财富格局中上，通过努力可以达到小康水平。建议稳扎稳打，步步为营。';
    } else {
      return '财富格局一般，需要通过勤奋工作来改善。建议专注于技能提升和稳定收入。';
    }
  }

  // 当前大运分析
  static String _getCurrentLuckAnalysis(double score) {
    if (score >= 80) {
      return '当前大运利于财运发展，是求财的黄金时期。宜把握机会，积极投资。';
    } else if (score >= 60) {
      return '当前大运财运平稳，适合稳健发展。避免冒险投资，以稳为主。';
    } else {
      return '当前大运财运一般，需要谨慎理财。建议以储蓄为主，等待更好时机。';
    }
  }

  // 投资方向建议
  static String _getInvestmentDirection(double score) {
    if (score >= 80) {
      return '适合多元化投资：股票、房地产、基金等。可以考虑创业或扩大经营规模。';
    } else if (score >= 60) {
      return '适合稳健投资：定期存款、国债、蓝筹股等。避免高风险投机性投资。';
    } else {
      return '建议保守投资：银行理财、货币基金等。优先建立应急资金储备。';
    }
  }

  // 事业时机分析
  static String _getCareerTiming(double score) {
    if (score >= 80) {
      return '事业发展正当时，适合升职加薪或跳槽到更好平台。创业时机成熟。';
    } else if (score >= 60) {
      return '事业发展稳中有进，适合在现有岗位深耕。可考虑技能提升或横向发展。';
    } else {
      return '事业发展需要耐心，建议专注于技能积累。暂不宜频繁跳槽或创业。';
    }
  }

  // 财务风险提示
  static String _getFinancialRisks(double score) {
    if (score >= 80) {
      return '注意投资过度和盲目扩张的风险。建议分散投资，不要把鸡蛋放在一个篮子里。';
    } else if (score >= 60) {
      return '注意理财产品的风险评估。避免被高收益诱惑而忽视风险。';
    } else {
      return '注意避免借贷消费和高风险投资。优先保证基本生活需求的稳定。';
    }
  }

  // 合作建议
  static String _getCooperationAdvice(double score) {
    if (score >= 80) {
      return '适合与有实力的伙伴合作，可以考虑合伙投资或联合创业。';
    } else if (score >= 60) {
      return '合作需要谨慎选择，建议选择互补性强的合作伙伴。';
    } else {
      return '暂不宜大额合作投资，可以考虑技能互补的小规模合作。';
    }
  }

  // 今年财运走势
  static String _getThisYearTrend(double score) {
    if (score >= 80) {
      return '今年财运亨通，收入有望大幅增长。投资运势良好，适合积极进取。';
    } else if (score >= 60) {
      return '今年财运平稳，收入稳中有升。适合稳健理财，避免冒险投资。';
    } else {
      return '今年财运一般，需要努力工作才能维持收入。建议节约开支，积累资金。';
    }
  }

  // 最佳求财时机
  static String _getBestTiming(double score) {
    if (score >= 80) {
      return '春夏两季财运最佳，特别是3-6月和9-11月。适合在这些时期进行重要投资决策。';
    } else if (score >= 60) {
      return '秋季财运相对较好，特别是9-11月。建议在此期间关注投资机会。';
    } else {
      return '全年财运平平，建议每月定期储蓄，不要指望一夜暴富。';
    }
  }

  // 适合投资类型
  static String _getSuitableInvestments(double score) {
    if (score >= 80) {
      return '适合股票、房地产、创业投资等。可以考虑一些新兴行业的投资机会。';
    } else if (score >= 60) {
      return '适合基金、债券、银行理财等稳健型投资。避免期货、外汇等高风险投资。';
    } else {
      return '适合定期存款、货币基金等保本型投资。优先考虑资金安全性。';
    }
  }

  // 风险规避
  static String _getRiskAvoidance(double score) {
    if (score >= 80) {
      return '避免过度杠杆和集中投资。注意市场波动带来的风险，及时止损。';
    } else if (score >= 60) {
      return '避免追涨杀跌和盲目跟风。建议制定投资计划并严格执行。';
    } else {
      return '避免任何形式的投机行为。远离网络借贷和高息理财产品。';
    }
  }

  // 行动建议
  static String _getActionAdvice(double score) {
    if (score >= 80) {
      return '1. 制定详细的投资计划\n2. 寻找优质的投资项目\n3. 建立多元化的收入来源\n4. 关注税务优化策略';
    } else if (score >= 60) {
      return '1. 建立应急资金储备\n2. 学习基础理财知识\n3. 制定月度储蓄计划\n4. 关注稳健投资机会';
    } else {
      return '1. 优先保证基本生活需求\n2. 建立储蓄习惯\n3. 提升职业技能\n4. 避免不必要的消费';
    }
  }

  // 单独获取求财建议的方法
  static Future<String> getWealthAdvice(
    Map<String, String> pillars,
    double score,
    String level,
  ) async {
    // 为了保持向后兼容，这里只传递基本信息
    // 如果需要完整信息，应该使用getWealthAdviceWithFullData方法
    final basicBaziData = {'pillars': pillars};
    return await getWealthAdviceFromAPI(basicBaziData, score, level);
  }

  // 新增方法：使用完整命主信息获取求财建议
  static Future<String> getWealthAdviceWithFullData(
    Map<String, dynamic> fullBaziData,
    double score,
    String level,
  ) async {
    return await getWealthAdviceFromAPI(fullBaziData, score, level);
  }

  // 根据分数获取默认建议
  static List<String> _getDefaultAdviceByScore(double score) {
    if (score >= 90) {
      return [
        '把握当前财运高峰期，适合大额投资',
        '多元化投资组合，分散风险',
        '关注新兴行业机会，提前布局',
        '建立稳定的被动收入来源',
        '适合创业或扩大经营规模',
        '注意税务规划，合理避税',
      ];
    } else if (score >= 70) {
      return [
        '稳健投资为主，避免高风险项目',
        '提升专业技能，增加收入来源',
        '建立应急资金，预防意外支出',
        '适合房产等实物资产投资',
        '谨慎选择合作伙伴，避免纠纷',
        '定期检视财务状况，调整策略',
      ];
    } else if (score >= 50) {
      return [
        '以储蓄为主，积累原始资本',
        '学习理财知识，提升财商',
        '寻找稳定的工作机会',
        '避免借贷投资，量力而行',
        '培养良好的消费习惯',
        '关注健康，避免医疗支出',
      ];
    } else {
      return [
        '节约开支，避免不必要消费',
        '提升自身能力，寻求更好机会',
        '谨慎理财，避免投机行为',
        '建立良好的人际关系网络',
        '保持积极心态，等待时机',
        '关注身体健康，减少意外损失',
      ];
    }
  }

  static Future<Map<String, dynamic>> analyzeWealth(
    Map<String, String> pillars,
  ) async {
    final score = calculateWealthScore(pillars);
    final levelInfo = getWealthLevel(score);

    // 不在这里调用API，返回空的建议列表
    final advice = <String>[];

    return {
      'score': score,
      'level': levelInfo['name'],
      'description': getWealthDescription(score),
      'details': _wealthScoreDetails ?? {},
      'advice': advice, // 新增：求财建议
      // 兼容原有字段
      'finalScore': score,
      'baseTotal': _wealthScoreDetails?['baseScore'] ?? 0,
      'wealthStarScore': _wealthScoreDetails?['wealthStarScore'] ?? 0,
      'capacityScore': _wealthScoreDetails?['capacityScore'] ?? 0,
      'foodInjuryScore': _wealthScoreDetails?['foodInjuryScore'] ?? 0,
      'wealthEnergyScore': _wealthScoreDetails?['wealthEnergyScore'] ?? 0,
      'wealthVaultScore': _wealthScoreDetails?['wealthVaultScore'] ?? 0,
      'sealProtectionScore': _wealthScoreDetails?['sealProtectionScore'] ?? 0,
      'selfWealthVaultScore': _wealthScoreDetails?['selfWealthVaultScore'] ?? 0,
      'wealthGatewayScore': _wealthScoreDetails?['wealthGatewayScore'] ?? 0,
      'tenGodComboScore': _wealthScoreDetails?['tenGodComboScore'] ?? 0,
      'specialPatternScore': _wealthScoreDetails?['specialPatternScore'] ?? 0,
      'bodyWealthBalanceScore':
          _wealthScoreDetails?['bodyWealthBalanceScore'] ?? 0,
      'luckYearScore': _wealthScoreDetails?['luckYearScore'] ?? 0,
      'voidPenaltyScore': _wealthScoreDetails?['voidPenaltyScore'] ?? 0,
      'favorableBalanceScore':
          _wealthScoreDetails?['favorableBalanceScore'] ?? 0,
      'seasonalWealthScore': _wealthScoreDetails?['seasonalWealthScore'] ?? 0,
      'wealthProtectionScore':
          _wealthScoreDetails?['wealthProtectionScore'] ?? 0,
      // 新增：详细评分结构，与UI显示完全一致
      'breakdown': {
        // 直接提供UI需要的字段名
        '财富位置': _wealthScoreDetails?['positionScore'] ?? 0,
        '日主承载力': _wealthScoreDetails?['capacityScore'] ?? 0,
        '食伤生财': _wealthScoreDetails?['foodInjuryScore'] ?? 0,
        '财星能量': _wealthScoreDetails?['wealthEnergyScore'] ?? 0,
        '财富库': _wealthScoreDetails?['wealthVaultScore'] ?? 0,
        '印绶护身': _wealthScoreDetails?['sealProtectionScore'] ?? 0,
        '自坐财库': _wealthScoreDetails?['selfWealthVaultScore'] ?? 0,
        '财气通门户': _wealthScoreDetails?['wealthFlowScore'] ?? 0,
        '食神生财': _wealthScoreDetails?['foodGenerateWealthBonus'] ?? 0,
        '伤官生财': _wealthScoreDetails?['injuryGenerateWealthBonus'] ?? 0,
        '官印相生': _wealthScoreDetails?['officialSealBonus'] ?? 0,
        '财官相生': _wealthScoreDetails?['wealthOfficialBonus'] ?? 0,
        '比劫夺财': -(_wealthScoreDetails?['robberyPenalty'] ?? 0),
        '从财格': _wealthScoreDetails?['congcaiBonus'] ?? 0,
        '日贵格': _wealthScoreDetails?['riguiBonus'] ?? 0,
        '魁罡格': _wealthScoreDetails?['kuigangBonus'] ?? 0,
        '金神格': _wealthScoreDetails?['jinshenBonus'] ?? 0,
        '财星保护': _wealthScoreDetails?['wealthProtectionScore'] ?? 0,
        '大运流年修正': _wealthScoreDetails?['luckYearScore'] ?? 0,
        '季节性财运潜力': _wealthScoreDetails?['seasonalWealthScore'] ?? 0,
        '身财平衡调整': _wealthScoreDetails?['bodyWealthBalanceScore'] ?? 0,
        '总分': score,
        '空亡扣分': -(_wealthScoreDetails?['voidPenalty'] ?? 0),
        '喜忌平衡': _wealthScoreDetails?['favorableBalance'] ?? 0,
        '季节性财运潜力': _wealthScoreDetails?['seasonalPotential'] ?? 0,
        '财星保护': _wealthScoreDetails?['wealthProtection'] ?? 0,
        '总分': _wealthScoreDetails?['total'] ?? 0,
      },
    };
  }

  // 计算财富分数 - 严格按照baziphone.html算法
  static double calculateWealthScore(Map<String, String> pillars) {
    _wealthScoreValue = 0; // 重置缓存

    if (_wealthScoreValue == 0) {
      final dayStem = pillars['day']!.substring(0, 1);
      // 基础模块评分 - 严格按照baziphone.html
      final positionScore = calculateWealthStarPosition(pillars); // 财富位置
      final capacityScore = calculateDayMasterCapacity(pillars); // 日主承载力
      final foodInjuryScore = calculateFoodInjuryGenerateWealth(
        pillars,
      ); // 食伤生财
      final wealthEnergyScore = calculateWealthStarEnergy(pillars); // 财星能量
      final wealthVaultScore = calculateWealthVault(pillars); // 财富库
      final sealProtectionScore = calculateSealProtection(pillars); // 印绶护身
      final selfWealthVaultScore = calculateSelfWealthVault(pillars); // 自坐财库
      final wealthFlowScore = calculateWealthGateway(pillars); // 财气通门户

      // 十神组合特效
      final foodGenerateWealthBonus =
          calculateTenGodCombination(pillars) * 0.3; // 食神生财
      final injuryGenerateWealthBonus =
          calculateTenGodCombination(pillars) * 0.3; // 伤官生财
      final officialSealBonus =
          calculateTenGodCombination(pillars) * 0.2; // 官印相生
      final wealthOfficialBonus =
          calculateTenGodCombination(pillars) * 0.2; // 财官相生
      final robberyPenalty = calculateTenGodCombination(pillars) * 0.1; // 比劫夺财

      // 特殊格局加分
      final congcaiBonus = calculateSpecialPatternBonus(pillars) * 0.4; // 从财格
      final riguiBonus = calculateSpecialPatternBonus(pillars) * 0.2; // 日贵格
      final kuigangBonus = calculateSpecialPatternBonus(pillars) * 0.2; // 魁罡格
      final jinshenBonus = calculateSpecialPatternBonus(pillars) * 0.2; // 金神格

      // 其他评分项
      final balanceAdjustment = calculateBodyWealthBalance(pillars); // 身财平衡调整
      final luckAdjustment = calculateLuckYearAdjustment(pillars); // 大运流年修正
      final voidPenalty = calculateVoidPenalty(pillars); // 空亡扣分
      final favorableBalance = calculateFavorableBalance(pillars); // 喜忌平衡
      final seasonalPotential = calculateSeasonalWealthPotential(
        pillars,
      ); // 季节性财运潜力
      final wealthProtection = calculateWealthProtection(pillars); // 财星保护

      // 计算总分
      double total =
          positionScore +
          capacityScore +
          foodInjuryScore +
          wealthEnergyScore +
          wealthVaultScore +
          sealProtectionScore +
          selfWealthVaultScore +
          wealthFlowScore +
          foodGenerateWealthBonus +
          injuryGenerateWealthBonus +
          officialSealBonus +
          wealthOfficialBonus -
          robberyPenalty +
          congcaiBonus +
          riguiBonus +
          kuigangBonus +
          jinshenBonus +
          balanceAdjustment +
          luckAdjustment -
          voidPenalty +
          favorableBalance +
          seasonalPotential +
          wealthProtection;

      // 保存详细评分
      _wealthScoreDetails = {
        'positionScore': positionScore,
        'capacityScore': capacityScore,
        'foodInjuryScore': foodInjuryScore,
        'wealthEnergyScore': wealthEnergyScore,
        'wealthVaultScore': wealthVaultScore,
        'sealProtectionScore': sealProtectionScore,
        'selfWealthVaultScore': selfWealthVaultScore,
        'wealthFlowScore': wealthFlowScore,
        'foodGenerateWealthBonus': foodGenerateWealthBonus,
        'injuryGenerateWealthBonus': injuryGenerateWealthBonus,
        'officialSealBonus': officialSealBonus,
        'wealthOfficialBonus': wealthOfficialBonus,
        'robberyPenalty': robberyPenalty,
        'congcaiBonus': congcaiBonus,
        'riguiBonus': riguiBonus,
        'kuigangBonus': kuigangBonus,
        'jinshenBonus': jinshenBonus,
        'balanceAdjustment': balanceAdjustment,
        'luckAdjustment': luckAdjustment,
        'voidPenalty': voidPenalty,
        'favorableBalance': favorableBalance,
        'seasonalPotential': seasonalPotential,
        'wealthProtection': wealthProtection,
        'total': total,
      };

      _wealthScoreValue = total.round().toDouble();
    }

    return _wealthScoreValue;
  }

  // 财星位置评分 - 复制baziphone.html算法
  static double calculateWealthStarPosition(Map<String, String> pillars) {
    final dayStem = pillars['day']!.substring(0, 1);
    double score = 0;

    // 检查月干财星
    final monthStem = pillars['month']!.substring(0, 1);
    if (isWealth(dayStem, monthStem)) {
      score += 8; // 月干透财
    }

    // 检查年干财星
    final yearStem = pillars['year']!.substring(0, 1);
    if (isWealth(dayStem, yearStem)) {
      score += 6; // 年干透财
    }

    // 检查时干财星
    final hourStem = pillars['hour']!.substring(0, 1);
    if (isWealth(dayStem, hourStem)) {
      score += 4; // 时干透财
    }

    // 检查地支藏财
    final branches = [
      pillars['year']!.substring(1),
      pillars['month']!.substring(1),
      pillars['day']!.substring(1),
      pillars['hour']!.substring(1),
    ];
    for (final branch in branches) {
      final hiddenStems = branchHiddenStems[branch] ?? [];
      for (final hiddenStem in hiddenStems) {
        if (isWealth(dayStem, hiddenStem)) {
          score += 2; // 地支藏财
        }
      }
    }

    return score.clamp(0, 15);
  }

  // 日主承载力评分
  static double calculateDayMasterCapacity(Map<String, String> pillars) {
    final dayStrength = estimateDayStrength(pillars);

    if (dayStrength >= 70) {
      return 12; // 身强能胜财
    } else if (dayStrength >= 50) {
      return 10; // 身财相当
    } else if (dayStrength >= 30) {
      return 6; // 身弱财多
    } else {
      return 2; // 身太弱不胜财
    }
  }

  // 估算日主强度
  static double estimateDayStrength(Map<String, String> pillars) {
    final dayStem = pillars['day']!.substring(0, 1);
    final monthBranch = pillars['month']!.substring(1);
    final dayElement = stemElements[dayStem]!;

    // 基于月令强弱
    double strength = calculateMonthlyStrength(dayElement, monthBranch);

    // 加上通根透干
    strength += calculateRootingBonus(pillars);

    return strength * 4; // 转换为百分制
  }

  // 月令强弱计算
  static double calculateMonthlyStrength(
    String dayElement,
    String monthBranch,
  ) {
    const monthStrengthMap = {
      '寅': {'木': 12, '火': 8, '土': 3, '金': 2, '水': 5},
      '卯': {'木': 15, '火': 6, '土': 2, '金': 1, '水': 4},
      '辰': {'土': 12, '木': 6, '水': 8, '火': 2, '金': 4},
      '巳': {'火': 15, '土': 8, '金': 6, '水': 1, '木': 2},
      '午': {'火': 18, '土': 6, '金': 4, '水': 0, '木': 3},
      '未': {'土': 15, '火': 6, '木': 4, '金': 8, '水': 2},
      '申': {'金': 15, '水': 8, '土': 6, '火': 1, '木': 2},
      '酉': {'金': 18, '水': 6, '土': 4, '火': 0, '木': 1},
      '戌': {'土': 12, '金': 8, '火': 6, '水': 2, '木': 1},
      '亥': {'水': 15, '木': 8, '金': 4, '火': 1, '土': 2},
      '子': {'水': 18, '木': 6, '金': 4, '火': 0, '土': 1},
      '丑': {'土': 12, '水': 8, '金': 6, '火': 2, '木': 1},
    };

    return (monthStrengthMap[monthBranch]?[dayElement] ?? 0).toDouble();
  }

  // 通根透干加分
  static double calculateRootingBonus(Map<String, String> pillars) {
    final dayStem = pillars['day']!.substring(0, 1);
    final dayElement = stemElements[dayStem]!;
    double bonus = 0;

    // 检查其他天干是否与日主同类
    final stems = [
      pillars['year']!.substring(0, 1),
      pillars['month']!.substring(0, 1),
      pillars['hour']!.substring(0, 1),
    ];
    for (final stem in stems) {
      if (stemElements[stem] == dayElement) {
        bonus += 1.5; // 透干加分
      }
    }

    // 检查地支藏干
    final branches = [
      pillars['year']!.substring(1),
      pillars['month']!.substring(1),
      pillars['day']!.substring(1),
      pillars['hour']!.substring(1),
    ];
    for (final branch in branches) {
      final hiddenStems = branchHiddenStems[branch] ?? [];
      for (final hiddenStem in hiddenStems) {
        if (stemElements[hiddenStem] == dayElement) {
          bonus += 0.8; // 通根加分
        }
      }
    }

    return bonus;
  }

  // 食伤生财评分
  static double calculateFoodInjuryGenerateWealth(Map<String, String> pillars) {
    final dayStem = pillars['day']!.substring(0, 1);
    double score = 0;

    // 检查食伤和财星的配合
    final tenGodsCount = countTenGods(pillars);
    final foodInjuryCount =
        (tenGodsCount['食神'] ?? 0) + (tenGodsCount['伤官'] ?? 0);
    final wealthCount = (tenGodsCount['正财'] ?? 0) + (tenGodsCount['偏财'] ?? 0);

    if (foodInjuryCount > 0 && wealthCount > 0) {
      score += 8; // 食伤生财格局

      // 食伤旺度加分
      if (foodInjuryCount >= 2) score += 2;

      // 财星多加分
      if (wealthCount >= 2) score += 2;
    } else if (foodInjuryCount > 0) {
      score += 3; // 有食伤但无财星
    }

    return score.clamp(0, 10);
  }

  // 统计十神数量
  static Map<String, double> countTenGods(Map<String, String> pillars) {
    final dayStem = pillars['day']!.substring(0, 1);
    Map<String, double> tenGodsCount = {
      '比肩': 0,
      '劫财': 0,
      '食神': 0,
      '伤官': 0,
      '偏财': 0,
      '正财': 0,
      '七杀': 0,
      '正官': 0,
      '偏印': 0,
      '正印': 0,
    };

    // 统计天干十神
    final stems = [
      pillars['year']!.substring(0, 1),
      pillars['month']!.substring(0, 1),
      pillars['hour']!.substring(0, 1),
    ];
    for (final stem in stems) {
      final tenGod = getTenGod(dayStem, stem);
      if (tenGodsCount.containsKey(tenGod)) {
        tenGodsCount[tenGod] = (tenGodsCount[tenGod] ?? 0) + 1;
      }
    }

    // 统计地支藏干十神
    final branches = [
      pillars['year']!.substring(1),
      pillars['month']!.substring(1),
      pillars['day']!.substring(1),
      pillars['hour']!.substring(1),
    ];
    for (final branch in branches) {
      final hiddenStems = branchHiddenStems[branch] ?? [];
      for (final stem in hiddenStems) {
        if (stem != dayStem) {
          final tenGod = getTenGod(dayStem, stem);
          if (tenGodsCount.containsKey(tenGod)) {
            tenGodsCount[tenGod] = (tenGodsCount[tenGod] ?? 0) + 0.3; // 藏干权重较低
          }
        }
      }
    }

    return tenGodsCount;
  }

  // 获取十神
  static String getTenGod(String dayStem, String target) {
    // 如果传入的是地支，则取其主气天干
    String actualTarget = target;
    if (branchElements.containsKey(target)) {
      const mainQiMap = {
        '子': '癸',
        '丑': '己',
        '寅': '甲',
        '卯': '乙',
        '辰': '戊',
        '巳': '丙',
        '午': '丁',
        '未': '己',
        '申': '庚',
        '酉': '辛',
        '戌': '戊',
        '亥': '壬',
      };
      actualTarget = mainQiMap[target] ?? target;
    }

    final key = dayStem + actualTarget;
    return tenGodMap[key] ?? '未知';
  }

  // 财星能量评分
  static double calculateWealthStarEnergy(Map<String, String> pillars) {
    final tenGodsCount = countTenGods(pillars);
    final wealthCount = (tenGodsCount['正财'] ?? 0) + (tenGodsCount['偏财'] ?? 0);

    if (wealthCount >= 3) {
      return 10; // 财星很旺
    } else if (wealthCount >= 2) {
      return 8; // 财星较旺
    } else if (wealthCount >= 1) {
      return 5; // 财星一般
    } else {
      return 0; // 无财星
    }
  }

  // 财富库评分
  static double calculateWealthVault(Map<String, String> pillars) {
    final dayStem = pillars['day']!.substring(0, 1);
    final dayElement = stemElements[dayStem]!;
    double score = 0;

    // 财库地支：木财库未，火财库戌，土财库丑，金财库辰，水财库未
    const wealthVaultMap = {
      '木': '未', // 木克土为财，土库在未
      '火': '戌', // 火克金为财，金库在戌
      '土': '丑', // 土克水为财，水库在丑
      '金': '辰', // 金克木为财，木库在辰
      '水': '未', // 水克火为财，火库在未
    };

    final wealthVault = wealthVaultMap[dayElement];
    if (wealthVault != null) {
      final branches = [
        pillars['year']!.substring(1),
        pillars['month']!.substring(1),
        pillars['day']!.substring(1),
        pillars['hour']!.substring(1),
      ];
      if (branches.contains(wealthVault)) {
        score += 8; // 有财库
      }
    }

    return score;
  }

  // 印绶护身评分
  static double calculateSealProtection(Map<String, String> pillars) {
    final tenGodsCount = countTenGods(pillars);
    final sealCount = (tenGodsCount['正印'] ?? 0) + (tenGodsCount['偏印'] ?? 0);
    final wealthCount = (tenGodsCount['正财'] ?? 0) + (tenGodsCount['偏财'] ?? 0);

    if (sealCount > 0 && wealthCount > 0) {
      // 有印有财，印能护身
      if (sealCount >= wealthCount) {
        return 8; // 印强能护身
      } else {
        return 5; // 印弱护身不力
      }
    } else if (sealCount > 0) {
      return 3; // 有印无财
    }

    return 0;
  }

  // 自坐财库评分
  static double calculateSelfWealthVault(Map<String, String> pillars) {
    final dayStem = pillars['day']!.substring(0, 1);
    final dayBranch = pillars['day']!.substring(1);

    // 检查日支是否为财库
    if (isWealthVault(dayStem, dayBranch)) {
      return 6; // 自坐财库
    }

    // 检查日支藏干是否有财星
    final hiddenStems = branchHiddenStems[dayBranch] ?? [];
    for (final hiddenStem in hiddenStems) {
      if (isWealth(dayStem, hiddenStem)) {
        return 3; // 日支藏财
      }
    }

    return 0;
  }

  // 判断是否为财库
  static bool isWealthVault(String dayStem, String branch) {
    final dayElement = stemElements[dayStem]!;
    const wealthVaultMap = {'木': '未', '火': '戌', '土': '丑', '金': '辰', '水': '未'};
    return wealthVaultMap[dayElement] == branch;
  }

  // 财气通门户评分
  static double calculateWealthGateway(Map<String, String> pillars) {
    final dayStem = pillars['day']!.substring(0, 1);
    double score = 0;

    // 年柱为门户，时柱为门户
    final yearStem = pillars['year']!.substring(0, 1);
    final hourStem = pillars['hour']!.substring(0, 1);

    if (isWealth(dayStem, yearStem)) {
      score += 3; // 年干透财
    }

    if (isWealth(dayStem, hourStem)) {
      score += 3; // 时干透财
    }

    return score.clamp(0, 6);
  }

  // 十神组合特效评分
  static double calculateTenGodCombination(Map<String, String> pillars) {
    final tenGodsCount = countTenGods(pillars);
    double score = 0;

    // 财官印流通
    if ((tenGodsCount['正财'] ?? 0) > 0 &&
        (tenGodsCount['正官'] ?? 0) > 0 &&
        (tenGodsCount['正印'] ?? 0) > 0) {
      score += 8; // 财官印三奇
    }

    // 食伤生财格
    if (((tenGodsCount['食神'] ?? 0) + (tenGodsCount['伤官'] ?? 0)) > 0 &&
        ((tenGodsCount['正财'] ?? 0) + (tenGodsCount['偏财'] ?? 0)) > 0) {
      score += 6; // 食伤生财
    }

    // 财滋弱杀格
    if ((tenGodsCount['偏财'] ?? 0) > 0 && (tenGodsCount['七杀'] ?? 0) > 0) {
      score += 4; // 财滋弱杀
    }

    // 比劫夺财扣分
    if (((tenGodsCount['比肩'] ?? 0) + (tenGodsCount['劫财'] ?? 0)) > 1 &&
        ((tenGodsCount['正财'] ?? 0) + (tenGodsCount['偏财'] ?? 0)) > 0) {
      score -= 3; // 比劫夺财
    }

    return score.clamp(0, 15);
  }

  // 特殊格局加分
  static double calculateSpecialPatternBonus(Map<String, String> pillars) {
    double score = 0;

    // 从财格
    if (isCongCaiGe(pillars)) {
      score += 15; // 从财格大吉
    }

    // 弃命从财格
    if (isQiMingCongCaiGe(pillars)) {
      score += 12; // 弃命从财
    }

    // 财多身弱格
    if (isCaiDuoShenRuoGe(pillars)) {
      score += 8; // 财多身弱需要帮身
    }

    return score;
  }

  // 从财格判断
  static bool isCongCaiGe(Map<String, String> pillars) {
    final tenGodsCount = countTenGods(pillars);
    final wealthCount = (tenGodsCount['正财'] ?? 0) + (tenGodsCount['偏财'] ?? 0);
    final supportCount =
        (tenGodsCount['比肩'] ?? 0) +
        (tenGodsCount['劫财'] ?? 0) +
        (tenGodsCount['正印'] ?? 0) +
        (tenGodsCount['偏印'] ?? 0);

    return wealthCount >= 3 && supportCount <= 0.5; // 财星多，生助少
  }

  // 弃命从财格判断
  static bool isQiMingCongCaiGe(Map<String, String> pillars) {
    final dayStrength = estimateDayStrength(pillars);
    final tenGodsCount = countTenGods(pillars);
    final wealthCount = (tenGodsCount['正财'] ?? 0) + (tenGodsCount['偏财'] ?? 0);

    return dayStrength < 20 && wealthCount >= 2; // 日主极弱，财星较多
  }

  // 财多身弱格判断
  static bool isCaiDuoShenRuoGe(Map<String, String> pillars) {
    final dayStrength = estimateDayStrength(pillars);
    final tenGodsCount = countTenGods(pillars);
    final wealthCount = (tenGodsCount['正财'] ?? 0) + (tenGodsCount['偏财'] ?? 0);

    return dayStrength < 40 && wealthCount >= 2; // 身弱财多
  }

  // 身财平衡调整
  static double calculateBodyWealthBalance(Map<String, String> pillars) {
    final dayStrength = estimateDayStrength(pillars);
    final tenGodsCount = countTenGods(pillars);
    final wealthCount = (tenGodsCount['正财'] ?? 0) + (tenGodsCount['偏财'] ?? 0);

    if (dayStrength >= 60 && wealthCount >= 2) {
      return 10; // 身强财旺，最佳配置
    } else if (dayStrength >= 40 && wealthCount >= 1) {
      return 8; // 身财相当
    } else if (dayStrength < 30 && wealthCount >= 2) {
      return 3; // 身弱财多，不利
    } else {
      return 5; // 一般情况
    }
  }

  // 大运流年修正
  static double calculateLuckYearAdjustment(Map<String, String> pillars) {
    // 简化的大运流年修正
    return 4.0; // 默认给予4分
  }

  // 空亡扣分
  static double calculateVoidPenalty(Map<String, String> pillars) {
    // 简化的空亡检查
    return 0.0; // 暂不扣分
  }

  // 喜忌平衡
  static double calculateFavorableBalance(Map<String, String> pillars) {
    final dayStrength = estimateDayStrength(pillars);
    final tenGodsCount = countTenGods(pillars);

    double score = 3; // 基础分

    if (dayStrength > 60) {
      // 身强喜财官食伤
      score += ((tenGodsCount['正财'] ?? 0) + (tenGodsCount['偏财'] ?? 0)) * 1;
      score += ((tenGodsCount['正官'] ?? 0) + (tenGodsCount['七杀'] ?? 0)) * 0.5;
      score += ((tenGodsCount['食神'] ?? 0) + (tenGodsCount['伤官'] ?? 0)) * 0.5;
    } else {
      // 身弱喜印比
      score += ((tenGodsCount['正印'] ?? 0) + (tenGodsCount['偏印'] ?? 0)) * 1;
      score += ((tenGodsCount['比肩'] ?? 0) + (tenGodsCount['劫财'] ?? 0)) * 0.5;
    }

    return score.clamp(0, 6);
  }

  // 季节性财运潜力
  static double calculateSeasonalWealthPotential(Map<String, String> pillars) {
    final dayStem = pillars['day']!.substring(0, 1);
    final monthBranch = pillars['month']!.substring(1);
    final dayElement = stemElements[dayStem]!;

    // 根据五行生克关系判断财运季节
    const wealthSeasonMap = {
      '木': ['辰', '戌', '丑', '未'], // 木克土为财，土旺于四季月
      '火': ['申', '酉', '戌'], // 火克金为财，金旺于秋季
      '土': ['亥', '子', '丑'], // 土克水为财，水旺于冬季
      '金': ['寅', '卯', '辰'], // 金克木为财，木旺于春季
      '水': ['巳', '午', '未'], // 水克火为财，火旺于夏季
    };

    final wealthSeasons = wealthSeasonMap[dayElement] ?? [];
    if (wealthSeasons.contains(monthBranch)) {
      return 5; // 财运季节
    }

    return 2; // 非财运季节
  }

  // 财星保护分数
  static double calculateWealthProtection(Map<String, String> pillars) {
    final tenGodsCount = countTenGods(pillars);
    final wealthCount = (tenGodsCount['正财'] ?? 0) + (tenGodsCount['偏财'] ?? 0);
    final robberyCount = (tenGodsCount['比肩'] ?? 0) + (tenGodsCount['劫财'] ?? 0);
    final officialCount = (tenGodsCount['正官'] ?? 0) + (tenGodsCount['七杀'] ?? 0);

    if (wealthCount > 0) {
      if (robberyCount > 0 && officialCount > 0) {
        return 5; // 有官制劫护财
      } else if (robberyCount > 0) {
        return 1; // 有劫无官护财
      } else {
        return 3; // 财星安全
      }
    }

    return 0;
  }

  // 判断是否为财星
  static bool isWealth(String dayStem, String target) {
    final tenGod = getTenGod(dayStem, target);
    return tenGod == '正财' || tenGod == '偏财';
  }

  // 判断是否为食伤
  static bool isShishang(String dayStem, String target) {
    final tenGod = getTenGod(dayStem, target);
    return tenGod == '食神' || tenGod == '伤官';
  }

  // 判断是否为印绶
  static bool isYinshou(String dayStem, String target) {
    final tenGod = getTenGod(dayStem, target);
    return tenGod == '正印' || tenGod == '偏印';
  }

  // 获取财富等级
  static Map<String, dynamic> getWealthLevel(double score) {
    if (score >= 100) {
      return {'name': '巨富之命', 'stars': 5};
    } else if (score >= 85) {
      return {'name': '大富之命', 'stars': 5};
    } else if (score >= 70) {
      return {'name': '中富之命', 'stars': 4};
    } else if (score >= 55) {
      return {'name': '小富之命', 'stars': 4};
    } else if (score >= 40) {
      return {'name': '小康之命', 'stars': 3};
    } else if (score >= 25) {
      return {'name': '温饱之命', 'stars': 2};
    } else {
      return {'name': '贫困之命', 'stars': 1};
    }
  }

  // 获取财富描述
  static String getWealthDescription(double score) {
    if (score >= 100) {
      return '财富层次极高，具有巨大的财富积累能力，一生富可敌国。';
    } else if (score >= 85) {
      return '财富运势极佳，具有很强的赚钱能力，能够积累大量财富。';
    } else if (score >= 70) {
      return '财富运势良好，有一定的财富积累能力，生活富裕。';
    } else if (score >= 55) {
      return '财富运势不错，通过努力能够获得不错的收入，生活舒适。';
    } else if (score >= 40) {
      return '财富运势一般，需要努力工作才能维持小康生活。';
    } else if (score >= 25) {
      return '财富运势偏弱，收入有限，需要节俭持家。';
    } else {
      return '财富运势较差，经济压力较大，需要格外努力。';
    }
  }

  /// 清理分析文本中的DeepSeek相关内容
  static String _cleanAnalysisText(String text) {
    return text
        .replaceAll(RegExp(r'以上内容由.*?生成.*?仅供参考', caseSensitive: false), '')
        .replaceAll(RegExp(r'DeepSeek', caseSensitive: false), '')
        .replaceAll(RegExp(r'\bAI\b', caseSensitive: false), '')
        .replaceAll(RegExp(r'仅供参考', caseSensitive: false), '')
        .replaceAll(RegExp(r'，仅供娱乐参考。', caseSensitive: false), '')
        .replaceAll(RegExp(r'人工智能', caseSensitive: false), '科技');
  }
}
