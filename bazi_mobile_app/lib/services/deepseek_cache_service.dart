import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:crypto/crypto.dart';

/// DeepSeek API缓存服务
/// 用于缓存命格等级、财富等级、九大分析模块的API响应结果
class DeepSeekCacheService {
  static const String _cachePrefix = 'deepseek_cache_';
  static const Duration _defaultCacheDuration = Duration(days: 30); // 默认缓存30天

  static final DeepSeekCacheService _instance =
      DeepSeekCacheService._internal();
  factory DeepSeekCacheService() => _instance;
  DeepSeekCacheService._internal();

  /// 生成八字数据的唯一标识符
  String _generateBaziKey(Map<String, dynamic> baziData, String analysisType) {
    // 提取关键的八字信息用于生成唯一标识
    final keyData = {
      'pillars': baziData['pillars'] ?? baziData['paipan'],
      'analysisType': analysisType,
    };

    // 使用MD5生成唯一标识符
    final keyString = json.encode(keyData);
    final bytes = utf8.encode(keyString);
    final digest = md5.convert(bytes);
    return digest.toString();
  }

  /// 获取缓存的分析结果
  Future<String?> getCachedAnalysis(
    Map<String, dynamic> baziData,
    String analysisType,
  ) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final cacheKey = _cachePrefix + _generateBaziKey(baziData, analysisType);

      final cachedData = prefs.getString(cacheKey);
      if (cachedData == null) {
        return null;
      }

      final cacheInfo = json.decode(cachedData);
      final expiryTime = DateTime.parse(cacheInfo['expiry']);

      // 检查是否过期
      if (DateTime.now().isAfter(expiryTime)) {
        // 删除过期缓存
        await prefs.remove(cacheKey);
        return null;
      }

      print('✅ 从缓存获取$analysisType分析结果');
      return cacheInfo['content'];
    } catch (e) {
      print('❌ 获取缓存失败: $e');
      return null;
    }
  }

  /// 缓存分析结果
  Future<void> cacheAnalysis(
    Map<String, dynamic> baziData,
    String analysisType,
    String content, {
    Duration? cacheDuration,
  }) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final cacheKey = _cachePrefix + _generateBaziKey(baziData, analysisType);

      final duration = cacheDuration ?? _defaultCacheDuration;
      final expiryTime = DateTime.now().add(duration);

      final cacheData = {
        'content': content,
        'expiry': expiryTime.toIso8601String(),
        'analysisType': analysisType,
        'cachedAt': DateTime.now().toIso8601String(),
      };

      await prefs.setString(cacheKey, json.encode(cacheData));
      print('✅ 已缓存$analysisType分析结果，过期时间: ${expiryTime.toString()}');
    } catch (e) {
      print('❌ 缓存失败: $e');
    }
  }

  /// 获取缓存的命格等级分析
  Future<String?> getCachedMinggeAnalysis(Map<String, dynamic> baziData) async {
    return await getCachedAnalysis(baziData, 'mingge');
  }

  /// 缓存命格等级分析
  Future<void> cacheMinggeAnalysis(
    Map<String, dynamic> baziData,
    String content,
  ) async {
    await cacheAnalysis(baziData, 'mingge', content);
  }

  /// 获取缓存的财富等级分析
  Future<String?> getCachedWealthAnalysis(Map<String, dynamic> baziData) async {
    return await getCachedAnalysis(baziData, 'career');
  }

  /// 缓存财富等级分析
  Future<void> cacheWealthAnalysis(
    Map<String, dynamic> baziData,
    String content,
  ) async {
    await cacheAnalysis(baziData, 'career', content);
  }

  /// 获取缓存的九大分析模块结果
  Future<Map<String, dynamic>?> getCachedDetailedAnalysis(
    Map<String, dynamic> baziData,
    String analysisType,
  ) async {
    try {
      final cachedContent = await getCachedAnalysis(baziData, analysisType);
      if (cachedContent != null) {
        return {'content': cachedContent, 'analysis': cachedContent};
      }
      return null;
    } catch (e) {
      print('❌ 获取九大分析缓存失败: $e');
      return null;
    }
  }

  /// 缓存九大分析模块结果
  Future<void> cacheDetailedAnalysis(
    Map<String, dynamic> baziData,
    String analysisType,
    Map<String, dynamic> result,
  ) async {
    try {
      final content = result['content'] ?? result['analysis'] ?? '';
      if (content.isNotEmpty) {
        await cacheAnalysis(baziData, analysisType, content);
      }
    } catch (e) {
      print('❌ 缓存九大分析失败: $e');
    }
  }

  /// 清理过期缓存
  Future<void> clearExpiredCache() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final allKeys = prefs.getKeys();

      final cacheKeys = allKeys.where((key) => key.startsWith(_cachePrefix));
      int removedCount = 0;

      for (final key in cacheKeys) {
        final cachedData = prefs.getString(key);
        if (cachedData != null) {
          try {
            final cacheInfo = json.decode(cachedData);
            final expiryTime = DateTime.parse(cacheInfo['expiry']);

            if (DateTime.now().isAfter(expiryTime)) {
              await prefs.remove(key);
              removedCount++;
            }
          } catch (e) {
            // 如果解析失败，删除这个无效的缓存项
            await prefs.remove(key);
            removedCount++;
          }
        }
      }

      if (removedCount > 0) {
        print('✅ 清理了 $removedCount 个过期缓存项');
      }
    } catch (e) {
      print('❌ 清理过期缓存失败: $e');
    }
  }

  /// 清理所有缓存
  Future<void> clearAllCache() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final allKeys = prefs.getKeys();

      final cacheKeys = allKeys.where((key) => key.startsWith(_cachePrefix));

      for (final key in cacheKeys) {
        await prefs.remove(key);
      }

      print('✅ 已清理所有DeepSeek缓存');
    } catch (e) {
      print('❌ 清理所有缓存失败: $e');
    }
  }

  /// 获取缓存统计信息
  Future<Map<String, dynamic>> getCacheStats() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final allKeys = prefs.getKeys();

      final cacheKeys = allKeys.where((key) => key.startsWith(_cachePrefix));
      int totalCount = 0;
      int expiredCount = 0;
      int validCount = 0;

      for (final key in cacheKeys) {
        totalCount++;
        final cachedData = prefs.getString(key);
        if (cachedData != null) {
          try {
            final cacheInfo = json.decode(cachedData);
            final expiryTime = DateTime.parse(cacheInfo['expiry']);

            if (DateTime.now().isAfter(expiryTime)) {
              expiredCount++;
            } else {
              validCount++;
            }
          } catch (e) {
            expiredCount++;
          }
        }
      }

      return {
        'total': totalCount,
        'valid': validCount,
        'expired': expiredCount,
      };
    } catch (e) {
      print('❌ 获取缓存统计失败: $e');
      return {'total': 0, 'valid': 0, 'expired': 0};
    }
  }
}
