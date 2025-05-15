
document.addEventListener('DOMContentLoaded', function() {
    // 确保全局能获取当前日期（动态获取2025年x）
    const currentDate = new Date(); // 自动获取当前日期（2025）
    const currentYear = currentDate.getFullYear(); // 2025
    const currentMonth = currentDate.getMonth() + 1; // 1-12
    const currentDay = currentDate.getDate(); // 1-31
    const currentHour = currentDate.getHours(); // 0-23
    const currentMinute = currentDate.getMinutes(); // 0-59
    // 增强版缓存对象v2.2a
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
            },
            "luckStartingTime": "6岁10个月起运",  // 新增起运时间字段
            "strengthType": "身强"  // 新增从强从弱字段
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
    .loading-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.7);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        color: white;
        font-size: 18px;
    }
    .loading {
        border: 5px solid #f3f3f3;
        border-top: 5px solid #3498db;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        animation: spin 1s linear infinite;
        margin-bottom: 5px;
    }
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
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
    const luckStartingTime = document.getElementById('luck-starting-time'); // 新增起运时间显示元素
    const strengthType = document.getElementById('strength-type'); // 新增从强从弱显示元素

    // 全局变量
    let elementChart;
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
            // 添加btn-loading类到按钮本身
            this.classList.add('btn-loading');
            
            // 创建并显示全屏loading遮罩
            const loadingOverlay = document.createElement('div');
            loadingOverlay.className = 'loading-overlay';
            loadingOverlay.innerHTML = `
                <div class="loading"></div>
                <p>正在分析命格等级...</p>
            `;
            document.body.appendChild(loadingOverlay);
            
            // 禁用按钮防止重复点击
            this.disabled = true;
            
            try {
                const content = await getFateAnalysisContent();
                showAnalysisModal('命格等级分析', content);
            } catch (error) {
                console.error('获取命格分析失败:', error);
                showAnalysisModal('命格等级分析', '获取分析内容失败，请稍后重试');
            } finally {
                // 移除全屏loading遮罩
                if (document.body.contains(loadingOverlay)) {
                    document.body.removeChild(loadingOverlay);
                }
                // 移除btn-loading类
                this.classList.remove('btn-loading');
                // 重新启用按钮
                this.disabled = false;
            }
        });

        // 财富等级分析按钮
        wealthAnalysisBtn.addEventListener('click', async function() {
            // 添加btn-loading类到按钮本身
            this.classList.add('btn-loading');
            
            // 创建并显示全屏loading遮罩
            const loadingOverlay = document.createElement('div');
            loadingOverlay.className = 'loading-overlay';
            loadingOverlay.innerHTML = `
                <div class="loading"></div>
                <p>正在分析财富等级...</p>
            `;
            document.body.appendChild(loadingOverlay);
            
            // 禁用按钮防止重复点击
            this.disabled = true;
            
            try {
                const content = await getWealthAnalysisContent();
                showAnalysisModal('财富等级分析', content);
            } catch (error) {
                console.error('获取财富分析失败:', error);
                showAnalysisModal('财富等级分析', '获取分析内容失败，请稍后重试');
            } finally {
                // 移除全屏loading遮罩
                if (document.body.contains(loadingOverlay)) {
                    document.body.removeChild(loadingOverlay);
                }
                // 移除btn-loading类
                this.classList.remove('btn-loading');
                // 重新启用按钮
                this.disabled = false;
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

    // 显示分析模态框
    function showAnalysisModal(title, content) {
        analysisTitle.textContent = title;
        analysisContent.innerHTML = marked.parse(content);
        analysisModal.style.display = 'block';
    }

    // 获取命格等级分析内容 - 改进版
    async function getFateAnalysisContent() {
        const score = calculateFateScore(currentPillars);
        const levelInfo = getFateLevel(score);
        
        try {
            // 获取API详细分析
            const analysis = await getBaziAnalysis('fate-level', birthData);
            
            return `
## 1. 命格等级评估
**${levelInfo.name}**

您的命格综合评分为 ${score} 分（满分100分），属于${levelInfo.class.replace('-', ' ')}级别。

## 2. 命格核心特征
${analysis || getDefaultFateAnalysis(score)}

## 3. 实用建议
${getPracticalFateSuggestions(score)}

## 4. 评分细节
<div class="score-details">
    <div class="score-item">
        <span class="score-label">日主得令:</span>
        <div class="progress-container">
            <div class="progress-bar" style="width: ${(fateScoreDetails.seasonScore/30)*100}%"></div>
        </div>
        <span class="score-value">${fateScoreDetails.seasonScore}/30</span>
    </div>
    <div class="score-item">
        <span class="score-label">五行平衡:</span>
        <div class="progress-container">
            <div class="progress-bar" style="width: ${(fateScoreDetails.balanceScore/25)*100}%"></div>
        </div>
        <span class="score-value">${fateScoreDetails.balanceScore}/25</span>
    </div>
    <div class="score-item">
        <span class="score-label">特殊格局:</span>
        <div class="progress-container">
            <div class="progress-bar" style="width: ${(fateScoreDetails.patternScore/20)*100}%"></div>
        </div>
        <span class="score-value">${fateScoreDetails.patternScore}/20</span>
    </div>
    <div class="score-item">
        <span class="score-label">十神配置:</span>
        <div class="progress-container">
            <div class="progress-bar" style="width: ${(fateScoreDetails.godsScore/15)*100}%"></div>
        </div>
        <span class="score-value">${fateScoreDetails.godsScore}/15</span>
    </div>
    <div class="score-item">
        <span class="score-label">天干地支组合:</span>
        <div class="progress-container">
            <div class="progress-bar" style="width: ${(fateScoreDetails.combinationScore/10)*100}%"></div>
        </div>
        <span class="score-value">${fateScoreDetails.combinationScore}/10</span>
    </div>
</div>
`;
        } catch (error) {
            console.error('获取命格分析失败:', error);
            return getDefaultFateAnalysis(score);
        }
    }

    // 默认命格分析内容
    function getDefaultFateAnalysis(score) {
        return `
### 命格特征
${getFateCharacteristics(score)}

### 优势分析
${getFateStrengths(score)}

### 发展建议
${getFateSuggestions(score)}
`;
    }

    // 获取命格特征 - 改进版
    function getFateCharacteristics(score) {
        if (score >= 85) return `
- <strong>天生福气深厚</strong>：您天生具备良好的运势基础，人生道路相对顺畅
- <strong>贵人运强</strong>：容易得到长辈、上司或贵人的提携和帮助
- <strong>机遇多</strong>：人生关键节点常有好的机会出现
- <strong>抗风险能力强</strong>：即使遇到困难也能较快化解
`;

        if (score >= 70) return `
- <strong>聪明才智出众</strong>：您具备较强的能力和智慧
- <strong>适应能力强</strong>：能快速适应环境变化
- <strong>人际关系好</strong>：与人相处融洽，容易获得支持
- <strong>事业发展顺利</strong>：职业发展道路较为平坦
`;

        if (score >= 50) return `
- <strong>性格稳重</strong>：您做事踏实可靠
- <strong>脚踏实地</strong>：能够通过努力获得稳定发展
- <strong>中等运势</strong>：需要适当努力才能获得成功
`;

        if (score >= 30) return `
- <strong>意志坚定</strong>：您有较强的毅力和决心
- <strong>吃苦耐劳</strong>：能够承受较大压力
- <strong>需要更多努力</strong>：成功需要付出比常人更多的努力
`;

        return `
- <strong>人生挑战多</strong>：您的人生道路可能较为坎坷
- <strong>需要特别努力</strong>：必须付出极大努力才能获得成功
- <strong>磨练意志</strong>：这些经历会让您变得更强
`;
    }

    // 获取命格优势 - 改进版
    function getFateStrengths(score) {
        if (score >= 85) return `
- <strong>先天优势明显</strong>：您天生具备很多有利条件
- <strong>事半功倍</strong>：同样的努力能获得更大回报
- <strong>危机化解能力强</strong>：遇到困难容易找到解决办法
`;

        if (score >= 70) return `
- <strong>学习能力强</strong>：您掌握新知识新技能的速度较快
- <strong>应变能力好</strong>：面对变化能快速调整适应
- <strong>人脉资源丰富</strong>：容易获得他人的支持和帮助
`;

        if (score >= 50) return `
- <strong>稳定性强</strong>：您的生活和工作较为稳定
- <strong>持续发展能力</strong>：能够通过积累获得长期进步
- <strong>抗压能力中等</strong>：能够承受一定程度的压力
`;

        if (score >= 30) return `
- <strong>逆境成长型</strong>：困难环境反而能激发您的潜力
- <strong>坚韧不拔</strong>：具备坚持到底的毅力
- <strong>经验丰富</strong>：各种经历都是宝贵财富
`;

        return `
- <strong>磨练意志</strong>：困难环境能锻炼您的意志力
- <strong>独特视角</strong>：特殊经历让您看问题更深刻
- <strong>成长空间大</strong>：每一点进步都是实实在在的
`;
    }

    // 获取命格发展建议 - 实用版
    function getPracticalFateSuggestions(score) {
        if (score >= 85) return `
1. <strong>善用优势</strong>：充分发挥您的先天优势，但不要骄傲自满
2. <strong>帮助他人</strong>：多帮助他人可以积累更多福报
3. <strong>长远规划</strong>：制定10年以上的长期发展规划
4. <strong>风险管理</strong>：虽然运势好，但仍需做好风险防范
`;

        if (score >= 70) return `
1. <strong>把握机遇</strong>：遇到好机会要果断抓住
2. <strong>提升专业</strong>：在某个领域深耕成为专家
3. <strong>建立人脉</strong>：维护好重要人际关系
4. <strong>适度冒险</strong>：可以尝试一些有把握的创新
`;

        if (score >= 50) return `
1. <strong>专注领域</strong>：选择一个领域专注发展
2. <strong>稳扎稳打</strong>：采取稳健的发展策略
3. <strong>持续学习</strong>：不断提升自身能力
4. <strong>避免冒险</strong>：不要参与高风险活动
`;

        if (score >= 30) return `
1. <strong>明确目标</strong>：设定清晰可行的目标
2. <strong>分步实施</strong>：将大目标分解为小步骤
3. <strong>寻求指导</strong>：向有经验的人请教
4. <strong>保持耐心</strong>：成功需要更长时间
`;

        return `
1. <strong>提升技能</strong>：掌握一门实用专业技能
2. <strong>谨慎决策</strong>：重大决定前多方咨询
3. <strong>健康第一</strong>：特别注意身体健康
4. <strong>量力而行</strong>：不要勉强做超出能力的事
`;
    }

    // 获取财富等级分析内容 - 改进版
    async function getWealthAnalysisContent() {
        const score = calculateWealthScore(currentPillars);
        const levelInfo = getWealthLevel(score);
        
        try {
            // 获取API详细分析
            const analysis = await getBaziAnalysis('wealth-level', birthData);
            
            return `
## 1. 财富等级评估
**${levelInfo.name}**

您的财富综合评分为 ${score} 分（满分100分），属于${levelInfo.class.replace('-', ' ')}级别。

## 2. 财富特征分析
${analysis || getDefaultWealthAnalysis(score)}

## 3. 实用建议
${getPracticalWealthSuggestions(score)}

## 4. 评分细节
<div class="score-details">
    <div class="score-item">
        <span class="score-label">财星数量质量:</span>
        <div class="progress-container">
            <div class="progress-bar" style="width: ${(wealthScoreDetails.wealthStarScore/30)*100}%"></div>
        </div>
        <span class="score-value">${wealthScoreDetails.wealthStarScore}/30</span>
    </div>
    <div class="score-item">
        <span class="score-label">财星得地:</span>
        <div class="progress-container">
            <div class="progress-bar" style="width: ${(wealthScoreDetails.wealthPositionScore/25)*100}%"></div>
        </div>
        <span class="score-value">${wealthScoreDetails.wealthPositionScore}/25</span>
    </div>
    <div class="score-item">
        <span class="score-label">财星受克:</span>
        <div class="progress-container">
            <div class="progress-bar" style="width: ${(wealthScoreDetails.wealthDamageScore/20)*100}%"></div>
        </div>
        <span class="score-value">${wealthScoreDetails.wealthDamageScore}/20</span>
    </div>
    <div class="score-item">
        <span class="score-label">食伤生财:</span>
        <div class="progress-container">
            <div class="progress-bar" style="width: ${(wealthScoreDetails.wealthSupportScore/15)*100}%"></div>
        </div>
        <span class="score-value">${wealthScoreDetails.wealthSupportScore}/15</span>
    </div>
    <div class="score-item">
        <span class="score-label">大运走势:</span>
        <div class="progress-container">
            <div class="progress-bar" style="width: ${(wealthScoreDetails.fortuneScore/10)*100}%"></div>
        </div>
        <span class="score-value">${wealthScoreDetails.fortuneScore}/10</span>
    </div>
</div>
`;
        } catch (error) {
            console.error('获取财富分析失败:', error);
            return getDefaultWealthAnalysis(score);
        }
    }

    // 默认财富分析内容
    function getDefaultWealthAnalysis(score) {
        return `
### 财富特征
${getWealthCharacteristics(score)}

### 优势分析
${getWealthStrengths(score)}

### 发展建议
${getWealthSuggestions(score)}
`;
    }

    // 获取财富特征 - 改进版
    function getWealthCharacteristics(score) {
        if (score >= 90) return `
- <strong>天生财运亨通</strong>：您天生具备良好的财富运势
- <strong>正偏财俱佳</strong>：正规收入和投资理财都能获得不错收益
- <strong>投资眼光独到</strong>：您对投资机会有敏锐的嗅觉
- <strong>财富积累迅速</strong>：资产增长速度比一般人快
`;

        if (score >= 80) return `
- <strong>财运旺盛</strong>：您的财富运势整体很好
- <strong>正财稳定</strong>：工作收入来源稳固
- <strong>偏财机会多</strong>：常有额外的收入机会
- <strong>丰厚回报</strong>：努力能获得相应回报
`;

        if (score >= 60) return `
- <strong>财运平稳</strong>：您的财富运势较为稳定
- <strong>正财为主</strong>：主要依靠工作收入
- <strong>合理规划</strong>：需要妥善管理才能积累财富
- <strong>适度投资</strong>：可以尝试一些稳健投资
`;

        if (score >= 40) return `
- <strong>财运起伏</strong>：您的财富运势有一定波动
- <strong>专业技能</strong>：需要依靠专业能力获取财富
- <strong>谨慎投资</strong>：投资前需要充分评估
- <strong>储蓄重要</strong>：平时要注意积蓄
`;

        return `
- <strong>财运较弱</strong>：您需要特别努力才能获得财富
- <strong>稳扎稳打</strong>：适合采取稳健的财富策略
- <strong>节俭为本</strong>：控制开支非常重要
- <strong>长期积累</strong>：财富需要慢慢积累
`;
    }

    // 获取财富优势 - 改进版
    function getWealthStrengths(score) {
        if (score >= 90) return `
- <strong>财源广进</strong>：您有多种收入渠道
- <strong>投资精准</strong>：您的投资决策通常很准确
- <strong>把握机遇</strong>：能抓住重要的财富机会
- <strong>增长快速</strong>：财富增长速度较快
`;

        if (score >= 80) return `
- <strong>赚钱能力强</strong>：您有较强的创收能力
- <strong>理财有道</strong>：懂得如何管理财富
- <strong>多元收入</strong>：收入来源较为多样化
- <strong>稳健增长</strong>：财富能够持续增长
`;

        if (score >= 60) return `
- <strong>稳定收入</strong>：您有可靠的收入来源
- <strong>专业价值</strong>：可以通过专业技能获得报酬
- <strong>理性消费</strong>：通常能够合理控制开支
- <strong>逐步积累</strong>：财富能够稳步增加
`;

        if (score >= 40) return `
- <strong>节俭务实</strong>：您懂得量入为出
- <strong>长期视角</strong>：能够为长远打算
- <strong>抗风险</strong>：面对经济波动有一定抵抗力
- <strong>经验积累</strong>：理财经验会越来越丰富
`;

        return `
- <strong>吃苦耐劳</strong>：您能够承受较大的工作压力
- <strong>逆境生存</strong>：在困难条件下也能找到出路
- <strong>珍惜资源</strong>：懂得合理利用有限资源
- <strong>成长空间</strong>：财富管理能力提升空间大
`;
    }

    // 获取财富建议 - 实用版
    function getPracticalWealthSuggestions(score) {
        if (score >= 90) return `
1. <strong>多元化投资</strong>：将资金分散到不同领域
2. <strong>善用财富</strong>：用财富创造更多价值
3. <strong>回馈社会</strong>：适当参与慈善事业
4. <strong>避免投机</strong>：不要参与高风险投机
`;

        if (score >= 80) return `
1. <strong>把握机会</strong>：遇到好项目要敢于投入
2. <strong>理财规划</strong>：制定3-5年的理财计划
3. <strong>控制消费</strong>：避免不必要的奢侈消费
4. <strong>稳健扩张</strong>：在可控范围内扩大投资
`;

        if (score >= 60) return `
1. <strong>专注主业</strong>：在专业领域深耕发展
2. <strong>适度投资</strong>：选择低风险投资方式
3. <strong>应急基金</strong>：储备6-12个月生活费
4. <strong>提升技能</strong>：不断增值自身能力
`;

        if (score >= 40) return `
1. <strong>专业技能</strong>：掌握一门高收入技能
2. <strong>控制开支</strong>：记账并分析消费习惯
3. <strong>保守投资</strong>：只参与保本型理财
4. <strong>兼职增收</strong>：考虑发展副业收入
`;

        return `
1. <strong>稳定收入</strong>：优先寻找稳定工作
2. <strong>学习理财</strong>：掌握基本理财知识
3. <strong>避免负债</strong>：尽量不要借贷消费
4. <strong>节俭生活</strong>：根据收入规划支出
`;
    }

    // 保存个人资料
    function saveProfile(birthData) {
        const profiles = JSON.parse(localStorage.getItem('baziProfiles') || '[]');
        const existingIndex = profiles.findIndex(function(p) {
            return p.date === birthData.date && 
                   p.time === birthData.time && 
                   p.gender === birthData.gender;
        });
        
        if (existingIndex >= 0) {
            profiles[existingIndex] = birthData;
        } else {
            profiles.push(birthData);
        }
        
        if (profiles.length > 8) {
            profiles.shift();
        }
        
        localStorage.setItem('baziProfiles', JSON.stringify(profiles));
        loadSavedProfiles();
    }

    // 重置所有内容
    function resetAllContent() {
        fateScoreValue = 0;
        wealthScoreValue = 0;
        
        // 重置八字显示
        yearStem.textContent = '';
        yearBranch.textContent = '';
        yearHiddenStems.textContent = '';
        monthStem.textContent = '';
        monthBranch.textContent = '';
        monthHiddenStems.textContent = '';
        dayStem.textContent = '';
        dayBranch.textContent = '';
        dayHiddenStems.textContent = '';
        hourStem.textContent = '';
        hourBranch.textContent = '';
        hourHiddenStems.textContent = '';
        
        // 重置分数显示
        fateLevel.textContent = '';
        fateScore.textContent = '';
        fateDetails.innerHTML = '';
        wealthLevel.textContent = '';
        wealthScore.textContent = '';
        wealthDetails.innerHTML = '';
        personalityTraits.textContent = '命主性格：';
        
        // 重置内容区域
        document.querySelectorAll('.section-content').forEach(function(el) {
            el.innerHTML = '';
            el.classList.remove('active');
        });
        
        // 重置按钮状态
        document.querySelectorAll('.load-btn').forEach(function(btn) {
            const originalText = btn.getAttribute('data-original-text') || btn.textContent.trim();
            btn.innerHTML = `<span>${originalText}</span><i class="fas fa-chevron-down toggle-icon"></i>`;
            btn.classList.remove('active');
            btn.disabled = false;
        });
        
        // 重置按钮容器
        document.querySelectorAll('.load-btn-container').forEach(function(container) {
            container.classList.remove('active');
        });
        
        // 重置菜单标签
        document.querySelectorAll('.menu-tab').forEach(function(tab) {
            tab.classList.remove('active');
        });
        document.querySelectorAll('.tab-content').forEach(function(content) {
            content.classList.remove('active');
        });
        document.querySelector('.menu-tab[data-tab="fortune"]').classList.add('active');
        document.getElementById('fortune-tab').classList.add('active');
        
        // 重置全局变量
        loadedSections = {};
        currentPillars = {};
        fateScoreDetails = {};
        wealthScoreDetails = {};
        
        // 重置问答区域
        baziQuestionInput.value = '';
        baziQaResponse.innerHTML = '';
        baziQaResponse.style.display = 'none';
        baziQaLoading.style.display = 'none';
        
        // 重置起运时间和从强从弱显示
        luckStartingTime.textContent = '';
        strengthType.textContent = '';
    }

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
        button.innerHTML = `<span style="display: flex; align-items: center; justify-content: center; width: 100%;"><span class="loading"></span>  量子分析中...</span><i class="fas fa-chevron-down toggle-icon"></i>`;
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
    
    // 解析Markdown内容
    const html = marked.parse(result);
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // 为表格添加样式类
    tempDiv.querySelectorAll('table').forEach(function(table) {
        table.classList.add('markdown-table');
    });
    
    // 创建打印按钮容器
    const printContainer = document.createElement('div');
    printContainer.className = 'print-btn-container';
    
    // 创建打印按钮
    const printBtn = document.createElement('button');
    printBtn.className = 'print-btn';
    printBtn.innerHTML = '<i class="fas fa-print"></i> 打印此部分';
    
    // 定义英文到中文的标题映射
    const sectionTitles = {
        'basic': '基础信息',
        'fate-level': '命格等级',
        'wealth-level': '财富等级',
        'strength': '身强身弱',
        'career': '事业分析',
        'wealth': '财富分析',
        'elements': '五行分析',
        'personality': '性格分析',
        'children': '子女运势',
        'marriage': '婚姻分析',
        'health': '健康分析',
        'annual-fortune': '年度运势',
        'daily-fortune': '每日运势',
        'milestones': '人生节点',
        'decade-fortune': '十年大运',
        'monthly-fortune': '每月运势'
    };
    
    // 获取中文标题，如果没有匹配则使用原始section
    const chineseTitle = sectionTitles[section] || section;
    
    // 添加打印功能
    printBtn.onclick = function() {
        const printWindow = window.open('', '_blank');
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>八字分析打印 - ${chineseTitle}</title>
                <style>
                    body { 
                        font-family: "Microsoft YaHei", Arial, sans-serif; 
                        line-height: 1.6; 
                        padding: 20px; 
                        color: #333;
                    }
                    h1, h2, h3, h4 { 
                        color: #2c3e50;
                        margin-top: 20px;
                    }
                    h1 { 
                        font-size: 24px; 
                        border-bottom: 1px solid #eee; 
                        padding-bottom: 10px;
                        text-align: center;
                    }
                    h2 { font-size: 20px; }
                    h3 { font-size: 18px; }
                    table { 
                        border-collapse: collapse; 
                        width: 100%; 
                        margin: 15px 0; 
                        font-size: 14px;
                    }
                    th, td { 
                        border: 1px solid #ddd; 
                        padding: 8px 12px; 
                        text-align: left; 
                    }
                    th { 
                        background-color: #f2f2f2; 
                        font-weight: bold;
                    }
                    .rating { 
                        color: #e67e22; 
                        font-weight: bold; 
                        letter-spacing: 2px;
                    }
                    .print-header {
                        text-align: center;
                        margin-bottom: 20px;
                        padding-bottom: 10px;
                        border-bottom: 1px solid #eee;
                    }
                    .print-footer {
                        text-align: center;
                        margin-top: 30px;
                        padding-top: 10px;
                        border-top: 1px solid #eee;
                        font-size: 12px;
                        color: #7f8c8d;
                    }
                    @media print {
                        body { padding: 0 10px; }
                        .no-print { display: none; }
                        @page { margin: 1cm; }
                    }
                </style>
            </head>
            <body>
                <div class="print-header">
                    <h1>八字分析报告 - ${chineseTitle}</h1>
                    <p>生成时间: ${new Date().toLocaleString('zh-CN')}</p>
                </div>
                
                <div>${tempDiv.innerHTML}</div>
                
                <div class="print-footer">
                    <p>本报告由机缘命理系统生成</p>
                </div>
                
                <div class="no-print" style="margin-top: 30px; text-align: center;">
                    <button onclick="window.print()" style="
                        padding: 10px 20px; 
                        background: #3498db; 
                        color: white; 
                        border: none; 
                        border-radius: 4px; 
                        cursor: pointer;
                        font-size: 16px;
                        margin-right: 10px;
                    ">
                        <i class="fas fa-print"></i> 打印报告
                    </button>
                    <button onclick="window.close()" style="
                        padding: 10px 20px; 
                        background: #e74c3c; 
                        color: white; 
                        border: none; 
                        border-radius: 4px; 
                        cursor: pointer;
                        font-size: 16px;
                    ">
                        <i class="fas fa-times"></i> 关闭窗口
                    </button>
                </div>
                
                <script>
                    // 添加Font Awesome图标库
                    const fa = document.createElement('link');
                    fa.rel = 'stylesheet';
                    fa.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css';
                    document.head.appendChild(fa);
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };
    
    // 将打印按钮添加到容器
    printContainer.appendChild(printBtn);
    
    // 清空内容元素并添加新内容和打印按钮
    contentElement.innerHTML = '';
    contentElement.appendChild(tempDiv);
    contentElement.appendChild(printContainer);
    
    // 添加打印按钮样式
    if (!document.querySelector('style.print-btn-style')) {
        const style = document.createElement('style');
        style.className = 'print-btn-style';
        style.textContent = `
            .print-btn-container {
                margin-top: 20px;
                text-align: right;
                padding: 15px 0;
                border-top: 1px solid #eee;
            }
            
            .print-btn {
                background-color: var(--primary-color);
                color: white;
                border: none;
                padding: 8px 15px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                transition: all 0.3s;
                display: inline-flex;
                align-items: center;
                gap: 5px;
            }
            
            .print-btn:hover {
                background-color: var(--primary-dark-color);
                transform: translateY(-1px);
                box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            }
            
            .print-btn:active {
                transform: translateY(0);
            }
        `;
        document.head.appendChild(style);
    }
}
    // 计算八字
    async function calculateBazi(e) {
    if (e) {
        e.preventDefault();
    }
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
            const loadingOverlay = document.createElement('div');
            loadingOverlay.className = 'loading-overlay';
            loadingOverlay.innerHTML = `
                <div class="loading"></div>
                <p>量子计算引擎启动中...</p>
            `;
            document.body.appendChild(loadingOverlay);
            
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
            
            // 显示起运时间和从强从弱信息
            if (baziInfo.luckStartingTime) {
                luckStartingTime.textContent = baziInfo.luckStartingTime;
            }
            if (baziInfo.strengthType) {
                strengthType.textContent = baziInfo.strengthType;
            }
            
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
    }

    // 生成八字哈希键
    function generateBaziHashKey(birthData) {
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
        
        return `${bazi.getYearGan()}${bazi.getYearZhi()}年` +
               `${bazi.getMonthGan()}${bazi.getMonthZhi()}月` +
               `${bazi.getDayGan()}${bazi.getDayZhi()}日` +
               `${bazi.getTimeGan()}${bazi.getTimeZhi()}时` +
               `:${birthData.gender === 'male' ? '男' : '女'}`;
    }

    // 校验排盘结果
    function validateBaziResult(localResult, apiResult) {
        const keyFields = ['yearStem', 'yearBranch', 'monthStem', 'monthBranch', 
                         'dayStem', 'dayBranch', 'hourStem', 'hourBranch'];
        
        for (const field of keyFields) {
            if (localResult[field] !== apiResult[field]) {
                console.warn(`排盘不一致: ${field} 本地=${localResult[field]}, API=${apiResult[field]}`);
                return false;
            }
        }
        
        return true;
    }

    // 从API结果中提取关键字段
    function extractKeyFieldsFromApiResponse(apiResponse) {
        const yearMatch = apiResponse.match(/年柱\[([^\]]+)\]/);
        const monthMatch = apiResponse.match(/月柱\[([^\]]+)\]/);
        const dayMatch = apiResponse.match(/日柱\[([^\]]+)\]/);
        const hourMatch = apiResponse.match(/时柱\[([^\]]+)\]/);
        
        const yearHiddenMatch = apiResponse.match(/年支\[([^\]]+)\]/);
        const monthHiddenMatch = apiResponse.match(/月支\[([^\]]+)\]/);
        const dayHiddenMatch = apiResponse.match(/日支\[([^\]]+)\]/);
        const hourHiddenMatch = apiResponse.match(/时支\[([^\]]+)\]/);
        
        const elementsMatch = apiResponse.match(/五行能量\[([^\]]+)\]/);
        const personalityMatch = apiResponse.match(/命主性格\[([^\]]+)\]/);
        
        if (!yearMatch || !monthMatch || !dayMatch || !hourMatch) {
            console.error('无法从API响应中提取关键字段');
            return null;
        }
        
        return {
            yearStem: yearMatch[1].charAt(0),
            yearBranch: yearMatch[1].charAt(1),
            monthStem: monthMatch[1].charAt(0),
            monthBranch: monthMatch[1].charAt(1),
            dayStem: dayMatch[1].charAt(0),
            dayBranch: dayMatch[1].charAt(1),
            hourStem: hourMatch[1].charAt(0),
            hourBranch: hourMatch[1].charAt(1),
            yearHiddenStems: yearHiddenMatch ? yearHiddenMatch[1] : '',
            monthHiddenStems: monthHiddenMatch ? monthHiddenMatch[1] : '',
            dayHiddenStems: dayHiddenMatch ? dayHiddenMatch[1] : '',
            hourHiddenStems: hourHiddenMatch ? hourHiddenMatch[1] : '',
            elements: elementsMatch ? JSON.parse(elementsMatch[1]) : [0, 0, 0, 0, 0],
            personality: personalityMatch ? personalityMatch[1] : ''
        };
    }

    // 初始化元素图表 - 更新版，包含五行合化、刑冲和藏干能量计算
    function initElementChart(baziInfo) {
        // 计算本命局五行能量（包括藏干）
        const natalElements = calculateNatalElements(baziInfo);
        
        // 计算大运五行能量
        const luckElements = calculateLuckElements(natalElements);
        
        // 计算流年五行能量
        const yearElements = calculateYearElements(natalElements);
        
        // 五行对应的颜色
        const elementColors = [
            'rgba(0, 200, 83, 0.7)',   // 木 - 绿色
            'rgba(244, 67, 54, 0.7)',  // 火 - 红色
            'rgba(255, 152, 0, 0.7)',  // 土 - 黄色
            'rgba(158, 158, 158, 0.7)', // 金 - 灰色
            'rgba(33, 150, 243, 0.7)'   // 水 - 蓝色
        ];

        const elementData = {
            labels: ['木', '火', '土', '金', '水'],
            datasets: [
                {
                    label: '本命局',
                    data: natalElements,
                    backgroundColor: elementColors,
                    borderColor: elementColors.map(color => color.replace('0.7', '1')),
                    borderWidth: 1
                },
                {
                    label: '大运',
                    data: luckElements,
                    backgroundColor: elementColors,
                    borderColor: elementColors.map(color => color.replace('0.7', '1')),
                    borderWidth: 1
                },
                {
                    label: '流年',
                    data: yearElements,
                    backgroundColor: elementColors,
                    borderColor: elementColors.map(color => color.replace('0.7', '1')),
                    borderWidth: 1
                }
            ]
        };

        if (elementChart) {
            elementChart.destroy();
        }

        // Ensure the chart container has proper styling
        const chartContainer = document.getElementById('element-chart').parentNode;
        chartContainer.style.position = 'relative';
        chartContainer.style.height = '400px';

        elementChart = new Chart(elementChartCtx, {
            type: 'bar',
            data: elementData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 20
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.dataset.label || '';
                                return `${label}: ${context.raw}`;
                            }
                        }
                    }
                }
            }
        });
        
        // 添加图表说明
        elementChartDescription.innerHTML = `
            <div class="chart-explanation">
                <h4>五行能量分布说明</h4>
                <ul>
                    <li><strong>本命局</strong>: 包含天干、地支和藏干的五行能量总和，并考虑了合化、刑冲的影响</li>
                    <li><strong>大运</strong>: 基于本命局五行能量的大运变化趋势</li>
                    <li><strong>流年</strong>: 当前流年对五行能量的影响</li>
                </ul>
                <p>五行平衡是理想状态，过旺或过弱都可能带来相应问题。图表可直观显示命主在不同时期的五行能量变化。</p>
            </div>
        `;
    }

    // 计算本命局五行能量（包括天干、地支、藏干，并考虑合化刑冲）
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
        
        // 藏干五行映射（与天干相同）
        const hiddenStemsElements = stemElements;
        
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
                    if (hiddenStemsElements[char] !== undefined) {
                        elements[hiddenStemsElements[char]] += 1;
                    }
                }
            }
        });
        
        // 4. 考虑合化对五行能量的影响
        const combinedElements = applyCombinationEffects(elements, stems, branches);
        
        // 5. 考虑刑冲对五行能量的影响
        const finalElements = applyConflictEffects(combinedElements, branches);
        
        return finalElements;
    }

    // 应用合化对五行能量的影响
    function applyCombinationEffects(elements, stems, branches, dayStem) {
    // 参数说明：
    // elements: 五行能量数组 [木,火,土,金,水]
    // stems: 天干数组 [年干,月干,日干,时干]
    // branches: 地支数组 [年支,月支,日支,时支]
    // dayStem: 日干（新增参数）

    const newElements = [...elements];
    const elementIndex = getElementIndex(dayStem); // 获取日主五行索引
    
    // 1. 天干五合处理（不变）
    const heavenlyCombinations = {
        '甲己': 2, // 合化土
        '乙庚': 3, // 合化金
        '丙辛': 4, // 合化水
        '丁壬': 0, // 合化木
        '戊癸': 1  // 合化火
    };
        
        // 检查天干五合
        for (let i = 0; i < stems.length; i++) {
            for (let j = i + 1; j < stems.length; j++) {
                const pair1 = stems[i] + stems[j];
                const pair2 = stems[j] + stems[i];
                if (heavenlyCombinations[pair1] !== undefined || heavenlyCombinations[pair2] !== undefined) {
                    const elementIndex = heavenlyCombinations[pair1] || heavenlyCombinations[pair2];
                    newElements[elementIndex] += 2;
                    // 减少原有天干的五行能量
                    newElements[getElementIndex(stems[i])] -= 0.5;
                    newElements[getElementIndex(stems[j])] -= 0.5;
                }
            }
        }
        
        // 2. 地支六合处理（增强）
    const earthlyCombinations = {
        '子丑': { element: 2, affect: [4, -0.5] }, // 合化土，水元素-0.5
        '寅亥': { element: 0, affect: [0, 0] },    // 合化木，不影响
        '卯戌': { element: 1, affect: [0, -1] },   // 合化火，木元素-1（重要！）
        '辰酉': { element: 3, affect: [2, -0.5] }, // 合化金，土元素-0.5
        '巳申': { element: 4, affect: [1, -0.5, 3, -0.5] }, // 合化水，火金各-0.5
        '午未': { element: 2, affect: [1, -0.5] }  // 合化土，火元素-0.5
    };

    // 检查地支六合
    for (let i = 0; i < branches.length; i++) {
        for (let j = i + 1; j < branches.length; j++) {
            const pair1 = branches[i] + branches[j];
            const pair2 = branches[j] + branches[i];
            
            if (earthlyCombinations[pair1] || earthlyCombinations[pair2]) {
                const combo = earthlyCombinations[pair1] || earthlyCombinations[pair2];
                
                // 增加合化后的五行能量
                newElements[combo.element] += 1.5;
                
                // 减少原有地支的五行能量
                newElements[getElementIndex(branches[i])] -= 0.5;
                newElements[getElementIndex(branches[j])] -= 0.5;
                
                // 特别处理对日主的影响（新增部分）
                if (combo.affect) {
                    for (let k = 0; k < combo.affect.length; k += 2) {
                        const elemIdx = combo.affect[k];
                        const delta = combo.affect[k+1];
                        
                        // 如果影响的五行是日主的根气
                        if (elemIdx === elementIndex) {
                            newElements[elemIdx] += delta;
                            console.log(`地支${pair1}合化影响：日主${dayStem}的根气${getElementName(elemIdx)}变化${delta}`);
                        }
                    }
                }
            }
        }
    }

    // 3. 地支三合局处理（增强）
    const tripleCombinations = {
        '申子辰': { 
            element: 4, // 合化水
            affect: [[3, -0.5], [2, -0.5]] // 金、土元素各-0.5
        },
        '亥卯未': {
            element: 0, // 合化木
            affect: [[4, -0.5], [2, -0.5]] // 水、土元素各-0.5
        },
        '寅午戌': {
            element: 1, // 合化火
            affect: [[0, -1], [2, -0.5]]  // 木元素-1（重要！），土元素-0.5
        },
        '巳酉丑': {
            element: 3, // 合化金
            affect: [[1, -0.5], [2, -0.5]] // 火、土元素各-0.5
        }
    };

    // 检查三合局（包括半合）
    const branchStr = branches.join('');
    for (const combo in tripleCombinations) {
        let count = 0;
        for (const char of combo) {
            if (branchStr.includes(char)) count++;
        }
        
        if (count >= 2) { // 半合也算
            const info = tripleCombinations[combo];
            const score = count === 3 ? 3 : 1.5; // 全合3分，半合1.5分
            
            // 增加合化后的五行能量
            newElements[info.element] += score;
            
            // 处理对日主的影响（新增部分）
            if (info.affect) {
                info.affect.forEach(([elemIdx, delta]) => {
                    // 如果影响的五行是日主的根气
                    if (elemIdx === elementIndex) {
                        newElements[elemIdx] += delta;
                        console.log(`三合${combo}影响：日主${dayStem}的根气${getElementName(elemIdx)}变化${delta}`);
                    }
                });
            }
        }
    }

    return newElements.map(val => Math.max(0, val)); // 确保不出现负数
}

