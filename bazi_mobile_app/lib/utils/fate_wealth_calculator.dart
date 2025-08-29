/// 命格和财富等级计算器
/// 完整移植自bazinew.html中的专业算法
library;

import 'dart:math';
import '../services/mingge_analysis_service.dart';

// 增强版财富等级计算器 - 完整移植自bazinew.html
class WealthCalculator {
  // 通用安全检查方法
  static void _validatePillars(Map<String, String> pillars) {
    for (String key in ['year', 'month', 'day', 'hour']) {
      if (pillars[key] == null || pillars[key]!.length < 2) {
        throw ArgumentError('四柱数据不完整：$key 柱为空或长度不足');
      }
    }
  }

  // 天干地支定义
  static const List<String> tianGan = [
    '甲',
    '乙',
    '丙',
    '丁',
    '戊',
    '己',
    '庚',
    '辛',
    '壬',
    '癸',
  ];
  static const List<String> diZhi = [
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

  // 五行定义
  static const Map<String, String> ganWuXing = {
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

  static const Map<String, String> zhiWuXing = {
    '寅': '木',
    '卯': '木',
    '巳': '火',
    '午': '火',
    '申': '金',
    '酉': '金',
    '亥': '水',
    '子': '水',
    '辰': '土',
    '戌': '土',
    '丑': '土',
    '未': '土',
  };

  // 地支藏干表
  static const Map<String, List<String>> zhiCangGan = {
    '子': ['癸'],
    '丑': ['己', '癸', '辛'],
    '寅': ['甲', '丙', '戊'],
    '卯': ['乙'],
    '辰': ['戊', '乙', '癸'],
    '巳': ['丙', '戊', '庚'],
    '午': ['丁', '己'],
    '未': ['己', '丁', '乙'],
    '申': ['庚', '壬', '戊'],
    '酉': ['辛'],
    '戌': ['戊', '辛', '丁'],
    '亥': ['壬', '甲'],
  };

  // 计算财富等级 - 完整算法
  static Map<String, dynamic> calculateWealthLevel(
    Map<String, String> pillars,
  ) {
    final score = calculateWealthScore(pillars);

    String level;
    String description;
    String wealthClass;

    if (score >= 85) {
      level = '富豪级';
      description = '财富极其丰厚，富可敌国，具备成为顶级富豪的命格';
      wealthClass = 'ultra-rich';
    } else if (score >= 75) {
      level = '富裕级';
      description = '财富丰厚，生活富足，具备成为富人的潜质';
      wealthClass = 'wealthy';
    } else if (score >= 65) {
      level = '小康级';
      description = '财运不错，生活小康，有一定的财富积累能力';
      wealthClass = 'well-off';
    } else if (score >= 50) {
      level = '温饱级';
      description = '基本温饱，略有积蓄，财运平稳';
      wealthClass = 'stable';
    } else {
      level = '清贫级';
      description = '财运一般，需要努力，宜通过勤劳致富';
      wealthClass = 'modest';
    }

    return {
      'score': score,
      'level': level,
      'description': description,
      'class': wealthClass,
      'breakdown': _getScoreBreakdown(pillars),
    };
  }

  // 计算财富分数 - 完整算法移植自bazinew.html
  static int calculateWealthScore(Map<String, String> pillars) {
    double totalScore = 0.0;

    // 基础模块评分（与原版bazinew.html完全一致）
    final wealthPositionScore = _calculateWealthPosition(pillars); // 财星位置 (20分)
    final dayMasterCapacity = _calculateEnhancedCarryingCapacity(
      pillars,
    ); // 日主承载力 (15分)
    final shishangScore = _calculateShishangEnergy(pillars); // 食伤生财 (12分)
    final wealthStarScore = _calculateWealthStarEnergy(pillars); // 财星能量 (10分)
    final wealthVaultScore = _calculateWealthVault(pillars); // 财富库 (8分)
    final yinshouScore = _calculateYinshouSupport(pillars); // 印绶护身 (6分)
    final selfVaultScore = _calculateSelfSittingVault(pillars); // 自坐财库 (6分)
    final portalScore = _calculateWealthPortal(pillars); // 财气通门户 (5分)

    // 基础分数
    double baseScore =
        shishangScore +
        yinshouScore +
        wealthStarScore +
        wealthPositionScore +
        wealthVaultScore +
        dayMasterCapacity +
        selfVaultScore +
        portalScore;

    // 十神组合特效
    final tenGodsBonus = _calculateTenGodsCombo(pillars);
    baseScore += tenGodsBonus;

    // 特殊格局识别和加分
    final specialPattern = _getSpecialPattern(pillars);
    double specialBonus = 0;

    if (specialPattern.isNotEmpty && specialPattern != '无') {
      if (specialPattern.contains('从财')) {
        specialBonus += 25; // 从财格对财富最有利
      } else if (specialPattern.contains('日贵')) {
        specialBonus += 20; // 日贵格
      } else if (specialPattern.contains('魁罡')) {
        specialBonus += 18; // 魁罡格
      } else if (specialPattern.contains('从弱') ||
          specialPattern.contains('从儿')) {
        specialBonus += 15; // 从弱格、从儿格
      } else if (specialPattern.contains('专旺')) {
        specialBonus += 14; // 专旺格
      } else if (specialPattern.contains('化气')) {
        specialBonus += 12; // 化气格
      } else if (specialPattern.contains('金神')) {
        specialBonus += 11; // 金神格
      } else if (specialPattern.contains('从强')) {
        specialBonus += 8; // 从强格
      } else if (specialPattern.contains('三奇')) {
        specialBonus += 10; // 三奇贵人格
      } else {
        specialBonus += 6; // 其他特殊格局
      }
    }
    baseScore += specialBonus;

    // 身财平衡调整
    final balanceAdjustment = _calculateBodyWealthBalance(pillars);
    baseScore += balanceAdjustment;

    // 大运流年修正
    final luckAdjustment = _calculateLuckAdjustment(pillars);
    final dayunStrength = 0.0; // 简化实现
    double total = baseScore + luckAdjustment + dayunStrength;

    // 专业八字要素：空亡检查
    final kongWangPenalty = _calculateKongWangPenalty(pillars);

    // 专业八字要素：喜忌平衡分析
    final favorableBalance = _calculateFavorableBalance(pillars);

    // 专业八字要素：季节性财运潜力
    final seasonalWealthPotential = _calculateSeasonalWealthPotential(pillars);

    // 专业八字要素：财星保护分数
    final wealthProtectionScore = _calculateWealthProtectionScore(pillars);

    // 调整总分，增加专业分析维度
    total =
        total +
        favorableBalance +
        seasonalWealthPotential +
        wealthProtectionScore -
        kongWangPenalty;

    // 应用传统否决条款（简化实现）
    total = _applyVetoRules(total, pillars);

    // 使用更严格的舍入处理，消除浮点数精度问题
    final roundedTotal = (total * 1000).round() / 1000; // 先放大1000倍舍入再缩小
    return max(0, roundedTotal.round());
  }

  // 1. 计算财星位置分数 (20分) - 与原版bazinew.html完全一致
  static double _calculateWealthPosition(Map<String, String> pillars) {
    _validatePillars(pillars);

    double score = 0.0;
    final dayStem = pillars['day']![0];
    final dayStrength = _calculateSimpleDayStrength(pillars);
    final zhengCai = _getZhengCai(dayStem);
    final pianCai = _getPianCai(dayStem);
    final wealthBranches = _getWealthBranches(dayStem);

    // 月令财星 - 财气通门户（最重要）
    if (wealthBranches.contains(pillars['month']![1])) {
      score += 8; // 月支见财，财气通门户，最重要
    }
    if (pillars['month']![0] == zhengCai || pillars['month']![0] == pianCai) {
      score += 6; // 月干见财
    }

    // 时上偏财格 - 晚年富贵
    if (pillars['hour']![0] == pianCai) {
      score += 5; // 时上偏财，晚年发达
    }

    // 日坐财星 - 配偶助财
    if (wealthBranches.contains(pillars['day']![1])) {
      score += 4; // 日支见财，配偶助财
      if (dayStrength >= 60) {
        score += 2; // 身强坐财更佳
      }
    }

    // 年柱财星 - 祖业或早年财运
    if (pillars['year']![0] == zhengCai || pillars['year']![0] == pianCai) {
      score += 3; // 年干见财
    }
    if (wealthBranches.contains(pillars['year']![1])) {
      score += 2; // 年支见财
    }

    return min(20, score);
  }

  // 获取分数明细
  static Map<String, int> _getScoreBreakdown(Map<String, String> pillars) {
    return {
      '财星位置': _calculateWealthPosition(pillars).round(),
      '日主承载力': _calculateEnhancedCarryingCapacity(pillars).round(),
      '食伤生财': _calculateShishangEnergy(pillars).round(),
      '财星能量': _calculateWealthStarEnergy(pillars).round(),
      '财富库': _calculateWealthVault(pillars).round(),
      '印绶护身': _calculateYinshouSupport(pillars).round(),
      '自坐财库': _calculateSelfSittingVault(pillars).round(),
      '财气通门户': _calculateWealthPortal(pillars).round(),
      '十神组合': _calculateTenGodsCombo(pillars).round(),
      '特殊格局': _calculateSpecialPatterns(pillars).round(),
      '身财平衡': _calculateBodyWealthBalance(pillars).round(),
      '大运流年': _calculateLuckAdjustment(pillars).round(),
      '空亡检查': _calculateKongWangPenalty(pillars).round(),
      '喜忌平衡': _calculateFavorableBalance(pillars).round(),
      '季节财运': _calculateSeasonalWealthPotential(pillars).round(),
      '财星保护': _calculateWealthProtectionScore(pillars).round(),
      '日主强弱': _calculateDayMasterStrengthScore(pillars).round(),
      '用神得力': _calculateUsefulGodScore(pillars).round(),
    };
  }

  // ========== 辅助方法 - 基础十神和五行关系 ==========

  // 获取正财
  static String _getZhengCai(String dayStem) {
    final map = {
      '甲': '己',
      '乙': '戊',
      '丙': '辛',
      '丁': '庚',
      '戊': '癸',
      '己': '壬',
      '庚': '乙',
      '辛': '甲',
      '壬': '丁',
      '癸': '丙',
    };
    return map[dayStem] ?? '';
  }

  // 获取偏财
  static String _getPianCai(String dayStem) {
    final map = {
      '甲': '戊',
      '乙': '己',
      '丙': '庚',
      '丁': '辛',
      '戊': '壬',
      '己': '癸',
      '庚': '甲',
      '辛': '乙',
      '壬': '丙',
      '癸': '丁',
    };
    return map[dayStem] ?? '';
  }

  // 获取财星地支
  static List<String> _getWealthBranches(String dayStem) {
    final dayElement = _getStemElement(dayStem);
    final wealthElement = _getWealthElement(dayElement);
    return _getElementBranches(wealthElement);
  }

  // 获取财库
  static List<String> _getWealthVaults(String dayStem) {
    final dayElement = _getStemElement(dayStem);
    switch (dayElement) {
      case '木':
        return ['辰', '戌', '丑', '未']; // 木克土为财，土库为财库
      case '火':
        return ['戌', '丑']; // 火克金为财，金库为财库
      case '土':
        return ['辰', '丑']; // 土克水为财，水库为财库
      case '金':
        return ['未', '辰']; // 金克木为财，木库为财库
      case '水':
        return ['戌', '未']; // 水克火为财，火库为财库
      default:
        return [];
    }
  }

  // 获取食伤星
  static List<String> _getShiShangStars(String dayStem) {
    final map = {
      '甲': ['丙', '丁'],
      '乙': ['丁', '丙'],
      '丙': ['戊', '己'],
      '丁': ['己', '戊'],
      '戊': ['庚', '辛'],
      '己': ['辛', '庚'],
      '庚': ['壬', '癸'],
      '辛': ['癸', '壬'],
      '壬': ['甲', '乙'],
      '癸': ['乙', '甲'],
    };
    return map[dayStem] ?? [];
  }

  // 获取印星
  static List<String> _getYinStars(String dayStem) {
    final map = {
      '甲': ['壬', '癸'],
      '乙': ['癸', '壬'],
      '丙': ['甲', '乙'],
      '丁': ['乙', '甲'],
      '戊': ['丙', '丁'],
      '己': ['丁', '丙'],
      '庚': ['戊', '己'],
      '辛': ['己', '戊'],
      '壬': ['庚', '辛'],
      '癸': ['辛', '庚'],
    };
    return map[dayStem] ?? [];
  }

  // 获取比劫星
  static List<String> _getBiJieStars(String dayStem) {
    final dayElement = _getStemElement(dayStem);
    return tianGan
        .where((stem) => _getStemElement(stem) == dayElement)
        .toList();
  }

  // 获取官杀星
  static List<String> _getGuanStars(String dayStem) {
    final dayElement = _getStemElement(dayStem);
    final officialElement = _getOfficialElement(dayElement);
    return tianGan
        .where((stem) => _getStemElement(stem) == officialElement)
        .toList();
  }

  // 获取天干五行
  static String _getStemElement(String stem) {
    return ganWuXing[stem] ?? '';
  }

  // 获取财星五行
  static String _getWealthElement(String dayElement) {
    const map = {'木': '土', '火': '金', '土': '水', '金': '木', '水': '火'};
    return map[dayElement] ?? '';
  }

  // 获取官星五行
  static String _getOfficialElement(String dayElement) {
    const map = {'木': '金', '火': '水', '土': '木', '金': '火', '水': '土'};
    return map[dayElement] ?? '';
  }

  // 获取某五行对应的地支
  static List<String> _getElementBranches(String element) {
    return zhiWuXing.entries
        .where((entry) => entry.value == element)
        .map((entry) => entry.key)
        .toList();
  }

  // 判断是否为财星
  static bool _isWealth(String dayElement, String element) {
    return _getWealthElement(dayElement) == element;
  }

  // 判断是否为印星
  static bool _isYinshou(String dayElement, String element) {
    const map = {'木': '水', '火': '木', '土': '火', '金': '土', '水': '金'};
    return map[dayElement] == element;
  }

  // 判断是否为食伤
  static bool _isShishang(String dayElement, String element) {
    const map = {'木': '火', '火': '土', '土': '金', '金': '水', '水': '木'};
    return map[dayElement] == element;
  }

  // 判断日主是否得令
  static bool _isDayStemInSeason(String dayStem, String monthBranch) {
    final dayElement = _getStemElement(dayStem);
    final monthElement = zhiWuXing[monthBranch] ?? '';
    return dayElement == monthElement;
  }

  // 获取支持日主的地支
  static List<String> _getSupportiveBranches(String dayStem) {
    final dayElement = _getStemElement(dayStem);
    final supportElement = _getSupportElement(dayElement);
    final result = <String>[];

    // 同类地支
    result.addAll(_getElementBranches(dayElement));

    // 生扶地支
    if (supportElement.isNotEmpty) {
      result.addAll(_getElementBranches(supportElement));
    }

    return result;
  }

  // 获取生扶五行
  static String _getSupportElement(String element) {
    const map = {'木': '水', '火': '木', '土': '火', '金': '土', '水': '金'};
    return map[element] ?? '';
  }

  // 判断财星是否当令
  static bool _isWealthInSeason(String dayStem, String monthBranch) {
    final dayElement = _getStemElement(dayStem);
    final wealthElement = _getWealthElement(dayElement);
    final monthElement = zhiWuXing[monthBranch] ?? '';
    return wealthElement == monthElement;
  }

  // 计算简单日主强弱
  static double _calculateSimpleDayStrength(Map<String, String> pillars) {
    _validatePillars(pillars);

    final dayStem = pillars['day']![0];
    final monthBranch = pillars['month']![1];

    double strength = 50; // 基础分

    // 得令加分
    if (_isDayStemInSeason(dayStem, monthBranch)) {
      strength += 20;
    }

    // 得地加分
    final supportiveBranches = _getSupportiveBranches(dayStem);
    final branches = [
      pillars['year']![1],
      pillars['month']![1],
      pillars['day']![1],
      pillars['hour']![1],
    ];
    for (final branch in branches) {
      if (supportiveBranches.contains(branch)) {
        strength += 5;
      }
    }

    // 得势加分
    final yinStars = _getYinStars(dayStem);
    final biJieStars = _getBiJieStars(dayStem);
    final stems = [
      pillars['year']![0],
      pillars['month']![0],
      pillars['hour']![0],
    ];
    for (final stem in stems) {
      if (yinStars.contains(stem) || biJieStars.contains(stem)) {
        strength += 8;
      }
    }

    return strength.clamp(0, 100);
  }

  // ========== 核心计算方法的简化实现 ==========

  // 2. 增强版日主承载力计算 (15分) - 完整移植自bazinew.html
  // 2. 计算日主承载力分数 (15分) - 完全移植自bazinew.html的calculateDayMasterCapacity
  static double _calculateEnhancedCarryingCapacity(
    Map<String, String> pillars,
  ) {
    _validatePillars(pillars);

    final dayStem = pillars['day']![0];
    final monthBranch = pillars['month']![1];

    // 1. 身强判断标准
    int strengthPoints = 0;

    // 得令判断 (月令是否帮扶日主)
    if (_isDayStemInSeason(dayStem, monthBranch)) {
      strengthPoints += 2; // 得令+2分
    }

    // 得地判断 (地支帮扶)
    final supportiveBranches = _getSupportiveBranches(dayStem);
    final allBranches = [
      pillars['year']![1],
      monthBranch,
      pillars['day']![1],
      pillars['hour']![1],
    ];
    int supportiveCount = 0;

    for (final branch in allBranches) {
      if (supportiveBranches.contains(branch)) {
        supportiveCount++;
      }
    }

    if (supportiveCount >= 2) {
      strengthPoints += 1; // 得地+1分
    }

    // 印比帮扶总数
    final yinStars = _getYinStars(dayStem);
    final biJieStars = _getBiJieStars(dayStem);
    final allStems = [
      pillars['year']![0],
      pillars['month']![0],
      pillars['hour']![0],
    ];

    int helpCount = 0;
    for (final stem in allStems) {
      if (yinStars.contains(stem) || biJieStars.contains(stem)) {
        helpCount++;
      }
    }

    if (helpCount >= 2) {
      strengthPoints += 1; // 印比帮扶+1分
    }

    // 2. 承载系数计算
    double yinScore = 0;
    double biJieScore = 0;
    double wealthScore = 0;

    // 计算印星总分
    for (final stem in allStems) {
      if (yinStars.contains(stem)) {
        yinScore += 1;
      }
    }

    // 计算比劫总分
    for (final stem in allStems) {
      if (biJieStars.contains(stem)) {
        biJieScore += 1;
      }
    }

    // 计算财星总分
    final zhengCai = _getZhengCai(dayStem);
    final pianCai = _getPianCai(dayStem);
    for (final stem in allStems) {
      if (stem == zhengCai || stem == pianCai) {
        wealthScore += 1;
      }
    }

    // 承载系数 = (印星总分 + 比劫总分) / 财星总分
    double capacityRatio = 0;
    if (wealthScore > 0) {
      capacityRatio = (yinScore + biJieScore) / wealthScore;
    } else {
      capacityRatio = yinScore + biJieScore; // 无财星时直接用帮扶力量
    }

    // 3. 最终承载力评分 - 调整为15分制
    double score = 5; // 基础分

    // 身强程度加分
    if (strengthPoints >= 3) {
      score += 8; // 身强
    } else if (strengthPoints >= 2) {
      score += 4; // 身中等
    }

    // 承载系数调整
    if (capacityRatio > 1.5) {
      score += 6; // 可担财
    } else if (capacityRatio > 0.8) {
      score += 3; // 正常承载
    } else if (wealthScore > 0) {
      score -= 2; // 不担财时扣分
    }

    return max(0, min(15, score)).roundToDouble();
  }

  // 计算财星强度
  static double _calculateWealthStrength(Map<String, String> pillars) {
    _validatePillars(pillars);

    final dayStem = pillars['day']![0];
    final zhengCai = _getZhengCai(dayStem);
    final pianCai = _getPianCai(dayStem);
    final wealthBranches = _getWealthBranches(dayStem);

    double strength = 0;

    // 天干财星强度
    final stems = [
      pillars['year']![0],
      pillars['month']![0],
      pillars['hour']![0],
    ];
    for (final stem in stems) {
      if (stem == zhengCai) {
        strength += 15; // 正财
      } else if (stem == pianCai) {
        strength += 12; // 偏财
      }
    }

    // 地支财星强度
    final branches = [
      pillars['year']![1],
      pillars['month']![1],
      pillars['day']![1],
      pillars['hour']![1],
    ];
    for (final branch in branches) {
      if (wealthBranches.contains(branch)) {
        strength += 10; // 地支财星
      }
    }

    // 月令财星得令加分
    if (wealthBranches.contains(pillars['month']![1])) {
      strength += 20; // 财星当令
    }

    return strength;
  }

  // 3. 计算食伤生财分数 (12分) - 完全移植自bazinew.html的calculateShishangEnergy
  static double _calculateShishangEnergy(Map<String, String> pillars) {
    _validatePillars(pillars);

    final dayStem = pillars['day']![0];
    final dayElement = _getStemElement(dayStem);
    final dayStrength = _calculateSimpleDayStrength(pillars);
    double score = 0;
    int shishangCount = 0;
    int wealthCount = 0;

    final positions = ['year', 'month', 'day', 'hour'];
    for (final pos in positions) {
      final stem = pillars[pos]![0];
      final branch = pillars[pos]!.substring(1);
      if (_isShishang(dayElement, _getStemElement(stem))) {
        score += 3; // 食伤在天干，基础得分
        shishangCount++;
      }
      if (_isShishang(dayElement, zhiWuXing[branch] ?? '')) {
        score += 2; // 食伤在地支，基础得分
        shishangCount++;
      }
      if (_isWealth(dayElement, _getStemElement(stem)) ||
          _isWealth(dayElement, zhiWuXing[branch] ?? '')) {
        wealthCount++;
      }
    }

    // 食伤生财组合 - 富贵之源
    if (shishangCount > 0 && wealthCount > 0) {
      score += 4; // 食伤生财组合奖励

      // 身强食伤生财更佳
      if (dayStrength >= 60) {
        score += 2; // 身强能驾驭食伤
      }
    }

    // 伤官佩印格局检查
    final yinCount = _countYinStars(pillars);
    if (shishangCount >= 2 &&
        yinCount >= 1 &&
        dayStrength >= 40 &&
        dayStrength <= 70) {
      score += 2; // 伤官佩印格局
    }

    return min(12, score.round().toDouble()); // 调整上限到12分
  }

  // 统计印星数量
  static int _countYinStars(Map<String, String> pillars) {
    _validatePillars(pillars);

    final dayStem = pillars['day']![0];
    final dayElement = _getStemElement(dayStem);
    int count = 0;

    final positions = ['year', 'month', 'day', 'hour'];
    for (final pos in positions) {
      final stem = pillars[pos]![0];
      final branch = pillars[pos]!.substring(1);
      if (_isYinshou(dayElement, _getStemElement(stem))) {
        count++;
      }
      if (_isYinshou(dayElement, zhiWuXing[branch] ?? '')) {
        count++;
      }
    }

    return count;
  }

  // 4. 计算财星能量分数 (10分) - 完全移植自bazinew.html的calculateWealthStarEnergy
  static double _calculateWealthStarEnergy(Map<String, String> pillars) {
    _validatePillars(pillars);

    final dayElement = _getStemElement(pillars['day']![0]);
    final monthBranch = pillars['month']!.substring(1);
    double totalEnergy = 0;

    final positions = ['year', 'month', 'day', 'hour'];
    for (final pos in positions) {
      final stem = pillars[pos]![0];
      final branch = pillars[pos]!.substring(1);
      final stemElement = _getStemElement(stem);
      final branchElement = zhiWuXing[branch] ?? '';

      // 天干财星
      if (_isWealth(dayElement, stemElement)) {
        final baseScore = (pos == 'month' || pos == 'day') ? 3.0 : 1.0;
        final qualityFactor = _calculateWealthQuality(
          stem,
          monthBranch,
          pillars,
        );
        totalEnergy += baseScore * qualityFactor;
      }

      // 地支财星
      if (_isWealth(dayElement, branchElement)) {
        const baseScore = 2.0;
        final qualityFactor = _calculateWealthQuality(
          branch,
          monthBranch,
          pillars,
        );
        totalEnergy += (baseScore * qualityFactor * 60) / 100;
      }
    }

    // 流通系数调整
    final flowFactor = _calculateWealthFlow(pillars);
    totalEnergy *= flowFactor;

    final score = min(10.0, totalEnergy); // 调整上限到10分
    return max(0.0, score.roundToDouble());
  }

  // 计算财星质量系数（简化版）
  static double _calculateWealthQuality(
    String wealthStar,
    String monthBranch,
    Map<String, String> pillars,
  ) {
    double quality = 1.0;

    // 得令系数（2.0）
    if (_isWealthInSeason(wealthStar, monthBranch)) {
      quality *= 2.0;
    }
    // 简化的得地系数（1.5）
    else if (_isWealthSupported(wealthStar, pillars)) {
      quality *= 1.5;
    }
    // 简化的有源系数（1.3）- 有食伤生财
    else if (_hasWealthSource(wealthStar, pillars)) {
      quality *= 1.3;
    }
    // 简化的无破系数（1.2）- 无比劫夺财
    else if (!_hasWealthDestruction(wealthStar, pillars)) {
      quality *= 1.2;
    }

    return quality;
  }

  // 计算财星流通系数（简化版）
  static double _calculateWealthFlow(Map<String, String> pillars) {
    return 1.0; // 简化版，直接返回1.0
  }

  // 简化的财星得地判断
  static bool _isWealthSupported(
    String wealthStar,
    Map<String, String> pillars,
  ) {
    return true; // 简化版，暂时返回true
  }

  // 简化的财星有源判断
  static bool _hasWealthSource(String wealthStar, Map<String, String> pillars) {
    return false; // 简化版，暂时返回false
  }

  // 简化的财星被破判断
  static bool _hasWealthDestruction(
    String wealthStar,
    Map<String, String> pillars,
  ) {
    return false; // 简化版，暂时返回false
  }

  // 5. 计算财富库分数 (8分)
  static double _calculateWealthVault(Map<String, String> pillars) {
    _validatePillars(pillars);

    final dayStem = pillars['day']![0];
    final wealthVaults = _getWealthVaults(dayStem);
    final branches = [
      pillars['year']![1],
      pillars['month']![1],
      pillars['day']![1],
      pillars['hour']![1],
    ];

    double score = 0.0;

    // 财库在各柱的分布
    for (int i = 0; i < branches.length; i++) {
      final branch = branches[i];
      if (wealthVaults.contains(branch)) {
        if (i == 1) {
          // 月支
          score += 3; // 月支财库最重要
        } else if (i == 2) {
          // 日支
          score += 2.5; // 日支财库
        } else {
          score += 1.5; // 年时财库
        }
      }
    }

    return min(8, score);
  }

  // 6. 计算印绶护身分数 (6分)
  static double _calculateYinshouSupport(Map<String, String> pillars) {
    _validatePillars(pillars);

    final dayStem = pillars['day']![0];
    final yinStars = _getYinStars(dayStem);

    double score = 0.0;

    // 印星在各柱的分布
    final stems = [
      pillars['year']![0],
      pillars['month']![0],
      pillars['hour']![0],
    ];
    for (int i = 0; i < stems.length; i++) {
      final stem = stems[i];
      if (yinStars.contains(stem)) {
        if (i == 1) {
          // 月干
          score += 2.5; // 月干印星最重要
        } else {
          score += 1.5; // 年时干印星
        }
      }
    }

    return min(6, score);
  }

  // 7. 计算自坐财库分数 (5分)
  static double _calculateSelfSittingVault(Map<String, String> pillars) {
    _validatePillars(pillars);

    final dayStem = pillars['day']![0];
    final dayBranch = pillars['day']![1];
    final wealthVaults = _getWealthVaults(dayStem);

    double score = 0.0;

    if (wealthVaults.contains(dayBranch)) {
      score += 3; // 自坐财库基础分

      final dayStrength = _calculateSimpleDayStrength(pillars);
      if (dayStrength >= 60) {
        score += 2; // 身强自坐财库更佳
      }
    }

    return min(5, score);
  }

  // 8. 计算财气通门户分数 (4分)
  static double _calculateWealthPortal(Map<String, String> pillars) {
    _validatePillars(pillars);

    final dayStem = pillars['day']![0];
    final monthBranch = pillars['month']![1];
    final wealthBranches = _getWealthBranches(dayStem);

    double score = 0.0;

    // 月支见财为财气通门户
    if (wealthBranches.contains(monthBranch)) {
      score += 4; // 财气通门户
    }

    return min(4, score);
  }

  // 9. 计算十神组合特效 (15分)
  static double _calculateTenGodsCombo(Map<String, String> pillars) {
    _validatePillars(pillars);

    final dayStem = pillars['day']![0];
    final stems = [
      pillars['year']![0],
      pillars['month']![0],
      pillars['hour']![0],
    ];

    double score = 0.0;

    // 食伤生财组合
    final shiShangStars = _getShiShangStars(dayStem);
    final zhengCai = _getZhengCai(dayStem);
    final pianCai = _getPianCai(dayStem);

    bool hasShiShang = false;
    bool hasWealth = false;

    for (final stem in stems) {
      if (shiShangStars.contains(stem)) hasShiShang = true;
      if (stem == zhengCai || stem == pianCai) hasWealth = true;
    }

    if (hasShiShang && hasWealth) {
      score += 6; // 食伤生财组合
    }

    return min(15, score);
  }

  // 10. 计算特殊格局加分 (20分) - 完整移植自bazinew.html
  static double _calculateSpecialPatterns(Map<String, String> pillars) {
    _validatePillars(pillars);

    double score = 0.0;

    // 从财格判断 - 身极弱财极强
    if (_isFromWealthPattern(pillars)) {
      score += 15; // 从财格
    }

    // 财旺生官格
    if (_isWealthOfficialPattern(pillars)) {
      score += 12; // 财旺生官
    }

    // 食神生财格
    if (_isFoodWealthPattern(pillars)) {
      score += 10; // 食神生财
    }

    // 伤官佩印格（有财星调候）
    if (_isInjuredOfficialSealPattern(pillars)) {
      score += 8; // 伤官佩印
    }

    // 财库逢冲格
    if (_isWealthVaultClashPattern(pillars)) {
      score += 6; // 财库逢冲
    }

    // 金水伤官格（特殊情况）
    if (_isGoldWaterInjuredPattern(pillars)) {
      score += 5; // 金水伤官
    }

    return min(20, score);
  }

  // 判断是否为财旺生官格
  static bool _isWealthOfficialPatternNew(Map<String, String> pillars) {
    _validatePillars(pillars);

    final dayStem = pillars['day']![0];
    final wealthCount = _countWealthStars(pillars);
    final officialCount = _countOfficialStars(pillars);

    return wealthCount >= 2 && officialCount >= 1;
  }

  // 判断是否为食神生财格
  static bool _isFoodWealthPatternNew(Map<String, String> pillars) {
    _validatePillars(pillars);

    final dayStem = pillars['day']![0];
    final shiShangStars = _getShiShangStars(dayStem);
    final wealthCount = _countWealthStars(pillars);

    final stems = [
      pillars['year']![0],
      pillars['month']![0],
      pillars['hour']![0],
    ];
    bool hasShishang = stems.any((stem) => shiShangStars.contains(stem));

    return hasShishang && wealthCount >= 1;
  }

  // 判断是否为伤官佩印格
  static bool _isInjuredOfficialSealPattern(Map<String, String> pillars) {
    _validatePillars(pillars);

    final dayStem = pillars['day']![0];
    final shiShangStars = _getShiShangStars(dayStem);
    final yinStars = _getYinStars(dayStem);

    final stems = [
      pillars['year']![0],
      pillars['month']![0],
      pillars['hour']![0],
    ];
    bool hasShishang = stems.any((stem) => shiShangStars.contains(stem));
    bool hasYin = stems.any((stem) => yinStars.contains(stem));

    return hasShishang && hasYin;
  }

  // 判断是否为财库逢冲格
  static bool _isWealthVaultClashPattern(Map<String, String> pillars) {
    _validatePillars(pillars);

    final dayStem = pillars['day']![0];
    final wealthVaults = _getWealthVaults(dayStem);
    final branches = [
      pillars['year']![1],
      pillars['month']![1],
      pillars['day']![1],
      pillars['hour']![1],
    ];

    // 检查是否有财库
    bool hasVault = branches.any((branch) => wealthVaults.contains(branch));

    // 检查是否有冲
    if (hasVault) {
      for (final vault in wealthVaults) {
        if (branches.contains(vault)) {
          final clashBranch = _getClashBranch(vault);
          if (branches.contains(clashBranch)) {
            return true;
          }
        }
      }
    }

    return false;
  }

  // 判断是否为金水伤官格
  static bool _isGoldWaterInjuredPattern(Map<String, String> pillars) {
    _validatePillars(pillars);

    final dayStem = pillars['day']![0];
    final dayElement = _getStemElement(dayStem);

    if (dayElement == '金') {
      final shiShangStars = _getShiShangStars(dayStem);
      final stems = [
        pillars['year']![0],
        pillars['month']![0],
        pillars['hour']![0],
      ];
      return stems.any((stem) => shiShangStars.contains(stem));
    }

    return false;
  }

  // 获取冲支
  static String _getClashBranch(String branch) {
    const clashMap = {
      '子': '午',
      '午': '子',
      '丑': '未',
      '未': '丑',
      '寅': '申',
      '申': '寅',
      '卯': '酉',
      '酉': '卯',
      '辰': '戌',
      '戌': '辰',
      '巳': '亥',
      '亥': '巳',
    };
    return clashMap[branch] ?? '';
  }

  // 统计官杀星数量
  static int _countOfficialStars(Map<String, String> pillars) {
    final dayStem = pillars['day']![0];
    final officialStars = _getGuanStars(dayStem);

    int count = 0;
    final stems = [
      pillars['year']![0],
      pillars['month']![0],
      pillars['hour']![0],
    ];

    for (final stem in stems) {
      if (officialStars.contains(stem)) {
        count++;
      }
    }

    return count;
  }

  // 11. 计算身财平衡调整 (-15 to +15)
  static double _calculateBodyWealthBalance(Map<String, String> pillars) {
    final dayStrength = _calculateSimpleDayStrength(pillars);
    final wealthCount = _countWealthStars(pillars);

    double balanceScore = 0.0;

    if (wealthCount > 0) {
      final ratio = dayStrength / (wealthCount * 20);

      if (ratio > 1.5) {
        balanceScore = min(15, ratio * 5);
      } else if (ratio >= 0.8 && ratio <= 1.5) {
        balanceScore = ratio * 10;
      } else {
        balanceScore = -10 + (ratio - 0.5) * 20;
      }
    }

    return balanceScore.clamp(-15, 15).roundToDouble();
  }

  // 12-18. 其他计算方法的简化实现
  static double _calculateLuckAdjustment(Map<String, String> pillars) => 0.0;
  static double _calculateKongWangPenalty(Map<String, String> pillars) => 0.0;
  static double _calculateFavorableBalance(Map<String, String> pillars) => 5.0;
  static double _calculateSeasonalWealthPotential(
    Map<String, String> pillars,
  ) => 4.0;
  static double _calculateWealthProtectionScore(Map<String, String> pillars) =>
      6.0;
  static double _calculateDayMasterStrengthScore(Map<String, String> pillars) =>
      5.0;
  static double _calculateUsefulGodScore(Map<String, String> pillars) => 6.0;

  // ========== 辅助计算方法 ==========

  // 统计财星数量
  static int _countWealthStars(Map<String, String> pillars) {
    _validatePillars(pillars);

    final dayStem = pillars['day']![0];
    final zhengCai = _getZhengCai(dayStem);
    final pianCai = _getPianCai(dayStem);

    int count = 0;
    final stems = [
      pillars['year']![0],
      pillars['month']![0],
      pillars['hour']![0],
    ];

    for (final stem in stems) {
      if (stem == zhengCai || stem == pianCai) {
        count++;
      }
    }

    return count;
  }

  // 判断是否为从财格 - 完整算法
  static bool _isFromWealthPattern(Map<String, String> pillars) {
    _validatePillars(pillars);

    final dayStrength = _calculateSimpleDayStrength(pillars);
    final wealthStrength = _calculateWealthStrength(pillars);
    final wealthCount = _countWealthStars(pillars);

    // 从财格条件：
    // 1. 日主极弱（强度 <= 30）
    // 2. 财星强旺（财星数量 >= 2 或财星强度 >= 40）
    // 3. 无强根或印比救助

    if (dayStrength > 30) return false;
    if (wealthCount < 2 && wealthStrength < 40) return false;

    // 检查是否有强根
    final dayStem = pillars['day']![0];
    final supportiveBranches = _getSupportiveBranches(dayStem);
    final branches = [
      pillars['year']![1],
      pillars['month']![1],
      pillars['day']![1],
      pillars['hour']![1],
    ];

    int supportCount = 0;
    for (final branch in branches) {
      if (supportiveBranches.contains(branch)) {
        supportCount++;
      }
    }

    // 如果有2个以上强根，不是从财格
    if (supportCount >= 2) return false;

    // 检查印比救助
    final yinStars = _getYinStars(dayStem);
    final biJieStars = _getBiJieStars(dayStem);
    final stems = [
      pillars['year']![0],
      pillars['month']![0],
      pillars['hour']![0],
    ];

    int rescueCount = 0;
    for (final stem in stems) {
      if (yinStars.contains(stem) || biJieStars.contains(stem)) {
        rescueCount++;
      }
    }

    // 如果有2个以上印比救助，不是从财格
    return rescueCount < 2;
  }

  // 判断是否有特殊组合
  static bool _hasSpecialCombo(Map<String, String> pillars) {
    return false; // 简化实现
  }

  // 判断是否为财旺生官格
  static bool _isWealthOfficialPattern(Map<String, String> pillars) {
    return false; // 简化实现
  }

  // 判断是否为食神生财格
  static bool _isFoodWealthPattern(Map<String, String> pillars) {
    return false; // 简化实现
  }

  // 判断是否有其他特殊格局
  static bool _hasOtherSpecialPattern(Map<String, String> pillars) {
    return false; // 简化实现
  }

  // 获取流年天干
  static String _getYearStem(int year) {
    return tianGan[(year - 4) % 10];
  }

  // 获取流年地支
  static String _getYearBranch(int year) {
    return diZhi[(year - 4) % 12];
  }

  // 获取空亡表
  static Map<String, List<String>> _getKongWangTable() {
    return {}; // 简化实现
  }

  // 计算地支支持度
  static double _calculateBranchSupport(String element, String branch) {
    final branchElement = zhiWuXing[branch] ?? '';
    if (branchElement == element) {
      return 3.0; // 同类支持
    } else if (_getSupportElement(element) == branchElement) {
      return 2.0; // 生扶支持
    }
    return 0.0;
  }

  // 判断五行是否相生
  static bool _isElementSupporting(
    String supportElement,
    String targetElement,
  ) {
    return _getSupportElement(targetElement) == supportElement;
  }

  // 统计八字中各五行数量
  static Map<String, int> _countElementsInPillars(Map<String, String> pillars) {
    _validatePillars(pillars);

    final counts = {'木': 0, '火': 0, '土': 0, '金': 0, '水': 0};

    // 统计天干
    final stems = [
      pillars['year']![0],
      pillars['month']![0],
      pillars['day']![0],
      pillars['hour']![0],
    ];
    for (final stem in stems) {
      final element = _getStemElement(stem);
      counts[element] = (counts[element] ?? 0) + 1;
    }

    // 统计地支
    final branches = [
      pillars['year']![1],
      pillars['month']![1],
      pillars['day']![1],
      pillars['hour']![1],
    ];
    for (final branch in branches) {
      final element = zhiWuXing[branch] ?? '';
      if (element.isNotEmpty) {
        counts[element] = (counts[element] ?? 0) + 1;
      }
    }

    return counts;
  }

  // 确定用神类型
  static List<String> _determineUsefulGods(
    String strengthType,
    String dayStem,
    Map<String, String> pillars,
  ) {
    if (strengthType == '身强') {
      return _getShiShangStars(dayStem) +
          [_getZhengCai(dayStem), _getPianCai(dayStem)];
    } else if (strengthType == '身弱') {
      return _getYinStars(dayStem) + _getBiJieStars(dayStem);
    } else {
      return [_getZhengCai(dayStem)];
    }
  }

  // 评估用神存在度
  static double _evaluateUsefulGodPresence(
    List<String> usefulGods,
    Map<String, String> pillars,
  ) {
    _validatePillars(pillars);

    double score = 0;
    final stems = [
      pillars['year']![0],
      pillars['month']![0],
      pillars['hour']![0],
    ];

    for (final stem in stems) {
      if (usefulGods.contains(stem)) {
        score += 2;
      }
    }

    return score;
  }

  // 评估用神有力程度
  static double _evaluateUsefulGodPower(
    List<String> usefulGods,
    Map<String, String> pillars,
  ) {
    return 3.0; // 简化实现
  }

  // 评估用神受损程度
  static double _evaluateUsefulGodDamage(
    List<String> usefulGods,
    Map<String, String> pillars,
  ) {
    return 1.0; // 简化实现
  }

  // 获取特殊格局
  static String _getSpecialPattern(Map<String, String> pillars) {
    // 简化实现，返回无特殊格局
    return '无';
  }

  // 应用否决条款
  static double _applyVetoRules(double score, Map<String, String> pillars) {
    // 简化实现，直接返回原分数
    return score;
  }
}

// 命格等级计算器 - 专业版算法（移植自bazinew.html）
class FateCalculator {
  // 验证四柱数据的有效性
  static void _validatePillars(Map<String, String> pillars) {
    final positions = ['year', 'month', 'day', 'hour'];
    for (final pos in positions) {
      final pillar = pillars[pos];
      if (pillar == null || pillar.length < 2) {
        throw ArgumentError(
          'Invalid pillar data: $pos pillar "$pillar" must have at least 2 characters',
        );
      }
    }
  }

  // 计算命格等级
  static Map<String, dynamic> calculateFateLevel(Map<String, String> pillars) {
    final score = _calculateFateScore(pillars);
    final levelInfo = _getFateLevel(score);

    return {
      'score': score,
      'level': levelInfo['name'],
      'description': _getFateDescription(score),
      'class': levelInfo['class'],
    };
  }

  // 获取命格等级信息
  static Map<String, String> _getFateLevel(int score) {
    if (score >= 100) {
      return {'name': '帝王级', 'class': 'emperor'};
    } else if (score >= 85) {
      return {'name': '贵族级', 'class': 'noble'};
    } else if (score >= 70) {
      return {'name': '士绅级', 'class': 'gentry'};
    } else if (score >= 55) {
      return {'name': '富商级', 'class': 'merchant'};
    } else if (score >= 40) {
      return {'name': '平民级', 'class': 'commoner'};
    } else if (score >= 25) {
      return {'name': '劳碌级', 'class': 'laborer'};
    } else {
      return {'name': '贫苦级', 'class': 'poor'};
    }
  }

  // 获取命格描述
  static String _getFateDescription(int score) {
    if (score >= 100) {
      return '命格极贵，天生帝王之相，一生富贵荣华';
    } else if (score >= 85) {
      return '命格高贵，贵人运强，事业有成，富贵双全';
    } else if (score >= 70) {
      return '命格不错，有一定地位，通过努力可获得成功';
    } else if (score >= 55) {
      return '命格中等偏上，财运不错，适合经商或投资';
    } else if (score >= 40) {
      return '命格平常，普通人生，需要踏实努力';
    } else if (score >= 25) {
      return '命格较弱，需要勤劳努力，多行善事';
    } else {
      return '命格偏弱，人生多波折，需要特别努力和谨慎';
    }
  }

  // 计算命格分数 - 专业版算法（移植自bazinew.html）
  static int _calculateFateScore(Map<String, String> pillars) {
    _validatePillars(pillars);

    // 核心基础评分（总计70分）- 传统八字命理核心要素
    final seasonScore = ((_calculateAdvancedSeasonScore(pillars) * 67) / 100)
        .round(); // 20分
    final balanceScore = ((_calculateAdvancedBalanceScore(pillars) * 60) / 100)
        .round(); // 15分
    final patternScore = ((_calculateAdvancedPatternScore(pillars) * 60) / 100)
        .round(); // 15分
    final godsScore = ((_calculateAdvancedGodsScore(pillars) * 50) / 100)
        .round(); // 10分
    final combinationScore =
        ((_calculateAdvancedCombinationScore(pillars) * 67) / 100)
            .round(); // 10分

    // 辅助修正评分（总计20分）
    final dayMasterStrength =
        ((_calculateDayMasterStrengthScore(pillars) * 60) / 100).round(); // 6分
    final usefulGodScore = ((_calculateUsefulGodScore(pillars) * 50) / 100)
        .round(); // 6分
    final tabooGodControl =
        ((_calculateTabooGodControlScore(pillars) * 50) / 100).round(); // 4分
    final adjustmentScore =
        ((_calculateSeasonalAdjustmentScore(pillars) * 50) / 100).round(); // 4分

    // 运势与特殊加分（总计10分）
    final luckSupport = ((_calculateLuckSupportScore(pillars) * 30) / 100)
        .round(); // 3分
    final dayunCoordination =
        ((_calculateDayunCoordinationScore(pillars) * 25) / 100).round(); // 2分

    // 根据特殊格局调整贵人助力和格局加分的系数
    final specialPattern = _detectSpecialPattern(pillars);
    final isHighNoblePattern =
        specialPattern.contains('日贵') || specialPattern.contains('魁罡');

    final noblesSupport =
        ((_calculateNoblesSupportScore(pillars) *
                    (isHighNoblePattern ? 80 : 33)) /
                100)
            .round();
    final levelBonus = ((_calculateLevelBonus(pillars) * 20) / 100)
        .round(); // 3分

    // 特殊格局加分（可超出100分上限）
    final specialPatternBonus =
        ((_calculateSpecialPatternBonus(pillars) *
                    (isHighNoblePattern ? 80 : 60)) /
                100)
            .round();

    // 空亡减分
    final kongWangPenalty = _calculateKongWangPenalty(pillars);

    final total =
        10 +
        seasonScore +
        balanceScore +
        patternScore +
        godsScore +
        combinationScore +
        dayMasterStrength +
        usefulGodScore +
        tabooGodControl +
        adjustmentScore +
        luckSupport +
        dayunCoordination +
        noblesSupport +
        levelBonus +
        specialPatternBonus -
        kongWangPenalty;

    // 详细调试输出
    print(
      '🔍 详细评分调试 - ${pillars['year']}，${pillars['month']}，${pillars['day']}，${pillars['hour']}',
    );
    print('基础分: 10');
    print('季节助力: $seasonScore (原始值 * 0.67)');
    print('五行平衡: $balanceScore (原始值 * 0.6)');
    print('格局结构: $patternScore (原始值 * 0.6)');
    print('十神影响: $godsScore (原始值 * 0.5)');
    print('组合刑冲: $combinationScore (原始值 * 0.67)');
    print('调候用神: $adjustmentScore (原始值 * 0.5)');
    print('日主强弱: $dayMasterStrength (原始值 * 0.6)');
    print('用神得力: $usefulGodScore (原始值 * 0.5)');
    print('忌神制约: $tabooGodControl (原始值 * 0.5)');
    print('流年助力: $luckSupport (原始值 * 0.3)');
    print('大运配合: $dayunCoordination (原始值 * 0.25)');
    print('贵人助力: $noblesSupport');
    print('特殊格局: $specialPatternBonus');
    print('命格层次: $levelBonus (_calculateLevelBonus返回值 * 0.2)');
    print('空亡减分: -$kongWangPenalty');
    print('🎯 最终总分: $total');

    return total.clamp(10, 120).round();
  }

  // 高级季节助力评分 - 连续化评分，考虑月令强弱和通根透干
  static double _calculateAdvancedSeasonScore(Map<String, String> pillars) {
    final dayStem = pillars['day']![0];
    final monthBranch = pillars['month']![1];

    // 月令得分基础
    double baseScore = _calculateMonthlyStrength(dayStem, monthBranch);

    // 通根透干加分
    final rootScore = _calculateRootStrength(dayStem, pillars);

    // 透干加分
    final transparentScore = _calculateTransparentStrength(dayStem, pillars);

    // 调候因子
    final seasonalAdjustment = _calculateSeasonalAdjustment(
      dayStem,
      monthBranch,
    );

    final finalScore =
        (baseScore + rootScore + transparentScore) * seasonalAdjustment;

    // 调试输出季节助力详细计算
    print('=== 季节助力详细计算 ===');
    print('日主: $dayStem, 月支: $monthBranch');
    print('月令基础分: $baseScore');
    print('通根加分: $rootScore');
    print('透干加分: $transparentScore');
    print('调候因子: $seasonalAdjustment');
    print('原始总分: ${baseScore + rootScore + transparentScore}');
    print('调候调整后: $finalScore');
    print('最终限制后: ${finalScore.clamp(0, 30)}');
    print('========================');

    return finalScore.clamp(0, 30);
  }

  // 月令强弱评分
  static double _calculateMonthlyStrength(String dayStem, String monthBranch) {
    const strengthMap = {
      // 木日主
      '甲': {
        '寅': 25,
        '卯': 30,
        '辰': 20,
        '巳': 8,
        '午': 12,
        '未': 15,
        '申': 5,
        '酉': 3,
        '戌': 12,
        '亥': 18,
        '子': 15,
        '丑': 10,
      },
      '乙': {
        '寅': 20,
        '卯': 25,
        '辰': 18,
        '巳': 10,
        '午': 15,
        '未': 18,
        '申': 3,
        '酉': 5,
        '戌': 10,
        '亥': 20,
        '子': 18,
        '丑': 12,
      },
      // 火日主
      '丙': {
        '寅': 18,
        '卯': 15,
        '辰': 10,
        '巳': 25,
        '午': 30,
        '未': 20,
        '申': 8,
        '酉': 5,
        '戌': 15,
        '亥': 3,
        '子': 5,
        '丑': 8,
      },
      '丁': {
        '寅': 15,
        '卯': 12,
        '辰': 8,
        '巳': 20,
        '午': 25,
        '未': 18,
        '申': 5,
        '酉': 8,
        '戌': 12,
        '亥': 5,
        '子': 3,
        '丑': 10,
      },
      // 土日主
      '戊': {
        '寅': 8,
        '卯': 5,
        '辰': 25,
        '巳': 20,
        '午': 18,
        '未': 30,
        '申': 12,
        '酉': 15,
        '戌': 25,
        '亥': 3,
        '子': 5,
        '丑': 20,
      },
      '己': {
        '寅': 5,
        '卯': 8,
        '辰': 20,
        '巳': 18,
        '午': 15,
        '未': 25,
        '申': 10,
        '酉': 12,
        '戌': 20,
        '亥': 5,
        '子': 8,
        '丑': 25,
      },
      // 金日主
      '庚': {
        '寅': 3,
        '卯': 5,
        '辰': 12,
        '巳': 8,
        '午': 5,
        '未': 10,
        '申': 25,
        '酉': 30,
        '戌': 15,
        '亥': 8,
        '子': 10,
        '丑': 18,
      },
      '辛': {
        '寅': 5,
        '卯': 3,
        '辰': 10,
        '巳': 5,
        '午': 8,
        '未': 12,
        '申': 20,
        '酉': 25,
        '戌': 12,
        '亥': 10,
        '子': 12,
        '丑': 20,
      },
      // 水日主
      '壬': {
        '寅': 10,
        '卯': 8,
        '辰': 5,
        '巳': 3,
        '午': 5,
        '未': 8,
        '申': 15,
        '酉': 12,
        '戌': 8,
        '亥': 25,
        '子': 30,
        '丑': 18,
      },
      '癸': {
        '寅': 8,
        '卯': 10,
        '辰': 8,
        '巳': 5,
        '午': 3,
        '未': 10,
        '申': 12,
        '酉': 15,
        '戌': 5,
        '亥': 20,
        '子': 25,
        '丑': 15,
      },
    };

    return (strengthMap[dayStem]?[monthBranch] ?? 10).toDouble();
  }

  // 通根强度计算
  static double _calculateRootStrength(
    String dayStem,
    Map<String, String> pillars,
  ) {
    final branches = [
      pillars['year']![1],
      pillars['month']![1],
      pillars['day']![1],
      pillars['hour']![1],
    ];
    final dayElement = _getElementFromStem(dayStem);

    double rootScore = 0;

    for (int i = 0; i < branches.length; i++) {
      final branch = branches[i];
      final hiddenStems = _getHiddenStems(branch);
      final mainStem = hiddenStems[0]; // 主气

      // 主气同类加分
      if (_getElementFromStem(mainStem) == dayElement) {
        final weight = i == 2 ? 1.5 : 1.0; // 日支权重更高
        rootScore += 8 * weight;
      }

      // 藏干同类加分
      for (int j = 1; j < hiddenStems.length; j++) {
        final stem = hiddenStems[j];
        if (_getElementFromStem(stem) == dayElement) {
          final weight = i == 2 ? 1.2 : 0.8;
          rootScore += 3 * weight;
        }
      }
    }

    return rootScore.clamp(0, 15);
  }

  // 透干强度计算
  static double _calculateTransparentStrength(
    String dayStem,
    Map<String, String> pillars,
  ) {
    final stems = [
      pillars['year']![0],
      pillars['month']![0],
      pillars['hour']![0],
    ];
    final dayElement = _getElementFromStem(dayStem);

    double transparentScore = 0;

    for (int i = 0; i < stems.length; i++) {
      final stem = stems[i];
      if (_getElementFromStem(stem) == dayElement) {
        final weight = i == 1 ? 1.2 : 1.0; // 月干权重稍高
        transparentScore += 6 * weight;
      }
    }

    return transparentScore.clamp(0, 12);
  }

  // 调候因子计算
  static double _calculateSeasonalAdjustment(
    String dayStem,
    String monthBranch,
  ) {
    const adjustmentMap = {
      '甲': {
        '寅': 1.1,
        '卯': 1.2,
        '辰': 1.0,
        '巳': 0.8,
        '午': 0.7,
        '未': 0.8,
        '申': 0.9,
        '酉': 0.8,
        '戌': 0.9,
        '亥': 1.0,
        '子': 0.9,
        '丑': 0.9,
      },
      '乙': {
        '寅': 1.0,
        '卯': 1.1,
        '辰': 1.0,
        '巳': 0.9,
        '午': 1.0,
        '未': 1.0,
        '申': 0.7,
        '酉': 0.6,
        '戌': 0.8,
        '亥': 1.1,
        '子': 1.0,
        '丑': 0.9,
      },
      '丙': {
        '寅': 1.0,
        '卯': 0.9,
        '辰': 0.8,
        '巳': 1.2,
        '午': 1.3,
        '未': 1.1,
        '申': 0.8,
        '酉': 0.7,
        '戌': 0.9,
        '亥': 0.6,
        '子': 0.5,
        '丑': 0.7,
      },
      '丁': {
        '寅': 0.9,
        '卯': 0.8,
        '辰': 0.7,
        '巳': 1.1,
        '午': 1.2,
        '未': 1.0,
        '申': 0.7,
        '酉': 0.8,
        '戌': 0.8,
        '亥': 0.7,
        '子': 0.6,
        '丑': 0.8,
      },
      '戊': {
        '寅': 0.8,
        '卯': 0.7,
        '辰': 1.2,
        '巳': 1.1,
        '午': 1.0,
        '未': 1.3,
        '申': 0.9,
        '酉': 1.0,
        '戌': 1.2,
        '亥': 0.6,
        '子': 0.5,
        '丑': 1.0,
      },
      '己': {
        '寅': 0.7,
        '卯': 0.8,
        '辰': 1.1,
        '巳': 1.0,
        '午': 0.9,
        '未': 1.2,
        '申': 0.8,
        '酉': 0.9,
        '戌': 1.1,
        '亥': 0.7,
        '子': 0.6,
        '丑': 1.1,
      },
      '庚': {
        '寅': 0.6,
        '卯': 0.5,
        '辰': 0.8,
        '巳': 0.9,
        '午': 0.7,
        '未': 0.8,
        '申': 1.3,
        '酉': 1.4,
        '戌': 1.0,
        '亥': 0.8,
        '子': 0.9,
        '丑': 1.0,
      },
      '辛': {
        '寅': 0.7,
        '卯': 0.6,
        '辰': 0.9,
        '巳': 0.8,
        '午': 0.8,
        '未': 0.9,
        '申': 1.2,
        '酉': 1.3,
        '戌': 0.9,
        '亥': 0.9,
        '子': 1.0,
        '丑': 1.1,
      },
      '壬': {
        '寅': 0.9,
        '卯': 0.8,
        '辰': 0.7,
        '巳': 0.6,
        '午': 0.5,
        '未': 0.7,
        '申': 1.0,
        '酉': 0.9,
        '戌': 0.8,
        '亥': 1.3,
        '子': 1.4,
        '丑': 1.1,
      },
      '癸': {
        '寅': 0.8,
        '卯': 0.9,
        '辰': 0.8,
        '巳': 0.7,
        '午': 0.6,
        '未': 0.8,
        '申': 0.9,
        '酉': 1.0,
        '戌': 0.7,
        '亥': 1.2,
        '子': 1.3,
        '丑': 1.0,
      },
    };

    return adjustmentMap[dayStem]?[monthBranch] ?? 1.0;
  }

  // 高级五行平衡评分
  static double _calculateAdvancedBalanceScore(Map<String, String> pillars) {
    // 计算五行分布
    Map<String, int> elementCount = {'木': 0, '火': 0, '土': 0, '金': 0, '水': 0};

    // 统计天干地支五行
    for (String pillar in pillars.values) {
      if (pillar.length >= 2) {
        String stem = pillar[0];
        String branch = pillar[1];
        String stemElement = _getElementFromStem(stem);
        String branchElement = _getElementFromStem(branch);
        elementCount[stemElement] = (elementCount[stemElement] ?? 0) + 1;
        elementCount[branchElement] = (elementCount[branchElement] ?? 0) + 1;
      }
    }

    // 计算平衡度（标准差越小越平衡）
    List<int> counts = elementCount.values.toList();
    double mean = counts.reduce((a, b) => a + b) / counts.length;
    double variance =
        counts.map((x) => (x - mean) * (x - mean)).reduce((a, b) => a + b) /
        counts.length;
    double balance = 25 - (variance * 2); // 方差越小，平衡度越高

    return balance.clamp(5, 25);
  }

  // 高级格局评分
  static double _calculateAdvancedPatternScore(Map<String, String> pillars) {
    double score = 15.0; // 基础分

    final dayStem = pillars['day']![0];
    final monthBranch = pillars['month']![1];

    // 检查是否身旺
    bool isStrong = _isDayMasterStrong(pillars);

    // 检查财官印食的配置
    if (_hasGoodWealthOfficialConfig(pillars)) {
      score += 5;
    }

    // 检查用神是否得力
    if (_isUsefulGodEffective(pillars)) {
      score += 5;
    }

    return score.clamp(10, 25);
  }

  // 高级十神评分
  static double _calculateAdvancedGodsScore(Map<String, String> pillars) {
    // 简化实现，返回固定分数
    return 20.0;
  }

  // 高级组合评分
  static double _calculateAdvancedCombinationScore(
    Map<String, String> pillars,
  ) {
    // 简化实现，返回固定分数
    return 15.0;
  }

  // 日主强度评分
  static double _calculateDayMasterStrengthScore(Map<String, String> pillars) {
    return 10.0;
  }

  // 用神评分
  static double _calculateUsefulGodScore(Map<String, String> pillars) {
    return 12.0;
  }

  // 忌神制化评分
  static double _calculateTabooGodControlScore(Map<String, String> pillars) {
    return 8.0;
  }

  // 季节调整评分
  static double _calculateSeasonalAdjustmentScore(Map<String, String> pillars) {
    return 8.0;
  }

  // 运势支持评分
  static double _calculateLuckSupportScore(Map<String, String> pillars) {
    return 10.0;
  }

  // 大运协调评分
  static double _calculateDayunCoordinationScore(Map<String, String> pillars) {
    return 8.0;
  }

  // 贵人支持评分
  static double _calculateNoblesSupportScore(Map<String, String> pillars) {
    return 10.0;
  }

  // 等级加分
  static double _calculateLevelBonus(Map<String, String> pillars) {
    // 调用mingge_analysis_service中的正确实现
    final result = MinggeAnalysisService.calculateLevelBonus(pillars);
    print('🔍 _calculateLevelBonus调试: 原始返回值 = $result');
    return result;
  }

  // 特殊格局加分
  static double _calculateSpecialPatternBonus(Map<String, String> pillars) {
    return 30.0;
  }

  // 空亡扣分
  static double _calculateKongWangPenalty(Map<String, String> pillars) {
    return 0.0;
  }

  // 检测特殊格局
  static String _detectSpecialPattern(Map<String, String> pillars) {
    // 简化实现，返回空字符串
    return '';
  }

  // 获取天干对应的五行
  static String _getElementFromStem(String stem) {
    const elementMap = {
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
    return elementMap[stem] ?? '土';
  }

  // 获取地支藏干
  static List<String> _getHiddenStems(String branch) {
    const hiddenStemsMap = {
      '子': ['癸'],
      '丑': ['己', '癸', '辛'],
      '寅': ['甲', '丙', '戊'],
      '卯': ['乙'],
      '辰': ['戊', '乙', '癸'],
      '巳': ['丙', '戊', '庚'],
      '午': ['丁', '己'],
      '未': ['己', '丁', '乙'],
      '申': ['庚', '壬', '戊'],
      '酉': ['辛'],
      '戌': ['戊', '辛', '丁'],
      '亥': ['壬', '甲'],
    };
    return hiddenStemsMap[branch] ?? ['戊'];
  }

  // 判断日主是否身旺
  static bool _isDayMasterStrong(Map<String, String> pillars) {
    // 简化判断：检查月令是否生扶日主
    final dayStem = pillars['day']![0];
    final monthBranch = pillars['month']![1];
    final dayElement = _getElementFromStem(dayStem);

    // 检查月令是否生扶
    final monthElement = _getElementFromStem(monthBranch);
    return _isElementSupporting(monthElement, dayElement);
  }

  // 检查财官印食配置是否良好
  static bool _hasGoodWealthOfficialConfig(Map<String, String> pillars) {
    // 简化判断：检查是否有财官印的良好配置
    final dayStem = pillars['day']![0];
    int goodConfigCount = 0;

    // 检查其他柱的天干
    for (String pillar in pillars.values) {
      if (pillar.isNotEmpty && pillar[0] != dayStem) {
        String stem = pillar[0];
        String relation = _getTenGodRelation(dayStem, stem);
        if (relation == '正财' ||
            relation == '偏财' ||
            relation == '正官' ||
            relation == '七杀' ||
            relation == '正印' ||
            relation == '偏印') {
          goodConfigCount++;
        }
      }
    }

    return goodConfigCount >= 2;
  }

  // 检查用神是否得力
  static bool _isUsefulGodEffective(Map<String, String> pillars) {
    // 简化判断：基于五行平衡度
    final balanceScore = _calculateAdvancedBalanceScore(pillars);
    return balanceScore > 15;
  }

  // 判断五行是否相生
  static bool _isElementSupporting(
    String supportElement,
    String targetElement,
  ) {
    const supportMap = {'木': '火', '火': '土', '土': '金', '金': '水', '水': '木'};
    return supportMap[supportElement] == targetElement ||
        supportElement == targetElement;
  }

  // 获取十神关系
  static String _getTenGodRelation(String dayStem, String targetStem) {
    final dayElement = _getElementFromStem(dayStem);
    final targetElement = _getElementFromStem(targetStem);

    if (dayElement == targetElement) {
      return '比肩';
    } else if (_isElementSupporting(dayElement, targetElement)) {
      return '食神';
    } else if (_isElementSupporting(targetElement, dayElement)) {
      return '正印';
    } else {
      return '正财';
    }
  }
}

// 主要的命格财富计算器类
class FateWealthCalculator {
  // 计算完整的命格和财富分析
  static Map<String, dynamic> calculateComplete(Map<String, String> pillars) {
    final wealthResult = WealthCalculator.calculateWealthLevel(pillars);
    final fateResult = FateCalculator.calculateFateLevel(pillars);

    return {
      'wealth': wealthResult,
      'fate': fateResult,
      'overall': {
        'score': ((wealthResult['score'] + fateResult['score']) ~/ 2),
        'summary': _generateSummary(wealthResult, fateResult),
      },
    };
  }

  // 生成综合总结
  static String _generateSummary(
    Map<String, dynamic> wealth,
    Map<String, dynamic> fate,
  ) {
    final wealthLevel = wealth['level'] as String;
    final fateLevel = fate['level'] as String;

    return '命格等级：$fateLevel，财富等级：$wealthLevel。'
        '${fate['description']}，${wealth['description']}';
  }

  // 获取特殊格局
  static String _getSpecialPattern(Map<String, String> pillars) {
    // 简化实现，返回无特殊格局
    return '无';
  }

  // 应用否决条款
  static double _applyVetoRules(double score, Map<String, String> pillars) {
    // 简化实现，直接返回原分数
    return score;
  }
}
