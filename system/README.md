# 八字系统 API 代理服务器

## 安全配置说明

为了保护您的 DeepSeek API 密钥安全，我们创建了一个代理服务器来隐藏 API 密钥。

## 安装和配置

### 1. 安装依赖

```bash
cd /Users/Owen/Desktop/mybazi/fivelements/system
npm install
```

### 2. 配置环境变量

1. 复制环境变量模板文件：
```bash
cp .env.example .env
```

2. 编辑 `.env` 文件，填入您的真实 API 密钥：
```
DEEPSEEK_API_KEY=your_actual_api_key_here
PORT=3001
```

### 3. 启动代理服务器

```bash
npm start
```

或者使用开发模式（自动重启）：
```bash
npm run dev
```

### 4. 启动前端服务器

在另一个终端窗口中：
```bash
python3 -m http.server 8080
```

## 安全特性

- ✅ API 密钥不再暴露在前端代码中
- ✅ 使用环境变量管理敏感信息
- ✅ .gitignore 防止密钥被提交到版本控制
- ✅ 本地代理服务器处理 API 认证

## 注意事项

1. **不要将 `.env` 文件提交到版本控制系统**
2. **确保代理服务器在使用前端功能前启动**
3. **生产环境中请使用更安全的密钥管理方案**

## 故障排除

如果遇到 CORS 错误或连接问题：
1. 确保代理服务器正在运行（端口 3001）
2. 检查 `.env` 文件中的 API 密钥是否正确
3. 确保前端和代理服务器都在本地运行