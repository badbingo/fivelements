import 'package:flutter/material.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import '../services/bazi_api_service.dart';
import '../services/strength_analysis_service.dart';
import '../services/share_service.dart';

class DetailedAnalysisScreen extends StatefulWidget {
  const DetailedAnalysisScreen({super.key});

  @override
  State<DetailedAnalysisScreen> createState() => _DetailedAnalysisScreenState();
}

class _DetailedAnalysisScreenState extends State<DetailedAnalysisScreen> {
  Map<String, dynamic>? baziData;
  Map<String, String> analysisResults = {};
  Map<String, bool> loadingStates = {};
  Map<String, bool> expandedStates = {}; // 新增：跟踪展开状态

  // 九个分析模块的配置
  final List<Map<String, dynamic>> analysisModules = [
    {
      'type': 'full-analysis',
      'title': '命理全解',
      'icon': Icons.auto_awesome,
      'color': Color(0xFF9B59B6),
      'description': '全面解析八字格局、五行旺衰、用神喜忌',
    },
    {
      'type': 'annual-fortune',
      'title': '流年分析',
      'icon': Icons.calendar_today,
      'color': Color(0xFFE74C3C),
      'description': '分析当前及未来几年的运势变化',
    },
    {
      'type': 'monthly-fortune',
      'title': '流月分析',
      'icon': Icons.date_range,
      'color': Color(0xFFF39C12),
      'description': '详解各月份运势起伏和注意事项',
    },
    {
      'type': 'decade-fortune',
      'title': '十年大运分析',
      'icon': Icons.trending_up,
      'color': Color(0xFF27AE60),
      'description': '解析十年大运的变化趋势和机遇',
    },
    {
      'type': 'personality',
      'title': '性格分析',
      'icon': Icons.psychology,
      'color': Color(0xFF3498DB),
      'description': '深入分析性格特征和人际交往特点',
    },
    {
      'type': 'career',
      'title': '事业财富',
      'icon': Icons.work,
      'color': Color(0xFF16A085),
      'description': '分析事业发展方向和财富积累方式',
    },
    {
      'type': 'marriage',
      'title': '婚姻分析',
      'icon': Icons.favorite,
      'color': Color(0xFFE91E63),
      'description': '解析感情运势和婚姻时机预测',
    },
    {
      'type': 'children',
      'title': '子女分析',
      'icon': Icons.child_care,
      'color': Color(0xFFFF9800),
      'description': '分析子女缘分和教育方式建议',
    },
    {
      'type': 'health',
      'title': '健康分析',
      'icon': Icons.health_and_safety,
      'color': Color(0xFF4CAF50),
      'description': '分析体质特点和养生保健建议',
    },
  ];

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (baziData == null) {
      baziData =
          ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>?;
      // 调试输出
      print('DetailedAnalysisScreen - baziData: $baziData');
      if (baziData != null && baziData!['paipan'] != null) {
        print('paipan data: ${baziData!['paipan']}');
      }
      // 初始化加载状态
      for (var module in analysisModules) {
        loadingStates[module['type']] = false;
      }
    }
  }

  // 格式化分析结果文本（使用与财富分析相同的优化方法）
  String _formatAnalysisText(String rawText) {
    if (rawText.isEmpty) return rawText;
    return _prepareMarkdownContent(rawText);
  }

  // 准备Markdown内容（参考财富分析的优化方法）
  String _prepareMarkdownContent(String content) {
    // 移除免责声明
    String cleaned = content.replaceAll(RegExp(r'以上内容由.*?生成.*?仅供参考.*?'), '');
    cleaned = cleaned.replaceAll(RegExp(r'.*?DeepSeek.*?生成.*?'), '');
    cleaned = cleaned.replaceAll(RegExp(r'仅供参考.*'), '');
    cleaned = cleaned.replaceAll(RegExp(r'.*?AI.*?生成.*?'), '');
    cleaned = cleaned.replaceAll(RegExp(r'.*?人工智能.*?'), '');
    cleaned = cleaned.replaceAll(RegExp(r'，仅供娱乐参考。'), '');

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

  // 判断是否为标题行
  bool _isTitle(String line) {
    if (line.length > 50) return false; // 太长的行不是标题

    // 数字开头的行（如：1. 、一、等）
    if (RegExp(r'^[0-9一二三四五六七八九十]+[、.]').hasMatch(line)) return true;

    // 包含特定关键词的短行
    List<String> titleKeywords = [
      '总体运势',
      '性格特征',
      '事业发展',
      '财富状况',
      '感情婚姻',
      '健康状况',
      '人际关系',
      '学业运势',
      '家庭关系',
      '注意事项',
      '建议',
      '总结',
      '概述',
      '分析',
      '运势',
      '特点',
      '方向',
      '趋势',
    ];

    for (String keyword in titleKeywords) {
      if (line.contains(keyword) && line.length < 20) return true;
    }

    return false;
  }

  // 构建格式化的文本显示组件（使用MarkdownBody）
  Widget _buildFormattedText(String text, Color themeColor) {
    return MarkdownBody(
      data: text,
      selectable: true,
      styleSheet: MarkdownStyleSheet(
        h1: TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.bold,
          color: themeColor,
          height: 1.4,
        ),
        h2: TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.bold,
          color: themeColor,
          height: 1.4,
        ),
        h3: TextStyle(
          fontSize: 15,
          fontWeight: FontWeight.w600,
          color: themeColor,
          height: 1.4,
        ),
        p: const TextStyle(fontSize: 14, color: Color(0xFF2C3E50), height: 1.6),
        listBullet: const TextStyle(
          fontSize: 14,
          color: Color(0xFF2C3E50),
          height: 1.6,
        ),
        strong: const TextStyle(
          fontWeight: FontWeight.bold,
          color: Color(0xFF2C3E50),
        ),
        em: const TextStyle(
          fontStyle: FontStyle.italic,
          color: Color(0xFF2C3E50),
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
        h1Padding: const EdgeInsets.only(top: 16, bottom: 8),
        h2Padding: const EdgeInsets.only(top: 16, bottom: 8),
        h3Padding: const EdgeInsets.only(top: 12, bottom: 6),
        pPadding: const EdgeInsets.only(bottom: 8),
        listIndent: 16,
        blockquotePadding: const EdgeInsets.all(12),
        codeblockPadding: const EdgeInsets.all(12),
      ),
    );
  }

  // 处理分析内容的展开和收起
  void _handleAnalysisToggle(String analysisType) {
    final bool hasResult =
        analysisResults[analysisType] != null &&
        analysisResults[analysisType]!.isNotEmpty;
    final bool isExpanded = expandedStates[analysisType] ?? false;

    if (hasResult && isExpanded) {
      // 如果已有结果且已展开，则收起
      setState(() {
        expandedStates[analysisType] = false;
      });
    } else if (hasResult && !isExpanded) {
      // 如果已有结果但未展开，则展开
      setState(() {
        expandedStates[analysisType] = true;
      });
    } else {
      // 如果没有结果，则加载分析
      _loadAnalysis(analysisType);
    }
  }

  Future<void> _loadAnalysis(String analysisType) async {
    if (baziData == null) return;

    setState(() {
      loadingStates[analysisType] = true;
    });

    try {
      // 确保baziData包含完整的用户信息
      Map<String, dynamic> completeData = Map<String, dynamic>.from(baziData!);

      // 添加身强身弱分析信息
      if (baziData!['enhancedData'] != null) {
        final enhancedData = baziData!['enhancedData'] as Map<String, dynamic>;
        completeData['strengthAnalysis'] = enhancedData['strength'];
        completeData['dayunInfo'] = enhancedData['dayun'];
        completeData['tenGods'] = enhancedData['tenGods'];
        completeData['elements'] = enhancedData['elements'];
      }

      // 添加用户信息栏中的计算结果，避免API重复计算
      completeData['luckStartingTime'] = _getLuckStartingTime();
      completeData['currentDayun'] = _getCurrentDayun();
      completeData['strengthType'] = _getStrengthAnalysis();

      // 添加当前时间信息
      completeData['currentTime'] = DateTime.now().toIso8601String();
      completeData['currentYear'] = DateTime.now().year;
      completeData['currentMonth'] = DateTime.now().month;
      completeData['currentDay'] = DateTime.now().day;

      // 清空之前的分析内容，准备接收流式数据
      setState(() {
        analysisResults[analysisType] = '';
      });

      final result = await BaziApiService().getAIDetailedAnalysis(
        completeData,
        analysisType,
        onStreamData: (String chunk) {
          if (mounted) {
            setState(() {
              final currentContent = analysisResults[analysisType] ?? '';
              analysisResults[analysisType] = currentContent + chunk;
              expandedStates[analysisType] = true; // 开始接收数据时展开
            });
          }
        },
      );

      if (mounted) {
        setState(() {
          String rawContent = result['content'] ?? '分析内容获取失败';
          analysisResults[analysisType] = _formatAnalysisText(rawContent);
          loadingStates[analysisType] = false;
          expandedStates[analysisType] = true; // 加载完成后自动展开
        });
      }
    } catch (error) {
      setState(() {
        analysisResults[analysisType] = '分析失败：$error\n\n点击下方重试按钮可以重新获取分析';
        loadingStates[analysisType] = false;
        expandedStates[analysisType] = true; // 即使失败也展开显示错误信息
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('获取分析失败：$error'),
            backgroundColor: Colors.red,
            action: SnackBarAction(
              label: '重试',
              textColor: Colors.white,
              onPressed: () => _loadAnalysis(analysisType),
            ),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (baziData == null) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('详细分析'),
          backgroundColor: const Color(0xFF3498DB),
          foregroundColor: Colors.white,
        ),
        body: const Center(child: Text('数据加载失败')),
      );
    }

    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      appBar: AppBar(
        title: const Text('九大分析模块'),
        backgroundColor: const Color(0xFF3498DB),
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 用户信息卡片
            _buildUserInfoCard(),
            const SizedBox(height: 20),

            // 分析模块网格
            _buildAnalysisGrid(),
          ],
        ),
      ),
    );
  }

  Widget _buildUserInfoCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFF3498DB), Color(0xFF2980B9)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(12),
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
              Icon(Icons.person, color: Colors.white, size: 24),
              const SizedBox(width: 8),
              Text(
                baziData!['name'] ?? '未知',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          _buildInfoRow('性别', baziData!['gender'] ?? '未知', Icons.wc),
          _buildInfoRow(
            '出生时间',
            baziData!['birthDate'] ?? '未知',
            Icons.access_time,
          ),
          _buildInfoRow('起运时间', _getLuckStartingTime(), Icons.schedule),
          _buildInfoRow('当前大运', _getCurrentDayun(), Icons.trending_up),
          _buildInfoRow('身强身弱', _getStrengthAnalysis(), Icons.fitness_center),
          if (baziData!['paipan'] != null) ...[
            const SizedBox(height: 8),
            _buildBaziInfo(),
          ],
        ],
      ),
    );
  }

  Widget _buildInfoRow(String label, String value, IconData icon) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        children: [
          Icon(icon, color: Colors.white70, size: 16),
          const SizedBox(width: 8),
          Text(
            '$label：',
            style: const TextStyle(
              color: Colors.white70,
              fontSize: 14,
              fontWeight: FontWeight.w500,
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 14,
                fontWeight: FontWeight.w400,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBaziInfo() {
    final paipan = baziData!['paipan'];
    if (paipan == null) return const SizedBox.shrink();

    return Container(
      margin: const EdgeInsets.only(top: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.white.withOpacity(0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.calendar_today, color: Colors.white70, size: 16),
              const SizedBox(width: 8),
              Text(
                '八字排盘：',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildPillarInfo('年柱', paipan['yearPillar'] ?? ''),
              _buildPillarInfo('月柱', paipan['monthPillar'] ?? ''),
              _buildPillarInfo('日柱', paipan['dayPillar'] ?? ''),
              _buildPillarInfo('时柱', paipan['hourPillar'] ?? ''),
            ],
          ),
          if (paipan['dayMaster'] != null) ...[
            const SizedBox(height: 8),
            Center(
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 4,
                ),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  '日主: ${paipan['dayMaster']}',
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                    fontSize: 12,
                  ),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  // 获取起运时间（使用前端算法）
  String _getLuckStartingTime() {
    try {
      // 从baziData中获取八字信息
      final paipan = baziData!['paipan'];
      if (paipan == null) return '8岁起运';

      // 获取年柱天干
      final yearPillar = paipan['yearPillar']?.toString() ?? '';
      if (yearPillar.isEmpty) return '8岁起运';

      final yearGan = yearPillar[0];
      final gender = baziData!['gender']?.toString() ?? '男';

      // 判断阴阳年和性别
      final yangTianGan = ['甲', '丙', '戊', '庚', '壬'];
      final yinTianGan = ['乙', '丁', '己', '辛', '癸'];
      final isMale = gender == '男';

      String direction;
      if ((yangTianGan.contains(yearGan) && isMale) ||
          (yinTianGan.contains(yearGan) && !isMale)) {
        direction = '顺排'; // 阳年男 or 阴年女
      } else {
        direction = '逆排'; // 阴年男 or 阳年女
      }

      // 使用出生日期进行节气天数差计算
      String? birthDateTimeStr = baziData!['birthDateTime']?.toString();
      birthDateTimeStr ??= baziData!['birthDate']?.toString();
      if (birthDateTimeStr != null) {
        final birthDate = DateTime.parse(birthDateTimeStr);
        print('出生日期: $birthDate, 方向: $direction');
        final estimatedDaysDiff = _estimateDaysToJieQi(
          birthDate.month,
          direction,
          birthDate.day,
        );

        // 起运年龄计算：3天 = 1岁
        final totalDays = estimatedDaysDiff;
        final years = (totalDays / 3).floor();
        final remainingDays = totalDays % 3;
        final months = (remainingDays * 4).round(); // 3天=1岁=12个月，所以1天=4个月

        return '$direction，$years岁$months个月起运';
      }

      return '8岁起运';
    } catch (e) {
      return '8岁起运';
    }
  }

  // 获取当前大运（使用八字页面的完整算法）
  String _getCurrentDayun() {
    try {
      // 优先使用currentDayun字段
      final currentDayun = baziData!['currentDayun'];
      if (currentDayun != null &&
          currentDayun.toString().isNotEmpty &&
          currentDayun.toString() != '未知') {
        return currentDayun.toString();
      }

      // 使用完整的大运计算算法
      final paipan = baziData!['paipan'];
      if (paipan == null) return '未知';

      // 获取月柱和年柱
      final monthPillar = paipan['monthPillar']?.toString() ?? '';
      final yearPillar = paipan['yearPillar']?.toString() ?? '';
      if (monthPillar.isEmpty || yearPillar.isEmpty) return '未知';

      final yearGan = yearPillar[0];

      // 判断顺逆排
      final yangTianGan = ['甲', '丙', '戊', '庚', '壬'];
      final yinTianGan = ['乙', '丁', '己', '辛', '癸'];
      final gender = baziData!['gender']?.toString() ?? 'male';
      final isMale = gender == 'male' || gender == '男';

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

      // 获取出生日期
      String? birthDateTimeStr = baziData!['birthDateTime']?.toString();
      birthDateTimeStr ??= baziData!['birthDate']?.toString();
      if (birthDateTimeStr == null) return '未知';

      final birthDate = DateTime.parse(birthDateTimeStr);
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

    if (direction == '顺排') {
      // 找下一个节气
      if (currentDay < jieQiDay) {
        final daysDiff = (jieQiDay - currentDay).toDouble();
        return daysDiff;
      } else {
        // 下个月的节气
        final nextMonth = month == 12 ? 1 : month + 1;
        final nextJieQiDay = jieQiDays[nextMonth] ?? 6;
        final currentYear = DateTime.now().year;
        final daysInMonth = DateTime(currentYear, month + 1, 0).day;
        final daysDiff = (daysInMonth - currentDay + nextJieQiDay).toDouble();
        return daysDiff;
      }
    } else {
      // 逆排：找上一个节气（修正逻辑）
      if (currentDay >= jieQiDay) {
        // 当月节气已过或当天，计算到当月节气的天数
        final daysDiff = (currentDay - jieQiDay).toDouble();
        return daysDiff;
      } else {
        // 当月节气未过，计算到上个月节气的天数
        final prevMonth = month == 1 ? 12 : month - 1;
        final prevJieQiDay = jieQiDays[prevMonth] ?? 6;
        final currentYear = DateTime.now().year;
        final daysInPrevMonth = DateTime(currentYear, month, 0).day;
        final daysDiff = (currentDay + (daysInPrevMonth - prevJieQiDay))
            .toDouble();
        return daysDiff;
      }
    }
  }

  // 获取身强身弱分析（直接调用StrengthAnalysisService）
  String _getStrengthAnalysis() {
    try {
      // 从baziData中获取八字信息
      final paipan = baziData!['paipan'];
      if (paipan == null) return '未知';

      // 获取四柱信息
      final yearPillar = paipan['yearPillar']?.toString() ?? '';
      final monthPillar = paipan['monthPillar']?.toString() ?? '';
      final dayPillar = paipan['dayPillar']?.toString() ?? '';
      final hourPillar = paipan['hourPillar']?.toString() ?? '';

      if (yearPillar.isEmpty ||
          monthPillar.isEmpty ||
          dayPillar.isEmpty ||
          hourPillar.isEmpty) {
        return '未知';
      }

      // 提取天干地支
      final stems = [
        yearPillar[0],
        monthPillar[0],
        dayPillar[0],
        hourPillar[0],
      ];
      final branches = [
        yearPillar[1],
        monthPillar[1],
        dayPillar[1],
        hourPillar[1],
      ];

      // 直接调用StrengthAnalysisService计算原命局身强身弱
      final originalAnalysis =
          StrengthAnalysisService.calculateOriginalStrength(stems, branches);

      return originalAnalysis.strengthType;
    } catch (e) {
      print('身强身弱分析错误: $e');
      return '未知';
    }
  }

  Widget _buildPillarInfo(String label, String value) {
    return Column(
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 11,
            color: Colors.white70,
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(height: 2),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.2),
            borderRadius: BorderRadius.circular(4),
            border: Border.all(color: Colors.white.withOpacity(0.3)),
          ),
          child: Text(
            value,
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildAnalysisGrid() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          '点击下方按钮获取周易命理库分析结果',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: Color(0xFF2C3E50),
          ),
        ),
        const SizedBox(height: 16),

        // 使用Column而不是GridView，确保所有按钮都在同一页面
        ...analysisModules.map((module) => _buildAnalysisCard(module)),
      ],
    );
  }

  // 分享分析结果
  Future<void> _shareAnalysisResult(String title, String content) async {
    final userName = baziData!['name'] ?? '用户';

    await ShareService.shareDetailedAnalysis(
      context: context,
      name: userName,
      moduleTitle: title,
      analysis: content,
    );
  }

  Widget _buildAnalysisCard(Map<String, dynamic> module) {
    final String type = module['type'];
    final bool isLoading = loadingStates[type] ?? false;
    final String? result = analysisResults[type];
    final bool hasResult = result != null && result.isNotEmpty;
    final bool isExpanded = expandedStates[type] ?? false;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
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
        children: [
          // 分析按钮
          InkWell(
            onTap: isLoading ? null : () => _handleAnalysisToggle(type),
            borderRadius: BorderRadius.circular(12),
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  // 图标
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: (module['color'] as Color).withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(
                      module['icon'],
                      color: module['color'],
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 16),

                  // 标题和描述
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          module['title'],
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF2C3E50),
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          module['description'],
                          style: const TextStyle(
                            fontSize: 12,
                            color: Color(0xFF7F8C8D),
                          ),
                        ),
                      ],
                    ),
                  ),

                  // 状态指示器
                  if (isLoading)
                    const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation<Color>(
                          Color(0xFF3498DB),
                        ),
                      ),
                    )
                  else if (hasResult && isExpanded)
                    Icon(Icons.expand_less, color: module['color'], size: 24)
                  else if (hasResult && !isExpanded)
                    Icon(Icons.expand_more, color: module['color'], size: 24)
                  else
                    Icon(Icons.play_arrow, color: module['color'], size: 24),
                ],
              ),
            ),
          ),

          // 分析结果
          if (hasResult && isExpanded) ...[
            const Divider(height: 1),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(
                        Icons.auto_awesome,
                        color: module['color'],
                        size: 16,
                      ),
                      const SizedBox(width: 8),
                      const Text(
                        '周易命理库分析结果',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF2C3E50),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: (module['color'] as Color).withOpacity(0.05),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: (module['color'] as Color).withOpacity(0.2),
                      ),
                    ),
                    child: _buildFormattedText(result, module['color']),
                  ),
                  // 分享和重试按钮
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      // 分享按钮
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: () =>
                              _shareAnalysisResult(module['title'], result),
                          icon: const Icon(Icons.share, size: 18),
                          label: const Text('分享'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.grey[600],
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                          ),
                        ),
                      ),
                      // 如果分析失败，显示重试按钮
                      if (result.contains('分析失败')) ...[
                        const SizedBox(width: 12),
                        Expanded(
                          child: ElevatedButton.icon(
                            onPressed: () => _loadAnalysis(type),
                            icon: const Icon(Icons.refresh, size: 18),
                            label: const Text('重新分析'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: module['color'],
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 12),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}
