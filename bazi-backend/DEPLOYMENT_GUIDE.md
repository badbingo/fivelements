# 外网数据库更新和部署指南

## 当前状态
外网的Cloudflare D1数据库**还没有更新**，需要手动执行以下步骤来完成更新。

## 部署步骤

### 1. 更新D1数据库结构

#### 方法一：使用wrangler命令行（推荐）
```bash
# 进入项目目录
cd /Users/Owen/Desktop/mybazi/fivelements/bazi-backend

# 执行数据库迁移
wrangler d1 execute wishing-pool-db --file=./migrations/add_daily_usage_fields.sql
```

#### 方法二：使用Cloudflare Dashboard
1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 进入 D1 数据库管理页面
3. 选择 `wishing-pool-db` 数据库
4. 在控制台中执行以下SQL：
```sql
ALTER TABLE users ADD COLUMN daily_usage_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN last_usage_date TEXT DEFAULT NULL;
UPDATE users SET daily_usage_count = 0, last_usage_date = NULL WHERE daily_usage_count IS NULL;
```

### 2. 验证数据库更新
执行以下命令验证字段是否添加成功：
```bash
wrangler d1 execute wishing-pool-db --command="PRAGMA table_info(users);"
```

应该看到新增的字段：
- `daily_usage_count` (INTEGER, DEFAULT 0)
- `last_usage_date` (TEXT, DEFAULT NULL)

### 3. 部署后端代码
```bash
# 部署到Cloudflare Workers
wrangler deploy
```

### 4. 验证API功能
部署完成后，可以测试新的API接口：
- `GET /api/user/daily-usage` - 获取每日使用次数
- `POST /api/user/update-daily-usage` - 更新每日使用次数

## 注意事项

1. **数据库备份**：在执行迁移前，建议先备份D1数据库
2. **测试环境**：如果有测试环境，建议先在测试环境验证
3. **回滚计划**：如果出现问题，可以删除新增字段：
   ```sql
   ALTER TABLE users DROP COLUMN daily_usage_count;
   ALTER TABLE users DROP COLUMN last_usage_date;
   ```

## 部署后的效果

- ✅ 每个用户账户有独立的每日免费次数
- ✅ 重新登录不会重置使用次数
- ✅ 跨设备同步使用次数
- ✅ 每天自动重置为0次
- ✅ 支持API降级到localStorage方案

## 故障排除

如果遇到问题，请检查：
1. wrangler是否已登录：`wrangler auth list`
2. 数据库ID是否正确：检查`wrangler.toml`中的`database_id`
3. 权限是否足够：确保有D1数据库的写权限