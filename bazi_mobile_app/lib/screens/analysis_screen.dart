import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';

class AnalysisScreen extends StatefulWidget {
  const AnalysisScreen({super.key});

  @override
  State<AnalysisScreen> createState() => _AnalysisScreenState();
}

class _AnalysisScreenState extends State<AnalysisScreen> with TickerProviderStateMixin {
  late TabController _tabController;
  bool _isLoading = false;
  String _analysisContent = '';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 5, vsync: this);
    _loadAnalysis();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadAnalysis() async {
    setState(() {
      _isLoading = true;
    });

    try {
      final provider = Provider.of<AppProvider>(context, listen: false);
      // 模拟加载分析内容
      await Future.delayed(const Duration(seconds: 2));
      
      setState(() {
        _analysisContent = _generateSampleAnalysis();
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
      _showErrorDialog('加载分析失败：$e');
    }
  }

  String _generateSampleAnalysis() {
    return '''
【命格总论】
您的八字命格属于偏财格，日主身强，财星有力。整体命局呈现出较好的财富运势，具备一定的创业和投资能力。

【五行分析】
五行分布：木旺、火相、土死、金囚、水休
• 木气过旺，需要金来修剪
• 火气适中，有助于事业发展
• 土气偏弱，需要加强脾胃保养
• 金气不足，影响决断力
• 水气偏弱，需要补充智慧能量

【十神分析】
• 正财：代表正当收入，您的正财运较强
• 偏财：代表意外之财，投资运势不错
• 食神：代表才华展现，有艺术天赋
• 伤官：代表创新能力，适合新兴行业
• 正印：代表学习能力，终身学习型人才

【用神喜忌】
用神：金、水
忌神：木、火
建议多使用金属饰品，居住环境宜靠近水源。
''';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      appBar: AppBar(
        title: const Text('详细分析'),
        backgroundColor: const Color(0xFF3498DB),
        foregroundColor: Colors.white,
        elevation: 0,
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          indicatorColor: Colors.white,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white70,
          tabs: const [
            Tab(text: '命格分析'),
            Tab(text: '财富运势'),
            Tab(text: '事业发展'),
            Tab(text: '感情婚姻'),
            Tab(text: '健康养生'),
          ],
        ),
      ),
      body: _isLoading
          ? _buildLoadingWidget()
          : TabBarView(
              controller: _tabController,
              children: [
                _buildAnalysisTab('命格分析', _analysisContent),
                _buildAnalysisTab('财富运势', _generateWealthAnalysis()),
                _buildAnalysisTab('事业发展', _generateCareerAnalysis()),
                _buildAnalysisTab('感情婚姻', _generateLoveAnalysis()),
                _buildAnalysisTab('健康养生', _generateHealthAnalysis()),
              ],
            ),
    );
  }

  Widget _buildLoadingWidget() {
    return Container(
      padding: const EdgeInsets.all(40),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const CircularProgressIndicator(
            color: Color(0xFF3498DB),
            strokeWidth: 3,
          ),
          const SizedBox(height: 24),
          const Text(
            '正在生成详细分析...',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w500,
              color: Color(0xFF2C3E50),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            '请稍候，AI正在为您深度解析八字命理',
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey[600],
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildAnalysisTab(String title, String content) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildSectionCard(title, content),
          const SizedBox(height: 16),
          _buildActionCard(),
        ],
      ),
    );
  }

  Widget _buildSectionCard(String title, String content) {
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
              Container(
                width: 4,
                height: 24,
                decoration: const BoxDecoration(
                  color: Color(0xFF3498DB),
                  borderRadius: BorderRadius.all(Radius.circular(2)),
                ),
              ),
              const SizedBox(width: 12),
              Text(
                title,
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF2C3E50),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Text(
            content,
            style: const TextStyle(
              fontSize: 16,
              height: 1.8,
              color: Color(0xFF2C3E50),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionCard() {
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
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.lightbulb, color: Colors.white, size: 24),
              SizedBox(width: 8),
              Text(
                '个性化建议',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          const Text(
            '想要获得更详细的个人分析和改运建议？',
            style: TextStyle(
              fontSize: 14,
              color: Colors.white70,
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.pushNamed(context, '/qa');
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: const Color(0xFF3498DB),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  child: const Text(
                    '智能问答',
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: OutlinedButton(
                  onPressed: () {
                    Navigator.pushNamed(context, '/recharge');
                  },
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.white,
                    side: const BorderSide(color: Colors.white),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  child: const Text(
                    '充值解锁',
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  String _generateWealthAnalysis() {
    return '''
【财富运势总览】
您的财运整体呈上升趋势，具备良好的理财能力和投资眼光。

【正财运势】
正财星得力，主要收入来源稳定。适合从事稳定性较强的工作，如公务员、教师、医生等职业。建议通过提升专业技能来增加收入。

【偏财运势】
偏财运较旺，有意外收获的可能。适合进行一些风险可控的投资，如股票、基金、房地产等。但需注意不要过度投机。

【理财建议】
• 建立紧急备用金，金额为月支出的6-12倍
• 分散投资，不要把鸡蛋放在一个篮子里
• 定期储蓄，养成良好的理财习惯
• 学习投资知识，提高财商

【旺财方位】
东南方为您的财位，可在此方位放置招财物品。

【旺财颜色】
金色、银色、白色有助于提升财运。
''';
  }

  String _generateCareerAnalysis() {
    return '''
【事业发展总论】
您具备较强的事业心和领导能力，适合在管理岗位发挥才能。

【适合行业】
• 金融投资：银行、证券、保险等
• 商业贸易：进出口、批发零售等
• 科技创新：互联网、软件开发等
• 教育培训：学校、培训机构等

【职场优势】
• 思维敏捷，学习能力强
• 沟通协调能力出色
• 具备创新精神和冒险精神
• 责任心强，执行力佳

【发展建议】
• 注重人际关系的建立和维护
• 持续学习新知识和技能
• 把握机遇，勇于挑战
• 培养团队合作精神

【事业高峰期】
30-45岁为您的事业黄金期，此时期应积极进取，争取更大发展。

【注意事项】
避免过于急躁，稳扎稳打更有利于长远发展。
''';
  }

  String _generateLoveAnalysis() {
    return '''
【感情运势概况】
您的感情运势较为平稳，具备吸引异性的魅力，但需要主动出击。

【恋爱特质】
• 重视精神交流，喜欢有内涵的伴侣
• 对感情专一，不喜欢玩暧昧
• 有一定的浪漫情怀
• 希望找到志同道合的人生伴侣

【桃花运势】
桃花运在春季和秋季较旺，此时期容易遇到心仪对象。

【婚姻分析】
婚姻宫稳定，有利于建立长久的感情关系。配偶可能是通过工作或朋友介绍认识。

【感情建议】
• 保持开放的心态，多参加社交活动
• 提升自身魅力，内外兼修
• 学会表达情感，不要过于内敛
• 珍惜眼前人，不要过分挑剔

【最佳配对】
与属相为兔、羊、猪的人较为相配。

【感情禁忌】
避免在感情中过于强势，要学会包容和理解。
''';
  }

  String _generateHealthAnalysis() {
    return '''
【健康运势总览】
您的体质整体较好，但需要注意预防某些慢性疾病。

【体质特点】
• 消化系统较为敏感，需注意饮食调理
• 容易因工作压力导致失眠
• 免疫力中等，需要加强锻炼
• 心血管系统需要重点关注

【易患疾病】
• 胃肠道疾病：胃炎、胃溃疡等
• 心血管疾病：高血压、心脏病等
• 神经系统疾病：失眠、焦虑等
• 呼吸系统疾病：支气管炎、哮喘等

【养生建议】
• 规律作息，保证充足睡眠
• 均衡饮食，少食辛辣刺激食物
• 适量运动，推荐游泳、太极等
• 定期体检，早发现早治疗

【保健方位】
东方为您的健康方位，可在此方位放置绿色植物。

【养生食物】
绿豆、莲子、银耳、梨等有助于调理体质。

【运动建议】
每周至少运动3次，每次30分钟以上。
''';
  }

  void _showErrorDialog(String message) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('提示'),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('确定'),
          ),
        ],
      ),
    );
  }
}