import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import '../services/bazi_api_service.dart';

class WuxingAnalysisScreen extends StatefulWidget {
  final Map<String, dynamic> baziData;
  
  const WuxingAnalysisScreen({
    super.key,
    required this.baziData,
  });

  @override
  State<WuxingAnalysisScreen> createState() => _WuxingAnalysisScreenState();
}

class _WuxingAnalysisScreenState extends State<WuxingAnalysisScreen> {
  bool _isLoading = true;
  String _analysisResult = '';
  Map<String, double> _wuxingData = {
    '木': 0.0,
    '火': 0.0,
    '土': 0.0,
    '金': 0.0,
    '水': 0.0,
  };

  @override
  void initState() {
    super.initState();
    _loadWuxingAnalysis();
  }

  Future<void> _loadWuxingAnalysis() async {
    try {
      setState(() {
        _isLoading = true;
      });

      final apiService = BaziApiService();
      final result = await apiService.getDetailedAnalysis(
        widget.baziData['id'] ?? 'default',
      );

      // 模拟五行数据（实际应该从API获取）
      _wuxingData = {
        '木': 3.5,
        '火': 2.8,
        '土': 4.2,
        '金': 1.9,
        '水': 2.6,
      };

      setState(() {
        _analysisResult = result;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _analysisResult = '获取五行分析失败，请稍后重试';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      appBar: AppBar(
        title: const Text('五行分析'),
        backgroundColor: const Color(0xFF6C5CE7),
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 五行雷达图卡片
            _buildRadarChartCard(),
            const SizedBox(height: 20),
            
            // 五行强弱分析卡片
            _buildWuxingStrengthCard(),
            const SizedBox(height: 20),
            
            // 五行平衡建议卡片
            _buildBalanceAdviceCard(),
            const SizedBox(height: 20),
            
            // 详细分析结果
            _buildDetailedAnalysisCard(),
          ],
        ),
      ),
    );
  }

  Widget _buildRadarChartCard() {
    return Card(
      elevation: 8,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          gradient: const LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Color(0xFF6C5CE7),
              Color(0xFF74B9FF),
            ],
          ),
        ),
        child: Padding(
          padding: const EdgeInsets.all(20.0),
          child: Column(
            children: [
              const Text(
                '五行强弱雷达图',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 20),
              SizedBox(
                height: 300,
                child: RadarChart(
                  RadarChartData(
                    radarTouchData: RadarTouchData(enabled: true),
                    dataSets: [
                      RadarDataSet(
                        fillColor: Colors.white.withOpacity(0.2),
                        borderColor: Colors.white,
                        entryRadius: 4,
                        dataEntries: _wuxingData.entries.map((entry) {
                          return RadarEntry(value: entry.value);
                        }).toList(),
                        borderWidth: 2,
                      ),
                    ],
                    radarBackgroundColor: Colors.transparent,
                    borderData: FlBorderData(show: false),
                    radarBorderData: const BorderSide(color: Colors.white54, width: 1),
                    titlePositionPercentageOffset: 0.2,
                    titleTextStyle: const TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                    ),
                    getTitle: (index, angle) {
                      final titles = ['木', '火', '土', '金', '水'];
                      return RadarChartTitle(
                        text: titles[index],
                        angle: angle,
                      );
                    },
                    tickCount: 5,
                    ticksTextStyle: const TextStyle(
                      color: Colors.white70,
                      fontSize: 10,
                    ),
                    tickBorderData: const BorderSide(color: Colors.white54, width: 1),
                    gridBorderData: const BorderSide(color: Colors.white54, width: 1),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildWuxingStrengthCard() {
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  Icons.analytics,
                  color: const Color(0xFF6C5CE7),
                  size: 24,
                ),
                const SizedBox(width: 8),
                const Text(
                  '五行强弱分析',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF2C3E50),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            ..._wuxingData.entries.map((entry) {
              return _buildWuxingBar(entry.key, entry.value, _getWuxingColor(entry.key));
            }),
          ],
        ),
      ),
    );
  }

  Widget _buildWuxingBar(String element, double value, Color color) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                element,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF2C3E50),
                ),
              ),
              Text(
                value.toStringAsFixed(1),
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  color: color,
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          LinearProgressIndicator(
            value: value / 5.0,
            backgroundColor: Colors.grey[200],
            valueColor: AlwaysStoppedAnimation<Color>(color),
            minHeight: 8,
          ),
        ],
      ),
    );
  }

  Widget _buildBalanceAdviceCard() {
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  Icons.balance,
                  color: const Color(0xFF00B894),
                  size: 24,
                ),
                const SizedBox(width: 8),
                const Text(
                  '五行平衡建议',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF2C3E50),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            _buildAdviceItem('补强建议', _getWeakElements(), const Color(0xFFE17055)),
            const SizedBox(height: 12),
            _buildAdviceItem('抑制建议', _getStrongElements(), const Color(0xFF0984E3)),
            const SizedBox(height: 12),
            _buildAdviceItem('调和方法', _getBalanceMethods(), const Color(0xFF00B894)),
          ],
        ),
      ),
    );
  }

  Widget _buildAdviceItem(String title, String content, Color color) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            content,
            style: const TextStyle(
              fontSize: 13,
              color: Color(0xFF2C3E50),
              height: 1.4,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailedAnalysisCard() {
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  Icons.description,
                  color: const Color(0xFF6C5CE7),
                  size: 24,
                ),
                const SizedBox(width: 8),
                const Text(
                  '详细分析',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF2C3E50),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            if (_isLoading)
              const Center(
                child: CircularProgressIndicator(),
              )
            else
              Text(
                _analysisResult.isEmpty ? '暂无详细分析内容' : _analysisResult,
                style: const TextStyle(
                  fontSize: 14,
                  color: Color(0xFF2C3E50),
                  height: 1.6,
                ),
              ),
          ],
        ),
      ),
    );
  }

  Color _getWuxingColor(String element) {
    switch (element) {
      case '木':
        return const Color(0xFF00B894);
      case '火':
        return const Color(0xFFE17055);
      case '土':
        return const Color(0xFFFDCB6E);
      case '金':
        return const Color(0xFF74B9FF);
      case '水':
        return const Color(0xFF0984E3);
      default:
        return Colors.grey;
    }
  }

  String _getWeakElements() {
    var sortedElements = _wuxingData.entries.toList()
      ..sort((a, b) => a.value.compareTo(b.value));
    var weakElements = sortedElements.take(2).map((e) => e.key).toList();
    return '${weakElements.join('、')}偏弱，建议通过颜色、方位、饮食等方式补强';
  }

  String _getStrongElements() {
    var sortedElements = _wuxingData.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));
    var strongElements = sortedElements.take(2).map((e) => e.key).toList();
    return '${strongElements.join('、')}过旺，需要适当抑制以保持平衡';
  }

  String _getBalanceMethods() {
    return '通过五行相生相克的原理，选择合适的颜色、方位、职业等来调和五行能量，达到最佳平衡状态';
  }
}