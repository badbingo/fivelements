/**
 * 土性变化计算器
 * 实现辰丑戌未在特定条件下的五行属性变化逻辑
 */
class EarthTransformationCalculator {
    constructor() {
        // 定义湿土和燥土
        this.wetEarth = ['辰', '丑']; // 湿土
        this.dryEarth = ['戌', '未']; // 燥土
        
        // 五行映射
        this.stemElementMap = {
            '甲': 'wood', '乙': 'wood',
            '丙': 'fire', '丁': 'fire',
            '戊': 'earth', '己': 'earth',
            '庚': 'metal', '辛': 'metal',
            '壬': 'water', '癸': 'water'
        };
        
        this.branchElementMap = {
            '子': 'water', '丑': 'earth', '寅': 'wood', '卯': 'wood',
            '辰': 'earth', '巳': 'fire', '午': 'fire', '未': 'earth',
            '申': 'metal', '酉': 'metal', '戌': 'earth', '亥': 'water'
        };
        
        // 地支藏干
        this.branchHiddenStems = {
            '子': ['癸'],
            '丑': ['己', '癸', '辛'],
            '寅': ['甲', '丙', '戊'],
            '卯': ['乙'],
            '辰': ['戊', '乙', '癸'],
            '巳': ['丙', '庚', '戊'],
            '午': ['丁', '己'],
            '未': ['己', '丁', '乙'],
            '申': ['庚', '壬', '戊'],
            '酉': ['辛'],
            '戌': ['戊', '辛', '丁'],
            '亥': ['壬', '甲']
        };
    }
    
    /**
     * 分析土性变化
     * @param {Array} stems - 天干数组
     * @param {Array} branches - 地支数组
     * @returns {Object} 土性变化分析结果
     */
    analyzeEarthTransformation(stems, branches) {
        const transformations = [];
        const wetEarthChanges = [];
        const dryEarthChanges = [];
        const elementAdjustments = {
            wood: 0, fire: 0, earth: 0, metal: 0, water: 0
        };
        
        // 分析每个地支的土性变化
        for (let i = 0; i < branches.length; i++) {
            const branch = branches[i];
            const stem = stems[i] || '';
            
            if (this.wetEarth.includes(branch)) {
                // 湿土（辰丑）变化分析
                const wetTransform = this.analyzeWetEarthTransformation(branch, stem, stems, branches, i);
                if (wetTransform.hasTransformation) {
                    transformations.push(wetTransform);
                    wetEarthChanges.push({
                        earthBranch: branch,
                        newElement: wetTransform.newElement,
                        reason: wetTransform.reason
                    });
                    // 应用变化到五行调整
                    elementAdjustments.earth += wetTransform.earthChange;
                    elementAdjustments.water += wetTransform.waterChange;
                    elementAdjustments.fire += wetTransform.fireChange;
                }
            } else if (this.dryEarth.includes(branch)) {
                // 燥土（戌未）变化分析
                const dryTransform = this.analyzeDryEarthTransformation(branch, stem, stems, branches, i);
                if (dryTransform.hasTransformation) {
                    transformations.push(dryTransform);
                    dryEarthChanges.push({
                        earthBranch: branch,
                        newElement: dryTransform.newElement,
                        reason: dryTransform.reason
                    });
                    // 应用变化到五行调整
                    elementAdjustments.earth += dryTransform.earthChange;
                    elementAdjustments.fire += dryTransform.fireChange;
                    elementAdjustments.water += dryTransform.waterChange;
                }
            }
        }
        
        return {
            transformations,
            wetEarthChanges,
            dryEarthChanges,
            elementAdjustments,
            hasAnyTransformation: transformations.length > 0
        };
    }
    
    /**
     * 分析湿土（辰丑）变化
     * 辰丑同干为水，或周围水旺时，辰丑做水看
     * 辰丑同干支为火，或周围火旺时，辰丑做土看（保持原性）
     */
    analyzeWetEarthTransformation(branch, stem, stems, branches, position) {
        const result = {
            branch,
            position,
            hasTransformation: false,
            transformationType: '',
            reason: '',
            originalElement: 'earth',
            newElement: 'earth',
            earthChange: 0,
            waterChange: 0,
            fireChange: 0
        };
        
        // 检查同干是否为水
        const stemIsWater = this.stemElementMap[stem] === 'water';
        
        // 检查同干支是否为火
        const stemIsFire = this.stemElementMap[stem] === 'fire';
        
        // 计算周围水的力量
        const waterStrength = this.calculateElementStrength('water', stems, branches, position);
        
        // 计算周围火的力量
        const fireStrength = this.calculateElementStrength('fire', stems, branches, position);
        
        // 判断变化条件
        if (stemIsWater || waterStrength >= 2.0) {
            // 湿土遇水做水看
            result.hasTransformation = true;
            result.transformationType = 'wetEarthToWater';
            result.reason = stemIsWater ? `${branch}同干${stem}为水` : `${branch}周围水旺(强度${waterStrength.toFixed(1)})`;
            result.newElement = 'water';
            
            // 土力减少，水力增加
            const transformationStrength = stemIsWater ? 0.8 : Math.min(waterStrength * 0.3, 0.6);
            result.earthChange = -transformationStrength;
            result.waterChange = transformationStrength;
            
        } else if (stemIsFire || fireStrength >= 2.0) {
            // 湿土遇火保持土性（实际上是增强土性）
            result.hasTransformation = true;
            result.transformationType = 'wetEarthStayEarth';
            result.reason = stemIsFire ? `${branch}同干${stem}为火，土性增强` : `${branch}周围火旺(强度${fireStrength.toFixed(1)})，土性增强`;
            result.newElement = 'earth';
            
            // 土力增加
            const enhancementStrength = stemIsFire ? 0.3 : Math.min(fireStrength * 0.15, 0.3);
            result.earthChange = enhancementStrength;
        }
        
        return result;
    }
    
