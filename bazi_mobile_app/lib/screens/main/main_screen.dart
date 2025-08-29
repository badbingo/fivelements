import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/auth_service.dart';
import '../bazi/bazi_input_screen.dart';
import '../qa/qa_screen.dart';
import '../liuyao_screen.dart';
import '../profile/profile_screen.dart';
import '../webview/webview_screen.dart';
import '../home/home_screen.dart';
import '../recharge_screen.dart';

/// 主页面 - 底部导航
class MainScreen extends StatefulWidget {
  const MainScreen({super.key});

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  int _currentIndex = 0;

  // 使用懒加载的方式创建页面，避免在初始化时就创建所有页面
  Widget _getPage(int index) {
    switch (index) {
      case 0:
        return const HomeScreen();
      case 1:
        return const BaziInputScreen();
      case 2:
        return const QAScreen();
      case 3:
        return const LiuyaoScreen();
      case 4:
        return const ProfileScreen();
      default:
        return const HomeScreen();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _getPage(_currentIndex),
      bottomNavigationBar: BottomNavigationBar(
        type: BottomNavigationBarType.fixed,
        currentIndex: _currentIndex,
        onTap: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
        selectedItemColor: Colors.orange.shade600,
        unselectedItemColor: Colors.grey.shade500,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home_outlined),
            activeIcon: Icon(Icons.home),
            label: '首页',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.calculate_outlined),
            activeIcon: Icon(Icons.calculate),
            label: '八字',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.help_outline),
            activeIcon: Icon(Icons.help),
            label: '解惑',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.auto_fix_high_outlined),
            activeIcon: Icon(Icons.auto_fix_high),
            label: '六爻',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person_outline),
            activeIcon: Icon(Icons.person),
            label: '我的',
          ),
        ],
      ),
    );
  }
}

/// 首页Tab
class HomeTab extends StatelessWidget {
  const HomeTab({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 顶部问候
              _buildGreeting(),

              const SizedBox(height: 24),

              // 快速功能卡片
              _buildQuickActions(context),

              const SizedBox(height: 24),

              // 今日运势
              _buildTodayFortune(),

              const SizedBox(height: 24),

              // 更多功能
              _buildMoreFeatures(context),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildGreeting() {
    return Consumer<AuthService>(
      builder: (context, authService, child) {
        final user = authService.currentUser;
        final hour = DateTime.now().hour;
        String greeting;

        if (hour < 12) {
          greeting = '早上好';
        } else if (hour < 18) {
          greeting = '下午好';
        } else {
          greeting = '晚上好';
        }

        return Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [Colors.orange.shade400, Colors.orange.shade600],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '$greeting，${user?.username ?? '用户'}',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '探索您的命理奥秘',
                      style: TextStyle(
                        color: Colors.white.withOpacity(0.9),
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(
                  Icons.auto_awesome,
                  color: Colors.white,
                  size: 24,
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildQuickActions(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          '快速功能',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
            fontWeight: FontWeight.bold,
            color: Colors.grey.shade800,
          ),
        ),

        const SizedBox(height: 16),

        Row(
          children: [
            Expanded(
              child: _buildActionCard(
                context,
                icon: Icons.calculate,
                title: '八字排盘',
                subtitle: '计算生辰八字',
                color: Colors.blue.shade400,
                onTap: () {
                  // 切换到八字输入页面
                  final mainState = context
                      .findAncestorStateOfType<_MainScreenState>();
                  mainState?.setState(() {
                    mainState._currentIndex = 1;
                  });
                },
              ),
            ),

            const SizedBox(width: 12),

            Expanded(
              child: _buildActionCard(
                context,
                icon: Icons.history,
                title: '历史记录',
                subtitle: '查看过往记录',
                color: Colors.green.shade400,
                onTap: () {
                  // 切换到历史页面
                  final mainState = context
                      .findAncestorStateOfType<_MainScreenState>();
                  mainState?.setState(() {
                    mainState._currentIndex = 2;
                  });
                },
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildActionCard(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String subtitle,
    required Color color,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: Colors.grey.shade200,
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(icon, color: color, size: 24),
            ),

            const SizedBox(height: 12),

            Text(
              title,
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
            ),

            const SizedBox(height: 4),

            Text(
              subtitle,
              style: TextStyle(color: Colors.grey.shade600, fontSize: 12),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTodayFortune() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.shade200,
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.wb_sunny, color: Colors.orange.shade400, size: 24),
              const SizedBox(width: 8),
              const Text(
                '今日运势',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
              ),
            ],
          ),

          const SizedBox(height: 16),

          Text(
            '今日宜：工作学习、人际交往\n今日忌：重大决策、投资理财',
            style: TextStyle(color: Colors.grey.shade700, height: 1.5),
          ),

          const SizedBox(height: 12),

          Row(
            children: [
              _buildFortuneItem('财运', '★★★☆☆', Colors.green),
              const SizedBox(width: 16),
              _buildFortuneItem('事业', '★★★★☆', Colors.blue),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildFortuneItem(String label, String stars, Color color) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            color: color,
            fontWeight: FontWeight.w500,
            fontSize: 12,
          ),
        ),
        const SizedBox(height: 2),
        Text(stars, style: TextStyle(color: color, fontSize: 14)),
      ],
    );
  }

  Widget _buildMoreFeatures(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          '更多功能',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
            fontWeight: FontWeight.bold,
            color: Colors.grey.shade800,
          ),
        ),

        const SizedBox(height: 16),

        _buildFeatureItem(
          context,
          icon: Icons.web,
          title: '详细分析',
          subtitle: '查看完整的八字分析报告',
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => const WebViewScreen(
                  title: '详细分析',
                  url: 'https://mybazi.net/baziphone.html',
                ),
              ),
            );
          },
        ),

        _buildFeatureItem(
          context,
          icon: Icons.help_outline,
          title: '问答咨询',
          subtitle: '专业命理师在线解答',
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => const WebViewScreen(
                  title: '问答咨询',
                  url: 'https://mybazi.net/baziphone.html#qa',
                ),
              ),
            );
          },
        ),

        _buildFeatureItem(
          context,
          icon: Icons.payment,
          title: '充值中心',
          subtitle: '购买更多服务',
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (context) => const RechargeScreen()),
            );
          },
        ),
      ],
    );
  }

  Widget _buildFeatureItem(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 0, vertical: 4),
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: Colors.grey.shade100,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(icon, color: Colors.grey.shade600, size: 24),
      ),
      title: Text(title, style: const TextStyle(fontWeight: FontWeight.w500)),
      subtitle: Text(
        subtitle,
        style: TextStyle(color: Colors.grey.shade600, fontSize: 12),
      ),
      trailing: Icon(
        Icons.arrow_forward_ios,
        color: Colors.grey.shade400,
        size: 16,
      ),
      onTap: onTap,
    );
  }
}
