import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/qa_model.dart';

/// SharedPreferences辅助工具类
class SharedPreferencesHelper {
  // 存储键常量
  static const String _qaHistoryKey = 'qa_history';
  static const String _dailyQuestionCountKey = 'daily_question_count';
  static const String _lastQuestionDateKey = 'last_question_date';
  static const String _tokenKey = 'auth_token';

  /// 获取问答历史
  static Future<List<QAModel>> getQAHistory() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final historyJson = prefs.getString(_qaHistoryKey);

      if (historyJson == null || historyJson.isEmpty) {
        return [];
      }

      final List<dynamic> historyList = jsonDecode(historyJson);
      return historyList
          .map((json) => QAModel.fromJson(json as Map<String, dynamic>))
          .toList();
    } catch (e) {
      print('获取问答历史失败: $e');
      return [];
    }
  }

  /// 保存问答历史
  static Future<void> saveQAHistory(List<QAModel> history) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final historyJson = jsonEncode(history.map((qa) => qa.toJson()).toList());
      await prefs.setString(_qaHistoryKey, historyJson);
    } catch (e) {
      print('保存问答历史失败: $e');
    }
  }

  /// 获取每日问题计数
  static Future<int> getDailyQuestionCount() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final today = DateTime.now().toIso8601String().split('T')[0];
      final lastDate = prefs.getString(_lastQuestionDateKey);

      // 如果不是今天，重置计数
      if (lastDate != today) {
        await prefs.setInt(_dailyQuestionCountKey, 0);
        await prefs.setString(_lastQuestionDateKey, today);
        return 0;
      }

      return prefs.getInt(_dailyQuestionCountKey) ?? 0;
    } catch (e) {
      print('获取每日问题计数失败: $e');
      return 0;
    }
  }

  /// 保存每日问题计数
  static Future<void> saveDailyQuestionCount(int count) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final today = DateTime.now().toIso8601String().split('T')[0];

      await prefs.setInt(_dailyQuestionCountKey, count);
      await prefs.setString(_lastQuestionDateKey, today);
    } catch (e) {
      print('保存每日问题计数失败: $e');
    }
  }

  /// 重置每日问题计数
  static Future<void> resetDailyQuestionCount() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final today = DateTime.now().toIso8601String().split('T')[0];

      await prefs.setInt(_dailyQuestionCountKey, 0);
      await prefs.setString(_lastQuestionDateKey, today);
    } catch (e) {
      print('重置每日问题计数失败: $e');
    }
  }

  /// 清除问答相关数据
  static Future<void> clearQAData() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_qaHistoryKey);
      await prefs.remove(_dailyQuestionCountKey);
      await prefs.remove(_lastQuestionDateKey);
    } catch (e) {
      print('清除问答数据失败: $e');
    }
  }

  /// 获取最后问题日期
  static Future<String?> getLastQuestionDate() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getString(_lastQuestionDateKey);
    } catch (e) {
      print('获取最后问题日期失败: $e');
      return null;
    }
  }

  /// 检查是否是新的一天
  static Future<bool> isNewDay() async {
    try {
      final today = DateTime.now().toIso8601String().split('T')[0];
      final lastDate = await getLastQuestionDate();
      return lastDate != today;
    } catch (e) {
      print('检查新一天失败: $e');
      return true;
    }
  }

  /// 添加新的问答记录到历史
  static Future<void> addQAToHistory(QAModel qa) async {
    try {
      final history = await getQAHistory();
      history.insert(0, qa);

      // 取消缓存数量限制，保留所有历史记录
      // if (history.length > 5) {
      //   history.removeRange(5, history.length);
      // }

      await saveQAHistory(history);
    } catch (e) {
      print('添加问答记录到历史失败: $e');
    }
  }

  /// 增加每日问题计数
  static Future<int> incrementDailyQuestionCount() async {
    try {
      final currentCount = await getDailyQuestionCount();
      final newCount = currentCount + 1;
      await saveDailyQuestionCount(newCount);
      return newCount;
    } catch (e) {
      print('增加每日问题计数失败: $e');
      return 0;
    }
  }

  /// 获取认证token
  static Future<String?> getToken() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getString(_tokenKey);
    } catch (e) {
      print('获取token失败: $e');
      return null;
    }
  }

  /// 保存认证token
  static Future<void> saveToken(String token) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_tokenKey, token);
    } catch (e) {
      print('保存token失败: $e');
    }
  }

  /// 删除认证token
  static Future<void> removeToken() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_tokenKey);
    } catch (e) {
      print('删除token失败: $e');
    }
  }
}
