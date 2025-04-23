document.addEventListener('DOMContentLoaded', function() {
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

    // 新增的八字问答相关元素
    const baziQuestionInput = document.getElementById('bazi-question');
    const baziQaSubmit = document.getElementById('bazi-qa-submit');
    const baziQaResponse = document.getElementById('bazi-qa-response');
    const baziQaLoading = document.getElementById('bazi-qa-loading');

    // Load saved profiles from localStorage
    loadSavedProfiles();

    timePeriodOptions.forEach(option => {
        option.addEventListener('click', function() {
            timePeriodOptions.forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
            const hour = this.getAttribute('data-hour');
            const minute = this.getAttribute('data-minute');
            birthTimeInput.value = `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
        });
    });

    languageBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            languageBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            const lang = this.getAttribute('data-lang');
            console.log('切换到语言:', lang);
        });
    });

    marked.setOptions({
        breaks: true,
        gfm: true,
        tables: true,
        highlight: function(code, lang) {
            return code;
        }
    });

    // 新增的八字问答提交处理
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

    // 新增的获取八字问答答案函数
    async function getBaziAnswer(question) {
        const apiUrl = 'https://api.deepseek.com/v1/chat/completions';
        const apiKey = 'sk-b2950087a9d5427392762814114b22a9';
        
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

    recalculateBtn.addEventListener('click', function() {
        document.getElementById('name').value = '';
        document.getElementById('birth-date').value = '';
        document.getElementById('birth-time').value = '';
        document.getElementById('gender').value = '';
        timePeriodOptions.forEach(opt => opt.classList.remove('selected'));
        resultSection.style.display = 'none';
        inputSection.style.display = 'block';
        resetAllContent();
        if (elementChart) {
            elementChart.destroy();
        }
        window.scrollTo(0, 0);
    });

    function resetAllContent() {
        fateScoreValue = 0;
        wealthScoreValue = 0;
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
        fateLevel.textContent = '';
        fateScore.textContent = '';
        fateDetails.innerHTML = '';
        wealthLevel.textContent = '';
        wealthScore.textContent = '';
        wealthDetails.innerHTML = '';
        personalityTraits.textContent = '命主性格：';
        document.querySelectorAll('.section-content').forEach(el => {
            el.innerHTML = '';
            el.classList.remove('active');
        });
        document.querySelectorAll('.load-btn').forEach(btn => {
            const originalContent = btn.querySelector('span').innerHTML;
            btn.innerHTML = `<span>${originalContent}</span><i class="fas fa-chevron-down toggle-icon"></i>`;
            btn.classList.remove('active');
            btn.disabled = false;
        });
        document.querySelectorAll('.load-btn-container').forEach(container => {
            container.classList.remove('active');
        });
        document.querySelectorAll('.menu-tab').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.querySelector('.menu-tab[data-tab="fortune"]').classList.add('active');
        document.getElementById('fortune-tab').classList.add('active');
        loadedSections = {};
        currentPillars = {};
        fateScoreDetails = {};
        wealthScoreDetails = {};
        // 重置问答模块
        baziQuestionInput.value = '';
        baziQaResponse.innerHTML = '';
        baziQaResponse.style.display = 'none';
        baziQaLoading.style.display = 'none';
    }

    document.querySelectorAll('.menu-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.menu-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            this.classList.add('active');
            const tabId = this.getAttribute('data-tab') + '-tab';
            document.getElementById(tabId).classList.add('active');
        });
    });

    function initLoadButtons() {
        document.querySelectorAll('.load-btn').forEach(button => {
            const section = button.getAttribute('data-section');
            if (loadedSections[section]) return;
            const contentElement = document.getElementById(`${section}-content`);
            const container = button.closest('.load-btn-container');
            button.addEventListener('click', async function(e) {
                e.preventDefault();
                if (loadedSections[section]) {
                    container.classList.toggle('active');
                    contentElement.classList.toggle('active');
                    return;
                }
                const originalBtnHtml = button.innerHTML;
                this.disabled = true;
                const sectionName = button.querySelector('span').textContent.trim();
                button.innerHTML = `<span><span class="loading"></span> 量子分析中...</span><i class="fas fa-chevron-down toggle-icon"></i>`;
                container.classList.add('active');
                const progressContainer = document.createElement('div');
                progressContainer.className = 'progress-container';
                progressContainer.innerHTML = '<div class="progress-bar"></div>';
                progressContainer.style.display = 'block';
                contentElement.innerHTML = '';
                contentElement.appendChild(progressContainer);
                const progressBar = progressContainer.querySelector('.progress-bar');
                let progress = 0;
                const progressInterval = setInterval(() => {
                    progress += Math.random() * 10;
                    if (progress >= 100) progress = 100;
                    progressBar.style.width = `${progress}%`;
                }, 300);
                try {
                    const result = await getBaziAnalysis(section, birthData);
                    clearInterval(progressInterval);
                    displaySectionContent(section, result, contentElement);
                    button.innerHTML = originalBtnHtml.replace('<i class="fas fa-chevron-down toggle-icon"></i>', 
                        '<i class="fas fa-check"></i><i class="fas fa-chevron-down toggle-icon"></i>');
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
                    button.innerHTML = originalBtnHtml;
                }
            });
        });
    }

    function initElementChart(data) {
        const total = data.reduce((sum, value) => sum + value, 0);
        const percentages = data.map(value => Math.round((value/total)*100));
        const elementData = {
            labels: ['木', '火', '土', '金', '水'].map((label, i) => `${label} ${percentages[i]}%`),
            datasets: [{
                data: data,
                backgroundColor: [
                    'rgba(0, 255, 136, 0.3)',
                    'rgba(255, 51, 0, 0.3)',
                    'rgba(255, 204, 0, 0.3)',
                    'rgba(204, 204, 204, 0.3)',
                    'rgba(0, 153, 255, 0.3)'
                ],
                borderColor: [
                    'rgba(0, 255, 136, 1)',
                    'rgba(255, 51, 0, 1)',
                    'rgba(255, 204, 0, 1)',
                    'rgba(204, 204, 204, 1)',
                    'rgba(0, 153, 255, 1)'
                ],
                borderWidth: 1
            }]
        };
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
                        suggestedMax: Math.max(...data) + 2,
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
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw;
                                const percentage = percentages[context.dataIndex];
                                return `${label}: ${value} (${percentage}%)`;
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
    }

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

    function initFortuneChart(result) {
        const fortuneContent = document.getElementById('decade-fortune-content');
        const canvas = document.createElement('canvas');
        canvas.className = 'fortune-chart';
        fortuneContent.appendChild(canvas);
        
        // 提取运势数据
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

        // 准备图表数据
        const chartData = {
            labels: fortunes.map(f => f.ageRange),
            datasets: [{
                label: '运势指数',
                data: fortunes.map(f => f.score),
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

    function isValidDate(year, month, day) {
        if (month < 1 || month > 12) {
            return false;
        }
        const date = new Date(year, month - 1, day);
        return date.getFullYear() === year && 
               date.getMonth() === month - 1 && 
               date.getDate() === day;
    }

    function isLeapYear(year) {
        return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    }

    function calculateFateScore(pillars) {
        if (fateScoreValue === 0) {
            // New scoring system based on the proposed framework
            const patternScore = calculatePatternScore(pillars); // 30 points
            const godScore = calculateGodScore(pillars); // 25 points
            const elementFlowScore = calculateElementFlowScore(pillars); // 15 points
            const luckScore = calculateLuckScore(pillars); // 25 points
            const tenGodsScore = calculateTenGodsScore(pillars); // 5 points (reduced from 10)
            
            // Special adjustments
            const specialCombinationBonus = calculateSpecialCombinationBonus(pillars);
            const seasonAdjustment = calculateSeasonAdjustment(pillars);
            
            const total = patternScore + godScore + elementFlowScore + luckScore + tenGodsScore + 
                         specialCombinationBonus + seasonAdjustment;
            
            fateScoreDetails = {
                patternScore,
                godScore,
                elementFlowScore,
                luckScore,
                tenGodsScore,
                specialCombinationBonus,
                seasonAdjustment,
                total
            };
            fateScoreValue = Math.min(100, Math.round(total));
        }
        return fateScoreValue;
    }

    // New scoring functions based on the proposed framework
    function calculatePatternScore(pillars) {
        // 格局层次评分 (30分)
        if (isCongGe(pillars)) {
            // 成格且纯粹：27-30分
            return 28 + Math.floor(Math.random() * 3); // Random between 28-30
        }
        if (isZhuanWangGe(pillars)) {
            // 半成格：20-26分
            return 22 + Math.floor(Math.random() * 5); // Random between 22-26
        }
        // 普通格：12-19分
        return 15 + Math.floor(Math.random() * 5); // Random between 15-19
    }

    function calculateGodScore(pillars) {
        // 用神效能评分 (25分)
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
        
        // Check if god is in season (得令)
        const inSeason = isGodInSeason(dayStem, pillars.month.charAt(1));
        
        // Check if god is visible (透干)
        const visible = stems.includes(getGodElement(dayStem));
        
        // Check if god has root (有根)
        const hasRoot = branches.some(b => isSameElement(b, getGodElement(dayStem)));
        
        // Check if god is damaged (无破)
        const damaged = isGodDamaged(dayStem, stems, branches);
        
        // Scoring based on conditions
        if (inSeason && visible && hasRoot && !damaged) {
            return 23 + Math.floor(Math.random() * 3); // 23-25
        } else if ((inSeason || hasRoot) && !severelyDamaged(dayStem, stems, branches)) {
            return 18 + Math.floor(Math.random() * 5); // 18-22
        } else if (!hasRoot && isGenerated(dayStem, stems, branches)) {
            return 12 + Math.floor(Math.random() * 6); // 12-17
        } else if (!hasRoot && damaged) {
            return 6 + Math.floor(Math.random() * 6); // 6-11
        }
        return Math.floor(Math.random() * 6); // 0-5
    }

    function calculateElementFlowScore(pillars) {
        // 五行流通评分 (15分)
        const elements = calculateElementEnergy(pillars);
        const max = Math.max(...elements);
        const min = Math.min(...elements);
        
        // Basic score based on balance
        let score = 10 - (max - min);
        
        // Add bonus for smooth flow (通关有情)
        if (hasSmoothFlow(pillars)) {
            score += 5;
        }
        
        return Math.max(0, Math.min(15, score));
    }

    function calculateLuckScore(pillars) {
        // 大运走势评分 (25分)
        const decadeFortune = calculateDecadeFortune(
            Solar.fromYmdHms(
                parseInt(birthData.date.split('-')[0]),
                parseInt(birthData.date.split('-')[1]),
                parseInt(birthData.date.split('-')[2]),
                parseInt(birthData.time.split(':')[0]),
                parseInt(birthData.time.split(':')[1] || 0),
                0
            ).getLunar(), 
            birthData.gender
        );
        
        // Count number of good luck years
        const goodLuckYears = decadeFortune.fortunes.filter(f => f.score >= 70).length * 10;
        
        if (goodLuckYears >= 30) return 25;
        if (goodLuckYears >= 20) return 20 + Math.floor(Math.random() * 4); // 20-23
        if (goodLuckYears >= 10) return 15 + Math.floor(Math.random() * 4); // 15-18
        if (goodLuckYears > 0) return 10 + Math.floor(Math.random() * 4); // 10-13
        return Math.floor(Math.random() * 10); // 0-9
    }

    function calculateTenGodsScore(pillars) {
        // 十神配置评分 (5分)
        // Reduced from original 10 to 5 as per new framework
        return 3 + Math.floor(Math.random() * 3); // 3-5
    }

    function calculateSpecialCombinationBonus(pillars) {
        // 特殊组合加分项
        let bonus = 0;
        
        // Check for special patterns like 金白水清
        if (isGoldenWater(pillars)) bonus += 3;
        if (isWoodFireTongming(pillars)) bonus += 3;
        if (hasSanQi(pillars)) bonus += 2;
        
        return bonus;
    }

    function calculateSeasonAdjustment(pillars) {
        // 调候用神加分
        const dayStem = pillars.day.charAt(0);
        const monthBranch = pillars.month.charAt(1);
        
        // Winter needs fire, summer needs water, etc.
        if ((['亥', '子', '丑'].includes(monthBranch) && 
            ['丙', '丁', '午', '巳'].some(e => 
                pillars.year.includes(e) || 
                pillars.month.includes(e) || 
                pillars.day.includes(e) || 
                pillars.hour.includes(e)))) {
            return 3; // Winter with fire adjustment
        }
        
        if ((['巳', '午', '未'].includes(monthBranch) && 
            ['壬', '癸', '子', '亥'].some(e => 
                pillars.year.includes(e) || 
                pillars.month.includes(e) || 
                pillars.day.includes(e) || 
                pillars.hour.includes(e)))) {
            return 3; // Summer with water adjustment
        }
        
        return 0;
    }

    // Helper functions for new scoring system
    function isGodInSeason(dayStem, monthBranch) {
        const seasonMap = {
            '甲': ['寅', '卯', '辰'], '乙': ['寅', '卯', '辰'],
            '丙': ['巳', '午', '未'], '丁': ['巳', '午', '未'],
            '戊': ['辰', '戌', '丑', '未'], '己': ['辰', '戌', '丑', '未'],
            '庚': ['申', '酉', '戌'], '辛': ['申', '酉', '戌'],
            '壬': ['亥', '子', '丑'], '癸': ['亥', '子', '丑']
        };
        return seasonMap[dayStem] && seasonMap[dayStem].includes(monthBranch);
    }

    function getGodElement(dayStem) {
        // Returns the element that serves as the god for this day stem
        const godMap = {
            '甲': '癸', '乙': '癸', // Wood needs water
            '丙': '壬', '丁': '壬', // Fire needs water
            '戊': '甲', '己': '甲', // Earth needs wood
            '庚': '丁', '辛': '丁', // Metal needs fire
            '壬': '戊', '癸': '戊'  // Water needs earth
        };
        return godMap[dayStem];
    }

    function isGodDamaged(dayStem, stems, branches) {
        const godElement = getGodElement(dayStem);
        const damagingElements = getDamagingElements(godElement);
        
        return stems.some(s => damagingElements.includes(s)) || 
               branches.some(b => damagingElements.includes(b));
    }

    function severelyDamaged(dayStem, stems, branches) {
        const godElement = getGodElement(dayStem);
        const damagingElements = getDamagingElements(godElement);
        
        const damageCount = stems.filter(s => damagingElements.includes(s)).length +
                           branches.filter(b => damagingElements.includes(b)).length;
        
        return damageCount >= 3;
    }

    function isGenerated(dayStem, stems, branches) {
        const godElement = getGodElement(dayStem);
        const generatingElements = getGeneratingElements(godElement);
        
        return stems.some(s => generatingElements.includes(s)) || 
               branches.some(b => generatingElements.includes(b));
    }

    function hasSmoothFlow(pillars) {
        // Check if conflicting elements have mediating elements
        const elements = calculateElementEnergy(pillars);
        const hasConflict = (elements[0] > 0 && elements[4] > 0) || // Wood vs Metal
                           (elements[1] > 0 && elements[3] > 0) || // Fire vs Water
                           (elements[2] > 0 && elements[0] > 0);   // Earth vs Wood
        
        if (!hasConflict) return true;
        
        // Check for mediating elements
        if (elements[0] > 0 && elements[4] > 0 && elements[4] > 0) { // Wood vs Metal, needs Water
            return elements[4] > 0;
        }
        if (elements[1] > 0 && elements[3] > 0) { // Fire vs Water, needs Wood
            return elements[0] > 0;
        }
        if (elements[2] > 0 && elements[0] > 0) { // Earth vs Wood, needs Fire
            return elements[1] > 0;
        }
        
        return false;
    }

    function isGoldenWater(pillars) {
        // 金白水清 pattern: Metal and Water dominant with little Fire
        const elements = calculateElementEnergy(pillars);
        return (elements[3] + elements[4]) >= 5 && elements[1] <= 1;
    }

    function isWoodFireTongming(pillars) {
        // 木火通明 pattern: Wood and Fire dominant with little Metal
        const elements = calculateElementEnergy(pillars);
        return (elements[0] + elements[1]) >= 5 && elements[3] <= 1;
    }

    function hasSanQi(pillars) {
        // 三奇贵人 pattern: 甲戊庚, 乙丙丁, etc.
        const stems = [
            pillars.year.charAt(0),
            pillars.month.charAt(0),
            pillars.day.charAt(0),
            pillars.hour.charAt(0)
        ];
        
        return (stems.includes('甲') && stems.includes('戊') && stems.includes('庚')) ||
               (stems.includes('乙') && stems.includes('丙') && stems.includes('丁')) ||
               (stems.includes('壬') && stems.includes('癸') && stems.includes('辛'));
    }

    function getDamagingElements(element) {
        // Returns elements that damage the given element
        const damageMap = {
            '木': ['金', '庚', '辛', '申', '酉'],
            '火': ['水', '壬', '癸', '子', '亥'],
            '土': ['木', '甲', '乙', '寅', '卯'],
            '金': ['火', '丙', '丁', '午', '巳'],
            '水': ['土', '戊', '己', '辰', '戌', '丑', '未']
        };
        return damageMap[element] || [];
    }

    function getGeneratingElements(element) {
        // Returns elements that generate the given element
        const generateMap = {
            '木': ['水', '壬', '癸', '子', '亥'],
            '火': ['木', '甲', '乙', '寅', '卯'],
            '土': ['火', '丙', '丁', '午', '巳'],
            '金': ['土', '戊', '己', '辰', '戌', '丑', '未'],
            '水': ['金', '庚', '辛', '申', '酉']
        };
        return generateMap[element] || [];
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
        if (isCongQiangGe(dayStem, stems, branches)) {
            return true;
        }
        if (isCongRuoGe(dayStem, stems, branches)) {
            return true;
        }
        return false;
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
        let otherCount = 0;
        stems.forEach(stem => {
            if (isSameElement(stem, dayStem)) {
                sameCount++;
            } else {
                otherCount++;
            }
        });
        branches.forEach(branch => {
            if (isSameElement(branch, dayStem)) {
                sameCount++;
            } else {
                otherCount++;
            }
        });
        return sameCount >= 5 && otherCount <= 2;
    }

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

    // 革命性财富等级计算公式
    function calculateWealthScore(pillars) {
        if (wealthScoreValue === 0) {
            // 一、财富来源重构（40分）
            const wealthSourceScore = calculateWealthSourceScore(pillars);
            
            // 二、财富承载机制（30分）
            const wealthCarrierScore = calculateWealthCarrierScore(pillars);
            
            // 三、时代算法升级（20分）
            const eraAlgorithmScore = calculateEraAlgorithmScore(pillars);
            
            // 四、关键流年捕捉（10分）
            const criticalYearsScore = calculateCriticalYearsScore(pillars);
            
            const total = wealthSourceScore + wealthCarrierScore + eraAlgorithmScore + criticalYearsScore;
            
            wealthScoreDetails = {
                wealthSourceScore,
                wealthCarrierScore,
                eraAlgorithmScore,
                criticalYearsScore,
                total
            };
            wealthScoreValue = Math.min(100, Math.round(total));
        }
        return wealthScoreValue;
    }

    // 一、财富来源重构（40分）
    function calculateWealthSourceScore(pillars) {
        const wealthType = identifyWealthType(pillars);
        let baseScore = 0;
        
        switch(wealthType) {
            case 'monopoly':    // 垄断型财富
                baseScore = 35 + Math.floor(Math.random() * 6); // 35-40
                break;
            case 'innovative':  // 创新性财富
                baseScore = 30 + Math.floor(Math.random() * 9); // 30-38
                break;
            case 'resource':    // 资源型财富
                baseScore = 25 + Math.floor(Math.random() * 11); // 25-35
                break;
            case 'speculative': // 投机型财富
                baseScore = 20 + Math.floor(Math.random() * 11); // 20-30
                break;
            case 'labor':       // 劳务型财富
                baseScore = 10 + Math.floor(Math.random() * 11); // 10-20
                break;
            default:
                baseScore = 15 + Math.floor(Math.random() * 6); // 默认15-20
        }
        
        // 特殊案例处理：丁火日主无财星但戌土伤官库（互联网大佬）直接计36分
        if (pillars.day.charAt(0) === '丁' && 
            !hasExplicitWealthStar(pillars) && 
            pillars.hour.charAt(1) === '戌') {
            baseScore = 36;
        }
        
        return Math.min(40, baseScore);
    }

    // 识别财富类型
    function identifyWealthType(pillars) {
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
        
        // 1. 检查是否垄断型财富（财星得令+官杀护财）
        if (isMonopolyWealth(pillars)) {
            return 'monopoly';
        }
        
        // 2. 检查是否创新性财富（食伤旺而生财）
        if (isInnovativeWealth(pillars)) {
            return 'innovative';
        }
        
        // 3. 检查是否资源型财富（印星化官生身）
        if (isResourceWealth(pillars)) {
            return 'resource';
        }
        
        // 4. 检查是否投机型财富（三合财局+劫财为用）
        if (isSpeculativeWealth(pillars)) {
            return 'speculative';
        }
        
        // 5. 默认劳务型财富（正财透干无生助）
        return 'labor';
    }

    // 判断是否垄断型财富（财星得令+官杀护财）
    function isMonopolyWealth(pillars) {
        const dayStem = pillars.day.charAt(0);
        const wealthStars = getWealthStars(dayStem);
        const monthBranch = pillars.month.charAt(1);
        
        // 财星得令
        const isWealthInSeason = isWealthStarInSeason(wealthStars, monthBranch);
        
        // 官杀护财
        const hasOfficerProtection = hasOfficerStarsProtectingWealth(pillars);
        
        return isWealthInSeason && hasOfficerProtection;
    }

    // 判断是否创新性财富（食伤旺而生财）
    function isInnovativeWealth(pillars) {
        const dayStem = pillars.day.charAt(0);
        const generateStars = getGenerateStars(dayStem);
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
        
        // 食伤旺
        let generateCount = 0;
        stems.forEach(s => {
            if (generateStars.includes(s)) generateCount++;
        });
        branches.forEach(b => {
            if (generateStars.includes(b)) generateCount++;
        });
        
        // 生财（食伤生财组合纯净）
        const wealthStars = getWealthStars(dayStem);
        let hasWealthGeneration = false;
        stems.forEach(s => {
            if (wealthStars.includes(s)) hasWealthGeneration = true;
        });
        branches.forEach(b => {
            if (wealthStars.includes(b)) hasWealthGeneration = true;
        });
        
        return generateCount >= 3 && hasWealthGeneration;
    }

    // 判断是否资源型财富（印星化官生身）
    function isResourceWealth(pillars) {
        const dayStem = pillars.day.charAt(0);
        const sealStars = getSealStars(dayStem);
        const officerStars = getOfficerStars(dayStem);
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
        
        // 印星化官
        let hasSealOfficer = false;
        stems.forEach(s => {
            if (sealStars.includes(s) && officerStars.includes(s)) hasSealOfficer = true;
        });
        branches.forEach(b => {
            if (sealStars.includes(b) && officerStars.includes(b)) hasSealOfficer = true;
        });
        
        // 生身
        const dayElement = getElement(dayStem);
        let hasGeneration = false;
        stems.forEach(s => {
            if (getGeneratingElements(dayElement).includes(getElement(s))) hasGeneration = true;
        });
        branches.forEach(b => {
            if (getGeneratingElements(dayElement).includes(getElement(b))) hasGeneration = true;
        });
        
        return hasSealOfficer && hasGeneration;
    }

    // 判断是否投机型财富（三合财局+劫财为用）
    function isSpeculativeWealth(pillars) {
        const dayStem = pillars.day.charAt(0);
        const wealthStars = getWealthStars(dayStem);
        const branches = [
            pillars.year.charAt(1),
            pillars.month.charAt(1),
            pillars.day.charAt(1),
            pillars.hour.charAt(1)
        ];
        
        // 三合财局
        const sanHeCombinations = [
            ['申', '子', '辰'], // 水局
            ['亥', '卯', '未'], // 木局
            ['寅', '午', '戌'], // 火局
            ['巳', '酉', '丑']  // 金局
        ];
        
        let hasSanHe = false;
        sanHeCombinations.forEach(combo => {
            const count = branches.filter(b => combo.includes(b)).length;
            if (count >= 2) hasSanHe = true; // 至少两支半合
        });
        
        // 劫财为用
        const robberyStars = getRobberyStars(dayStem);
        let robberyUseful = false;
        stems.forEach(s => {
            if (robberyStars.includes(s)) robberyUseful = true;
        });
        branches.forEach(b => {
            if (robberyStars.includes(b)) robberyUseful = true;
        });
        
        return hasSanHe && robberyUseful;
    }

    // 判断是否有显性财星
    function hasExplicitWealthStar(pillars) {
        const dayStem = pillars.day.charAt(0);
        const wealthStars = getWealthStars(dayStem);
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
        
        return stems.some(s => wealthStars.includes(s)) || 
               branches.some(b => wealthStars.includes(b));
    }

    // 判断财星是否得令
    function isWealthStarInSeason(wealthStars, monthBranch) {
        const seasonMap = {
            '寅': ['甲', '乙', '寅', '卯'], // 木旺于春
            '卯': ['甲', '乙', '寅', '卯'],
            '辰': ['甲', '乙', '寅', '卯'],
            '巳': ['丙', '丁', '午', '巳'], // 火旺于夏
            '午': ['丙', '丁', '午', '巳'],
            '未': ['丙', '丁', '午', '巳'],
            '申': ['庚', '辛', '申', '酉'], // 金旺于秋
            '酉': ['庚', '辛', '申', '酉'],
            '戌': ['庚', '辛', '申', '酉'],
            '亥': ['壬', '癸', '子', '亥'], // 水旺于冬
            '子': ['壬', '癸', '子', '亥'],
            '丑': ['壬', '癸', '子', '亥']
        };
        
        const seasonElements = seasonMap[monthBranch] || [];
        return wealthStars.some(star => seasonElements.includes(star));
    }

    // 判断是否有官杀护财
    function hasOfficerStarsProtectingWealth(pillars) {
        const dayStem = pillars.day.charAt(0);
        const officerStars = getOfficerStars(dayStem);
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
        
        return stems.some(s => officerStars.includes(s)) || 
               branches.some(b => officerStars.includes(b));
    }

    // 二、财富承载机制（30分）
    function calculateWealthCarrierScore(pillars) {
        // 1. 财库质量（20分）
        const treasuryQualityScore = calculateTreasuryQualityScore(pillars);
        
        // 2. 财星转化力（10分）
        const wealthConversionScore = calculateWealthConversionScore(pillars);
        
        // 3. 暗财通道（额外加分，最多+5分）
        const hiddenWealthBonus = calculateHiddenWealthBonus(pillars);
        
        return Math.min(30, treasuryQualityScore + wealthConversionScore + hiddenWealthBonus);
    }

    // 1. 财库质量评分（20分）
    function calculateTreasuryQualityScore(pillars) {
        const branches = [
            pillars.year.charAt(1),
            pillars.month.charAt(1),
            pillars.day.charAt(1),
            pillars.hour.charAt(1)
        ];
        
        // 检查辰戌丑未全见+拱合（20分）
        const treasuryBranches = ['辰', '戌', '丑', '未'];
        const hasAllTreasury = treasuryBranches.every(b => branches.includes(b));
        if (hasAllTreasury) {
            return 20;
        }
        
        // 检查独库得用（15分）
        const dayStem = pillars.day.charAt(0);
        const wealthStars = getWealthStars(dayStem);
        const hasSingleTreasury = branches.some(b => 
            treasuryBranches.includes(b) && 
            wealthStars.includes(b)
        );
        if (hasSingleTreasury) {
            return 15;
        }
        
        // 虚库无实（5分）
        return 5;
    }

    // 2. 财星转化力评分（10分）
    function calculateWealthConversionScore(pillars) {
        const dayStem = pillars.day.charAt(0);
        const wealthStars = getWealthStars(dayStem);
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
        
        // 财官印流通（如土财→金官→水印）
        if (hasWealthOfficerSealFlow(pillars)) {
            return 10;
        }
        
        // 财星被比劫截脚
        if (hasWealthIntercepted(pillars)) {
            return 2; // 扣8分
        }
        
        // 默认情况
        return 5;
    }

    // 检查财官印流通
    function hasWealthOfficerSealFlow(pillars) {
        const dayStem = pillars.day.charAt(0);
        const wealthStars = getWealthStars(dayStem);
        const officerStars = getOfficerStars(dayStem);
        const sealStars = getSealStars(dayStem);
        
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
        
        // 检查是否有财→官→印的流通
        let hasFlow = false;
        
        // 检查天干流通
        for (let i = 0; i < stems.length; i++) {
            const stem = stems[i];
            if (wealthStars.includes(stem)) {
                // 检查是否有官星
                for (let j = 0; j < stems.length; j++) {
                    if (i !== j && officerStars.includes(stems[j])) {
                        // 检查是否有印星
                        for (let k = 0; k < stems.length; k++) {
                            if (k !== i && k !== j && sealStars.includes(stems[k])) {
                                hasFlow = true;
                            }
                        }
                    }
                }
            }
        }
        
        // 检查地支流通
        for (let i = 0; i < branches.length; i++) {
            const branch = branches[i];
            if (wealthStars.includes(branch)) {
                // 检查是否有官星
                for (let j = 0; j < branches.length; j++) {
                    if (i !== j && officerStars.includes(branches[j])) {
                        // 检查是否有印星
                        for (let k = 0; k < branches.length; k++) {
                            if (k !== i && k !== j && sealStars.includes(branches[k])) {
                                hasFlow = true;
                            }
                        }
                    }
                }
            }
        }
        
        return hasFlow;
    }

    // 检查财星被比劫截脚
    function hasWealthIntercepted(pillars) {
        const dayStem = pillars.day.charAt(0);
        const wealthStars = getWealthStars(dayStem);
        const robberyStars = getRobberyStars(dayStem);
        const branches = [
            pillars.year.charAt(1),
            pillars.month.charAt(1),
            pillars.day.charAt(1),
            pillars.hour.charAt(1)
        ];
        
        // 检查地支是否有财星被比劫相邻
        for (let i = 0; i < branches.length - 1; i++) {
            if (wealthStars.includes(branches[i]) && robberyStars.includes(branches[i+1])) {
                return true;
            }
            if (robberyStars.includes(branches[i]) && wealthStars.includes(branches[i+1])) {
                return true;
            }
        }
        
        return false;
    }

    // 3. 暗财通道加分（最多+5分）
    function calculateHiddenWealthBonus(pillars) {
        const dayStem = pillars.day.charAt(0);
        const wealthStars = getWealthStars(dayStem);
        const branches = [
            pillars.year.charAt(1),
            pillars.month.charAt(1),
            pillars.day.charAt(1),
            pillars.hour.charAt(1)
        ];
        
        let bonus = 0;
        
        // 检查寅中戊土、申中戊土等暗财
        branches.forEach(b => {
            const hiddenStems = getHiddenStems(b);
            if (hiddenStems.split('').some(s => wealthStars.includes(s))) {
                bonus += 1; // 每处暗财+1分
            }
        });
        
        return Math.min(5, bonus);
    }

    // 三、时代算法升级（20分）
    function calculateEraAlgorithmScore(pillars) {
        // 1. 数字经济加成（13分）
        const digitalEconomyBonus = calculateDigitalEconomyBonus(pillars);
        
        // 2. 杠杆系数（7分）
        const leverageScore = calculateLeverageScore(pillars);
        
        return Math.min(20, digitalEconomyBonus + leverageScore);
    }

    // 1. 数字经济加成（13分）
    function calculateDigitalEconomyBonus(pillars) {
        const branches = [
            pillars.year.charAt(1),
            pillars.month.charAt(1),
            pillars.day.charAt(1),
            pillars.hour.charAt(1)
        ];
        
        let bonus = 0;
        
        // 巳酉丑三合（数据金）+8分
        const hasSiYouChou = ['巳', '酉', '丑'].filter(b => branches.includes(b)).length >= 2;
        if (hasSiYouChou) {
            bonus += 8;
        }
        
        // 戌土（互联网库）+5分
        if (branches.includes('戌')) {
            bonus += 5;
        }
        
        return Math.min(13, bonus);
    }

    // 2. 杠杆系数（7分）
    function calculateLeverageScore(pillars) {
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
        
        let baseScore = 0;
        
        // 七杀为用（融资能力）原始分×1.5倍
        if (hasSevenKillingAsUseful(pillars)) {
            baseScore = 5;
            return Math.min(7, Math.round(baseScore * 1.5));
        }
        
        // 羊刃驾财（风险投资）原始分×1.3倍
        if (hasBladeRidingWealth(pillars)) {
            baseScore = 5;
            return Math.min(7, Math.round(baseScore * 1.3));
        }
        
        return baseScore;
    }

    // 检查七杀为用
    function hasSevenKillingAsUseful(pillars) {
        const dayStem = pillars.day.charAt(0);
        const sevenKillingStars = getSevenKillingStars(dayStem);
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
        
        // 检查七杀是否得制或为用
        return stems.some(s => sevenKillingStars.includes(s)) || 
               branches.some(b => sevenKillingStars.includes(b));
    }

    // 检查羊刃驾财
    function hasBladeRidingWealth(pillars) {
        const dayStem = pillars.day.charAt(0);
        const bladeStars = getBladeStars(dayStem);
        const wealthStars = getWealthStars(dayStem);
        const branches = [
            pillars.year.charAt(1),
            pillars.month.charAt(1),
            pillars.day.charAt(1),
            pillars.hour.charAt(1)
        ];
        
        // 检查日支是否为羊刃
        if (!bladeStars.includes(pillars.day.charAt(1))) {
            return false;
        }
        
        // 检查是否有财星
        return branches.some(b => wealthStars.includes(b));
    }

    // 四、关键流年捕捉（10分）
    function calculateCriticalYearsScore(pillars) {
        const decadeFortune = calculateDecadeFortune(
            Solar.fromYmdHms(
                parseInt(birthData.date.split('-')[0]),
                parseInt(birthData.date.split('-')[1]),
                parseInt(birthData.date.split('-')[2]),
                parseInt(birthData.time.split(':')[0]),
                parseInt(birthData.time.split(':')[1] || 0),
                0
            ).getLunar(), 
            birthData.gender
        );
        
        // 检查是否有财富引爆点
        let hasTriggerPoint = false;
        decadeFortune.fortunes.forEach(fortune => {
            if (isWealthTriggerYear(pillars, fortune)) {
                hasTriggerPoint = true;
            }
        });
        
        return hasTriggerPoint ? 10 : 0;
    }

    // 检查是否是财富引爆年
    function isWealthTriggerYear(pillars, fortune) {
        // 开发"财富引爆点"算法：
        // if 流年同时触发：
        //   大运财星得地 +
        //   流年财星透干 +
        //   原局财库被冲开：
        //       直接+10分
        
        const dayStem = pillars.day.charAt(0);
        const wealthStars = getWealthStars(dayStem);
        
        // 1. 检查大运财星得地
        const fortuneGanZhi = fortune.ganZhi;
        const hasFortuneWealth = wealthStars.includes(fortuneGanZhi.charAt(0)) || 
                                 wealthStars.includes(fortuneGanZhi.charAt(1));
        
        // 2. 检查流年财星透干（需要模拟流年）
        // 这里简化处理，假设流年中有财星
        const hasYearWealth = Math.random() > 0.7; // 70%概率模拟
        
        // 3. 检查原局财库被冲开
        const branches = [
            pillars.year.charAt(1),
            pillars.month.charAt(1),
            pillars.day.charAt(1),
            pillars.hour.charAt(1)
        ];
        const treasuryBranches = ['辰', '戌', '丑', '未'];
        const hasTreasury = branches.some(b => treasuryBranches.includes(b));
        const isTreasuryOpened = hasTreasury && Math.random() > 0.7; // 70%概率模拟
        
        return hasFortuneWealth && hasYearWealth && isTreasuryOpened;
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

    // 获取食伤星
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

    // 获取官杀星
    function getOfficerStars(dayStem) {
        const officerMap = {
            '甲': ['庚', '辛', '申', '酉'],
            '乙': ['庚', '辛', '申', '酉'],
            '丙': ['壬', '癸', '子', '亥'],
            '丁': ['壬', '癸', '子', '亥'],
            '戊': ['甲', '乙', '寅', '卯'],
            '己': ['甲', '乙', '寅', '卯'],
            '庚': ['丙', '丁', '午', '巳'],
            '辛': ['丙', '丁', '午', '巳'],
            '壬': ['戊', '己', '辰', '戌', '丑', '未'],
            '癸': ['戊', '己', '辰', '戌', '丑', '未']
        };
        return officerMap[dayStem] || [];
    }

    // 获取印星
    function getSealStars(dayStem) {
        const sealMap = {
            '甲': ['壬', '癸', '子', '亥'],
            '乙': ['壬', '癸', '子', '亥'],
            '丙': ['甲', '乙', '寅', '卯'],
            '丁': ['甲', '乙', '寅', '卯'],
            '戊': ['丙', '丁', '午', '巳'],
            '己': ['丙', '丁', '午', '巳'],
            '庚': ['戊', '己', '辰', '戌', '丑', '未'],
            '辛': ['戊', '己', '辰', '戌', '丑', '未'],
            '壬': ['庚', '辛', '申', '酉'],
            '癸': ['庚', '辛', '申', '酉']
        };
        return sealMap[dayStem] || [];
    }

    // 获取比劫星
    function getRobberyStars(dayStem) {
        const robberyMap = {
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
        return robberyMap[dayStem] || [];
    }

    // 获取七杀星
    function getSevenKillingStars(dayStem) {
        const sevenKillingMap = {
            '甲': ['庚', '申'],
            '乙': ['辛', '酉'],
            '丙': ['壬', '子'],
            '丁': ['癸', '亥'],
            '戊': ['甲', '寅'],
            '己': ['乙', '卯'],
            '庚': ['丙', '午'],
            '辛': ['丁', '巳'],
            '壬': ['戊', '辰', '戌'],
            '癸': ['己', '丑', '未']
        };
        return sevenKillingMap[dayStem] || [];
    }

    // 获取羊刃星
    function getBladeStars(dayStem) {
        const bladeMap = {
            '甲': ['卯'],
            '乙': ['寅'],
            '丙': ['午'],
            '丁': ['巳'],
            '戊': ['午'],
            '己': ['巳'],
            '庚': ['酉'],
            '辛': ['申'],
            '壬': ['子'],
            '癸': ['亥']
        };
        return bladeMap[dayStem] || [];
    }

    // 获取五行元素
    function getElement(stemOrBranch) {
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
        return elementMap[stemOrBranch] || '';
    }

    function getFateLevel(score) {
        if (score >= 90) return { name: "成就级 ★★★★★ (90-100分)", class: "excellent" };
        if (score >= 75) return { name: "优秀级 ★★★★☆ (75-89分)", class: "good" };
        if (score >= 55) return { name: "普通级 ★★★☆☆ (55-74分)", class: "average" };
        if (score >= 35) return { name: "奋斗级 ★★☆☆☆ (35-54分)", class: "struggling" };
        return { name: "调整级 ★☆☆☆☆ (<35分)", class: "needs-improvement" };
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
                    <div class="progress-bar" style="width: ${(fateScoreDetails.elementFlowScore/15)*100}%"></div>
                </div>
                <div class="score-value">${fateScoreDetails.elementFlowScore}/15</div>
            </div>
            <div class="score-progress">
                <div class="score-label">大运走势</div>
                <div class="progress-container">
                    <div class="progress-bar" style="width: ${(fateScoreDetails.luckScore/25)*100}%"></div>
                </div>
                <div class="score-value">${fateScoreDetails.luckScore}/25</div>
            </div>
            <div class="score-progress">
                <div class="score-label">十神配置</div>
                <div class="progress-container">
                    <div class="progress-bar" style="width: ${(fateScoreDetails.tenGodsScore/5)*100}%"></div>
                </div>
                <div class="score-value">${fateScoreDetails.tenGodsScore}/5</div>
            </div>
            ${fateScoreDetails.specialCombinationBonus > 0 ? `
            <div class="score-progress">
                <div class="score-label">特殊组合加分</div>
                <div class="progress-container">
                    <div class="progress-bar" style="width: ${(fateScoreDetails.specialCombinationBonus/5)*100}%"></div>
                </div>
                <div class="score-value">+${fateScoreDetails.specialCombinationBonus}</div>
            </div>` : ''}
            ${fateScoreDetails.seasonAdjustment > 0 ? `
            <div class="score-progress">
                <div class="score-label">调候加分</div>
                <div class="progress-container">
                    <div class="progress-bar" style="width: ${(fateScoreDetails.seasonAdjustment/5)*100}%"></div>
                </div>
                <div class="score-value">+${fateScoreDetails.seasonAdjustment}</div>
            </div>` : ''}
        `;
        wealthDetails.innerHTML = `
            <div class="score-progress">
                <div class="score-label">财富来源</div>
                <div class="progress-container">
                    <div class="progress-bar" style="width: ${(wealthScoreDetails.wealthSourceScore/40)*100}%"></div>
                </div>
                <div class="score-value">${wealthScoreDetails.wealthSourceScore}/40</div>
            </div>
            <div class="score-progress">
                <div class="score-label">财富承载</div>
                <div class="progress-container">
                    <div class="progress-bar" style="width: ${(wealthScoreDetails.wealthCarrierScore/30)*100}%"></div>
                </div>
                <div class="score-value">${wealthScoreDetails.wealthCarrierScore}/30</div>
            </div>
            <div class="score-progress">
                <div class="score-label">时代算法</div>
                <div class="progress-container">
                    <div class="progress-bar" style="width: ${(wealthScoreDetails.eraAlgorithmScore/20)*100}%"></div>
                </div>
                <div class="score-value">${wealthScoreDetails.eraAlgorithmScore}/20</div>
            </div>
            <div class="score-progress">
                <div class="score-label">关键流年</div>
                <div class="progress-container">
                    <div class="progress-bar" style="width: ${(wealthScoreDetails.criticalYearsScore/10)*100}%"></div>
                </div>
                <div class="score-value">${wealthScoreDetails.criticalYearsScore}/10</div>
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
        const decadeFortune = calculateDecadeFortune(lunar, birthData.gender); // 使用自定义函数
        
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
