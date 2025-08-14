# DNS 配置说明

## 问题描述
当前 `mybazi.net` 域名指向 GitHub Pages（前端），但后端 API 需要使用子域名 `api.mybazi.net`。

## 解决方案
需要在 Cloudflare DNS 中添加以下记录：

### 1. 添加 CNAME 记录
- **类型**: CNAME
- **名称**: api
- **目标**: bazi-backend.owenjass.workers.dev
- **代理状态**: 已代理（橙色云朵）

### 2. 配置步骤
1. 登录 Cloudflare 控制台
2. 选择 `mybazi.net` 域名
3. 进入 DNS 管理页面
4. 点击「添加记录」
5. 选择类型为 CNAME
6. 名称填写 `api`
7. 目标填写 `bazi-backend.owenjass.workers.dev`
8. 确保代理状态为「已代理」（橙色云朵图标）
9. 保存记录

### 3. 验证配置
配置完成后，可以通过以下命令验证：
```bash
curl -X POST https://api.mybazi.net/api/login \
  -H "Content-Type: application/json" \
  -d '{"name":"test","password":"test"}'
```

应该返回 JSON 格式的错误信息（因为用户不存在），而不是 405 错误。

### 4. 当前状态
- ✅ 后端代码已部署
- ✅ 路由配置已更新为 `api.mybazi.net/*`
- ✅ 前端配置已更新为使用 `https://api.mybazi.net`
- ❌ DNS 记录需要手动添加

### 5. 注意事项
- DNS 记录生效可能需要几分钟到几小时
- 确保代理状态为「已代理」以启用 Cloudflare Workers 路由
- 如果仍有问题，检查 Cloudflare Workers 路由配置是否正确