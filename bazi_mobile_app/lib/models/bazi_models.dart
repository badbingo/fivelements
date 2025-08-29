/// 八字相关数据模型
library;

/// 八字输入数据
class BaziInput {
  final String name;
  final DateTime birthDate;
  final String birthTime;
  final String gender;
  final String? birthPlace;
  final bool isLunar;

  BaziInput({
    required this.name,
    required this.birthDate,
    required this.birthTime,
    required this.gender,
    this.birthPlace,
    this.isLunar = false,
  });

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'birthDate':
          '${birthDate.year}-${birthDate.month.toString().padLeft(2, '0')}-${birthDate.day.toString().padLeft(2, '0')}',
      'birthTime': birthTime,
      'gender': gender,
      'birthPlace': birthPlace,
      'isLunar': isLunar,
    };
  }

  factory BaziInput.fromJson(Map<String, dynamic> json) {
    return BaziInput(
      name: json['name'] ?? '',
      birthDate: DateTime.parse(json['birthDate'] ?? DateTime.now().toIso8601String()),
      birthTime: json['birthTime'] ?? '',
      gender: json['gender'] ?? '',
      birthPlace: json['birthPlace'],
      isLunar: json['isLunar'] ?? false,
    );
  }
}

/// 八字计算结果
class BaziResult {
  final String id;
  final BaziPaipan paipan;
  final WuxingAnalysis wuxing;
  final String basicAnalysis;
  final double score;
  final DateTime calculatedAt;
  final String? luckStartingTime; // 起运时间
  final String? currentDayun; // 当前大运
  final StrengthAnalysis? strengthAnalysis; // 身强身弱分析
  final PersonalityAnalysis? personality;
  final DayunAnalysis? dayun;
  final LiunianAnalysis? liunian;
  final CareerAnalysis? career;
  final MarriageAnalysis? marriage;
  final HealthAnalysis? health;

  BaziResult({
    required this.id,
    required this.paipan,
    required this.wuxing,
    required this.basicAnalysis,
    required this.score,
    required this.calculatedAt,
    this.luckStartingTime,
    this.currentDayun,
    this.strengthAnalysis,
    this.personality,
    this.dayun,
    this.liunian,
    this.career,
    this.marriage,
    this.health,
  });

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'paipan': paipan.toJson(),
      'wuxing': wuxing.toJson(),
      'basicAnalysis': basicAnalysis,
      'score': score,
      'calculatedAt': calculatedAt.toIso8601String(),
      if (luckStartingTime != null) 'luckStartingTime': luckStartingTime,
      if (currentDayun != null) 'currentDayun': currentDayun,
      if (strengthAnalysis != null)
        'strengthAnalysis': strengthAnalysis!.toJson(),
      if (personality != null) 'personality': personality!.toJson(),
      if (dayun != null) 'dayun': dayun!.toJson(),
      if (liunian != null) 'liunian': liunian!.toJson(),
      if (career != null) 'career': career!.toJson(),
      if (marriage != null) 'marriage': marriage!.toJson(),
      if (health != null) 'health': health!.toJson(),
    };
  }

  factory BaziResult.fromJson(Map<String, dynamic> json) {
    return BaziResult(
      id: json['id'] ?? DateTime.now().millisecondsSinceEpoch.toString(),
      paipan: BaziPaipan.fromJson(json['bazi'] ?? {}),
      wuxing: WuxingAnalysis.fromJson(json['wuxing'] ?? {}),
      basicAnalysis: json['basicAnalysis'] ?? '',
      score: (json['score'] ?? 0.0).toDouble(),
      calculatedAt: json['calculatedAt'] != null
          ? DateTime.parse(json['calculatedAt'])
          : DateTime.now(),
      luckStartingTime: json['luckStartingTime'],
      currentDayun: json['currentDayun'],
      strengthAnalysis: json['strengthAnalysis'] != null
          ? StrengthAnalysis.fromJson(json['strengthAnalysis'])
          : null,
      personality: json['personality'] != null
          ? PersonalityAnalysis.fromJson(json['personality'])
          : null,
      dayun: json['dayunAnalysis'] != null
          ? DayunAnalysis.fromJson(json['dayunAnalysis'])
          : null,
      liunian: json['liunian'] != null
          ? LiunianAnalysis.fromJson(json['liunian'])
          : null,
      career: json['career'] != null
          ? CareerAnalysis.fromJson(json['career'])
          : null,
      marriage: json['marriage'] != null
          ? MarriageAnalysis.fromJson(json['marriage'])
          : null,
      health: json['health'] != null
          ? HealthAnalysis.fromJson(json['health'])
          : null,
    );
  }
}