// 辅助函数：获取五行名称
function getElementName(index) {
    return ['木','火','土','金','水'][index];
}


    // 应用刑冲对五行能量的影响
    function applyConflictEffects(elements, branches) {
        const newElements = [...elements];
        
        // 1. 地支六冲
        const conflicts = {
            '子午': 4, // 子水冲午火，水+0.5，火-1
            '丑未': 2, // 丑未相冲，土-0.5
            '寅申': 0, // 寅木冲申金，木+0.5，金-1
            '卯酉': 0, // 卯木冲酉金，木+0.5，金-1
            '辰戌': 2, // 辰戌相冲，土-0.5
            '巳亥': 1  // 巳火冲亥水，火+0.5，水-1
        };
        
        // 检查六冲
        for (let i = 0; i < branches.length; i++) {
            for (let j = i + 1; j < branches.length; j++) {
                const pair1 = branches[i] + branches[j];
                const pair2 = branches[j] + branches[i];
                if (conflicts[pair1] !== undefined || conflicts[pair2] !== undefined) {
                    const elementIndex = conflicts[pair1] || conflicts[pair2];
                    
                    // 根据不同冲的情况调整
                    if (pair1 === '子午' || pair1 === '午子') {
                        newElements[4] += 0.5; // 水+
                        newElements[1] -= 1;    // 火-
                    } else if (pair1 === '寅申' || pair1 === '申寅') {
                        newElements[0] += 0.5;  // 木+
                        newElements[3] -= 1;    // 金-
                    } else if (pair1 === '卯酉' || pair1 === '酉卯') {
                        newElements[0] += 0.5;  // 木+
                        newElements[3] -= 1;    // 金-
                    } else if (pair1 === '巳亥' || pair1 === '亥巳') {
                        newElements[1] += 0.5;  // 火+
                        newElements[4] -= 1;    // 水-
                    } else {
                        // 土相冲
                        newElements[elementIndex] -= 0.5;
                    }
                }
            }
        }
        
        // 2. 地支相刑（简化处理）
        const punishments = {
            '寅巳申': [0, 1, 3], // 无恩之刑，影响木火金
            '丑戌未': [2],       // 持势之刑，影响土
            '子卯': [0, 4],      // 无礼之刑，影响木水
            '辰午酉亥': []       // 自刑，暂不处理
        };
        
        // 检查三刑
        const branchStr = branches.join('');
        if (branchStr.includes('寅') && branchStr.includes('巳') && branchStr.includes('申')) {
            newElements[0] -= 0.3; // 木-
            newElements[1] -= 0.3; // 火-
            newElements[3] -= 0.3; // 金-
        }
        if (branchStr.includes('丑') && branchStr.includes('戌') && branchStr.includes('未')) {
            newElements[2] -= 0.5; // 土-
        }
        if (branchStr.includes('子') && branchStr.includes('卯')) {
            newElements[0] -= 0.3; // 木-
            newElements[4] -= 0.3; // 水-
        }
        
        return newElements.map(val => Math.max(0, val)); // 确保不出现负数
    }

    // 获取五行索引
    function getElementIndex(char) {
        const elementMap = {
            '甲': 0, '乙': 0,  // 木
            '丙': 1, '丁': 1,  // 火
            '戊': 2, '己': 2,  // 土
            '庚': 3, '辛': 3,  // 金
            '壬': 4, '癸': 4,  // 水
            '寅': 0, '卯': 0,  // 木
            '午': 1, '巳': 1,  // 火
            '辰': 2, '戌': 2, '丑': 2, '未': 2,  // 土
            '申': 3, '酉': 3,  // 金
            '子': 4, '亥': 4   // 水
        };
        return elementMap[char] || 0;
    }

    // 计算大运五行能量（基于本命局）
    function calculateLuckElements(natalElements) {
        // 大运五行能量基于本命局，但有一定变化
        return natalElements.map((value, index) => {
            // 随机变化幅度在-1到+2之间
            const variation = Math.random() * 3 - 1;
            // 确保不会出现负值
            return Math.max(0, value + variation);
        });
    }

    // 计算流年五行能量（基于本命局）
    function calculateYearElements(natalElements) {
        // 流年五行能量基于本命局，但变化更大
        return natalElements.map((value, index) => {
            // 随机变化幅度在-2到+3之间
            const variation = Math.random() * 5 - 2;
            // 确保不会出现负值
            return Math.max(0, value + variation);
        });
    }

    // 初始化运势图表
    function initFortuneChart(result) {
        const fortuneContent = document.getElementById('decade-fortune-content');
        const canvas = document.createElement('canvas');
        canvas.className = 'fortune-chart';
        fortuneContent.appendChild(canvas);
        
        const fortunes = calculateDecadeFortune(
            Solar.fromYmdHms(
                parseInt(birthData.date.split('-')[0]),
                parseInt(birthData.date.split('-')[1]),
                parseInt(birthData.date.split('-')[2]),
                parseInt(birthData.time.split(':')[0]),
                parseInt(birthData.time.split(':')[1] || 0),
                0
            ).getLunar(), 
            birthData.gender
        ).fortunes;

        const chartData = {
            labels: fortunes.map(function(f) {
                return f.ageRange;
            }),
            datasets: [{
                label: '运势指数',
                data: fortunes.map(function(f) {
                    return f.score;
                }),
                fill: true,
                backgroundColor: 'rgba(0, 240, 255, 0.2)',
                borderColor: 'rgba(0, 240, 255, 1)',
                tension: 0.4
            }]
        };

        new Chart(canvas.getContext('2d'), {
            type: 'line',
            data: chartData,
            options: {
                responsive: true,
                scales: {
                    y: { max: 100 }
                }
            }
        });
    }

    // 更新农历日历
    function updateLunarCalendar() {
    // 使用 currentDate（2025年）
        const solar = Solar.fromDate(currentDate); // 修改这里，传入 currentDate
        const lunar = solar.getLunar();
        lunarDate.textContent = `${lunar.getYearInChinese()}年 ${lunar.getMonthInChinese()}月 ${lunar.getDayInChinese()}`;
        lunarGanzhi.textContent = `${lunar.getYearInGanZhi()}年 ${lunar.getMonthInGanZhi()}月 ${lunar.getDayInGanZhi()}日`;
        const yi = lunar.getDayYi();
        const ji = lunar.getDayJi();
        lunarYi.textContent = yi.join('、') || '无';
        lunarJi.textContent = ji.join('、') || '无';
    }

    // 验证日期有效性
    function isValidDate(year, month, day) {
        if (month < 1 || month > 12) {
            return false;
        }
        const date = new Date(year, month - 1, day);
        return date.getFullYear() === year && 
               date.getMonth() === month - 1 && 
               date.getDate() === day;
    }

    // 判断闰年
    function isLeapYear(year) {
        return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    }

    // 计算命运分数
    function calculateFateScore(pillars) {
        if (fateScoreValue === 0) {
            const seasonScore = calculateSeasonScore(pillars.day.charAt(0), pillars.month.charAt(1));
            const balanceScore = calculateBalanceScore(pillars);
            const patternScore = calculatePatternScore(pillars);
            const godsScore = calculateGodsScore(pillars);
            const combinationScore = calculateCombinationScore(pillars);
            const total = seasonScore + balanceScore + patternScore + godsScore + combinationScore;
            fateScoreDetails = {
                seasonScore,
                balanceScore,
                patternScore,
                godsScore,
                combinationScore,
                total
            };
            fateScoreValue = Math.round(total);
        }
        return fateScoreValue;
    }

    // 计算季节分数
    function calculateSeasonScore(dayStem, monthBranch) {
        const seasonMap = {
            '甲': ['寅', '卯', '辰'],
            '乙': ['寅', '卯', '辰'],
            '丙': ['巳', '午', '未'],
            '丁': ['巳', '午', '未'],
            '戊': ['辰', '戌', '丑', '未'],
            '己': ['辰', '戌', '丑', '未'],
            '庚': ['申', '酉', '戌'],
            '辛': ['申', '酉', '戌'],
            '壬': ['亥', '子', '丑'],
            '癸': ['亥', '子', '丑']
        };
        if (seasonMap[dayStem] && seasonMap[dayStem].includes(monthBranch)) {
            return 30;
        }
        return 15;
    }

    // 计算平衡分数
    function calculateBalanceScore(pillars) {
        const elements = {
            '木': 0,
            '火': 0,
            '土': 0,
            '金': 0,
            '水': 0
        };
        const stemElements = {
            '甲': '木', '乙': '木',
            '丙': '火', '丁': '火',
            '戊': '土', '己': '土',
            '庚': '金', '辛': '金',
            '壬': '水', '癸': '水'
        };
        const branchElements = {
            '寅': '木', '卯': '木',
            '午': '火', '巳': '火',
            '辰': '土', '戌': '土', '丑': '土', '未': '土',
            '申': '金', '酉': '金',
            '子': '水', '亥': '水'
        };
        elements[stemElements[pillars.year.charAt(0)]]++;
        elements[stemElements[pillars.month.charAt(0)]]++;
        elements[stemElements[pillars.day.charAt(0)]]++;
        elements[stemElements[pillars.hour.charAt(0)]]++;
        elements[branchElements[pillars.year.charAt(1)]]++;
        elements[branchElements[pillars.month.charAt(1)]]++;
        elements[branchElements[pillars.day.charAt(1)]]++;
        elements[branchElements[pillars.hour.charAt(1)]]++;
        const values = Object.values(elements);
        const max = Math.max(...values);
        const min = Math.min(...values);
        const balance = 25 - (max - min) * 2;
        return Math.max(0, balance);
    }

    // 计算格局分数
    function calculatePatternScore(pillars) {
        if (isCongGe(pillars)) {
            return 20;
        }
        if (isZhuanWangGe(pillars)) {
            return 15;
        }
        return 5;
    }

    // 判断从格
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
        if (isCongQiangGe(dayStem, stems, branches)) {
            return true;
        }
        if (isCongRuoGe(dayStem, stems, branches)) {
            return true;
        }
        return false;
    }

    // 判断从强格
    function isCongQiangGe(dayStem, stems, branches) {
        let count = 0;
        stems.forEach(function(stem) {
            if (isSameElement(stem, dayStem) || isGenerateElement(stem, dayStem)) {
                count++;
            }
        });
        branches.forEach(function(branch) {
            if (isSameElement(branch, dayStem) || isGenerateElement(branch, dayStem)) {
                count++;
            }
        });
        return count >= 6;
    }

    // 判断从弱格
    function isCongRuoGe(dayStem, stems, branches) {
        let count = 0;
        stems.forEach(function(stem) {
            if (isSameElement(stem, dayStem) || isGenerateElement(stem, dayStem)) {
                count++;
            }
        });
        branches.forEach(function(branch) {
            if (isSameElement(branch, dayStem) || isGenerateElement(branch, dayStem)) {
                count++;
            }
        });
        return count <= 1;
    }

    // 判断专旺格
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
        let otherCount = 0;
        stems.forEach(function(stem) {
            if (isSameElement(stem, dayStem)) {
                sameCount++;
            } else {
                otherCount++;
            }
        });
        branches.forEach(function(branch) {
            if (isSameElement(branch, dayStem)) {
                sameCount++;
            } else {
                otherCount++;
            }
        });
        return sameCount >= 5 && otherCount <= 2;
    }

    // 判断相同元素
    function isSameElement(a, b) {
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
        return elementMap[a] === elementMap[b];
    }

    // 判断生成元素
    function isGenerateElement(a, b) {
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
        const aElement = elementMap[a];
        const bElement = elementMap[b];
        const generateMap = {
            '木': '火',
            '火': '土',
            '土': '金',
            '金': '水',
            '水': '木'
        };
        return generateMap[aElement] === bElement;
    }

    // 计算十神分数
    function calculateGodsScore(pillars) {
        return 10;
    }

    // 计算组合分数
    function calculateCombinationScore(pillars) {
        const branches = [
            pillars.year.charAt(1),
            pillars.month.charAt(1),
            pillars.day.charAt(1),
            pillars.hour.charAt(1)
        ];
        if (hasSanHe(branches)) {
            return 8;
        }
        if (hasLiuHe(branches)) {
            return 5;
        }
        return 2;
    }

    // 在工具函数部分添加
