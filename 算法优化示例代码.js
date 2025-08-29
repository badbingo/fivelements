// 八字身强身弱算法优化示例代码
// 基于对 system/bazinew.html 的分析，提供具体的改进实现

// ===== 1. 优化月令权重计算 =====

/**
 * 精细化月令得分计算
 * @param {string} dayElement - 日主五行
 * @param {string} monthBranch - 月支
 * @param {number} birthDay - 出生日期
 * @param {Object} jieQi - 节气信息
 */
function calculateAdvancedMonthStrength(dayElement, monthBranch, birthDay, jieQi) {
    // 基础月令得分
    const baseScore = getBasicMonthScore(dayElement, monthBranch);
    
    // 节气深浅调节因子 (-0.3 到 +0.3)
    const seasonalDepth = calculateSeasonalDepth(birthDay, jieQi);
    
    // 土月特殊处理
    if (['辰', '戌', '丑', '未'].includes(monthBranch)) {
        return calculateEarthMonthScore(dayElement, monthBranch, seasonalDepth);
    }
    
    // 应用节气深浅调节
    const adjustedScore = Math.round(baseScore * (1 + seasonalDepth));
    
    return Math.max(-30, Math.min(50, adjustedScore)); // 限制在合理范围内
}

/**
 * 计算节气深浅影响
 */
function calculateSeasonalDepth(birthDay, jieQi) {
    const currentJieQi = getCurrentJieQi(birthDay, jieQi);
    const nextJieQi = getNextJieQi(birthDay, jieQi);
    
    const totalDays = nextJieQi.date - currentJieQi.date;
    const passedDays = birthDay - currentJieQi.date;
    const progress = passedDays / totalDays;
    
    // 节气初期力量较弱，中后期力量较强
    if (progress < 0.3) {
        return -0.2; // 节气初期，减弱20%
    } else if (progress > 0.7) {
        return 0.3; // 节气后期，增强30%
    } else {
        return 0.1; // 节气中期，略微增强
    }
}

// ===== 2. 优化地支藏干权重 =====

/**
 * 精确的地支藏干权重配置
 */
const PRECISE_BRANCH_ELEMENTS = {
    '子': { '癸': 1.0 }, // 子水纯粹
    '丑': { '己': 0.6, '癸': 0.3, '辛': 0.1 }, // 本气、中气、余气
    '寅': { '甲': 0.7, '丙': 0.2, '戊': 0.1 },
    '卯': { '乙': 1.0 },
    '辰': { '戊': 0.6, '乙': 0.2, '癸': 0.2 },
    '巳': { '丙': 0.7, '戊': 0.2, '庚': 0.1 },
    '午': { '丁': 0.7, '己': 0.3 },
    '未': { '己': 0.6, '丁': 0.2, '乙': 0.2 },
    '申': { '庚': 0.7, '壬': 0.2, '戊': 0.1 },
    '酉': { '辛': 1.0 },
    '戌': { '戊': 0.6, '辛': 0.2, '丁': 0.2 },
    '亥': { '壬': 0.7, '甲': 0.3 }
};

/**
 * 根据季节调节地支藏干力量
 */
function getSeasonalAdjustedHiddenPower(branch, hiddenStem, monthBranch) {
    const baseWeight = PRECISE_BRANCH_ELEMENTS[branch][hiddenStem] || 0;
    const seasonalMultiplier = getSeasonalMultiplier(hiddenStem, monthBranch);
    
    return baseWeight * seasonalMultiplier;
}

/**
 * 季节调节系数
 */
function getSeasonalMultiplier(element, monthBranch) {
    const season = getSeason(monthBranch);
    
    const multipliers = {
        spring: { wood: 1.4, fire: 1.1, earth: 0.8, metal: 0.6, water: 0.9 },
        summer: { wood: 0.9, fire: 1.4, earth: 1.1, metal: 0.5, water: 0.4 },
        autumn: { wood: 0.5, fire: 0.7, earth: 1.0, metal: 1.4, water: 0.8 },
        winter: { wood: 0.4, fire: 0.6, earth: 0.7, metal: 1.0, water: 1.4 }
    };
    
    const elementMap = { '甲': 'wood', '乙': 'wood', '丙': 'fire', '丁': 'fire', 
                        '戊': 'earth', '己': 'earth', '庚': 'metal', '辛': 'metal', 
                        '壬': 'water', '癸': 'water' };
    
    return multipliers[season][elementMap[element]] || 1.0;
}

// ===== 3. 严格的从格判断标准 =====

/**
 * 严格的从格判断函数
 */