/// 八字排盘
class BaziPaipan {
  final String yearPillar;
  final String monthPillar;
  final String dayPillar;
  final String hourPillar;
  final String yearNayin;
  final String dayMaster;
  final List<String> tenGods;
  final List<String> earthlyBranches;

  BaziPaipan({
    required this.yearPillar,
    required this.monthPillar,
    required this.dayPillar,
    required this.hourPillar,
    required this.yearNayin,
    required this.dayMaster,
    required this.tenGods,
    required this.earthlyBranches,
  });

  Map<String, dynamic> toJson() {
    return {
      'yearPillar': yearPillar,
      'monthPillar': monthPillar,
      'dayPillar': dayPillar,
      'hourPillar': hourPillar,
      'yearNayin': yearNayin,
      'dayMaster': dayMaster,
      'tenGods': tenGods,
      'earthlyBranches': earthlyBranches,
    };
  }

  factory BaziPaipan.fromJson(Map<String, dynamic> json) {
    return BaziPaipan(
      yearPillar: json['yearPillar'] ?? '',
      monthPillar: json['monthPillar'] ?? '',
      dayPillar: json['dayPillar'] ?? '',
      hourPillar: json['hourPillar'] ?? '',
      yearNayin: json['yearNayin'] ?? '',
      dayMaster: json['dayMaster'] ?? '',
      tenGods: List<String>.from(json['tenGods'] ?? []),
      earthlyBranches: List<String>.from(json['earthlyBranches'] ?? []),
    );
  }
}

/// 五行分析
class WuxingAnalysis {
  final Map<String, int> elements;
  final Map<String, double> percentages;
  final String strongestElement;
  final String weakestElement;
  final List<String> missingElements;
  final String balance;
  final String advice;

  WuxingAnalysis({
    required this.elements,
    required this.percentages,
    required this.strongestElement,
    required this.weakestElement,
    required this.missingElements,
    required this.balance,
    required this.advice,
  });

  Map<String, dynamic> toJson() {
    return {
      'elements': elements,
      'percentages': percentages,
      'strongestElement': strongestElement,
      'weakestElement': weakestElement,
      'missingElements': missingElements,
      'balance': balance,
      'advice': advice,
    };
  }

  factory WuxingAnalysis.fromJson(Map<String, dynamic> json) {
    return WuxingAnalysis(
      elements: Map<String, int>.from(json['elements'] ?? {}),
      percentages: (json['percentages'] as Map<String, dynamic>? ?? {}).map(
        (key, value) => MapEntry(key, (value as num).toDouble()),
      ),
      strongestElement: json['strongestElement'] ?? '',
      weakestElement: json['weakestElement'] ?? '',
      missingElements: List<String>.from(json['missingElements'] ?? []),
      balance: json['balance'] ?? '',
      advice: json['advice'] ?? '',
    );
  }
}

/// 八字记录
class BaziRecord {
  final String id;
  final String name;
  final DateTime birthDate;
  final String birthTime;
  final BaziResult result;
  final DateTime createdAt;
  final bool isFavorite;

