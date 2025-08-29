import 'dart:math';
import '../models/liuyao_models.dart';

/// 六爻占卜服务类
class LiuyaoService {
  static final LiuyaoService _instance = LiuyaoService._internal();
  factory LiuyaoService() => _instance;
  LiuyaoService._internal();

  final Random _random = Random();

  /// 传统起卦方法 - 铜钱法
  /// 每次投掷三枚铜钱，重复六次得到六爻
  List<Yao> generateHexagramByCoins() {
    final yaos = <Yao>[];

    for (int i = 0; i < 6; i++) {
      // 模拟投掷三枚铜钱
      int heads = 0; // 正面（字）的数量
      for (int j = 0; j < 3; j++) {
        if (_random.nextBool()) heads++;
      }

      // 根据正面数量确定爻的类型
      YaoType yaoType;
      switch (heads) {
        case 0: // 三个背面
          yaoType = YaoType.oldYin; // 老阴，记作6
          break;
        case 1: // 一个正面，两个背面
          yaoType = YaoType.youngYang; // 少阳，记作7
          break;
        case 2: // 两个正面，一个背面
          yaoType = YaoType.youngYin; // 少阴，记作8
          break;
        case 3: // 三个正面
          yaoType = YaoType.oldYang; // 老阳，记作9
          break;
        default:
          yaoType = YaoType.youngYang;
      }

      yaos.add(Yao.fromPosition(i, yaoType));
    }

    return yaos;
  }

  /// 时间起卦法
  /// 根据年月日时的数字进行起卦
  List<Yao> generateHexagramByTime(DateTime dateTime) {
    final year = dateTime.year;
    final month = dateTime.month;
    final day = dateTime.day;
    final hour = dateTime.hour;

    // 计算上卦
    final upperSum = (year + month + day) % 8;
    final upperTrigram = _getTrigramByNumber(upperSum == 0 ? 8 : upperSum);

    // 计算下卦
    final lowerSum = (year + month + day + hour) % 8;
    final lowerTrigram = _getTrigramByNumber(lowerSum == 0 ? 8 : lowerSum);

    // 计算动爻
    final changingLine = (year + month + day + hour) % 6;

    // 组合成六爻
    final yaos = <Yao>[];
    final upperLines = upperTrigram.lines;
    final lowerLines = lowerTrigram.lines;

    // 下卦三爻
    for (int i = 0; i < 3; i++) {
      YaoType type;
      if (i == changingLine) {
        type = lowerLines[i] ? YaoType.oldYang : YaoType.oldYin;
      } else {
        type = lowerLines[i] ? YaoType.youngYang : YaoType.youngYin;
      }
      yaos.add(Yao.fromPosition(i, type));
    }

    // 上卦三爻
    for (int i = 0; i < 3; i++) {
      YaoType type;
      if (i + 3 == changingLine) {
        type = upperLines[i] ? YaoType.oldYang : YaoType.oldYin;
      } else {
        type = upperLines[i] ? YaoType.youngYang : YaoType.youngYin;
      }
      yaos.add(Yao.fromPosition(i + 3, type));
    }

    return yaos;
  }

  /// 数字起卦法
  /// 根据用户提供的数字进行起卦
  List<Yao> generateHexagramByNumbers(List<int> numbers) {
    if (numbers.length < 2) {
      throw ArgumentError('至少需要两个数字进行起卦');
    }

    final sum1 = numbers[0] % 8;
    final sum2 = numbers.length > 1 ? numbers[1] % 8 : numbers[0] % 8;
    final sum3 = numbers.fold(0, (a, b) => a + b) % 6;

    final upperTrigram = _getTrigramByNumber(sum1 == 0 ? 8 : sum1);
    final lowerTrigram = _getTrigramByNumber(sum2 == 0 ? 8 : sum2);
    final changingLine = sum3;

    return _combineTrigramsWithChangingLine(
      upperTrigram,
      lowerTrigram,
      changingLine,
    );
  }

