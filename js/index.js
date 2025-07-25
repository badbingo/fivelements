function base64Encode(bytes) {
  return btoa(String.fromCharCode(...bytes)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function base64Decode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return Uint8Array.from(atob(str), c => c.charCodeAt(0));
}

const JWT_SECRET = 'your_jwt_secret_key';

// ✅ 生成 JWT
function generateJWT(payload, secret) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64Encode(new TextEncoder().encode(JSON.stringify(header)));
  const encodedPayload = base64Encode(new TextEncoder().encode(JSON.stringify(payload)));
  const signature = base64Encode(new TextEncoder().encode(`${encodedHeader}.${encodedPayload}.${secret}`));  // 简化签名方式（演示用）
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

// ✅ 验证 JWT
function verifyJWT(token, secret) {
  try {
    const [encodedHeader, encodedPayload, signature] = token.split('.');
    const expectedSignature = base64Encode(new TextEncoder().encode(`${encodedHeader}.${encodedPayload}.${secret}`));
    if (signature !== expectedSignature) {
      console.log('JWT 签名不匹配');
      return null;
    }
    const payloadStr = new TextDecoder().decode(base64Decode(encodedPayload));
    return JSON.parse(payloadStr);
  } catch (err) {
    console.log('JWT 验证错误:', err.message);
    return null;
  }
}

async function hashPassword(password) {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(password));
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function sendResetEmail(toEmail, emailContent, env) {
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

// 创建 D1 会话
async function createD1Session(env) {
  try {
    const response = await fetch('https://api.cloudflare.com/client/v4/accounts/${env.ACCOUNT_ID}/d1/database/${env.DB_ID}/session', {
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
    // 创建 D1 读副本会话
    let db = env.DB; // 默认使用主数据库
    const sessionToken = await createD1Session(env).catch(() => null);
    if (sessionToken) {
      db = env.DB.withSession(sessionToken); // 使用读副本
    }

    const { method } = request;
    const url = new URL(request.url);

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true'
    };

    if (method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // 注册接口
    if (url.pathname === '/api/register' && method === 'POST') {
      const { name, email, password } = await request.json();

      // 检查用户名或邮箱是否已存在
      const existingUser = await db.prepare(`SELECT * FROM users WHERE name = ? OR email = ?`)
        .bind(name, email).first();
      if (existingUser) {
        return new Response(JSON.stringify({ error: '用户名或邮箱已被使用' }), {
          status: 409,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      const hashed = await hashPassword(password);
      const createdAt = Date.now(); // 使用时间戳（INTEGER 类型）

      await db.prepare(`
        INSERT INTO users (name, email, password, created_at)
        VALUES (?, ?, ?, ?)
      `).bind(name, email, hashed, createdAt).run();

      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // 登录接口
    if (url.pathname === '/api/login' && method === 'POST') {
    const { name, password } = await request.json();
    const hashed = await hashPassword(password);  // 你原本的加密逻辑

    const user = await db.prepare(`SELECT * FROM users WHERE name = ?`).bind(name).first();
    if (!user || user.password !== hashed) {
      return new Response(JSON.stringify({ error: '用户名或密码错误' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    const token = generateJWT({ id: user.id, name: user.name }, env.JWT_SECRET);
    return new Response(JSON.stringify({ token }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

    // 请求重设密码接口
    if (url.pathname === '/api/request-reset' && method === 'POST') {
      const { email } = await request.json();
      const user = await db.prepare(`SELECT * FROM users WHERE email = ?`).bind(email).first();
      if (!user) {
        // 不暴露是否存在
        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
      const token = generateJWT({ id: user.id, exp: Math.floor(Date.now() / 1000) + 600 }, env.JWT_SECRET); // 10分钟有效
      const link = `https://mybazi.net/system/reset.html?token=${token}`;
      try {
        // 修改邮件内容，包含用户名
        const emailContent = `尊敬的 ${user.name}，\n\n点击以下链接重设你的密码：\n\n${link}\n\n链接10分钟内有效。`;
        
        await sendResetEmail(email, emailContent, env);
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

    // 提交新密码接口
    if (url.pathname === '/api/reset-password' && method === 'POST') {
      const { token, newPassword } = await request.json();
      const payload = verifyJWT(token);
      if (!payload || payload.exp < Math.floor(Date.now() / 1000)) {
        return new Response(JSON.stringify({ error: '链接已过期或无效' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
      const hashed = await hashPassword(newPassword);
      await db.prepare(`UPDATE users SET password = ? WHERE id = ?`).bind(hashed, payload.id).run();
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // 获取用户余额接口
  if (url.pathname === '/api/users/balance' && method === 'GET') {
    try {
      const authHeader = request.headers.get('Authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: '未授权' }), { status: 401, headers: corsHeaders });
      }

      const token = authHeader.split(' ')[1];
      const payload = verifyJWT(token, env.JWT_SECRET);
      if (!payload || !payload.id) {
        return new Response(JSON.stringify({ error: '无效的用户信息' }), { status: 401, headers: corsHeaders });
      }

      const user = await db.prepare(`SELECT balance FROM users WHERE id = ?`).bind(payload.id).first();
      if (!user) {
        return new Response(JSON.stringify({ error: '用户不存在' }), { status: 404, headers: corsHeaders });
      }

      return new Response(JSON.stringify({ balance: user.balance }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
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
        const payload = verifyJWT(token, env.JWT_SECRET);
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

        // 2. 检查愿望状态
        const wish = await db.prepare(
          `SELECT id, user_id, is_fulfilled FROM wishes WHERE id = ?`
        ).bind(wishId).first();
        
        if (!wish) {
          return new Response(JSON.stringify({ error: '愿望不存在' }), { 
            status: 404,
            headers: corsHeaders 
          });
        }
        
        // 移除对愿望是否已还愿的检查，允许多次还愿
        // if (wish.is_fulfilled) {
        //   return new Response(JSON.stringify({ error: '愿望已还愿' }), { 
        //     status: 400,
        //     headers: corsHeaders 
        //   });
        // }

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

        // 5. 使用批量操作执行支付（替代事务）
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
          ),
          
          db.prepare(
            `UPDATE wishes SET is_fulfilled = 1, fulfilled_at = ? WHERE id = ?`
          ).bind(timestamp, wishId)
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
        const payload = verifyJWT(token, JWT_SECRET);
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
    
    // 1. 验证订单状态
    const order = await db.prepare(`SELECT * FROM recharge_orders WHERE order_id = ?`).bind(orderId).first();
    if (!order) {
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
    await db.prepare(`UPDATE recharge_orders SET status = 'completed' WHERE order_id = ?`).bind(orderId).run();
    
    // 3. 如果订单状态是pending，则更新用户余额
    if (order.status === 'pending') {
      await db.prepare(`UPDATE users SET balance = balance + ? WHERE id = ?`).bind(order.amount, order.user_id).run();
      
      // 4. 记录交易
      await db.prepare(`
        INSERT INTO transactions (user_id, amount, type, description, order_id)
        VALUES (?, ?, 'recharge', '账户充值', ?)
      `).bind(order.user_id, order.amount, orderId).run();
      
      // 5. 记录支付通知
      await db.prepare(`
        INSERT INTO payment_notifications (order_id, amount, payment_method, status)
        VALUES (?, ?, ?, 'completed')
      `).bind(orderId, order.amount, order.payment_method).run();
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

          await db.prepare(`
            INSERT INTO wishes (user_name, bazi, content, type, visibility, birth_date, birth_time, user_id, solar_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(user_name, bazi, content, type, visibility, birth_date, birth_time, user_id, solar_date).run();

          return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        if (method === 'GET') {
          const { results } = await db.prepare(`SELECT * FROM wishes ORDER BY id DESC`).all();
          return new Response(JSON.stringify({ data: results }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
      } catch (err) {
        return new Response('Internal Error: ' + err.message, {
          status: 500,
          headers: { 'Content-Type': 'text/plain', ...corsHeaders }
        });
      }
    }

    // 删除愿望接口
    if (url.pathname.startsWith('/api/wishes/') && method === 'DELETE') {
      const id = url.pathname.split('/').pop();

      try {
        // 1. 删除引用 wish 的加持记录
        await db.prepare(`DELETE FROM bless_records WHERE wish_id = ?`).bind(id).run();

        // 2. 删除 wish 本身
        await db.prepare(`DELETE FROM wishes WHERE id = ?`).bind(id).run();

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
        const payload = verifyJWT(token, env.JWT_SECRET);
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
        const payload = verifyJWT(token, env.JWT_SECRET);
        if (!payload || !payload.id) {
          return new Response(JSON.stringify({ error: '无效的用户信息' }), { status: 401, headers: corsHeaders });
        }

        const userId = payload.id;

        // 检查愿望是否存在
        const wish = await db.prepare(`SELECT * FROM wishes WHERE id = ?`).bind(wishId).first();
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
          await db.prepare(`UPDATE bless_records SET count = count + 1, last_blessed_at = ? WHERE wish_id = ? AND user_id = ?`)
            .bind(now, wishId, userId).run();
        } else {
          await db.prepare(`INSERT INTO bless_records (wish_id, user_id, count, first_blessed_at, last_blessed_at) VALUES (?, ?, 1, ?, ?)`)
            .bind(wishId, userId, now, now).run();
        }

        // 重新计算总加持次数（确保不超过25）
        const newTotalBlessings = Math.min((currentBlessings + 1), 25);
        const level = newTotalBlessings >= 20 ? 5 : 
                    newTotalBlessings >= 15 ? 4 : 
                    newTotalBlessings >= 10 ? 3 : 
                    newTotalBlessings >= 5 ? 2 : 1;

        await db.prepare(`UPDATE wishes SET blessings = ?, level = ? WHERE id = ?`)
          .bind(newTotalBlessings, level, wishId).run();

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
              payload = verifyJWT(token);
            } catch (e) {
              return new Response(JSON.stringify({ error: '无效令牌' }), {
                status: 401,
                headers: corsHeaders
              });
            }

            // 更新is_fulfilled字段和fulfilled_at时间戳
            await db.prepare(
              `UPDATE wishes 
              SET is_fulfilled = 1, 
                  fulfilled_at = strftime('%s','now') 
              WHERE id = ?`
            ).bind(wishId).run();

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
          const result = await db.prepare(
            `INSERT INTO fulfillments 
            (wish_id, amount, payment_method, created_at)
            VALUES (?, ?, ?, ?)`
          ).bind(wishId, amount, paymentMethod, timestamp).run();
          
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
          const fulfillmentResult = await db.prepare(
            `INSERT INTO fulfillments 
            (wish_id, amount, payment_method, created_at)
            VALUES (?, ?, ?, ?)`
          ).bind(wishId, amount, 'zpay', Math.floor(Date.now() / 1000)).run();
          
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
          const payload = verifyJWT(token, env.JWT_SECRET);
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
          await db.prepare(
            `INSERT INTO recharges 
            (user_id, amount, payment_method, order_id, created_at)
            VALUES (?, ?, ?, ?, ?)`
          ).bind(payload.id, amount, paymentMethod, orderId, timestamp).run();
          
          // 3. 更新用户余额
          await db.prepare(
            `UPDATE users SET balance = COALESCE(balance, 0) + ? WHERE id = ?`
          ).bind(amount, payload.id).run();
          
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
          const deleteResult = await db.prepare(
            `DELETE FROM wishes WHERE id = ?`
          ).bind(wishId).run();
          
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

      // 状态检查接口 - 简化版
      if (url.pathname === '/api/wishes/check' && method === 'GET') {
        try {
          const wishId = url.searchParams.get('wishId');
          
          // 检查还愿记录是否存在
          const fulfillmentExists = await db.prepare(
            `SELECT id FROM fulfillments WHERE wish_id = ?`
          ).bind(wishId).first();
          
          return new Response(JSON.stringify({
            fulfilled: !!fulfillmentExists
          }), { headers: corsHeaders });
          
        } catch (error) {
          return new Response(JSON.stringify({
            fulfilled: false,
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
        const payload = verifyJWT(token, env.JWT_SECRET);
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
        await db.prepare(
          `INSERT INTO recharges 
          (order_id, user_id, amount, payment_method, created_at)
          VALUES (?, ?, ?, ?, ?)`
        ).bind(orderId, payload.id, amount, paymentMethod, timestamp).run();
        
        // 2. 更新用户余额
        await db.prepare(
          `UPDATE users SET balance = COALESCE(balance, 0) + ? WHERE id = ?`
        ).bind(amount, payload.id).run();
        
        // 3. 获取更新后的用户信息
        const user = await db.prepare(
          `SELECT id, name, balance FROM users WHERE id = ?`
        ).bind(payload.id).first();
        
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
          const token = authHeader.split(' ')[1];
          const payload = verifyJWT(token, env.JWT_SECRET);
          
          // 生成唯一订单号
          const orderId = `R${Date.now()}${Math.floor(Math.random()*1000)}`;
          
          // 记录到临时订单表（状态为pending）
          await db.prepare(
            `INSERT INTO recharge_orders 
            (order_id, user_id, amount, payment_method, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?)`
          ).bind(
            orderId,
            payload.id,
            amount,
            paymentMethod,
            'pending',
            Math.floor(Date.now() / 1000)
          ).run();
          
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
        const payload = verifyJWT(token, env.JWT_SECRET);
        if (!payload || !payload.id) {
          return new Response(JSON.stringify({ error: '无效令牌' }), {
            status: 401,
            headers: corsHeaders
          });
        }
        
        const user = await db.prepare(
          `SELECT balance FROM users WHERE id = ?`
        ).bind(payload.id).first();
        
        return new Response(JSON.stringify({
          balance: user?.balance || 0
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
      
      // 其他路径404
      return new Response('Not Found', { status: 404, headers: corsHeaders });
  }
};

