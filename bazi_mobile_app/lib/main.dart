import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:uni_links/uni_links.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'dart:async';
import 'services/auth_service.dart';
import 'providers/app_provider.dart';
import 'screens/main/main_screen.dart';
import 'screens/auth/login_screen.dart';
import 'screens/auth/register_screen.dart';
import 'screens/auth/forgot_password_screen.dart';
import 'screens/bazi_webview_screen.dart';
import 'screens/detailed_analysis_screen.dart';
import 'screens/recharge_screen.dart';
import 'screens/profile/personal_bazi_screen.dart';
import 'screens/liuyao_screen.dart';
import 'screens/settings_screen.dart';
import 'services/strength_analysis_service.dart';
import 'services/deepseek_cache_service.dart';
import 'test_connection.dart';

void main() async {
  // 确保Flutter绑定初始化
  WidgetsFlutterBinding.ensureInitialized();

  // 应用启动时清理过期缓存
  try {
    final cacheService = DeepSeekCacheService();
    await cacheService.clearExpiredCache();
    print('🧹 应用启动时已清理过期缓存');
  } catch (e) {
    print('⚠️ 清理过期缓存失败: $e');
  }

  // 测试算法修正效果
  _testBaziCalculation();
  runApp(const BaziApp());
}

/// 测试多个八字的强度百分比计算
void _testBaziCalculation() {
  // 测试用例1: 从弱格
  try {
    List<String> stems1 = ['壬', '癸', '己', '癸'];
    List<String> branches1 = ['子', '丑', '巳', '酉'];

    var result1 = StrengthAnalysisService.calculateOriginalStrength(
      stems1,
      branches1,
    );

    print('🧪 测试八字1: 壬子，癸丑，己巳，癸酉');
    print('📊 原命局强度百分比: ${result1.strengthPercentage.toStringAsFixed(2)}%');
    print('🎯 预期结果: ~22% (baziphone.html - 从弱格)');
    print(
      '✅ 算法修正${(result1.strengthPercentage - 22.0).abs() < 5.0 ? '成功' : '需要进一步调整'}',
    );
    print('');
  } catch (e) {
    print('❌ 测试1失败: $e');
  }

  // 测试用例2: 从财格
  try {
    List<String> stems2 = ['戊', '己', '乙', '丁'];
    List<String> branches2 = ['午', '未', '酉', '丑'];

    var result2 = StrengthAnalysisService.calculateOriginalStrength(
      stems2,
      branches2,
    );

    print('🧪 测试八字2: 戊午，己未，乙酉，丁丑');
    print('📊 原命局强度百分比: ${result2.strengthPercentage.toStringAsFixed(2)}%');
    print('🎯 预期结果: ~10.36% (baziphone.html - 从弱格)');
    print(
      '✅ 算法修正${(result2.strengthPercentage - 10.36).abs() < 3.0 ? '成功' : '需要进一步调整'}',
    );
  } catch (e) {
    print('❌ 测试2失败: $e');
  }
}

class BaziApp extends StatefulWidget {
  const BaziApp({super.key});

  @override
  State<BaziApp> createState() => _BaziAppState();
}

class _BaziAppState extends State<BaziApp> {
  final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();
  StreamSubscription? _linkSubscription;

  @override
  void initState() {
    super.initState();
    _initDeepLinks();
  }

  @override
  void dispose() {
    _linkSubscription?.cancel();
    super.dispose();
  }

  void _initDeepLinks() async {
    // 处理应用启动时的深度链接
    try {
      final initialLink = await getInitialLink();
      if (initialLink != null) {
        _handleDeepLink(initialLink);
      }
    } catch (e) {
      print('Error getting initial link: $e');
    }

    // 监听应用运行时的深度链接
    _linkSubscription = linkStream.listen(
      (String? link) {
        if (link != null) {
          _handleDeepLink(link);
        }
      },
      onError: (err) {
        print('Deep link error: $err');
      },
    );
  }

