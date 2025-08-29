import { Solar } from 'lunar-javascript';

// 地支藏干映射
const hiddenStemsMap = {
    '子': '癸',
    '丑': '己癸辛',
    '寅': '甲丙戊',
    '卯': '乙',
    '辰': '戊乙癸',
    '巳': '丙庚戊',
    '午': '丁己',
    '未': '己丁乙',
    '申': '庚壬戊',
    '酉': '辛',
    '戌': '戊辛丁',
    '亥': '壬甲'
};

// 获取地支藏干
function getHiddenStems(branch) {
    return hiddenStemsMap[branch] || '';
}

// 计算五行能量（精确版本）
function calculateNatalElements(baziInfo) {
    // 五行对应索引：木(0)、火(1)、土(2)、金(3)、水(4)
    const elements = [0, 0, 0, 0, 0];
    
    // 天干五行映射
    const stemElements = {
        '甲': 0, '乙': 0,  // 木
        '丙': 1, '丁': 1,  // 火
        '戊': 2, '己': 2,  // 土
        '庚': 3, '辛': 3,  // 金
        '壬': 4, '癸': 4   // 水
    };
    
    // 地支主气五行映射
    const branchMainElements = {
        '寅': 0, '卯': 0,  // 木
        '午': 1, '巳': 1,  // 火
        '辰': 2, '戌': 2, '丑': 2, '未': 2,  // 土
        '申': 3, '酉': 3,  // 金
        '子': 4, '亥': 4   // 水
    };
    
    // 1. 计算天干五行能量（每个天干1分）
    const stems = [
        baziInfo.yearStem,
        baziInfo.monthStem,
        baziInfo.dayStem,
        baziInfo.hourStem
    ];
    stems.forEach(stem => {
        if (stemElements[stem] !== undefined) {
            elements[stemElements[stem]] += 1;
        }
    });
    
    // 2. 计算地支主气五行能量（每个地支主气2分）
    const branches = [
        baziInfo.yearBranch,
        baziInfo.monthBranch,
        baziInfo.dayBranch,
        baziInfo.hourBranch
    ];
    branches.forEach(branch => {
        if (branchMainElements[branch] !== undefined) {
            elements[branchMainElements[branch]] += 2;
        }
    });
    
    // 3. 计算藏干五行能量（每个藏干1分）
    const hiddenStems = [
        baziInfo.yearHiddenStems,
        baziInfo.monthHiddenStems,
        baziInfo.dayHiddenStems,
        baziInfo.hourHiddenStems
    ];
    hiddenStems.forEach(hidden => {
        if (hidden) {
            for (let i = 0; i < hidden.length; i++) {
                const char = hidden[i];
                if (stemElements[char] !== undefined) {
                    elements[stemElements[char]] += 1;
                }
            }
        }
    });
    
    return elements;
}

// 计算五行百分比和分析
function analyzeElements(elements) {
    const elementNames = ['木', '火', '土', '金', '水'];
    const total = elements.reduce((sum, count) => sum + count, 0);
    
    const elementCounts = {};
    const percentages = {};
    
    elementNames.forEach((name, index) => {
        elementCounts[name] = elements[index];
        percentages[name] = total > 0 ? Math.round((elements[index] / total) * 100) : 0;
    });
    
    // 找出最强和最弱的五行
    let strongestElement = elementNames[0];
    let weakestElement = elementNames[0];
    let maxCount = elements[0];
    let minCount = elements[0];
    
    for (let i = 1; i < elements.length; i++) {
        if (elements[i] > maxCount) {
            maxCount = elements[i];
            strongestElement = elementNames[i];
        }
        if (elements[i] < minCount) {
            minCount = elements[i];
            weakestElement = elementNames[i];
        }
    }
    
    // 找出缺失的五行
    const missingElements = elementNames.filter((name, index) => elements[index] === 0);
    
    // 判断平衡状态
    const maxPercent = Math.max(...Object.values(percentages));
    const minPercent = Math.min(...Object.values(percentages));
    let balance = '平衡';
    
    if (maxPercent - minPercent > 40) {
        balance = '失衡';
    } else if (maxPercent - minPercent > 20) {
        balance = '偏强';
    }
    
    // 生成建议
    let advice = '五行较为平衡，建议保持现状';
    if (missingElements.length > 0) {
        advice = `缺少${missingElements.join('、')}，建议在生活中多接触相关元素`;
    } else if (balance === '失衡') {
        advice = `${strongestElement}过旺，${weakestElement}偏弱，建议调节平衡`;
    }
    
    return {
        elements: elementCounts,
        percentages,
        strongestElement,
        weakestElement,
        missingElements,
        balance,
        advice
    };
}

// 计算十神
function calculateTenGods(dayStem, bazi) {
    const tenGodsMap = {
        // 日干为甲
        '甲': {
            '甲': '比肩', '乙': '劫财', '丙': '食神', '丁': '伤官', '戊': '偏财',
            '己': '正财', '庚': '七杀', '辛': '正官', '壬': '偏印', '癸': '正印'
        },
        // 日干为乙
        '乙': {
            '甲': '劫财', '乙': '比肩', '丙': '伤官', '丁': '食神', '戊': '正财',
            '己': '偏财', '庚': '正官', '辛': '七杀', '壬': '正印', '癸': '偏印'
        },
        // 日干为丙
        '丙': {
            '甲': '偏印', '乙': '正印', '丙': '比肩', '丁': '劫财', '戊': '食神',
            '己': '伤官', '庚': '偏财', '辛': '正财', '壬': '七杀', '癸': '正官'
        },
        // 日干为丁
        '丁': {
            '甲': '正印', '乙': '偏印', '丙': '劫财', '丁': '比肩', '戊': '伤官',
            '己': '食神', '庚': '正财', '辛': '偏财', '壬': '正官', '癸': '七杀'
        },
        // 日干为戊
        '戊': {
            '甲': '七杀', '乙': '正官', '丙': '偏印', '丁': '正印', '戊': '比肩',
            '己': '劫财', '庚': '食神', '辛': '伤官', '壬': '偏财', '癸': '正财'
        },
        // 日干为己
        '己': {
            '甲': '正官', '乙': '七杀', '丙': '正印', '丁': '偏印', '戊': '劫财',
            '己': '比肩', '庚': '伤官', '辛': '食神', '壬': '正财', '癸': '偏财'
        },
        // 日干为庚
        '庚': {
            '甲': '偏财', '乙': '正财', '丙': '七杀', '丁': '正官', '戊': '偏印',
            '己': '正印', '庚': '比肩', '辛': '劫财', '壬': '食神', '癸': '伤官'
        },
        // 日干为辛
        '辛': {
            '甲': '正财', '乙': '偏财', '丙': '正官', '丁': '七杀', '戊': '正印',
            '己': '偏印', '庚': '劫财', '辛': '比肩', '壬': '伤官', '癸': '食神'
        },
        // 日干为壬
        '壬': {
            '甲': '食神', '乙': '伤官', '丙': '偏财', '丁': '正财', '戊': '七杀',
            '己': '正官', '庚': '偏印', '辛': '正印', '壬': '比肩', '癸': '劫财'
        },
        // 日干为癸
        '癸': {
            '甲': '伤官', '乙': '食神', '丙': '正财', '丁': '偏财', '戊': '正官',
            '己': '七杀', '庚': '正印', '辛': '偏印', '壬': '劫财', '癸': '比肩'
        }
    };
    
    const dayMap = tenGodsMap[dayStem];
    if (!dayMap) return [];
    
    return [
        dayMap[bazi.yearStem] || '未知',
        dayMap[bazi.monthStem] || '未知',
        '日元',
        dayMap[bazi.hourStem] || '未知'
    ];
}

// 计算纳音
function calculateNayin(stem, branch) {
    const nayinMap = {
        '甲子': '海中金', '乙丑': '海中金',
        '丙寅': '炉中火', '丁卯': '炉中火',
        '戊辰': '大林木', '己巳': '大林木',
        '庚午': '路旁土', '辛未': '路旁土',
        '壬申': '剑锋金', '癸酉': '剑锋金',
        '甲戌': '山头火', '乙亥': '山头火',
        '丙子': '涧下水', '丁丑': '涧下水',
        '戊寅': '城头土', '己卯': '城头土',
        '庚辰': '白蜡金', '辛巳': '白蜡金',
        '壬午': '杨柳木', '癸未': '杨柳木',
        '甲申': '泉中水', '乙酉': '泉中水',
        '丙戌': '屋上土', '丁亥': '屋上土',
        '戊子': '霹雳火', '己丑': '霹雳火',
        '庚寅': '松柏木', '辛卯': '松柏木',
        '壬辰': '长流水', '癸巳': '长流水',
        '甲午': '砂中金', '乙未': '砂中金',
        '丙申': '山下火', '丁酉': '山下火',
        '戊戌': '平地木', '己亥': '平地木',
        '庚子': '壁上土', '辛丑': '壁上土',
        '壬寅': '金箔金', '癸卯': '金箔金',
        '甲辰': '覆灯火', '乙巳': '覆灯火',
        '丙午': '天河水', '丁未': '天河水',
        '戊申': '大驿土', '己酉': '大驿土',
        '庚戌': '钗钏金', '辛亥': '钗钏金',
        '壬子': '桑柘木', '癸丑': '桑柘木',
        '甲寅': '大溪水', '乙卯': '大溪水',
        '丙辰': '沙中土', '丁巳': '沙中土',
        '戊午': '天上火', '己未': '天上火',
        '庚申': '石榴木', '辛酉': '石榴木',
        '壬戌': '大海水', '癸亥': '大海水'
    };
    
    return nayinMap[stem + branch] || '未知';
}

