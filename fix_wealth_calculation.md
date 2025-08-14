# 财富评分计算问题修复方案

## 问题描述
用户八字：丙辰，乙未，乙丑，己卯（女性，1976-07-12 6:00）
- 基础合计：72分
- 最终得分：65分
- 预期计算结果：50分（72 × 0.7）

## 根本原因分析

通过详细分析代码，发现以下问题：

### 1. 否决条款判断逻辑
在 `applyTraditionalVetoRules` 函数中：
- "比劫夺财无制"规则触发：比劫≥2，财星≥1，无官杀控制
- 应该执行：`adjusted *= 0.7`
- 但结果与预期不符

### 2. 可能的问题点

#### A. 财星计算不一致
在不同函数中，财星的计算可能有差异：
- `applyTraditionalVetoRules` 中只计算 year、month、hour 的财星
- 但 `calculateWealthScore` 中可能包含了日支的财星

#### B. 身强身弱判断影响
`calculateSimpleDayStrength` 函数可能返回了不同的身强度值，影响了否决条款的触发。

## 修复建议

### 1. 统一财星计算方法
确保所有函数中财星的计算逻辑一致：

```javascript
// 建议的统一财星计算函数
function countWealthStars(pillars, includeDayBranch = true) {
    const dayElement = getStemElement(pillars.day.charAt(0));
    let count = 0;
    
    // 计算年月时三柱的财星
    ['year', 'month', 'hour'].forEach(pos => {
        const stem = pillars[pos].charAt(0);
        const branch = pillars[pos].slice(1);
        if (isWealth(dayElement, getStemElement(stem))) count++;
        if (isWealth(dayElement, getBranchElement(branch))) count++;
    });
    
    // 可选择是否包含日支
    if (includeDayBranch) {
        const dayBranch = pillars.day.slice(1);
        if (isWealth(dayElement, getBranchElement(dayBranch))) count++;
    }
    
    return count;
}
```

### 2. 修复否决条款计算
在 `applyTraditionalVetoRules` 函数中，确保财星计算与主流程一致：

```javascript
function applyTraditionalVetoRules(score, pillars) {
    let adjusted = score;
    const dayElement = getStemElement(pillars.day.charAt(0));
    const dayStrength = calculateSimpleDayStrength(pillars);
    
    // 使用统一的财星计算方法
    const wealthCount = countWealthStars(pillars, false); // 不包含日支，与原逻辑保持一致
    const biJieCount = countBiJieStars(pillars);
    const yinCount = countYinStars(pillars);
    
    // 比劫夺财无制 - 修复逻辑
    if (biJieCount >= 2 && wealthCount >= 1) {
        const hasOfficerControl = ['year', 'month', 'hour'].some(pos => {
            const stem = pillars[pos].charAt(0);
            const branch = pillars[pos].slice(1);
            return isOfficer(dayElement, getStemElement(stem)) || 
                   isOfficer(dayElement, getBranchElement(branch));
        });
        if (!hasOfficerControl) {
            console.log(`比劫夺财无制触发：${adjusted} × 0.7`);
            adjusted *= 0.7;
        }
    }
    
    // 其他否决条款...
    
    return Math.max(0, Math.round(adjusted));
}
```

### 3. 增加调试日志
为了便于问题追踪，建议在关键计算点添加日志：

```javascript
// 在 calculateWealthScore 函数中添加
console.log('财富分数计算调试:', {
    baseScore: baseModulesTotal,
    beforeVeto: total,
    afterVeto: applyTraditionalVetoRules(total, safePillars),
    dayStrength: calculateSimpleDayStrength(safePillars),
    wealthCount: countWealthStars(safePillars, false),
    biJieCount: countBiJieStars(safePillars)
});
```

## 特定案例验证

对于丙辰，乙未，乙丑，己卯这个案例：
- 日主：乙木
- 财星（年月时）：辰土、未土、己土 = 3个
- 比劫星：乙木、卯木 = 2个
- 官杀星：无
- 应触发"比劫夺财无制"：72 × 0.7 = 50.4 → 50分

如果最终显示65分，可能是因为：
1. 财星计算包含了日支丑土
2. 存在其他未识别的调整机制
3. 舍入规则的差异

建议按照上述方案修复，并添加详细的调试日志来追踪具体的计算过程。