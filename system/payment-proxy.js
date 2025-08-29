/**
 * 支付代理服务器 - 解决CORS跨域问题
 * 用于代理支付请求到第三方支付网关
 */

const http = require('http');
const https = require('https');
const url = require('url');
const querystring = require('querystring');

const PORT = 3001;
const TARGET_URL = 'https://zpayz.cn/submit.php';

// 创建代理服务器
const server = http.createServer((req, res) => {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Target-URL');
  
  // 处理预检请求
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // 只处理 /api/payment-proxy 路径
  if (!req.url.startsWith('/api/payment-proxy')) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not Found' }));
    return;
  }
  
  // 处理POST请求
  if (req.method === 'POST') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        // 解析目标URL
        const targetUrl = req.headers['x-target-url'] || TARGET_URL;
        const parsedUrl = url.parse(targetUrl);
        
        // 准备代理请求选项
        const options = {
          hostname: parsedUrl.hostname,
          port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
          path: parsedUrl.path,
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(body),
            'User-Agent': 'Mozilla/5.0 (compatible; PaymentProxy/1.0)'
          }
        };
        
        // 选择http或https模块
        const httpModule = parsedUrl.protocol === 'https:' ? https : http;
        
        // 发起代理请求
        const proxyReq = httpModule.request(options, (proxyRes) => {
          let responseData = '';
          
          proxyRes.on('data', chunk => {
            responseData += chunk;
          });
          
          proxyRes.on('end', () => {
            // 设置响应头
            res.writeHead(proxyRes.statusCode, {
              'Content-Type': proxyRes.headers['content-type'] || 'text/plain',
              'Access-Control-Allow-Origin': '*'
            });
            
            // 返回响应数据
            res.end(responseData);
          });
        });
        
        proxyReq.on('error', (error) => {
          console.error('代理请求错误:', error);
          res.writeHead(500, { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          });
          res.end(JSON.stringify({ 
            error: '代理请求失败', 
            message: error.message 
          }));
        });
        
        // 发送请求体
        proxyReq.write(body);
        proxyReq.end();
        
      } catch (error) {
        console.error('处理请求错误:', error);
        res.writeHead(500, { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({ 
          error: '服务器内部错误', 
          message: error.message 
        }));
      }
    });
    
  } else {
    // 不支持的方法
    res.writeHead(405, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({ error: 'Method Not Allowed' }));
  }
});

// 启动服务器
server.listen(PORT, () => {
  console.log(`支付代理服务器运行在 http://localhost:${PORT}`);
  console.log(`代理目标: ${TARGET_URL}`);
  console.log('请确保前端应用运行在 http://localhost:8000');
});

// 错误处理
server.on('error', (error) => {
  console.error('服务器错误:', error);
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n正在关闭代理服务器...');
  server.close(() => {
    console.log('代理服务器已关闭');
    process.exit(0);
  });
});