import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'dart:math' as math;
import '../providers/app_provider.dart';
import '../models/liuyao_models.dart';
import '../services/liuyao_service.dart';
import '../services/deepseek_service.dart';
import '../services/liuyao_history_service.dart';
import '../services/unlock_service.dart';
import '../services/share_service.dart';
import '../services/auth_service.dart';
import '../screens/recharge_screen.dart';

class LiuyaoScreen extends StatefulWidget {
  const LiuyaoScreen({super.key});

  @override
  State<LiuyaoScreen> createState() => _LiuyaoScreenState();
}

class _LiuyaoScreenState extends State<LiuyaoScreen>
    with TickerProviderStateMixin {
  String _question = '';
  List<Yao> _yaos = [];
  bool _isCalculating = false;
  bool _deepAnalysisLoading = false;
  bool _isShaking = false;
  LiuyaoResult? _result;
  final LiuyaoService _liuyaoService = LiuyaoService();
  final DeepSeekService _deepSeekService = DeepSeekService();
  final LiuyaoHistoryService _historyService = LiuyaoHistoryService();
  final FocusNode _questionFocusNode = FocusNode();

  late AnimationController _shakeController;
  late AnimationController _coinController;
  late Animation<double> _shakeAnimation;
  late Animation<double> _coinRotation;

  @override
  void initState() {
    super.initState();
    _shakeController = AnimationController(
      duration: const Duration(milliseconds: 3000),
      vsync: this,
    );
    _coinController = AnimationController(
      duration: const Duration(milliseconds: 600),
      vsync: this,
    );
    _shakeAnimation = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _shakeController, curve: Curves.elasticOut),
    );
    _coinRotation = Tween<double>(begin: 0, end: 4 * math.pi).animate(
      CurvedAnimation(parent: _coinController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _shakeController.dispose();
    _coinController.dispose();
    _questionFocusNode.dispose();
    super.dispose();
  }

  void _dismissKeyboard() {
    _questionFocusNode.unfocus();
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<AppProvider>(
      builder: (context, provider, child) {
        return Scaffold(
          body: Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Color(0xFF2C1810), // 深棕色 - 传统易学色调
                  Color(0xFF3D2914), // 中棕色
                  Color(0xFF4A3728), // 浅棕色
                  Color(0xFF1A1A1A), // 深黑色底部
                ],
                stops: [0.0, 0.3, 0.7, 1.0],
              ),
            ),
            child: SafeArea(
              child: GestureDetector(
                onTap: _dismissKeyboard,
                child: Column(
                  children: [
                    // 自定义AppBar
                    _buildCustomAppBar(),
                    // 主要内容
                    Expanded(
                      child: SingleChildScrollView(
                        padding: const EdgeInsets.all(16.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            // 占卜说明卡片
                            _buildInstructionCard(),
                            const SizedBox(height: 20),

                            // 问题输入区域
                            _buildQuestionInput(),
                            const SizedBox(height: 20),

                            // 摇卦动画区域
                            if (_isShaking) _buildShakingAnimation(),
                            if (_isShaking) const SizedBox(height: 20),

                            // 起卦按钮
                            _buildDivinationButton(),
                            const SizedBox(height: 20),

                            // 卦象显示区域
                            if (_yaos.isNotEmpty) _buildHexagramDisplay(),
                            const SizedBox(height: 20),

                            // RESULT区域
                            if (_result != null) _buildResultDisplay(),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildCustomAppBar() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            const Color(0xFF8B4513), // 传统棕色
            const Color(0xFFD2691E), // 橙棕色
            const Color(0xFFCD853F), // 沙棕色
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.4),
            blurRadius: 15,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  Colors.white.withOpacity(0.3),
                  Colors.white.withOpacity(0.1),
                ],
              ),
              borderRadius: BorderRadius.circular(15),
              border: Border.all(
                color: Colors.white.withOpacity(0.4),
                width: 1.5,
              ),
            ),
            child: const Icon(
              Icons.auto_fix_high,
              color: Colors.white,
              size: 28,
            ),
          ),
          const SizedBox(width: 16),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                '六爻占卜',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1.5,
                  shadows: [
                    Shadow(
                      color: Colors.black54,
                      offset: Offset(1, 1),
                      blurRadius: 3,
                    ),
                  ],
                ),
              ),
              Text(
                '洞悉天机 · 问卜未来',
                style: TextStyle(
                  color: Colors.white.withOpacity(0.9),
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                  letterSpacing: 0.8,
                ),
              ),
            ],
          ),
          const Spacer(),
          GestureDetector(
            onTap: () {
              Navigator.of(context).popUntil((route) => route.isFirst);
            },
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    Colors.white.withOpacity(0.25),
                    Colors.white.withOpacity(0.15),
                  ],
                ),
                borderRadius: BorderRadius.circular(25),
                border: Border.all(
                  color: Colors.white.withOpacity(0.4),
                  width: 1,
                ),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.home, color: Colors.white, size: 16),
                  const SizedBox(width: 6),
                  const Text(
                    '首页',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      letterSpacing: 0.5,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildShakingAnimation() {
    return AnimatedBuilder(
      animation: _shakeAnimation,
      builder: (context, child) {
        return Container(
          height: 240,
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                const Color(0xFF2F1B14).withOpacity(0.9), // 深棕色（土行）
                const Color(0xFF8B4513).withOpacity(0.6), // 马鞍棕（土行）
                const Color(0xFF654321).withOpacity(0.8), // 深棕色（土行）
                const Color(0xFF2F1B14).withOpacity(0.9), // 深棕色（土行）
              ],
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              stops: const [0.0, 0.3, 0.7, 1.0],
            ),
            borderRadius: BorderRadius.circular(24),
            border: Border.all(
              color: const Color(0xFFDAA520).withOpacity(0.8), // 金棒色（金行）
              width: 3,
            ),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFFDAA520).withOpacity(0.4), // 金棒色（金行）
                blurRadius: 20,
                spreadRadius: 2,
              ),
              BoxShadow(
                color: const Color(0xFFCD853F).withOpacity(0.2), // 秘鲁色（土行）
                blurRadius: 30,
                spreadRadius: 5,
              ),
            ],
          ),
          child: Stack(
            children: [
              // 背景粒子效果
              ...List.generate(12, (index) {
                final angle = (index * 30.0) * math.pi / 180;
                final radius =
                    60 +
                    (math.sin(_shakeAnimation.value * 4 * math.pi + index) *
                        20);
                return Positioned(
                  left:
                      120 +
                      math.cos(angle + _shakeAnimation.value * 2 * math.pi) *
                          radius -
                      3,
                  top:
                      120 +
                      math.sin(angle + _shakeAnimation.value * 2 * math.pi) *
                          radius -
                      3,
                  child: Container(
                    width: 6,
                    height: 6,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: const Color(
                        0xFFDAA520,
                      ).withOpacity(0.7), // 金棒色（金行）
                      boxShadow: [
                        BoxShadow(
                          color: const Color(
                            0xFFFFD700,
                          ).withOpacity(0.5), // 金色（金行）
                          blurRadius: 6,
                          spreadRadius: 1,
                        ),
                        BoxShadow(
                          color: const Color(
                            0xFFFFF8DC,
                          ).withOpacity(0.3), // 玉米丝色（金行）
                          blurRadius: 8,
                          spreadRadius: 2,
                        ),
                      ],
                    ),
                  ),
                );
              }),
              // 中心光晕效果
              Center(
                child: Container(
                  width: 160,
                  height: 160,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: RadialGradient(
                      colors: [
                        const Color(0xFFDAA520).withOpacity(0.4), // 金棒色（金行）
                        const Color(0xFFFFD700).withOpacity(0.2), // 金色（金行）
                        const Color(0xFFFFF8DC).withOpacity(0.1), // 玉米丝色（金行）
                        Colors.transparent,
                      ],
                      stops: const [0.0, 0.4, 0.7, 1.0],
                    ),
                  ),
                ),
              ),
              // 铜钱动画
              Center(
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: List.generate(3, (index) {
                    return AnimatedBuilder(
                      animation: _coinController,
                      builder: (context, child) {
                        final bounceOffset =
                            math.sin(
                              _shakeAnimation.value * 6 * math.pi + index * 2,
                            ) *
                            25;
                        final rotateAngle = _coinRotation.value + index * 1.2;
                        final scaleValue =
                            0.8 +
                            math.sin(
                                  _shakeAnimation.value * 4 * math.pi + index,
                                ) *
                                0.3;

                        return Transform.translate(
                          offset: Offset(
                            math.sin(
                                  _shakeAnimation.value * 3 * math.pi +
                                      index * 2,
                                ) *
                                15,
                            bounceOffset,
                          ),
                          child: Transform.scale(
                            scale: scaleValue,
                            child: Transform.rotate(
                              angle: rotateAngle,
                              child: Container(
                                width: 70,
                                height: 70,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  gradient: LinearGradient(
                                    colors: [
                                      const Color(0xFFFFF8DC), // 玉米丝色（金行）
                                      const Color(0xFFFFD700), // 金色（金行）
                                      const Color(0xFFDAA520), // 金棒色（金行）
                                      const Color(0xFFB8860B), // 暗金棒色（金行）
                                    ],
                                    begin: Alignment.topLeft,
                                    end: Alignment.bottomRight,
                                    stops: const [0.0, 0.3, 0.7, 1.0],
                                  ),
                                  boxShadow: [
                                    BoxShadow(
                                      color: const Color(
                                        0xFF2F1B14,
                                      ).withOpacity(0.8), // 深棕色（土行）
                                      blurRadius: 12,
                                      offset: const Offset(3, 6),
                                    ),
                                    BoxShadow(
                                      color: const Color(
                                        0xFFDAA520,
                                      ).withOpacity(0.5), // 金棒色（金行）
                                      blurRadius: 8,
                                      spreadRadius: 2,
                                    ),
                                    BoxShadow(
                                      color: const Color(
                                        0xFFFFD700,
                                      ).withOpacity(0.3), // 金色（金行）
                                      blurRadius: 15,
                                      spreadRadius: 3,
                                    ),
                                  ],
                                ),
                                child: Stack(
                                  children: [
                                    // 外圈装饰
                                    Container(
                                      decoration: BoxDecoration(
                                        shape: BoxShape.circle,
                                        border: Border.all(
                                          color: const Color(
                                            0xFFB8860B,
                                          ), // 暗金棒色（金行）
                                          width: 2,
                                        ),
                                      ),
                                    ),
                                    // 中心方孔
                                    Center(
                                      child: Container(
                                        width: 24,
                                        height: 24,
                                        decoration: BoxDecoration(
                                          borderRadius: BorderRadius.circular(
                                            4,
                                          ),
                                          color: const Color(
                                            0xFF2F1B14,
                                          ), // 深棕色（土行）
                                          border: Border.all(
                                            color: const Color(
                                              0xFFB8860B,
                                            ), // 暗金棒色（金行）
                                            width: 1,
                                          ),
                                        ),
                                      ),
                                    ),
                                    // 古钱币纹理
                                    Positioned(
                                      top: 8,
                                      left: 8,
                                      right: 8,
                                      bottom: 8,
                                      child: Container(
                                        decoration: BoxDecoration(
                                          shape: BoxShape.circle,
                                          border: Border.all(
                                            color: Color(
                                              0xFFDAA520,
                                            ).withOpacity(0.8), // 金棒色（金行）
                                            width: 1,
                                          ),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        );
                      },
                    );
                  }),
                ),
              ),
              // 摇卦文字和进度
              Positioned(
                bottom: 16,
                left: 0,
                right: 0,
                child: Column(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 20,
                        vertical: 8,
                      ),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            const Color(0xFFDAA520).withOpacity(0.4), // 金棒色（金行）
                            const Color(0xFFFFD700).withOpacity(0.2), // 金色（金行）
                          ],
                        ),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: const Color(
                            0xFFDAA520,
                          ).withOpacity(0.7), // 金棒色（金行）
                          width: 1,
                        ),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            Icons.auto_fix_high,
                            color: const Color(0xFFFFF8DC), // 玉米丝色（金行）
                            size: 18,
                          ),
                          const SizedBox(width: 8),
                          Text(
                            '正在摇卦...',
                            style: TextStyle(
                              color: const Color(0xFFFFF8DC), // 玉米丝色（金行）
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                              letterSpacing: 2,
                              shadows: [
                                Shadow(
                                  color: const Color(
                                    0xFF2F1B14,
                                  ).withOpacity(0.9), // 深棕色（土行）
                                  offset: const Offset(1, 1),
                                  blurRadius: 3,
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 8),
                    Container(
                      width: 120,
                      height: 4,
                      decoration: BoxDecoration(
                        color: Colors.black.withOpacity(0.3),
                        borderRadius: BorderRadius.circular(2),
                      ),
                      child: FractionallySizedBox(
                        alignment: Alignment.centerLeft,
                        widthFactor: _shakeAnimation.value,
                        child: Container(
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: [
                                Colors.amber.shade400,
                                Colors.amber.shade600,
                              ],
                            ),
                            borderRadius: BorderRadius.circular(2),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.amber.withOpacity(0.6),
                                blurRadius: 4,
                              ),
                            ],
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
      },
    );
  }

  Widget _buildInstructionCard() {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        gradient: LinearGradient(
          colors: [
            const Color(0xFF8B4513).withOpacity(0.95), // 传统棕色
            const Color(0xFFD2691E).withOpacity(0.85), // 橙棕色
            const Color(0xFFCD853F).withOpacity(0.75), // 沙棕色
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.4),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
          BoxShadow(
            color: const Color(0xFFCD853F).withOpacity(0.3),
            blurRadius: 10,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.white.withOpacity(0.3), width: 2),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        const Color(0xFFDAA520).withOpacity(0.4), // 金棒色（金行）
                        const Color(0xFFFFD700).withOpacity(0.2), // 金色（金行）
                      ],
                    ),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: const Color(
                        0xFFDAA520,
                      ).withOpacity(0.6), // 金棒色（金行）
                      width: 1.5,
                    ),
                  ),
                  child: const Icon(
                    Icons.menu_book,
                    color: Colors.white,
                    size: 28,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        '六爻占卜指南',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 1.2,
                          shadows: [
                            Shadow(
                              color: Colors.black54,
                              offset: Offset(1, 1),
                              blurRadius: 3,
                            ),
                          ],
                        ),
                      ),
                      Text(
                        '传承千年的占卜智慧',
                        style: TextStyle(
                          color: Colors.white.withOpacity(0.8),
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    Colors.black.withOpacity(0.4),
                    Colors.black.withOpacity(0.2),
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: Colors.white.withOpacity(0.2),
                  width: 1,
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildInstructionStep('1', '心中默念您要占卜的问题', '诚心专注，问题明确'),
                  const SizedBox(height: 12),
                  _buildInstructionStep('2', '输入具体明确的问题', '文字表达，便于记录'),
                  const SizedBox(height: 12),
                  _buildInstructionStep('3', '点击"开始占卜"进行起卦', '模拟传统铜钱起卦'),
                  const SizedBox(height: 12),
                  _buildInstructionStep('4', '系统将为您生成卦象并提供专业解析', '依据周易原理推演'),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildQuestionInput() {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        gradient: LinearGradient(
          colors: [
            const Color(0xFF654321).withOpacity(0.9), // 深棕色
            const Color(0xFF8B4513).withOpacity(0.8), // 马鞍棕
            const Color(0xFFA0522D).withOpacity(0.7), // 赭石色
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.4),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
          BoxShadow(
            color: const Color(0xFFCD853F).withOpacity(0.3),
            blurRadius: 10,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.white.withOpacity(0.3), width: 2),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        Colors.white.withOpacity(0.3),
                        Colors.white.withOpacity(0.1),
                      ],
                    ),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: Colors.white.withOpacity(0.4),
                      width: 1.5,
                    ),
                  ),
                  child: const Icon(
                    Icons.psychology,
                    color: Color(0xFFFFF8DC), // 玉米丝色（金行）
                    size: 28,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        '请输入您的问题',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 1.2,
                          shadows: [
                            Shadow(
                              color: Colors.black54,
                              offset: Offset(1, 1),
                              blurRadius: 3,
                            ),
                          ],
                        ),
                      ),
                      Text(
                        '心诚则灵，问题明确',
                        style: TextStyle(
                          color: Colors.white.withOpacity(0.8),
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    const Color(0xFF2F1B14).withOpacity(0.8), // 深棕色（土行）
                    const Color(0xFF654321).withOpacity(0.6), // 深棕色（土行）
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: const Color(0xFFDAA520).withOpacity(0.4), // 金棒色（金行）
                  width: 1.5,
                ),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF2F1B14).withOpacity(0.5), // 深棕色（土行）
                    blurRadius: 8,
                    offset: const Offset(0, 4),
                  ),
                  BoxShadow(
                    color: const Color(0xFFDAA520).withOpacity(0.2), // 金棒色（金行）
                    blurRadius: 12,
                    spreadRadius: 1,
                  ),
                ],
              ),
              child: TextField(
                focusNode: _questionFocusNode,
                maxLines: 4,
                textInputAction: TextInputAction.done,
                onSubmitted: (_) => _dismissKeyboard(),
                style: const TextStyle(
                  color: Color(0xFFFFF8DC), // 玉米丝色（金行）
                  fontSize: 14,
                  height: 1.5,
                ),
                decoration: InputDecoration(
                  hintText: '例如：\n• 我今年的事业运势如何？\n• 我和某某的感情会有结果吗？\n• 这次投资是否合适？',
                  hintStyle: TextStyle(
                    color: const Color(0xFFCD853F).withOpacity(0.7), // 秘鲁色（土行）
                    fontSize: 13,
                    height: 1.5,
                  ),
                  border: InputBorder.none,
                  contentPadding: const EdgeInsets.all(16),
                ),
                onChanged: (value) {
                  setState(() {
                    _question = value;
                  });
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDivinationButton() {
    return Container(
      width: double.infinity,
      height: 65,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(32),
        gradient: _question.trim().isEmpty || _isCalculating
            ? LinearGradient(
                colors: [
                  const Color(0xFF654321).withOpacity(0.6), // 深棕色（土行）
                  const Color(0xFF8B4513).withOpacity(0.4), // 马鞍棕（土行）
                  const Color(0xFFCD853F).withOpacity(0.3), // 秘鲁色（土行）
                ],
              )
            : LinearGradient(
                colors: [
                  const Color(0xFFDAA520).withOpacity(0.95), // 金棒色（金行）
                  const Color(0xFFFFD700).withOpacity(0.85), // 金色（金行）
                  const Color(0xFFFFF8DC).withOpacity(0.75), // 玉米丝色（金行）
                ],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF2F1B14).withOpacity(0.6), // 深棕色（土行）
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
          BoxShadow(
            color: _question.trim().isEmpty || _isCalculating
                ? const Color(0xFF654321).withOpacity(0.3) // 深棕色（土行）
                : const Color(0xFFDAA520).withOpacity(0.4), // 金棒色（金行）
            blurRadius: 10,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(32),
          onTap: _question.trim().isEmpty || _isCalculating
              ? null
              : _startDivination,
          child: Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(32),
              border: Border.all(
                color: const Color(0xFFFFF8DC).withOpacity(0.6), // 玉米丝色（金行）
                width: 2,
              ),
            ),
            child: Center(
              child: _isCalculating
                  ? Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        SizedBox(
                          width: 24,
                          height: 24,
                          child: CircularProgressIndicator(
                            strokeWidth: 3,
                            valueColor: const AlwaysStoppedAnimation<Color>(
                              Color(0xFFFFF8DC), // 玉米丝色（金行）
                            ),
                          ),
                        ),
                        const SizedBox(width: 16),
                        const Text(
                          '正在起卦...',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFFFFF8DC), // 玉米丝色（金行）
                            letterSpacing: 1,
                          ),
                        ),
                      ],
                    )
                  : Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: [
                                const Color(
                                  0xFFFFF8DC,
                                ).withOpacity(0.4), // 玉米丝色（金行）
                                const Color(
                                  0xFFFFD700,
                                ).withOpacity(0.2), // 金色（金行）
                              ],
                            ),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                              color: const Color(
                                0xFFFFF8DC,
                              ).withOpacity(0.7), // 玉米丝色（金行）
                              width: 1.5,
                            ),
                          ),
                          child: const Icon(
                            Icons.auto_fix_high,
                            color: Color(0xFF2F1B14), // 深棕色（土行）
                            size: 26,
                          ),
                        ),
                        const SizedBox(width: 16),
                        Text(
                          '开始占卜',
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            color: const Color(0xFF2F1B14), // 深棕色（土行）
                            letterSpacing: 1.5,
                            shadows: [
                              Shadow(
                                color: Color(
                                  0xFFDAA520,
                                ).withOpacity(0.8), // 金棒色（金行）
                                offset: const Offset(1, 1),
                                blurRadius: 3,
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHexagramDisplay() {
    if (_result == null) return const SizedBox.shrink();

    return Container(
      margin: const EdgeInsets.symmetric(vertical: 12),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            const Color(0xFF2C1810).withOpacity(0.95), // 深棕色
            const Color(0xFF3D2914).withOpacity(0.9), // 中棕色
            const Color(0xFF4A3728).withOpacity(0.85), // 浅棕色
          ],
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
        ),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.amber.withOpacity(0.6), width: 3),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.4),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
          BoxShadow(
            color: Colors.amber.withOpacity(0.3),
            blurRadius: 15,
            spreadRadius: 2,
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            // 标题区域
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    Colors.amber.shade700,
                    Colors.amber.shade500,
                    Colors.amber.shade600,
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(25),
                boxShadow: [
                  BoxShadow(
                    color: Colors.amber.withOpacity(0.4),
                    blurRadius: 12,
                    offset: const Offset(0, 6),
                  ),
                ],
                border: Border.all(
                  color: Colors.white.withOpacity(0.3),
                  width: 2,
                ),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(
                      Icons.auto_awesome,
                      color: Colors.white,
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Text(
                    '卦象解析',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                      letterSpacing: 1.5,
                      shadows: [
                        Shadow(
                          color: Colors.black.withOpacity(0.6),
                          offset: const Offset(1, 1),
                          blurRadius: 3,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // 本卦信息
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    Colors.white.withOpacity(0.95),
                    Colors.amber.shade50.withOpacity(0.9),
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: Colors.amber.withOpacity(0.4),
                  width: 2,
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.1),
                    blurRadius: 8,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 8,
                    ),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [Colors.brown.shade700, Colors.brown.shade600],
                      ),
                      borderRadius: BorderRadius.circular(15),
                    ),
                    child: Text(
                      _result!.originalHexagram.fullName,
                      style: const TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                        letterSpacing: 2,
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.brown.shade50,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: Colors.brown.shade200,
                        width: 1,
                      ),
                    ),
                    child: Text(
                      _result!.originalHexagram.description,
                      style: TextStyle(
                        fontSize: 15,
                        color: Colors.brown.shade700,
                        height: 1.5,
                        fontWeight: FontWeight.w500,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // 六爻显示区域
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    Colors.brown.shade900.withOpacity(0.1),
                    Colors.brown.shade800.withOpacity(0.05),
                  ],
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                ),
                borderRadius: BorderRadius.circular(18),
                border: Border.all(
                  color: Colors.brown.withOpacity(0.3),
                  width: 2,
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.1),
                    blurRadius: 8,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                children: [
                  // 六爻标题
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 10,
                    ),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [Colors.brown.shade600, Colors.brown.shade500],
                      ),
                      borderRadius: BorderRadius.circular(12),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.brown.withOpacity(0.3),
                          blurRadius: 6,
                          offset: const Offset(0, 3),
                        ),
                      ],
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(
                          Icons.view_list,
                          color: Colors.white,
                          size: 18,
                        ),
                        const SizedBox(width: 8),
                        const Text(
                          '六爻详解',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                            letterSpacing: 1.2,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  // 六爻显示
                  for (int i = 5; i >= 0; i--)
                    Container(
                      margin: const EdgeInsets.symmetric(vertical: 8),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: _yaos[i].type.isChanging
                              ? [
                                  Colors.red.shade50.withOpacity(0.9),
                                  Colors.orange.shade50.withOpacity(0.7),
                                ]
                              : [
                                  Colors.white.withOpacity(0.95),
                                  Colors.brown.shade50.withOpacity(0.8),
                                ],
                          begin: Alignment.centerLeft,
                          end: Alignment.centerRight,
                        ),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(
                          color: _yaos[i].type.isChanging
                              ? Colors.red.withOpacity(0.5)
                              : Colors.brown.withOpacity(0.3),
                          width: _yaos[i].type.isChanging ? 2 : 1.5,
                        ),
                        boxShadow: _yaos[i].type.isChanging
                            ? [
                                BoxShadow(
                                  color: Colors.red.withOpacity(0.2),
                                  blurRadius: 10,
                                  offset: const Offset(0, 4),
                                ),
                              ]
                            : [
                                BoxShadow(
                                  color: Colors.brown.withOpacity(0.1),
                                  blurRadius: 6,
                                  offset: const Offset(0, 3),
                                ),
                              ],
                      ),
                      child: Row(
                        children: [
                          // 爻位名称
                          Container(
                            width: 80,
                            padding: const EdgeInsets.symmetric(
                              horizontal: 10,
                              vertical: 6,
                            ),
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                colors: _yaos[i].type.isChanging
                                    ? [Colors.red.shade200, Colors.red.shade100]
                                    : [
                                        Colors.brown.shade200,
                                        Colors.brown.shade100,
                                      ],
                              ),
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(
                                color: _yaos[i].type.isChanging
                                    ? Colors.red.shade400
                                    : Colors.brown.shade400,
                                width: 1,
                              ),
                            ),
                            child: Text(
                              _yaos[i].name,
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                                color: _yaos[i].type.isChanging
                                    ? Colors.red.shade800
                                    : Colors.brown.shade800,
                              ),
                              textAlign: TextAlign.center,
                            ),
                          ),
                          const SizedBox(width: 20),
                          // 爻线
                          Expanded(child: _buildYaoLine(_yaos[i])),
                          const SizedBox(width: 20),
                          // 爻的类型和变爻标识
                          Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                colors: _yaos[i].type.isChanging
                                    ? [Colors.red.shade200, Colors.red.shade100]
                                    : [
                                        Colors.brown.shade200,
                                        Colors.brown.shade100,
                                      ],
                              ),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Column(
                              children: [
                                Text(
                                  _yaos[i].type.name,
                                  style: TextStyle(
                                    fontSize: 13,
                                    color: _yaos[i].type.isChanging
                                        ? Colors.red.shade700
                                        : Colors.brown.shade700,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                if (_yaos[i].type.isChanging) ...[
                                  const SizedBox(height: 4),
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 8,
                                      vertical: 3,
                                    ),
                                    decoration: BoxDecoration(
                                      color: Colors.red.shade600,
                                      borderRadius: BorderRadius.circular(8),
                                      boxShadow: [
                                        BoxShadow(
                                          color: Colors.red.withOpacity(0.3),
                                          blurRadius: 4,
                                          offset: const Offset(0, 2),
                                        ),
                                      ],
                                    ),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        const Icon(
                                          Icons.autorenew,
                                          size: 12,
                                          color: Colors.white,
                                        ),
                                        const SizedBox(width: 4),
                                        const Text(
                                          '变',
                                          style: TextStyle(
                                            fontSize: 11,
                                            color: Colors.white,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                ],
              ),
            ),

            // 变卦
            if (_result!.hasChangingLines) ...[
              const SizedBox(height: 20),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      Colors.red.shade900.withOpacity(0.1),
                      Colors.red.shade800.withOpacity(0.05),
                      Colors.orange.shade800.withOpacity(0.08),
                    ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: Colors.red.withOpacity(0.4),
                    width: 2,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.red.withOpacity(0.2),
                      blurRadius: 12,
                      offset: const Offset(0, 6),
                    ),
                  ],
                ),
                child: Column(
                  children: [
                    // 变卦标题
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 18,
                        vertical: 12,
                      ),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [Colors.red.shade700, Colors.red.shade600],
                        ),
                        borderRadius: BorderRadius.circular(15),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.red.withOpacity(0.4),
                            blurRadius: 8,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(
                            Icons.transform,
                            color: Colors.white,
                            size: 22,
                          ),
                          const SizedBox(width: 12),
                          const Text(
                            '变卦显示',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                              letterSpacing: 1.5,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    // 变卦信息
                    if (_result!.changedHexagram != null)
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(18),
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: [
                              Colors.white.withOpacity(0.95),
                              Colors.red.shade50.withOpacity(0.9),
                            ],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: Colors.red.withOpacity(0.3),
                            width: 2,
                          ),
                        ),
                        child: Column(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 16,
                                vertical: 8,
                              ),
                              decoration: BoxDecoration(
                                gradient: LinearGradient(
                                  colors: [
                                    Colors.red.shade700,
                                    Colors.red.shade600,
                                  ],
                                ),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(
                                _result!.changedHexagram!.fullName,
                                style: const TextStyle(
                                  fontSize: 20,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white,
                                  letterSpacing: 1.8,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildYaoLine(Yao yao) {
    final isYang = yao.type.isYang;
    final isChanging = yao.type.isChanging;

    Color lineColor;
    Color shadowColor;
    Color accentColor;

    if (isChanging) {
      // 变爻 - 使用火红色系（火行）
      lineColor = const Color(0xFFDC143C); // 深红色
      shadowColor = const Color(0xFFFF6347); // 番茄红
      accentColor = const Color(0xFFFFD700); // 金色点缀
    } else if (isYang) {
      // 阳爻 - 使用金黄色系（金行）
      lineColor = const Color(0xFFDAA520); // 金棒色
      shadowColor = const Color(0xFFFFD700); // 金色
      accentColor = const Color(0xFFFFF8DC); // 玉米丝色
    } else {
      // 阴爻 - 使用土褐色系（土行）
      lineColor = const Color(0xFF8B4513); // 马鞍棕
      shadowColor = const Color(0xFFCD853F); // 秘鲁色
      accentColor = const Color(0xFFDEB887); // 硬木色
    }

    if (isYang) {
      // 阳爻 - 实线
      return Container(
        width: 140,
        height: 12,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [lineColor, lineColor.withOpacity(0.8)],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
          ),
          borderRadius: BorderRadius.circular(6),
          boxShadow: [
            BoxShadow(
              color: shadowColor.withOpacity(0.5),
              blurRadius: 4,
              offset: const Offset(0, 2),
            ),
          ],
          border: Border.all(color: Colors.white.withOpacity(0.3), width: 1),
        ),
        child: isChanging
            ? Container(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(6),
                  gradient: LinearGradient(
                    colors: [
                      accentColor.withOpacity(0.4),
                      Colors.transparent,
                      accentColor.withOpacity(0.4),
                    ],
                    stops: const [0.0, 0.5, 1.0],
                  ),
                ),
                child: Center(
                  child: Container(
                    width: 8,
                    height: 8,
                    decoration: BoxDecoration(
                      color: accentColor,
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: accentColor.withOpacity(0.6),
                          blurRadius: 4,
                          spreadRadius: 1,
                        ),
                      ],
                    ),
                  ),
                ),
              )
            : null,
      );
    } else {
      // 阴爻 - 断线
      return SizedBox(
        width: 140,
        child: Row(
          children: [
            Expanded(
              child: Container(
                height: 12,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [lineColor, lineColor.withOpacity(0.8)],
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                  ),
                  borderRadius: BorderRadius.circular(6),
                  boxShadow: [
                    BoxShadow(
                      color: shadowColor.withOpacity(0.5),
                      blurRadius: 4,
                      offset: const Offset(0, 2),
                    ),
                  ],
                  border: Border.all(
                    color: Colors.white.withOpacity(0.3),
                    width: 1,
                  ),
                ),
                child: isChanging
                    ? Container(
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(6),
                          gradient: LinearGradient(
                            colors: [
                              accentColor.withOpacity(0.4),
                              Colors.transparent,
                              accentColor.withOpacity(0.4),
                            ],
                            stops: const [0.0, 0.5, 1.0],
                          ),
                        ),
                      )
                    : null,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Container(
                height: 12,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [lineColor, lineColor.withOpacity(0.8)],
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                  ),
                  borderRadius: BorderRadius.circular(6),
                  boxShadow: [
                    BoxShadow(
                      color: shadowColor.withOpacity(0.5),
                      blurRadius: 4,
                      offset: const Offset(0, 2),
                    ),
                  ],
                  border: Border.all(
                    color: Colors.white.withOpacity(0.3),
                    width: 1,
                  ),
                ),
                child: isChanging
                    ? Container(
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(6),
                          gradient: LinearGradient(
                            colors: [
                              accentColor.withOpacity(0.4),
                              Colors.transparent,
                              accentColor.withOpacity(0.4),
                            ],
                            stops: const [0.0, 0.5, 1.0],
                          ),
                        ),
                      )
                    : null,
              ),
            ),
          ],
        ),
      );
    }
  }

  String _getYaoName(int index) {
    const names = ['初爻', '二爻', '三爻', '四爻', '五爻', '上爻'];
    return names[index];
  }

  Widget _buildResultDisplay() {
    if (_result == null) return const SizedBox.shrink();

    return Column(
      children: [
        // 基础分析
        Card(
          elevation: 4,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  children: [
                    Icon(Icons.analytics, color: Color(0xFF3498DB)),
                    SizedBox(width: 8),
                    Text(
                      '基础分析',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF2C3E50),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                _buildResultItem('象辞', _result!.originalHexagram.image),
                _buildResultItem('分析', _result!.analysis),
                _buildResultItem('建议', _result!.suggestion),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),

        // 深度分析
        Card(
          elevation: 4,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(Icons.auto_stories, color: Colors.purple.shade600),
                    const SizedBox(width: 8),
                    const Text(
                      '周易命理库深度解卦',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF2C3E50),
                      ),
                    ),
                    const Spacer(),
                    if (_deepAnalysisLoading)
                      SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(
                            Colors.purple.shade600,
                          ),
                        ),
                      )
                    else if (_result!.deepAnalysis.isEmpty)
                      ElevatedButton(
                        onPressed: _showPaymentConfirmationForDeepAnalysis,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.purple.shade600,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 6,
                          ),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(20),
                          ),
                        ),
                        child: const Text(
                          '获取解卦 \$1',
                          style: TextStyle(fontSize: 12),
                        ),
                      )
                    else
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.purple.shade50,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: Colors.purple.shade200),
                        ),
                        child: Text(
                          '可信度: ${(_result!.confidence * 100).toInt()}%',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.purple.shade700,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 16),
                if (_result!.deepAnalysis.isNotEmpty) ...[
                  _buildFormattedAnalysis(_result!.deepAnalysis),
                  const SizedBox(height: 16),
                  // 分享按钮
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: _shareLiuyaoResult,
                      icon: const Icon(Icons.share, size: 18),
                      label: const Text('分享六爻结果'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.purple.shade600,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                    ),
                  ),
                ] else
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.grey.shade50,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.grey.shade200),
                    ),
                    child: const Text(
                      '点击"获取解卦"按钮，通过周易命理库获取专业的深度解卦分析',
                      style: TextStyle(
                        fontSize: 14,
                        color: Color(0xFF7F8C8D),
                        fontStyle: FontStyle.italic,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildResultItem(String title, String content) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: Color(0xFF3498DB),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            content,
            style: const TextStyle(
              fontSize: 14,
              color: Color(0xFF2C3E50),
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }

  void _startDivination() async {
    setState(() {
      _isCalculating = true;
      _isShaking = true;
      _yaos = [];
      _result = null;
    });

    // 开始摇卦动画
    _shakeController.reset();
    _coinController.reset();
    _shakeController.forward();
    _coinController.repeat();

    // 等待动画播放一段时间
    await Future.delayed(const Duration(milliseconds: 3500));

    // 停止动画
    _coinController.stop();
    setState(() {
      _isShaking = false;
    });

    try {
      // 使用铜钱法起卦
      final yaos = _liuyaoService.generateHexagramByCoins();

      // 获取卦象
      final originalHexagram = _liuyaoService.getHexagramFromYaos(yaos);
      final changingLines = _liuyaoService.getChangingLines(yaos);
      final changedHexagram = _liuyaoService.getChangedHexagram(yaos);

      // 基础分析
      final basicAnalysis = _liuyaoService.analyzeHexagram(
        originalHexagram,
        changingLines,
        _question,
      );

      final suggestion = _liuyaoService.generateSuggestion(
        originalHexagram,
        changingLines,
      );

      setState(() {
        _yaos = yaos;
      });

      // 创建基础结果（不包含深度分析）
      final result = LiuyaoResult(
        question: _question,
        timestamp: DateTime.now(),
        originalYaos: yaos,
        changedYaos: yaos
            .map((yao) => Yao.fromPosition(yao.position, yao.changedType))
            .toList(),
        originalHexagram: originalHexagram,
        changedHexagram: changedHexagram,
        changingLines: changingLines,
        analysis: basicAnalysis,
        deepAnalysis: '', // 初始为空，点击按钮后获取
        suggestion: suggestion,
        confidence: 0.85, // 基础可信度
      );

      setState(() {
        _result = result;
        _isCalculating = false;
      });

      // 保存到历史记录
      try {
        await _historyService.saveResult(result);
      } catch (e) {
        print('保存历史记录失败: $e');
      }
    } catch (e) {
      print('占卜过程出错: $e');
      setState(() {
        _isCalculating = false;
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('占卜过程中出现错误：${e.toString()}'),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 5),
          ),
        );
      }
    }
  }

  /// 显示付费确认对话框
  Future<void> _showPaymentConfirmationForDeepAnalysis() async {
    if (_result == null) return;

    final authService = Provider.of<AuthService>(context, listen: false);

    // 检查用户是否登录
    if (!authService.isLoggedIn) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('请先登录'), backgroundColor: Colors.red),
      );
      return;
    }

    // 显示付费确认对话框
    final confirmed = await _showPaymentConfirmDialog('周易命理库深度解卦', '\$1');
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
      // 生成六爻结果的唯一标识
      final resultHash = _generateResultHash();

      // 尝试解锁（扣费）
      final result = await UnlockService.tryUnlock(
        resultHash,
        UnlockService.liuyaoDeepAnalysis,
        authService,
      );

      // 关闭加载对话框
      if (mounted) Navigator.of(context).pop();

      if (result.success) {
        // 扣费成功，获取深度分析
        await _getDeepAnalysis();

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(result.message),
              backgroundColor: Colors.green,
            ),
          );
        }
      } else if (result.needRecharge) {
        // 余额不足，跳转到充值页面
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
          SnackBar(content: Text('网络错误，请稍后重试：$e'), backgroundColor: Colors.red),
        );
      }
    }
  }

  /// 获取深度分析
  Future<void> _getDeepAnalysis() async {
    if (_result == null) return;

    setState(() {
      _deepAnalysisLoading = true;
      // 清空之前的深度分析内容，准备接收流式数据
      _result = _result!.copyWith(deepAnalysis: '');
    });

    try {
      final deepAnalysis = await _deepSeekService.getDeepAnalysis(
        question: _result!.question,
        originalHexagram: _result!.originalHexagram,
        changedHexagram: _result!.changedHexagram,
        changingLines: _result!.changingLines,
        yaos: _result!.originalYaos,
        onStreamData: (String chunk) {
          if (mounted) {
            setState(() {
              final currentAnalysis = _result!.deepAnalysis ?? '';
              _result = _result!.copyWith(
                deepAnalysis: currentAnalysis + chunk,
              );
            });
          }
        },
      );

      if (mounted) {
        setState(() {
          _result = _result!.copyWith(deepAnalysis: deepAnalysis);
          _deepAnalysisLoading = false;
        });
      }

      // 更新历史记录
      try {
        await _historyService.saveResult(_result!);
      } catch (e) {
        print('更新历史记录失败: $e');
      }
    } catch (e) {
      setState(() {
        _deepAnalysisLoading = false;
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('获取深度解卦失败：$e'),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 3),
          ),
        );
      }
    }
  }

  /// 构建格式化的分析内容
  Widget _buildFormattedAnalysis(String analysis) {
    // 将分析内容按段落分割并格式化
    final paragraphs = analysis
        .split('\n')
        .where((p) => p.trim().isNotEmpty)
        .toList();
    List<Widget> widgets = [];

    for (String paragraph in paragraphs) {
      String cleanLine = paragraph
          .trim()
          .replaceAll('*', '')
          .replaceAll('#', '')
          .replaceAll('\t', '')
          .replaceAll(RegExp(r'[\x00-\x1F\x7F-\x9F]'), '') // 移除控制字符
          .replaceAll(
            RegExp(r'[^\u4e00-\u9fa5a-zA-Z0-9\s：，。！？；、（）\[\]\-\+\=【】]'),
            '',
          ); // 只保留中文、英文、数字和常用标点

      if (cleanLine.isEmpty) continue;

      // 检查是否是标题（包含【】或以数字开头或包含关键词）
      bool isTitle =
          cleanLine.contains('【') && cleanLine.contains('】') ||
          RegExp(r'^\d+[、.]').hasMatch(cleanLine) ||
          cleanLine.contains('：') ||
          cleanLine.contains('分析') ||
          cleanLine.contains('建议') ||
          cleanLine.contains('解释') ||
          cleanLine.contains('含义') ||
          cleanLine.length < 25;

      if (isTitle) {
        widgets.add(
          Container(
            margin: const EdgeInsets.only(top: 12, bottom: 8),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [Colors.amber.shade100, Colors.orange.shade50],
              ),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Colors.amber.shade200, width: 1),
            ),
            child: Row(
              children: [
                Icon(Icons.star, color: Colors.amber.shade600, size: 16),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    cleanLine,
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: Colors.brown.shade800,
                      letterSpacing: 0.5,
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      } else {
        widgets.add(
          Container(
            margin: const EdgeInsets.symmetric(vertical: 4),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.8),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Colors.grey.shade200, width: 1),
            ),
            child: Text(
              cleanLine,
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.normal,
                color: Colors.brown.shade700,
                height: 1.6,
                letterSpacing: 0.3,
              ),
            ),
          ),
        );
      }
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: widgets.isEmpty
          ? [
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.grey.shade100,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  '暂无分析内容',
                  style: TextStyle(color: Colors.grey.shade600, fontSize: 14),
                ),
              ),
            ]
          : widgets,
    );
  }

  Widget _buildInstructionStep(String number, String title, String subtitle) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 32,
          height: 32,
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                Colors.white.withOpacity(0.3),
                Colors.white.withOpacity(0.1),
              ],
            ),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: Colors.white.withOpacity(0.5),
              width: 1.5,
            ),
          ),
          child: Center(
            child: Text(
              number,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 14,
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
              Text(
                title,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                  height: 1.4,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                subtitle,
                style: TextStyle(
                  color: Colors.white.withOpacity(0.7),
                  fontSize: 12,
                  fontWeight: FontWeight.w400,
                  height: 1.3,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  /// 显示付费确认对话框
  Future<bool> _showPaymentConfirmDialog(String itemName, String price) async {
    final authService = Provider.of<AuthService>(context, listen: false);
    final currentBalance = authService.currentUser?.balance ?? 0.0;

    return await showDialog<bool>(
          context: context,
          barrierDismissible: false,
          builder: (BuildContext context) {
            return AlertDialog(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
              ),
              title: Row(
                children: [
                  Icon(Icons.payment, color: Colors.purple.shade600, size: 28),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Text(
                      '付费确认',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [Colors.purple.shade50, Colors.purple.shade100],
                      ),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: Colors.purple.shade200,
                        width: 1,
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '服务项目：$itemName',
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          '费用：$price',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: Colors.purple.shade700,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          '当前余额：\$${currentBalance.toStringAsFixed(2)}',
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.grey.shade600,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    '确认支付后将从您的账户余额中扣除相应费用。',
                    style: TextStyle(fontSize: 14, color: Colors.grey),
                  ),
                ],
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(context).pop(false),
                  child: Text(
                    '取消',
                    style: TextStyle(color: Colors.grey.shade600, fontSize: 16),
                  ),
                ),
                ElevatedButton(
                  onPressed: () => Navigator.of(context).pop(true),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.purple.shade600,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 24,
                      vertical: 12,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(25),
                    ),
                  ),
                  child: const Text(
                    '确认支付',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            );
          },
        ) ??
        false;
  }

  /// 分享六爻结果
  Future<void> _shareLiuyaoResult() async {
    if (_result == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('暂无结果可分享'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    // 构建分享内容
    String analysisContent = '';

    // 基础分析
    analysisContent += '【象辞】\n${_result!.originalHexagram.image}\n\n';
    analysisContent += '【分析】\n${_result!.analysis}\n\n';
    analysisContent += '【建议】\n${_result!.suggestion}\n\n';

    // 深度分析（如果有）
    if (_result!.deepAnalysis.isNotEmpty) {
      analysisContent += '【深度解卦】\n${_result!.deepAnalysis}';
    }

    await ShareService.shareLiuyaoResult(
      context: context,
      question: _result!.question,
      hexagramName: _result!.originalHexagram.name,
      analysis: analysisContent,
    );
  }

  /// 生成六爻结果的唯一标识
  String _generateResultHash() {
    if (_result == null) return '';

    // 基于问题、时间戳和卦象生成唯一标识
    final data = {
      'question': _result!.question,
      'timestamp': _result!.timestamp.millisecondsSinceEpoch,
      'originalHexagram': _result!.originalHexagram.name,
      'yaos': _result!.originalYaos
          .map((yao) => '${yao.position}_${yao.type.name}')
          .join('_'),
    };

    return UnlockService.generateBaziHash(data);
  }

  /// 显示充值对话框
  void _showRechargeDialog(String message) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
          title: Row(
            children: [
              Icon(
                Icons.account_balance_wallet,
                color: Colors.orange.shade600,
                size: 28,
              ),
              const SizedBox(width: 12),
              const Expanded(
                child: Text(
                  '余额不足',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Colors.orange.shade50, Colors.orange.shade100],
                  ),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.orange.shade200, width: 1),
                ),
                child: Text(
                  message,
                  style: const TextStyle(fontSize: 16, height: 1.5),
                  textAlign: TextAlign.center,
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                '请前往充值页面为您的账户充值',
                style: TextStyle(fontSize: 14, color: Colors.grey),
                textAlign: TextAlign.center,
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: Text(
                '稍后充值',
                style: TextStyle(color: Colors.grey.shade600, fontSize: 16),
              ),
            ),
            ElevatedButton(
              onPressed: () {
                Navigator.of(context).pop();
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => const RechargeScreen(),
                  ),
                );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.orange.shade600,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(
                  horizontal: 24,
                  vertical: 12,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(25),
                ),
              ),
              child: const Text(
                '立即充值',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
            ),
          ],
        );
      },
    );
  }
}
