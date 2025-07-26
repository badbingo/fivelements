-- 为users表添加每日使用次数相关字段
-- 这个脚本用于更新Cloudflare D1数据库

ALTER TABLE users ADD COLUMN daily_usage_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN last_usage_date TEXT DEFAULT NULL;

-- 更新现有用户的字段
UPDATE users SET daily_usage_count = 0, last_usage_date = NULL WHERE daily_usage_count IS NULL;