# 财富评分算法问题分析报告

## 问题概述
两个财多身弱的八字案例都获得了100分满分，这明显不符合命理学原理。

## 测试案例

### 案例1：男，1973年2月2日18时
- **八字**：壬子 癸丑 己巳 癸酉
- **日主**：己土
- **问题**：己土在丑月（冬季）身弱，财星过多（壬水、子水、癸水×2 = 4个财星）
- **应得分数**：低分（身不胜财）
- **实际得分**：100分

### 案例2：女，1978年7月22日2时
- **八字**：戊午 己未 乙酉 丁丑
- **日主**：乙木
- **问题**：乙木在未月（夏季土旺）身弱，财星过多（戊土、己土、未土、丑土 = 4个财星）
- **应得分数**：低分（身不胜财）
- **实际得分**：100分

## 算法缺陷分析

### 1. 从财格识别过于宽松（主要问题）

**位置**：`identifySpecialPatterns` 函数（第6290行）

**问题代码**：
```javascript
if (wealthCount >= 2 && biJieCount === 0 && yinCount <= 1) {
    patterns.push({
        name: '从财格',
        description: '日主从财星之势，富贵可期',
        bonus: 30  // 直接给30分加分！
    });
}
```

**问题分析**：
- 只检查财星数量、比劫数量、印星数量
- **完全忽略了日主强弱判断**
- 真正的从财格需要日主极弱且无救助才能成立
- 当前逻辑会将所有财多身弱的格局误判为从财格

### 2. 身财平衡算法的二次加分

**位置**：`calculateBodyWealthBalance` 函数（第6674行）

**问题代码**：
```javascript
if (carryingCapacity < 0.3) {
    // 检查是否真正从财格
    const biJieCount = countBiJieStars(pillars);
    const yinCount = countYinStars(pillars);
    if (biJieCount === 0 && yinCount <= 1) {
        balanceScore = 12; // 真从财格，富贵可期
    }
}
```

**问题分析**：
- 与 `identifySpecialPatterns` 重复判断从财格
- 导致同一个条件被加分两次（30+12=42分）
- 缺乏严格的日主强度阈值判断

### 3. 财库计算可能重复加分

**位置**：多个函数中都有财库相关计算
- `calculateWealthVault`
- `calculateSelfSittingVault` 
- `calculateWealthPortal`

**问题分析**：
- 可能存在同一个财库被多次计分
- 缺乏统一的财库计分机制

## 修复建议

### 1. 修正从财格识别条件

```javascript
// 修正后的从财格识别
if (wealthCount >= 2 && biJieCount === 0 && yinCount <= 1) {
    const dayStrength = calculateSimpleDayStrength(pillars);
    const wealthStrength = calculateWealthStrength(pillars);
    
    // 真从财格：日主极弱(≤30)且财星极旺(≥15)
    if (dayStrength <= 30 && wealthStrength >= 15) {
        patterns.push({
            name: '真从财格',
            description: '日主极弱从财星之势，富贵可期',
            bonus: 25
        });
    }
    // 假从财格：日主较弱但未达到真从的程度
    else if (dayStrength <= 45 && wealthStrength >= 12) {
        patterns.push({
            name: '假从财格', 
            description: '日主偏弱，财星较旺',
            bonus: 10
        });
    }
    // 身不胜财：财多身弱的不利格局
    else {
        patterns.push({
            name: '身不胜财',
            description: '财星过多，日主承载不足',
            bonus: -15  // 应该扣分而非加分
        });
    }
}
```

### 2. 避免重复计分

- 在 `calculateBodyWealthBalance` 中移除从财格判断
- 统一由 `identifySpecialPatterns` 处理特殊格局
- 建立财库计分的统一机制

### 3. 增加否决条款

在 `applyVetoRules` 中增加：
```javascript
// 身不胜财否决条款
if (dayStrength < 40 && wealthCount >= 3 && biJieCount === 0) {
    score = Math.min(score, 60); // 财多身弱最高60分
}
```

## 结论

当前算法的主要问题是**从财格识别过于宽松**，将所有财多身弱的格局都误判为有利的从财格，导致大幅加分。修复的关键是增加严格的日主强度判断，并区分真从财格、假从财格和身不胜财三种不同情况。