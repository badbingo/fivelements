// main.js - Complete Updated Version with Enhanced Scoring System
document.addEventListener('DOMContentLoaded', function() {
    // DOM elements and variables (same as before)
    const calculateBtn = document.getElementById('calculate-btn');
    const recalculateBtn = document.getElementById('recalculate-btn');
    const inputSection = document.getElementById('input-section');
    const resultSection = document.getElementById('result-section');
    const timePeriodOptions = document.querySelectorAll('.time-period-option');
    const birthTimeInput = document.getElementById('birth-time');
    const personalityTraits = document.getElementById('personality-traits');
    const languageBtns = document.querySelectorAll('.language-btn');
    const yearStem = document.getElementById('year-stem');
    const yearBranch = document.getElementById('year-branch');
    const yearHiddenStems = document.getElementById('year-hidden-stems');
    const monthStem = document.getElementById('month-stem');
    const monthBranch = document.getElementById('month-branch');
    const monthHiddenStems = document.getElementById('month-hidden-stems');
    const dayStem = document.getElementById('day-stem');
    const dayBranch = document.getElementById('day-branch');
    const dayHiddenStems = document.getElementById('day-hidden-stems');
    const hourStem = document.getElementById('hour-stem');
    const hourBranch = document.getElementById('hour-branch');
    const hourHiddenStems = document.getElementById('hour-hidden-stems');
    const fateLevel = document.getElementById('fate-level');
    const fateScore = document.getElementById('fate-score');
    const fateDetails = document.getElementById('fate-details');
    const wealthLevel = document.getElementById('wealth-level');
    const wealthScore = document.getElementById('wealth-score');
    const wealthDetails = document.getElementById('wealth-details');
    const elementChartCtx = document.getElementById('element-chart').getContext('2d');
    const gamblingRating = document.getElementById('gambling-rating');
    const gamblingDetails = document.getElementById('gambling-details');
    const savedProfilesList = document.getElementById('saved-profiles-list');
    let elementChart;
    const lunarDate = document.getElementById('lunar-date');
    const lunarGanzhi = document.getElementById('lunar-ganzhi');
    const lunarYi = document.getElementById('lunar-yi');
    const lunarJi = document.getElementById('lunar-ji');
    const currentDate = new Date();
    let birthData = {};
    let loadedSections = {};
    let currentPillars = {};
    let fateScoreDetails = {};
    let wealthScoreDetails = {};
    let fateScoreValue = 0;
    let wealthScoreValue = 0;

    // 1. ENHANCED SCORING SYSTEM FUNCTIONS
    function calculateFateScore(pillars) {
        if (fateScoreValue === 0) {
            // 1. 格局层次 (30分)
            const patternScore = calculatePatternScore(pillars);
            
            // 2. 用神效能 (25分)
            const godScore = calculateGodScore(pillars);
            
            // 3. 五行流通 (15分)
            const balanceScore = calculateBalanceScore(pillars);
            
            // 4. 大运走势 (25分)
            const fortuneScore = calculateFortuneScore(pillars);
            
            // 5. 十神配置 (10分)
            const combinationScore = calculateCombinationScore(pillars);
            
            // Calculate total score
            const total = patternScore + godScore + balanceScore + fortuneScore + combinationScore;
            
            fateScoreDetails = {
                patternScore,
                godScore,
                balanceScore,
                fortuneScore,
                combinationScore,
                total
            };
            
            fateScoreValue = Math.round(total);
        }
        return fateScoreValue;
    }

    function calculatePatternScore(pillars) {
        // Check for special patterns first
        if (isCongGe(pillars)) {
            // 从格且纯粹：27-30分
            return 28 + Math.floor(Math.random() * 3);
        }
        if (isZhuanWangGe(pillars)) {
            // 专旺格：20-26分
            return 22 + Math.floor(Math.random() * 5);
        }
        if (isNormalGe(pillars)) {
            // 普通格局：12-19分
            return 15 + Math.floor(Math.random() * 5);
        }
        // 破格：0-11分
        return 5 + Math.floor(Math.random() * 7);
    }

    function calculateGodScore(pillars) {
        const dayStem = pillars.day.charAt(0);
        const monthBranch = pillars.month.charAt(1);
        
        // Check if the day stem is in season (得令)
        const inSeason = isInSeason(dayStem, monthBranch);
        
        // Check if god is visible (透干)
        const isVisible = isGodVisible(pillars, dayStem);
        
        // Check if god has root (有根)
        const hasRoot = hasGodRoot(pillars, dayStem);
        
        // Check if god is damaged (受制)
        const isDamaged = isGodDamaged(pillars, dayStem);
        
        // Scoring based on conditions
        if (inSeason && isVisible && hasRoot && !isDamaged) {
            return 23 + Math.floor(Math.random() * 3); // 23-25
        } else if ((inSeason || hasRoot) && !isDamaged) {
            return 18 + Math.floor(Math.random() * 5); // 18-22
        } else if (!inSeason && !hasRoot && !isDamaged) {
            return 12 + Math.floor(Math.random() * 6); // 12-17
        } else if (isDamaged) {
            return 6 + Math.floor(Math.random() * 6); // 6-11
        } else {
            return Math.floor(Math.random() * 6); // 0-5
        }
    }

    function calculateBalanceScore(pillars) {
        const elements = calculateElementEnergy(pillars);
        const max = Math.max(...elements);
        const min = Math.min(...elements);
        
        // Base score based on balance
        let score = 10 - (max - min);
        
        // Add bonus for good circulation
        if (hasGoodCirculation(pillars)) {
            score += 3;
        }
        
        // Add bonus for conflict resolution
        if (hasConflictResolution(pillars)) {
            score += 2;
        }
        
        return Math.max(0, Math.min(15, score));
    }

    function calculateFortuneScore(pillars) {
        const decadeFortune = calculateDecadeFortune(lunar, gender);
        
        let goodFortuneYears = 0;
        decadeFortune.fortunes.forEach(fortune => {
            if (fortune.score >= 70) {
                goodFortuneYears += 10;
            } else if (fortune.score >= 50) {
                goodFortuneYears += 5;
            }
        });
        
        if (goodFortuneYears >= 30) return 25;
        if (goodFortuneYears >= 20) return 20 + Math.floor(Math.random() * 5);
        if (goodFortuneYears >= 10) return 15 + Math.floor(Math.random() * 5);
        if (goodFortuneYears > 0) return 10 + Math.floor(Math.random() * 5);
        return Math.floor(Math.random() * 10);
    }

    function calculateCombinationScore(pillars) {
        let score = 5; // Base score
        
        if (hasSanHe(pillars)) score += 3;
        if (hasLiuHe(pillars)) score += 2;
        
        return Math.min(10, score);
    }

    // Helper functions for scoring
    function isInSeason(dayStem, monthBranch) {
        const seasonMap = {
            '甲': ['寅', '卯', '辰'], '乙': ['寅', '卯', '辰'],
            '丙': ['巳', '午', '未'], '丁': ['巳', '午', '未'],
            '戊': ['辰', '戌', '丑', '未'], '己': ['辰', '戌', '丑', '未'],
            '庚': ['申', '酉', '戌'], '辛': ['申', '酉', '戌'],
            '壬': ['亥', '子', '丑'], '癸': ['亥', '子', '丑']
        };
        return seasonMap[dayStem]?.includes(monthBranch);
    }

    function isGodVisible(pillars, dayStem) {
        const godElement = getGodElement(dayStem);
        const stems = [
            pillars.year.charAt(0),
            pillars.month.charAt(0),
            pillars.hour.charAt(0)
        ];
        return stems.some(stem => getElement(stem) === godElement);
    }

    function hasGodRoot(pillars, dayStem) {
        const godElement = getGodElement(dayStem);
        const branches = [
            pillars.year.charAt(1),
            pillars.month.charAt(1),
            pillars.day.charAt(1),
            pillars.hour.charAt(1)
        ];
        return branches.some(branch => getElement(branch) === godElement);
    }

    function isGodDamaged(pillars, dayStem) {
        const godElement = getGodElement(dayStem);
        const damageElements = getDamageElements(godElement);
        
        const stems = [
            pillars.year.charAt(0),
            pillars.month.charAt(0),
            pillars.hour.charAt(0)
        ];
        const branches = [
            pillars.year.charAt(1),
            pillars.month.charAt(1),
            pillars.day.charAt(1),
            pillars.hour.charAt(1)
        ];
        
        return [...stems, ...branches].some(item => 
            damageElements.includes(getElement(item))
        );
    }

    function hasGoodCirculation(pillars) {
        const elements = [
            getElement(pillars.year.charAt(0)),
            getElement(pillars.month.charAt(0)),
            getElement(pillars.day.charAt(0)),
            getElement(pillars.hour.charAt(0))
        ];
        
        for (let i = 0; i < elements.length - 1; i++) {
            if (!isGenerating(elements[i], elements[i+1])) {
                return false;
            }
        }
        return true;
    }

    function hasConflictResolution(pillars) {
        const stems = [
            pillars.year.charAt(0),
            pillars.month.charAt(0),
            pillars.hour.charAt(0)
        ];
        const branches = [
            pillars.year.charAt(1),
            pillars.month.charAt(1),
            pillars.day.charAt(1),
            pillars.hour.charAt(1)
        ];
        return !hasStrongConflicts(stems, branches);
    }

    function getGodElement(dayStem) {
        const godMap = {
            '甲': '木', '乙': '木',
            '丙': '火', '丁': '火',
            '戊': '土', '己': '土',
            '庚': '金', '辛': '金',
            '壬': '水', '癸': '水'
        };
        return godMap[dayStem];
    }

    function getDamageElements(element) {
        const damageMap = {
            '木': ['金'],
            '火': ['水'],
            '土': ['木'],
            '金': ['火'],
            '水': ['土']
        };
        return damageMap[element] || [];
    }

    function isGenerating(element1, element2) {
        const generateMap = {
            '木': '火',
            '火': '土',
            '土': '金',
            '金': '水',
            '水': '木'
        };
        return generateMap[element1] === element2;
    }

    function hasStrongConflicts(stems, branches) {
        // Check for strong conflicts between elements
        const elements = [...stems, ...branches].map(getElement);
        const conflicts = [
            ['木', '土'], ['土', '水'], ['水', '火'], 
            ['火', '金'], ['金', '木']
        ];
        
        for (let i = 0; i < elements.length; i++) {
            for (let j = i + 1; j < elements.length; j++) {
                if (conflicts.some(pair => 
                    (pair[0] === elements[i] && pair[1] === elements[j]) ||
                    (pair[0] === elements[j] && pair[1] === elements[i])
                )) {
                    return true;
                }
            }
        }
        return false;
    }

    function isCongGe(pillars) {
        const dayStem = pillars.day.charAt(0);
        const stems = [
            pillars.year.charAt(0),
            pillars.month.charAt(0),
            pillars.hour.charAt(0)
        ];
        const branches = [
            pillars.year.charAt(1),
            pillars.month.charAt(1),
            pillars.day.charAt(1),
            pillars.hour.charAt(1)
        ];
        return isCongQiangGe(dayStem, stems, branches) || 
               isCongRuoGe(dayStem, stems, branches);
    }

    function isCongQiangGe(dayStem, stems, branches) {
        let count = 0;
        stems.forEach(stem => {
            if (isSameElement(stem, dayStem) || isGenerateElement(stem, dayStem)) {
                count++;
            }
        });
        branches.forEach(branch => {
            if (isSameElement(branch, dayStem) || isGenerateElement(branch, dayStem)) {
                count++;
            }
        });
        return count >= 6;
    }

    function isCongRuoGe(dayStem, stems, branches) {
        let count = 0;
        stems.forEach(stem => {
            if (isSameElement(stem, dayStem) || isGenerateElement(stem, dayStem)) {
                count++;
            }
        });
        branches.forEach(branch => {
            if (isSameElement(branch, dayStem) || isGenerateElement(branch, dayStem)) {
                count++;
            }
        });
        return count <= 1;
    }

    function isZhuanWangGe(pillars) {
        const dayStem = pillars.day.charAt(0);
        const stems = [
            pillars.year.charAt(0),
            pillars.month.charAt(0),
            pillars.hour.charAt(0)
        ];
        const branches = [
            pillars.year.charAt(1),
            pillars.month.charAt(1),
            pillars.day.charAt(1),
            pillars.hour.charAt(1)
        ];
        let sameCount = 0;
        stems.forEach(stem => {
            if (isSameElement(stem, dayStem)) sameCount++;
        });
        branches.forEach(branch => {
            if (isSameElement(branch, dayStem)) sameCount++;
        });
        return sameCount >= 5;
    }

    function isNormalGe(pillars) {
        // Neither strong nor weak pattern
        return !isCongGe(pillars) && !isZhuanWangGe(pillars);
    }

    function getElement(char) {
        const elementMap = {
            '甲': '木', '乙': '木',
            '丙': '火', '丁': '火',
            '戊': '土', '己': '土',
            '庚': '金', '辛': '金',
            '壬': '水', '癸': '水',
            '寅': '木', '卯': '木',
            '午': '火', '巳': '火',
            '辰': '土', '戌': '土', '丑': '土', '未': '土',
            '申': '金', '酉': '金',
            '子': '水', '亥': '水'
        };
        return elementMap[char] || '';
    }

    // 2. UPDATED DISPLAY FUNCTIONS
    function displayScores() {
        if (!currentPillars.year) return;
        
        const fateScore = calculateFateScore(currentPillars);
        const fateLevelInfo = getFateLevel(fateScore);
        
        fateLevel.textContent = fateLevelInfo.name;
        fateLevel.className = `rating-level ${fateLevelInfo.class}`;
        fateScore.textContent = `评分: ${fateScore}分`;
        
        fateDetails.innerHTML = `
            <div class="score-progress">
                <div class="score-label">格局层次</div>
                <div class="progress-container">
                    <div class="progress-bar" style="width: ${(fateScoreDetails.patternScore/30)*100}%"></div>
                </div>
                <div class="score-value">${fateScoreDetails.patternScore}/30</div>
            </div>
            <div class="score-progress">
                <div class="score-label">用神效能</div>
                <div class="progress-container">
                    <div class="progress-bar" style="width: ${(fateScoreDetails.godScore/25)*100}%"></div>
                </div>
                <div class="score-value">${fateScoreDetails.godScore}/25</div>
            </div>
            <div class="score-progress">
                <div class="score-label">五行流通</div>
                <div class="progress-container">
                    <div class="progress-bar" style="width: ${(fateScoreDetails.balanceScore/15)*100}%"></div>
                </div>
                <div class="score-value">${fateScoreDetails.balanceScore}/15</div>
            </div>
            <div class="score-progress">
                <div class="score-label">大运走势</div>
                <div class="progress-container">
                    <div class="progress-bar" style="width: ${(fateScoreDetails.fortuneScore/25)*100}%"></div>
                </div>
                <div class="score-value">${fateScoreDetails.fortuneScore}/25</div>
            </div>
            <div class="score-progress">
                <div class="score-label">十神配置</div>
                <div class="progress-container">
                    <div class="progress-bar" style="width: ${(fateScoreDetails.combinationScore/10)*100}%"></div>
                </div>
                <div class="score-value">${fateScoreDetails.combinationScore}/10</div>
            </div>
            <div class="fate-description">${fateLevelInfo.description}</div>
        `;
        
        // Wealth score calculation (unchanged from original)
        const wealthScore = calculateWealthScore(currentPillars);
        const wealthLevelInfo = getWealthLevel(wealthScore);
        wealthLevel.textContent = wealthLevelInfo.name;
        wealthLevel.className = `rating-level ${wealthLevelInfo.class}`;
        wealthScore.textContent = `评分: ${wealthScore}分`;
        
        wealthDetails.innerHTML = `
            <div class="score-progress">
                <div class="score-label">财星数量质量</div>
                <div class="progress-container">
                    <div class="progress-bar" style="width: ${(wealthScoreDetails.wealthStarScore/30)*100}%"></div>
                </div>
                <div class="score-value">${wealthScoreDetails.wealthStarScore}/30</div>
            </div>
            <div class="score-progress">
                <div class="score-label">财星得地</div>
                <div class="progress-container">
                    <div class="progress-bar" style="width: ${(wealthScoreDetails.wealthPositionScore/25)*100}%"></div>
                </div>
                <div class="score-value">${wealthScoreDetails.wealthPositionScore}/25</div>
            </div>
            <div class="score-progress">
                <div class="score-label">财星受克</div>
                <div class="progress-container">
                    <div class="progress-bar" style="width: ${(wealthScoreDetails.wealthDamageScore/20)*100}%"></div>
                </div>
                <div class="score-value">${wealthScoreDetails.wealthDamageScore}/20</div>
            </div>
            <div class="score-progress">
                <div class="score-label">食伤生财</div>
                <div class="progress-container">
                    <div class="progress-bar" style="width: ${(wealthScoreDetails.wealthSupportScore/15)*100}%"></div>
                </div>
                <div class="score-value">${wealthScoreDetails.wealthSupportScore}/15</div>
            </div>
            <div class="score-progress">
                <div class="score-label">大运走势</div>
                <div class="progress-container">
                    <div class="progress-bar" style="width: ${(wealthScoreDetails.fortuneScore/10)*100}%"></div>
                </div>
                <div class="score-value">${wealthScoreDetails.fortuneScore}/10</div>
            </div>
        `;
    }

    function getFateLevel(score) {
        if (score >= 90) return { 
            name: "成就级 ★★★★★ (90分以上)", 
            class: "excellent",
            description: "成格+用神强+大运佳，命格上乘，人生顺遂"
        };
        if (score >= 75) return { 
            name: "优秀级 ★★★★☆ (75-89分)", 
            class: "good",
            description: "半成格+用神有效，命格良好，努力可成"
        };
        if (score >= 55) return { 
            name: "普通级 ★★★☆☆ (55-74分)", 
            class: "average",
            description: "普通格局+用神一般，平稳人生"
        };
        if (score >= 35) return { 
            name: "奋斗级 ★★☆☆☆ (35-54分)", 
            class: "struggling",
            description: "破格但大运补救，需加倍努力"
        };
        return { 
            name: "调整级 ★☆☆☆☆ (35分以下)", 
            class: "needs-improvement",
            description: "多重破格，需注意化解"
        };
    }

    function getWealthLevel(score) {
        if (score >= 90) return { name: "天禄盈门 ★★★★★ (90分以上)", class: "ultra-rich" };
        if (score >= 80) return { name: "朱紫满箱 ★★★★☆ (80-89分)", class: "very-rich" };
        if (score >= 60) return { name: "粟陈贯朽 ★★★☆☆ (60-79分)", class: "moderately-rich" };
        if (score >= 40) return { name: "岁稔年丰 ★★☆☆☆ (40-59分)", class: "somewhat-rich" };
        return { name: "营营逐逐 ★☆☆☆☆ (<40分)", class: "wealth-average" };
    }

    function displayScores() {
        if (!currentPillars.year) return;
        const fateScore = calculateFateScore(currentPillars);
        const fateLevelInfo = getFateLevel(fateScore);
        fateLevel.textContent = fateLevelInfo.name;
        fateLevel.className = `rating-level ${fateLevelInfo.class}`;
        fateScore.textContent = `评分: ${fateScore}分 (${Math.round(fateScore)}%)`;
        const wealthScore = calculateWealthScore(currentPillars);
        const wealthLevelInfo = getWealthLevel(wealthScore);
        wealthLevel.textContent = wealthLevelInfo.name;
        wealthLevel.className = `rating-level ${wealthLevelInfo.class}`;
        wealthScore.textContent = `评分: ${wealthScore}分 (${Math.round(wealthScore)}%)`;
        fateDetails.innerHTML = `
            <div class="score-progress">
                <div class="score-label">日主得令</div>
                <div class="progress-container">
                    <div class="progress-bar" style="width: ${(fateScoreDetails.seasonScore/30)*100}%"></div>
                </div>
                <div class="score-value">${fateScoreDetails.seasonScore}/30</div>
            </div>
            <div class="score-progress">
                <div class="score-label">五行平衡</div>
                <div class="progress-container">
                    <div class="progress-bar" style="width: ${(fateScoreDetails.balanceScore/25)*100}%"></div>
                </div>
                <div class="score-value">${fateScoreDetails.balanceScore}/25</div>
            </div>
            <div class="score-progress">
                <div class="score-label">特殊格局</div>
                <div class="progress-container">
                    <div class="progress-bar" style="width: ${(fateScoreDetails.patternScore/20)*100}%"></div>
                </div>
                <div class="score-value">${fateScoreDetails.patternScore}/20</div>
            </div>
            <div class="score-progress">
                <div class="score-label">十神配置</div>
                <div class="progress-container">
                    <div class="progress-bar" style="width: ${(fateScoreDetails.godsScore/15)*100}%"></div>
                </div>
                <div class="score-value">${fateScoreDetails.godsScore}/15</div>
            </div>
            <div class="score-progress">
                <div class="score-label">天干地支组合</div>
                <div class="progress-container">
                    <div class="progress-bar" style="width: ${(fateScoreDetails.combinationScore/10)*100}%"></div>
                </div>
                <div class="score-value">${fateScoreDetails.combinationScore}/10</div>
            </div>
        `;
        wealthDetails.innerHTML = `
            <div class="score-progress">
                <div class="score-label">财星数量质量</div>
                <div class="progress-container">
                    <div class="progress-bar" style="width: ${(wealthScoreDetails.wealthStarScore/30)*100}%"></div>
                </div>
                <div class="score-value">${wealthScoreDetails.wealthStarScore}/30</div>
            </div>
            <div class="score-progress">
                <div class="score-label">财星得地</div>
                <div class="progress-container">
                    <div class="progress-bar" style="width: ${(wealthScoreDetails.wealthPositionScore/25)*100}%"></div>
                </div>
                <div class="score-value">${wealthScoreDetails.wealthPositionScore}/25</div>
            </div>
            <div class="score-progress">
                <div class="score-label">财星受克</div>
                <div class="progress-container">
                    <div class="progress-bar" style="width: ${(wealthScoreDetails.wealthDamageScore/20)*100}%"></div>
                </div>
                <div class="score-value">${wealthScoreDetails.wealthDamageScore}/20</div>
            </div>
            <div class="score-progress">
                <div class="score-label">食伤生财</div>
                <div class="progress-container">
                    <div class="progress-bar" style="width: ${(wealthScoreDetails.wealthSupportScore/15)*100}%"></div>
                </div>
                <div class="score-value">${wealthScoreDetails.wealthSupportScore}/15</div>
            </div>
            <div class="score-progress">
                <div class="score-label">大运走势</div>
                <div class="progress-container">
                    <div class="progress-bar" style="width: ${(wealthScoreDetails.fortuneScore/10)*100}%"></div>
                </div>
                <div class="score-value">${wealthScoreDetails.fortuneScore}/10</div>
            </div>
        `;
    }

    function getHiddenStems(branch) {
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
        return hiddenStemsMap[branch] || '';
    }

    function calculateBaziLocally(birthData) {
        const dateParts = birthData.date.split('-');
        const year = parseInt(dateParts[0]);
        const month = parseInt(dateParts[1]);
        const day = parseInt(dateParts[2]);
        const timeParts = birthData.time.split(':');
        const hour = parseInt(timeParts[0]);
        const minute = parseInt(timeParts[1] || 0);
        const solar = Solar.fromYmdHms(year, month, day, hour, minute, 0);
        const lunar = solar.getLunar();
        const bazi = lunar.getEightChar();
        const yearGan = bazi.getYearGan();
        const yearZhi = bazi.getYearZhi();
        const monthGan = bazi.getMonthGan();
        const monthZhi = bazi.getMonthZhi();
        const dayGan = bazi.getDayGan();
        const dayZhi = bazi.getDayZhi();
        const hourGan = bazi.getTimeGan();
        const hourZhi = bazi.getTimeZhi();
        const yearHiddenStems = getHiddenStems(yearZhi);
        const monthHiddenStems = getHiddenStems(yearZhi);
        const dayHiddenStems = getHiddenStems(dayZhi);
        const hourHiddenStems = getHiddenStems(hourZhi);
        const elements = calculateElementEnergy({
            year: yearGan + yearZhi,
            month: monthGan + monthZhi,
            day: dayGan + dayZhi,
            hour: hourGan + hourZhi
        });
        const personality = getPersonalityTraits(dayGan);
        
        // Calculate decade fortune locally
        const decadeFortune = calculateDecadeFortune(lunar, gender); // 使用自定义函数
        
        // Calculate gambling fortune
        const gamblingFortune = calculateGamblingFortune(birthData, lunar);
        
        return {
            yearStem: yearGan,
            yearBranch: yearZhi,
            monthStem: monthGan,
            monthBranch: monthZhi,
            dayStem: dayGan,
            dayBranch: dayZhi,
            hourStem: hourGan,
            hourBranch: hourZhi,
            yearHiddenStems: yearHiddenStems,
            monthHiddenStems: monthHiddenStems,
            dayHiddenStems: dayHiddenStems,
            hourHiddenStems: hourHiddenStems,
            elements,
            personality,
            decadeFortune,
            gamblingFortune
        };
    }

    function calculateDecadeFortune(lunar, gender) {
        const yearGan = lunar.getYearGan(); // 年干
        const yearZhi = lunar.getYearZhi(); // 年支
        const isMale = gender === 'male';
        const isYangYear = ['甲', '丙', '戊', '庚', '壬'].includes(yearGan);

        // 规则：阳年男顺排，阴年女顺排；阴年男逆排，阳年女逆排
        const isForward = (isYangYear && isMale) || (!isYangYear && !isMale);

        // 计算起运时间（3天 = 1岁）
        const solar = lunar.getSolar();
        const jieQiName = isForward ? '立春' : '大寒'; // 顺排找下一个节气，逆排找上一个
        const targetJieQi = lunar.getJieQi(jieQiName);
        
        // 如果找不到节气（如1900年前数据），使用默认值
        let daysDiff = 15; // 默认15天（5岁起运）
        if (targetJieQi) {
            daysDiff = Math.abs(solar.getDiffDays(targetJieQi));
        }
        const startAge = Math.floor(daysDiff / 3); // 起运年龄

        // 地支顺序（用于顺排/逆排）
        const zhiOrder = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
        let currentZhiIndex = zhiOrder.indexOf(yearZhi);

        // 天干顺序
        const ganOrder = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
        let currentGanIndex = ganOrder.indexOf(yearGan);

        // 生成大运（每10年一运）
        const fortunes = [];
        for (let i = 0; i < 8; i++) { // 生成8个大运（覆盖80年）
            // 计算干支
            currentZhiIndex = isForward ? 
                (currentZhiIndex + 1) % 12 : 
                (currentZhiIndex - 1 + 12) % 12;
            
            currentGanIndex = isForward ?
                (currentGanIndex + 1) % 10 :
                (currentGanIndex - 1 + 10) % 10;

            const gan = ganOrder[currentGanIndex];
            const zhi = zhiOrder[currentZhiIndex];

            // 运势评分（60-90分随机，但带趋势）
            const baseScore = 60 + Math.floor(Math.random() * 20);
            const trendBonus = isForward ? i * 2 : (7 - i) * 2; // 顺排越往后分越高，逆排反之
            const score = Math.min(90, baseScore + trendBonus);

            fortunes.push({
                ageRange: `${startAge + i * 10}-${startAge + (i + 1) * 10}岁`,
                ganZhi: gan + zhi,
                score: score
            });
        }

        return {
            isForward: isForward,
            startAge: startAge,
            fortunes: fortunes
        };
    }
          
    
    function calculateGamblingFortune(birthData, lunar) {
        const dayGan = lunar.getDayGan();
        const dayZhi = lunar.getDayZhi();
        const currentDayGan = lunar.getDayGan();
        const currentDayZhi = lunar.getDayZhi();
        
        // Calculate gambling score (1-5)
        const ganScore = {
            '甲': 3, '乙': 2, '丙': 4, '丁': 3, '戊': 2,
            '己': 1, '庚': 3, '辛': 2, '壬': 4, '癸': 3
        };
        
        const zhiScore = {
            '子': 3, '丑': 2, '寅': 4, '卯': 3, '辰': 2,
            '巳': 4, '午': 3, '未': 2, '申': 3, '酉': 2,
            '戌': 1, '亥': 3
        };
        
        const ganMatch = dayGan === currentDayGan ? 1 : 0;
        const zhiMatch = dayZhi === currentDayZhi ? 1 : 0;
        
        const baseScore = ganScore[dayGan] + zhiScore[dayZhi];
        const currentScore = ganScore[currentDayGan] + zhiScore[currentDayZhi];
        const matchBonus = (ganMatch + zhiMatch) * 2;
        
        const totalScore = Math.min(5, Math.max(1, Math.round((baseScore + currentScore + matchBonus) / 4)));
        
        // Generate rating stars based on score
        const rating = '★'.repeat(totalScore) + '☆'.repeat(5 - totalScore);
        
        // Generate corresponding analysis text based on score
        const analysisText = [
            "今日偏财运欠佳，建议远离赌博活动，专注正财为佳。",
            "今日偏财运平平，小赌可能小输，建议控制投注金额。",
            "今日偏财运中等，适合小赌怡情但不宜大额投注。",
            "今日偏财运不错，可适度参与但需保持理性。",
            "今日偏财运旺盛，但切勿贪心，见好就收为妙。"
        ][totalScore - 1];
        
        const directions = ['东', '南', '西', '北', '东南', '西南', '东北', '西北'];
        const bestDirection = directions[Math.floor(Math.random() * directions.length)];
        
        const hours = ['1-3', '3-5', '5-7', '7-9', '9-11', '11-13', '13-15', '15-17', '17-19', '19-21', '21-23', '23-1'];
        const bestHour = hours[Math.floor(Math.random() * hours.length)];
        
        return {
            rating: rating,
            analysis: analysisText,
            direction: bestDirection,
            hour: bestHour,
            score: totalScore
        };
    }

    function getPersonalityTraits(dayStem) {
        const traits = {
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
        return traits[dayStem] || '似静水流深，临危反生智，藏锋守拙却暗含凌云之志';
    }

    function saveProfile(birthData) {
        const profiles = JSON.parse(localStorage.getItem('baziProfiles') || '[]');
        
        // Check if profile already exists
        const existingIndex = profiles.findIndex(p => 
            p.date === birthData.date && 
            p.time === birthData.time && 
            p.gender === birthData.gender
        );
        
        if (existingIndex >= 0) {
            // Update existing profile
            profiles[existingIndex] = birthData;
        } else {
            // Add new profile
            profiles.push(birthData);
        }
        
        // Limit to 5 profiles
        if (profiles.length > 5) {
            profiles.shift();
        }
        
        localStorage.setItem('baziProfiles', JSON.stringify(profiles));
        loadSavedProfiles();
    }

    function loadSavedProfiles() {
        const profiles = JSON.parse(localStorage.getItem('baziProfiles') || '[]');
        savedProfilesList.innerHTML = '';
        
        if (profiles.length === 0) {
            savedProfilesList.innerHTML = '<div style="color:var(--text-light);font-size:14px;">暂无历史记录</div>';
            return;
        }
        
        profiles.forEach((profile, index) => {
            const hour = parseInt(profile.time.split(':')[0]);
            const timeMap = {
                23: '子时', 0: '子时',
                1: '丑时', 3: '寅时',
                5: '卯时', 7: '辰时',
                9: '巳时', 11: '午时',
                13: '未时', 15: '申时',
                17: '酉时', 19: '戌时',
                21: '亥时'
           };
            
            const profileElement = document.createElement('div');
            profileElement.className = 'saved-profile';
            profileElement.innerHTML = `
                ${profile.name || '匿名'} · 
                ${profile.date.replace(/-/g, '/')} · 
                ${timeMap[hour]} · 
                ${profile.gender === 'male' ? '男' : '女'}
            `;
            
            profileElement.addEventListener('click', () => {
                loadProfile(profile);
            });
            
            savedProfilesList.appendChild(profileElement);
        });
    }

    function loadProfile(profile) {
        document.getElementById('name').value = profile.name || '';
        document.getElementById('birth-date').value = profile.date;
        document.getElementById('gender').value = profile.gender;
        
        // Set time period
        const hour = parseInt(profile.time.split(':')[0]);
        timePeriodOptions.forEach(opt => opt.classList.remove('selected'));
        const selectedOption = document.querySelector(`.time-period-option[data-hour="${hour}"]`);
        if (selectedOption) {
            selectedOption.classList.add('selected');
            birthTimeInput.value = profile.time;
        }
    }

    calculateBtn.addEventListener('click', async function(e) {
        e.preventDefault();
        resetAllContent();
        const name = document.getElementById('name').value;
        const birthDate = document.getElementById('birth-date').value;
        const birthTime = birthTimeInput.value;
        const gender = document.getElementById('gender').value;
        if (!birthDate || !birthTime || !gender) {
            alert('请填写完整的出生信息');
            return;
        }
        const dateParts = birthDate.split('-');
        const year = parseInt(dateParts[0]);
        const month = parseInt(dateParts[1]);
        const day = parseInt(dateParts[2]);
        if (!isValidDate(year, month, day)) {
            alert('请输入有效的出生日期');
            return;
        }
        if (month === 2) {
            const maxDays = isLeapYear(year) ? 29 : 28;
            if (day > maxDays) {
                alert(`${year}年2月只有${maxDays}天`);
                return;
            }
        }
        const monthsWith30Days = [4, 6, 9, 11];
        if (monthsWith30Days.includes(month) && day > 30) {
            alert(`${month}月只有30天`);
            return;
        }
        birthData = { 
            name, 
            date: birthDate,
            time: birthTime, 
            gender: gender
        };
        
        // Save profile to localStorage
        saveProfile(birthData);
        
        calculateBtn.disabled = true;
        calculateBtn.innerHTML = '<span class="loading"></span> 量子测算中...';
        try {
            const loadingOverlay = document.createElement('div');
            loadingOverlay.className = 'loading-overlay';
            loadingOverlay.innerHTML = `
                <div class="loading"></div>
                <p>量子计算引擎启动中...</p>
            `;
            document.body.appendChild(loadingOverlay);
            const baziInfo = calculateBaziLocally(birthData);
            displayBasicInfo(baziInfo);
            initElementChart(baziInfo.elements);
            updateLunarCalendar();
            currentPillars = {
                year: baziInfo.yearStem + baziInfo.yearBranch,
                month: baziInfo.monthStem + baziInfo.monthBranch,
                day: baziInfo.dayStem + baziInfo.dayBranch,
                hour: baziInfo.hourStem + baziInfo.hourBranch
            };
            displayScores();
            
            // Update gambling analysis
            gamblingRating.textContent = baziInfo.gamblingFortune.rating;
            gamblingDetails.innerHTML = `
            ${baziInfo.gamblingFortune.analysis}<br>
            最佳方位: ${baziInfo.gamblingFortune.direction}<br>
            最佳时段: ${baziInfo.gamblingFortune.hour}
            `;
            
            inputSection.style.display = 'none';
            resultSection.style.display = 'block';
            document.body.removeChild(loadingOverlay);
            initLoadButtons();
            window.scrollTo(0, 0);
        } catch (error) {
            console.error('测算失败:', error);
            alert('量子测算失败，请稍后重试');
            if (document.querySelector('.loading-overlay')) {
                document.body.removeChild(document.querySelector('.loading-overlay'));
            }
        } finally {
            calculateBtn.disabled = false;
            calculateBtn.innerHTML = '<i class="fas fa-brain"></i> 开始量子测算';
        }
    });

    async function getBaziAnalysis(section, data) {
        const apiUrl = 'https://api.deepseek.com/v1/chat/completions';
        const apiKey = 'sk-b2950087a9d5427392762814114b22a9';
        const currentDateStr = currentDate.getFullYear() + '-' + 
                              (currentDate.getMonth() + 1).toString().padStart(2, '0') + '-' + 
                              currentDate.getDate().toString().padStart(2, '0');
                  
        let prompt = `【八字排盘专业算法规范】请严格遵循以下计算规则：
一、年柱计算规则
以立春为界，不以农历春节为分界。
若出生日期在当年立春之后，年柱为当前年份对应的干支。
若出生日期在当年立春之前，年柱为上一年对应的干支。
例：2023年立春是2月4日，若出生在2月3日，年柱仍用2022年（壬寅年）；若出生在2月4日及之后，则用2023年（癸卯年）。
二、月柱计算规则
严格按节气划分月份（非农历月份）：
正月（寅月）：从立春开始
二月（卯月）：从惊蛰开始
三月（辰月）：从清明开始
以此类推，每个月的分界点均为节气（如立夏进入四月，芒种进入五月等）。
月干由年干决定（五虎遁法）：
甲己年：正月丙寅、二月丁卯……
乙庚年：正月戊寅、二月己卯……
丙辛年：正月庚寅、二月辛卯……
丁壬年：正月壬寅、二月癸卯……
戊癸年：正月甲寅、二月乙卯……
三、日柱计算规则
按公历日期计算，不依赖农历。
计算方法（简化版）：
1900 - 1999年：（年份后两位 + 3）*5 + 55 +（年份后两位 - 1)/4
2000 - 2099年：（年份后两位 + 7）*5 + 15 +（年份后两位 + 19)/4
再加上当年到出生日的天数，取60的余数对应干支表。
四、时柱计算规则
时辰按当地时间（真太阳时），不是北京时间。
时支固定（23 - 1点为子时，1 - 3点为丑时，以此类推）。
时干由日干决定（五鼠遁法）：
甲己日：子时甲子、丑时乙丑……
乙庚日：子时丙子、丑时丁丑……
丙辛日：子时戊子、丑时己丑……
丁壬日：子时庚子、丑时辛丑……
戊癸日：子时壬子、丑时癸丑……
五、格局判断规则
从强格：
印星（正印、偏印）和比劫（比肩、劫财）力量占比80%以上，且全局无强力的克、泄、耗（如官杀、食伤、财星）。
从弱格：
印比力量不足20%，且全局无有力的生扶（如印星、比劫极弱）。
普通格局：不符合从强或从弱的条件。
六、大运排法规则
顺排或逆排：
顺排（阳年男、阴年女）：从月柱开始，按60甲子顺序往后排。
逆排（阴年男、阳年女）：从月柱开始，按60甲子逆序往前排。
起运时间计算：
顺排：计算出生时间到下一个换月节气的时间差，3天 = 1岁。
逆排：计算出生时间到上一个换月节气的时间差，3天 = 1岁。      

当前日期：${currentDateStr}
根据以下八字信息进行分析：
姓名：${data.name || '未提供'}
出生日期：${data.date}
出生时间：${data.time} 
性别：${data.gender === 'male' ? '男' : '女'}

`;

        if (Object.keys(currentPillars).length > 0) {
            prompt += `当前八字：${currentPillars.year} ${currentPillars.month} ${currentPillars.day} ${currentPillars.hour}\n\n`;
        }

        switch(section) {
            case 'basic':
                prompt += `请返回以下信息：
1 八字四柱：年柱[内容] 月柱[内容] 日柱[内容] 时柱[内容]
2 地支藏干：年支[藏干] 月支[藏干] 日支[藏干] 时支[藏干]
3 五行能量：[木,火,土,金,水] (1-10分，请根据八字五行生克关系计算具体数值)
4 命主性格：[用一句话描述命主的性格特质，如："似静水流深，临危反生智，藏锋守拙却暗含凌云之志"]

用简洁格式返回，不要分析内容，不要使用任何符号如#*、等。`;
                break;
            case 'strength':
                prompt += `分析命主的身强身弱情况：
1 日主得令、得地、得势的情况
2 天干地支的合化和刑冲情况
3 特殊格局判断
4 喜用和忌凶

返回格式：
日主得令、得地、得势的情况：[详细分析]
天干地支的合化和刑冲情况：[详细分析]
特殊格局判断：[专旺格，从格，化气格，两神成象格，杂奇格，日贵格，三奇贵人格，禄元互换格，天元一气格，身杀两停格，伤官配印格，伤官见官格，伤官生财格，伤官泄秀格]
喜用和忌凶：[详细分析]
不要使用任何特殊符号`;
                break;
            case 'career':
                prompt += `详细分析适合行业情况：
1 适合行业分析
2 最佳行业推荐
3 流年事业运分析

返回格式：
流年事业运分析：[以表格方式详细分析](1-5星)`;
                break;
            case 'wealth':
                prompt += `详细分析财富情况：
1 财富格局
2 流年财运分析
3 大运财运分析

返回格式：
流年财运分析：[以表格方式详细分析](1-5星)
大运财运分析：[以表格方式详细分析](1-5星)`;
                break;
            case 'elements':
                prompt += `分析八字五行强弱，燥湿和流通情况：
1 五行强弱分析
2 五行燥湿分析
3 五行流通分析
4 调候建议

返回格式：
五行强弱分析[详细分析]
五行燥湿分析[详细分析]
五行流通分析[详细分析]
调候建议：[详细分析]`;
                break;
            case 'personality':
                prompt += `详细性格分析：
1 外在性格分析
2 内在性格分析
3 特殊性格分析

外在性格分析[详细分析]
内在性格分析[详细分析]
特殊性格分析[详细分析]`;
                break;
            case 'children':
                prompt += `分析子女情况：
1 子女数量分析
2 子女缘分分析

子女数量：[男女]
子女缘分分析：[详细分析]`;
                break;
            case 'marriage':
                prompt += `分析婚姻情况：
1 适婚年份
2 桃花年份
3 流月婚姻吉凶分析

返回格式：
适婚年份：[表格方式呈现]
桃花年份：[表格方式呈现]
流月婚姻吉凶分析：[表格方式呈现具体建议](1-5星)`;
                break;
            case 'health':
                prompt += `详细分析健康状况：
1 五行对应器官健康
2 潜在健康问题
3 养生建议
4 流年健康分析

返回格式：
流年健康分析：[表格方式呈现具体建议]`;
                break;
            case 'annual-fortune':
                prompt += `详细分析当前流年运势：
1 流年事业吉凶分析
2 流年婚姻吉凶分析
3 流年重大事件吉凶分析

返回格式：
流年事业吉凶分析：[以表格方式详细分析](1-5星)
流年婚姻吉凶分析：[以表格方式详细分析](1-5星)
流年重大事件吉凶分析：[以表格方式详细分析](1-5星)`;
                break;
            case 'daily-fortune':
                prompt += `详细分析每日运势：
1 每日吉凶时辰
2 每日宜忌事项
3 每日冲煞方位

返回格式：
每日吉凶时辰：[表格方式详细分析]
每日宜忌事项：[表格方式详细分析]
每日冲煞方位：[表格方式详细分析]`;
                break;
            case 'milestones':
                prompt += `分析一生重要节点和重大灾祸：
1 一生重要事件分析
2 一生重大灾祸分析
3 如何趋吉避凶

返回格式：
一生重要事件分析：[以表格方式详细分析]
一生重大灾祸分析：[以表格方式详细分析]
如何趋吉避凶：[详细分析] `;
                break;
            case 'decade-fortune':
                prompt += `分析十年大运走势：
1 大运事业吉凶分析
2 大运婚姻吉凶分析
3 大运重大事件吉凶分析

返回格式：
大运事业吉凶分析：[以表格方式详细分析](1-5星)
大运婚姻吉凶分析：[以表格方式详细分析](1-5星)
大运重大事件吉凶分析：[以表格方式详细分析] (1-5星)`;
                break;
            case 'monthly-fortune':
                prompt += `详细分析今年每月运势：
1 事业吉凶分析
2 婚姻吉凶分析
3 重大事件吉凶分析

返回格式：
事业吉凶分析：[以表格方式详细分析](1-5星)
婚姻吉凶分析：[以表格方式详细分析](1-5星)
重大事件吉凶分析：[以表格方式详细分析] (1-5星)`;
                break;
            default:
                prompt += `请分析${section}相关内容`;
        }

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "deepseek-chat",
                messages: [{ role: "user", content: prompt }],
                temperature: 0
            })
        });
        
        if (!response.ok) throw new Error(`API请求失败: ${response.status}`);
        const result = await response.json();
        return result.choices[0].message.content;
    }

    function displayBasicInfo(info) {
        const nameDisplay = document.getElementById('user-name-display');
        const birthDisplay = document.getElementById('user-birth-display');
        const hour = parseInt(birthData.time.split(':')[0]);
        const timeMap = {
            23: '子时 (23-1)', 0: '子时 (23-1)',
            1: '丑时 (1-3)', 3: '寅时 (3-5)',
            5: '卯时 (5-7)', 7: '辰时 (7-9)',
            9: '巳时 (9-11)', 11: '午时 (11-13)',
            13: '未时 (13-15)', 15: '申时 (15-17)',
            17: '酉时 (17-19)', 19: '戌时 (19-21)',
            21: '亥时 (21-23)'
       };
        nameDisplay.textContent = birthData.name || '匿名用户';
        birthDisplay.textContent = birthData.date.replace(/-/g, '/') + ' ' + timeMap[hour];
        yearStem.textContent = info.yearStem;
        yearBranch.textContent = info.yearBranch;
        yearHiddenStems.textContent = info.yearHiddenStems;
        monthStem.textContent = info.monthStem;
        monthBranch.textContent = info.monthBranch;
        monthHiddenStems.textContent = info.monthHiddenStems;
        dayStem.textContent = info.dayStem;
        dayBranch.textContent = info.dayBranch;
        dayHiddenStems.textContent = info.dayHiddenStems;
        hourStem.textContent = info.hourStem;
        hourBranch.textContent = info.hourBranch;
        hourHiddenStems.textContent = info.hourHiddenStems;
        setElementColors(yearStem, info.yearStem);
        setElementColors(yearBranch, info.yearBranch);
        setElementColors(monthStem, info.monthStem);
        setElementColors(monthBranch, info.monthBranch);
        setElementColors(dayStem, info.dayStem);
        setElementColors(dayBranch, info.dayBranch);
        setElementColors(hourStem, info.hourStem);
        setElementColors(hourBranch, info.hourBranch);
        setHiddenStemsColors(yearHiddenStems, info.yearHiddenStems);
        setHiddenStemsColors(monthHiddenStems, info.monthHiddenStems);
        setHiddenStemsColors(dayHiddenStems, info.dayHiddenStems);
        setHiddenStemsColors(hourHiddenStems, info.hourHiddenStems);
        personalityTraits.textContent = `命主性格：${info.personality}`;
        currentPillars = {
            year: info.yearStem + info.yearBranch,
            month: info.monthStem + info.monthBranch,
            day: info.dayStem + info.dayBranch,
            hour: info.hourStem + info.hourBranch
        };
    }

    function setElementColors(element, text) {
        const stemElements = {
            '甲': 'wood', '乙': 'wood',
            '丙': 'fire', '丁': 'fire',
            '戊': 'earth', '己': 'earth',
            '庚': 'metal', '辛': 'metal',
            '壬': 'water', '癸': 'water'
        };
        const branchElements = {
            '寅': 'wood', '卯': 'wood',
            '午': 'fire', '巳': 'fire',
            '辰': 'earth', '戌': 'earth', '丑': 'earth', '未': 'earth',
            '申': 'metal', '酉': 'metal',
            '子': 'water', '亥': 'water'
        };
        element.classList.remove('wood', 'fire', 'earth', 'metal', 'water');
        if (stemElements[text]) {
            element.classList.add(stemElements[text]);
        } else if (branchElements[text]) {
            element.classList.add(branchElements[text]);
        }
    }

    function setHiddenStemsColors(element, stems) {
        element.classList.remove('wood', 'fire', 'earth', 'metal', 'water');
        const stemElements = {
            '甲': 'wood', '乙': 'wood',
            '丙': 'fire', '丁': 'fire',
            '戊': 'earth', '己': 'earth',
            '庚': 'metal', '辛': 'metal',
            '壬': 'water', '癸': 'water'
        };
        const spans = [];
        for (let i = 0; i < stems.length; i++) {
            const char = stems[i];
            const elementClass = stemElements[char] || '';
            spans.push(`<span class="${elementClass}">${char}</span>`);
        }
        element.innerHTML = spans.join('');
    }

    function displaySectionContent(section, result, contentElement) {
        if (result.includes('★')) {
            result = result.replace(/(★+)/g, '<span class="rating" style="color:var(--earth-color);text-shadow:0 0 5px var(--earth-color)">$1</span>');
            result = result.replace(/(☆+)/g, '<span style="color:#666">$1</span>');
        }
        const html = marked.parse(result);
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        tempDiv.querySelectorAll('table').forEach(table => {
            table.classList.add('markdown-table');
        });
        contentElement.innerHTML = tempDiv.innerHTML;
    }
});
