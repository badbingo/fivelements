/**
 * 增强版身强身弱计算模块
 * 包含土性变化逻辑的实现
 * 作者：八字系统
 * 日期：2024
 */

// 土性变化计算逻辑
class EarthTransformationCalculator {
    constructor() {
        // 湿土定义（容易受水影响的土）
        this.wetEarth = ['丑', '辰'];
        
        // 燥土定义（不易受水影响的土）
        this.dryEarth = ['未', '戌'];
        
        // 水元素（天干地支）
        this.waterStems = ['壬', '癸'];
        this.waterBranches = ['子', '亥'];
        
        // 三合局定义
        this.tripleCombinations = {
            '申子辰': { element: 'water', branches: ['申', '子', '辰'] },
            '亥卯未': { element: 'wood', branches: ['亥', '卯', '未'] },
            '寅午戌': { element: 'fire', branches: ['寅', '午', '戌'] },
            '巳酉丑': { element: 'metal', branches: ['巳', '酉', '丑'] }
        };
    }
    
    /**
     * 分析三合局对土的影响
     * @param {Array} branches - 地支数组
     * @returns {Object} 三合局分析结果
     */
    analyzeTripleCombinations(branches) {
        const result = {
            hasTriple: false,
            tripleInfo: null,
            earthImpact: {
                affected: false,
                reduction: 0,
                reason: ''
            }
        };
        
        // 检查巳酉丑三合金局
        const siYouChou = ['巳', '酉', '丑'];
        const foundBranches = siYouChou.filter(branch => branches.includes(branch));
        
        if (foundBranches.length >= 2) {
            result.hasTriple = true;
            result.tripleInfo = {
                type: '巳酉丑',
                element: 'metal',
                count: foundBranches.length,
                branches: foundBranches,
                isComplete: foundBranches.length === 3
            };
            
            // 如果丑土参与合金局
            if (foundBranches.includes('丑')) {
                result.earthImpact.affected = true;
                result.earthImpact.reduction = foundBranches.length === 3 ? 0.7 : 0.5; // 全三合减弱更多
                result.earthImpact.reason = `丑土参与${foundBranches.length === 3 ? '全' : '半'}三合金局，土气被金泄，力量减弱${(result.earthImpact.reduction * 100).toFixed(0)}%`;
            }
        }
        
        return result;
    }
    
    /**
     * 分析湿土遇水变性
     * @param {Array} stems - 天干数组
     * @param {Array} branches - 地支数组
     * @returns {Object} 土性变化分析结果
     */
    analyzeEarthTransformation(stems, branches) {
        const transformations = [];
        
        branches.forEach((branch, index) => {
            if (this.wetEarth.includes(branch)) {
                const transformation = this.checkWetEarthTransformation(stems, branches, index);
                if (transformation.hasTransformation) {
                    transformations.push(transformation);
                }
            }
        });
        
        return {
            hasTransformation: transformations.length > 0,
            transformations: transformations,
            totalEarthReduction: transformations.reduce((sum, t) => sum + t.reductionRate, 0),
            totalWaterIncrease: transformations.reduce((sum, t) => sum + t.waterIncrease, 0)
        };
    }
    
