document.addEventListener('DOMContentLoaded', function() {
    // 缓存对象
    const baziCache = {};
    // 兜底规则库
    const fallbackRules = {
        // 示例：庚子年戊寅月壬午日丙午时
        "庚子戊寅壬午丙午": {
            "yearHiddenStems": "癸",
            "monthHiddenStems": "甲丙戊",
            "dayHiddenStems": "丁己",
            "hourHiddenStems": "丁己"
        }
    };
    
    // 其他原有变量声明...
    const calculateBtn = document.getElementById('calculate-btn');
    const recalculateBtn = document.getElementById('recalculate-btn');
    // ...其他原有变量声明保持不变...

    // 新增函数：生成缓存键
    function generateCacheKey(birthData, pillars) {
        const dateHash = CryptoJS.SHA256(`${birthData.date}${birthData.time}${birthData.gender}`).toString();
        if (pillars) {
            return `${pillars.year}${pillars.month}${pillars.day}${pillars.hour}:${dateHash}`;
        }
        return dateHash;
    }

    // 新增函数：校验排盘结果
    function validateBaziResult(apiResult, localResult) {
        // 校验四柱是否一致
        const pillarsMatch = 
            apiResult.yearStem === localResult.yearStem &&
            apiResult.yearBranch === localResult.yearBranch &&
            apiResult.monthStem === localResult.monthStem &&
            apiResult.monthBranch === localResult.monthBranch &&
            apiResult.dayStem === localResult.dayStem &&
            apiResult.dayBranch === localResult.dayBranch &&
            apiResult.hourStem === localResult.hourStem &&
            apiResult.hourBranch === localResult.hourBranch;
        
        // 校验藏干是否合理
        const hiddenStemsValid = 
            validateHiddenStems(apiResult.yearHiddenStems, localResult.yearBranch) &&
            validateHiddenStems(apiResult.monthHiddenStems, localResult.monthBranch) &&
            validateHiddenStems(apiResult.dayHiddenStems, localResult.dayBranch) &&
            validateHiddenStems(apiResult.hourHiddenStems, localResult.hourBranch);
        
        return pillarsMatch && hiddenStemsValid;
    }

    // 新增函数：校验藏干
    function validateHiddenStems(hiddenStems, branch) {
        const validStemsMap = {
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
        
        if (!hiddenStems) return false;
        
        const validStems = validStemsMap[branch] || [];
        const stems = hiddenStems.split('').filter(c => c.trim() !== '');
        
        // 检查每个藏干是否在有效范围内
        return stems.every(stem => validStems.includes(stem));
    }

    // 修改后的calculateBaziLocally函数
    function calculateBaziLocally(birthData) {
        try {
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
            
            // 修正藏干计算
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
                gamblingFortune,
                solarDate: solar.toString(),
                lunarDate: lunar.toString()
            };
        } catch (error) {
            console.error('本地排盘计算错误:', error);
            return null;
        }
    }

    // 修改后的getBaziAnalysis函数
    async function getBaziAnalysis(section, data) {
        // 生成缓存键
        const cacheKey = generateCacheKey(data, currentPillars);
        
        // 检查缓存
        if (baziCache[cacheKey] && baziCache[cacheKey][section]) {
            return baziCache[cacheKey][section];
        }
        
        // 先进行本地排盘
        const localResult = calculateBaziLocally(data);
        if (!localResult) {
            throw new Error('本地排盘计算失败');
        }
        
        // 准备API请求
        const apiUrl = 'https://api.deepseek.com/v1/chat/completions';
        const apiKey = 'sk-b2950087a9d5427392762814114b22a9';
        const currentDateStr = currentDate.getFullYear() + '-' + 
                              (currentDate.getMonth() + 1).toString().padStart(2, '0') + '-' + 
                              currentDate.getDate().toString().padStart(2, '0');
        
        // 构建prompt（原有逻辑保持不变）
        let prompt = `【八字排盘专业算法规范】...`; // 原有prompt构建逻辑
        
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
                })
            });
            
            if (!response.ok) throw new Error(`API请求失败: ${response.status}`);
            const result = await response.json();
            const apiContent = result.choices[0].message.content;
            
            // 提取关键字段
            const extractedData = extractKeyData(apiContent, localResult);
            
            // 校验API结果
            if (!validateBaziResult(extractedData, localResult)) {
                console.warn('API结果校验失败，使用本地计算结果');
                // 使用兜底规则库或本地计算结果
                const fallbackKey = `${localResult.yearStem}${localResult.yearBranch}${localResult.monthStem}${localResult.monthBranch}${localResult.dayStem}${localResult.dayBranch}${localResult.hourStem}${localResult.hourBranch}`;
                if (fallbackRules[fallbackKey]) {
                    Object.assign(localResult, fallbackRules[fallbackKey]);
                }
                
                // 根据section生成不同的返回内容
                return generateFallbackContent(section, localResult);
            }
            
            // 缓存结果
            if (!baziCache[cacheKey]) {
                baziCache[cacheKey] = {};
            }
            baziCache[cacheKey][section] = apiContent;
            
            return apiContent;
        } catch (error) {
            console.error(`获取${section}分析失败:`, error);
            
            // API失败时使用本地生成的兜底内容
            return generateFallbackContent(section, localResult);
        }
    }

    // 新增函数：提取关键数据
    function extractKeyData(content, localResult) {
        // 尝试从API返回内容中提取关键数据
        const extracted = {
            yearStem: localResult.yearStem,
            yearBranch: localResult.yearBranch,
            monthStem: localResult.monthStem,
            monthBranch: localResult.monthBranch,
            dayStem: localResult.dayStem,
            dayBranch: localResult.dayBranch,
            hourStem: localResult.hourStem,
            hourBranch: localResult.hourBranch,
            yearHiddenStems: localResult.yearHiddenStems,
            monthHiddenStems: localResult.monthHiddenStems,
            dayHiddenStems: localResult.dayHiddenStems,
            hourHiddenStems: localResult.hourHiddenStems
        };
        
        // 尝试从内容中提取四柱信息
        const pillarRegex = /年柱\[([^\]]+)\] 月柱\[([^\]]+)\] 日柱\[([^\]]+)\] 时柱\[([^\]]+)\]/;
        const pillarMatch = content.match(pillarRegex);
        if (pillarMatch) {
            const [_, yearPillar, monthPillar, dayPillar, hourPillar] = pillarMatch;
            extracted.yearStem = yearPillar.charAt(0);
            extracted.yearBranch = yearPillar.charAt(1);
            extracted.monthStem = monthPillar.charAt(0);
            extracted.monthBranch = monthPillar.charAt(1);
            extracted.dayStem = dayPillar.charAt(0);
            extracted.dayBranch = dayPillar.charAt(1);
            extracted.hourStem = hourPillar.charAt(0);
            extracted.hourBranch = hourPillar.charAt(1);
        }
        
        // 尝试从内容中提取藏干信息
        const hiddenStemRegex = /年支\[([^\]]+)\] 月支\[([^\]]+)\] 日支\[([^\]]+)\] 时支\[([^\]]+)\]/;
        const hiddenStemMatch = content.match(hiddenStemRegex);
        if (hiddenStemMatch) {
            const [_, yearHidden, monthHidden, dayHidden, hourHidden] = hiddenStemMatch;
            extracted.yearHiddenStems = yearHidden;
            extracted.monthHiddenStems = monthHidden;
            extracted.dayHiddenStems = dayHidden;
            extracted.hourHiddenStems = hourHidden;
        }
        
        return extracted;
    }

    // 新增函数：生成兜底内容
    function generateFallbackContent(section, localResult) {
        switch(section) {
            case 'basic':
                return `
年柱[${localResult.yearStem}${localResult.yearBranch}] 月柱[${localResult.monthStem}${localResult.monthBranch}] 
日柱[${localResult.dayStem}${localResult.dayBranch}] 时柱[${localResult.hourStem}${localResult.hourBranch}]
年支[${localResult.yearHiddenStems}] 月支[${localResult.monthHiddenStems}] 
日支[${localResult.dayHiddenStems}] 时支[${localResult.hourHiddenStems}]
五行能量：[${localResult.elements.join(',')}]
命主性格：[${localResult.personality}]
`;
            case 'strength':
                return `## 日主强弱分析 (本地计算)
**日主得令情况**: ${getSeasonStrength(localResult.dayStem, localResult.monthBranch)}
**五行平衡**: ${getElementBalance(localResult.elements)}
**特殊格局**: ${getSpecialPattern(localResult)}
**喜用神**: ${getFavorableElements(localResult)}`;
            // 其他section的兜底内容...
            default:
                return `【本地计算结果】${section}分析内容暂不可用，请稍后重试或联系客服。`;
        }
    }

    // 新增辅助函数：获取季节强度
    function getSeasonStrength(dayStem, monthBranch) {
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
        
        return seasonMap[dayStem] && seasonMap[dayStem].includes(monthBranch) 
            ? "得令 (日主生于旺季)" 
            : "不得令 (日主生于淡季)";
    }

    // 新增辅助函数：获取五行平衡
    function getElementBalance(elements) {
        const max = Math.max(...elements);
        const min = Math.min(...elements);
        const diff = max - min;
        
        if (diff <= 1) return "五行均衡 (各元素分布均匀)";
        if (diff <= 2) return "五行基本平衡 (略有偏重)";
        if (diff <= 3) return "五行不平衡 (有明显偏重)";
        return "五行严重失衡 (某元素极度旺盛或衰弱)";
    }

    // 新增辅助函数：获取特殊格局
    function getSpecialPattern(result) {
        const pillars = {
            year: result.yearStem + result.yearBranch,
            month: result.monthStem + result.monthBranch,
            day: result.dayStem + result.dayBranch,
            hour: result.hourStem + result.hourBranch
        };
        
        if (isCongGe(pillars)) return "从格 (日主极旺或极弱)";
        if (isZhuanWangGe(pillars)) return "专旺格 (某一行特别旺盛)";
        return "普通格局 (无明显特殊格局)";
    }

    // 新增辅助函数：获取喜用神
    function getFavorableElements(result) {
        // 简化版的喜用神判断逻辑
        const dayStem = result.dayStem;
        const elements = result.elements;
        const elementNames = ['木', '火', '土', '金', '水'];
        
        // 找出最弱和最旺的元素
        const maxIndex = elements.indexOf(Math.max(...elements));
        const minIndex = elements.indexOf(Math.min(...elements));
        
        // 简单规则：补弱抑强
        return `宜补${elementNames[minIndex]}，忌${elementNames[maxIndex]}`;
    }

    // 修改后的calculateBtn点击事件处理函数
    calculateBtn.addEventListener('click', async function(e) {
        e.preventDefault();
        resetAllContent();
        
        // 验证输入数据
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
        
        // 日期有效性检查（原有逻辑保持不变）
        // ...
        
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
            
            // 本地计算八字
            const baziInfo = calculateBaziLocally(birthData);
            if (!baziInfo) {
                throw new Error('本地排盘计算失败');
            }
            
            // 显示基本信息
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
