-- 为现有users表添加新字段
ALTER TABLE users ADD COLUMN avatar TEXT;
ALTER TABLE users ADD COLUMN bazi_info TEXT;
ALTER TABLE users ADD COLUMN real_name TEXT;
ALTER TABLE users ADD COLUMN gender TEXT;
ALTER TABLE users ADD COLUMN birth_date TEXT;
ALTER TABLE users ADD COLUMN birth_time TEXT;
ALTER TABLE users ADD COLUMN birth_location TEXT;
ALTER TABLE users ADD COLUMN lunar_date TEXT;
ALTER TABLE users ADD COLUMN bazi_chart TEXT;