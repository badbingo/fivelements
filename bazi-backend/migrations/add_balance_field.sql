-- 为users表添加余额字段
-- 这个脚本用于更新Cloudflare D1数据库

ALTER TABLE users ADD COLUMN balance REAL DEFAULT 0;

-- 更新现有用户的余额字段，给每个用户初始余额100元
UPDATE users SET balance = 100 WHERE balance IS NULL;