// query_local_db.js
import sqlite3 from 'sqlite3';
const sqlite = sqlite3.verbose();
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 数据库文件路径
const dbPath = path.join(__dirname, 'wishing-pool-local.db');

// 创建数据库连接
const db = new sqlite.Database(dbPath, (err) => {
  if (err) {
    console.error('连接数据库失败:', err.message);
    return;
  }
  console.log('成功连接到本地数据库');
});

// 示例查询函数
function queryUsers() {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM users', [], (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(rows);
    });
  });
}

function queryWishes() {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM wishes', [], (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(rows);
    });
  });
}

function queryTable(tableName) {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM ${tableName}`, [], (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(rows);
    });
  });
}

function queryTransactions() {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM transactions WHERE type = "fulfillment" ORDER BY created_at DESC LIMIT 20', [], (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(rows);
    });
  });
}

function queryFulfillments() {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM fulfillments ORDER BY created_at DESC LIMIT 20', [], (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(rows);
    });
  });
}

// 执行示例查询
async function runQueries() {
  try {
    console.log('\n=== 用户信息 ===');
    const users = await queryUsers();
    console.table(users);
    
    console.log('\n=== 愿望信息 ===');
    const wishes = await queryWishes();
    console.table(wishes);
    
    console.log('\n=== 最近的还愿交易记录 ===');
    const transactions = await queryTransactions();
    console.table(transactions);
    
    console.log('\n=== 最近的还愿记录 ===');
    const fulfillments = await queryFulfillments();
    console.table(fulfillments);
    
    console.log('\n=== 所有表信息 ===');
    const tables = ['users', 'wishes', 'transactions', 'fulfillments'];
    for (const table of tables) {
      try {
        console.log(`\n--- ${table} ---`);
        const data = await queryTable(table);
        console.table(data);
      } catch (err) {
        console.log(`表 ${table} 不存在或查询失败:`, err.message);
      }
    }
    
  } catch (error) {
    console.error('查询失败:', error);
  } finally {
    db.close();
  }
}

// 导出函数供其他模块使用
export {
  db,
  queryUsers,
  queryWishes,
  queryTable,
  queryTransactions,
  queryFulfillments,
  runQueries
};

// 如果直接运行此文件，执行查询
if (import.meta.url === `file://${process.argv[1]}`) {
  runQueries();
}