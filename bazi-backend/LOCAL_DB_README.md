# 本地数据库使用说明

本文档说明如何使用从 Cloudflare D1 导出的本地 SQLite 数据库。

## 数据库文件

- 数据库文件: `wishing-pool-local.db`
- 数据库导出文件: `wishing-pool-db.sql`

## 数据库表结构

数据库包含以下表:

- `users`: 用户信息表
- `wishes`: 愿望信息表
- `bless_records`: 祝福记录表
- `curse`: 诅咒信息表
- `curse_records`: 诅咒记录表
- `payment_notifications`: 支付通知表
- `recharges`: 充值记录表
- `recharge_orders`: 充值订单表
- `transactions`: 交易记录表
- `fulfillments`: 愿望实现记录表

## 使用方法

### 直接使用 SQLite 命令行

```bash
# 打开数据库
sqlite3 ./wishing-pool-local.db

# 查看所有表
.tables

# 查看表结构
.schema users

# 执行查询
SELECT * FROM users;
```

### 使用 Node.js 脚本查询

项目中提供了一个简单的 Node.js 脚本 `query_local_db.js` 用于查询数据库。

#### 安装依赖

```bash
npm install sqlite3
```

#### 运行示例查询

```bash
node query_local_db.js
```

#### 在其他脚本中使用

```javascript
const { queryUsers, queryWishes, queryTable } = require('./query_local_db');

async function main() {
  try {
    // 查询用户表
    const users = await queryUsers();
    console.log(users);
    
    // 查询愿望表
    const wishes = await queryWishes();
    console.log(wishes);
    
    // 查询任意表
    const curses = await queryTable('curse');
    console.log(curses);
  } catch (error) {
    console.error('查询失败:', error);
  }
}

main();
```

## 数据库更新

如果需要更新本地数据库，可以重新从 Cloudflare D1 导出数据:

```bash
# 导出远程数据库到 SQL 文件
npx wrangler d1 export wishing-pool-db --remote --output=./wishing-pool-db.sql

# 重新创建本地数据库
sqlite3 ./wishing-pool-local.db < ./wishing-pool-db.sql
```

## 注意事项

- 本地数据库仅用于开发和测试，不要在生产环境中使用
- 数据库中可能包含敏感信息，请妥善保管
- 修改本地数据库不会影响远程 Cloudflare D1 数据库