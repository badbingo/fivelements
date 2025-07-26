#!/usr/bin/env node

// 前端配置更新脚本
// 用于在Cloudflare部署后更新前端API地址

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function updateFrontendConfig() {
  console.log('🔧 前端配置更新工具');
  console.log('');
  
  rl.question('请输入您的Cloudflare Workers URL (例如: https://deepseek-api-proxy.your-subdomain.workers.dev): ', (workersUrl) => {
    if (!workersUrl) {
      console.log('❌ URL不能为空');
      rl.close();
      return;
    }
    
    // 确保URL以/api/deepseek结尾
    const apiUrl = workersUrl.endsWith('/api/deepseek') ? workersUrl : `${workersUrl}/api/deepseek`;
    
    console.log(`\n📝 将更新API地址为: ${apiUrl}`);
    
    // 更新bazinew.html
    const bazinewPath = path.join(__dirname, 'bazinew.html');
    
    if (fs.existsSync(bazinewPath)) {
      try {
        let content = fs.readFileSync(bazinewPath, 'utf8');
        
        // 替换API URL
        const oldPattern = /const apiUrl = ['"](.*?)['"]\s*;/g;
        const newApiUrl = `const apiUrl = '${apiUrl}'`;
        
        // 确保apiKey也被定义
        const apiKeyPattern = /const apiKey = ['"](.*?)['"]\s*;/g;
        const newApiKey = `const apiKey = 'placeholder_key_for_local_dev_only'`;
        
        if (content.match(oldPattern)) {
          content = content.replace(oldPattern, newApiUrl);
          fs.writeFileSync(bazinewPath, content, 'utf8');
          console.log('✅ bazinew.html 已更新');
        } else {
          console.log('⚠️  在bazinew.html中未找到apiUrl配置');
        }
        
      } catch (error) {
        console.error('❌ 更新bazinew.html失败:', error.message);
      }
    } else {
      console.log('⚠️  bazinew.html文件不存在');
    }
    
    // 检查其他可能需要更新的文件
    const filesToCheck = ['lynew.html', 'liuyao.html', 'lyfree.html'];
    
    filesToCheck.forEach(filename => {
      const filePath = path.join(__dirname, filename);
      if (fs.existsSync(filePath)) {
        try {
          let content = fs.readFileSync(filePath, 'utf8');
          const oldPattern = /const apiUrl = ['"].*?['"]/g;
          
          if (content.match(oldPattern)) {
            content = content.replace(oldPattern, `const apiUrl = '${apiUrl}'`);
            
            // 检查并确保apiKey存在
            const apiKeyPattern = /const apiKey = ['"](.*?)['"]\s*;/g;
            if (!content.match(apiKeyPattern)) {
              // 在apiUrl后添加apiKey定义
              content = content.replace(
                `const apiUrl = '${apiUrl}';`, 
                `const apiUrl = '${apiUrl}';
            const apiKey = 'placeholder_key_for_local_dev_only';`
              );
            }
            
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✅ ${filename} 已更新`);
          }
        } catch (error) {
          console.error(`❌ 更新${filename}失败:`, error.message);
        }
      }
    });
    
    console.log('');
    console.log('🎉 配置更新完成！');
    console.log('');
    console.log('📋 下一步:');
    console.log('   1. 测试前端页面功能');
    console.log('   2. 检查浏览器控制台是否有错误');
    console.log('   3. 验证API调用是否正常工作');
    console.log('');
    
    rl.close();
  });
}

// 如果直接运行此脚本
if (require.main === module) {
  updateFrontendConfig();
}

module.exports = { updateFrontendConfig };