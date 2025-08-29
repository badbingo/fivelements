import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';

class BaziWebViewScreen extends StatefulWidget {
  final String? initialUrl;

  const BaziWebViewScreen({super.key, this.initialUrl});

  @override
  State<BaziWebViewScreen> createState() => _BaziWebViewScreenState();
}

class _BaziWebViewScreenState extends State<BaziWebViewScreen> {
  late final WebViewController _controller;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _initializeWebView();
  }

  void _initializeWebView() {
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(
        NavigationDelegate(
          onProgress: (int progress) {
            if (progress == 100) {
              setState(() {
                _isLoading = false;
              });
            }
          },
          onPageStarted: (String url) {
            setState(() {
              _isLoading = true;
            });
          },
          onPageFinished: (String url) {
            setState(() {
              _isLoading = false;
            });
            // 如果是密码重设页面且有token，注入token到页面
            _injectTokenIfNeeded();
          },
          onWebResourceError: (WebResourceError error) {
            debugPrint(
              'WebView error: ${error.description} - Type: ${error.errorType}',
            );
          },
        ),
      )
      ..addJavaScriptChannel(
        'FlutterNavigation',
        onMessageReceived: (JavaScriptMessage message) {
          _handleNavigation(message.message);
        },
      )
      ..addJavaScriptChannel(
        'JSLog',
        onMessageReceived: (JavaScriptMessage message) {
          debugPrint('JS Log: ${message.message}');
        },
      );

    // 处理initialUrl，分离文件路径和查询参数
    _loadInitialPage();
  }

  void _loadInitialPage() {
    String assetPath = 'assets/baziphone.html';

    if (widget.initialUrl != null) {
      final url = widget.initialUrl!;
      if (url.contains('?')) {
        // 分离文件路径和查询参数
        assetPath = url.split('?')[0];
      } else {
        assetPath = url;
      }
    }

    _controller.loadFlutterAsset(assetPath);
  }

  void _injectTokenIfNeeded() {
    if (widget.initialUrl != null && widget.initialUrl!.contains('?')) {
      final url = widget.initialUrl!;
      final uri = Uri.parse('http://dummy.com/$url');
      final token = uri.queryParameters['token'];

      if (token != null && url.contains('password_recovery.html')) {
        // 注入token到页面的URL参数中
        _controller.runJavaScript("""
          if (typeof URLSearchParams !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.set('token', '$token');
            window.history.replaceState({}, '', url.toString());
            // 触发页面重新检查token
            if (typeof window.checkToken === 'function') {
              window.checkToken();
            }
            // 移除else分支中的reload调用，避免无限循环
          }
        """);
      }
    }
  }

  bool _isHandlingLogin = false;

  void _handleNavigation(String message) {
    debugPrint('Received navigation message: $message');
    switch (message) {
      case 'recharge':
        _controller.loadFlutterAsset('assets/recharge.html');
        break;
      case 'stripe_recharge':
        _controller.loadFlutterAsset('assets/stripe_recharge.html');
        break;
      case 'home':
        _controller.loadFlutterAsset('assets/baziphone.html');
        break;
      case 'password_recovery':
        _controller.loadFlutterAsset('assets/password_recovery.html');
        break;
      case 'login':
        // 防止重复处理login消息
        if (_isHandlingLogin) {
          print('Login navigation already in progress, ignoring');
          return;
        }
        _isHandlingLogin = true;
        print('Handling login navigation - loading main page');
        
        // 延迟加载主页面，避免循环刷新
        Future.delayed(Duration(milliseconds: 500), () {
          _controller.loadFlutterAsset('assets/baziphone.html').then((_) {
            // 重置标志
            Future.delayed(Duration(milliseconds: 1000), () {
              _isHandlingLogin = false;
            });
          });
        });
        break;
      default:
        _controller.loadFlutterAsset('assets/baziphone.html');
        break;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Stack(
          children: [
            WebViewWidget(controller: _controller),
            if (_isLoading)
              const Center(
                child: CircularProgressIndicator(
                  valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF3498DB)),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
