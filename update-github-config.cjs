#!/usr/bin/env node

/**
 * GitHub前端项目配置更新脚本
 * 用于批量更新前端HTML文件中的API URL配置
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// 创建readline接口
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// 需要更新的文件列表
const files = [
    'system/bazinew.html',
    'system/lynew.html',
    'system/liuyao.html',
    'system/lyfree.html'
];

// 颜色输出函数
const colors = {
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
};

function colorLog(color, message) {
    console.log(colors[color] + message + colors.reset);
}

// 验证URL格式
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

// 更新文件中的API URL
function updateApiUrl(filePath, newUrl) {
    try {
        if (!fs.existsSync(filePath)) {
            colorLog('yellow', `⚠️  文件不存在: ${filePath}`);
            return false;
        }

        let content = fs.readFileSync(filePath, 'utf8');
        
        // 查找现有的API URL配置
        const oldPattern = /const apiUrl = ['"](.*?)['"]/g;
        const matches = content.match(oldPattern);
        
        if (!matches) {
            colorLog('yellow', `⚠️  在 ${filePath} 中未找到 apiUrl 配置`);
            return false;
        }

        // 替换API URL
        const newApiUrl = `const apiUrl = '${newUrl}'`;
        content = content.replace(oldPattern, newApiUrl);
        
        // 写回文件
        fs.writeFileSync(filePath, content);
        colorLog('green', `✅ 已更新 ${filePath}`);
        
        // 显示更改详情
        matches.forEach(match => {
            const oldUrl = match.match(/['"](.*?)['"]/)[1];
            if (oldUrl !== newUrl) {
                console.log(`   ${colors.red}旧URL: ${oldUrl}${colors.reset}`);
                console.log(`   ${colors.green}新URL: ${newUrl}${colors.reset}`);
            }
        });
        
        return true;
    } catch (error) {
        colorLog('red', `❌ 更新 ${filePath} 时出错: ${error.message}`);
        return false;
    }
}

// 主函数
async function main() {
    console.log('\n' + colors.blue + '🔧 GitHub前端项目API配置更新工具' + colors.reset);
    console.log('=' .repeat(50));
    
    // 检查当前目录
    const currentDir = process.cwd();
    console.log(`当前目录: ${currentDir}`);
    
    // 检查是否在正确的项目目录
    const packageJsonExists = fs.existsSync('package.json');
    const systemDirExists = fs.existsSync('system');
    
    if (!systemDirExists) {
        colorLog('red', '❌ 未找到 system 目录，请确保在正确的项目根目录下运行此脚本');
        process.exit(1);
    }
    
    console.log('\n📋 将要更新的文件:');
    files.forEach((file, index) => {
        const exists = fs.existsSync(file) ? '✅' : '❌';
        console.log(`   ${index + 1}. ${file} ${exists}`);
    });
    
    // 获取用户输入的API URL
    const question = `\n🌐 请输入你的Cloudflare Workers API URL\n` +
                    `   (例如: https://deepseek-api-proxy.owenjass.workers.dev/api/deepseek)\n` +
                    `   URL: `;
    
    rl.question(question, (apiUrl) => {
        // 验证URL
        if (!apiUrl.trim()) {
            colorLog('red', '❌ URL不能为空');
            rl.close();
            return;
        }
        
        if (!isValidUrl(apiUrl)) {
            colorLog('red', '❌ 无效的URL格式');
            rl.close();
            return;
        }
        
        if (!apiUrl.includes('/api/deepseek')) {
            colorLog('yellow', '⚠️  URL似乎不包含 "/api/deepseek" 路径，是否继续？');
        }
        
        console.log(`\n🔄 开始更新配置...`);
        console.log(`目标URL: ${colors.green}${apiUrl}${colors.reset}\n`);
        
        let successCount = 0;
        let totalCount = 0;
        
        // 更新所有文件
        files.forEach(file => {
            totalCount++;
            if (updateApiUrl(file, apiUrl)) {
                successCount++;
            }
        });
        
        // 显示结果
        console.log('\n' + '='.repeat(50));
        colorLog('blue', `📊 更新完成: ${successCount}/${totalCount} 个文件成功更新`);
        
        if (successCount === totalCount) {
            colorLog('green', '🎉 所有文件更新成功！');
            console.log('\n📝 下一步操作:');
            console.log('   1. 提交更改到GitHub仓库');
            console.log('   2. 推送到远程仓库');
            console.log('   3. 等待GitHub Pages自动部署');
            console.log('   4. 测试线上功能');
            
            console.log('\n🔗 相关命令:');
            console.log('   git add .');
            console.log('   git commit -m "Update API configuration for Cloudflare Workers"');
            console.log('   git push origin main');
        } else {
            colorLog('yellow', '⚠️  部分文件更新失败，请检查上述错误信息');
        }
        
        rl.close();
    });
}

// 处理脚本退出
process.on('SIGINT', () => {
    console.log('\n\n👋 脚本已取消');
    rl.close();
    process.exit(0);
});

// 运行主函数
if (require.main === module) {
    main().catch(error => {
        colorLog('red', `❌ 脚本执行出错: ${error.message}`);
        process.exit(1);
    });
}

module.exports = { updateApiUrl, isValidUrl };