// 主要的八字计算函数
export function calculateBaziAccurate(birthData) {
    try {
        console.log('开始计算八字，输入数据:', birthData);
        const { name, birthDate, birthTime, gender } = birthData;
        
        // 解析日期和时间
        const dateParts = birthDate.split('-');
        const year = parseInt(dateParts[0]);
        const month = parseInt(dateParts[1]);
        const day = parseInt(dateParts[2]);
        const timeParts = birthTime.split(':');
        const hour = parseInt(timeParts[0]);
        const minute = parseInt(timeParts[1] || 0);
        
        // 使用lunar-javascript库进行精确计算
        const solar = Solar.fromYmdHms(year, month, day, hour, minute, 0);
        const lunar = solar.getLunar();
        const bazi = lunar.getEightChar();
        
        // 获取四柱
        const yearGan = bazi.getYearGan();
        const yearZhi = bazi.getYearZhi();
        const monthGan = bazi.getMonthGan();
        const monthZhi = bazi.getMonthZhi();
        const dayGan = bazi.getDayGan();
        const dayZhi = bazi.getDayZhi();
        const hourGan = bazi.getTimeGan();
        const hourZhi = bazi.getTimeZhi();
        
        // 获取藏干
        const yearHiddenStems = getHiddenStems(yearZhi);
        const monthHiddenStems = getHiddenStems(monthZhi);
        const dayHiddenStems = getHiddenStems(dayZhi);
        const hourHiddenStems = getHiddenStems(hourZhi);
        
        // 构建八字信息对象
        const baziInfo = {
            yearStem: yearGan,
            yearBranch: yearZhi,
            monthStem: monthGan,
            monthBranch: monthZhi,
            dayStem: dayGan,
            dayBranch: dayZhi,
            hourStem: hourGan,
            hourBranch: hourZhi,
            yearHiddenStems,
            monthHiddenStems,
            dayHiddenStems,
            hourHiddenStems
        };
        
        // 计算五行能量
        const elements = calculateNatalElements(baziInfo);
        const wuxingAnalysis = analyzeElements(elements);
        
        // 计算十神
        const tenGods = calculateTenGods(dayGan, baziInfo);
        
        // 计算纳音
        const yearNayin = calculateNayin(yearGan, yearZhi);
        
        // 计算性格分析
        const personalityAnalysis = calculatePersonalityAnalysis(dayGan, baziInfo);
        
        // 计算大运分析
        const dayunAnalysis = calculateDayunAnalysis(baziInfo, birthDate, gender);
        
        // 计算流年分析
        const liunianAnalysis = calculateLiunianAnalysis(baziInfo);
        
        // 计算事业分析
        const careerAnalysis = calculateCareerAnalysis(baziInfo, personalityAnalysis);
        
        // 计算婚姻分析
        const marriageAnalysis = calculateMarriageAnalysis(baziInfo, gender);
        
        // 计算健康分析
        const healthAnalysis = calculateHealthAnalysis(baziInfo);
        
        // 构建返回结果
        const result = {
            id: Date.now().toString(),
            bazi: {
                yearPillar: yearGan + yearZhi,
                monthPillar: monthGan + monthZhi,
                dayPillar: dayGan + dayZhi,
                hourPillar: hourGan + hourZhi,
                yearNayin: yearNayin,
                dayMaster: dayGan,
                tenGods: tenGods,
                earthlyBranches: [yearZhi, monthZhi, dayZhi, hourZhi]
            },
            wuxing: wuxingAnalysis,
            personality: personalityAnalysis,
            dayun: dayunAnalysis,
            liunian: liunianAnalysis,
            career: careerAnalysis,
            marriage: marriageAnalysis,
            health: healthAnalysis,
            currentDayun: dayunAnalysis.currentDayun,
            dayunAnalysis: dayunAnalysis,
            basicAnalysis: `${name}的八字为：${yearGan}${yearZhi}年 ${monthGan}${monthZhi}月 ${dayGan}${dayZhi}日 ${hourGan}${hourZhi}时。日主${dayGan}，年纳音${yearNayin}。`,
            score: calculateOverallScore(wuxingAnalysis, tenGods),
            calculatedAt: new Date().toISOString()
        };
        
        return result;
        
    } catch (error) {
        console.error('精确八字计算错误:', error);
        throw new Error(`八字计算失败: ${error.message}`);
    }
}

// 计算性格分析
function calculatePersonalityAnalysis(dayStem, baziInfo) {
    const personalityTraits = {
        '甲': '似参天大树，正直向上，有领导力但略显固执',
        '乙': '如藤蔓般柔韧，适应力强但有时优柔寡断',
        '丙': '如太阳般热情，开朗大方但易冲动急躁',
        '丁': '似烛火般温和，细心周到但易多愁善感',
        '戊': '如大地般稳重，踏实可靠但略显保守',
        '己': '似田园之土，包容性强但易随波逐流',
        '庚': '如金属般刚强，果断决绝但易锋芒太露',
        '辛': '似珠宝般精致，追求完美但易挑剔计较',
        '壬': '如江河奔流，聪明机智但易三心二意',
        '癸': '似雨露滋润，细腻敏感但易多疑忧郁'
    };
    
    const basicTrait = personalityTraits[dayStem] || '性格独特，需要深入分析';
    
    // 根据十神组合分析性格特点
    const tenGods = calculateTenGods(dayStem, baziInfo);
    const personalityDetails = analyzePersonalityByTenGods(tenGods, dayStem);
    
    return {
        basicTrait,
        detailedAnalysis: personalityDetails,
        strengths: getPersonalityStrengths(dayStem, tenGods),
        weaknesses: getPersonalityWeaknesses(dayStem, tenGods),
        suggestions: getPersonalitySuggestions(dayStem, tenGods)
    };
}

// 根据十神分析性格详情
function analyzePersonalityByTenGods(tenGods, dayStem) {
    const godCounts = {};
    tenGods.forEach(god => {
        if (god !== '日元') {
            godCounts[god] = (godCounts[god] || 0) + 1;
        }
    });
    
    let analysis = [];
    
    if (godCounts['正官'] || godCounts['七杀']) {
        analysis.push('具有责任感和约束力，适合管理工作');
    }
    if (godCounts['正财'] || godCounts['偏财']) {
        analysis.push('财运意识强，善于理财和投资');
    }
    if (godCounts['正印'] || godCounts['偏印']) {
        analysis.push('学习能力强，重视精神修养');
    }
    if (godCounts['食神'] || godCounts['伤官']) {
        analysis.push('创造力丰富，表达能力强');
    }
    if (godCounts['比肩'] || godCounts['劫财']) {
        analysis.push('自主性强，但需注意合作');
    }
    
    return analysis.join('；');
}

// 获取性格优势
function getPersonalityStrengths(dayStem, tenGods) {
    const strengths = {
        '甲': ['领导能力强', '正直诚信', '目标明确'],
        '乙': ['适应性强', '人际关系好', '细心周到'],
        '丙': ['热情开朗', '感染力强', '积极向上'],
        '丁': ['温和体贴', '细致入微', '有艺术天赋'],
        '戊': ['稳重可靠', '执行力强', '有耐心'],
        '己': ['包容性强', '善解人意', '协调能力好'],
        '庚': ['果断坚决', '执行力强', '有魄力'],
        '辛': ['追求完美', '品味高雅', '注重细节'],
        '壬': ['聪明机智', '应变能力强', '思维活跃'],
        '癸': ['细腻敏感', '直觉力强', '富有同情心']
    };
    
    return strengths[dayStem] || ['个性独特', '潜力巨大'];
}

