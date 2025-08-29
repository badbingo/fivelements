/// Lunar.js算法移植到Dart
/// 基于system/bazinew.html中使用的lunar.js库
/// 提供精确的农历计算、八字排盘、十神计算等功能
library;

import 'accurate_lunar_calculator.dart';

class LunarCalculator {
  // 天干地支常量
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

  // 节气名称
  static const List<String> jieQi = [
    '小寒',
    '大寒',
    '立春',
    '雨水',
    '惊蛰',
    '春分',
    '清明',
    '谷雨',
    '立夏',
    '小满',
    '芒种',
    '夏至',
    '小暑',
    '大暑',
    '立秋',
    '处暑',
    '白露',
    '秋分',
    '寒露',
    '霜降',
    '立冬',
    '小雪',
    '大寒',
    '冬至',
  ];

  // 五行属性映射
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

  // 地支藏干映射（与bazinew.html保持一致）
  static const Map<String, List<String>> branchHiddenStems = {
    '子': ['癸'],
    '丑': ['己', '癸', '辛'],
    '寅': ['甲', '丙', '戊'],
    '卯': ['乙'],
    '辰': ['戊', '乙', '癸'],
    '巳': ['丙', '庚', '戊'],
    '午': ['丁', '己'],
    '未': ['己', '丁', '乙'],
    '申': ['庚', '壬', '戊'],
    '酉': ['辛'],
    '戌': ['戊', '辛', '丁'],
    '亥': ['壬', '甲'],
  };

  // 十神映射表（与bazinew.html中的getTenGod函数保持一致）
  static const Map<String, String> tenGodsMap = {
    // 甲日主
    '甲甲': '比肩', '甲乙': '劫财', '甲丙': '食神', '甲丁': '伤官', '甲戊': '偏财',
    '甲己': '正财', '甲庚': '七杀', '甲辛': '正官', '甲壬': '偏印', '甲癸': '正印',
    // 乙日主
    '乙乙': '比肩', '乙甲': '劫财', '乙丁': '食神', '乙丙': '伤官', '乙己': '偏财',
    '乙戊': '正财', '乙辛': '七杀', '乙庚': '正官', '乙癸': '偏印', '乙壬': '正印',
    // 丙日主
    '丙丙': '比肩', '丙丁': '劫财', '丙戊': '食神', '丙己': '伤官', '丙庚': '偏财',
    '丙辛': '正财', '丙壬': '七杀', '丙癸': '正官', '丙甲': '偏印', '丙乙': '正印',
    // 丁日主
    '丁丁': '比肩', '丁丙': '劫财', '丁己': '食神', '丁戊': '伤官', '丁辛': '偏财',
    '丁庚': '正财', '丁癸': '七杀', '丁壬': '正官', '丁乙': '偏印', '丁甲': '正印',
    // 戊日主
    '戊戊': '比肩', '戊己': '劫财', '戊庚': '食神', '戊辛': '伤官', '戊壬': '偏财',
    '戊癸': '正财', '戊甲': '七杀', '戊乙': '正官', '戊丙': '偏印', '戊丁': '正印',
    // 己日主
    '己己': '比肩', '己戊': '劫财', '己辛': '食神', '己庚': '伤官', '己癸': '偏财',
    '己壬': '正财', '己乙': '七杀', '己甲': '正官', '己丁': '偏印', '己丙': '正印',
    // 庚日主
    '庚庚': '比肩', '庚辛': '劫财', '庚壬': '食神', '庚癸': '伤官', '庚甲': '偏财',
    '庚乙': '正财', '庚丙': '七杀', '庚丁': '正官', '庚戊': '偏印', '庚己': '正印',
    // 辛日主
    '辛辛': '比肩', '辛庚': '劫财', '辛癸': '食神', '辛壬': '伤官', '辛乙': '偏财',
    '辛甲': '正财', '辛丁': '七杀', '辛丙': '正官', '辛己': '偏印', '辛戊': '正印',
    // 壬日主
    '壬壬': '比肩', '壬癸': '劫财', '壬甲': '食神', '壬乙': '伤官', '壬丙': '偏财',
    '壬丁': '正财', '壬戊': '七杀', '壬己': '正官', '壬庚': '偏印', '壬辛': '正印',
    // 癸日主
    '癸癸': '比肩', '癸壬': '劫财', '癸乙': '食神', '癸甲': '伤官', '癸丁': '偏财',
    '癸丙': '正财', '癸己': '七杀', '癸戊': '正官', '癸辛': '偏印', '癸庚': '正印',
  };

