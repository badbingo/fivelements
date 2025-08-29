import http from 'http';
import { URL } from 'url';
import { createRequire } from 'module';
import { readFileSync } from 'fs';
import { join } from 'path';
import worker from './src/index.js';

const require = createRequire(import.meta.url);

// 加载.dev.vars文件
function loadDevVars() {
  try {
    const devVarsPath = join(process.cwd(), '.dev.vars');
    const devVarsContent = readFileSync(devVarsPath, 'utf8');
    const lines = devVarsContent.split('\n');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=');
          process.env[key] = value;
          console.log(`Loaded env var: ${key}`);
        }
      }
    }
  } catch (error) {
    console.warn('Warning: Could not load .dev.vars file:', error.message);
  }
}

// 加载环境变量
loadDevVars();

// 使用真实的Cloudflare D1数据库
const env = {
  JWT_SECRET: process.env.JWT_SECRET || 'test_jwt_secret_placeholder',
  DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  ENVIRONMENT: 'local',
  // 这里我们需要配置真实的D1数据库连接
  // 由于在本地环境中，我们需要使用wrangler来连接D1数据库
  DB: null // 将在下面初始化
};

// 调试：打印加载的环境变量
console.log('Environment variables loaded:');
console.log('JWT_SECRET:', env.JWT_SECRET ? 'loaded' : 'not found');
console.log('DEEPSEEK_API_KEY:', env.DEEPSEEK_API_KEY ? `${env.DEEPSEEK_API_KEY.substring(0, 10)}...` : 'not found');
console.log('STRIPE_SECRET_KEY:', env.STRIPE_SECRET_KEY ? 'loaded' : 'not found');
console.log('STRIPE_WEBHOOK_SECRET:', env.STRIPE_WEBHOOK_SECRET ? 'loaded' : 'not found');

// 初始化D1数据库连接
async function initializeDatabase() {
  try {
    // 在本地开发环境中，我们可以使用SQLite来模拟D1数据库
    const Database = require('better-sqlite3');
    const db = new Database('./wishing-pool-local.db');
    
    // 创建表结构（如果不存在）
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        balance REAL DEFAULT 0,
        created_at INTEGER NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS wishes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        category TEXT,
        status TEXT DEFAULT 'active',
        created_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id)
      );
      
      CREATE TABLE IF NOT EXISTS recharge_orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id TEXT UNIQUE NOT NULL,
        user_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        payment_method TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id)
      );
      
      CREATE TABLE IF NOT EXISTS bless_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        wish_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (wish_id) REFERENCES wishes (id),
        FOREIGN KEY (user_id) REFERENCES users (id)
      );
      
      CREATE TABLE IF NOT EXISTS curse (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        target_type TEXT,
        status TEXT DEFAULT 'active',
        created_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id)
      );
      
      CREATE TABLE IF NOT EXISTS curse_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        curse_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (curse_id) REFERENCES curse (id),
        FOREIGN KEY (user_id) REFERENCES users (id)
      );
      
      CREATE TABLE IF NOT EXISTS fulfillments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        wish_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (wish_id) REFERENCES wishes (id),
        FOREIGN KEY (user_id) REFERENCES users (id)
      );
      
      CREATE TABLE IF NOT EXISTS recharges (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        payment_method TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id)
      );
    `);
    
    // 包装SQLite以提供D1兼容的API
    const d1Wrapper = {
      prepare: (query) => {
        console.log('DB Query:', query);
        const stmt = db.prepare(query);
        return {
          bind: (...params) => {
            console.log('Params:', params);
            return {
              first: async () => {
                try {
                  return stmt.get(...params) || null;
                } catch (error) {
                  console.error('Database query error:', error);
                  return null;
                }
              },
              all: async () => {
                try {
                  return { results: stmt.all(...params) };
                } catch (error) {
                  console.error('Database query error:', error);
                  return { results: [] };
                }
              },
              run: async () => {
                try {
                  const result = stmt.run(...params);
                  return {
                    success: true,
                    meta: {
                      last_row_id: result.lastInsertRowid,
                      changes: result.changes
                    }
                  };
                } catch (error) {
                  console.error('Database run error:', error);
                  return {
                    success: false,
                    error: error.message
                  };
                }
              }
            };
          }
        };
      },
      batch: async (operations) => {
        console.log('Batch operations:', operations.length);
        const results = [];
        for (const op of operations) {
          try {
            const result = await op;
            results.push(result);
          } catch (error) {
            console.error('Batch operation error:', error);
            results.push({ success: false, error: error.message });
          }
        }
        return results;
      }
    };
    
    env.DB = d1Wrapper;
    console.log('Database initialized successfully');
    
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
}

// 创建HTTP服务器
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    
    // 创建模拟的Request对象
    let bodyData = null;
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      bodyData = await new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => {
          body += chunk.toString();
        });
        req.on('end', () => {
          resolve(body);
        });
        req.on('error', reject);
      });
    }
    
    // 创建兼容Web API的Headers对象
    const headers = new Map();
    Object.entries(req.headers).forEach(([key, value]) => {
      headers.set(key.toLowerCase(), Array.isArray(value) ? value[0] : value);
    });
    // 添加get方法来兼容Web API
    const originalGet = headers.get.bind(headers);
    headers.get = (name) => originalGet(name.toLowerCase());
    headers.entries = () => headers.entries();
    
    const request = {
      url: url.href,
      method: req.method,
      headers: headers,
      json: async () => {
        if (bodyData) {
          return JSON.parse(bodyData);
        }
        return {};
      }
    };
    
    // 调用worker处理请求
    const response = await worker.fetch(request, env);
    
    // 设置响应头
    res.statusCode = response.status;
    for (const [key, value] of response.headers.entries()) {
      res.setHeader(key, value);
    }
    
    // 发送响应体
    const responseText = await response.text();
    res.end(responseText);
    
  } catch (error) {
    console.error('Server error:', error);
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'Internal server error' }));
  }
});

// 启动服务器
async function startServer() {
  await initializeDatabase();
  
  const PORT = 8787;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    console.log(`Also available at http://192.168.1.56:${PORT}`);
  });
}

startServer().catch(console.error);