function hasChong(branches, branch1, branch2) {
    const chongPairs = [['子','午'], ['卯','酉'], ['寅','申'], ['巳','亥'], ['辰','戌'], ['丑','未']];
    return chongPairs.some(pair => 
        (pair[0] === branch1 && pair[1] === branch2) || 
        (pair[0] === branch2 && pair[1] === branch1)
        && branches.includes(branch1) 
        && branches.includes(branch2)
    );
}

function hasHe(branches, branch1, branch2) {
    const hePairs = [['子','丑'], ['寅','亥'], ['卯','戌'], ['辰','酉'], ['巳','申'], ['午','未']];
    return hePairs.some(pair => 
        (pair[0] === branch1 && pair[1] === branch2) || 
        (pair[0] === branch2 && pair[1] === branch1)
        && branches.includes(branch1) 
        && branches.includes(branch2)
    );
}
    
    // 判断三合
    function hasSanHe(branches) {
        const sanHeGroups = [
            ['申', '子', '辰'],
            ['亥', '卯', '未'],
            ['寅', '午', '戌'],
            ['巳', '酉', '丑']
        ];
        for (const group of sanHeGroups) {
            let count = 0;
            for (const branch of branches) {
                if (group.includes(branch)) {
                    count++;
                }
            }
            if (count >= 2) {
                return true;
            }
        }
        return false;
    }

    // 判断六合
    function hasLiuHe(branches) {
        const liuHePairs = [
            ['子', '丑'],
            ['寅', '亥'],
            ['卯', '戌'],
            ['辰', '酉'],
            ['巳', '申'],
            ['午', '未']
        ];
        for (const pair of liuHePairs) {
            if (branches.includes(pair[0]) && branches.includes(pair[1])) {
                return true;
            }
        }
        return false;
    }

    // 计算财富分数
    function calculateWealthScore(pillars) {
        if (wealthScoreValue === 0) {
            const wealthStarScore = calculateWealthStarScore(pillars);
            const wealthPositionScore = calculateWealthPositionScore(pillars);
            const wealthDamageScore = calculateWealthDamageScore(pillars);
            const wealthSupportScore = calculateWealthSupportScore(pillars);
            const fortuneScore = calculateFortuneScore(pillars);
            const total = wealthStarScore + wealthPositionScore + (20 - wealthDamageScore) + wealthSupportScore + fortuneScore;
            wealthScoreDetails = {
                wealthStarScore,
                wealthPositionScore,
                wealthDamageScore: 20 - wealthDamageScore,
                wealthSupportScore,
                fortuneScore,
                total
            };
            wealthScoreValue = Math.round(total);
        }
        return wealthScoreValue;
    }

    // 计算财星分数
    function calculateWealthStarScore(pillars) {
        const dayStem = pillars.day.charAt(0);
        let wealthCount = 0;
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
        const wealthStars = getWealthStars(dayStem);
        stems.forEach(function(stem) {
            if (wealthStars.includes(stem)) {
                wealthCount++;
            }
        });
        branches.forEach(function(branch) {
            if (wealthStars.includes(branch)) {
                wealthCount++;
            }
        });
        if (wealthCount >= 3) return 30;
        if (wealthCount === 2) return 20;
        if (wealthCount === 1) return 10;
        return 5;
    }

    // 获取财星
    function getWealthStars(dayStem) {
        const wealthMap = {
            '甲': ['戊', '己', '辰', '戌', '丑', '未'],
            '乙': ['戊', '己', '辰', '戌', '丑', '未'],
            '丙': ['庚', '辛', '申', '酉'],
            '丁': ['庚', '辛', '申', '酉'],
            '戊': ['壬', '癸', '子', '亥'],
            '己': ['壬', '癸', '子', '亥'],
            '庚': ['甲', '乙', '寅', '卯'],
            '辛': ['甲', '乙', '寅', '卯'],
            '壬': ['丙', '丁', '午', '巳'],
            '癸': ['丙', '丁', '午', '巳']
        };
        return wealthMap[dayStem] || [];
    }

    // 计算财位分数
    function calculateWealthPositionScore(pillars) {
        const dayStem = pillars.day.charAt(0);
        const wealthStars = getWealthStars(dayStem);
        let score = 0;
        if (wealthStars.includes(pillars.month.charAt(1))) {
            score += 15;
        }
        if (wealthStars.includes(pillars.day.charAt(1))) {
            score += 5;
        }
        if (wealthStars.includes(pillars.hour.charAt(1))) {
            score += 5;
        }
        return Math.min(25, score);
    }

    // 计算财损分数
    function calculateWealthDamageScore(pillars) {
        const dayStem = pillars.day.charAt(0);
        const wealthStars = getWealthStars(dayStem);
        let damageCount = 0;
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
        const damageStars = getDamageStars(dayStem);
        stems.forEach(function(stem) {
            if (damageStars.includes(stem)) {
                damageCount++;
            }
        });
        branches.forEach(function(branch) {
            if (damageStars.includes(branch)) {
                damageCount++;
            }
        });
        return Math.min(20, damageCount * 5);
    }

    // 获取损星
    function getDamageStars(dayStem) {
        const damageMap = {
            '甲': ['甲', '乙', '寅', '卯'],
            '乙': ['甲', '乙', '寅', '卯'],
            '丙': ['丙', '丁', '午', '巳'],
            '丁': ['丙', '丁', '午', '巳'],
            '戊': ['戊', '己', '辰', '戌', '丑', '未'],
            '己': ['戊', '己', '辰', '戌', '丑', '未'],
            '庚': ['庚', '辛', '申', '酉'],
            '辛': ['庚', '辛', '申', '酉'],
            '壬': ['壬', '癸', '子', '亥'],
            '癸': ['壬', '癸', '子', '亥']
        };
        return damageMap[dayStem] || [];
    }

    // 计算财助分数
    function calculateWealthSupportScore(pillars) {
        const dayStem = pillars.day.charAt(0);
        const wealthStars = getWealthStars(dayStem);
        const generateStars = getGenerateStars(dayStem);
        let supportCount = 0;
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
        stems.forEach(function(stem) {
            if (generateStars.includes(stem)) {
                supportCount++;
            }
        });
        branches.forEach(function(branch) {
            if (generateStars.includes(branch)) {
                supportCount++;
            }
        });
        if (supportCount >= 2) return 15;
        if (supportCount === 1) return 8;
        return 3;
    }

    // 获取生星
    function getGenerateStars(dayStem) {
        const generateMap = {
            '甲': ['丙', '丁', '午', '巳'],
            '乙': ['丙', '丁', '午', '巳'],
            '丙': ['戊', '己', '辰', '戌', '丑', '未'],
            '丁': ['戊', '己', '辰', '戌', '丑', '未'],
            '戊': ['庚', '辛', '申', '酉'],
            '己': ['庚', '辛', '申', '酉'],
            '庚': ['壬', '癸', '子', '亥'],
            '辛': ['壬', '癸', '子', '亥'],
            '壬': ['甲', '乙', '寅', '卯'],
            '癸': ['甲', '乙', '寅', '卯']
        };
        return generateMap[dayStem] || [];
    }

    // 计算运势分数
    function calculateFortuneScore(pillars) {
        return 5;
    }

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
        
        // 计算起运时间
        const luckStartingTime = calculateLuckStartingTime(lunar, birthData.gender);
        
        // 新增：计算完整大运周期（包含起运年龄、每个大运的干支和年龄段）
        const decadeFortune = calculateDecadeFortune(lunar, birthData.gender); 
        
        // 新增：判断当前处于哪个大运（基于当前日期）
        const currentFortune = getCurrentFortune(decadeFortune, birthData.date);
        
        // 判断从强从弱
        const strengthType = determineStrengthType({
        yearStem: yearGan,
        yearBranch: yearZhi,
        monthStem: monthGan,
        monthBranch: monthZhi,
        dayStem: dayGan,
        dayBranch: dayZhi,
        hourStem: hourGan,
        hourBranch: hourZhi
    });
        
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
            gamblingFortune,
            luckStartingTime,  // 新增起运时间
            decadeFortune,    // 完整大运周期
            currentFortune,   // 当前大运信息
            strengthType       // 新增从强从弱
        };
    }

    // 修改后的calculateLuckStartingTime函数
