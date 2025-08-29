/// 土性变化计算模块
/// 移植自system/bazinew.html中的EarthTransformationCalculator类
/// 包含湿土遇水变性、三合局影响等复杂逻辑
library;

class EarthTransformationCalculator {
  // 湿土定义（容易受水影响的土）
  static const List<String> wetEarth = ['丑', '辰'];

  // 燥土定义（不易受水影响的土）
  static const List<String> dryEarth = ['未', '戌'];

  // 水元素（天干地支）
  static const List<String> waterStems = ['壬', '癸'];
  static const List<String> waterBranches = ['子', '亥'];

  // 三合局定义
  static const Map<String, Map<String, dynamic>> tripleCombinations = {
    '申子辰': {
      'element': 'water',
      'branches': ['申', '子', '辰'],
    },
    '亥卯未': {
      'element': 'wood',
      'branches': ['亥', '卯', '未'],
    },
    '寅午戌': {
      'element': 'fire',
      'branches': ['寅', '午', '戌'],
    },
    '巳酉丑': {
      'element': 'metal',
      'branches': ['巳', '酉', '丑'],
    },
  };

  /// 分析三合局对土的影响
  /// 对应bazinew.html中的analyzeTripleCombinations方法
  static Map<String, dynamic> analyzeTripleCombinations(List<String> branches) {
    Map<String, dynamic> result = {
      'hasTriple': false,
      'tripleInfo': null,
      'earthImpact': {'affected': false, 'reduction': 0.0, 'reason': ''},
    };

    // 检查巳酉丑三合金局
    List<String> siYouChou = ['巳', '酉', '丑'];
    List<String> foundBranches = siYouChou
        .where((branch) => branches.contains(branch))
        .toList();

    if (foundBranches.length >= 2) {
      result['hasTriple'] = true;
      result['tripleInfo'] = {
        'type': '巳酉丑',
        'element': 'metal',
        'count': foundBranches.length,
        'branches': foundBranches,
        'isComplete': foundBranches.length == 3,
      };

      // 如果丑土参与合金局
      if (foundBranches.contains('丑')) {
        result['earthImpact']['affected'] = true;
        result['earthImpact']['reduction'] = foundBranches.length == 3
            ? 0.7
            : 0.5; // 全三合减弱更多
        result['earthImpact']['reason'] =
            '丑土参与${foundBranches.length == 3 ? '全' : '半'}三合金局，土气被金泄，力量减弱${(result['earthImpact']['reduction'] * 100).toInt()}%';
      }
    }

    return result;
  }

  /// 分析湿土遇水变性
  /// 对应bazinew.html中的analyzeEarthTransformation方法
  static Map<String, dynamic> analyzeEarthTransformation(
    List<String> stems,
    List<String> branches,
  ) {
    // 验证输入数据
    if (stems.length != branches.length) {
      throw ArgumentError('stems and branches must have the same length');
    }

    List<Map<String, dynamic>> transformations = [];
    Map<String, double> elementAdjustments = {
      'wood': 0.0,
      'fire': 0.0,
      'earth': 0.0,
      'metal': 0.0,
      'water': 0.0,
    };

    for (int index = 0; index < branches.length; index++) {
      String branch = branches[index];
      if (wetEarth.contains(branch)) {
        Map<String, dynamic> transformation = checkWetEarthTransformation(
          stems,
          branches,
          index,
        );
        if (transformation['hasTransformation']) {
          transformations.add(transformation);
          // 应用变化到五行调整
          elementAdjustments['earth'] =
              (elementAdjustments['earth']! - transformation['reductionRate']);
          elementAdjustments['water'] =
              (elementAdjustments['water']! + transformation['waterIncrease']);
        }
      }
    }

    return {
      'hasTransformation': transformations.isNotEmpty,
      'hasAnyTransformation': transformations.isNotEmpty,
      'transformations': transformations,
      'elementAdjustments': elementAdjustments,
      'totalEarthReduction': transformations.fold(
        0.0,
        (sum, t) => sum + t['reductionRate'],
      ),
      'totalWaterIncrease': transformations.fold(
        0.0,
        (sum, t) => sum + t['waterIncrease'],
      ),
    };
  }