  BaziRecord({
    required this.id,
    required this.name,
    required this.birthDate,
    required this.birthTime,
    required this.result,
    required this.createdAt,
    this.isFavorite = false,
  });

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'birthDate': birthDate.toIso8601String(),
      'birthTime': birthTime,
      'result': result.toJson(),
      'createdAt': createdAt.toIso8601String(),
      'isFavorite': isFavorite,
    };
  }

  factory BaziRecord.fromJson(Map<String, dynamic> json) {
    return BaziRecord(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      birthDate: DateTime.parse(json['birthDate'] ?? DateTime.now().toIso8601String()),
      birthTime: json['birthTime'] ?? '',
      result: BaziResult.fromJson(json['result'] ?? {}),
      createdAt: DateTime.parse(json['createdAt'] ?? DateTime.now().toIso8601String()),
      isFavorite: json['isFavorite'] ?? false,
    );
  }
}

/// 运势分析
class FortuneAnalysis {
  final String period;
  final String overall;
  final String career;
  final String wealth;
  final String relationship;
  final String health;
  final List<String> luckyColors;
  final List<int> luckyNumbers;
  final String advice;

  FortuneAnalysis({
    required this.period,
    required this.overall,
    required this.career,
    required this.wealth,
    required this.relationship,
    required this.health,
    required this.luckyColors,
    required this.luckyNumbers,
    required this.advice,
  });

  Map<String, dynamic> toJson() {
    return {
      'period': period,
      'overall': overall,
      'career': career,
      'wealth': wealth,
      'relationship': relationship,
      'health': health,
      'luckyColors': luckyColors,
      'luckyNumbers': luckyNumbers,
      'advice': advice,
    };
  }

  factory FortuneAnalysis.fromJson(Map<String, dynamic> json) {
    return FortuneAnalysis(
      period: json['period'] ?? '',
      overall: json['overall'] ?? '',
      career: json['career'] ?? '',
      wealth: json['wealth'] ?? '',
      relationship: json['relationship'] ?? '',
      health: json['health'] ?? '',
      luckyColors: List<String>.from(json['luckyColors'] ?? []),
      luckyNumbers: List<int>.from(json['luckyNumbers'] ?? []),
      advice: json['advice'] ?? '',
    );
  }
}

/// 性格分析
class PersonalityAnalysis {
  final String basicTrait;
  final String detailedAnalysis;
  final List<String> strengths;
  final List<String> weaknesses;
  final List<String> suggestions;

  PersonalityAnalysis({
    required this.basicTrait,
    required this.detailedAnalysis,
    required this.strengths,
    required this.weaknesses,
    required this.suggestions,
  });

  Map<String, dynamic> toJson() {
    return {
      'basicTrait': basicTrait,
      'detailedAnalysis': detailedAnalysis,
      'strengths': strengths,
      'weaknesses': weaknesses,
      'suggestions': suggestions,
    };
  }

  factory PersonalityAnalysis.fromJson(Map<String, dynamic> json) {
    return PersonalityAnalysis(
      basicTrait: json['basicTrait'] ?? '',
      detailedAnalysis: json['detailedAnalysis'] ?? '',
      strengths: List<String>.from(json['strengths'] ?? []),
      weaknesses: List<String>.from(json['weaknesses'] ?? []),
      suggestions: List<String>.from(json['suggestions'] ?? []),
    );
  }
}

/// 大运分析
class DayunAnalysis {
  final List<Map<String, dynamic>> periods;
  final Map<String, dynamic> current;
  final String overall;
  final List<String> advice;

  DayunAnalysis({
    required this.periods,
    required this.current,
    required this.overall,
    required this.advice,
  });

  Map<String, dynamic> toJson() {
    return {
      'periods': periods,
      'current': current,
      'overall': overall,
      'advice': advice,
    };
  }