function checkStrictFollowingPattern(dayElement, strengthRatio, supportStrength, 
                                   weakenStrength, monthBranch, pillars) {
    
    // 从弱格判断 - 极严格标准
    if (isFollowWeakPattern(dayElement, strengthRatio, supportStrength, monthBranch, pillars)) {
        return {
            type: '从弱',
            confidence: calculateConfidence(strengthRatio, 'weak'),
            reason: '日主极弱，顺从克泄之势'
        };
    }
    
    // 从强格判断 - 极严格标准
    if (isFollowStrongPattern(dayElement, strengthRatio, supportStrength, monthBranch, pillars)) {
        return {
            type: '从强', 
            confidence: calculateConfidence(strengthRatio, 'strong'),
            reason: '日主极强，顺从生扶之势'
        };
    }
    
    return { type: 'normal' };
}

/**
 * 从弱格判断条件
 */
function isFollowWeakPattern(dayElement, strengthRatio, supportStrength, monthBranch, pillars) {
    // 条件1：生扶力量极弱（不超过8%）
    if (strengthRatio > 0.08) return false;
    
    // 条件2：月令必须克泄日主
    if (!isMonthWeakening(dayElement, monthBranch)) return false;
    
    // 条件3：四柱中无强力生扶
    if (hasStrongSupport(dayElement, pillars)) return false;
    
    // 条件4：排除假从（有强根但被制）
    if (hasFakeFollowing(dayElement, pillars)) return false;
    
    // 条件5：生扶绝对力量也要很低
    if (supportStrength > 5) return false;
    
    return true;
}

/**
 * 从强格判断条件
 */
function isFollowStrongPattern(dayElement, strengthRatio, supportStrength, monthBranch, pillars) {
    // 条件1：生扶力量极强（超过95%）
    if (strengthRatio < 0.95) return false;
    
    // 条件2：月令必须生扶日主
    if (!isMonthSupporting(dayElement, monthBranch)) return false;
    
    // 条件3：生扶力量压倒性优势
    if (supportStrength < 25) return false;
    
    // 条件4：克泄力量微乎其微
    const weakenStrength = calculateWeakenStrength(dayElement, pillars);
    if (weakenStrength > 2) return false;
    
    return true;
}

// ===== 4. 优化的身强身弱判断标准 =====

/**
 * 优化的身强身弱判断函数
 */
function determineOptimizedStrengthType(supportRatio, monthScore, specialFactors = {}) {
    // 月令修正系数
    const monthAdjustment = calculateMonthAdjustment(monthScore);
    const adjustedRatio = Math.max(0.05, Math.min(0.95, supportRatio + monthAdjustment));
    
    // 特殊情况修正
    const finalRatio = applySpecialAdjustments(adjustedRatio, specialFactors);
    
    // 判断身强身弱
    if (finalRatio >= 0.70) {
        return {
            type: '身强',
            level: finalRatio >= 0.80 ? '偏强' : '中强',
            ratio: finalRatio,
            description: '日主力量充足，能胜任财官'
        };
    } else if (finalRatio >= 0.45) {
        return {
            type: '均衡',
            level: finalRatio >= 0.55 ? '偏强均衡' : '偏弱均衡',
            ratio: finalRatio,
            description: '日主力量适中，喜忌需细辨'
        };
    } else {
        return {
            type: '身弱',
            level: finalRatio <= 0.30 ? '偏弱' : '中弱',
            ratio: finalRatio,
            description: '日主力量不足，需要生扶'
        };
    }
}

/**
 * 月令修正系数计算
 */
function calculateMonthAdjustment(monthScore) {
    // 月令得分转换为比例调整
    if (monthScore >= 30) return 0.15;      // 强力生扶
    if (monthScore >= 15) return 0.08;      // 一般生扶
    if (monthScore >= -10) return 0;        // 中性
    if (monthScore >= -20) return -0.08;    // 一般克泄
    return -0.15;                           // 强力克泄
}

// ===== 5. 大运流年权重优化 =====

/**
 * 优化的大运流年影响计算
 */