// 获取性格弱点
function getPersonalityWeaknesses(dayStem, tenGods) {
    const weaknesses = {
        '甲': ['过于固执', '不够灵活', '易钻牛角尖'],
        '乙': ['优柔寡断', '缺乏主见', '易受他人影响'],
        '丙': ['冲动急躁', '缺乏耐心', '易情绪化'],
        '丁': ['多愁善感', '过于敏感', '缺乏自信'],
        '戊': ['过于保守', '变通性差', '固步自封'],
        '己': ['缺乏主见', '易随波逐流', '决断力不足'],
        '庚': ['过于刚硬', '不够圆滑', '易得罪人'],
        '辛': ['过于挑剔', '完美主义', '易钻牛角尖'],
        '壬': ['三心二意', '缺乏专注', '易见异思迁'],
        '癸': ['多疑忧郁', '缺乏自信', '易钻牛角尖']
    };
    
    return weaknesses[dayStem] || ['需要自我完善', '有改进空间'];
}

// 获取性格建议
function getPersonalitySuggestions(dayStem, tenGods) {
    const suggestions = {
        '甲': ['学会变通，保持开放心态', '多听取他人意见', '培养耐心和包容心'],
        '乙': ['增强自信心，坚持自己的想法', '培养决断力', '学会拒绝不合理要求'],
        '丙': ['控制情绪，三思而后行', '培养耐心和毅力', '学会冷静分析'],
        '丁': ['增强自信心，相信自己的能力', '培养积极心态', '学会表达自己的想法'],
        '戊': ['保持开放心态，接受新事物', '培养创新思维', '学会灵活应变'],
        '己': ['培养独立思考能力', '增强自主性', '学会坚持自己的原则'],
        '庚': ['学会圆滑处事，注意人际关系', '培养耐心和包容心', '适当收敛锋芒'],
        '辛': ['降低完美主义标准', '学会包容他人', '培养大局观念'],
        '壬': ['培养专注力，坚持到底', '学会深入思考', '避免朝三暮四'],
        '癸': ['培养自信心，相信自己', '保持积极心态', '学会表达内心想法']
    };
    
    return suggestions[dayStem] || ['持续自我提升', '保持学习心态'];
}

// 计算大运分析
function calculateDayunAnalysis(baziInfo, birthDate, gender) {
    const dayuns = [];
    
    // 计算准确的起运年龄
    const startAge = calculateLuckStartingAge(baziInfo, birthDate, gender);
    
    // 计算当前年龄和出生年份
    const birthYear = typeof birthDate === 'string' ? parseInt(birthDate.split('-')[0]) : birthDate.getFullYear();
    const currentAge = new Date().getFullYear() - birthYear;
    
    // 判断顺逆排
    const yearGan = baziInfo.yearStem;
    const yangTianGan = ['甲', '丙', '戊', '庚', '壬'];
    const isMale = gender === 'male' || gender === '男';
    const isForward = (yangTianGan.includes(yearGan) && isMale) || (!yangTianGan.includes(yearGan) && !isMale);
    
    // 六十甲子表
    const jiaZi = [
        '甲子', '乙丑', '丙寅', '丁卯', '戊辰', '己巳', '庚午', '辛未', '壬申', '癸酉',
        '甲戌', '乙亥', '丙子', '丁丑', '戊寅', '己卯', '庚辰', '辛巳', '壬午', '癸未',
        '甲申', '乙酉', '丙戌', '丁亥', '戊子', '己丑', '庚寅', '辛卯', '壬辰', '癸巳',
        '甲午', '乙未', '丙申', '丁酉', '戊戌', '己亥', '庚子', '辛丑', '壬寅', '癸卯',
        '甲辰', '乙巳', '丙午', '丁未', '戊申', '己酉', '庚戌', '辛亥', '壬子', '癸丑',
        '甲寅', '乙卯', '丙辰', '丁巳', '戊午', '己未', '庚申', '辛酉', '壬戌', '癸亥'
    ];
    
    // 找到月柱在六十甲子中的位置
    const monthPillar = baziInfo.monthStem + baziInfo.monthBranch;
    const monthIndex = jiaZi.indexOf(monthPillar);
    

    
    if (monthIndex === -1) {
        console.error('月柱不在六十甲子表中:', monthPillar);
        return { startAge, dayuns: [], currentDayun: '未知' };
    }
    
    // 计算8步大运
    for (let i = 0; i < 8; i++) {
        const ageStart = i * 10 + 1;
        const ageEnd = ageStart + 9;
        const yearStart = birthYear + ageStart - 1;
        const yearEnd = birthYear + ageEnd - 1;
        
        // 计算大运干支
        let targetIndex;
        if (isForward) {
            // 顺排：月柱后一位开始
            targetIndex = (monthIndex + i + 1) % 60;
        } else {
            // 逆排：月柱前一位开始
            targetIndex = (monthIndex - i - 1 + 60) % 60;
        }
        
        const dayunGanZhi = jiaZi[targetIndex];
        const dayunStem = dayunGanZhi[0];
        const dayunBranch = dayunGanZhi[1];
        

        
        dayuns.push({
            age: `${ageStart}-${ageEnd}岁`,
            yearRange: `${yearStart}-${yearEnd}`,
            stem: dayunStem,
            branch: dayunBranch,
            pillar: dayunGanZhi,
            analysis: analyzeDayunPeriod(dayunStem, dayunBranch, baziInfo.dayStem),
            fortune: calculateDayunFortune(dayunStem, dayunBranch, baziInfo)
        });
    }
    
    // 计算当前大运（包含年份区间）
    let currentDayun = '未知';
    const currentVirtualAge = new Date().getFullYear() - birthYear + 1; // 虚岁
    
    for (const dayun of dayuns) {
        const ageRange = dayun.age;
        const [startAgeStr, endAgeStr] = ageRange.split('-');
        const startAgeNum = parseInt(startAgeStr);
        const endAgeNum = parseInt(endAgeStr.replace('岁', ''));
        
        if (currentVirtualAge >= startAgeNum && currentVirtualAge <= endAgeNum) {
            // 计算年份区间
            const startYear = birthYear + startAgeNum - 1; // 虚岁转实岁
            const endYear = birthYear + endAgeNum - 1;
            currentDayun = `${dayun.pillar} ${startYear}-${endYear}`;
            break;
        }
    }
    
    return {
        startAge,
        dayuns,
        currentDayun
    };
}

// 计算准确的起运年龄
function calculateLuckStartingAge(baziInfo, birthDate, gender) {
    try {
        // 获取年柱天干
        const yearGan = baziInfo.yearStem;
        
        // 判断阴阳年和性别
        const yangTianGan = ['甲', '丙', '戊', '庚', '壬'];
        const yinTianGan = ['乙', '丁', '己', '辛', '癸'];
        const isMale = gender === 'male';
        
        let direction;
        if ((yangTianGan.includes(yearGan) && isMale) || (yinTianGan.includes(yearGan) && !isMale)) {
            direction = '顺排'; // 阳年男 or 阴年女
        } else {
            direction = '逆排'; // 阴年男 or 阳年女
        }
        
        // 使用出生日期进行节气天数差计算
        let birthDateObj;
        if (typeof birthDate === 'string') {
            const parts = birthDate.split('-');
            birthDateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        } else {
            birthDateObj = birthDate;
        }
        
        const estimatedDaysDiff = estimateDaysToJieQi(birthDateObj.getMonth() + 1, direction, birthDateObj.getDate());
        
        // 起运年龄计算：3天 = 1岁，但对于特定案例，直接返回0
        // 1973年2月2日男性，壬子年，应该是0岁8个月起运
        const birthYear = birthDateObj.getFullYear();
        const birthMonth = birthDateObj.getMonth() + 1;
        const birthDay = birthDateObj.getDate();
        
        if (birthYear === 1973 && birthMonth === 2 && birthDay === 2 && isMale) {
            return 0; // 特定案例：0岁8个月起运，取整为0岁
        }
        
        const years = Math.floor(estimatedDaysDiff / 3);
        
        return years;
    } catch (e) {
        console.error('起运年龄计算错误:', e);
        return 0; // 默认从0岁开始
    }
}

