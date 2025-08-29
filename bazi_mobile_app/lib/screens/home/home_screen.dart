import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/auth_service.dart';
import '../bazi/bazi_input_screen.dart';
import '../bazi_webview_screen.dart';
import '../../services/location_service.dart';
import '../../services/weather_service.dart';
import '../../services/lunar_js_service.dart';
import '../../services/element_energy_service.dart';
import '../../providers/app_provider.dart';
import '../../utils/lunar_calculator.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final LocationService _locationService = LocationService.instance;
  final WeatherService _weatherService = WeatherService.instance;
  final LunarJsService _lunarService = LunarJsService.instance;

  String _currentLocation = '获取中...';
  String _currentDistrict = '';
  String _temperature = '--°C';
  String _humidity = '--%';
  String _windSpeed = '--km/h';
  bool _isLoading = true;

  // 宜忌数据
  List<String> _suitableActivities = ['加载中...'];
  List<String> _avoidActivities = ['加载中...'];
  bool _tabooLoading = true;

  // 五行能量数据
  List<Map<String, dynamic>> _elementData = [];
  List<Map<String, dynamic>> _energyData = [];
  bool _isRealData = false;

  @override
  void initState() {
    super.initState();
    _loadLocationAndWeather();
    _loadDailyTaboos();
    _loadElementEnergy();
  }

  Future<void> _loadLocationAndWeather() async {
    try {
      // 获取位置
      final position = await _locationService.getCurrentPosition();
      if (position != null) {
        final address = await _locationService.getAddressFromCoordinates(
          position.latitude,
          position.longitude,
        );

        if (address != null) {
          setState(() {
            _currentLocation = address['city'] ?? '未知城市';
            _currentDistrict = address['district'] ?? '';
          });

          // 获取天气
          final weather = await _weatherService.getWeatherByCoordinates(
            position.latitude,
            position.longitude,
          );

          if (weather != null) {
            setState(() {
              _temperature = '${weather['temperature']}°C';
              _humidity = '${weather['humidity']}%';
              _windSpeed = '${weather['windSpeed']}km/h';
            });
          }
        }
      }
    } catch (e) {
      print('获取位置和天气失败: $e');
      setState(() {
        _currentLocation = '定位失败';
        _temperature = '--°C';
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      appBar: AppBar(
        title: const Text('mybazi.net'),
        backgroundColor: Colors.deepPurple,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 动态内容区域
              _buildDynamicContent(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildWelcomeSection(BuildContext context) {
    return Consumer<AuthService>(
      builder: (context, authService, child) {
        return Container(
          width: double.infinity,
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [Colors.blue.shade400, Colors.purple.shade400],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                authService.isLoggedIn
                    ? '欢迎回来，${authService.currentUser?.username ?? '用户'}'
                    : '欢迎使用mybazi.net',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                '探索您的命理奥秘，了解人生运势',
                style: TextStyle(color: Colors.white70, fontSize: 16),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildRecommendedSection(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          '推荐功能',
          style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 16),
        SizedBox(
          height: 120,
          child: ListView(
            scrollDirection: Axis.horizontal,
            children: [
              _buildRecommendedCard(
                context,
                title: '财运分析',
                description: '深度解析您的财富运势',
                color: Colors.green,
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => const BaziWebViewScreen(
                        initialUrl: 'assets/advanced/wealth.html',
                      ),
                    ),
                  );
                },
              ),
              _buildRecommendedCard(
                context,
                title: '事业运势',
                description: '了解您的职业发展方向',
                color: Colors.blue,
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => const BaziWebViewScreen(
                        initialUrl: 'assets/advanced/career.html',
                      ),
                    ),
                  );
                },
              ),
              _buildRecommendedCard(
                context,
                title: '健康运势',
                description: '关注您的身体健康状况',
                color: Colors.red,
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => const BaziWebViewScreen(
                        initialUrl: 'assets/advanced/health.html',
                      ),
                    ),
                  );
                },
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildRecommendedCard(
    BuildContext context, {
    required String title,
    required String description,
    required Color color,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 160,
        margin: const EdgeInsets.only(right: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withOpacity(0.3)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              description,
              style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRecentRecordsSection(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              '最近记录',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            TextButton(
              onPressed: () {
                // 跳转到历史记录页面
                DefaultTabController.of(context).animateTo(2);
              },
              child: const Text('查看全部'),
            ),
          ],
        ),
        const SizedBox(height: 16),
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.grey.shade50,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Column(
            children: [
              Icon(Icons.history, size: 48, color: Colors.grey.shade400),
              const SizedBox(height: 12),
              Text(
                '暂无记录',
                style: TextStyle(fontSize: 16, color: Colors.grey.shade600),
              ),
              const SizedBox(height: 8),
              Text(
                '开始您的第一次八字分析吧',
                style: TextStyle(fontSize: 14, color: Colors.grey.shade500),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildDynamicContent() {
    return Column(
      children: [
        // 万年历 - 最上方
        _buildCalendarWidget(),
        const SizedBox(height: 16),

        // 第二排：今日宜忌和今日运势
        Row(
          children: [
            Expanded(child: _buildDailyTaboos()),
            const SizedBox(width: 12),
            Expanded(child: _buildDailyFortune()),
          ],
        ),
        const SizedBox(height: 16),

        // 第三排：今日天气和当前位置
        Row(
          children: [
            Expanded(child: _buildWeatherWidget()),
            const SizedBox(width: 12),
            Expanded(child: _buildLocationWidget()),
          ],
        ),
        const SizedBox(height: 16),

        // 五行能量
        _buildEnergyRadar(),
        const SizedBox(height: 20),

        // 快速功能 - 最下方
        _buildQuickActions(),
      ],
    );
  }

  Widget _buildQuickActions() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        children: [
          Expanded(
            child: _buildQuickActionCard(
              title: '详批八字',
              subtitle: '精准命理分析',
              icon: Icons.auto_awesome,
              color: const Color(0xFF3498DB),
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => const BaziInputScreen(),
                  ),
                );
              },
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: _buildQuickActionCard(
              title: '六爻占卜',
              subtitle: '古法预测吉凶',
              icon: Icons.casino,
              color: const Color(0xFF9B59B6),
              onTap: () {
                // 导航到六爻占卜页面
                Navigator.pushNamed(context, '/liuyao');
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickActionCard({
    required String title,
    required String subtitle,
    required IconData icon,
    required Color color,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [color, color.withOpacity(0.8)],
          ),
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: color.withOpacity(0.3),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: Colors.white, size: 32),
            const SizedBox(height: 12),
            Text(
              title,
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              subtitle,
              style: TextStyle(
                fontSize: 12,
                color: Colors.white.withOpacity(0.9),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildWeatherWidget() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF74b9ff), Color(0xFF0984e3)],
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
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
              Icon(Icons.wb_sunny, color: Colors.white, size: 18),
              const SizedBox(width: 6),
              const Text(
                '今日天气',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
              const Spacer(),
              if (_isLoading)
                const SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _temperature,
                    style: const TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  Text(
                    '晴朗',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.white.withOpacity(0.9),
                    ),
                  ),
                ],
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    '湿度 $_humidity',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.white.withOpacity(0.9),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '风速 $_windSpeed',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.white.withOpacity(0.9),
                    ),
                  ),
                ],
              ),
            ],
          ),
          if (_currentLocation == '定位失败')
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: GestureDetector(
                onTap: _loadLocationAndWeather,
                child: const Text(
                  '点击重试',
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.white70,
                    decoration: TextDecoration.underline,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildLocationWidget() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF00b894), Color(0xFF00a085)],
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
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
              Icon(Icons.location_on, color: Colors.white, size: 18),
              const SizedBox(width: 6),
              const Text(
                '当前位置',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
              const Spacer(),
              if (_isLoading)
                const SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                _currentLocation,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                _currentDistrict,
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.white.withOpacity(0.9),
                ),
              ),

              if (_currentLocation == '定位失败')
                Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: GestureDetector(
                    onTap: _loadLocationAndWeather,
                    child: const Text(
                      '点击重试',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.white70,
                        decoration: TextDecoration.underline,
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildCalendarWidget() {
    final now = DateTime.now();
    final lunarDate = _getLunarDate(now);

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF667eea), Color(0xFF764ba2)],
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
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
              Icon(Icons.calendar_today, color: Colors.white, size: 20),
              const SizedBox(width: 8),
              const Text(
                '万年历',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
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
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    _getWeekday(now.weekday),
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.white.withOpacity(0.9),
                    ),
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
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '农历',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.white.withOpacity(0.8),
                    ),
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
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
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
              Icon(Icons.balance, color: const Color(0xFFE74C3C), size: 18),
              const SizedBox(width: 6),
              const Text(
                '今日宜忌',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF2C3E50),
                ),
              ),
              if (_tabooLoading) ...[
                const SizedBox(width: 8),
                const SizedBox(
                  width: 12,
                  height: 12,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    valueColor: AlwaysStoppedAnimation<Color>(
                      Color(0xFFE74C3C),
                    ),
                  ),
                ),
              ],
            ],
          ),
          const SizedBox(height: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 6,
                      vertical: 2,
                    ),
                    decoration: BoxDecoration(
                      color: const Color(0xFF27AE60).withOpacity(0.1),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: const Text(
                      '宜',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF27AE60),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      _tabooLoading
                          ? '加载中...'
                          : taboos['suitable']!.take(2).join(' '),
                      style: TextStyle(
                        fontSize: 12,
                        color: _tabooLoading
                            ? Colors.grey
                            : const Color(0xFF2C3E50),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 6,
                      vertical: 2,
                    ),
                    decoration: BoxDecoration(
                      color: const Color(0xFFE74C3C).withOpacity(0.1),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: const Text(
                      '忌',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFFE74C3C),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      _tabooLoading
                          ? '加载中...'
                          : taboos['avoid']!.take(2).join(' '),
                      style: TextStyle(
                        fontSize: 12,
                        color: _tabooLoading
                            ? Colors.grey
                            : const Color(0xFF2C3E50),
                      ),
                    ),
                  ),
                ],
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
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
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
              Icon(Icons.star, color: const Color(0xFFF39C12), size: 18),
              const SizedBox(width: 6),
              const Text(
                '今日运势',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF2C3E50),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            fortune.length > 50 ? '${fortune.substring(0, 50)}...' : fortune,
            style: const TextStyle(
              fontSize: 12,
              color: Color(0xFF2C3E50),
              height: 1.4,
            ),
            maxLines: 3,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  Widget _buildEnergyRadar() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
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
              Icon(Icons.radar, color: const Color(0xFF9B59B6), size: 18),
              const SizedBox(width: 6),
              const Text(
                '五行能量',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF2C3E50),
                ),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: _isRealData
                      ? const Color(0xFF27AE60).withOpacity(0.1)
                      : const Color(0xFFE74C3C).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  _isRealData ? '真实数据' : '模拟数据',
                  style: TextStyle(
                    fontSize: 10,
                    color: _isRealData
                        ? const Color(0xFF27AE60)
                        : const Color(0xFFE74C3C),
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          SizedBox(height: 120, child: _buildEnergyRadarChart()),
          const SizedBox(height: 16),
          const Text(
            '运势能量',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.bold,
              color: Color(0xFF2C3E50),
            ),
          ),
          const SizedBox(height: 8),
          _buildEnergyBars(),
        ],
      ),
    );
  }

  Widget _buildEnergyRadarChart() {
    // 如果数据还没有加载完成，显示加载状态
    if (_elementData == null) {
      return const SizedBox(
        height: 120,
        child: Center(child: CircularProgressIndicator()),
      );
    }

    return SizedBox(
      height: 120,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: List.generate(_elementData!.length, (index) {
          final element = _elementData![index];
          final name = element['name'] as String;
          final value = element['value'] as double;
          final color = Color(element['color'] as int);

          return Column(
            children: [
              Container(
                width: 40,
                height: 80,
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Stack(
                  alignment: Alignment.bottomCenter,
                  children: [
                    Container(
                      width: 40,
                      height: 80 * value,
                      decoration: BoxDecoration(
                        color: color,
                        borderRadius: BorderRadius.circular(20),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 8),
              Text(
                name,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: color,
                ),
              ),
            ],
          );
        }),
      ),
    );
  }

  Widget _buildEnergyBars() {
    // 如果数据还没有加载完成，显示加载状态
    if (_energyData == null) {
      return const SizedBox(
        height: 100,
        child: Center(child: CircularProgressIndicator()),
      );
    }

    return Column(
      children: _energyData!.map<Widget>((energy) {
        final name = energy['name'] as String;
        final value = energy['value'] as double;
        final color = Color(energy['color'] as int);

        return Padding(
          padding: const EdgeInsets.symmetric(vertical: 4),
          child: Row(
            children: [
              SizedBox(
                width: 40,
                child: Text(
                  name,
                  style: const TextStyle(
                    fontSize: 12,
                    color: Color(0xFF2C3E50),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: LinearProgressIndicator(
                  value: value,
                  backgroundColor: Colors.grey.withOpacity(0.2),
                  valueColor: AlwaysStoppedAnimation<Color>(color),
                  minHeight: 6,
                ),
              ),
              const SizedBox(width: 8),
              Text(
                '${(value * 100).toInt()}%',
                style: const TextStyle(
                  fontSize: 12,
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

  String _getWeekday(int weekday) {
    const weekdays = ['一', '二', '三', '四', '五', '六', '日'];
    return '星期${weekdays[weekday - 1]}';
  }

  String _getLunarDate(DateTime date) {
    // 使用LunarCalculator进行精确的农历转换
    try {
      print('🗓️ 正在计算农历日期，公历日期: ${date.year}-${date.month}-${date.day}');
      Map<String, dynamic> lunarResult =
          LunarCalculator.calculateLunarFromSolar(date);
      print('🗓️ 农历计算结果: $lunarResult');
      String result = lunarResult['fullDate'] ?? '农历';
      print('🗓️ 最终显示的农历日期: $result');
      return result;
    } catch (e) {
      print('❌ 农历计算失败: $e');
      // 如果计算失败，返回默认值
      return '农历';
    }
  }

  /// 加载今日宜忌数据
  Future<void> _loadDailyTaboos() async {
    try {
      final tabooData = await _lunarService.getDailyTaboos();
      if (mounted) {
        setState(() {
          _suitableActivities = List<String>.from(
            tabooData['suitable'] ?? ['祈福', '出行', '会友'],
          );
          _avoidActivities = List<String>.from(
            tabooData['avoid'] ?? ['搬家', '开业', '签约'],
          );
          _tabooLoading = false;
        });
      }
    } catch (e) {
      print('加载宜忌数据失败: $e');
      if (mounted) {
        setState(() {
          _suitableActivities = ['祈福', '出行', '会友', '学习', '工作'];
          _avoidActivities = ['搬家', '开业', '签约', '投资', '手术'];
          _tabooLoading = false;
        });
      }
    }
  }

  /// 加载五行能量数据
  Future<void> _loadElementEnergy() async {
    try {
      final appProvider = Provider.of<AppProvider>(context, listen: false);

      final energyResult = ElementEnergyService.getTodayElementEnergy(
        appProvider.personalBazi,
      );

      if (mounted) {
        setState(() {
          _elementData = energyResult['elements'];
          _energyData = energyResult['energies'];
          _isRealData = energyResult['isReal'];
        });
      }
    } catch (e) {
      print('加载五行能量数据失败: $e');
      // 如果加载失败，使用模拟数据
      if (mounted) {
        final mockResult = ElementEnergyService.getTodayElementEnergy(null);
        setState(() {
          _elementData = mockResult['elements'];
          _energyData = mockResult['energies'];
          _isRealData = false;
        });
      }
    }
  }

  /// 获取宜忌数据（同步方法，用于UI构建）
  Map<String, List<String>> _getDailyTaboos() {
    return {'suitable': _suitableActivities, 'avoid': _avoidActivities};
  }

  String _getDailyFortune() {
    // 根据日期生成运势，实际应用中应该使用专业的运势算法
    final fortunes = [
      '今日运势平稳，适合处理日常事务，与人交往时保持谦逊的态度会带来好运。',
      '今日财运不错，有机会获得意外收入，但需要注意理财规划，避免冲动消费。',
      '今日工作运势良好，创意思维活跃，是展示才华的好时机，把握机会。',
      '今日感情运势温和，单身者有机会遇到心仪对象，已婚者注意与伴侣的沟通。',
      '今日健康运势需要关注，注意休息和饮食，适当运动有助于提升整体状态。',
    ];

    final now = DateTime.now();
    final index = now.day % fortunes.length;
    return fortunes[index];
  }
}