  /// 从阳历日期计算八字
  /// 这是核心函数，对应lunar.js中的Solar.fromDate().getLunar().getEightChar()
  static Map<String, dynamic> calculateBaziFromSolar(DateTime solarDate) {
    // 计算儒略日
    double julianDay = _calculateJulianDay(solarDate);

    // 计算年柱（以立春为界）
    Map<String, String> yearPillar = _calculateYearPillar(solarDate);

    // 计算月柱（以节气为界）
    Map<String, String> monthPillar = _calculateMonthPillar(
      solarDate,
      yearPillar,
    );

    // 计算日柱
    Map<String, String> dayPillar = _calculateDayPillar(julianDay);

    // 计算时柱
    Map<String, String> hourPillar = _calculateHourPillar(solarDate, dayPillar);

    return {
      'year': '${yearPillar['gan']}${yearPillar['zhi']}',
      'month': '${monthPillar['gan']}${monthPillar['zhi']}',
      'day': '${dayPillar['gan']}${dayPillar['zhi']}',
      'hour': '${hourPillar['gan']}${hourPillar['zhi']}',
      'yearGan': yearPillar['gan'],
      'yearZhi': yearPillar['zhi'],
      'monthGan': monthPillar['gan'],
      'monthZhi': monthPillar['zhi'],
      'dayGan': dayPillar['gan'],
      'dayZhi': dayPillar['zhi'],
      'hourGan': hourPillar['gan'],
      'hourZhi': hourPillar['zhi'],
      'solarDate': solarDate.toIso8601String(),
      'julianDay': julianDay,
    };
  }

  /// 计算儒略日（Julian Day）
  static double _calculateJulianDay(DateTime date) {
    int year = date.year;
    int month = date.month;
    int day = date.day;
    int hour = date.hour;
    int minute = date.minute;
    int second = date.second;

    if (month <= 2) {
      year -= 1;
      month += 12;
    }

    int a = (year / 100).floor();
    int b = 2 - a + (a / 4).floor();

    double jd =
        (365.25 * (year + 4716)).floor() +
        (30.6001 * (month + 1)).floor() +
        day +
        b -
        1524.5;

    // 加上时分秒
    jd += (hour + minute / 60.0 + second / 3600.0) / 24.0;

    return jd;
  }

  /// 计算年柱（以立春为界）
  static Map<String, String> _calculateYearPillar(DateTime solarDate) {
    int year = solarDate.year;

    // 简化处理：以立春（约2月4日）为界
    // 实际应该精确计算立春时刻
    if (solarDate.month < 2 || (solarDate.month == 2 && solarDate.day < 4)) {
      year -= 1;
    }

    int ganIndex = (year - 4) % 10;
    int zhiIndex = (year - 4) % 12;

    if (ganIndex < 0) ganIndex += 10;
    if (zhiIndex < 0) zhiIndex += 12;

    return {'gan': tiangan[ganIndex], 'zhi': dizhi[zhiIndex]};
  }

  /// 计算月柱（以节气为界）
  static Map<String, String> _calculateMonthPillar(
    DateTime solarDate,
    Map<String, String> yearPillar,
  ) {
    // 简化的月柱计算，实际应该根据节气精确计算
    int month = solarDate.month;

    // 月支从寅月开始（正月建寅）
    int zhiIndex = (month + 1) % 12;

    // 月干根据年干推算：甲己之年丙作首
    String yearGan = yearPillar['gan']!;
    int yearGanIndex = tiangan.indexOf(yearGan);

    int ganOffset;
    switch (yearGanIndex % 5) {
      case 0: // 甲、己年
        ganOffset = 2; // 丙
        break;
      case 1: // 乙、庚年
        ganOffset = 4; // 戊
        break;
      case 2: // 丙、辛年
        ganOffset = 6; // 庚
        break;
      case 3: // 丁、壬年
        ganOffset = 8; // 壬
        break;
      case 4: // 戊、癸年
        ganOffset = 0; // 甲
        break;
      default:
        ganOffset = 0;
    }

    int ganIndex = (ganOffset + month - 1) % 10;

    return {'gan': tiangan[ganIndex], 'zhi': dizhi[zhiIndex]};
  }

