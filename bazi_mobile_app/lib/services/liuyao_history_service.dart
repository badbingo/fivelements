import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/liuyao_models.dart';

class LiuyaoHistoryService {
  static const String _historyKey = 'liuyao_history';
  static const int _maxHistoryCount = 100;

  /// 保存占卜记录
  Future<void> saveResult(LiuyaoResult result) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final history = await getHistory();

      // 添加新结果到历史记录
      final updatedHistory = history.addResult(result);

      // 限制历史记录数量
      final results = updatedHistory.results;
      final sortedResults = [...results]
        ..sort((a, b) => b.timestamp.compareTo(a.timestamp));
      final limitedResults = sortedResults.take(_maxHistoryCount).toList();

      final finalHistory = LiuyaoHistory(results: limitedResults);

      // 保存到本地存储
      await prefs.setString(_historyKey, jsonEncode(finalHistory.toJson()));
    } catch (e) {
      print('保存六爻历史记录失败: $e');
    }
  }

  /// 获取历史记录
  Future<LiuyaoHistory> getHistory() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final jsonString = prefs.getString(_historyKey);

      if (jsonString == null || jsonString.isEmpty) {
        return const LiuyaoHistory(results: []);
      }

      final json = jsonDecode(jsonString) as Map<String, dynamic>;
      return LiuyaoHistory.fromJson(json);
    } catch (e) {
      print('获取六爻历史记录失败: $e');
      return const LiuyaoHistory(results: []);
    }
  }

  /// 删除指定记录
  Future<void> deleteRecord(DateTime timestamp) async {
    try {
      final history = await getHistory();
      final updatedResults = history.results
          .where((result) => result.timestamp != timestamp)
          .toList();

      final updatedHistory = LiuyaoHistory(results: updatedResults);

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_historyKey, jsonEncode(updatedHistory.toJson()));
    } catch (e) {
      print('删除六爻历史记录失败: $e');
    }
  }

  /// 清空所有历史记录
  Future<void> clearHistory() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_historyKey);
    } catch (e) {
      print('清空六爻历史记录失败: $e');
    }
  }

  /// 获取历史记录统计
  Future<Map<String, int>> getHistoryStats() async {
    try {
      final history = await getHistory();
      final now = DateTime.now();

      int todayCount = 0;
      int weekCount = 0;
      int monthCount = 0;

      for (final result in history.results) {
        final diff = now.difference(result.timestamp);

        if (diff.inDays == 0) {
          todayCount++;
        }

        if (diff.inDays <= 7) {
          weekCount++;
        }

        if (diff.inDays <= 30) {
          monthCount++;
        }
      }

      return {
        'total': history.results.length,
        'today': todayCount,
        'week': weekCount,
        'month': monthCount,
      };
    } catch (e) {
      print('获取六爻历史统计失败: $e');
      return {'total': 0, 'today': 0, 'week': 0, 'month': 0};
    }
  }

  /// 搜索历史记录
  Future<List<LiuyaoResult>> searchHistory(String keyword) async {
    try {
      final history = await getHistory();

      if (keyword.isEmpty) {
        return history.results;
      }

      return history.results.where((result) {
        final question = result.question.toLowerCase();
        final hexagramName = result.originalHexagram.fullName.toLowerCase();
        final analysis = result.analysis.toLowerCase();
        final searchKey = keyword.toLowerCase();

        return question.contains(searchKey) ||
            hexagramName.contains(searchKey) ||
            analysis.contains(searchKey);
      }).toList();
    } catch (e) {
      print('搜索六爻历史记录失败: $e');
      return [];
    }
  }

  /// 导出历史记录为JSON
  Future<String> exportHistory() async {
    try {
      final history = await getHistory();
      return jsonEncode(history.toJson());
    } catch (e) {
      print('导出六爻历史记录失败: $e');
      return '{"results":[]}';
    }
  }

  /// 从JSON导入历史记录
  Future<bool> importHistory(String jsonString) async {
    try {
      final json = jsonDecode(jsonString) as Map<String, dynamic>;
      final importedHistory = LiuyaoHistory.fromJson(json);

      final currentHistory = await getHistory();

      // 合并历史记录，避免重复
      final allResults = <LiuyaoResult>[];
      final existingTimestamps = currentHistory.results
          .map((result) => result.timestamp)
          .toSet();

      // 添加现有记录
      allResults.addAll(currentHistory.results);

      // 添加导入的记录（去重）
      for (final result in importedHistory.results) {
        if (!existingTimestamps.contains(result.timestamp)) {
          allResults.add(result);
        }
      }

      // 按时间排序
      allResults.sort((a, b) => b.timestamp.compareTo(a.timestamp));

      // 限制数量
      final limitedResults = allResults.take(_maxHistoryCount).toList();

      // 保存
      final finalHistory = LiuyaoHistory(results: limitedResults);
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_historyKey, jsonEncode(finalHistory.toJson()));

      return true;
    } catch (e) {
      print('导入六爻历史记录失败: $e');
      return false;
    }
  }
}
