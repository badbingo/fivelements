const http = require('http');
const httpProxy = require('http-proxy-middleware');
const express = require('express');

const app = express();

// 创建代理中间件
const proxy = httpProxy.createProxyMiddleware({
  target: 'http://localhost:8787',
  changeOrigin: true,
  logLevel: 'debug',
  onProxyReq: (proxyReq, req, res) => {
    console.log(`[${new Date().toISOString()}] 代理请求: ${req.method} ${req.url}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`[${new Date().toISOString()}] 代理响应: ${proxyRes.statusCode} ${req.url}`);
  },
  onError: (err, req, res) => {
    console.error(`[${new Date().toISOString()}] 代理错误:`, err.message);
  }
});

// 使用代理中间件
app.use('/', proxy);

// 启动服务器
const PORT = 8788;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`代理服务器运行在 http://0.0.0.0:${PORT}`);
  console.log(`转发所有请求到 http://localhost:8787`);
});