function calculateLuckStartingTime(lunar, gender) {
    // 节气近似公历日期（误差±1天不影响年柱计算）
    const JIE_QI_DATES = {
        '立春': [2,4], '雨水': [2,19], '惊蛰': [3,6], '春分': [3,21],
        '清明': [4,5], '谷雨': [4,20], '立夏': [5,6], '小满': [5,21],
        '芒种': [6,6], '夏至': [6,21], '小暑': [7,7], '大暑': [7,23],
        '立秋': [8,8], '处暑': [8,23], '白露': [9,8], '秋分': [9,23],
        '寒露': [10,8], '霜降': [10,23], '立冬': [11,7], '小雪': [11,22],
        '大雪': [12,7], '冬至': [12,22], '小寒': [1,6], '大寒': [1,20]
    };

    // 获取最近的节气（向前/向后）
    function findNearestJieQi(birthDate, isForward) {
        const year = birthDate.getFullYear();
        let nearest = null;
        let minDiff = Infinity;

        Object.entries(JIE_QI_DATES).forEach(([name, [month, day]]) => {
            const jieQiDate = new Date(year, month - 1, day);
            const diff = jieQiDate - birthDate;

            if (isForward && diff > 0 && diff < minDiff) {
                minDiff = diff;
                nearest = jieQiDate;
            } else if (!isForward && diff < 0 && -diff < minDiff) {
                minDiff = -diff;
                nearest = jieQiDate;
            }
        });

        // 跨年处理
        if (!nearest) {
            const nextYear = isForward ? year + 1 : year - 1;
            const jieQiDate = new Date(nextYear, 
                isForward ? 0 : 11, // 立春(2月)或大雪(12月)
                isForward ? JIE_QI_DATES['立春'][1] : JIE_QI_DATES['大雪'][1]);
            return jieQiDate;
        }
        return nearest;
    }

    try {
        // 1. 确定出生日期
        const birthDate = new Date(
            lunar.getSolar().getYear(),
            lunar.getSolar().getMonth() - 1,
            lunar.getSolar().getDay(),
            lunar.getSolar().getHour(),
            lunar.getSolar().getMinute()
        );

        // 2. 判断顺排/逆排
        const yearGan = lunar.getYearGan();
        const isYangYear = ['甲', '丙', '戊', '庚', '壬'].includes(yearGan);
        const isForward = (isYangYear && gender === 'male') || 
                         (!isYangYear && gender === 'female');

        // 3. 找到关键节气
        const targetJieQi = findNearestJieQi(birthDate, isForward);
        
        // 4. 计算精确时间差（毫秒）
        const diffMs = Math.abs(targetJieQi - birthDate);
        const diffDays = diffMs / (1000 * 60 * 60 * 24);

        // 5. 转换为起运时间（3天=1年）
        const years = Math.floor(diffDays / 3);
        const remainingDays = diffDays % 3;
        const months = Math.floor(remainingDays * 4); // 1天≈4个月
        const days = Math.floor((remainingDays * 4 - months) * 30);
        const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        return `${years}岁${months}个月${days}天${Math.round(hours)}小时起运`;

    } catch (e) {
        console.error('计算异常:', e);
        return '无法计算起运时间';
    }
}
    
    function getCurrentFortune(decadeFortune, birthDate) {
    const birthYear = parseInt(birthDate.split('-')[0]);
    const currentAge = currentYear - birthYear; // 使用全局currentYear（2025）
    
    // 找到当前年龄对应的大运
    const currentFortune = decadeFortune.fortunes.find(f => {
        const [startAge, endAge] = f.ageRange.split('-').map(age => parseInt(age));
        return currentAge >= startAge && currentAge < endAge;
    });
    
    return currentFortune || decadeFortune.fortunes[0]; // 默认返回第一个大运
}
    // 判断从强从弱 - 修改后的函数
