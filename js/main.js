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
    const baziQuestionInput = document.getElementById('bazi-question');
    const baziQaSubmit = document.getElementById('bazi-qa-submit');
    const baziQaResponse = document.getElementById('bazi-qa-response');
    const baziQaLoading = document.getElementById('bazi-qa-loading');

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
            const seasonScore = calculateSeasonScore(dayStem, monthBranch);
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

    function calculatePatternScore(pillars) {
        if (isCongGe(pillars)) {
            return 20;
        }
        if (isZhuanWangGe(pillars)) {
            return 15;
        }
        return 5;
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

    function calculateGodsScore(pillars) {
        return 10;
    }

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
        stems.forEach(stem => {
            if (wealthStars.includes(stem)) {
                wealthCount++;
            }
        });
        branches.forEach(branch => {
            if (wealthStars.includes(branch)) {
                wealthCount++;
            }
        });
        if (wealthCount >= 3) return 30;
        if (wealthCount === 2) return 20;
        if (wealthCount === 1) return 10;
        return 5;
    }

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
        stems.forEach(stem => {
            if (damageStars.includes(stem)) {
                damageCount++;
            }
        });
        branches.forEach(branch => {
            if (damageStars.includes(branch)) {
                damageCount++;
            }
        });
        return Math.min(20, damageCount * 5);
    }

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
        stems.forEach(stem => {
            if (generateStars.includes(stem)) {
                supportCount++;
            }
        });
        branches.forEach(branch => {
            if (generateStars.includes(branch)) {
                supportCount++;
            }
        });
        if (supportCount >= 2) return 15;
        if (supportCount === 1) return 8;
        return 3;
    }

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

    function calculateFortuneScore(pillars) {
        return 5;
    }

    function getFateLevel(score) {
        if (score >= 85) return { name: "天赐鸿运 ★★★★★ (85-100分)", class: "excellent" };
        if (score >= 70) return { name: "福星高照 ★★★★☆ (70-84分)", class: "good" };
        if (score >= 50) return { name: "安常守分 ★★★☆☆ (50-69分)", class: "average" };
        if (score >= 30) return { name: "勤能补拙 ★★☆☆☆ (30-49分)", class: "struggling" };
        return { name: "逆水行舟 ★☆☆☆☆ (<30分)", class: "needs-improvement" };
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
        const solar = Solar.fromYmdHms(2023, 10, 5, 12, 0, 0); // 公历转农历
        const lunar = solar.getLunar(); // 获取农历日期
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
        const monthHiddenStems = getHiddenStems(monthZhi);  // 修正：使用月支而不是年支
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

    function calculateDecadeFortune(lunar, gender) {
        const yearGan = lunar.getYearGan();
        const yearZhi = lunar.getYearZhi();
        const isMale = gender === 'male';
        const isYangYear = ['甲', '丙', '戊', '庚', '壬'].includes(yearGan);
        const isForward = (isYangYear && isMale) || (!isYangYear && !isMale);
        const solar = lunar.getSolar();
        const jieQiName = isForward ? '立春' : '大寒';
        const targetJieQi = lunar.getJieQi(jieQiName);
        let daysDiff = 15;
        if (targetJieQi) {
            daysDiff = Math.abs(solar.getDiffDays(targetJieQi));
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
        const existingIndex = profiles.findIndex(p => 
            p.date === birthData.date && 
            p.time === birthData.time && 
            p.gender === birthData.gender
        );
        if (existingIndex >= 0) {
            profiles[existingIndex] = birthData;
        } else {
            profiles.push(birthData);
        }
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
用简洁格式返回，不要分析内容，不要使用任何符号如#*、等。`
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
喜用和忌凶：[视觉化总结]
用Markdown格式，段落与段落之间空一行，使用分隔线，标题和重要内容高亮显示，添加视觉引导元素如箭头、进度条等，不要使用任何特殊符号`;
                break;
            case 'career':
                prompt += `详细分析适合行业情况：
1 适合行业分析
2 最佳行业推荐
3 流年事业运分析
返回格式：
流年事业运分析：[以表格方式详细分析](1-5星)
用Markdown格式，段落与段落之间空一行，使用分隔线，标题和重要内容高亮显示，添加视觉引导元素如箭头、进度条等，不要使用任何特殊符号`;
                break;
            case 'wealth':
                prompt += `详细分析财富情况：
1 财富格局
2 流年财运分析
3 大运财运分析
返回格式：
流年财运分析：[以表格方式详细分析](1-5星)
大运财运分析：[以表格方式详细分析](1-5星)
用Markdown格式，段落与段落之间空一行，使用分隔线，标题和重要内容高亮显示，添加视觉引导元素如箭头、进度条等，不要使用任何特殊符号`;
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
调候建议：[详细分析]
用Markdown格式，段落与段落之间空一行，使用分隔线，标题和重要内容高亮显示，添加视觉引导元素如箭头、进度条等，不要使用任何特殊符号`;
                break;
            case 'personality':
                prompt += `分析命主脾气性格：
1 外在性格分析
2 内在性格分析
3 特殊性格分析
外在性格分析[内容简洁]
内在性格分析[内容简洁]
特殊性格分析[内容简洁]
用Markdown格式，段落与段落之间空一行，使用分隔线，标题和重要内容高亮显示，添加视觉引导元素如箭头、进度条等，不要使用任何特殊符号`;
                break;
            case 'children':
                prompt += `分析子女情况：
1 子女数量分析
2 子女缘分分析
子女数量：[男女]
子女缘分分析：[详细分析]
用Markdown格式，段落与段落之间空一行，使用分隔线，标题和重要内容高亮显示，添加视觉引导元素如箭头、进度条等，不要使用任何特殊符号`;
                break;
            case 'marriage':
                prompt += `分析婚姻情况：
1 适婚年份
2 桃花年份
3 流月婚姻吉凶分析
返回格式：
适婚年份：[表格方式呈现]
桃花年份：[表格方式呈现]
流月婚姻吉凶分析：[表格方式呈现具体建议](1-5星)
用Markdown格式，段落与段落之间空一行，使用分隔线，标题和重要内容高亮显示，添加视觉引导元素如箭头、进度条等，不要使用任何特殊符号`;
                break;
            case 'health':
                prompt += `详细分析健康状况：
1 五行对应器官健康
2 潜在健康问题
3 养生建议
4 流年健康分析
返回格式：
流年健康分析：[表格方式呈现具体建议]
用Markdown格式，段落与段落之间空一行，使用分隔线，标题和重要内容高亮显示，添加视觉引导元素如箭头、进度条等，不要使用任何特殊符号`;
                break;
            case 'annual-fortune':
                prompt += `详细分析当前流年运势：
1 流年事业吉凶分析
2 流年婚姻吉凶分析
3 流年重大事件吉凶分析
返回格式：
流年事业吉凶分析：[以表格方式详细分析](1-5星)
流年婚姻吉凶分析：[以表格方式详细分析](1-5星)
流年重大事件吉凶分析：[以表格方式详细分析](1-5星)
用Markdown格式，段落与段落之间空一行，使用分隔线，标题和重要内容高亮显示，添加视觉引导元素如箭头、进度条等，不要使用任何特殊符号`;
                break;
            case 'daily-fortune':
                prompt += `详细分析每日运势：
1 每日吉凶时辰
2 每日宜忌事项
3 每日冲煞方位
返回格式：
每日吉凶时辰：[表格方式详细分析]
每日宜忌事项：[表格方式详细分析]
每日冲煞方位：[表格方式详细分析]
用Markdown格式，段落与段落之间空一行，使用分隔线，标题和重要内容高亮显示，添加视觉引导元素如箭头、进度条等，不要使用任何特殊符号`;
                break;
            case 'milestones':
                prompt += `分析一生重要节点和重大灾祸：
1 一生重要事件分析
2 一生重大灾祸分析
3 如何趋吉避凶
返回格式：
一生重要事件分析：[以表格方式详细分析]
一生重大灾祸分析：[以表格方式详细分析]
如何趋吉避凶：[详细分析]
用Markdown格式，段落与段落之间空一行，使用分隔线，标题和重要内容高亮显示，添加视觉引导元素如箭头、进度条等，不要使用任何特殊符号`;
                break;
            case 'decade-fortune':
                prompt += `分析十年大运走势：
1 大运事业吉凶分析
2 大运婚姻吉凶分析
3 大运重大事件吉凶分析
返回格式：
大运事业吉凶分析：[以表格方式详细分析](1-5星)
大运婚姻吉凶分析：[以表格方式详细分析](1-5星)
大运重大事件吉凶分析：[以表格方式详细分析] (1-5星)
用Markdown格式，段落与段落之间空一行，使用分隔线，标题和重要内容高亮显示，添加视觉引导元素如箭头、进度条等，不要使用任何特殊符号`;
                break;
            case 'monthly-fortune':
                prompt += `详细分析今年每月运势：
1 事业吉凶分析
2 婚姻吉凶分析
3 重大事件吉凶分析
返回格式：
事业吉凶分析：[以表格方式详细分析](1-5星)
婚姻吉凶分析：[以表格方式详细分析](1-5星)
重大事件吉凶分析：[以表格方式详细分析] (1-5星)
用Markdown格式，段落与段落之间空一行，使用分隔线，标题和重要内容高亮显示，添加视觉引导元素如箭头、进度条等，不要使用任何特殊符号`;
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
                temperature: 0,
                seed: 12345
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
