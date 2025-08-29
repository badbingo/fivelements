import 'package:share_plus/share_plus.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// 通用分享服务
/// 支持将分析结果分享到手机上的各种平台
class ShareService {
  /// 分享命格分析结果
  static Future<void> shareMinggeAnalysis({
    required BuildContext context,
    required String name,
    required double score,
    required String level,
    required String analysis,
    String? subject,
  }) async {
    final content = _buildMinggeShareContent(
      name: name,
      score: score,
      level: level,
      analysis: analysis,
    );

    try {
      await Share.share(content, subject: subject ?? '$name的命格分析报告');
    } catch (e) {
      // 分享失败时显示选择对话框
      if (context.mounted) {
        await showShareFailureDialog(
          context: context,
          content: content,
          errorMessage: _handleShareError(e).toString(),
        );
      }
    }
  }

  /// 分享财富分析结果
  static Future<void> shareWealthAnalysis({
    required BuildContext context,
    required String name,
    required double score,
    required String level,
    required String analysis,
    String? subject,
  }) async {
    final content = _buildWealthShareContent(
      name: name,
      score: score,
      level: level,
      analysis: analysis,
    );

    try {
      await Share.share(content, subject: subject ?? '$name的财富分析报告');
    } catch (e) {
      // 分享失败时显示选择对话框
      if (context.mounted) {
        await showShareFailureDialog(
          context: context,
          content: content,
          errorMessage: _handleShareError(e).toString(),
        );
      }
    }
  }

  /// 分享九大分析模块结果
  static Future<void> shareDetailedAnalysis({
    required BuildContext context,
    required String name,
    required String moduleTitle,
    required String analysis,
    String? subject,
  }) async {
    final content = _buildDetailedAnalysisShareContent(
      name: name,
      moduleTitle: moduleTitle,
      analysis: analysis,
    );

    try {
      await Share.share(content, subject: subject ?? '$name的$moduleTitle分析报告');
    } catch (e) {
      // 分享失败时显示选择对话框
      if (context.mounted) {
        await showShareFailureDialog(
          context: context,
          content: content,
          errorMessage: _handleShareError(e).toString(),
        );
      }
    }
  }

  /// 分享六爻占卜结果
  static Future<void> shareLiuyaoResult({
    required BuildContext context,
    required String question,
    required String hexagramName,
    required String analysis,
    String? subject,
  }) async {
    final content = _buildLiuyaoShareContent(
      question: question,
      hexagramName: hexagramName,
      analysis: analysis,
    );

    try {
      await Share.share(content, subject: subject ?? '六爻占卜结果');
    } catch (e) {
      // 分享失败时显示选择对话框
      if (context.mounted) {
        await showShareFailureDialog(
          context: context,
          content: content,
          errorMessage: _handleShareError(e).toString(),
        );
      }
    }
  }

  /// 构建命格分析分享内容
  static String _buildMinggeShareContent({
    required String name,
    required double score,
    required String level,
    required String analysis,
  }) {
    return '''
📊 $name的命格分析报告

🏆 命格等级：$level
⭐ 命格评分：${score.toStringAsFixed(1)}分

📝 详细分析：
${_formatAnalysisText(analysis)}

---
💫 来自周易命理库 - 专业八字命理分析
''';
  }

  /// 构建财富分析分享内容
  static String _buildWealthShareContent({
    required String name,
    required double score,
    required String level,
    required String analysis,
  }) {
    return '''
💰 $name的财富分析报告

🏆 财富等级：$level
⭐ 财富评分：${score.toStringAsFixed(1)}分

📝 详细分析：
${_formatAnalysisText(analysis)}

---
💫 来自周易命理库 - 专业八字命理分析
''';
  }

  /// 构建九大分析模块分享内容
  static String _buildDetailedAnalysisShareContent({
    required String name,
    required String moduleTitle,
    required String analysis,
  }) {
    return '''
🔮 $name的$moduleTitle分析

📝 详细分析：
${_formatAnalysisText(analysis)}

---
💫 来自周易命理库 - 专业八字命理分析
''';
  }

  /// 构建六爻占卜分享内容
  static String _buildLiuyaoShareContent({
    required String question,
    required String hexagramName,
    required String analysis,
  }) {
    return '''
🔮 六爻占卜结果

❓ 占卜问题：$question
📊 卦象：$hexagramName

📝 卦象解析：
${_formatAnalysisText(analysis)}

---
💫 来自周易命理库 - 专业六爻占卜
''';
  }

  /// 格式化分析文本，确保分享内容的可读性和Markdown格式一致性
  static String _formatAnalysisText(String analysis) {
    // 使用与页面显示相同的Markdown处理逻辑
    String cleanText = _prepareMarkdownContentForShare(analysis);

    // 限制文本长度，避免分享内容过长
    if (cleanText.length > 1200) {
      cleanText = '${cleanText.substring(0, 1200)}...';
    }

    return cleanText;
  }

