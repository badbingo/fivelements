document.addEventListener('DOMContentLoaded', function() {
    const calculateBtn = document.getElementById('calculate-btn');
    const recalculateBtn = document.getElementById('recalculate-btn');
    const inputSection = document.getElementById('input-section');
    const resultSection = document.getElementById('result-section');
    const apiStatus = document.getElementById('api-status');
    
    // 八字四柱元素1
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
        document.getElementById('male-name').value = '';
        document.getElementById('male-birth-date').value = '';
        document.getElementById('male-birth-time').value = '';
        document.getElementById('female-name').value = '';
        document.getElementById('female-birth-date').value = '';
        document.getElementById('female-birth-time').value = '';
        
        resultSection.style.display = 'none';
        inputSection.style.display = 'block';
        
        resetAllContent();
        
        window.scrollTo(0, 0);
    });
    
    function resetAllContent() {
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
        
        compatibilityScore.textContent = '-';
        compatibilityMeter.style.width = '0%';
        recommendation.className = 'recommendation';
        recommendation.innerHTML = '<i class="fas fa-heart"></i> 分析中...';
        
        document.querySelectorAll('.section-content').forEach(el => {
            el.innerHTML = '';
            el.classList.remove('active');
        });
        
        document.querySelectorAll('.load-btn').forEach(btn => {
            btn.innerHTML = `<span><i class="fas fa-${btn.getAttribute('data-section') === 'basic-analysis' ? 'heartbeat' : 
                            btn.getAttribute('data-section') === 'element-analysis' ? 'yin-yang' : 
                            btn.getAttribute('data-section') === 'god-analysis' ? 'star' : 
                            btn.getAttribute('data-section') === 'male-fate' ? 'mars' : 
                            btn.getAttribute('data-section') === 'female-fate' ? 'venus' : 
                            btn.getAttribute('data-section') === 'strength-weakness' ? 'balance-scale' : 
                            btn.getAttribute('data-section') === 'improvement' ? 'hands-helping' : 'calendar-check'}"></i> ${btn.textContent.trim()}</span><i class="fas fa-chevron-down toggle-icon"></i>`;
            btn.classList.remove('active');
            btn.disabled = false;
        });
        
        document.querySelectorAll('.menu-tab').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.querySelector('.menu-tab[data-tab="compatibility"]').classList.add('active');
        document.getElementById('compatibility-tab').classList.add('active');
        
        loadedSections = {};
        analysisCache = {};
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
            const contentElement = document.getElementById(`${section}-content`);
            
            button.addEventListener('click', async function(e) {
                e.preventDefault();
                
                const cacheKey = `${maleData.date}-${maleData.time}-${femaleData.date}-${femaleData.time}-${section}`;
                
                if (analysisCache[cacheKey]) {
                    contentElement.innerHTML = analysisCache[cacheKey];
                    contentElement.classList.toggle('active');
                    button.querySelector('.toggle-icon').classList.toggle('rotate-180');
                    return;
                }
                
                if (loadedSections[section]) {
                    contentElement.classList.toggle('active');
                    button.querySelector('.toggle-icon').classList.toggle('rotate-180');
                    return;
                }
                
                this.disabled = true;
                const buttonText = button.textContent.trim();
                button.innerHTML = `<span><span class="loading"></span> ${buttonText}</span><i class="fas fa-chevron-down toggle-icon"></i>`;
                
                const progressContainer = document.createElement('div');
                progressContainer.className = 'progress-container';
                progressContainer.innerHTML = '<div class="progress-bar"></div>';
                
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
                    const startTime = performance.now();
                    const result = await getMarriageAnalysis(section, maleData, femaleData);
                    const endTime = performance.now();
                    
                    clearInterval(progressInterval);
                    displaySectionContent(section, result, contentElement);
                    
                    analysisCache[cacheKey] = contentElement.innerHTML;
                    
                    button.innerHTML = `<span><i class="fas fa-${button.getAttribute('data-section') === 'basic-analysis' ? 'heartbeat' : 
                                  button.getAttribute('data-section') === 'element-analysis' ? 'yin-yang' : 
                                  button.getAttribute('data-section') === 'god-analysis' ? 'star' : 
                                  button.getAttribute('data-section') === 'male-fate' ? 'mars' : 
                                  button.getAttribute('data-section') === 'female-fate' ? 'venus' : 
                                  button.getAttribute('data-section') === 'strength-weakness' ? 'balance-scale' : 
                                  button.getAttribute('data-section') === 'improvement' ? 'hands-helping' : 'calendar-check'}"></i> ${buttonText}</span><i class="fas fa-chevron-down toggle-icon"></i>`;
                    button.disabled = false;
                    contentElement.classList.add('active');
                    loadedSections[section] = true;
                    
                } catch (error) {
                    console.error(`加载${section}失败:`, error);
                    clearInterval(progressInterval);
                    contentElement.innerHTML = '<p style="color:var(--fire-color)">加载失败，请重试</p>';
                    button.disabled = false;
                    button.innerHTML = `<span><i class="fas fa-${button.getAttribute('data-section') === 'basic-analysis' ? 'heartbeat' : 
                                  button.getAttribute('data-section') === 'element-analysis' ? 'yin-yang' : 
                                  button.getAttribute('data-section') === 'god-analysis' ? 'star' : 
                                  button.getAttribute('data-section') === 'male-fate' ? 'mars' : 
                                  button.getAttribute('data-section') === 'female-fate' ? 'venus' : 
                                  button.getAttribute('data-section') === 'strength-weakness' ? 'balance-scale' : 
                                  button.getAttribute('data-section') === 'improvement' ? 'hands-helping' : 'calendar-check'}"></i> ${buttonText}</span><i class="fas fa-chevron-down toggle-icon"></i>`;
                }
            });
        });
    }
    
    // 使用lunar.js计算八字
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
    
    // 确定性合婚评分算法
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
    
    function displaySectionContent(section, result, contentElement) {
    // 1. 清除旧内容和限制
    contentElement.innerHTML = '';
    contentElement.style.maxHeight = 'none';
    contentElement.style.overflow = 'visible';
    contentElement.classList.add('active');

    // 2. 解析Markdown内容
    const htmlContent = marked.parse(result);
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;

    // 3. 优化表格显示
    tempDiv.querySelectorAll('table').forEach(table => {
        table.classList.add('markdown-table');
        table.style.width = '100%';
        table.style.margin = '20px 0';
        table.style.borderCollapse = 'collapse';
        
        // 确保表头有背景色
        if (!table.querySelector('th')) {
            const firstRow = table.querySelector('tr');
            if (firstRow) {
                firstRow.querySelectorAll('td').forEach(td => {
                    const th = document.createElement('th');
                    th.innerHTML = td.innerHTML;
                    th.style.backgroundColor = '#f8f9fa';
                    td.replaceWith(th);
                });
            }
        }
    });

    // 4. 处理其他内容样式
    tempDiv.querySelectorAll('pre').forEach(pre => {
        pre.style.overflowX = 'auto';
        pre.style.backgroundColor = '#f8f9fa';
        pre.style.padding = '15px';
        pre.style.borderRadius = '6px';
    });

    // 5. 创建内容容器
    const contentContainer = document.createElement('div');
    contentContainer.className = 'full-content';
    contentContainer.appendChild(tempDiv);

    // 6. 添加到DOM
    contentElement.appendChild(contentContainer);

    // 7. 添加打印按钮
    addPrintButton(section, contentElement, contentContainer.innerHTML);

    // 8. 触发高度重计算（用于动画）
    setTimeout(() => {
        contentElement.style.maxHeight = `${contentElement.scrollHeight}px`;
    }, 10);
}