  factory DayunAnalysis.fromJson(dynamic json) {
    // 如果后端直接返回数组，则将其作为periods处理
    if (json is List) {
      return DayunAnalysis(
        periods: List<Map<String, dynamic>>.from(json),
        current: {},
        overall: '',
        advice: [],
      );
    }

    // 如果是对象格式，检查是否有dayuns字段（后端实际结构）
    if (json is Map<String, dynamic>) {
      if (json.containsKey('dayuns')) {
        return DayunAnalysis(
          periods: List<Map<String, dynamic>>.from(json['dayuns'] ?? []),
          current: {'startAge': json['startAge'] ?? 0},
          overall: '',
          advice: [],
        );
      }

      // 标准格式处理
      return DayunAnalysis(
        periods: List<Map<String, dynamic>>.from(json['periods'] ?? []),
        current: Map<String, dynamic>.from(json['current'] ?? {}),
        overall: json['overall'] ?? '',
        advice: List<String>.from(json['advice'] ?? []),
      );
    }

    // 默认返回空对象
    return DayunAnalysis(periods: [], current: {}, overall: '', advice: []);
  }
}

/// 流年分析
class LiunianAnalysis {
  final List<Map<String, dynamic>> years;
  final Map<String, dynamic> current;
  final String overall;
  final List<String> advice;

  LiunianAnalysis({
    required this.years,
    required this.current,
    required this.overall,
    required this.advice,
  });

  Map<String, dynamic> toJson() {
    return {
      'years': years,
      'current': current,
      'overall': overall,
      'advice': advice,
    };
  }

  factory LiunianAnalysis.fromJson(dynamic json) {
    // 如果后端直接返回数组，则将其作为years处理
    if (json is List) {
      return LiunianAnalysis(
        years: List<Map<String, dynamic>>.from(json),
        current: {},
        overall: '',
        advice: [],
      );
    }

    // 如果是对象格式，按原来的方式处理
    if (json is Map<String, dynamic>) {
      return LiunianAnalysis(
        years: List<Map<String, dynamic>>.from(json['years'] ?? []),
        current: Map<String, dynamic>.from(json['current'] ?? {}),
        overall: json['overall'] ?? '',
        advice: List<String>.from(json['advice'] ?? []),
      );
    }

    // 默认返回空对象
    return LiunianAnalysis(years: [], current: {}, overall: '', advice: []);
  }
}

/// 事业分析
class CareerAnalysis {
  final Map<String, dynamic> overall;
  final Map<String, dynamic> fortune;
  final List<String> suitableCareers;
  final List<String> advice;

  CareerAnalysis({
    required this.overall,
    required this.fortune,
    required this.suitableCareers,
    required this.advice,
  });

  Map<String, dynamic> toJson() {
    return {
      'overall': overall,
      'fortune': fortune,
      'suitableCareers': suitableCareers,
      'advice': advice,
    };
  }

  factory CareerAnalysis.fromJson(Map<String, dynamic> json) {
    return CareerAnalysis(
      overall: Map<String, dynamic>.from(json['overall'] ?? {}),
      fortune: Map<String, dynamic>.from(json['fortune'] ?? {}),
      suitableCareers: List<String>.from(json['suitableCareers'] ?? []),
      advice: List<String>.from(json['advice'] ?? []),
    );
  }
}

/// 婚姻分析
class MarriageAnalysis {
  final Map<String, dynamic> overall;
  final Map<String, dynamic> fortune;
  final Map<String, dynamic> spouseTraits;
  final Map<String, dynamic> compatibility;
  final List<String> marriageAdvice;

  MarriageAnalysis({
    required this.overall,
    required this.fortune,
    required this.spouseTraits,
    required this.compatibility,
    required this.marriageAdvice,
  });

  Map<String, dynamic> toJson() {
    return {
      'overall': overall,
      'fortune': fortune,
      'spouseTraits': spouseTraits,
      'compatibility': compatibility,
      'marriageAdvice': marriageAdvice,
    };
  }

  factory MarriageAnalysis.fromJson(Map<String, dynamic> json) {
    return MarriageAnalysis(
      overall: Map<String, dynamic>.from(json['overall'] ?? {}),
      fortune: Map<String, dynamic>.from(json['fortune'] ?? {}),
      spouseTraits: Map<String, dynamic>.from(json['spouseTraits'] ?? {}),
      compatibility: Map<String, dynamic>.from(json['compatibility'] ?? {}),
      marriageAdvice: List<String>.from(json['marriageAdvice'] ?? []),
    );
  }
}

