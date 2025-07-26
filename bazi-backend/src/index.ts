// src/index.ts
interface Env {
  DB: D1Database;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);
    console.log(`[${request.method}] ${url.pathname}`); // 重要：调试日志

    // CORS 处理
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    // 写入端点
    if (url.pathname === "/write" && request.method === "POST") {
      try {
        const data = await request.json<{
          name: string;
          birth_time: string;
          gender?: string;
          solar_date?: boolean;
        }>();

        if (!data.name || !data.birth_time) {
          return new Response(JSON.stringify({ error: "Missing required fields" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        const result = await env.DB.prepare(
          `INSERT INTO bazi (name, gender, birth_time, solar_date) 
           VALUES (?, ?, ?, ?)`
        )
          .bind(
            data.name,
            data.gender || "unknown",
            data.birth_time,
            data.solar_date ? 1 : 0
          )
          .run();

        return new Response(
          JSON.stringify({ 
            success: true, 
            id: result.meta.last_row_id 
          }),
          {
            headers: { 
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*" 
            },
          }
        );
      } catch (err) {
        return new Response(
          JSON.stringify({ error: err.message }),
          { status: 500 }
        );
      }
    }

    return new Response(
      JSON.stringify({ error: "Not Found" }),
      { status: 404 }
    );
  },
};
