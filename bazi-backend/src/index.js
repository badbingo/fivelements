import { SignJWT } from 'jose';
import { jwtVerify } from 'jose';
import Stripe from 'stripe';
import { calculateBaziAccurate, calculateBaziLocally } from './bazi-calculator.js';

// ✅ 生成 JWT
async function generateJWT(payload, secret) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .sign(new TextEncoder().encode(secret));
}

// ✅ 验证 JWT
async function verifyJWT(token, secret) {
  try {
    console.log('验证JWT - Token:', token ? token.substring(0, 50) + '...' : 'null');
    console.log('验证JWT - Secret:', secret);
    console.log('验证JWT - Token parts:', token ? token.split('.').length : 0);
    
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    console.log('JWT验证成功 - Payload:', payload);
    return payload;
  } catch (err) {
    console.log('JWT 验证错误:', err.message);
    console.log('JWT 验证错误详情:', err);
    return null;
  }
}

async function hashPassword(password) {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(password));
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function sendResetEmail(toEmail, emailContent, htmlContent, env) {
  const payload = {
    sender: {
      email: "owenjass@gmail.com",
      name: "麦八字"
    },
    to: [{
      email: toEmail
    }],
    subject: "重设你的密码",
    textContent: emailContent,
    htmlContent: htmlContent,
  };

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": env.SENDINBLUE_API_KEY,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SendinBlue 错误：${res.status} - ${text}`);
  }
}

