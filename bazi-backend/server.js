import http from 'http';
import { URL } from 'url';
import worker from './src/index.js';

// 模拟Cloudflare Worker环境
const env = {
  JWT_SECRET: 'your_jwt_secret_key',
  D1_TOKEN: 'mock_d1_token',
  DB: {
    userBalance: 25.0,
    wishFulfilled: false,
    withSession: (sessionToken) => {
      console.log('Using session token:', sessionToken);
      return env.DB;
    },
    prepare: (query) => {
      console.log('DB Query:', query);
      return {
        bind: (...params) => {
          console.log('Params:', params);
          return {
            first: async () => {
              // 模拟数据库查询结果
              if (query.includes('SELECT balance FROM users WHERE id = ?') && params[0] === 6) {
                return { balance: env.DB.userBalance };
              }
              // 模拟用户余额查询
              if (query.includes('SELECT id, balance FROM users WHERE id = ?') && params[0] === 6) {
                return { id: 6, balance: env.DB.userBalance };
              }
              // 模拟愿望查询
              if (query.includes('SELECT * FROM wishes WHERE id = ?') && (params[0] === 23 || params[0] === '23')) {
                return { 
                  id: 23, 
                  user_name: '林小甜', 
                  content: '希望这个月能和社团里那个总对我笑的学长有更多接触！', 
                  is_fulfilled: 0, 
                  user_id: 6 
                };
              }
              // 模拟愿望状态查询
              if (query.includes('SELECT id, user_id, is_fulfilled FROM wishes WHERE id = ?') && (params[0] === 23 || params[0] === '23')) {
                return { 
                  id: 23, 
                  is_fulfilled: env.DB.wishFulfilled ? 1 : 0, 
                  user_id: 6 
                };
              }
              return null;
            },
            all: async () => {
              // 模拟愿望列表查询
              if (query.includes('SELECT * FROM wishes')) {
                return [{
                  id: 23, 
                  user_name: '林小甜', 
                  content: '希望这个月能和社团里那个总对我笑的学长有更多接触！', 
                  is_fulfilled: 0, 
                  user_id: 6
                }];
              }
              return [];
            }
          };
        }
      };
    },
    batch: async (operations) => {
      console.log('Batch operations:', operations);
      // 模拟批量操作成功，并更新模拟数据
      // 在实际支付后，将愿望状态更新为已还愿，并减少用户余额
      const userBalance = 25.0;
      const paymentAmount = 1.0;
      env.DB.userBalance = userBalance - paymentAmount;
      env.DB.wishFulfilled = true;
      return operations.map(() => ({ success: true }));
    }
  }
};

const server = http.createServer(async (req, res) => {
  try {
    // 构建Request对象
    const url = new URL(req.url, `http://${req.headers.host}`);
    const headers = new Headers();
    Object.entries(req.headers).forEach(([key, value]) => {
      headers.set(key, value);
    });

    // 读取请求体
    let body = [];
    req.on('data', (chunk) => {
      body.push(chunk);
    });

    await new Promise((resolve) => {
      req.on('end', () => {
        body = Buffer.concat(body).toString();
        resolve();
      });
    });

    // 构建Request对象
    const request = new Request(url, {
      method: req.method,
      headers,
      body: body.length > 0 ? body : null
    });

    // 调用Worker处理请求
    const response = await worker.fetch(request, env, {});
    
    // 设置响应头
    res.statusCode = response.status;
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    // 发送响应体
    const responseBody = await response.text();
    res.end(responseBody);
  } catch (error) {
    console.error('Server error:', error);
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'Internal Server Error' }));
  }
});

const PORT = 8787;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});