  /// 检查单个湿土的变性情况
  /// 对应bazinew.html中的checkWetEarthTransformation方法
  static Map<String, dynamic> checkWetEarthTransformation(
    List<String> stems,
    List<String> branches,
    int position,
  ) {
    // 验证索引有效性
    if (position < 0 ||
        position >= branches.length ||
        position >= stems.length) {
      throw RangeError.index(position, stems, 'position');
    }

    String branch = branches[position];
    String stem = stems[position];

    Map<String, dynamic> result = {
      'branch': branch,
      'position': position,
      'hasTransformation': false,
      'originalElement': 'earth',
      'newElement': null,
      'transformationType': null,
      'waterSources': <String>[],
      'reductionRate': 0.0,
      'waterIncrease': 0.0,
      'reason': '',
    };

    double waterInfluence = 0.0;
    List<String> waterSources = [];

    // 1. 检查本柱天干是否为水
    if (waterStems.contains(stem)) {
      waterInfluence += 0.8; // 本柱天干水影响最大
      waterSources.add('本柱天干$stem');
    }

    // 2. 检查相邻地支是否为水
    if (position > 0 && waterBranches.contains(branches[position - 1])) {
      waterInfluence += 0.6;
      waterSources.add('左邻地支${branches[position - 1]}');
    }
    if (position < branches.length - 1 &&
        waterBranches.contains(branches[position + 1])) {
      waterInfluence += 0.6;
      waterSources.add('右邻地支${branches[position + 1]}');
    }

    // 3. 检查其他天干水的影响
    for (int i = 0; i < stems.length; i++) {
      if (i != position && waterStems.contains(stems[i])) {
        waterInfluence += 0.4;
        List<String> positionNames = ['年', '月', '日', '时'];
        waterSources.add('${positionNames[i]}干${stems[i]}');
      }
    }

    // 4. 检查其他地支水的影响
    for (int i = 0; i < branches.length; i++) {
      if (i != position &&
          (i - position).abs() > 1 &&
          waterBranches.contains(branches[i])) {
        waterInfluence += 0.3;
        List<String> positionNames = ['年', '月', '日', '时'];
        waterSources.add('${positionNames[i]}支${branches[i]}');
      }
    }

    // 5. 判断是否发生变性
    if (waterInfluence >= 0.5) {
      // 水影响达到阈值
      result['hasTransformation'] = true;
      result['waterSources'] = waterSources;

      // 计算土力减弱和水力增强的程度
      if (waterInfluence >= 1.5) {
        result['reductionRate'] = 0.7; // 土力减弱70%
        result['waterIncrease'] = 0.5; // 增加50%水力
        result['newElement'] = 'water';
        result['transformationType'] = 'strong';
        result['reason'] = '$branch土受强水影响，土性大幅减弱，偏向水性';
      } else if (waterInfluence >= 1.0) {
        result['reductionRate'] = 0.5; // 土力减弱50%
        result['waterIncrease'] = 0.3; // 增加30%水力
        result['newElement'] = 'water';
        result['transformationType'] = 'medium';
        result['reason'] = '$branch土受中等水影响，土性减弱，略偏水性';
      } else {
        result['reductionRate'] = 0.3; // 土力减弱30%
        result['waterIncrease'] = 0.2; // 增加20%水力
        result['newElement'] = null;
        result['transformationType'] = 'weakened';
        result['reason'] = '$branch土受轻微水影响，土性略有减弱';
      }
    }

    return result;
  }