/// 健康分析
class HealthAnalysis {
  final Map<String, dynamic> overall;
  final List<String> risks;
  final List<String> advice;
  final List<String> favorableElements;
  final Map<String, String> seasonalCare;

  HealthAnalysis({
    required this.overall,
    required this.risks,
    required this.advice,
    required this.favorableElements,
    required this.seasonalCare,
  });

  Map<String, dynamic> toJson() {
    return {
      'overall': overall,
      'risks': risks,
      'advice': advice,
      'favorableElements': favorableElements,
      'seasonalCare': seasonalCare,
    };
  }

  factory HealthAnalysis.fromJson(Map<String, dynamic> json) {
    return HealthAnalysis(
      overall: Map<String, dynamic>.from(json['overall'] ?? {}),
      risks: List<String>.from(json['risks'] ?? []),
      advice: List<String>.from(json['advice'] ?? []),
      favorableElements: List<String>.from(json['favorableElements'] ?? []),
      seasonalCare: Map<String, String>.from(json['seasonalCare'] ?? {}),
    );
  }
}

/// 身强身弱分析
class StrengthAnalysis {
  final OriginalStrengthAnalysis original; // 原命局分析
  final CurrentStrengthAnalysis current; // 当前运势分析
  final String comparisonNote; // 对比说明

  StrengthAnalysis({
    required this.original,
    required this.current,
    required this.comparisonNote,
  });

  Map<String, dynamic> toJson() {
    return {
      'original': original.toJson(),
      'current': current.toJson(),
      'comparisonNote': comparisonNote,
    };
  }

  factory StrengthAnalysis.fromJson(Map<String, dynamic> json) {
    return StrengthAnalysis(
      original: OriginalStrengthAnalysis.fromJson(json['original'] ?? {}),
      current: CurrentStrengthAnalysis.fromJson(json['current'] ?? {}),
      comparisonNote: json['comparisonNote'] ?? '',
    );
  }
}

/// 原命局身强身弱分析
class OriginalStrengthAnalysis {
  final String strengthType; // 身强身弱类型（身强、身弱、从强、从弱等）
  final double strengthPercentage; // 强度百分比
  final double supportStrength; // 生扶力量
  final double weakenStrength; // 克泄力量
  final double monthScore; // 月令得分
  final int strengthLevel; // 强弱等级(1-12)
  final String levelDescription; // 等级描述
  final Map<String, double> elementStrengths; // 五行力量分布
  final List<String> hehuaInfo; // 合化信息
  final String analysis; // 详细分析

  OriginalStrengthAnalysis({
    required this.strengthType,
    required this.strengthPercentage,
    required this.supportStrength,
    required this.weakenStrength,
    required this.monthScore,
    required this.strengthLevel,
    required this.levelDescription,
    required this.elementStrengths,
    required this.hehuaInfo,
    required this.analysis,
  });

  Map<String, dynamic> toJson() {
    return {
      'strengthType': strengthType,
      'strengthPercentage': strengthPercentage,
      'supportStrength': supportStrength,
      'weakenStrength': weakenStrength,
      'monthScore': monthScore,
      'strengthLevel': strengthLevel,
      'levelDescription': levelDescription,
      'elementStrengths': elementStrengths,
      'hehuaInfo': hehuaInfo,
      'analysis': analysis,
    };
  }

