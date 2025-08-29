import 'package:flutter/material.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import '../../models/bazi_models.dart';
import '../../services/wealth_analysis_service.dart';
import '../../services/share_service.dart';

class WealthAnalysisScreen extends StatefulWidget {
  final BaziInput input;
  final BaziResult result;

  const WealthAnalysisScreen({
    super.key,
    required this.input,
    required this.result,
  });

  @override
  State<WealthAnalysisScreen> createState() => _WealthAnalysisScreenState();
}

class _WealthAnalysisScreenState extends State<WealthAnalysisScreen> {
  late Map<String, dynamic> wealthAnalysis;
  bool _isLoading = true;
  bool _isLoadingAdvice = false;
  late Map<String, String> _pillars;

  @override
  void initState() {
    super.initState();
    _calculateWealthLevel();
  }

  @override
  void dispose() {
    // 清理资源，防止内存泄漏
    super.dispose();
  }

  Future<void> _calculateWealthLevel() async {
    setState(() {
      _isLoading = true;
    });

    try {
      // 从result.paipan中提取天干地支信息
      List<String> stems = [
        widget.result.paipan.yearPillar.isNotEmpty
            ? widget.result.paipan.yearPillar[0]
            : '甲',
        widget.result.paipan.monthPillar.isNotEmpty
            ? widget.result.paipan.monthPillar[0]
            : '甲',
        widget.result.paipan.dayPillar.isNotEmpty
            ? widget.result.paipan.dayPillar[0]
            : '甲',
        widget.result.paipan.hourPillar.isNotEmpty
            ? widget.result.paipan.hourPillar[0]
            : '甲',
      ];

      List<String> branches = [
        widget.result.paipan.yearPillar.length > 1
            ? widget.result.paipan.yearPillar[1]
            : '子',
        widget.result.paipan.monthPillar.length > 1
            ? widget.result.paipan.monthPillar[1]
            : '子',
        widget.result.paipan.dayPillar.length > 1
            ? widget.result.paipan.dayPillar[1]
            : '子',
        widget.result.paipan.hourPillar.length > 1
            ? widget.result.paipan.hourPillar[1]
            : '子',
      ];

      // 计算财富等级
      _pillars = {
        'year': '${stems[0]}${branches[0]}',
        'month': '${stems[1]}${branches[1]}',
        'day': '${stems[2]}${branches[2]}',
        'hour': '${stems[3]}${branches[3]}',
      };

      // 异步调用财富分析服务（不包含API调用）
      wealthAnalysis = await WealthAnalysisService.analyzeWealth(_pillars);
    } catch (e) {
      print('财富分析计算失败: $e');
      // 设置默认值以防止错误
      wealthAnalysis = {
        'score': 0.0,
        'level': '未知',
        'description': '计算失败，请稍后重试',
        'advice': <String>[],
        'details': {},
      };
    }

    if (mounted) {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _getWealthAdvice() async {
    setState(() {
      _isLoadingAdvice = true;
      // 清空之前的建议内容，准备接收流式数据
      wealthAnalysis = {...wealthAnalysis, 'advice': ''};
    });

    try {
      // 构建完整的命主信息
      final fullBaziData = _buildFullBaziData();

      // 使用流式输出版本的API调用
      final advice = await WealthAnalysisService.getWealthAdviceFromAPI(
        fullBaziData,
        wealthAnalysis['score'] as double,
        wealthAnalysis['level'] as String,
        onStreamData: (String chunk) {
          if (mounted) {
            setState(() {
              final currentAdvice = wealthAnalysis['advice'] as String? ?? '';
              wealthAnalysis = {
                ...wealthAnalysis,
                'advice': currentAdvice + chunk,
              };
            });
          }
        },
      );

      if (mounted) {
        setState(() {
          wealthAnalysis = {...wealthAnalysis, 'advice': advice};
        });
      }
    } catch (e) {
      print('获取求财建议失败: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('获取求财建议失败，请稍后重试'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }

    if (mounted) {
      setState(() {
        _isLoadingAdvice = false;
      });
    }
  }

  // 构建完整的命主信息
  Map<String, dynamic> _buildFullBaziData() {
    return {
      'name': widget.input.name,
      'gender': widget.input.gender,
      'birthDate':
          '${widget.input.birthDate.year}年${widget.input.birthDate.month}月${widget.input.birthDate.day}日 ${widget.input.birthTime}',
      'birthPlace': widget.input.birthPlace ?? '未知',
      'luckStartingTime': widget.result.luckStartingTime ?? '未知',
      'currentDayun': widget.result.currentDayun ?? '未知',
      'strengthType':
          widget.result.strengthAnalysis?.original.strengthType ?? '未知',
      'pillars': _pillars,
      'dayMaster': widget.result.paipan.dayPillar.isNotEmpty
          ? widget.result.paipan.dayPillar[0]
          : '未知',
      'strengthAnalysis': {
        'original': {
          'strengthType':
              widget.result.strengthAnalysis?.original.strengthType ?? '未知',
          'strengthPercentage':
              widget.result.strengthAnalysis?.original.strengthPercentage ??
              0.0,
          'levelDescription':
              widget.result.strengthAnalysis?.original.levelDescription ?? '未知',
          'supportStrength':
              widget.result.strengthAnalysis?.original.supportStrength ?? 0,
          'weakenStrength':
              widget.result.strengthAnalysis?.original.weakenStrength ?? 0,
          'monthScore':
              widget.result.strengthAnalysis?.original.monthScore ?? 0,
        },
      },
      'wuxing': widget.result.wuxing,
      'dayun': widget.result.dayun,
      'liunian': widget.result.liunian,
    };
  }

  /// 分享财富分析结果
  Future<void> _shareWealthAnalysis() async {
    if (_isLoading) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('分析还在进行中，请稍后再试'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    // 获取分析内容
    final adviceData = wealthAnalysis['advice'];
    String analysisContent;

    if (adviceData != null && adviceData.toString().isNotEmpty) {
      analysisContent = adviceData.toString();
    } else {
      // 如果没有深度分析，使用基础分析内容
      analysisContent = wealthAnalysis['description']?.toString() ?? '财富分析结果';
    }

    await ShareService.shareWealthAnalysis(
      context: context,
      name: widget.input.name,
      score: wealthAnalysis['score'] as double,
      level: wealthAnalysis['level'] as String,
      analysis: analysisContent,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      appBar: AppBar(
        title: Text('${widget.input.name}的财富等级'),
        backgroundColor: const Color(0xFF27AE60),
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(
                valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF27AE60)),
              ),
            )
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // 财富等级总览卡片
                  _buildWealthOverviewCard(),
                  const SizedBox(height: 16),

                  // 评分构成详情卡片
                  _buildScoreDetailsCard(),
                  const SizedBox(height: 16),

                  // 财星分析卡片
                  _buildWealthStarCard(),
                  const SizedBox(height: 16),

                  // 财库分析卡片
                  _buildWealthVaultCard(),
                  const SizedBox(height: 16),

                  // 财运时机卡片
                  _buildWealthTimingCard(),
                  const SizedBox(height: 16),

                  // 求财建议卡片
                  _buildWealthAdviceCard(),
                  const SizedBox(height: 24),
                ],
              ),
            ),
    );
  }