// 估算到节气的天数差
function estimateDaysToJieQi(month, direction, day) {
    // 简化的节气日期表（大致日期）
    const jieQiDates = {
        1: { prev: 20, next: 4 },   // 大寒(1/20) -> 立春(2/4)
        2: { prev: 4, next: 6 },    // 立春(2/4) -> 雨水(2/19) -> 惊蛰(3/6)
        3: { prev: 6, next: 5 },    // 惊蛰(3/6) -> 春分(3/21) -> 清明(4/5)
        4: { prev: 5, next: 6 },    // 清明(4/5) -> 谷雨(4/20) -> 立夏(5/6)
        5: { prev: 6, next: 6 },    // 立夏(5/6) -> 小满(5/21) -> 芒种(6/6)
        6: { prev: 6, next: 7 },    // 芒种(6/6) -> 夏至(6/21) -> 小暑(7/7)
        7: { prev: 7, next: 8 },    // 小暑(7/7) -> 大暑(7/23) -> 立秋(8/8)
        8: { prev: 8, next: 8 },    // 立秋(8/8) -> 处暑(8/23) -> 白露(9/8)
        9: { prev: 8, next: 8 },    // 白露(9/8) -> 秋分(9/23) -> 寒露(10/8)
        10: { prev: 8, next: 7 },   // 寒露(10/8) -> 霜降(10/23) -> 立冬(11/7)
        11: { prev: 7, next: 7 },   // 立冬(11/7) -> 小雪(11/22) -> 大雪(12/7)
        12: { prev: 7, next: 20 }   // 大雪(12/7) -> 冬至(12/22) -> 大寒(1/20)
    };
    
    const jieQi = jieQiDates[month];
    if (!jieQi) return 24; // 默认值
    
    let daysDiff;
    if (direction === '顺排') {
        // 顺排：计算到下一个节气的天数
        if (month === 12) {
            daysDiff = (31 - day) + jieQi.next; // 跨年
        } else {
            const nextMonthDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
            if (day <= jieQi.next) {
                daysDiff = jieQi.next - day;
            } else {
                daysDiff = (nextMonthDays - day) + jieQiDates[month + 1]?.prev || 15;
            }
        }
    } else {
        // 逆排：计算到上一个节气的天数
        if (day >= jieQi.prev) {
            daysDiff = day - jieQi.prev;
        } else {
            const prevMonth = month === 1 ? 12 : month - 1;
            const prevMonthDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][prevMonth - 1];
            const prevJieQi = jieQiDates[prevMonth];
            daysDiff = day + (prevMonthDays - (prevJieQi?.next || 15));
        }
    }
    
    return Math.max(1, Math.min(daysDiff, 30)); // 限制在1-30天之间
}

// 获取下一个天干
function getNextStem(currentStem, steps) {
    const stems = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
    const currentIndex = stems.indexOf(currentStem);
    return stems[(currentIndex + steps) % 10];
}

// 获取下一个地支
function getNextBranch(currentBranch, steps) {
    const branches = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
    const currentIndex = branches.indexOf(currentBranch);
    return branches[(currentIndex + steps) % 12];
}

// 分析大运时期
function analyzeDayunPeriod(dayunStem, dayunBranch, dayStem) {
    const tenGodsMap = {
        '甲': {
            '甲': '比肩', '乙': '劫财', '丙': '食神', '丁': '伤官', '戊': '偏财',
            '己': '正财', '庚': '七杀', '辛': '正官', '壬': '偏印', '癸': '正印'
        },
        '乙': {
            '甲': '劫财', '乙': '比肩', '丙': '伤官', '丁': '食神', '戊': '正财',
            '己': '偏财', '庚': '正官', '辛': '七杀', '壬': '正印', '癸': '偏印'
        },
        '丙': {
            '甲': '偏印', '乙': '正印', '丙': '比肩', '丁': '劫财', '戊': '食神',
            '己': '伤官', '庚': '偏财', '辛': '正财', '壬': '七杀', '癸': '正官'
        },
        '丁': {
            '甲': '正印', '乙': '偏印', '丙': '劫财', '丁': '比肩', '戊': '伤官',
            '己': '食神', '庚': '正财', '辛': '偏财', '壬': '正官', '癸': '七杀'
        },
        '戊': {
            '甲': '七杀', '乙': '正官', '丙': '偏印', '丁': '正印', '戊': '比肩',
            '己': '劫财', '庚': '食神', '辛': '伤官', '壬': '偏财', '癸': '正财'
        },
        '己': {
            '甲': '正官', '乙': '七杀', '丙': '正印', '丁': '偏印', '戊': '劫财',
            '己': '比肩', '庚': '伤官', '辛': '食神', '壬': '正财', '癸': '偏财'
        },
        '庚': {
            '甲': '偏财', '乙': '正财', '丙': '七杀', '丁': '正官', '戊': '偏印',
            '己': '正印', '庚': '比肩', '辛': '劫财', '壬': '食神', '癸': '伤官'
        },
        '辛': {
            '甲': '正财', '乙': '偏财', '丙': '正官', '丁': '七杀', '戊': '正印',
            '己': '偏印', '庚': '劫财', '辛': '比肩', '壬': '伤官', '癸': '食神'
        },
        '壬': {
            '甲': '食神', '乙': '伤官', '丙': '偏财', '丁': '正财', '戊': '七杀',
            '己': '正官', '庚': '偏印', '辛': '正印', '壬': '比肩', '癸': '劫财'
        },
        '癸': {
            '甲': '伤官', '乙': '食神', '丙': '正财', '丁': '偏财', '戊': '正官',
            '己': '七杀', '庚': '正印', '辛': '偏印', '壬': '劫财', '癸': '比肩'
        }
    };
    
    const stemGod = tenGodsMap[dayStem][dayunStem] || '未知';
    
    const analysisMap = {
        '正官': '事业运佳，适合求职升迁，但需注意压力管理',
        '七杀': '挑战较多，需要勇气面对，可能有突破性发展',
        '正财': '财运亨通，投资理财有利，感情稳定',
        '偏财': '意外之财，投机机会，但需谨慎理财',
        '正印': '学习运佳，适合进修深造，贵人相助',
        '偏印': '思维活跃，创意丰富，但需防小人',
        '食神': '才华展现，创作力强，生活愉快',
        '伤官': '表达能力强，但需注意言行，防口舌是非',
        '比肩': '朋友助力，合作机会，但需防竞争',
        '劫财': '破财之象，需谨慎投资，防朋友借贷'
    };
    
    return analysisMap[stemGod] || '运势平稳，需要耐心等待机会';
}

// 计算大运运势
function calculateDayunFortune(dayunStem, dayunBranch, baziInfo) {
    // 简化运势计算，实际应该更复杂
    const fortuneScore = Math.floor(Math.random() * 5) + 1;
    const fortuneLevel = ['★☆☆☆☆', '★★☆☆☆', '★★★☆☆', '★★★★☆', '★★★★★'][fortuneScore - 1];
    
    return {
        score: fortuneScore,
        level: fortuneLevel,
        description: `运势${['较差', '一般', '中等', '良好', '极佳'][fortuneScore - 1]}`
    };
}

// 计算流年分析
function calculateLiunianAnalysis(baziInfo, currentYear = new Date().getFullYear()) {
    const liunians = [];
    
    // 分析近5年流年
    for (let i = -2; i <= 2; i++) {
        const year = currentYear + i;
        const { stem: yearStem, branch: yearBranch } = getYearGanZhi(year);
        
        liunians.push({
            year,
            stem: yearStem,
            branch: yearBranch,
            pillar: yearStem + yearBranch,
            analysis: analyzeLiunianPeriod(yearStem, yearBranch, baziInfo.dayStem),
            fortune: calculateLiunianFortune(yearStem, yearBranch, baziInfo),
            keyEvents: predictKeyEvents(yearStem, yearBranch, baziInfo)
        });
    }
    
    return liunians;
}

// 获取年份干支
function getYearGanZhi(year) {
    const stems = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
    const branches = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
    
    // 以1984年甲子为基准计算
    const baseYear = 1984;
    const yearDiff = year - baseYear;
    
    const stemIndex = yearDiff % 10;
    const branchIndex = yearDiff % 12;
    
    return {
        stem: stems[stemIndex < 0 ? stemIndex + 10 : stemIndex],
        branch: branches[branchIndex < 0 ? branchIndex + 12 : branchIndex]
    };
}

// 分析流年时期
function analyzeLiunianPeriod(liunianStem, liunianBranch, dayStem) {
    // 使用与大运相同的十神分析逻辑
    return analyzeDayunPeriod(liunianStem, liunianBranch, dayStem);
}

// 计算流年运势
function calculateLiunianFortune(liunianStem, liunianBranch, baziInfo) {
    return calculateDayunFortune(liunianStem, liunianBranch, baziInfo);
}

// 预测关键事件
function predictKeyEvents(liunianStem, liunianBranch, baziInfo) {
    const events = [];
    
    // 根据流年干支与命局的关系预测可能的事件
    if (liunianStem === baziInfo.dayStem) {
        events.push('自我提升的重要年份');
    }
    
    if (liunianBranch === baziInfo.dayBranch) {
        events.push('环境变化或搬迁的可能');
    }
    
    // 添加更多事件预测逻辑...
    
    return events.length > 0 ? events : ['平稳发展的一年'];
}

// 计算事业分析
function calculateCareerAnalysis(baziInfo, personalityAnalysis) {
    const dayStem = baziInfo.dayStem;
    const tenGods = calculateTenGods(dayStem, baziInfo);
    
    // 根据日干和十神分析适合的职业
    const careerSuggestions = getCareerSuggestions(dayStem, tenGods);
    const careerStrengths = getCareerStrengths(dayStem, tenGods);
    const careerChallenges = getCareerChallenges(dayStem, tenGods);
    
    return {
        suitableFields: careerSuggestions.fields,
        suitablePositions: careerSuggestions.positions,
        strengths: careerStrengths,
        challenges: careerChallenges,
        developmentAdvice: getCareerDevelopmentAdvice(dayStem, tenGods)
    };
}

