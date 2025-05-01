document.addEventListener('DOMContentLoaded', function() {
    // 增强版缓存对象v2.2v
    const baziCache = {
        data: {},
        get: function(key) {
            const item = this.data[key];
            if (item && item.expiry > Date.now()) {
                return item.value;
            }
            return null;
        },
        set: function(key, value, ttl = 3600000) { // 默认1小时缓存
            this.data[key] = {
                value: value,
                expiry: Date.now() + ttl
            };
        },
        clearExpired: function() {
            for (const key in this.data) {
                if (this.data[key].expiry <= Date.now()) {
                    delete this.data[key];
                }
            }
        }
    };
    
    // 每10分钟清理一次过期缓存
    setInterval(() => baziCache.clearExpired(), 600000);
    
    // 兜底规则库
    const fallbackRules = {
        "庚子年戊寅月壬午日丙午时": {
            "yearStem": "庚",
            "yearBranch": "子",
            "monthStem": "戊",
            "monthBranch": "寅",
            "dayStem": "壬",
            "dayBranch": "午",
            "hourStem": "丙",
            "hourBranch": "午",
            "yearHiddenStems": "癸",
            "monthHiddenStems": "甲丙戊",
            "dayHiddenStems": "丁己",
            "hourHiddenStems": "丁己",
            "elements": [3, 4, 2, 1, 2],
            "personality": "似烈火烹油，性急如火但光明磊落",
            "gamblingFortune": {
                "rating": "★★★☆☆",
                "analysis": "今日偏财运中等，适合小赌怡情但不宜大额投注。",
                "direction": "东南",
                "hour": "15-17",
                "score": 3
            }
        }
    };

    // API请求队列和批处理系统
    const apiRequestQueue = {
        queue: [],
        batchSize: 3,
        processing: false,
        addRequest: function(request) {
            return new Promise((resolve, reject) => {
                this.queue.push({ request, resolve, reject });
                if (!this.processing) {
                    this.processQueue();
                }
            });
        },
        processQueue: async function() {
            this.processing = true;
            while (this.queue.length > 0) {
                const batch = this.queue.splice(0, this.batchSize);
                try {
                    const results = await Promise.all(
                        batch.map(item => this.executeRequest(item.request))
                    );
                    results.forEach((result, index) => {
                        batch[index].resolve(result);
                    });
                } catch (error) {
                    batch.forEach(item => {
                        item.reject(error);
                    });
                }
                // 批处理间隔，避免速率限制
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            this.processing = false;
        },
        executeRequest: async function(request) {
            const { url, options, cacheKey } = request;
            
            // 检查缓存
            const cachedResponse = baziCache.get(cacheKey);
            if (cachedResponse) {
                return cachedResponse;
            }
            
            // 重试机制
            let retries = 3;
            let lastError = null;
            
            while (retries > 0) {
                try {
                    const response = await fetch(url, options);
                    
                    if (!response.ok) {
                        throw new Error(`API请求失败: ${response.status}`);
                    }
                    
                    const result = await response.json();
                    const apiResponse = result.choices[0].message.content;
                    
                    // 缓存结果
                    baziCache.set(cacheKey, apiResponse);
                    
                    return apiResponse;
                } catch (error) {
                    lastError = error;
                    retries--;
                    if (retries > 0) {
                        await new Promise(resolve => setTimeout(resolve, 1000 * (4 - retries)));
                    }
                }
            }
            
            // 所有重试都失败，检查是否有兜底规则
            const baziKey = cacheKey.split(':')[0];
            if (fallbackRules[baziKey] && request.section === 'basic') {
                return fallbackRules[baziKey];
            }
            
            throw lastError || new Error('API请求失败');
        }
    };

    // 十神映射表
    const tenGodsMap = {
        // 日干为甲
        '甲': {
            '甲': '比肩', '乙': '劫财', '丙': '食神', '丁': '伤官', '戊': '偏财',
            '己': '正财', '庚': '七杀', '辛': '正官', '壬': '偏印', '癸': '正印',
            '寅': '比肩', '卯': '劫财', '午': '伤官', '巳': '食神', '辰': '偏财',
            '戌': '偏财', '丑': '正财', '未': '正财', '申': '七杀', '酉': '正官',
            '子': '正印', '亥': '偏印'
        },
        // 日干为乙
        '乙': {
            '甲': '劫财', '乙': '比肩', '丙': '伤官', '丁': '食神', '戊': '正财',
            '己': '偏财', '庚': '正官', '辛': '七杀', '壬': '正印', '癸': '偏印',
            '寅': '劫财', '卯': '比肩', '午': '食神', '巳': '伤官', '辰': '正财',
            '戌': '正财', '丑': '偏财', '未': '偏财', '申': '正官', '酉': '七杀',
            '子': '偏印', '亥': '正印'
        },
        // 日干为丙
        '丙': {
            '甲': '偏印', '乙': '正印', '丙': '比肩', '丁': '劫财', '戊': '食神',
            '己': '伤官', '庚': '偏财', '辛': '正财', '壬': '七杀', '癸': '正官',
            '寅': '偏印', '卯': '正印', '午': '劫财', '巳': '比肩', '辰': '食神',
            '戌': '食神', '丑': '伤官', '未': '伤官', '申': '偏财', '酉': '正财',
            '子': '正官', '亥': '七杀'
        },
        // 日干为丁
        '丁': {
            '甲': '正印', '乙': '偏印', '丙': '劫财', '丁': '比肩', '戊': '伤官',
            '己': '食神', '庚': '正财', '辛': '偏财', '壬': '正官', '癸': '七杀',
            '寅': '正印', '卯': '偏印', '午': '比肩', '巳': '劫财', '辰': '伤官',
            '戌': '伤官', '丑': '食神', '未': '食神', '申': '正财', '酉': '偏财',
            '子': '七杀', '亥': '正官'
        },
        // 日干为戊
        '戊': {
            '甲': '七杀', '乙': '正官', '丙': '偏印', '丁': '正印', '戊': '比肩',
            '己': '劫财', '庚': '食神', '辛': '伤官', '壬': '偏财', '癸': '正财',
            '寅': '七杀', '卯': '正官', '午': '正印', '巳': '偏印', '辰': '比肩',
            '戌': '比肩', '丑': '劫财', '未': '劫财', '申': '食神', '酉': '伤官',
            '子': '正财', '亥': '偏财'
        },
        // 日干为己
        '己': {
            '甲': '正官', '乙': '七杀', '丙': '正印', '丁': '偏印', '戊': '劫财',
            '己': '比肩', '庚': '伤官', '辛': '食神', '壬': '正财', '癸': '偏财',
            '寅': '正官', '卯': '七杀', '午': '偏印', '巳': '正印', '辰': '劫财',
            '戌': '劫财', '丑': '比肩', '未': '比肩', '申': '伤官', '酉': '食神',
            '子': '偏财', '亥': '正财'
        },
        // 日干为庚
        '庚': {
            '甲': '偏财', '乙': '正财', '丙': '七杀', '丁': '正官', '戊': '偏印',
            '己': '正印', '庚': '比肩', '辛': '劫财', '壬': '食神', '癸': '伤官',
            '寅': '偏财', '卯': '正财', '午': '正官', '巳': '七杀', '辰': '偏印',
            '戌': '偏印', '丑': '正印', '未': '正印', '申': '比肩', '酉': '劫财',
            '子': '伤官', '亥': '食神'
        },
        // 日干为辛
        '辛': {
            '甲': '正财', '乙': '偏财', '丙': '正官', '丁': '七杀', '戊': '正印',
            '己': '偏印', '庚': '劫财', '辛': '比肩', '壬': '伤官', '癸': '食神',
            '寅': '正财', '卯': '偏财', '午': '七杀', '巳': '正官', '辰': '正印',
            '戌': '正印', '丑': '偏印', '未': '偏印', '申': '劫财', '酉': '比肩',
            '子': '食神', '亥': '伤官'
        },
        // 日干为壬
        '壬': {
            '甲': '食神', '乙': '伤官', '丙': '偏财', '丁': '正财', '戊': '七杀',
            '己': '正官', '庚': '偏印', '辛': '正印', '壬': '比肩', '癸': '劫财',
            '寅': '食神', '卯': '伤官', '午': '正财', '巳': '偏财', '辰': '七杀',
            '戌': '七杀', '丑': '正官', '未': '正官', '申': '偏印', '酉': '正印',
            '子': '劫财', '亥': '比肩'
        },
        // 日干为癸
        '癸': {
            '甲': '伤官', '乙': '食神', '丙': '正财', '丁': '偏财', '戊': '正官',
            '己': '七杀', '庚': '正印', '辛': '偏印', '壬': '劫财', '癸': '比肩',
            '寅': '伤官', '卯': '食神', '午': '偏财', '巳': '正财', '辰': '正官',
            '戌': '正官', '丑': '七杀', '未': '七杀', '申': '正印', '酉': '偏印',
            '子': '比肩', '亥': '劫财'
        }
    };

    // 创建十神提示框元素
    const tenGodsTooltip = document.createElement('div');
    tenGodsTooltip.className = 'ten-gods-tooltip';
    document.body.appendChild(tenGodsTooltip);

    // 显示十神提示框
    function showTenGodsTooltip(element, dayStem, stemOrBranch) {
        const tenGod = tenGodsMap[dayStem][stemOrBranch] || '未知';
        tenGodsTooltip.textContent = `${stemOrBranch}: ${tenGod}`;
        tenGodsTooltip.style.display = 'block';
        
        const rect = element.getBoundingClientRect();
        tenGodsTooltip.style.left = `${rect.left + window.scrollX}px`;
        tenGodsTooltip.style.top = `${rect.bottom + window.scrollY + 5}px`;
    }

    // 隐藏十神提示框
    function hideTenGodsTooltip() {
        tenGodsTooltip.style.display = 'none';
    }

    // 为八字四柱添加点击事件
    function setupTenGodsClickHandlers() {
        const pillars = ['year', 'month', 'day', 'hour'];
        
        pillars.forEach(pillar => {
            const stemElement = document.getElementById(`${pillar}-stem`);
            const branchElement = document.getElementById(`${pillar}-branch`);
            const dayStem = document.getElementById('day-stem').textContent;
            
            if (stemElement && branchElement && dayStem) {
                // 天干点击事件
                stemElement.addEventListener('click', function(e) {
                    e.stopPropagation();
                    showTenGodsTooltip(this, dayStem, this.textContent);
                });
                
                // 地支点击事件
                branchElement.addEventListener('click', function(e) {
                    e.stopPropagation();
                    showTenGodsTooltip(this, dayStem, this.textContent);
                });
            }
        });
        
        // 点击其他地方隐藏提示框
        document.addEventListener('click', hideTenGodsTooltip);
    }

    // 添加CSS样式
    const style = document.createElement('style');
    style.textContent = `
    .ten-gods-tooltip {
        position: absolute;
        background-color: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 5px 10px;
        border-radius: 4px;
        font-size: 14px;
        z-index: 1000;
        display: none;
        pointer-events: none;
        white-space: nowrap;
    }
    `;
    document.head.appendChild(style);

    // DOM元素
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
    const elementChartDescription = document.getElementById('element-chart-description');
    const gamblingRating = document.getElementById('gambling-rating');
    const gamblingDetails = document.getElementById('gambling-details');
    const savedProfilesList = document.getElementById('saved-profiles-list');
    const lunarDate = document.getElementById('lunar-date');
    const lunarGanzhi = document.getElementById('lunar-ganzhi');
    const lunarYi = document.getElementById('lunar-yi');
    const lunarJi = document.getElementById('lunar-ji');
    const baziQuestionInput = document.getElementById('bazi-question');
    const baziQaSubmit = document.getElementById('bazi-qa-submit');
    const baziQaResponse = document.getElementById('bazi-qa-response');
    const baziQaLoading = document.getElementById('bazi-qa-loading');
    const fateAnalysisBtn = document.getElementById('fate-analysis-btn');
    const wealthAnalysisBtn = document.getElementById('wealth-analysis-btn');
    const analysisModal = document.getElementById('analysis-modal');
    const analysisTitle = document.getElementById('analysis-title');
    const analysisContent = document.getElementById('analysis-content');
    const closeModal = document.getElementById('close-modal');
    const loadingOverlay = document.getElementById('loading-overlay');

    // 全局变量
    let elementChart;
    const currentDate = new Date();
    let birthData = {};
    let loadedSections = {};
    let currentPillars = {};
    let fateScoreDetails = {};
    let wealthScoreDetails = {};
    let fateScoreValue = 0;
    let wealthScoreValue = 0;
    let loadButtonHandlers = {}; // 存储按钮处理器引用

    // 初始化
    loadSavedProfiles();
    updateLunarCalendar();
    initEventListeners();

    // 事件监听器初始化
    function initEventListeners() {
        // 时间选择
        timePeriodOptions.forEach(function(option) {
            option.addEventListener('click', function() {
                timePeriodOptions.forEach(function(opt) {
                    opt.classList.remove('selected');
                });
                this.classList.add('selected');
                const hour = this.getAttribute('data-hour');
                const minute = this.getAttribute('data-minute');
                birthTimeInput.value = `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
            });
        });

        // 语言切换
        languageBtns.forEach(function(btn) {
            btn.addEventListener('click', function() {
                languageBtns.forEach(function(b) {
                    b.classList.remove('active');
                });
                this.classList.add('active');
                const lang = this.getAttribute('data-lang');
                console.log('切换到语言:', lang);
            });
        });

        // Markdown解析设置
        marked.setOptions({
            breaks: true,
            gfm: true,
            tables: true,
            highlight: function(code, lang) {
                return code;
            }
        });

        // 八字问答提交
        baziQaSubmit.addEventListener('click', async function() {
            const question = baziQuestionInput.value.trim();
            if (!question) {
                alert('请输入您的问题');
                return;
            }
            
            baziQaSubmit.disabled = true;
            baziQaResponse.style.display = 'none';
            baziQaLoading.style.display = 'flex';
            
            try {
                const response = await getBaziAnswer(question);
                baziQaResponse.innerHTML = marked.parse(response);
                baziQaResponse.style.display = 'block';
            } catch (error) {
                console.error('获取回答失败:', error);
                baziQaResponse.innerHTML = '<p style="color:var(--danger-color)">获取回答失败，请稍后重试</p>';
                baziQaResponse.style.display = 'block';
            } finally {
                baziQaSubmit.disabled = false;
                baziQaLoading.style.display = 'none';
            }
        });

        // 重新计算
        recalculateBtn.addEventListener('click', function() {
            document.getElementById('name').value = '';
            document.getElementById('birth-date').value = '';
            document.getElementById('birth-time').value = '';
            document.getElementById('gender').value = '';
            timePeriodOptions.forEach(function(opt) {
                opt.classList.remove('selected');
            });
            resultSection.style.display = 'none';
            inputSection.style.display = 'block';
            resetAllContent();
            if (elementChart) {
                elementChart.destroy();
            }
            window.scrollTo(0, 0);
        });

        // 菜单标签切换
        document.querySelectorAll('.menu-tab').forEach(function(tab) {
            tab.addEventListener('click', function() {
                document.querySelectorAll('.menu-tab').forEach(function(t) {
                    t.classList.remove('active');
                });
                document.querySelectorAll('.tab-content').forEach(function(c) {
                    c.classList.remove('active');
                });
                this.classList.add('active');
                const tabId = this.getAttribute('data-tab') + '-tab';
                document.getElementById(tabId).classList.add('active');
            });
        });

        // 计算按钮
        calculateBtn.addEventListener('click', calculateBazi);

        // 命格等级分析按钮
        fateAnalysisBtn.addEventListener('click', async function() {
            showLoading();
            try {
                const content = await getFateAnalysisContent();
                showAnalysisModal('命格等级分析', content);
            } catch (error) {
                console.error('获取命格分析失败:', error);
                showAnalysisModal('命格等级分析', getFallbackFateAnalysis());
            } finally {
                hideLoading();
            }
        });

        // 财富等级分析按钮
        wealthAnalysisBtn.addEventListener('click', async function() {
            showLoading();
            try {
                const content = await getWealthAnalysisContent();
                showAnalysisModal('财富等级分析', content);
            } catch (error) {
                console.error('获取财富分析失败:', error);
                showAnalysisModal('财富等级分析', getFallbackWealthAnalysis());
            } finally {
                hideLoading();
            }
        });

        // 关闭模态框
        closeModal.addEventListener('click', function() {
            analysisModal.style.display = 'none';
        });

        // 点击模态框外部关闭
        window.addEventListener('click', function(event) {
            if (event.target === analysisModal) {
                analysisModal.style.display = 'none';
            }
        });
    }

    // 显示加载动画
    function showLoading() {
        if (!loadingOverlay) {
            const overlay = document.createElement('div');
            overlay.id = 'loading-overlay';
            overlay.innerHTML = `
                <div class="loading-spinner"></div>
                <div class="loading-text">分析中...</div>
            `;
            document.body.appendChild(overlay);
        } else {
            loadingOverlay.style.display = 'flex';
        }
    }

    // 隐藏加载动画
    function hideLoading() {
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
    }

    // 显示分析模态框
    function showAnalysisModal(title, content) {
        analysisTitle.textContent = title;
        analysisContent.innerHTML = marked.parse(content);
        analysisContent.style.color = '#000'; // 设置字体颜色为黑色
        analysisModal.style.display = 'block';
    }

    // 获取命格等级分析内容
    async function getFateAnalysisContent() {
        const score = calculateFateScore(currentPillars);
        const levelInfo = getFateLevel(score);
        
        // 获取API详细分析
        const analysis = await getBaziAnalysis('fate-level', birthData);
        
        return `
## 1. 等级定位
${levelInfo.name}

## 2. 命格特征
${getFateCharacteristics(score)}

## 3. 优势分析
${getFateStrengths(score)}

## 4. 发展建议
${getFateSuggestions(score)}

## 5. 评分细节
- 日主得令: ${fateScoreDetails.seasonScore}/30
- 五行平衡: ${fateScoreDetails.balanceScore}/25
- 特殊格局: ${fateScoreDetails.patternScore}/20
- 十神配置: ${fateScoreDetails.godsScore}/15
- 天干地支组合: ${fateScoreDetails.combinationScore}/10
`;
    }

    // 获取命格特征
    function getFateCharacteristics(score) {
        if (score >= 85) return "天赐鸿运命格，一生多贵人相助，机遇不断，事业顺遂，健康长寿，家庭和睦。";
        if (score >= 70) return "福星高照命格，事业有成，财运亨通，虽有波折但终能逢凶化吉。";
        if (score >= 50) return "安常守分命格，平稳安定，需靠自身努力获得成就，无大起大落。";
        if (score >= 30) return "勤能补拙命格，需付出更多努力才能获得成功，但终有回报。";
        return "逆水行舟命格，人生多波折，需特别努力并注意规避风险。";
    }

    // 获取命格优势
    function getFateStrengths(score) {
        if (score >= 85) return "天生福气深厚，贵人运强，机遇多，抗风险能力强，事业容易成功。";
        if (score >= 70) return "聪明才智出众，适应能力强，人际关系好，事业发展顺利。";
        if (score >= 50) return "性格稳重，脚踏实地，能通过努力获得稳定发展。";
        if (score >= 30) return "意志坚定，吃苦耐劳，逆境中成长，终能有所成就。";
        return "磨练意志，经历丰富，若能克服困难，可获独特人生体验。";
    }

    // 获取命格发展建议
    function getFateSuggestions(score) {
        if (score >= 85) return "善用优势资源，避免骄傲自满，多帮助他人以积累福报。";
        if (score >= 70) return "把握机遇，稳扎稳打，可尝试多元化发展。";
        if (score >= 50) return "专注专业技能提升，建立稳定基础，避免冒险。";
        if (score >= 30) return "制定明确目标，坚持不懈，寻求贵人指点。";
        return "修身养性，学习专业技能，谨慎决策，避免高风险行为。";
    }

    // 获取财富等级分析内容
    async function getWealthAnalysisContent() {
        const score = calculateWealthScore(currentPillars);
        const levelInfo = getWealthLevel(score);
        
        // 获取API详细分析
        const analysis = await getBaziAnalysis('wealth-level', birthData);
        
        return `
## 1. 等级定位
${levelInfo.name}

## 2. 财富特征
${getWealthCharacteristics(score)}

## 3. 优势分析
${getWealthStrengths(score)}

## 4. 发展建议
${getWealthSuggestions(score)}

## 5. 评分细节
- 财星数量质量: ${wealthScoreDetails.wealthStarScore}/30
- 财星得地: ${wealthScoreDetails.wealthPositionScore}/25
- 财星受克: ${wealthScoreDetails.wealthDamageScore}/20
- 食伤生财: ${wealthScoreDetails.wealthSupportScore}/15
- 大运走势: ${wealthScoreDetails.fortuneScore}/10
`;
    }

    // 获取财富特征
    function getWealthCharacteristics(score) {
        if (score >= 90) return "天生财运亨通，正偏财俱佳，投资眼光独到，财富积累迅速。";
        if (score >= 80) return "财运旺盛，正财稳定，偏财机会多，能通过努力获得丰厚回报。";
        if (score >= 60) return "财运平稳，正财为主，需合理规划才能积累财富。";
        if (score >= 40) return "财运起伏，需靠专业技能获取财富，投资需谨慎。";
        return "财运较弱，需特别努力才能获得财富，宜稳扎稳打。";
    }

    // 获取财富优势
    function getWealthStrengths(score) {
        if (score >= 90) return "财源广进，投资眼光精准，能把握大机遇，财富增长快。";
        if (score >= 80) return "赚钱能力强，理财有道，能通过多种渠道积累财富。";
        if (score >= 60) return "稳定收入来源，能通过专业技能获得合理报酬。";
        if (score >= 40) return "节俭务实，能通过长期积累获得财富增长。";
        return "吃苦耐劳，能在逆境中找到生存之道。";
    }

    // 获取财富建议
    function getWealthSuggestions(score) {
        if (score >= 90) return "多元化投资，善用财富回馈社会，避免过度投机。";
        if (score >= 80) return "把握投资机会，建立稳健理财规划，避免冲动消费。";
        if (score >= 60) return "专注主业发展，适当进行保守投资，建立应急基金。";
        if (score >= 40) return "提升专业技能，控制开支，避免高风险投资。";
        return "专注稳定收入，学习理财知识，避免负债，量入为出。";
    }

    // 获取备用命格分析内容
    function getFallbackFateAnalysis() {
        const score = calculateFateScore(currentPillars);
        const levelInfo = getFateLevel(score);
        
        return `
## 1. 等级定位
${levelInfo.name}

## 2. 命格特征
${getFateCharacteristics(score)}

## 3. 优势分析
${getFateStrengths(score)}

## 4. 发展建议
${getFateSuggestions(score)}

## 5. 评分细节
- 日主得令: ${fateScoreDetails.seasonScore}/30
- 五行平衡: ${fateScoreDetails.balanceScore}/25
- 特殊格局: ${fateScoreDetails.patternScore}/20
- 十神配置: ${fateScoreDetails.godsScore}/15
- 天干地支组合: ${fateScoreDetails.combinationScore}/10
`;
    }

    // 获取备用财富分析内容
    function getFallbackWealthAnalysis() {
        const score = calculateWealthScore(currentPillars);
        const levelInfo = getWealthLevel(score);
        
        return `
## 1. 等级定位
${levelInfo.name}

## 2. 财富特征
${getWealthCharacteristics(score)}

## 3. 优势分析
${getWealthStrengths(score)}

## 4. 发展建议
${getWealthSuggestions(score)}

## 5. 评分细节
- 财星数量质量: ${wealthScoreDetails.wealthStarScore}/30
- 财星得地: ${wealthScoreDetails.wealthPositionScore}/25
- 财星受克: ${wealthScoreDetails.wealthDamageScore}/20
- 食伤生财: ${wealthScoreDetails.wealthSupportScore}/15
- 大运走势: ${wealthScoreDetails.fortuneScore}/10
`;
    }

    // ... [保留其余所有函数代码不变，包括calculateBazi, displayBasicInfo等所有其他函数]

    // 初始化加载按钮
    function initLoadButtons() {
        // 先移除所有现有的事件监听器
        document.querySelectorAll('.load-btn').forEach(function(button) {
            const section = button.getAttribute('data-section');
            if (loadButtonHandlers[section]) {
                button.removeEventListener('click', loadButtonHandlers[section]);
            }
        });
        
        loadButtonHandlers = {}; // 清空处理器引用

        // 为每个按钮添加新的事件监听器
        document.querySelectorAll('.load-btn').forEach(function(button) {
            // 保存原始文本
            if (!button.getAttribute('data-original-text')) {
                const originalText = button.textContent.trim();
                button.setAttribute('data-original-text', originalText);
            }
            
            const section = button.getAttribute('data-section');
            const handler = function(e) { loadButtonClickHandler.call(button, e); };
            loadButtonHandlers[section] = handler;
            button.addEventListener('click', handler);
        });
    }

    // 加载按钮点击处理函数
    async function loadButtonClickHandler(e) {
        e.preventDefault();
        const button = this;
        const section = button.getAttribute('data-section');
        const contentElement = document.getElementById(`${section}-content`);
        const container = button.closest('.load-btn-container');
        
        // 如果已经加载过，只切换显示/隐藏
        if (loadedSections[section]) {
            container.classList.toggle('active');
            contentElement.classList.toggle('active');
            return;
        }
        
        const originalBtnHtml = button.innerHTML;
        button.disabled = true;
        button.innerHTML = `<span style="display: flex; align-items: center; justify-content: center; width: 100%;"><span class="loading"></span>量子分析中...</span><i class="fas fa-chevron-down toggle-icon"></i>`;
        container.classList.add('active');
        
        const progressContainer = document.createElement('div');
        progressContainer.className = 'progress-container';
        progressContainer.innerHTML = '<div class="progress-bar"></div>';
        contentElement.innerHTML = '';
        contentElement.appendChild(progressContainer);
        
        const progressBar = progressContainer.querySelector('.progress-bar');
        let progress = 0;
        const progressInterval = setInterval(function() {
            progress += Math.random() * 10;
            if (progress >= 100) progress = 100;
            progressBar.style.width = `${progress}%`;
        }, 300);
        
        try {
            const result = await getBaziAnalysis(section, birthData);
            clearInterval(progressInterval);
            displaySectionContent(section, result, contentElement);
            
            // 恢复按钮状态，添加完成标记
            const originalText = button.getAttribute('data-original-text');
            button.innerHTML = `<span>${originalText}</span><i class="fas fa-check"></i><i class="fas fa-chevron-down toggle-icon"></i>`;
            button.disabled = false;
            
            contentElement.classList.add('active');
            loadedSections[section] = true;
            
            if (section === 'decade-fortune') {
                initFortuneChart(result);
            }
        } catch (error) {
            console.error(`加载${section}失败:`, error);
            clearInterval(progressInterval);
            contentElement.innerHTML = '<p style="color:var(--danger-color)">加载失败，请重试</p>';
            button.disabled = false;
            button.innerHTML = `<span>${button.getAttribute('data-original-text')}</span><i class="fas fa-chevron-down toggle-icon"></i>`;
        }
    }

    // 显示部分内容
    function displaySectionContent(section, result, contentElement) {
        if (result.includes('★')) {
            result = result.replace(/(★+)/g, '<span class="rating" style="color:var(--earth-color);text-shadow:0 0 5px var(--earth-color)">$1</span>');
            result = result.replace(/(☆+)/g, '<span style="color:#666">$1</span>');
        }
        const html = marked.parse(result);
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        tempDiv.querySelectorAll('table').forEach(function(table) {
            table.classList.add('markdown-table');
        });
        contentElement.innerHTML = tempDiv.innerHTML;
    }

    // 计算八字
    async function calculateBazi(e) {
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
        
        saveProfile(birthData);
        calculateBtn.disabled = true;
        calculateBtn.innerHTML = '<span class="loading"></span> 量子测算中...';
        
        try {
            showLoading();
            
            // 使用混合模式获取结果
            const baziInfo = await getBaziAnalysis('basic', birthData);
            
            displayBasicInfo(baziInfo);
            initElementChart(baziInfo);
            updateLunarCalendar();
            
            currentPillars = {
                year: baziInfo.yearStem + baziInfo.yearBranch,
                month: baziInfo.monthStem + baziInfo.monthBranch,
                day: baziInfo.dayStem + baziInfo.dayBranch,
                hour: baziInfo.hourStem + baziInfo.hourBranch
            };
            
            displayScores();
            gamblingRating.textContent = baziInfo.gamblingFortune.rating;
            gamblingDetails.innerHTML = `
                ${baziInfo.gamblingFortune.analysis}<br>
                最佳方位: ${baziInfo.gamblingFortune.direction}<br>
                最佳时段: ${baziInfo.gamblingFortune.hour}
            `;
            
            inputSection.style.display = 'none';
            resultSection.style.display = 'block';
            initLoadButtons();
            window.scrollTo(0, 0);
        } catch (error) {
            console.error('测算失败:', error);
            alert('量子测算失败，请稍后重试');
        } finally {
            calculateBtn.disabled = false;
            calculateBtn.innerHTML = '<i class="fas fa-brain"></i> 开始量子测算';
            hideLoading();
        }
    }

    // ... [保留其余所有函数代码不变]

    // 获取命运等级
    function getFateLevel(score) {
        if (score >= 85) return { name: "天赐鸿运 ★★★★★ (85-100分)", class: "excellent" };
        if (score >= 70) return { name: "福星高照 ★★★★☆ (70-84分)", class: "good" };
        if (score >= 50) return { name: "安常守分 ★★★☆☆ (50-69分)", class: "average" };
        if (score >= 30) return { name: "勤能补拙 ★★☆☆☆ (30-49分)", class: "struggling" };
        return { name: "逆水行舟 ★☆☆☆☆ (<30分)", class: "needs-improvement" };
    }

    // 获取财富等级
    function getWealthLevel(score) {
        if (score >= 90) return { name: "天禄盈门 ★★★★★ (90分以上)", class: "ultra-rich" };
        if (score >= 80) return { name: "朱紫满箱 ★★★★☆ (80-89分)", class: "very-rich" };
        if (score >= 60) return { name: "粟陈贯朽 ★★★☆☆ (60-79分)", class: "moderately-rich" };
        if (score >= 40) return { name: "岁稔年丰 ★★☆☆☆ (40-59分)", class: "somewhat-rich" };
        return { name: "营营逐逐 ★☆☆☆☆ (<40分)", class: "wealth-average" };
    }

    // 显示分数
    function displayScores() {
        if (!currentPillars.year) return;
        const fateScoreValue = calculateFateScore(currentPillars);
        const fateLevelInfo = getFateLevel(fateScoreValue);
        fateLevel.textContent = fateLevelInfo.name;
        fateLevel.className = `rating-level ${fateLevelInfo.class}`;
        fateScore.textContent = `评分: ${fateScoreValue}分 (${Math.round(fateScoreValue)}%)`;
        
        const wealthScoreValue = calculateWealthScore(currentPillars);
        const wealthLevelInfo = getWealthLevel(wealthScoreValue);
        wealthLevel.textContent = wealthLevelInfo.name;
        wealthLevel.className = `rating-level ${wealthLevelInfo.class}`;
        wealthScore.textContent = `评分: ${wealthScoreValue}分 (${Math.round(wealthScoreValue)}%)`;
        
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

    // 获取地支藏干
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

    // 本地计算八字
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
        const monthHiddenStems = getHiddenStems(monthZhi);
        const dayHiddenStems = getHiddenStems(dayZhi);
        const hourHiddenStems = getHiddenStems(hourZhi);
        
        const elements = calculateNatalElements({
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
            hourHiddenStems: hourHiddenStems
        });
        
        const personality = getPersonalityTraits(dayGan);
        const decadeFortune = calculateDecadeFortune(lunar, birthData.gender);
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

    // 计算十年大运
    function calculateDecadeFortune(lunar, gender) {
        const yearGan = lunar.getYearGan();
        const yearZhi = lunar.getYearZhi();
        const isMale = gender === 'male';
        const isYangYear = ['甲', '丙', '戊', '庚', '壬'].includes(yearGan);
        const isForward = (isYangYear && isMale) || (!isYangYear && !isMale);
        
        const solar = lunar.getSolar();
        const jieQiName = isForward ? '立春' : '大寒';
        const targetJieQi = lunar.getJieQi(jieQiName);
        
        let daysDiff = 15; // 默认值
        
        try {
            // 尝试获取节气日期
            if (targetJieQi && typeof targetJieQi.getSolar === 'function') {
                const targetSolar = targetJieQi.getSolar();
                daysDiff = Math.abs(solar.diffDays(targetSolar));
            } else if (targetJieQi && targetJieQi.solar) {
                // 备选方案：如果节气对象有solar属性
                daysDiff = Math.abs(solar.diffDays(targetJieQi.solar));
            }
        } catch (e) {
            console.warn('计算节气间隔失败，使用默认值:', e);
        }
        
        const startAge = Math.floor(daysDiff / 3);
        const zhiOrder = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
        let currentZhiIndex = zhiOrder.indexOf(yearZhi);
        
        const ganOrder = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
        let currentGanIndex = ganOrder.indexOf(yearGan);
        
        const fortunes = [];
        for (let i = 0; i < 8; i++) {
            currentZhiIndex = isForward ? 
                (currentZhiIndex + 1) % 12 : 
                (currentZhiIndex - 1 + 12) % 12;
            currentGanIndex = isForward ?
                (currentGanIndex + 1) % 10 :
                (currentGanIndex - 1 + 10) % 10;
            
            const gan = ganOrder[currentGanIndex];
            const zhi = zhiOrder[currentZhiIndex];
            const baseScore = 60 + Math.floor(Math.random() * 20);
            const trendBonus = isForward ? i * 2 : (7 - i) * 2;
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

    // 计算赌博运势
    function calculateGamblingFortune(birthData, birthLunar) {
        const currentSolar = Solar.fromDate(new Date());
        const currentLunar = currentSolar.getLunar();
        const dayGan = birthLunar.getDayGan();
        const dayZhi = birthLunar.getDayZhi();
        const currentDayGan = currentLunar.getDayGan();
        const currentDayZhi = currentLunar.getDayZhi();
        
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
        
        const dayOfMonth = currentLunar.getDay();
        const month = currentLunar.getMonth();
        const dayModifier = (dayOfMonth % 10) / 10;
        const monthModifier = (month % 12) / 12;
        
        const totalScore = Math.min(5, Math.max(1, Math.round(
            (baseScore + currentScore + matchBonus) / 4 + 
            dayModifier + monthModifier
        )));
        
        const rating = '★'.repeat(totalScore) + '☆'.repeat(5 - totalScore);
        
        const analysisTexts = [
            "今日偏财运欠佳，建议远离赌博活动，专注正财为佳。",
            "今日偏财运平平，小赌可能小输，建议控制投注金额。",
            "今日偏财运中等，适合小赌怡情但不宜大额投注。",
            "今日偏财运不错，可适度参与但需保持理性。",
            "今日偏财运旺盛，但切勿贪心，见好就收为妙。"
        ];
        
        const directions = ['东', '南', '西', '北', '东南', '西南', '东北', '西北'];
        const bestDirection = directions[(dayOfMonth + month) % directions.length];
        
        const hours = ['1-3', '3-5', '5-7', '7-9', '9-11', '11-13', '13-15', '15-17', '17-19', '19-21', '21-23', '23-1'];
        const bestHour = hours[(dayOfMonth * month) % hours.length];
        
        return {
            rating: rating,
            analysis: analysisTexts[totalScore - 1],
            direction: bestDirection,
            hour: bestHour,
            score: totalScore
        };
    }

    // 获取性格特征
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

    // 加载保存的个人资料
    function loadSavedProfiles() {
        const profiles = JSON.parse(localStorage.getItem('baziProfiles') || '[]');
        savedProfilesList.innerHTML = '';
        if (profiles.length === 0) {
            savedProfilesList.innerHTML = '<div style="color:var(--text-light);font-size:14px;">暂无历史记录</div>';
            return;
        }
        profiles.forEach(function(profile, index) {
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
                <span class="profile-content">
                    ${profile.name || '匿名'} · 
                    ${profile.date.replace(/-/g, '/')} · 
                    ${timeMap[hour]} · 
                    ${profile.gender === 'male' ? '男' : '女'}
                </span>
                <span class="remove-profile-btn" data-index="${index}">
                    <i class="fas fa-times"></i>
                </span>
            `;
            
            profileElement.querySelector('.profile-content').addEventListener('click', function() {
                loadProfile(profile);
            });
            
            profileElement.querySelector('.remove-profile-btn').addEventListener('click', function(e) {
                e.stopPropagation();
                removeProfile(index);
            });
            
            savedProfilesList.appendChild(profileElement);
        });
    }

    // 移除个人资料
    function removeProfile(index) {
        const profiles = JSON.parse(localStorage.getItem('baziProfiles') || '[]');
        if (index >= 0 && index < profiles.length) {
            profiles.splice(index, 1);
            localStorage.setItem('baziProfiles', JSON.stringify(profiles));
            loadSavedProfiles();
        }
    }

    // 加载个人资料
    function loadProfile(profile) {
        document.getElementById('name').value = profile.name || '';
        document.getElementById('birth-date').value = profile.date;
        document.getElementById('birth-time').value = profile.time;
        document.getElementById('gender').value = profile.gender;
        const hour = parseInt(profile.time.split(':')[0]);
        timePeriodOptions.forEach(function(opt) {
            opt.classList.remove('selected');
        });
        const selectedOption = document.querySelector(`.time-period-option[data-hour="${hour}"]`);
        if (selectedOption) {
            selectedOption.classList.add('selected');
            birthTimeInput.value = profile.time;
        }
    }

    // 显示基础信息
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

        // 设置十神点击事件
        setupTenGodsClickHandlers();
    }

    // 设置元素颜色
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
        
        // 移除所有可能的颜色类
        element.classList.remove('wood', 'fire', 'earth', 'metal', 'water');
        
        // 添加新的颜色类
        if (stemElements[text]) {
            element.classList.add(stemElements[text]);
        } else if (branchElements[text]) {
            element.classList.add(branchElements[text]);
        }
    }

    // 更新藏干颜色设置函数
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

    // 获取八字分析
    async function getBaziAnalysis(section, data) {
        // 生成缓存键
        const cacheKey = `${generateBaziHashKey(data)}:${section}`;
        
        // 检查缓存
        const cachedResponse = baziCache.get(cacheKey);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // 先计算本地结果
        const localResult = calculateBaziLocally(data);
        
        // 对于基础信息部分，直接返回本地计算结果
        if (section === 'basic') {
            baziCache.set(cacheKey, localResult);
            return localResult;
        }
        
        // 其他部分调用API
        const apiUrl = 'https://api.deepseek.com/v1/chat/completions';
        const apiKey = 'sk-b2950087a9d5427392762814114b22a9';
        const currentDateStr = currentDate.getFullYear() + '-' + 
                              (currentDate.getMonth() + 1).toString().padStart(2, '0') + '-' + 
                              currentDate.getDate().toString().padStart(2, '0');
        
        let prompt = `请严格按照以上规则进行专业八字排盘，确保所有计算准确无误：
        
1. 从强格判定
    * 量化标准：印比总分数 ≥ 80分（天干1分，地支主气2分，中气1分）
    * 克泄耗十神（财官食伤）均无根或受制
2. 从弱格判定
    * 若日主唯一根气被合化（如卯戌合火），按从弱处理
    * 若日主无强根（仅靠被合化的微弱印比），且全局某一五行极旺（如财、官、食伤成势），则直接判定为「从格」。
    * 若印星被合化（如巳火被巳酉丑合化为金），则不计入生扶力量。
    * 优先检查「三合局」「六合」对用神的影响。
3. 排大运规则
    * 阳年男性顺排 / 阴年女性顺排 → 应取出生后第一个遇到的节气，而非下一个换月节气
    * 阴年男性逆排 / 阳年女性逆排 → 找上一个换月节气
4. 起运时间计算方法
    * 起运岁数 =（出生到下一个节气或上一个节气的天数）÷ 3（注意：阳男1973年2月2日17:00出生（未过立春），下一个节气是顺排到立春（1973年2月4日7:04）而非惊蛰，间隔天数 = 1天14小时4分 → 折合6个月10天起运）
    * 顺排≠换月节气：阳男顺排是找出生后第一个节气（可能与本月节气相同，如本例立春=丑月结束）
    * 逆排陷阱： 阴男1995年8月8日4:00出生（立秋8月8日8:12未到），逆排需找小暑7月7日18:01（非上一个立夏）
    * 节气交接日出生者需先判断是否已过节气时刻
    * 跨年逆排时（如小寒前出生）需找上年大雪
    * 节气临界点：出生在立春前X天，年柱是XX（如壬子），因未过立春，顺排的下一个节气应该是立春

当前日期：${currentDateStr}
根据以下八字信息进行分析：
姓名：${data.name || '未提供'}
出生日期：${data.date}
出生时间：${data.time} 
性别：${data.gender === 'male' ? '男' : '女'}
八字：${localResult.yearStem}${localResult.yearBranch} ${localResult.monthStem}${localResult.monthBranch} ${localResult.dayStem}${localResult.dayBranch} ${localResult.hourStem}${localResult.hourBranch}

`;

        // 根据不同部分设置不同的提示词
        switch(section) {
            case 'fate-level':
                prompt += `详细分析命格等级：
1 命格类型分析（从强、从弱、专旺等）
2 命格优势与不足
3 发展建议
格式说明：
1.用简洁语言清晰的表达
2.使用标准Markdown语法，可用表格方式呈现
3.进度条用下划线模拟可视化效果
4.箭头符号仅使用常规字符→
5.重点突出加粗显示关键信息
6.每个分析模块之间保留空行
7.实现专业排版效果`;
                break;
            case 'wealth-level':
                prompt += `详细分析财富等级：
1 财富格局类型分析
2 财富获取方式分析
3 财富积累建议
格式说明：
1.用简洁语言清晰的表达
2.使用标准Markdown语法，可用表格方式呈现
3.进度条用下划线模拟可视化效果
4.箭头符号仅使用常规字符→
5.重点突出加粗显示关键信息
6.每个分析模块之间保留空行
7.实现专业排版效果`;
                break;
            case 'strength':
                prompt += `分析命主的身强身弱情况：
1 日主得令、得地、得势的情况
2 天干地支的合化和刑冲情况
3 特殊格局判断
4 喜用和忌凶
格式说明：
1.用简洁语言清晰的表达
2.使用标准Markdown语法，可用表格方式呈现
3.进度条用下划线模拟可视化效果
4.箭头符号仅使用常规字符→
5.重点突出加粗显示关键信息
6.每个分析模块之间保留空行
7.实现专业排版效果`;
                break;
            case 'career':
                prompt += `详细分析适合行业情况：
1 适合行业分析
2 最佳行业推荐
3 流年事业运分析
格式说明：
1.用简洁语言清晰的表达
2.使用标准Markdown语法，可用表格方式呈现
3.进度条用下划线模拟可视化效果
4.箭头符号仅使用常规字符→
5.重点突出加粗显示关键信息
6.每个分析模块之间保留空行
7.实现专业排版效果`;
                break;
            case 'wealth':
                prompt += `详细分析财富情况：
1 财富格局
2 流年财运分析(1-5星)
3 大运财运分析(1-5星)
格式说明：
1.用简洁语言清晰的表达
2.使用标准Markdown语法，可用表格方式呈现
3.进度条用下划线模拟可视化效果
4.箭头符号仅使用常规字符→
5.重点突出加粗显示关键信息
6.每个分析模块之间保留空行
7.实现专业排版效果`;
                break;
            case 'elements':
                prompt += `分析八字五行强弱，燥湿和流通情况：
1 五行强弱分析
2 五行燥湿分析
3 五行流通分析
4 调候建议
格式说明：
1.用简洁语言清晰的表达
2.使用标准Markdown语法，可用表格方式呈现
3.进度条用下划线模拟可视化效果
4.箭头符号仅使用常规字符→
5.重点突出加粗显示关键信息
6.每个分析模块之间保留空行
7.实现专业排版效果`;
                break;
            case 'personality':
                prompt += `分析命主脾气性格：
1 外在性格分析
2 内在性格分析
3 特殊性格分析
格式说明：
1.用简洁语言清晰的表达
2.使用标准Markdown语法，可用表格方式呈现
3.进度条用下划线模拟可视化效果
4.箭头符号仅使用常规字符→
5.重点突出加粗显示关键信息
6.每个分析模块之间保留空行
7.实现专业排版效果`;
                break;
            case 'children':
                prompt += `分析子女情况：
1 子女数量分析（男女，数量）
2 子女缘分分析
格式说明：
1.用简洁语言清晰的表达
2.使用标准Markdown语法，可用表格方式呈现
3.进度条用下划线模拟可视化效果
4.箭头符号仅使用常规字符→
5.重点突出加粗显示关键信息
6.每个分析模块之间保留空行
7.实现专业排版效果`;
                break;
            case 'marriage':
                prompt += `分析婚姻情况：
1 适婚年份
2 桃花年份
3 流月婚姻吉凶分析
返回格式：
格式说明：
1.用简洁语言清晰的表达
2.使用标准Markdown语法，可用表格方式呈现
3.进度条用下划线模拟可视化效果
4.箭头符号仅使用常规字符→
5.重点突出加粗显示关键信息
6.每个分析模块之间保留空行
7.实现专业排版效果`;
                break;
            case 'health':
                prompt += `详细分析健康状况：
1 五行对应器官健康
2 潜在健康问题
3 养生建议
4 流年健康分析
格式说明：
1.用简洁语言清晰的表达
2.使用标准Markdown语法，可用表格方式呈现
3.进度条用下划线模拟可视化效果
4.箭头符号仅使用常规字符→
5.重点突出加粗显示关键信息
6.每个分析模块之间保留空行
7.实现专业排版效果`;
                break;
            case 'annual-fortune':
                prompt += `详细分析当前流年运势：
1 流年事业吉凶分析(1-5星)
2 流年婚姻吉凶分析(1-5星)
3 流年重大事件吉凶分析(1-5星)
格式说明：
1.用简洁语言清晰的表达
2.使用标准Markdown语法，可用表格方式呈现
3.进度条用下划线模拟可视化效果
4.箭头符号仅使用常规字符→
5.重点突出加粗显示关键信息
6.每个分析模块之间保留空行
7.实现专业排版效果`;
                break;
            case 'daily-fortune':
                prompt += `详细分析每日运势：
1 每日吉凶时辰
2 每日宜忌事项
3 每日冲煞方位
格式说明：
1.用简洁语言清晰的表达
2.使用标准Markdown语法，可用表格方式呈现
3.进度条用下划线模拟可视化效果
4.箭头符号仅使用常规字符→
5.重点突出加粗显示关键信息
6.每个分析模块之间保留空行
7.实现专业排版效果`;
                break;
            case 'milestones':
                prompt += `分析一生重要节点和重大灾祸：
1 一生重要事件分析
2 一生重大灾祸分析
3 如何趋吉避凶
格式说明：
1.用简洁语言清晰的表达
2.使用标准Markdown语法，可用表格方式呈现
3.进度条用下划线模拟可视化效果
4.箭头符号仅使用常规字符→
5.重点突出加粗显示关键信息
6.每个分析模块之间保留空行
7.实现专业排版效果`;
                break;
            case 'decade-fortune':
                prompt += `分析十年大运走势：
1 全部大运财运吉凶分析(1-5星)
2 大运重大事件吉凶分析(1-5星)
格式说明：
1.用简洁语言清晰的表达
2.使用标准Markdown语法，可用表格方式呈现
3.进度条用下划线模拟可视化效果
4.箭头符号仅使用常规字符→
5.重点突出加粗显示关键信息
6.每个分析模块之间保留空行
7.实现专业排版效果`;
                break;
            case 'monthly-fortune':
                prompt += `详细分析今年每月运势：
1 事业吉凶分析(1-5星)
2 婚姻吉凶分析(1-5星)
3 重大事件吉凶分析(1-5星)
格式说明：
1.用简洁语言清晰的表达
2.使用标准Markdown语法，可用表格方式呈现
3.进度条用下划线模拟可视化效果
4.箭头符号仅使用常规字符→
5.重点突出加粗显示关键信息
6.每个分析模块之间保留空行
7.实现专业排版效果`;
                break;
            default:
                prompt += `请分析${section}相关内容`;
        }
        
        try {
            const response = await apiRequestQueue.addRequest({
                url: apiUrl,
                options: {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({
                        model: "deepseek-chat",
                        messages: [{ role: "user", content: prompt }],
                        temperature: 0,
                        seed: 12345 // 固定seed值确保相同输入得到相同输出
                    })
                },
                section: section,
                cacheKey: cacheKey
            });
            
            return response;
            
        } catch (error) {
            console.error(`获取${section}分析失败:`, error);
            throw error;
        }
    }

    // 获取八字问答答案
    async function getBaziAnswer(question) {
        const apiUrl = 'https://api.deepseek.com/v1/chat/completions';
        const apiKey = 'sk-b2950087a9d5427392762814114b22a9';
        const cacheKey = `qa:${generateBaziHashKey(birthData)}:${question}`;
        
        // 检查缓存
        const cachedResponse = baziCache.get(cacheKey);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        const prompt = `【八字专业问答规范】请严格遵循以下规则回答：
1. 回答必须基于传统八字命理学知识
2. 回答应简洁明了，避免冗长
3. 针对用户问题提供专业分析
4. 从强格判定
    * 量化标准：印比总分数 ≥ 80分（天干1分，地支主气2分，中气1分）
    * 克泄耗十神（财官食伤）均无根或受制
5. 从弱格判定
    * 若日主唯一根气被合化（如卯戌合火），按从弱处理
    * 若日主无强根（仅靠被合化的微弱印比），且全局某一五行极旺（如财、官、食伤成势），则直接判定为「从格」。
    * 若印星被合化（如巳火被巳酉丑合化为金），则不计入生扶力量。
    * 优先检查「三合局」「六合」对用神的影响。
6. 排大运规则
    * 阳年男性顺排 / 阴年女性顺排 → 应取出生后第一个遇到的节气，而非下一个换月节气
    * 阴年男性逆排 / 阳年女性逆排 → 找上一个换月节气
7. 起运时间计算方法
    * 起运岁数 =（出生到下一个节气或上一个节气的天数）÷ 3（注意：阳男1973年2月2日17:00出生（未过立春），下一个节气是顺排到立春（1973年2月4日7:04）而非惊蛰，间隔天数 = 1天14小时4分 → 折合6个月10天起运）
    * 顺排≠换月节气：阳男顺排是找出生后第一个节气（可能与本月节气相同，如本例立春=丑月结束）
    * 逆排陷阱： 阴男1995年8月8日4:00出生（立秋8月8日8:12未到），逆排需找小暑7月7日18:01（非上一个立夏）
    * 节气交接日出生者需先判断是否已过节气时刻
    * 跨年逆排时（如小寒前出生）需找上年大雪
    * 节气临界点：出生在立春前X天，年柱是XX（如壬子），因未过立春，顺排的下一个节气应该是立春
8. 如果问题与当前命盘相关，请结合以下八字信息：
   姓名：${birthData.name || '未提供'}
   出生日期：${birthData.date}
   出生时间：${birthData.time}
   性别：${birthData.gender === 'male' ? '男' : '女'}
   八字：${currentPillars.year} ${currentPillars.month} ${currentPillars.day} ${currentPillars.hour}

用户问题：${question}`;
        
        try {
            const response = await apiRequestQueue.addRequest({
                url: apiUrl,
                options: {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({
                        model: "deepseek-chat",
                        messages: [{
                            role: "system",
                            content: "你是一位资深的八字命理大师，精通子平八字、紫微斗数等传统命理学。请严格按照八字专业问答规范回答用户问题。"
                        }, {
                            role: "user",
                            content: prompt
                        }],
                        temperature: 0
                    })
                },
                cacheKey: cacheKey
            });
            
            return response;
            
        } catch (error) {
            console.error('获取问答答案失败:', error);
            return '获取答案失败，请稍后重试';
        }
    }
});
