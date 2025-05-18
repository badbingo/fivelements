document.addEventListener('DOMContentLoaded', function() {
    const calculateBtn = document.getElementById('calculate-btn');
    const recalculateBtn = document.getElementById('recalculate-btn');
    const inputSection = document.getElementById('input-section');
    const resultSection = document.getElementById('result-section');
    const apiStatus = document.getElementById('api-status');
    
    // 八字四柱元素
    const maleYearStem = document.getElementById('male-year-stem');
    const maleYearBranch = document.getElementById('male-year-branch');
    const maleMonthStem = document.getElementById('male-month-stem');
    const maleMonthBranch = document.getElementById('male-month-branch');
    const maleDayStem = document.getElementById('male-day-stem');
    const maleDayBranch = document.getElementById('male-day-branch');
    const maleHourStem = document.getElementById('male-hour-stem');
    const maleHourBranch = document.getElementById('male-hour-branch');
    
    const femaleYearStem = document.getElementById('female-year-stem');
    const femaleYearBranch = document.getElementById('female-year-branch');
    const femaleMonthStem = document.getElementById('female-month-stem');
    const femaleMonthBranch = document.getElementById('female-month-branch');
    const femaleDayStem = document.getElementById('female-day-stem');
    const femaleDayBranch = document.getElementById('female-day-branch');
    const femaleHourStem = document.getElementById('female-hour-stem');
    const femaleHourBranch = document.getElementById('female-hour-branch');
    
    // 合婚评分元素
    const compatibilityScore = document.getElementById('compatibility-score');
    const compatibilityMeter = document.getElementById('compatibility-meter');
    const recommendation = document.getElementById('recommendation');
    
    const currentDate = new Date(2025, 3, 3);
    let maleData = {};
    let femaleData = {};
    let loadedSections = {};
    let analysisCache = {};
    
    // 配置marked.js
    marked.setOptions({
        breaks: true,
        gfm: true,
        tables: true
    });
    
    function showApiStatus(message, type = 'success') {
        apiStatus.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'times-circle'}"></i> ${message}`;
        apiStatus.className = `api-status ${type} show`;
        
        setTimeout(() => {
            apiStatus.classList.remove('show');
        }, 3000);
    }
    
    recalculateBtn.addEventListener('click', function() {
        // Reset form inputs
        document.getElementById('male-name').value = '';
        document.getElementById('male-birth-date').value = '';
        document.getElementById('male-birth-time').value = '';
        document.getElementById('female-name').value = '';
        document.getElementById('female-birth-date').value = '';
        document.getElementById('female-birth-time').value = '';
        
        // Reset UI state
        resultSection.style.display = 'none';
        inputSection.style.display = 'block';
        
        // Reset all content and loading states
        resetAllContent();
        
        // Reset data
        maleData = {};
        femaleData = {};
        loadedSections = {};
        analysisCache = {};
        
        // Scroll to top
        window.scrollTo(0, 0);
    });
    
    function resetAllContent() {
        // Reset Bazi display
        maleYearStem.textContent = '';
        maleYearBranch.textContent = '';
        maleMonthStem.textContent = '';
        maleMonthBranch.textContent = '';
        maleDayStem.textContent = '';
        maleDayBranch.textContent = '';
        maleHourStem.textContent = '';
        maleHourBranch.textContent = '';
        
        femaleYearStem.textContent = '';
        femaleYearBranch.textContent = '';
        femaleMonthStem.textContent = '';
        femaleMonthBranch.textContent = '';
        femaleDayStem.textContent = '';
        femaleDayBranch.textContent = '';
        femaleHourStem.textContent = '';
        femaleHourBranch.textContent = '';
        
        // Reset compatibility score
        compatibilityScore.textContent = '-';
        compatibilityMeter.style.width = '0%';
        recommendation.className = 'recommendation';
        recommendation.innerHTML = '<i class="fas fa-heart"></i> 分析中...';
        
        // Reset all section content
        document.querySelectorAll('.section-content').forEach(el => {
            el.innerHTML = '';
            el.classList.remove('active');
            el.style.minHeight = '0';
        });
        
        // Reset all load buttons
        document.querySelectorAll('.load-btn').forEach(btn => {
            btn.innerHTML = `
                <span>
                    <i class="fas fa-${btn.getAttribute('data-section') === 'basic-analysis' ? 'heartbeat' : 
                    btn.getAttribute('data-section') === 'element-analysis' ? 'yin-yang' : 
                    btn.getAttribute('data-section') === 'god-analysis' ? 'star' : 
                    btn.getAttribute('data-section') === 'male-fate' ? 'mars' : 
                    btn.getAttribute('data-section') === 'female-fate' ? 'venus' : 
                    btn.getAttribute('data-section') === 'strength-weakness' ? 'balance-scale' : 
                    btn.getAttribute('data-section') === 'improvement' ? 'hands-helping' : 'calendar-check'}"></i> 
                    ${btn.textContent.trim()}
                </span>
                <i class="fas fa-chevron-down toggle-icon"></i>`;
            btn.classList.remove('active');
            btn.disabled = false;
        });
        
        // Reset tabs
        document.querySelectorAll('.menu-tab').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.querySelector('.menu-tab[data-tab="compatibility"]').classList.add('active');
        document.getElementById('compatibility-tab').classList.add('active');
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
            button.addEventListener('click', async function(e) {
                e.preventDefault();
                
                const section = this.getAttribute('data-section');
                const contentElement = document.getElementById(`${section}-content`);
                const buttonText = this.querySelector('span').textContent.trim();
                const cacheKey = `${maleData.date}-${maleData.time}-${femaleData.date}-${femaleData.time}-${section}`;

                // 1. Check if content already exists (toggle visibility)
                if (contentElement.innerHTML.trim() !== '') {
                    // Toggle the active class for both button and content
                    this.classList.toggle('active');
                    contentElement.classList.toggle('active');
                    
                    // Toggle the chevron icon
                    const icon = this.querySelector('.toggle-icon');
                    icon.classList.toggle('fa-chevron-down');
                    icon.classList.toggle('fa-chevron-up');
                    return;
                }

                // 2. Check cache
                if (analysisCache[cacheKey]) {
                    contentElement.innerHTML = analysisCache[cacheKey];
                    contentElement.classList.add('active');
                    this.classList.add('active');
                    this.querySelector('.toggle-icon').classList.add('fa-chevron-up');
                    this.querySelector('.toggle-icon').classList.remove('fa-chevron-down');
                    return;
                }

                // 3. Set loading state
                this.disabled = true;
                this.innerHTML = `
                    <span>
                        <span class="loading-spinner" style="
                            display: inline-block;
                            width: 14px;
                            height: 14px;
                            border: 2px solid rgba(230,43,30,0.2);
                            border-top-color: #E62B1E;
                            border-radius: 50%;
                            animation: spin 1s linear infinite;
                            margin-right: 8px;
                            vertical-align: middle;
                        "></span>
                        ${buttonText}
                    </span>
                    <i class="fas fa-chevron-down toggle-icon"></i>
                `;

                // 4. Show content loading effect
                contentElement.innerHTML = `
                    <div class="loading-overlay" style="
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: rgba(255,255,255,0.85);
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        z-index: 10;
                        backdrop-filter: blur(3px);
                        border-radius: 0 0 12px 12px;
                    ">
                        <div style="
                            width: 40px;
                            height: 40px;
                            border: 4px solid rgba(230,43,30,0.2);
                            border-top-color: #E62B1E;
                            border-radius: 50%;
                            animation: spin 1s linear infinite;
                            margin-bottom: 15px;
                        "></div>
                        <div style="
                            color: #E62B1E;
                            font-size: 1.1rem;
                            font-weight: 500;
                        ">合婚数据库解索中，请耐心等待...</div>
                    </div>
                `;
                contentElement.style.position = 'relative';
                contentElement.style.minHeight = '200px';

                try {
                    // 5. Get analysis data
                    const result = await getMarriageAnalysis(section, maleData, femaleData);
                    
                    // 6. Process result
                    analysisCache[cacheKey] = result;
                    displaySectionContent(section, result, contentElement, this);
                    
                } catch (error) {
                    console.error(`加载${section}失败:`, error);
                    
                    // 8. Error handling
                    contentElement.innerHTML = `
                        <div class="error-message" style="
                            padding: 20px;
                            color: var(--fire-color);
                            text-align: center;
                        ">
                            <i class="fas fa-exclamation-triangle" style="font-size: 1.5rem; margin-bottom: 10px;"></i>
                            <p>加载失败，请<a href="#" onclick="location.reload()">刷新页面</a>重试</p>
                        </div>
                    `;
                    
                    this.disabled = false;
                    this.innerHTML = `
                        <span>
                            <i class="fas fa-${getSectionIcon(section)}"></i>
                            ${buttonText}
                        </span>
                        <i class="fas fa-chevron-down toggle-icon"></i>
                    `;
                }
            });
        });
    }

    function getSectionIcon(section) {
        const icons = {
            'basic-analysis': 'heartbeat',
            'element-analysis': 'yin-yang',
            'god-analysis': 'star',
            'male-fate': 'mars',
            'female-fate': 'venus',
            'strength-weakness': 'balance-scale',
            'improvement': 'hands-helping',
            'timing': 'calendar-check'
        };
        return icons[section] || 'info-circle';
    }
    
    function calculateBazi(birthDate, birthTime) {
        const [year, month, day] = birthDate.split('-').map(Number);
        const [hour, minute] = birthTime.split(':').map(Number);
        
        // 创建农历日期对象
        const lunar = Lunar.fromDate(new Date(year, month - 1, day, hour, minute));
        
        // 获取八字信息
        const bazi = lunar.getEightChar();
        
        return {
            year: {
                stem: bazi.getYearGan(),
                branch: bazi.getYearZhi()
            },
            month: {
                stem: bazi.getMonthGan(),
                branch: bazi.getMonthZhi()
            },
            day: {
                stem: bazi.getDayGan(),
                branch: bazi.getDayZhi()
            },
            hour: {
                stem: bazi.getTimeGan(),
                branch: bazi.getTimeZhi()
            }
        };
    }
    
    function calculateCompatibilityScore(maleData, femaleData) {
        // 使用双方出生日期和时间作为种子
        const seed = `${maleData.date}-${maleData.time}-${femaleData.date}-${femaleData.time}`;
        
        // 创建确定性哈希值
        let hash = 0;
        for (let i = 0; i < seed.length; i++) {
            const char = seed.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // 转换为32位整数
        }
        
        // 使用哈希值生成确定性评分 (60-95之间)
        const score = 60 + Math.abs(hash) % 36;
        
        return score;
    }
    
    function updateCompatibilityScore(score) {
        score = parseInt(score);
        if (isNaN(score)) {
            score = 50;
        }
        score = Math.max(0, Math.min(100, score));
        
        compatibilityScore.textContent = score;
        compatibilityMeter.style.width = `${score}%`;
        
        if (score >= 80) {
            recommendation.className = 'recommendation good-match';
            recommendation.innerHTML = '<i class="fas fa-heart"></i> 八字高度匹配 - 双方非常合适';
        } else if (score >= 60) {
            recommendation.className = 'recommendation medium-match';
            recommendation.innerHTML = '<i class="fas fa-handshake"></i> 八字匹配良好 - 需要少量调和';
        } else {
            recommendation.className = 'recommendation bad-match';
            recommendation.innerHTML = '<i class="fas fa-exclamation-triangle"></i> 八字匹配度低 - 需要谨慎考虑';
        }
        
        animateScore(score);
    }
    
    function animateScore(targetScore) {
        let currentScore = 0;
        const increment = Math.ceil(targetScore / 20);
        const scoreInterval = setInterval(() => {
            currentScore += increment;
            if (currentScore >= targetScore) {
                currentScore = targetScore;
                clearInterval(scoreInterval);
            }
            compatibilityScore.textContent = currentScore;
            compatibilityMeter.style.width = `${currentScore}%`;
        }, 50);
    }
    
    function displaySectionContent(section, result, contentElement, buttonElement) {
        // Remove loading effect
        contentElement.classList.remove('loading-effect');
        contentElement.style.minHeight = '0';
        contentElement.style.overflow = 'hidden';
        
        // Parse Markdown content
        const htmlContent = marked.parse(result);
        contentElement.innerHTML = htmlContent;
        
        // Standardize table styles
        contentElement.querySelectorAll('table').forEach(table => {
            table.classList.add('markdown-table');
            table.style.width = '100%';
        });
        
        // Add print button
        const printBtn = document.createElement('button');
        printBtn.innerHTML = '<i class="fas fa-print"></i> 打印此内容';
        printBtn.className = 'load-btn print-btn';
        printBtn.style.cssText = `
            display: block;
            margin: 25px auto 10px;
            padding: 12px 25px;
            background: linear-gradient(to right, #6a3093, #a044ff);
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.3s;
        `;

        printBtn.addEventListener('mouseover', () => {
            printBtn.style.transform = 'translateY(-2px)';
            printBtn.style.boxShadow = '0 5px 15px rgba(106, 48, 147, 0.3)';
        });

        printBtn.addEventListener('mouseout', () => {
            printBtn.style.transform = 'none';
            printBtn.style.boxShadow = 'none';
        });

        printBtn.addEventListener('click', () => {
            const printWindow = window.open('', '_blank');
            const printContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>${document.title} - ${section}</title>
                    <style>
                        body {
                            font-family: 'Noto Sans SC', 'Microsoft YaHei', sans-serif;
                            padding: 20px;
                            line-height: 1.6;
                            color: #333;
                        }
                        h2 {
                            color: #6a3093;
                            text-align: center;
                            border-bottom: 1px solid #eee;
                            padding-bottom: 10px;
                        }
                        table {
                            width: 100%;
                            border-collapse: collapse;
                            margin: 15px 0;
                            page-break-inside: avoid;
                        }
                        th, td {
                            padding: 10px;
                            border: 1px solid #ddd;
                        }
                        th {
                            background-color: #f5f5f5;
                        }
                        .print-footer {
                            margin-top: 30px;
                            text-align: center;
                            color: #999;
                            font-size: 12px;
                        }
                    </style>
                </head>
                <body>
                    <h2>${document.querySelector('.header-title').textContent}</h2>
                    <h3 style="text-align:center">${buttonElement.querySelector('span').textContent.trim()}</h3>
                    ${contentElement.innerHTML}
                    <div class="print-footer">
                        打印时间：${new Date().toLocaleString('zh-CN')}
                    </div>
                    <script>
                        window.onafterprint = function() {
                            setTimeout(function() {
                                window.close();
                            }, 300);
                        };
                        setTimeout(function() {
                            window.print();
                            setTimeout(function() {
                                try { window.close(); } catch(e) {}
                            }, 3000);
                        }, 200);
                    </script>
                </body>
                </html>
            `;

            printWindow.document.open();
            printWindow.document.write(printContent);
            printWindow.document.close();

            if (!printWindow || printWindow.closed) {
                alert('请允许弹出窗口以使用打印功能');
                return;
            }
        });

        contentElement.appendChild(printBtn);
        
        // Set button to active state
        buttonElement.disabled = false;
        buttonElement.classList.add('active');
        buttonElement.innerHTML = `
            <span>
                <i class="fas fa-${getSectionIcon(section)}"></i>
                ${buttonElement.querySelector('span').textContent.trim()}
            </span>
            <i class="fas fa-chevron-up toggle-icon"></i>
        `;
        
        // Show content with animation
        setTimeout(() => {
            contentElement.style.minHeight = `${contentElement.scrollHeight}px`;
            contentElement.classList.add('active');
        }, 10);
    }
    
    async function getMarriageAnalysis(section, maleData, femaleData) {
        const apiUrl = 'https://api.deepseek.com/v1/chat/completions';
        const apiKey = 'sk-b2950087a9d5427392762814114b22a9';
        
        const cacheKey = `${maleData.date}-${maleData.time}-${femaleData.date}-${femaleData.time}-${section}`;
        if (analysisCache[cacheKey]) {
            return analysisCache[cacheKey];
        }
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        
        const currentDateStr = '2025年4月3日';
        
        let prompt = `当前日期：${currentDateStr}\n根据以下双方八字信息进行八字排盘：
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
5. 分析流年，流月，流日时，先按照命主八字，大运，流年，算出格局强弱，再进行分析
            
男方信息：
姓名：${maleData.name || '未提供'}
出生日期：${maleData.date}
出生时间：${maleData.time}
时区偏移：${maleData.timezoneOffset}分钟

女方信息：
姓名：${femaleData.name || '未提供'}
出生日期：${femaleData.date}
出生时间：${femaleData.time}
时区偏移：${femaleData.timezoneOffset}分钟

`;

        switch(section) {
            case 'basic':
                prompt += `请返回以下信息：
1 男方八字：年柱[内容] 月柱[内容] 日柱[内容] 时柱[内容]
2 女方八字：年柱[内容] 月柱[内容] 日柱[内容] 时柱[内容]

用简洁格式返回，不要分析内容，不要使用任何符号如#*、等。`;
                break;
            case 'basic-analysis':
                prompt += `分析双方八字的基本匹配程度：
1 天干地支的相生相克关系
2 日柱的合冲关系
3 年柱、月柱的匹配情况
4 综合分析结论

返回格式：
天干关系：[表格方式详细分析]
地支关系：[表格方式详细分析]
日柱分析：[表格方式详细分析]
综合结论：[表格方式详细分析]`;
                break;
            case 'element-analysis':
                prompt += `分析双方五行能量的互补情况：
1 双方五行分布对比
2 五行相生相克关系
3 是否能够相互调和
4 调候建议

返回格式：
五行对比：[表格方式详细分析]
互补情况：[表格方式详细分析]
调候建议：[表格方式详细建议]`;
                break;
            case 'god-analysis':
                prompt += `分析双方十神之间的相互关系：
1 十神配对分析（正官vs正印等）
2 十神相生相克关系
3 角色定位互补性
4 潜在矛盾点

返回格式：
十神配对：[表格方式详细分析]
相生相克：[表格方式详细分析]
互补分析：[表格方式详细分析]
矛盾分析：[表格方式详细分析]`;
                break;
            case 'male-fate':
                prompt += `分析男方八字命理特点：
1 命格分析（正官格、偏印格等）
2 五行喜忌
3 性格特点
4 事业财运分析

返回格式：
命格分析：[表格方式详细分析]
五行喜忌：[表格方式详细分析]
性格特点：[表格方式详细分析]
事业分析：[表格方式详细分析]`;
                break;
            case 'female-fate':
                prompt += `分析女方八字命理特点：
1 命格分析（正印格、食神格等）
2 五行喜忌
3 性格特点
4 婚姻家庭分析

返回格式：
命格分析：[表格方式详细分析]
五行喜忌：[表格方式详细分析]
性格特点：[表格方式详细分析]
婚姻分析：[表格方式详细分析]`;
                break;
            case 'strength-weakness':
                prompt += `分析这段婚姻关系的优劣势：
1 八字匹配的优势点
2 八字冲突的劣势点
3 潜在的危机年份
4 互补潜力

返回格式：
优势分析：[表格方式详细分析]
劣势分析：[表格方式详细分析]
危机年份：[表格方式年份列表]
互补潜力：[表格方式详细分析]`;
                break;
            case 'improvement':
                prompt += `提供婚姻关系改善建议：
1 五行调和建议
2 相处方式建议
3 重要年份注意事项
4 子女缘分分析

返回格式：
五行调和：[表格方式详细建议]
相处建议：[表格方式详细建议]
年份注意：[表格方式详细说明]
子女缘分：[表格方式详细分析]`;
                break;
            case 'timing':
                prompt += `分析最适合结婚的时机：
1 近3年婚运分析
2 最佳结婚年份
3 需要避开的年份
4 婚后运势走向

返回格式：
近期婚运：[表格方式详细分析]
最佳年份：[表格方式年份列表]
避开年份：[表格方式年份列表]
婚后运势：[表格方式详细分析]`;
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
                    temperature: 0.7
                }),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`API请求失败: ${response.status}`);
            }
            
            const result = await response.json();
            const content = result.choices[0].message.content;
            
            analysisCache[cacheKey] = content;
            
            return content;
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }
    
    calculateBtn.addEventListener('click', async function(e) {
        e.preventDefault();
        
        const maleName = document.getElementById('male-name').value;
        const maleBirthDate = document.getElementById('male-birth-date').value;
        const maleBirthTime = document.getElementById('male-birth-time').value;
        
        const femaleName = document.getElementById('female-name').value;
        const femaleBirthDate = document.getElementById('female-birth-date').value;
        const femaleBirthTime = document.getElementById('female-birth-time').value;
        
        if (!maleBirthDate || !maleBirthTime || !femaleBirthDate || !femaleBirthTime) {
            showApiStatus('请填写完整的出生信息', 'error');
            return;
        }
        
        const [maleYear, maleMonth, maleDay] = maleBirthDate.split('-');
        const maleHours = maleBirthTime.split(':')[0];
        const maleMinutes = maleBirthTime.split(':')[1];
        const maleBirthDateTime = new Date(maleYear, maleMonth-1, maleDay, maleHours, maleMinutes);
        const maleTimezoneOffset = maleBirthDateTime.getTimezoneOffset();
        
        maleData = { 
            name: maleName,
            date: `${maleYear}年${maleMonth}月${maleDay}日`,
            time: `${maleHours}时${maleMinutes}分`, 
            timezoneOffset: maleTimezoneOffset
        };
        
        const [femaleYear, femaleMonth, femaleDay] = femaleBirthDate.split('-');
        const femaleHours = femaleBirthTime.split(':')[0];
        const femaleMinutes = femaleBirthTime.split(':')[1];
        const femaleBirthDateTime = new Date(femaleYear, femaleMonth-1, femaleDay, femaleHours, femaleMinutes);
        const femaleTimezoneOffset = femaleBirthDateTime.getTimezoneOffset();
        
        femaleData = { 
            name: femaleName,
            date: `${femaleYear}年${femaleMonth}月${femaleDay}日`,
            time: `${femaleHours}时${femaleMinutes}分`, 
            timezoneOffset: femaleTimezoneOffset
        };
        
        calculateBtn.disabled = true;
        calculateBtn.innerHTML = '<span class="loading"></span> 测算中...';
        showApiStatus('开始测算，请稍候...', 'success');
        
        try {
            // 使用lunar.js计算八字
            const maleBazi = calculateBazi(maleBirthDate, maleBirthTime);
            const femaleBazi = calculateBazi(femaleBirthDate, femaleBirthTime);
            
            // 更新八字显示
            maleYearStem.textContent = maleBazi.year.stem;
            maleYearBranch.textContent = maleBazi.year.branch;
            maleMonthStem.textContent = maleBazi.month.stem;
            maleMonthBranch.textContent = maleBazi.month.branch;
            maleDayStem.textContent = maleBazi.day.stem;
            maleDayBranch.textContent = maleBazi.day.branch;
            maleHourStem.textContent = maleBazi.hour.stem;
            maleHourBranch.textContent = maleBazi.hour.branch;
            
            femaleYearStem.textContent = femaleBazi.year.stem;
            femaleYearBranch.textContent = femaleBazi.year.branch;
            femaleMonthStem.textContent = femaleBazi.month.stem;
            femaleMonthBranch.textContent = femaleBazi.month.branch;
            femaleDayStem.textContent = femaleBazi.day.stem;
            femaleDayBranch.textContent = femaleBazi.day.branch;
            femaleHourStem.textContent = femaleBazi.hour.stem;
            femaleHourBranch.textContent = femaleBazi.hour.branch;
            
            // 使用确定性算法计算合婚评分
            const score = calculateCompatibilityScore(maleData, femaleData);
            updateCompatibilityScore(score);
            
            inputSection.style.display = 'none';
            resultSection.style.display = 'block';
            calculateBtn.disabled = false;
            calculateBtn.innerHTML = '<i class="fas fa-heart"></i> 开始结婚测算';
            
            initLoadButtons();
            window.scrollTo(0, 0);
            
            showApiStatus('测算完成', 'success');
        } catch (error) {
            console.error('测算失败:', error);
            showApiStatus(`测算失败: ${error.message}`, 'error');
            calculateBtn.disabled = false;
            calculateBtn.innerHTML = '<i class="fas fa-heart"></i> 开始结婚测算';
        }
    });
    
    window.addEventListener('load', function() {
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0];
        document.getElementById('male-birth-date').value = dateStr;
        document.getElementById('female-birth-date').value = dateStr;
        
        document.getElementById('male-birth-time').value = '11:00';
        document.getElementById('female-birth-time').value = '11:00';
    });
});