  /// 增强版五行力量计算
  /// 对应bazinew.html中的calculateEnhancedElements方法
  static Map<String, dynamic> calculateEnhancedElements(
    List<String> stems,
    List<String> branches,
    Map<String, List<String>> branchElements,
  ) {
    Map<String, double> elements = {
      'wood': 0.0,
      'fire': 0.0,
      'earth': 0.0,
      'metal': 0.0,
      'water': 0.0,
    };

    // 基础映射
    Map<String, String> stemElementMap = {
      '甲': 'wood',
      '乙': 'wood',
      '丙': 'fire',
      '丁': 'fire',
      '戊': 'earth',
      '己': 'earth',
      '庚': 'metal',
      '辛': 'metal',
      '壬': 'water',
      '癸': 'water',
    };

    Map<String, String> branchElementMap = {
      '子': 'water',
      '丑': 'earth',
      '寅': 'wood',
      '卯': 'wood',
      '辰': 'earth',
      '巳': 'fire',
      '午': 'fire',
      '未': 'earth',
      '申': 'metal',
      '酉': 'metal',
      '戌': 'earth',
      '亥': 'water',
    };

    // 1. 分析三合局影响
    Map<String, dynamic> tripleAnalysis = analyzeTripleCombinations(branches);

    // 2. 分析土性变化
    Map<String, dynamic> earthTransformation = analyzeEarthTransformation(
      stems,
      branches,
    );

    // 按照baziphone.html的EarthTransformationCalculator.calculateEnhancedElements权重系统
    // 天干1.0，地支主气1.0，藏干0.5
    // 然后加上月令得分/10，再加上合化的影响

    // 3. 计算天干五行（权重1.0）
    for (int index = 0; index < stems.length; index++) {
      String stem = stems[index];
      String? element = stemElementMap[stem];
      if (element != null) {
        elements[element] = (elements[element]! + 1.0);
      }
    }

    // 4. 计算地支主气（权重1.0，考虑土性变化）
    for (int index = 0; index < branches.length; index++) {
      String branch = branches[index];
      String? element = branchElementMap[branch];

      if (element != null) {
        if (element == 'earth') {
          // 检查是否有土性变化
          List<Map<String, dynamic>> transformations =
              earthTransformation['transformations'];
          Map<String, dynamic>? transformation;
          try {
            transformation = transformations.firstWhere(
              (t) => t['position'] == index,
            );
          } catch (e) {
            transformation = null;
          }

          if (transformation != null) {
            // 土力减弱，水力增强
            double reductionRate = (transformation['reductionRate'] as num)
                .toDouble();
            double waterIncrease = (transformation['waterIncrease'] as num)
                .toDouble();
            elements[element] =
                (elements[element]! + 1.0 * (1 - reductionRate));
            elements['water'] = (elements['water']! + 1.0 * waterIncrease);
          } else {
            elements[element] = (elements[element]! + 1.0);
          }
        } else {
          elements[element] = (elements[element]! + 1.0);
        }
      }
    }

    // 5. 计算地支藏干（统一权重0.5，考虑土性变化）
    for (int index = 0; index < branches.length; index++) {
      String branch = branches[index];
      List<String>? hiddenStems = branchElements[branch];
      if (hiddenStems != null) {
        for (String hiddenStem in hiddenStems) {
          String? element = stemElementMap[hiddenStem];
          if (element != null) {
            if (element == 'earth') {
              List<Map<String, dynamic>> transformations =
                  earthTransformation['transformations'];
              Map<String, dynamic>? transformation;
              try {
                transformation = transformations.firstWhere(
                  (t) => t['position'] == index,
                );
              } catch (e) {
                transformation = null;
              }

              if (transformation != null) {
                // 藏干土力也受影响
                double reductionRate = (transformation['reductionRate'] as num)
                    .toDouble();
                double waterIncrease = (transformation['waterIncrease'] as num)
                    .toDouble();
                elements[element] =
                    (elements[element]! + 0.5 * (1 - reductionRate * 0.5));
                elements['water'] =
                    (elements['water']! + 0.5 * waterIncrease * 0.5);
              } else {
                elements[element] = (elements[element]! + 0.5);
              }
            } else {
              elements[element] = (elements[element]! + 0.5);
            }
          }
        }
      }
    }

    // 6. 应用三合局影响
    if (tripleAnalysis['hasTriple']) {
      Map<String, dynamic> tripleInfo = tripleAnalysis['tripleInfo'];
      if (tripleInfo['type'] == '巳酉丑') {
        // 巳酉丑合金局的影响
        double strengthBonus = tripleInfo['isComplete'] ? 1.0 : 0.6;
        elements['metal'] = (elements['metal']! + strengthBonus); // 增强金力
        elements['water'] = (elements['water']! + strengthBonus * 0.5); // 金生水
        elements['fire'] = elements['fire']! > 0.3
            ? elements['fire']! - 0.3
            : 0.0; // 火被金克

        // 如果丑土参与，额外减弱土力
        if (tripleAnalysis['earthImpact']['affected']) {
          double reduction = tripleAnalysis['earthImpact']['reduction'];
          elements['earth'] = elements['earth']! > reduction
              ? elements['earth']! - reduction
              : 0.0;
        }
      }
    }

    // 7. 应用月令占比修复逻辑（按照baziphone.html逻辑）
    if (branches.length >= 2) {
      String monthBranch = branches[1]; // 月支
      String? monthElement = branchElementMap[monthBranch];
      if (monthElement != null && elements[monthElement]! > 0) {
        // 计算总分
        double total = elements.values.fold(0.0, (sum, val) => sum + val);

        // 计算当前月令占比
        double currentRatio = elements[monthElement]! / total;

        // 如果月令占比正好是25%，说明可能需要修复
        if ((currentRatio - 0.25).abs() < 0.001) {
          // 应用修复：月令得分 = 基础分 + 月令加成
          double baseScore = elements[monthElement]!;
          double monthBonus = 1.25; // 月令加成25%
          elements[monthElement] = baseScore + monthBonus;
        }
      }
    }

    return {
      'elements': elements,
      'tripleAnalysis': tripleAnalysis,
      'earthTransformation': earthTransformation,
      'adjustments': {
        'tripleImpact': tripleAnalysis['hasTriple'],
        'earthTransformation': earthTransformation['hasTransformation'],
        'totalEarthReduction':
            (earthTransformation['totalEarthReduction'] as double) +
            (tripleAnalysis['earthImpact']['affected']
                ? tripleAnalysis['earthImpact']['reduction']
                : 0.0),
        'totalWaterIncrease': earthTransformation['totalWaterIncrease'],
      },
    };
  }

  /// 获取土性变化的详细分析报告
  static Map<String, dynamic> getTransformationReport(
    List<String> stems,
    List<String> branches,
  ) {
    Map<String, dynamic> earthTransformation = analyzeEarthTransformation(
      stems,
      branches,
    );
    Map<String, dynamic> tripleAnalysis = analyzeTripleCombinations(branches);

    List<String> reports = [];

    if (earthTransformation['hasTransformation']) {
      List<Map<String, dynamic>> transformations =
          earthTransformation['transformations'];
      for (Map<String, dynamic> transformation in transformations) {
        reports.add(transformation['reason']);
      }
    }

    if (tripleAnalysis['hasTriple']) {
      Map<String, dynamic> earthImpact = tripleAnalysis['earthImpact'];
      if (earthImpact['affected']) {
        reports.add(earthImpact['reason']);
      }
    }

    return {
      'hasSpecialTransformation':
          earthTransformation['hasTransformation'] ||
          tripleAnalysis['hasTriple'],
      'reports': reports,
      'earthTransformation': earthTransformation,
      'tripleAnalysis': tripleAnalysis,
    };
  }
}
