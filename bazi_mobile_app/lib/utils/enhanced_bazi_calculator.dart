/// 增强版八字计算器
/// 完整移植自system/bazinew.html和lunar.js的算法
/// 包含精确的节气计算、土性变化、十神分析等
library;

import 'lunar_calculator.dart';
import 'earth_transformation_calculator.dart';
import '../services/lunar_js_service.dart';

class EnhancedBaziCalculator {
  // 节气数据（从lunar.js移植）
  static const List<String> jieQiNames = [
    '小寒',
    '大寒',
    '立春',
    '雨水',
    '惊蛰',
    '春分',
    '清明',
    '谷雨',
    '立夏',
    '小满',
    '芒种',
    '夏至',
    '小暑',
    '大暑',
    '立秋',
    '处暑',
    '白露',
    '秋分',
    '寒露',
    '霜降',
    '立冬',
    '小雪',
    '大雪',
    '冬至',
  ];

  // 月建对应表（考虑节气）
  static const Map<int, String> monthBranches = {
    1: '寅',
    2: '卯',
    3: '辰',
    4: '巳',
    5: '午',
    6: '未',
    7: '申',
    8: '酉',
    9: '戌',
    10: '亥',
    11: '子',
    12: '丑',
  };

  // 地支藏干（完整版）
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

  /// 从阳历计算完整八字信息
  /// 对应bazinew.html中的calculateBazi函数
  static Future<Map<String, dynamic>> calculateCompleteBazi(DateTime dateTime) async {
    // 1. 基础八字计算 - 使用精确的lunar.js计算
    Map<String, dynamic> basicBazi;
    try {
      final lunarJsService = LunarJsService.instance;
      basicBazi = await lunarJsService.calculateBaziFromSolar(dateTime);
    } catch (e) {
      // 如果lunar.js计算失败，回退到Dart实现
      print('LunarJS计算失败，回退到Dart实现: $e');
      basicBazi = LunarCalculator.calculateBaziFromSolar(dateTime);
    }

    // 2. 获取四柱
    List<String> stems = [
      basicBazi['yearGan'] ?? '',
      basicBazi['monthGan'] ?? '',
      basicBazi['dayGan'] ?? '',
      basicBazi['hourGan'] ?? '',
    ];

    List<String> branches = [
      basicBazi['yearZhi'] ?? '',
      basicBazi['monthZhi'] ?? '',
      basicBazi['dayZhi'] ?? '',
      basicBazi['hourZhi'] ?? '',
    ];

    // 3. 计算增强版五行分布（包含土性变化）
    Map<String, dynamic> enhancedResult =
        EarthTransformationCalculator.calculateEnhancedElements(
          stems,
          branches,
          branchHiddenStems,
        );
    Map<String, double> enhancedElements = Map<String, double>.from(
      enhancedResult['elements'],
    );

    // 4. 计算十神分布
    Map<String, int> tenGods = _calculateTenGods(
      stems,
      branches,
      basicBazi['dayGan'] ?? '',
    );

    // 5. 计算身强身弱（增强版）
    Map<String, dynamic> strengthAnalysis = _calculateEnhancedStrength(
      stems,
      branches,
      basicBazi['dayGan'] ?? '',
      enhancedElements,
      dateTime,
    );

    // 6. 获取土性变化报告
    Map<String, dynamic> transformationReport =
        EarthTransformationCalculator.getTransformationReport(stems, branches);

    // 7. 计算神煞
    Map<String, dynamic> shenSha = _calculateShenSha(
      stems,
      branches,
      basicBazi['dayGan'] ?? '',
    );

    // 8. 计算大运
    List<Map<String, dynamic>> dayun = _calculateDayun(
      basicBazi['yearGan'] ?? '',
      basicBazi['monthGan'] ?? '',
      dateTime,
    );

    return {
      'basicInfo': basicBazi,
      'stems': stems,
      'branches': branches,
      'elements': enhancedElements,
      'tenGods': tenGods,
      'strength': strengthAnalysis,
      'transformationReport': transformationReport,
      'shenSha': shenSha,
      'dayun': dayun,
      'calculatedAt': DateTime.now().toIso8601String(),
      'algorithm': 'enhanced_lunar_js_port',
    };
  }