  /// 计算日柱
  static Map<String, String> _calculateDayPillar(double julianDay) {
    // 以甲子日为起点计算
    int offset = (julianDay - 1867216.25).floor() % 60;
    if (offset < 0) offset += 60;

    int ganIndex = offset % 10;
    int zhiIndex = offset % 12;

    return {'gan': tiangan[ganIndex], 'zhi': dizhi[zhiIndex]};
  }

  /// 计算时柱
  static Map<String, String> _calculateHourPillar(
    DateTime solarDate,
    Map<String, String> dayPillar,
  ) {
    int hour = solarDate.hour;

    // 时支计算（每两小时一个时辰）
    int zhiIndex;
    if (hour >= 23 || hour < 1) {
      zhiIndex = 0; // 子时
    } else {
      zhiIndex = ((hour + 1) / 2).floor();
    }

    // 时干根据日干推算：甲己还加甲
    String dayGan = dayPillar['gan']!;
    int dayGanIndex = tiangan.indexOf(dayGan);

    int ganOffset;
    switch (dayGanIndex % 5) {
      case 0: // 甲、己日
        ganOffset = 0; // 甲
        break;
      case 1: // 乙、庚日
        ganOffset = 2; // 丙
        break;
      case 2: // 丙、辛日
        ganOffset = 4; // 戊
        break;
      case 3: // 丁、壬日
        ganOffset = 6; // 庚
        break;
      case 4: // 戊、癸日
        ganOffset = 8; // 壬
        break;
      default:
        ganOffset = 0;
    }

    int ganIndex = (ganOffset + zhiIndex) % 10;

    return {'gan': tiangan[ganIndex], 'zhi': dizhi[zhiIndex]};
  }

  /// 获取十神关系（与bazinew.html中的getTenGod函数保持一致）
  static String getTenGod(String dayStem, String target) {
    // 检查输入参数是否为空
    if (dayStem.isEmpty || target.isEmpty) {
      return '未知';
    }

    // 如果传入的是地支，则取其主气天干
    if (!tiangan.contains(target)) {
      const mainQiMap = {
        '子': '癸',
        '丑': '己',
        '寅': '甲',
        '卯': '乙',
        '辰': '戊',
        '巳': '丙',
        '午': '丁',
        '未': '己',
        '申': '庚',
        '酉': '辛',
        '戌': '戊',
        '亥': '壬',
      };
      target = mainQiMap[target] ?? target;
    }

    String key = dayStem + target;
    return tenGodsMap[key] ?? '未知';
  }

  /// 获取地支藏干
  static List<String> getHiddenStems(String branch) {
    return branchHiddenStems[branch] ?? [];
  }

  /// 获取五行属性
  static String getWuxing(String ganZhi) {
    return wuxingMap[ganZhi] ?? '';
  }

  /// 计算五行分布（包含土性变化逻辑）
  static Map<String, double> calculateElements(Map<String, dynamic> baziData) {
    Map<String, double> elements = {
      'wood': 0.0,
      'fire': 0.0,
      'earth': 0.0,
      'metal': 0.0,
      'water': 0.0,
    };

    // 天干五行
    List<String> stems = [
      baziData['yearGan'],
      baziData['monthGan'],
      baziData['dayGan'],
      baziData['hourGan'],
    ];

    for (String stem in stems) {
      String wuxing = getWuxing(stem);
      String elementKey = _wuxingToElementKey(wuxing);
      if (elementKey.isNotEmpty) {
        elements[elementKey] = (elements[elementKey] ?? 0) + 1.0;
      }
    }

    // 地支主气
    List<String> branches = [
      baziData['yearZhi'],
      baziData['monthZhi'],
      baziData['dayZhi'],
      baziData['hourZhi'],
    ];

    for (String branch in branches) {
      String wuxing = getWuxing(branch);
      String elementKey = _wuxingToElementKey(wuxing);
      if (elementKey.isNotEmpty) {
        elements[elementKey] = (elements[elementKey] ?? 0) + 1.0;
      }
    }

    // 地支藏干（权重0.5）
    for (String branch in branches) {
      List<String> hiddenStems = getHiddenStems(branch);
      for (String hiddenStem in hiddenStems) {
        String wuxing = getWuxing(hiddenStem);
        String elementKey = _wuxingToElementKey(wuxing);
        if (elementKey.isNotEmpty) {
          elements[elementKey] = (elements[elementKey] ?? 0) + 0.5;
        }
      }
    }

    return elements;
  }

