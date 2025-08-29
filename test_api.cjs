const http = require('http');

const postData = JSON.stringify({
  name: '测试',
  birthDate: '1990-01-01T10:30:00.000Z',
  birthTime: '10:30',
  gender: 'male'
});

const options = {
  hostname: 'localhost',
  port: 8787,
  path: '/api/calculate',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  console.log(`状态码: ${res.statusCode}`);
  console.log(`响应头: ${JSON.stringify(res.headers)}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('响应体:');
    console.log(data);
    try {
      const parsed = JSON.parse(data);
      console.log('解析后的JSON:');
      console.log(JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.log('JSON解析失败:', e.message);
    }
  });
});

req.on('error', (e) => {
  console.error(`请求遇到问题: ${e.message}`);
});

req.write(postData);
req.end();