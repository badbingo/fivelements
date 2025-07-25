# GitHub前端项目配置指南

## 📋 概述

本指南说明如何配置GitHub上的前端项目 `https://github.com/badbingo/fivelements` 来使用Cloudflare Workers API代理。

## 🔧 配置步骤

### 1. 更新前端API配置

在以下HTML文件中，找到 `apiUrl` 配置并更新为你的Cloudflare Workers URL：

#### 需要更新的文件：
- `system/bazinew.html`
- `system/lynew.html` 
- `system/liuyao.html`
- `system/lyfree.html`

#### 配置示例：
```javascript
// 将这行：
const apiUrl = 'http://localhost:3001/api/deepseek';

// 更新为：
const apiUrl = 'https://deepseek-api-proxy.owenjass.workers.dev/api/deepseek';
```

### 2. 环境配置选项

#### 选项A：直接硬编码（推荐用于GitHub Pages）
```javascript
// 在每个HTML文件的JavaScript部分
const apiUrl = 'https://your-worker-name.your-subdomain.workers.dev/api/deepseek';
```

#### 选项B：环境检测（更灵活）
```javascript
// 自动检测环境
const apiUrl = window.location.hostname === 'localhost' 
    ? 'http://localhost:3001/api/deepseek'
    : 'https://deepseek-api-proxy.owenjass.workers.dev/api/deepseek';
```

#### 选项C：配置文件方式
创建 `js/config.js` 文件：
```javascript
// js/config.js
window.CONFIG = {
    API_BASE_URL: 'https://deepseek-api-proxy.owenjass.workers.dev',
    API_ENDPOINT: '/api/deepseek'
};

// 在HTML文件中使用
const apiUrl = `${window.CONFIG.API_BASE_URL}${window.CONFIG.API_ENDPOINT}`;
```

### 3. GitHub Pages部署配置

#### 3.1 启用GitHub Pages
1. 进入GitHub仓库设置
2. 滚动到 "Pages" 部分
3. 选择源分支（通常是 `main` 或 `gh-pages`）
4. 选择根目录或 `/docs` 文件夹
5. 保存设置

#### 3.2 自定义域名（可选）
如果你有自定义域名：
1. 在仓库根目录创建 `CNAME` 文件
2. 在文件中写入你的域名，例如：`yourdomain.com`
3. 在域名DNS设置中添加CNAME记录指向 `username.github.io`

### 4. 自动化配置脚本

创建 `update-github-config.js` 脚本来批量更新配置：

```javascript
#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// 你的Cloudflare Workers URL
const WORKERS_URL = 'https://deepseek-api-proxy.owenjass.workers.dev/api/deepseek';

// 需要更新的文件列表
const files = [
    'system/bazinew.html',
    'system/lynew.html',
    'system/liuyao.html',
    'system/lyfree.html'
];

files.forEach(file => {
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        
        // 替换API URL
        const oldPattern = /const apiUrl = ['"](.*?)['"]/g;
        const newApiUrl = `const apiUrl = '${WORKERS_URL}'`;
        
        content = content.replace(oldPattern, newApiUrl);
        
        fs.writeFileSync(file, content);
        console.log(`✅ 已更新 ${file}`);
    } else {
        console.log(`⚠️  文件不存在: ${file}`);
    }
});

console.log('\n🎉 配置更新完成！');
```

### 5. GitHub Actions自动部署（可选）

创建 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Update API Configuration
      run: |
        node update-github-config.js
        
    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      if: github.ref == 'refs/heads/main'
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./
```

## 🌐 访问URL

配置完成后，你的应用将可以通过以下URL访问：

- **GitHub Pages**: `https://badbingo.github.io/fivelements/system/bazinew.html`
- **自定义域名**: `https://yourdomain.com/system/bazinew.html`

## 🔒 安全注意事项

1. **API密钥保护**: API密钥已安全存储在Cloudflare Workers中，前端不会暴露
2. **CORS配置**: Cloudflare Workers已配置正确的CORS头
3. **HTTPS**: GitHub Pages和Cloudflare Workers都强制使用HTTPS

## 🛠️ 故障排除

### 常见问题：

1. **CORS错误**
   - 确保Cloudflare Workers正确配置了CORS头
   - 检查API URL是否正确

2. **API调用失败**
   - 检查网络连接
   - 验证Cloudflare Workers是否正常运行
   - 查看浏览器开发者工具的网络标签

3. **GitHub Pages未更新**
   - 等待几分钟让GitHub Pages重新构建
   - 检查仓库设置中的Pages配置
   - 清除浏览器缓存

### 调试步骤：

1. 打开浏览器开发者工具
2. 查看Console标签的错误信息
3. 查看Network标签的API请求状态
4. 验证API URL是否可以直接访问

## 📝 配置检查清单

- [ ] 更新所有HTML文件中的 `apiUrl` 配置
- [ ] 验证Cloudflare Workers正常运行
- [ ] 测试API调用功能
- [ ] 启用GitHub Pages
- [ ] 配置自定义域名（如需要）
- [ ] 设置GitHub Actions（如需要）
- [ ] 测试生产环境功能

## 🎯 下一步

配置完成后，你可以：
1. 提交更改到GitHub仓库
2. 等待GitHub Pages自动部署
3. 访问你的应用并测试功能
4. 监控Cloudflare Workers的使用情况

---

**注意**: 请确保你的Cloudflare Workers已正确部署并且API密钥已设置。如需帮助，请参考 `CLOUDFLARE_DEPLOYMENT.md` 文档。