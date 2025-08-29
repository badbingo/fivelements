import 'enhanced_bazi_calculator.dart';
import 'fate_wealth_calculator.dart';

class BaziCalculator {
  // 天干地支数组
  static const List<String> tiangan = [
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
  static const List<String> dizhi = [
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

  // 五行属性
  static const Map<String, String> wuxingMap = {
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

  // 十神关系
  static const Map<String, Map<String, String>> tenGodsMap = {
    '木': {'木': '比肩', '火': '食神', '土': '偏财', '金': '七杀', '水': '正印'},
    '火': {'木': '正印', '火': '比肩', '土': '食神', '金': '偏财', '水': '七杀'},
    '土': {'木': '七杀', '火': '正印', '土': '比肩', '金': '食神', '水': '偏财'},
    '金': {'木': '偏财', '火': '七杀', '土': '正印', '金': '比肩', '水': '食神'},
    '水': {'木': '食神', '火': '偏财', '土': '七杀', '金': '正印', '水': '比肩'},
  };

  // 月令旺衰表
  static const Map<String, Map<String, String>> monthStrengthMap = {
    '寅': {'木': '旺', '火': '相', '土': '死', '金': '囚', '水': '休'},
    '卯': {'木': '旺', '火': '相', '土': '死', '金': '囚', '水': '休'},
    '辰': {'土': '旺', '金': '相', '水': '死', '木': '囚', '火': '休'},
    '巳': {'火': '旺', '土': '相', '金': '死', '水': '囚', '木': '休'},
    '午': {'火': '旺', '土': '相', '金': '死', '水': '囚', '木': '休'},
    '未': {'土': '旺', '金': '相', '水': '死', '木': '囚', '火': '休'},
    '申': {'金': '旺', '水': '相', '木': '死', '火': '囚', '土': '休'},
    '酉': {'金': '旺', '水': '相', '木': '死', '火': '囚', '土': '休'},
    '戌': {'土': '旺', '金': '相', '水': '死', '木': '囚', '火': '休'},
    '亥': {'水': '旺', '木': '相', '火': '死', '土': '囚', '金': '休'},
    '子': {'水': '旺', '木': '相', '火': '死', '土': '囚', '金': '休'},
    '丑': {'土': '旺', '金': '相', '水': '死', '木': '囚', '火': '休'},
  };

  // 获取五行属性
  static String getWuxing(String ganZhi) {
    return wuxingMap[ganZhi] ?? '';
  }

  // 获取十神关系
  static String getTenGod(String dayGan, String targetGan) {
    String dayWuxing = getWuxing(dayGan);
    String targetWuxing = getWuxing(targetGan);
    return tenGodsMap[dayWuxing]?[targetWuxing] ?? '';
  }

  // 计算财星能量（使用新算法）
  static int calculateWealthEnergy(Map<String, dynamic> baziData) {
    // 转换数据格式 - 组合天干地支
    Map<String, String> pillars = {
      'year': '${baziData['yearGan'] ?? ''}${baziData['yearZhi'] ?? ''}',
      'month': '${baziData['monthGan'] ?? ''}${baziData['monthZhi'] ?? ''}',
      'day': '${baziData['dayGan'] ?? ''}${baziData['dayZhi'] ?? ''}',
      'hour': '${baziData['hourGan'] ?? ''}${baziData['hourZhi'] ?? ''}',
    };
    // 使用新的财富分数计算器
    return WealthCalculator.calculateWealthScore(pillars);
  }

  // 计算财星质量（使用新算法）
  static int calculateWealthQuality(Map<String, dynamic> baziData) {
    // 转换数据格式 - 组合天干地支
    Map<String, String> pillars = {
      'year': '${baziData['yearGan'] ?? ''}${baziData['yearZhi'] ?? ''}',
      'month': '${baziData['monthGan'] ?? ''}${baziData['monthZhi'] ?? ''}',
      'day': '${baziData['dayGan'] ?? ''}${baziData['dayZhi'] ?? ''}',
      'hour': '${baziData['hourGan'] ?? ''}${baziData['hourZhi'] ?? ''}',
    };
    // 使用新的财富分数计算器的部分分数
    int totalScore = WealthCalculator.calculateWealthScore(pillars);
    return (totalScore * 0.3).round(); // 质量占总分的30%
  }

  // 计算财星流通（使用新算法）
  static int calculateWealthFlow(Map<String, dynamic> baziData) {
    // 转换数据格式 - 组合天干地支
    Map<String, String> pillars = {
      'year': '${baziData['yearGan'] ?? ''}${baziData['yearZhi'] ?? ''}',
      'month': '${baziData['monthGan'] ?? ''}${baziData['monthZhi'] ?? ''}',
      'day': '${baziData['dayGan'] ?? ''}${baziData['dayZhi'] ?? ''}',
      'hour': '${baziData['hourGan'] ?? ''}${baziData['hourZhi'] ?? ''}',
    };
    // 使用新的财富分数计算器的部分分数
    int totalScore = WealthCalculator.calculateWealthScore(pillars);
    return (totalScore * 0.25).round(); // 流通占总分的25%
  }

  // 计算十神组合特效（使用新算法）
  static int calculateTenGodsCombo(Map<String, dynamic> baziData) {
    // 转换数据格式 - 组合天干地支
    Map<String, String> pillars = {
      'year': '${baziData['yearGan'] ?? ''}${baziData['yearZhi'] ?? ''}',
      'month': '${baziData['monthGan'] ?? ''}${baziData['monthZhi'] ?? ''}',
      'day': '${baziData['dayGan'] ?? ''}${baziData['dayZhi'] ?? ''}',
      'hour': '${baziData['hourGan'] ?? ''}${baziData['hourZhi'] ?? ''}',
    };
    // 使用新的财富分数计算器的部分分数
    int totalScore = WealthCalculator.calculateWealthScore(pillars);
    return (totalScore * 0.2).round(); // 十神组合占总分的20%
  }

  // 计算八字（使用增强版算法）
  static Future<Map<String, dynamic>> calculateBazi({
    required String name,
    required String gender,
    required DateTime birthDateTime,
  }) async {
    try {
      // 使用增强版八字计算器
      Map<String, dynamic> enhancedBazi =
          await EnhancedBaziCalculator.calculateCompleteBazi(birthDateTime);

      // 安全获取数据，添加空值检查
      Map<String, dynamic>? basicInfo =
          enhancedBazi['basicInfo'] as Map<String, dynamic>?;
      List<dynamic>? stemsRaw = enhancedBazi['stems'] as List<dynamic>?;
      List<dynamic>? branchesRaw = enhancedBazi['branches'] as List<dynamic>?;

      // 确保stems和branches不为空且长度足够
      List<String> stems = [];
      List<String> branches = [];

      if (stemsRaw != null && stemsRaw.length >= 4) {
        stems = stemsRaw.map((e) => e?.toString() ?? '').toList();
      } else {
        stems = ['', '', '', ''];
      }

      if (branchesRaw != null && branchesRaw.length >= 4) {
        branches = branchesRaw.map((e) => e?.toString() ?? '').toList();
      } else {
        branches = ['', '', '', ''];
      }

      return {
        'name': name,
        'gender': gender,
        'birthDateTime': birthDateTime.toIso8601String(),
        'solarDate':
            '${birthDateTime.year}-${birthDateTime.month.toString().padLeft(2, '0')}-${birthDateTime.day.toString().padLeft(2, '0')}',
        'lunarDate': basicInfo?['lunarDate']?.toString() ?? '',
        'yearGan': stems[0],
        'yearZhi': branches[0],
        'monthGan': stems[1],
        'monthZhi': branches[1],
        'dayGan': stems[2],
        'dayZhi': branches[2],
        'hourGan': stems[3],
        'hourZhi': branches[3],
        'year': birthDateTime.year.toString(),
        'month': birthDateTime.month.toString(),
        'day': birthDateTime.day.toString(),
        'hour': birthDateTime.hour.toString(),
        // 添加增强版数据
        'enhancedData': enhancedBazi,
      };
    } catch (e) {
      // 如果计算失败，抛出更详细的错误信息
      throw Exception('八字计算失败: $e');
    }
  }

  // 综合财富分析（使用新算法）
  static Map<String, dynamic> analyzeWealth(Map<String, dynamic> baziData) {
    // 转换数据格式 - 组合天干地支
    Map<String, String> pillars = {
      'year': '${baziData['yearGan'] ?? ''}${baziData['yearZhi'] ?? ''}',
      'month': '${baziData['monthGan'] ?? ''}${baziData['monthZhi'] ?? ''}',
      'day': '${baziData['dayGan'] ?? ''}${baziData['dayZhi'] ?? ''}',
      'hour': '${baziData['hourGan'] ?? ''}${baziData['hourZhi'] ?? ''}',
    };
    // 使用新的财富等级计算器
    Map<String, dynamic> wealthResult = WealthCalculator.calculateWealthLevel(
      pillars,
    );
    int wealthScore = WealthCalculator.calculateWealthScore(pillars);

    // 保持向后兼容，计算旧版本的分项分数
    int wealthEnergy = calculateWealthEnergy(baziData);
    int wealthQuality = calculateWealthQuality(baziData);
    int wealthFlow = calculateWealthFlow(baziData);
    int tenGodsCombo = calculateTenGodsCombo(baziData);

    return {
      'totalScore': wealthScore,
      'wealthStarQuality': wealthQuality,
      'wealthStarFlow': wealthFlow,
      'tenGodsCombo': tenGodsCombo,
      'level': wealthResult['level'],
      'description': wealthResult['description'],
      'class': wealthResult['class'],
      'details': [
        '财富总分: ${wealthScore.round()}分',
        '财星能量: ${wealthEnergy.round()}分',
        '财星质量: ${wealthQuality.round()}分',
        '财星流通: ${wealthFlow.round()}分',
        '十神组合: ${tenGodsCombo.round()}分',
      ],
    };
  }

  // 命格等级分析
  static Map<String, dynamic> analyzeFate(Map<String, dynamic> baziData) {
    // 转换数据格式 - 组合天干地支
    Map<String, String> pillars = {
      'year': '${baziData['yearGan'] ?? ''}${baziData['yearZhi'] ?? ''}',
      'month': '${baziData['monthGan'] ?? ''}${baziData['monthZhi'] ?? ''}',
      'day': '${baziData['dayGan'] ?? ''}${baziData['dayZhi'] ?? ''}',
      'hour': '${baziData['hourGan'] ?? ''}${baziData['hourZhi'] ?? ''}',
    };
    Map<String, dynamic> fateResult = FateCalculator.calculateFateLevel(
      pillars,
    );
    double fateScore = (fateResult['score'] as int).toDouble();

    return {
      'totalScore': fateScore,
      'level': fateResult['level'],
      'description': fateResult['description'],
      'class': fateResult['class'],
      'details': [
        '命格总分: ${fateScore.round()}分',
        '等级评定: ${fateResult['level']}',
      ],
    };
  }
}