  factory OriginalStrengthAnalysis.fromJson(Map<String, dynamic> json) {
    return OriginalStrengthAnalysis(
      strengthType: json['strengthType'] ?? '',
      strengthPercentage: (json['strengthPercentage'] ?? 0.0).toDouble(),
      supportStrength: (json['supportStrength'] ?? 0.0).toDouble(),
      weakenStrength: (json['weakenStrength'] ?? 0.0).toDouble(),
      monthScore: (json['monthScore'] ?? 0.0).toDouble(),
      strengthLevel: _parseStrengthLevel(json['strengthLevel']),
      levelDescription: json['levelDescription'] ?? '',
      elementStrengths:
          (json['elementStrengths'] as Map<String, dynamic>? ?? {}).map(
            (key, value) => MapEntry(key, (value as num).toDouble()),
          ),
      hehuaInfo: List<String>.from(json['hehuaInfo'] ?? []),
      analysis: json['analysis'] ?? '',
    );
  }

  /// 解析strengthLevel字段，处理字符串到整数的转换
  static int _parseStrengthLevel(dynamic value) {
    if (value == null) return 1;
    if (value is int) return value;
    if (value is String) {
      // 如果是字符串类型的身强身弱描述，转换为对应的数字等级
      switch (value) {
        case '极强':
          return 12;
        case '偏强':
          return 8;
        case '中和':
          return 6;
        case '偏弱':
          return 4;
        case '极弱':
          return 1;
        case '从强':
          return 11;
        case '从弱':
          return 2;
        default:
          // 尝试解析为数字
          final parsed = int.tryParse(value);
          return parsed ?? 1;
      }
    }
    return 1;
  }
}

/// 当前运势身强身弱分析
class CurrentStrengthAnalysis {
  final String strengthType; // 身强身弱类型
  final double strengthPercentage; // 强度百分比
  final double supportStrength; // 生扶力量
  final double weakenStrength; // 克泄力量
  final double monthScore; // 月令得分
  final int strengthLevel; // 强弱等级(1-12)
  final String levelDescription; // 等级描述
  final Map<String, double> elementStrengths; // 五行力量分布
  final List<String> hehuaInfo; // 合化信息
  final String analysis; // 详细分析
  final String currentDayun; // 当前大运
  final String currentLiunian; // 当前流年

  CurrentStrengthAnalysis({
    required this.strengthType,
    required this.strengthPercentage,
    required this.supportStrength,
    required this.weakenStrength,
    required this.monthScore,
    required this.strengthLevel,
    required this.levelDescription,
    required this.elementStrengths,
    required this.hehuaInfo,
    required this.analysis,
    required this.currentDayun,
    required this.currentLiunian,
  });

  Map<String, dynamic> toJson() {
    return {
      'strengthType': strengthType,
      'strengthPercentage': strengthPercentage,
      'supportStrength': supportStrength,
      'weakenStrength': weakenStrength,
      'monthScore': monthScore,
      'strengthLevel': strengthLevel,
      'levelDescription': levelDescription,
      'elementStrengths': elementStrengths,
      'hehuaInfo': hehuaInfo,
      'analysis': analysis,
      'currentDayun': currentDayun,
      'currentLiunian': currentLiunian,
    };
  }

  factory CurrentStrengthAnalysis.fromJson(Map<String, dynamic> json) {
    return CurrentStrengthAnalysis(
      strengthType: json['strengthType'] ?? '',
      strengthPercentage: (json['strengthPercentage'] ?? 0.0).toDouble(),
      supportStrength: (json['supportStrength'] ?? 0.0).toDouble(),
      weakenStrength: (json['weakenStrength'] ?? 0.0).toDouble(),
      monthScore: (json['monthScore'] ?? 0.0).toDouble(),
      strengthLevel: json['strengthLevel'] ?? 1,
      levelDescription: json['levelDescription'] ?? '',
      elementStrengths:
          (json['elementStrengths'] as Map<String, dynamic>? ?? {}).map(
            (key, value) => MapEntry(key, (value as num).toDouble()),
          ),
      hehuaInfo: List<String>.from(json['hehuaInfo'] ?? []),
      analysis: json['analysis'] ?? '',
      currentDayun: json['currentDayun'] ?? '',
      currentLiunian: json['currentLiunian'] ?? '',
    );
  }
}
