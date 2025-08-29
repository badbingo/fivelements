const http = require('http');

// 模拟修复后的Flutter应用发送的请求格式
const testData = {
  name: "测试用户",
  birthDate: "1990-05-15",  // 现在使用YYYY-MM-DD格式
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

console.log('测试修复后的Flutter数据格式...');
console.log('发送请求到:', `http://${options.hostname}:${options.port}${options.path}`);
console.log('请求数据:', testData);
console.log('---');

const req = http.request(options, (res) => {
  console.log(`状态码: ${res.statusCode}`);
  
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    if (res.statusCode === 200) {
      try {
        const jsonData = JSON.parse(data);
        console.log('✅ 请求成功！');
        console.log('返回的基本分析:', jsonData.basicAnalysis);
        console.log('八字排盘:', jsonData.paipan.yearPillar, jsonData.paipan.monthPillar, jsonData.paipan.dayPillar, jsonData.paipan.hourPillar);
        console.log('十神:', jsonData.paipan.tenGods);
        console.log('评分:', jsonData.score);
        
        // 验证数据结构
        const requiredFields = ['id', 'paipan', 'wuxing', 'basicAnalysis', 'score', 'calculatedAt'];
        const missingFields = requiredFields.filter(field => !jsonData[field]);
        
        if (missingFields.length === 0) {
          console.log('✅ 所有必需字段都存在');
        } else {
          console.log('❌ 缺少字段:', missingFields);
        }
        
      } catch (error) {
        console.log('❌ JSON解析错误:', error.message);
        console.log('原始响应:', data);
      }
    } else {
      console.log('❌ 请求失败，状态码:', res.statusCode);
      console.log('错误响应:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ 请求错误:', error.message);
});

req.write(postData);
req.end();