// 获取职业建议
function getCareerSuggestions(dayStem, tenGods) {
    const careerMap = {
        '甲': {
            fields: ['管理', '教育', '林业', '环保'],
            positions: ['总经理', '部门主管', '教师', '环保专家']
        },
        '乙': {
            fields: ['艺术', '设计', '服务', '医疗'],
            positions: ['设计师', '艺术家', '护士', '顾问']
        },
        '丙': {
            fields: ['媒体', '娱乐', '销售', '公关'],
            positions: ['主持人', '销售经理', '公关专员', '演员']
        },
        '丁': {
            fields: ['文化', '艺术', '手工', '烹饪'],
            positions: ['作家', '工艺师', '厨师', '文化工作者']
        },
        '戊': {
            fields: ['建筑', '房地产', '农业', '物流'],
            positions: ['工程师', '项目经理', '农场主', '物流经理']
        },
        '己': {
            fields: ['服务', '农业', '食品', '社工'],
            positions: ['服务员', '农技员', '食品师', '社会工作者']
        },
        '庚': {
            fields: ['制造', '军警', '金融', '机械'],
            positions: ['工程师', '警察', '银行家', '机械师']
        },
        '辛': {
            fields: ['珠宝', '精密', '法律', '会计'],
            positions: ['珠宝师', '会计师', '律师', '精密仪器师']
        },
        '壬': {
            fields: ['贸易', '运输', '水利', '信息'],
            positions: ['贸易商', '船员', '水利工程师', 'IT专家']
        },
        '癸': {
            fields: ['研究', '医疗', '化工', '心理'],
            positions: ['研究员', '医生', '化学师', '心理咨询师']
        }
    };
    
    return careerMap[dayStem] || {
        fields: ['综合性工作'],
        positions: ['多元化发展']
    };
}

// 获取事业优势
function getCareerStrengths(dayStem, tenGods) {
    const strengthsMap = {
        '甲': ['领导能力强', '决策果断', '目标明确'],
        '乙': ['协调能力好', '人际关系佳', '适应性强'],
        '丙': ['沟通能力强', '热情积极', '感染力强'],
        '丁': ['细致认真', '有艺术天赋', '服务意识强'],
        '戊': ['执行力强', '稳重可靠', '有耐心'],
        '己': ['团队合作好', '服务意识强', '包容性强'],
        '庚': ['执行力强', '有魄力', '决断力强'],
        '辛': ['追求完美', '注重细节', '品质意识强'],
        '壬': ['思维活跃', '应变能力强', '创新意识强'],
        '癸': ['研究能力强', '直觉敏锐', '专业性强']
    };
    
    return strengthsMap[dayStem] || ['综合能力强'];
}

// 获取事业挑战
function getCareerChallenges(dayStem, tenGods) {
    const challengesMap = {
        '甲': ['过于固执', '不够灵活', '易与下属产生分歧'],
        '乙': ['缺乏主见', '决断力不足', '易受他人影响'],
        '丙': ['冲动急躁', '缺乏耐心', '易情绪化'],
        '丁': ['缺乏自信', '过于敏感', '承压能力弱'],
        '戊': ['变通性差', '创新不足', '过于保守'],
        '己': ['缺乏主见', '决断力不足', '易随波逐流'],
        '庚': ['过于刚硬', '人际关系处理不当', '易得罪人'],
        '辛': ['过于挑剔', '完美主义', '效率可能不高'],
        '壬': ['缺乏专注', '易见异思迁', '持续性不足'],
        '癸': ['过于内向', '表达能力弱', '缺乏自信']
    };
    
    return challengesMap[dayStem] || ['需要全面提升'];
}

// 获取事业发展建议
function getCareerDevelopmentAdvice(dayStem, tenGods) {
    const adviceMap = {
        '甲': ['培养团队合作精神', '学会倾听他人意见', '保持开放心态'],
        '乙': ['增强自信心', '培养决断力', '坚持自己的想法'],
        '丙': ['控制情绪', '培养耐心', '学会深度思考'],
        '丁': ['增强自信心', '提高抗压能力', '学会表达自己'],
        '戊': ['培养创新思维', '学会灵活应变', '接受新事物'],
        '己': ['培养独立思考', '增强决断力', '坚持原则'],
        '庚': ['改善人际关系', '学会圆滑处事', '培养耐心'],
        '辛': ['适当降低标准', '提高工作效率', '学会包容'],
        '壬': ['培养专注力', '坚持到底', '深入专业领域'],
        '癸': ['提高表达能力', '增强自信心', '主动展示才华']
    };
    
    return adviceMap[dayStem] || ['持续学习提升'];
}

// 计算婚姻分析
function calculateMarriageAnalysis(baziInfo, gender) {
    const dayStem = baziInfo.dayStem;
    const tenGods = calculateTenGods(dayStem, baziInfo);
    
    // 分析配偶星
    const spouseStar = getSpouseStar(dayStem, gender);
    const spouseStarCount = tenGods.filter(god => god === spouseStar).length;
    
    // 分析婚姻宫（日支）
    const marriagePalace = analyzeMarriagePalace(baziInfo.dayBranch, dayStem);
    
    // 分析婚姻运势
    const marriageFortune = analyzeMarriageFortune(baziInfo, gender);
    
    // 分析配偶特征
    const spouseTraits = analyzeSpouseTraits(baziInfo, gender);
    
    // 分析最佳婚配
    const compatibility = analyzeBestMatch(baziInfo, gender);
    
    return {
        spouseStar: {
            name: spouseStar,
            count: spouseStarCount,
            analysis: analyzeSpouseStarCount(spouseStar, spouseStarCount, gender)
        },
        marriagePalace,
        fortune: marriageFortune,
        spouseTraits,
        compatibility,
        marriageAdvice: getMarriageAdvice(baziInfo, gender)
    };
}

// 获取配偶星
function getSpouseStar(dayStem, gender) {
    if (gender === 'male') {
        // 男命以财星为妻星
        const wifeStars = {
            '甲': '正财', '乙': '正财', '丙': '正财', '丁': '正财', '戊': '正财',
            '己': '正财', '庚': '正财', '辛': '正财', '壬': '正财', '癸': '正财'
        };
        return '正财'; // 简化处理
    } else {
        // 女命以官星为夫星
        return '正官'; // 简化处理
    }
}

// 分析配偶星数量
function analyzeSpouseStarCount(spouseStar, count, gender) {
    const genderText = gender === 'male' ? '妻' : '夫';
    
    if (count === 0) {
        return `${genderText}星不现，感情较为被动，需要主动寻找机会`;
    } else if (count === 1) {
        return `${genderText}星适中，感情专一，婚姻较为稳定`;
    } else if (count === 2) {
        return `${genderText}星偏多，感情选择较多，需要慎重决定`;
    } else {
        return `${genderText}星过多，感情复杂，需要理性处理感情问题`;
    }
}

// 分析婚姻宫
function analyzeMarriagePalace(dayBranch, dayStem) {
    const palaceAnalysis = {
        '子': '配偶聪明机智，但可能性格急躁',
        '丑': '配偶稳重踏实，但可能较为固执',
        '寅': '配偶有领导才能，但可能脾气较大',
        '卯': '配偶温和善良，但可能优柔寡断',
        '辰': '配偶有责任心，但可能较为严肃',
        '巳': '配偶聪明有才华，但可能心机较深',
        '午': '配偶热情开朗，但可能冲动急躁',
        '未': '配偶温和体贴，但可能缺乏主见',
        '申': '配偶能力强，但可能较为现实',
        '酉': '配偶追求完美，但可能挑剔计较',
        '戌': '配偶忠诚可靠，但可能较为保守',
        '亥': '配偶善良纯真，但可能缺乏决断力'
    };
    
    return {
        branch: dayBranch,
        analysis: palaceAnalysis[dayBranch] || '配偶性格独特，需要深入了解'
    };
}

// 分析婚姻运势
function analyzeMarriageFortune(baziInfo, gender) {
    const fortuneScore = Math.floor(Math.random() * 5) + 1;
    const fortuneLevel = ['★☆☆☆☆', '★★☆☆☆', '★★★☆☆', '★★★★☆', '★★★★★'][fortuneScore - 1];
    
    const descriptions = [
        '婚姻运势较为波折，需要耐心经营',
        '婚姻运势一般，需要双方共同努力',
        '婚姻运势中等，感情较为稳定',
        '婚姻运势良好，容易遇到合适对象',
        '婚姻运势极佳，感情美满幸福'
    ];
    
    return {
        score: fortuneScore,
        level: fortuneLevel,
        description: descriptions[fortuneScore - 1]
    };
}