    /**
     * 检查单个湿土的变性情况
     * @param {Array} stems - 天干数组
     * @param {Array} branches - 地支数组
     * @param {number} position - 湿土在地支中的位置
     * @returns {Object} 变性分析结果
     */
    checkWetEarthTransformation(stems, branches, position) {
        const branch = branches[position];
        const stem = stems[position];
        
        const result = {
            branch: branch,
            position: position,
            hasTransformation: false,
            originalElement: 'earth',
            newElement: null,
            transformationType: null,
            waterSources: [],
            reductionRate: 0,
            waterIncrease: 0,
            reason: ''
        };
        
        let waterInfluence = 0;
        const waterSources = [];
        
        // 1. 检查本柱天干是否为水
        if (this.waterStems.includes(stem)) {
            waterInfluence += 0.8; // 本柱天干水影响最大
            waterSources.push(`本柱天干${stem}`);
        }
        
        // 2. 检查相邻地支是否为水
        if (position > 0 && this.waterBranches.includes(branches[position - 1])) {
            waterInfluence += 0.6;
            waterSources.push(`左邻地支${branches[position - 1]}`);
        }
        if (position < branches.length - 1 && this.waterBranches.includes(branches[position + 1])) {
            waterInfluence += 0.6;
            waterSources.push(`右邻地支${branches[position + 1]}`);
        }
        
        // 3. 检查其他天干水的影响
        stems.forEach((s, i) => {
            if (i !== position && this.waterStems.includes(s)) {
                waterInfluence += 0.4;
                const positionName = ['年', '月', '日', '时'][i];
                waterSources.push(`${positionName}干${s}`);
            }
        });
        
        // 4. 检查其他地支水的影响
        branches.forEach((b, i) => {
            if (i !== position && Math.abs(i - position) > 1 && this.waterBranches.includes(b)) {
                waterInfluence += 0.3;
                const positionName = ['年', '月', '日', '时'][i];
                waterSources.push(`${positionName}支${b}`);
            }
        });
        
        // 5. 判断是否发生变性
        if (waterInfluence >= 0.5) { // 水影响达到阈值
            result.hasTransformation = true;
            result.waterSources = waterSources;
            
            // 计算土力减弱和水力增强的程度
            if (waterInfluence >= 1.5) {
                result.reductionRate = 0.7; // 土力减弱70%
                result.waterIncrease = 0.5; // 增加50%水力
                result.newElement = 'water';
                result.transformationType = 'strong';
                result.reason = `${branch}土受强水影响，土性大幅减弱，偏向水性`;
            } else if (waterInfluence >= 1.0) {
                result.reductionRate = 0.5; // 土力减弱50%
                result.waterIncrease = 0.3; // 增加30%水力
                result.newElement = 'water';
                result.transformationType = 'medium';
                result.reason = `${branch}土受中等水影响，土性减弱，略偏水性`;
            } else {
                result.reductionRate = 0.3; // 土力减弱30%
                result.waterIncrease = 0.2; // 增加20%水力
                result.newElement = null;
                result.transformationType = 'weakened';
                result.reason = `${branch}土受轻微水影响，土性略有减弱`;
            }
        }
        
        return result;
    }
    
