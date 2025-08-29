// Node.js测试脚本来模拟baziphone.html的计算
const fs = require('fs');
const path = require('path');

// 读取baziphone.html文件
const htmlPath = path.join(__dirname, 'bazi_mobile_app/assets/baziphone.html');
const htmlContent = fs.readFileSync(htmlPath, 'utf8');

// 提取JavaScript代码
const scriptMatch = htmlContent.match(/<script[^>]*>([\s\S]*?)<\/script>/g);
if (scriptMatch) {
    console.log('找到', scriptMatch.length, '个script标签');
    
    // 查找包含analyzeStrengthWeakness函数的脚本
    const targetScript = scriptMatch.find(script => script.includes('analyzeStrengthWeakness'));
    if (targetScript) {
        console.log('找到包含analyzeStrengthWeakness函数的脚本');
        
        // 查找强度百分比计算的关键代码
        const strengthCalcMatch = targetScript.match(/strengthRatio[\s\S]*?strengthPercentage[\s\S]*?100/g);
        if (strengthCalcMatch) {
            console.log('=== 强度计算代码 ===');
            strengthCalcMatch.forEach((match, index) => {
                console.log(`匹配 ${index + 1}:`, match.trim());
            });
        }
        
        // 查找月令得分相关代码
        const monthScoreMatch = targetScript.match(/monthScore[\s\S]{0,200}/g);
        if (monthScoreMatch) {
            console.log('\n=== 月令得分相关代码 ===');
            monthScoreMatch.slice(0, 5).forEach((match, index) => {
                console.log(`匹配 ${index + 1}:`, match.trim().substring(0, 100) + '...');
            });
        }
        
        // 查找巳酉丑三合金特殊处理
        const specialMatch = targetScript.match(/巳酉丑[\s\S]{0,300}/g);
        if (specialMatch) {
            console.log('\n=== 巳酉丑三合金特殊处理 ===');
            specialMatch.forEach((match, index) => {
                console.log(`匹配 ${index + 1}:`, match.trim());
            });
        }
    }
}

console.log('脚本执行完成');