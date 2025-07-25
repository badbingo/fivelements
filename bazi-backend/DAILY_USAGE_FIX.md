# 每日免费使用次数问题修复说明

## 问题描述
原来的问题是每日免费使用次数存储在浏览器的localStorage中，导致：
1. 不同用户在同一浏览器上共享免费次数
2. 同一用户重新登录后免费次数会重置

## 解决方案

### 1. 数据库修改
为`users`表添加了两个新字段：
- `daily_usage_count`: 每日使用次数（INTEGER，默认0）
- `last_usage_date`: 最后使用日期（TEXT，默认NULL）

执行的SQL：
```sql
ALTER TABLE users ADD COLUMN daily_usage_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN last_usage_date TEXT DEFAULT NULL;
UPDATE users SET daily_usage_count = 0, last_usage_date = NULL WHERE daily_usage_count IS NULL;
```

### 2. 后端API新增

#### 获取每日使用次数 API
- **路径**: `GET /api/user/daily-usage`
- **认证**: 需要Bearer Token
- **功能**: 
  - 获取用户当前的每日使用次数
  - 自动检查日期，如果不是今天则重置为0
- **返回**: `{dailyUsageCount: number, lastUsageDate: string}`

#### 更新每日使用次数 API
- **路径**: `POST /api/user/update-daily-usage`
- **认证**: 需要Bearer Token
- **参数**: `{dailyUsageCount: number}`
- **功能**: 更新用户的每日使用次数和最后使用日期
- **返回**: `{success: boolean, dailyUsageCount: number, lastUsageDate: string}`

### 3. 前端修改（已完成）
前端代码已经修改为：
1. 登录时调用`/api/user/daily-usage`获取使用次数
2. 使用AI功能后调用`/api/user/update-daily-usage`更新次数
3. 如果API不可用，回退到用户特定的localStorage存储
4. 登出时清理用户特定的localStorage数据

## 修复效果

1. **用户隔离**: 每个用户账户都有独立的每日免费次数
2. **跨设备同步**: 使用次数存储在服务器，不同设备登录同一账户共享次数
3. **日期自动重置**: 每天自动重置为0次，无需手动处理
4. **向后兼容**: 如果后端API不可用，会回退到改进的localStorage方案

## 部署说明

1. 执行数据库迁移脚本：`add_daily_usage_fields.sql`
2. 部署更新后的后端代码
3. 前端代码已经支持新的API，无需额外修改

## 测试验证

可以通过以下方式验证修复：
1. 用户A登录，使用1次免费AI解卦
2. 用户A登出，用户B登录，应该仍有1次免费机会
3. 用户A重新登录，应该显示已使用1次，无免费机会
4. 第二天，用户A登录应该重新获得1次免费机会