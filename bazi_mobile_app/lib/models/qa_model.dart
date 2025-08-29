/// 问答记录数据模型
class QAModel {
  final String id;
  final String question;
  final String answer;
  final DateTime timestamp;

  QAModel({
    required this.id,
    required this.question,
    required this.answer,
    required this.timestamp,
  });

  /// 从JSON创建QAModel实例
  factory QAModel.fromJson(Map<String, dynamic> json) {
    return QAModel(
      id: json['id'] as String,
      question: json['question'] as String,
      answer: json['answer'] as String,
      timestamp: DateTime.parse(json['timestamp'] as String),
    );
  }

  /// 转换为JSON
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'question': question,
      'answer': answer,
      'timestamp': timestamp.toIso8601String(),
    };
  }

  /// 复制并修改部分属性
  QAModel copyWith({
    String? id,
    String? question,
    String? answer,
    DateTime? timestamp,
  }) {
    return QAModel(
      id: id ?? this.id,
      question: question ?? this.question,
      answer: answer ?? this.answer,
      timestamp: timestamp ?? this.timestamp,
    );
  }

  @override
  String toString() {
    return 'QAModel(id: $id, question: $question, answer: ${answer.substring(0, answer.length > 50 ? 50 : answer.length)}..., timestamp: $timestamp)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is QAModel &&
        other.id == id &&
        other.question == question &&
        other.answer == answer &&
        other.timestamp == timestamp;
  }

  @override
  int get hashCode {
    return id.hashCode ^
        question.hashCode ^
        answer.hashCode ^
        timestamp.hashCode;
  }
}