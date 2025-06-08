export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // 处理CORS预检请求
    if (request.method === 'OPTIONS') {
      return handleOptions(request);
    }
    
    // API路由
    if (path.startsWith('/api/wishes')) {
      return handleWishes(request, env.DB);
    }
    
    // 其他请求返回前端页面
    return new Response(null, {
      status: 302,
      headers: {
        'Location': 'https://your-frontend-domain.com'
      }
    });
  }
}

async function handleWishes(request, db) {
  try {
    const method = request.method;
    
    // 获取愿望列表
    if (method === 'GET') {
      const { results } = await db.prepare(`
        SELECT * FROM wishes 
        ORDER BY created_at DESC
        LIMIT 50
      `).all();
      
      return new Response(JSON.stringify(results), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 创建新愿望
    if (method === 'POST') {
      const data = await request.json();
      
      const { success } = await db.prepare(`
        INSERT INTO wishes (
          id, user_name, birth_date, birth_time, bazi, 
          content, wish_type, visibility, energy_level
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        crypto.randomUUID(),
        data.user_name,
        data.birth_date,
        data.birth_time,
        data.bazi,
        data.content,
        data.wish_type,
        data.visibility,
        1
      ).run();
      
      return new Response(JSON.stringify({ success }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 加持愿望
    if (method === 'PUT') {
      const { wishId } = await request.json();
      
      // 先获取当前能量等级
      const { results } = await db.prepare(`
        SELECT energy_level FROM wishes WHERE id = ?
      `).bind(wishId).all();
      
      if (!results.length) {
        return new Response('Wish not found', { status: 404 });
      }
      
      const currentLevel = results[0].energy_level;
      const newLevel = Math.min(currentLevel + 1, 5);
      
      const { success } = await db.prepare(`
        UPDATE wishes 
        SET energy_level = ?
        WHERE id = ?
      `).bind(newLevel, wishId).run();
      
      return new Response(JSON.stringify({ 
        success, 
        newLevel 
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response('Method not allowed', { status: 405 });
    
  } catch (err) {
    return new Response(err.message, { status: 500 });
  }
}

function handleOptions(request) {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}
