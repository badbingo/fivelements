import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../providers/app_provider.dart';
import '../services/qa_service.dart';

class QAScreen extends StatefulWidget {
  const QAScreen({super.key});

  @override
  State<QAScreen> createState() => _QAScreenState();
}

class _QAScreenState extends State<QAScreen> {
  final TextEditingController _questionController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final List<ChatMessage> _messages = [];
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _addWelcomeMessage();
  }

  @override
  void dispose() {
    _questionController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _addWelcomeMessage() {
    _messages.add(
      ChatMessage(
        text:
            '您好！我是您的专属八字顾问。您可以问我关于八字、运势、改运等任何问题。\n\n常见问题：\n• 我的财运如何？\n• 什么时候适合结婚？\n• 如何改善事业运？\n• 我适合什么职业？',
        isUser: false,
        timestamp: DateTime.now(),
      ),
    );
  }

  Future<void> _sendMessage() async {
    final question = _questionController.text.trim();
    if (question.isEmpty) return;

    // 隐藏键盘
    FocusScope.of(context).unfocus();

    // 检查用户余额和登录状态
    final provider = Provider.of<AppProvider>(context, listen: false);

    // 检查用户是否已登录
    if (!provider.isLoggedIn || provider.user?.token == null) {
      setState(() {
        _messages.add(
          ChatMessage(
            text: '用户未登录或登录已过期，请重新登录后再使用问答功能',
            isUser: false,
            timestamp: DateTime.now(),
          ),
        );
      });
      _scrollToBottom();
      _showReLoginDialog();
      return;
    }

    print('🔍 当前用户token: ${provider.user?.token?.substring(0, 20)}...');

    if (provider.user?.balance == null || provider.user!.balance < 10) {
      _showInsufficientBalanceDialog();
      return;
    }

    // 检查是否有八字数据
    if (provider.personalBazi == null) {
      setState(() {
        _messages.add(
          ChatMessage(
            text: '请先在个人中心设置您的八字信息后再使用问答功能',
            isUser: false,
            timestamp: DateTime.now(),
          ),
        );
      });
      _scrollToBottom();
      return;
    }

    // 添加用户消息
    setState(() {
      _messages.add(
        ChatMessage(text: question, isUser: true, timestamp: DateTime.now()),
      );
      _isLoading = true;
    });

    _questionController.clear();
    _scrollToBottom();

    try {
      // 构建八字数据
      final baziData = await _buildBaziData(provider);

      String fullAnswer = '';

      // 调用真正的QA API（流式输出）
      final answer = await QAService.getAnswer(
        question: question,
        baziData: baziData,
        userToken: provider.user?.token, // 传入用户token
        onStreamData: (chunk) {
          try {
            // 处理流式数据
            print('🎯🎯🎯 UI收到流式数据开始: $chunk');
            print('🎯 UI收到流式数据: $chunk');

            fullAnswer += chunk;
            print('📝 当前完整答案: $fullAnswer');

            setState(() {
              // 更新最后一条消息或添加新消息
              if (_messages.isNotEmpty && !_messages.last.isUser) {
                _messages.last = ChatMessage(
                  text: fullAnswer,
                  isUser: false,
                  timestamp: DateTime.now(),
                );
                print('✏️ 更新了最后一条消息');
              } else {
                _messages.add(
                  ChatMessage(
                    text: fullAnswer,
                    isUser: false,
                    timestamp: DateTime.now(),
                  ),
                );
                print('➕ 添加了新消息');
              }
            });

            print('📊 当前消息数量: ${_messages.length}');
            // 移除流式数据处理过程中的自动滚动，让用户可以自由查看生成过程
          } catch (e) {
            print('❌ UI回调执行错误: $e');
          }
        },
      );

      setState(() {
        _isLoading = false;
      });

      // 扣除费用
      await provider.processPayment(10, '智能问答咨询');

      _scrollToBottom();
    } catch (e) {
      setState(() {
        _isLoading = false;
        _messages.add(
          ChatMessage(
            text: '抱歉，回答生成失败，请稍后重试。错误信息：${e.toString()}',
            isUser: false,
            timestamp: DateTime.now(),
          ),
        );
      });
      _scrollToBottom();
    }
  }

  Future<Map<String, dynamic>> _buildBaziData(AppProvider provider) async {
    print('🔍 _buildBaziData函数被调用');
    // 使用用户的个人八字信息
    final personalBazi = provider.personalBazi!; // 此时已确保不为null
    print(
      '🔍 personalBazi信息: ${personalBazi.name}, ${personalBazi.birthDate}, ${personalBazi.birthTime}',
    );

    try {
      // 调用后端的本地计算函数，获取准确的八字信息
      final localResult = await _getLocalBaziCalculation(personalBazi);

      // 构建包含完整信息的八字数据
      return {
        'name': personalBazi.name,
        'gender': personalBazi.gender,
        'birthDate': personalBazi.birthDate,
        'birthTime': personalBazi.birthTime,
        'bazi': {
          'year': '${localResult['yearStem']}${localResult['yearBranch']}',
          'month': '${localResult['monthStem']}${localResult['monthBranch']}',
          'day': '${localResult['dayStem']}${localResult['dayBranch']}',
          'hour': '${localResult['hourStem']}${localResult['hourBranch']}',
        },
        'baziString':
            '${localResult['yearStem']}${localResult['yearBranch']} ${localResult['monthStem']}${localResult['monthBranch']} ${localResult['dayStem']}${localResult['dayBranch']} ${localResult['hourStem']}${localResult['hourBranch']}',
        'luckStartingTime': localResult['luckStartingTime'] ?? '未知',
        'strengthType': localResult['strengthType'] ?? '未知',
        'dayMaster': localResult['dayStem'],
        'elements': localResult['elements'] ?? {},
        'personality': localResult['personality'] ?? {},
        'decadeFortune': localResult['decadeFortune'] ?? [],
        'currentDayun': localResult['currentDayun'] ?? '未知',
        'paipan': {
          'yearPillar':
              '${localResult['yearStem']}${localResult['yearBranch']}',
          'monthPillar':
              '${localResult['monthStem']}${localResult['monthBranch']}',
          'dayPillar': '${localResult['dayStem']}${localResult['dayBranch']}',
          'hourPillar':
              '${localResult['hourStem']}${localResult['hourBranch']}',
          'dayMaster': localResult['dayStem'],
        },
      };
    } catch (e) {
      print('获取本地八字计算失败: $e');
      // 如果本地计算失败，回退到原有的简单计算
      final baziData = personalBazi.baziData;

      if (baziData != null) {
        // 构建包含核心信息的八字数据：用户八字、当前大运、身强身弱
        final bazi =
            '${baziData.yearGan}${baziData.yearZhi} ${baziData.monthGan}${baziData.monthZhi} ${baziData.dayGan}${baziData.dayZhi} ${baziData.hourGan}${baziData.hourZhi}';

        // 简单计算身强身弱（基于日主和月令的关系）
        final dayMaster = baziData.dayGan;
        final monthZhi = baziData.monthZhi;
        String strength = _calculateStrength(dayMaster, monthZhi);

        // 简单计算当前大运（基于年龄和性别）
        String currentDayun = _calculateCurrentDayun(
          baziData,
          personalBazi.gender,
        );

        return {
          'name': personalBazi.name,
          'gender': personalBazi.gender,
          'birthDate': personalBazi.birthDate,
          'birthTime': personalBazi.birthTime,
          'bazi': bazi, // 完整八字
          'dayMaster': dayMaster, // 日主
          'strength': strength, // 身强身弱
          'currentDayun': currentDayun, // 当前大运
          'paipan': {
            'yearPillar': '${baziData.yearGan}${baziData.yearZhi}',
            'monthPillar': '${baziData.monthGan}${baziData.monthZhi}',
            'dayPillar': '${baziData.dayGan}${baziData.dayZhi}',
            'hourPillar': '${baziData.hourGan}${baziData.hourZhi}',
            'dayMaster': dayMaster,
          },
        };
      } else {
        // 如果没有完整八字数据，返回基本信息
        return {
          'name': personalBazi.name,
          'gender': personalBazi.gender,
          'birthDate': personalBazi.birthDate,
          'birthTime': personalBazi.birthTime,
          'bazi': '八字信息不完整',
          'strength': '未知',
          'currentDayun': '未知',
        };
      }
    }
  }

  // 简单计算身强身弱
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

  // 简单计算当前大运
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

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  void _showInsufficientBalanceDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('余额不足'),
        content: const Text('智能问答需要消耗10元，您的余额不足。请先充值后再使用此功能。'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('取消'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              Navigator.pushNamed(context, '/recharge');
            },
            child: const Text('去充值'),
          ),
        ],
      ),
    );
  }

  void _showReLoginDialog() {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('需要重新登录'),
          content: const Text('您的登录状态已过期，请重新登录后再使用问答功能。'),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('取消'),
            ),
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
                // 跳转到登录页面
                Navigator.of(context).pushReplacementNamed('/login');
              },
              child: const Text('重新登录'),
            ),
          ],
        );
      },
    );
  }

  void _clearChat() {
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
                  _messages.clear();
                  _addWelcomeMessage();
                });
              },
              child: const Text('确定', style: TextStyle(color: Colors.red)),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        // 点击空白处隐藏键盘
        FocusScope.of(context).unfocus();
      },
      child: Scaffold(
        backgroundColor: const Color(0xFFF8F9FA),
        appBar: AppBar(
          title: const Text('智能问答'),
          backgroundColor: const Color(0xFF3498DB),
          foregroundColor: Colors.white,
          elevation: 0,
          actions: [
            Consumer<AppProvider>(
              builder: (context, provider, child) {
                return Padding(
                  padding: const EdgeInsets.only(right: 16),
                  child: Center(
                    child: Text(
                      '余额: \$${provider.user?.balance.toStringAsFixed(2) ?? '0.00'}',
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                );
              },
            ),
          ],
        ),
        body: Column(
          children: [
            Expanded(
              child: ListView.builder(
                controller: _scrollController,
                padding: const EdgeInsets.all(16),
                itemCount: _messages.length + (_isLoading ? 1 : 0),
                itemBuilder: (context, index) {
                  if (index == _messages.length && _isLoading) {
                    return _buildLoadingMessage();
                  }
                  return _buildMessageBubble(_messages[index]);
                },
              ),
            ),
            _buildInputArea(),
          ],
        ),
      ),
    );
  }

  Widget _buildMessageBubble(ChatMessage message) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      child: Row(
        mainAxisAlignment: message.isUser
            ? MainAxisAlignment.end
            : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (!message.isUser) ...[
            CircleAvatar(
              radius: 20,
              backgroundColor: const Color(0xFF3498DB),
              child: const Icon(
                Icons.psychology,
                color: Colors.white,
                size: 20,
              ),
            ),
            const SizedBox(width: 8),
          ],
          Flexible(
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: message.isUser ? const Color(0xFF3498DB) : Colors.white,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    blurRadius: 5,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    message.text,
                    style: TextStyle(
                      fontSize: 16,
                      height: 1.5,
                      color: message.isUser
                          ? Colors.white
                          : const Color(0xFF2C3E50),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _formatTime(message.timestamp),
                    style: TextStyle(
                      fontSize: 12,
                      color: message.isUser ? Colors.white70 : Colors.grey[600],
                    ),
                  ),
                ],
              ),
            ),
          ),
          if (message.isUser) ...[
            const SizedBox(width: 8),
            CircleAvatar(
              radius: 20,
              backgroundColor: Colors.grey[300],
              child: const Icon(Icons.person, color: Colors.grey, size: 20),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildLoadingMessage() {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CircleAvatar(
            radius: 20,
            backgroundColor: const Color(0xFF3498DB),
            child: const Icon(Icons.psychology, color: Colors.white, size: 20),
          ),
          const SizedBox(width: 8),
          Flexible(
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    blurRadius: 5,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: Color(0xFF3498DB),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Text(
                    'AI正在思考中...',
                    style: TextStyle(fontSize: 16, color: Colors.grey[600]),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInputArea() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: SafeArea(
        child: Column(
          children: [
            // 顶部信息栏：今日剩余次数和清空按钮
            Consumer<AppProvider>(
              builder: (context, provider, child) {
                final remainingCount = 10; // 暂时固定为10次，后续从后端获取
                return Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        '今日剩余问答次数: $remainingCount',
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.grey[600],
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      TextButton.icon(
                        onPressed: _clearChat,
                        icon: const Icon(
                          Icons.clear_all,
                          size: 18,
                          color: Color(0xFF3498DB),
                        ),
                        label: const Text(
                          '清空对话',
                          style: TextStyle(
                            fontSize: 14,
                            color: Color(0xFF3498DB),
                          ),
                        ),
                        style: TextButton.styleFrom(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 4,
                          ),
                          minimumSize: Size.zero,
                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
            // 输入框和发送按钮
            Row(
              children: [
                Expanded(
                  child: Container(
                    decoration: BoxDecoration(
                      color: const Color(0xFFF8F9FA),
                      borderRadius: BorderRadius.circular(24),
                    ),
                    child: TextField(
                      controller: _questionController,
                      decoration: const InputDecoration(
                        hintText: '请输入您的问题...',
                        border: InputBorder.none,
                        contentPadding: EdgeInsets.symmetric(
                          horizontal: 20,
                          vertical: 12,
                        ),
                      ),
                      maxLines: null,
                      textInputAction: TextInputAction.send,
                      onSubmitted: (_) => _sendMessage(),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Container(
                  decoration: const BoxDecoration(
                    color: Color(0xFF3498DB),
                    shape: BoxShape.circle,
                  ),
                  child: IconButton(
                    onPressed: _isLoading ? null : _sendMessage,
                    icon: const Icon(Icons.send, color: Colors.white),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  String _formatTime(DateTime time) {
    return '${time.hour.toString().padLeft(2, '0')}:${time.minute.toString().padLeft(2, '0')}';
  }

  // 新增方法：调用后端本地计算函数
  Future<Map<String, dynamic>> _getLocalBaziCalculation(
    dynamic personalBazi,
  ) async {
    try {
      print('🔍 开始调用本地八字计算API');
      print('🔍 API地址: https://api.mybazi.net/bazi/calculate-locally');
      print(
        '🔍 请求数据: ${json.encode({'name': personalBazi.name, 'birthDate': personalBazi.birthDate, 'birthTime': personalBazi.birthTime, 'gender': personalBazi.gender})}',
      );

      final response = await http.post(
        Uri.parse('https://api.mybazi.net/bazi/calculate-locally'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'name': personalBazi.name,
          'birthDate': personalBazi.birthDate,
          'birthTime': personalBazi.birthTime,
          'gender': personalBazi.gender,
        }),
      );

      print('🔍 API响应状态码: ${response.statusCode}');
      print('🔍 API响应内容: ${response.body}');

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        print('🔍 解析后的数据: ${data['data']}');
        return data['data'] ?? {};
      } else {
        print('❌ 本地计算失败: ${response.statusCode}');
        throw Exception('本地计算失败: ${response.statusCode}');
      }
    } catch (e) {
      print('❌ 调用本地计算API失败: $e');
      throw Exception('调用本地计算API失败: $e');
    }
  }

  String _determineStrengthType(Map<String, dynamic> wuxingData) {
    // 根据五行平衡状态判断身强身弱
    final balance = wuxingData['balance'] as String? ?? '';

    if (balance.contains('偏强') || balance.contains('过强')) {
      return '身强';
    } else if (balance.contains('偏弱') || balance.contains('过弱')) {
      return '身弱';
    } else if (balance.contains('平衡')) {
      return '身平';
    }

    // 如果没有明确的平衡状态，根据最强元素判断
    final strongestElement = wuxingData['strongestElement'] as String? ?? '';
    final percentages =
        wuxingData['percentages'] as Map<String, dynamic>? ?? {};

    if (percentages.isNotEmpty) {
      final maxPercentage = percentages.values.cast<double>().reduce(
        (a, b) => a > b ? a : b,
      );
      if (maxPercentage > 40) {
        return '身强';
      } else if (maxPercentage < 15) {
        return '身弱';
      }
    }

    return '身平';
  }
}

class ChatMessage {
  final String text;
  final bool isUser;
  final DateTime timestamp;

  ChatMessage({
    required this.text,
    required this.isUser,
    required this.timestamp,
  });
}
