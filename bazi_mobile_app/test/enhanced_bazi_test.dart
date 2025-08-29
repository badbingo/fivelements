/// 增强版八字算法测试
/// 验证移植自bazinew.html的算法正确性
library;

import 'package:flutter_test/flutter_test.dart';
import 'package:bazi_mobile_app/utils/enhanced_bazi_calculator.dart';
import 'package:bazi_mobile_app/utils/earth_transformation_calculator.dart';
import 'package:bazi_mobile_app/utils/lunar_calculator.dart';

void main() {
  group('增强版八字算法测试', () {
    test('基础八字计算测试', () {
      // 测试日期：1990年1月1日12时
      DateTime testDate = DateTime(1990, 1, 1, 12, 0);

      Map<String, dynamic> result =
          EnhancedBaziCalculator.calculateCompleteBazi(testDate);

      // 验证基本结构
      expect(result.containsKey('basicInfo'), true);
      expect(result.containsKey('stems'), true);
      expect(result.containsKey('branches'), true);
      expect(result.containsKey('elements'), true);
      expect(result.containsKey('tenGods'), true);
      expect(result.containsKey('strength'), true);

      // 验证四柱长度
      expect(result['stems'].length, 4);
      expect(result['branches'].length, 4);

      print('测试日期: $testDate');
      print('八字: ${result['stems'].join('')} ${result['branches'].join('')}');
      print('五行分布: ${result['elements']}');
      print('身强身弱: ${result['strength']['strengthLevel']}');
    });

    test('土性变化计算测试', () {
      // 测试湿土遇水的情况
      List<String> stems = ['壬', '癸', '戊', '甲'];
      List<String> branches = ['子', '丑', '辰', '寅'];

      Map<String, dynamic> transformation =
          EarthTransformationCalculator.analyzeEarthTransformation(
            stems,
            branches,
          );

      expect(transformation.containsKey('hasTransformation'), true);
      expect(transformation.containsKey('transformations'), true);

      print('土性变化测试:');
      print('天干: ${stems.join('')}');
      print('地支: ${branches.join('')}');
      print('是否有变化: ${transformation['hasTransformation']}');

      if (transformation['hasTransformation']) {
        List<Map<String, dynamic>> transformations =
            transformation['transformations'];
        for (var t in transformations) {
          print('变化详情: ${t['reason']}');
        }
      }
    });

    test('三合局影响测试', () {
      // 测试巳酉丑三合金局
      List<String> branches = ['巳', '酉', '丑', '寅'];

      Map<String, dynamic> tripleAnalysis =
          EarthTransformationCalculator.analyzeTripleCombinations(branches);

      expect(tripleAnalysis.containsKey('hasTriple'), true);

      print('三合局测试:');
      print('地支: ${branches.join('')}');
      print('是否有三合: ${tripleAnalysis['hasTriple']}');

      if (tripleAnalysis['hasTriple']) {
        Map<String, dynamic> tripleInfo = tripleAnalysis['tripleInfo'];
        print('三合类型: ${tripleInfo['type']}');
        print('三合五行: ${tripleInfo['element']}');
        print('参与地支: ${tripleInfo['branches']}');
      }
    });

    test('十神计算测试', () {
      String dayStem = '甲';
      List<String> testStems = ['甲', '乙', '丙', '丁', '戊'];

      for (String stem in testStems) {
        String tenGod = LunarCalculator.getTenGod(dayStem, stem);
        print('日主$dayStem 见 $stem = $tenGod');
      }

      // 验证十神映射正确性
      expect(LunarCalculator.getTenGod('甲', '甲'), '比肩');
      expect(LunarCalculator.getTenGod('甲', '乙'), '劫财');
      expect(LunarCalculator.getTenGod('甲', '丙'), '食神');
      expect(LunarCalculator.getTenGod('甲', '戊'), '偏财');
      expect(LunarCalculator.getTenGod('甲', '庚'), '七杀');
    });

    test('神煞计算测试', () {
      // 测试特定八字的神煞
      DateTime testDate = DateTime(1985, 6, 15, 14, 30);
      Map<String, dynamic> result =
          EnhancedBaziCalculator.calculateCompleteBazi(testDate);

      Map<String, dynamic> shenSha = result['shenSha'];

      expect(shenSha.containsKey('jiShen'), true);
      expect(shenSha.containsKey('xiongSha'), true);

      print('神煞测试:');
      print('吉神: ${shenSha['jiShen']}');
      print('凶煞: ${shenSha['xiongSha']}');
    });

    test('大运计算测试', () {
      DateTime testDate = DateTime(1990, 3, 21, 10, 0);
      Map<String, dynamic> result =
          EnhancedBaziCalculator.calculateCompleteBazi(testDate);

      List<Map<String, dynamic>> dayun = result['dayun'];

      expect(dayun.length, 8);

      print('大运测试:');
      for (int i = 0; i < 3; i++) {
        Map<String, dynamic> yun = dayun[i];
        print(
          '第${i + 1}步大运: ${yun['pillar']} (${yun['startAge']}-${yun['endAge']}岁)',
        );
      }
    });

    test('综合分析报告测试', () {
      DateTime testDate = DateTime(1988, 8, 8, 8, 0);
      Map<String, dynamic> baziData =
          EnhancedBaziCalculator.calculateCompleteBazi(testDate);
      Map<String, dynamic> report =
          EnhancedBaziCalculator.generateDetailedReport(baziData);

      expect(report.containsKey('summary'), true);
      expect(report.containsKey('reports'), true);

      print('综合分析报告:');
      print(report['summary']);
    });

    test('算法性能测试', () {
      Stopwatch stopwatch = Stopwatch()..start();

      // 批量计算100个八字
      for (int i = 0; i < 100; i++) {
        DateTime testDate = DateTime(
          1980 + i % 40,
          (i % 12) + 1,
          (i % 28) + 1,
          (i % 24),
        );
        EnhancedBaziCalculator.calculateCompleteBazi(testDate);
      }

      stopwatch.stop();
      double avgTime = stopwatch.elapsedMilliseconds / 100.0;

      print('性能测试: 100次计算平均耗时 ${avgTime.toStringAsFixed(2)}ms');

      // 确保平均计算时间在合理范围内（小于100ms）
      expect(avgTime, lessThan(100));
    });

    test('边界情况测试', () {
      // 测试极端日期
      List<DateTime> testDates = [
        DateTime(1900, 1, 1, 0, 0),
        DateTime(2100, 12, 31, 23, 59),
        DateTime(2000, 2, 29, 12, 0), // 闰年
        DateTime(1970, 1, 1, 0, 0), // Unix纪元
      ];

      for (DateTime date in testDates) {
        try {
          Map<String, dynamic> result =
              EnhancedBaziCalculator.calculateCompleteBazi(date);
          expect(result['stems'].length, 4);
          expect(result['branches'].length, 4);
          print('边界测试通过: $date');
        } catch (e) {
          fail('边界测试失败: $date, 错误: $e');
        }
      }
    });
  });

  group('与原始算法对比测试', () {
    test('基础八字对比', () {
      // 这里可以添加与bazinew.html结果的对比测试
      // 由于无法直接调用JavaScript，这里主要验证算法逻辑的一致性

      DateTime testDate = DateTime(1990, 5, 20, 14, 30);
      Map<String, dynamic> result =
          EnhancedBaziCalculator.calculateCompleteBazi(testDate);

      // 验证关键算法特征
      expect(
        result['transformationReport'].containsKey('hasSpecialTransformation'),
        true,
      );
      expect(result['strength'].containsKey('strengthLevel'), true);
      expect(result['elements'].keys.length, 5); // 五行都应该有值

      print('算法特征验证通过');
    });
  });
}
