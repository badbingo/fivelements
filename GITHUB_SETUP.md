# 🚀 GitHub Pages 部署设置指南

## 📋 快速开始

### 1. 克隆或Fork仓库
```bash
# 克隆仓库
git clone https://github.com/badbingo/fivelements.git
cd fivelements

# 或者Fork后克隆你的Fork
git clone https://github.com/YOUR_USERNAME/fivelements.git
cd fivelements
```

### 2. 配置API端点

#### 方法A: 使用自动化脚本（推荐）
```bash
# 安装依赖（如果需要）
npm install

# 运行配置脚本
npm run config:github
# 或者
node update-github-config.cjs
```

#### 方法B: 手动配置
编辑以下文件中的 `apiUrl` 变量：
- `system/bazinew.html`
- `system/lynew.html`
- `system/liuyao.html`
- `system/lyfree.html`

将：
```javascript
const apiUrl = 'http://localhost:3001/api/deepseek';
```

更改为：
```javascript
const apiUrl = 'https://your-worker-name.your-subdomain.workers.dev/api/deepseek';
```

### 3. 启用GitHub Pages

1. 进入GitHub仓库设置页面
2. 滚动到 "Pages" 部分
3. 在 "Source" 下选择 "Deploy from a branch"
4. 选择 "main" 分支和 "/ (root)" 文件夹
5. 点击 "Save"

### 4. 配置GitHub Actions（可选）

如果你想要自动化部署，可以设置环境变量：

1. 进入仓库设置 → "Secrets and variables" → "Actions"
2. 点击 "Variables" 标签
3. 添加新变量：
   - **Name**: `WORKERS_URL`
   - **Value**: `https://your-worker-name.your-subdomain.workers.dev/api/deepseek`

## 🔧 可用脚本

```bash
# 更新GitHub配置
npm run config:github
npm run update:github

# 启动本地开发服务器
npm start
```

## 🌐 访问你的应用

部署完成后，你可以通过以下URL访问：

- **主页**: `https://YOUR_USERNAME.github.io/fivelements/`
- **八字系统**: `https://YOUR_USERNAME.github.io/fivelements/system/bazinew.html`
- **六爻系统**: `https://YOUR_USERNAME.github.io/fivelements/system/lynew.html`
- **其他页面**: `https://YOUR_USERNAME.github.io/fivelements/system/[页面名称].html`

## 🔒 安全配置

### API密钥保护
- ✅ API密钥安全存储在Cloudflare Workers中
- ✅ 前端代码不包含敏感信息
- ✅ 所有API调用通过HTTPS加密

### CORS配置
Cloudflare Workers已配置正确的CORS头：
```javascript
'Access-Control-Allow-Origin': '*'
'Access-Control-Allow-Methods': 'POST, OPTIONS'
'Access-Control-Allow-Headers': 'Content-Type'
```

## 📁 项目结构

```
fivelements/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions工作流
├── system/                     # 主要应用文件
│   ├── bazinew.html           # 八字预测系统
│   ├── lynew.html             # 六爻预测系统
│   ├── liuyao.html            # 六爻系统
│   └── lyfree.html            # 免费版本
├── css/                       # 样式文件
├── js/                        # JavaScript文件
├── images/                    # 图片资源
├── update-github-config.js    # 配置更新脚本
├── GITHUB_FRONTEND_CONFIG.md  # 详细配置指南
├── GITHUB_SETUP.md           # 快速设置指南
└── package.json              # 项目配置
```

## 🛠️ 故障排除

### 常见问题

1. **页面显示404错误**
   - 检查GitHub Pages是否已启用
   - 确认分支和文件夹设置正确
   - 等待几分钟让部署完成

2. **API调用失败**
   - 检查Cloudflare Workers是否正常运行
   - 验证API URL配置是否正确
   - 查看浏览器开发者工具的网络标签

3. **CORS错误**
   - 确保Cloudflare Workers配置了正确的CORS头
   - 检查API URL是否使用HTTPS

### 调试步骤

1. **检查配置**
   ```bash
   # 搜索当前API配置
   grep -r "apiUrl" system/
   ```

2. **测试API端点**
   ```bash
   # 测试Cloudflare Workers是否响应
   curl -X POST https://your-worker-name.your-subdomain.workers.dev/api/deepseek \
     -H "Content-Type: application/json" \
     -d '{"model":"deepseek-chat","messages":[{"role":"user","content":"test"}]}'
   ```

3. **查看GitHub Actions日志**
   - 进入仓库的 "Actions" 标签
   - 查看最新的工作流运行日志

## 📝 更新流程

当你需要更新API配置时：

1. **本地更新**
   ```bash
   npm run config:github
   ```

2. **提交更改**
   ```bash
   git add .
   git commit -m "Update API configuration"
   git push origin main
   ```

3. **等待部署**
   - GitHub Actions会自动触发
   - 部署通常需要1-5分钟

## 🎯 下一步

- [ ] 配置自定义域名（可选）
- [ ] 设置Google Analytics（可选）
- [ ] 添加更多功能页面
- [ ] 优化SEO设置

## 📞 获取帮助

如果遇到问题：
1. 查看 `GITHUB_FRONTEND_CONFIG.md` 获取详细配置说明
2. 检查GitHub Issues
3. 查看Cloudflare Workers日志

---

**注意**: 确保你的Cloudflare Workers已正确部署并且API密钥已设置。