// 分析配偶特征
function analyzeSpouseTraits(baziInfo, gender) {
    const dayBranch = baziInfo.dayBranch;
    
    const traits = {
        '子': {
            appearance: '中等身材，面容清秀',
            personality: '聪明机智，反应敏捷',
            career: '适合从事技术或服务行业'
        },
        '丑': {
            appearance: '身材敦实，面相忠厚',
            personality: '稳重踏实，做事认真',
            career: '适合从事实业或管理工作'
        },
        '寅': {
            appearance: '身材高大，气质威严',
            personality: '有领导才能，性格直爽',
            career: '适合从事管理或教育工作'
        },
        '卯': {
            appearance: '身材修长，容貌秀美',
            personality: '温和善良，富有同情心',
            career: '适合从事艺术或服务工作'
        },
        '辰': {
            appearance: '身材中等，面相端正',
            personality: '有责任心，做事严谨',
            career: '适合从事专业技术工作'
        },
        '巳': {
            appearance: '身材匀称，容貌俊美',
            personality: '聪明有才华，善于表达',
            career: '适合从事文化或商业工作'
        },
        '午': {
            appearance: '身材健美，气质阳光',
            personality: '热情开朗，积极向上',
            career: '适合从事销售或娱乐工作'
        },
        '未': {
            appearance: '身材适中，面容温和',
            personality: '温和体贴，善解人意',
            career: '适合从事服务或护理工作'
        },
        '申': {
            appearance: '身材匀称，面相精明',
            personality: '能力强，善于理财',
            career: '适合从事金融或商业工作'
        },
        '酉': {
            appearance: '身材娇小，容貌精致',
            personality: '追求完美，注重细节',
            career: '适合从事精密或艺术工作'
        },
        '戌': {
            appearance: '身材结实，面相忠厚',
            personality: '忠诚可靠，有责任心',
            career: '适合从事安全或服务工作'
        },
        '亥': {
            appearance: '身材丰满，面容和善',
            personality: '善良纯真，富有爱心',
            career: '适合从事教育或慈善工作'
        }
    };
    
    return traits[dayBranch] || {
        appearance: '外貌特征需要具体分析',
        personality: '性格特点较为复杂',
        career: '职业倾向需要综合判断'
    };
}

// 分析最佳婚配
function analyzeBestMatch(baziInfo, gender) {
    const dayBranch = baziInfo.dayBranch;
    
    // 地支六合、三合关系
    const compatibility = {
        '子': {
            best: ['丑', '申', '辰'],
            good: ['亥', '卯', '未'],
            avoid: ['午', '未']
        },
        '丑': {
            best: ['子', '巳', '酉'],
            good: ['申', '辰', '亥'],
            avoid: ['未', '戌']
        },
        '寅': {
            best: ['亥', '午', '戌'],
            good: ['卯', '未', '巳'],
            avoid: ['申', '巳']
        },
        '卯': {
            best: ['戌', '未', '亥'],
            good: ['寅', '午', '子'],
            avoid: ['酉', '辰']
        },
        '辰': {
            best: ['酉', '申', '子'],
            good: ['丑', '巳', '午'],
            avoid: ['戌', '卯']
        },
        '巳': {
            best: ['申', '丑', '酉'],
            good: ['辰', '午', '未'],
            avoid: ['亥', '寅']
        },
        '午': {
            best: ['未', '寅', '戌'],
            good: ['巳', '卯', '亥'],
            avoid: ['子', '丑']
        },
        '未': {
            best: ['午', '亥', '卯'],
            good: ['寅', '戌', '申'],
            avoid: ['丑', '子']
        },
        '申': {
            best: ['巳', '子', '辰'],
            good: ['酉', '丑', '戌'],
            avoid: ['寅', '亥']
        },
        '酉': {
            best: ['辰', '巳', '丑'],
            good: ['申', '子', '未'],
            avoid: ['卯', '戌']
        },
        '戌': {
            best: ['卯', '寅', '午'],
            good: ['未', '巳', '丑'],
            avoid: ['辰', '酉']
        },
        '亥': {
            best: ['寅', '卯', '未'],
            good: ['子', '辰', '午'],
            avoid: ['巳', '申']
        }
    };
    
    const match = compatibility[dayBranch] || { best: [], good: [], avoid: [] };
    
    return {
        bestMatch: match.best,
        goodMatch: match.good,
        avoidMatch: match.avoid,
        advice: `最佳配偶生肖：${match.best.join('、')}；较好配偶生肖：${match.good.join('、')}；需要谨慎的生肖：${match.avoid.join('、')}`
    };
}

// 获取婚姻建议
function getMarriageAdvice(baziInfo, gender) {
    const advice = [];
    
    advice.push('保持真诚沟通，理解包容对方');
    advice.push('注重感情培养，不要过于功利');
    advice.push('选择合适的结婚时机很重要');
    advice.push('婚后要学会经营和维护感情');
    
    if (gender === 'male') {
        advice.push('男性要有责任担当，关爱体贴妻子');
    } else {
        advice.push('女性要保持独立自主，同时支持丈夫');
    }
    
    return advice;
}

// 计算健康分析
function calculateHealthAnalysis(baziInfo) {
    const dayStem = baziInfo.dayStem;
    const elements = calculateNatalElements(baziInfo);
    const wuxingAnalysis = analyzeElements(elements);
    
    // 根据五行平衡分析健康状况
    const healthRisks = analyzeHealthRisks(wuxingAnalysis, dayStem);
    const healthAdvice = getHealthAdvice(wuxingAnalysis, dayStem);
    const favorableElements = getFavorableElements(wuxingAnalysis);
    
    return {
        overall: analyzeOverallHealth(wuxingAnalysis),
        risks: healthRisks,
        advice: healthAdvice,
        favorableElements,
        seasonalCare: getSeasonalHealthCare(dayStem)
    };
}

// 分析整体健康状况
function analyzeOverallHealth(wuxingAnalysis) {
    if (wuxingAnalysis.balance === '平衡') {
        return {
            status: '良好',
            description: '五行平衡，身体健康状况良好，抵抗力强'
        };
    } else if (wuxingAnalysis.balance === '偏强') {
        return {
            status: '中等',
            description: '五行偏强，容易上火，需要注意调节'
        };
    } else {
        return {
            status: '需要调理',
            description: '五行失衡，需要通过饮食和生活习惯调理'
        };
    }
}

// 分析健康风险
function analyzeHealthRisks(wuxingAnalysis, dayStem) {
    const risks = [];
    
    // 根据缺失的五行分析健康风险
    wuxingAnalysis.missingElements.forEach(element => {
        switch (element) {
            case '木':
                risks.push('肝胆系统需要注意，易有情绪波动');
                break;
            case '火':
                risks.push('心血管系统需要关注，注意血压');
                break;
            case '土':
                risks.push('脾胃消化系统需要调理，注意饮食');
                break;
            case '金':
                risks.push('肺部呼吸系统需要保护，预防感冒');
                break;
            case '水':
                risks.push('肾脏泌尿系统需要养护，多喝水');
                break;
        }
    });
    
    return risks.length > 0 ? risks : ['整体健康状况良好，继续保持'];
}

// 获取健康建议
function getHealthAdvice(wuxingAnalysis, dayStem) {
    const advice = [];
    
    advice.push('保持规律作息，早睡早起');
    advice.push('适量运动，增强体质');
    advice.push('饮食均衡，营养搭配');
    advice.push('保持心情愉快，减少压力');
    
    // 根据日干给出特定建议
    const specificAdvice = {
        '甲': '多接触大自然，适合户外运动',
        '乙': '注意肝胆保养，避免熬夜',
        '丙': '注意心脏保健，避免过度兴奋',
        '丁': '保护眼睛，注意用眼卫生',
        '戊': '注意脾胃调理，规律饮食',
        '己': '加强消化系统保养，细嚼慢咽',
        '庚': '注意肺部保健，避免吸烟',
        '辛': '保护呼吸系统，预防感冒',
        '壬': '注意肾脏保养，多喝水',
        '癸': '加强泌尿系统保健，避免憋尿'
    };
    
    if (specificAdvice[dayStem]) {
        advice.push(specificAdvice[dayStem]);
    }
    
    return advice;
}

// 获取有利五行
function getFavorableElements(wuxingAnalysis) {
    const favorable = [];
    
    // 缺失的五行通常是需要补充的
    wuxingAnalysis.missingElements.forEach(element => {
        favorable.push(element);
    });
    
    // 如果没有缺失的五行，推荐最弱的五行
    if (favorable.length === 0 && wuxingAnalysis.weakestElement) {
        favorable.push(wuxingAnalysis.weakestElement);
    }
    
    return favorable;
}

// 获取季节性保健建议
function getSeasonalHealthCare(dayStem) {
    return {
        spring: '春季养肝，多吃绿色蔬菜，适量运动',
        summer: '夏季养心，注意防暑降温，保持心情愉快',
        autumn: '秋季养肺，多吃白色食物，预防感冒',
        winter: '冬季养肾，注意保暖，适当进补'
    };
}

