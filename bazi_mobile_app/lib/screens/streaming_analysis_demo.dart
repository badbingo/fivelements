import 'package:flutter/material.dart';
import '../services/streaming_deepseek_service.dart';

/// 流式分析演示界面
class StreamingAnalysisDemo extends StatefulWidget {
  const StreamingAnalysisDemo({super.key});

  @override
  State<StreamingAnalysisDemo> createState() => _StreamingAnalysisDemoState();
}

class _StreamingAnalysisDemoState extends State<StreamingAnalysisDemo> {
  final StreamingDeepSeekService _streamingService = StreamingDeepSeekService();
  final TextEditingController _promptController = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  String _streamingText = '';
  bool _isStreaming = false;
  bool _isCompleted = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    // 设置默认提示词
    _promptController.text = '请分析一个1990年5月15日上午10点出生的男性的八字命理';
  }

  @override
  void dispose() {
    _promptController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  /// 开始流式分析
  void _startStreamingAnalysis() {
    if (_promptController.text.trim().isEmpty) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('请输入分析内容')));
      return;
    }

    setState(() {
      _streamingText = '';
      _isStreaming = true;
      _isCompleted = false;
      _errorMessage = null;
    });

    _streamingService.streamAnalysis(
      prompt: _promptController.text.trim(),
      onData: (chunk) {
        setState(() {
          _streamingText += chunk;
        });
        // 自动滚动到底部
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (_scrollController.hasClients) {
            _scrollController.animateTo(
              _scrollController.position.maxScrollExtent,
              duration: const Duration(milliseconds: 100),
              curve: Curves.easeOut,
            );
          }
        });
      },
      onComplete: (fullText) {
        setState(() {
          _streamingText = fullText;
          _isStreaming = false;
          _isCompleted = true;
        });
      },
      onError: (error) {
        setState(() {
          _errorMessage = error;
          _isStreaming = false;
          _isCompleted = false;
        });
      },
    );
  }

  /// 清除结果
  void _clearResults() {
    setState(() {
      _streamingText = '';
      _isStreaming = false;
      _isCompleted = false;
      _errorMessage = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('流式分析演示'),
        backgroundColor: Colors.deepPurple,
        foregroundColor: Colors.white,
        actions: [
          if (_streamingText.isNotEmpty || _errorMessage != null)
            IconButton(
              icon: const Icon(Icons.clear),
              onPressed: _clearResults,
              tooltip: '清除结果',
            ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // 输入区域
            Card(
              elevation: 4,
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      '输入分析内容',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: _promptController,
                      maxLines: 3,
                      decoration: const InputDecoration(
                        hintText: '请输入要分析的八字信息...',
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 16),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: _isStreaming
                            ? null
                            : _startStreamingAnalysis,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.deepPurple,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 12),
                        ),
                        child: _isStreaming
                            ? const Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  SizedBox(
                                    width: 20,
                                    height: 20,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                      valueColor: AlwaysStoppedAnimation<Color>(
                                        Colors.white,
                                      ),
                                    ),
                                  ),
                                  SizedBox(width: 8),
                                  Text('分析中...'),
                                ],
                              )
                            : const Text('开始流式分析'),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // 结果显示区域
            Expanded(
              child: Card(
                elevation: 4,
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Text(
                            '分析结果',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const Spacer(),
                          if (_isStreaming)
                            const Row(
                              children: [
                                SizedBox(
                                  width: 16,
                                  height: 16,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    valueColor: AlwaysStoppedAnimation<Color>(
                                      Colors.deepPurple,
                                    ),
                                  ),
                                ),
                                SizedBox(width: 8),
                                Text(
                                  '实时生成中...',
                                  style: TextStyle(
                                    color: Colors.deepPurple,
                                    fontSize: 12,
                                  ),
                                ),
                              ],
                            ),
                          if (_isCompleted)
                            const Row(
                              children: [
                                Icon(
                                  Icons.check_circle,
                                  color: Colors.green,
                                  size: 16,
                                ),
                                SizedBox(width: 4),
                                Text(
                                  '分析完成',
                                  style: TextStyle(
                                    color: Colors.green,
                                    fontSize: 12,
                                  ),
                                ),
                              ],
                            ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Expanded(
                        child: Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            border: Border.all(color: Colors.grey.shade300),
                            borderRadius: BorderRadius.circular(8),
                            color: Colors.grey.shade50,
                          ),
                          child: _errorMessage != null
                              ? Text(
                                  _errorMessage!,
                                  style: const TextStyle(
                                    color: Colors.red,
                                    fontSize: 14,
                                  ),
                                )
                              : _streamingText.isEmpty
                              ? const Text(
                                  '点击上方按钮开始流式分析...',
                                  style: TextStyle(
                                    color: Colors.grey,
                                    fontSize: 14,
                                  ),
                                )
                              : SingleChildScrollView(
                                  controller: _scrollController,
                                  child: Text(
                                    _streamingText,
                                    style: const TextStyle(
                                      fontSize: 14,
                                      height: 1.5,
                                    ),
                                  ),
                                ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),

            // 说明文字
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.blue.shade50,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.blue.shade200),
              ),
              child: const Text(
                '💡 流式输出优势：\n'
                '• 实时显示生成过程，减少等待焦虑\n'
                '• 更快的首字响应时间\n'
                '• 更好的用户体验和交互感\n'
                '• 可以提前看到部分结果',
                style: TextStyle(fontSize: 12, color: Colors.blue, height: 1.4),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
