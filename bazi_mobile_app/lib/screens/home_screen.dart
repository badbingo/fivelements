import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import '../services/auth_service.dart';
import '../utils/lunar_calculator.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  @override
  Widget build(BuildContext context) {
    return Consumer<AppProvider>(
      builder: (context, provider, child) {
        return Scaffold(
          backgroundColor: const Color(0xFFF8F9FA),
          appBar: AppBar(
            title: const Text('五行八字'),
            backgroundColor: Colors.deepPurple,
            foregroundColor: Colors.white,
            actions: [
              // 用户信息和余额（仅登录用户显示）
              if (provider.isLoggedIn)
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 8,
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.account_balance_wallet, color: Colors.white),
                      const SizedBox(width: 8),
                      Text(
                        '余额: \$${provider.balance.toStringAsFixed(2)}',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                ),

              PopupMenuButton<String>(
                icon: const Icon(Icons.more_vert, color: Colors.white),
                onSelected: (value) {
                  switch (value) {
                    case 'recharge':
                      Navigator.pushNamed(context, '/recharge');
                      break;
                    case 'records':
                      Navigator.pushNamed(context, '/records');
                      break;

                    case 'logout':
                      _showLogoutDialog();
                      break;
                  }
                },
                itemBuilder: (context) {
                  List<PopupMenuEntry<String>> items = [];

                  if (provider.isLoggedIn) {
                    items.addAll([
                      const PopupMenuItem(
                        value: 'recharge',
                        child: Row(
                          children: [
                            Icon(Icons.payment),
                            SizedBox(width: 8),
                            Text('充值'),
                          ],
                        ),
                      ),
                      const PopupMenuItem(
                        value: 'records',
                        child: Row(
                          children: [
                            Icon(Icons.history),
                            SizedBox(width: 8),
                            Text('测算记录'),
                          ],
                        ),
                      ),
                      const PopupMenuItem(
                        value: 'logout',
                        child: Row(
                          children: [
                            Icon(Icons.logout),
                            SizedBox(width: 8),
                            Text('退出登录'),
                          ],
                        ),
                      ),
                    ]);
                  }

                  return items;
                },
              ),
            ],
          ),
          body: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // 欢迎信息
                _buildWelcomeCard(provider),
                const SizedBox(height: 20),

                // 快速测算
                _buildQuickCalculationCard(),
                const SizedBox(height: 20),

                // 动态内容
                _buildDynamicContent(),
                const SizedBox(height: 20),

                // 功能菜单
                _buildFunctionMenu(),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildWelcomeCard(AppProvider provider) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF3498DB), Color(0xFF2980B9)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 10,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.waving_hand, color: Colors.white, size: 24),
              const SizedBox(width: 8),
              Text(
                '欢迎回来，${provider.user?.username ?? '用户'}',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          const Text(
            '专业八字分析，洞察人生运势',
            style: TextStyle(color: Colors.white70, fontSize: 16),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickCalculationCard() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF667eea), Color(0xFF764ba2)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            '快速功能',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _buildQuickButton('八字排盘', Icons.calendar_today, () {
                  Navigator.pushNamed(context, '/bazi-input');
                }),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildQuickButton('六爻占卜', Icons.casino, () {
                  Navigator.pushNamed(context, '/liuyao');
                }),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildQuickButton(String title, IconData icon, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.2),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.white.withOpacity(0.3), width: 1),
        ),
        child: Column(
          children: [
            Icon(icon, color: Colors.white, size: 24),
            const SizedBox(height: 8),
            Text(
              title,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 14,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDynamicContent() {
    return Column(
      children: [
        _buildCalendarWidget(),
        const SizedBox(height: 16),
        _buildDailyTaboos(),
        const SizedBox(height: 16),
        _buildDailyFortune(),
        const SizedBox(height: 16),
        _buildEnergyRadar(),
      ],
    );
  }

  Widget _buildCalendarWidget() {
    final now = DateTime.now();
    final lunarDate = _getLunarDate(now);

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.calendar_today,
                color: const Color(0xFF3498DB),
                size: 24,
              ),
              const SizedBox(width: 8),
              const Text(
                '万年历',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF2C3E50),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '${now.year}年${now.month}月${now.day}日',
                    style: const TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF2C3E50),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    _getWeekday(now.weekday),
                    style: const TextStyle(fontSize: 16, color: Colors.grey),
                  ),
                ],
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    lunarDate,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF8E44AD),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '农历',
                    style: const TextStyle(fontSize: 14, color: Colors.grey),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildDailyTaboos() {
    final taboos = _getDailyTaboos();

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.balance, color: const Color(0xFFE74C3C), size: 24),
              const SizedBox(width: 8),
              const Text(
                '今日宜忌',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF2C3E50),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: const Color(0xFF27AE60).withOpacity(0.1),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: const Text(
                        '宜',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF27AE60),
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      taboos['suitable']!,
                      style: const TextStyle(
                        fontSize: 14,
                        color: Color(0xFF2C3E50),
                        height: 1.4,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: const Color(0xFFE74C3C).withOpacity(0.1),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: const Text(
                        '忌',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFFE74C3C),
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      taboos['avoid']!,
                      style: const TextStyle(
                        fontSize: 14,
                        color: Color(0xFF2C3E50),
                        height: 1.4,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildDailyFortune() {
    final fortune = _getDailyFortune();

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.star, color: const Color(0xFFF39C12), size: 24),
              const SizedBox(width: 8),
              const Text(
                '今日运势',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF2C3E50),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Color(0xFFF39C12), Color(0xFFE67E22)],
                  ),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  fortune['level']!,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  fortune['description']!,
                  style: const TextStyle(
                    fontSize: 14,
                    color: Color(0xFF2C3E50),
                    height: 1.4,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildEnergyRadar() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.radar, color: const Color(0xFF9B59B6), size: 24),
              const SizedBox(width: 8),
              const Text(
                '今日能量雷达',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF2C3E50),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _buildEnergyRadarChart(),
        ],
      ),
    );
  }

  Widget _buildEnergyRadarChart() {
    final energies = [
      {'name': '财运', 'value': 0.8, 'color': Color(0xFFF39C12)},
      {'name': '事业', 'value': 0.6, 'color': Color(0xFF3498DB)},
      {'name': '感情', 'value': 0.7, 'color': Color(0xFFE74C3C)},
      {'name': '健康', 'value': 0.9, 'color': Color(0xFF27AE60)},
      {'name': '学业', 'value': 0.5, 'color': Color(0xFF9B59B6)},
    ];

    return Column(
      children: energies.map((energy) {
        return Padding(
          padding: const EdgeInsets.symmetric(vertical: 4),
          child: Row(
            children: [
              SizedBox(
                width: 40,
                child: Text(
                  energy['name'] as String,
                  style: const TextStyle(
                    fontSize: 14,
                    color: Color(0xFF2C3E50),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: LinearProgressIndicator(
                  value: energy['value'] as double,
                  backgroundColor: Colors.grey.withOpacity(0.2),
                  valueColor: AlwaysStoppedAnimation<Color>(
                    energy['color'] as Color,
                  ),
                  minHeight: 8,
                ),
              ),
              const SizedBox(width: 12),
              Text(
                '${((energy['value'] as double) * 100).toInt()}%',
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF2C3E50),
                ),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }

  // 辅助方法
  String _getWeekday(int weekday) {
    const weekdays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    return weekdays[weekday - 1];
  }

  String _getLunarDate(DateTime date) {
    // 使用LunarCalculator进行精确的农历转换
    try {
      Map<String, dynamic> lunarResult =
          LunarCalculator.calculateLunarFromSolar(date);
      return lunarResult['fullDate'] ?? '农历';
    } catch (e) {
      // 如果计算失败，返回默认值
      return '农历';
    }
  }

  Map<String, String> _getDailyTaboos() {
    // 根据日期计算宜忌，这里使用简化版本
    final now = DateTime.now();
    final dayOfYear = now.difference(DateTime(now.year, 1, 1)).inDays;

    final suitableList = [
      '祭祀、祈福、求嗣',
      '开市、交易、立券',
      '出行、移徙、入宅',
      '嫁娶、纳采、问名',
      '修造、动土、竖柱',
    ];

    final avoidList = [
      '安葬、破土、启攒',
      '开仓、出货财物',
      '栽种、伐木、作梁',
      '纳畜、牧养、安床',
      '开池、掘井、作厕',
    ];

    return {
      'suitable': suitableList[dayOfYear % suitableList.length],
      'avoid': avoidList[dayOfYear % avoidList.length],
    };
  }

  Map<String, String> _getDailyFortune() {
    final now = DateTime.now();
    final dayOfYear = now.difference(DateTime(now.year, 1, 1)).inDays;

    final fortunes = [
      {'level': '大吉', 'description': '今日运势极佳，诸事顺利，宜把握机会。'},
      {'level': '中吉', 'description': '今日运势良好，适合处理重要事务。'},
      {'level': '小吉', 'description': '今日运势平稳，宜谨慎行事。'},
      {'level': '平', 'description': '今日运势一般，保持平常心即可。'},
      {'level': '小凶', 'description': '今日需谨慎，避免冲动决定。'},
    ];

    return fortunes[dayOfYear % fortunes.length];
  }

  Widget _buildFunctionMenu() {
    final functions = [
      {
        'title': '八字问答',
        'subtitle': '智能问答系统',
        'icon': Icons.chat,
        'route': '/qa',
        'color': const Color(0xFFE74C3C),
      },
      {
        'title': '专项分析',
        'subtitle': '详细命理解读',
        'icon': Icons.analytics,
        'route': '/analysis',
        'color': const Color(0xFF2ECC71),
      },
      {
        'title': '详批八字',
        'subtitle': '专业详批分析',
        'icon': Icons.auto_awesome,
        'route': '/bazi-webview',
        'color': const Color(0xFFE67E22),
      },
      {
        'title': '账户充值',
        'subtitle': '余额充值管理',
        'icon': Icons.payment,
        'route': '/recharge',
        'color': const Color(0xFF3498DB),
      },
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          '功能菜单',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: Color(0xFF2C3E50),
          ),
        ),
        const SizedBox(height: 12),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            childAspectRatio: 1.2,
          ),
          itemCount: functions.length,
          itemBuilder: (context, index) {
            final function = functions[index];
            return GestureDetector(
              onTap: () {
                Navigator.pushNamed(context, function['route'] as String);
              },
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.05),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      function['icon'] as IconData,
                      size: 32,
                      color: function['color'] as Color,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      function['title'] as String,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF2C3E50),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      function['subtitle'] as String,
                      style: const TextStyle(fontSize: 12, color: Colors.grey),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ],
    );
  }

  Widget _buildRecentRecords(AppProvider provider) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              '最近测算',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Color(0xFF2C3E50),
              ),
            ),
            TextButton(
              onPressed: () {
                Navigator.pushNamed(context, '/recent-records');
              },
              child: const Text('查看全部'),
            ),
          ],
        ),
        const SizedBox(height: 12),
        provider.recentRecords.isEmpty
            ? Container(
                width: double.infinity,
                padding: const EdgeInsets.all(32),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Column(
                  children: [
                    Icon(Icons.history, size: 48, color: Colors.grey),
                    SizedBox(height: 16),
                    Text(
                      '暂无测算记录',
                      style: TextStyle(fontSize: 16, color: Colors.grey),
                    ),
                  ],
                ),
              )
            : ListView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: provider.recentRecords.take(3).length,
                itemBuilder: (context, index) {
                  final record = provider.recentRecords[index];
                  return Container(
                    margin: const EdgeInsets.only(bottom: 8),
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.05),
                          blurRadius: 5,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 40,
                          height: 40,
                          decoration: BoxDecoration(
                            color: const Color(0xFF3498DB).withOpacity(0.1),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: const Icon(
                            Icons.person,
                            color: Color(0xFF3498DB),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                record.name,
                                style: const TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              Text(
                                '${record.birthDate} ${record.birthTime}',
                                style: const TextStyle(
                                  fontSize: 14,
                                  color: Colors.grey,
                                ),
                              ),
                            ],
                          ),
                        ),
                        IconButton(
                          onPressed: () {
                            // 重新测算
                            provider.loadRecord(record);
                            Navigator.pushNamed(context, '/bazi-input');
                          },
                          icon: const Icon(
                            Icons.refresh,
                            color: Color(0xFF3498DB),
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
      ],
    );
  }

  void _showLogoutDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('确认退出'),
        content: const Text('确定要退出登录吗？'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('取消'),
          ),
          TextButton(
            onPressed: () async {
              // 先调用AppProvider的logout，再调用AuthService的logout
              // 这样可以确保数据清理的顺序正确
              final appProvider = Provider.of<AppProvider>(
                context,
                listen: false,
              );
              final authService = Provider.of<AuthService>(
                context,
                listen: false,
              );

              await appProvider.logout();
              await authService.logout();

              Navigator.pop(context);
              Navigator.pushReplacementNamed(context, '/login');
            },
            child: const Text('确定'),
          ),
        ],
      ),
    );
  }
}
