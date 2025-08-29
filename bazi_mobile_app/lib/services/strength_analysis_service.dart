/// 身强身弱分析服务
/// 完全按照baziphone.html的从格优先判断算法实现
/// 实现从格优先判断体系，确保与baziphone.html结果完全一致
library;

import '../models/bazi_models.dart';
import 'cong_ge_strength_service.dart';

class StrengthAnalysisService {
  // 天干五行映射
  static const Map<String, String> ganWuXing = {
    '甲': 'wood', '乙': 'wood',
    '丙': 'fire', '丁': 'fire',
    '戊': 'earth', '己': 'earth',
    '庚': 'metal', '辛': 'metal',
    '壬': 'water', '癸': 'water',
  };

  // 地支五行映射
  static const Map<String, String> zhiWuXing = {
    '子': 'water', '丑': 'earth', '寅': 'wood', '卯': 'wood',
    '辰': 'earth', '巳': 'fire', '午': 'fire', '未': 'earth',
    '申': 'metal', '酉': 'metal', '戌': 'earth', '亥': 'water',
  };

  /// 计算原命局身强身弱分析（完全按照baziphone.html的从格优先算法）
  static OriginalStrengthAnalysis calculateOriginalStrength(
    List<String> stems,
    List<String> branches,
  ) {
    if (stems.length != 4 || branches.length != 4) {
      throw ArgumentError('stems and branches must have exactly 4 elements');
    }

    // 安全检查：确保所有天干地支都不为空
    for (int i = 0; i < 4; i++) {
      if (stems[i].isEmpty || branches[i].isEmpty) {
        throw ArgumentError('天干地支不能为空，当前数据：stems=$stems, branches=$branches');
      }
    }

    String dayStem = stems[2]; // 日干
    String dayElement = ganWuXing[dayStem] ?? 'earth';
    String monthBranch = branches[1]; // 月支
    
    // 构建四柱映射
    Map<String, String> pillars = {
      'year': stems[0] + branches[0],
      'month': stems[1] + branches[1],
      'day': stems[2] + branches[2],
      'hour': stems[3] + branches[3],
    };

    print('🔍 使用从格优先算法分析原命局:');
    print('   四柱: ${pillars['year']} ${pillars['month']} ${pillars['day']} ${pillars['hour']}');

    // 1. 使用从格优先算法判断强度类型
    Map<String, dynamic> congGeResult = CongGeStrengthService.determineStrengthType(pillars);
    
    String strengthType = congGeResult['strengthType'];
    double supportStrength = congGeResult['supportStrength'];
    double weakenStrength = congGeResult['weakenStrength'];
    bool isSpecialPattern = congGeResult['isSpecialPattern'] ?? false;
    double monthScore = congGeResult['monthScore'] ?? 0.0;
    List<String> hehuaInfo = (congGeResult['hehuaInfo'] as List<dynamic>?)?.cast<String>() ?? [];

    print('   从格优先判断结果: $strengthType');
    print('   生扶力量: $supportStrength, 克泄力量: $weakenStrength');
    print('   月令得分: $monthScore');
    print('   是否特殊格局: $isSpecialPattern');

    // 计算强度百分比（与baziphone.html保持一致）
    double strengthPercentage;
    if (isSpecialPattern && strengthType == '从强') {
      // 只有从强格返回100%，其他格局（包括从弱格）都使用正常计算
      strengthPercentage = 100.0;
    } else {
      // 常规计算
      double totalStrength = supportStrength + weakenStrength;
      double strengthRatio = totalStrength > 0 ? supportStrength / totalStrength : 0.5;
      strengthPercentage = strengthRatio * 100;
    }

    // 3. 为了兼容性，计算基础的五行力量分布和合化影响
    Map<String, double> elementStrengths = _calculateBasicElementStrengths(stems, branches);
    Map<String, dynamic> combinationResult = _checkCombinations(stems, branches);

    print('🔍 原命局身强身弱分析结果:');
    print('   日干: $dayStem ($dayElement)');
    print('   月支: $monthBranch');
    print('   月令得分: $monthScore');
    print('   生扶力量: $supportStrength');
    print('   克泄力量: $weakenStrength');
    print('   强度百分比: ${strengthPercentage.toStringAsFixed(2)}%');
    print('   身强身弱: $strengthType');
    print('   是否特殊格局: $isSpecialPattern');

    return OriginalStrengthAnalysis(
      strengthType: strengthType,
      strengthPercentage: strengthPercentage,
      supportStrength: supportStrength,
      weakenStrength: weakenStrength,
      monthScore: monthScore,
      strengthLevel: isSpecialPattern ? 1 : 6, // 临时值，后续完善
      levelDescription: isSpecialPattern ? '特殊格局' : '中和偏弱', // 临时值
      elementStrengths: elementStrengths,
      hehuaInfo: hehuaInfo,
      analysis: '使用从格优先算法分析完成',
    );
  }

