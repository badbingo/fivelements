// 财富评分调试脚本
// 在浏览器控制台中运行此脚本来调试财富评分

function debugWealthScore(pillars, caseName) {
    console.log(`\n=== ${caseName} 财富评分调试 ===`);
    console.log('八字:', pillars);
    
    // 重置全局变量
    wealthScoreValue = 0;
    wealthScoreDetails = null;
    
    // 计算各个组件分数
    const dayElement = getStemElement(pillars.day.charAt(0));
    console.log('日主元素:', dayElement);
    
    // 1. 食伤生财
    const shishangScore = calculateShishangEnergy(pillars);
    console.log('食伤生财分数:', shishangScore);
    
    // 2. 印绶护身
    const yinshouScore = calculateYinshouSupport(pillars);
    console.log('印绶护身分数:', yinshouScore);
    
    // 3. 财星能量
    const wealthStarScore = calculateWealthStarEnergy(pillars);
    console.log('财星能量分数:', wealthStarScore);
    
    // 4. 财星位置
    const wealthPositionScore = calculateWealthPosition(pillars);
    console.log('财星位置分数:', wealthPositionScore);
    
    // 5. 财富库
    const wealthVaultScore = calculateWealthVault(pillars);
    console.log('财富库分数:', wealthVaultScore);
    
    // 6. 日主承载力
    const dayMasterCapacity = calculateDayMasterCapacity(pillars);
    console.log('日主承载力分数:', dayMasterCapacity);
    
    // 7. 自坐财库
    const selfVaultScore = calculateSelfSittingVault(pillars);
    console.log('自坐财库分数:', selfVaultScore);
    
    // 8. 财气通门户
    const portalScore = calculateWealthPortal(pillars);
    console.log('财气通门户分数:', portalScore);
    
    // 9. 从财格
    const fromWealthScore = calculateFromWealthGrid(pillars);
    console.log('从财格分数:', fromWealthScore);
    
    // 基础分数
    let baseScore = shishangScore + yinshouScore + wealthStarScore + wealthPositionScore + 
                   wealthVaultScore + dayMasterCapacity + selfVaultScore + portalScore + fromWealthScore;
    console.log('基础分数总计:', baseScore);
    
    // 10. 十神组合特效
    const tenGodsBonus = calculateTenGodsEffects(pillars);
    console.log('十神组合加分:', tenGodsBonus);
    baseScore += tenGodsBonus;
    
    // 11. 特殊格局识别
    const specialPatterns = identifySpecialPatterns(pillars);
    console.log('特殊格局:', specialPatterns);
    const specialBonus = specialPatterns.reduce((sum, pattern) => sum + pattern.bonus, 0);
    console.log('特殊格局加分:', specialBonus);
    baseScore += specialBonus;
    
    // 12. 身财平衡调整
    const balanceAdjustment = calculateBodyWealthBalance(pillars);
    console.log('身财平衡调整:', balanceAdjustment);
    baseScore += balanceAdjustment;
    
    // 13. 大运流年修正
    const luckAdjustment = calculateLuckAdjustment(pillars, new Date().getFullYear());
    console.log('大运流年修正:', luckAdjustment);
    
    let total = Math.min(100, baseScore + luckAdjustment);
    console.log('限制前总分:', baseScore + luckAdjustment);
    console.log('限制后总分:', total);
    
    // 14. 应用否决条款
    const finalScore = applyVetoRules(total, pillars);
    console.log('否决条款后最终分数:', finalScore);
    
    // 详细分析身财平衡
    const dayStrength = calculateSimpleDayStrength(pillars);
    const wealthStrength = calculateWealthStrength(pillars);
    console.log('日主强度:', dayStrength);
    console.log('财富强度:', wealthStrength);
    console.log('承载系数:', wealthStrength > 0 ? dayStrength / wealthStrength : dayStrength / 50);
    
    return finalScore;
}

// 测试案例（使用正确的八字数据）
const testCases = [
    {
        name: "案例1：男，1973年2月2日18时",
        description: "壬子 癸丑 己巳 癸酉 - 己土日主，财多身弱格局",
        bazi: {
            year: "壬子",
            month: "癸丑", 
            day: "己巳",
            hour: "癸酉"
        },
        expectedIssues: ["身不胜财", "财星过多", "冬季土弱"]
    },
    {
        name: "案例2：女，1978年7月22日2时",
        description: "戊午 己未 乙酉 丁丑 - 乙木日主，财多身弱格局",
        bazi: {
            year: "戊午",
            month: "己未",
            day: "乙酉", 
            hour: "丁丑"
        },
        expectedIssues: ["身不胜财", "财星过多", "夏季木弱"]
    }
];

console.log('开始调试财富评分算法...');

// 运行测试案例
testCases.forEach(testCase => {
    console.log(`\n${testCase.description}`);
    console.log('预期问题:', testCase.expectedIssues.join(', '));
    debugWealthScore(testCase.bazi, testCase.name);
});