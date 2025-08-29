import 'lib/utils/fate_wealth_calculator.dart';

void main() {
  print('=== 用户案例验证测试 ===\n');

  // 用户提供的具体案例：壬子，癸卯，甲子，癸酉
  // 原版结果：命格等级93分，财富等级113分
  // 当前结果：命格等级120分，财富等级42分

  Map<String, String> userCase = {
    'year': '壬子',
    'month': '癸卯',
    'day': '甲子',
    'hour': '癸酉',
  };

  print(
    '测试案例: ${userCase['year']} ${userCase['month']} ${userCase['day']} ${userCase['hour']}',
  );
  print('原版期望结果: 命格93分，财富113分');
  print('');

  // 测试当前算法结果
  print('=== 当前算法结果 ===');

  // 财富等级计算
  var wealthResult = WealthCalculator.calculateWealthLevel(userCase);
  var wealthScore = WealthCalculator.calculateWealthScore(userCase);
  print('财富等级:');
  print('  评分: $wealthScore分');
  print('  等级: ${wealthResult['level']}');
  print('  描述: ${wealthResult['description']}');
  print('');

  // 命格等级计算
  var fateResult = FateCalculator.calculateFateLevel(userCase);
  print('命格等级:');
  print('  评分: ${fateResult['score']}分');
  print('  等级: ${fateResult['level']}');
  print('  描述: ${fateResult['description']}');
  print('');

  // 分析差异
  print('=== 差异分析 ===');
  int wealthDiff = wealthScore - 113;
  int fateDiff = fateResult['score'] - 93;

  print('财富评分差异: ${wealthDiff > 0 ? "+" : ""}$wealthDiff分');
  print('命格评分差异: ${fateDiff > 0 ? "+" : ""}$fateDiff分');
  print('');

  if (wealthDiff.abs() > 10 || fateDiff.abs() > 10) {
    print('⚠️  算法差异较大，需要进一步调整');
  } else {
    print('✓ 算法差异在可接受范围内');
  }

  // 详细分析八字结构
  print('');
  print('=== 八字结构分析 ===');

  // 提取天干地支
  String yearGan = userCase['year']![0];
  String yearZhi = userCase['year']![1];
  String monthGan = userCase['month']![0];
  String monthZhi = userCase['month']![1];
  String dayGan = userCase['day']![0];
  String dayZhi = userCase['day']![1];
  String hourGan = userCase['hour']![0];
  String hourZhi = userCase['hour']![1];

  print('天干: $yearGan $monthGan $dayGan $hourGan');
  print('地支: $yearZhi $monthZhi $dayZhi $hourZhi');
  print('日主: $dayGan（甲木）');
  print('');

  // 五行分析
  Map<String, int> elements = {'木': 0, '火': 0, '土': 0, '金': 0, '水': 0};

  Map<String, String> ganElements = {
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

  Map<String, String> zhiElements = {
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

  // 统计天干五行
  for (String gan in [yearGan, monthGan, dayGan, hourGan]) {
    String element = ganElements[gan] ?? '未知';
    elements[element] = (elements[element] ?? 0) + 1;
  }

  // 统计地支五行
  for (String zhi in [yearZhi, monthZhi, dayZhi, hourZhi]) {
    String element = zhiElements[zhi] ?? '未知';
    elements[element] = (elements[element] ?? 0) + 1;
  }

  print('五行分布:');
  elements.forEach((element, count) {
    print('  $element: $count个');
  });

  print('');
  print('=== 测试完成 ===');
}
