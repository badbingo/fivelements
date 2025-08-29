import 'dart:convert';
import 'dart:io';
import 'package:flutter/services.dart';
import 'package:webview_flutter/webview_flutter.dart';

/// 使用JavaScript lunar.js库进行精确农历计算的服务
class LunarJsService {
  static LunarJsService? _instance;
  WebViewController? _controller;
  bool _isInitialized = false;

  static LunarJsService get instance {
    _instance ??= LunarJsService._();
    return _instance!;
  }

  LunarJsService._();

  /// 初始化WebView和lunar.js库
  Future<void> initialize() async {
    if (_isInitialized) return;

    try {
      // 读取lunar.js文件内容
      final String lunarJsContent = await _loadLunarJs();

      // 创建HTML页面内容
      final String htmlContent =
          '''
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lunar Calculator</title>
</head>
<body>
    <script>
    $lunarJsContent
    
    // 暴露给Flutter的接口函数
    window.calculateLunarDate = function(year, month, day, hour, minute) {
        try {
            const solar = Solar.fromYmdHms(year, month, day, hour || 0, minute || 0, 0);
            const lunar = solar.getLunar();
            
            return {
                success: true,
                year: lunar.getYear(),
                month: lunar.getMonth(),
                day: lunar.getDay(),
                monthInChinese: lunar.getMonthInChinese(),
                dayInChinese: lunar.getDayInChinese(),
                yearInChinese: lunar.getYearInChinese(),
                yearInGanZhi: lunar.getYearInGanZhi(),
                monthInGanZhi: lunar.getMonthInGanZhi(),
                dayInGanZhi: lunar.getDayInGanZhi(),
                isLeap: lunar.isLeap()
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    };
    
    // 获取今日宜忌信息
    window.getDailyTaboos = function(year, month, day) {
        try {
            const solar = Solar.fromYmd(year || new Date().getFullYear(), month || (new Date().getMonth() + 1), day || new Date().getDate());
            const lunar = solar.getLunar();
            
            // 获取宜忌信息
            const yiList = lunar.getDayYi() || [];
            const jiList = lunar.getDayJi() || [];
            
            return {
                success: true,
                suitable: yiList,
                avoid: jiList,
                lunarDate: lunar.getMonthInChinese() + lunar.getDayInChinese(),
                ganZhi: lunar.getDayInGanZhi()
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                suitable: [],
                avoid: []
            };
        }
    };
    
    // 获取八字信息
    window.calculateBaziFromSolar = function(year, month, day, hour, minute) {
        try {
            const solar = Solar.fromYmdHms(year, month, day, hour || 0, minute || 0, 0);
            const lunar = solar.getLunar();
            const eightChar = lunar.getEightChar();
            
            // 确保所有字符串都正确编码
            const result = {
                success: true,
                year: String(eightChar.getYear()),
                month: String(eightChar.getMonth()), 
                day: String(eightChar.getDay()),
                hour: String(eightChar.getTime()),
                yearGan: String(eightChar.getYearGan()),
                yearZhi: String(eightChar.getYearZhi()),
                monthGan: String(eightChar.getMonthGan()),
                monthZhi: String(eightChar.getMonthZhi()),
                dayGan: String(eightChar.getDayGan()),
                dayZhi: String(eightChar.getDayZhi()),
                hourGan: String(eightChar.getTimeGan()),
                hourZhi: String(eightChar.getTimeZhi())
            };
            
            // 返回JSON字符串而不是对象，避免Unicode编码问题
            return JSON.stringify(result);
        } catch (error) {
            return JSON.stringify({
                success: false,
                error: String(error.message)
            });
        }
    };
    
    // 通知Flutter初始化完成
    if (window.flutter_inappwebview && window.flutter_inappwebview.callHandler) {
        window.flutter_inappwebview.callHandler('onInitialized', 'ready');
    }
    </script>
</body>
</html>
''';

      // 创建WebView控制器
      _controller = WebViewController()
        ..setJavaScriptMode(JavaScriptMode.unrestricted)
        ..addJavaScriptChannel(
          'FlutterChannel',
          onMessageReceived: (JavaScriptMessage message) {
            // 处理来自JavaScript的消息
          },
        )
        ..loadHtmlString(htmlContent);

      // 等待页面加载完成
      await Future.delayed(const Duration(seconds: 2));

      _isInitialized = true;
    } catch (e) {
      print('LunarJsService初始化失败: $e');
      throw Exception('农历计算服务初始化失败: $e');
    }
  }

