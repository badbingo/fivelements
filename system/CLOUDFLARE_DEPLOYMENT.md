# Cloudflare Workers 部署指南

## 概述

本指南将帮助您将DeepSeek API代理服务器部署到Cloudflare Workers，实现API密钥的安全保护和全球CDN加速。

## 前置要求

1. Cloudflare账户
2. 已验证的域名（可选，用于自定义域名）
3. Node.js和npm
4. Wrangler CLI工具

## 部署步骤

### 1. 安装Wrangler CLI

```bash
npm install -g wrangler
```

### 2. 登录Cloudflare

```bash
wrangler login
```

这将打开浏览器，请按照提示完成登录。

### 3. 配置项目

项目已包含以下文件：
- `wrangler.toml` - Cloudflare Workers配置文件
- `src/worker.js` - Workers代理服务器代码

### 4. 设置环境变量

在Cloudflare Dashboard中设置API密钥：

```bash
wrangler secret put DEEPSEEK_API_KEY
```

输入您的DeepSeek API密钥。

### 5. 部署到Cloudflare

```bash
wrangler deploy
```

部署成功后，您将获得一个类似 `https://deepseek-api-proxy.your-subdomain.workers.dev` 的URL。

### 6. 更新前端配置

修改 `bazinew.html` 中的API地址：

```javascript
// 将这行
const apiUrl = 'http://localhost:3001/api/deepseek';

// 改为您的Workers URL
const apiUrl = 'https://deepseek-api-proxy.your-subdomain.workers.dev/api/deepseek';
```

## 自定义域名配置（可选）

### 1. 在Cloudflare Dashboard中添加路由

1. 进入 Workers & Pages
2. 选择您的Worker
3. 点击 "Triggers" 标签
4. 添加自定义域名路由

### 2. 更新wrangler.toml

```toml
[[env.production.routes]]
pattern = "yourdomain.com/api/*"
zone_name = "yourdomain.com"
```

### 3. 重新部署

```bash
wrangler deploy --env production
```

## 环境变量说明

| 变量名 | 说明 | 必需 |
|--------|------|------|
| DEEPSEEK_API_KEY | DeepSeek API密钥 | 是 |

## 安全特性

✅ **API密钥隐藏**：密钥存储在Cloudflare环境变量中，不会暴露给前端

✅ **CORS支持**：支持跨域请求

✅ **全球CDN**：利用Cloudflare的全球网络加速

✅ **HTTPS加密**：所有请求都通过HTTPS传输

✅ **无服务器**：无需管理服务器，自动扩缩容

## 监控和日志

### 查看实时日志

```bash
wrangler tail
```

### 在Dashboard中查看

1. 登录Cloudflare Dashboard
2. 进入 Workers & Pages
3. 选择您的Worker
4. 查看 "Metrics" 和 "Logs" 标签

## 成本说明

Cloudflare Workers免费套餐包括：
- 每天100,000次请求
- 10ms CPU时间限制
- 128MB内存限制

对于大多数个人项目来说，免费套餐已经足够使用。

## 故障排除

### 常见问题

1. **部署失败**
   - 检查wrangler.toml配置
   - 确保已登录Cloudflare

2. **API调用失败**
   - 检查DEEPSEEK_API_KEY是否正确设置
   - 查看Workers日志

3. **CORS错误**
   - 确保前端使用正确的Workers URL
   - 检查浏览器控制台错误信息

### 调试命令

```bash
# 查看配置
wrangler whoami

# 查看环境变量
wrangler secret list

# 本地开发
wrangler dev
```

## 更新部署

当需要更新代码时：

```bash
wrangler deploy
```

## 删除部署

```bash
wrangler delete
```

---

部署完成后，您的DeepSeek API代理服务器将运行在Cloudflare的全球网络上，提供快速、安全、可靠的API代理服务。