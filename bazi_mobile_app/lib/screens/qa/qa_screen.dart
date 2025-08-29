import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:provider/provider.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../services/qa_service.dart';
import '../../models/qa_model.dart';
import '../../models/bazi_model.dart';
import '../../providers/app_provider.dart';
import '../../utils/shared_preferences_helper.dart';

/// 周易命理问答页面
class QAScreen extends StatefulWidget {
  const QAScreen({super.key});

  @override
  State<QAScreen> createState() => _QAScreenState();
}

class _QAScreenState extends State<QAScreen> {
  final TextEditingController _questionController = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  List<QAModel> _qaHistory = [];
  Map<String, dynamic>? _userBaziData;
  bool _isLoading = false;
  String _currentAnswer = '';
  int _dailyQuestionCount = 0;
  int _remainingQuestions = 10;
  bool _isAnswering = false;
  Timer? _scrollTimer; // 防抖定时器
  String? _lastUserId; // 用于跟踪用户登录状态变化

  @override
  void initState() {
    super.initState();
    _loadUserData();
    _loadQAHistory();
    _loadDailyQuestionCount();
  }

  @override
  void dispose() {
    _questionController.dispose();
    _scrollController.dispose();
    _scrollTimer?.cancel(); // 取消防抖定时器
    super.dispose();
  }

  /// 防抖滚动方法，避免频繁的滚动动画
  void _scheduleAutoScroll() {
    _scrollTimer?.cancel();
    _scrollTimer = Timer(const Duration(milliseconds: 300), () {
      if (_scrollController.hasClients) {
        // 检查用户是否在底部附近（允许一些误差）
        final isNearBottom =
            _scrollController.position.pixels >=
            _scrollController.position.maxScrollExtent - 150;

        // 只有当用户在底部附近时才自动滚动，使用更平滑的动画
        if (isNearBottom) {
          _scrollController.animateTo(
            _scrollController.position.maxScrollExtent,
            duration: const Duration(milliseconds: 200),
            curve: Curves.easeInOut,
          );
        }
      }
    });
  }

  /// 简单计算身强身弱
  String _calculateStrength(String dayMaster, String monthZhi) {
    // 五行生克关系
    final Map<String, List<String>> strongMonths = {
      '甲': ['寅', '卯', '辰'], // 木旺于春
      '乙': ['寅', '卯', '辰'],
      '丙': ['巳', '午', '未'], // 火旺于夏
      '丁': ['巳', '午', '未'],
      '戊': ['辰', '戌', '丑', '未'], // 土旺于四季
      '己': ['辰', '戌', '丑', '未'],
      '庚': ['申', '酉', '戌'], // 金旺于秋
      '辛': ['申', '酉', '戌'],
      '壬': ['亥', '子', '丑'], // 水旺于冬
      '癸': ['亥', '子', '丑'],
    };

    if (strongMonths[dayMaster]?.contains(monthZhi) == true) {
      return '身强';
    } else {
      return '身弱';
    }
  }

