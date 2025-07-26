CREATE TABLE IF NOT EXISTS wishes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  birth_time TEXT NOT NULL,
  bazi TEXT NOT NULL,
  content TEXT NOT NULL,
  wish_type TEXT NOT NULL,
  visibility TEXT NOT NULL,
  blessings INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  solar_date TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_wish_type ON wishes(wish_type);
CREATE INDEX IF NOT EXISTS idx_created_at ON wishes(created_at);
CREATE INDEX IF NOT EXISTS idx_blessings ON wishes(blessings);
CREATE INDEX IF NOT EXISTS idx_solar_date ON wishes(solar_date);

CREATE TABLE IF NOT EXISTS wishes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  birth_time TEXT NOT NULL,
  bazi TEXT NOT NULL,
  content TEXT NOT NULL,
  wish_type TEXT NOT NULL,
  visibility TEXT NOT NULL,
  blessings INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  solar_date TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_wish_type ON wishes(wish_type);
CREATE INDEX IF NOT EXISTS idx_created_at ON wishes(created_at);
CREATE INDEX IF NOT EXISTS idx_blessings ON wishes(blessings);
CREATE INDEX IF NOT EXISTS idx_solar_date ON wishes(solar_date);