  /// 根据数字获取对应的三爻卦
  Trigram _getTrigramByNumber(int number) {
    const trigrams = [
      Trigram(
        name: '坤',
        symbol: '☷',
        attribute: '地',
        element: '土',
        lines: [false, false, false],
      ), // 1
      Trigram(
        name: '震',
        symbol: '☳',
        attribute: '雷',
        element: '木',
        lines: [true, false, false],
      ), // 2
      Trigram(
        name: '坎',
        symbol: '☵',
        attribute: '水',
        element: '水',
        lines: [false, true, false],
      ), // 3
      Trigram(
        name: '兑',
        symbol: '☱',
        attribute: '泽',
        element: '金',
        lines: [true, true, false],
      ), // 4
      Trigram(
        name: '艮',
        symbol: '☶',
        attribute: '山',
        element: '土',
        lines: [false, false, true],
      ), // 5
      Trigram(
        name: '离',
        symbol: '☲',
        attribute: '火',
        element: '火',
        lines: [true, false, true],
      ), // 6
      Trigram(
        name: '巽',
        symbol: '☴',
        attribute: '风',
        element: '木',
        lines: [false, true, true],
      ), // 7
      Trigram(
        name: '乾',
        symbol: '☰',
        attribute: '天',
        element: '金',
        lines: [true, true, true],
      ), // 8
    ];

    return trigrams[(number - 1) % 8];
  }

  /// 将上下卦组合成六爻，并设置动爻
  List<Yao> _combineTrigramsWithChangingLine(
    Trigram upper,
    Trigram lower,
    int changingLine,
  ) {
    final yaos = <Yao>[];

    // 下卦三爻
    for (int i = 0; i < 3; i++) {
      YaoType type;
      if (i == changingLine) {
        type = lower.lines[i] ? YaoType.oldYang : YaoType.oldYin;
      } else {
        type = lower.lines[i] ? YaoType.youngYang : YaoType.youngYin;
      }
      yaos.add(Yao.fromPosition(i, type));
    }

    // 上卦三爻
    for (int i = 0; i < 3; i++) {
      YaoType type;
      if (i + 3 == changingLine) {
        type = upper.lines[i] ? YaoType.oldYang : YaoType.oldYin;
      } else {
        type = upper.lines[i] ? YaoType.youngYang : YaoType.youngYin;
      }
      yaos.add(Yao.fromPosition(i + 3, type));
    }

    return yaos;
  }

  /// 根据六爻获取对应的卦象
  Hexagram getHexagramFromYaos(List<Yao> yaos) {
    if (yaos.length != 6) {
      throw ArgumentError('必须是六个爻');
    }

    // 获取上下卦的阴阳性质
    final lowerLines = yaos.take(3).map((yao) => yao.type.isYang).toList();
    final upperLines = yaos.skip(3).map((yao) => yao.type.isYang).toList();

    final lowerTrigram = Trigram.fromLines(lowerLines);
    final upperTrigram = Trigram.fromLines(upperLines);

    return _getHexagramFromTrigrams(upperTrigram, lowerTrigram);
  }