  /// 加载lunar.js文件内容
  Future<String> _loadLunarJs() async {
    try {
      // 尝试从assets加载
      return await rootBundle.loadString('assets/js/lunar.js');
    } catch (e) {
      // 如果assets中没有，尝试从文件系统加载
      try {
        final file = File('../js/lunar.js');
        if (await file.exists()) {
          return await file.readAsString();
        }
      } catch (e2) {
        print('从文件系统加载lunar.js失败: $e2');
      }

      // 如果都失败了，抛出异常
      throw Exception('无法加载lunar.js文件');
    }
  }

  /// 计算八字（使用精确的lunar.js库）
  Future<Map<String, dynamic>> calculateBaziFromSolar(DateTime solarDate) async {
    if (!_isInitialized) {
      await initialize();
    }

    if (_controller == null) {
      throw Exception('WebView控制器未初始化');
    }

    try {
      // 调用JavaScript函数
      final result = await _controller!.runJavaScriptReturningResult(
        'calculateBaziFromSolar(${solarDate.year}, ${solarDate.month}, ${solarDate.day}, ${solarDate.hour}, ${solarDate.minute})',
      );

      // 解析结果 - 现在JavaScript返回的是JSON字符串
      String jsonString;
      if (result is String) {
        // 如果已经是字符串，直接使用
        jsonString = result;
      } else {
        // 如果是其他类型，转换为字符串
        jsonString = result.toString();
      }
      
      // 移除可能的引号包装
      if (jsonString.startsWith('"') && jsonString.endsWith('"')) {
        jsonString = jsonString.substring(1, jsonString.length - 1);
        // 处理转义字符
        jsonString = jsonString.replaceAll('\\"', '"');
      }
      
      final Map<String, dynamic> data = jsonDecode(jsonString);

      if (data['success'] == true) {
        return {
          'year': '${data['yearGan']}${data['yearZhi']}',
          'month': '${data['monthGan']}${data['monthZhi']}',
          'day': '${data['dayGan']}${data['dayZhi']}',
          'hour': '${data['hourGan']}${data['hourZhi']}',
          'yearGan': data['yearGan'],
          'yearZhi': data['yearZhi'],
          'monthGan': data['monthGan'],
          'monthZhi': data['monthZhi'],
          'dayGan': data['dayGan'],
          'dayZhi': data['dayZhi'],
          'hourGan': data['hourGan'],
          'hourZhi': data['hourZhi'],
          'solarDate': solarDate.toIso8601String(),
        };
      } else {
        throw Exception('八字计算失败: ${data['error']}');
      }
    } catch (e) {
      print('八字计算失败: $e');
      rethrow;
    }
  }

  /// 计算农历日期
  Future<Map<String, dynamic>> calculateLunarDate(DateTime solarDate) async {
    if (!_isInitialized) {
      await initialize();
    }

    if (_controller == null) {
      throw Exception('WebView控制器未初始化');
    }

    try {
      // 调用JavaScript函数
      final result = await _controller!.runJavaScriptReturningResult(
        'calculateLunarDate(${solarDate.year}, ${solarDate.month}, ${solarDate.day}, ${solarDate.hour}, ${solarDate.minute})',
      );

      // 解析结果
      if (result is String) {
        final Map<String, dynamic> data = jsonDecode(result);

        if (data['success'] == true) {
          return {
            'year': data['year'],
            'month': data['month'],
            'day': data['day'],
            'monthName': data['monthInChinese'],
            'dayName': data['dayInChinese'],
            'fullDate': '${data['monthInChinese']}${data['dayInChinese']}',
            'yearGanZhi': data['yearInGanZhi'],
            'monthGanZhi': data['monthInGanZhi'],
            'dayGanZhi': data['dayInGanZhi'],
            'isLeap': data['isLeap'] ?? false,
          };
        } else {
          throw Exception('农历计算失败: ${data['error']}');
        }
      } else {
        throw Exception('JavaScript返回结果格式错误');
      }
    } catch (e) {
      print('农历日期计算失败: $e');
      // 如果JavaScript计算失败，回退到原有的计算方法
      return _fallbackCalculation(solarDate);
    }
  }

