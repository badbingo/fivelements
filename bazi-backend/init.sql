-- 创建用户表
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT,
  apple_id TEXT UNIQUE,
  balance REAL DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  avatar TEXT,
  bazi_info TEXT,
  real_name TEXT,
  gender TEXT,
  birth_date TEXT,
  birth_time TEXT,
  birth_location TEXT,
  lunar_date TEXT,
  bazi_chart TEXT
);

-- 插入测试用户数据
INSERT INTO users (id, name, email, password, balance) VALUES 
(1, 'Owen', 'owen@example.com', 'test123', 150.50),
(2, 'testuser', 'testuser@example.com', 'test123', 200.00),
(3, 'test', 'test@example.com', 'test123', 75.25);

CREATE TABLE wishes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_name TEXT NOT NULL,
  bazi TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL,
  visibility TEXT NOT NULL,
  blessings INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT NOT NULL,
  is_fulfilled INTEGER DEFAULT 0,
  birth_date TEXT NOT NULL,
  birth_time TEXT NOT NULL,
  user_id TEXT,
  solar_date TEXT
);

CREATE TABLE blessings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wish_id INTEGER NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (wish_id) REFERENCES wishes(id)
);

CREATE TABLE fulfillments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wish_id INTEGER NOT NULL,
  amount REAL NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (wish_id) REFERENCES wishes(id)
);