    /**
     * 分析燥土（戌未）变化
     * 戌未同干支为火，或周围火旺时，戌未做火看
     * 戌未同干支为水，或周围水旺时，戌未做土看（保持原性）
     */
    analyzeDryEarthTransformation(branch, stem, stems, branches, position) {
        const result = {
            branch,
            position,
            hasTransformation: false,
            transformationType: '',
            reason: '',
            originalElement: 'earth',
            newElement: 'earth',
            earthChange: 0,
            waterChange: 0,
            fireChange: 0
        };
        
        // 检查同干是否为火
        const stemIsFire = this.stemElementMap[stem] === 'fire';
        
        // 检查同干是否为水
        const stemIsWater = this.stemElementMap[stem] === 'water';
        
        // 计算周围火的力量
        const fireStrength = this.calculateElementStrength('fire', stems, branches, position);
        
        // 计算周围水的力量
        const waterStrength = this.calculateElementStrength('water', stems, branches, position);
        
        // 判断变化条件
        if (stemIsFire || fireStrength >= 2.0) {
            // 燥土遇火做火看
            result.hasTransformation = true;
            result.transformationType = 'dryEarthToFire';
            result.reason = stemIsFire ? `${branch}同干${stem}为火` : `${branch}周围火旺(强度${fireStrength.toFixed(1)})`;
            result.newElement = 'fire';
            
            // 土力减少，火力增加
            const transformationStrength = stemIsFire ? 0.8 : Math.min(fireStrength * 0.3, 0.6);
            result.earthChange = -transformationStrength;
            result.fireChange = transformationStrength;
            
        } else if (stemIsWater || waterStrength >= 2.0) {
            // 燥土遇水保持土性（实际上是增强土性）
            result.hasTransformation = true;
            result.transformationType = 'dryEarthStayEarth';
            result.reason = stemIsWater ? `${branch}同干${stem}为水，土性增强` : `${branch}周围水旺(强度${waterStrength.toFixed(1)})，土性增强`;
            result.newElement = 'earth';
            
            // 土力增加
            const enhancementStrength = stemIsWater ? 0.3 : Math.min(waterStrength * 0.15, 0.3);
            result.earthChange = enhancementStrength;
        }
        
        return result;
    }
    
    /**
     * 计算指定五行在八字中的力量
     */
    calculateElementStrength(targetElement, stems, branches, excludePosition = -1) {
        let strength = 0;
        
        // 计算天干力量
        for (let i = 0; i < stems.length; i++) {
            if (i === excludePosition) continue;
            const stem = stems[i];
            if (this.stemElementMap[stem] === targetElement) {
                strength += 1.0; // 天干基础力量
            }
        }
        
        // 计算地支力量
        for (let i = 0; i < branches.length; i++) {
            if (i === excludePosition) continue;
            const branch = branches[i];
            
            // 地支主气
            if (this.branchElementMap[branch] === targetElement) {
                strength += 1.2; // 地支主气力量
            }
            
            // 地支藏干
            const hiddenStems = this.branchHiddenStems[branch] || [];
            hiddenStems.forEach((hiddenStem, index) => {
                if (this.stemElementMap[hiddenStem] === targetElement) {
                    // 藏干力量递减：主气1.0，次气0.6，余气0.3
                    const hiddenStrength = index === 0 ? 0.6 : (index === 1 ? 0.4 : 0.2);
                    strength += hiddenStrength;
                }
            });
        }
        
        return strength;
    }
    
    /**
     * 应用土性变化到五行分布
     */
    applyEarthTransformation(originalElements, transformationResult) {
        const adjustedElements = { ...originalElements };
        
        if (transformationResult.hasAnyTransformation) {
            // 应用五行调整
            Object.keys(transformationResult.elementAdjustments).forEach(element => {
                const adjustment = transformationResult.elementAdjustments[element];
                if (adjustment !== 0) {
                    adjustedElements[element] = Math.max(0, adjustedElements[element] + adjustment);
                }
            });
        }
        
        return {
            elements: adjustedElements,
            transformationDetails: transformationResult.transformations
        };
    }
    
    /**
     * 获取土性变化的详细说明
     */
    getTransformationDescription(transformations) {
        if (transformations.length === 0) {
            return '无土性变化';
        }
        
        const descriptions = transformations.map(t => {
            switch (t.transformationType) {
                case 'wetEarthToWater':
                    return `${t.branch}${t.reason}，做水看（土-${Math.abs(t.earthChange).toFixed(1)}，水+${t.waterChange.toFixed(1)}）`;
                case 'wetEarthStayEarth':
                    return `${t.branch}${t.reason}（土+${t.earthChange.toFixed(1)}）`;
                case 'dryEarthToFire':
                    return `${t.branch}${t.reason}，做火看（土-${Math.abs(t.earthChange).toFixed(1)}，火+${t.fireChange.toFixed(1)}）`;
                case 'dryEarthStayEarth':
                    return `${t.branch}${t.reason}（土+${t.earthChange.toFixed(1)}）`;
                default:
                    return `${t.branch}发生未知变化`;
            }
        });
        
        return descriptions.join('；');
    }
}

// 导出类供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EarthTransformationCalculator;
} else if (typeof window !== 'undefined') {
    window.EarthTransformationCalculator = EarthTransformationCalculator;
}