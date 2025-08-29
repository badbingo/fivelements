import 'package:flutter_test/flutter_test.dart';
import 'package:bazi_mobile_app/services/wealth_analysis_service.dart';
import 'package:bazi_mobile_app/services/mingge_analysis_service.dart';

void main() {
  group('八字评分计算测试', () {
    test('财富分析和命格分析测试', () async {
      // 测试八字数据
      final testPillars = {
        'year': '甲子',
        'month': '丙寅',
        'day': '戊辰',
        'hour': '庚申',
      };

      print('=== 测试八字评分计算 ===');
      print(
        '八字: ${testPillars['year']} ${testPillars['month']} ${testPillars['day']} ${testPillars['hour']}',
      );

      // 测试财富分析
      print('\n=== 财富分析测试 ===');
      final wealthResult = await WealthAnalysisService.analyzeWealth(
        testPillars,
      );
      print('财富总分: ${wealthResult['score']}');
      print('财富等级: ${wealthResult['level']}');

      final wealthBreakdown =
          wealthResult['breakdown'] as Map<String, dynamic>? ?? {};
      print('\n财富评分详情:');
      wealthBreakdown.forEach((key, value) {
        if (value is Map) {
          print('  $key:');
          (value).forEach((subKey, subValue) {
            print('    $subKey: $subValue');
          });
        } else {
          print('  $key: $value');
        }
      });

      // 测试命格分析
      print('\n=== 命格分析测试 ===');
      final minggeResult = MinggeAnalysisService.analyzeMingge(testPillars);
      print('命格总分: ${minggeResult['score']}');
      print('命格等级: ${minggeResult['level']}');

      final minggeBreakdown =
          minggeResult['breakdown'] as Map<String, dynamic>? ?? {};
      print('\n命格评分详情:');
      minggeBreakdown.forEach((key, value) {
        if (value is Map) {
          print('  $key:');
          (value).forEach((subKey, subValue) {
            print('    $subKey: $subValue');
          });
        } else {
          print('  $key: $value');
        }
      });
    });
  });
}