function calculateOptimizedCurrentStrength(originalElements, currentYear, currentDayun) {
    const currentElements = { ...originalElements };
    
    // 流年影响（权重降低）
    if (currentYear) {
        const yearStem = currentYear.stem;
        const yearBranch = currentYear.branch;
        
        // 流年天干影响（从0.8降至0.4）
        const yearStemElement = stemElementMap[yearStem];
        currentElements[yearStemElement] += 0.4;
        
        // 流年地支影响（从1.2降至0.6）
        const yearBranchElement = branchElementMap[yearBranch];
        currentElements[yearBranchElement] += 0.6;
        
        // 流年地支藏干（权重减半）
        if (PRECISE_BRANCH_ELEMENTS[yearBranch]) {
            Object.entries(PRECISE_BRANCH_ELEMENTS[yearBranch]).forEach(([stem, weight]) => {
                const element = stemElementMap[stem];
                currentElements[element] += weight * 0.3; // 原来0.6，现在0.3
            });
        }
    }
    
    // 大运影响（权重降低）
    if (currentDayun) {
        const dayunStem = currentDayun.stem;
        const dayunBranch = currentDayun.branch;
        
        // 大运天干影响（从0.6降至0.3）
        const dayunStemElement = stemElementMap[dayunStem];
        currentElements[dayunStemElement] += 0.3;
        
        // 大运地支影响（从1.0降至0.5）
        const dayunBranchElement = branchElementMap[dayunBranch];
        currentElements[dayunBranchElement] += 0.5;
        
        // 大运地支藏干（权重减半）
        if (PRECISE_BRANCH_ELEMENTS[dayunBranch]) {
            Object.entries(PRECISE_BRANCH_ELEMENTS[dayunBranch]).forEach(([stem, weight]) => {
                const element = stemElementMap[stem];
                currentElements[element] += weight * 0.25; // 原来0.5，现在0.25
            });
        }
    }
    
    return currentElements;
}

// ===== 6. 辅助函数 =====

function getSeason(monthBranch) {
    const seasonMap = {
        '寅': 'spring', '卯': 'spring', '辰': 'spring',
        '巳': 'summer', '午': 'summer', '未': 'summer', 
        '申': 'autumn', '酉': 'autumn', '戌': 'autumn',
        '亥': 'winter', '子': 'winter', '丑': 'winter'
    };
    return seasonMap[monthBranch] || 'spring';
}

function isMonthWeakening(dayElement, monthBranch) {
    // 判断月令是否克泄日主
    const monthElement = branchElementMap[monthBranch];
    return isRestricting(monthElement, dayElement) || isOutputting(dayElement, monthElement);
}

function isMonthSupporting(dayElement, monthBranch) {
    // 判断月令是否生扶日主
    const monthElement = branchElementMap[monthBranch];
    return isGenerating(monthElement, dayElement) || monthElement === dayElement;
}

function calculateConfidence(ratio, type) {
    if (type === 'weak') {
        return ratio <= 0.05 ? 'very_high' : ratio <= 0.08 ? 'high' : 'medium';
    } else if (type === 'strong') {
        return ratio >= 0.98 ? 'very_high' : ratio >= 0.95 ? 'high' : 'medium';
    }
    return 'low';
}

// ===== 使用示例 =====

/**
 * 完整的优化算法使用示例
 */
function calculateOptimizedBaziStrength(bazi, birthDate, currentYear, currentDayun) {
    // 1. 计算基础五行力量（使用优化的藏干权重）
    const baseElements = calculateBaseElements(bazi);
    
    // 2. 应用季节调节
    const seasonalElements = applySeasonalAdjustment(baseElements, bazi.month.branch);
    
    // 3. 计算优化的月令得分
    const monthScore = calculateAdvancedMonthStrength(
        bazi.day.stem, bazi.month.branch, birthDate.day, birthDate.jieQi
    );
    
    // 4. 加入大运流年影响（使用优化权重）
    const currentElements = calculateOptimizedCurrentStrength(
        seasonalElements, currentYear, currentDayun
    );
    
    // 5. 计算生扶克泄力量
    const { supportStrength, weakenStrength } = calculateSupportWeaken(
        bazi.day.stem, currentElements
    );
    
    // 6. 计算力量比例
    const strengthRatio = supportStrength / (supportStrength + weakenStrength);
    
    // 7. 检查从格
    const followingPattern = checkStrictFollowingPattern(
        bazi.day.stem, strengthRatio, supportStrength, weakenStrength,
        bazi.month.branch, [bazi.year, bazi.month, bazi.day, bazi.hour]
    );
    
    if (followingPattern.type !== 'normal') {
        return followingPattern;
    }
    
    // 8. 确定身强身弱
    return determineOptimizedStrengthType(strengthRatio, monthScore);
}

// 导出优化函数
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        calculateAdvancedMonthStrength,
        getSeasonalAdjustedHiddenPower,
        checkStrictFollowingPattern,
        determineOptimizedStrengthType,
        calculateOptimizedCurrentStrength,
        calculateOptimizedBaziStrength
    };
}