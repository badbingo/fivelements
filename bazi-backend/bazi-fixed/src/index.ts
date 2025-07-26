// src/index.ts
import { Client } from '@libsql/client/web';

interface Env {
  DB: Client;
  JWT_SECRET: string;
}

export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);
    
    // CORS 头
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // 预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers });
    }

    try {
      // 示例路由
      if (url.pathname === '/api/wishes' && request.method === 'GET') {
        const { rows } = await env.DB.execute('SELECT * FROM wishes LIMIT 20');
        return Response.json(rows, { headers });
      }

      return new Response('Not Found', { status: 404, headers });
    } catch (err) {
      return Response.json(
        { error: err instanceof Error ? err.message : 'Unknown error' },
        { status: 500, headers }
      );
    }
  }
};