    /**
     * 增强版五行力量计算
     * @param {Array} stems - 天干数组
     * @param {Array} branches - 地支数组
     * @param {Object} branchElements - 地支藏干映射
     * @returns {Object} 调整后的五行力量分布
     */
    calculateEnhancedElements(stems, branches, branchElements) {
        const elements = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
        
        // 基础映射
        const stemElementMap = {
            '甲': 'wood', '乙': 'wood', '丙': 'fire', '丁': 'fire', '戊': 'earth',
            '己': 'earth', '庚': 'metal', '辛': 'metal', '壬': 'water', '癸': 'water'
        };
        
        const branchElementMap = {
            '子': 'water', '丑': 'earth', '寅': 'wood', '卯': 'wood', '辰': 'earth',
            '巳': 'fire', '午': 'fire', '未': 'earth', '申': 'metal', '酉': 'metal',
            '戌': 'earth', '亥': 'water'
        };
        
        // 1. 分析三合局影响
        const tripleAnalysis = this.analyzeTripleCombinations(branches);
        
        // 2. 分析土性变化
        const earthTransformation = this.analyzeEarthTransformation(stems, branches);
        
        // 3. 计算天干五行（不受土性变化影响）
        stems.forEach(stem => {
            const element = stemElementMap[stem];
            if (element) elements[element] += 1;
        });
        
        // 4. 计算地支主气（考虑土性变化）
        branches.forEach((branch, index) => {
            let element = branchElementMap[branch];
            
            if (element === 'earth') {
                // 检查是否有土性变化
                const transformation = earthTransformation.transformations.find(t => t.position === index);
                if (transformation) {
                    // 土力减弱，水力增强
                    elements[element] += (1 - transformation.reductionRate);
                    elements['water'] += transformation.waterIncrease;
                } else {
                    elements[element] += 1;
                }
            } else {
                elements[element] += 1;
            }
        });
        
        // 5. 计算地支藏干（考虑土性变化）
        branches.forEach((branch, index) => {
            const branchInfo = branchElements[branch];
            if (branchInfo && branchInfo.hidden) {
                branchInfo.hidden.forEach(hiddenStem => {
                    const element = stemElementMap[hiddenStem];
                    if (element) {
                        if (element === 'earth') {
                            const transformation = earthTransformation.transformations.find(t => t.position === index);
                            if (transformation) {
                                // 藏干土力也受影响
                                elements[element] += 0.5 * (1 - transformation.reductionRate * 0.5);
                                elements['water'] += 0.5 * transformation.waterIncrease * 0.5;
                            } else {
                                elements[element] += 0.5;
                            }
                        } else {
                            elements[element] += 0.5;
                        }
                    }
                });
            }
        });
        
        // 6. 应用三合局影响
        if (tripleAnalysis.hasTriple) {
            const tripleInfo = tripleAnalysis.tripleInfo;
            if (tripleInfo.type === '巳酉丑') {
                // 巳酉丑合金局的影响
                const strengthBonus = tripleInfo.isComplete ? 1.0 : 0.6;
                elements['metal'] += strengthBonus; // 增强金力
                elements['water'] += strengthBonus * 0.5; // 金生水
                elements['fire'] = Math.max(0, elements['fire'] - 0.3); // 火被金克
                
                // 如果丑土参与，额外减弱土力
                if (tripleAnalysis.earthImpact.affected) {
                    elements['earth'] = Math.max(0, elements['earth'] - tripleAnalysis.earthImpact.reduction);
                }
            }
        }
        
        return {
            elements: elements,
            tripleAnalysis: tripleAnalysis,
            earthTransformation: earthTransformation,
            adjustments: {
                tripleImpact: tripleAnalysis.hasTriple,
                earthTransformation: earthTransformation.hasTransformation,
                totalEarthReduction: earthTransformation.totalEarthReduction + (tripleAnalysis.earthImpact.affected ? tripleAnalysis.earthImpact.reduction : 0),
                totalWaterIncrease: earthTransformation.totalWaterIncrease
            }
        };
    }
    
    /**
     * 从格判断（考虑土性变化）
     * @param {number} supportRatio - 生扶力量比例
     * @param {Object} analysisResult - 分析结果
     * @returns {Object} 从格判断结果
     */
    analyzeCongGe(supportRatio, analysisResult) {
        const result = {
            isCongGe: false,
            type: '',
            reason: '',
            confidence: 0
        };
        
        // 从弱格判断（生扶力量极少）
        if (supportRatio <= 0.2) {
            result.isCongGe = true;
            result.type = '从弱';
            result.confidence = (0.2 - supportRatio) / 0.2; // 越小置信度越高
            result.reason = `生扶力量仅${(supportRatio * 100).toFixed(1)}%，日主极弱，顺从克泄耗的力量`;
            
            // 如果有土性变化，增加置信度
            if (analysisResult.adjustments.earthTransformation) {
                result.confidence = Math.min(1, result.confidence + 0.2);
                result.reason += '，土性变化进一步减弱日主力量';
            }
        }
        // 从强格判断（生扶力量极多）
        else if (supportRatio >= 0.8) {
            result.isCongGe = true;
            result.type = '从强';
            result.confidence = (supportRatio - 0.8) / 0.2;
            result.reason = `生扶力量达${(supportRatio * 100).toFixed(1)}%，日主极强，顺从生扶的力量`;
        }
        
        return result;
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EarthTransformationCalculator;
} else if (typeof window !== 'undefined') {
    window.EarthTransformationCalculator = EarthTransformationCalculator;
}

/**
 * 使用示例：
 * 
 * const calculator = new EarthTransformationCalculator();
 * const stems = ['壬', '癸', '己', '癸'];
 * const branches = ['子', '丑', '巳', '酉'];
 * 
 * const result = calculator.calculateEnhancedElements(stems, branches, BRANCH_ELEMENTS);
 * console.log('增强计算结果:', result);
 * 
 * const congGeResult = calculator.analyzeCongGe(result.supportRatio, result);
 * console.log('从格判断:', congGeResult);
 */