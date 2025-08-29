/// 六爻占卜相关数据模型
library;

/// 爻的类型
enum YaoType {
  oldYin(0, '老阴', '⚋', true), // 老阴，会变为阳爻
  youngYang(1, '少阳', '⚊', false), // 少阳，不变
  youngYin(2, '少阴', '⚋', false), // 少阴，不变
  oldYang(3, '老阳', '⚊', true); // 老阳，会变为阴爻

  const YaoType(this.value, this.name, this.symbol, this.isChanging);

  final int value;
  final String name;
  final String symbol;
  final bool isChanging;

  bool get isYang => this == youngYang || this == oldYang;
  bool get isYin => this == youngYin || this == oldYin;
}

/// 单个爻的数据模型
class Yao {
  final YaoType type;
  final int position; // 0-5，从下到上
  final String name; // 初爻、二爻等

  const Yao({required this.type, required this.position, required this.name});

  /// 获取变爻后的类型
  YaoType get changedType {
    switch (type) {
      case YaoType.oldYin:
        return YaoType.youngYang;
      case YaoType.oldYang:
        return YaoType.youngYin;
      default:
        return type;
    }
  }

  factory Yao.fromPosition(int position, YaoType type) {
    const names = ['初爻', '二爻', '三爻', '四爻', '五爻', '上爻'];
    return Yao(type: type, position: position, name: names[position]);
  }
}

/// 三爻组成的卦（上卦或下卦）
class Trigram {
  final String name;
  final String symbol;
  final String attribute; // 属性：乾为天、坤为地等
  final String element; // 五行属性
  final List<bool> lines; // true为阳爻，false为阴爻

  const Trigram({
    required this.name,
    required this.symbol,
    required this.attribute,
    required this.element,
    required this.lines,
  });

  /// 根据三个爻的阴阳性质获取对应的三爻卦
  static Trigram fromLines(List<bool> lines) {
    assert(lines.length == 3);

    // 将 List<bool> 转换为字符串作为 key
    final key = lines.map((b) => b ? '1' : '0').join();

    // 八卦对照表
    const trigrams = {
      '111': Trigram(
        name: '乾',
        symbol: '☰',
        attribute: '天',
        element: '金',
        lines: [true, true, true],
      ),
      '000': Trigram(
        name: '坤',
        symbol: '☷',
        attribute: '地',
        element: '土',
        lines: [false, false, false],
      ),
      '100': Trigram(
        name: '震',
        symbol: '☳',
        attribute: '雷',
        element: '木',
        lines: [true, false, false],
      ),
      '010': Trigram(
        name: '坎',
        symbol: '☵',
        attribute: '水',
        element: '水',
        lines: [false, true, false],
      ),
      '001': Trigram(
        name: '艮',
        symbol: '☶',
        attribute: '山',
        element: '土',
        lines: [false, false, true],
      ),
      '011': Trigram(
        name: '巽',
        symbol: '☴',
        attribute: '风',
        element: '木',
        lines: [false, true, true],
      ),
      '101': Trigram(
        name: '离',
        symbol: '☲',
        attribute: '火',
        element: '火',
        lines: [true, false, true],
      ),
      '110': Trigram(
        name: '兑',
        symbol: '☱',
        attribute: '泽',
        element: '金',
        lines: [true, true, false],
      ),
    };

    return trigrams[key] ??
        const Trigram(
          name: '乾',
          symbol: '☰',
          attribute: '天',
          element: '金',
          lines: [true, true, true],
        );
  }
}

/// 六十四卦的数据模型
class Hexagram {
  final int number; // 卦序号 1-64
  final String name; // 卦名
  final String fullName; // 全名，如"乾为天"
  final Trigram upperTrigram; // 上卦
  final Trigram lowerTrigram; // 下卦
  final String description; // 卦辞
  final String judgment; // 彖辞
  final String image; // 象辞
  final List<String> yaoTexts; // 六个爻辞

  const Hexagram({
    required this.number,
    required this.name,
    required this.fullName,
    required this.upperTrigram,
    required this.lowerTrigram,
    required this.description,
    required this.judgment,
    required this.image,
    required this.yaoTexts,
  });

  /// 根据上下卦获取对应的六十四卦
  static Hexagram fromTrigrams(Trigram upper, Trigram lower) {
    // 这里应该包含完整的六十四卦对照表
    // 为了简化，先返回一个示例卦象
    return const Hexagram(
      number: 1,
      name: '乾',
      fullName: '乾为天',
      upperTrigram: Trigram(
        name: '乾',
        symbol: '☰',
        attribute: '天',
        element: '金',
        lines: [true, true, true],
      ),
      lowerTrigram: Trigram(
        name: '乾',
        symbol: '☰',
        attribute: '天',
        element: '金',
        lines: [true, true, true],
      ),
      description: '乾：元，亨，利，贞。',
      judgment: '大哉乾元，万物资始，乃统天。',
      image: '天行健，君子以自强不息。',
      yaoTexts: [
        '初九：潜龙勿用。',
        '九二：见龙在田，利见大人。',
        '九三：君子终日乾乾，夕惕若厉，无咎。',
        '九四：或跃在渊，无咎。',
        '九五：飞龙在天，利见大人。',
        '上九：亢龙有悔。',
      ],
    );
  }
}

