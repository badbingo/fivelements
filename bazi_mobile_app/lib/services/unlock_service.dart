import 'package:shared_preferences/shared_preferences.dart';
import 'api_service.dart';
import 'auth_service.dart';

/// 付费解锁服务
/// 管理八字内容的付费解锁状态
class UnlockService {
  static const String _unlockPrefix = 'unlock_';
  
  // 付费项目类型
  static const String minggeLevel = 'mingge_level';
  static const String wealthLevel = 'wealth_level';
  static const String detailedAnalysis = 'detailed_analysis';
  static const String liuyaoDeepAnalysis = 'liuyao_deep_analysis';
  
  // 付费价格（元）
  static const Map<String, double> prices = {
    minggeLevel: 2.0,
    wealthLevel: 2.0,
    detailedAnalysis: 5.0,
    liuyaoDeepAnalysis: 1.0,
  };
  
  // 付费项目名称
  static const Map<String, String> itemNames = {
    minggeLevel: '命格等级分析',
    wealthLevel: '财富等级分析',
    detailedAnalysis: '九大分析模块',
    liuyaoDeepAnalysis: '六爻深度解卦',
  };

  /// 检查指定八字的付费项目是否已解锁
  static Future<bool> isUnlocked(String baziHash, String itemType) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final key = '$_unlockPrefix${baziHash}_$itemType';
      return prefs.getBool(key) ?? false;
    } catch (e) {
      print('检查解锁状态失败: $e');
      return false;
    }
  }

  /// 设置指定八字的付费项目为已解锁
  static Future<void> setUnlocked(String baziHash, String itemType) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final key = '$_unlockPrefix${baziHash}_$itemType';
      await prefs.setBool(key, true);
      
      // 同时保存解锁记录到服务器（可选）
       try {
         final authService = AuthService();
         final token = authService.token;
         if (token != null) {
           await ApiService.saveUnlockRecord(token, baziHash, itemType);
         }
       } catch (e) {
         print('保存解锁记录到服务器失败: $e');
         // 即使服务器保存失败，本地解锁状态仍然有效
       }
    } catch (e) {
      print('设置解锁状态失败: $e');
    }
  }

  /// 获取所有已解锁的功能
  static Future<List<String>> getUnlockedFeatures(String baziHash) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final keys = prefs.getKeys();
      final unlockedFeatures = <String>[];
      
      for (final key in keys) {
        if (key.startsWith('$_unlockPrefix${baziHash}_') && prefs.getBool(key) == true) {
          final feature = key.replaceFirst('$_unlockPrefix${baziHash}_', '');
          unlockedFeatures.add(feature);
        }
      }
      
      return unlockedFeatures;
    } catch (e) {
      print('获取解锁功能列表失败: $e');
      return [];
    }
  }

  /// 生成八字哈希值（用于标识唯一的八字）
  static String generateBaziHash(Map<String, dynamic> baziData) {
    // 使用年月日时的天干地支组合生成唯一标识
    final yearStem = baziData['yearStem'] ?? '';
    final yearBranch = baziData['yearBranch'] ?? '';
    final monthStem = baziData['monthStem'] ?? '';
    final monthBranch = baziData['monthBranch'] ?? '';
    final dayStem = baziData['dayStem'] ?? '';
    final dayBranch = baziData['dayBranch'] ?? '';
    final hourStem = baziData['hourStem'] ?? '';
    final hourBranch = baziData['hourBranch'] ?? '';
    
    final baziString = '$yearStem$yearBranch$monthStem$monthBranch$dayStem$dayBranch$hourStem$hourBranch';
    return baziString.hashCode.toString();
  }

  /// 尝试解锁付费内容
  /// 返回解锁结果：success, insufficient_balance, error
  static Future<UnlockResult> tryUnlock(
    String baziHash,
    String itemType,
    AuthService authService,
  ) async {
    try {
      // 1. 检查是否已解锁
      if (await isUnlocked(baziHash, itemType)) {
        return UnlockResult(
          success: true,
          message: '内容已解锁',
          needRecharge: false,
        );
      }

      // 2. 检查用户是否登录
      if (!authService.isLoggedIn || authService.token == null) {
        return UnlockResult(
          success: false,
          message: '请先登录',
          needRecharge: false,
        );
      }

      // 3. 获取当前余额
      final currentBalance = await ApiService.getUserBalance(authService.token!);
      final price = prices[itemType] ?? 0.0;

      // 4. 检查余额是否充足
      if (currentBalance < price) {
        return UnlockResult(
          success: false,
          message: '余额不足，当前余额：￥${currentBalance.toStringAsFixed(2)}，需要：￥${price.toStringAsFixed(2)}',
          needRecharge: true,
          currentBalance: currentBalance,
          requiredAmount: price,
        );
      }

      // 5. 执行扣费
      final itemName = itemNames[itemType] ?? itemType;
      final deductResponse = await ApiService.deductBalance(
        authService.token!,
        price,
        '解锁$itemName',
      );

      if (deductResponse['success'] == true) {
        // 6. 扣费成功，设置为已解锁
        await setUnlocked(baziHash, itemType);
        
        // 7. 更新用户余额
        await authService.refreshBalance();
        
        return UnlockResult(
          success: true,
          message: '解锁成功！已扣费￥${price.toStringAsFixed(2)}',
          needRecharge: false,
          deductedAmount: price,
        );
      } else {
        return UnlockResult(
          success: false,
          message: deductResponse['message'] ?? '扣费失败',
          needRecharge: false,
        );
      }
    } catch (e) {
      print('解锁失败: $e');
      return UnlockResult(
        success: false,
        message: '网络错误，请稍后重试',
        needRecharge: false,
      );
    }
  }

  /// 清除所有解锁状态（用于测试或重置）
  static Future<void> clearAllUnlocks() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final keys = prefs.getKeys().where((key) => key.startsWith(_unlockPrefix));
      for (final key in keys) {
        await prefs.remove(key);
      }
    } catch (e) {
      print('清除解锁状态失败: $e');
    }
  }
}

/// 解锁结果类
class UnlockResult {
  final bool success;
  final String message;
  final bool needRecharge;
  final double? currentBalance;
  final double? requiredAmount;
  final double? deductedAmount;

  UnlockResult({
    required this.success,
    required this.message,
    required this.needRecharge,
    this.currentBalance,
    this.requiredAmount,
    this.deductedAmount,
  });
}