  /// 根据上下卦获取六十四卦
  Hexagram _getHexagramFromTrigrams(Trigram upper, Trigram lower) {
    // 这里应该包含完整的六十四卦对照表
    // 为了演示，先返回一些基本的卦象

    final key = '${upper.name}${lower.name}';

    switch (key) {
      case '乾乾':
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
          judgment: '大哉乾元，万物资始，乃统天。云行雨施，品物流形。',
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
      case '坤坤':
        return const Hexagram(
          number: 2,
          name: '坤',
          fullName: '坤为地',
          upperTrigram: Trigram(
            name: '坤',
            symbol: '☷',
            attribute: '地',
            element: '土',
            lines: [false, false, false],
          ),
          lowerTrigram: Trigram(
            name: '坤',
            symbol: '☷',
            attribute: '地',
            element: '土',
            lines: [false, false, false],
          ),
          description: '坤：元，亨，利牝马之贞。',
          judgment: '至哉坤元，万物资生，乃顺承天。',
          image: '地势坤，君子以厚德载物。',
          yaoTexts: [
            '初六：履霜，坚冰至。',
            '六二：直，方，大，不习无不利。',
            '六三：含章可贞。或从王事，无成有终。',
            '六四：括囊；无咎，无誉。',
            '六五：黄裳，元吉。',
            '上六：龙战于野，其血玄黄。',
          ],
        );
      case '坎离':
        return const Hexagram(
          number: 63,
          name: '既济',
          fullName: '水火既济',
          upperTrigram: Trigram(
            name: '坎',
            symbol: '☵',
            attribute: '水',
            element: '水',
            lines: [false, true, false],
          ),
          lowerTrigram: Trigram(
            name: '离',
            symbol: '☲',
            attribute: '火',
            element: '火',
            lines: [true, false, true],
          ),
          description: '既济：亨，小利贞，初吉终乱。',
          judgment: '既济，亨，小者亨也。利贞，刚柔正而位当也。',
          image: '水在火上，既济；君子以思患而豫防之。',
          yaoTexts: [
            '初九：曳其轮，濡其尾，无咎。',
            '六二：妇丧其茀，勿逐，七日得。',
            '九三：高宗伐鬼方，三年克之，小人勿用。',
            '六四：繻有衣袽，终日戒。',
            '九五：东邻杀牛，不如西邻之禴祭，实受其福。',
            '上六：濡其首，厉。',
          ],
        );
      default:
        // 默认返回乾卦
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

  /// 获取变爻位置
  List<int> getChangingLines(List<Yao> yaos) {
    final changingLines = <int>[];
    for (int i = 0; i < yaos.length; i++) {
      if (yaos[i].type.isChanging) {
        changingLines.add(i);
      }
    }
    return changingLines;
  }

  /// 获取变卦
  Hexagram? getChangedHexagram(List<Yao> originalYaos) {
    final changingLines = getChangingLines(originalYaos);
    if (changingLines.isEmpty) {
      return null;
    }

    final changedYaos = originalYaos
        .map((yao) => Yao.fromPosition(yao.position, yao.changedType))
        .toList();

    return getHexagramFromYaos(changedYaos);
  }

  /// 基础卦象分析
  String analyzeHexagram(
    Hexagram hexagram,
    List<int> changingLines,
    String question,
  ) {
    final analysis = StringBuffer();

    analysis.writeln('卦象分析：');
    analysis.writeln('本卦：${hexagram.fullName}');
    analysis.writeln('卦辞：${hexagram.description}');
    analysis.writeln('象辞：${hexagram.image}');
    analysis.writeln();

    if (changingLines.isNotEmpty) {
      analysis.writeln('动爻分析：');
      for (final line in changingLines) {
        if (line >= 0 && line < hexagram.yaoTexts.length) {
          analysis.writeln('${_getYaoName(line)}：${hexagram.yaoTexts[line]}');
        } else {
          analysis.writeln('${_getYaoName(line)}：动爻发动，变化在即。');
        }
      }
      analysis.writeln();
    }

    // 根据卦象特点给出基础分析
    analysis.writeln('针对您的问题"$question"：');
    analysis.writeln(_getBasicInterpretation(hexagram, changingLines));

    return analysis.toString();
  }

  String _getYaoName(int index) {
    const names = ['初爻', '二爻', '三爻', '四爻', '五爻', '上爻'];
    return names[index];
  }

  String _getBasicInterpretation(Hexagram hexagram, List<int> changingLines) {
    // 根据卦象给出基础解释
    switch (hexagram.name) {
      case '乾':
        return '乾卦象征天，代表刚健、进取。此时正是发挥主观能动性的好时机，但要注意不可过于刚强。';
      case '坤':
        return '坤卦象征地，代表柔顺、包容。建议以柔克刚，顺应时势，厚德载物。';
      case '既济':
        return '既济卦表示事情已经成功，但要居安思危，防止乐极生悲。';
      default:
        return '此卦显示事情正在发展变化中，需要根据具体情况灵活应对。';
    }
  }

  /// 生成占卜建议
  String generateSuggestion(Hexagram hexagram, List<int> changingLines) {
    final suggestions = <String>[];

    // 根据卦象特点给出建议
    if (hexagram.upperTrigram.element == hexagram.lowerTrigram.element) {
      suggestions.add('上下同心，内外一致，是成功的基础。');
    }

    if (changingLines.isEmpty) {
      suggestions.add('卦象稳定，建议保持现状，不宜大动。');
    } else if (changingLines.length == 1) {
      suggestions.add('有一爻发动，表示有变化的契机，可适当调整策略。');
    } else {
      suggestions.add('多爻发动，变化较大，需要谨慎应对。');
    }

    // 根据五行相生相克给出建议
    final upperElement = hexagram.upperTrigram.element;
    final lowerElement = hexagram.lowerTrigram.element;

    if (_isElementsHarmonious(upperElement, lowerElement)) {
      suggestions.add('五行和谐，利于发展。');
    } else {
      suggestions.add('五行有冲突，需要化解矛盾。');
    }

    return suggestions.join('\n');
  }

  bool _isElementsHarmonious(String element1, String element2) {
    // 简化的五行相生判断
    const harmony = {
      '木': ['水', '火'],
      '火': ['木', '土'],
      '土': ['火', '金'],
      '金': ['土', '水'],
      '水': ['金', '木'],
    };

    return (harmony[element1]?.contains(element2) ?? false) ||
        (harmony[element2]?.contains(element1) ?? false);
  }
}