  /// 计算基础的五行力量分布（简化版本，用于兼容性）
  static Map<String, double> _calculateBasicElementStrengths(
    List<String> stems,
    List<String> branches,
  ) {
    Map<String, double> elementStrengths = {
      'wood': 0.0,
      'fire': 0.0,
      'earth': 0.0,
      'metal': 0.0,
      'water': 0.0,
    };

    // 计算天干力量
    for (String stem in stems) {
      String element = ganWuXing[stem] ?? 'earth';
      elementStrengths[element] = (elementStrengths[element] ?? 0.0) + 1.0;
    }

    // 计算地支力量（简化版本）
    for (String branch in branches) {
      String element = zhiWuXing[branch] ?? 'earth';
      elementStrengths[element] = (elementStrengths[element] ?? 0.0) + 1.0;
    }

    return elementStrengths;
  }

  /// 检查合化影响（简化版本，用于兼容性）
  static Map<String, dynamic> _checkCombinations(
    List<String> stems,
    List<String> branches,
  ) {
    return {
      'description': '使用从格优先算法，合化影响已集成在强度计算中',
      'tianGanWuHe': [],
      'diZhiLiuHe': [],
      'diZhiSanHe': [],
      'diZhiSanHui': [],
      'hehuaInfo': [],
    };
  }

  /// 计算大运对日主的影响
  static double _calculateDayunInfluence(String dayun, String dayElement) {
    if (dayun.isEmpty || dayun.length < 2) return 0.0;
    
    String dayunStem = dayun[0];
    String dayunBranch = dayun[1];
    
    // 简化计算：天干地支对日主的生克影响
    double stemInfluence = _calculateElementInfluence(dayunStem, dayElement);
    double branchInfluence = _calculateElementInfluence(dayunBranch, dayElement);
    
    return (stemInfluence + branchInfluence) * 0.3; // 大运影响权重30%
  }

  /// 计算流年对日主的影响
  static double _calculateLiunianInfluence(String liunian, String dayElement) {
    if (liunian.isEmpty || liunian.length < 2) return 0.0;
    
    String liunianStem = liunian[0];
    String liunianBranch = liunian[1];
    
    // 简化计算：天干地支对日主的生克影响
    double stemInfluence = _calculateElementInfluence(liunianStem, dayElement);
    double branchInfluence = _calculateElementInfluence(liunianBranch, dayElement);
    
    return (stemInfluence + branchInfluence) * 0.2; // 流年影响权重20%
  }

  /// 计算单个字对日主的五行影响
  static double _calculateElementInfluence(String character, String dayElement) {
    Map<String, String> ganWuXing = {
      '甲': 'wood', '乙': 'wood',
      '丙': 'fire', '丁': 'fire',
      '戊': 'earth', '己': 'earth',
      '庚': 'metal', '辛': 'metal',
      '壬': 'water', '癸': 'water',
    };
    
    Map<String, String> zhiWuXing = {
      '子': 'water', '亥': 'water',
      '寅': 'wood', '卯': 'wood',
      '巳': 'fire', '午': 'fire',
      '申': 'metal', '酉': 'metal',
      '辰': 'earth', '戌': 'earth', '丑': 'earth', '未': 'earth',
    };
    
    String characterElement = ganWuXing[character] ?? zhiWuXing[character] ?? 'earth';
    
    // 五行生克关系
    Map<String, List<String>> shengKe = {
      'wood': ['fire'], // 木生火
      'fire': ['earth'], // 火生土
      'earth': ['metal'], // 土生金
      'metal': ['water'], // 金生水
      'water': ['wood'], // 水生木
    };
    
    Map<String, List<String>> keZhi = {
      'wood': ['earth'], // 木克土
      'fire': ['metal'], // 火克金
      'earth': ['water'], // 土克水
      'metal': ['wood'], // 金克木
      'water': ['fire'], // 水克火
    };
    
    if (characterElement == dayElement) {
      return 2.0; // 同类，生扶
    } else if (shengKe[characterElement]?.contains(dayElement) == true) {
      return 1.5; // 生日主
    } else if (keZhi[dayElement]?.contains(characterElement) == true) {
      return 1.0; // 日主克它，耗日主力量
    } else if (keZhi[characterElement]?.contains(dayElement) == true) {
      return -2.0; // 克日主
    } else if (shengKe[dayElement]?.contains(characterElement) == true) {
      return -1.5; // 日主生它，泄日主力量
    }
    
    return 0.0; // 无直接关系
  }