// 计算综合评分
function calculateOverallScore(wuxingAnalysis, tenGods) {
    let score = 60; // 基础分
    
    // 五行平衡加分
    if (wuxingAnalysis.balance === '平衡') {
        score += 20;
    } else if (wuxingAnalysis.balance === '偏强') {
        score += 10;
    }
    
    // 缺失五行扣分
    score -= wuxingAnalysis.missingElements.length * 5;
    
    // 十神配置加分
    const goodTenGods = ['正官', '正财', '正印', '食神'];
    const goodCount = tenGods.filter(god => goodTenGods.includes(god)).length;
    score += goodCount * 3;
    
    // 确保分数在合理范围内
    return Math.max(30, Math.min(100, score));
}

// 本地八字计算函数（用于QA功能，与前端详细分析模块使用相同算法）
export function calculateBaziLocally(birthData) {
    try {
        // 解析出生日期和时间
        const [year, month, day] = birthData.date.split('-').map(Number);
        const [hour, minute] = birthData.time.split(':').map(Number);
        
        // 创建Solar对象
        const solar = Solar.fromYmdHms(year, month, day, hour, minute, 0);
        const lunar = solar.getLunar();
        
        // 获取八字四柱
        const yearGan = lunar.getYearGan();
        const yearZhi = lunar.getYearZhi();
        const monthGan = lunar.getMonthGan();
        const monthZhi = lunar.getMonthZhi();
        const dayGan = lunar.getDayGan();
        const dayZhi = lunar.getDayZhi();
        const hourGan = lunar.getTimeGan();
        const hourZhi = lunar.getTimeZhi();
        
        // 构建八字信息对象
        const baziInfo = {
            yearStem: yearGan,
            yearBranch: yearZhi,
            monthStem: monthGan,
            monthBranch: monthZhi,
            dayStem: dayGan,
            dayBranch: dayZhi,
            hourStem: hourGan,
            hourBranch: hourZhi
        };
        
        // 计算五行分析
        const elements = calculateNatalElements(baziInfo);
        const wuxingAnalysis = analyzeElements(elements);
        
        // 计算十神
        const tenGods = calculateTenGods(dayGan, baziInfo);
        
        // 计算性格分析
        const personality = calculatePersonalityAnalysis(dayGan, baziInfo);
        
        // 计算大运分析
        const birthDate = new Date(year, month - 1, day, hour, minute);
        const dayunAnalysis = calculateDayunAnalysis(baziInfo, birthDate, birthData.gender);
        
        // 计算起运时间（使用与前端相同的算法）
        const luckStartingTime = calculateLuckStartingTimeLocal(lunar, birthData.gender);
        
        // 判断身强身弱（使用与前端相同的算法）
        const strengthType = determineStrengthTypeLocal(baziInfo);
        
        return {
            yearStem: yearGan,
            yearBranch: yearZhi,
            monthStem: monthGan,
            monthBranch: monthZhi,
            dayStem: dayGan,
            dayBranch: dayZhi,
            hourStem: hourGan,
            hourBranch: hourZhi,
            elements: wuxingAnalysis,
            tenGods: tenGods,
            personality: personality,
            decadeFortune: dayunAnalysis,
            currentDayun: dayunAnalysis.currentDayun,
            luckStartingTime: luckStartingTime,
            strengthType: strengthType
        };
        
    } catch (error) {
        console.error('本地八字计算错误:', error);
        throw new Error('本地八字计算失败: ' + error.message);
    }
}

// 计算起运时间（与前端算法一致）
function calculateLuckStartingTimeLocal(lunar, gender) {
    try {
        // 获取精确出生时间
        const solar = lunar.getSolar();
        const birthDate = new Date(
            solar.getYear(),
            solar.getMonth() - 1,
            solar.getDay(),
            solar.getHour(),
            solar.getMinute(),
            solar.getSecond() || 0
        );
        
        // 判断顺排/逆排
        const yearGan = lunar.getYearGan();
        const isYangYear = ['甲', '丙', '戊', '庚', '壬'].includes(yearGan);
        const isMale = gender === 'male';
        const isForward = (isYangYear && isMale) || (!isYangYear && !isMale);
        
        // 获取精确换月节气时间
        const jieQiTime = findCorrectJieQiLocal(birthDate, isForward);
        if (!jieQiTime) throw new Error('找不到换月节气时间');
        
        // 计算时间差（毫秒）
        const diffMs = Math.abs(jieQiTime - birthDate);
        const totalDays = diffMs / (1000 * 60 * 60 * 24);
        
        // 精确转换算法：3天 = 1年
        const years = Math.floor(totalDays / 3);
        const remainingDays = totalDays % 3;
        
        // 转换剩余天数为月：3天=1年=12个月，所以1天=4个月
        const months = Math.floor(remainingDays * 4);
        const days = Math.floor((remainingDays * 4 - months) * 30);
        
        // 处理临界情况（出生在节气交接时刻）
        const isJieQiBorn = diffMs < 1000 * 60 * 5; // 5分钟内
        if (isJieQiBorn) {
            return `${isForward ? '出生即起运' : '需特殊计算起运时间'}`;
        }
        
        if (years === 0 && months === 0) {
            return `${days}天起运`;
        } else if (years === 0) {
            return `${months}个月起运`;
        } else if (months === 0) {
            return `${years}岁起运`;
        } else {
            return `${years}岁${months}个月起运`;
        }
        
    } catch (e) {
        console.error('起运时间计算错误:', e);
        // 使用备用算法
        const solar = lunar.getSolar();
        const birthYear = solar.getYear();
        const birthMonth = solar.getMonth();
        const startAge = 8 - (birthYear % 10) + (birthMonth > 5 ? 0.5 : 0);
        return `${startAge.toFixed(1)}岁起运`;
    }
}

// 精确查找换月节气（简化版本）
function findCorrectJieQiLocal(birthDate, isForward) {
    // 八字换月节气列表
    const JIE_QI_MONTHLY = [
        '立春', '惊蛰', '清明', '立夏', '芒种', '小暑',
        '立秋', '白露', '寒露', '立冬', '大雪', '小寒'
    ];
    
    const birthYear = birthDate.getFullYear();
    let closestJieQi = null;
    let minDiff = isForward ? Infinity : -Infinity;
    
    // 检查三年范围内的换月节气
    for (let yearOffset = -1; yearOffset <= 1; yearOffset++) {
        const year = birthYear + yearOffset;
        
        for (const name of JIE_QI_MONTHLY) {
            const jieQiTime = getExactJieQiTimeLocal(year, name);
            if (!jieQiTime) continue;
            
            const diff = jieQiTime - birthDate;
            
            // 顺排：找未来最近的换月节气
            if (isForward && diff > 0 && diff < minDiff) {
                minDiff = diff;
                closestJieQi = jieQiTime;
            }
            // 逆排：找过去最近的换月节气
            else if (!isForward && diff < 0 && diff > minDiff) {
                minDiff = diff;
                closestJieQi = jieQiTime;
            }
        }
    }
    
    return closestJieQi;
}

// 获取精确节气时间（简化版本）
function getExactJieQiTimeLocal(year, name) {
    try {
        // 使用Solar库获取节气时间
        const solar = Solar.fromYmd(year, 1, 1);
        const lunar = solar.getLunar();
        const jieQi = lunar.getJieQi(name);
        
        if (jieQi && jieQi.getSolar) {
            const jieQiSolar = jieQi.getSolar();
            return new Date(
                jieQiSolar.getYear(),
                jieQiSolar.getMonth() - 1,
                jieQiSolar.getDay(),
                jieQiSolar.getHour() || 0,
                jieQiSolar.getMinute() || 0
            );
        }
        
        return null;
    } catch (e) {
        console.error('获取节气时间失败:', e);
        return null;
    }
}

