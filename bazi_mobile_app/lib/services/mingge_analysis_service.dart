
class MinggeAnalysisService {
  // 全局变量，用于缓存评分详情
  static Map<String, dynamic>? _fateScoreDetails;
  static double _fateScoreValue = 0;

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

  // 月令强弱评分表
  static const Map<String, Map<String, double>> monthlyStrengthMap = {
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

  // 调候因子表
  static const Map<String, Map<String, double>> seasonalAdjustmentMap = {
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

  // 计算命格等级 - 完全按照baziphone.html算法
  static Map<String, dynamic> calculateMinggeLevel(
    Map<String, String> pillars,
  ) {
    final score = calculateFateScore(pillars);
    final levelInfo = getFateLevel(score);

    return {
      'score': score,
      'level': levelInfo['name'],
      'description': getFateDescription(score),
      'details': _fateScoreDetails,
    };
  }

  static Map<String, dynamic> analyzeMingge(Map<String, String> pillars) {
    final score = calculateFateScore(pillars);
    final levelInfo = getFateLevel(score);

    return {
      'score': score,
      'level': levelInfo['name'],
      'description': getFateDescription(score),
      'details': _fateScoreDetails ?? {},
      // 兼容原有字段
      'finalScore': score,
      'baseTotal': _fateScoreDetails?['baseScore'] ?? 0,
      'seasonScore': _fateScoreDetails?['seasonScore'] ?? 0,
      'balanceScore': _fateScoreDetails?['balanceScore'] ?? 0,
      'patternScore': _fateScoreDetails?['patternScore'] ?? 0,
      'godsScore': _fateScoreDetails?['godsScore'] ?? 0,
      'combinationScore': _fateScoreDetails?['combinationScore'] ?? 0,
      'adjustmentScore': _fateScoreDetails?['adjustmentScore'] ?? 0,
      'strengthScore': _fateScoreDetails?['dayMasterStrength'] ?? 0,
      'favorableScore': _fateScoreDetails?['usefulGodScore'] ?? 0,
      'unfavorableScore': _fateScoreDetails?['tabooGodControl'] ?? 0,
      'voidScore': _fateScoreDetails?['kongWangPenalty'] ?? 0,
      'yearScore': _fateScoreDetails?['luckSupport'] ?? 0,
      'luckScore': _fateScoreDetails?['dayunCoordination'] ?? 0,
      'nobleScore': _fateScoreDetails?['noblesSupport'] ?? 0,
      'specialScore': _fateScoreDetails?['specialPatternBonus'] ?? 0,
      'levelScore': _fateScoreDetails?['levelBonus'] ?? 0,
      // 新增：详细评分结构，与UI显示完全一致
      'breakdown': {
        // 直接提供UI需要的字段名
        '季节助力': _fateScoreDetails?['seasonScore'] ?? 0,
        '五行平衡': _fateScoreDetails?['balanceScore'] ?? 0,
        '格局结构': _fateScoreDetails?['patternScore'] ?? 0,
        '十神影响': _fateScoreDetails?['godsScore'] ?? 0,
        '组合刑冲': _fateScoreDetails?['combinationScore'] ?? 0,
        '调候用神': _fateScoreDetails?['adjustmentScore'] ?? 0,
        '日主强弱': _fateScoreDetails?['dayMasterStrength'] ?? 0,
        '用神得力': _fateScoreDetails?['usefulGodScore'] ?? 0,
        '忌神制约': _fateScoreDetails?['tabooGodControl'] ?? 0,
        '空亡减分': -(_fateScoreDetails?['kongWangPenalty'] ?? 0),
        '流年助力': _fateScoreDetails?['luckSupport'] ?? 0,
        '大运配合': _fateScoreDetails?['dayunCoordination'] ?? 0,
        '贵人助力': _fateScoreDetails?['noblesSupport'] ?? 0,
        '特殊格局': _fateScoreDetails?['specialPatternBonus'] ?? 0,
        '命格层次': _fateScoreDetails?['levelBonus'] ?? 0,
        '基础评分': _fateScoreDetails?['baseScore'] ?? 0,
        '总分': _fateScoreDetails?['total'] ?? 0,
      },
    };
  }

  // 计算命格分数 - 100%复制baziphone.html算法
  static double calculateFateScore(Map<String, String> pillars) {
    _fateScoreValue = 0; // 重置缓存

    if (_fateScoreValue == 0) {
      // 核心基础评分（总计70分）- 传统八字命理核心要素
      final seasonScore = (calculateAdvancedSeasonScore(pillars) * 0.67)
          .round(); // 20分 - 季节助力
      final balanceScore = (calculateAdvancedBalanceScore(pillars) * 0.75)
          .round(); // 6分 - 五行平衡
      final patternScore = (calculateAdvancedPatternScore(pillars) * 2.14)
          .round(); // 15分 - 格局结构
      final godsScore = (calculateAdvancedGodsScore(pillars) * 0.42)
          .round(); // 10分 - 十神影响
      final combinationScore =
          (calculateAdvancedCombinationScore(pillars) * 0.67)
              .round(); // 10分 - 组合刑冲
      final adjustmentScore = (calculateSeasonalAdjustmentNew(pillars) * 1.0)
          .round(); // 4分 - 调候用神

      // 辅助修正评分（总计20分）
      final dayMasterStrength = (calculateDayMasterStrength(pillars) * 1.0)
          .round(); // 5分 - 日主强弱
      final usefulGodScore = (calculateFavorableGodScore(pillars) * 1.0)
          .round(); // 5分 - 用神得力
      final tabooGodControl = (calculateUnfavorableGodControl(pillars) * 1.0)
          .round(); // 2分 - 忌神制约
      final luckSupport = (calculateCurrentYearSupport(pillars) * 0.33)
          .round(); // 1分 - 流年助力
      final dayunCoordination = (calculateGreatLuckHarmony(pillars) * 1.0)
          .round(); // 2分 - 大运配合

      // 格局与特效评分
      final specialPattern = getSpecialPatternType(pillars);
      final isHighNoblePattern =
          specialPattern.contains('日贵') || specialPattern.contains('魁罡');

      final noblesSupport = (calculateNobleSupport(pillars) * 1.0)
          .round(); // 1分 - 贵人助力

      // 特殊格局调试
      print('🔍 特殊格局计算开始');
      final specialPatternRaw = calculateSpecialPatternBonus(pillars);
      print('   特殊格局原始分数: $specialPatternRaw');
      final specialPatternBonus = (specialPatternRaw * 0.6)
          .round(); // 9分 - 特殊格局
      print('   特殊格局最终分数: $specialPatternBonus (原始分数 * 0.6)');

      final levelBonus = (calculateLevelBonus(pillars) * 0.0)
          .round(); // 0分 - 命格层次

      // 扣分项
      final kongWangPenalty = (calculateVoidPenalty(pillars) * 0.33)
          .round(); // 最高5分扣除 - 空亡减分

      // 基础模块合计（季节助力、五行平衡、格局结构、十神影响、组合刑冲、调候用神）
      final baseModulesTotal =
          seasonScore +
          balanceScore +
          patternScore +
          godsScore +
          combinationScore +
          adjustmentScore;

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
      print('调候用神: $adjustmentScore (原始值 * 1.0)');
      print('日主强弱: $dayMasterStrength (原始值 * 0.6)');
      print('用神得力: $usefulGodScore (原始值 * 0.5)');
      print('忌神制约: $tabooGodControl (原始值 * 0.5)');
      print('流年助力: $luckSupport (原始值 * 0.3)');
      print('大运配合: $dayunCoordination (原始值 * 0.25)');
      print('贵人助力: $noblesSupport');
      print('特殊格局: $specialPatternBonus');
      print('命格层次: $levelBonus (calculateLevelBonus返回值 * 0.2)');
      print('空亡减分: -$kongWangPenalty');
      print('🎯 最终总分: $total');

      // 保存详细评分
      _fateScoreDetails = {
        // 基础模块评分
        'seasonScore': seasonScore, // 季节助力
        'balanceScore': balanceScore, // 五行平衡
        'patternScore': patternScore, // 格局结构
        'godsScore': godsScore, // 十神影响
        'combinationScore': combinationScore, // 组合刑冲
        'adjustmentScore': adjustmentScore, // 调候用神
        // 进阶与修正评分
        'dayMasterStrength': dayMasterStrength, // 日主强弱
        'usefulGodScore': usefulGodScore, // 用神得力
        'tabooGodControl': tabooGodControl, // 忌神制约
        'kongWangPenalty': kongWangPenalty, // 空亡减分
        'luckSupport': luckSupport, // 流年助力
        'dayunCoordination': dayunCoordination, // 大运配合
        // 格局与特效评分
        'noblesSupport': noblesSupport, // 贵人助力
        'specialPatternBonus': specialPatternBonus, // 特殊格局
        'levelBonus': levelBonus, // 命格层次
        // 汇总
        'baseScore': baseModulesTotal, // 基础合计
        'total': total, // 最终得分
      };

      // 确保分数在合理范围内（10-120分）
      _fateScoreValue = (total.clamp(10, 120)).toDouble();
    }

    return _fateScoreValue;
  }

  // 计算日主强弱评分 - 新增方法名兼容
  static double calculateDayMasterStrengthScore(Map<String, String> pillars) {
    return calculateDayMasterStrength(pillars);
  }

  // 计算用神得力评分 - 新增方法名兼容
  static double calculateUsefulGodScore(Map<String, String> pillars) {
    return calculateFavorableGodScore(pillars);
  }

  // 计算忌神制约评分 - 新增方法名兼容
  static double calculateTabooGodControlScore(Map<String, String> pillars) {
    return calculateUnfavorableGodControl(pillars);
  }

  // 计算调候用神评分 - 新增方法名兼容
  static double calculateSeasonalAdjustmentScore(Map<String, String> pillars) {
    return calculateSeasonalAdjustmentNew(pillars);
  }

  // 计算流年助力评分 - 新增方法名兼容
  static double calculateLuckSupportScore(Map<String, String> pillars) {
    return calculateCurrentYearSupport(pillars);
  }

  // 计算大运配合评分 - 新增方法名兼容
  static double calculateDayunCoordinationScore(Map<String, String> pillars) {
    return calculateGreatLuckHarmony(pillars);
  }

  // 计算贵人助力评分 - 新增方法名兼容
  static double calculateNoblesSupportScore(Map<String, String> pillars) {
    return calculateNobleSupport(pillars);
  }

  // 计算命格层次加分 - 新增方法名兼容
  static double calculateLevelBonus(Map<String, String> pillars) {
    double bonus = 0;
    final tenGodsCount = countTenGods(pillars);

    print('=== 命格层次加分详细计算 ===');
    print('十神统计: $tenGodsCount');

    // 三奇贵人格局
    final hasSanQiResult = hasSanQi(pillars);
    print('三奇贵人: $hasSanQiResult');
    if (hasSanQiResult) {
      bonus += 8;
      print('三奇贵人格局 +8分');
    }

    // 官印相生格局
    final zhengGuan = tenGodsCount['正官'] ?? 0;
    final zhengYin = tenGodsCount['正印'] ?? 0;
    print('正官: $zhengGuan, 正印: $zhengYin');
    if (zhengGuan > 0 && zhengYin > 0) {
      bonus += 6;
      print('官印相生格局 +6分');
    }

    // 食神制杀格局
    final shiShen = tenGodsCount['食神'] ?? 0;
    final qiSha = tenGodsCount['七杀'] ?? 0;
    print('食神: $shiShen, 七杀: $qiSha');
    if (shiShen > 0 && qiSha > 0) {
      bonus += 5;
      print('食神制杀格局 +5分');
    }

    // 财官双美格局
    final zhengCai = tenGodsCount['正财'] ?? 0;
    print('正财: $zhengCai, 正官: $zhengGuan');
    if (zhengCai > 0 && zhengGuan > 0) {
      bonus += 4;
      print('财官双美格局 +4分');
    }

    // 印绶格高层次
    print('正印数量: $zhengYin');
    if (zhengYin >= 2) {
      bonus += 3;
      print('印绶格高层次 +3分');
    }

    print('命格层次总分: $bonus');
    print('========================');

    return (bonus > 15 ? 15 : bonus);
  }

  // 检查是否有三奇贵人格局
  static bool hasSanQi(Map<String, String> pillars) {
    final stems = [
      pillars['year']!.substring(0, 1),
      pillars['month']!.substring(0, 1),
      pillars['day']!.substring(0, 1),
      pillars['hour']!.substring(0, 1),
    ];

    // 乙丙丁三奇
    final hasYi = stems.contains('乙');
    final hasBing = stems.contains('丙');
    final hasDing = stems.contains('丁');
    if (hasYi && hasBing && hasDing) return true;

    // 甲戊庚三奇
    final hasJia = stems.contains('甲');
    final hasWu = stems.contains('戊');
    final hasGeng = stems.contains('庚');
    if (hasJia && hasWu && hasGeng) return true;

    return false;
  }

  // 计算空亡减分 - 新增方法名兼容
  static double calculateKongWangPenalty(Map<String, String> pillars) {
    return calculateVoidPenalty(pillars);
  }

  // 季节助力评分 - 高级季节助力评分，连续化评分，考虑月令强弱和通根透干
  static double calculateAdvancedSeasonScore(Map<String, String> pillars) {
    final dayStem = pillars['day']!.substring(0, 1);
    final monthBranch = pillars['month']!.substring(1);
    final dayBranch = pillars['day']!.substring(1);

    // 月令得分基础
    double baseScore = calculateMonthlyStrength(dayStem, monthBranch);

    // 通根透干加分
    double rootScore = calculateRootStrength(dayStem, pillars);

    // 透干加分
    double transparentScore = calculateTransparentStrength(dayStem, pillars);

    // 调候因子
    final seasonalAdjustment = calculateSeasonalAdjustmentFactor(
      dayStem,
      monthBranch,
    );

    final finalScore =
        (baseScore + rootScore + transparentScore) * seasonalAdjustment;

    // 调试输出季节助力详细计算
    print('=== App季节助力详细计算 ===');
    print('日主: $dayStem, 月支: $monthBranch');
    print('月令基础分: $baseScore');
    print('通根加分: $rootScore');
    print('透干加分: $transparentScore');
    print('调候因子: $seasonalAdjustment');
    print('原始总分: ${baseScore + rootScore + transparentScore}');
    print('调候调整后: $finalScore');
    print('最终限制后: ${finalScore.clamp(0, 30)}');
    print('========================');

    return (finalScore.clamp(0, 30));
  }

  // 月令强弱评分 - 完全复制baziphone.html的strengthMap
  static double calculateMonthlyStrength(String dayStem, String monthBranch) {
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

  // 通根强度计算 - 完全复制baziphone.html算法
  static double calculateRootStrength(
    String dayStem,
    Map<String, String> pillars,
  ) {
    final branches = [
      pillars['year']!.substring(1),
      pillars['month']!.substring(1),
      pillars['day']!.substring(1),
      pillars['hour']!.substring(1),
    ];
    final dayElement = stemElements[dayStem]!;

    double rootScore = 0;

    for (int i = 0; i < branches.length; i++) {
      final branch = branches[i];
      final hiddenStems = getHiddenStems(branch);
      final mainStem = hiddenStems[0]; // 主气

      // 主气同类加分
      if (stemElements[mainStem] == dayElement) {
        final weight = i == 2 ? 1.5 : 1.0; // 日支权重更高
        rootScore += 8 * weight;
      }

      // 藏干同类加分
      for (int j = 1; j < hiddenStems.length; j++) {
        final stem = hiddenStems[j];
        if (stemElements[stem] == dayElement) {
          final weight = i == 2 ? 1.2 : 0.8;
          rootScore += 3 * weight;
        }
      }
    }

    return rootScore.clamp(0, 15);
  }

  // 透干强度计算 - 完全复制baziphone.html算法
  static double calculateTransparentStrength(
    String dayStem,
    Map<String, String> pillars,
  ) {
    final stems = [
      pillars['year']!.substring(0, 1),
      pillars['month']!.substring(0, 1),
      pillars['hour']!.substring(0, 1),
    ];
    final dayElement = stemElements[dayStem]!;

    double transparentScore = 0;

    for (int i = 0; i < stems.length; i++) {
      final stem = stems[i];
      if (stemElements[stem] == dayElement) {
        final weight = i == 1 ? 1.2 : 1.0; // 月干权重稍高
        transparentScore += 6 * weight;
      }
    }

    return transparentScore.clamp(0, 12);
  }

  // 调候因子计算 - 完全复制baziphone.html算法
  static double calculateSeasonalAdjustmentFactor(
    String dayStem,
    String monthBranch,
  ) {
    // 调候表：不同日主在不同月份的调候因子
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

  // 调候用神评分 - 新方法
  static double calculateSeasonalAdjustmentNew(Map<String, String> pillars) {
    // 完全按照baziphone.html的calculateSeasonalAdjustmentScore算法
    final monthBranch = pillars['month']!.substring(1);
    final dayElement = getStemElement(pillars['day']!.substring(0, 1));
    final dayStem = pillars['day']!.substring(0, 1);
    double score = 0;

    // 1. 基础调候需求评估
    final seasonalNeed = assessSeasonalNeed(dayStem, monthBranch);
    score += seasonalNeed['baseScore'] ?? 0;

    // 2. 调候用神配置评分
    score += evaluateSeasonalGods(pillars, seasonalNeed);

    // 3. 寒暖燥湿平衡评分
    score += evaluateTemperatureHumidityBalance(pillars);

    // 4. 特殊调候格局加分
    score += evaluateSpecialSeasonalPatterns(pillars);

    return (score > 12) ? 12 : ((score < 0) ? 0 : score);
  }

  // 评估季节调候需求 - 复制baziphone.html算法
  static Map<String, dynamic> assessSeasonalNeed(
    String dayStem,
    String monthBranch,
  ) {
    final dayElement = getStemElement(dayStem);
    double baseScore = 0;
    String needType = '';
    int intensity = 0;

    // 冬季寒冷，需要暖局
    if (['子', '丑', '亥'].contains(monthBranch)) {
      needType = '暖';
      if (dayElement == '水') {
        intensity = 3; // 水日主冬生最需要火暖
        baseScore = 1;
      } else if (dayElement == '木') {
        intensity = 2; // 木日主冬生需要火暖
        baseScore = 1;
      } else if (dayElement == '金') {
        intensity = 2; // 金日主冬生需要火暖
        baseScore = 1;
      } else {
        intensity = 1;
      }
    }
    // 夏季炎热，需要润燥
    else if (['午', '未', '巳'].contains(monthBranch)) {
      needType = '润';
      if (dayElement == '火') {
        intensity = 3; // 火日主夏生最需要水润
        baseScore = 1;
      } else if (dayElement == '土') {
        intensity = 3; // 土日主夏生需要水润
        baseScore = 1;
      } else if (dayElement == '金') {
        intensity = 2; // 金日主夏生需要水润
        baseScore = 1;
      } else {
        intensity = 1;
      }
    }
    // 春季温和偏燥
    else if (['寅', '卯', '辰'].contains(monthBranch)) {
      needType = '润';
      intensity = 1;
      if (dayElement == '木' && monthBranch == '辰') {
        intensity = 2; // 木日主春末需要水润
      }
    }
    // 秋季凉燥
    else if (['申', '酉', '戌'].contains(monthBranch)) {
      needType = '润';
      intensity = 1;
      if (dayElement == '金') {
        intensity = 2; // 金日主秋生需要水润
      }
    }

    return {
      'baseScore': baseScore,
      'needType': needType,
      'intensity': intensity,
    };
  }

  // 评估调候用神配置 - 复制baziphone.html算法
  static double evaluateSeasonalGods(
    Map<String, String> pillars,
    Map<String, dynamic> seasonalNeed,
  ) {
    double score = 0;
    final dayElement = getStemElement(pillars['day']!.substring(0, 1));

    if (seasonalNeed['needType'] == '暖') {
      // 需要火暖局
      if (dayElement == '水') {
        // 水日主需要木火
        if (hasElementInPillars(pillars, '木')) {
          score += 4; // 水生木，木生火
        }
        if (hasElementInPillars(pillars, '火')) {
          score += 3; // 水克火，但财星有用
        }
      } else if (dayElement == '木') {
        // 木日主需要火
        if (hasElementInPillars(pillars, '火')) {
          score += 5; // 木火通明
        }
      } else if (dayElement == '金') {
        // 金日主需要火炼金
        if (hasElementInPillars(pillars, '火')) {
          score += 4; // 火炼金成器
        }
      }

      // 检查是否有火元素透干或藏支
      if (hasFireInPillars(pillars)) {
        score += seasonalNeed['intensity'];
      }
    } else if (seasonalNeed['needType'] == '润') {
      // 需要水润燥
      if (dayElement == '火') {
        // 火日主需要水
        if (hasElementInPillars(pillars, '水')) {
          score += 4; // 水制火
        }
      } else if (dayElement == '土') {
        // 土日主需要水
        if (hasElementInPillars(pillars, '水')) {
          score += 5; // 水润土
        }
      } else if (dayElement == '金') {
        // 金日主需要水
        if (hasElementInPillars(pillars, '水')) {
          score += 4; // 金水相涵
        }
      }

      // 检查是否有水元素透干或藏支
      if (hasWaterInPillars(pillars)) {
        score += seasonalNeed['intensity'];
      }
    }

    return score;
  }

  // 评估寒暖燥湿平衡 - 复制baziphone.html算法
  static double evaluateTemperatureHumidityBalance(
    Map<String, String> pillars,
  ) {
    double score = 0;
    final monthBranch = pillars['month']!.substring(1);

    // 冬季需要暖，检查暖元素配置
    if (['子', '丑', '亥'].contains(monthBranch)) {
      final warmCount = countWarmElements(pillars);
      if (warmCount >= 2) {
        score += 3; // 有足够暖元素
      } else if (warmCount >= 1) {
        score += 1; // 有部分暖元素
      }
    }
    // 夏季需要润，检查润元素配置
    else if (['午', '未', '巳'].contains(monthBranch)) {
      final coolCount = countCoolElements(pillars);
      if (coolCount >= 2) {
        score += 3; // 有足够润元素
      } else if (coolCount >= 1) {
        score += 1; // 有部分润元素
      }
    }

    return score;
  }

  // 评估特殊调候格局 - 复制baziphone.html算法
  static double evaluateSpecialSeasonalPatterns(Map<String, String> pillars) {
    double score = 0;
    final monthBranch = pillars['month']!.substring(1);
    final dayElement = getStemElement(pillars['day']!.substring(0, 1));

    // 木火通明格（春夏木火相生）
    if (dayElement == '木' && ['寅', '卯', '辰', '巳', '午'].contains(monthBranch)) {
      if (hasFireInPillars(pillars)) {
        score += 2;
      }
    }

    // 金水相涵格（秋冬金水相生）
    if (dayElement == '金' && ['申', '酉', '戌', '亥', '子'].contains(monthBranch)) {
      if (hasWaterInPillars(pillars)) {
        score += 2;
      }
    }

    // 水火既济格（水火平衡）
    if (hasFireInPillars(pillars) && hasWaterInPillars(pillars)) {
      score += 3;
    }

    return score;
  }

  // 辅助函数：检查八字中是否有指定五行
  static bool hasElementInPillars(Map<String, String> pillars, String element) {
    final allStems = [
      pillars['year']!.substring(0, 1),
      pillars['month']!.substring(0, 1),
      pillars['day']!.substring(0, 1),
      pillars['hour']!.substring(0, 1),
    ];
    final allBranches = [
      pillars['year']!.substring(1),
      pillars['month']!.substring(1),
      pillars['day']!.substring(1),
      pillars['hour']!.substring(1),
    ];

    // 检查天干
    for (final stem in allStems) {
      if (getStemElement(stem) == element) return true;
    }

    // 检查地支
    for (final branch in allBranches) {
      if (getBranchElement(branch) == element) return true;
    }

    return false;
  }

  // 统计暖元素数量
  static int countWarmElements(Map<String, String> pillars) {
    int count = 0;
    final allChars = [
      pillars['year']!,
      pillars['month']!,
      pillars['day']!,
      pillars['hour']!,
    ].join('');

    // 火元素
    count += '丙丁巳午'.split('').where((char) => allChars.contains(char)).length;

    return count;
  }

  // 统计润元素数量
  static int countCoolElements(Map<String, String> pillars) {
    int count = 0;
    final allChars = [
      pillars['year']!,
      pillars['month']!,
      pillars['day']!,
      pillars['hour']!,
    ].join('');

    // 水元素
    count += '壬癸子亥'.split('').where((char) => allChars.contains(char)).length;

    return count;
  }

  // 获取天干对应的五行
  static String getStemElement(String stem) {
    const stemElements = {
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
    return stemElements[stem] ?? '';
  }

  // 获取地支对应的五行
  static String getBranchElement(String branch) {
    const branchElements = {
      '子': '水',
      '亥': '水',
      '寅': '木',
      '卯': '木',
      '巳': '火',
      '午': '火',
      '申': '金',
      '酉': '金',
      '辰': '土',
      '戌': '土',
      '丑': '土',
      '未': '土',
    };
    return branchElements[branch] ?? '';
  }

  // 获取特殊格局类型
  static String getSpecialPatternType(Map<String, String> pillars) {
    // 检测特殊格局
    final patterns = <String>[];

    // 检测日贵格
    final dayStem = pillars['day']!.substring(0, 1);
    final dayBranch = pillars['day']!.substring(1);
    if ((dayStem == '丁' && dayBranch == '酉') ||
        (dayStem == '丁' && dayBranch == '亥')) {
      patterns.add('日贵');
    }

    // 检测魁罡格
    final dayPillar = pillars['day']!;
    if (['庚戌', '庚辰', '壬辰', '戊戌'].contains(dayPillar)) {
      patterns.add('魁罡');
    }

    return patterns.join(',');
  }

  // 获取地支藏干
  static List<String> getHiddenStems(String branch) {
    const hiddenStemsMap = {
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

    return hiddenStemsMap[branch] ?? [];
  }

  // 通根透干加分 - 保留原有方法名以兼容
  static double calculateRootingBonus(Map<String, String> pillars) {
    final dayStem = pillars['day']!.substring(0, 1);
    return calculateRootStrength(dayStem, pillars) +
        calculateTransparentStrength(dayStem, pillars);
  }

  // 季节调候加分
  static double calculateSeasonalBonus(Map<String, String> pillars) {
    final monthBranch = pillars['month']!.substring(1);
    final dayStem = pillars['day']!.substring(0, 1);

    // 冬季火调候，夏季水调候等
    if (['子', '丑', '亥'].contains(monthBranch)) {
      // 冬季，火调候
      if (['丙', '丁'].contains(dayStem)) return 3;
      if (hasFireInPillars(pillars)) return 2;
    } else if (['午', '未', '巳'].contains(monthBranch)) {
      // 夏季，水调候
      if (['壬', '癸'].contains(dayStem)) return 3;
      if (hasWaterInPillars(pillars)) return 2;
    }

    return 0;
  }

  // 检查八字中是否有火
  static bool hasFireInPillars(Map<String, String> pillars) {
    final allChars = [
      pillars['year']!,
      pillars['month']!,
      pillars['day']!,
      pillars['hour']!,
    ].join('');
    return allChars.contains('丙') ||
        allChars.contains('丁') ||
        allChars.contains('午') ||
        allChars.contains('巳');
  }

  // 检查八字中是否有水
  static bool hasWaterInPillars(Map<String, String> pillars) {
    final allChars = [
      pillars['year']!,
      pillars['month']!,
      pillars['day']!,
      pillars['hour']!,
    ].join('');
    return allChars.contains('壬') ||
        allChars.contains('癸') ||
        allChars.contains('子') ||
        allChars.contains('亥');
  }

  // 五行平衡评分 - 复制baziphone.html的calculateAdvancedBalanceScore
  static double calculateAdvancedBalanceScore(Map<String, String> pillars) {
    print('=== 五行平衡详细计算 ===');

    // 计算五行能量分布
    final elementEnergy = calculateElementEnergy(pillars);
    print('初始五行能量: $elementEnergy');

    // 应用合化效果
    applyElementCombinationEffects(elementEnergy, pillars);
    print('合化后五行能量: $elementEnergy');

    // 应用刑冲破害效果
    applyElementConflictEffects(elementEnergy, pillars);
    print('刑冲后五行能量: $elementEnergy');

    // 根据五行平衡标准评分
    final balanceScore = calculateWuxingBalanceByStandards(elementEnergy);
    print('五行平衡原始分数: $balanceScore');
    print('========================');

    return balanceScore;
  }

  // 计算五行分布
  static Map<String, int> calculateElementDistribution(
    Map<String, String> pillars,
  ) {
    Map<String, int> elementCounts = {'木': 0, '火': 0, '土': 0, '金': 0, '水': 0};

    // 统计天干五行
    final stems = [
      pillars['year']!.substring(0, 1),
      pillars['month']!.substring(0, 1),
      pillars['day']!.substring(0, 1),
      pillars['hour']!.substring(0, 1),
    ];
    for (final stem in stems) {
      final element = stemElements[stem]!;
      elementCounts[element] = (elementCounts[element] ?? 0) + 1;
    }

    // 统计地支五行
    final branches = [
      pillars['year']!.substring(1),
      pillars['month']!.substring(1),
      pillars['day']!.substring(1),
      pillars['hour']!.substring(1),
    ];
    for (final branch in branches) {
      final element = branchElements[branch]!;
      elementCounts[element] = (elementCounts[element] ?? 0) + 1;
    }

    return elementCounts;
  }

  // 计算五行能量
  static Map<String, double> calculateElementEnergy(
    Map<String, String> pillars,
  ) {
    Map<String, double> energy = {'木': 0, '火': 0, '土': 0, '金': 0, '水': 0};

    // 天干能量
    final stems = [
      pillars['year']!.substring(0, 1),
      pillars['month']!.substring(0, 1),
      pillars['day']!.substring(0, 1),
      pillars['hour']!.substring(0, 1),
    ];
    for (final stem in stems) {
      final element = stemElements[stem]!;
      energy[element] = (energy[element] ?? 0) + 3; // 天干权重3
    }

    // 地支主气能量
    final branches = [
      pillars['year']!.substring(1),
      pillars['month']!.substring(1),
      pillars['day']!.substring(1),
      pillars['hour']!.substring(1),
    ];
    for (final branch in branches) {
      final element = branchElements[branch]!;
      energy[element] = (energy[element] ?? 0) + 2; // 地支主气权重2
    }

    // 地支藏干能量
    for (final branch in branches) {
      final hiddenStems = branchHiddenStems[branch] ?? [];
      for (int i = 0; i < hiddenStems.length; i++) {
        final hiddenStem = hiddenStems[i];
        final element = stemElements[hiddenStem]!;
        final weight = i == 0 ? 1.5 : (i == 1 ? 1.0 : 0.5); // 藏干权重递减
        energy[element] = (energy[element] ?? 0) + weight;
      }
    }

    return energy;
  }

  // 应用合化效果
  static void applyElementCombinationEffects(
    Map<String, double> energy,
    Map<String, String> pillars,
  ) {
    // 天干合化
    final stems = [
      pillars['year']!.substring(0, 1),
      pillars['month']!.substring(0, 1),
      pillars['day']!.substring(0, 1),
      pillars['hour']!.substring(0, 1),
    ];

    // 甲己合土
    if (stems.contains('甲') && stems.contains('己')) {
      energy['土'] = (energy['土'] ?? 0) + 2;
      energy['木'] = (energy['木'] ?? 0) - 1;
    }

    // 乙庚合金
    if (stems.contains('乙') && stems.contains('庚')) {
      energy['金'] = (energy['金'] ?? 0) + 2;
      energy['木'] = (energy['木'] ?? 0) - 1;
    }

    // 丙辛合水
    if (stems.contains('丙') && stems.contains('辛')) {
      energy['水'] = (energy['水'] ?? 0) + 2;
      energy['火'] = (energy['火'] ?? 0) - 1;
    }

    // 丁壬合木
    if (stems.contains('丁') && stems.contains('壬')) {
      energy['木'] = (energy['木'] ?? 0) + 2;
      energy['火'] = (energy['火'] ?? 0) - 1;
    }

    // 戊癸合火
    if (stems.contains('戊') && stems.contains('癸')) {
      energy['火'] = (energy['火'] ?? 0) + 2;
      energy['土'] = (energy['土'] ?? 0) - 1;
    }
  }

  // 应用刑冲破害效果
  static void applyElementConflictEffects(
    Map<String, double> energy,
    Map<String, String> pillars,
  ) {
    final branches = [
      pillars['year']!.substring(1),
      pillars['month']!.substring(1),
      pillars['day']!.substring(1),
      pillars['hour']!.substring(1),
    ];

    // 相冲减分
    final conflicts = [
      ['子', '午'],
      ['丑', '未'],
      ['寅', '申'],
      ['卯', '酉'],
      ['辰', '戌'],
      ['巳', '亥'],
    ];
    for (final conflict in conflicts) {
      if (branches.contains(conflict[0]) && branches.contains(conflict[1])) {
        final element1 = branchElements[conflict[0]]!;
        final element2 = branchElements[conflict[1]]!;
        energy[element1] = (energy[element1] ?? 0) - 1;
        energy[element2] = (energy[element2] ?? 0) - 1;
      }
    }
  }

  // 根据五行平衡标准评分
  static double calculateWuxingBalanceByStandards(Map<String, double> energy) {
    double score = 0;

    // 流通有情评分
    if (checkElementFlow(energy)) {
      score += 8;
    }

    // 偏枯有救评分
    if (checkElementRescue(energy)) {
      score += 4;
    }

    // 战克无解扣分
    if (checkElementConflict(energy)) {
      score -= 3;
    }

    return score.clamp(0, 15);
  }

  // 根据五行平衡标准评分 - 重载方法支持Map<String, int>参数
  static double calculateWuxingBalanceByStandardsFromCounts(
    Map<String, int> elementCounts,
  ) {
    // 将int转换为double以复用现有逻辑
    Map<String, double> energy = {};
    elementCounts.forEach((key, value) {
      energy[key] = value.toDouble();
    });

    return calculateWuxingBalanceByStandards(energy);
  }

  // 检查五行流通
  static bool checkElementFlow(Map<String, double> energy) {
    // 简化的流通检查：相邻五行都有一定能量
    final elements = ['木', '火', '土', '金', '水'];
    int flowCount = 0;

    for (int i = 0; i < elements.length; i++) {
      final current = elements[i];
      final next = elements[(i + 1) % elements.length];

      if ((energy[current] ?? 0) > 2 && (energy[next] ?? 0) > 2) {
        flowCount++;
      }
    }

    return flowCount >= 3; // 至少3组相邻五行有流通
  }

  // 检查偏枯有救
  static bool checkElementRescue(Map<String, double> energy) {
    final values = energy.values.toList();
    values.sort();

    // 如果最弱的五行有其他五行生助，则有救
    final minValue = values.first;
    final maxValue = values.last;

    return maxValue - minValue < 8; // 差距不太大就算有救
  }

  // 检查战克无解
  static bool checkElementConflict(Map<String, double> energy) {
    // 检查是否有严重的五行冲突
    final conflicts = [
      ['木', '土'],
      ['火', '金'],
      ['土', '水'],
      ['金', '木'],
      ['水', '火'],
    ];

    for (final conflict in conflicts) {
      final element1 = conflict[0];
      final element2 = conflict[1];

      if ((energy[element1] ?? 0) > 8 && (energy[element2] ?? 0) > 8) {
        return true; // 相克双方都很强，战克无解
      }
    }

    return false;
  }

  // 检查五行流通有情 - 重载方法支持Map<String, String>参数
  static bool checkElementFlowFromPillars(Map<String, String> pillars) {
    final elementEnergy = calculateElementEnergy(pillars);
    return checkElementFlow(elementEnergy);
  }

  // 检查偏枯有救 - 重载方法支持Map<String, String>参数
  static bool checkElementRescueFromPillars(Map<String, String> pillars) {
    final elementEnergy = calculateElementEnergy(pillars);
    return checkElementRescue(elementEnergy);
  }

  // 检查战克无解 - 重载方法支持Map<String, String>参数
  static bool checkElementConflictFromPillars(Map<String, String> pillars) {
    final elementEnergy = calculateElementEnergy(pillars);
    return checkElementConflict(elementEnergy);
  }

  // 格局结构评分 - 复制baziphone.html的calculateAdvancedPatternScore
  static double calculateAdvancedPatternScore(Map<String, String> pillars) {
    double score = 0;

    // 特殊格局识别
    final specialPattern = identifySpecialPattern(pillars);
    if (specialPattern != '无') {
      score += 10;
    }

    // 正格评分
    score += evaluateRegularPattern(pillars);

    // 格局成败评分
    score += evaluatePatternSuccess(pillars);

    // 用神相神评分
    score += evaluateUsefulGods(pillars);

    return score.clamp(0, 15);
  }

  // 识别特殊格局
  static String identifySpecialPattern(Map<String, String> pillars) {
    print('🔍 特殊格局识别开始');

    // 从财格检查
    print('   检查从财格...');
    if (isCongCaiGe(pillars)) {
      print('   ✅ 识别为从财格');
      return '从财格';
    }

    // 从强格检查
    print('   检查从强格...');
    if (isCongQiangGe(pillars)) {
      print('   ✅ 识别为从强格');
      return '从强格';
    }

    // 从弱格检查
    print('   检查从弱格...');
    if (isCongRuoGe(pillars)) {
      print('   ✅ 识别为从弱格');
      return '从弱格';
    }

    // 专旺格检查
    print('   检查专旺格...');
    if (isZhuanWangGe(pillars)) {
      print('   ✅ 识别为专旺格');
      return '专旺格';
    }

    print('   ❌ 无特殊格局');
    return '无';
  }

  // 从强格判断
  static bool isCongQiangGe(Map<String, String> pillars) {
    final dayStem = pillars['day']!.substring(0, 1);
    final dayElement = stemElements[dayStem]!;

    int sameElementCount = 0;
    final allChars = [
      pillars['year']!,
      pillars['month']!,
      pillars['day']!,
      pillars['hour']!,
    ].join('');

    // 统计同类五行
    for (final char in allChars.split('')) {
      if (stemElements.containsKey(char) && stemElements[char] == dayElement) {
        sameElementCount++;
      }
      if (branchElements.containsKey(char) &&
          branchElements[char] == dayElement) {
        sameElementCount++;
      }
    }

    return sameElementCount >= 6; // 超过一半为同类五行
  }

  // 从弱格判断
  static bool isCongRuoGe(Map<String, String> pillars) {
    final dayStem = pillars['day']!.substring(0, 1);
    final dayElement = stemElements[dayStem]!;

    int sameElementCount = 0;
    final allChars = [
      pillars['year']!,
      pillars['month']!,
      pillars['day']!,
      pillars['hour']!,
    ].join('');

    // 统计同类五行
    for (final char in allChars.split('')) {
      if (stemElements.containsKey(char) && stemElements[char] == dayElement) {
        sameElementCount++;
      }
      if (branchElements.containsKey(char) &&
          branchElements[char] == dayElement) {
        sameElementCount++;
      }
    }

    return sameElementCount <= 1; // 同类五行极少
  }

  // 从财格判断
  static bool isCongCaiGe(Map<String, String> pillars) {
    final dayStem = pillars['day']!.substring(0, 1);
    final dayElement = stemElements[dayStem]!;

    // 统计财星数量
    int wealthCount = 0;
    // 统计比劫印星数量
    int biJieYinCount = 0;

    print('🔍 从财格识别调试:');
    print('   日主: $dayStem ($dayElement)');

    for (final position in ['year', 'month', 'day', 'hour']) {
      final stem = pillars[position]!.substring(0, 1);
      final branch = pillars[position]!.substring(1);

      // 检查天干
      if (stemElements.containsKey(stem)) {
        final stemElement = stemElements[stem]!;
        if (_isWealth(dayElement, stemElement)) {
          wealthCount++;
          print('   财星天干: $stem ($stemElement)');
        } else if (_isBiJieOrYin(dayElement, stemElement)) {
          biJieYinCount++;
          print('   比劫印星天干: $stem ($stemElement)');
        }
      }

      // 检查地支
      if (branchElements.containsKey(branch)) {
        final branchElement = branchElements[branch]!;
        if (_isWealth(dayElement, branchElement)) {
          wealthCount++;
          print('   财星地支: $branch ($branchElement)');
        } else if (_isBiJieOrYin(dayElement, branchElement)) {
          biJieYinCount++;
          print('   比劫印星地支: $branch ($branchElement)');
        }
      }
    }

    // 计算日主强度
    final dayStrength = estimateDayStrength(pillars);

    print('   财星数量: $wealthCount');
    print('   比劫印星数量: $biJieYinCount');
    print('   日主强度: $dayStrength%');

    // 从财格条件：日主极弱(≤35)且财星多(≥3)且比劫印星少(≤3)
    final result = dayStrength <= 35 && wealthCount >= 3 && biJieYinCount <= 3;
    print(
      '   从财格判断结果: $result (强度≤35: ${dayStrength <= 35}, 财星≥3: ${wealthCount >= 3}, 比劫印≤3: ${biJieYinCount <= 3})',
    );

    return result;
  }

  // 判断是否为财星
  static bool _isWealth(String dayElement, String targetElement) {
    const wealthRelations = {
      '木': ['土'],
      '火': ['金'],
      '土': ['水'],
      '金': ['木'],
      '水': ['火'],
    };
    return wealthRelations[dayElement]?.contains(targetElement) ?? false;
  }

  // 判断是否为比劫或印星
  static bool _isBiJieOrYin(String dayElement, String targetElement) {
    const biJieYinRelations = {
      '木': ['木', '水'], // 比劫木，印星水
      '火': ['火', '木'], // 比劫火，印星木
      '土': ['土', '火'], // 比劫土，印星火
      '金': ['金', '土'], // 比劫金，印星土
      '水': ['水', '金'], // 比劫水，印星金
    };
    return biJieYinRelations[dayElement]?.contains(targetElement) ?? false;
  }

  // 专旺格判断
  static bool isZhuanWangGe(Map<String, String> pillars) {
    final elementEnergy = calculateElementEnergy(pillars);
    final maxEnergy = elementEnergy.values.reduce((a, b) => a > b ? a : b);
    final totalEnergy = elementEnergy.values.reduce((a, b) => a + b);

    return maxEnergy / totalEnergy > 0.6; // 某一五行占主导地位
  }

  // 评估正格
  static double evaluateRegularPattern(Map<String, String> pillars) {
    // 简化的正格评估
    return 3.0;
  }

  // 评估格局成败
  static double evaluatePatternSuccess(Map<String, String> pillars) {
    // 简化的格局成败评估
    return 2.0;
  }

  // 评估用神相神
  static double evaluateUsefulGods(Map<String, String> pillars) {
    // 简化的用神相神评估
    return 2.0;
  }

  // 十神影响评分 - 复制baziphone.html的calculateAdvancedGodsScore
  static double calculateAdvancedGodsScore(Map<String, String> pillars) {
    final tenGodsCount = countTenGods(pillars);
    double score = 0;

    // 吉神得位评分
    score += evaluateAuspiciousGodsPosition(tenGodsCount);

    // 凶神制化评分
    score += evaluateInauspiciousGodsControl(tenGodsCount);

    // 财官印流通性评分
    score += evaluateWealthOfficialSealFlow(tenGodsCount);

    return score.clamp(0, 25);
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

  // 吉神得位评分
  static double evaluateAuspiciousGodsPosition(
    Map<String, double> tenGodsCount,
  ) {
    double score = 0;

    // 正官得位 - 增强评分
    if ((tenGodsCount['正官'] ?? 0) > 0) score += 6;

    // 正财得位 - 增强评分
    if ((tenGodsCount['正财'] ?? 0) > 0) score += 5;

    // 正印得位 - 增强评分
    if ((tenGodsCount['正印'] ?? 0) > 0) score += 4;

    // 食神得位 - 增强评分
    if ((tenGodsCount['食神'] ?? 0) > 0) score += 3;

    // 偏财得位
    if ((tenGodsCount['偏财'] ?? 0) > 0) score += 2;

    return score;
  }

  // 凶神制化评分
  static double evaluateInauspiciousGodsControl(
    Map<String, double> tenGodsCount,
  ) {
    double score = 0;

    // 七杀有制
    if ((tenGodsCount['七杀'] ?? 0) > 0 && (tenGodsCount['食神'] ?? 0) > 0) {
      score += 2;
    }

    // 伤官有制
    if ((tenGodsCount['伤官'] ?? 0) > 0 && (tenGodsCount['正印'] ?? 0) > 0) {
      score += 1.5;
    }

    return score;
  }

  // 财官印流通性评分
  static double evaluateWealthOfficialSealFlow(
    Map<String, double> tenGodsCount,
  ) {
    double score = 0;

    // 财生官
    if ((tenGodsCount['正财'] ?? 0) > 0 && (tenGodsCount['正官'] ?? 0) > 0) {
      score += 2;
    }

    // 官印相生
    if ((tenGodsCount['正官'] ?? 0) > 0 && (tenGodsCount['正印'] ?? 0) > 0) {
      score += 2;
    }

    return score;
  }

  // 组合刑冲评分 - 完全对齐baziphone.html的calculateAdvancedCombinationScore
  static double calculateAdvancedCombinationScore(Map<String, String> pillars) {
    double combinationScore = 0;
    final branches = [
      pillars['year']!.substring(1),
      pillars['month']!.substring(1),
      pillars['day']!.substring(1),
      pillars['hour']!.substring(1),
    ];

    // 1. 三合局评分 - 使用严格检测
    final sanHeResult = checkStrictSanHe(branches);
    if (sanHeResult['isValid'] == true) {
      if (sanHeResult['count'] == 3) {
        combinationScore += 12; // 完整三合
        combinationScore += applyAdvancedCombinationEffects(
          pillars,
          sanHeResult,
        );
      } else if (sanHeResult['count'] == 2) {
        combinationScore += 6; // 半合
      }
    }

    // 2. 六合评分
    final liuHeCount = hasLiuHe(branches) ? 1 : 0;
    if (liuHeCount > 0) {
      combinationScore += 4;
      combinationScore += applyAdvancedCombinationEffects(pillars, {
        'type': 'liuhe',
      });
    }

    // 3. 三会局评分 - 使用严格检测
    final sanHuiResult = checkStrictSanHui(branches);
    if (sanHuiResult['isValid'] == true && sanHuiResult['count'] == 3) {
      combinationScore += 10; // 三会局
    }

    // 4. 冲克刑害扣分
    final conflictPenalty = applyAdvancedConflictEffects(pillars);
    combinationScore -= conflictPenalty;

    // 5. 空亡检查
    final voidPenalty = checkVoidPenalty(pillars);
    combinationScore -= voidPenalty;

    return (combinationScore.clamp(0, 15)).toDouble();
  }

  // 三合局评分
  static double calculateSanHeScore(Map<String, String> pillars) {
    final branches = [
      pillars['year']!.substring(1),
      pillars['month']!.substring(1),
      pillars['day']!.substring(1),
      pillars['hour']!.substring(1),
    ];

    // 申子辰合水局
    if (branches.contains('申') &&
        branches.contains('子') &&
        branches.contains('辰')) {
      return 6;
    }

    // 亥卯未合木局
    if (branches.contains('亥') &&
        branches.contains('卯') &&
        branches.contains('未')) {
      return 6;
    }

    // 寅午戌合火局
    if (branches.contains('寅') &&
        branches.contains('午') &&
        branches.contains('戌')) {
      return 6;
    }

    // 巳酉丑合金局
    if (branches.contains('巳') &&
        branches.contains('酉') &&
        branches.contains('丑')) {
      return 6;
    }

    // 半合局
    final halfCombinations = [
      ['申', '子'],
      ['子', '辰'],
      ['申', '辰'],
      ['亥', '卯'],
      ['卯', '未'],
      ['亥', '未'],
      ['寅', '午'],
      ['午', '戌'],
      ['寅', '戌'],
      ['巳', '酉'],
      ['酉', '丑'],
      ['巳', '丑'],
    ];

    for (final combo in halfCombinations) {
      if (branches.contains(combo[0]) && branches.contains(combo[1])) {
        return 3;
      }
    }

    return 0;
  }

  // 六合局评分
  static double calculateLiuHeScore(Map<String, String> pillars) {
    final branches = [
      pillars['year']!.substring(1),
      pillars['month']!.substring(1),
      pillars['day']!.substring(1),
      pillars['hour']!.substring(1),
    ];

    final liuHeCombinations = [
      ['子', '丑'],
      ['寅', '亥'],
      ['卯', '戌'],
      ['辰', '酉'],
      ['巳', '申'],
      ['午', '未'],
    ];

    for (final combo in liuHeCombinations) {
      if (branches.contains(combo[0]) && branches.contains(combo[1])) {
        return 2;
      }
    }

    return 0;
  }

  // 三会局评分
  static double calculateSanHuiScore(Map<String, String> pillars) {
    final branches = [
      pillars['year']!.substring(1),
      pillars['month']!.substring(1),
      pillars['day']!.substring(1),
      pillars['hour']!.substring(1),
    ];

    // 寅卯辰会木局
    if (branches.contains('寅') &&
        branches.contains('卯') &&
        branches.contains('辰')) {
      return 4;
    }

    // 巳午未会火局
    if (branches.contains('巳') &&
        branches.contains('午') &&
        branches.contains('未')) {
      return 4;
    }

    // 申酉戌会金局
    if (branches.contains('申') &&
        branches.contains('酉') &&
        branches.contains('戌')) {
      return 4;
    }

    // 亥子丑会水局
    if (branches.contains('亥') &&
        branches.contains('子') &&
        branches.contains('丑')) {
      return 4;
    }

    return 0;
  }

  // 严格三合检测
  static Map<String, dynamic> checkStrictSanHe(List<String> branches) {
    final sanHeCombinations = {
      '申子辰': {
        'element': '水',
        'branches': ['申', '子', '辰'],
      },
      '亥卯未': {
        'element': '木',
        'branches': ['亥', '卯', '未'],
      },
      '寅午戌': {
        'element': '火',
        'branches': ['寅', '午', '戌'],
      },
      '巳酉丑': {
        'element': '金',
        'branches': ['巳', '酉', '丑'],
      },
    };

    for (final entry in sanHeCombinations.entries) {
      final comboBranches = entry.value['branches'] as List<String>;
      final matches = comboBranches
          .where((branch) => branches.contains(branch))
          .toList();

      if (matches.length >= 2) {
        return {
          'isValid': true,
          'count': matches.length,
          'type': 'sanhe',
          'element': entry.value['element'],
          'branches': matches,
        };
      }
    }

    return {'isValid': false, 'count': 0};
  }

  // 六合检测
  static bool hasLiuHe(List<String> branches) {
    final liuHeCombinations = [
      ['子', '丑'],
      ['寅', '亥'],
      ['卯', '戌'],
      ['辰', '酉'],
      ['巳', '申'],
      ['午', '未'],
    ];

    for (final combo in liuHeCombinations) {
      if (branches.contains(combo[0]) && branches.contains(combo[1])) {
        return true;
      }
    }
    return false;
  }

  // 严格三会检测
  static Map<String, dynamic> checkStrictSanHui(List<String> branches) {
    final sanHuiCombinations = {
      '寅卯辰': {
        'element': '木',
        'branches': ['寅', '卯', '辰'],
      },
      '巳午未': {
        'element': '火',
        'branches': ['巳', '午', '未'],
      },
      '申酉戌': {
        'element': '金',
        'branches': ['申', '酉', '戌'],
      },
      '亥子丑': {
        'element': '水',
        'branches': ['亥', '子', '丑'],
      },
    };

    for (final entry in sanHuiCombinations.entries) {
      final comboBranches = entry.value['branches'] as List<String>;
      final matches = comboBranches
          .where((branch) => branches.contains(branch))
          .toList();

      if (matches.length == 3) {
        return {
          'isValid': true,
          'count': 3,
          'type': 'sanhui',
          'element': entry.value['element'],
          'branches': matches,
        };
      }
    }

    return {'isValid': false, 'count': 0};
  }

  // 高级组合增益效果
  static double applyAdvancedCombinationEffects(
    Map<String, String> pillars,
    Map<String, dynamic> combination,
  ) {
    double bonus = 0;
    final dayStem = pillars['day']!.substring(0, 1);
    final dayElement = getElementByStem(dayStem);
    final dayStrength = estimateDayStrength(pillars);

    if (combination['type'] == 'sanhe' || combination['type'] == 'sanhui') {
      final combinedElement = combination['element'];

      // 合化为用神
      if (isFavorableElement(dayElement, combinedElement, dayStrength)) {
        bonus += 5;
      }

      // 合化为喜神
      if (isSupportiveElement(dayElement, combinedElement)) {
        bonus += 3;
      }

      // 合化为忌神
      if (isUnfavorableElement(dayElement, combinedElement, dayStrength)) {
        bonus -= 4;
      }
    }

    return bonus;
  }

  // 高级冲克扣分效果
  static double applyAdvancedConflictEffects(Map<String, String> pillars) {
    double penalty = 0;
    final branches = [
      pillars['year']!.substring(1),
      pillars['month']!.substring(1),
      pillars['day']!.substring(1),
      pillars['hour']!.substring(1),
    ];

    // 相冲检查
    final chongPairs = [
      ['子', '午'],
      ['丑', '未'],
      ['寅', '申'],
      ['卯', '酉'],
      ['辰', '戌'],
      ['巳', '亥'],
    ];

    for (final pair in chongPairs) {
      if (branches.contains(pair[0]) && branches.contains(pair[1])) {
        if (pair[0] == pillars['day']!.substring(1) ||
            pair[1] == pillars['day']!.substring(1)) {
          penalty += 5; // 日支被冲，严重
        } else {
          penalty += 2; // 其他柱被冲
        }
      }
    }

    // 相刑检查
    final xingGroups = [
      ['寅', '巳', '申'], // 无恩之刑
      ['丑', '戌', '未'], // 恃势之刑
      ['子', '卯'], // 无礼之刑
    ];

    for (final group in xingGroups) {
      final presentCount = group
          .where((branch) => branches.contains(branch))
          .length;
      if (presentCount >= 2) {
        penalty += presentCount;
      }
    }

    return penalty;
  }

  // 空亡检查
  static double checkVoidPenalty(Map<String, String> pillars) {
    // 简化的空亡检查
    return 0; // 暂时返回0，可以后续完善
  }

  // 获取天干对应五行
  static String getElementByStem(String stem) {
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

  // 判断是否为有利五行
  static bool isFavorableElement(
    String dayElement,
    String targetElement,
    double dayStrength,
  ) {
    if (dayStrength > 70) {
      // 身强喜克泄
      return isWeakeningElement(dayElement, targetElement);
    } else if (dayStrength < 30) {
      // 身弱喜生扶
      return isSupportingElement(dayElement, targetElement);
    }
    return false;
  }

  // 判断是否为支持五行
  static bool isSupportiveElement(String dayElement, String targetElement) {
    return isSupportingElement(dayElement, targetElement);
  }

  // 判断是否为不利五行
  static bool isUnfavorableElement(
    String dayElement,
    String targetElement,
    double dayStrength,
  ) {
    return !isFavorableElement(dayElement, targetElement, dayStrength);
  }

  // 判断是否为生扶五行
  static bool isSupportingElement(String dayElement, String targetElement) {
    const supportMap = {
      '木': ['水', '木'],
      '火': ['木', '火'],
      '土': ['火', '土'],
      '金': ['土', '金'],
      '水': ['金', '水'],
    };
    return supportMap[dayElement]?.contains(targetElement) ?? false;
  }

  // 判断是否为克泄五行
  static bool isWeakeningElement(String dayElement, String targetElement) {
    const weakenMap = {
      '木': ['火', '金', '土'],
      '火': ['土', '水', '金'],
      '土': ['金', '木', '水'],
      '金': ['水', '火', '木'],
      '水': ['木', '土', '火'],
    };
    return weakenMap[dayElement]?.contains(targetElement) ?? false;
  }

  // 日主强弱评分
  static double calculateDayMasterStrength(Map<String, String> pillars) {
    // 简化的日主强弱评估
    final dayStrength = estimateDayStrength(pillars);

    if (dayStrength > 70) {
      return 3; // 身强
    } else if (dayStrength < 30) {
      return 2; // 身弱
    } else {
      return 5; // 中和最佳
    }
  }

  // 估算日主强度
  static double estimateDayStrength(Map<String, String> pillars) {
    final dayStem = pillars['day']!.substring(0, 1);
    final monthBranch = pillars['month']!.substring(1);

    // 基于月令强弱
    double strength = calculateMonthlyStrength(dayStem, monthBranch);

    // 加上通根透干
    strength += calculateRootingBonus(pillars);

    return strength * 4; // 转换为百分制
  }

  // 用神得力评分
  static double calculateFavorableGodScore(Map<String, String> pillars) {
    final dayStrength = estimateDayStrength(pillars);
    final tenGodsCount = countTenGods(pillars);

    double score = 0;

    if (dayStrength > 70) {
      // 身强，克泄为用
      score += evaluateWeakeningGods(tenGodsCount);
    } else if (dayStrength < 30) {
      // 身弱，生助为用
      score += evaluateStrengtheningGods(tenGodsCount);
    } else {
      // 中和用调候
      score += evaluateBalancingGods(pillars);
    }

    return score.clamp(0, 8);
  }

  // 身强用神评分
  static double evaluateWeakeningGods(Map<String, double> tenGodsCount) {
    double score = 0;

    // 食伤泄秀
    score += ((tenGodsCount['食神'] ?? 0) + (tenGodsCount['伤官'] ?? 0)) * 2;

    // 财星耗身
    score += ((tenGodsCount['正财'] ?? 0) + (tenGodsCount['偏财'] ?? 0)) * 1.5;

    // 官杀制身
    score += ((tenGodsCount['正官'] ?? 0) + (tenGodsCount['七杀'] ?? 0)) * 1;

    return score.clamp(0, 8);
  }

  // 身弱用神评分
  static double evaluateStrengtheningGods(Map<String, double> tenGodsCount) {
    double score = 0;

    // 印星生身
    score += ((tenGodsCount['正印'] ?? 0) + (tenGodsCount['偏印'] ?? 0)) * 2;

    // 比劫帮身
    score += ((tenGodsCount['比肩'] ?? 0) + (tenGodsCount['劫财'] ?? 0)) * 1.5;

    return score.clamp(0, 8);
  }

  // 中和调候用神评分
  static double evaluateBalancingGods(Map<String, String> pillars) {
    final monthBranch = pillars['month']!.substring(1);
    final dayStem = pillars['day']!.substring(0, 1);
    double score = 5; // 中和基础分

    // 根据季节调候
    if (['子', '丑', '亥'].contains(monthBranch)) {
      // 冬季用火调候
      final tenGodsCount = countTenGods(pillars);
      // 根据日主不同，调候用神也不同
      if (['甲', '乙'].contains(dayStem)) {
        // 木日主冬季用火调候
        if ((tenGodsCount['食神'] ?? 0) > 0 || (tenGodsCount['伤官'] ?? 0) > 0) {
          score += 2;
        }
      } else if (['庚', '辛'].contains(dayStem)) {
        // 金日主冬季用火调候
        if ((tenGodsCount['偏财'] ?? 0) > 0 || (tenGodsCount['正财'] ?? 0) > 0) {
          score += 2;
        }
      }
    } else if (['午', '未', '巳'].contains(monthBranch)) {
      // 夏季用水调候
      final tenGodsCount = countTenGods(pillars);
      if (['甲', '乙'].contains(dayStem)) {
        // 木日主夏季用水调候
        if ((tenGodsCount['正印'] ?? 0) > 0 || (tenGodsCount['偏印'] ?? 0) > 0) {
          score += 2;
        }
      } else if (['丙', '丁'].contains(dayStem)) {
        // 火日主夏季用水调候
        if ((tenGodsCount['正官'] ?? 0) > 0 || (tenGodsCount['七杀'] ?? 0) > 0) {
          score += 2;
        }
      }
    }

    return score.clamp(0, 8);
  }

  // 忌神制约评分
  static double calculateUnfavorableGodControl(Map<String, String> pillars) {
    final dayStrength = estimateDayStrength(pillars);
    final tenGodsCount = countTenGods(pillars);

    double score = 0;

    if (dayStrength > 70) {
      // 身强，印比为忌神，需要制约
      final unfavorableCount =
          (tenGodsCount['正印'] ?? 0) +
          (tenGodsCount['偏印'] ?? 0) +
          (tenGodsCount['比肩'] ?? 0) +
          (tenGodsCount['劫财'] ?? 0);

      // 检查是否有食伤制印，财星制比劫
      final controlCount =
          (tenGodsCount['食神'] ?? 0) +
          (tenGodsCount['伤官'] ?? 0) +
          (tenGodsCount['正财'] ?? 0) +
          (tenGodsCount['偏财'] ?? 0);

      if (unfavorableCount > 0 && controlCount > 0) {
        score = (controlCount / unfavorableCount * 4).clamp(0, 4);
      }
    } else if (dayStrength < 30) {
      // 身弱，官杀财食为忌神，需要制约
      final unfavorableCount =
          (tenGodsCount['正官'] ?? 0) +
          (tenGodsCount['七杀'] ?? 0) +
          (tenGodsCount['正财'] ?? 0) +
          (tenGodsCount['偏财'] ?? 0) +
          (tenGodsCount['食神'] ?? 0) +
          (tenGodsCount['伤官'] ?? 0);

      // 检查是否有印星制食伤，比劫制财
      final controlCount =
          (tenGodsCount['正印'] ?? 0) +
          (tenGodsCount['偏印'] ?? 0) +
          (tenGodsCount['比肩'] ?? 0) +
          (tenGodsCount['劫财'] ?? 0);

      if (unfavorableCount > 0 && controlCount > 0) {
        score = (controlCount / unfavorableCount * 4).clamp(0, 4);
      }
    } else {
      // 中和，基础分
      score = 2.0;
    }

    return score;
  }

  // 调候用神评分
  static double calculateSeasonalAdjustment(Map<String, String> pillars) {
    return calculateSeasonalBonus(pillars).clamp(0, 5);
  }

  // 流年助力评分
  static double calculateCurrentYearSupport(Map<String, String> pillars) {
    // 获取当前年份的天干地支（简化处理，使用年柱代表）
    final yearStem = pillars['year']!.substring(0, 1);
    final yearBranch = pillars['year']!.substring(1);
    final dayStem = pillars['day']!.substring(0, 1);

    double score = 0;

    // 检查年干对日主的作用
    final yearTenGod = getTenGod(dayStem, yearStem);
    final dayStrength = estimateDayStrength(pillars);

    if (dayStrength > 70) {
      // 身强喜克泄耗
      if (['食神', '伤官', '正财', '偏财', '正官', '七杀'].contains(yearTenGod)) {
        score += 2;
      }
    } else if (dayStrength < 30) {
      // 身弱喜生助
      if (['正印', '偏印', '比肩', '劫财'].contains(yearTenGod)) {
        score += 2;
      }
    } else {
      // 中和，适度即可
      score += 1;
    }

    // 检查年支的作用
    final yearBranchElement = branchElements[yearBranch]!;
    final dayElement = stemElements[dayStem]!;

    if (isElementGenerating(yearBranchElement, dayElement)) {
      score += 0.5; // 年支生日主
    } else if (isElementGenerating(dayElement, yearBranchElement)) {
      score += 0.3; // 日主生年支（泄秀）
    }

    return score.clamp(0, 3);
  }

  // 辅助函数：检查五行相生关系
  static bool isElementGenerating(String element1, String element2) {
    const generatingMap = {'木': '火', '火': '土', '土': '金', '金': '水', '水': '木'};

    return generatingMap[element1] == element2;
  }

  // 大运配合评分
  static double calculateGreatLuckHarmony(Map<String, String> pillars) {
    // 简化的大运配合评估，基于月柱推算大运趋势
    final monthStem = pillars['month']!.substring(0, 1);
    final monthBranch = pillars['month']!.substring(1);
    final dayStem = pillars['day']!.substring(0, 1);
    final dayStrength = estimateDayStrength(pillars);

    double score = 0;

    // 检查月柱与日主的配合关系
    final monthTenGod = getTenGod(dayStem, monthStem);

    // 根据日主强弱判断大运配合
    if (dayStrength > 70) {
      // 身强，大运走克泄耗为佳
      if (['食神', '伤官', '正财', '偏财', '正官', '七杀'].contains(monthTenGod)) {
        score += 1.5;
      }
    } else if (dayStrength < 30) {
      // 身弱，大运走生助为佳
      if (['正印', '偏印', '比肩', '劫财'].contains(monthTenGod)) {
        score += 1.5;
      }
    } else {
      // 中和，平衡即可
      score += 1.0;
    }

    // 检查月支的配合
    final monthElement = branchElements[monthBranch]!;
    final dayElement = stemElements[dayStem]!;

    if (isElementGenerating(monthElement, dayElement)) {
      score += 0.5; // 月支生日主
    }

    return score.clamp(0, 2);
  }

  // 贵人助力评分
  static double calculateNobleSupport(Map<String, String> pillars) {
    double score = 0;
    final dayStem = pillars['day']!.substring(0, 1);
    final dayBranch = pillars['day']!.substring(1);

    // 检查天乙贵人
    score += calculateTianyiNobleScore(pillars);

    // 检查天德贵人
    score += calculateTiandeNobleScore(pillars);

    // 检查月德贵人
    score += calculateYuedeNobleScore(pillars);

    // 检查德秀贵人
    score += calculateDexiuNobleScore(pillars);

    // 检查文昌贵人
    score += calculateWenchangNobleScore(pillars);

    return score.clamp(0, 5);
  }

  // 天乙贵人评分
  static double calculateTianyiNobleScore(Map<String, String> pillars) {
    final dayStem = pillars['day']!.substring(0, 1);
    final branches = [
      pillars['year']!.substring(1),
      pillars['month']!.substring(1),
      pillars['day']!.substring(1),
      pillars['hour']!.substring(1),
    ];

    // 天乙贵人表
    const tianyiMap = {
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

    final nobles = tianyiMap[dayStem] ?? [];
    int count = 0;

    for (final branch in branches) {
      if (nobles.contains(branch)) {
        count++;
      }
    }

    return count * 0.5;
  }

  // 天德贵人评分
  static double calculateTiandeNobleScore(Map<String, String> pillars) {
    final monthBranch = pillars['month']!.substring(1);
    final stems = [
      pillars['year']!.substring(0, 1),
      pillars['month']!.substring(0, 1),
      pillars['day']!.substring(0, 1),
      pillars['hour']!.substring(0, 1),
    ];

    // 天德贵人表（按月支查天干）
    const tiandeMap = {
      '子': '丁',
      '丑': '丁',
      '寅': '丙',
      '卯': '甲',
      '辰': '甲',
      '巳': '丙',
      '午': '壬',
      '未': '壬',
      '申': '庚',
      '酉': '庚',
      '戌': '戊',
      '亥': '戊',
    };

    final tiandeStem = tiandeMap[monthBranch];
    if (tiandeStem != null && stems.contains(tiandeStem)) {
      return 1.0;
    }

    return 0;
  }

  // 月德贵人评分
  static double calculateYuedeNobleScore(Map<String, String> pillars) {
    final monthBranch = pillars['month']!.substring(1);
    final branches = [
      pillars['year']!.substring(1),
      pillars['month']!.substring(1),
      pillars['day']!.substring(1),
      pillars['hour']!.substring(1),
    ];

    // 月德贵人表（按月支查地支）
    const yuedeMap = {
      '子': '丙',
      '丑': '甲',
      '寅': '丁',
      '卯': '壬',
      '辰': '辛',
      '巳': '戊',
      '午': '甲',
      '未': '癸',
      '申': '丁',
      '酉': '壬',
      '戌': '乙',
      '亥': '庚',
    };

    final yuedeBranch = yuedeMap[monthBranch];
    if (yuedeBranch != null) {
      // 这里简化处理，检查是否有对应的天干
      final stems = [
        pillars['year']!.substring(0, 1),
        pillars['month']!.substring(0, 1),
        pillars['day']!.substring(0, 1),
        pillars['hour']!.substring(0, 1),
      ];
      if (stems.contains(yuedeBranch)) {
        return 0.8;
      }
    }

    return 0;
  }

  // 德秀贵人评分
  static double calculateDexiuNobleScore(Map<String, String> pillars) {
    // 德秀贵人：甲见己，乙见庚，丙见辛，丁见壬，戊见癸等
    final dayStem = pillars['day']!.substring(0, 1);
    final stems = [
      pillars['year']!.substring(0, 1),
      pillars['month']!.substring(0, 1),
      pillars['hour']!.substring(0, 1),
    ];

    const dexiuMap = {
      '甲': '己',
      '乙': '庚',
      '丙': '辛',
      '丁': '壬',
      '戊': '癸',
      '己': '甲',
      '庚': '乙',
      '辛': '丙',
      '壬': '丁',
      '癸': '戊',
    };

    final dexiuStem = dexiuMap[dayStem];
    if (dexiuStem != null && stems.contains(dexiuStem)) {
      return 0.6;
    }

    return 0;
  }

  // 文昌贵人评分
  static double calculateWenchangNobleScore(Map<String, String> pillars) {
    final dayStem = pillars['day']!.substring(0, 1);
    final branches = [
      pillars['year']!.substring(1),
      pillars['month']!.substring(1),
      pillars['day']!.substring(1),
      pillars['hour']!.substring(1),
    ];

    // 文昌贵人表
    const wenchangMap = {
      '甲': '巳',
      '乙': '午',
      '丙': '申',
      '丁': '酉',
      '戊': '申',
      '己': '酉',
      '庚': '亥',
      '辛': '子',
      '壬': '寅',
      '癸': '卯',
    };

    final wenchangBranch = wenchangMap[dayStem];
    if (wenchangBranch != null && branches.contains(wenchangBranch)) {
      return 0.4;
    }

    return 0;
  }

  // 特殊格局加分
  static double calculateSpecialPatternBonus(Map<String, String> pillars) {
    print('🔍 calculateSpecialPatternBonus 被调用');
    final specialPattern = identifySpecialPattern(pillars);
    print('   识别到的特殊格局: $specialPattern');

    double bonus = 0;
    switch (specialPattern) {
      case '从财格':
        bonus = 15; // 从财格 - 从弱格中最佳
        break;
      case '从强格':
        bonus = 18; // 从强格
        break;
      case '从弱格':
        bonus = 12; // 其他从弱格系列
        break;
      case '专旺格':
        bonus = 20; // 专旺格 - 专一成格
        break;
      default:
        bonus = 0;
        break;
    }

    print('   特殊格局原始分数: $bonus');
    return bonus;
  }

  // 空亡减分
  static double calculateVoidPenalty(Map<String, String> pillars) {
    double penalty = 0;

    // 检查日柱空亡
    penalty += calculateDayVoidPenalty(pillars);

    // 检查时柱空亡
    penalty += calculateHourVoidPenalty(pillars);

    // 检查年月空亡
    penalty += calculateYearMonthVoidPenalty(pillars);

    return penalty.clamp(0, 5);
  }

  // 日柱空亡减分
  static double calculateDayVoidPenalty(Map<String, String> pillars) {
    final dayPillar = pillars['day']!;

    // 简化的空亡判断：某些日柱组合被认为是空亡
    const voidDays = [
      '甲子',
      '乙丑',
      '丙寅',
      '丁卯',
      '戊辰',
      '己巳',
      '庚午',
      '辛未',
      '壬申',
      '癸酉',
    ];

    if (voidDays.contains(dayPillar)) {
      return 2.0; // 日柱空亡扣分较重
    }

    return 0;
  }

  // 时柱空亡减分
  static double calculateHourVoidPenalty(Map<String, String> pillars) {
    final hourPillar = pillars['hour']!;

    // 简化的时柱空亡判断
    const voidHours = [
      '甲戌',
      '乙亥',
      '丙子',
      '丁丑',
      '戊寅',
      '己卯',
      '庚辰',
      '辛巳',
      '壬午',
      '癸未',
    ];

    if (voidHours.contains(hourPillar)) {
      return 1.0; // 时柱空亡扣分较轻
    }

    return 0;
  }

  // 年月空亡减分
  static double calculateYearMonthVoidPenalty(Map<String, String> pillars) {
    final yearBranch = pillars['year']!.substring(1);
    final monthBranch = pillars['month']!.substring(1);

    // 检查年月地支是否形成空亡组合
    const voidCombinations = [
      ['子', '丑'],
      ['寅', '卯'],
      ['辰', '巳'],
      ['午', '未'],
      ['申', '酉'],
      ['戌', '亥'],
    ];

    for (final combo in voidCombinations) {
      if ((yearBranch == combo[0] && monthBranch == combo[1]) ||
          (yearBranch == combo[1] && monthBranch == combo[0])) {
        return 0.5; // 年月空亡扣分最轻
      }
    }

    return 0;
  }

  // 获取命格等级
  static Map<String, dynamic> getFateLevel(double score) {
    if (score >= 90) {
      return {'name': '上上等命格', 'stars': 5};
    } else if (score >= 80) {
      return {'name': '上等命格', 'stars': 4};
    } else if (score >= 70) {
      return {'name': '中上等命格', 'stars': 4};
    } else if (score >= 60) {
      return {'name': '中等命格', 'stars': 3};
    } else if (score >= 50) {
      return {'name': '中下等命格', 'stars': 3};
    } else if (score >= 40) {
      return {'name': '下等命格', 'stars': 2};
    } else {
      return {'name': '下下等命格', 'stars': 1};
    }
  }

  // 获取命格描述
  static String getFateDescription(double score) {
    if (score >= 90) {
      return '命格层次极高，天赋异禀，一生富贵荣华，功成名就。';
    } else if (score >= 80) {
      return '命格优秀，才华出众，事业有成，财运亨通。';
    } else if (score >= 70) {
      return '命格良好，聪明能干，生活安稳，小有成就。';
    } else if (score >= 60) {
      return '命格平常，勤劳踏实，生活平稳，衣食无忧。';
    } else if (score >= 50) {
      return '命格一般，需要努力，生活有起伏，但总体平安。';
    } else if (score >= 40) {
      return '命格偏弱，多有波折，需要谨慎行事，积德行善。';
    } else {
      return '命格较差，人生多难，需要加倍努力，修身养性。';
    }
  }
}
