const https = require('https');
const http = require('http');

// 模拟Flutter应用发送的请求
const testData = {
  name: "测试用户",
  birthDate: "1990-05-15",
  birthTime: "14:30",
  gender: "男",
  birthPlace: "北京",
  isLunar: false
};

const postData = JSON.stringify(testData);

const options = {
  hostname: '192.168.1.56',
  port: 8787,
  path: '/api/calculate',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('发送请求到:', `http://${options.hostname}:${options.port}${options.path}`);
console.log('请求数据:', testData);
console.log('---');

const req = http.request(options, (res) => {
  console.log(`状态码: ${res.statusCode}`);
  console.log(`响应头:`, res.headers);
  
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('响应数据:');
    try {
      const jsonData = JSON.parse(data);
      console.log(JSON.stringify(jsonData, null, 2));
      
      // 检查关键字段
      if (jsonData.paipan && jsonData.paipan.tenGods) {
        console.log('\n十神数据类型:', typeof jsonData.paipan.tenGods);
        console.log('十神数据:', jsonData.paipan.tenGods);
      }
      
    } catch (error) {
      console.log('JSON解析错误:', error.message);
      console.log('原始响应:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('请求错误:', error.message);
});

req.write(postData);
req.end();