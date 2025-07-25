#!/bin/bash

# Cloudflare Workers 部署脚本
# 用于自动化部署DeepSeek API代理服务器

set -e

echo "🚀 开始部署到Cloudflare Workers..."

# 检查是否安装了wrangler
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI未安装"
    echo "请运行: npm install -g wrangler"
    exit 1
fi

# 检查是否已登录
if ! wrangler whoami &> /dev/null; then
    echo "❌ 未登录Cloudflare"
    echo "请运行: wrangler login"
    exit 1
fi

echo "✅ Wrangler CLI已就绪"

# 检查API密钥是否已设置
echo "🔑 检查API密钥配置..."
if ! wrangler secret list | grep -q "DEEPSEEK_API_KEY"; then
    echo "⚠️  DEEPSEEK_API_KEY未设置"
    read -p "请输入您的DeepSeek API密钥: " api_key
    echo "$api_key" | wrangler secret put DEEPSEEK_API_KEY
    echo "✅ API密钥已设置"
else
    echo "✅ API密钥已配置"
fi

# 部署到Cloudflare
echo "📦 开始部署..."
wrangler deploy

if [ $? -eq 0 ]; then
    echo "🎉 部署成功！"
    echo ""
    echo "📋 部署信息:"
    echo "   - Workers URL: https://deepseek-api-proxy.你的子域名.workers.dev"
    echo "   - API端点: https://deepseek-api-proxy.你的子域名.workers.dev/api/deepseek"
    echo ""
    echo "📝 下一步:"
    echo "   1. 复制上面的API端点URL"
    echo "   2. 在bazinew.html中更新apiUrl变量"
    echo "   3. 测试API调用功能"
    echo ""
    echo "📊 监控命令:"
    echo "   - 查看实时日志: wrangler tail"
    echo "   - 查看配置: wrangler whoami"
else
    echo "❌ 部署失败"
    echo "请检查错误信息并重试"
    exit 1
fi