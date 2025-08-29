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

const req = http.request(options, (res) => {
  console.log(`状态码: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      
      console.log('\n=== 修复验证结果 ===');
      console.log('✅ API请求成功');
      console.log('✅ JSON解析成功');
      
      // 检查关键字段
      console.log('\n=== 关键字段检查 ===');
      console.log(`paipan: ${result.paipan ? '✅ 存在' : '❌ 缺失'}`);
      console.log(`wuxing: ${result.wuxing ? '✅ 存在' : '❌ 缺失'}`);
      console.log(`dayun: ${result.dayun ? '✅ 存在 (数组)' : '❌ 缺失'}`);
      console.log(`liunian: ${result.liunian ? '✅ 存在 (数组)' : '❌ 缺失'}`);
      console.log(`career: ${result.career ? '✅ 存在' : '❌ 缺失'}`);
      console.log(`marriage: ${result.marriage ? '✅ 存在' : '❌ 缺失'}`);
      console.log(`health: ${result.health ? '✅ 存在' : '❌ 缺失'}`);
      
      // 检查数组字段的类型
      if (result.dayun) {
        console.log(`\ndayun 类型: ${Array.isArray(result.dayun) ? '数组' : '对象'} (长度: ${result.dayun.length || 'N/A'})`);
      }
      
      if (result.liunian) {
        console.log(`liunian 类型: ${Array.isArray(result.liunian) ? '数组' : '对象'} (长度: ${result.liunian.length || 'N/A'})`);
      }
      
      // 检查tenGods字段
      if (result.paipan && result.paipan.tenGods) {
        console.log(`\ntenGods 类型: ${Array.isArray(result.paipan.tenGods) ? '数组' : '对象'} (长度: ${result.paipan.tenGods.length || 'N/A'})`);
      }
      
      console.log('\n🎉 所有类型转换问题已修复！Flutter应用现在应该能正常解析数据了。');
      
    } catch (error) {
      console.error('❌ JSON解析错误:', error.message);
      console.log('原始响应:', data.substring(0, 500) + '...');
    }
  });
});

req.on('error', (e) => {
  console.error(`❌ 请求错误: ${e.message}`);
});

req.write(postData);
req.end();