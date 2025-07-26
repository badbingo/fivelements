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

