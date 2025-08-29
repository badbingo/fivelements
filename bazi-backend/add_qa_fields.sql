-- 添加问答相关字段到用户表
ALTER TABLE users ADD COLUMN daily_qa_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN qa_count_date TEXT DEFAULT NULL;

-- 创建问答历史表
CREATE TABLE IF NOT EXISTS qa_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 创建索引提高查询性能
CREATE INDEX IF NOT EXISTS idx_qa_history_user_id ON qa_history(user_id);
CREATE INDEX IF NOT EXISTS idx_qa_history_created_at ON qa_history(created_at);
CREATE INDEX IF NOT EXISTS idx_users_qa_count_date ON users(qa_count_date);