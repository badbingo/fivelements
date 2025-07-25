# GitHub Pages 完整部署指南

## 问题分析

您的前端项目在本地可以正常运行，但在GitHub Pages上无法正常运行，主要原因是：

1. **文件路径问题**：项目依赖多个目录（css、js、images）
2. **相对路径引用**：HTML文件引用了相对路径的资源文件
3. **完整项目结构**：不仅仅是单个HTML文件，需要整个项目结构

## 需要部署的文件

### ✅ 必须上传的目录和文件：

```
/
├── system/                 # 主要HTML文件目录
│   ├── bazinew.html        # 主要八字预测页面
│   ├── lynew.html          # 六爻预测页面
│   ├── liuyao.html         # 六爻系统页面
│   ├── lyfree.html         # 免费六爻页面
│   ├── lunar.js            # 农历计算库（重要！）
│   └── 其他HTML文件...
├── css/                    # 样式文件目录
│   ├── style1.css
│   ├── navigation.css
│   ├── hehun.css
│   ├── wwstyle.css
│   └── 其他CSS文件...
├── js/                     # JavaScript文件目录
│   ├── lunar.js            # 农历计算库
│   ├── navigation.js
│   ├── bazi.js
│   ├── hehun.js
│   └── 其他JS文件...
├── images/                 # 图片资源目录
│   ├── hexagrams/          # 卦象图片
│   └── 其他图片文件...
├── index.html              # 首页（可选）
└── CNAME                   # 自定义域名（如果有）
```

### ❌ 不需要上传的文件：

```
- bazi-backend/             # 后端代码（已部署到Cloudflare）
- .wrangler/                # Cloudflare配置
- node_modules/             # 依赖包
- .env                      # 环境变量
- package-lock.json         # 锁定文件
```

## 快速部署步骤

### 1. 准备文件

```bash
# 在您的本地项目目录中
cd /path/to/your/fivelements

# 确保所有必要文件都存在
ls -la system/
ls -la css/
ls -la js/
ls -la images/
```

### 2. 上传到GitHub

```bash
# 添加所有必要文件
git add system/ css/ js/ images/ index.html CNAME
git add GITHUB_*.md update-github-config.cjs
git add .github/

# 提交更改
git commit -m "Deploy complete frontend to GitHub Pages"

# 推送到GitHub
git push origin main
```

### 3. 启用GitHub Pages

1. 访问您的GitHub仓库：https://github.com/badbingo/fivelements
2. 点击 **Settings** 标签
3. 在左侧菜单中找到 **Pages**
4. 在 **Source** 下选择 **Deploy from a branch**
5. 选择 **main** 分支和 **/ (root)** 目录
6. 点击 **Save**

### 4. 访问您的应用

部署完成后，您可以通过以下URL访问：

- **主要八字预测页面**：`https://badbingo.github.io/fivelements/system/bazinew.html`
- **六爻预测页面**：`https://badbingo.github.io/fivelements/system/lynew.html`
- **免费六爻页面**：`https://badbingo.github.io/fivelements/system/lyfree.html`
- **项目首页**：`https://badbingo.github.io/fivelements/`

## 文件路径修复

### 当前问题

您的 `bazinew.html` 文件中有这行代码：
```html
<script src="./lunar.js"></script>
```

这是正确的，因为 `lunar.js` 文件确实在 `system/` 目录中。

### 其他文件的路径

其他HTML文件使用相对路径引用资源：
```html
<link rel="stylesheet" href="../css/style1.css">
<script src="../js/lunar.js"></script>
```

这些路径在GitHub Pages上应该能正常工作，因为文件结构保持不变。

## 自动化部署（推荐）

### 使用GitHub Actions

您已经有了 `.github/workflows/deploy.yml` 文件，它会：

1. 自动检测代码更改
2. 更新API配置（如果设置了 `WORKERS_URL`）
3. 部署到GitHub Pages

### 设置环境变量

1. 在GitHub仓库中，进入 **Settings** > **Secrets and variables** > **Actions**
2. 点击 **New repository variable**
3. 添加变量：
   - **Name**: `WORKERS_URL`
   - **Value**: `https://deepseek-api-proxy.owenjass.workers.dev/api/deepseek`

## 故障排除

### 如果页面仍然无法正常运行：

1. **检查浏览器控制台**：
   - 按F12打开开发者工具
   - 查看Console标签中的错误信息
   - 查看Network标签中失败的资源请求

2. **检查文件路径**：
   ```bash
   # 确保文件存在
   curl -I https://badbingo.github.io/fivelements/system/lunar.js
   curl -I https://badbingo.github.io/fivelements/css/style1.css
   ```

3. **检查API连接**：
   - 确保Cloudflare Workers API正常运行
   - 检查CORS设置
   - 验证API密钥配置

### 常见错误及解决方案：

| 错误 | 原因 | 解决方案 |
|------|------|----------|
| 404 Not Found | 文件路径错误 | 检查文件是否上传，路径是否正确 |
| CORS错误 | 跨域请求被阻止 | 检查Cloudflare Workers的CORS设置 |
| API错误 | 后端连接失败 | 验证API URL和密钥配置 |
| 样式丢失 | CSS文件未加载 | 确保css目录已上传 |

## 验证部署

### 检查清单：

- [ ] 所有HTML文件可以访问
- [ ] CSS样式正常加载
- [ ] JavaScript功能正常
- [ ] API调用成功
- [ ] 图片资源显示正常

### 测试命令：

```bash
# 测试主要文件
curl -s -o /dev/null -w "%{http_code}" https://badbingo.github.io/fivelements/system/bazinew.html
curl -s -o /dev/null -w "%{http_code}" https://badbingo.github.io/fivelements/system/lunar.js
curl -s -o /dev/null -w "%{http_code}" https://badbingo.github.io/fivelements/css/style1.css
```

所有返回码应该是 `200`。

## 下一步操作

1. **立即执行**：上传完整的项目文件到GitHub
2. **启用Pages**：在GitHub仓库设置中启用Pages
3. **测试功能**：访问线上地址测试所有功能
4. **监控日志**：检查浏览器控制台和网络请求
5. **优化性能**：根据需要优化加载速度

---

**重要提醒**：您的后端API已经在Cloudflare上正确配置，前端只需要正确的文件结构和路径即可正常运行。