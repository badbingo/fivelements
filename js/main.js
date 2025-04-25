document.addEventListener('DOMContentLoaded', function() {
    // 缓存系统
    const baziCache = {
        // 使用本地存储模拟Redis缓存
        set: function(key, value, ttl = 3600) {
            const item = {
                value: value,
                expiry: Date.now() + ttl * 1000
            };
            localStorage.setItem(`bazi_${key}`, JSON.stringify(item));
        },
        get: function(key) {
            const itemStr = localStorage.getItem(`bazi_${key}`);
            if (!itemStr) return null;
            const item = JSON.parse(itemStr);
            if (Date.now() > item.expiry) {
                localStorage.removeItem(`bazi_${key}`);
                return null;
            }
            return item.value;
        }
    };

    // 兜底规则库
    const backupRules = {
        // 常见八字的正确排盘规则
        getBackupBazi: function(solar, gender) {
            // 这里可以添加常见八字的规则库
            return null; // 如果没有匹配规则，返回null
        },
        // 常见问题的标准回答
        getStandardAnswer: function(question, baziInfo) {
            const standardAnswers = {
                "身强身弱": `根据八字分析，日主${baziInfo.dayStem}${this.getStrengthDescription(baziInfo)}`,
                // 更多标准回答...
            };
            return standardAnswers[question] || null;
        },
        getStrengthDescription: function(baziInfo) {
            // 根据五行能量计算身强身弱
            const elements = calculateElementEnergy(baziInfo);
            const dayElement = getElement(baziInfo.dayStem);
            const dayElementValue = elements[['木','火','土','金','水'].indexOf(dayElement)];
            const total = elements.reduce((a,b) => a + b, 0);
            const ratio = dayElementValue / total;
            
            if (ratio > 0.35) return "身强，喜克泄耗";
            if (ratio < 0.15) return "身弱，喜生扶";
            return "中和，喜调候";
        }
    };

    // 生成唯一哈希值
    function generateBaziHash(birthData) {
        const str = `${birthData.date}_${birthData.time}_${birthData.gender}`;
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash.toString(16);
    }

    // 本地排盘校验
    function validateBaziResult(localBazi, apiBaziText) {
        // 从API返回文本中提取关键字段
        const extractedBazi = extractBaziFromText(apiBaziText);
        if (!extractedBazi) return false;
        
        // 比较关键字段
        const keyFields = ['yearStem', 'yearBranch', 'monthStem', 'monthBranch', 'dayStem', 'dayBranch'];
        for (const field of keyFields) {
            if (localBazi[field] !== extractedBazi[field]) {
                console.warn(`排盘不一致: 本地${field}=${localBazi[field]}, API=${extractedBazi[field]}`);
                return false;
            }
        }
        return true;
    }

    // 从API返回文本中提取八字信息
    function extractBaziFromText(text) {
        const patterns = [
            /年柱\[([^\]]+)\]月柱\[([^\]]+)\]日柱\[([^\]]+)\]时柱\[([^\]]+)\]/,
            /年柱([^\s]+)月柱([^\s]+)日柱([^\s]+)时柱([^\s]+)/,
            /年柱:([^\s]+)月柱:([^\s]+)日柱:([^\s]+)时柱:([^\s]+)/
        ];
        
        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) {
                const year = match[1].trim();
                const month = match[2].trim();
                const day = match[3].trim();
                const hour = match[4].trim();
                
                if (year.length === 2 && month.length === 2 && day.length === 2 && hour.length === 2) {
                    return {
                        yearStem: year[0],
                        yearBranch: year[1],
                        monthStem: month[0],
                        monthBranch: month[1],
                        dayStem: day[0],
                        dayBranch: day[1],
                        hourStem: hour[0],
                        hourBranch: hour[1]
                    };
                }
            }
        }
        return null;
    }

    // 混合模式获取八字分析
    async function getHybridBaziAnalysis(section, birthData, baziInfo) {
        const cacheKey = `${generateBaziHash(birthData)}_${section}`;
        
        // 1. 检查缓存
        const cachedResult = baziCache.get(cacheKey);
        if (cachedResult) {
            console.log(`从缓存获取${section}结果`);
            return cachedResult;
        }
        
        // 2. 对于排盘等基础信息，直接使用本地计算
        if (section === 'basic') {
            const result = formatBasicBaziResult(baziInfo);
            baziCache.set(cacheKey, result);
            return result;
        }
        
        // 3. 对于复杂分析，调用API但增加校验
        try {
            const apiResult = await getBaziAnalysisFromAPI(section, birthData, baziInfo);
            
            // 4. 校验结果质量
            if (!isAnalysisResultValid(apiResult, section)) {
                console.warn(`API返回结果质量不佳，尝试使用兜底规则`);
                const backupResult = backupRules.getStandardAnswer(section, baziInfo);
                if (backupResult) {
                    baziCache.set(cacheKey, backupResult);
                    return backupResult;
                }
            }
            
            // 5. 缓存并返回API结果
            baziCache.set(cacheKey, apiResult);
            return apiResult;
        } catch (error) {
            console.error(`API请求失败: ${error}`);
            const backupResult = backupRules.getStandardAnswer(section, baziInfo);
            return backupResult || `暂时无法获取${section}的分析结果，请稍后重试`;
        }
    }

    // 格式化本地排盘结果为API兼容格式
    function formatBasicBaziResult(baziInfo) {
        return `
1 八字四柱：年柱[${baziInfo.yearStem}${baziInfo.yearBranch}] 月柱[${baziInfo.monthStem}${baziInfo.monthBranch}] 日柱[${baziInfo.dayStem}${baziInfo.dayBranch}] 时柱[${baziInfo.hourStem}${baziInfo.hourBranch}]
2 地支藏干：年支[${baziInfo.yearHiddenStems}] 月支[${baziInfo.monthHiddenStems}] 日支[${baziInfo.dayHiddenStems}] 时支[${baziInfo.hourHiddenStems}]
3 五行能量：[${baziInfo.elements.join(',')}]
4 命主性格：[${baziInfo.personality}]
`;
    }

    // 校验分析结果质量
    function isAnalysisResultValid(result, section) {
        if (!result || result.length < 50) return false;
        
        // 根据不同部分设置不同的校验规则
        switch(section) {
            case 'strength':
                return result.includes('日主') && (result.includes('身强') || result.includes('身弱'));
            case 'career':
                return result.includes('行业') || result.includes('职业');
            case 'wealth':
                return result.includes('财') || result.includes('富');
            default:
                return result.length > 100; // 默认要求一定长度
        }
    }

    // 修改后的API调用函数
    async function getBaziAnalysisFromAPI(section, data, baziInfo) {
        const apiUrl = 'https://api.deepseek.com/v1/chat/completions';
        const apiKey = 'sk-b2950087a9d5427392762814114b22a9';
        
        // 使用本地计算的八字信息作为基准
        const currentDateStr = currentDate.getFullYear() + '-' + 
                              (currentDate.getMonth() + 1).toString().padStart(2, '0') + '-' + 
                              currentDate.getDate().toString().padStart(2, '0');
        
        // 标准化提示词
        let prompt = `【八字专业分析规范】请严格遵循以下规则：
1. 基于以下八字信息进行分析
2. 回答需专业准确，避免模糊表述
3. 使用结构化格式返回结果

当前日期：${currentDateStr}
八字信息：
姓名：${data.name || '未提供'}
出生日期：${data.date}
出生时间：${data.time} 
性别：${data.gender === 'male' ? '男' : '女'}
八字：${baziInfo.yearStem}${baziInfo.yearBranch} ${baziInfo.monthStem}${baziInfo.monthBranch} ${baziInfo.dayStem}${baziInfo.dayBranch} ${baziInfo.hourStem}${baziInfo.hourBranch}
地支藏干：年${baziInfo.yearHiddenStems} 月${baziInfo.monthHiddenStems} 日${baziInfo.dayHiddenStems} 时${baziInfo.hourHiddenStems}
五行能量：木${baziInfo.elements[0]} 火${baziInfo.elements[1]} 土${baziInfo.elements[2]} 金${baziInfo.elements[3]} 水${baziInfo.elements[4]}

请分析：`;
        
        // 根据不同部分添加特定提示
        switch(section) {
            case 'strength':
                prompt += `日主身强身弱、喜用神和忌神分析，需包含：
- 日主得令、得地、得势情况
- 天干地支合化刑冲
- 特殊格局判断
- 喜用神和忌神结论`;
                break;
            case 'career':
                prompt += `适合的职业方向分析，需包含：
- 八字显示的先天职业倾向
- 最适合的3-5个行业
- 事业发展建议`;
                break;
            // 其他部分类似...
            default:
                prompt += section;
        }
        
        // 添加输出格式要求
        prompt += "\n\n返回格式要求：使用Markdown格式，段落清晰，重要结论高亮显示";

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "deepseek-chat",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.3,  // 适当降低随机性
                seed: generateBaziHash(data)  // 使用相同seed确保相同输入得到相同输出
            })
        });
        
        if (!response.ok) throw new Error(`API请求失败: ${response.status}`);
        const result = await response.json();
        return result.choices[0].message.content;
    }

    // 修改后的calculateBtn点击事件处理
    calculateBtn.addEventListener('click', async function(e) {
        e.preventDefault();
        resetAllContent();
        
        // 获取输入数据
        const name = document.getElementById('name').value;
        const birthDate = document.getElementById('birth-date').value;
        const birthTime = birthTimeInput.value;
        const gender = document.getElementById('gender').value;
        
        // 验证输入
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
        
        // 准备出生数据
        birthData = { 
            name, 
            date: birthDate,
            time: birthTime, 
            gender: gender
        };
        
        // 保存到历史记录
        saveProfile(birthData);
        
        // 显示加载状态
        calculateBtn.disabled = true;
        calculateBtn.innerHTML = '<span class="loading"></span> 量子测算中...';
        
        try {
            // 显示加载覆盖层
            const loadingOverlay = document.createElement('div');
            loadingOverlay.className = 'loading-overlay';
            loadingOverlay.innerHTML = `
                <div class="loading"></div>
                <p>量子计算引擎启动中...</p>
            `;
            document.body.appendChild(loadingOverlay);
            
            // 1. 本地计算八字
            const localBazi = calculateBaziLocally(birthData);
            
            // 2. 检查是否有兜底规则
            const backupBazi = backupRules.getBackupBazi(
                Solar.fromYmdHms(
                    parseInt(birthData.date.split('-')[0]),
                    parseInt(birthData.date.split('-')[1]),
                    parseInt(birthData.date.split('-')[2]),
                    parseInt(birthData.time.split(':')[0]),
                    parseInt(birthData.time.split(':')[1] || 0),
                    0
                ),
                birthData.gender
            );
            
            // 3. 合并结果（优先使用本地计算）
            const finalBazi = backupBazi ? {...localBazi, ...backupBazi} : localBazi;
            
            // 4. 显示基本信息
            displayBasicInfo(finalBazi);
            initElementChart(finalBazi.elements);
            updateLunarCalendar();
            
            // 5. 设置当前八字信息
            currentPillars = {
                year: finalBazi.yearStem + finalBazi.yearBranch,
                month: finalBazi.monthStem + finalBazi.monthBranch,
                day: finalBazi.dayStem + finalBazi.dayBranch,
                hour: finalBazi.hourStem + finalBazi.hourBranch
            };
            
            // 6. 显示分数和运势
            displayScores();
            gamblingRating.textContent = finalBazi.gamblingFortune.rating;
            gamblingDetails.innerHTML = `
                ${finalBazi.gamblingFortune.analysis}<br>
                最佳方位: ${finalBazi.gamblingFortune.direction}<br>
                最佳时段: ${finalBazi.gamblingFortune.hour}
            `;
            
            // 7. 显示结果区域
            inputSection.style.display = 'none';
            resultSection.style.display = 'block';
            
            // 8. 初始化加载按钮
            initLoadButtons();
            
            window.scrollTo(0, 0);
        } catch (error) {
            console.error('测算失败:', error);
            alert('量子测算失败，请稍后重试');
        } finally {
            // 移除加载状态
            if (document.querySelector('.loading-overlay')) {
                document.body.removeChild(document.querySelector('.loading-overlay'));
            }
            calculateBtn.disabled = false;
            calculateBtn.innerHTML = '<i class="fas fa-brain"></i> 开始量子测算';
        }
    });

    // 修改后的initLoadButtons函数
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
                
                // 显示进度条
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
                    // 使用混合模式获取分析结果
                    const result = await getHybridBaziAnalysis(section, birthData, {
                        ...currentPillars,
                        yearStem: currentPillars.year[0],
                        yearBranch: currentPillars.year[1],
                        monthStem: currentPillars.month[0],
                        monthBranch: currentPillars.month[1],
                        dayStem: currentPillars.day[0],
                        dayBranch: currentPillars.day[1],
                        hourStem: currentPillars.hour[0],
                        hourBranch: currentPillars.hour[1],
                        elements: calculateElementEnergy(currentPillars),
                        personality: getPersonalityTraits(currentPillars.day[0])
                    });
                    
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

    // 修改后的getBaziAnswer函数
    async function getBaziAnswer(question) {
        const cacheKey = `qa_${generateBaziHash(birthData)}_${question}`;
        
        // 检查缓存
        const cachedAnswer = baziCache.get(cacheKey);
        if (cachedAnswer) return cachedAnswer;
        
        // 检查标准回答
        const standardAnswer = backupRules.getStandardAnswer(question, {
            ...currentPillars,
            dayStem: currentPillars.day[0],
            // 其他需要的字段...
        });
        
        if (standardAnswer) {
            baziCache.set(cacheKey, standardAnswer);
            return standardAnswer;
        }
        
        // 调用API获取回答
        try {
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
                    temperature: 0.3,  // 降低随机性
                    seed: generateBaziHash(birthData)  // 固定seed
                })
            });
            
            if (!response.ok) throw new Error(`API请求失败: ${response.status}`);
            
            const result = await response.json();
            const answer = result.choices[0].message.content;
            
            // 缓存回答
            baziCache.set(cacheKey, answer);
            return answer;
        } catch (error) {
            console.error('获取回答失败:', error);
            return '获取回答失败，请稍后重试。根据八字分析，' + 
                   (standardAnswer || '此问题暂时无法回答，请尝试其他问题。');
        }
    }

    // 保留其他原有函数...
    // calculateElementEnergy, getPersonalityTraits, displayBasicInfo等函数保持不变
    // 只需要将原本调用getBaziAnalysis的地方替换为getHybridBaziAnalysis

    // 初始化
    updateLunarCalendar();
    loadSavedProfiles();
});