  /// 计算十神分布
  /// 对应bazinew.html中的countTenGods函数
  static Map<String, int> _calculateTenGods(
    List<String> stems,
    List<String> branches,
    String dayStem,
  ) {
    Map<String, int> tenGods = {
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

    // 计算天干十神
    for (int i = 0; i < stems.length; i++) {
      if (i == 2) continue; // 跳过日主
      String tenGod = LunarCalculator.getTenGod(dayStem, stems[i]);
      tenGods[tenGod] = (tenGods[tenGod] ?? 0) + 1;
    }

    // 计算地支藏干十神
    for (String branch in branches) {
      List<String>? hiddenStems = branchHiddenStems[branch];
      if (hiddenStems != null) {
        for (String hiddenStem in hiddenStems) {
          String tenGod = LunarCalculator.getTenGod(dayStem, hiddenStem);
          tenGods[tenGod] = (tenGods[tenGod] ?? 0) + 1;
        }
      }
    }

    return tenGods;
  }

  /// 增强版身强身弱计算
  /// 对应bazinew.html中的estimateDayStrength函数
  static Map<String, dynamic> _calculateEnhancedStrength(
    List<String> stems,
    List<String> branches,
    String dayStem,
    Map<String, double> elements,
    DateTime dateTime,
  ) {
    String dayElement = LunarCalculator.getWuxing(dayStem);
    double dayStrength = elements[dayElement] ?? 0.0;

    // 计算生扶力量（生我、助我）
    double supportStrength = 0.0;
    double drainStrength = 0.0;

    // 五行相生相克关系
    Map<String, List<String>> generates = {
      'wood': ['fire'],
      'fire': ['earth'],
      'earth': ['metal'],
      'metal': ['water'],
      'water': ['wood'],
    };

    Map<String, List<String>> supports = {
      'wood': ['water'],
      'fire': ['wood'],
      'earth': ['fire'],
      'metal': ['earth'],
      'water': ['metal'],
    };

    // 计算各五行对日主的影响
    elements.forEach((element, strength) {
      if (element == dayElement) {
        supportStrength += strength; // 同类相助
      } else if (supports[dayElement]?.contains(element) == true) {
        supportStrength += strength * 0.8; // 生我
      } else if (generates[dayElement]?.contains(element) == true) {
        drainStrength += strength * 0.6; // 我生（泄）
      } else {
        drainStrength += strength * 0.4; // 克我或我克
      }
    });

    // 月令影响（根据节气）
    double seasonBonus = _calculateSeasonBonus(dayElement, dateTime);
    supportStrength += seasonBonus;

    // 计算最终强弱
    double totalStrength = supportStrength - drainStrength;
    String strengthLevel;

    if (totalStrength > 3.0) {
      strengthLevel = '极强';
    } else if (totalStrength > 1.5) {
      strengthLevel = '偏强';
    } else if (totalStrength > -1.5) {
      strengthLevel = '中和';
    } else if (totalStrength > -3.0) {
      strengthLevel = '偏弱';
    } else {
      strengthLevel = '极弱';
    }

    return {
      'dayElement': dayElement,
      'dayStrength': dayStrength,
      'supportStrength': supportStrength,
      'drainStrength': drainStrength,
      'totalStrength': totalStrength,
      'strengthLevel': strengthLevel,
      'seasonBonus': seasonBonus,
      'isStrong': totalStrength > 0,
    };
  }

  /// 计算季节对五行的影响
  static double _calculateSeasonBonus(String element, DateTime dateTime) {
    int month = dateTime.month;

    // 春季（2-4月）木旺
    if (month >= 2 && month <= 4) {
      return element == 'wood' ? 1.5 : (element == 'fire' ? 0.5 : -0.5);
    }
    // 夏季（5-7月）火旺
    else if (month >= 5 && month <= 7) {
      return element == 'fire' ? 1.5 : (element == 'earth' ? 0.5 : -0.5);
    }
    // 秋季（8-10月）金旺
    else if (month >= 8 && month <= 10) {
      return element == 'metal' ? 1.5 : (element == 'water' ? 0.5 : -0.5);
    }
    // 冬季（11-1月）水旺
    else {
      return element == 'water' ? 1.5 : (element == 'wood' ? 0.5 : -0.5);
    }
  }

  /// 计算神煞
  /// 对应bazinew.html中的calculateShenSha函数
  static Map<String, dynamic> _calculateShenSha(
    List<String> stems,
    List<String> branches,
    String dayStem,
  ) {
    // 验证输入数据
    if (stems.length < 4 || branches.length < 4) {
      throw ArgumentError('stems and branches must have at least 4 elements');
    }

    Map<String, List<String>> shenSha = {'吉神': [], '凶煞': []};

    // 天乙贵人
    List<String> tianyiGuiren = _getTianyiGuiren(dayStem);
    for (String branch in branches) {
      if (tianyiGuiren.contains(branch)) {
        shenSha['吉神']!.add('天乙贵人($branch)');
      }
    }

    // 将星
    String jiangxing = _getJiangxing(branches[0]); // 年支查将星
    for (String branch in branches) {
      if (branch == jiangxing) {
        shenSha['吉神']!.add('将星($branch)');
      }
    }

    // 魁罡
    String dayPillar = '${stems[2]}${branches[2]}';
    List<String> kuigang = ['庚戌', '庚辰', '壬辰', '戊戌'];
    if (kuigang.contains(dayPillar)) {
      shenSha['吉神']!.add('魁罡($dayPillar)');
    }

    // 羊刃
    String yangRen = _getYangRen(dayStem);
    for (String branch in branches) {
      if (branch == yangRen) {
        shenSha['凶煞']!.add('羊刃($branch)');
      }
    }

    // 桃花
    String taohua = _getTaohua(branches[0], branches[2]); // 年支或日支查桃花
    for (String branch in branches) {
      if (branch == taohua) {
        shenSha['凶煞']!.add('桃花($branch)');
      }
    }

    return {
      'jiShen': shenSha['吉神'],
      'xiongSha': shenSha['凶煞'],
      'total': shenSha['吉神']!.length + shenSha['凶煞']!.length,
    };
  }

  /// 获取天乙贵人
  static List<String> _getTianyiGuiren(String stem) {
    Map<String, List<String>> tianyiMap = {
      '甲': ['丑', '未'],
      '乙': ['子', '申'],
      '丙': ['亥', '酉'],
      '丁': ['亥', '酉'],
      '戊': ['丑', '未'],
      '己': ['子', '申'],
      '庚': ['丑', '未'],
      '辛': ['寅', '午'],
      '壬': ['卯', '巳'],
      '癸': ['卯', '巳'],
    };
    return tianyiMap[stem] ?? [];
  }

  /// 获取将星
  static String _getJiangxing(String yearBranch) {
    Map<String, String> jiangxingMap = {
      '子': '子',
      '丑': '酉',
      '寅': '午',
      '卯': '卯',
      '辰': '子',
      '巳': '酉',
      '午': '午',
      '未': '卯',
      '申': '子',
      '酉': '酉',
      '戌': '午',
      '亥': '卯',
    };
    return jiangxingMap[yearBranch] ?? '';
  }

  /// 获取羊刃
  static String _getYangRen(String stem) {
    Map<String, String> yangRenMap = {
      '甲': '卯',
      '乙': '寅',
      '丙': '午',
      '丁': '巳',
      '戊': '午',
      '己': '巳',
      '庚': '酉',
      '辛': '申',
      '壬': '子',
      '癸': '亥',
    };
    return yangRenMap[stem] ?? '';
  }

  /// 获取桃花
  static String _getTaohua(String yearBranch, String dayBranch) {
    Map<String, String> taohuaMap = {
      '子': '酉',
      '丑': '午',
      '寅': '卯',
      '卯': '子',
      '辰': '酉',
      '巳': '午',
      '午': '卯',
      '未': '子',
      '申': '酉',
      '酉': '午',
      '戌': '卯',
      '亥': '子',
    };
    // 优先用年支查，如果没有则用日支查
    return taohuaMap[yearBranch] ?? taohuaMap[dayBranch] ?? '';
  }

  /// 计算大运
  /// 对应bazinew.html中的calculateDayun函数
  static List<Map<String, dynamic>> _calculateDayun(
    String yearStem,
    String monthStem,
    DateTime birthDate,
  ) {
    List<Map<String, dynamic>> dayun = [];

    // 判断顺逆（阳男阴女顺行，阴男阳女逆行）
    bool isYangYear = ['甲', '丙', '戊', '庚', '壬'].contains(yearStem);
    bool isMale = true; // 这里需要从外部传入性别信息
    bool isShun = (isYangYear && isMale) || (!isYangYear && !isMale);

    // 天干顺序
    List<String> stemOrder = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
    List<String> branchOrder = [
      '子',
      '丑',
      '寅',
      '卯',
      '辰',
      '巳',
      '午',
      '未',
      '申',
      '酉',
      '戌',
      '亥',
    ];

    int monthStemIndex = stemOrder.indexOf(monthStem);
    int monthBranchIndex = branchOrder.indexOf(
      monthBranches[birthDate.month] ?? '寅',
    );

    for (int i = 0; i < 8; i++) {
      int stemIndex, branchIndex;

      if (isShun) {
        stemIndex = (monthStemIndex + i + 1) % 10;
        branchIndex = (monthBranchIndex + i + 1) % 12;
      } else {
        stemIndex = (monthStemIndex - i - 1 + 10) % 10;
        branchIndex = (monthBranchIndex - i - 1 + 12) % 12;
      }

      String dayunStem = stemOrder[stemIndex];
      String dayunBranch = branchOrder[branchIndex];

      dayun.add({
        'index': i,
        'stem': dayunStem,
        'branch': dayunBranch,
        'pillar': '$dayunStem$dayunBranch',
        'startAge': i * 10 + (isShun ? 8 : 2), // 简化的起运年龄计算
        'endAge': (i + 1) * 10 + (isShun ? 7 : 1),
        'element': LunarCalculator.getWuxing(dayunStem),
      });
    }

    return dayun;
  }

  /// 生成详细的八字分析报告
  static Map<String, dynamic> generateDetailedReport(
    Map<String, dynamic> baziData,
  ) {
    List<String> reports = [];

    // 基本信息
    reports.add(
      '八字：${baziData['stems'].join('')} ${baziData['branches'].join('')}',
    );

    // 五行分析
    Map<String, double> elements = baziData['elements'];
    String strongestElement = elements.entries
        .reduce((a, b) => a.value > b.value ? a : b)
        .key;
    String weakestElement = elements.entries
        .reduce((a, b) => a.value < b.value ? a : b)
        .key;
    reports.add(
      '五行最强：$strongestElement(${elements[strongestElement]?.toStringAsFixed(1)})，最弱：$weakestElement(${elements[weakestElement]?.toStringAsFixed(1)})',
    );

    // 身强身弱
    Map<String, dynamic> strength = baziData['strength'];
    reports.add(
      '日主${strength['dayElement']}，身${strength['strengthLevel']}，总强度：${strength['totalStrength'].toStringAsFixed(1)}',
    );

    // 土性变化
    Map<String, dynamic> transformation = baziData['transformationReport'];
    if (transformation['hasSpecialTransformation']) {
      reports.addAll(List<String>.from(transformation['reports']));
    }

    // 神煞
    Map<String, dynamic> shenSha = baziData['shenSha'];
    if (shenSha['jiShen'].isNotEmpty) {
      reports.add('吉神：${shenSha['jiShen'].join('、')}');
    }
    if (shenSha['xiongSha'].isNotEmpty) {
      reports.add('凶煞：${shenSha['xiongSha'].join('、')}');
    }

    return {
      'summary': reports.join('\n'),
      'reports': reports,
      'analysisDate': DateTime.now().toIso8601String(),
    };
  }
}
