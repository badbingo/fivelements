/// 身强身弱分析卡片组件
/// 支持原命局和当前运势的切换展示
/// 完全按照baziphone.html的UI设计
library;

import 'package:flutter/material.dart';
import '../models/bazi_models.dart';

class StrengthAnalysisCard extends StatefulWidget {
  final StrengthAnalysis? strengthAnalysis;
  final bool isLoading;

  const StrengthAnalysisCard({
    super.key,
    this.strengthAnalysis,
    this.isLoading = false,
  });

  @override
  State<StrengthAnalysisCard> createState() => _StrengthAnalysisCardState();
}

class _StrengthAnalysisCardState extends State<StrengthAnalysisCard>
    with SingleTickerProviderStateMixin {
  bool _showOriginal = true; // true显示原命局，false显示当前运势
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _tabController.addListener(() {
      setState(() {
        _showOriginal = _tabController.index == 0;
      });
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.all(16),
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildHeader(),
          if (widget.isLoading) _buildLoadingContent(),
          if (!widget.isLoading && widget.strengthAnalysis != null)
            _buildAnalysisContent(),
          if (!widget.isLoading && widget.strengthAnalysis == null)
            _buildEmptyContent(),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [Colors.purple.shade400, Colors.purple.shade600],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: const BorderRadius.only(
          topLeft: Radius.circular(12),
          topRight: Radius.circular(12),
        ),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Icon(
                Icons.analytics,
                color: Colors.white,
                size: 24,
              ),
              const SizedBox(width: 8),
              Text(
                '身强身弱分析',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          // 切换标签
          Container(
            height: 40,
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.2),
              borderRadius: BorderRadius.circular(20),
            ),
            child: TabBar(
              controller: _tabController,
              indicator: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
              ),
              labelColor: Colors.purple.shade600,
              unselectedLabelColor: Colors.white,
              labelStyle: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
              ),
              tabs: const [
                Tab(text: '原命局分析'),
                Tab(text: '当前运势分析'),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLoadingContent() {
    return Container(
      padding: const EdgeInsets.all(32),
      child: Center(
        child: Column(
          children: [
            CircularProgressIndicator(
              valueColor: AlwaysStoppedAnimation<Color>(Colors.purple.shade400),
            ),
            const SizedBox(height: 16),
            Text(
              '正在分析身强身弱...',
              style: TextStyle(
                color: Colors.grey.shade600,
                fontSize: 14,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyContent() {
    return Container(
      padding: const EdgeInsets.all(32),
      child: Center(
        child: Column(
          children: [
            Icon(
              Icons.info_outline,
              size: 48,
              color: Colors.grey.shade400,
            ),
            const SizedBox(height: 16),
            Text(
              '暂无身强身弱分析数据',
              style: TextStyle(
                color: Colors.grey.shade600,
                fontSize: 16,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAnalysisContent() {
    final analysis = widget.strengthAnalysis!;
    final currentAnalysis = _showOriginal ? analysis.original : analysis.current;

    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildStrengthOverview(currentAnalysis),
          const SizedBox(height: 16),
          _buildStrengthChart(currentAnalysis),
          const SizedBox(height: 16),
          _buildElementStrengths(currentAnalysis),
          const SizedBox(height: 16),
          _buildHehuaInfo(currentAnalysis),
          const SizedBox(height: 16),
          _buildDetailedAnalysis(currentAnalysis),
          if (!_showOriginal) ...<Widget>[
            const SizedBox(height: 16),
            _buildCurrentInfo(analysis.current),
          ],
          const SizedBox(height: 16),
          _buildComparisonNote(analysis),
        ],
      ),
    );
  }

  Widget _buildStrengthOverview(dynamic analysis) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.grey.shade50,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '强弱类型',
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey.shade600,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                decoration: BoxDecoration(
                  color: _getStrengthTypeColor(analysis.strengthType),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  analysis.strengthType,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '强度百分比',
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey.shade600,
                ),
              ),
              Text(
                '${analysis.strengthPercentage.toStringAsFixed(1)}%',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: _getStrengthTypeColor(analysis.strengthType),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '强弱等级',
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey.shade600,
                ),
              ),
              Row(
                children: [
                  ...List.generate(12, (index) {
                    bool isActive = index < analysis.strengthLevel;
                    return Container(
                      width: 8,
                      height: 8,
                      margin: const EdgeInsets.only(right: 2),
                      decoration: BoxDecoration(
                        color: isActive
                            ? _getStrengthTypeColor(analysis.strengthType)
                            : Colors.grey.shade300,
                        shape: BoxShape.circle,
                      ),
                    );
                  }),
                  const SizedBox(width: 8),
                  Text(
                    '${analysis.strengthLevel}/12',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey.shade600,
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

  Widget _buildStrengthChart(dynamic analysis) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.grey.shade50,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.show_chart,
                size: 20,
                color: Colors.purple.shade600,
              ),
              const SizedBox(width: 8),
              Text(
                '力量对比图',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: Colors.grey.shade800,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _buildStrengthBar('生扶力量', analysis.supportStrength, Colors.green),
          const SizedBox(height: 8),
          _buildStrengthBar('克泄力量', analysis.weakenStrength, Colors.red),
          const SizedBox(height: 8),
          _buildMonthScoreBar('月令得分', analysis.monthScore),
        ],
      ),
    );
  }

  Widget _buildStrengthBar(String label, double value, Color color) {
    double maxValue = 10.0; // 假设最大值为10
    double percentage = (value / maxValue).clamp(0.0, 1.0);
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              label,
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey.shade700,
              ),
            ),
            Text(
              value.toStringAsFixed(1),
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: color,
              ),
            ),
          ],
        ),
        const SizedBox(height: 4),
        Container(
          height: 8,
          decoration: BoxDecoration(
            color: Colors.grey.shade200,
            borderRadius: BorderRadius.circular(4),
          ),
          child: FractionallySizedBox(
            alignment: Alignment.centerLeft,
            widthFactor: percentage,
            child: Container(
              decoration: BoxDecoration(
                color: color,
                borderRadius: BorderRadius.circular(4),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildMonthScoreBar(String label, double value) {
    double maxValue = 40.0; // 月令得分最大值为40
    double absValue = value.abs();
    double percentage = (absValue / maxValue).clamp(0.0, 1.0);
    Color color = value >= 0 ? Colors.blue : Colors.orange;
    String displayValue = value >= 0 ? '+${value.toStringAsFixed(1)}' : value.toStringAsFixed(1);
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              label,
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey.shade700,
              ),
            ),
            Text(
              displayValue,
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: color,
              ),
            ),
          ],
        ),
        const SizedBox(height: 4),
        Container(
          height: 8,
          decoration: BoxDecoration(
            color: Colors.grey.shade200,
            borderRadius: BorderRadius.circular(4),
          ),
          child: FractionallySizedBox(
            alignment: Alignment.centerLeft,
            widthFactor: percentage,
            child: Container(
              decoration: BoxDecoration(
                color: color,
                borderRadius: BorderRadius.circular(4),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildElementStrengths(dynamic analysis) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.grey.shade50,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.pie_chart,
                size: 20,
                color: Colors.purple.shade600,
              ),
              const SizedBox(width: 8),
              Text(
                '五行力量分布',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: Colors.grey.shade800,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          ...analysis.elementStrengths.entries.map((entry) {
            return Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: _buildElementBar(
                entry.key,
                entry.value,
                _getElementColor(entry.key),
              ),
            );
          }).toList(),
        ],
      ),
    );
  }

  Widget _buildElementBar(String element, double value, Color color) {
    double maxValue = 15.0; // 假设最大值为15
    double percentage = (value / maxValue).clamp(0.0, 1.0);
    
    // 将英文五行名称转换为中文
    String chineseElement = _getElementChinese(element);
    
    return Row(
      children: [
        Container(
          width: 24,
          height: 24,
          decoration: BoxDecoration(
            color: color,
            shape: BoxShape.circle,
          ),
          child: Center(
            child: Text(
              chineseElement,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 12,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    '$chineseElement行',
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey.shade700,
                    ),
                  ),
                  Text(
                    value.toStringAsFixed(1),
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: color,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              Container(
                height: 6,
                decoration: BoxDecoration(
                  color: Colors.grey.shade200,
                  borderRadius: BorderRadius.circular(3),
                ),
                child: FractionallySizedBox(
                  alignment: Alignment.centerLeft,
                  widthFactor: percentage,
                  child: Container(
                    decoration: BoxDecoration(
                      color: color,
                      borderRadius: BorderRadius.circular(3),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildHehuaInfo(dynamic analysis) {
    // 检查是否有合化信息或合化影响
    bool hasHehuaInfo = analysis.hehuaInfo.isNotEmpty;
    bool hasCombinationEffect = false;
    double combinationEffect = 0.0;
    
    // 尝试获取合化影响得分（如果存在）
    try {
      if (analysis is Map && analysis.containsKey('combinationEffect')) {
        combinationEffect = analysis['combinationEffect'] ?? 0.0;
        hasCombinationEffect = combinationEffect != 0.0;
      }
    } catch (e) {
      // 忽略错误，继续显示基本信息
    }
    
    if (!hasHehuaInfo && !hasCombinationEffect) {
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.grey.shade50,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: Colors.grey.shade200),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  Icons.merge_type,
                  size: 20,
                  color: Colors.grey.shade600,
                ),
                const SizedBox(width: 8),
                Text(
                  '合化信息',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: Colors.grey.shade700,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              '暂无合化影响',
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey.shade600,
                fontStyle: FontStyle.italic,
              ),
            ),
          ],
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.amber.shade50,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.amber.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.merge_type,
                size: 20,
                color: Colors.amber.shade700,
              ),
              const SizedBox(width: 8),
              Text(
                '合化信息',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: Colors.amber.shade800,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          
          // 显示合化影响得分
          if (hasCombinationEffect) ...<Widget>[
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.amber.shade100,
                borderRadius: BorderRadius.circular(6),
                border: Border.all(color: Colors.amber.shade300),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    '合化总影响',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: Colors.amber.shade800,
                    ),
                  ),
                  Text(
                    combinationEffect >= 0 
                        ? '+${combinationEffect.toStringAsFixed(1)}分'
                        : '${combinationEffect.toStringAsFixed(1)}分',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: combinationEffect >= 0 ? Colors.green.shade700 : Colors.red.shade700,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 8),
          ],
          
          // 显示具体合化信息
          if (hasHehuaInfo) ...<Widget>[
            ...analysis.hehuaInfo.map((info) {
              return Padding(
                padding: const EdgeInsets.only(bottom: 6),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      margin: const EdgeInsets.only(top: 6),
                      width: 6,
                      height: 6,
                      decoration: BoxDecoration(
                        color: Colors.amber.shade600,
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        info,
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.amber.shade800,
                          height: 1.4,
                        ),
                      ),
                    ),
                  ],
                ),
              );
            }).toList(),
          ],
          
          // 如果没有具体信息但有影响，显示说明
          if (!hasHehuaInfo && hasCombinationEffect) ...<Widget>[
            Text(
              '检测到合化影响，具体信息正在完善中...',
              style: TextStyle(
                fontSize: 14,
                color: Colors.amber.shade700,
                fontStyle: FontStyle.italic,
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildDetailedAnalysis(dynamic analysis) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.blue.shade50,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.blue.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.description,
                size: 20,
                color: Colors.blue.shade700,
              ),
              const SizedBox(width: 8),
              Text(
                '详细分析',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: Colors.blue.shade800,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            analysis.analysis,
            style: TextStyle(
              fontSize: 14,
              color: Colors.blue.shade800,
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCurrentInfo(CurrentStrengthAnalysis current) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.green.shade50,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.green.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.timeline,
                size: 20,
                color: Colors.green.shade700,
              ),
              const SizedBox(width: 8),
              Text(
                '运势信息',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: Colors.green.shade800,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '当前大运',
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.green.shade700,
                ),
              ),
              Text(
                current.currentDayun,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: Colors.green.shade800,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '当前流年',
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.green.shade700,
                ),
              ),
              Text(
                current.currentLiunian,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: Colors.green.shade800,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildComparisonNote(StrengthAnalysis analysis) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.purple.shade50,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.purple.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.compare_arrows,
                size: 20,
                color: Colors.purple.shade700,
              ),
              const SizedBox(width: 8),
              Text(
                '对比分析',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: Colors.purple.shade800,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            analysis.comparisonNote,
            style: TextStyle(
              fontSize: 14,
              color: Colors.purple.shade800,
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }

  Color _getStrengthTypeColor(String strengthType) {
    switch (strengthType) {
      case '极强':
      case '专旺格':
        return Colors.red.shade600;
      case '偏强':
      case '中强':
        return Colors.orange.shade600;
      case '中和':
        return Colors.green.shade600;
      case '中弱':
      case '偏弱':
        return Colors.blue.shade600;
      case '极弱':
      case '从弱格':
      case '假从格':
        return Colors.purple.shade600;
      default:
        return Colors.grey.shade600;
    }
  }

  Color _getElementColor(String element) {
    // 如果是英文五行名称，先转换为中文
    String chineseElement = _getElementChinese(element);
    
    switch (chineseElement) {
      case '木':
        return Colors.green.shade600;
      case '火':
        return Colors.red.shade600;
      case '土':
        return Colors.brown.shade600;
      case '金':
        return Colors.amber.shade600;
      case '水':
        return Colors.blue.shade600;
      default:
        return Colors.grey.shade600;
    }
  }

  /// 将英文五行名称转换为中文
  String _getElementChinese(String element) {
    const Map<String, String> elementNames = {
      'wood': '木',
      'fire': '火',
      'earth': '土',
      'metal': '金',
      'water': '水',
    };
    return elementNames[element] ?? element;
  }
}