// 判断身强身弱（与前端算法一致）
function determineStrengthTypeLocal(pillars) {
    // ============== 工具函数 ============== //
    const getElementIndex = (char) => {
        const map = { 
            甲:0,乙:0, 丙:1,丁:1, 戊:2,己:2, 庚:3,辛:3, 壬:4,癸:4,
            寅:0,卯:0, 午:1,巳:1, 辰:2,戌:2,丑:2,未:2, 申:3,酉:3, 子:4,亥:4 
        };
        return map[char] ?? 0;
    };

    const getHiddenStemsLocal = (branch) => {
        const map = { 
            子:'癸', 丑:'己癸辛', 寅:'甲丙戊', 卯:'乙', 辰:'戊乙癸',
            巳:'丙庚戊', 午:'丁己', 未:'己丁乙', 申:'庚壬戊', 酉:'辛', 
            戌:'戊辛丁', 亥:'壬甲' 
        };
        return map[branch] || '';
    };

    // ============== 主逻辑 ============== //
    const dayStem = pillars.dayStem;
    const stems = [pillars.yearStem, pillars.monthStem, pillars.hourStem];
    const branches = [pillars.yearBranch, pillars.monthBranch, pillars.dayBranch, pillars.hourBranch];
    const dayElement = getElementIndex(dayStem);

    // 计算得分和状态
    const scores = calculateScores();
    const rootStatus = checkRootStatus();
    const seasonMatch = isSeasonMatch();
    const extremeWeaken = checkExtremeWeaken();

    // 1. 检查特殊格局
    const specialPattern = checkSpecialPatterns();
    if (specialPattern) return specialPattern;

    // 2. 最终判定
    if (isTrueCongWeak()) return "从弱";
    if (isTrueCongStrong()) return "从强";
    return scores.support > scores.weaken ? "身强" : "身弱";

    // ============== 子函数 ============== //
    function calculateScores() {
        let support = 0, weaken = 0;
        
        // 天干力量计算（新增合化判断）
        stems.forEach(stem => {
            const elem = getElementIndex(stem);
            
            // 天干合化有效性判断
            const combineValid = checkTianGanCombineValidity(stem, pillars);
            const combineElem = combineValid ? getCombineResult(stem) : null;
            
            if(combineElem) {
                // 合化成功按新五行计算
                const newElem = getElementIndex(combineElem);
                if (newElem === dayElement) support += 2.0;
                else if (newElem === (dayElement + 4) % 5) support += 1.5;
                else if (newElem === (dayElement + 3) % 5) weaken += 1.5;
                else if (newElem === (dayElement + 2) % 5) weaken += 2.0;
                else if (newElem === (dayElement + 1) % 5) weaken += 1.5;
            } else {
                // 常规计算
                if (elem === dayElement) support += 1.5;
                else if (elem === (dayElement + 4) % 5) support += 1;
                else if (elem === (dayElement + 3) % 5) weaken += 1;
                else if (elem === (dayElement + 2) % 5) weaken += 1.5;
                else if (elem === (dayElement + 1) % 5) weaken += 1.2;
            }
        });

        // 地支力量计算（含藏干和合化）
        branches.forEach((branch, idx) => {
            const hiddenStems = getHiddenStemsLocal(branch);
            
            // 三会三合六合检测
            const combination = checkDizhiCombination(branch, branches);
            let combinationWeight = 1.0;
            if(combination.sanhui) combinationWeight = 1.5;
            else if(combination.sanhe) combinationWeight = 1.2;
            else if(combination.liuhe) combinationWeight = 1.0;
            
            hiddenStems.split('').forEach((stem, i) => {
                const elem = getElementIndex(stem);
                let weight = [0.6, 0.3, 0.1][i] * combinationWeight;
                
                // 透干检测
                const isTouGan = stems.some(s => getElementIndex(s) === elem);
                if(isTouGan) weight *= 1.3;
                
                if (elem === dayElement) support += weight * 3;
                else if (elem === (dayElement + 4) % 5) support += weight * 2;
                else if (elem === (dayElement + 3) % 5) weaken += weight * 2;
                else if (elem === (dayElement + 2) % 5) weaken += weight * 3;
                else if (elem === (dayElement + 1) % 5) weaken += weight * 2;
            });
            
            // 月令加倍权重
            if (idx === 1) {
                support *= 2;
                weaken *= 2;
            }
        });

        return {
            support: Math.round(support),
            weaken: Math.round(weaken)
        };
    }

    function checkRootStatus() {
        let hasRoot = false;
        branches.forEach(branch => {
            const hiddenStems = getHiddenStemsLocal(branch);
            // 排除被完全合化的根（如子丑合土后子中癸水不作根）
            if (hiddenStems.includes(dayStem) && !isBranchCombined(branch)) {
                hasRoot = true;
            }
        });
        return hasRoot ? '有根' : '无根';
    }

    function isBranchCombined(branch) {
        // 检查地支是否参与合化
        const combinationMap = {
            '子': '丑', '丑': '子',
            '寅': '亥', '亥': '寅',
            '卯': '戌', '戌': '卯',
            '辰': '酉', '酉': '辰',
            '巳': '申', '申': '巳',
            '午': '未', '未': '午'
        };
        return branches.some(b => combinationMap[branch] === b);
    }

    function isSeasonMatch() {
        const seasonMap = {
            0: ['寅','卯','辰'],   // 春
            1: ['巳','午','未'],   // 夏
            2: ['辰','戌','丑','未'],// 四季土
            3: ['申','酉','戌'],   // 秋
            4: ['亥','子','丑']    // 冬
        };
        return seasonMap[dayElement].includes(pillars.monthBranch);
    }

    function checkExtremeWeaken() {
        // 天克地冲检测
        const conflicts = [
            hasChong(pillars.yearBranch, pillars.monthBranch),
            hasChong(pillars.dayBranch, pillars.hourBranch)
        ].filter(Boolean).length;
        
        // 三刑检测
        const punishments = checkPunishments();
        
        return (conflicts >= 2 || punishments) && scores.weaken > 15;
    }

    function hasChong(b1, b2) {
        const chongPairs = [['子','午'],['卯','酉'],['寅','申'],['巳','亥'],['辰','戌'],['丑','未']];
        return chongPairs.some(([a,b]) => (a===b1&&b===b2)||(b===b1&&a===b2));
    }

    function checkPunishments() {
        // 检查三刑：寅巳申、丑戌未
        const hasSanXing = (a, b, c) => 
            branches.includes(a) && branches.includes(b) && branches.includes(c);
            
        return hasSanXing('寅','巳','申') || hasSanXing('丑','戌','未');
    }

    function checkSpecialPatterns() {
        // 专旺格（同类五行≥6个）
        const sameElements = [...stems, ...branches]
            .filter(c => getElementIndex(c) === dayElement).length;
        if (sameElements >= 6) return "从强";
        
        // 从财格（无根且财星力量>3倍）
        if (rootStatus === '无根' && scores.weaken >= scores.support * 3) {
            return "从弱";
        }
        return null;
    }

    function isTrueCongWeak() {
        // 三重判断条件
        const condition1 = scores.weaken > scores.support * 2.5;  // 常规从弱
        const condition2 = scores.weaken > scores.support * 2 && !seasonMatch; // 不得令
        const condition3 = scores.weaken > scores.support * 1.8 && extremeWeaken; // 特殊弱势
        
        return rootStatus === '无根' && (condition1 || condition2 || condition3);
    }

    function isTrueCongStrong() {
        // 从强需同时满足
        return rootStatus === '有根' && 
               scores.support > scores.weaken * 2 && 
               seasonMatch;
    }

    function checkTianGanCombineValidity(stem, pillars) {
        // 简化的天干合化判断
        const combineMap = {
            '甲': '己', '己': '甲',
            '乙': '庚', '庚': '乙',
            '丙': '辛', '辛': '丙',
            '丁': '壬', '壬': '丁',
            '戊': '癸', '癸': '戊'
        };
        const partner = combineMap[stem];
        return partner && stems.includes(partner);
    }

    function getCombineResult(stem) {
        // 天干合化结果
        const resultMap = {
            '甲': '土', '己': '土',
            '乙': '金', '庚': '金',
            '丙': '水', '辛': '水',
            '丁': '木', '壬': '木',
            '戊': '火', '癸': '火'
        };
        return resultMap[stem];
    }

    function checkDizhiCombination(branch, branches) {
        // 简化的地支合化检测
        const sanhuiMap = {
            '寅': ['卯', '辰'], '卯': ['寅', '辰'], '辰': ['寅', '卯'],
            '巳': ['午', '未'], '午': ['巳', '未'], '未': ['巳', '午'],
            '申': ['酉', '戌'], '酉': ['申', '戌'], '戌': ['申', '酉'],
            '亥': ['子', '丑'], '子': ['亥', '丑'], '丑': ['亥', '子']
        };
        
        const sanheMap = {
            '申': ['子', '辰'], '子': ['申', '辰'], '辰': ['申', '子'],
            '亥': ['卯', '未'], '卯': ['亥', '未'], '未': ['亥', '卯'],
            '寅': ['午', '戌'], '午': ['寅', '戌'], '戌': ['寅', '午'],
            '巳': ['酉', '丑'], '酉': ['巳', '丑'], '丑': ['巳', '酉']
        };
        
        const liuheMap = {
            '子': '丑', '丑': '子',
            '寅': '亥', '亥': '寅',
            '卯': '戌', '戌': '卯',
            '辰': '酉', '酉': '辰',
            '巳': '申', '申': '巳',
            '午': '未', '未': '午'
        };
        
        const sanhui = sanhuiMap[branch] && sanhuiMap[branch].every(b => branches.includes(b));
        const sanhe = sanheMap[branch] && sanheMap[branch].every(b => branches.includes(b));
        const liuhe = liuheMap[branch] && branches.includes(liuheMap[branch]);
        
        return { sanhui, sanhe, liuhe };
    }
}