/**
 * 添加打印按钮
 * @param {string} section - 章节ID 
 * @param {HTMLElement} container - 内容容器
 * @param {string} contentHTML - 要打印的HTML内容
 */
function addPrintButton(section, container, contentHTML) {
    // 移除旧的打印按钮（如果存在）
    const oldBtn = container.querySelector('.print-btn');
    if (oldBtn) oldBtn.remove();

    // 创建新按钮
    const printBtn = document.createElement('button');
    printBtn.className = 'load-btn print-btn';
    printBtn.innerHTML = '<i class="fas fa-print"></i> 打印此内容';
    printBtn.style.display = 'block';
    printBtn.style.margin = '25px auto 10px';
    printBtn.style.padding = '12px 25px';

    // 打印功能
    printBtn.addEventListener('click', () => {
        const printWindow = window.open('', '_blank');
        const currentDate = new Date().toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
                <title>${document.querySelector('.header-title').textContent} - ${document.querySelector(`[data-section="${section}"] span`).textContent.trim()}</title>
                <style>
                    @page { size: A4; margin: 1.5cm; }
                    body {
                        font-family: "Noto Sans SC", "Microsoft YaHei", sans-serif;
                        line-height: 1.6;
                        color: #333;
                        padding: 20px;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    h2 {
                        color: #6a3093;
                        text-align: center;
                        border-bottom: 1px solid #eee;
                        padding-bottom: 10px;
                        margin-bottom: 25px;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 20px 0;
                        page-break-inside: avoid;
                    }
                    th, td {
                        padding: 10px 12px;
                        border: 1px solid #ddd;
                        text-align: left;
                    }
                    th {
                        background-color: #f5f5f5 !important;
                    }
                    pre {
                        background-color: #f8f9fa !important;
                        padding: 15px !important;
                        border-radius: 6px;
                        overflow-x: auto;
                        white-space: pre-wrap;
                    }
                    .print-footer {
                        margin-top: 40px;
                        text-align: center;
                        color: #999;
                        font-size: 13px;
                        border-top: 1px solid #eee;
                        padding-top: 15px;
                    }
                    .wood { color: #5b8c5a; }
                    .fire { color: #e74c3c; }
                    .earth { color: #d4a017; }
                    .metal { color: #95a5a6; }
                    .water { color: #3498db; }
                </style>
            </head>
            <body>
                <h2>${document.querySelector('.header-title').textContent}</h2>
                <h3 style="text-align:center;color:#6a3093;margin-bottom:30px;">
                    ${document.querySelector(`[data-section="${section}"] span`).textContent.trim()}
                </h3>
                ${contentHTML}
                <div class="print-footer">
                    报告生成时间：${currentDate} | © ${new Date().getFullYear()} ${document.title}
                </div>
                <script>
                    setTimeout(function() {
                        window.print();
                        setTimeout(window.close, 300);
                    }, 200);
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    });

    container.appendChild(printBtn);
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