/// 六爻占卜结果
class LiuyaoResult {
  final String question; // 占卜问题
  final DateTime timestamp; // 占卜时间
  final List<Yao> originalYaos; // 原始六爻
  final List<Yao> changedYaos; // 变爻后的六爻
  final Hexagram originalHexagram; // 本卦
  final Hexagram? changedHexagram; // 变卦（如果有变爻）
  final List<int> changingLines; // 变爻位置
  final String analysis; // 基础分析
  final String deepAnalysis; // 深度分析（来自AI）
  final String suggestion; // 建议
  final double confidence; // 分析可信度

  const LiuyaoResult({
    required this.question,
    required this.timestamp,
    required this.originalYaos,
    required this.changedYaos,
    required this.originalHexagram,
    this.changedHexagram,
    required this.changingLines,
    required this.analysis,
    required this.deepAnalysis,
    required this.suggestion,
    required this.confidence,
  });

  /// 是否有变爻
  bool get hasChangingLines => changingLines.isNotEmpty;

  /// 创建副本并更新指定字段
  LiuyaoResult copyWith({
    String? question,
    DateTime? timestamp,
    List<Yao>? originalYaos,
    List<Yao>? changedYaos,
    Hexagram? originalHexagram,
    Hexagram? changedHexagram,
    List<int>? changingLines,
    String? analysis,
    String? deepAnalysis,
    String? suggestion,
    double? confidence,
  }) {
    return LiuyaoResult(
      question: question ?? this.question,
      timestamp: timestamp ?? this.timestamp,
      originalYaos: originalYaos ?? this.originalYaos,
      changedYaos: changedYaos ?? this.changedYaos,
      originalHexagram: originalHexagram ?? this.originalHexagram,
      changedHexagram: changedHexagram ?? this.changedHexagram,
      changingLines: changingLines ?? this.changingLines,
      analysis: analysis ?? this.analysis,
      deepAnalysis: deepAnalysis ?? this.deepAnalysis,
      suggestion: suggestion ?? this.suggestion,
      confidence: confidence ?? this.confidence,
    );
  }

  /// 转换为JSON格式（用于存储）
  Map<String, dynamic> toJson() {
    return {
      'question': question,
      'timestamp': timestamp.toIso8601String(),
      'originalYaos': originalYaos
          .map(
            (yao) => {
              'type': yao.type.value,
              'position': yao.position,
              'name': yao.name,
            },
          )
          .toList(),
      'changingLines': changingLines,
      'originalHexagram': {
        'number': originalHexagram.number,
        'name': originalHexagram.name,
        'fullName': originalHexagram.fullName,
      },
      'changedHexagram': changedHexagram != null
          ? {
              'number': changedHexagram!.number,
              'name': changedHexagram!.name,
              'fullName': changedHexagram!.fullName,
            }
          : null,
      'analysis': analysis,
      'deepAnalysis': deepAnalysis,
      'suggestion': suggestion,
      'confidence': confidence,
    };
  }

  /// 从JSON格式创建对象
  factory LiuyaoResult.fromJson(Map<String, dynamic> json) {
    final originalYaos = (json['originalYaos'] as List)
        .map(
          (yaoJson) => Yao.fromPosition(
            yaoJson['position'],
            YaoType.values[yaoJson['type']],
          ),
        )
        .toList();

    final changedYaos = originalYaos
        .map((yao) => Yao.fromPosition(yao.position, yao.changedType))
        .toList();

    return LiuyaoResult(
      question: json['question'],
      timestamp: DateTime.parse(json['timestamp']),
      originalYaos: originalYaos,
      changedYaos: changedYaos,
      originalHexagram: Hexagram.fromTrigrams(
        Trigram.fromLines([true, true, true]), // 简化处理
        Trigram.fromLines([true, true, true]),
      ),
      changedHexagram: json['changedHexagram'] != null
          ? Hexagram.fromTrigrams(
              Trigram.fromLines([true, true, true]), // 简化处理
              Trigram.fromLines([true, true, true]),
            )
          : null,
      changingLines: List<int>.from(json['changingLines']),
      analysis: json['analysis'],
      deepAnalysis: json['deepAnalysis'],
      suggestion: json['suggestion'],
      confidence: json['confidence'].toDouble(),
    );
  }
}

/// 六爻占卜历史记录
class LiuyaoHistory {
  final List<LiuyaoResult> results;

  const LiuyaoHistory({required this.results});

  /// 添加新的占卜结果
  LiuyaoHistory addResult(LiuyaoResult result) {
    return LiuyaoHistory(results: [...results, result]);
  }

  /// 获取最近的占卜记录
  List<LiuyaoResult> getRecent(int count) {
    final sorted = [...results]
      ..sort((a, b) => b.timestamp.compareTo(a.timestamp));
    return sorted.take(count).toList();
  }

  /// 根据问题搜索
  List<LiuyaoResult> searchByQuestion(String keyword) {
    return results
        .where((result) => result.question.contains(keyword))
        .toList();
  }

  /// 转换为JSON格式
  Map<String, dynamic> toJson() {
    return {'results': results.map((result) => result.toJson()).toList()};
  }

  /// 从JSON格式创建对象
  factory LiuyaoHistory.fromJson(Map<String, dynamic> json) {
    final results = (json['results'] as List)
        .map((resultJson) => LiuyaoResult.fromJson(resultJson))
        .toList();

    return LiuyaoHistory(results: results);
  }
}
