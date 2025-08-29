import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:fl_chart/fl_chart.dart';
import '../providers/app_provider.dart';
import '../models/bazi_model.dart';

class FateAnalysisScreen extends StatefulWidget {
  const FateAnalysisScreen({super.key});

  @override
  State<FateAnalysisScreen> createState() => _FateAnalysisScreenState();
}

class _FateAnalysisScreenState extends State<FateAnalysisScreen> {
  bool _isPaid = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _calculateFate();
    });
  }

  Future<void> _calculateFate() async {
    final provider = Provider.of<AppProvider>(context, listen: false);
    await provider.calculateFate();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('命格分析'),
        backgroundColor: Colors.purple[700],
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
                    onPressed: _calculateFate,
                    child: const Text('重试'),
                  ),
                ],
              ),
            );
          }

          if (provider.currentFateAnalysis == null) {
            return const Center(child: Text('暂无分析结果'));
          }

          return SingleChildScrollView(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildBaziCard(provider.currentBazi!),
                const SizedBox(height: 16),
                _buildAnalysisCard(provider.currentFateAnalysis!),
                const SizedBox(height: 16),
                _buildScoreCard(provider.currentFateAnalysis!),
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
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildPillar('年柱', bazi.yearGan, bazi.yearZhi),
                _buildPillar('月柱', bazi.monthGan, bazi.monthZhi),
                _buildPillar('日柱', bazi.dayGan, bazi.dayZhi),
                _buildPillar('时柱', bazi.hourGan, bazi.hourZhi),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPillar(String title, String gan, String zhi) {
    return Column(
      children: [
        Text(title, style: const TextStyle(fontSize: 12, color: Colors.grey)),
        const SizedBox(height: 4),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          decoration: BoxDecoration(
            border: Border.all(color: Colors.grey[300]!),
            borderRadius: BorderRadius.circular(4),
          ),
          child: Column(
            children: [
              Text(
                gan,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Text(
                zhi,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildAnalysisCard(FateAnalysis analysis) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              '命格分析结果',
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
                        '命格等级: ${analysis.level}',
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
            const SizedBox(height: 16),
            Text(
              analysis.description,
              style: const TextStyle(fontSize: 14, color: Colors.grey),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildScoreCard(FateAnalysis analysis) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              '命格评分',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            SizedBox(
              height: 200,
              child: PieChart(
                PieChartData(
                  sections: [
                    PieChartSectionData(
                      value: analysis.totalScore.toDouble(),
                      color: _getLevelColor(analysis.level),
                      title: '${analysis.totalScore}分',
                      radius: 60,
                      titleStyle: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                    PieChartSectionData(
                      value: (200 - analysis.totalScore).toDouble(),
                      color: Colors.grey[300]!,
                      title: '',
                      radius: 60,
                    ),
                  ],
                  centerSpaceRadius: 40,
                  sectionsSpace: 2,
                ),
              ),
            ),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  '命格等级: ${analysis.level}',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: _getLevelColor(analysis.level),
                  ),
                ),
              ],
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
            children: [
              const Icon(Icons.lock, size: 48, color: Colors.grey),
              const SizedBox(height: 16),
              const Text(
                '详细命格分析',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              const Text(
                '解锁详细的命格分析报告，包括：\n• 五行平衡分析\n• 格局详解\n• 用神忌神分析\n• 人生建议',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.grey),
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () async {
                  bool success = await provider.processPayment(9.9, '命格详细分析');
                  if (success) {
                    setState(() {
                      _isPaid = true;
                    });
                  }
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.purple[700],
                  foregroundColor: Colors.white,
                ),
                child: const Text('解锁详细分析 ¥9.9'),
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
              '详细命格分析',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            ...provider.currentFateAnalysis!.details.map(
              (detail) => Padding(
                padding: const EdgeInsets.symmetric(vertical: 4),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(
                      Icons.fiber_manual_record,
                      size: 8,
                      color: Colors.purple,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(detail, style: const TextStyle(fontSize: 14)),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              '命格建议',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              _generateFateAdvice(provider.currentFateAnalysis!),
              style: const TextStyle(fontSize: 14, height: 1.5),
            ),
          ],
        ),
      ),
    );
  }

  String _generateFateAdvice(FateAnalysis analysis) {
    if (analysis.totalScore >= 140) {
      return '您的命格极佳，天生具有领导才能和贵人运。建议在事业上积极进取，把握机遇，发挥自身优势。同时要保持谦逊，广结善缘。';
    } else if (analysis.totalScore >= 120) {
      return '您的命格良好，具备成功的基础条件。建议专注于自己的专业领域，持续学习提升，机会来临时要果断把握。';
    } else if (analysis.totalScore >= 100) {
      return '您的命格中等偏上，通过努力可以获得不错的成就。建议制定明确的目标，脚踏实地地工作，注重人际关系的建立。';
    } else if (analysis.totalScore >= 80) {
      return '您的命格平稳，需要通过自身努力来改善运势。建议多学习新技能，扩大社交圈，保持积极乐观的心态。';
    } else {
      return '您的命格需要特别关注，建议多行善事，积累福德。在生活中要谨慎行事，避免冲动决定，通过持续努力来改善运势。';
    }
  }

  Color _getLevelColor(String level) {
    switch (level) {
      case '帝王命':
        return Colors.purple[900]!;
      case '王侯命':
        return Colors.purple[700]!;
      case '富贵命':
        return Colors.purple[500]!;
      case '小康命':
        return Colors.blue[500]!;
      case '平常命':
        return Colors.green[500]!;
      case '劳碌命':
        return Colors.orange[500]!;
      case '贫苦命':
        return Colors.red[500]!;
      default:
        return Colors.grey;
    }
  }
}
