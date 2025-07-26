-- schema.sql
CREATE TABLE IF NOT EXISTS wishes (
  id TEXT PRIMARY KEY,
  user_name TEXT NOT NULL DEFAULT '匿名用户',
  birth_date TEXT NOT NULL DEFAULT '2000-01-01',
  birth_time TEXT NOT NULL DEFAULT '0-0',
  bazi TEXT NOT NULL DEFAULT '未知八字',
  content TEXT NOT NULL DEFAULT '暂无内容',
  wish_type TEXT CHECK(wish_type IN ('love', 'wealth', 'health', 'study', 'family', 'other')),
  visibility TEXT DEFAULT 'public' CHECK(visibility IN ('public', 'private')),
  energy_level INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
