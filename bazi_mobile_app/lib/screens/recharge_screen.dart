import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:provider/provider.dart';
import '../services/auth_service.dart';

// Web特定导入 - 仅在Web平台使用
// 移除Web特定导入，在移动平台上不需要

class RechargeScreen extends StatefulWidget {
  const RechargeScreen({super.key});

  @override
  State<RechargeScreen> createState() => _RechargeScreenState();
}

class _RechargeScreenState extends State<RechargeScreen> {
  late final WebViewController _controller;
  bool _isLoading = true;
  String? _iframeId;
  AuthService? _authService;

  @override
  void initState() {
    super.initState();
    debugPrint('RechargeScreen initState开始');
    debugPrint('当前平台: ${kIsWeb ? 'Web' : 'Mobile'}');
    _authService = Provider.of<AuthService>(context, listen: false);
    if (kIsWeb) {
      debugPrint('Web环境，调用_initializeWebIframe');
      _initializeWebIframe();
    } else {
      debugPrint('移动环境，调用_initializeWebView');
      _initializeWebView();
    }
  }

  void _initializeWebIframe() {
    if (kIsWeb) {
      debugPrint('Web平台充值功能暂不支持');
    } else {
      debugPrint('移动平台使用WebView进行充值');
      _initializeWebView();
    }
  }

  void _initializeWebView() {
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..enableZoom(false)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (String url) {
            setState(() {
              _isLoading = true;
            });
          },
          onPageFinished: (String url) {
            setState(() {
              _isLoading = false;
            });
            // 传递用户信息到WebView
            _injectUserDataToWebView();
          },
          onWebResourceError: (WebResourceError error) {
            debugPrint('WebView error: ${error.description}');
          },
        ),
      )
      ..addJavaScriptChannel(
        'ConsoleLog',
        onMessageReceived: (JavaScriptMessage message) {
          debugPrint('WebView Console: ${message.message}');
        },
      )
      ..addJavaScriptChannel(
        'JSLog',
        onMessageReceived: (JavaScriptMessage message) {
          debugPrint('WebView JSLog: ${message.message}');
        },
      )
      ..addJavaScriptChannel(
        'FlutterRechargeSuccess',
        onMessageReceived: (JavaScriptMessage message) {
          debugPrint('充值成功回调: ${message.message}');
          if (message.message == 'success') {
            // 充值成功，刷新余额
            Provider.of<AuthService>(context, listen: false).refreshBalance();
            // 返回主页面
            Navigator.of(context).pop();
            // 显示成功提示
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('充值成功！'),
                backgroundColor: Colors.green,
                duration: Duration(seconds: 3),
              ),
            );
          }
        },
      )
      ..loadFlutterAsset('assets/stripe_recharge.html');
  }

  // 向iframe注入用户数据
  // Web特定的iframe注入方法已移除，移动平台使用WebView
  


  // 向WebView注入用户数据
  void _injectUserDataToWebView() {
    debugPrint('开始注入用户数据到WebView');
    debugPrint('AuthService状态: isLoggedIn=${_authService?.isLoggedIn}');
    debugPrint('Token: ${_authService?.token}');
    debugPrint('Username: ${_authService?.currentUser?.username}');
    
    if (_authService?.isLoggedIn == true) {
      final token = _authService?.token ?? '';
      final username = _authService?.currentUser?.username ?? '';
      
      debugPrint('准备注入数据: username=$username, token=${token.isNotEmpty ? '有token' : '无token'}');
      
      final script = '''
        console.log('Flutter注入用户数据: username=$username, token=${token.isNotEmpty ? '有token' : '无token'}');
        if (window.localStorage) {
          window.localStorage.setItem('token', '$token');
          window.localStorage.setItem('username', '$username');
          console.log('已设置localStorage: token=' + localStorage.getItem('token') + ', username=' + localStorage.getItem('username'));
          // 触发页面更新用户信息显示
          if (typeof window.updateUserInfo === 'function') {
            window.updateUserInfo('$username', '$token');
          } else {
            console.log('updateUserInfo函数不存在，尝试重新加载页面');
            // 如果没有updateUserInfo函数，尝试重新加载页面
            window.location.reload();
          }
        } else {
          console.error('localStorage不可用');
        }
      ''';
      
      _controller.runJavaScript(script).catchError((error) {
        debugPrint('注入用户数据到WebView失败: $error');
      });
    } else {
      debugPrint('用户未登录，跳过数据注入');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('充值中心'),
        backgroundColor: const Color(0xFF3498DB),
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: Stack(
        children: [
          if (kIsWeb && _iframeId != null)
            HtmlElementView(viewType: _iframeId!)
          else if (!kIsWeb)
            WebViewWidget(controller: _controller)
          else
            const Center(
              child: Text(
                '加载中...',
                style: TextStyle(fontSize: 16),
              ),
            ),
          if (_isLoading)
            const Center(
              child: CircularProgressIndicator(
                color: Color(0xFF3498DB),
              ),
            ),
        ],
      ),
    );
  }
}
