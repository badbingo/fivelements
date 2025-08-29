const http = require('http');

// 测试数据
const testData = {
  name: "测试用户",
  birthDate: "1990-05-15",
  birthTime: "14:30",
  gender: "男",
  birthPlace: "北京市",
  isLunar: false
};

const postData = JSON.stringify(testData);

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

// 递归检查对象类型
function analyzeStructure(obj, path = '') {
  if (obj === null || obj === undefined) {
    console.log(`${path}: null/undefined`);
    return;
  }
  
  if (Array.isArray(obj)) {
    console.log(`${path}: array (length: ${obj.length})`);
    if (obj.length > 0) {
      console.log(`${path}[0] type: ${typeof obj[0]} ${Array.isArray(obj[0]) ? '(array)' : obj[0] !== null && typeof obj[0] === 'object' ? '(object)' : ''}`);
      if (typeof obj[0] === 'object' && obj[0] !== null) {
        analyzeStructure(obj[0], `${path}[0]`);
      }
    }
  } else if (typeof obj === 'object') {
    console.log(`${path}: object`);
    for (const [key, value] of Object.entries(obj)) {
      const newPath = path ? `${path}.${key}` : key;
      if (Array.isArray(value)) {
        console.log(`${newPath}: array (length: ${value.length})`);
        if (value.length > 0) {
          console.log(`${newPath}[0] type: ${typeof value[0]} ${Array.isArray(value[0]) ? '(array)' : value[0] !== null && typeof value[0] === 'object' ? '(object)' : ''}`);
        }
      } else if (typeof value === 'object' && value !== null) {
        console.log(`${newPath}: object`);
        // 只展开一层，避免过深递归
        if (path.split('.').length < 2) {
          analyzeStructure(value, newPath);
        }
      } else {
        console.log(`${newPath}: ${typeof value}`);
      }
    }
  } else {
    console.log(`${path}: ${typeof obj}`);
  }
}

const req = http.request(options, (res) => {
  console.log(`状态码: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      
      console.log('\n=== 完整数据结构分析 ===');
      analyzeStructure(result);
      
      // 特别检查可能有问题的字段
      console.log('\n=== 重点字段检查 ===');
      
      // 检查所有可能包含Map的字段
      const fieldsToCheck = ['paipan', 'wuxing', 'career', 'marriage', 'health', 'personality', 'fortune'];
      
      fieldsToCheck.forEach(field => {
        if (result[field]) {
          console.log(`\n${field} 详细结构:`);
          analyzeStructure(result[field], field);
        }
      });
      
      // 检查嵌套对象
      if (result.paipan) {
        console.log('\npaipan 子字段检查:');
        Object.keys(result.paipan).forEach(key => {
          const value = result.paipan[key];
          console.log(`paipan.${key}: ${Array.isArray(value) ? 'array' : typeof value} ${Array.isArray(value) ? `(length: ${value.length})` : ''}`);
        });
      }
      
    } catch (error) {
      console.error('❌ JSON解析错误:', error.message);
      console.log('原始响应:', data.substring(0, 1000) + '...');
    }
  });
});

req.on('error', (e) => {
  console.error(`❌ 请求错误: ${e.message}`);
});

req.write(postData);
req.end();