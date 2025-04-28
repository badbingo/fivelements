document.addEventListener('DOMContentLoaded', function() {
    // 增强版缓存系统 v2.0
    const baziCache = {
        memory: {}, // 内存缓存
        storage: window.localStorage, // 本地存储缓存
        ttl: 24 * 60 * 60 * 1000, // 24小时缓存有效期
        
        // 生成缓存键
        generateKey: function(type, data) {
            const dateParts = data.date.split('-');
            const timeParts = data.time.split(':');
            return `${type}:${dateParts.join('')}:${timeParts.join('')}:${data.gender}`;
        },
        
        // 获取缓存
        get: function(key) {
            // 先检查内存缓存
            if (this.memory[key] && this.memory[key].expire > Date.now()) {
                return this.memory[key].data;
            }
            
            // 检查本地存储
            const item = this.storage.getItem(`bazi_${key}`);
            if (item) {
                const parsed = JSON.parse(item);
                if (parsed.expire > Date.now()) {
                    // 存入内存缓存
                    this.memory[key] = parsed;
                    return parsed.data;
                }
                this.storage.removeItem(`bazi_${key}`);
            }
            return null;
        },
        
        // 设置缓存
        set: function(key, data) {
            const cacheItem = {
                data: data,
                expire: Date.now() + this.ttl
            };
            
            // 存入内存缓存
            this.memory[key] = cacheItem;
            
            try {
                // 存入本地存储
                this.storage.setItem(`bazi_${key}`, JSON.stringify(cacheItem));
            } catch (e) {
                console.warn('本地存储已满，自动清理过期缓存');
                this.cleanup();
                this.storage.setItem(`bazi_${key}`, JSON.stringify(cacheItem));
            }
        },
        
        // 清理过期缓存
        cleanup: function() {
            const now = Date.now();
            for (let i = 0; i < this.storage.length; i++) {
                const key = this.storage.key(i);
                if (key.startsWith('bazi_')) {
                    const item = JSON.parse(this.storage.getItem(key));
                    if (item.expire <= now) {
                        this.storage.removeItem(key);
                    }
                }
            }
        }
    };

    // API请求管理器
    const apiManager = {
        queue: [], // 请求队列
        batchSize: 3, // 每批处理请求数
        retryLimit: 2, // 重试次数
        pendingRequests: 0, // 当前进行中的请求数
        maxConcurrent: 3, // 最大并发请求数
        requestMap: new Map(), // 请求去重映射
        
        // 添加请求到队列
        addRequest: function(params) {
            const requestKey = JSON.stringify(params);
            
            // 去重检查
            if (this.requestMap.has(requestKey)) {
                return this.requestMap.get(requestKey);
            }
            
            const promise = new Promise((resolve, reject) => {
                this.queue.push({
                    params,
                    resolve,
                    reject,
                    retryCount: 0
                });
                this.processQueue();
            });
            
            this.requestMap.set(requestKey, promise);
            return promise;
        },
        
        // 处理队列
        processQueue: function() {
            if (this.pendingRequests >= this.maxConcurrent || this.queue.length === 0) {
                return;
            }
            
            const batch = this.queue.splice(0, Math.min(this.batchSize, this.queue.length));
            this.pendingRequests += batch.length;
            
            // 批量处理请求
            const batchPromises = batch.map(item => {
                return this.makeApiRequest(item.params)
                    .then(result => {
                        item.resolve(result);
                        return { success: true };
                    })
                    .catch(error => {
                        if (item.retryCount < this.retryLimit) {
                            item.retryCount++;
                            this.queue.unshift(item); // 重新加入队列头部
                            return { success: false, shouldRetry: true };
                        } else {
                            item.reject(error);
                            return { success: false, shouldRetry: false };
                        }
                    });
            });
            
            Promise.all(batchPromises).then(() => {
                this.pendingRequests -= batch.length;
                this.processQueue(); // 继续处理队列
            });
        },
        
        // 执行API请求
        makeApiRequest: async function(params) {
            const { apiUrl, apiKey, prompt } = params;
            
            try {
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({
                        model: "deepseek-chat",
                        messages: [{ role: "user", content: prompt }],
                        temperature: 0,
                        seed: 12345
                    }),
                    signal: AbortSignal.timeout(10000) // 10秒超时
                });
                
                if (!response.ok) {
                    throw new Error(`API请求失败: ${response.status}`);
                }
                
                const result = await response.json();
                return result.choices[0].message.content;
            } catch (error) {
                console.error('API请求错误:', error);
                throw error;
            }
        }
    };

    // 兜底规则库（保持不变）
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

    // 十神映射表（保持不变）
    const tenGodsMap = {
        // ...（保持原有十神映射表不变）
    };

    // API配置
    const apiConfig = {
        url: 'https://api.deepseek.com/v1/chat/completions',
        key: 'sk-b2950087a9d5427392762814114b22a9',
        timeout: 10000, // 10秒超时
        retryDelay: 1000 // 重试延迟1秒
    };

    // 创建十神提示框元素（保持不变）
    const tenGodsTooltip = document.createElement('div');
    tenGodsTooltip.className = 'ten-gods-tooltip';
    document.body.appendChild(tenGodsTooltip);

    // 显示十神提示框（保持不变）
    function showTenGodsTooltip(element, dayStem, stemOrBranch) {
        const tenGod = tenGodsMap[dayStem][stemOrBranch] || '未知';
        tenGodsTooltip.textContent = `${stemOrBranch}: ${tenGod}`;
        tenGodsTooltip.style.display = 'block';
        
        const rect = element.getBoundingClientRect();
        tenGodsTooltip.style.left = `${rect.left + window.scrollX}px`;
        tenGodsTooltip.style.top = `${rect.bottom + window.scrollY + 5}px`;
    }

    // 隐藏十神提示框（保持不变）
    function hideTenGodsTooltip() {
        tenGodsTooltip.style.display = 'none';
    }

    // 为八字四柱添加点击事件（保持不变）
    function setupTenGodsClickHandlers() {
        const pillars = ['year', 'month', 'day', 'hour'];
        
        pillars.forEach(pillar => {
            const stemElement = document.getElementById(`${pillar}-stem`);
            const branchElement = document.getElementById(`${pillar}-branch`);
            const dayStem = document.getElementById('day-stem').textContent;
            
            if (stemElement && branchElement && dayStem) {
                stemElement.addEventListener('click', function(e) {
                    e.stopPropagation();
                    showTenGodsTooltip(this, dayStem, this.textContent);
                });
                
                branchElement.addEventListener('click', function(e) {
                    e.stopPropagation();
                    showTenGodsTooltip(this, dayStem, this.textContent);
                });
            }
        });
        
        document.addEventListener('click', hideTenGodsTooltip);
    }

    // 添加CSS样式（保持不变）
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

    // DOM元素（保持不变）
    const calculateBtn = document.getElementById('calculate-btn');
    const recalculateBtn = document.getElementById('recalculate-btn');
    const inputSection = document.getElementById('input-section');
    const resultSection = document.getElementById('result-section');
    // ...（其他DOM元素保持不变）

    // 全局变量（保持不变）
    let elementChart;
    const currentDate = new Date();
    let birthData = {};
    let loadedSections = {};
    let currentPillars = {};
    let fateScoreDetails = {};
    let wealthScoreDetails = {};
    let fateScoreValue = 0;
    let wealthScoreValue = 0;
    let loadButtonHandlers = {};

    // 初始化（保持不变）
    loadSavedProfiles();
    updateLunarCalendar();
    initEventListeners();

    // 事件监听器初始化（保持不变）
    function initEventListeners() {
        // ...（保持原有事件监听器不变）
    }

    // 保存个人资料（保持不变）
    function saveProfile(birthData) {
        // ...（保持原有实现不变）
    }

    // 重置所有内容（保持不变）
    function resetAllContent() {
        // ...（保持原有实现不变）
    }

    // 初始化加载按钮（保持不变）
    function initLoadButtons() {
        // ...（保持原有实现不变）
    }

    // 加载按钮点击处理函数（优化版）
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
        button.innerHTML = `<span><span class="loading"></span> 量子分析中...</span><i class="fas fa-chevron-down toggle-icon"></i>`;
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
            // 使用优化后的API调用方法
            const result = await getBaziAnalysisWithFallback(section, birthData);
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

    // 显示部分内容（保持不变）
    function displaySectionContent(section, result, contentElement) {
        // ...（保持原有实现不变）
    }

    // 计算八字（优化版）
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
            const loadingOverlay = document.createElement('div');
            loadingOverlay.className = 'loading-overlay';
            loadingOverlay.innerHTML = `
                <div class="loading"></div>
                <p>量子计算引擎启动中...</p>
            `;
            document.body.appendChild(loadingOverlay);
            
            // 使用优化后的混合模式获取结果
            const baziInfo = await getBaziAnalysisWithFallback('basic', birthData);
            
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

    // 初始化元素图表 - 修改为显示本命局+大运+流年
    function initElementChart(baziInfo) {
         if (!elementChartDescription) {
        console.warn('elementChartDescription 元素未找到，图表描述将不会显示');
        elementChartDescription = document.createElement('div'); // 创建回退元素
    }
        // 计算本命局五行能量
        const natalElements = baziInfo.elements;
        
        // 计算大运五行能量 (模拟数据)
        const luckElements = calculateLuckElements(baziInfo);
        
        // 计算流年五行能量 (模拟数据)
        const yearElements = calculateYearElements(baziInfo);
        
        const elementLabels = ['木', '火', '土', '金', '水'];
        
        // 计算百分比
        const calculatePercentages = (data) => {
            const total = data.reduce((sum, value) => sum + value, 0);
            return data.map(value => Math.round((value/total)*100));
        };
        
        const natalPercentages = calculatePercentages(natalElements);
        const luckPercentages = calculatePercentages(luckElements);
        const yearPercentages = calculatePercentages(yearElements);
        
        const elementData = {
            labels: elementLabels.map((label, i) => `${label}`),
            datasets: [
                {
                    label: '本命局',
                    data: natalElements,
                    backgroundColor: 'rgba(0, 255, 136, 0.2)',
                    borderColor: 'rgba(0, 255, 136, 1)',
                    borderWidth: 2,
                    pointBackgroundColor: 'rgba(0, 255, 136, 1)',
                    pointHoverRadius: 5
                },
                {
                    label: '大运',
                    data: luckElements,
                    backgroundColor: 'rgba(255, 204, 0, 0.2)',
                    borderColor: 'rgba(255, 204, 0, 1)',
                    borderWidth: 2,
                    pointBackgroundColor: 'rgba(255, 204, 0, 1)',
                    pointHoverRadius: 5
                },
                {
                    label: '流年',
                    data: yearElements,
                    backgroundColor: 'rgba(0, 153, 255, 0.2)',
                    borderColor: 'rgba(0, 153, 255, 1)',
                    borderWidth: 2,
                    pointBackgroundColor: 'rgba(0, 153, 255, 1)',
                    pointHoverRadius: 5
                }
            ]
        };
        
        // 销毁旧图表
        if (elementChart) {
            elementChart.destroy();
        }
        
        elementChart = new Chart(elementChartCtx, {
            type: 'radar',
            data: elementData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        angleLines: {
                            display: true,
                            color: 'rgba(0, 240, 255, 0.2)'
                        },
                        suggestedMin: 0,
                        suggestedMax: Math.max(...natalElements, ...luckElements, ...yearElements) + 2,
                        ticks: {
                            backdropColor: 'transparent',
                            color: 'rgba(0, 240, 255, 0.7)',
                            font: {
                                family: "'Orbitron', sans-serif"
                            },
                            stepSize: 1
                        },
                        pointLabels: {
                            color: 'rgba(0, 240, 255, 0.9)',
                            font: {
                                family: "'Orbitron', sans-serif",
                                size: 14
                            }
                        },
                        grid: {
                            color: 'rgba(0, 240, 255, 0.1)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            font: {
                                family: "'Orbitron', sans-serif",
                                size: 12
                            },
                            color: 'rgba(0, 240, 255, 0.9)'
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const datasetLabel = context.dataset.label || '';
                                const label = context.label || '';
                                const value = context.raw;
                                let percentage;
                                
                                if (datasetLabel === '本命局') {
                                    percentage = natalPercentages[context.dataIndex];
                                } else if (datasetLabel === '大运') {
                                    percentage = luckPercentages[context.dataIndex];
                                } else {
                                    percentage = yearPercentages[context.dataIndex];
                                }
                                
                                return `${datasetLabel} ${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                },
                elements: {
                    line: {
                        tension: 0.1
                    }
                }
            }
        });
        
        // 添加图表说明
        elementChartDescription.innerHTML = `
            <div class="chart-explanation">
                <h4>五行能量分布说明</h4>
                <ul>
                    <li><span class="color-indicator" style="background-color: rgba(0, 255, 136, 0.5)"></span> <strong>本命局</strong>: 代表命主先天五行能量分布</li>
                    <li><span class="color-indicator" style="background-color: rgba(255, 204, 0, 0.5)"></span> <strong>大运</strong>: 代表当前大运阶段的五行能量变化</li>
                    <li><span class="color-indicator" style="background-color: rgba(0, 153, 255, 0.5)"></span> <strong>流年</strong>: 代表今年流年的五行能量影响</li>
                </ul>
                <p>五行平衡是理想状态，过旺或过弱都可能带来相应问题。图表可直观显示命主在不同时期的五行能量变化。</p>
            </div>
        `;
    }

    // 计算大运五行能量 (模拟)
    function calculateLuckElements(baziInfo) {
        // 基于本命局五行进行一定程度的随机变化
        return baziInfo.elements.map(value => {
            const variation = Math.floor(Math.random() * 3) - 1; // -1, 0, 1
            return Math.max(0, value + variation);
        });
    }

    // 计算流年五行能量 (模拟)
    function calculateYearElements(baziInfo) {
        // 基于本命局五行进行更大程度的随机变化
        return baziInfo.elements.map(value => {
            const variation = Math.floor(Math.random() * 5) - 2; // -2到2
            return Math.max(0, value + variation);
        });
    }

    // 计算元素能量
    function calculateElementEnergy(pillars) {
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
        return [
            elements['木'],
            elements['火'],
            elements['土'],
            elements['金'],
            elements['水']
        ];
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
        const solar = Solar.fromDate(new Date());
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
        
        const elements = calculateElementEnergy({
            year: yearGan + yearZhi,
            month: monthGan + monthZhi,
            day: dayGan + dayZhi,
            hour: hourGan + hourZhi
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
        element.classList.remove('wood', 'fire', 'earth', 'metal', 'water');
        if (stemElements[text]) {
            element.classList.add(stemElements[text]);
        } else if (branchElements[text]) {
            element.classList.add(branchElements[text]);
        }
    }

    // 设置藏干颜色
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

    // 优化后的API调用方法
    async function getBaziAnalysisWithFallback(section, data) {
        // 生成缓存键
        const cacheKey = baziCache.generateKey(section, data);
        
        // 检查缓存
        const cachedResult = baziCache.get(cacheKey);
        if (cachedResult) {
            return cachedResult;
        }
        
        // 对于基础信息部分，直接返回本地计算结果
        if (section === 'basic') {
            const localResult = calculateBaziLocally(data);
            baziCache.set(cacheKey, localResult);
            return localResult;
        }
        
        try {
            // 先尝试本地计算
            const localResult = calculateBaziLocally(data);
            
            // 准备API请求参数
            const prompt = generateAnalysisPrompt(section, data, localResult);
            const params = {
                apiUrl: apiConfig.url,
                apiKey: apiConfig.key,
                prompt: prompt
            };
            
            // 使用API管理器发送请求
            const apiResponse = await apiManager.addRequest(params);
            
            // 验证API结果
            if (section === 'basic') {
                const apiResult = extractKeyFieldsFromApiResponse(apiResponse);
                if (apiResult && validateBaziResult(localResult, apiResult)) {
                    const mergedResult = { ...localResult, ...apiResult };
                    baziCache.set(cacheKey, mergedResult);
                    return mergedResult;
                }
            }
            
            // 缓存API结果
            baziCache.set(cacheKey, apiResponse);
            return apiResponse;
            
        } catch (error) {
            console.error(`获取${section}分析失败:`, error);
            
            // API失败时尝试使用本地计算
            if (section === 'basic') {
                const localResult = calculateBaziLocally(data);
                baziCache.set(cacheKey, localResult);
                return localResult;
            }
            
            // 其他部分尝试使用兜底规则
            const baziKey = generateBaziHashKey(data);
            if (fallbackRules[baziKey] && fallbackRules[baziKey][section]) {
                return fallbackRules[baziKey][section];
            }
            
            throw error;
        }
    }

    // 生成分析提示词
    function generateAnalysisPrompt(section, data, localResult) {
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
            case 'strength':
                prompt += `分析命主的身强身弱情况：
1 日主得令、得地、得势的情况
2 天干地支的合化和刑冲情况
3 特殊格局判断
4 喜用和忌凶
格式说明：
1.用简洁语言清晰的表达
2.使用标准Markdown语法
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
2.使用标准Markdown语法
3.进度条用下划线模拟可视化效果
4.箭头符号仅使用常规字符→
5.重点突出加粗显示关键信息
6.每个分析模块之间保留空行
7.实现专业排版效果`;
                break;
            // ...（其他部分提示词保持不变）
            default:
                prompt += `请分析${section}相关内容`;
        }
        
        return prompt;
    }

    // 获取八字问答答案（优化版）
    async function getBaziAnswer(question) {
        const cacheKey = `qa:${generateBaziHashKey(birthData)}:${question.substring(0, 20)}`;
        const cachedAnswer = baziCache.get(cacheKey);
        if (cachedAnswer) {
            return cachedAnswer;
        }
        
        const prompt = `【八字专业问答规范】请严格遵循以下规则回答：
1. 回答必须基于传统八字命理学知识
2. 回答应简洁明了，避免冗长
3. 针对用户问题提供专业分析
4. 如果问题与当前命盘相关，请结合以下八字信息：
   姓名：${birthData.name || '未提供'}
   出生日期：${birthData.date}
   出生时间：${birthData.time}
   性别：${birthData.gender === 'male' ? '男' : '女'}
   八字：${currentPillars.year} ${currentPillars.month} ${currentPillars.day} ${currentPillars.hour}

用户问题：${question}`;
        
        try {
            const params = {
                apiUrl: apiConfig.url,
                apiKey: apiConfig.key,
                prompt: prompt
            };
            
            const answer = await apiManager.addRequest(params);
            baziCache.set(cacheKey, answer);
            return answer;
        } catch (error) {
            console.error('获取问答答案失败:', error);
            return '获取答案失败，请稍后重试';
        }
    }
});
