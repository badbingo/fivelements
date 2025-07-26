-- 阶段1: 准备工作
-- 1.1 创建完整备份表
CREATE TABLE wishes_backup AS SELECT * FROM wishes;

-- 1.2 验证备份
SELECT COUNT(*) AS backup_count FROM wishes_backup;

-- 阶段2: 创建新表结构
CREATE TABLE IF NOT EXISTS wishes_new (
  id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
  user_id TEXT NOT NULL DEFAULT 'unknown',
  user_name TEXT NOT NULL,
  birth_date TEXT NOT NULL DEFAULT '',
  birth_time TEXT NOT NULL DEFAULT '',
  bazi TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'public',
  solar_date TEXT NOT NULL DEFAULT '',
  blessings INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  is_fulfilled INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT NOT NULL DEFAULT (datetime(CURRENT_TIMESTAMP, '+30 days'))
);

-- 阶段3: 数据迁移
INSERT INTO wishes_new
SELECT 
  id,
  COALESCE(user_id, 'unknown'),
  user_name,
  COALESCE(birth_date, ''),
  COALESCE(birth_time, ''),
  bazi,
  content,
  type,
  COALESCE(visibility, 'public'),
  COALESCE(solar_date, ''),
  COALESCE(blessings, 0),
  COALESCE(level, 1),
  COALESCE(is_fulfilled, 0),
  COALESCE(created_at, CURRENT_TIMESTAMP),
  COALESCE(expires_at, datetime(CURRENT_TIMESTAMP, '+30 days'))
FROM wishes;

-- 阶段4: 验证迁移
SELECT 
  (SELECT COUNT(*) FROM wishes) AS old_count,
  (SELECT COUNT(*) FROM wishes_new) AS new_count,
  (SELECT COUNT(*) FROM wishes_backup) AS backup_count;

-- 阶段5: 切换表 (分步执行)
-- 5.1 先重命名旧表 (作为二次备份)
ALTER TABLE wishes RENAME TO wishes_old;

-- 5.2 再重命名新表
ALTER TABLE wishes_new RENAME TO wishes;

-- 阶段6: 最终验证
PRAGMA table_info(wishes);
SELECT COUNT(*) FROM wishes;