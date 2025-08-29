import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:fl_chart/fl_chart.dart';
import '../providers/app_provider.dart';
import '../models/bazi_model.dart';

class WealthAnalysisScreen extends StatefulWidget {
  const WealthAnalysisScreen({super.key});

  @override
  State<WealthAnalysisScreen> createState() => _WealthAnalysisScreenState();
}

class _WealthAnalysisScreenState extends State<WealthAnalysisScreen> {
  bool _isPaid = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _calculateWealth();
    });
  }

  Future<void> _calculateWealth() async {
    final provider = Provider.of<AppProvider>(context, listen: false);
    await provider.calculateWealth();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('财富分析'),
        backgroundColor: Colors.blue[700],
        foregroundColor: Colors.white,
      ),
      body: Consumer<AppProvider>(
        builder: (context, provider, child) {
          if (provider.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          if (provider.errorMessage.isNotEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    provider.errorMessage,
                    style: const TextStyle(color: Colors.red),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: _calculateWealth,
                    child: const Text('重试'),
                  ),
                ],
              ),
            );
          }

          if (provider.currentAnalysis == null) {
            return const Center(child: Text('暂无分析结果'));
          }

          return SingleChildScrollView(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildBaziCard(provider.currentBazi!),
                const SizedBox(height: 16),
                _buildAnalysisCard(provider.currentAnalysis!),
                const SizedBox(height: 16),
                _buildChartCard(provider.currentAnalysis!),
                const SizedBox(height: 16),
                _buildDetailedAnalysis(provider),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildBaziCard(BaziModel bazi) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              '八字信息',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            Table(
              border: TableBorder.all(color: Colors.grey[300]!),
              children: [
                const TableRow(
                  children: [
                    Padding(
                      padding: EdgeInsets.all(8.0),
                      child: Text(
                        '',
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                    ),
                    Padding(
                      padding: EdgeInsets.all(8.0),
                      child: Text(
                        '年',
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                    ),
                    Padding(
                      padding: EdgeInsets.all(8.0),
                      child: Text(
                        '月',
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                    ),
                    Padding(
                      padding: EdgeInsets.all(8.0),
                      child: Text(
                        '日',
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                    ),
                    Padding(
                      padding: EdgeInsets.all(8.0),
                      child: Text(
                        '时',
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                    ),
                  ],
                ),
                TableRow(
                  children: [
                    const Padding(
                      padding: EdgeInsets.all(8.0),
                      child: Text(
                        '天干',
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.all(8.0),
                      child: Text(bazi.yearGan),
                    ),
                    Padding(
                      padding: const EdgeInsets.all(8.0),
                      child: Text(bazi.monthGan),
                    ),
                    Padding(
                      padding: const EdgeInsets.all(8.0),
                      child: Text(bazi.dayGan),
                    ),
                    Padding(
                      padding: const EdgeInsets.all(8.0),
                      child: Text(bazi.hourGan),
                    ),
                  ],
                ),
                TableRow(
                  children: [
                    const Padding(
                      padding: EdgeInsets.all(8.0),
                      child: Text(
                        '地支',
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.all(8.0),
                      child: Text(bazi.yearZhi),
                    ),
                    Padding(
                      padding: const EdgeInsets.all(8.0),
                      child: Text(bazi.monthZhi),
                    ),
                    Padding(
                      padding: const EdgeInsets.all(8.0),
                      child: Text(bazi.dayZhi),
                    ),
                    Padding(
                      padding: const EdgeInsets.all(8.0),
                      child: Text(bazi.hourZhi),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text('性别: ${bazi.gender}'),
            Text('出生日期: ${bazi.solarDate}'),
          ],
        ),
      ),
    );
  }

  Widget _buildAnalysisCard(WealthAnalysis analysis) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              '财富分析结果',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '财富等级: ${analysis.level}',
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        '总分: ${analysis.totalScore}',
                        style: const TextStyle(fontSize: 14),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: _getLevelColor(analysis.level),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    analysis.level,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              analysis.description,
              style: const TextStyle(fontSize: 14, color: Colors.grey),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildChartCard(WealthAnalysis analysis) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              '财富构成分析',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            SizedBox(
              height: 200,
              child: BarChart(
                BarChartData(
                  alignment: BarChartAlignment.spaceAround,
                  maxY: 100,
                  barTouchData: BarTouchData(enabled: false),
                  titlesData: FlTitlesData(
                    show: true,
                    bottomTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        getTitlesWidget: (double value, TitleMeta meta) {
                          const style = TextStyle(fontSize: 12);
                          Widget text;
                          switch (value.toInt()) {
                            case 0:
                              text = const Text('财星质量', style: style);
                              break;
                            case 1:
                              text = const Text('财星流通', style: style);
                              break;
                            case 2:
                              text = const Text('十神组合', style: style);
                              break;
                            default:
                              text = const Text('', style: style);
                              break;
                          }
                          return text;
                        },
                      ),
                    ),
                    leftTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        reservedSize: 40,
                        getTitlesWidget: (double value, TitleMeta meta) {
                          return Text(
                            value.toInt().toString(),
                            style: const TextStyle(fontSize: 12),
                          );
                        },
                      ),
                    ),
                    topTitles: const AxisTitles(
                      sideTitles: SideTitles(showTitles: false),
                    ),
                    rightTitles: const AxisTitles(
                      sideTitles: SideTitles(showTitles: false),
                    ),
                  ),
                  borderData: FlBorderData(show: false),
                  barGroups: [
                    BarChartGroupData(
                      x: 0,
                      barRods: [
                        BarChartRodData(
                          toY: analysis.wealthStarQuality,
                          color: Colors.blue,
                          width: 20,
                        ),
                      ],
                    ),
                    BarChartGroupData(
                      x: 1,
                      barRods: [
                        BarChartRodData(
                          toY: analysis.wealthStarFlow,
                          color: Colors.green,
                          width: 20,
                        ),
                      ],
                    ),
                    BarChartGroupData(
                      x: 2,
                      barRods: [
                        BarChartRodData(
                          toY: analysis.tenGodsCombo,
                          color: Colors.orange,
                          width: 20,
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailedAnalysis(AppProvider provider) {
    if (!_isPaid) {
      return Card(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                '详细分析',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.grey[100],
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Column(
                  children: [
                    const Icon(Icons.lock, size: 48, color: Colors.grey),
                    const SizedBox(height: 8),
                    const Text(
                      '详细分析需要付费解锁',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      '包含：运势走向、财运时机、投资建议等',
                      style: TextStyle(color: Colors.grey),
                    ),
                    const SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: () => _showPaymentDialog(provider),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.orange,
                        foregroundColor: Colors.white,
                      ),
                      child: const Text('解锁详细分析 (¥9.9)'),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      );
    }

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              '详细分析',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            ...provider.currentAnalysis!.details.map(
              (detail) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Text('• $detail'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Color _getLevelColor(String level) {
    switch (level) {
      case '富贵':
        return Colors.red;
      case '小康':
        return Colors.orange;
      case '温饱':
        return Colors.blue;
      case '清贫':
        return Colors.grey;
      default:
        return Colors.grey;
    }
  }

  void _showPaymentDialog(AppProvider provider) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('支付确认'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('解锁详细财富分析'),
              const SizedBox(height: 8),
              const Text('费用: ¥9.9'),
              const SizedBox(height: 8),
              if (provider.user != null)
                Text('当前余额: \$${provider.user!.balance.toStringAsFixed(2)}'),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('取消'),
            ),
            ElevatedButton(
              onPressed: () async {
                Navigator.of(context).pop();
                final success = await provider.processPayment(9.9, '详细财富分析');
                if (success) {
                  setState(() {
                    _isPaid = true;
                  });
                  ScaffoldMessenger.of(
                    context,
                  ).showSnackBar(const SnackBar(content: Text('支付成功，已解锁详细分析')));
                } else {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('支付失败: ${provider.errorMessage}')),
                  );
                }
              },
              child: const Text('确认支付'),
            ),
          ],
        );
      },
    );
  }
}
