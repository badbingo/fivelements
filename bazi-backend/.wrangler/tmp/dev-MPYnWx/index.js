var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-zmDFkT/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// .wrangler/tmp/bundle-zmDFkT/strip-cf-connecting-ip-header.js
function stripCfConnectingIPHeader(input, init) {
  const request = new Request(input, init);
  request.headers.delete("CF-Connecting-IP");
  return request;
}
__name(stripCfConnectingIPHeader, "stripCfConnectingIPHeader");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    return Reflect.apply(target, thisArg, [
      stripCfConnectingIPHeader.apply(null, argArray)
    ]);
  }
});

// src/index.js
function base64Encode(bytes) {
  return btoa(String.fromCharCode(...bytes)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}
__name(base64Encode, "base64Encode");
function base64Decode(str) {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4)
    str += "=";
  return Uint8Array.from(atob(str), (c) => c.charCodeAt(0));
}
__name(base64Decode, "base64Decode");
var JWT_SECRET = "placeholder_for_local_dev_only";
function generateJWT(payload, secret) {
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = base64Encode(new TextEncoder().encode(JSON.stringify(header)));
  const encodedPayload = base64Encode(new TextEncoder().encode(JSON.stringify(payload)));
  const signature = base64Encode(new TextEncoder().encode(`${encodedHeader}.${encodedPayload}.${secret}`));
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}
__name(generateJWT, "generateJWT");
function verifyJWT(token, secret) {
  try {
    const [encodedHeader, encodedPayload, signature] = token.split(".");
    const expectedSignature = base64Encode(new TextEncoder().encode(`${encodedHeader}.${encodedPayload}.${secret}`));
    if (signature !== expectedSignature) {
      console.log("JWT \u7B7E\u540D\u4E0D\u5339\u914D");
      return null;
    }
    const payloadStr = new TextDecoder().decode(base64Decode(encodedPayload));
    return JSON.parse(payloadStr);
  } catch (err) {
    console.log("JWT \u9A8C\u8BC1\u9519\u8BEF:", err.message);
    return null;
  }
}
__name(verifyJWT, "verifyJWT");
async function hashPassword(password) {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(password));
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(hashPassword, "hashPassword");
async function sendResetEmail(toEmail, emailContent, env) {
  const payload = {
    sender: {
      email: "owenjass@gmail.com",
      name: "\u9EA6\u516B\u5B57"
    },
    to: [{
      email: toEmail
    }],
    subject: "\u91CD\u8BBE\u4F60\u7684\u5BC6\u7801",
    textContent: emailContent
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
    throw new Error(`SendinBlue \u9519\u8BEF\uFF1A${res.status} - ${text}`);
  }
}
__name(sendResetEmail, "sendResetEmail");
async function createD1Session(env) {
  try {
    if (typeof process !== "undefined" && true) {
      console.log("Using mock D1 session token for local development");
      return "mock_session_token_for_local_dev";
    }
    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${env.ACCOUNT_ID}/d1/database/${env.DATABASE_ID}/query/session`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.API_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: "read-replica-session",
        expires_at: new Date(Date.now() + 3600 * 1e3).toISOString()
        // 1小时后过期
      })
    });
    if (!response.ok) {
      throw new Error(`Failed to create session: ${response.status}`);
    }
    const data = await response.json();
    return data.result.session_token;
  } catch (error) {
    console.error("Error creating D1 session:", error);
    throw error;
  }
}
__name(createD1Session, "createD1Session");
var src_default = {
  async fetch(request, env, ctx) {
    let db = env.DB;
    const sessionToken = await createD1Session(env).catch(() => null);
    if (sessionToken) {
      db = env.DB.withSession(sessionToken);
    }
    const { method } = request;
    const url = new URL(request.url);
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Credentials": "true"
    };
    if (method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }
    if (url.pathname === "/api/register" && method === "POST") {
      const { name, email, password } = await request.json();
      const existingUser = await db.prepare(`SELECT * FROM users WHERE name = ? OR email = ?`).bind(name, email).first();
      if (existingUser) {
        return new Response(JSON.stringify({ error: "\u7528\u6237\u540D\u6216\u90AE\u7BB1\u5DF2\u88AB\u4F7F\u7528" }), {
          status: 409,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
      const hashed = await hashPassword(password);
      const createdAt = Date.now();
      await db.prepare(`
        INSERT INTO users (name, email, password, created_at)
        VALUES (?, ?, ?, ?)
      `).bind(name, email, hashed, createdAt).run();
      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    if (url.pathname === "/api/login" && method === "POST") {
      const { name, password } = await request.json();
      const hashed = await hashPassword(password);
      const user = await db.prepare(`SELECT * FROM users WHERE name = ?`).bind(name).first();
      if (!user || user.password !== hashed) {
        return new Response(JSON.stringify({ error: "\u7528\u6237\u540D\u6216\u5BC6\u7801\u9519\u8BEF" }), {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
      const token = generateJWT({ id: user.id, name: user.name }, env.JWT_SECRET);
      return new Response(JSON.stringify({ token }), {
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    if (url.pathname === "/api/request-reset" && method === "POST") {
      const { email } = await request.json();
      const user = await db.prepare(`SELECT * FROM users WHERE email = ?`).bind(email).first();
      if (!user) {
        return new Response(JSON.stringify({ success: true }), {
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
      const token = generateJWT({ id: user.id, exp: Math.floor(Date.now() / 1e3) + 600 }, env.JWT_SECRET);
      const link = `https://mybazi.net/system/reset.html?token=${token}`;
      try {
        const emailContent = `\u5C0A\u656C\u7684 ${user.name}\uFF0C

\u70B9\u51FB\u4EE5\u4E0B\u94FE\u63A5\u91CD\u8BBE\u4F60\u7684\u5BC6\u7801\uFF1A

${link}

\u94FE\u63A510\u5206\u949F\u5185\u6709\u6548\u3002`;
        await sendResetEmail(email, emailContent, env);
        return new Response(JSON.stringify({ success: true }), {
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
    }
    if (url.pathname === "/api/reset-password" && method === "POST") {
      const { token, newPassword } = await request.json();
      const payload = verifyJWT(token);
      if (!payload || payload.exp < Math.floor(Date.now() / 1e3)) {
        return new Response(JSON.stringify({ error: "\u94FE\u63A5\u5DF2\u8FC7\u671F\u6216\u65E0\u6548" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
      const hashed = await hashPassword(newPassword);
      await db.prepare(`UPDATE users SET password = ? WHERE id = ?`).bind(hashed, payload.id).run();
      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    if (url.pathname === "/api/users/balance" && method === "GET") {
      try {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
          return new Response(JSON.stringify({ error: "\u672A\u6388\u6743" }), { status: 401, headers: corsHeaders });
        }
        const token = authHeader.split(" ")[1];
        const payload = verifyJWT(token, env.JWT_SECRET);
        if (!payload || !payload.id) {
          return new Response(JSON.stringify({ error: "\u65E0\u6548\u7684\u7528\u6237\u4FE1\u606F" }), { status: 401, headers: corsHeaders });
        }
        const user = await db.prepare(`SELECT balance FROM users WHERE id = ?`).bind(payload.id).first();
        if (!user) {
          return new Response(JSON.stringify({ error: "\u7528\u6237\u4E0D\u5B58\u5728" }), { status: 404, headers: corsHeaders });
        }
        return new Response(JSON.stringify({ balance: user.balance }), {
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
    }
    if (url.pathname === "/api/user/daily-usage" && method === "GET") {
      try {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
          return new Response(JSON.stringify({ error: "\u672A\u6388\u6743" }), {
            status: 401,
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        }
        const token = authHeader.split(" ")[1];
        const payload = verifyJWT(token, env.JWT_SECRET);
        if (!payload?.id) {
          return new Response(JSON.stringify({ error: "\u65E0\u6548\u4EE4\u724C" }), {
            status: 401,
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        }
        const user = await db.prepare(
          `SELECT daily_usage_count, last_usage_date FROM users WHERE id = ?`
        ).bind(payload.id).first();
        if (!user) {
          return new Response(JSON.stringify({ error: "\u7528\u6237\u4E0D\u5B58\u5728" }), {
            status: 404,
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        }
        const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
        let dailyUsageCount = user.daily_usage_count || 0;
        if (user.last_usage_date !== today) {
          dailyUsageCount = 0;
          await db.prepare(
            `UPDATE users SET daily_usage_count = 0, last_usage_date = ? WHERE id = ?`
          ).bind(today, payload.id).run();
        }
        return new Response(JSON.stringify({
          dailyUsageCount,
          lastUsageDate: today
        }), {
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      } catch (error) {
        console.error("\u83B7\u53D6\u6BCF\u65E5\u4F7F\u7528\u6B21\u6570\u9519\u8BEF:", error);
        return new Response(JSON.stringify({
          error: "\u83B7\u53D6\u4F7F\u7528\u6B21\u6570\u5931\u8D25",
          message: error.message
        }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
    }
    if (url.pathname === "/api/user/update-daily-usage" && method === "POST") {
      try {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
          return new Response(JSON.stringify({ error: "\u672A\u6388\u6743" }), {
            status: 401,
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        }
        const token = authHeader.split(" ")[1];
        const payload = verifyJWT(token, env.JWT_SECRET);
        if (!payload?.id) {
          return new Response(JSON.stringify({ error: "\u65E0\u6548\u4EE4\u724C" }), {
            status: 401,
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        }
        const { dailyUsageCount } = await request.json();
        if (typeof dailyUsageCount !== "number" || dailyUsageCount < 0) {
          return new Response(JSON.stringify({ error: "\u4F7F\u7528\u6B21\u6570\u65E0\u6548" }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        }
        const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
        const result = await db.prepare(
          `UPDATE users SET daily_usage_count = ?, last_usage_date = ? WHERE id = ?`
        ).bind(dailyUsageCount, today, payload.id).run();
        if (!result.success) {
          throw new Error("\u6570\u636E\u5E93\u66F4\u65B0\u5931\u8D25");
        }
        return new Response(JSON.stringify({
          success: true,
          dailyUsageCount,
          lastUsageDate: today,
          message: "\u4F7F\u7528\u6B21\u6570\u66F4\u65B0\u6210\u529F"
        }), {
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      } catch (error) {
        console.error("\u66F4\u65B0\u6BCF\u65E5\u4F7F\u7528\u6B21\u6570\u9519\u8BEF:", error);
        return new Response(JSON.stringify({
          success: false,
          error: "\u66F4\u65B0\u4F7F\u7528\u6B21\u6570\u5931\u8D25",
          message: error.message
        }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
    }
    if (url.pathname === "/api/user/deduct" && method === "POST") {
      if (url.pathname === "/api/pay_with_balance" && method === "POST") {
        try {
          const authHeader = request.headers.get("Authorization");
          if (!authHeader?.startsWith("Bearer ")) {
            return new Response(JSON.stringify({ error: "\u672A\u6388\u6743" }), {
              status: 401,
              headers: { "Content-Type": "application/json", ...corsHeaders }
            });
          }
          const token = authHeader.split(" ")[1];
          const payload = verifyJWT(token, env.JWT_SECRET);
          if (!payload?.id) {
            return new Response(JSON.stringify({ error: "\u65E0\u6548\u4EE4\u724C" }), {
              status: 401,
              headers: { "Content-Type": "application/json", ...corsHeaders }
            });
          }
          const { amount, service } = await request.json();
          if (!amount || amount <= 0 || !service) {
            return new Response(JSON.stringify({ error: "\u53C2\u6570\u65E0\u6548" }), {
              status: 400,
              headers: { "Content-Type": "application/json", ...corsHeaders }
            });
          }
          const user = await db.prepare(
            `SELECT id, balance FROM users WHERE id = ?`
          ).bind(payload.id).first();
          if (!user) {
            return new Response(JSON.stringify({ error: "\u7528\u6237\u4E0D\u5B58\u5728" }), {
              status: 404,
              headers: { "Content-Type": "application/json", ...corsHeaders }
            });
          }
          if (user.balance < amount) {
            return new Response(JSON.stringify({
              error: "\u4F59\u989D\u4E0D\u8DB3",
              currentBalance: user.balance,
              requiredAmount: amount
            }), {
              status: 400,
              headers: { "Content-Type": "application/json", ...corsHeaders }
            });
          }
          const transactionId = crypto.randomUUID();
          const timestamp = Math.floor(Date.now() / 1e3);
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
              `\u670D\u52A1\u6263\u8D39: ${service}`,
              timestamp
            )
          ]);
          if (!batchResult.every((r) => r.success)) {
            console.error("\u6263\u8D39\u6279\u91CF\u64CD\u4F5C\u5931\u8D25:", batchResult);
            throw new Error("\u6570\u636E\u5E93\u64CD\u4F5C\u5931\u8D25");
          }
          const updatedUser = await db.prepare(
            `SELECT balance FROM users WHERE id = ?`
          ).bind(payload.id).first();
          return new Response(JSON.stringify({
            success: true,
            transactionId,
            newBalance: updatedUser.balance,
            message: "\u652F\u4ED8\u6210\u529F"
          }), {
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        } catch (error) {
          console.error("\u652F\u4ED8\u9519\u8BEF:", error);
          return new Response(JSON.stringify({
            success: false,
            error: "\u652F\u4ED8\u5904\u7406\u5931\u8D25",
            message: "\u7CFB\u7EDF\u5F02\u5E38\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5"
          }), {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        }
      }
      try {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
          return new Response(JSON.stringify({ error: "\u672A\u6388\u6743" }), {
            status: 401,
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        }
        const token = authHeader.split(" ")[1];
        const payload = verifyJWT(token, env.JWT_SECRET);
        if (!payload?.id) {
          return new Response(JSON.stringify({ error: "\u65E0\u6548\u4EE4\u724C" }), {
            status: 401,
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        }
        const { amount, reason } = await request.json();
        if (!amount || amount <= 0) {
          return new Response(JSON.stringify({ error: "\u6263\u8D39\u91D1\u989D\u65E0\u6548" }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        }
        const user = await db.prepare(
          `SELECT id, balance FROM users WHERE id = ?`
        ).bind(payload.id).first();
        if (!user) {
          return new Response(JSON.stringify({ error: "\u7528\u6237\u4E0D\u5B58\u5728" }), {
            status: 404,
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        }
        if (user.balance < amount) {
          return new Response(JSON.stringify({
            error: "\u4F59\u989D\u4E0D\u8DB3",
            currentBalance: user.balance,
            requiredAmount: amount
          }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        }
        const transactionId = crypto.randomUUID();
        const timestamp = Math.floor(Date.now() / 1e3);
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
            reason || "AI\u89E3\u5366\u5206\u6790",
            timestamp
          )
        ]);
        if (!batchResult.every((r) => r.success)) {
          console.error("\u6263\u8D39\u6279\u91CF\u64CD\u4F5C\u5931\u8D25:", batchResult);
          throw new Error("\u6570\u636E\u5E93\u64CD\u4F5C\u5931\u8D25");
        }
        const updatedUser = await db.prepare(
          `SELECT balance FROM users WHERE id = ?`
        ).bind(payload.id).first();
        return new Response(JSON.stringify({
          success: true,
          transactionId,
          newBalance: updatedUser.balance,
          message: "\u6263\u8D39\u6210\u529F"
        }), {
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      } catch (error) {
        console.error("\u6263\u8D39\u9519\u8BEF:", error);
        return new Response(JSON.stringify({
          success: false,
          error: "\u6263\u8D39\u5904\u7406\u5931\u8D25",
          message: "\u7CFB\u7EDF\u5F02\u5E38\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5"
        }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
    }
    if (url.pathname === "/api/user/refund" && method === "POST") {
      try {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
          return new Response(JSON.stringify({ error: "\u672A\u6388\u6743" }), {
            status: 401,
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        }
        const token = authHeader.split(" ")[1];
        const payload = verifyJWT(token, env.JWT_SECRET);
        if (!payload?.id) {
          return new Response(JSON.stringify({ error: "\u65E0\u6548\u4EE4\u724C" }), {
            status: 401,
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        }
        const { amount, reason } = await request.json();
        if (!amount || amount <= 0) {
          return new Response(JSON.stringify({ error: "\u9000\u6B3E\u91D1\u989D\u65E0\u6548" }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        }
        const user = await db.prepare(
          `SELECT id, balance FROM users WHERE id = ?`
        ).bind(payload.id).first();
        if (!user) {
          return new Response(JSON.stringify({ error: "\u7528\u6237\u4E0D\u5B58\u5728" }), {
            status: 404,
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        }
        const transactionId = crypto.randomUUID();
        const timestamp = Math.floor(Date.now() / 1e3);
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
            reason || "AI\u89E3\u5366\u5206\u6790\u5931\u8D25\u9000\u6B3E",
            timestamp
          )
        ]);
        if (!batchResult.every((r) => r.success)) {
          console.error("\u9000\u6B3E\u6279\u91CF\u64CD\u4F5C\u5931\u8D25:", batchResult);
          throw new Error("\u6570\u636E\u5E93\u64CD\u4F5C\u5931\u8D25");
        }
        const updatedUser = await db.prepare(
          `SELECT balance FROM users WHERE id = ?`
        ).bind(payload.id).first();
        return new Response(JSON.stringify({
          success: true,
          transactionId,
          newBalance: updatedUser.balance,
          message: "\u9000\u6B3E\u6210\u529F"
        }), {
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      } catch (error) {
        console.error("\u9000\u6B3E\u9519\u8BEF:", error);
        return new Response(JSON.stringify({
          success: false,
          error: "\u9000\u6B3E\u5904\u7406\u5931\u8D25",
          message: "\u7CFB\u7EDF\u5F02\u5E38\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5"
        }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
    }
    if (url.pathname === "/api/user/recharge" && method === "POST") {
      try {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
          return new Response(JSON.stringify({ error: "\u672A\u6388\u6743" }), {
            status: 401,
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        }
        const token = authHeader.split(" ")[1];
        const payload = verifyJWT(token, env.JWT_SECRET);
        if (!payload?.id) {
          return new Response(JSON.stringify({ error: "\u65E0\u6548\u4EE4\u724C" }), {
            status: 401,
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        }
        const { amount, paymentMethod } = await request.json();
        if (!amount || amount <= 0) {
          return new Response(JSON.stringify({ error: "\u5145\u503C\u91D1\u989D\u65E0\u6548" }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        }
        const user = await db.prepare(
          `SELECT id, balance FROM users WHERE id = ?`
        ).bind(payload.id).first();
        if (!user) {
          return new Response(JSON.stringify({ error: "\u7528\u6237\u4E0D\u5B58\u5728" }), {
            status: 404,
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        }
        const transactionId = crypto.randomUUID();
        const orderId = `R${Date.now()}${Math.floor(Math.random() * 1e6)}`;
        const timestamp = Math.floor(Date.now() / 1e3);
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
            `\u8D26\u6237\u5145\u503C - ${paymentMethod || "\u672A\u77E5\u652F\u4ED8\u65B9\u5F0F"}`,
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
            paymentMethod || "unknown",
            timestamp
          )
        ]);
        if (!batchResult.every((r) => r.success)) {
          console.error("\u5145\u503C\u6279\u91CF\u64CD\u4F5C\u5931\u8D25:", batchResult);
          throw new Error("\u6570\u636E\u5E93\u64CD\u4F5C\u5931\u8D25");
        }
        const updatedUser = await db.prepare(
          `SELECT balance FROM users WHERE id = ?`
        ).bind(payload.id).first();
        return new Response(JSON.stringify({
          success: true,
          transactionId,
          orderId,
          newBalance: updatedUser.balance,
          message: "\u5145\u503C\u6210\u529F"
        }), {
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      } catch (error) {
        console.error("\u5145\u503C\u9519\u8BEF:", error);
        return new Response(JSON.stringify({
          success: false,
          error: "\u5145\u503C\u5904\u7406\u5931\u8D25",
          message: "\u7CFB\u7EDF\u5F02\u5E38\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5"
        }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
    }
    if (url.pathname === "/api/payments/balance" && method === "POST") {
      try {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
          return new Response(JSON.stringify({ error: "\u672A\u6388\u6743" }), {
            status: 401,
            headers: corsHeaders
          });
        }
        const token = authHeader.split(" ")[1];
        const payload = verifyJWT(token, env.JWT_SECRET);
        if (!payload?.id) {
          return new Response(JSON.stringify({ error: "\u65E0\u6548\u4EE4\u724C" }), {
            status: 401,
            headers: corsHeaders
          });
        }
        const { wishId, amount } = await request.json();
        if (!wishId || !amount) {
          return new Response(JSON.stringify({ error: "\u53C2\u6570\u7F3A\u5931" }), {
            status: 400,
            headers: corsHeaders
          });
        }
        const wish = await db.prepare(
          `SELECT id, user_id FROM wishes WHERE id = ?`
        ).bind(wishId).first();
        if (!wish) {
          return new Response(JSON.stringify({ error: "\u613F\u671B\u4E0D\u5B58\u5728" }), {
            status: 404,
            headers: corsHeaders
          });
        }
        const user = await db.prepare(
          `SELECT id, balance FROM users WHERE id = ?`
        ).bind(payload.id).first();
        if (user.balance < amount) {
          return new Response(JSON.stringify({
            error: "\u4F59\u989D\u4E0D\u8DB3",
            currentBalance: user.balance,
            requiredAmount: amount
          }), {
            status: 400,
            headers: corsHeaders
          });
        }
        const transactionId = crypto.randomUUID();
        const timestamp = Math.floor(Date.now() / 1e3);
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
            `\u613F\u671B\u8FD8\u613F\u652F\u4ED8 - \u613F\u671BID: ${wishId}`,
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
        if (!batchResult.every((r) => r.success)) {
          console.error("\u6279\u91CF\u64CD\u4F5C\u5931\u8D25:", batchResult);
          throw new Error("\u6570\u636E\u5E93\u64CD\u4F5C\u5931\u8D25");
        }
        const updatedUser = await db.prepare(
          `SELECT balance FROM users WHERE id = ?`
        ).bind(payload.id).first();
        return new Response(JSON.stringify({
          success: true,
          transactionId,
          newBalance: updatedUser.balance,
          message: "\u652F\u4ED8\u6210\u529F"
        }), {
          headers: corsHeaders
        });
      } catch (error) {
        console.error("\u4F59\u989D\u652F\u4ED8\u9519\u8BEF:", error);
        if (error.message === "\u6570\u636E\u5E93\u64CD\u4F5C\u5931\u8D25") {
          return new Response(JSON.stringify({
            success: false,
            error: "\u652F\u4ED8\u5904\u7406\u5931\u8D25",
            message: "\u7CFB\u7EDF\u7E41\u5FD9\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5"
          }), {
            status: 500,
            headers: corsHeaders
          });
        }
        return new Response(JSON.stringify({
          success: false,
          error: "\u652F\u4ED8\u5904\u7406\u5931\u8D25",
          message: "\u7CFB\u7EDF\u5F02\u5E38\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5"
        }), {
          status: 500,
          headers: corsHeaders
        });
      }
    }
    if (url.pathname === "/api/wishes/status" && method === "GET") {
      try {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return new Response(JSON.stringify({ error: "\u672A\u63D0\u4F9B\u8BA4\u8BC1\u4EE4\u724C" }), {
            status: 401,
            headers: corsHeaders
          });
        }
        const token = authHeader.substring(7);
        const payload = verifyJWT(token, JWT_SECRET);
        if (!payload) {
          return new Response(JSON.stringify({ error: "\u65E0\u6548\u7684\u8BA4\u8BC1\u4EE4\u724C" }), {
            status: 401,
            headers: corsHeaders
          });
        }
        const wishId = url.searchParams.get("wishId");
        if (!wishId) {
          return new Response(JSON.stringify({ error: "\u7F3A\u5C11\u613F\u671BID\u53C2\u6570" }), {
            status: 400,
            headers: corsHeaders
          });
        }
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
        console.error("\u68C0\u67E5\u613F\u671B\u72B6\u6001\u9519\u8BEF:", error);
        return new Response(JSON.stringify({
          error: "\u68C0\u67E5\u613F\u671B\u72B6\u6001\u5931\u8D25",
          message: error.message
        }), {
          status: 500,
          headers: corsHeaders
        });
      }
    }
    if (url.pathname === "/api/recharge/complete" && method === "GET") {
      const orderId = new URL(request.url).searchParams.get("orderId");
      const order = await db.prepare(`SELECT * FROM recharge_orders WHERE order_id = ?`).bind(orderId).first();
      if (!order) {
        return new Response(JSON.stringify({ error: "\u8BA2\u5355\u65E0\u6548" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
      if (order.status === "completed") {
        return new Response(JSON.stringify({ success: true }), {
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      } else if (order.status !== "pending" && order.status !== "paid") {
        return new Response(JSON.stringify({ error: "\u8BA2\u5355\u72B6\u6001\u65E0\u6548" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
      await db.prepare(`UPDATE recharge_orders SET status = 'completed' WHERE order_id = ?`).bind(orderId).run();
      if (order.status === "pending") {
        await db.prepare(`UPDATE users SET balance = balance + ? WHERE id = ?`).bind(order.amount, order.user_id).run();
        await db.prepare(`
        INSERT INTO transactions (user_id, amount, type, description, order_id)
        VALUES (?, ?, 'recharge', '\u8D26\u6237\u5145\u503C', ?)
      `).bind(order.user_id, order.amount, orderId).run();
        await db.prepare(`
        INSERT INTO payment_notifications (order_id, amount, payment_method, status)
        VALUES (?, ?, ?, 'completed')
      `).bind(orderId, order.amount, order.payment_method).run();
      }
      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    if (url.pathname === "/api/wishes") {
      try {
        if (method === "POST") {
          const data = await request.json();
          const {
            user_name,
            bazi,
            content,
            type,
            visibility,
            birth_date,
            birth_time,
            user_id,
            solar_date
          } = data;
          await db.prepare(`
            INSERT INTO wishes (user_name, bazi, content, type, visibility, birth_date, birth_time, user_id, solar_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(user_name, bazi, content, type, visibility, birth_date, birth_time, user_id, solar_date).run();
          return new Response(JSON.stringify({ success: true }), {
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        }
        if (method === "GET") {
          const visibility = url.searchParams.get("visibility");
          const sort = url.searchParams.get("sort") || "newest";
          let query = `SELECT * FROM wishes`;
          let queryParams = [];
          if (visibility) {
            query += ` WHERE visibility = ?`;
            queryParams.push(visibility);
          }
          let orderBy = "ORDER BY id DESC";
          if (sort === "oldest") {
            orderBy = "ORDER BY id ASC";
          } else if (sort === "most") {
            orderBy = "ORDER BY blessings DESC";
          } else if (sort === "least") {
            orderBy = "ORDER BY blessings ASC";
          }
          query += ` ${orderBy}`;
          const { results } = visibility ? await db.prepare(query).bind(visibility).all() : await db.prepare(query).all();
          return new Response(JSON.stringify({ data: results }), {
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        }
        if (method === "DELETE") {
          const pathParts = url.pathname.split("/");
          const id = pathParts[pathParts.length - 1];
          if (!id || id === "wishes") {
            return new Response(JSON.stringify({ error: "\u7F3A\u5C11\u613F\u671BID" }), {
              status: 400,
              headers: { "Content-Type": "application/json", ...corsHeaders }
            });
          }
          try {
            const wish = await db.prepare(`SELECT * FROM wishes WHERE id = ?`).bind(id).first();
            if (!wish) {
              return new Response(JSON.stringify({ error: "\u613F\u671B\u4E0D\u5B58\u5728" }), {
                status: 404,
                headers: { "Content-Type": "application/json", ...corsHeaders }
              });
            }
            await db.prepare(`DELETE FROM bless_records WHERE wish_id = ?`).bind(id).run();
            await db.prepare(`DELETE FROM wishes WHERE id = ?`).bind(id).run();
            return new Response(JSON.stringify({ success: true }), {
              headers: { "Content-Type": "application/json", ...corsHeaders }
            });
          } catch (err) {
            return new Response(JSON.stringify({ error: err.message }), {
              status: 500,
              headers: { "Content-Type": "application/json", ...corsHeaders }
            });
          }
        }
        return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
      } catch (err) {
        return new Response(JSON.stringify({ error: "Internal Error: " + err.message }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
    }
    if (url.pathname === "/api/curse") {
      try {
        if (method === "POST") {
          const data = await request.json();
          const {
            user_name,
            target_description,
            content,
            type,
            visibility,
            user_id,
            solar_date
          } = data;
          await db.prepare(`
            INSERT INTO curse (user_name, target_description, content, type, visibility, user_id, solar_date)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `).bind(user_name, target_description, content, type, visibility, user_id, solar_date).run();
          return new Response(JSON.stringify({ success: true }), {
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        }
        if (method === "GET") {
          const visibility = url.searchParams.get("visibility") || "public";
          const sort = url.searchParams.get("sort") || "newest";
          let query = `SELECT * FROM curse WHERE visibility = ?`;
          let orderBy = "ORDER BY id DESC";
          if (sort === "oldest") {
            orderBy = "ORDER BY id ASC";
          } else if (sort === "most") {
            orderBy = "ORDER BY blessings DESC";
          } else if (sort === "least") {
            orderBy = "ORDER BY blessings ASC";
          }
          query += ` ${orderBy}`;
          const { results } = await db.prepare(query).bind(visibility).all();
          return new Response(JSON.stringify({ data: results }), {
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        }
        if (method === "DELETE") {
          const pathParts = url.pathname.split("/");
          const id = pathParts[pathParts.length - 1];
          if (!id || id === "curse") {
            return new Response(JSON.stringify({ error: "\u7F3A\u5C11\u8BC5\u5492ID" }), {
              status: 400,
              headers: { "Content-Type": "application/json", ...corsHeaders }
            });
          }
          try {
            const curse = await db.prepare(`SELECT * FROM curse WHERE id = ?`).bind(id).first();
            if (!curse) {
              return new Response(JSON.stringify({ error: "\u8BC5\u5492\u4E0D\u5B58\u5728" }), {
                status: 404,
                headers: { "Content-Type": "application/json", ...corsHeaders }
              });
            }
            await db.prepare(`DELETE FROM curse_records WHERE curse_id = ?`).bind(id).run();
            await db.prepare(`DELETE FROM curse WHERE id = ?`).bind(id).run();
            return new Response(JSON.stringify({ success: true }), {
              headers: { "Content-Type": "application/json", ...corsHeaders }
            });
          } catch (err) {
            return new Response(JSON.stringify({ error: err.message }), {
              status: 500,
              headers: { "Content-Type": "application/json", ...corsHeaders }
            });
          }
        }
        return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
      } catch (err) {
        return new Response(JSON.stringify({ error: "Internal Error: " + err.message }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
    }
    if (url.pathname.startsWith("/api/wishes/") && method === "DELETE") {
      const id = url.pathname.split("/").pop();
      try {
        const authHeader = request.headers.get("Authorization");
        if (authHeader && authHeader.startsWith("Bearer ")) {
          const token = authHeader.substring(7);
          const decoded = verifyJWT(token, env.JWT_SECRET);
          if (!decoded) {
            return new Response(JSON.stringify({ error: "\u65E0\u6548\u7684\u8BA4\u8BC1\u4EE4\u724C" }), {
              status: 401,
              headers: { "Content-Type": "application/json", ...corsHeaders }
            });
          }
          const wish = await db.prepare(`SELECT * FROM wishes WHERE id = ? AND user_id = ?`).bind(id, decoded.id).first();
          if (!wish) {
            return new Response(JSON.stringify({ error: "\u613F\u671B\u4E0D\u5B58\u5728\u6216\u65E0\u6743\u9650\u5220\u9664" }), {
              status: 404,
              headers: { "Content-Type": "application/json", ...corsHeaders }
            });
          }
        } else {
          const wish = await db.prepare(`SELECT * FROM wishes WHERE id = ?`).bind(id).first();
          if (!wish) {
            return new Response(JSON.stringify({ error: "\u613F\u671B\u4E0D\u5B58\u5728" }), {
              status: 404,
              headers: { "Content-Type": "application/json", ...corsHeaders }
            });
          }
        }
        await db.prepare(`DELETE FROM bless_records WHERE wish_id = ?`).bind(id).run();
        await db.prepare(`DELETE FROM fulfillments WHERE wish_id = ?`).bind(id).run();
        await db.prepare(`DELETE FROM wishes WHERE id = ?`).bind(id).run();
        return new Response(JSON.stringify({ success: true }), {
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
    }
    if (url.pathname === "/api/user/wishes" && method === "GET") {
      try {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return new Response(JSON.stringify({ error: "\u672A\u6388\u6743" }), {
            status: 401,
            headers: corsHeaders
          });
        }
        const token = authHeader.split(" ")[1];
        const payload = verifyJWT(token, env.JWT_SECRET);
        if (!payload || !payload.id) {
          return new Response(JSON.stringify({ error: "\u65E0\u6548\u4EE4\u724C" }), {
            status: 401,
            headers: corsHeaders
          });
        }
        const wishes = await db.prepare(
          `SELECT * FROM wishes WHERE user_id = ? ORDER BY created_at DESC`
        ).bind(payload.id).all();
        return new Response(JSON.stringify(wishes.results || []), {
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          error: "\u670D\u52A1\u5668\u9519\u8BEF",
          message: error.message
        }), {
          status: 500,
          headers: corsHeaders
        });
      }
    }
    if (url.pathname === "/api/stats" && method === "GET") {
      try {
        const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
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
        const responseData = {
          today: {
            newWishes: newWishesResult.results[0]?.count || 0,
            blessings: blessingsResult.results[0]?.total || 0,
            fulfilled: fulfilledResult.results[0]?.count || 0
            // 现在会返回所有已还愿数量
          },
          distribution: {}
        };
        distributionResult.results.forEach(({ type, count }) => {
          responseData.distribution[type] = count;
        });
        return new Response(JSON.stringify(responseData), {
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          }
        });
      } catch (error) {
        console.error("\u7EDF\u8BA1\u63A5\u53E3\u9519\u8BEF:", error);
        return new Response(JSON.stringify({
          error: "\u83B7\u53D6\u7EDF\u8BA1\u5931\u8D25",
          details: error.message
        }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
    }
    if (url.pathname.startsWith("/api/bless/") && method === "POST") {
      try {
        const parts = url.pathname.split("/");
        const wishId = parts[parts.length - 1];
        const authHeader = request.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
          return new Response(JSON.stringify({ error: "\u672A\u6388\u6743" }), { status: 401, headers: corsHeaders });
        }
        const token = authHeader.split(" ")[1];
        const payload = verifyJWT(token, env.JWT_SECRET);
        if (!payload || !payload.id) {
          return new Response(JSON.stringify({ error: "\u65E0\u6548\u7684\u7528\u6237\u4FE1\u606F" }), { status: 401, headers: corsHeaders });
        }
        const userId = payload.id;
        const wish = await db.prepare(`SELECT * FROM wishes WHERE id = ?`).bind(wishId).first();
        if (!wish) {
          return new Response(JSON.stringify({ error: "\u613F\u671B\u672A\u627E\u5230" }), { status: 404, headers: corsHeaders });
        }
        const totalBlessings = await db.prepare(`SELECT SUM(count) as total FROM bless_records WHERE wish_id = ?`).bind(wishId).first();
        const currentBlessings = totalBlessings?.total || 0;
        if (currentBlessings >= 25) {
          return new Response(JSON.stringify({
            success: false,
            error: "\u8BE5\u613F\u671B\u5DF2\u8FBE\u5230\u6700\u9AD8\u52A0\u6301\u6B21\u6570(25\u6B21)",
            code: 400
          }), {
            status: 400,
            headers: corsHeaders
          });
        }
        const oneHourAgo = Date.now() - 36e5;
        const recentBless = await db.prepare(
          `SELECT last_blessed_at FROM bless_records WHERE wish_id = ? AND user_id = ? AND last_blessed_at > ? LIMIT 1`
        ).bind(wishId, userId, oneHourAgo).first();
        if (recentBless) {
          const nextBlessTime = new Date(recentBless.last_blessed_at + 36e5);
          return new Response(JSON.stringify({
            success: false,
            error: "\u6BCF\u5C0F\u65F6\u53EA\u80FD\u5BF9\u540C\u4E00\u613F\u671B\u52A0\u6301\u4E00\u6B21",
            nextBlessTime: nextBlessTime.toISOString(),
            code: 429
          }), {
            status: 429,
            headers: corsHeaders
          });
        }
        const now = Date.now();
        const existingBless = await db.prepare(
          `SELECT count FROM bless_records WHERE wish_id = ? AND user_id = ?`
        ).bind(wishId, userId).first();
        if (existingBless) {
          await db.prepare(`UPDATE bless_records SET count = count + 1, last_blessed_at = ? WHERE wish_id = ? AND user_id = ?`).bind(now, wishId, userId).run();
        } else {
          await db.prepare(`INSERT INTO bless_records (wish_id, user_id, count, first_blessed_at, last_blessed_at) VALUES (?, ?, 1, ?, ?)`).bind(wishId, userId, now, now).run();
        }
        const newTotalBlessings = Math.min(currentBlessings + 1, 25);
        const level = newTotalBlessings >= 20 ? 5 : newTotalBlessings >= 15 ? 4 : newTotalBlessings >= 10 ? 3 : newTotalBlessings >= 5 ? 2 : 1;
        await db.prepare(`UPDATE wishes SET blessings = ?, level = ? WHERE id = ?`).bind(newTotalBlessings, level, wishId).run();
        return new Response(JSON.stringify({
          success: true,
          blessings: newTotalBlessings,
          level,
          isMax: newTotalBlessings >= 25
          // 新增字段，表示是否达到上限
        }), {
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      } catch (err) {
        return new Response(JSON.stringify({
          success: false,
          error: "\u670D\u52A1\u5668\u9519\u8BEF: " + err.message,
          stack: err.stack
        }), {
          status: 500,
          headers: corsHeaders
        });
      }
    }
    if (url.pathname.startsWith("/api/wishes/") && url.pathname.endsWith("/fulfill") && method === "POST") {
      try {
        const wishId = url.pathname.split("/")[3];
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return new Response(JSON.stringify({ error: "\u672A\u6388\u6743" }), {
            status: 401,
            headers: corsHeaders
          });
        }
        const token = authHeader.split(" ")[1];
        let payload;
        try {
          payload = verifyJWT(token);
        } catch (e) {
          return new Response(JSON.stringify({ error: "\u65E0\u6548\u4EE4\u724C" }), {
            status: 401,
            headers: corsHeaders
          });
        }
        await db.prepare(
          `UPDATE wishes 
              SET is_fulfilled = 1, 
                  fulfilled_at = strftime('%s','now') 
              WHERE id = ?`
        ).bind(wishId).run();
        return new Response(JSON.stringify({
          success: true,
          message: "\u8FD8\u613F\u72B6\u6001\u5DF2\u66F4\u65B0"
        }), {
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          success: false,
          error: "\u670D\u52A1\u5668\u9519\u8BEF: " + error.message,
          code: 500
        }), {
          status: 500,
          headers: corsHeaders
        });
      }
    }
    if (url.pathname === "/api/wishes/fulfill" && method === "POST") {
      try {
        console.log("[API] \u6536\u5230\u8FD8\u613F\u8BF7\u6C42");
        const { wishId, amount, paymentMethod } = await request.json();
        if (!wishId || !amount || !paymentMethod) {
          return new Response(JSON.stringify({
            success: false,
            error: "MISSING_PARAMS"
          }), { status: 400, headers: corsHeaders });
        }
        const timestamp = Math.floor(Date.now() / 1e3);
        const result = await db.prepare(
          `INSERT INTO fulfillments 
            (wish_id, amount, payment_method, created_at)
            VALUES (?, ?, ?, ?)`
        ).bind(wishId, amount, paymentMethod, timestamp).run();
        if (!result.success) {
          throw new Error("\u6570\u636E\u5E93\u64CD\u4F5C\u5931\u8D25");
        }
        return new Response(JSON.stringify({
          success: true,
          fulfillmentId: result.meta.last_row_id
        }), { headers: corsHeaders });
      } catch (error) {
        return new Response(JSON.stringify({
          success: false,
          error: "SERVER_ERROR",
          message: error.message
        }), { status: 500, headers: corsHeaders });
      }
    }
    if (url.pathname === "/api/payments/verify" && method === "POST") {
      try {
        const { orderId, wishId, amount } = await request.json();
        const verifyResponse = await fetch(`https://zpayz.cn/api/order/query?orderId=${orderId}`, {
          headers: { "Authorization": "PID " + env.ZPAY_KEY }
        });
        const { status, actualAmount } = await verifyResponse.json();
        if (status !== "paid") {
          return new Response(JSON.stringify({
            success: false,
            error: "PAYMENT_NOT_COMPLETED"
          }), { status: 400, headers: corsHeaders });
        }
        if (parseFloat(actualAmount) !== parseFloat(amount)) {
          return new Response(JSON.stringify({
            success: false,
            error: "AMOUNT_MISMATCH"
          }), { status: 400, headers: corsHeaders });
        }
        const fulfillmentResult = await db.prepare(
          `INSERT INTO fulfillments 
            (wish_id, amount, payment_method, created_at)
            VALUES (?, ?, ?, ?)`
        ).bind(wishId, amount, "zpay", Math.floor(Date.now() / 1e3)).run();
        if (!fulfillmentResult.success) {
          throw new Error("\u8BB0\u5F55\u8FD8\u613F\u5931\u8D25");
        }
        if (url.pathname === "/api/recharge" && method === "POST") {
          try {
            const authHeader = request.headers.get("Authorization");
            if (!authHeader || !authHeader.startsWith("Bearer ")) {
              return new Response(JSON.stringify({ error: "\u672A\u6388\u6743" }), {
                status: 401,
                headers: corsHeaders
              });
            }
            const token = authHeader.split(" ")[1];
            const payload = verifyJWT(token, env.JWT_SECRET);
            if (!payload || !payload.id) {
              return new Response(JSON.stringify({ error: "\u65E0\u6548\u4EE4\u724C" }), {
                status: 401,
                headers: corsHeaders
              });
            }
            const { amount: amount2, paymentMethod, orderId: orderId2 } = await request.json();
            if (!orderId2) {
              return new Response(JSON.stringify({
                error: "\u7F3A\u5C11\u8BA2\u5355\u53F7",
                code: "MISSING_ORDER_ID"
              }), { status: 400, headers: corsHeaders });
            }
            const verifyResponse2 = await fetch(`https://zpayz.cn/api/order/query?orderId=${orderId2}`, {
              headers: { "Authorization": "PID " + env.ZPAY_KEY }
            });
            const { status: status2, actualAmount: actualAmount2 } = await verifyResponse2.json();
            if (status2 !== "paid") {
              return new Response(JSON.stringify({
                success: false,
                error: "PAYMENT_NOT_COMPLETED"
              }), { status: 400, headers: corsHeaders });
            }
            if (parseFloat(actualAmount2) !== parseFloat(amount2)) {
              return new Response(JSON.stringify({
                success: false,
                error: "AMOUNT_MISMATCH"
              }), { status: 400, headers: corsHeaders });
            }
            const timestamp = Math.floor(Date.now() / 1e3);
            await db.prepare(
              `INSERT INTO recharges 
            (user_id, amount, payment_method, order_id, created_at)
            VALUES (?, ?, ?, ?, ?)`
            ).bind(payload.id, amount2, paymentMethod, orderId2, timestamp).run();
            await db.prepare(
              `UPDATE users SET balance = COALESCE(balance, 0) + ? WHERE id = ?`
            ).bind(amount2, payload.id).run();
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
              headers: { "Content-Type": "application/json", ...corsHeaders }
            });
          } catch (error) {
            return new Response(JSON.stringify({
              success: false,
              error: "SERVER_ERROR",
              message: error.message
            }), { status: 500, headers: corsHeaders });
          }
        }
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
          error: "VERIFICATION_FAILED",
          message: error.message
        }), { status: 500, headers: corsHeaders });
      }
    }
    if (url.pathname === "/api/wishes/check" && method === "GET") {
      try {
        const wishId = url.searchParams.get("wishId");
        const wishExists = await db.prepare(
          `SELECT id FROM wishes WHERE id = ?`
        ).bind(wishId).first();
        if (!wishExists) {
          return new Response(JSON.stringify({
            fulfilled: false,
            exists: false
          }), { headers: corsHeaders });
        }
        return new Response(JSON.stringify({
          fulfilled: false,
          // 始终返回未还愿，允许重复还愿
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
    if (url.pathname === "/api/payments/verify" && method === "GET") {
      const orderId = url.searchParams.get("orderId");
      const zpayResponse = await fetch(`https://zpayz.cn/api/order/query?orderId=${orderId}`, {
        headers: { "Authorization": "PID " + env.ZPAY_KEY }
      });
      const { status, amount } = await zpayResponse.json();
      return new Response(JSON.stringify({
        status: status === "paid" ? "success" : "pending"
      }), { headers: corsHeaders });
    }
    if (url.pathname === "/api/payments/status" && method === "GET") {
      try {
        const wishId = url.searchParams.get("wishId");
        const fulfillment = await db.prepare(
          `SELECT id FROM fulfillments WHERE wish_id = ?`
        ).bind(wishId).first();
        if (fulfillment) {
          return new Response(JSON.stringify({
            status: "success",
            fulfillmentId: fulfillment.id
          }), { headers: corsHeaders });
        }
        return new Response(JSON.stringify({
          status: "pending",
          message: "\u652F\u4ED8\u5904\u7406\u4E2D"
        }), { headers: corsHeaders });
      } catch (error) {
        return new Response(JSON.stringify({
          status: "error",
          message: "\u67E5\u8BE2\u5931\u8D25"
        }), { status: 500, headers: corsHeaders });
      }
    }
    if (url.pathname === "/api/recharge" && method === "POST") {
      try {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return new Response(JSON.stringify({ error: "\u672A\u6388\u6743" }), {
            status: 401,
            headers: corsHeaders
          });
        }
        const token = authHeader.split(" ")[1];
        const payload = verifyJWT(token, env.JWT_SECRET);
        if (!payload || !payload.id) {
          return new Response(JSON.stringify({ error: "\u65E0\u6548\u4EE4\u724C" }), {
            status: 401,
            headers: corsHeaders
          });
        }
        const { amount, paymentMethod } = await request.json();
        const orderId = `R${Date.now()}${Math.floor(Math.random() * 1e3)}`;
        const timestamp = Math.floor(Date.now() / 1e3);
        await db.prepare(
          `INSERT INTO recharges 
          (order_id, user_id, amount, payment_method, created_at)
          VALUES (?, ?, ?, ?, ?)`
        ).bind(orderId, payload.id, amount, paymentMethod, timestamp).run();
        await db.prepare(
          `UPDATE users SET balance = COALESCE(balance, 0) + ? WHERE id = ?`
        ).bind(amount, payload.id).run();
        const user = await db.prepare(
          `SELECT id, name, balance FROM users WHERE id = ?`
        ).bind(payload.id).first();
        return new Response(JSON.stringify({
          success: true,
          orderId,
          // 返回订单号给前端
          user: {
            id: user.id,
            name: user.name,
            balance: user.balance
          }
        }), {
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          success: false,
          error: "SERVER_ERROR",
          message: error.message
        }), { status: 500, headers: corsHeaders });
      }
    }
    if (url.pathname === "/api/recharge/orders" && method === "POST") {
      try {
        const { amount, paymentMethod } = await request.json();
        const authHeader = request.headers.get("Authorization");
        const token = authHeader.split(" ")[1];
        const payload = verifyJWT(token, env.JWT_SECRET);
        const orderId = `R${Date.now()}${Math.floor(Math.random() * 1e3)}`;
        await db.prepare(
          `INSERT INTO recharge_orders 
            (order_id, user_id, amount, payment_method, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?)`
        ).bind(
          orderId,
          payload.id,
          amount,
          paymentMethod,
          "pending",
          Math.floor(Date.now() / 1e3)
        ).run();
        return new Response(JSON.stringify({
          orderId,
          amount,
          paymentMethod
        }), { headers: corsHeaders });
      } catch (error) {
        return new Response(JSON.stringify({
          error: "CREATE_ORDER_FAILED",
          message: error.message
        }), { status: 500, headers: corsHeaders });
      }
    }
    if (url.pathname === "/api/recharge/notify" && method === "POST") {
      try {
        const params = Object.fromEntries(await request.formData());
        const sign = params.sign;
        const sortedParams = Object.keys(params).filter((k) => k !== "sign" && params[k] !== "").sort().map((k) => `${k}=${params[k]}`).join("&");
        const calculatedSign = CryptoJS.MD5(sortedParams + env.ZPAY_KEY).toString();
        if (sign !== calculatedSign) {
          return new Response("FAIL", { status: 400 });
        }
        const order = await db.prepare(
          `SELECT * FROM recharge_orders WHERE order_id = ?`
        ).bind(params.out_trade_no).first();
        if (!order) {
          return new Response("ORDER_NOT_FOUND", { status: 404 });
        }
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
            Math.floor(Date.now() / 1e3)
          ),
          db.prepare(
            `INSERT INTO transactions 
              (user_id, amount, type, reference_id, created_at)
              VALUES (?, ?, 'recharge', ?, ?)`
          ).bind(
            order.user_id,
            params.money,
            params.out_trade_no,
            Math.floor(Date.now() / 1e3)
          )
        ]);
        if (!batchResult.every((r) => r.success)) {
          console.error("\u6570\u636E\u5E93\u66F4\u65B0\u5931\u8D25:", batchResult);
          throw new Error("\u6570\u636E\u5E93\u66F4\u65B0\u5931\u8D25");
        }
        console.log("\u5145\u503C\u6210\u529F\u8BB0\u5F55:", {
          orderId: params.out_trade_no,
          userId: order.user_id,
          amount: params.money,
          balanceUpdated: batchResult[1].success,
          rechargeCreated: batchResult[2].success,
          transactionCreated: batchResult[3].success,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        });
        return new Response("SUCCESS");
      } catch (err) {
        console.error("\u901A\u77E5\u5904\u7406\u5931\u8D25:", err);
        return new Response("ERROR", { status: 500 });
      }
    }
    if (url.pathname === "/api/recharge/status" && method === "GET") {
      const orderId = url.searchParams.get("orderId");
      const order = await db.prepare(
        `SELECT status FROM recharge_orders WHERE order_id = ?`
      ).bind(orderId).first();
      return new Response(JSON.stringify({
        status: order?.status || "not_found"
      }), { headers: corsHeaders });
    }
    if (url.pathname === "/api/user/balance" && method === "GET") {
      const authHeader = request.headers.get("Authorization");
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return new Response(JSON.stringify({ error: "\u672A\u6388\u6743" }), {
          status: 401,
          headers: corsHeaders
        });
      }
      const token = authHeader.split(" ")[1];
      const payload = verifyJWT(token, env.JWT_SECRET);
      if (!payload || !payload.id) {
        return new Response(JSON.stringify({ error: "\u65E0\u6548\u4EE4\u724C" }), {
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
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    return new Response("Not Found", { status: 404, headers: corsHeaders });
  }
};

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-zmDFkT/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-zmDFkT/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof __Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
__name(__Facade_ScheduledController__, "__Facade_ScheduledController__");
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = (request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    };
    #dispatcher = (type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    };
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
