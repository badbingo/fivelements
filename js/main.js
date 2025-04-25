document.addEventListener('DOMContentLoaded', function() {
    // 缓存系统
    const cache = {
        set: async function(key, value, ttl = 3600) {
            if (typeof window !== 'undefined' && window.localStorage) {
                const item = {
                    value: value,
                    expiry: Date.now() + ttl * 1000
                };
                localStorage.setItem(`bazi_cache_${key}`, JSON.stringify(item));
            }
        },
        get: async function(key) {
            if (typeof window !== 'undefined' && window.localStorage) {
                const itemStr = localStorage.getItem(`bazi_cache_${key}`);
                if (!itemStr) return null;
                const item = JSON.parse(itemStr);
                if (Date.now() > item.expiry) {
                    localStorage.removeItem(`bazi_cache_${key}`);
                    return null;
                }
                return item.value;
            }
            return null;
        }
    };

    // 本地排盘校验系统
    const baziValidator = {
        // 本地排盘计算
        calculateLocally: function(birthData) {
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
            
            return {
                year: bazi.getYearGan() + bazi.getYearZhi(),
                month: bazi.getMonthGan() + bazi.getMonthZhi(),
                day: bazi.getDayGan() + bazi.getDayZhi(),
                hour: bazi.getTimeGan() + bazi.getTimeZhi(),
                hiddenStems: {
                    year: this.getHiddenStems(bazi.getYearZhi()),
                    month: this.getHiddenStems(bazi.getMonthZhi()),
                    day: this.getHiddenStems(bazi.getDayZhi()),
                    hour: this.getHiddenStems(bazi.getTimeZhi())
                }
            };
        },
        
        // 获取地支藏干
        getHiddenStems: function(branch) {
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
        },
        
        // 校验API返回结果
        validateApiResult: function(localResult, apiResult) {
            // 提取API结果中的四柱
            const apiPillars = this.extractPillarsFromApi(apiResult);
            if (!apiPillars) return false;
            
            // 关键字段对比
            const errors = [];
            if (localResult.year !== apiPillars.year) errors.push(`年柱不一致: 本地=${localResult.year}, API=${apiPillars.year}`);
            if (localResult.month !== apiPillars.month) errors.push(`月柱不一致: 本地=${localResult.month}, API=${apiPillars.month}`);
            if (localResult.day !== apiPillars.day) errors.push(`日柱不一致: 本地=${localResult.day}, API=${apiPillars.day}`);
            if (localResult.hour !== apiPillars.hour) errors.push(`时柱不一致: 本地=${localResult.hour}, API=${apiPillars.hour}`);
            
            if (errors.length > 0) {
                console.error('排盘校验失败:', errors.join('; '));
                return false;
            }
            return true;
        },
        
        // 从API结果中提取四柱
        extractPillarsFromApi: function(apiResult) {
            // 尝试多种方式提取四柱
            const patterns = [
                /年柱\[([^\]]+)\]月柱\[([^\]]+)\]日柱\[([^\]]+)\]时柱\[([^\]]+)\]/,
                /年柱([^\s]+)月柱([^\s]+)日柱([^\s]+)时柱([^\s]+)/,
                /年柱：([^\s]+)月柱：([^\s]+)日柱：([^\s]+)时柱：([^\s]+)/,
                /年柱\s*([^\s]+)\s*月柱\s*([^\s]+)\s*日柱\s*([^\s]+)\s*时柱\s*([^\s]+)/
            ];
            
            for (const pattern of patterns) {
                const match = apiResult.match(pattern);
                if (match && match.length === 5) {
                    return {
                        year: match[1].trim(),
                        month: match[2].trim(),
                        day: match[3].trim(),
                        hour: match[4].trim()
                    };
                }
            }
            
            // 如果正则匹配失败，尝试更宽松的匹配
            const ganzhiPattern = /([甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥])/g;
            const matches = apiResult.match(ganzhiPattern);
            if (matches && matches.length >= 4) {
                return {
                    year: matches[0],
                    month: matches[1],
                    day: matches[2],
                    hour: matches[3]
                };
            }
            
            return null;
        },
        
        // 修正API结果
        correctApiResult: function(localResult, apiResult) {
            const corrected = apiResult;
            const apiPillars = this.extractPillarsFromApi(apiResult);
            
            if (apiPillars) {
                // 替换错误的四柱
                return corrected
                    .replace(apiPillars.year, localResult.year)
                    .replace(apiPillars.month, localResult.month)
                    .replace(apiPillars.day, localResult.day)
                    .replace(apiPillars.hour, localResult.hour);
            }
            
            return corrected;
        }
    };

    // 兜底规则库
    const fallbackRules = {
        getBasicAnalysis: function(birthData, pillars) {
            const elements = this.calculateElementEnergy(pillars);
            const personality = this.getPersonalityTraits(pillars.day.charAt(0));
            
            return `1 八字四柱：年柱[${pillars.year}] 月柱[${pillars.month}] 日柱[${pillars.day}] 时柱[${pillars.hour}]
2 地支藏干：年支[${pillars.hiddenStems.year}] 月支[${pillars.hiddenStems.month}] 日支[${pillars.hiddenStems.day}] 时支[${pillars.hiddenStems.hour}]
3 五行能量：[${elements.join(',')}]
4 命主性格：[${personality}]`;
        },
        
        calculateElementEnergy: function(pillars) {
            const elements = { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 };
            const stemElements = {
                '甲': '木', '乙': '木', '丙': '火', '丁': '火',
                '戊': '土', '己': '土', '庚': '金', '辛': '金',
                '壬': '水', '癸': '水'
            };
            const branchElements = {
                '寅': '木', '卯': '木', '午': '火', '巳': '火',
                '辰': '土', '戌': '土', '丑': '土', '未': '土',
                '申': '金', '酉': '金', '子': '水', '亥': '水'
            };
            
            // 计算天干五行
            elements[stemElements[pillars.year.charAt(0)]]++;
            elements[stemElements[pillars.month.charAt(0)]]++;
            elements[stemElements[pillars.day.charAt(0)]]++;
            elements[stemElements[pillars.hour.charAt(0)]]++;
            
            // 计算地支五行
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
        },
        
        getPersonalityTraits: function(dayStem) {
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
    };

    // 生成唯一哈希值
    function generateHash(birthData) {
        const str = `${birthData.date}_${birthData.time}_${birthData.gender}`;
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash.toString(16);
    }

    // UI元素初始化
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
    const lunarDate = document.getElementById('lunar-date');
    const lunarGanzhi = document.getElementById('lunar-ganzhi');
    const lunarYi = document.getElementById('lunar-yi');
    const lunarJi = document.getElementById('lunar-ji');
    const baziQuestionInput = document.getElementById('bazi-question');
    const baziQaSubmit = document.getElementById('bazi-qa-submit');
    const baziQaResponse = document.getElementById('bazi-qa-response');
    const baziQaLoading = document.getElementById('bazi-qa-loading');
    
    let elementChart;
    let currentDate = new Date();
    let birthData = {};
    let loadedSections = {};
    let currentPillars = {};
    let fateScoreDetails = {};
    let wealthScoreDetails = {};
    let fateScoreValue = 0;
    let wealthScoreValue = 0;

    // 加载已保存的命盘列表
function loadSavedProfiles() {
    if (typeof window !== 'undefined' && window.localStorage) {
        const savedProfiles = JSON.parse(localStorage.getItem('bazi_profiles') || '[]');
        savedProfilesList.innerHTML = '';
        
        if (savedProfiles.length === 0) {
            savedProfilesList.innerHTML = '<li>暂无保存的命盘</li>';
            return;
        }
        
        savedProfiles.forEach((profile, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${profile.name || '匿名用户'} - ${profile.date} ${profile.time}</span>
                <button class="load-profile-btn" data-index="${index}">加载</button>
                <button class="delete-profile-btn" data-index="${index}">删除</button>
            `;
            savedProfilesList.appendChild(li);
        });
        
        // 为按钮添加事件监听
        document.querySelectorAll('.load-profile-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                loadProfile(index);
            });
        });
        
        document.querySelectorAll('.delete-profile-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                deleteProfile(index);
            });
        });
    }
}

// 保存命盘到本地存储
function saveProfile(profileData) {
    if (typeof window !== 'undefined' && window.localStorage) {
        let savedProfiles = JSON.parse(localStorage.getItem('bazi_profiles') || '[]');
        
        // 检查是否已存在相同命盘
        const existingIndex = savedProfiles.findIndex(p => 
            p.date === profileData.date && 
            p.time === profileData.time && 
            p.gender === profileData.gender
        );
        
        if (existingIndex >= 0) {
            // 更新现有命盘
            savedProfiles[existingIndex] = profileData;
        } else {
            // 添加新命盘（最多保存10个）
            savedProfiles.unshift(profileData);
            if (savedProfiles.length > 10) {
                savedProfiles = savedProfiles.slice(0, 10);
            }
        }
        
        localStorage.setItem('bazi_profiles', JSON.stringify(savedProfiles));
        loadSavedProfiles(); // 刷新列表
    }
}

// 加载指定命盘
function loadProfile(index) {
    if (typeof window !== 'undefined' && window.localStorage) {
        const savedProfiles = JSON.parse(localStorage.getItem('bazi_profiles') || '[]');
        if (index >= 0 && index < savedProfiles.length) {
            const profile = savedProfiles[index];
            document.getElementById('name').value = profile.name || '';
            document.getElementById('birth-date').value = profile.date;
            document.getElementById('birth-time').value = profile.time;
            document.getElementById('gender').value = profile.gender;
            
            // 更新时段选择
            timePeriodOptions.forEach(opt => opt.classList.remove('selected'));
            const hour = parseInt(profile.time.split(':')[0]);
            const matchingOption = Array.from(timePeriodOptions).find(opt => 
                parseInt(opt.getAttribute('data-hour')) === hour
            );
            if (matchingOption) {
                matchingOption.classList.add('selected');
            }
        }
    }
}

// 删除指定命盘
function deleteProfile(index) {
    if (typeof window !== 'undefined' && window.localStorage) {
        let savedProfiles = JSON.parse(localStorage.getItem('bazi_profiles') || '[]');
        if (index >= 0 && index < savedProfiles.length) {
            savedProfiles.splice(index, 1);
            localStorage.setItem('bazi_profiles', JSON.stringify(savedProfiles));
            loadSavedProfiles(); // 刷新列表
        }
    }
}

    // 事件监听器
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

    // 八字问答系统
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
            // 生成缓存键
            const cacheKey = `qa_${generateHash(birthData)}_${question.substring(0, 20)}`;
            
            // 检查缓存
            const cachedResponse = await cache.get(cacheKey);
            if (cachedResponse) {
                baziQaResponse.innerHTML = marked.parse(cachedResponse);
                baziQaResponse.style.display = 'block';
                return;
            }
            
            // 调用API
            const response = await getBaziAnswer(question);
            
            // 缓存结果
            await cache.set(cacheKey, response);
            
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
                temperature: 0,
                seed: 12345  // 固定seed值确保相同输入得到相同输出
            })
        });
        
        if (!response.ok) throw new Error(`API请求失败: ${response.status}`);
        const result = await response.json();
        return result.choices[0].message.content;
    }

    // 重新计算按钮
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

    // 重置所有内容
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

    // 初始化加载按钮
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

    // 获取八字分析
    async function getBaziAnalysis(section, data) {
        // 生成缓存键
        const cacheKey = `analysis_${generateHash(data)}_${section}`;
        
        // 检查缓存
        const cachedResult = await cache.get(cacheKey);
        if (cachedResult) {
            return cachedResult;
        }
        
        // 本地计算基础排盘
        const localResult = baziValidator.calculateLocally(data);
        
        // 对于基础信息，使用本地计算结果
        if (section === 'basic') {
            const result = fallbackRules.getBasicAnalysis(data, localResult);
            await cache.set(cacheKey, result);
            return result;
        }
        
        // 其他部分调用API
        const apiUrl = 'https://api.deepseek.com/v1/chat/completions';
        const apiKey = 'sk-b2950087a9d5427392762814114b22a9';
        const currentDateStr = currentDate.getFullYear() + '-' + 
                              (currentDate.getMonth() + 1).toString().padStart(2, '0') + '-' + 
                              currentDate.getDate().toString().padStart(2, '0');
                  
        let prompt = `【八字排盘专业算法规范】请严格遵循以下计算规则：
当前日期：${currentDateStr}
根据以下八字信息进行分析：
姓名：${data.name || '未提供'}
出生日期：${data.date}
出生时间：${data.time} 
性别：${data.gender === 'male' ? '男' : '女'}
八字：${localResult.year} ${localResult.month} ${localResult.day} ${localResult.hour}

`;

        switch(section) {
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
                    seed: 12345  // 固定seed值确保相同输入得到相同输出
                })
            });
            
            if (!response.ok) throw new Error(`API请求失败: ${response.status}`);
            const result = await response.json();
            const apiResult = result.choices[0].message.content;
            
            // 校验API结果
            if (!baziValidator.validateApiResult(localResult, apiResult)) {
                console.warn('API返回结果与本地排盘不一致，使用本地排盘修正');
                const correctedResult = baziValidator.correctApiResult(localResult, apiResult);
                await cache.set(cacheKey, correctedResult);
                return correctedResult;
            }
            
            await cache.set(cacheKey, apiResult);
            return apiResult;
        } catch (error) {
            console.error(`API请求失败: ${error}`);
            // API失败时使用兜底规则
            if (section === 'basic') {
                return fallbackRules.getBasicAnalysis(data, localResult);
            }
            throw error;
        }
    }

    // 其他辅助函数保持不变...
    // (包括calculateElementEnergy, initElementChart, calculateFateScore, calculateWealthScore等)
    // 这些函数可以保持原样，或者根据需要进行优化

    // 计算按钮事件
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
            
            // 使用本地计算获取八字信息
            const baziInfo = baziValidator.calculateLocally(birthData);
            const elements = fallbackRules.calculateElementEnergy(baziInfo);
            const personality = fallbackRules.getPersonalityTraits(baziInfo.day.charAt(0));
            
            displayBasicInfo({
                yearStem: baziInfo.year.charAt(0),
                yearBranch: baziInfo.year.charAt(1),
                monthStem: baziInfo.month.charAt(0),
                monthBranch: baziInfo.month.charAt(1),
                dayStem: baziInfo.day.charAt(0),
                dayBranch: baziInfo.day.charAt(1),
                hourStem: baziInfo.hour.charAt(0),
                hourBranch: baziInfo.hour.charAt(1),
                yearHiddenStems: baziInfo.hiddenStems.year,
                monthHiddenStems: baziInfo.hiddenStems.month,
                dayHiddenStems: baziInfo.hiddenStems.day,
                hourHiddenStems: baziInfo.hiddenStems.hour,
                elements,
                personality
            });
            
            initElementChart(elements);
            updateLunarCalendar();
            
            currentPillars = {
                year: baziInfo.year,
                month: baziInfo.month,
                day: baziInfo.day,
                hour: baziInfo.hour
            };
            
            displayScores();
            
            // 计算赌博运势
            const gamblingFortune = calculateGamblingFortune(birthData, Solar.fromYmdHms(
                parseInt(birthData.date.split('-')[0]),
                parseInt(birthData.date.split('-')[1]),
                parseInt(birthData.date.split('-')[2]),
                parseInt(birthData.time.split(':')[0]),
                parseInt(birthData.time.split(':')[1] || 0),
                0
            ).getLunar());
            
            gamblingRating.textContent = gamblingFortune.rating;
            gamblingDetails.innerHTML = `
                ${gamblingFortune.analysis}<br>
                最佳方位: ${gamblingFortune.direction}<br>
                最佳时段: ${gamblingFortune.hour}
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