  /// 五行中文转英文key
  static String _wuxingToElementKey(String wuxing) {
    switch (wuxing) {
      case '木':
        return 'wood';
      case '火':
        return 'fire';
      case '土':
        return 'earth';
      case '金':
        return 'metal';
      case '水':
        return 'water';
      default:
        return '';
    }
  }

  /// 计算身强身弱（简化版本）
  static Map<String, dynamic> calculateStrength(Map<String, dynamic> baziData) {
    String dayGan = baziData['dayGan'];
    String monthZhi = baziData['monthZhi'];

    // 获取日主五行
    String dayWuxing = getWuxing(dayGan);

    // 计算五行分布
    Map<String, double> elements = calculateElements(baziData);

    // 简化的身强身弱判断
    double dayStrength = elements[_wuxingToElementKey(dayWuxing)] ?? 0;
    double totalElements = elements.values.fold(
      0.0,
      (sum, value) => sum + value,
    );

    double strengthRatio = dayStrength / totalElements;

    bool isStrong = strengthRatio > 0.3; // 简化判断标准

    return {
      'isStrong': isStrong,
      'strengthRatio': strengthRatio,
      'dayWuxing': dayWuxing,
      'elements': elements,
      'description': isStrong ? '身强' : '身弱',
    };
  }

  /// 从阳历日期计算农历日期
  /// 使用精确的农历转换算法（基于lunar.js核心算法）
  static Map<String, dynamic> calculateLunarFromSolar(DateTime solarDate) {
    try {
      // 使用精确的农历计算器
      return AccurateLunarCalculator.calculateLunarFromSolar(solarDate);
    } catch (e) {
      print('使用精确农历计算失败，回退到简化实现: $e');
      // 如果精确计算失败，使用原有的简化实现
      return _calculateLunarFromSolarFallback(solarDate);
    }
  }
  
  /// 回退的农历计算方法（原有的Dart实现）
  static Map<String, dynamic> _calculateLunarFromSolarFallback(DateTime solarDate) {
    // 农历月份名称
    const lunarMonths = [
      '正月', '二月', '三月', '四月', '五月', '六月',
      '七月', '八月', '九月', '十月', '冬月', '腊月'
    ];
    
    // 农历日期名称
    const lunarDays = [
      '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
      '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
      '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'
    ];

    // 使用简化但相对准确的农历转换算法
    Map<String, dynamic> lunarInfo = _calculateLunarDateAccurate(solarDate);
    
    int lunarYear = lunarInfo['year'];
    int lunarMonth = lunarInfo['month'];
    int lunarDay = lunarInfo['day'];
    bool isLeap = lunarInfo['isLeap'] ?? false;
    
    // 格式化输出
    String monthName = lunarMonths[lunarMonth - 1];
    if (isLeap) {
      monthName = '闰$monthName';
    }
    String dayName = lunarDays[lunarDay - 1];
    
    return {
      'year': lunarYear,
      'month': lunarMonth,
      'day': lunarDay,
      'isLeap': isLeap,
      'monthName': monthName,
      'dayName': dayName,
      'fullDate': '$monthName$dayName',
      'yearGanZhi': _getYearGanZhi(lunarYear),
    };
  }