  /// 计算当前运势身强身弱分析（使用从格优先算法 + 大运流年影响）
  static CurrentStrengthAnalysis calculateCurrentStrength(
    List<String> stems,
    List<String> branches,
    String currentDayun,
    String currentLiunian,
  ) {
    if (stems.length != 4 || branches.length != 4) {
      throw ArgumentError('stems and branches must have exactly 4 elements');
    }

    // 安全检查：确保所有天干地支都不为空
    for (int i = 0; i < 4; i++) {
      if (stems[i].isEmpty || branches[i].isEmpty) {
        throw ArgumentError('天干地支不能为空，当前数据：stems=$stems, branches=$branches');
      }
    }

    String dayStem = stems[2]; // 日干
    String dayElement = ganWuXing[dayStem] ?? 'earth';
    String monthBranch = branches[1]; // 月支
    
    // 构建四柱映射
    Map<String, String> pillars = {
      'year': stems[0] + branches[0],
      'month': stems[1] + branches[1],
      'day': stems[2] + branches[2],
      'hour': stems[3] + branches[3],
    };

    print('🔍 使用从格优先算法分析当前运势:');
    print('   四柱: ${pillars['year']} ${pillars['month']} ${pillars['day']} ${pillars['hour']}');
    print('   大运: $currentDayun, 流年: $currentLiunian');

    // 1. 使用从格优先算法获取基础结果
    Map<String, dynamic> currentResult = CongGeStrengthService.determineStrengthType(pillars);
    
    // 2. 手动加入大运流年影响（简化处理）
    // TODO: 后续可以扩展为完整的大运流年算法
    double dayunInfluence = _calculateDayunInfluence(currentDayun, dayElement);
    double liunianInfluence = _calculateLiunianInfluence(currentLiunian, dayElement);
    
    // 调整生扶克泄力量
    double originalSupportStrength = currentResult['supportStrength'];
    double originalWeakenStrength = currentResult['weakenStrength'];
    
    currentResult['supportStrength'] = originalSupportStrength + dayunInfluence + liunianInfluence;
    currentResult['weakenStrength'] = originalWeakenStrength - (dayunInfluence + liunianInfluence);
    
    String strengthType = currentResult['strengthType'];
    double supportStrength = currentResult['supportStrength'];
    double weakenStrength = currentResult['weakenStrength'];
    bool isSpecialPattern = currentResult['isSpecialPattern'] ?? false;
    double monthScore = currentResult['monthScore'] ?? 0.0;
    List<String> hehuaInfo = (currentResult['hehuaInfo'] as List<dynamic>?)?.cast<String>() ?? [];

    print('   从格优先判断结果: $strengthType');
    print('   生扶力量: $supportStrength, 克泄力量: $weakenStrength');
    print('   月令得分: $monthScore');
    print('   是否特殊格局: $isSpecialPattern');

    // 计算强度百分比（与baziphone.html保持一致）
    double totalStrength = supportStrength + weakenStrength;
    double strengthRatio = totalStrength > 0 ? supportStrength / totalStrength : 0.5;
    double strengthPercentage = strengthRatio * 100;

    // 3. 为了兼容性，计算基础的五行力量分布和合化影响
    Map<String, double> elementStrengths = _calculateBasicElementStrengths(stems, branches);
    Map<String, dynamic> combinationResult = _checkCombinations(stems, branches);

    print('🔍 当前运势身强身弱分析结果:');
    print('   日干: $dayStem ($dayElement)');
    print('   月支: $monthBranch');
    print('   月令得分: $monthScore');
    print('   生扶力量: $supportStrength');
    print('   克泄力量: $weakenStrength');
    print('   强度百分比: ${strengthPercentage.toStringAsFixed(2)}%');
    print('   身强身弱: $strengthType');
    print('   是否特殊格局: $isSpecialPattern');

    return CurrentStrengthAnalysis(
      strengthType: strengthType,
      strengthPercentage: strengthPercentage,
      supportStrength: supportStrength,
      weakenStrength: weakenStrength,
      monthScore: monthScore,
      strengthLevel: isSpecialPattern ? 1 : 6, // 临时值，后续完善
      levelDescription: isSpecialPattern ? '特殊格局' : '中和偏弱', // 临时值
      elementStrengths: elementStrengths,
      hehuaInfo: hehuaInfo,
      analysis: '使用从格优先算法分析完成，已加入大运流年影响',
      currentDayun: currentDayun,
      currentLiunian: currentLiunian,
    );
  }

  /// 生成完整的身强身弱分析（兼容性方法）
  static StrengthAnalysis generateCompleteAnalysis(
    List<String> stems,
    List<String> branches,
    String currentDayun,
    String currentLiunian,
  ) {
    final originalAnalysis = calculateOriginalStrength(stems, branches);
    final currentAnalysis = calculateCurrentStrength(stems, branches, currentDayun, currentLiunian);
    
    // 生成对比说明
    String comparisonNote = '原命局${originalAnalysis.strengthType}，';
    if (originalAnalysis.strengthLevel == 1) {
      comparisonNote += '属于特殊格局。';
    } else {
      comparisonNote += '当前运势${currentAnalysis.strengthType}。';
    }
    
    return StrengthAnalysis(
      original: originalAnalysis,
      current: currentAnalysis,
      comparisonNote: comparisonNote,
    );
  }
}