// 安全执行数据库操作的辅助函数
async function safeDbRun(db, query, params = []) {
  try {
    // 分步执行避免链式调用
    const stmt = db.prepare(query);
    const boundStmt = stmt.bind(...params);
    const result = await boundStmt.run();
    return result;
  } catch (error) {
    console.error('Database run error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 安全的数据库查询函数（用于first()操作）
async function safeDbFirst(db, query, params = []) {
  try {
    const statement = db.prepare(query);
    let boundStatement;
    
    // 安全地绑定参数
    try {
      boundStatement = statement.bind(...params);
    } catch (bindError) {
      console.log('Bind failed for first query, returning null:', bindError.message);
      return null;
    }
    
    // 安全地执行first方法
    if (boundStatement && typeof boundStatement.first === 'function') {
      try {
        return await boundStatement.first();
      } catch (firstError) {
        console.log('First failed, returning null:', firstError.message);
        return null;
      }
    } else {
      // 模拟环境的fallback
      console.log('Using mock result for first query');
      return null;
    }
  } catch (error) {
    console.error('Database first operation failed:', error);
    return null;
  }
}

// 创建 D1 会话
async function createD1Session(env) {
  try {
    // 在本地环境中，返回一个模拟的会话令牌
    if (env.ENVIRONMENT === 'local') {
      console.log('Using mock D1 session token for local development');
      return 'mock_session_token_for_local_dev';
    }
    
    // 在生产环境中，正常创建D1会话
    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${env.ACCOUNT_ID}/d1/database/${env.DATABASE_ID}/query/session`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'read-replica-session',
        expires_at: new Date(Date.now() + 3600 * 1000).toISOString() // 1小时后过期
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to create session: ${response.status}`);
    }

    const data = await response.json();
    return data.result.session_token;
  } catch (error) {
    console.error('Error creating D1 session:', error);
    throw error;
  }
}

export default {
  async fetch(request, env, ctx) {
    console.log('Received request: ' + request.method + ' ' + new URL(request.url).pathname);
    console.log('JWT_SECRET:', env.JWT_SECRET);
    // 直接使用主数据库，避免会话令牌问题
    const db = env.DB;

    const { method } = request;
    const url = new URL(request.url);

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    };

    if (method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // 注册接口
    if (url.pathname === '/api/register' && method === 'POST') {
      try {
        const { username, email, password } = await request.json();

        // 检查用户名或邮箱是否已存在
        const statement = db.prepare(`SELECT * FROM users WHERE name = ? OR email = ?`);
        const boundStatement = statement.bind(username, email);
        const existingUser = await boundStatement.first();
        if (existingUser) {
          return new Response(JSON.stringify({ error: '用户名或邮箱已被使用' }), {
            status: 409,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        const hashed = await hashPassword(password);
        const createdAt = Date.now(); // 使用时间戳（INTEGER 类型）

        // 用户注册 - 使用安全的数据库操作
        const result = await safeDbRun(db, `
          INSERT INTO users (name, email, password, created_at)
          VALUES (?, ?, ?, ?)
        `, [username, email, hashed, createdAt]);

        // 获取新创建的用户信息 - 使用安全的数据库操作
        let newUser = await safeDbFirst(db, `SELECT * FROM users WHERE id = ?`, [result.meta.last_row_id]);
        
        if (!newUser) {
          console.log('Using mock user data for response');
          // 使用模拟用户数据
          newUser = {
            id: result.meta.last_row_id,
            name: username,
            email: email,
            balance: 0,
            created_at: createdAt
          };
        }
        
        // 生成JWT token
        const token = await generateJWT({ id: newUser.id, name: newUser.name }, env.JWT_SECRET);
        
        return new Response(JSON.stringify({ 
          success: true,
          token,
          user: {
            id: newUser.id.toString(),
            username: newUser.name,
            email: newUser.email,
            balance: newUser.balance || 0,
            createdAt: new Date(newUser.created_at).toISOString()
          }
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      } catch (error) {
        console.error('Register error:', error);
        return new Response(JSON.stringify({ error: '注册过程中发生错误' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    }

    // 登录接口
    if (url.pathname === '/api/login' && method === 'POST') {
      try {
        const { name, username, password } = await request.json();
        const actualUsername = name || username; // 支持两种参数名
        // 查询用户信息 - 使用安全的数据库操作
        const user = await safeDbFirst(db, `SELECT * FROM users WHERE name = ?`, [actualUsername]);
        
        // 对输入密码进行哈希处理后比较
        const hashedPassword = await hashPassword(password);
        if (!user || user.password !== hashedPassword) {
          return new Response(JSON.stringify({ error: '用户名或密码错误' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        const token = await generateJWT({ id: user.id, name: user.name }, env.JWT_SECRET);
        return new Response(JSON.stringify({ 
          success: true,
          token,
          user: {
            id: user.id.toString(),
            username: user.name,
            email: user.email,
            balance: user.balance || 0,
            createdAt: new Date(user.created_at).toISOString()
          }
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      } catch (error) {
        console.error('Login error:', error);
        return new Response(JSON.stringify({ error: '登录过程中发生错误' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    }

    // Apple登录接口
    if (url.pathname === '/api/apple-signin' && method === 'POST') {
      try {
        const { appleId, email, name, identityToken } = await request.json();
        
        if (!appleId || !identityToken) {
          return new Response(JSON.stringify({ error: 'Apple ID和身份令牌是必需的' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        // 查找现有用户（通过Apple ID或邮箱）
        let user = await safeDbFirst(db, `SELECT * FROM users WHERE apple_id = ?`, [appleId]);
        
        if (!user && email) {
          // 如果通过Apple ID找不到，尝试通过邮箱查找
          user = await safeDbFirst(db, `SELECT * FROM users WHERE email = ?`, [email]);
          if (user) {
            // 更新现有用户的Apple ID
            await safeDbRun(db, `UPDATE users SET apple_id = ? WHERE id = ?`, [appleId, user.id]);
          }
        }
        
        if (!user) {
          // 创建新用户
          let username = name || `Apple用户${Date.now()}`;
          let userEmail = email || '';
          
          // 确保用户名唯一
          let counter = 1;
          let originalUsername = username;
          while (await safeDbFirst(db, `SELECT id FROM users WHERE name = ?`, [username])) {
            username = `${originalUsername}_${counter}`;
            counter++;
          }
          
          // 如果邮箱已存在，清空邮箱字段
          if (userEmail && await safeDbFirst(db, `SELECT id FROM users WHERE email = ?`, [userEmail])) {
            userEmail = '';
          }
          
          const result = await safeDbRun(db, 
            `INSERT INTO users (name, email, password, apple_id, balance, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
            [username, userEmail, '', appleId, 0, new Date().toISOString()]
          );
          
          user = {
            id: result.meta.last_row_id,
            name: username,
            email: email || '',
            apple_id: appleId,
            balance: 0,
            created_at: new Date().toISOString()
          };
        }

        // 生成JWT令牌
        const token = await generateJWT({ id: user.id, name: user.name }, env.JWT_SECRET);
        
        return new Response(JSON.stringify({ 
          success: true,
          token,
          user: {
            id: user.id.toString(),
            username: user.name,
            email: user.email,
            balance: user.balance || 0,
            createdAt: new Date(user.created_at).toISOString()
          }
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      } catch (error) {
        console.error('Apple登录错误:', error);
        return new Response(JSON.stringify({ error: 'Apple登录过程中发生错误' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    }

    // 请求重设密码接口
    if (url.pathname === '/api/request-reset' && method === 'POST') {
      try {
        const { email, isMobile } = await request.json();
        console.log('收到重置密码请求，邮箱:', email);
        
        const user = await safeDbFirst(db, `SELECT * FROM users WHERE email = ?`, [email]);
        if (!user) {
          console.log('用户不存在:', email);
          // 不暴露是否存在
          return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }
        
        console.log('为用户生成重置令牌:', user.id);
        // 设置过期时间为10分钟后
        const expTime = Math.floor(Date.now() / 1000) + 600;
        const token = await generateJWT({ id: user.id, exp: expTime }, env.JWT_SECRET);
        console.log('生成的令牌长度:', token.length);
        
        // 根据是否为移动端请求决定使用深度链接还是网页链接
        let resetUrlBase;
        if (isMobile) {
          resetUrlBase = 'mybazi://reset';
        } else {
          resetUrlBase = env.RESET_URL_BASE || 'https://mybazi.net/system/reset.html';
        }
        const link = `${resetUrlBase}?token=${token}`;
        console.log('重置链接:', link);
        
        // 修改邮件内容，包含用户名
        const emailContent = `尊敬的 ${user.name}，\n\n点击以下链接重设你的密码：\n\n${link}\n\n链接10分钟内有效。`;
        const htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333; text-align: center;">密码重设</h2>
            <p style="color: #666; font-size: 16px;">尊敬的 ${user.name}，</p>
            <p style="color: #666; font-size: 16px;">点击以下链接重设你的密码：</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${link}" style="background-color: #3182ce; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-size: 16px; display: inline-block;">重设密码</a>
            </div>
            <p style="color: #999; font-size: 14px;">链接10分钟内有效。</p>
            <p style="color: #999; font-size: 12px;">如果按钮无法点击，请复制以下链接到浏览器：<br>${link}</p>
          </div>
        `;
        
        await sendResetEmail(email, emailContent, htmlContent, env);
        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      } catch (err) {
        console.error('请求重置密码错误:', err);
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    }

    // 提交新密码接口
    if (url.pathname === '/api/reset-password' && method === 'POST') {
      try {
        const { token, newPassword } = await request.json();
        console.log('收到重置密码请求，token长度:', token ? token.length : 0);
        
        const payload = await verifyJWT(token, env.JWT_SECRET);
        console.log('JWT验证结果:', payload ? '成功' : '失败');
        
        if (!payload) {
          return new Response(JSON.stringify({ error: '无效的重置令牌' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }
        
        if (payload.exp < Math.floor(Date.now() / 1000)) {
          console.log('令牌已过期，过期时间:', new Date(payload.exp * 1000).toISOString());
          return new Response(JSON.stringify({ error: '重置链接已过期' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }
        
        console.log('准备更新用户ID的密码:', payload.id);
        const hashed = await hashPassword(newPassword);
        await safeDbRun(db, `UPDATE users SET password = ? WHERE id = ?`, [hashed, payload.id]);
        
        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      } catch (error) {
        console.error('重置密码错误:', error);
        return new Response(JSON.stringify({ error: '重置密码过程中发生错误', message: error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    }

    // 获取用户余额接口 - 已移除重复定义，使用文件末尾的统一实现

    // 获取用户每日使用次数接口
    if (url.pathname === '/api/user/daily-usage' && method === 'GET') {
      try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
          return new Response(JSON.stringify({ error: '未授权' }), { 
            status: 401, 
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        const token = authHeader.split(' ')[1];
        const payload = await verifyJWT(token, env.JWT_SECRET);
        if (!payload?.id) {
          return new Response(JSON.stringify({ error: '无效令牌' }), { 
            status: 401,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        const user = await db.prepare(
          `SELECT daily_qa_count, qa_count_date FROM users WHERE id = ?`
        ).bind(payload.id).first();
        
        if (!user) {
          return new Response(JSON.stringify({ error: '用户不存在' }), { 
            status: 404,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD格式
        let dailyUsageCount = user.daily_qa_count || 0;
        
        // 如果不是今天，重置使用次数
        if (user.qa_count_date !== today) {
          dailyUsageCount = 0;
          await db.prepare(
            `UPDATE users SET daily_qa_count = 0, qa_count_date = ? WHERE id = ?`
          ).bind(today, payload.id).run();
        }

        return new Response(JSON.stringify({ 
          dailyUsageCount,
          lastUsageDate: today
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });

      } catch (error) {
        console.error('获取每日使用次数错误:', error);
        return new Response(JSON.stringify({ 
          error: '获取使用次数失败',
          message: error.message 
        }), { 
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    }

    // 更新用户每日使用次数接口
    if (url.pathname === '/api/user/update-daily-usage' && method === 'POST') {
      try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
          return new Response(JSON.stringify({ error: '未授权' }), { 
            status: 401,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        const token = authHeader.split(' ')[1];
        const payload = await verifyJWT(token, env.JWT_SECRET);
        if (!payload?.id) {
          return new Response(JSON.stringify({ error: '无效令牌' }), { 
            status: 401,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        const { dailyUsageCount } = await request.json();
        if (typeof dailyUsageCount !== 'number' || dailyUsageCount < 0) {
          return new Response(JSON.stringify({ error: '使用次数无效' }), { 
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD格式
        
        const result = await db.prepare(
          `UPDATE users SET daily_qa_count = ?, qa_count_date = ? WHERE id = ?`
        ).bind(dailyUsageCount, today, payload.id).run();
        if (!result.success) {
          throw new Error('数据库更新失败');
        }

        return new Response(JSON.stringify({ 
          success: true,
          dailyUsageCount,
          lastUsageDate: today,
          message: '使用次数更新成功'
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });

      } catch (error) {
        console.error('更新每日使用次数错误:', error);
        return new Response(JSON.stringify({ 
          success: false,
          error: '更新使用次数失败',
          message: error.message 
        }), { 
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    }

    // 用户扣费接口
    if (url.pathname === '/api/user/deduct' && method === 'POST') {

    // 余额支付接口
    if (url.pathname === '/api/pay_with_balance' && method === 'POST') {
      try {
        // 1. 验证请求
        const authHeader = request.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
          return new Response(JSON.stringify({ error: '未授权' }), { 
            status: 401,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }
        
        const token = authHeader.split(' ')[1];
        const payload = await verifyJWT(token, env.JWT_SECRET);
        if (!payload?.id) {
          return new Response(JSON.stringify({ error: '无效令牌' }), { 
            status: 401,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        const { amount, service } = await request.json();
        if (!amount || amount <= 0 || !service) {
          return new Response(JSON.stringify({ error: '参数无效' }), { 
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        // 2. 检查用户余额
        const user = await db.prepare(
          `SELECT id, balance FROM users WHERE id = ?`
        ).bind(payload.id).first();
        
        if (!user) {
          return new Response(JSON.stringify({ error: '用户不存在' }), { 
            status: 404,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }
        
        if (user.balance < amount) {
          return new Response(JSON.stringify({ 
            error: '余额不足',
            currentBalance: user.balance,
            requiredAmount: amount
          }), { 
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        // 3. 生成交易ID
        const transactionId = crypto.randomUUID();
        const timestamp = Math.floor(Date.now() / 1000);

        // 4. 执行扣费操作
        const batchResult = await db.batch([
          db.prepare(
            `UPDATE users SET balance = balance - ? WHERE id = ?`
          ).bind(amount, payload.id),
          
          db.prepare(
            `INSERT INTO transactions 
            (id, user_id, amount, type, status, description, created_at)
            VALUES (?, ?, ?, 'deduct', 'completed', ?, ?)`
          ).bind(
            transactionId,
            payload.id,
            amount,
            `服务扣费: ${service}`,
            timestamp
          )
        ]);

        // 5. 检查批量操作结果
        if (!batchResult.every(r => r.success)) {
          console.error('扣费批量操作失败:', batchResult);
          throw new Error('数据库操作失败');
        }

        // 6. 获取更新后的余额
        const updatedUser = await db.prepare(
          `SELECT balance FROM users WHERE id = ?`
        ).bind(payload.id).first();

        return new Response(JSON.stringify({
          success: true,
          transactionId,
          newBalance: updatedUser.balance,
          message: '支付成功'
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });

      } catch (error) {
        console.error('支付错误:', error);
        
        return new Response(JSON.stringify({
          success: false,
          error: '支付处理失败',
          message: '系统异常，请稍后重试'
        }), { 
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    }
      try {
        // 1. 验证请求
        const authHeader = request.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
          return new Response(JSON.stringify({ error: '未授权' }), { 
            status: 401,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }
        
        const token = authHeader.split(' ')[1];
        const payload = await verifyJWT(token, env.JWT_SECRET);
        if (!payload?.id) {
          return new Response(JSON.stringify({ error: '无效令牌' }), { 
            status: 401,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        const { amount, reason } = await request.json();
        if (!amount || amount <= 0) {
          return new Response(JSON.stringify({ error: '扣费金额无效' }), { 
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        // 2. 检查用户余额
        const user = await db.prepare(
          `SELECT id, balance FROM users WHERE id = ?`
        ).bind(payload.id).first();
        
        if (!user) {
          return new Response(JSON.stringify({ error: '用户不存在' }), { 
            status: 404,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }
        
        if (user.balance < amount) {
          return new Response(JSON.stringify({ 
            error: '余额不足',
            currentBalance: user.balance,
            requiredAmount: amount
          }), { 
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        // 3. 生成交易ID
        const transactionId = crypto.randomUUID();
        const timestamp = Math.floor(Date.now() / 1000);

        // 4. 执行扣费操作
        const batchResult = await db.batch([
          db.prepare(
            `UPDATE users SET balance = balance - ? WHERE id = ?`
          ).bind(amount, payload.id),
          
          db.prepare(
            `INSERT INTO transactions 
            (id, user_id, amount, type, status, description, created_at)
            VALUES (?, ?, ?, 'deduct', 'completed', ?, ?)`
          ).bind(
            transactionId,
            payload.id,
            amount,
            reason || 'AI解卦分析',
            timestamp
          )
        ]);

        // 5. 检查批量操作结果
        if (!batchResult.every(r => r.success)) {
          console.error('扣费批量操作失败:', batchResult);
          throw new Error('数据库操作失败');
        }

        // 6. 获取更新后的余额
        const updatedUser = await db.prepare(
          `SELECT balance FROM users WHERE id = ?`
        ).bind(payload.id).first();

        return new Response(JSON.stringify({
          success: true,
          transactionId,
          newBalance: updatedUser.balance,
          message: '扣费成功'
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });

      } catch (error) {
        console.error('扣费错误:', error);
        
        return new Response(JSON.stringify({
          success: false,
          error: '扣费处理失败',
          message: '系统异常，请稍后重试'
        }), { 
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
     }

    // 获取用户资料接口
    if (url.pathname === '/api/user/profile' && method === 'GET') {
      try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
          return new Response(JSON.stringify({ error: '未授权' }), { 
            status: 401,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }
        
        const token = authHeader.split(' ')[1];
        const payload = await verifyJWT(token, env.JWT_SECRET);
        if (!payload?.id) {
          return new Response(JSON.stringify({ error: '无效令牌' }), { 
            status: 401,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        const user = await db.prepare(
          `SELECT id, name, email, balance, created_at, avatar, bazi_info, real_name, gender, birth_date, birth_time, birth_location, lunar_date, bazi_chart FROM users WHERE id = ?`
        ).bind(payload.id).first();
        
        if (!user) {
          return new Response(JSON.stringify({ error: '用户不存在' }), { 
            status: 404,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        return new Response(JSON.stringify(user), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      } catch (error) {
        console.error('获取用户资料错误:', error);
        return new Response(JSON.stringify({ error: '获取资料失败' }), { 
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    }

    // 更新用户资料接口
    if (url.pathname === '/api/user/profile' && method === 'PUT') {
      try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
          return new Response(JSON.stringify({ error: '未授权' }), { 
            status: 401,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }
        
        const token = authHeader.split(' ')[1];
        const payload = await verifyJWT(token, env.JWT_SECRET);
        if (!payload?.id) {
          return new Response(JSON.stringify({ error: '无效令牌' }), { 
            status: 401,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        const profileData = await request.json();
        const { name, avatar, bazi_info, real_name, gender, birth_date, birth_time, birth_location, lunar_date, bazi_chart } = profileData;

        // 将undefined值转换为null，避免D1数据库错误
        const safeName = name !== undefined ? name : null;
        const safeAvatar = avatar !== undefined ? avatar : null;
        const safeBaziInfo = bazi_info !== undefined ? bazi_info : null;
        const safeRealName = real_name !== undefined ? real_name : null;
        const safeGender = gender !== undefined ? gender : null;
        const safeBirthDate = birth_date !== undefined ? birth_date : null;
        const safeBirthTime = birth_time !== undefined ? birth_time : null;
        const safeBirthLocation = birth_location !== undefined ? birth_location : null;
        const safeLunarDate = lunar_date !== undefined ? lunar_date : null;
        const safeBaziChart = bazi_chart !== undefined ? bazi_chart : null;

        // 如果要更新用户名，检查是否已存在
        if (safeName !== null) {
          const existingUser = await db.prepare(
            `SELECT id FROM users WHERE name = ? AND id != ?`
          ).bind(safeName, payload.id).first();
          
          if (existingUser) {
            return new Response(JSON.stringify({ error: '用户名已存在' }), { 
              status: 400,
              headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
          }
        }

        // 更新用户资料
        await db.prepare(
          `UPDATE users SET 
           name = COALESCE(?, name),
           avatar = COALESCE(?, avatar),
           bazi_info = COALESCE(?, bazi_info),
           real_name = COALESCE(?, real_name),
           gender = COALESCE(?, gender),
           birth_date = COALESCE(?, birth_date),
           birth_time = COALESCE(?, birth_time),
           birth_location = COALESCE(?, birth_location),
           lunar_date = COALESCE(?, lunar_date),
           bazi_chart = COALESCE(?, bazi_chart)
           WHERE id = ?`
        ).bind(safeName, safeAvatar, safeBaziInfo, safeRealName, safeGender, safeBirthDate, safeBirthTime, safeBirthLocation, safeLunarDate, safeBaziChart, payload.id).run();

        // 返回更新后的用户信息
        const updatedUser = await db.prepare(
          `SELECT id, name, email, balance, created_at, avatar, bazi_info, real_name, gender, birth_date, birth_time, birth_location, lunar_date, bazi_chart FROM users WHERE id = ?`
        ).bind(payload.id).first();

        return new Response(JSON.stringify(updatedUser), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      } catch (error) {
        console.error('更新用户资料错误:', error);
        return new Response(JSON.stringify({ error: '更新资料失败' }), { 
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    }

    // 删除重复的余额API实现，使用后面的真实数据库查询版本

    // 用户退款接口
    if (url.pathname === '/api/user/refund' && method === 'POST') {
      try {
        // 1. 验证请求
        const authHeader = request.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
          return new Response(JSON.stringify({ error: '未授权' }), { 
            status: 401,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }
        
        const token = authHeader.split(' ')[1];
        const payload = await verifyJWT(token, env.JWT_SECRET);
        if (!payload?.id) {
          return new Response(JSON.stringify({ error: '无效令牌' }), { 
            status: 401,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        const { amount, reason } = await request.json();
        if (!amount || amount <= 0) {
          return new Response(JSON.stringify({ error: '退款金额无效' }), { 
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        // 2. 检查用户是否存在
        const user = await db.prepare(
          `SELECT id, balance FROM users WHERE id = ?`
        ).bind(payload.id).first();
        
        if (!user) {
          return new Response(JSON.stringify({ error: '用户不存在' }), { 
            status: 404,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        // 3. 生成交易ID
        const transactionId = crypto.randomUUID();
        const timestamp = Math.floor(Date.now() / 1000);

        // 4. 执行退款操作
        const batchResult = await db.batch([
          db.prepare(
            `UPDATE users SET balance = balance + ? WHERE id = ?`
          ).bind(amount, payload.id),
          
          db.prepare(
            `INSERT INTO transactions 
            (id, user_id, amount, type, status, description, created_at)
            VALUES (?, ?, ?, 'refund', 'completed', ?, ?)`
          ).bind(
            transactionId,
            payload.id,
            amount,
            reason || 'AI解卦分析失败退款',
            timestamp
          )
        ]);

        // 5. 检查批量操作结果
        if (!batchResult.every(r => r.success)) {
          console.error('退款批量操作失败:', batchResult);
          throw new Error('数据库操作失败');
        }

        // 6. 获取更新后的余额
        const updatedUser = await db.prepare(
          `SELECT balance FROM users WHERE id = ?`
        ).bind(payload.id).first();

        return new Response(JSON.stringify({
          success: true,
          transactionId,
          newBalance: updatedUser.balance,
          message: '退款成功'
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });

      } catch (error) {
        console.error('退款错误:', error);
        
        return new Response(JSON.stringify({
          success: false,
          error: '退款处理失败',
          message: '系统异常，请稍后重试'
        }), { 
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
     }

    // 用户充值接口
    if (url.pathname === '/api/user/recharge' && method === 'POST') {
      try {
        // 1. 验证请求
        const authHeader = request.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
          return new Response(JSON.stringify({ error: '未授权' }), { 
            status: 401,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }
        
        const token = authHeader.split(' ')[1];
        const payload = await verifyJWT(token, env.JWT_SECRET);
        if (!payload?.id) {
          return new Response(JSON.stringify({ error: '无效令牌' }), { 
            status: 401,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        const { amount, paymentMethod } = await request.json();
        if (!amount || amount <= 0) {
          return new Response(JSON.stringify({ error: '充值金额无效' }), { 
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        // 2. 检查用户是否存在
        const user = await db.prepare(
          `SELECT id, balance FROM users WHERE id = ?`
        ).bind(payload.id).first();
        
        if (!user) {
          return new Response(JSON.stringify({ error: '用户不存在' }), { 
            status: 404,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        // 3. 生成交易ID和订单ID
        const transactionId = crypto.randomUUID();
        const orderId = `R${Date.now()}${Math.floor(Math.random() * 1000000)}`;
        const timestamp = Math.floor(Date.now() / 1000);

        // 4. 执行充值操作（简化版，实际应该先创建订单，支付成功后再更新余额）
        const batchResult = await db.batch([
          db.prepare(
            `UPDATE users SET balance = balance + ? WHERE id = ?`
          ).bind(amount, payload.id),
          
          db.prepare(
            `INSERT INTO transactions 
            (id, user_id, amount, type, status, description, created_at)
            VALUES (?, ?, ?, 'recharge', 'completed', ?, ?)`
          ).bind(
            transactionId,
            payload.id,
            amount,
            `账户充值 - ${paymentMethod || '未知支付方式'}`,
            timestamp
          ),
          
          db.prepare(
            `INSERT INTO recharge_orders 
            (order_id, user_id, amount, payment_method, status, created_at)
            VALUES (?, ?, ?, ?, 'completed', ?)`
          ).bind(
            orderId,
            payload.id,
            amount,
            paymentMethod || 'unknown',
            timestamp
          )
        ]);

        // 5. 检查批量操作结果
        if (!batchResult.every(r => r.success)) {
          console.error('充值批量操作失败:', batchResult);
          throw new Error('数据库操作失败');
        }

        // 6. 获取更新后的余额
        const updatedUser = await db.prepare(
          `SELECT balance FROM users WHERE id = ?`
        ).bind(payload.id).first();

        return new Response(JSON.stringify({
          success: true,
          transactionId,
          orderId,
          newBalance: updatedUser.balance,
          message: '充值成功'
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });

      } catch (error) {
        console.error('充值错误:', error);
        
        return new Response(JSON.stringify({
          success: false,
          error: '充值处理失败',
          message: '系统异常，请稍后重试'
        }), { 
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    }

    // 余额支付接口
    if (url.pathname === '/api/payments/balance' && method === 'POST') {
      try {
        // 1. 验证请求
        const authHeader = request.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
          return new Response(JSON.stringify({ error: '未授权' }), { 
            status: 401,
            headers: corsHeaders 
          });
        }
        
        const token = authHeader.split(' ')[1];
        const payload = await verifyJWT(token, env.JWT_SECRET);
        if (!payload?.id) {
          return new Response(JSON.stringify({ error: '无效令牌' }), { 
            status: 401,
            headers: corsHeaders 
          });
        }

        const { wishId, amount } = await request.json();
        if (!wishId || !amount) {
          return new Response(JSON.stringify({ error: '参数缺失' }), { 
            status: 400,
            headers: corsHeaders 
          });
        }

        // 2. 检查愿望状态（允许多次还愿）
        const wish = await db.prepare(
          `SELECT id, user_id FROM wishes WHERE id = ?`
        ).bind(wishId).first();
        
        if (!wish) {
          return new Response(JSON.stringify({ error: '愿望不存在' }), { 
            status: 404,
            headers: corsHeaders 
          });
        }
        
        // 移除对愿望是否已还愿的检查，允许多次还愿

        // 3. 检查用户余额
        const user = await db.prepare(
          `SELECT id, balance FROM users WHERE id = ?`
        ).bind(payload.id).first();
        
        if (user.balance < amount) {
          return new Response(JSON.stringify({ 
            error: '余额不足',
            currentBalance: user.balance,
            requiredAmount: amount
          }), { 
            status: 400,
            headers: corsHeaders 
          });
        }

        // 4. 生成交易ID
        const transactionId = crypto.randomUUID();
        const timestamp = Math.floor(Date.now() / 1000);

        // 5. 使用批量操作执行支付（替代事务）- 允许多次还愿
        const batchResult = await db.batch([
          db.prepare(
            `UPDATE users SET balance = balance - ? WHERE id = ?`
          ).bind(amount, payload.id),
          
          db.prepare(
            `INSERT INTO transactions 
            (id, user_id, amount, type, status, description, created_at)
            VALUES (?, ?, ?, 'fulfillment', 'completed', ?, ?)`
          ).bind(
            transactionId,
            payload.id,
            amount,
            `愿望还愿支付 - 愿望ID: ${wishId}`,
            timestamp
          ),
          
          db.prepare(
            `INSERT INTO fulfillments 
            (wish_id, user_id, amount, payment_method, transaction_id, created_at)
            VALUES (?, ?, ?, 'balance', ?, ?)`
          ).bind(
            wishId,
            payload.id,
            amount,
            transactionId,
            timestamp
          )
          // 移除更新愿望状态的操作，允许多次还愿
        ]);

        // 6. 检查批量操作结果
        if (!batchResult.every(r => r.success)) {
          console.error('批量操作失败:', batchResult);
          throw new Error('数据库操作失败');
        }

        // 7. 获取更新后的余额
        const updatedUser = await db.prepare(
          `SELECT balance FROM users WHERE id = ?`
        ).bind(payload.id).first();

        return new Response(JSON.stringify({
          success: true,
          transactionId,
          newBalance: updatedUser.balance,
          message: '支付成功'
        }), {
          headers: corsHeaders
        });

      } catch (error) {
        console.error('余额支付错误:', error);
        
        // 如果是数据库操作失败，返回500错误
        if (error.message === '数据库操作失败') {
          return new Response(JSON.stringify({
            success: false,
            error: '支付处理失败',
            message: '系统繁忙，请稍后重试'
          }), { 
            status: 500,
            headers: corsHeaders 
          });
        }
        
        // 其他未预期的错误也返回500
        return new Response(JSON.stringify({
          success: false,
          error: '支付处理失败',
          message: '系统异常，请稍后重试'
        }), { 
          status: 500,
          headers: corsHeaders 
        });
      }
    }

    // 检查愿望状态接口
    if (url.pathname === '/api/wishes/status' && method === 'GET') {
      try {
        // 1. 验证JWT令牌
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return new Response(JSON.stringify({ error: '未提供认证令牌' }), { 
            status: 401,
            headers: corsHeaders 
          });
        }

        const token = authHeader.substring(7);
        const payload = await verifyJWT(token, env.JWT_SECRET);
        if (!payload) {
          return new Response(JSON.stringify({ error: '无效的认证令牌' }), { 
            status: 401,
            headers: corsHeaders 
          });
        }

        // 2. 获取愿望ID
        const wishId = url.searchParams.get('wishId');
        if (!wishId) {
          return new Response(JSON.stringify({ error: '缺少愿望ID参数' }), { 
            status: 400,
            headers: corsHeaders 
          });
        }

        // 3. 查询愿望状态
        const wish = await db.prepare(
          `SELECT id, user_id, is_fulfilled FROM wishes WHERE id = ?`
        ).bind(wishId).first();
        
        if (!wish) {
          return new Response(JSON.stringify({ 
            exists: false,
            fulfilled: false
          }), { 
            headers: corsHeaders 
          });
        }
        
        return new Response(JSON.stringify({
          exists: true,
          fulfilled: !!wish.is_fulfilled,
          wishId: wish.id
        }), {
          headers: corsHeaders
        });

      } catch (error) {
        console.error('检查愿望状态错误:', error);
        return new Response(JSON.stringify({
          error: '检查愿望状态失败',
          message: error.message
        }), { 
          status: 500,
          headers: corsHeaders 
        });
      }
    }

  // 充值完成接口
  if (url.pathname === '/api/recharge/complete' && method === 'GET') {
    const orderId = new URL(request.url).searchParams.get('orderId');
    console.log('充值完成API调用，orderId:', orderId);
    
    // 1. 验证订单状态
    console.log('查询订单，SQL: SELECT * FROM recharge_orders WHERE order_id = ?，参数:', orderId);
    const order = await safeDbFirst(db, `SELECT * FROM recharge_orders WHERE order_id = ?`, [orderId]);
    console.log('查询结果:', order);
    if (!order) {
      console.log('订单不存在，返回错误');
      return new Response(JSON.stringify({ error: '订单无效' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // 检查订单状态
    if (order.status === 'completed') {
      // 订单已完成，直接返回成功
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    } else if (order.status !== 'pending' && order.status !== 'paid') {
      // 订单状态不是pending或paid，返回错误
      return new Response(JSON.stringify({ error: '订单状态无效' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // 2. 更新订单状态
    await safeDbRun(db, `UPDATE recharge_orders SET status = 'completed' WHERE order_id = ?`, [orderId]);
    
    // 3. 如果订单状态是pending，则更新用户余额
    if (order.status === 'pending') {
      await safeDbRun(db, `UPDATE users SET balance = balance + ? WHERE id = ?`, [order.amount, order.user_id]);
      
      // 4. 记录交易
      await safeDbRun(db, `
        INSERT INTO transactions (user_id, amount, type, description, order_id)
        VALUES (?, ?, 'recharge', '账户充值', ?)
      `, [order.user_id, order.amount, orderId]);
      
      // 5. 记录支付通知
        await safeDbRun(db, `
          INSERT INTO payment_notifications (order_id, amount, payment_method, status)
          VALUES (?, ?, ?, 'completed')
        `, [orderId, order.amount, order.payment_method]);
    }
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

    // 许愿池接口
    if (url.pathname === '/api/wishes') {
      try {
        if (method === 'POST') {
          const data = await request.json();
          const {
            user_name, bazi, content, type, visibility,
            birth_date, birth_time, user_id, solar_date
          } = data;

          await safeDbRun(db, `
            INSERT INTO wishes (user_name, bazi, content, type, visibility, birth_date, birth_time, user_id, solar_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [user_name, bazi, content, type, visibility, birth_date, birth_time, user_id, solar_date]);

          return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        if (method === 'GET') {
          // 获取查询参数
          const visibility = url.searchParams.get('visibility');
          const sort = url.searchParams.get('sort') || 'newest';
          
          let query = `SELECT * FROM wishes`;
          let queryParams = [];
          
          if (visibility) {
            query += ` WHERE visibility = ?`;
            queryParams.push(visibility);
          }
          
          let orderBy = 'ORDER BY id DESC';
          
          if (sort === 'oldest') {
            orderBy = 'ORDER BY id ASC';
          } else if (sort === 'most') {
            orderBy = 'ORDER BY blessings DESC';
          } else if (sort === 'least') {
            orderBy = 'ORDER BY blessings ASC';
          }
          
          query += ` ${orderBy}`;
          
          const { results } = visibility ? 
            await db.prepare(query).bind(visibility).all() :
            await db.prepare(query).all();
          return new Response(JSON.stringify({ data: results }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        // 管理员删除接口 - 不需要认证
        if (method === 'DELETE') {
          const pathParts = url.pathname.split('/');
          const id = pathParts[pathParts.length - 1];
          
          if (!id || id === 'wishes') {
            return new Response(JSON.stringify({ error: '缺少愿望ID' }), {
              status: 400,
              headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
          }

          try {
            // 检查愿望是否存在
            const wish = await safeDbFirst(db, `SELECT * FROM wishes WHERE id = ?`, [id]);
            
            if (!wish) {
              return new Response(JSON.stringify({ error: '愿望不存在' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
              });
            }

            // 1. 删除引用 wish 的加持记录
            await safeDbRun(db, `DELETE FROM bless_records WHERE wish_id = ?`, [id]);

            // 2. 删除 wish 本身
            await safeDbRun(db, `DELETE FROM wishes WHERE id = ?`, [id]);

            return new Response(JSON.stringify({ success: true }), {
              headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
          } catch (err) {
            return new Response(JSON.stringify({ error: err.message }), {
              status: 500,
              headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
          }
        }

        return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
      } catch (err) {
        return new Response(JSON.stringify({ error: 'Internal Error: ' + err.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    }

    // 诅咒池接口
    if (url.pathname === '/api/curse') {
      try {
        if (method === 'POST') {
          const data = await request.json();
          const {
            user_name, target_description, content, type, visibility,
            user_id, solar_date
          } = data;

          await safeDbRun(db, `
            INSERT INTO curse (user_name, target_description, content, type, visibility, user_id, solar_date)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `, [user_name, target_description, content, type, visibility, user_id, solar_date]);

          return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        if (method === 'GET') {
          // 获取查询参数
          const visibility = url.searchParams.get('visibility') || 'public';
          const sort = url.searchParams.get('sort') || 'newest';
          
          let query = `SELECT * FROM curse WHERE visibility = ?`;
          let orderBy = 'ORDER BY id DESC';
          
          if (sort === 'oldest') {
            orderBy = 'ORDER BY id ASC';
          } else if (sort === 'most') {
            orderBy = 'ORDER BY blessings DESC';
          } else if (sort === 'least') {
            orderBy = 'ORDER BY blessings ASC';
          }
          
          query += ` ${orderBy}`;
          
          const { results } = await db.prepare(query).bind(visibility).all();
          return new Response(JSON.stringify({ data: results }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        // 管理员删除接口 - 不需要认证
        if (method === 'DELETE') {
          const pathParts = url.pathname.split('/');
          const id = pathParts[pathParts.length - 1];
          
          if (!id || id === 'curse') {
            return new Response(JSON.stringify({ error: '缺少诅咒ID' }), {
              status: 400,
              headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
          }

          try {
            // 检查诅咒是否存在
            const curse = await safeDbFirst(db, `SELECT * FROM curse WHERE id = ?`, [id]);
            
            if (!curse) {
              return new Response(JSON.stringify({ error: '诅咒不存在' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
              });
            }

            // 1. 删除引用 curse 的记录
            await safeDbRun(db, `DELETE FROM curse_records WHERE curse_id = ?`, [id]);

            // 2. 删除 curse 本身
            await safeDbRun(db, `DELETE FROM curse WHERE id = ?`, [id]);

            return new Response(JSON.stringify({ success: true }), {
              headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
          } catch (err) {
            return new Response(JSON.stringify({ error: err.message }), {
              status: 500,
              headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
          }
        }

        return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
      } catch (err) {
        return new Response(JSON.stringify({ error: 'Internal Error: ' + err.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    }

    // 删除愿望接口（支持管理员和用户删除）
    if (url.pathname.startsWith('/api/wishes/') && method === 'DELETE') {
      const id = url.pathname.split('/').pop();

      try {
        // 检查是否有认证信息
        const authHeader = request.headers.get('Authorization');
        
        if (authHeader && authHeader.startsWith('Bearer ')) {
          // 有认证信息，按用户删除逻辑处理
          const token = authHeader.substring(7);
          const decoded = await verifyJWT(token, env.JWT_SECRET);
          if (!decoded) {
            return new Response(JSON.stringify({ error: '无效的认证令牌' }), {
              status: 401,
              headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
          }

          // 检查愿望是否存在且属于当前用户
          const wish = await db.prepare(`SELECT * FROM wishes WHERE id = ? AND user_id = ?`)
            .bind(id, decoded.id).first();
          
          if (!wish) {
            return new Response(JSON.stringify({ error: '愿望不存在或无权限删除' }), {
              status: 404,
              headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
          }
        } else {
          // 无认证信息，按管理员删除逻辑处理
          const wish = await safeDbFirst(db, `SELECT * FROM wishes WHERE id = ?`, [id]);
          
          if (!wish) {
            return new Response(JSON.stringify({ error: '愿望不存在' }), {
              status: 404,
              headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
          }
        }

        // 1. 删除引用 wish 的加持记录
        await safeDbRun(db, `DELETE FROM bless_records WHERE wish_id = ?`, [id]);

        // 2. 删除引用 wish 的还愿记录
        await safeDbRun(db, `DELETE FROM fulfillments WHERE wish_id = ?`, [id]);

        // 3. 删除 wish 本身
        await safeDbRun(db, `DELETE FROM wishes WHERE id = ?`, [id]);

        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    }

    // 获取用户愿望接口
if (url.pathname === '/api/user/wishes' && method === 'GET') {
    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return new Response(JSON.stringify({ error: '未授权' }), {
                status: 401,
                headers: corsHeaders
            });
        }
        
        const token = authHeader.split(' ')[1];
        const payload = await verifyJWT(token, env.JWT_SECRET);
        if (!payload || !payload.id) {
            return new Response(JSON.stringify({ error: '无效令牌' }), {
                status: 401,
                headers: corsHeaders
            });
        }
        
        const wishes = await db.prepare(
            `SELECT * FROM wishes WHERE user_id = ? ORDER BY created_at DESC`
        ).bind(payload.id).all();
        
        return new Response(JSON.stringify(wishes.results || []), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
        
    } catch (error) {
        return new Response(JSON.stringify({ 
            error: '服务器错误',
            message: error.message 
        }), {
            status: 500,
            headers: corsHeaders
        });
    }
}

      // 数据统计接口
            if (url.pathname === '/api/stats' && method === 'GET') {
            try {
              const today = new Date().toISOString().slice(0, 10);
              
              // 使用 Promise.all 并行执行查询
              const [
                newWishesResult,
                blessingsResult,
                fulfilledResult,
                distributionResult
              ] = await Promise.all([
                // 今日新增愿望（不变）
                db.prepare(
                  `SELECT COUNT(*) as count FROM wishes 
                  WHERE DATE(created_at) = ?`
                ).bind(today).all(),
                
                // 今日加持次数（不变）
                db.prepare(
                  `SELECT COUNT(*) as total 
                  FROM bless_records
                  WHERE DATE(last_blessed_at/1000, 'unixepoch') = ?`
                ).bind(today).all(),
                
                // 修改点：统计所有已还愿记录（移除了日期条件）
                db.prepare(
                  `SELECT COUNT(*) as count FROM wishes 
                  WHERE is_fulfilled = 1 
                  AND DATE(fulfilled_at, 'unixepoch') = ?`
                ).bind(today).all(),
                
                // 愿望类型分布（不变）
                db.prepare(
                  `SELECT type, COUNT(*) as count FROM wishes GROUP BY type`
                ).all()
              ]);

              // 格式化返回数据
              const responseData = {
                today: {
                  newWishes: newWishesResult.results[0]?.count || 0,
                  blessings: blessingsResult.results[0]?.total || 0,
                  fulfilled: fulfilledResult.results[0]?.count || 0  // 现在会返回所有已还愿数量
                },
                distribution: {}
              };

              // 处理愿望类型分布数据
              distributionResult.results.forEach(({ type, count }) => {
                responseData.distribution[type] = count;
              });

              return new Response(JSON.stringify(responseData), {
                headers: { 
                  'Content-Type': 'application/json', 
                  ...corsHeaders 
                }
              });

            } catch (error) {
              console.error('统计接口错误:', error);
              return new Response(JSON.stringify({
                error: '获取统计失败',
                details: error.message
              }), {
                status: 500,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
              });
            }
          }
    
    // --- 修复后的加持接口（添加每小时限制和25次上限）---
    if (url.pathname.startsWith('/api/bless/') && method === 'POST') {
      try {
        const parts = url.pathname.split('/');
        const wishId = parts[parts.length - 1];

        const authHeader = request.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
          return new Response(JSON.stringify({ error: '未授权' }), { status: 401, headers: corsHeaders });
        }

        const token = authHeader.split(' ')[1];
        const payload = await verifyJWT(token, env.JWT_SECRET);
        if (!payload || !payload.id) {
          return new Response(JSON.stringify({ error: '无效的用户信息' }), { status: 401, headers: corsHeaders });
        }

        const userId = payload.id;

        // 检查愿望是否存在
        const wish = await safeDbFirst(db, `SELECT * FROM wishes WHERE id = ?`, [wishId]);
        if (!wish) {
          return new Response(JSON.stringify({ error: '愿望未找到' }), { status: 404, headers: corsHeaders });
        }

        // 检查是否已达到25次加持上限
        const totalBlessings = await db.prepare(`SELECT SUM(count) as total FROM bless_records WHERE wish_id = ?`)
          .bind(wishId).first();
        const currentBlessings = totalBlessings?.total || 0;

        if (currentBlessings >= 25) {
          return new Response(JSON.stringify({
            success: false,
            error: '该愿望已达到最高加持次数(25次)',
            code: 400
          }), {
            status: 400,
            headers: corsHeaders
          });
        }

        // 一小时加持限制
        const oneHourAgo = Date.now() - 3600000;
        const recentBless = await db.prepare(
          `SELECT last_blessed_at FROM bless_records WHERE wish_id = ? AND user_id = ? AND last_blessed_at > ? LIMIT 1`
        ).bind(wishId, userId, oneHourAgo).first();

        if (recentBless) {
          const nextBlessTime = new Date(recentBless.last_blessed_at + 3600000);
          return new Response(JSON.stringify({
            success: false,
            error: '每小时只能对同一愿望加持一次',
            nextBlessTime: nextBlessTime.toISOString(),
            code: 429
          }), {
            status: 429,
            headers: corsHeaders
          });
        }

        // 更新或插入加持记录
        const now = Date.now();
        const existingBless = await db.prepare(
          `SELECT count FROM bless_records WHERE wish_id = ? AND user_id = ?`
        ).bind(wishId, userId).first();

        if (existingBless) {
          await safeDbRun(db, `UPDATE bless_records SET count = count + 1, last_blessed_at = ? WHERE wish_id = ? AND user_id = ?`, [now, wishId, userId]);
        } else {
          await safeDbRun(db, `INSERT INTO bless_records (wish_id, user_id, count, first_blessed_at, last_blessed_at) VALUES (?, ?, 1, ?, ?)`, [wishId, userId, now, now]);
        }

        // 重新计算总加持次数（确保不超过25）
        const newTotalBlessings = Math.min((currentBlessings + 1), 25);
        const level = newTotalBlessings >= 20 ? 5 : 
                    newTotalBlessings >= 15 ? 4 : 
                    newTotalBlessings >= 10 ? 3 : 
                    newTotalBlessings >= 5 ? 2 : 1;

        await safeDbRun(db, `UPDATE wishes SET blessings = ?, level = ? WHERE id = ?`, [newTotalBlessings, level, wishId]);

        return new Response(JSON.stringify({
          success: true,
          blessings: newTotalBlessings,
          level,
          isMax: newTotalBlessings >= 25  // 新增字段，表示是否达到上限
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });

      } catch (err) {
        return new Response(JSON.stringify({
          success: false,
          error: '服务器错误: ' + err.message,
          stack: err.stack
        }), {
          status: 500,
          headers: corsHeaders
        });
      }
    }

        // 立即更新还愿状态接口
        if (url.pathname.startsWith('/api/wishes/') && url.pathname.endsWith('/fulfill') && method === 'POST') {
          try {
            const wishId = url.pathname.split('/')[3];
            
            // 验证JWT
            const authHeader = request.headers.get('Authorization');
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
              return new Response(JSON.stringify({ error: '未授权' }), {
                status: 401,
                headers: corsHeaders
              });
            }
            
            const token = authHeader.split(' ')[1];
            let payload;
            try {
              payload = await verifyJWT(token, env.JWT_SECRET);
            } catch (e) {
              return new Response(JSON.stringify({ error: '无效令牌' }), {
                status: 401,
                headers: corsHeaders
              });
            }

            // 更新is_fulfilled字段和fulfilled_at时间戳
            await safeDbRun(db, 
              `UPDATE wishes 
              SET is_fulfilled = 1, 
                  fulfilled_at = strftime('%s','now') 
              WHERE id = ?`, [wishId]);

            return new Response(JSON.stringify({ 
              success: true,
              message: '还愿状态已更新'
            }), {
              headers: { 
                'Content-Type': 'application/json', 
                ...corsHeaders 
              }
            });
            
          } catch (error) {
            return new Response(JSON.stringify({ 
              success: false,
              error: '服务器错误: ' + error.message,
              code: 500
            }), { 
              status: 500,
              headers: corsHeaders
            });
          }
        }

       // 还愿接口 - 增强版
      if (url.pathname === '/api/wishes/fulfill' && method === 'POST') {
        try {
          console.log('[API] 收到还愿请求');
          const { wishId, amount, paymentMethod } = await request.json();
          
          // 1. 验证参数
          if (!wishId || !amount || !paymentMethod) {
            return new Response(JSON.stringify({
              success: false,
              error: 'MISSING_PARAMS'
            }), { status: 400, headers: corsHeaders });
          }
          
          // 2. 移除对是否已还愿的检查，允许多次还愿
          // 允许用户对同一个愿望多次还愿
          
          // 3. 插入还愿记录
          const timestamp = Math.floor(Date.now() / 1000);
          const result = await safeDbRun(db,
            `INSERT INTO fulfillments 
            (wish_id, amount, payment_method, created_at)
            VALUES (?, ?, ?, ?)`, [wishId, amount, paymentMethod, timestamp]);
          
          if (!result.success) {
            throw new Error('数据库操作失败');
          }
          
          return new Response(JSON.stringify({
            success: true,
            fulfillmentId: result.meta.last_row_id
          }), { headers: corsHeaders });
          
        } catch (error) {
          return new Response(JSON.stringify({
            success: false,
            error: 'SERVER_ERROR',
            message: error.message
          }), { status: 500, headers: corsHeaders });
        }
      }

      // 支付验证接口 - 增强版
      if (url.pathname === '/api/payments/verify' && method === 'POST') {
        try {
          const { orderId, wishId, amount } = await request.json();
          
          // 1. 调用zpay官方订单查询接口
          const verifyResponse = await fetch(`https://zpayz.cn/api/order/query?orderId=${orderId}`, {
            headers: { 'Authorization': 'PID '+env.ZPAY_KEY }
          });
          
          const { status, actualAmount } = await verifyResponse.json();
          
          // 2. 验证支付状态和金额
          if (status !== 'paid') {
            return new Response(JSON.stringify({
              success: false,
              error: 'PAYMENT_NOT_COMPLETED'
            }), { status: 400, headers: corsHeaders });
          }
          
          if (parseFloat(actualAmount) !== parseFloat(amount)) {
            return new Response(JSON.stringify({
              success: false,
              error: 'AMOUNT_MISMATCH'
            }), { status: 400, headers: corsHeaders });
          }
          
          // 3. 记录到fulfillments表
          const fulfillmentResult = await safeDbRun(db,
            `INSERT INTO fulfillments 
            (wish_id, amount, payment_method, created_at)
            VALUES (?, ?, ?, ?)`, [wishId, amount, 'zpay', Math.floor(Date.now() / 1000)]);
          
          if (!fulfillmentResult.success) {
            throw new Error('记录还愿失败');
          }

      // 充值接口
      if (url.pathname === '/api/recharge' && method === 'POST') {
        try {
          const authHeader = request.headers.get('Authorization');
          if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return new Response(JSON.stringify({ error: '未授权' }), {
              status: 401,
              headers: corsHeaders
            });
          }
          
          const token = authHeader.split(' ')[1];
          const payload = await verifyJWT(token, env.JWT_SECRET);
          if (!payload || !payload.id) {
            return new Response(JSON.stringify({ error: '无效令牌' }), {
              status: 401,
              headers: corsHeaders
            });
          }
          
          const { amount, paymentMethod, orderId } = await request.json();
          
          if (!orderId) {
            return new Response(JSON.stringify({ 
              error: '缺少订单号',
              code: 'MISSING_ORDER_ID'
            }), { status: 400, headers: corsHeaders });
          }
          
          // 1. 验证支付订单
          const verifyResponse = await fetch(`https://zpayz.cn/api/order/query?orderId=${orderId}`, {
            headers: { 'Authorization': 'PID '+env.ZPAY_KEY }
          });
          
          const { status, actualAmount } = await verifyResponse.json();
          
          if (status !== 'paid') {
            return new Response(JSON.stringify({
              success: false,
              error: 'PAYMENT_NOT_COMPLETED'
            }), { status: 400, headers: corsHeaders });
          }
          
          if (parseFloat(actualAmount) !== parseFloat(amount)) {
            return new Response(JSON.stringify({
              success: false,
              error: 'AMOUNT_MISMATCH'
            }), { status: 400, headers: corsHeaders });
          }
          
          // 2. 记录充值记录
          const timestamp = Math.floor(Date.now() / 1000);
          await safeDbRun(db,
            `INSERT INTO recharges 
            (user_id, amount, payment_method, order_id, created_at)
            VALUES (?, ?, ?, ?, ?)`, [payload.id, amount, paymentMethod, orderId, timestamp]);
          
          // 3. 更新用户余额
          await safeDbRun(db,
            `UPDATE users SET balance = COALESCE(balance, 0) + ? WHERE id = ?`, [amount, payload.id]);
          
          // 4. 获取更新后的用户信息
          const user = await db.prepare(
            `SELECT id, name, balance FROM users WHERE id = ?`
          ).bind(payload.id).first();
          
          return new Response(JSON.stringify({
            success: true,
            user: {
              id: user.id,
              name: user.name,
              balance: user.balance
            }
          }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
          
        } catch (error) {
          return new Response(JSON.stringify({
            success: false,
            error: 'SERVER_ERROR',
            message: error.message
          }), { status: 500, headers: corsHeaders });
        }
      }
          
          // 4. 从wishes表中删除愿望
          const deleteResult = await safeDbRun(db,
            `DELETE FROM wishes WHERE id = ?`, [wishId]);
          
          return new Response(JSON.stringify({
            success: true,
            fulfillmentId: fulfillmentResult.meta.last_row_id
          }), { headers: corsHeaders });
          
        } catch (error) {
          return new Response(JSON.stringify({
            success: false,
            error: 'VERIFICATION_FAILED',
            message: error.message
          }), { status: 500, headers: corsHeaders });
        }
      }

      // 状态检查接口 - 增强版（允许多次还愿）
      if (url.pathname === '/api/wishes/check' && method === 'GET') {
        try {
          const wishId = url.searchParams.get('wishId');
          
          // 首先检查愿望是否存在
          const wishExists = await db.prepare(
            `SELECT id FROM wishes WHERE id = ?`
          ).bind(wishId).first();
          
          // 如果愿望不存在，直接返回
          if (!wishExists) {
            return new Response(JSON.stringify({
              fulfilled: false,
              exists: false
            }), { headers: corsHeaders });
          }
          
          // 不再检查是否已还愿，始终返回未还愿状态，允许多次还愿
          return new Response(JSON.stringify({
            fulfilled: false, // 始终返回未还愿，允许重复还愿
            exists: true
          }), { headers: corsHeaders });
          
        } catch (error) {
          return new Response(JSON.stringify({
            fulfilled: false,
            exists: false,
            error: error.message
          }), { status: 500, headers: corsHeaders });
        }
      }

      // 后端API (/api/payments/verify)
      if (url.pathname === '/api/payments/verify' && method === 'GET') {
        const orderId = url.searchParams.get('orderId');
        
        // 1. 调用zpay官方订单查询接口
        const zpayResponse = await fetch(`https://zpayz.cn/api/order/query?orderId=${orderId}`, {
          headers: { 'Authorization': 'PID '+env.ZPAY_KEY }
        });
        
        // 2. 解析支付状态
        const { status, amount } = await zpayResponse.json();
        
        // 3. 返回标准化状态
        return new Response(JSON.stringify({
          status: status === 'paid' ? 'success' : 'pending'
        }), { headers: corsHeaders });
      }

      // 支付状态检查接口
      if (url.pathname === '/api/payments/status' && method === 'GET') {
        try {
          const wishId = url.searchParams.get('wishId');
          const fulfillment = await db.prepare(
            `SELECT id FROM fulfillments WHERE wish_id = ?`
          ).bind(wishId).first();

          if (fulfillment) {
            return new Response(JSON.stringify({
              status: 'success',
              fulfillmentId: fulfillment.id
            }), { headers: corsHeaders });
          }

          return new Response(JSON.stringify({
            status: 'pending',
            message: '支付处理中'
          }), { headers: corsHeaders });
        } catch (error) {
          return new Response(JSON.stringify({
            status: 'error',
            message: '查询失败'
          }), { status: 500, headers: corsHeaders });
        }
      }

    // 充值接口 - 应该放在文件顶层路由中，与其他路由并列
    if (url.pathname === '/api/recharge' && method === 'POST') {
      try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return new Response(JSON.stringify({ error: '未授权' }), {
            status: 401,
            headers: corsHeaders
          });
        }
        
        const token = authHeader.split(' ')[1];
        const payload = await verifyJWT(token, env.JWT_SECRET);
        if (!payload || !payload.id) {
          return new Response(JSON.stringify({ error: '无效令牌' }), {
            status: 401,
            headers: corsHeaders
          });
        }
        
        const { amount, paymentMethod } = await request.json();
        
        // 生成订单号
        const orderId = `R${Date.now()}${Math.floor(Math.random()*1000)}`;
        
        // 1. 记录充值记录
        const timestamp = Math.floor(Date.now() / 1000);
        await safeDbRun(db,
          `INSERT INTO recharge_orders 
          (order_id, user_id, amount, payment_method, status, created_at)
          VALUES (?, ?, ?, ?, 'pending', ?)`, [orderId, payload.id, amount, paymentMethod, timestamp]);
        
        // 2. 更新用户余额
        await safeDbRun(db,
          `UPDATE users SET balance = COALESCE(balance, 0) + ? WHERE id = ?`, [amount, payload.id]);
        
        // 3. 获取更新后的用户信息
        const user = await safeDbFirst(db,
          `SELECT id, name, balance FROM users WHERE id = ?`, [payload.id]);
        
        return new Response(JSON.stringify({
          success: true,
          orderId, // 返回订单号给前端
          user: {
            id: user.id,
            name: user.name,
            balance: user.balance
          }
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
        
      } catch (error) {
        return new Response(JSON.stringify({
          success: false,
          error: 'SERVER_ERROR',
          message: error.message
        }), { status: 500, headers: corsHeaders });
      }
    }
    
    // 创建充值订单（不修改余额）
      if (url.pathname === '/api/recharge/orders' && method === 'POST') {
        try {
          const { amount, paymentMethod } = await request.json();
          const authHeader = request.headers.get('Authorization');
          if (!authHeader) {
            return new Response(JSON.stringify({
              error: 'UNAUTHORIZED',
              message: '缺少Authorization header'
            }), { status: 401, headers: corsHeaders });
          }
          const token = authHeader.split(' ')[1];
          const payload = await verifyJWT(token, env.JWT_SECRET);
          
          // 生成唯一订单号
          const orderId = `R${Date.now()}${Math.floor(Math.random()*1000)}`;
          
          // 记录到临时订单表（状态为pending）
          await safeDbRun(db,
            `INSERT INTO recharge_orders 
            (order_id, user_id, amount, payment_method, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?)`, [
            orderId,
            payload.id,
            amount,
            paymentMethod,
            'pending',
            Math.floor(Date.now() / 1000)
          ]);
          
          return new Response(JSON.stringify({
            orderId,
            amount,
            paymentMethod
          }), { headers: corsHeaders });
          
        } catch (error) {
          return new Response(JSON.stringify({
            error: 'CREATE_ORDER_FAILED',
            message: error.message
          }), { status: 500, headers: corsHeaders });
        }
      }

      if (url.pathname === '/api/recharge/notify' && method === 'POST') {
        try {
          // 获取通知参数
          const params = Object.fromEntries(await request.formData());
          
          // 验证签名
          const sign = params.sign;
          const sortedParams = Object.keys(params)
            .filter(k => k !== 'sign' && params[k] !== '')
            .sort()
            .map(k => `${k}=${params[k]}`)
            .join('&');
          const calculatedSign = CryptoJS.MD5(sortedParams + env.ZPAY_KEY).toString();
          
          if (sign !== calculatedSign) {
            return new Response('FAIL', { status: 400 });
          }
          
          // 查询订单
          const order = await db.prepare(
            `SELECT * FROM recharge_orders WHERE order_id = ?`
          ).bind(params.out_trade_no).first();

          if (!order) {
            return new Response('ORDER_NOT_FOUND', { status: 404 });
          }

          // 使用事务确保所有数据库操作原子性
          const batchResult = await db.batch([
            db.prepare(
              `UPDATE recharge_orders SET status = 'paid' WHERE order_id = ?`
            ).bind(params.out_trade_no),
            
            db.prepare(
              `UPDATE users SET balance = balance + ? WHERE id = ?`
            ).bind(params.money, order.user_id),
            
            db.prepare(
              `INSERT INTO recharges 
              (order_id, user_id, amount, payment_method, created_at)
              VALUES (?, ?, ?, 'zpay', ?)`
            ).bind(
              params.out_trade_no,
              order.user_id,
              params.money,
              Math.floor(Date.now() / 1000)
            ),
            
            db.prepare(
              `INSERT INTO transactions 
              (user_id, amount, type, reference_id, created_at)
              VALUES (?, ?, 'recharge', ?, ?)`
            ).bind(
              order.user_id,
              params.money,
              params.out_trade_no,
              Math.floor(Date.now() / 1000)
            )
          ]);
          
          // 检查所有更新是否成功
          if (!batchResult.every(r => r.success)) {
            console.error('数据库更新失败:', batchResult);
            throw new Error('数据库更新失败');
          }
          
          // 记录详细日志
          console.log('充值成功记录:', {
            orderId: params.out_trade_no,
            userId: order.user_id,
            amount: params.money,
            balanceUpdated: batchResult[1].success,
            rechargeCreated: batchResult[2].success,
            transactionCreated: batchResult[3].success,
            timestamp: new Date().toISOString()
          });

          return new Response('SUCCESS');

        } catch (err) {
          console.error('通知处理失败:', err);
          return new Response('ERROR', { status: 500 });
        }
      }

      // 支付状态查询
      if (url.pathname === '/api/recharge/status' && method === 'GET') {
        const orderId = url.searchParams.get('orderId');
        
        const order = await db.prepare(
          `SELECT status FROM recharge_orders WHERE order_id = ?`
        ).bind(orderId).first();
        
        return new Response(JSON.stringify({
          status: order?.status || 'not_found'
        }), { headers: corsHeaders });
      }

      // 模拟充值接口（用于测试）
      if (url.pathname === '/api/recharge/simulate' && method === 'POST') {
        try {
          const { amount } = await request.json();
          const authHeader = request.headers.get('Authorization');
          
          if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return new Response(JSON.stringify({
              success: false,
              error: 'UNAUTHORIZED',
              message: '未授权访问'
            }), { status: 401, headers: corsHeaders });
          }
          
          const token = authHeader.split(' ')[1];
          const payload = await verifyJWT(token, env.JWT_SECRET);
          
          if (!payload || !payload.id) {
            return new Response(JSON.stringify({
              success: false,
              error: 'INVALID_TOKEN',
              message: '无效令牌'
            }), { status: 401, headers: corsHeaders });
          }
          
          if (!amount || amount <= 0) {
            return new Response(JSON.stringify({
              success: false,
              error: 'INVALID_AMOUNT',
              message: '充值金额无效'
            }), { status: 400, headers: corsHeaders });
          }
          
          // 生成模拟订单号
          const orderId = `SIM${Date.now()}${Math.floor(Math.random() * 1000)}`;
          const now = Math.floor(Date.now() / 1000);
          
          // 使用事务确保数据一致性
          const batchResult = await db.batch([
            // 1. 创建充值订单记录
            db.prepare(
              `INSERT INTO recharge_orders 
              (order_id, user_id, amount, payment_method, status, created_at)
              VALUES (?, ?, ?, ?, ?, ?)`
            ).bind(orderId, payload.id, amount, 'simulate', 'completed', now),
            
            // 2. 更新用户余额
            db.prepare(
              `UPDATE users SET balance = COALESCE(balance, 0) + ? WHERE id = ?`
            ).bind(amount, payload.id),
            
            // 3. 创建充值记录
            db.prepare(
              `INSERT INTO recharges 
              (order_id, user_id, amount, payment_method, created_at)
              VALUES (?, ?, ?, ?, ?)`
            ).bind(orderId, payload.id, amount, 'simulate', now),
            
            // 4. 创建交易记录
            db.prepare(
              `INSERT INTO transactions 
              (user_id, amount, type, reference_id, created_at)
              VALUES (?, ?, ?, ?, ?)`
            ).bind(payload.id, amount, 'recharge', orderId, now)
          ]);
          
          // 检查所有操作是否成功
          const allSuccess = batchResult.every(result => result.success);
          
          if (!allSuccess) {
            console.error('模拟充值批量操作失败:', batchResult);
            return new Response(JSON.stringify({
              success: false,
              error: 'DATABASE_ERROR',
              message: '数据库操作失败'
            }), { status: 500, headers: corsHeaders });
          }
          
          // 获取更新后的用户余额
          const updatedUser = await safeDbFirst(db, 
            `SELECT balance FROM users WHERE id = ?`, 
            [payload.id]
          );
          
          console.log('模拟充值成功:', {
            orderId,
            userId: payload.id,
            amount,
            newBalance: updatedUser?.balance || 0,
            timestamp: new Date().toISOString()
          });
          
          return new Response(JSON.stringify({
            success: true,
            message: '模拟充值成功',
            data: {
              orderId,
              amount,
              balance: updatedUser?.balance || 0
            }
          }), { headers: corsHeaders });
          
        } catch (error) {
          console.error('模拟充值错误:', error);
          return new Response(JSON.stringify({
            success: false,
            error: 'SERVER_ERROR',
            message: '服务器内部错误'
          }), { status: 500, headers: corsHeaders });
        }
      }

    // 获取用户余额
      if (url.pathname === '/api/user/balance' && method === 'GET') {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return new Response(JSON.stringify({ error: '未授权' }), {
            status: 401,
            headers: corsHeaders
          });
        }
        
        const token = authHeader.split(' ')[1];
        const payload = await verifyJWT(token, env.JWT_SECRET);
        if (!payload || !payload.id) {
          return new Response(JSON.stringify({ error: '无效令牌' }), {
            status: 401,
            headers: corsHeaders
          });
        }
        
        const user = await safeDbFirst(db, `SELECT balance FROM users WHERE id = ?`, [payload.id]);
        
        if (!user) {
          return new Response(JSON.stringify({ error: '用户不存在' }), {
            status: 404,
            headers: corsHeaders
          });
        }
        
        return new Response(JSON.stringify({
          balance: user?.balance || 0
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
      
      // Stripe 创建支付意图
      if (url.pathname === '/api/create-payment-intent' && method === 'POST') {
        try {
          const authHeader = request.headers.get('Authorization');
          if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return new Response(JSON.stringify({ error: '未授权' }), { status: 401, headers: corsHeaders });
          }
          const token = authHeader.split(' ')[1];
          const payload = await verifyJWT(token, env.JWT_SECRET);
          if (!payload || !payload.id) {
            return new Response(JSON.stringify({ error: '无效令牌' }), { status: 401, headers: corsHeaders });
          }
    const { amount } = await request.json();
    if (!amount || amount < 100) {
      return new Response(JSON.stringify({ error: '无效金额' }), { status: 400, headers: corsHeaders });
    }
    console.log('STRIPE_SECRET_KEY:', env.STRIPE_SECRET_KEY ? 'defined (length: ' + env.STRIPE_SECRET_KEY.length + ')' : 'undefined');
    const stripe = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });
          const paymentIntent = await stripe.paymentIntents.create({
            amount: amount,
            currency: 'usd',
            metadata: { user_id: payload.id }
          });
          return new Response(JSON.stringify({ clientSecret: paymentIntent.client_secret }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
        } catch (error) {
          console.error('Stripe payment intent creation error:', error);
          console.error('Error stack:', error.stack);
          return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
        }
      }
      
      // Stripe Webhook
      if (url.pathname === '/api/stripe-webhook' && method === 'POST') {
        try {
    console.log('Webhook received: Starting processing');
    const signature = request.headers.get('stripe-signature');
    console.log('Signature:', signature);
    const stripe = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });
    const payload = await request.text();
    console.log('Payload received:', payload);
    const event = await stripe.webhooks.constructEventAsync(payload, signature, env.STRIPE_WEBHOOK_SECRET);
    console.log('Event constructed:', JSON.stringify(event));
    if (event.type === 'charge.succeeded') {
      const userId = event.data.object.metadata.user_id;
      const amount = event.data.object.amount / 100;
      const chargeId = event.data.object.id;
      const now = Math.floor(Date.now() / 1000);
      console.log('Processing succeeded event: userId=', userId, 'amount=', amount, 'chargeId=', chargeId);
      // Check if already processed
      const existing = await safeDbFirst(db, 'SELECT * FROM recharge_orders WHERE order_id = ?', [chargeId]);
      if (existing) {
        console.log('Charge already processed, skipping');
        return new Response('Webhook received (already processed)', { status: 200 });
      }
      // Insert into recharge_orders
      await safeDbRun(db, 'INSERT INTO recharge_orders (order_id, user_id, amount, payment_method, status, created_at) VALUES (?, ?, ?, ?, ?, ?)', [chargeId, userId, amount, 'stripe', 'completed', now]);
      console.log('Recharge order inserted');
      // Update user balance
      await safeDbRun(db, 'UPDATE users SET balance = COALESCE(balance, 0) + ? WHERE id = ?', [amount, userId]);
      console.log('User balance updated');
      // Insert into recharges
      await safeDbRun(db, 'INSERT INTO recharges (order_id, user_id, amount, payment_method, created_at) VALUES (?, ?, ?, ?, ?)', [chargeId, userId, amount, 'stripe', now]);
      console.log('Recharge record inserted');
    }
    console.log('Webhook processing completed successfully');
    return new Response('Webhook received', { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    console.error('Error details:', error.message);
    return new Response(error.message, { status: 400 });
  }
      }
      
      // 八字计算接口
      if (url.pathname === '/api/calculate' && method === 'POST') {
        try {
          const data = await request.json();
          const { name, birthDate, birthTime, gender, birthPlace, isLunar } = data;
          
          // 验证必填字段
          if (!name || !birthDate || !birthTime || !gender) {
            return new Response(JSON.stringify({ 
              error: '缺少必填字段',
              message: '姓名、出生日期、出生时间和性别为必填项' 
            }), { 
              status: 400, 
              headers: corsHeaders 
            });
          }
          
          // 使用精确的八字计算算法
          const result = await calculateBaziAccurate({ name, birthDate, birthTime, gender });
          
          return new Response(JSON.stringify(result), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
          
        } catch (error) {
          console.error('八字计算错误:', error);
          return new Response(JSON.stringify({ 
            error: '计算失败',
            message: error.message 
          }), { 
            status: 500, 
            headers: corsHeaders 
          });
        }
      }

      // 新增：本地八字计算端点（用于QA功能）
      if (url.pathname === '/bazi/calculate-locally' && method === 'POST') {
        try {
          const data = await request.json();
          const { name, birthDate, birthTime, gender } = data;
          
          // 验证必填字段
          if (!name || !birthDate || !birthTime || !gender) {
            return new Response(JSON.stringify({ 
              error: '缺少必填字段',
              message: '姓名、出生日期、出生时间和性别为必填项' 
            }), { 
              status: 400, 
              headers: corsHeaders 
            });
          }
          
          // 调用本地计算函数（与详细分析模块使用相同的算法）
          const localResult = calculateBaziLocally({ name, date: birthDate, time: birthTime, gender });
          
          return new Response(JSON.stringify({
            success: true,
            data: localResult
          }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
          
        } catch (error) {
          console.error('本地八字计算错误:', error);
          return new Response(JSON.stringify({ 
            error: '本地计算失败',
            message: error.message 
          }), { 
            status: 500, 
            headers: corsHeaders 
          });
        }
      }

      // 新增：九个分析模块的详细分析端点（流式输出）
      if (url.pathname === '/api/detailed-analysis' && method === 'POST') {
        try {
          const data = await request.json();
          const { baziData, analysisType } = data;
          
          // 验证必填字段
          if (!baziData || !analysisType) {
            return new Response(JSON.stringify({ 
              error: '缺少必填字段',
              message: '八字数据和分析类型为必填项' 
            }), { 
              status: 400, 
              headers: corsHeaders 
            });
          }

          // 验证分析类型
          const validAnalysisTypes = [
            'full-analysis', 'annual-fortune', 'monthly-fortune', 
            'decade-fortune', 'personality', 'career', 
            'marriage', 'children', 'health', 'mingge', 'qa'
          ];
          
          if (!validAnalysisTypes.includes(analysisType)) {
            return new Response(JSON.stringify({ 
              error: '无效的分析类型',
              message: '分析类型必须是: ' + validAnalysisTypes.join(', ')
            }), { 
              status: 400, 
              headers: corsHeaders 
            });
          }

          // 调用流式DeepSeek API获取详细分析
          const streamingAnalysis = await getStreamingDeepSeekAnalysis(baziData, analysisType, env);
          return streamingAnalysis;
          
        } catch (error) {
          console.error('详细分析错误:', error);
          return new Response(JSON.stringify({ 
            error: '分析失败',
            message: error.message 
          }), { 
            status: 500, 
            headers: corsHeaders 
          });
        }
      }
      
      // DeepSeek API密钥获取接口
      if (url.pathname === '/api/deepseek-key' && method === 'GET') {
        try {
          const apiKey = env.DEEPSEEK_API_KEY;
          if (!apiKey) {
            return new Response(JSON.stringify({ error: 'DeepSeek API密钥未配置' }), {
              status: 500,
              headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
          }
          
          return new Response(JSON.stringify({ apiKey }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        } catch (error) {
          console.error('获取DeepSeek API密钥错误:', error);
          return new Response(JSON.stringify({ error: '服务器内部错误' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }
      }
      
      // 流式分析接口
      if (url.pathname === '/api/streaming-analysis' && method === 'POST') {
        try {
          const requestData = await request.json();
          const { baziData, analysisType } = requestData;
          
          if (!baziData || !analysisType) {
            return new Response(JSON.stringify({ error: '缺少必要参数' }), {
              status: 400,
              headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
          }

          // 调用流式DeepSeek API
          const streamingAnalysis = await getStreamingDeepSeekAnalysis(baziData, analysisType, env);
          return streamingAnalysis;
          
        } catch (error) {
          console.error('流式分析错误:', error);
          return new Response(JSON.stringify({ error: '流式分析失败' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }
      }
      
      // 获取用户每日问答计数
      if (url.pathname === '/api/user/qa-count' && method === 'GET') {
        try {
          const authHeader = request.headers.get('Authorization');
          if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return new Response(JSON.stringify({ error: '未提供认证令牌' }), {
              status: 401,
              headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
          }

          const token = authHeader.substring(7);
          const payload = await verifyJWT(token, env.JWT_SECRET);
          if (!payload) {
            return new Response(JSON.stringify({ error: '无效的认证令牌' }), {
              status: 401,
              headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
          }

          const today = new Date().toISOString().split('T')[0];
          const qaCount = await safeDbFirst(db, 
            `SELECT daily_qa_count, qa_count_date FROM users WHERE id = ?`, 
            [payload.id]
          );

          let currentCount = 0;
          if (qaCount && qaCount.qa_count_date === today) {
            currentCount = qaCount.daily_qa_count || 0;
          }

          return new Response(JSON.stringify({ 
            success: true,
            dailyCount: currentCount,
            freeLimit: 10
          }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        } catch (error) {
          console.error('获取问答计数错误:', error);
          return new Response(JSON.stringify({ error: '获取问答计数失败' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }
      }

      // 更新用户每日问答计数
      if (url.pathname === '/api/user/qa-count' && method === 'POST') {
        try {
          const authHeader = request.headers.get('Authorization');
          if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return new Response(JSON.stringify({ error: '未提供认证令牌' }), {
              status: 401,
              headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
          }

          const token = authHeader.substring(7);
          const payload = await verifyJWT(token, env.JWT_SECRET);
          if (!payload) {
            return new Response(JSON.stringify({ error: '无效的认证令牌' }), {
              status: 401,
              headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
          }

          const today = new Date().toISOString().split('T')[0];
          const user = await safeDbFirst(db, 
            `SELECT daily_qa_count, qa_count_date FROM users WHERE id = ?`, 
            [payload.id]
          );

          let newCount = 1;
          if (user && user.qa_count_date === today) {
            newCount = (user.daily_qa_count || 0) + 1;
          }

          await safeDbRun(db, 
            `UPDATE users SET daily_qa_count = ?, qa_count_date = ? WHERE id = ?`,
            [newCount, today, payload.id]
          );

          return new Response(JSON.stringify({ 
            success: true,
            dailyCount: newCount
          }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        } catch (error) {
          console.error('更新问答计数错误:', error);
          return new Response(JSON.stringify({ error: '更新问答计数失败' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }
      }

      // 购买问答包
      if (url.pathname === '/api/user/purchase-qa-package' && method === 'POST') {
        try {
          const authHeader = request.headers.get('Authorization');
          if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return new Response(JSON.stringify({ error: '未提供认证令牌' }), {
              status: 401,
              headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
          }

          const token = authHeader.substring(7);
          const payload = await verifyJWT(token, env.JWT_SECRET);
          if (!payload) {
            return new Response(JSON.stringify({ error: '无效的认证令牌' }), {
              status: 401,
              headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
          }

          const { packageType } = await request.json();
          const packagePrice = 1.0; // $1 for 10 questions
          const packageQuestions = 10;

          // 检查用户余额
          const user = await safeDbFirst(db, 
            `SELECT balance FROM users WHERE id = ?`, 
            [payload.id]
          );

          if (!user || user.balance < packagePrice) {
            return new Response(JSON.stringify({ 
              error: '余额不足',
              required: packagePrice,
              current: user?.balance || 0
            }), {
              status: 400,
              headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
          }

          // 扣除余额并重置每日问答计数
          const newBalance = user.balance - packagePrice;
          const today = new Date().toISOString().split('T')[0];
          
          await safeDbRun(db, 
            `UPDATE users SET balance = ?, daily_qa_count = 0, qa_count_date = ? WHERE id = ?`,
            [newBalance, today, payload.id]
          );

          return new Response(JSON.stringify({ 
            success: true,
            message: '购买成功',
            newBalance: newBalance,
            questionsAdded: packageQuestions
          }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        } catch (error) {
          console.error('购买问答包错误:', error);
          return new Response(JSON.stringify({ error: '购买失败' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }
      }

      // 问答API
      if (url.pathname === '/api/qa' && method === 'POST') {
        try {
          const authHeader = request.headers.get('Authorization');
          if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return new Response(JSON.stringify({ error: '未提供认证令牌' }), {
              status: 401,
              headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
          }

          const token = authHeader.substring(7);
          const payload = await verifyJWT(token, env.JWT_SECRET);
          if (!payload) {
            return new Response(JSON.stringify({ error: '无效的认证令牌' }), {
              status: 401,
              headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
          }

          const requestData = await request.json();
          console.log('🔍 QA API 接收到的请求数据:', JSON.stringify(requestData, null, 2));
          const { question, baziData } = requestData;
          
          if (!question || !baziData) {
            console.log('❌ 缺少必要数据 - question:', question, 'baziData:', baziData);
            return new Response(JSON.stringify({ error: '缺少问题内容或八字数据' }), {
              status: 400,
              headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
          }

          // 将问题添加到八字数据中，供分析使用
          const analysisData = { ...baziData, question };
          console.log('🔍 合并后的分析数据:', JSON.stringify(analysisData, null, 2));

          // 检查每日问答次数
          const today = new Date().toISOString().split('T')[0];
          const user = await safeDbFirst(db, 
            `SELECT daily_qa_count, qa_count_date FROM users WHERE id = ?`, 
            [payload.id]
          );

          let currentCount = 0;
          if (user && user.qa_count_date === today) {
            currentCount = user.daily_qa_count || 0;
          }

          if (currentCount >= 10) {
            return new Response(JSON.stringify({ 
              error: '今日免费问答次数已用完',
              needPurchase: true
            }), {
              status: 403,
              headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
          }

          // 调用流式DeepSeek API进行问答
          const streamingAnalysis = await getStreamingDeepSeekAnalysis(analysisData, 'qa', env);
          
          // 无论API调用结果如何，都更新用户每日问答计数（因为用户已经消耗了一次问答机会）
          try {
            const newCount = currentCount + 1;
            await safeDbRun(db, 
              `UPDATE users SET daily_qa_count = ?, qa_count_date = ? WHERE id = ?`,
              [newCount, today, payload.id]
            );
            console.log(`✅ 用户 ${payload.id} 问答计数已更新: ${currentCount} -> ${newCount}`);
          } catch (updateError) {
            console.error('❌ 更新问答计数失败:', updateError);
            // 不影响主流程，继续返回结果
          }
          
          return streamingAnalysis;
          
        } catch (error) {
          console.error('问答API错误:', error);
          return new Response(JSON.stringify({ error: '问答处理失败' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }
      }
      
      // 其他路径404
       return new Response('Not Found', { status: 404, headers: corsHeaders });
  }
};

// 流式DeepSeek API调用函数
async function getStreamingDeepSeekAnalysis(baziData, analysisType, env) {
  try {
    console.log('调用流式DeepSeek API...');
    
    if (!env.DEEPSEEK_API_KEY || env.DEEPSEEK_API_KEY.includes('placeholder') || env.DEEPSEEK_API_KEY.includes('test')) {
      console.log('使用模拟流式数据');
      return new Response(JSON.stringify({ analysis: getMockAnalysis(analysisType) }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const prompt = generateAnalysisPrompt(baziData, analysisType);
    
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: '你是一位专业的命理师，精通八字命理学。请简洁专业地分析。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.6,
        stream: true // 启用流式输出
      })
    });

    if (!response.ok) {
      throw new Error(`流式API请求失败: ${response.status}`);
    }

    // 返回流式响应
    return new Response(response.body, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
    
  } catch (error) {
    console.error('流式DeepSeek API调用错误:', error.message);
    return new Response(JSON.stringify({ analysis: getMockAnalysis(analysisType) }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// DeepSeek API调用函数
async function getDeepSeekAnalysis(baziData, analysisType, env) {
  try {
    // 调试日志：检查API密钥
    console.log('DEEPSEEK_API_KEY:', env.DEEPSEEK_API_KEY ? `${env.DEEPSEEK_API_KEY.substring(0, 10)}...` : 'undefined');
    console.log('Analysis type:', analysisType);
    
    // 如果是测试环境或者API密钥是占位符，返回模拟分析结果
    if (!env.DEEPSEEK_API_KEY || env.DEEPSEEK_API_KEY.includes('placeholder') || env.DEEPSEEK_API_KEY.includes('test')) {
      console.log('使用模拟分析数据，原因：API密钥无效或为测试环境');
      return getMockAnalysis(analysisType);
    }
    
    console.log('调用DeepSeek API进行真实分析...');
    
    const prompt = generateAnalysisPrompt(baziData, analysisType);
    
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: '你是一位专业的命理师，精通八字命理学。请根据提供的八字信息进行详细、准确的分析。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1500, // 优化token数量
        temperature: 0.6, // 优化温度参数
        stream: false // 默认非流式，可根据需要调整
      })
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API请求失败: ${response.status}`);
    }

    const result = await response.json();
    const content = result.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('API返回内容为空');
    }
    
    console.log('DeepSeek API调用成功');
    return content;
    
  } catch (error) {
    console.error('DeepSeek API调用错误，使用模拟数据:', error.message);
    // 当API调用失败时，返回模拟数据而不是抛出错误
    return getMockAnalysis(analysisType);
  }
}

// 模拟分析结果函数
function getMockAnalysis(analysisType) {
  const mockAnalyses = {
    'full-analysis': '根据您的八字分析，您是一个性格稳重、做事踏实的人。命理显示您具有较强的责任心和意志力，在事业上有稳步发展的潜力。建议您在人际交往中保持开放心态，多听取他人意见。',
    'annual-fortune': '今年整体运势平稳向上，事业方面有新的发展机会，财运稳中有升。需要注意的是在夏季时期要谨慎投资，秋季是收获的好时机。',
    'monthly-fortune': '本月运势较为平稳，工作上可能会有一些小的挑战，但都能顺利解决。感情方面需要多沟通，财运方面适合稳健投资。',
    'decade-fortune': '未来十年大运整体向好，前五年以稳定发展为主，后五年将迎来事业的重要转折点。建议在35岁左右时把握重要机遇。',
    'personality': '您的性格特点：稳重踏实，责任心强，做事有条理。优点是意志坚定，能够坚持到底；需要改进的是有时过于固执，建议保持更开放的心态。',
    'career': '事业发展方向建议：适合从事管理、金融、教育等稳定性较强的行业。职业发展呈稳步上升趋势，建议在专业技能上持续提升。',
    'marriage': '感情运势分析：整体感情运势良好，适合寻找性格互补的伴侣。最佳结婚时机在28-32岁之间，婚后感情稳定和谐。',
    'children': '子女运势分析：子女缘分较深，适合在30岁左右生育。子女性格活泼聪明，在教育方面建议采用鼓励式教育，注重培养独立性。',
    'health': '健康运势分析：整体体质偏强，需要注意消化系统的保养。建议保持规律的作息时间，适当运动，注意饮食均衡。',
    'mingge': '### 一、命格等级评分分析\n\n您的命格层次良好，具备一定的天赋和潜力。五行配置相对均衡，格局清晰，为人生发展奠定了良好基础。从八字结构来看，您的命格具有以下特点：\n\n- **格局层次**：中上等格局，具备较好的发展潜力\n- **五行平衡**：整体配置协调，无明显偏枯\n- **用神得力**：用神有力，能够发挥积极作用\n- **格局纯正**：命格结构清晰，无严重冲克\n\n### 二、命格总体特征分析\n\n**性格特质：**\n您的性格特点：稳重踏实，做事有条理，具有较强的责任心和执行力。在人际交往中表现得体，能够获得他人信任。思维敏捷，善于分析问题，但有时可能过于谨慎。\n\n**天赋优势：**\n- 具备良好的领导才能和组织能力\n- 思维逻辑清晰，善于规划和执行\n- 人际关系处理得当，容易获得贵人相助\n- 学习能力强，能够在专业领域深入发展\n\n**需要注意的方面：**\n- 有时过于追求完美，可能错失良机\n- 在变化面前适应性需要加强\n- 情感表达可以更加直接和真诚\n\n### 三、人生发展建议\n\n**总体方向：**\n建议您在人生发展中保持积极进取的心态，充分发挥自身优势。在重要决策时要相信自己的判断，同时也要听取他人的建议。持续学习和自我提升将为您带来更多机遇。\n\n**具体建议：**\n1. **事业发展**：适合从事管理、咨询、教育等需要综合能力的行业\n2. **人际关系**：保持开放心态，主动建立和维护人脉关系\n3. **个人成长**：注重内在修养的提升，培养更加灵活的思维方式\n4. **时机把握**：在30-40岁期间是事业发展的黄金时期，要积极把握机遇\n\n### 四、命格优势总结\n\n您的命格具有稳定性强、发展潜力大的特点。通过合理的规划和努力，能够在人生各个阶段都取得不错的成就。关键是要保持初心，持续进步，相信自己的能力和判断。'
  };
  
  return mockAnalyses[analysisType] || '暂无相关分析内容';
}

// 生成分析提示词
function generateAnalysisPrompt(baziData, analysisType) {
  const { 
    name, gender, birthDate, birthPlace, lunarDate, zodiac, constellation,
    paipan, wuxing, personality, dayun, liunian, career, marriage, health, 
    strengthAnalysis, luckStartingTime, currentDayun, strengthType,
    currentTime, currentYear, currentMonth, currentDay
  } = baziData;
  
  // 格式化当前时间信息
  const currentTimeInfo = currentTime ? new Date(currentTime).toLocaleString('zh-CN') : new Date().toLocaleString('zh-CN');
  const analysisYear = currentYear || new Date().getFullYear();
  const analysisMonth = currentMonth || new Date().getMonth() + 1;
  const analysisDay = currentDay || new Date().getDate();
  
  const baseInfo = `
命主基本信息：
姓名：${name || '未知'}
性别：${gender || '未知'}
出生时间：${birthDate || '未知'}
出生地点：${birthPlace || '未知'}
农历生日：${lunarDate || '未知'}
生肖：${zodiac || '未知'}
星座：${constellation || '未知'}
起运时间：${luckStartingTime || '未知'}
当前大运：${currentDayun || '未知'}
身强身弱：${strengthType || (strengthAnalysis?.original?.strengthType) || '未知'}

当前时间信息：
分析时间：${currentTimeInfo}
当前年份：${analysisYear}年
当前月份：${analysisMonth}月
当前日期：${analysisDay}日

八字排盘：
年柱：${paipan?.yearPillar || '未知'}
月柱：${paipan?.monthPillar || '未知'}
日柱：${paipan?.dayPillar || '未知'}
时柱：${paipan?.hourPillar || '未知'}
日主：${paipan?.dayMaster || '未知'}
年纳音：${paipan?.yearNayin || '未知'}

身强身弱详细分析：
${strengthAnalysis?.original ? `
类型：${strengthAnalysis.original.strengthType || '未知'}
强度：${((strengthAnalysis.original.strengthPercentage || 0) * 100).toFixed(1)}%
等级：${strengthAnalysis.original.levelDescription || '未知'}
生扶力量：${strengthAnalysis.original.supportStrength || 0}
克泄力量：${strengthAnalysis.original.weakenStrength || 0}
月令得分：${strengthAnalysis.original.monthScore || 0}
` : '未分析'}

五行分析：
${wuxing ? JSON.stringify(wuxing, null, 2) : '未分析'}

重要提示：
1. 请使用上述已计算好的起运时间、当前大运、身强身弱结果，不要重新计算
2. 请基于当前时间（${analysisYear}年${analysisMonth}月${analysisDay}日）进行分析
3. 所有时间相关的预测和建议都应基于当前实际时间
`;

  switch (analysisType) {
    case 'full-analysis':
      return `${baseInfo}

请提供全面的命理分析，包括：
1. 八字格局分析
2. 五行旺衰分析
3. 用神喜忌分析
4. 性格特点分析
5. 人生运势概况
6. 重要流年预测
请详细分析并给出具体建议。`;
      
    case 'annual-fortune':
      return `${baseInfo}

流年信息：${JSON.stringify(liunian, null, 2)}

请分析当前及未来几年的流年运势，包括：
1. 各年份运势起伏
2. 重要事件预测
3. 需要注意的年份
4. 流年改运建议`;
      
    case 'monthly-fortune':
      return `${baseInfo}

请分析当前年份各月份的运势变化，包括：
1. 每月运势特点
2. 适宜进行的活动
3. 需要谨慎的月份
4. 月度调理建议`;
      
    case 'decade-fortune':
      return `${baseInfo}

大运信息：${JSON.stringify(dayun, null, 2)}

请分析十年大运的变化趋势，包括：
1. 各大运期间的总体运势
2. 人生重要转折点
3. 事业发展机遇
4. 大运调理方法`;
      
    case 'personality':
      return `${baseInfo}

性格分析：${JSON.stringify(personality, null, 2)}

请深入分析性格特征，包括：
1. 核心性格特质
2. 优势与劣势
3. 人际交往特点
4. 性格改善建议`;
      
    case 'career':
      return `${baseInfo}

事业分析：${JSON.stringify(career, null, 2)}

请分析事业财富运势，包括：
1. 适合的职业方向
2. 事业发展时机
3. 财富积累方式
4. 投资理财建议`;
      
    case 'marriage':
      return `${baseInfo}

婚姻分析：${JSON.stringify(marriage, null, 2)}

请分析婚姻感情运势，包括：
1. 感情运势特点
2. 适合的伴侣类型
3. 婚姻时机预测
4. 感情维护建议`;
      
    case 'children':
      return `${baseInfo}

请分析子女运势，包括：
1. 子女缘分深浅
2. 子女性格特点预测
3. 教育方式建议
4. 亲子关系维护`;
      
    case 'health':
      return `${baseInfo}

健康分析：${JSON.stringify(health, null, 2)}

请分析健康运势，包括：
1. 体质特点分析
2. 易患疾病预测
3. 养生保健建议
4. 季节性调理方法`;
      
    case 'mingge':
      return `${baseInfo}

命格等级：${baziData.minggeLevel || '未知'}（${baziData.minggeScore || 0}分）

请专门分析命主的命格总体特征，包括：
1. 命格等级评分详细分析
2. 命格总体特征和性格特点
3. 人生发展潜力和方向建议
4. 命格优势和需要注意的方面

注意：请只分析命格相关内容，不要涉及财富、事业、婚姻等其他方面的分析。`;
      
    case 'qa':
      const userQuestion = baziData.question || '请根据我的八字给出建议';
      return `${baseInfo}

用户问题：${userQuestion}

请作为专业的命理师，基于上述八字信息回答用户的问题。

重要提醒：
- 上述八字信息已经完整提供，包含年柱、月柱、日柱、时柱四柱信息
- 时辰信息已在时柱中明确显示：${paipan?.hourPillar || '未知'}
- 当前大运信息已计算完成：${currentDayun || '未知'}
- 身强身弱已分析完成：${strengthType || '未知'}
- 请直接使用这些已计算好的结果，无需重新计算或询问时辰

回答要求：
1. 结合八字命理知识进行专业分析
2. 回答要针对性强，直接解答用户疑问
3. 提供具体可行的建议和指导
4. 语言通俗易懂，避免过于专业的术语
5. 保持客观理性，给出平衡的观点
6. 如涉及大运分析，请使用已提供的当前大运信息

请详细回答用户的问题。`;
      
    default:
         return `${baseInfo}
 
 请根据八字信息进行综合分析。`;
   }
 }