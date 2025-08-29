import 'package:flutter/material.dart';
import '../utils/bazi_calculator.dart';
import '../widgets/strength_analysis_card.dart';
import '../services/strength_analysis_service.dart';

class BaziResultScreen extends StatefulWidget {
  const BaziResultScreen({super.key});

  @override
  State<BaziResultScreen> createState() => _BaziResultScreenState();
}

class _BaziResultScreenState extends State<BaziResultScreen> {
  Map<String, dynamic>? baziData;
  Map<String, dynamic>? wealthAnalysis;
  Map<String, dynamic>? fateAnalysis;
  bool _isLoading = true;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (baziData == null) {
      baziData =
          ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>?;
      if (baziData != null) {
        _analyzeWealth();
      }
    }
  }

  Future<void> _analyzeWealth() async {
    if (baziData != null) {
      setState(() {
        _isLoading = true;
      });

      // 模拟分析延迟
      await Future.delayed(const Duration(milliseconds: 500));

      wealthAnalysis = BaziCalculator.analyzeWealth(baziData!);
      fateAnalysis = BaziCalculator.analyzeFate(baziData!);

      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (baziData == null) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('八字结果'),
          backgroundColor: const Color(0xFF3498DB),
          foregroundColor: Colors.white,
        ),
        body: const Center(child: Text('数据加载失败')),
      );
    }

    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      appBar: AppBar(
        title: const Text('八字分析结果'),
        backgroundColor: const Color(0xFF3498DB),
        foregroundColor: Colors.white,
        elevation: 0,
        actions: [
          IconButton(icon: const Icon(Icons.share), onPressed: _shareResult),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 基本信息卡片
            _buildBasicInfoCard(),
            const SizedBox(height: 16),

            // 八字排盘卡片
            _buildBaziChart(),
            const SizedBox(height: 16),

            // 等级分析卡片
            _buildLevelAnalysisCard(),
            const SizedBox(height: 16),

            // 操作按钮
            _buildActionButtons(),
          ],
        ),
      ),
    );
  }

  Widget _buildBasicInfoCard() {
    return Container(
      width: double.infinity,
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
              const Icon(Icons.person, color: Color(0xFF3498DB), size: 24),
              const SizedBox(width: 8),
              const Text(
                '基本信息',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF2C3E50),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _buildInfoRow('姓名', baziData!['name']),
          _buildInfoRow('性别', baziData!['gender']),
          _buildInfoRow('阳历', baziData!['solarDate']),
          if (baziData!['lunarDate'].isNotEmpty)
            _buildInfoRow('农历', baziData!['lunarDate']),
        ],
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          SizedBox(
            width: 60,
            child: Text(
              '$label：',
              style: const TextStyle(fontSize: 14, color: Color(0xFF7F8C8D)),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w500,
                color: Color(0xFF2C3E50),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBaziChart() {
    return Container(
      width: double.infinity,
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
              const Icon(Icons.grid_view, color: Color(0xFF3498DB), size: 24),
              const SizedBox(width: 8),
              const Text(
                '八字排盘',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF2C3E50),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),

          // 八字表格
          Table(
            border: TableBorder.all(color: const Color(0xFFE0E0E0), width: 1),
            children: [
              // 天干行
              TableRow(
                decoration: const BoxDecoration(color: Color(0xFFF8F9FA)),
                children: [
                  _buildTableCell('天干', isHeader: true),
                  _buildTableCell(baziData!['yearGan']),
                  _buildTableCell(baziData!['monthGan']),
                  _buildTableCell(baziData!['dayGan']),
                  _buildTableCell(baziData!['hourGan']),
                ],
              ),
              // 地支行
              TableRow(
                children: [
                  _buildTableCell('地支', isHeader: true),
                  _buildTableCell(baziData!['yearZhi']),
                  _buildTableCell(baziData!['monthZhi']),
                  _buildTableCell(baziData!['dayZhi']),
                  _buildTableCell(baziData!['hourZhi']),
                ],
              ),
              // 柱名行
              TableRow(
                decoration: const BoxDecoration(color: Color(0xFFF8F9FA)),
                children: [
                  _buildTableCell('', isHeader: true),
                  _buildTableCell('年柱', isSmall: true),
                  _buildTableCell('月柱', isSmall: true),
                  _buildTableCell('日柱', isSmall: true),
                  _buildTableCell('时柱', isSmall: true),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildTableCell(
    String text, {
    bool isHeader = false,
    bool isSmall = false,
  }) {
    return Container(
      padding: const EdgeInsets.all(12),
      child: Text(
        text,
        textAlign: TextAlign.center,
        style: TextStyle(
          fontSize: isSmall ? 12 : 16,
          fontWeight: isHeader ? FontWeight.bold : FontWeight.w500,
          color: isHeader ? const Color(0xFF3498DB) : const Color(0xFF2C3E50),
        ),
      ),
    );
  }

  Widget _buildLevelAnalysisCard() {
    if (_isLoading) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(40),
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
        child: const Column(
          children: [
            CircularProgressIndicator(color: Color(0xFF3498DB)),
            SizedBox(height: 16),
            Text(
              '正在分析命格和财富等级...',
              style: TextStyle(fontSize: 16, color: Color(0xFF7F8C8D)),
            ),
          ],
        ),
      );
    }

    if (wealthAnalysis == null || fateAnalysis == null) {
      return const SizedBox.shrink();
    }

    return Container(
      width: double.infinity,
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
              const Icon(Icons.star, color: Color(0xFF3498DB), size: 24),
              const SizedBox(width: 8),
              const Text(
                '等级分析',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF2C3E50),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // 命格等级
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            margin: const EdgeInsets.only(bottom: 12),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFFE74C3C), Color(0xFFC0392B)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              children: [
                Text(
                  '命格等级：${fateAnalysis!['level']}',
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  '命格评分：${fateAnalysis!['totalScore']}分',
                  style: const TextStyle(fontSize: 14, color: Colors.white70),
                ),
              ],
            ),
          ),

          // 财富等级
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF3498DB), Color(0xFF2980B9)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              children: [
                Text(
                  '财富等级：${wealthAnalysis!['level']}',
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  '财富评分：${(wealthAnalysis!['totalScore'] ?? 0).toStringAsFixed(0)}分',
                  style: const TextStyle(fontSize: 14, color: Colors.white70),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // 命格描述
          Text(
            '命格分析：${fateAnalysis!['description']}',
            style: const TextStyle(
              fontSize: 14,
              color: Color(0xFF2C3E50),
              height: 1.5,
            ),
          ),
          const SizedBox(height: 8),

          // 财富描述
          Text(
            '财富分析：${wealthAnalysis!['description']}',
            style: const TextStyle(
              fontSize: 14,
              color: Color(0xFF2C3E50),
              height: 1.5,
            ),
          ),
          const SizedBox(height: 16),

          // 详细分析
          const Text(
            '详细分析：',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: Color(0xFF2C3E50),
            ),
          ),
          const SizedBox(height: 8),
          ...fateAnalysis!['details']
              .map<Widget>(
                (detail) => Padding(
                  padding: const EdgeInsets.symmetric(vertical: 2),
                  child: Row(
                    children: [
                      const Icon(
                        Icons.fiber_manual_record,
                        size: 8,
                        color: Color(0xFFE74C3C),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          detail,
                          style: const TextStyle(
                            fontSize: 14,
                            color: Color(0xFF7F8C8D),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              )
              .toList(),
          ...wealthAnalysis!['details']
              .map<Widget>(
                (detail) => Padding(
                  padding: const EdgeInsets.symmetric(vertical: 2),
                  child: Row(
                    children: [
                      const Icon(
                        Icons.fiber_manual_record,
                        size: 8,
                        color: Color(0xFF3498DB),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          detail,
                          style: const TextStyle(
                            fontSize: 14,
                            color: Color(0xFF7F8C8D),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              )
              .toList(),
        ],
      ),
    );
  }

  Widget _buildWealthAnalysisCard() {
    if (_isLoading) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(40),
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
        child: const Column(
          children: [
            CircularProgressIndicator(color: Color(0xFF3498DB)),
            SizedBox(height: 16),
            Text(
              '正在分析财富运势...',
              style: TextStyle(fontSize: 16, color: Color(0xFF7F8C8D)),
            ),
          ],
        ),
      );
    }

    if (wealthAnalysis == null) {
      return const SizedBox.shrink();
    }

    return Container(
      width: double.infinity,
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
              const Icon(
                Icons.monetization_on,
                color: Color(0xFF3498DB),
                size: 24,
              ),
              const SizedBox(width: 8),
              const Text(
                '财富分析',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF2C3E50),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // 总分和等级
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF3498DB), Color(0xFF2980B9)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              children: [
                Text(
                  '财富等级：${wealthAnalysis!['level']}',
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  '综合评分：${(wealthAnalysis!['totalScore'] ?? 0).toStringAsFixed(0)}分',
                  style: const TextStyle(fontSize: 16, color: Colors.white70),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // 描述
          Text(
            wealthAnalysis!['description'],
            style: const TextStyle(
              fontSize: 16,
              color: Color(0xFF2C3E50),
              height: 1.5,
            ),
          ),
          const SizedBox(height: 16),

          // 详细分析
          const Text(
            '详细分析：',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: Color(0xFF2C3E50),
            ),
          ),
          const SizedBox(height: 8),
          ...wealthAnalysis!['details']
              .map<Widget>(
                (detail) => Padding(
                  padding: const EdgeInsets.symmetric(vertical: 2),
                  child: Row(
                    children: [
                      const Icon(
                        Icons.fiber_manual_record,
                        size: 8,
                        color: Color(0xFF3498DB),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          detail,
                          style: const TextStyle(
                            fontSize: 14,
                            color: Color(0xFF7F8C8D),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              )
              .toList(),
        ],
      ),
    );
  }

  Widget _buildActionButtons() {
    return Column(
      children: [
        SizedBox(
          width: double.infinity,
          height: 48,
          child: ElevatedButton(
            onPressed: () {
              Navigator.pushNamed(
                context,
                '/detailed-analysis',
                arguments: baziData,
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF3498DB),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            child: const Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.analytics, size: 20),
                SizedBox(width: 8),
                Text(
                  '详细分析',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          width: double.infinity,
          height: 48,
          child: OutlinedButton(
            onPressed: () {
              Navigator.pushNamed(context, '/qa');
            },
            style: OutlinedButton.styleFrom(
              foregroundColor: const Color(0xFF3498DB),
              side: const BorderSide(color: Color(0xFF3498DB)),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            child: const Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.question_answer, size: 20),
                SizedBox(width: 8),
                Text(
                  '智能问答',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  void _shareResult() {
    // 实现分享功能
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('分享功能开发中...'),
        backgroundColor: Color(0xFF3498DB),
      ),
    );
  }

  Widget _buildStrengthAnalysisCard() {
    if (_isLoading) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(40),
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
        child: const Column(
          children: [
            CircularProgressIndicator(color: Color(0xFF3498DB)),
            SizedBox(height: 16),
            Text(
              '正在分析五行强弱...',
              style: TextStyle(fontSize: 16, color: Color(0xFF7F8C8D)),
            ),
          ],
        ),
      );
    }

    if (baziData == null) {
      return const SizedBox.shrink();
    }

    // 从baziData中提取天干地支信息
    List<String> stems = [
      baziData!['yearGan'] ?? '',
      baziData!['monthGan'] ?? '',
      baziData!['dayGan'] ?? '',
      baziData!['hourGan'] ?? '',
    ];

    List<String> branches = [
      baziData!['yearZhi'] ?? '',
      baziData!['monthZhi'] ?? '',
      baziData!['dayZhi'] ?? '',
      baziData!['hourZhi'] ?? '',
    ];

    // 获取当前大运和流年（这里使用默认值，实际应该从用户数据获取）
    String currentDayun = '甲寅'; // 示例大运
    String currentLiunian = '甲辰'; // 示例流年

    final strengthAnalysis = StrengthAnalysisService.generateCompleteAnalysis(
      stems,
      branches,
      currentDayun,
      currentLiunian,
    );

    return Container(
      width: double.infinity,
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
              const Icon(Icons.balance, color: Color(0xFF3498DB), size: 24),
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
          StrengthAnalysisCard(strengthAnalysis: strengthAnalysis),
        ],
      ),
    );
  }
}
