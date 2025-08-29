const http = require('http');

// 模拟Flutter应用发送的数据格式
const testData = {
  name: "测试用户",
  birthDate: "1990-01-01T00:00:00.000Z",
  birthTime: "08:00",
  gender: "男",
  birthPlace: null,
  isLunar: false
};

console.log('Testing Flutter data format:');
console.log('Data to send:', JSON.stringify(testData, null, 2));

const postData = JSON.stringify(testData);

const options = {
  hostname: '192.168.1.56',
  port: 8787,
  path: '/api/calculate',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response body:');
    try {
      const parsed = JSON.parse(data);
      console.log(JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.log('Raw response:', data);
      console.log('Parse error:', e.message);
    }
  });
});

req.on('error', (e) => {
  console.error(`Request error: ${e.message}`);
});

req.write(postData);
req.end();