  /// 简单计算当前大运
  String _calculateCurrentDayun(dynamic baziData, String gender) {
    try {
      // 获取当前年份
      final currentYear = DateTime.now().year;
      final birthYear = int.parse(baziData.year.substring(0, 4));
      final age = currentYear - birthYear;

      // 简化的大运计算（每10年一个大运）
      final dayunIndex = (age / 10).floor();

      // 六十甲子表（简化版）
      final ganZhi = [
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

      if (dayunIndex < ganZhi.length) {
        return ganZhi[dayunIndex];
      } else {
        return '${ganZhi[dayunIndex % 60]}(第${(dayunIndex / 60).floor() + 1}轮)';
      }
    } catch (e) {
      return '未知';
    }
  }

  /// 加载用户八字数据
  Future<void> _loadUserData() async {
    try {
      final appProvider = Provider.of<AppProvider>(context, listen: false);
      final personalBazi = appProvider.personalBazi;

      print('🔍 QA Screen - 检查personalBazi: $personalBazi');
      print('🔍 QA Screen - personalBazi.baziData: ${personalBazi?.baziData}');

      if (personalBazi != null && personalBazi.baziData != null) {
        print('✅ QA Screen - 八字数据存在，开始构建_userBaziData');

        // 构建完整八字字符串
        final bazi =
            '${personalBazi.baziData!.yearGan}${personalBazi.baziData!.yearZhi} ${personalBazi.baziData!.monthGan}${personalBazi.baziData!.monthZhi} ${personalBazi.baziData!.dayGan}${personalBazi.baziData!.dayZhi} ${personalBazi.baziData!.hourGan}${personalBazi.baziData!.hourZhi}';

        final dayMaster = personalBazi.baziData!.dayGan;
        final monthZhi = personalBazi.baziData!.monthZhi;

        // 尝试调用本地API获取准确的八字分析
        String strength;
        String currentDayun;

        try {
          print('🔍 开始调用本地八字计算API');
          final localResult = await _getLocalBaziCalculation(personalBazi);
          strength =
              localResult['strengthType'] ??
              _calculateStrength(dayMaster, monthZhi);
          currentDayun =
              localResult['currentDayun'] ??
              _calculateCurrentDayun(
                personalBazi.baziData!,
                personalBazi.gender ?? '男',
              );
          print('✅ 本地API调用成功，身强身弱: $strength，当前大运: $currentDayun');
        } catch (e) {
          print('❌ 本地API调用失败: $e，使用简化计算');
          strength = _calculateStrength(dayMaster, monthZhi);
          currentDayun = _calculateCurrentDayun(
            personalBazi.baziData!,
            personalBazi.gender ?? '男',
          );
        }

        setState(() {
          _userBaziData = {
            // 后端期望的基本信息字段
            'name': personalBazi.name ?? '',
            'gender': personalBazi.gender ?? '男',
            'birthDate': personalBazi.birthDate ?? '',
            'birthTime': personalBazi.birthTime ?? '',
            'birthPlace': '', // 暂时设为空，PersonalBaziInfo没有birthPlace字段
            'lunarDate': personalBazi.lunarDate ?? '',

            // 后端期望的八字排盘信息
            'paipan': {
              'yearPillar':
                  '${personalBazi.baziData!.yearGan}${personalBazi.baziData!.yearZhi}',
              'monthPillar':
                  '${personalBazi.baziData!.monthGan}${personalBazi.baziData!.monthZhi}',
              'dayPillar':
                  '${personalBazi.baziData!.dayGan}${personalBazi.baziData!.dayZhi}',
              'hourPillar':
                  '${personalBazi.baziData!.hourGan}${personalBazi.baziData!.hourZhi}',
              'dayMaster': dayMaster,
            },

            // 身强身弱分析
            'strengthType': strength,
            'currentDayun': currentDayun,

            // 兼容旧格式的字段（以防万一）
            'bazi': bazi,
            'dayMaster': dayMaster,
            'strength': strength,
            'pillars': {
              '年柱':
                  '${personalBazi.baziData!.yearGan}${personalBazi.baziData!.yearZhi}',
              '月柱':
                  '${personalBazi.baziData!.monthGan}${personalBazi.baziData!.monthZhi}',
              '日柱':
                  '${personalBazi.baziData!.dayGan}${personalBazi.baziData!.dayZhi}',
              '时柱':
                  '${personalBazi.baziData!.hourGan}${personalBazi.baziData!.hourZhi}',
            },
            'birth_date': personalBazi.birthDate ?? '',
            'birth_time': personalBazi.birthTime ?? '',
            'lunar_date': personalBazi.lunarDate ?? '',
          };
        });
        print('✅ QA Screen - _userBaziData构建完成: $_userBaziData');
      } else {
        print('❌ QA Screen - personalBazi或baziData为空');
        print('   personalBazi: $personalBazi');
        print('   baziData: ${personalBazi?.baziData}');
      }
    } catch (e) {
      print('❌ QA Screen - 加载用户数据失败: $e');
    }
  }

  /// 加载问答历史
  Future<void> _loadQAHistory() async {
    try {
      final history = await SharedPreferencesHelper.getQAHistory();
      setState(() {
        _qaHistory = history;
      });
    } catch (e) {
      print('加载问答历史失败: $e');
    }
  }

  /// 加载每日问题计数
  Future<void> _loadDailyQuestionCount() async {
    try {
      final count = await QAService.getDailyQuestionCount();
      setState(() {
        _dailyQuestionCount = count;
        _remainingQuestions = 10 - count;
      });
    } catch (e) {
      print('加载每日问题计数失败: $e');
    }
  }

  /// 清空对话
  void _clearConversation() {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('清空对话'),
          content: const Text('确定要清空所有对话记录吗？此操作不可撤销。'),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('取消'),
            ),
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
                setState(() {
                  _qaHistory.clear();
                  _currentAnswer = '';
                });
                // 清空本地存储的问答历史
                SharedPreferencesHelper.saveQAHistory([]);
              },
              child: const Text('确定', style: TextStyle(color: Colors.red)),
            ),
          ],
        );
      },
    );
  }

  /// 提交问题
  Future<void> _submitQuestion() async {
    final question = _questionController.text.trim();
    if (question.isEmpty) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('请输入您的问题')));
      return;
    }

    if (_userBaziData == null) {
      _showNoBaziDialog();
      return;
    }

    // 检查每日问题限制
    if (_remainingQuestions <= 0) {
      _showPaymentDialog();
      return;
    }

    setState(() {
      _isLoading = true;
      _isAnswering = true;
      _currentAnswer = '';
    });

    // 开始回答时，滚动到新问题的位置，让用户看到生成过程
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });

    try {
      // 获取用户token
      final appProvider = Provider.of<AppProvider>(context, listen: false);

      // 调用问答API
      print('🔍 QA Screen - 准备发送的八字数据: $_userBaziData');
      print('🔍 QA Screen - 用户token: ${appProvider.user?.token}');

      final answer = await QAService.getAnswer(
        question: question,
        baziData: _userBaziData!,
        userToken: appProvider.user?.token, // 传递用户token
        onStreamData: (data) {
          setState(() {
            _currentAnswer += data;
          });
          // 优化滚动逻辑，减少频繁的滚动动画
          _scheduleAutoScroll();
        },
      );

      // 保存问答记录
      final qaModel = QAModel(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        question: question,
        answer: answer,
        timestamp: DateTime.now(),
      );

      setState(() {
        _qaHistory.add(qaModel);
        // 取消缓存数量限制，保留所有历史记录
        // if (_qaHistory.length > 5) {
        //   _qaHistory.removeAt(0); // 移除最早的记录
        // }
        _dailyQuestionCount++;
        _remainingQuestions = 10 - _dailyQuestionCount;
      });

      // 保存到本地存储
      await SharedPreferencesHelper.saveQAHistory(_qaHistory);
      // 更新服务器端的每日问题计数
      await QAService.updateDailyQuestionCount(_dailyQuestionCount);

      // 清空输入框
      _questionController.clear();
    } catch (e) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('提问失败: $e')));
    } finally {
      setState(() {
        _isLoading = false;
        _isAnswering = false;
        _currentAnswer = '';
      });
    }
  }

  /// 显示无八字数据对话框
  void _showNoBaziDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('需要八字信息'),
        content: const Text('请先在个人中心的"我的八字"中保存您的八字信息，才能进行命理问答。'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('确定'),
          ),
        ],
      ),
    );
  }

  /// 显示付费对话框
  void _showPaymentDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('今日免费次数已用完'),
        content: const Text('您今天的10次免费问答已用完，支付\$1可再获得10次问答机会。'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('取消'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.of(context).pop();
              _processPurchase();
            },
            child: const Text('支付\$1'),
          ),
        ],
      ),
    );
  }

  /// 处理购买
  Future<void> _processPurchase() async {
    try {
      setState(() {
        _isLoading = true;
      });

      // 检查用户余额
      final balance = await QAService.getUserBalance();
      if (balance < 1.0) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('余额不足，请先充值'),
              backgroundColor: Colors.orange,
            ),
          );
        }
        return;
      }

      final success = await QAService.purchaseQuestionPackage();

      if (success) {
        setState(() {
          _dailyQuestionCount = 0;
          _remainingQuestions = 10;
        });

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('购买成功！您获得了10次新的问答机会'),
              backgroundColor: Colors.green,
            ),
          );
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('购买失败，请重试'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    } catch (e) {
      print('购买处理失败: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('购买失败，请重试'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        // 点击空白处隐藏键盘
        FocusScope.of(context).unfocus();
      },
      child: Scaffold(
        backgroundColor: const Color(0xFFF5F7FA),
        appBar: AppBar(
          title: const Text(
            '解惑',
            style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white),
          ),
          backgroundColor: const Color(0xFF3498DB),
          elevation: 0,
          centerTitle: true,
        ),
        body: Column(
          children: [
            // 用户八字信息卡片
            _buildBaziInfoCard(),

            // 问答次数显示
            _buildQuestionCountCard(),

            // 问答历史
            Expanded(child: _buildQAContent()),

            // 输入框
            _buildInputArea(),
          ],
        ),
      ),
    );
  }

  /// 构建八字信息卡片
  Widget _buildBaziInfoCard() {
    return Consumer<AppProvider>(
      builder: (context, provider, child) {
        final personalBazi = provider.personalBazi;

        // 检查用户登录状态变化，重新加载问答次数
        final currentUserId = provider.user?.id;
        if (_lastUserId != currentUserId) {
          _lastUserId = currentUserId;
          if (currentUserId != null) {
            // 用户重新登录，重新加载问答次数
            WidgetsBinding.instance.addPostFrameCallback((_) {
              _loadDailyQuestionCount();
            });
          }
        }

        // 实时更新_userBaziData
        if (personalBazi != null && personalBazi.baziData != null) {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (mounted) {
              setState(() {
                // 构建完整的八字数据，包含AI分析所需的关键信息
                final baziString =
                    '${personalBazi.baziData!.yearGan}${personalBazi.baziData!.yearZhi} ${personalBazi.baziData!.monthGan}${personalBazi.baziData!.monthZhi} ${personalBazi.baziData!.dayGan}${personalBazi.baziData!.dayZhi} ${personalBazi.baziData!.hourGan}${personalBazi.baziData!.hourZhi}';
                final dayMaster = personalBazi.baziData!.dayGan;
                final monthZhi = personalBazi.baziData!.monthZhi;
                final gender = personalBazi.gender ?? 'male';

                _userBaziData = {
                  // 后端期望的基本信息字段
                  'name': personalBazi.name ?? '',
                  'gender': personalBazi.gender ?? '男',
                  'birthDate': personalBazi.birthDate ?? '',
                  'birthTime': personalBazi.birthTime ?? '',
                  'birthPlace': '', // PersonalBaziInfo没有birthPlace字段
                  'lunarDate': personalBazi.lunarDate ?? '',

                  // 后端期望的八字排盘信息
                  'paipan': {
                    'yearPillar':
                        '${personalBazi.baziData!.yearGan}${personalBazi.baziData!.yearZhi}',
                    'monthPillar':
                        '${personalBazi.baziData!.monthGan}${personalBazi.baziData!.monthZhi}',
                    'dayPillar':
                        '${personalBazi.baziData!.dayGan}${personalBazi.baziData!.dayZhi}',
                    'hourPillar':
                        '${personalBazi.baziData!.hourGan}${personalBazi.baziData!.hourZhi}',
                    'dayMaster': dayMaster,
                  },

                  // 身强身弱分析 - 使用已有的_userBaziData中的值，避免重新计算覆盖API结果
                  'strengthType':
                      _userBaziData?['strengthType'] ??
                      _calculateStrength(dayMaster, monthZhi),
                  'currentDayun':
                      _userBaziData?['currentDayun'] ??
                      _calculateCurrentDayun(personalBazi.baziData!, gender),

                  // 兼容旧格式的字段（以防万一）
                  'bazi': baziString,
                  'dayMaster': dayMaster,
                  'strength':
                      _userBaziData?['strengthType'] ??
                      _calculateStrength(dayMaster, monthZhi),
                  'pillars': {
                    '年柱':
                        '${personalBazi.baziData!.yearGan}${personalBazi.baziData!.yearZhi}',
                    '月柱':
                        '${personalBazi.baziData!.monthGan}${personalBazi.baziData!.monthZhi}',
                    '日柱':
                        '${personalBazi.baziData!.dayGan}${personalBazi.baziData!.dayZhi}',
                    '时柱':
                        '${personalBazi.baziData!.hourGan}${personalBazi.baziData!.hourZhi}',
                  },
                  'birth_date': personalBazi.birthDate ?? '',
                  'birth_time': personalBazi.birthTime ?? '',
                  'lunar_date': personalBazi.lunarDate ?? '',
                };

                print('🔄 QA Screen - 实时更新_userBaziData: $_userBaziData');
              });
            }
          });
        } else {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (mounted) {
              setState(() {
                _userBaziData = null;
              });
            }
          });
        }

        if (personalBazi == null || personalBazi.baziData == null) {
          return Container(
            margin: const EdgeInsets.all(16),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.orange.shade50,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.orange.shade200),
            ),
            child: Row(
              children: [
                Icon(Icons.warning, color: Colors.orange.shade600),
                const SizedBox(width: 12),
                const Expanded(
                  child: Text(
                    '请先在个人中心保存您的八字信息',
                    style: TextStyle(fontSize: 14, color: Color(0xFF2C3E50)),
                  ),
                ),
                TextButton(
                  onPressed: () {
                    // 跳转到个人八字页面
                    Navigator.pushNamed(context, '/personal-bazi');
                  },
                  child: const Text('去设置'),
                ),
              ],
            ),
          );
        }

        final pillars = _userBaziData!['pillars'] as Map<String, String>;

        return Container(
          margin: const EdgeInsets.all(16),
          padding: const EdgeInsets.all(16),
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
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(Icons.person, color: Colors.blue.shade600, size: 20),
                  const SizedBox(width: 8),
                  const Text(
                    '您的八字信息',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF2C3E50),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _buildPillarItem('年柱', pillars['年柱'] ?? ''),
                  _buildPillarItem('月柱', pillars['月柱'] ?? ''),
                  _buildPillarItem('日柱', pillars['日柱'] ?? ''),
                  _buildPillarItem('时柱', pillars['时柱'] ?? ''),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  /// 构建柱子项
  Widget _buildPillarItem(String label, String value) {
    return Column(
      children: [
        Text(
          label,
          style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
        ),
        const SizedBox(height: 4),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          decoration: BoxDecoration(
            color: Colors.blue.shade50,
            borderRadius: BorderRadius.circular(6),
          ),
          child: Text(
            value,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.bold,
              color: Colors.blue.shade700,
            ),
          ),
        ),
      ],
    );
  }

  /// 构建问题计数卡片
  Widget _buildQuestionCountCard() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 4,
            offset: const Offset(0, 1),
          ),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Icon(Icons.help_outline, color: Colors.green.shade600, size: 18),
              const SizedBox(width: 8),
              const Text(
                '今日剩余问答次数',
                style: TextStyle(fontSize: 14, color: Color(0xFF2C3E50)),
              ),
            ],
          ),
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 4,
                ),
                decoration: BoxDecoration(
                  color: _remainingQuestions > 0
                      ? Colors.green.shade50
                      : Colors.red.shade50,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  '$_remainingQuestions/10',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: _remainingQuestions > 0
                        ? Colors.green.shade700
                        : Colors.red.shade700,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              TextButton.icon(
                onPressed: _clearConversation,
                icon: const Icon(
                  Icons.clear_all,
                  size: 16,
                  color: Color(0xFF3498DB),
                ),
                label: const Text(
                  '清空对话',
                  style: TextStyle(fontSize: 12, color: Color(0xFF3498DB)),
                ),
                style: TextButton.styleFrom(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 6,
                    vertical: 2,
                  ),
                  minimumSize: Size.zero,
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  /// 构建问答内容
  Widget _buildQAContent() {
    if (_qaHistory.isEmpty && !_isAnswering) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.chat_bubble_outline,
              size: 64,
              color: Colors.grey.shade400,
            ),
            const SizedBox(height: 16),
            Text(
              '开始您的命理问答之旅',
              style: TextStyle(fontSize: 16, color: Colors.grey.shade600),
            ),
            const SizedBox(height: 8),
            Text(
              '基于您的八字信息，为您提供专业的命理解答',
              style: TextStyle(fontSize: 14, color: Colors.grey.shade500),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      controller: _scrollController,
      padding: const EdgeInsets.all(16),
      itemCount: _qaHistory.length + (_isAnswering ? 1 : 0),
      itemBuilder: (context, index) {
        // 如果正在回答，最后一个item是当前回答卡片
        if (_isAnswering && index == _qaHistory.length) {
          return _buildCurrentAnswerCard();
        }

        final qa = _qaHistory[index];
        return _buildQACard(qa);
      },
    );
  }

  /// 构建当前回答卡片
  Widget _buildCurrentAnswerCard() {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
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
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 问题
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.blue.shade50,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(
                  Icons.person,
                  color: Colors.blue.shade600,
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.blue.shade50,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    _questionController.text,
                    style: const TextStyle(
                      fontSize: 14,
                      color: Color(0xFF2C3E50),
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          // 回答
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.green.shade50,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(
                  Icons.auto_awesome,
                  color: Colors.green.shade600,
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.green.shade50,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: _currentAnswer.isEmpty
                      ? Row(
                          children: [
                            SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                valueColor: AlwaysStoppedAnimation<Color>(
                                  Colors.green.shade600,
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            const Text(
                              '正在分析中...',
                              style: TextStyle(
                                fontSize: 14,
                                color: Color(0xFF2C3E50),
                              ),
                            ),
                          ],
                        )
                      : MarkdownBody(
                          data: _currentAnswer,
                          styleSheet: MarkdownStyleSheet(
                            p: const TextStyle(
                              fontSize: 14,
                              color: Color(0xFF2C3E50),
                              height: 1.5,
                            ),
                            h1: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: Colors.green.shade700,
                            ),
                            h2: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: Colors.green.shade700,
                            ),
                            listBullet: TextStyle(color: Colors.green.shade600),
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

  /// 构建问答卡片
  Widget _buildQACard(QAModel qa) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
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
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 时间戳
          Text(
            _formatTimestamp(qa.timestamp),
            style: TextStyle(fontSize: 12, color: Colors.grey.shade500),
          ),
          const SizedBox(height: 12),
          // 问题
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.blue.shade50,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(
                  Icons.person,
                  color: Colors.blue.shade600,
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.blue.shade50,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    qa.question,
                    style: const TextStyle(
                      fontSize: 14,
                      color: Color(0xFF2C3E50),
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          // 回答
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.green.shade50,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(
                  Icons.auto_awesome,
                  color: Colors.green.shade600,
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.green.shade50,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: MarkdownBody(
                    data: qa.answer,
                    styleSheet: MarkdownStyleSheet(
                      p: const TextStyle(
                        fontSize: 14,
                        color: Color(0xFF2C3E50),
                        height: 1.5,
                      ),
                      h1: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Colors.green.shade700,
                      ),
                      h2: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Colors.green.shade700,
                      ),
                      listBullet: TextStyle(color: Colors.green.shade600),
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

  /// 构建输入区域
  Widget _buildInputArea() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 8,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: SafeArea(
        child: Row(
          children: [
            Expanded(
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.grey.shade100,
                  borderRadius: BorderRadius.circular(24),
                ),
                child: TextField(
                  controller: _questionController,
                  decoration: const InputDecoration(
                    hintText: '请输入您的命理问题...',
                    border: InputBorder.none,
                    contentPadding: EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 12,
                    ),
                  ),
                  maxLines: null,
                  textInputAction: TextInputAction.send,
                  onSubmitted: (_) => _submitQuestion(),
                ),
              ),
            ),
            const SizedBox(width: 12),
            GestureDetector(
              onTap: _isLoading ? null : _submitQuestion,
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: _isLoading
                      ? Colors.grey.shade400
                      : const Color(0xFF3498DB),
                  borderRadius: BorderRadius.circular(24),
                ),
                child: _isLoading
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(
                            Colors.white,
                          ),
                        ),
                      )
                    : const Icon(Icons.send, color: Colors.white, size: 20),
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// 格式化时间戳
  String _formatTimestamp(DateTime timestamp) {
    final now = DateTime.now();
    final difference = now.difference(timestamp);

    if (difference.inMinutes < 1) {
      return '刚刚';
    } else if (difference.inHours < 1) {
      return '${difference.inMinutes}分钟前';
    } else if (difference.inDays < 1) {
      return '${difference.inHours}小时前';
    } else {
      return '${timestamp.month}月${timestamp.day}日';
    }
  }

  /// 调用本地API获取准确的八字计算结果
  Future<Map<String, dynamic>> _getLocalBaziCalculation(
    PersonalBaziInfo personalBazi,
  ) async {
    try {
      print('🔍 调用本地八字计算API - 开始');

      final requestData = {
        'name': personalBazi.name ?? '',
        'gender': personalBazi.gender ?? '男',
        'birthDate': personalBazi.birthDate ?? '',
        'birthTime': personalBazi.birthTime ?? '',
        'birthPlace': '',
        'lunarDate': personalBazi.lunarDate ?? '',
        'paipan': {
          'yearPillar':
              '${personalBazi.baziData!.yearGan}${personalBazi.baziData!.yearZhi}',
          'monthPillar':
              '${personalBazi.baziData!.monthGan}${personalBazi.baziData!.monthZhi}',
          'dayPillar':
              '${personalBazi.baziData!.dayGan}${personalBazi.baziData!.dayZhi}',
          'hourPillar':
              '${personalBazi.baziData!.hourGan}${personalBazi.baziData!.hourZhi}',
          'dayMaster': personalBazi.baziData!.dayGan,
        },
      };

      print('🔍 本地API请求数据: ${json.encode(requestData)}');

      final response = await http
          .post(
            Uri.parse('https://api.mybazi.net/bazi/calculate-locally'),
            headers: {'Content-Type': 'application/json'},
            body: json.encode(requestData),
          )
          .timeout(const Duration(seconds: 10));

      print('🔍 本地API响应状态: ${response.statusCode}');
      print('🔍 本地API响应内容: ${response.body}');

      if (response.statusCode == 200) {
        final result = json.decode(response.body);
        print('✅ 本地API调用成功，返回结果: $result');
        // 提取data字段中的实际数据
        if (result['success'] == true && result['data'] != null) {
          return result['data'];
        } else {
          return result;
        }
      } else {
        throw Exception('API调用失败: ${response.statusCode}');
      }
    } catch (e) {
      print('❌ 本地API调用异常: $e');
      rethrow;
    }
  }
}