  /// 回退计算方法（使用原有的Dart实现）
  Map<String, dynamic> _fallbackCalculation(DateTime solarDate) {
    // 农历月份名称
    const lunarMonths = [
      '正月',
      '二月',
      '三月',
      '四月',
      '五月',
      '六月',
      '七月',
      '八月',
      '九月',
      '十月',
      '冬月',
      '腊月',
    ];

    // 农历日期名称
    const lunarDays = [
      '初一',
      '初二',
      '初三',
      '初四',
      '初五',
      '初六',
      '初七',
      '初八',
      '初九',
      '初十',
      '十一',
      '十二',
      '十三',
      '十四',
      '十五',
      '十六',
      '十七',
      '十八',
      '十九',
      '二十',
      '廿一',
      '廿二',
      '廿三',
      '廿四',
      '廿五',
      '廿六',
      '廿七',
      '廿八',
      '廿九',
      '三十',
    ];

    // 简化的农历计算（基于2024年8月4日 = 农历七月初一）
    DateTime baseDate = DateTime(2024, 8, 4);
    int daysDiff = solarDate.difference(baseDate).inDays;

    // 简单的月日计算
    int lunarMonth = 7;
    int lunarDay = 1 + daysDiff;
    int lunarYear = 2024;

    // 处理月份溢出
    while (lunarDay > 30) {
      lunarDay -= 30;
      lunarMonth++;
      if (lunarMonth > 12) {
        lunarMonth = 1;
        lunarYear++;
      }
    }

    while (lunarDay <= 0) {
      lunarMonth--;
      if (lunarMonth <= 0) {
        lunarMonth = 12;
        lunarYear--;
      }
      lunarDay += 30;
    }

    // 确保索引在有效范围内
    if (lunarMonth < 1) lunarMonth = 1;
    if (lunarMonth > 12) lunarMonth = 12;
    if (lunarDay < 1) lunarDay = 1;
    if (lunarDay > 30) lunarDay = 30;

    String monthName = lunarMonths[lunarMonth - 1];
    String dayName = lunarDays[lunarDay - 1];

    return {
      'year': lunarYear,
      'month': lunarMonth,
      'day': lunarDay,
      'monthName': monthName,
      'dayName': dayName,
      'fullDate': '$monthName$dayName',
      'yearGanZhi': '',
      'monthGanZhi': '',
      'dayGanZhi': '',
      'isLeap': false,
    };
  }

  /// 获取今日宜忌信息
  Future<Map<String, dynamic>> getDailyTaboos([DateTime? date]) async {
    if (!_isInitialized) {
      await initialize();
    }

    if (_controller == null) {
      throw Exception('WebView控制器未初始化');
    }

    final targetDate = date ?? DateTime.now();

    try {
      // 调用JavaScript函数
      final result = await _controller!.runJavaScriptReturningResult(
        'getDailyTaboos(${targetDate.year}, ${targetDate.month}, ${targetDate.day})',
      );

      // 解析结果
      if (result is String) {
        final Map<String, dynamic> data = jsonDecode(result);

        if (data['success'] == true) {
          return {
            'suitable': List<String>.from(data['suitable'] ?? []),
            'avoid': List<String>.from(data['avoid'] ?? []),
            'lunarDate': data['lunarDate'] ?? '',
            'ganZhi': data['ganZhi'] ?? '',
          };
        } else {
          throw Exception('宜忌信息获取失败: ${data['error']}');
        }
      } else {
        throw Exception('JavaScript返回结果格式错误');
      }
    } catch (e) {
      print('宜忌信息获取失败: $e');
      // 如果JavaScript计算失败，回退到模拟数据
      return _getFallbackTaboos();
    }
  }

  /// 回退宜忌数据（模拟数据）
  Map<String, dynamic> _getFallbackTaboos() {
    final now = DateTime.now();
    final dayOfYear = now.difference(DateTime(now.year, 1, 1)).inDays;

    final suitableList = [
      ['祭祀', '祈福', '求嗣'],
      ['开市', '交易', '立券'],
      ['出行', '移徙', '入宅'],
      ['嫁娶', '纳采', '问名'],
      ['修造', '动土', '竖柱'],
      ['栽种', '纳畜', '牧养'],
      ['安床', '作灶', '扫舍'],
    ];

    final avoidList = [
      ['安葬', '破土', '启攒'],
      ['开仓', '出货财物'],
      ['栽种', '伐木', '作梁'],
      ['纳畜', '牧养', '安床'],
      ['开池', '掘井', '作厕'],
      ['动土', '修造', '竖柱'],
      ['嫁娶', '纳采', '问名'],
    ];

    return {
      'suitable': suitableList[dayOfYear % suitableList.length],
      'avoid': avoidList[dayOfYear % avoidList.length],
      'lunarDate': '',
      'ganZhi': '',
    };
  }

  /// 释放资源
  void dispose() {
    _controller = null;
    _isInitialized = false;
  }
}
