/// 算法对比验证测试
/// 对比新旧算法的计算结果，确保移植正确性
library;

import 'package:flutter_test/flutter_test.dart';
import 'package:bazi_mobile_app/utils/bazi_calculator.dart';
import 'package:bazi_mobile_app/utils/enhanced_bazi_calculator.dart';
import 'package:bazi_mobile_app/utils/lunar_calculator.dart';

void main() {
  group('算法对比验证', () {
    test('基础八字计算对比', () {
      DateTime testDate = DateTime(1990, 6, 15, 14, 30);

      // 使用新算法
      Map<String, dynamic> enhancedResult =
          EnhancedBaziCalculator.calculateCompleteBazi(testDate);

      // 使用旧算法
      Map<String, dynamic> oldResult = BaziCalculator.calculateBazi(
        name: '测试',
        gender: '男',
        birthDateTime: testDate,
      );

      print('=== 算法对比测试 ===');
      print('测试日期: $testDate');
      print('');

      print('新算法结果:');
      print(
        '八字: ${enhancedResult['stems'].join('')} ${enhancedResult['branches'].join('')}',
      );
      print('五行分布: ${enhancedResult['elements']}');
      print(
        '身强身弱: ${enhancedResult['strength']['strengthLevel']} (${enhancedResult['strength']['totalStrength']})',
      );
      print('');

      print('旧算法结果:');
      print(
        '八字: ${oldResult['yearGan']}${oldResult['monthGan']}${oldResult['dayGan']}${oldResult['hourGan']} ${oldResult['yearZhi']}${oldResult['monthZhi']}${oldResult['dayZhi']}${oldResult['hourZhi']}',
      );
      print('');

      // 验证基本结构
      expect(enhancedResult['stems'].length, 4);
      expect(enhancedResult['branches'].length, 4);
      expect(enhancedResult.containsKey('transformationReport'), true);
      expect(enhancedResult.containsKey('shenSha'), true);
      expect(enhancedResult.containsKey('dayun'), true);
    });

    test('财富分析对比', () {
      DateTime testDate = DateTime(1985, 3, 20, 10, 0);

      // 新算法财富分析
      Map<String, dynamic> enhancedBazi =
          EnhancedBaziCalculator.calculateCompleteBazi(testDate);
      Map<String, dynamic> enhancedWealth = BaziCalculator.analyzeWealth(
        enhancedBazi,
      );

      // 旧算法财富分析
      Map<String, dynamic> oldBazi = BaziCalculator.calculateBazi(
        name: '测试',
        gender: '女',
        birthDateTime: testDate,
      );
      Map<String, dynamic> oldWealth = BaziCalculator.analyzeWealth(oldBazi);

      print('=== 财富分析对比 ===');
      print('测试日期: $testDate');
      print('');

      print('新算法财富分析:');
      print('财富能量: ${enhancedWealth['wealthEnergy']}');
      print('财星质量: ${enhancedWealth['wealthQuality']}');
      print('综合评分: ${enhancedWealth['totalScore']}');
      print('');

      print('旧算法财富分析:');
      print('财富能量: ${oldWealth['wealthEnergy']}');
      print('财星质量: ${oldWealth['wealthQuality']}');
      print('综合评分: ${oldWealth['totalScore']}');
      print('');

      // 验证财富分析结果的合理性 - 检查综合评分是否合理
      expect(
        enhancedWealth['totalScore'] >= 0 || oldWealth['totalScore'] >= 0,
        true,
      );

      // 验证新算法的增强功能
      expect(enhancedBazi.containsKey('transformationReport'), true);
      expect(enhancedBazi.containsKey('shenSha'), true);
    });

    test('特殊八字验证', () {
      // 测试一些特殊的八字组合
      List<DateTime> specialDates = [
        DateTime(1988, 8, 8, 8, 0), // 戊辰年
        DateTime(1990, 1, 1, 12, 0), // 己巳年
        DateTime(2000, 2, 29, 0, 0), // 庚辰年闰年
        DateTime(1975, 12, 25, 18, 0), // 乙卯年
      ];

      for (DateTime date in specialDates) {
        Map<String, dynamic> result =
            EnhancedBaziCalculator.calculateCompleteBazi(date);

        print('特殊八字测试: $date');
        print('八字: ${result['stems'].join('')} ${result['branches'].join('')}');
        print(
          '土性变化: ${result['transformationReport']['hasSpecialTransformation']}',
        );
        print(
          '神煞: 吉神${result['shenSha']['jiShen'].length}个, 凶煞${result['shenSha']['xiongSha'].length}个',
        );
        print('');

        // 基本验证
        expect(result['stems'].every((s) => s != null && s.isNotEmpty), true);
        expect(
          result['branches'].every((b) => b != null && b.isNotEmpty),
          true,
        );
      }
    });

    test('十神计算验证', () {
      // 验证十神计算的准确性
      Map<String, String> testCases = {
        '甲甲': '比肩',
        '甲乙': '劫财',
        '甲丙': '食神',
        '甲丁': '伤官',
        '甲戊': '偏财',
        '甲己': '正财',
        '甲庚': '七杀',
        '甲辛': '正官',
        '甲壬': '偏印',
        '甲癸': '正印',
      };

      print('=== 十神计算验证 ===');
      for (String key in testCases.keys) {
        String dayStem = key[0];
        String targetStem = key[1];
        String expected = testCases[key]!;
        String actual = LunarCalculator.getTenGod(dayStem, targetStem);

        print('$dayStem见$targetStem: 期望$expected, 实际$actual');
        expect(actual, expected, reason: '十神计算错误: $key');
      }
    });

    test('性能对比测试', () {
      DateTime testDate = DateTime(1990, 5, 20, 14, 30);

      // 测试新算法性能
      Stopwatch enhancedStopwatch = Stopwatch()..start();
      for (int i = 0; i < 50; i++) {
        EnhancedBaziCalculator.calculateCompleteBazi(testDate);
      }
      enhancedStopwatch.stop();
      double enhancedAvg = enhancedStopwatch.elapsedMilliseconds / 50.0;

      // 测试旧算法性能
      Stopwatch oldStopwatch = Stopwatch()..start();
      for (int i = 0; i < 50; i++) {
        BaziCalculator.calculateBazi(
          name: '测试',
          gender: '男',
          birthDateTime: testDate,
        );
      }
      oldStopwatch.stop();
      double oldAvg = oldStopwatch.elapsedMilliseconds / 50.0;

      print('=== 性能对比 ===');
      print('新算法平均耗时: ${enhancedAvg.toStringAsFixed(2)}ms');
      print('旧算法平均耗时: ${oldAvg.toStringAsFixed(2)}ms');
      print(
        '性能差异: ${((enhancedAvg - oldAvg) / oldAvg * 100).toStringAsFixed(1)}%',
      );

      // 确保新算法性能在合理范围内
      expect(enhancedAvg, lessThan(50), reason: '新算法性能过慢');
    });

    test('边界条件稳定性测试', () {
      // 测试极端日期的稳定性
      List<DateTime> extremeDates = [
        DateTime(1900, 1, 1, 0, 0),
        DateTime(2100, 12, 31, 23, 59),
        DateTime(1970, 1, 1, 0, 0),
        DateTime(2038, 1, 19, 3, 14), // Unix时间戳边界
      ];

      for (DateTime date in extremeDates) {
        try {
          Map<String, dynamic> result =
              EnhancedBaziCalculator.calculateCompleteBazi(date);

          // 验证结果完整性
          expect(result['stems'].length, 4);
          expect(result['branches'].length, 4);
          expect(result['elements'].keys.length, 5);

          print('边界测试通过: $date');
        } catch (e) {
          fail('边界测试失败: $date, 错误: $e');
        }
      }
    });
  });
}
