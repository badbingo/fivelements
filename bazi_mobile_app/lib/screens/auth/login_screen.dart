import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/auth_service.dart';
import 'register_screen.dart';
import 'forgot_password_screen.dart';
import '../main/main_screen.dart';

/// 登录页面
class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();

  bool _obscurePassword = true;
  bool _rememberMe = false;

  @override
  void initState() {
    super.initState();
    // 使用addPostFrameCallback确保Widget树构建完成后再加载保存的凭据
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadSavedCredentials();
      // 移除自动登录检查，要求用户明确进行登录操作
    });
  }

  /// 加载保存的用户凭据
  Future<void> _loadSavedCredentials() async {
    try {
      final authService = Provider.of<AuthService>(context, listen: false);
      final isRememberMeEnabled = authService.isRememberMeEnabled();
      final savedUsername = authService.getSavedUsername();
      final savedPassword = authService.getSavedPassword();

      if (isRememberMeEnabled &&
          savedUsername != null &&
          savedPassword != null) {
        setState(() {
          _usernameController.text = savedUsername;
          _passwordController.text = savedPassword;
          _rememberMe = true;
        });
        print('✅ 已自动填充保存的登录凭据');
      }
    } catch (e) {
      print('❌ 加载保存凭据时出错: $e');
    }
  }

  @override
  void dispose() {
    _usernameController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 60),

              // Logo和标题
              _buildHeader(),

              const SizedBox(height: 48),

              // 登录表单
              _buildLoginForm(),

              const SizedBox(height: 16),

              const SizedBox(height: 24),

              // Apple登录按钮
              _buildAppleSignInButton(),

              const SizedBox(height: 24),

              // 注册链接
              _buildRegisterLink(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Column(
      children: [
        // Logo
        Container(
          width: 100,
          height: 100,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(50),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.1),
                blurRadius: 20,
                offset: const Offset(0, 10),
              ),
            ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(50),
            child: Image.asset(
              'assets/zodiac/horseicon.png',
              width: 100,
              height: 100,
              fit: BoxFit.cover,
              errorBuilder:
                  (
                    BuildContext context,
                    Object error,
                    StackTrace? stackTrace,
                  ) => Container(
                    width: 100,
                    height: 100,
                    decoration: BoxDecoration(
                      color: Colors.grey[300],
                      borderRadius: BorderRadius.circular(50),
                    ),
                    child: const Icon(
                      Icons.image,
                      color: Colors.grey,
                      size: 50,
                    ),
                  ),
            ),
          ),
        ),

        const SizedBox(height: 24),

        // 标题
        Text(
          '欢迎回来',
          style: Theme.of(context).textTheme.headlineMedium?.copyWith(
            fontWeight: FontWeight.bold,
            color: Colors.grey.shade800,
          ),
        ),

        const SizedBox(height: 8),

        Text(
          '登录您的八字账户',
          style: Theme.of(
            context,
          ).textTheme.bodyLarge?.copyWith(color: Colors.grey.shade600),
        ),
      ],
    );
  }

  Widget _buildLoginForm() {
    return Consumer<AuthService>(
      builder: (context, authService, child) {
        return Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // 用户名输入框
              TextFormField(
                controller: _usernameController,
                decoration: InputDecoration(
                  labelText: '用户名或邮箱',
                  prefixIcon: const Icon(Icons.person_outline),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide(color: Colors.grey.shade300),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide(color: Colors.orange.shade400),
                  ),
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return '请输入用户名或邮箱';
                  }
                  return null;
                },
              ),

              const SizedBox(height: 16),

              // 密码输入框
              TextFormField(
                controller: _passwordController,
                obscureText: _obscurePassword,
                decoration: InputDecoration(
                  labelText: '密码',
                  prefixIcon: const Icon(Icons.lock_outline),
                  suffixIcon: IconButton(
                    icon: Icon(
                      _obscurePassword
                          ? Icons.visibility_off
                          : Icons.visibility,
                    ),
                    onPressed: () {
                      setState(() {
                        _obscurePassword = !_obscurePassword;
                      });
                    },
                  ),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide(color: Colors.grey.shade300),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide(color: Colors.orange.shade400),
                  ),
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return '请输入密码';
                  }
                  if (value.length < 6) {
                    return '密码至少6位';
                  }
                  return null;
                },
              ),

              const SizedBox(height: 16),

              // 记住我和忘记密码
              Row(
                children: [
                  Checkbox(
                    value: _rememberMe,
                    onChanged: (value) {
                      setState(() {
                        _rememberMe = value ?? false;
                      });
                    },
                    activeColor: Colors.orange.shade400,
                  ),
                  const Text('记住我'),

                  const Spacer(),

                  TextButton(
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => const ForgotPasswordScreen(),
                        ),
                      );
                    },
                    child: Text(
                      '忘记密码？',
                      style: TextStyle(color: Colors.orange.shade600),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 24),

              // 登录按钮
              ElevatedButton(
                onPressed: authService.isLoading ? null : _handleLogin,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.orange.shade400,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  elevation: 2,
                ),
                child: authService.isLoading
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(
                            Colors.white,
                          ),
                        ),
                      )
                    : const Text(
                        '登录',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildAppleSignInButton() {
    return Consumer<AuthService>(
      builder: (context, authService, child) {
        return OutlinedButton.icon(
          onPressed: authService.isLoading ? null : _handleAppleSignIn,
          icon: const Icon(Icons.apple, color: Colors.black),
          label: const Text(
            '使用Apple登录',
            style: TextStyle(color: Colors.black, fontWeight: FontWeight.w500),
          ),
          style: OutlinedButton.styleFrom(
            padding: const EdgeInsets.symmetric(vertical: 16),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            side: BorderSide(color: Colors.grey.shade300),
          ),
        );
      },
    );
  }

  Widget _buildRegisterLink() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Text('还没有账户？', style: TextStyle(color: Colors.grey.shade600)),
        TextButton(
          onPressed: () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (context) => const RegisterScreen()),
            );
          },
          child: Text(
            '立即注册',
            style: TextStyle(
              color: Colors.orange.shade600,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ],
    );
  }

  Future<void> _handleLogin() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    final authService = Provider.of<AuthService>(context, listen: false);

    final result = await authService.login(
      _usernameController.text.trim(),
      _passwordController.text,
      rememberMe: _rememberMe,
    );

    if (!mounted) return;

    if (result.success) {
      // 登录成功后直接跳转，用户信息同步由ProxyProvider自动处理
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (context) => const MainScreen()),
      );
    } else {
      // 显示错误信息
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(result.message ?? '登录失败'),
          backgroundColor: Colors.red.shade400,
        ),
      );
    }
  }

  Future<void> _handleAppleSignIn() async {
    final authService = Provider.of<AuthService>(context, listen: false);

    debugPrint('🍎 开始Apple登录流程');
    final result = await authService.signInWithApple();

    if (!mounted) return;

    if (result.success) {
      // 登录成功，等待状态同步后跳转
      debugPrint('🍎 ✅ 登录成功，等待状态同步...');

      // 等待AuthService状态更新
      await Future.delayed(const Duration(milliseconds: 800));

      if (!mounted) return;

      // 再次确认登录状态
      if (authService.isLoggedIn) {
        debugPrint('🍎 ✅ 状态确认成功，跳转到主页面');
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (context) => const MainScreen()),
        );
      } else {
        debugPrint('🍎 ⚠️ 登录状态未同步，显示提示');
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('登录状态同步中，请稍候...'),
            backgroundColor: Colors.orange,
          ),
        );
      }
    } else {
      // 只有当有错误消息时才显示错误信息（用户取消操作时message为null）
      if (result.message != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result.message!),
            backgroundColor: Colors.red.shade400,
          ),
        );
      }
    }
  }
}