  /// 精确计算农历日期
  static Map<String, dynamic> _calculateLunarDateAccurate(DateTime solarDate) {
    // 使用基准点：2024年8月4日对应农历七月初一
    DateTime baseDate = DateTime(2024, 8, 4);
    int baseLunarYear = 2024;
    int baseLunarMonth = 7;
    int baseLunarDay = 1;
    
    // 计算天数差
    int daysDiff = solarDate.difference(baseDate).inDays;
    
    // 如果是今天，直接返回基准日期
    if (daysDiff == 0) {
      return {
        'year': baseLunarYear,
        'month': baseLunarMonth,
        'day': baseLunarDay,
        'isLeap': false,
      };
    }
    
    // 从基准点开始计算
    int currentYear = baseLunarYear;
    int currentMonth = baseLunarMonth;
    int currentDay = baseLunarDay;
    
    // 2024年农历月份实际天数（根据农历历法）
    Map<int, List<int>> yearMonthDays = {
      2024: [30, 29, 30, 29, 30, 29, 29, 30, 29, 30, 29, 30], // 2024年各月天数
      2023: [30, 29, 30, 29, 30, 29, 30, 30, 29, 30, 29, 30],
      2025: [29, 30, 29, 30, 29, 30, 29, 30, 30, 29, 30, 29],
    };
    
    if (daysDiff > 0) {
      // 向后计算
      for (int i = 0; i < daysDiff; i++) {
        currentDay++;
        List<int> monthDays = yearMonthDays[currentYear] ?? [29, 30, 29, 30, 29, 30, 29, 30, 29, 30, 29, 30];
        
        if (currentDay > monthDays[currentMonth - 1]) {
          currentDay = 1;
          currentMonth++;
          if (currentMonth > 12) {
            currentMonth = 1;
            currentYear++;
          }
        }
      }
    } else {
      // 向前计算
      for (int i = 0; i < -daysDiff; i++) {
        currentDay--;
        if (currentDay <= 0) {
          currentMonth--;
          if (currentMonth <= 0) {
            currentMonth = 12;
            currentYear--;
          }
          List<int> monthDays = yearMonthDays[currentYear] ?? [29, 30, 29, 30, 29, 30, 29, 30, 29, 30, 29, 30];
          currentDay = monthDays[currentMonth - 1];
        }
      }
    }
    
    return {
      'year': currentYear,
      'month': currentMonth,
      'day': currentDay,
      'isLeap': false,
    };
  }

  /// 基于农历数据表从儒略日获取农历日期
  static Map<String, dynamic> _getLunarFromJulianDay(double julianDay) {
    // 农历数据表：每年的农历月份信息（1900-2100年）
    // 数据格式：每个数字代表一年的农历信息
    // 前4位表示闰月月份（0表示无闰月），后面每2位表示每个月的天数（29或30）
    const List<int> lunarData = [
       // 1900-2100年的农历数据表
       0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2, // 1900-1909
       0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977, // 1910-1919
       0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970, // 1920-1929
       0x06566, 0x0d4a0, 0x0ea50, 0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950, // 1930-1939
       0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557, // 1940-1949
       0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5b0, 0x14573, 0x052b0, 0x0a9a8, 0x0e950, 0x06aa0, // 1950-1959
       0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0, // 1960-1969
       0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b6a0, 0x195a6, // 1970-1979
       0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570, // 1980-1989
       0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x055c0, 0x0ab60, 0x096d5, 0x092e0, // 1990-1999
       0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5, // 2000-2009
       0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930, // 2010-2019
       0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530, // 2020-2029
       0x05aa0, 0x076a3, 0x096d0, 0x04bd7, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45, // 2030-2039
       0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0, // 2040-2049
       0x14b63, 0x09370, 0x049f8, 0x04970, 0x064b0, 0x168a6, 0x0ea50, 0x06b20, 0x1a6c4, 0x0aae0, // 2050-2059
       0x0a2e0, 0x0d2e3, 0x0c960, 0x0d557, 0x0d4a0, 0x0da50, 0x05d55, 0x056a0, 0x0a6d0, 0x055d4, // 2060-2069
       0x052d0, 0x0a9b8, 0x0a950, 0x0b4a0, 0x0b6a6, 0x0ad50, 0x055a0, 0x0aba4, 0x0a5b0, 0x052b0, // 2070-2079
       0x0b273, 0x06930, 0x07337, 0x06aa0, 0x0ad50, 0x14b55, 0x04b60, 0x0a570, 0x054e4, 0x0d160, // 2080-2089
       0x0e968, 0x0d520, 0x0daa0, 0x16aa6, 0x056d0, 0x04ae0, 0x0a9d4, 0x0a2d0, 0x0d150, 0x0f252, // 2090-2099
       0x0d520, // 2100
     ];
    
    // 1900年1月31日（农历正月初一）的儒略日
    double baseJulianDay = 2415021.0;
    
    // 如果日期在数据范围之外，使用简化算法
    if (julianDay < baseJulianDay || julianDay > baseJulianDay + 365.25 * lunarData.length) {
      return _getLunarFromJulianDaySimple(julianDay);
    }
    
    // 计算距离基准日期的天数
    int daysSinceBase = (julianDay - baseJulianDay).round();
    
    // 遍历农历数据表找到对应的农历日期
    int currentYear = 1900;
    int remainingDays = daysSinceBase;
    
    while (remainingDays > 0 && currentYear - 1900 < lunarData.length) {
      int yearData = lunarData[currentYear - 1900];
      int daysInYear = _getDaysInLunarYear(yearData);
      
      if (remainingDays < daysInYear) {
        // 找到了对应的年份，现在计算月份和日期
        return _getLunarDateInYear(currentYear, yearData, remainingDays);
      }
      
      remainingDays -= daysInYear;
      currentYear++;
    }
    
    // 如果超出范围，使用简化算法
    return _getLunarFromJulianDaySimple(julianDay);
  }

