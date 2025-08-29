import 'lib/utils/fate_wealth_calculator.dart';
import 'lib/utils/bazi_calculator.dart';

void main() {
  // 测试八字数据
  Map<String, String> testPillars = {
    'year': '甲子',
    'month': '丙寅',
    'day': '戊午',
    'hour': '庚申',
  };
  
  print('=== 测试八字：甲子年 丙寅月 戊午日 庚申时 ===');
  
  // 测试财富等级计算
  print('\n--- 财富等级计算 ---');
  Map<String, dynamic> wealthResult = WealthCalculator.calculateWealthLevel(testPillars);
  double wealthScore = WealthCalculator.calculateWealthScore(testPillars).toDouble();
  
  print('财富等级: ${wealthResult['level']}');
  print('财富评分: ${wealthScore.toStringAsFixed(1)}分');
  print('财富描述: ${wealthResult['description']}');
  print('财富分类: ${wealthResult['class']}');
  
  // 测试命格等级计算
  print('\n--- 命格等级计算 ---');
  Map<String, dynamic> fateResult = FateCalculator.calculateFateLevel(testPillars);
  
  print('命格等级: ${fateResult['level']}');
  print('命格评分: ${fateResult['score']}分');
  print('命格描述: ${fateResult['description']}');
  
  // 测试BaziCalculator的集成方法
  print('\n--- BaziCalculator集成测试 ---');
  Map<String, dynamic> baziData = {
    'yearGan': '甲',
    'yearZhi': '子',
    'monthGan': '丙',
    'monthZhi': '寅',
    'dayGan': '戊',
    'dayZhi': '午',
    'hourGan': '庚',
    'hourZhi': '申',
  };
  
  Map<String, dynamic> wealthAnalysis = BaziCalculator.analyzeWealth(baziData);
  Map<String, dynamic> fateAnalysis = BaziCalculator.analyzeFate(baziData);
  
  print('\n财富分析结果:');
  print('总分: ${wealthAnalysis['totalScore']}');
  print('等级: ${wealthAnalysis['level']}');
  print('描述: ${wealthAnalysis['description']}');
  
  print('\n命格分析结果:');
  print('总分: ${fateAnalysis['totalScore']}');
  print('等级: ${fateAnalysis['level']}');
  print('描述: ${fateAnalysis['description']}');
  
  print('\n=== 测试完成 ===');
}