  void _handleDeepLink(String link) {
    print('Received deep link: $link');
    final uri = Uri.parse(link);

    if (uri.scheme == 'mybazi') {
      if (uri.host == 'reset') {
        final token = uri.queryParameters['token'];
        if (token != null) {
          // 导航到密码重设页面
          navigatorKey.currentState?.pushAndRemoveUntil(
            MaterialPageRoute(
              builder: (context) => BaziWebViewScreen(
                initialUrl: 'assets/password_recovery.html?token=$token',
              ),
            ),
            (route) => false,
          );
        }
      } else if (uri.host == 'login') {
        // 导航到登录页面
        navigatorKey.currentState?.pushAndRemoveUntil(
          MaterialPageRoute(
            builder: (context) =>
                const BaziWebViewScreen(initialUrl: 'assets/baziphone.html'),
          ),
          (route) => false,
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(
          create: (context) {
            final authService = AuthService();
            authService.initialize(); // 确保初始化
            return authService;
          },
        ),
        ChangeNotifierProxyProvider<AuthService, AppProvider>(
          create: (context) => AppProvider(),
          update: (context, authService, appProvider) {
            // 当AuthService状态变化时，同步用户信息到AppProvider
            if (authService.isLoggedIn && authService.currentUser != null) {
              // 如果AuthService已登录但AppProvider还没有用户信息，则同步
              if (appProvider?.user == null ||
                  appProvider?.user?.id != authService.currentUser?.id) {
                WidgetsBinding.instance.addPostFrameCallback((_) {
                  appProvider?.syncUserFromAuthService(authService);
                });
              }
            } else if (!authService.isLoggedIn && appProvider?.user != null) {
              // 如果AuthService已登出但AppProvider还有用户信息，则清除
              WidgetsBinding.instance.addPostFrameCallback((_) {
                appProvider?.clearUserInfo();
              });
            }
            return appProvider ?? AppProvider();
          },
        ),
      ],
      child: MaterialApp(
        navigatorKey: navigatorKey,
        title: '八字预测系统',
        localizationsDelegates: const [
          GlobalMaterialLocalizations.delegate,
          GlobalWidgetsLocalizations.delegate,
          GlobalCupertinoLocalizations.delegate,
        ],
        supportedLocales: const [Locale('zh', 'CN'), Locale('en', 'US')],
        theme: ThemeData(
          primarySwatch: Colors.blue,
          useMaterial3: true,
          appBarTheme: const AppBarTheme(
            backgroundColor: Color(0xFF2C3E50),
            foregroundColor: Colors.white,
            elevation: 0,
          ),
        ),
        home: Consumer2<AuthService, AppProvider>(
          builder: (context, authService, appProvider, child) {
            if (authService.isLoading) {
              return const SplashScreen();
            }
            // 只有当AuthService和AppProvider都确认用户已登录时才显示MainScreen
            return (authService.isLoggedIn && appProvider.isLoggedIn)
                ? const MainScreen()
                : const LoginScreen();
          },
        ),
        routes: {
          '/login': (context) => const LoginScreen(),
          '/register': (context) => const RegisterScreen(),
          '/forgot-password': (context) => const ForgotPasswordScreen(),
          '/main': (context) => const MainScreen(),
          '/detailed-analysis': (context) => const DetailedAnalysisScreen(),
          '/recharge': (context) => const RechargeScreen(),
          '/personal-bazi': (context) => const PersonalBaziScreen(),
          '/liuyao': (context) => const LiuyaoScreen(),
          '/settings': (context) => const SettingsScreen(),
          '/test-connection': (context) => TestConnectionPage(),
        },
        debugShowCheckedModeBanner: false,
      ),
    );
  }
}

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _initializeApp();
  }

  Future<void> _initializeApp() async {
    // 简短的启动延迟
    await Future.delayed(const Duration(seconds: 1));
    // 注意：不再自动跳转到MainScreen，让Consumer2来决定显示哪个页面
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF2C3E50),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(60),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.2),
                    blurRadius: 20,
                    offset: const Offset(0, 10),
                  ),
                ],
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(60),
                child: Image.asset(
                  'assets/zodiac/horseicon.png',
                  width: 120,
                  height: 120,
                  fit: BoxFit.cover,
                  errorBuilder:
                      (
                        BuildContext context,
                        Object error,
                        StackTrace? stackTrace,
                      ) => Container(
                        width: 120,
                        height: 120,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(60),
                        ),
                        child: const Icon(
                          Icons.auto_awesome,
                          size: 60,
                          color: Color(0xFF3498DB),
                        ),
                      ),
                ),
              ),
            ),
            const SizedBox(height: 30),
            const Text(
              '八字预测系统',
              style: TextStyle(
                fontSize: 28,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 10),
            const Text(
              '专业命理分析，洞察人生运势',
              style: TextStyle(fontSize: 16, color: Colors.white70),
            ),
            const SizedBox(height: 50),
            const CircularProgressIndicator(
              valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
            ),
          ],
        ),
      ),
    );
  }
}
