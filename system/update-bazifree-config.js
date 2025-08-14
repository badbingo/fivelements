#!/usr/bin/env node

// bazifree.html配置更新脚本
// 用于更新bazifree.html中的API URL配置

const fs = require('fs');
const path = require('path');

// 更新bazifree.html中的API URL
function updateBazifreeConfig() {
  console.log('🔧 bazifree.html配置更新工具');
  console.log('');
  
  // 使用Cloudflare Workers URL
  const workersUrl = 'https://deepseek-api-proxy.owenjass.workers.dev';
  
  // 确保URL以/api/deepseek结尾
  const apiUrl = workersUrl.endsWith('/api/deepseek') ? workersUrl : `${workersUrl}/api/deepseek`;
  
  console.log(`📝 将更新API地址为: ${apiUrl}`);
  
  // 更新bazi.js文件
  const baziJsPath = path.join(__dirname, '../js/bazi.js');
  
  if (fs.existsSync(baziJsPath)) {
    try {
      let content = fs.readFileSync(baziJsPath, 'utf8');
      
      // 替换所有的API URL配置
      const apiUrlPattern = /const apiUrl = ['"](https?:\/\/[^'"]+)['"];/g;
      const newApiUrl = `const apiUrl = '${apiUrl}';`;
      
      if (content.match(apiUrlPattern)) {
        content = content.replace(apiUrlPattern, newApiUrl);
        fs.writeFileSync(baziJsPath, content, 'utf8');
        console.log('✅ bazi.js 已更新');
      } else {
        console.log('⚠️ 在bazi.js中未找到apiUrl配置');
      }
      
    } catch (error) {
      console.error('❌ 更新bazi.js失败:', error.message);
    }
  } else {
    console.log('⚠️ bazi.js文件不存在');
  }
  
  console.log('');
  console.log('🎉 配置更新完成！');
  console.log('');
  console.log('📋 下一步:');
  console.log('   1. 测试bazifree.html页面功能');
  console.log('   2. 检查浏览器控制台是否有错误');
  console.log('   3. 验证API调用是否正常工作');
  console.log('');
}

// 执行更新
updateBazifreeConfig();