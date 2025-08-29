import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:provider/provider.dart';
import '../../models/bazi_models.dart';
import '../bazi_webview_screen.dart';
import '../../widgets/strength_analysis_card.dart';
import '../../services/strength_analysis_service.dart';
import '../../services/unlock_service.dart';
import '../../services/auth_service.dart';
import '../analysis/mingge_analysis_screen.dart';
import '../analysis/wealth_analysis_screen.dart';

class BaziResultScreen extends StatefulWidget {
  final BaziInput input;
  final BaziResult result;

  const BaziResultScreen({
    super.key,
    required this.input,
    required this.result,
  });

  @override
  State<BaziResultScreen> createState() => _BaziResultScreenState();
}

class _BaziResultScreenState extends State<BaziResultScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  bool _isProfessionalAnalysisExpanded = false;
  bool _isComboAnalysisExpanded = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      appBar: AppBar(
        title: Text('${widget.input.name}的八字'),
        backgroundColor: Colors.orange.shade600,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 基本信息卡片
              _buildBasicInfoCard(),
              const SizedBox(height: 16),

              // 八字排盘卡片
              _buildBaziChartCard(),
              const SizedBox(height: 16),

              // 五行分析卡片
              _buildElementsAnalysisCard(),
              const SizedBox(height: 16),

              // 十神分析卡片
              _buildTenGodsCard(),
              const SizedBox(height: 16),

              // 运势评分卡片
              _buildLuckTimingCard(),
              const SizedBox(height: 16),

              // 身强身弱分析卡片
              _buildStrengthAnalysisCard(),
              const SizedBox(height: 16),

              // 用户余额和付费说明
              _buildBalanceAndPaymentInfo(),
              const SizedBox(height: 12),

              // 命格等级和财富等级banner按键
              _buildLevelBannerButtons(),
              const SizedBox(height: 16),

              // 详细分析按钮
              _buildDetailedAnalysisButtons(context),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildBasicInfoCard() {
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
          Row(
            children: [
              Icon(
                widget.input.gender == '男' ? Icons.male : Icons.female,
                color: Colors.white,
                size: 24,
              ),
              const SizedBox(width: 8),
              Text(
                widget.input.name,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            '出生时间：${_formatDateTime(widget.input.birthDate)} ${widget.input.birthTime}',
            style: const TextStyle(color: Colors.white70, fontSize: 16),
          ),
          Text(
            '历法：${widget.input.isLunar ? "农历" : "公历"}',
            style: const TextStyle(color: Colors.white70, fontSize: 16),
          ),
        ],
      ),
    );
  }

  Widget _buildBaziChartCard() {
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
              Icon(Icons.grid_view, color: Colors.orange.shade600, size: 24),
              const SizedBox(width: 8),
              const Text(
                '八字排盘',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // 四柱表格
          Table(
            border: TableBorder.all(color: Colors.grey.shade300, width: 1),
            children: [
              // 表头
              TableRow(
                decoration: BoxDecoration(color: Colors.grey.shade100),
                children: const [
                  _TableCell('年柱', isHeader: true),
                  _TableCell('月柱', isHeader: true),
                  _TableCell('日柱', isHeader: true),
                  _TableCell('时柱', isHeader: true),
                ],
              ),
              // 四柱
              TableRow(
                children: [
                  _TableCell(widget.result.paipan.yearPillar),
                  _TableCell(widget.result.paipan.monthPillar),
                  _TableCell(widget.result.paipan.dayPillar),
                  _TableCell(widget.result.paipan.hourPillar),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildElementsAnalysisCard() {
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
              Icon(Icons.radar, color: Colors.green.shade600, size: 24),
              const SizedBox(width: 8),
              const Text(
                '五行分布分析',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Tab切换
          DefaultTabController(
            length: 2,
            child: Column(
              children: [
                TabBar(
                  labelColor: Colors.green.shade600,
                  unselectedLabelColor: Colors.grey,
                  indicatorColor: Colors.green.shade600,
                  tabs: const [
                    Tab(text: '原命局五行分布'),
                    Tab(text: '当前五行分布'),
                  ],
                ),
                const SizedBox(height: 16),
                SizedBox(
                  height: 520,
                  child: TabBarView(
                    children: [
                      _buildOriginalWuxingTab(),
                      _buildCurrentWuxingTab(),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  List<RadarEntry> _getRadarDataEntries() {
    final elements = ['木', '火', '土', '金', '水'];
    final maxValue = widget.result.wuxing.elements.values.isNotEmpty
        ? widget.result.wuxing.elements.values
              .reduce((a, b) => a > b ? a : b)
              .toDouble()
        : 1.0;

    return elements.map((element) {
      final count = widget.result.wuxing.elements[element] ?? 0;
      // 将数值标准化到0-100范围，确保雷达图显示效果
      final normalizedValue = maxValue > 0 ? (count / maxValue * 100) : 0.0;
      return RadarEntry(value: normalizedValue.clamp(0, 100));
    }).toList();
  }

  Widget _buildOriginalWuxingTab() {
    return Column(
      children: [
        // 雷达图
        SizedBox(
          height: 250,
          child: RadarChart(
            RadarChartData(
              radarTouchData: RadarTouchData(enabled: true),
              dataSets: [
                RadarDataSet(
                  fillColor: Colors.green.withOpacity(0.2),
                  borderColor: Colors.green,
                  entryRadius: 3,
                  dataEntries: _getRadarDataEntries(),
                  borderWidth: 2,
                ),
              ],
              radarBorderData: BorderSide(
                color: Colors.grey.shade300,
                width: 1,
              ),
              titlePositionPercentageOffset: 0.2,
              titleTextStyle: const TextStyle(
                color: Colors.black87,
                fontSize: 14,
                fontWeight: FontWeight.w500,
              ),
              getTitle: (index, angle) {
                final titles = ['木', '火', '土', '金', '水'];
                return RadarChartTitle(text: titles[index], angle: angle);
              },
              tickCount: 5,
              ticksTextStyle: const TextStyle(color: Colors.grey, fontSize: 10),
              tickBorderData: BorderSide(color: Colors.grey.shade200, width: 1),
              gridBorderData: BorderSide(color: Colors.grey.shade200, width: 1),
            ),
          ),
        ),

        const SizedBox(height: 12),

        // 五行数值显示
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: widget.result.wuxing.elements.entries
              .map((entry) => _buildElementIndicator(entry.key, entry.value))
              .toList(),
        ),

        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.blue.shade50,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '五行平衡：${widget.result.wuxing.balance}',
                style: TextStyle(
                  color: Colors.blue.shade700,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                _getOriginalWuxingAnalysis(),
                style: TextStyle(
                  color: Colors.blue.shade600,
                  fontSize: 13,
                  height: 1.4,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildCurrentWuxingTab() {
    // 计算当前五行分布（包含大运和流年影响）
    Map<String, int> currentWuxing = _calculateCurrentWuxing();

    return Column(
      children: [
        // 雷达图
        SizedBox(
          height: 250,
          child: RadarChart(
            RadarChartData(
              radarTouchData: RadarTouchData(enabled: true),
              dataSets: [
                RadarDataSet(
                  fillColor: Colors.orange.withOpacity(0.2),
                  borderColor: Colors.orange,
                  entryRadius: 3,
                  dataEntries: _getCurrentRadarDataEntries(currentWuxing),
                  borderWidth: 2,
                ),
              ],
              radarBorderData: BorderSide(
                color: Colors.grey.shade300,
                width: 1,
              ),
              titlePositionPercentageOffset: 0.2,
              titleTextStyle: const TextStyle(
                color: Colors.black87,
                fontSize: 14,
                fontWeight: FontWeight.w500,
              ),
              getTitle: (index, angle) {
                final titles = ['木', '火', '土', '金', '水'];
                return RadarChartTitle(text: titles[index], angle: angle);
              },
              tickCount: 5,
              ticksTextStyle: const TextStyle(color: Colors.grey, fontSize: 10),
              tickBorderData: BorderSide(color: Colors.grey.shade200, width: 1),
              gridBorderData: BorderSide(color: Colors.grey.shade200, width: 1),
            ),
          ),
        ),

        const SizedBox(height: 12),

        // 当前五行数值显示
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: currentWuxing.entries
              .map(
                (entry) =>
                    _buildCurrentElementIndicator(entry.key, entry.value),
              )
              .toList(),
        ),

        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.orange.shade50,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '当前五行平衡：${_calculateCurrentBalance(currentWuxing)}',
                style: TextStyle(
                  color: Colors.orange.shade700,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                _getCurrentWuxingAnalysis(currentWuxing),
                style: TextStyle(
                  color: Colors.orange.shade600,
                  fontSize: 13,
                  height: 1.4,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildElementIndicator(String element, int count) {
    final colors = {
      '木': Colors.green,
      '火': Colors.red,
      '土': Colors.brown,
      '金': Colors.amber,
      '水': Colors.blue,
    };

    final color = colors[element] ?? Colors.grey;

    return Column(
      children: [
        Container(
          width: 32,
          height: 32,
          decoration: BoxDecoration(
            color: color.withOpacity(0.2),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: color, width: 2),
          ),
          child: Center(
            child: Text(
              element,
              style: TextStyle(
                color: color,
                fontWeight: FontWeight.bold,
                fontSize: 14,
              ),
            ),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          count.toString(),
          style: TextStyle(
            color: color,
            fontWeight: FontWeight.w600,
            fontSize: 16,
          ),
        ),
      ],
    );
  }

  Widget _buildCurrentElementIndicator(String element, int value) {
    final colors = {
      '木': Colors.green,
      '火': Colors.red,
      '土': Colors.brown,
      '金': Colors.amber,
      '水': Colors.blue,
    };

    final color = colors[element] ?? Colors.grey;

    return Column(
      children: [
        Container(
          width: 32,
          height: 32,
          decoration: BoxDecoration(
            color: color.withOpacity(0.3),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: color, width: 2),
          ),
          child: Center(
            child: Text(
              element,
              style: TextStyle(
                color: color,
                fontWeight: FontWeight.bold,
                fontSize: 14,
              ),
            ),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          value.toString(),
          style: TextStyle(
            color: color,
            fontWeight: FontWeight.w600,
            fontSize: 16,
          ),
        ),
      ],
    );
  }

  Map<String, int> _calculateCurrentWuxing() {
    // 复制原始五行分布
    Map<String, int> currentWuxing = Map.from(widget.result.wuxing.elements);

    // 获取当前大运和流年的五行属性
    String currentDayun = _extractDayunGanZhi(_calculateCurrentDayun());
    String currentLiunian = _calculateCurrentLiunian();

    // 添加大运的五行影响
    if (currentDayun.length >= 2) {
      String dayunGan = currentDayun[0];
      String dayunZhi = currentDayun[1];

      String ganElement = _getElementFromGan(dayunGan);
      String zhiElement = _getElementFromZhi(dayunZhi);

      currentWuxing[ganElement] = (currentWuxing[ganElement] ?? 0) + 1;
      currentWuxing[zhiElement] = (currentWuxing[zhiElement] ?? 0) + 1;
    }

    // 添加流年的五行影响
    if (currentLiunian.length >= 2) {
      String liunianGan = currentLiunian[0];
      String liunianZhi = currentLiunian[1];

      String ganElement = _getElementFromGan(liunianGan);
      String zhiElement = _getElementFromZhi(liunianZhi);

      currentWuxing[ganElement] = (currentWuxing[ganElement] ?? 0) + 1;
      currentWuxing[zhiElement] = (currentWuxing[zhiElement] ?? 0) + 1;
    }

    return currentWuxing;
  }

  String _getElementFromGan(String gan) {
    const ganElements = {
      '甲': '木',
      '乙': '木',
      '丙': '火',
      '丁': '火',
      '戊': '土',
      '己': '土',
      '庚': '金',
      '辛': '金',
      '壬': '水',
      '癸': '水',
    };
    return ganElements[gan] ?? '土';
  }

  String _getElementFromZhi(String zhi) {
    const zhiElements = {
      '子': '水',
      '丑': '土',
      '寅': '木',
      '卯': '木',
      '辰': '土',
      '巳': '火',
      '午': '火',
      '未': '土',
      '申': '金',
      '酉': '金',
      '戌': '土',
      '亥': '水',
    };
    return zhiElements[zhi] ?? '土';
  }

  List<RadarEntry> _getCurrentRadarDataEntries(Map<String, int> currentWuxing) {
    final elements = ['木', '火', '土', '金', '水'];
    final maxValue = currentWuxing.values.isNotEmpty
        ? currentWuxing.values.reduce((a, b) => a > b ? a : b).toDouble()
        : 1.0;

    return elements.map((element) {
      final count = currentWuxing[element] ?? 0;
      final normalizedValue = maxValue > 0 ? (count / maxValue * 100) : 0.0;
      return RadarEntry(value: normalizedValue.clamp(0, 100));
    }).toList();
  }

  String _calculateCurrentBalance(Map<String, int> currentWuxing) {
    final values = currentWuxing.values.toList();
    if (values.isEmpty) return '平衡';

    final max = values.reduce((a, b) => a > b ? a : b);
    final min = values.reduce((a, b) => a < b ? a : b);
    final diff = max - min;

    if (diff <= 1) return '非常平衡';
    if (diff <= 2) return '较为平衡';
    if (diff <= 3) return '略有偏颇';
    return '失衡较重';
  }

  String _getOriginalWuxingAnalysis() {
    final elements = widget.result.wuxing.elements;
    final maxElement = elements.entries.reduce(
      (a, b) => a.value > b.value ? a : b,
    );
    final minElement = elements.entries.reduce(
      (a, b) => a.value < b.value ? a : b,
    );

    String analysis =
        '原命局中${maxElement.key}最旺（${maxElement.value}个），${minElement.key}最弱（${minElement.value}个）。';

    // 根据五行强弱给出建议
    if (maxElement.value - minElement.value >= 3) {
      analysis += '五行失衡明显，建议在生活中多接触${minElement.key}属性的事物来平衡运势。';
    } else if (maxElement.value - minElement.value >= 2) {
      analysis += '五行略有偏颇，可适当调节${minElement.key}属性来改善运势。';
    } else {
      analysis += '五行分布相对均衡，整体运势较为稳定。';
    }

    return analysis;
  }

  String _getCurrentWuxingAnalysis(Map<String, int> currentWuxing) {
    final maxElement = currentWuxing.entries.reduce(
      (a, b) => a.value > b.value ? a : b,
    );
    final minElement = currentWuxing.entries.reduce(
      (a, b) => a.value < b.value ? a : b,
    );

    String analysis =
        '当前运势中${maxElement.key}最旺（${maxElement.value}个），${minElement.key}最弱（${minElement.value}个）。';

    // 与原命局对比
    final originalElements = widget.result.wuxing.elements;
    final originalMax = originalElements.entries.reduce(
      (a, b) => a.value > b.value ? a : b,
    );

    if (maxElement.key != originalMax.key) {
      analysis += '相比原命局，当前${maxElement.key}得到加强，运势重心发生转移。';
    } else {
      analysis += '与原命局趋势一致，${maxElement.key}继续保持优势。';
    }

    // 给出当前时期的建议
    if (maxElement.value - minElement.value >= 4) {
      analysis += '当前时期五行极不平衡，需特别注意${minElement.key}属性的补充。';
    } else if (maxElement.value - minElement.value >= 3) {
      analysis += '当前时期宜多关注${minElement.key}相关的事务。';
    } else {
      analysis += '当前时期五行相对平衡，是发展的好时机。';
    }

    return analysis;
  }

  Widget _buildTenGodsCard() {
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
              Icon(Icons.psychology, color: Colors.purple.shade600, size: 24),
              const SizedBox(width: 8),
              const Text(
                '十神分析',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // 十神详细表格
          _buildTenGodsDetailTable(),
          const SizedBox(height: 16),

          // 地支藏干十神分析
          _buildHiddenStemsTenGods(),
          const SizedBox(height: 16),

          // 十神专业分析
          _buildTenGodsProfessionalAnalysis(),
          const SizedBox(height: 16),

          // 十神组合分析
          _buildTenGodsComboAnalysis(),
        ],
      ),
    );
  }

  // 获取十神关系
  String _getTenGodRelation(String dayMaster, String otherGan) {
    const tenGodMap = {
      '甲': {
        '甲': '比肩',
        '乙': '劫财',
        '丙': '食神',
        '丁': '伤官',
        '戊': '偏财',
        '己': '正财',
        '庚': '七杀',
        '辛': '正官',
        '壬': '偏印',
        '癸': '正印',
      },
      '乙': {
        '甲': '劫财',
        '乙': '比肩',
        '丙': '伤官',
        '丁': '食神',
        '戊': '正财',
        '己': '偏财',
        '庚': '正官',
        '辛': '七杀',
        '壬': '正印',
        '癸': '偏印',
      },
      '丙': {
        '甲': '偏印',
        '乙': '正印',
        '丙': '比肩',
        '丁': '劫财',
        '戊': '食神',
        '己': '伤官',
        '庚': '偏财',
        '辛': '正财',
        '壬': '七杀',
        '癸': '正官',
      },
      '丁': {
        '甲': '正印',
        '乙': '偏印',
        '丙': '劫财',
        '丁': '比肩',
        '戊': '伤官',
        '己': '食神',
        '庚': '正财',
        '辛': '偏财',
        '壬': '正官',
        '癸': '七杀',
      },
      '戊': {
        '甲': '七杀',
        '乙': '正官',
        '丙': '偏印',
        '丁': '正印',
        '戊': '比肩',
        '己': '劫财',
        '庚': '食神',
        '辛': '伤官',
        '壬': '偏财',
        '癸': '正财',
      },
      '己': {
        '甲': '正官',
        '乙': '七杀',
        '丙': '正印',
        '丁': '偏印',
        '戊': '劫财',
        '己': '比肩',
        '庚': '伤官',
        '辛': '食神',
        '壬': '正财',
        '癸': '偏财',
      },
      '庚': {
        '甲': '偏财',
        '乙': '正财',
        '丙': '七杀',
        '丁': '正官',
        '戊': '偏印',
        '己': '正印',
        '庚': '比肩',
        '辛': '劫财',
        '壬': '食神',
        '癸': '伤官',
      },
      '辛': {
        '甲': '正财',
        '乙': '偏财',
        '丙': '正官',
        '丁': '七杀',
        '戊': '正印',
        '己': '偏印',
        '庚': '劫财',
        '辛': '比肩',
        '壬': '伤官',
        '癸': '食神',
      },
      '壬': {
        '甲': '食神',
        '乙': '伤官',
        '丙': '偏财',
        '丁': '正财',
        '戊': '七杀',
        '己': '正官',
        '庚': '偏印',
        '辛': '正印',
        '壬': '比肩',
        '癸': '劫财',
      },
      '癸': {
        '甲': '伤官',
        '乙': '食神',
        '丙': '正财',
        '丁': '偏财',
        '戊': '正官',
        '己': '七杀',
        '庚': '正印',
        '辛': '偏印',
        '壬': '劫财',
        '癸': '比肩',
      },
    };
    return tenGodMap[dayMaster]?[otherGan] ?? '';
  }

  // 获取地支主气
  String _getZhiMainQi(String zhi) {
    const zhiMainQiMap = {
      '子': '癸',
      '丑': '己',
      '寅': '甲',
      '卯': '乙',
      '辰': '戊',
      '巳': '丙',
      '午': '丁',
      '未': '己',
      '申': '庚',
      '酉': '辛',
      '戌': '戊',
      '亥': '壬',
    };
    return zhiMainQiMap[zhi] ?? '';
  }

  // 构建十神详细表格
  Widget _buildTenGodsDetailTable() {
    final yearPillar = widget.result.paipan.yearPillar;
    final monthPillar = widget.result.paipan.monthPillar;
    final dayPillar = widget.result.paipan.dayPillar;
    final hourPillar = widget.result.paipan.hourPillar;
    final dayMaster = widget.result.paipan.dayMaster;

    // 获取天干十神关系
    String getGanTenGod(String pillar, int index) {
      if (pillar.isEmpty) return '';
      if (index == 2) return '日主'; // 日柱天干是日主
      return _getTenGodRelation(dayMaster, pillar[0]);
    }

    // 获取地支十神关系（取主气）
    String getZhiTenGod(String pillar) {
      if (pillar.length < 2) return '';
      final zhiMainQi = _getZhiMainQi(pillar[1]);
      return _getTenGodRelation(dayMaster, zhiMainQi);
    }

    return Container(
      decoration: BoxDecoration(
        border: Border.all(color: Colors.purple.shade200),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        children: [
          // 表头
          Container(
            padding: const EdgeInsets.symmetric(vertical: 12),
            decoration: BoxDecoration(
              color: Colors.purple.shade50,
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(8),
                topRight: Radius.circular(8),
              ),
            ),
            child: const Row(
              children: [
                Expanded(
                  child: Center(
                    child: Text(
                      '四柱',
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
                Expanded(
                  child: Center(
                    child: Text(
                      '年柱',
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
                Expanded(
                  child: Center(
                    child: Text(
                      '月柱',
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
                Expanded(
                  child: Center(
                    child: Text(
                      '日柱',
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
                Expanded(
                  child: Center(
                    child: Text(
                      '时柱',
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
              ],
            ),
          ),
          // 天干行
          Container(
            padding: const EdgeInsets.symmetric(vertical: 8),
            child: Row(
              children: [
                const Expanded(
                  child: Center(
                    child: Text(
                      '天干',
                      style: TextStyle(fontWeight: FontWeight.w500),
                    ),
                  ),
                ),
                Expanded(
                  child: Center(
                    child: Text(
                      yearPillar.isNotEmpty ? yearPillar[0] : '',
                      style: const TextStyle(fontSize: 16),
                    ),
                  ),
                ),
                Expanded(
                  child: Center(
                    child: Text(
                      monthPillar.isNotEmpty ? monthPillar[0] : '',
                      style: const TextStyle(fontSize: 16),
                    ),
                  ),
                ),
                Expanded(
                  child: Center(
                    child: Text(
                      dayPillar.isNotEmpty ? dayPillar[0] : '',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Colors.red,
                      ),
                    ),
                  ),
                ),
                Expanded(
                  child: Center(
                    child: Text(
                      hourPillar.isNotEmpty ? hourPillar[0] : '',
                      style: const TextStyle(fontSize: 16),
                    ),
                  ),
                ),
              ],
            ),
          ),
          // 地支行
          Container(
            padding: const EdgeInsets.symmetric(vertical: 8),
            decoration: BoxDecoration(color: Colors.grey.shade50),
            child: Row(
              children: [
                const Expanded(
                  child: Center(
                    child: Text(
                      '地支',
                      style: TextStyle(fontWeight: FontWeight.w500),
                    ),
                  ),
                ),
                Expanded(
                  child: Center(
                    child: Text(
                      yearPillar.length > 1 ? yearPillar[1] : '',
                      style: const TextStyle(fontSize: 16),
                    ),
                  ),
                ),
                Expanded(
                  child: Center(
                    child: Text(
                      monthPillar.length > 1 ? monthPillar[1] : '',
                      style: const TextStyle(fontSize: 16),
                    ),
                  ),
                ),
                Expanded(
                  child: Center(
                    child: Text(
                      dayPillar.length > 1 ? dayPillar[1] : '',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Colors.red,
                      ),
                    ),
                  ),
                ),
                Expanded(
                  child: Center(
                    child: Text(
                      hourPillar.length > 1 ? hourPillar[1] : '',
                      style: const TextStyle(fontSize: 16),
                    ),
                  ),
                ),
              ],
            ),
          ),
          // 天干十神行
          Container(
            padding: const EdgeInsets.symmetric(vertical: 8),
            child: Row(
              children: [
                const Expanded(
                  child: Center(
                    child: Text(
                      '天干十神',
                      style: TextStyle(
                        fontWeight: FontWeight.w500,
                        color: Colors.purple,
                      ),
                    ),
                  ),
                ),
                Expanded(
                  child: Center(
                    child: Text(
                      getGanTenGod(yearPillar, 0),
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.purple.shade700,
                      ),
                    ),
                  ),
                ),
                Expanded(
                  child: Center(
                    child: Text(
                      getGanTenGod(monthPillar, 1),
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.purple.shade700,
                      ),
                    ),
                  ),
                ),
                Expanded(
                  child: Center(
                    child: Text(
                      '日主',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: Colors.red.shade700,
                      ),
                    ),
                  ),
                ),
                Expanded(
                  child: Center(
                    child: Text(
                      getGanTenGod(hourPillar, 3),
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.purple.shade700,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          // 地支十神行
          Container(
            padding: const EdgeInsets.symmetric(vertical: 8),
            decoration: BoxDecoration(
              color: Colors.grey.shade50,
              borderRadius: const BorderRadius.only(
                bottomLeft: Radius.circular(8),
                bottomRight: Radius.circular(8),
              ),
            ),
            child: Row(
              children: [
                const Expanded(
                  child: Center(
                    child: Text(
                      '地支十神',
                      style: TextStyle(
                        fontWeight: FontWeight.w500,
                        color: Colors.purple,
                      ),
                    ),
                  ),
                ),
                Expanded(
                  child: Center(
                    child: Text(
                      getZhiTenGod(yearPillar),
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.purple.shade700,
                      ),
                    ),
                  ),
                ),
                Expanded(
                  child: Center(
                    child: Text(
                      getZhiTenGod(monthPillar),
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.purple.shade700,
                      ),
                    ),
                  ),
                ),
                Expanded(
                  child: Center(
                    child: Text(
                      getZhiTenGod(dayPillar),
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.purple.shade700,
                      ),
                    ),
                  ),
                ),
                Expanded(
                  child: Center(
                    child: Text(
                      getZhiTenGod(hourPillar),
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.purple.shade700,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // 构建地支藏干十神分析
  Widget _buildHiddenStemsTenGods() {
    final yearPillar = widget.result.paipan.yearPillar;
    final monthPillar = widget.result.paipan.monthPillar;
    final dayPillar = widget.result.paipan.dayPillar;
    final hourPillar = widget.result.paipan.hourPillar;
    final dayMaster = widget.result.paipan.dayMaster;

    // 地支藏干映射
    const zhiHiddenStems = {
      '子': ['癸'],
      '丑': ['己', '癸', '辛'],
      '寅': ['甲', '丙', '戊'],
      '卯': ['乙'],
      '辰': ['戊', '乙', '癸'],
      '巳': ['丙', '庚', '戊'],
      '午': ['丁', '己'],
      '未': ['己', '丁', '乙'],
      '申': ['庚', '壬', '戊'],
      '酉': ['辛'],
      '戌': ['戊', '辛', '丁'],
      '亥': ['壬', '甲'],
    };

    // 构建单个柱的地支藏干分析
    Widget buildPillarHiddenStems(
      String pillarName,
      String pillar,
      Color accentColor,
    ) {
      if (pillar.length < 2) return const SizedBox.shrink();
      final zhi = pillar[1];
      final hiddenStems = zhiHiddenStems[zhi] ?? [];

      return Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: accentColor.withOpacity(0.3)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 柱名和地支
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: accentColor,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    pillarName,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  '地支：$zhi',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: accentColor,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            // 藏干和十神
            Wrap(
              spacing: 8,
              runSpacing: 4,
              children: hiddenStems.map((stem) {
                final tenGod = _getTenGodRelation(dayMaster, stem);
                return Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: accentColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: accentColor.withOpacity(0.3)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        stem,
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: accentColor,
                        ),
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '→',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey.shade600,
                        ),
                      ),
                      const SizedBox(width: 4),
                      Text(
                        tenGod,
                        style: TextStyle(fontSize: 12, color: accentColor),
                      ),
                    ],
                  ),
                );
              }).toList(),
            ),
          ],
        ),
      );
    }

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
          Text(
            '地支藏干十神分析',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: Colors.purple.shade700,
            ),
          ),
          const SizedBox(height: 16),
          // 按照年月日时的顺序展示
          buildPillarHiddenStems('年柱', yearPillar, Colors.red.shade600),
          buildPillarHiddenStems('月柱', monthPillar, Colors.blue.shade600),
          buildPillarHiddenStems('日柱', dayPillar, Colors.orange.shade600),
          buildPillarHiddenStems('时柱', hourPillar, Colors.green.shade600),
        ],
      ),
    );
  }

  // 获取当前八字的十神列表
  List<String> _getCurrentTenGods() {
    final yearPillar = widget.result.paipan.yearPillar;
    final monthPillar = widget.result.paipan.monthPillar;
    final dayPillar = widget.result.paipan.dayPillar;
    final hourPillar = widget.result.paipan.hourPillar;
    final dayMaster = widget.result.paipan.dayMaster;

    Set<String> tenGodsSet = {};

    // 添加天干十神（除日主外）
    if (yearPillar.isNotEmpty) {
      tenGodsSet.add(_getTenGodRelation(dayMaster, yearPillar[0]));
    }
    if (monthPillar.isNotEmpty) {
      tenGodsSet.add(_getTenGodRelation(dayMaster, monthPillar[0]));
    }
    if (hourPillar.isNotEmpty) {
      tenGodsSet.add(_getTenGodRelation(dayMaster, hourPillar[0]));
    }

    // 添加地支主气十神
    if (yearPillar.length > 1) {
      final mainQi = _getZhiMainQi(yearPillar[1]);
      if (mainQi.isNotEmpty) {
        tenGodsSet.add(_getTenGodRelation(dayMaster, mainQi));
      }
    }
    if (monthPillar.length > 1) {
      final mainQi = _getZhiMainQi(monthPillar[1]);
      if (mainQi.isNotEmpty) {
        tenGodsSet.add(_getTenGodRelation(dayMaster, mainQi));
      }
    }
    if (dayPillar.length > 1) {
      final mainQi = _getZhiMainQi(dayPillar[1]);
      if (mainQi.isNotEmpty) {
        tenGodsSet.add(_getTenGodRelation(dayMaster, mainQi));
      }
    }
    if (hourPillar.length > 1) {
      final mainQi = _getZhiMainQi(hourPillar[1]);
      if (mainQi.isNotEmpty) {
        tenGodsSet.add(_getTenGodRelation(dayMaster, mainQi));
      }
    }

    return tenGodsSet.toList();
  }

  // 构建十神专业分析
  Widget _buildTenGodsProfessionalAnalysis() {
    final tenGods = _getCurrentTenGods();

    // 十神专业分析内容
    const tenGodAnalysis = {
      '比肩': {
        'description': '比肩代表自我、兄弟姐妹、同辈朋友',
        'personality': '性格独立自主，有主见，不喜欢受约束，重视友情',
        'career': '适合自主创业、合伙经营，或需要独立判断的工作',
        'relationship': '与同辈关系良好，但可能在金钱方面产生纠纷',
      },
      '劫财': {
        'description': '劫财代表竞争、冲动、投机',
        'personality': '性格冲动，敢于冒险，有投机心理，竞争意识强',
        'career': '适合销售、投资、竞技类工作，但需注意风险控制',
        'relationship': '容易因金钱问题与人产生矛盾，需谨慎理财',
      },
      '食神': {
        'description': '食神代表才华、表达、享受',
        'personality': '性格开朗乐观，有艺术天赋，善于表达，追求生活品质',
        'career': '适合文艺创作、教育、餐饮、娱乐等行业',
        'relationship': '人缘好，善于沟通，但有时过于理想化',
      },
      '伤官': {
        'description': '伤官代表创新、叛逆、才华',
        'personality': '聪明机智，有创新精神，但性格叛逆，不喜约束',
        'career': '适合创意设计、技术研发、自由职业',
        'relationship': '口才好但易得罪人，需注意言辞分寸',
      },
      '偏财': {
        'description': '偏财代表意外之财、投资、商机',
        'personality': '善于把握商机，有投资眼光，但金钱观念较为随意',
        'career': '适合投资理财、贸易、中介等行业',
        'relationship': '慷慨大方，但需防范金钱损失',
      },
      '正财': {
        'description': '正财代表稳定收入、勤劳致富',
        'personality': '勤劳务实，理财观念强，追求稳定的生活',
        'career': '适合稳定的工作，如公务员、会计、银行等',
        'relationship': '重视家庭，但有时过于节俭',
      },
      '七杀': {
        'description': '七杀代表权威、压力、挑战',
        'personality': '性格刚强，有领导能力，但压力较大，易冲动',
        'career': '适合管理、军警、竞技等需要权威的工作',
        'relationship': '有威严但易与人产生冲突',
      },
      '正官': {
        'description': '正官代表地位、责任、规范',
        'personality': '有责任感，遵纪守法，追求社会地位和名誉',
        'career': '适合公职、管理、法律等正统行业',
        'relationship': '受人尊敬，但有时过于拘谨',
      },
      '偏印': {
        'description': '偏印代表偏门学问、直觉、宗教',
        'personality': '思维独特，有直觉力，对神秘事物感兴趣',
        'career': '适合研究、宗教、玄学、医学等专业领域',
        'relationship': '性格内向，不易与人深交',
      },
      '正印': {
        'description': '正印代表学问、慈爱、保护',
        'personality': '有学者气质，慈爱宽容，重视精神修养',
        'career': '适合教育、文化、慈善等行业',
        'relationship': '受人爱戴，有长者风范',
      },
    };

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
          // 可点击的标题栏
          InkWell(
            onTap: () {
              setState(() {
                _isProfessionalAnalysisExpanded =
                    !_isProfessionalAnalysisExpanded;
              });
            },
            child: Row(
              children: [
                Text(
                  '十神专业分析',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Colors.blue.shade700,
                  ),
                ),
                const Spacer(),
                Icon(
                  _isProfessionalAnalysisExpanded
                      ? Icons.keyboard_arrow_up
                      : Icons.keyboard_arrow_down,
                  color: Colors.blue.shade700,
                ),
              ],
            ),
          ),
          // 可折叠的内容
          if (_isProfessionalAnalysisExpanded) ...[
            const SizedBox(height: 12),
            ...tenGods.map((tenGod) {
              final analysis = tenGodAnalysis[tenGod];
              if (analysis == null) return const SizedBox.shrink();

              return Container(
                margin: const EdgeInsets.only(bottom: 16),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.blue.shade100),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.blue.shade600,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            tenGod,
                            style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 14,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      analysis['description']!,
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey.shade700,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 8),
                    _buildAnalysisItem('性格特征', analysis['personality']!),
                    _buildAnalysisItem('事业倾向', analysis['career']!),
                    _buildAnalysisItem('人际关系', analysis['relationship']!),
                  ],
                ),
              );
            }),
          ] else ...[
            const SizedBox(height: 8),
            Text(
              '点击展开查看详细的十神专业分析',
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey.shade600,
                fontStyle: FontStyle.italic,
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildAnalysisItem(String title, String content) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 70,
            child: Text(
              '$title：',
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: Colors.blue.shade600,
              ),
            ),
          ),
          Expanded(
            child: Text(
              content,
              style: const TextStyle(fontSize: 13, height: 1.4),
            ),
          ),
        ],
      ),
    );
  }

  // 构建十神组合分析
  Widget _buildTenGodsComboAnalysis() {
    final tenGods = _getCurrentTenGods();
    final dayMaster = widget.result.paipan.dayMaster;

    // 十神组合分析
    List<Map<String, String>> comboAnalysis = [];

    // 检查常见的十神组合
    if (tenGods.contains('食神') && tenGods.contains('正财')) {
      comboAnalysis.add({
        'combo': '食神生财',
        'description': '食神生财是最佳的财富组合之一',
        'effect': '才华能够转化为财富，事业发展顺利，收入稳定增长',
        'advice': '发挥自己的才能和创意，通过正当途径获取财富',
      });
    }

    if (tenGods.contains('伤官') && tenGods.contains('偏财')) {
      comboAnalysis.add({
        'combo': '伤官生财',
        'description': '伤官配偏财，适合投资和创业',
        'effect': '具有敏锐的商业嗅觉，善于把握投资机会',
        'advice': '可以考虑创业或投资，但需注意风险控制',
      });
    }

    if (tenGods.contains('正官') && tenGods.contains('正印')) {
      comboAnalysis.add({
        'combo': '官印相生',
        'description': '官印相生是贵格组合',
        'effect': '有利于仕途发展，容易获得权威地位和社会认可',
        'advice': '适合从事公职或管理工作，注重品德修养',
      });
    }

    if (tenGods.contains('七杀') && tenGods.contains('正印')) {
      comboAnalysis.add({
        'combo': '杀印相生',
        'description': '杀印相生化煞为权',
        'effect': '能够化解压力为动力，具有很强的适应能力',
        'advice': '在困难中成长，压力越大成就越高',
      });
    }

    if (tenGods.contains('比肩') && tenGods.contains('劫财')) {
      comboAnalysis.add({
        'combo': '比劫重重',
        'description': '比劫多见，竞争激烈',
        'effect': '自主性强但容易与人产生竞争，需注意合作',
        'advice': '学会团队合作，避免因争强好胜而损失机会',
      });
    }

    if (tenGods.contains('正财') && tenGods.contains('偏财')) {
      comboAnalysis.add({
        'combo': '财星混杂',
        'description': '正偏财并见，财源多样',
        'effect': '收入来源多元化，但需要合理规划',
        'advice': '做好财务规划，避免因贪多而失焦',
      });
    }

    if (tenGods.contains('正官') && tenGods.contains('七杀')) {
      comboAnalysis.add({
        'combo': '官杀混杂',
        'description': '官杀并见，压力与机遇并存',
        'effect': '既有发展机会也面临较大压力',
        'advice': '需要在机遇和挑战中找到平衡点',
      });
    }

    // 如果没有特殊组合，给出一般性分析
    if (comboAnalysis.isEmpty) {
      comboAnalysis.add({
        'combo': '十神平衡',
        'description': '您的八字十神分布相对平衡',
        'effect': '性格较为均衡，各方面发展比较稳定',
        'advice': '保持现有的平衡状态，稳步发展各个方面',
      });
    }

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
          // 可点击的标题栏
          InkWell(
            onTap: () {
              setState(() {
                _isComboAnalysisExpanded = !_isComboAnalysisExpanded;
              });
            },
            child: Row(
              children: [
                Text(
                  '十神组合分析',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Colors.green.shade700,
                  ),
                ),
                const Spacer(),
                Icon(
                  _isComboAnalysisExpanded
                      ? Icons.keyboard_arrow_up
                      : Icons.keyboard_arrow_down,
                  color: Colors.green.shade700,
                ),
              ],
            ),
          ),
          // 可折叠的内容
          if (_isComboAnalysisExpanded) ...[
            const SizedBox(height: 12),
            ...comboAnalysis.map((combo) {
              return Container(
                margin: const EdgeInsets.only(bottom: 16),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.green.shade100),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.green.shade600,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            combo['combo']!,
                            style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 14,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      combo['description']!,
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey.shade700,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 8),
                    _buildAnalysisItem('组合效应', combo['effect']!),
                    _buildAnalysisItem('建议', combo['advice']!),
                  ],
                ),
              );
            }),
          ] else ...[
            const SizedBox(height: 8),
            Text(
              '点击展开查看详细的十神组合分析',
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey.shade600,
                fontStyle: FontStyle.italic,
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildLuckTimingCard() {
    final luckStartingTime =
        widget.result.luckStartingTime ?? _calculateLuckStartingTime();
    final currentDayun = widget.result.currentDayun ?? _calculateCurrentDayun();
    final yearPillar = widget.result.paipan.yearPillar;
    final yearGan = yearPillar.isNotEmpty ? yearPillar[0] : '甲';
    final yangTianGan = ['甲', '丙', '戊', '庚', '壬'];
    final isMale = widget.input.gender == '男';
    final isForward =
        (yangTianGan.contains(yearGan) && isMale) ||
        (['乙', '丁', '己', '辛', '癸'].contains(yearGan) && !isMale);

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
              Icon(Icons.schedule, color: Colors.blue.shade600, size: 24),
              const SizedBox(width: 8),
              const Text(
                '起运时间',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // 起运时间显示
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.blue.shade50,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.blue.shade200),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // 起运时间主要信息
                Center(
                  child: Text(
                    luckStartingTime,
                    style: TextStyle(
                      color: Colors.blue.shade700,
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                const SizedBox(height: 12),

                // 详细信息已删除
                const SizedBox(height: 12),
                const Divider(),
                const SizedBox(height: 8),

                // 当前大运信息
                const Text(
                  '当前大运',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Colors.black87,
                  ),
                ),
                const SizedBox(height: 8),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.orange.shade50,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.orange.shade200, width: 1),
                  ),
                  child: Text(
                    currentDayun,
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: Colors.orange.shade700,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),

                const SizedBox(height: 12),

                // 说明文字
                Text(
                  '注：起运时间根据出生日期与节气的关系计算，3天折合1岁。大运每10年一换。',
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey.shade600,
                    fontStyle: FontStyle.italic,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(fontSize: 14, color: Colors.grey.shade700),
          ),
          Text(
            value,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w500,
              color: Colors.black87,
            ),
          ),
        ],
      ),
    );
  }

  // 计算起运时间（基于baziphone.html的正确算法）
  String _calculateLuckStartingTime() {
    try {
      // 获取年柱天干
      final yearPillar = widget.result.paipan.yearPillar;
      final yearGan = yearPillar.isNotEmpty ? yearPillar[0] : '甲';

      // 判断阴阳年和性别
      final yangTianGan = ['甲', '丙', '戊', '庚', '壬'];
      final yinTianGan = ['乙', '丁', '己', '辛', '癸'];
      final isMale = widget.input.gender == '男';

      String direction;
      if ((yangTianGan.contains(yearGan) && isMale) ||
          (yinTianGan.contains(yearGan) && !isMale)) {
        direction = '顺排'; // 阳年男 or 阴年女
      } else {
        direction = '逆排'; // 阴年男 or 阳年女
      }

      print('🔍 起运时间计算调试:');
      print('年柱: $yearPillar, 年干: $yearGan');
      print('性别: ${widget.input.gender}, 是否男性: $isMale');
      print('方向: $direction');

      // 使用用户的出生日期进行节气天数差计算
      final birthDate = widget.input.birthDate;
      print('出生日期: ${birthDate.year}-${birthDate.month}-${birthDate.day}');

      final estimatedDaysDiff = _estimateDaysToJieQi(
        birthDate.month,
        direction,
        birthDate.day,
      );

      print('计算得到的天数差: $estimatedDaysDiff');

      // 起运年龄计算：3天 = 1岁
      final totalDays = estimatedDaysDiff;
      final years = (totalDays / 3).floor();
      final remainingDays = totalDays % 3;
      final months = (remainingDays * 4).round(); // 3天=1岁=12个月，所以1天=4个月

      print('总天数: $totalDays, 年: $years, 剩余天数: $remainingDays, 月: $months');
      final result = '$direction，$years岁$months个月起运';
      print('最终结果: $result');

      return result;
    } catch (e) {
      return '顺排，8岁0个月起运（默认值）';
    }
  }

  // 估算到节气的天数差（修正版本）
  double _estimateDaysToJieQi(int month, String direction, int currentDay) {
    // 简化的节气日期估算（实际应用中需要使用lunar.js精确计算）
    final jieQiDays = {
      1: 4, // 立春
      2: 4, // 惊蛰
      3: 5, // 清明
      4: 5, // 立夏
      5: 6, // 芒种
      6: 6, // 小暑
      7: 7, // 立秋
      8: 8, // 白露
      9: 8, // 寒露
      10: 8, // 立冬
      11: 7, // 大雪
      12: 6, // 小寒
    };

    final jieQiDay = jieQiDays[month] ?? 6;
    print('调试：月份=$month, 节气日=$jieQiDay, 出生日=$currentDay, 方向=$direction');

    if (direction == '顺排') {
      // 找下一个节气
      if (currentDay < jieQiDay) {
        final daysDiff = (jieQiDay - currentDay).toDouble();
        print('顺排：当月节气未过，天数差=$daysDiff');
        return daysDiff;
      } else {
        // 下个月的节气
        final nextMonth = month == 12 ? 1 : month + 1;
        final nextJieQiDay = jieQiDays[nextMonth] ?? 6;
        final currentYear = DateTime.now().year;
        final daysInMonth = DateTime(currentYear, month + 1, 0).day;
        final daysDiff = (daysInMonth - currentDay + nextJieQiDay).toDouble();
        print('顺排：当月节气已过，到下月节气天数差=$daysDiff');
        return daysDiff;
      }
    } else {
      // 逆排：找上一个节气（修正逻辑）
      if (currentDay >= jieQiDay) {
        // 当月节气已过或当天，计算到当月节气的天数
        final daysDiff = (currentDay - jieQiDay).toDouble();
        print('逆排：当月节气已过，天数差=$daysDiff');
        return daysDiff;
      } else {
        // 当月节气未过，计算到上个月节气的天数
        final prevMonth = month == 1 ? 12 : month - 1;
        final prevJieQiDay = jieQiDays[prevMonth] ?? 6;
        final currentYear = DateTime.now().year;
        final daysInPrevMonth = DateTime(currentYear, month, 0).day;
        final daysDiff = (currentDay + (daysInPrevMonth - prevJieQiDay))
            .toDouble();
        print('逆排：当月节气未过，到上月节气天数差=$daysDiff');
        return daysDiff;
      }
    }
  }

  // 提取大运干支（从完整描述中提取干支部分）
  String _extractDayunGanZhi(String dayunDescription) {
    // 从"己未大运（8-17岁）"中提取"己未"
    final match = RegExp(
      r'([甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥])',
    ).firstMatch(dayunDescription);
    return match?.group(1) ?? '甲子';
  }

  // 计算当前流年
  String _calculateCurrentLiunian() {
    final currentYear = DateTime.now().year;

    // 六十甲子表
    const jiaZi = [
      '甲子',
      '乙丑',
      '丙寅',
      '丁卯',
      '戊辰',
      '己巳',
      '庚午',
      '辛未',
      '壬申',
      '癸酉',
      '甲戌',
      '乙亥',
      '丙子',
      '丁丑',
      '戊寅',
      '己卯',
      '庚辰',
      '辛巳',
      '壬午',
      '癸未',
      '甲申',
      '乙酉',
      '丙戌',
      '丁亥',
      '戊子',
      '己丑',
      '庚寅',
      '辛卯',
      '壬辰',
      '癸巳',
      '甲午',
      '乙未',
      '丙申',
      '丁酉',
      '戊戌',
      '己亥',
      '庚子',
      '辛丑',
      '壬寅',
      '癸卯',
      '甲辰',
      '乙巳',
      '丙午',
      '丁未',
      '戊申',
      '己酉',
      '庚戌',
      '辛亥',
      '壬子',
      '癸丑',
      '甲寅',
      '乙卯',
      '丙辰',
      '丁巳',
      '戊午',
      '己未',
      '庚申',
      '辛酉',
      '壬戌',
      '癸亥',
    ];

    // 1984年是甲子年，以此为基准计算
    final baseYear = 1984;
    final yearIndex = (currentYear - baseYear) % 60;

    return jiaZi[yearIndex];
  }

  // 计算当前大运（基于baziphone.html的正确算法）
  String _calculateCurrentDayun() {
    try {
      // 获取月柱和年柱
      final monthPillar = widget.result.paipan.monthPillar;
      final yearPillar = widget.result.paipan.yearPillar;
      final yearGan = yearPillar.isNotEmpty ? yearPillar[0] : '甲';

      // 判断顺逆排
      final yangTianGan = ['甲', '丙', '戊', '庚', '壬'];
      final yinTianGan = ['乙', '丁', '己', '辛', '癸'];
      final isMale = widget.input.gender == '男';

      final isForward =
          (yangTianGan.contains(yearGan) && isMale) ||
          (yinTianGan.contains(yearGan) && !isMale);

      // 六十甲子表
      const jiaZi = [
        '甲子',
        '乙丑',
        '丙寅',
        '丁卯',
        '戊辰',
        '己巳',
        '庚午',
        '辛未',
        '壬申',
        '癸酉',
        '甲戌',
        '乙亥',
        '丙子',
        '丁丑',
        '戊寅',
        '己卯',
        '庚辰',
        '辛巳',
        '壬午',
        '癸未',
        '甲申',
        '乙酉',
        '丙戌',
        '丁亥',
        '戊子',
        '己丑',
        '庚寅',
        '辛卯',
        '壬辰',
        '癸巳',
        '甲午',
        '乙未',
        '丙申',
        '丁酉',
        '戊戌',
        '己亥',
        '庚子',
        '辛丑',
        '壬寅',
        '癸卯',
        '甲辰',
        '乙巳',
        '丙午',
        '丁未',
        '戊申',
        '己酉',
        '庚戌',
        '辛亥',
        '壬子',
        '癸丑',
        '甲寅',
        '乙卯',
        '丙辰',
        '丁巳',
        '戊午',
        '己未',
        '庚申',
        '辛酉',
        '壬戌',
        '癸亥',
      ];

      // 找到月柱在六十甲子中的位置
      final monthIndex = jiaZi.indexOf(monthPillar);
      if (monthIndex == -1) {
        return '$monthPillar大运（未找到）';
      }

      // 使用正确的起运年龄计算（与_calculateLuckStartingTime保持一致）
      final birthDate = widget.input.birthDate;
      final direction = isForward ? '顺排' : '逆排';
      final estimatedDaysDiff = _estimateDaysToJieQi(
        birthDate.month,
        direction,
        birthDate.day,
      );
      final startAge = (estimatedDaysDiff / 3).floor(); // 3天=1岁

      // 计算当前虚岁年龄
      final currentYear = DateTime.now().year;
      final currentAge = currentYear - birthDate.year + 1; // 虚岁

      // 计算当前大运序号
      final dayunIndex = ((currentAge - startAge) / 10).floor();

      if (dayunIndex < 0) {
        return '未起运';
      }

      // 计算大运干支
      int targetIndex;
      if (isForward) {
        // 顺排：月柱后一位开始
        targetIndex = (monthIndex + dayunIndex + 1) % 60;
      } else {
        // 逆排：月柱前一位开始
        targetIndex = (monthIndex - dayunIndex - 1 + 60) % 60;
      }

      final dayunGanZhi = jiaZi[targetIndex];
      final dayunStartAge = startAge + dayunIndex * 10;
      final dayunEndAge = dayunStartAge + 9;

      // 计算年份区间
      final birthYear = birthDate.year;
      final dayunStartYear = birthYear + dayunStartAge - 1; // 虚岁转实岁
      final dayunEndYear = birthYear + dayunEndAge - 1;

      return '$dayunGanZhi $dayunStartYear-$dayunEndYear';
    } catch (e) {
      return '甲子大运（默认值）';
    }
  }

  Widget _buildDetailedAnalysisButtons(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          '详细分析',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 16),

        // 单个详细分析按钮，导航到包含9个分析模块的页面
        SizedBox(
          width: double.infinity,
          height: 56,
          child: ElevatedButton(
            onPressed: () async {
              final authService = Provider.of<AuthService>(
                context,
                listen: false,
              );

              // 生成八字哈希值
              final baziHashData = {
                'yearStem': widget.result.paipan.yearPillar.split('')[0],
                'yearBranch': widget.result.paipan.yearPillar.split('')[1],
                'monthStem': widget.result.paipan.monthPillar.split('')[0],
                'monthBranch': widget.result.paipan.monthPillar.split('')[1],
                'dayStem': widget.result.paipan.dayPillar.split('')[0],
                'dayBranch': widget.result.paipan.dayPillar.split('')[1],
                'hourStem': widget.result.paipan.hourPillar.split('')[0],
                'hourBranch': widget.result.paipan.hourPillar.split('')[1],
              };
              final baziHash = UnlockService.generateBaziHash(baziHashData);

              // 先检查是否已解锁
              final isAlreadyUnlocked = await UnlockService.isUnlocked(
                baziHash,
                UnlockService.detailedAnalysis,
              );
              if (isAlreadyUnlocked) {
                // 已解锁，直接跳转
                final baziData = {
                  'name': widget.input.name,
                  'gender': widget.input.gender,
                  'birthDate': widget.input.birthDate.toIso8601String(),
                  'birthTime': widget.input.birthTime,
                  'birthPlace': widget.input.birthPlace,
                  'isLunar': widget.input.isLunar,
                  'luckStartingTime': widget.result.luckStartingTime,
                  'paipan': {
                    'yearPillar': widget.result.paipan.yearPillar,
                    'monthPillar': widget.result.paipan.monthPillar,
                    'dayPillar': widget.result.paipan.dayPillar,
                    'hourPillar': widget.result.paipan.hourPillar,
                    'yearNayin': widget.result.paipan.yearNayin,
                    'dayMaster': widget.result.paipan.dayMaster,
                    'tenGods': widget.result.paipan.tenGods,
                    'earthlyBranches': widget.result.paipan.earthlyBranches,
                  },
                  'wuxing': {
                    'elements': widget.result.wuxing.elements,
                    'percentages': widget.result.wuxing.percentages,
                    'strongestElement': widget.result.wuxing.strongestElement,
                    'weakestElement': widget.result.wuxing.weakestElement,
                    'balance': widget.result.wuxing.balance,
                  },
                };

                Navigator.pushNamed(
                  context,
                  '/detailed-analysis',
                  arguments: baziData,
                );
                return;
              }

              // 显示确认付款对话框
              final confirmed = await _showPaymentConfirmDialog(
                '九大分析模块',
                '\$5',
              );
              if (!confirmed) {
                return; // 用户取消付款
              }

              // 显示加载对话框
              showDialog(
                context: context,
                barrierDismissible: false,
                builder: (context) =>
                    const Center(child: CircularProgressIndicator()),
              );

              try {
                // 尝试解锁
                final result = await UnlockService.tryUnlock(
                  baziHash,
                  UnlockService.detailedAnalysis,
                  authService,
                );

                // 关闭加载对话框
                if (mounted) Navigator.of(context).pop();

                if (result.success) {
                  // 解锁成功，刷新状态
                  if (mounted) {
                    setState(() {
                      // 刷新页面状态以更新按钮显示
                    });

                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(result.message),
                        backgroundColor: Colors.green,
                      ),
                    );

                    // 准备八字数据
                    final baziData = {
                      'name': widget.input.name,
                      'gender': widget.input.gender,
                      'birthDate': widget.input.birthDate.toIso8601String(),
                      'birthTime': widget.input.birthTime,
                      'birthPlace': widget.input.birthPlace,
                      'isLunar': widget.input.isLunar,
                      'luckStartingTime': widget.result.luckStartingTime,
                      'paipan': {
                        'yearPillar': widget.result.paipan.yearPillar,
                        'monthPillar': widget.result.paipan.monthPillar,
                        'dayPillar': widget.result.paipan.dayPillar,
                        'hourPillar': widget.result.paipan.hourPillar,
                        'yearNayin': widget.result.paipan.yearNayin,
                        'dayMaster': widget.result.paipan.dayMaster,
                        'tenGods': widget.result.paipan.tenGods,
                        'earthlyBranches': widget.result.paipan.earthlyBranches,
                      },
                      'wuxing': {
                        'elements': widget.result.wuxing.elements,
                        'percentages': widget.result.wuxing.percentages,
                        'strongestElement':
                            widget.result.wuxing.strongestElement,
                        'weakestElement': widget.result.wuxing.weakestElement,
                        'missingElements': widget.result.wuxing.missingElements,
                        'balance': widget.result.wuxing.balance,
                      },
                      'basicAnalysis': widget.result.basicAnalysis,
                      'score': widget.result.score,
                      'currentDayun': widget.result.currentDayun,
                      'dayun': widget.result.dayun?.toJson(),
                      'liunian': widget.result.liunian?.toJson(),
                      'personality': widget.result.personality?.toJson(),
                      'career': widget.result.career?.toJson(),
                      'marriage': widget.result.marriage?.toJson(),
                      'health': widget.result.health?.toJson(),
                    };

                    Navigator.pushNamed(
                      context,
                      '/detailed-analysis',
                      arguments: baziData,
                    );
                  }
                } else if (result.needRecharge) {
                  // 余额不足，询问是否充值
                  if (mounted) {
                    _showRechargeDialog(result.message);
                  }
                } else {
                  // 其他错误
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(result.message),
                        backgroundColor: Colors.red,
                      ),
                    );
                  }
                }
              } catch (e) {
                // 关闭加载对话框
                if (mounted) Navigator.of(context).pop();

                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('网络错误，请稍后重试'),
                      backgroundColor: Colors.red,
                    ),
                  );
                }
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF3498DB),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              elevation: 2,
            ),
            child: FutureBuilder<Map<String, bool>>(
              future: _getUnlockStatus(),
              builder: (context, snapshot) {
                final unlockStatus = snapshot.data ?? {};
                final isDetailedUnlocked = unlockStatus['detailed'] ?? false;

                return Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      isDetailedUnlocked ? Icons.lock_open : Icons.lock,
                      size: 20,
                    ),
                    const SizedBox(width: 8),
                    const Text(
                      '查看九大分析模块',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    if (!isDetailedUnlocked) ...[
                      const SizedBox(width: 6),
                      const Text(
                        '\$5',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                          color: Colors.white70,
                        ),
                      ),
                    ],
                    const SizedBox(width: 4),
                    const Icon(Icons.arrow_forward_ios, size: 14),
                  ],
                );
              },
            ),
          ),
        ),
        const SizedBox(height: 12),

        // 说明文字
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.blue.shade50,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: Colors.blue.shade200),
          ),
          child: const Row(
            children: [
              Icon(Icons.info_outline, color: Color(0xFF3498DB), size: 20),
              SizedBox(width: 8),
              Expanded(
                child: Text(
                  '包含命理全解、流年分析、流月分析、十年大运、性格分析、事业财富、婚姻分析、子女分析、健康分析等九大模块',
                  style: TextStyle(fontSize: 12, color: Color(0xFF3498DB)),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildAnalysisButton(
    BuildContext context,
    String title,
    IconData icon,
    Color color,
    VoidCallback onTap,
  ) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withOpacity(0.3)),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: color, size: 20),
            const SizedBox(width: 8),
            Text(
              title,
              style: TextStyle(
                color: color,
                fontWeight: FontWeight.w500,
                fontSize: 14,
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _navigateToWebView(BuildContext context, String title, String url) {
    // 将HTTP URL转换为assets路径
    String assetUrl = url.replaceAll('https://mybazi.net/', 'assets/');
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => BaziWebViewScreen(initialUrl: assetUrl),
      ),
    );
  }

  String _formatDateTime(DateTime dateTime) {
    return '${dateTime.year}年${dateTime.month}月${dateTime.day}日';
  }

  Color _getScoreColor(double score) {
    if (score >= 80) return Colors.green;
    if (score >= 60) return Colors.orange;
    return Colors.red;
  }

  String _getScoreDescription(double score) {
    if (score >= 80) return '运势极佳';
    if (score >= 60) return '运势良好';
    if (score >= 40) return '运势一般';
    return '运势较弱';
  }

  Widget _buildStrengthAnalysisCard() {
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

    // 获取当前大运和流年（使用正确的计算方法）
    String currentDayun = _extractDayunGanZhi(_calculateCurrentDayun());
    String currentLiunian = _calculateCurrentLiunian();

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
              const Icon(Icons.balance, color: Colors.orange, size: 24),
              const SizedBox(width: 8),
              const Text(
                '五行强弱分析',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Colors.black87,
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

  // 用户余额和付费说明
  Widget _buildBalanceAndPaymentInfo() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.blue.shade50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.blue.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 用户余额显示
          Consumer<AuthService>(
            builder: (context, authService, child) {
              return Row(
                children: [
                  const Icon(
                    Icons.account_balance_wallet,
                    color: Color(0xFF3498DB),
                    size: 20,
                  ),
                  const SizedBox(width: 8),
                  const Text(
                    '当前余额：',
                    style: TextStyle(
                      fontSize: 14,
                      color: Color(0xFF3498DB),
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  Text(
                    '\$${authService.currentUser?.balance.toStringAsFixed(2) ?? '0.00'}',
                    style: const TextStyle(
                      fontSize: 16,
                      color: Color(0xFF3498DB),
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const Spacer(),
                  TextButton(
                    onPressed: () {
                      Navigator.pushNamed(context, '/recharge');
                    },
                    child: const Text(
                      '充值',
                      style: TextStyle(
                        color: Color(0xFF3498DB),
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ],
              );
            },
          ),
          const SizedBox(height: 12),
          // 付费说明
          const Row(
            children: [
              Icon(Icons.info_outline, color: Color(0xFF3498DB), size: 18),
              SizedBox(width: 8),
              Expanded(
                child: Text(
                  '同一个八字只需一次付费就可以永久开启对应功能',
                  style: TextStyle(fontSize: 12, color: Color(0xFF3498DB)),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // 命格等级和财富等级banner按键
  Widget _buildLevelBannerButtons() {
    return FutureBuilder<Map<String, bool>>(
      future: _getUnlockStatus(),
      builder: (context, snapshot) {
        final unlockStatus = snapshot.data ?? {};
        final isMinggeUnlocked = unlockStatus['mingge'] ?? false;
        final isWealthUnlocked = unlockStatus['wealth'] ?? false;

        return Row(
          children: [
            // 命格等级按键
            Expanded(
              child: GestureDetector(
                onTap: () => _navigateToMinggeLevel(),
                child: Container(
                  height: 80,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF6B73FF), Color(0xFF9B59B6)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF6B73FF).withOpacity(0.3),
                        blurRadius: 8,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        isMinggeUnlocked ? Icons.lock_open : Icons.lock,
                        color: Colors.white,
                        size: 20,
                      ),
                      const SizedBox(width: 6),
                      const Text(
                        '命格等级',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      if (!isMinggeUnlocked) ...[
                        const SizedBox(width: 4),
                        const Text(
                          '\$2',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(width: 12),
            // 财富等级按键
            Expanded(
              child: GestureDetector(
                onTap: () => _navigateToWealthLevel(),
                child: Container(
                  height: 80,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFFFFB74D), Color(0xFFFF8A65)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFFFFB74D).withOpacity(0.3),
                        blurRadius: 8,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        isWealthUnlocked ? Icons.lock_open : Icons.lock,
                        color: Colors.white,
                        size: 20,
                      ),
                      const SizedBox(width: 6),
                      const Text(
                        '财富等级',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      if (!isWealthUnlocked) ...[
                        const SizedBox(width: 4),
                        const Text(
                          r'$2',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ),
          ],
        );
      },
    );
  }

  // 获取解锁状态
  Future<Map<String, bool>> _getUnlockStatus() async {
    // 生成八字哈希值
    final baziData = {
      'yearStem': widget.result.paipan.yearPillar.split('')[0],
      'yearBranch': widget.result.paipan.yearPillar.split('')[1],
      'monthStem': widget.result.paipan.monthPillar.split('')[0],
      'monthBranch': widget.result.paipan.monthPillar.split('')[1],
      'dayStem': widget.result.paipan.dayPillar.split('')[0],
      'dayBranch': widget.result.paipan.dayPillar.split('')[1],
      'hourStem': widget.result.paipan.hourPillar.split('')[0],
      'hourBranch': widget.result.paipan.hourPillar.split('')[1],
    };
    final baziHash = UnlockService.generateBaziHash(baziData);

    // 检查各个功能的解锁状态
    final minggeUnlocked = await UnlockService.isUnlocked(
      baziHash,
      UnlockService.minggeLevel,
    );
    final wealthUnlocked = await UnlockService.isUnlocked(
      baziHash,
      UnlockService.wealthLevel,
    );
    final detailedUnlocked = await UnlockService.isUnlocked(
      baziHash,
      UnlockService.detailedAnalysis,
    );

    return {
      'mingge': minggeUnlocked,
      'wealth': wealthUnlocked,
      'detailed': detailedUnlocked,
    };
  }

  // 导航到命格等级分析页面
  void _navigateToMinggeLevel() async {
    final authService = Provider.of<AuthService>(context, listen: false);

    // 生成八字哈希值
    final baziData = {
      'yearStem': widget.result.paipan.yearPillar.split('')[0],
      'yearBranch': widget.result.paipan.yearPillar.split('')[1],
      'monthStem': widget.result.paipan.monthPillar.split('')[0],
      'monthBranch': widget.result.paipan.monthPillar.split('')[1],
      'dayStem': widget.result.paipan.dayPillar.split('')[0],
      'dayBranch': widget.result.paipan.dayPillar.split('')[1],
      'hourStem': widget.result.paipan.hourPillar.split('')[0],
      'hourBranch': widget.result.paipan.hourPillar.split('')[1],
    };
    final baziHash = UnlockService.generateBaziHash(baziData);

    // 先检查是否已解锁
    final isAlreadyUnlocked = await UnlockService.isUnlocked(
      baziHash,
      UnlockService.minggeLevel,
    );
    if (isAlreadyUnlocked) {
      // 已解锁，直接跳转
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) =>
              MinggeAnalysisScreen(input: widget.input, result: widget.result),
        ),
      );
      return;
    }

    // 显示确认付款对话框
    final confirmed = await _showPaymentConfirmDialog('命格等级分析', '\$2');
    if (!confirmed) {
      return; // 用户取消付款
    }

    // 显示加载对话框
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const Center(child: CircularProgressIndicator()),
    );

    try {
      // 尝试解锁
      final result = await UnlockService.tryUnlock(
        baziHash,
        UnlockService.minggeLevel,
        authService,
      );

      // 关闭加载对话框
      if (mounted) Navigator.of(context).pop();

      if (result.success) {
        // 解锁成功，刷新状态
        if (mounted) {
          setState(() {
            // 刷新页面状态以更新按钮显示
          });

          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(result.message),
              backgroundColor: Colors.green,
            ),
          );

          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => MinggeAnalysisScreen(
                input: widget.input,
                result: widget.result,
              ),
            ),
          );
        }
      } else if (result.needRecharge) {
        // 余额不足，询问是否充值
        if (mounted) {
          _showRechargeDialog(result.message);
        }
      } else {
        // 其他错误
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(result.message),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    } catch (e) {
      // 关闭加载对话框
      if (mounted) Navigator.of(context).pop();

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('网络错误，请稍后重试'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  // 导航到财富等级分析页面
  void _navigateToWealthLevel() async {
    final authService = Provider.of<AuthService>(context, listen: false);

    // 生成八字哈希值
    final baziData = {
      'yearStem': widget.result.paipan.yearPillar.split('')[0],
      'yearBranch': widget.result.paipan.yearPillar.split('')[1],
      'monthStem': widget.result.paipan.monthPillar.split('')[0],
      'monthBranch': widget.result.paipan.monthPillar.split('')[1],
      'dayStem': widget.result.paipan.dayPillar.split('')[0],
      'dayBranch': widget.result.paipan.dayPillar.split('')[1],
      'hourStem': widget.result.paipan.hourPillar.split('')[0],
      'hourBranch': widget.result.paipan.hourPillar.split('')[1],
    };
    final baziHash = UnlockService.generateBaziHash(baziData);

    // 先检查是否已解锁
    final isAlreadyUnlocked = await UnlockService.isUnlocked(
      baziHash,
      UnlockService.wealthLevel,
    );
    if (isAlreadyUnlocked) {
      // 已解锁，直接跳转
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) =>
              WealthAnalysisScreen(input: widget.input, result: widget.result),
        ),
      );
      return;
    }

    // 显示确认付款对话框
    final confirmed = await _showPaymentConfirmDialog('财富等级分析', '\$2');
    if (!confirmed) {
      return; // 用户取消付款
    }

    // 显示加载对话框
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const Center(child: CircularProgressIndicator()),
    );

    try {
      // 尝试解锁
      final result = await UnlockService.tryUnlock(
        baziHash,
        UnlockService.wealthLevel,
        authService,
      );

      // 关闭加载对话框
      if (mounted) Navigator.of(context).pop();

      if (result.success) {
        // 解锁成功，刷新状态
        if (mounted) {
          setState(() {
            // 刷新页面状态以更新按钮显示
          });

          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(result.message),
              backgroundColor: Colors.green,
            ),
          );

          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => WealthAnalysisScreen(
                input: widget.input,
                result: widget.result,
              ),
            ),
          );
        }
      } else if (result.needRecharge) {
        // 余额不足，询问是否充值
        if (mounted) {
          _showRechargeDialog(result.message);
        }
      } else {
        // 其他错误
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(result.message),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    } catch (e) {
      // 关闭加载对话框
      if (mounted) Navigator.of(context).pop();

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('网络错误，请稍后重试'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  // 显示确认付款对话框
  Future<bool> _showPaymentConfirmDialog(
    String featureName,
    String price,
  ) async {
    return await showDialog<bool>(
          context: context,
          builder: (context) => AlertDialog(
            title: const Text('确认付款'),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('您即将解锁「$featureName」功能'),
                const SizedBox(height: 8),
                Text('费用：$price'),
                const SizedBox(height: 16),
                const Text(
                  '同一个八字只需一次付费就可以永久开启',
                  style: TextStyle(fontSize: 12, color: Colors.grey),
                ),
              ],
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(context).pop(false),
                child: const Text('取消'),
              ),
              ElevatedButton(
                onPressed: () => Navigator.of(context).pop(true),
                child: const Text('确认付款'),
              ),
            ],
          ),
        ) ??
        false;
  }

  // 显示充值对话框
  void _showRechargeDialog(String message) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('余额不足'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(message),
            const SizedBox(height: 16),
            const Text('是否前往充值页面？'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('取消'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.of(context).pop();
              Navigator.pushNamed(context, '/recharge');
            },
            child: const Text('去充值'),
          ),
        ],
      ),
    );
  }
}

class _TableCell extends StatelessWidget {
  final String text;
  final bool isHeader;

  const _TableCell(this.text, {this.isHeader = false});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(8),
      child: Text(
        text,
        textAlign: TextAlign.center,
        style: TextStyle(
          fontWeight: isHeader ? FontWeight.bold : FontWeight.normal,
          fontSize: isHeader ? 14 : 16,
          color: isHeader ? Colors.grey.shade700 : Colors.black,
        ),
      ),
    );
  }
}