  /// 准备用于分享的Markdown内容（与页面显示保持一致）
  static String _prepareMarkdownContentForShare(String content) {
    // 移除免责声明和DeepSeek相关内容
    String cleaned = content.replaceAll(RegExp(r'以上内容由.*?生成.*?仅供参考.*?'), '');
    cleaned = cleaned.replaceAll(RegExp(r'.*?DeepSeek.*?生成.*?'), '');
    cleaned = cleaned.replaceAll(RegExp(r'仅供参考.*'), '');
    cleaned = cleaned.replaceAll(RegExp(r'，仅供娱乐参考。'), '');
    cleaned = cleaned.replaceAll(RegExp(r'\bAI\b', caseSensitive: false), '');
    cleaned = cleaned.replaceAll(RegExp(r'人工智能', caseSensitive: false), '科技');

    // 移除乱码符号但保留文本结构
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

    // 转换为适合分享的文本格式（简化的Markdown）
    // 将中文数字标题转换为简洁格式
    cleaned = cleaned.replaceAll(
      RegExp(r'^([一二三四五六七八九十]+、.*)$', multiLine: true),
      r'\n【\1】',
    );
    cleaned = cleaned.replaceAll(
      RegExp(r'^(\([一二三四五六七八九十]+\).*)$', multiLine: true),
      r'\n▶ \1',
    );

    // 确保列表项格式正确
    cleaned = cleaned.replaceAll(RegExp(r'^\s*[•·]\s*', multiLine: true), '• ');

    // 移除HTML标签
    cleaned = cleaned
        .replaceAll(RegExp(r'<[^>]*>'), '')
        .replaceAll('&nbsp;', ' ')
        .replaceAll('&amp;', '&')
        .replaceAll('&lt;', '<')
        .replaceAll('&gt;', '>')
        .replaceAll('&quot;', '"');

    return cleaned.trim();
  }

  /// 显示分享选项对话框
  static Future<void> showShareDialog({
    required BuildContext context,
    required String title,
    required VoidCallback onShare,
  }) async {
    return showDialog<void>(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: Row(
            children: [
              const Icon(Icons.share, color: Color(0xFF3498DB)),
              const SizedBox(width: 8),
              Text(title),
            ],
          ),
          content: const Text('将分析结果分享到其他应用？'),
          actions: <Widget>[
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('取消'),
            ),
            ElevatedButton(
              onPressed: () {
                Navigator.of(context).pop();
                onShare();
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF3498DB),
                foregroundColor: Colors.white,
              ),
              child: const Text('分享'),
            ),
          ],
        );
      },
    );
  }

  /// 复制内容到剪贴板
  static Future<void> copyToClipboard({
    required BuildContext context,
    required String content,
    String? successMessage,
  }) async {
    try {
      await Clipboard.setData(ClipboardData(text: content));

      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(successMessage ?? '内容已复制到剪贴板，可以粘贴到微信等应用中分享'),
            backgroundColor: Colors.green,
            duration: const Duration(seconds: 3),
            action: SnackBarAction(
              label: '知道了',
              textColor: Colors.white,
              onPressed: () {
                ScaffoldMessenger.of(context).hideCurrentSnackBar();
              },
            ),
          ),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('复制失败，请稍后重试'),
            backgroundColor: Colors.red,
            duration: Duration(seconds: 2),
          ),
        );
      }
    }
  }

  /// 显示分享失败后的选择对话框
  static Future<void> showShareFailureDialog({
    required BuildContext context,
    required String content,
    required String errorMessage,
  }) async {
    return showDialog<void>(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Row(
            children: [
              Icon(Icons.warning, color: Colors.orange),
              SizedBox(width: 8),
              Text('分享失败'),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(errorMessage),
              const SizedBox(height: 16),
              const Text(
                '您可以选择：',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              const Text('• 复制内容到剪贴板，然后手动粘贴到微信等应用'),
              const Text('• 重新尝试系统分享'),
            ],
          ),
          actions: <Widget>[
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('取消'),
            ),
            TextButton(
              onPressed: () async {
                Navigator.of(context).pop();
                await copyToClipboard(context: context, content: content);
              },
              child: const Text('复制内容'),
            ),
            ElevatedButton(
              onPressed: () async {
                Navigator.of(context).pop();
                try {
                  await Share.share(content);
                } catch (e) {
                  if (context.mounted) {
                    await copyToClipboard(
                      context: context,
                      content: content,
                      successMessage: '系统分享再次失败，内容已复制到剪贴板',
                    );
                  }
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF3498DB),
                foregroundColor: Colors.white,
              ),
              child: const Text('重试分享'),
            ),
          ],
        );
      },
    );
  }

  /// 处理分享错误
  static Exception _handleShareError(dynamic error) {
    final errorMessage = error.toString().toLowerCase();

    String message;
    if (errorMessage.contains('wechat') || errorMessage.contains('微信')) {
      message = '微信分享暂不支持，请选择其他分享方式（如复制文本后手动发送到微信）';
    } else if (errorMessage.contains('unsupported') ||
        errorMessage.contains('不支持')) {
      message = '该应用暂不支持此分享类型，请尝试其他分享方式';
    } else if (errorMessage.contains('cancelled') ||
        errorMessage.contains('取消')) {
      message = '分享已取消';
    } else {
      message = '分享失败，请稍后重试或选择其他分享方式';
    }

    return Exception(message);
  }
}