  Widget _buildWealthOverviewCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF27AE60), Color(0xFF2ECC71)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF27AE60).withOpacity(0.3),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.monetization_on, color: Colors.white, size: 28),
              const SizedBox(width: 12),
              Text(
                '${widget.input.name}的财富等级',
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    '财富指数',
                    style: TextStyle(fontSize: 14, color: Colors.white70),
                  ),
                  Text(
                    '${wealthAnalysis['score']}分',
                    style: const TextStyle(
                      fontSize: 32,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                ],
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  const Text(
                    '财富等级',
                    style: TextStyle(fontSize: 14, color: Colors.white70),
                  ),
                  Text(
                    wealthAnalysis['level'] ?? '未知',
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.2),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              wealthAnalysis['description'] ?? '财富分析中...',
              style: const TextStyle(
                fontSize: 14,
                color: Colors.white,
                height: 1.4,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildScoreDetailsCard() {
    final breakdown =
        wealthAnalysis['breakdown'] as Map<String, dynamic>? ?? {};

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
          const Row(
            children: [
              Icon(Icons.assessment, color: Color(0xFF27AE60), size: 24),
              SizedBox(width: 8),
              Text(
                '财富等级评分构成',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Colors.black87,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // 基础模块评分
          const Text(
            '基础模块评分',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: Colors.black87,
            ),
          ),
          const SizedBox(height: 8),
          _buildScoreItem(
            '财富位置',
            breakdown['财富位置'] ?? 0,
            const Color(0xFF27AE60),
          ),
          _buildScoreItem(
            '日主承载力',
            breakdown['日主承载力'] ?? 0,
            const Color(0xFF3498db),
          ),
          _buildScoreItem(
            '食伤生财',
            breakdown['食伤生财'] ?? 0,
            const Color(0xFF9b59b6),
          ),
          _buildScoreItem(
            '财星能量',
            breakdown['财星能量'] ?? 0,
            const Color(0xFFe67e22),
          ),
          _buildScoreItem(
            '财富库',
            breakdown['财富库'] ?? 0,
            const Color(0xFFe74c3c),
          ),
          _buildScoreItem(
            '印绶护身',
            breakdown['印绶护身'] ?? 0,
            const Color(0xFF16a085),
          ),
          _buildScoreItem(
            '自坐财库',
            breakdown['自坐财库'] ?? 0,
            const Color(0xFFf39c12),
          ),
          _buildScoreItem(
            '财气通门户',
            breakdown['财气通门户'] ?? 0,
            const Color(0xFF8e44ad),
          ),

          const SizedBox(height: 16),

          // 十神组合特效
          const Text(
            '十神组合特效',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: Colors.black87,
            ),
          ),
          const SizedBox(height: 8),
          _buildScoreItem(
            '食神生财',
            breakdown['食神生财'] ?? 0,
            const Color(0xFF27AE60),
          ),
          _buildScoreItem(
            '伤官生财',
            breakdown['伤官生财'] ?? 0,
            const Color(0xFF3498db),
          ),
          _buildScoreItem(
            '官印相生',
            breakdown['官印相生'] ?? 0,
            const Color(0xFF9b59b6),
          ),
          _buildScoreItem(
            '财官相生',
            breakdown['财官相生'] ?? 0,
            const Color(0xFFe67e22),
          ),
          _buildScoreItem(
            '比劫夺财',
            breakdown['比劫夺财'] ?? 0,
            const Color(0xFFe74c3c),
          ),

          const SizedBox(height: 16),

          // 特殊格局加分
          const Text(
            '特殊格局加分',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: Colors.black87,
            ),
          ),
          const SizedBox(height: 8),
          _buildScoreItem(
            '从财格',
            breakdown['从财格'] ?? 0,
            const Color(0xFF27AE60),
          ),
          _buildScoreItem(
            '日贵格',
            breakdown['日贵格'] ?? 0,
            const Color(0xFF3498db),
          ),
          _buildScoreItem(
            '魁罡格',
            breakdown['魁罡格'] ?? 0,
            const Color(0xFF9b59b6),
          ),
          _buildScoreItem(
            '金神格',
            breakdown['金神格'] ?? 0,
            const Color(0xFFe67e22),
          ),

          const SizedBox(height: 16),

          // 其他评分项
          const Text(
            '其他评分项',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: Colors.black87,
            ),
          ),
          const SizedBox(height: 8),
          _buildScoreItem(
            '身财平衡调整',
            breakdown['身财平衡调整'] ?? 0,
            const Color(0xFF27AE60),
          ),
          _buildScoreItem(
            '大运流年修正',
            breakdown['大运流年修正'] ?? 0,
            const Color(0xFF3498db),
          ),
          _buildScoreItem(
            '空亡扣分',
            breakdown['空亡扣分'] ?? 0,
            const Color(0xFFe74c3c),
          ),
          _buildScoreItem(
            '喜忌平衡',
            breakdown['喜忌平衡'] ?? 0,
            const Color(0xFF9b59b6),
          ),
          _buildScoreItem(
            '季节性财运潜力',
            breakdown['季节性财运潜力'] ?? 0,
            const Color(0xFFe67e22),
          ),
          _buildScoreItem(
            '财星保护',
            breakdown['财星保护'] ?? 0,
            const Color(0xFF16a085),
          ),

          const SizedBox(height: 16),

          // 总分
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFF27AE60).withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  '总分',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF27AE60),
                  ),
                ),
                Text(
                  '${(breakdown['总分'] ?? 0).toStringAsFixed(0)} 分',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF27AE60),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildWealthStarCard() {
    final breakdown =
        wealthAnalysis['breakdown'] as Map<String, dynamic>? ?? {};
    final analysis = wealthAnalysis['analysis'] as String? ?? '';

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
          const Row(
            children: [
              Icon(Icons.star_rate, color: Color(0xFF27AE60), size: 24),
              SizedBox(width: 8),
              Text(
                '财星分析',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Colors.black87,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _buildAnalysisItem('财富位置', '${breakdown['财富位置'] ?? 0} 分'),
          _buildAnalysisItem('财星能量', '${breakdown['财星能量'] ?? 0} 分'),
          _buildAnalysisItem('财星保护', '${breakdown['财星保护'] ?? 0} 分'),
          _buildAnalysisItem('财气通门户', '${breakdown['财气通门户'] ?? 0} 分'),
          if (analysis.isNotEmpty) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFF27AE60).withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                analysis,
                style: const TextStyle(
                  fontSize: 12,
                  color: Colors.black87,
                  height: 1.4,
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildWealthVaultCard() {
    final breakdown =
        wealthAnalysis['breakdown'] as Map<String, dynamic>? ?? {};
    final analysis = wealthAnalysis['analysis'] as String? ?? '';

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
          const Row(
            children: [
              Icon(Icons.account_balance, color: Color(0xFF3498db), size: 24),
              SizedBox(width: 8),
              Text(
                '财库分析',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Colors.black87,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _buildAnalysisItem('财富库', '${breakdown['财富库'] ?? 0} 分'),
          _buildAnalysisItem('自坐财库', '${breakdown['自坐财库'] ?? 0} 分'),
          _buildAnalysisItem('从财格', '${breakdown['从财格'] ?? 0} 分'),
          if (analysis.isNotEmpty) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFF3498db).withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                analysis,
                style: const TextStyle(
                  fontSize: 12,
                  color: Colors.black87,
                  height: 1.4,
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildWealthTimingCard() {
    final breakdown =
        wealthAnalysis['breakdown'] as Map<String, dynamic>? ?? {};
    final analysis = wealthAnalysis['analysis'] as String? ?? '';

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
          const Row(
            children: [
              Icon(Icons.schedule, color: Color(0xFFe67e22), size: 24),
              SizedBox(width: 8),
              Text(
                '财运时机',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Colors.black87,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _buildAnalysisItem('大运流年修正', '${breakdown['大运流年修正'] ?? 0} 分'),
          _buildAnalysisItem('季节性财运潜力', '${breakdown['季节性财运潜力'] ?? 0} 分'),
          _buildAnalysisItem('身财平衡调整', '${breakdown['身财平衡调整'] ?? 0} 分'),
          if (analysis.isNotEmpty) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFe67e22).withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                analysis,
                style: const TextStyle(
                  fontSize: 12,
                  color: Colors.black87,
                  height: 1.4,
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildWealthAdviceCard() {
    // 处理 advice 字段的类型，可能是 String 或 List<String>
    final adviceData = wealthAnalysis['advice'];
    String advice = '';

    if (adviceData is String) {
      advice = adviceData;
    } else if (adviceData is List<String>) {
      advice = adviceData.join('\n');
    } else if (adviceData is List) {
      advice = adviceData.map((e) => e.toString()).join('\n');
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
          const Row(
            children: [
              Icon(Icons.lightbulb, color: Color(0xFFf39c12), size: 24),
              SizedBox(width: 8),
              Text(
                '求财建议',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Colors.black87,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (advice.isNotEmpty) ...[
            _buildAdviceContent(advice),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: _shareWealthAnalysis,
                icon: const Icon(Icons.share, size: 18),
                label: const Text('分享求财建议'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.green.shade600,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
              ),
            ),
          ] else if (_isLoadingAdvice)
            const Row(
              children: [
                SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    valueColor: AlwaysStoppedAnimation<Color>(
                      Color(0xFFf39c12),
                    ),
                  ),
                ),
                SizedBox(width: 12),
                Text(
                  '正在生成个性化求财建议...',
                  style: TextStyle(fontSize: 14, color: Colors.grey),
                ),
              ],
            )
          else
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  '点击下方按钮获取基于您八字的专业求财建议',
                  style: TextStyle(fontSize: 14, color: Colors.grey),
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _getWealthAdvice,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFf39c12),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    child: const Text(
                      '获取求财建议',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
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

  Widget _buildScoreItem(String label, num score, Color color) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: const TextStyle(fontSize: 14, color: Colors.black87),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(4),
            ),
            child: Text(
              '${score.toStringAsFixed(0)} 分',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAnalysisItem(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: const TextStyle(fontSize: 14, color: Colors.black87),
          ),
          Text(
            value,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.bold,
              color: Colors.black54,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAdviceContent(String advice) {
    // 尝试解析三个板块的内容
    final sections = _parseAdviceSections(advice);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (sections['score_analysis']?.isNotEmpty == true)
          _buildAdviceSection(
            '命主财富等级评分分析',
            sections['score_analysis']!,
            Icons.assessment,
            const Color(0xFF3498db),
          ),
        if (sections['decade_advice']?.isNotEmpty == true)
          _buildAdviceSection(
            '当前十年大运求财建议',
            sections['decade_advice']!,
            Icons.trending_up,
            const Color(0xFF27ae60),
          ),
        if (sections['year_advice']?.isNotEmpty == true)
          _buildAdviceSection(
            '今年求财建议',
            sections['year_advice']!,
            Icons.calendar_today,
            const Color(0xFFf39c12),
          ),
        // 如果无法解析出三个板块，则显示原始内容
        if (sections.values.every((v) => v?.isEmpty != false))
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.grey.shade50,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Colors.grey.shade200),
            ),
            child: _buildFormattedContent(_cleanAndFormatContent(advice)),
          ),
      ],
    );
  }

  Widget _buildAdviceSection(
    String title,
    String content,
    IconData icon,
    Color color,
  ) {
    // 清理和格式化内容
    final cleanedContent = _cleanAndFormatContent(content);

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withOpacity(0.05),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: color, size: 20),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  title,
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: color,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          _buildFormattedContent(cleanedContent),
        ],
      ),
    );
  }

  // 准备Markdown内容（保留Markdown格式）
  String _prepareMarkdownContent(String content) {
    // 移除免责声明
    String cleaned = content.replaceAll(RegExp(r'以上内容由.*?生成.*?仅供参考.*?'), '');
    cleaned = cleaned.replaceAll(RegExp(r'.*?DeepSeek.*?生成.*?'), '');
    cleaned = cleaned.replaceAll(RegExp(r'仅供参考.*'), '');

    // 移除乱码符号但保留Markdown格式
    cleaned = cleaned.replaceAll(
      RegExp(r'\\\d+:?'),
      '',
    ); // 移除 \1:, \2:, \1, \2 等
    cleaned = cleaned.replaceAll(RegExp(r'\\\d+'), ''); // 移除 \1, \2 等数字转义符
    cleaned = cleaned.replaceAll(RegExp(r'\\1:?'), ''); // 特别移除 \1 和 \1: 符号
    cleaned = cleaned.replaceAll(RegExp(r'\\\d'), ''); // 移除单独的数字转义符
    cleaned = cleaned.replaceAll(RegExp(r'\s+\\\d+:?\s*'), ' '); // 移除前后有空格的转义符
    cleaned = cleaned.replaceAll(RegExp(r'--+'), ''); // 移除多个连字符
    cleaned = cleaned.replaceAll(RegExp(r'==+'), ''); // 移除多个等号
    cleaned = cleaned.replaceAll(RegExp(r'\|+'), ''); // 移除竖线符号
    cleaned = cleaned.replaceAll(RegExp(r'[_~`]+'), ''); // 移除下划线、波浪线、反引号
    cleaned = cleaned.replaceAll(RegExp(r'\n\s*\n\s*\n+'), '\n\n'); // 移除多余空行
    cleaned = cleaned.replaceAll(
      RegExp(r'^\s*[\-=*_]+\s*$', multiLine: true),
      '',
    ); // 移除只有符号的行

    // 转换为标准Markdown格式
    // 将中文数字标题转换为Markdown标题
    cleaned = cleaned.replaceAll(
      RegExp(r'^([一二三四五六七八九十]+、.*)$', multiLine: true),
      r'## \1',
    );
    cleaned = cleaned.replaceAll(
      RegExp(r'^(\([一二三四五六七八九十]+\).*)$', multiLine: true),
      r'### \1',
    );

    // 确保列表项格式正确
    cleaned = cleaned.replaceAll(RegExp(r'^\s*[•·]\s*', multiLine: true), '- ');

    return cleaned.trim();
  }

  // 保留原有的清理方法以兼容性
  String _cleanAndFormatContent(String content) {
    return _prepareMarkdownContent(content);
  }

  // 构建格式化的内容（使用Markdown渲染）
  Widget _buildFormattedContent(String content) {
    return MarkdownBody(
      data: content,
      styleSheet: MarkdownStyleSheet(
        // 自定义样式
        h1: const TextStyle(
          fontSize: 18,
          fontWeight: FontWeight.bold,
          color: Color(0xFF1F2937),
          height: 1.4,
        ),
        h2: const TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.bold,
          color: Color(0xFF6366F1),
          height: 1.4,
        ),
        h3: const TextStyle(
          fontSize: 15,
          fontWeight: FontWeight.w600,
          color: Color(0xFF8B5CF6),
          height: 1.4,
        ),
        p: const TextStyle(fontSize: 14, color: Colors.black87, height: 1.6),
        listBullet: const TextStyle(
          fontSize: 14,
          color: Color(0xFF10B981),
          height: 1.6,
        ),
        strong: const TextStyle(
          fontWeight: FontWeight.bold,
          color: Color(0xFF1F2937),
        ),
        em: const TextStyle(
          fontStyle: FontStyle.italic,
          color: Color(0xFF6B7280),
        ),
        blockquote: const TextStyle(
          fontSize: 14,
          color: Color(0xFF6B7280),
          fontStyle: FontStyle.italic,
        ),
        code: const TextStyle(
          fontSize: 13,
          fontFamily: 'monospace',
          backgroundColor: Color(0xFFF3F4F6),
        ),
      ),
      selectable: true,
    );
  }

  // 判断是否为主标题（一、二、三等）
  bool _isMainTitle(String line) {
    // 中文数字开头的主标题
    if (RegExp(r'^[一二三四五六七八九十][、.]').hasMatch(line)) return true;
    // 数字开头的主标题
    if (RegExp(r'^\d+[、.]').hasMatch(line)) return true;

    return false;
  }

  // 判断是否为副标题
  bool _isSubTitle(String line) {
    // 括号数字开头
    if (RegExp(r'^\([一二三四五六七八九十\d]+\)').hasMatch(line)) return true;
    // 短行且以冒号结尾
    if (line.length < 20 && line.endsWith('：')) return true;
    // 特定关键词开头
    if (RegExp(r'^(建议|注意|重点|要点|总结)').hasMatch(line)) return true;

    return false;
  }

  // 判断是否为标题（保留原方法以防其他地方使用）
  bool _isTitle(String line) {
    return _isMainTitle(line) || _isSubTitle(line);
  }

  Map<String, String?> _parseAdviceSections(String advice) {
    final Map<String, String?> sections = {
      'score_analysis': null,
      'decade_advice': null,
      'year_advice': null,
    };

    // 尝试按照标题分割内容
    final patterns = {
      'score_analysis': [r'一[、.]?\s*命主财富等级评分分析', r'命主财富等级评分分析', r'财富等级.*?分析'],
      'decade_advice': [
        r'二[、.]?\s*当前十年大运求财建议',
        r'当前十年大运求财建议',
        r'十年.*?大运.*?建议',
        r'大运.*?求财.*?建议',
      ],
      'year_advice': [r'三[、.]?\s*今年求财建议', r'今年求财建议', r'今年.*?建议'],
    };

    for (final entry in patterns.entries) {
      final key = entry.key;
      final patternList = entry.value;

      for (final pattern in patternList) {
        final regex = RegExp(pattern, caseSensitive: false);
        final match = regex.firstMatch(advice);
        if (match != null) {
          final startIndex = match.start;
          // 找到下一个标题的位置
          int? endIndex;
          for (final otherEntry in patterns.entries) {
            if (otherEntry.key == key) continue;
            for (final otherPattern in otherEntry.value) {
              final otherRegex = RegExp(otherPattern, caseSensitive: false);
              final otherMatch = otherRegex.firstMatch(
                advice.substring(startIndex + match.group(0)!.length),
              );
              if (otherMatch != null) {
                final otherStartIndex =
                    startIndex + match.group(0)!.length + otherMatch.start;
                if (endIndex == null || otherStartIndex < endIndex) {
                  endIndex = otherStartIndex;
                }
              }
            }
          }

          final content = advice
              .substring(
                startIndex + match.group(0)!.length,
                endIndex ?? advice.length,
              )
              .trim();

          if (content.isNotEmpty) {
            sections[key] = content;
          }
          break;
        }
      }
    }

    return sections;
  }
}