function determineStrengthType(pillars) {
    // ============== 工具函数 ============== //
    const getElementIndex = (char) => {
        const map = { 
            甲:0,乙:0, 丙:1,丁:1, 戊:2,己:2, 庚:3,辛:3, 壬:4,癸:4,
            寅:0,卯:0, 午:1,巳:1, 辰:2,戌:2,丑:2,未:2, 申:3,酉:3, 子:4,亥:4 
        };
        return map[char] ?? 0;
    };

    const getHiddenStems = (branch) => {
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
        
        // 天干力量计算
        stems.forEach(stem => {
            const elem = getElementIndex(stem);
            if (elem === dayElement) support += 1.5;
            else if (elem === (dayElement + 4) % 5) support += 1;   // 印
            else if (elem === (dayElement + 3) % 5) weaken += 1;    // 官杀
            else if (elem === (dayElement + 2) % 5) weaken += 1.5; // 财
            else if (elem === (dayElement + 1) % 5) weaken += 1.2; // 食伤
        });

        // 地支力量计算（含藏干）
        branches.forEach((branch, idx) => {
            const hiddenStems = getHiddenStems(branch);
            hiddenStems.split('').forEach((stem, i) => {
                const elem = getElementIndex(stem);
                const weight = [0.6, 0.3, 0.1][i] || 0;
                
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
            const hiddenStems = getHiddenStems(branch);
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
    // 使用 currentDate（2025年）
        const currentSolar = Solar.fromDate(currentDate); // 修改这里，传入 currentDate
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
        
        // 修改点击事件处理
        profileElement.querySelector('.profile-content').addEventListener('click', function(e) {
            e.preventDefault();
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
    
    // 自动触发计算
    setTimeout(() => {
        calculateBtn.click();
    }, 100);
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
    
    // 使用 currentYear（2025）、currentMonth、currentDay
    const currentDateStr = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-${currentDay.toString().padStart(2, '0')}`;
        
        let prompt = `请严格按照以下规则进行专业八字排盘，确保所有计算准确无误：
        
1.用详细清晰的语言表达
2.使用标准Markdown语法，可用表格方式呈现
3.进度条用下划线模拟可视化效果
4.箭头符号仅使用常规字符→
5.重点突出加粗显示关键信息
6.每个分析模块之间保留空行
7.实现专业排版效果

当前日期：${currentDateStr}
根据以下八字信息进行分析：
姓名：${data.name || '未提供'}
出生日期：${data.date}
出生时间：${data.time} 
性别：${data.gender === 'male' ? '男' : '女'}
八字：${localResult.yearStem}${localResult.yearBranch} ${localResult.monthStem}${localResult.monthBranch} ${localResult.dayStem}${localResult.dayBranch} ${localResult.hourStem}${localResult.hourBranch}
起运时间：${localResult.luckStartingTime}
身强身弱：${localResult.strengthType}
当前大运：${localResult.currentFortune.ganZhi} (${localResult.currentFortune.ageRange})
未来大运：${localResult.decadeFortune.fortunes.map(f => f.ganZhi).join('→')}
请直接分析此八字的起运时间和身强身弱，不要自行排盘或计算起运时间。
`;

        // 根据不同部分设置不同的提示词
        switch(section) {
            case 'fate-level':
                prompt += `详细分析命格等级：
1. 格局判定：
    - 成格条件满足度（百分比）
    - 特殊格局验证（从儿/化气等）
2. 三维评分：
    - 福力（先天根基）
    - 贵气（社会成就）
    - 寿元（健康基础）
3. 发展时机：
    - 黄金十年（具体年龄段）
    - 需谨慎年份
`;
                break;
            case 'wealth-level':
                prompt += `详细分析财富等级：
1. 财星结构：
   - 正偏财比例（柱中/大运）
   - 财库状态（开/闭）
2. 财富曲线：
   - 阶段评分（20-30岁：★★☆）
   - 最佳求财方式（技术/投资等）
3. 风险提示：
   - 破财年份（及规避方法）
   - 适合的理财工具
`;
                break;
            case 'strength':
                prompt += `分析命主的身强身弱情况：
1. 三维强度评估（百分制）：
    - 得令评估：
    - 得地评估：
    - 得势评估：
    => 综合强度：

2. 格局互动图谱：
    [合化] 
    [刑冲] 
    *特殊格局：

3. 能量平衡方案：
    - 喜用神：
    > 补益方式：
    - 忌凶神：
    > 规避建议：
`;
                break;
            case 'career':
                prompt += `详细分析适合行业情况：
1. 天赋匹配：
    - 十神对应的现代职业
    - 适合的职场角色
2. 发展路径：
    - 适合的行业（按五行分类）
    - 创业/打工优劣分析
3. 职场贵人：
    - 有利的同事属相
    - 需规避的合作对象
`;
                break;
            case 'wealth':
                prompt += `详细分析财富情况：
1. 财星结构分析：
    - 正偏财分布（天干透出/地支藏干）
    - 财库状态（辰戌丑未四库评估）
    - 财星与日主关系（耗/泄/克）
2. 财富时间轴：
    | 阶段   | 特征               | 最佳求财方式       | 风险提示          |
    |-------|--------------------|------------------|------------------|
    | 20-30 | 偏财旺（★★★☆）    | 技术变现          | 避免担保借贷      |
    | 31-45 | 正财主导（★★★★）  | 实业经营          | 注意合同纠纷      |
3. 开运锦囊：
    - 财位方位（流年九宫飞星定位）
    - 旺财饰品（如黄水晶/貔貅等）
    - 合作禁忌（忌与特定五行属性者合伙）
`;
                break;
            case 'elements':
                prompt += `分析八字五行强弱，燥湿和流通情况：
1. 能量雷达图（0-100评分）：
    - 木：（肝胆/神经系统）
    - 火：（心血管/内分泌）
    - 土：（脾胃/免疫系统）
    - 金：（呼吸系统）
    - 水：（肾脏/生殖系统）
2. 气候适应性：
    - 最佳居住地（干燥/湿润地区）
    - 季节性注意事项（如金弱忌秋）
3. 能量平衡方案：
    - 饮食调理（对应五行食材）
    - 运动建议（瑜伽/太极等）
    - 色彩疗法（幸运色穿搭指南）
`;
                break;
            case 'personality':
                prompt += `分析命主脾气性格：
1. 社会面具（MBTI类型参考）：
    - 主导功能（如Te外向思考）
    - 外在行为模式
2. 内在本质（九型人格参考）：
    - 核心欲望/恐惧
    - 压力与安全状态表现
3. 特殊潜能：
    - 命局特殊组合（如伤官配印→艺术天赋）
    - 潜在性格阴影（需注意的极端倾向）
4. 发展建议：
    - 适合的职业性格培养
    - 人际关系优化方案
`;
                break;
            case 'children':
                prompt += `分析子女情况：
1. 生育能量评估：
    - 最佳生育年龄段（生理时钟+命理时钟）
    - 易孕体质特征（命中子息星强弱）
2. 亲子关系图谱：
    - 子女序位
    - 性别倾向
    - 缘分深度
    - 特殊天赋       |
3. 现代建议：
    - 备孕时机选择（流年配合）
    - 教育方向建议（五行补益才艺）
    - 亲子沟通禁忌（命局相冲注意事项）
`;
                break;
            case 'marriage':
                prompt += `分析婚姻情况：
1. 配偶特征：
    - 出现时段（大运流年）
    - 可能职业/性格
2. 感情波折：
    - 易矛盾年份（及化解建议）
    - 需注意的桃花类型
3. 婚配建议：
    - 最佳属相
    - 忌配五行
`;
                break;
            case 'health':
                prompt += `详细分析健康状况：
1. 体质诊断：
    - 五行偏枯对应的现代医学风险
    - 先天薄弱脏器
2. 阶段预警：
    - 每十年健康注意事项
    - 建议体检项目
3. 调理方案：
    - 食疗推荐（具体食材）
    - 适合的运动方式
`;
                break;
            case 'annual-fortune':
                prompt += `详细分析当前流年运势：
1. 岁运作用：
    - 流年干支与命局刑冲合化
    - 太岁星君注意事项
    - 详细分析流年吉凶，包括事业，婚姻，健康
2. 每月吉凶：
    - 重要月份（表格呈现）
    - 节气转换注意事项
3. 开运建议：
    - 幸运方位
    - 必备开运物品
`;               
                break;
            case 'daily-fortune':
                prompt += `详细分析每日运势：
1. 本日命理气象：
- 四柱能量分布（用百分比表示）
- 特殊星曜影响（如驿马/桃花等）
2. 时辰吉凶表：
3. 三维建议：
    - 宜：签约/出行等（具体时段）
    - 忌：投资/理发等（含传统禁忌）
    - 特吉方位：财位/贵人方
4. 能量提示：
    - 最佳着装颜色
    - 幸运数字组合
`;
                break;
            case 'milestones':
                prompt += `分析一生重要节点和重大灾祸：
1. 重要发展阶段：
    - 教育关键期（适合深造年份）
    - 事业转折点（行业转换建议）
    - 财富积累期（最佳投资年龄段）
2. 灾厄预警系统：
    - 健康风险期（具体年份+预防措施）
    - 法律风险点（易纠纷时间段）
3. 时空化解方案：
    - 各阶段风水布局要点
    - 本命守护神建议（如太岁将军）
`;
                break;
            case 'decade-fortune':
                prompt += `分析十年大运走势：
【大运周期分析表】
| 年龄段 | 大运干支 | 财运 | 事业 | 健康 | 关键提示 |
|-------|---------|-----|-----|-----|--------|
| 示例：25-35 | 癸卯 | ★★★★ | ★★★☆ | ★★☆☆ | 注意肝胆健康 |
    
特殊说明：
1. 交界年注意事项（换运前半年调整建议）
2. 各周期贵人特征（属相/五行属性）
3. 大运与流年叠加效应图解
`;
                break;
            case 'monthly-fortune':
                prompt += `详细分析今年每月运势：
1. 月令能量分析：
    - 五行旺衰日历图（节气转换提示）
    - 特殊月份标记（如闰月/双春月）
2. 三维月历表：
    | 月份 | 财运星 | 感情星 | 健康星 | 重点注意日 |
    |-----|-------|-------|-------|-------|
    | 示例：农历五月 | ★★★☆☆ | ★★☆☆☆ | ★★★★★ | 初八、廿三 |
3. 每月开运套餐：
    - 月初祈福建议
    - 月中小结提醒
    - 月末能量回收方法
`;
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
    // 使用 currentYear（2025）、currentMonth、currentDay
        const currentDateStr = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-${currentDay.toString().padStart(2, '0')}`;
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
4. 请分析以下八字的大运走势，但【必须使用】我提供的大运数据
   当前日期：${currentDateStr} 
   如果问题与当前命盘相关，请结合以下八字信息：
   当前日期：${currentDateStr} 
   姓名：${birthData.name || '未提供'}
   出生日期：${birthData.date}
   出生时间：${birthData.time}
   性别：${birthData.gender === 'male' ? '男' : '女'}
   八字：${currentPillars.year} ${currentPillars.month} ${currentPillars.day} ${currentPillars.hour}
   起运时间：${luckStartingTime.textContent || '未计算'}
   身强身弱：${strengthType.textContent || '未计算'}
   当前大运：${localResult.currentFortune.ganZhi} (${localResult.currentFortune.ageRange})
   未来大运：${localResult.decadeFortune.fortunes.map(f => f.ganZhi).join('→')}
   请直接分析此八字的起运时间和身强身弱，不要自行排盘或计算起运时间。

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