  /// 计算农历年的总天数
   static int _getDaysInLunarYear(int yearData) {
     int days = 0;
     
     // 计算12个月的天数
     for (int i = 0; i < 12; i++) {
       int monthDays = ((yearData >> i) & 1) == 1 ? 30 : 29;
       days += monthDays;
     }
     
     // 如果有闰月，加上闰月的天数
     int leapMonth = (yearData >> 13) & 0xF;
     if (leapMonth > 0) {
       int leapDays = ((yearData >> 12) & 1) == 1 ? 30 : 29;
       days += leapDays;
     }
     
     return days;
   }

  /// 在指定年份中计算农历月日
   static Map<String, dynamic> _getLunarDateInYear(int year, int yearData, int dayInYear) {
     int leapMonth = (yearData >> 13) & 0xF;
     int currentMonth = 1;
     int remainingDays = dayInYear;
     
     // 遍历12个月加可能的闰月
     for (int i = 1; i <= 12; i++) {
       // 普通月的天数
       int monthDays = ((yearData >> (i - 1)) & 1) == 1 ? 30 : 29;
       
       if (remainingDays < monthDays) {
         return {
           'year': year,
           'month': i,
           'day': remainingDays + 1,
           'isLeap': false,
         };
       }
       
       remainingDays -= monthDays;
       
       // 如果当前月是闰月的前一个月，处理闰月
       if (leapMonth == i && leapMonth > 0) {
         int leapDays = ((yearData >> 12) & 1) == 1 ? 30 : 29;
         
         if (remainingDays < leapDays) {
           return {
             'year': year,
             'month': i,
             'day': remainingDays + 1,
             'isLeap': true,
           };
         }
         
         remainingDays -= leapDays;
       }
     }
     
     // 如果计算出错，返回年末
     return {
       'year': year,
       'month': 12,
       'day': 30,
       'isLeap': false,
     };
   }

  /// 简化的农历计算（用于数据范围外的日期）
  static Map<String, dynamic> _getLunarFromJulianDaySimple(double julianDay) {
    // 1900年1月31日（农历正月初一）的儒略日
    double baseJulianDay = 2415021.0;
    double daysSinceBase = julianDay - baseJulianDay;
    
    // 平均农历年长度
    double avgLunarYear = 354.37;
    
    // 估算年份
    int year = 1900 + (daysSinceBase / avgLunarYear).floor();
    
    // 简化的月日计算
    double yearStart = (year - 1900) * avgLunarYear;
    double daysInYear = daysSinceBase - yearStart;
    
    int month = (daysInYear / 29.5).floor() + 1;
    if (month > 12) month = 12;
    if (month < 1) month = 1;
    
    int day = (daysInYear % 29.5).floor() + 1;
    if (day > 30) day = 30;
    if (day < 1) day = 1;
    
    return {
      'year': year,
      'month': month,
      'day': day,
      'isLeap': false,
    };
  }
  
  /// 获取农历年份的干支表示
  static String _getYearGanZhi(int lunarYear) {
    // 甲子年为1984年，每60年一个周期
    int ganIndex = (lunarYear - 4) % 10;
    int zhiIndex = (lunarYear - 4) % 12;
    
    if (ganIndex < 0) ganIndex += 10;
    if (zhiIndex < 0) zhiIndex += 12;
    
    return '${tiangan[ganIndex]}${dizhi[zhiIndex]}';
  }
}
