#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// 颜色输出
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

// 必须的文件和目录
const requiredItems = {
    directories: [
        'system',
        'css', 
        'js',
        'images'
    ],
    files: [
        'system/bazinew.html',
        'system/lynew.html', 
        'system/liuyao.html',
        'system/lyfree.html',
        'system/lunar.js',
        'css/style1.css',
        'css/navigation.css',
        'js/lunar.js',
        'js/navigation.js'
    ],
    optional: [
        'index.html',
        'CNAME',
        '.github/workflows/deploy.yml'
    ]
};

function checkExists(itemPath) {
    try {
        return fs.existsSync(itemPath);
    } catch (error) {
        return false;
    }
}

function checkDeploymentReadiness() {
    log('\n🔍 检查 GitHub Pages 部署准备情况...\n', 'blue');
    
    let allGood = true;
    let warnings = [];
    
    // 检查必须的目录
    log('📁 检查必须的目录:', 'bold');
    requiredItems.directories.forEach(dir => {
        const exists = checkExists(dir);
        if (exists) {
            log(`  ✅ ${dir}/`, 'green');
        } else {
            log(`  ❌ ${dir}/ - 缺失`, 'red');
            allGood = false;
        }
    });
    
    // 检查必须的文件
    log('\n📄 检查必须的文件:', 'bold');
    requiredItems.files.forEach(file => {
        const exists = checkExists(file);
        if (exists) {
            log(`  ✅ ${file}`, 'green');
        } else {
            log(`  ❌ ${file} - 缺失`, 'red');
            allGood = false;
        }
    });
    
    // 检查可选文件
    log('\n📋 检查推荐文件:', 'bold');
    requiredItems.optional.forEach(file => {
        const exists = checkExists(file);
        if (exists) {
            log(`  ✅ ${file}`, 'green');
        } else {
            log(`  ⚠️  ${file} - 推荐添加`, 'yellow');
            warnings.push(file);
        }
    });
    
    // 检查API配置
    log('\n🔧 检查API配置:', 'bold');
    const bazinewPath = 'system/bazinew.html';
    if (checkExists(bazinewPath)) {
        try {
            const content = fs.readFileSync(bazinewPath, 'utf8');
            if (content.includes('deepseek-api-proxy.owenjass.workers.dev')) {
                log('  ✅ API URL 已配置为 Cloudflare Workers', 'green');
            } else {
                log('  ⚠️  API URL 可能需要更新', 'yellow');
                warnings.push('API配置');
            }
        } catch (error) {
            log('  ❌ 无法读取 bazinew.html', 'red');
        }
    }
    
    // 总结
    log('\n' + '='.repeat(50), 'blue');
    if (allGood) {
        log('🎉 部署检查通过！所有必须文件都已准备就绪。', 'green');
        
        if (warnings.length > 0) {
            log('\n💡 建议添加以下文件以获得更好的体验:', 'yellow');
            warnings.forEach(item => {
                log(`   • ${item}`, 'yellow');
            });
        }
        
        log('\n🚀 下一步操作:', 'blue');
        log('1. 提交所有文件到 GitHub:', 'reset');
        log('   git add system/ css/ js/ images/', 'reset');
        log('   git commit -m "Complete frontend deployment"', 'reset');
        log('   git push origin main', 'reset');
        log('\n2. 在 GitHub 仓库设置中启用 Pages', 'reset');
        log('\n3. 访问: https://badbingo.github.io/fivelements/system/bazinew.html', 'reset');
        
    } else {
        log('❌ 部署检查失败！请先添加缺失的文件。', 'red');
        log('\n📖 详细说明请查看: DEPLOYMENT_CHECKLIST.md', 'blue');
    }
    
    log('\n' + '='.repeat(50), 'blue');
}

// 运行检查
checkDeploymentReadiness();