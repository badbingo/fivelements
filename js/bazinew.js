// 八字测算系统 JavaScript

// 全局变量
let currentUser = null;
let calculationHistory = [];
let currentResults = null;

// DOM 元素
const elements = {
    // 导航
    navToggle: null,
    navMenu: null,
    navLinks: null,
    
    // 表单
    baziForm: null,
    nameInput: null,
    genderSelect: null,
    birthDateInput: null,
    birthTimeSelect: null,
    calculateBtn: null,
    
    // 历史记录
    historyList: null,
    
    // 结果区域
    resultsSection: null,
    basicInfoCard: null,
    baziTableCard: null,
    scoreCards: null,
    elementsChart: null,
    analysisContent: null,
    
    // 标签页
    analysisTabs: null,
    tabPanels: null,
    
    // 其他
    loadingOverlay: null
};

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeElements();
    initializeEventListeners();
    loadHistoryFromStorage();
    initializeCharts();
    setupScrollEffects();
    setupBaguaAnimation();
});

// 初始化DOM元素
function initializeElements() {
    // 导航
    elements.navToggle = document.querySelector('.nav-toggle');
    elements.navMenu = document.querySelector('.nav-menu');
    elements.navLinks = document.querySelectorAll('.nav-link');
    
    // 表单
    elements.baziForm = document.querySelector('.bazi-form');
    elements.nameInput = document.querySelector('#name');
    elements.genderSelect = document.querySelector('#gender');
    elements.birthDateInput = document.querySelector('#birth-date');
    elements.birthTimeSelect = document.querySelector('#birth-time');
    elements.calculateBtn = document.querySelector('.calculate-button');
    
    // 历史记录
    elements.historyList = document.querySelector('.history-list');
    
    // 结果区域
    elements.resultsSection = document.querySelector('.results-section');
    elements.basicInfoCard = document.querySelector('.basic-info-card');
    elements.baziTableCard = document.querySelector('.bazi-table-card');
    elements.scoreCards = document.querySelectorAll('.score-card');
    elements.elementsChart = document.querySelector('.elements-chart-container');
    elements.analysisContent = document.querySelector('.analysis-content');
    
    // 标签页
    elements.analysisTabs = document.querySelectorAll('.tab-btn');
    elements.tabPanels = document.querySelectorAll('.tab-panel');
    
    // 其他
    elements.loadingOverlay = document.querySelector('#loading-overlay');
}

// 初始化事件监听器
function initializeEventListeners() {
    // 导航菜单切换
    if (elements.navToggle) {
        elements.navToggle.addEventListener('click', toggleNavMenu);
    }
    
    // 导航链接点击
    elements.navLinks.forEach(link => {
        link.addEventListener('click', handleNavClick);
    });
    
    // 表单提交
    if (elements.baziForm) {
        elements.baziForm.addEventListener('submit', handleFormSubmit);
    }
    
    // 计算按钮
    if (elements.calculateBtn) {
        elements.calculateBtn.addEventListener('click', handleCalculate);
    }
    
    // 标签页切换
    elements.analysisTabs.forEach(tab => {
        tab.addEventListener('click', handleTabClick);
    });
    
    // 窗口滚动
    window.addEventListener('scroll', handleScroll);
    
    // 窗口大小改变
    window.addEventListener('resize', handleResize);
    
    // 键盘事件
    document.addEventListener('keydown', handleKeyDown);
}

// 导航菜单切换
function toggleNavMenu() {
    if (elements.navMenu) {
        elements.navMenu.classList.toggle('active');
    }
}

// 导航链接点击处理
function handleNavClick(event) {
    event.preventDefault();
    const targetId = event.target.getAttribute('href');
    
    // 移除所有活动状态
    elements.navLinks.forEach(link => {
        link.classList.remove('active');
    });
    
    // 添加当前活动状态
    event.target.classList.add('active');
    
    // 滚动到目标区域
    if (targetId && targetId.startsWith('#')) {
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            targetElement.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }
    
    // 关闭移动端菜单
    if (elements.navMenu) {
        elements.navMenu.classList.remove('active');
    }
}

// 表单提交处理
function handleFormSubmit(event) {
    event.preventDefault();
    handleCalculate();
}

// 计算处理
function handleCalculate() {
    if (!validateForm()) {
        return;
    }
    
    const formData = getFormData();
    console.log('开始计算，表单数据:', formData);
    showLoading();
    
    // 模拟计算过程
    setTimeout(() => {
        try {
            console.log('开始八字计算...');
            const results = calculateBazi(formData);
            console.log('计算结果:', results);
            
            displayResults(results);
            saveToHistory(formData, results);
            hideLoading();
            
            console.log('计算完成，隐藏加载状态');
            
            // 滚动到结果区域
            if (elements.resultsSection) {
                elements.resultsSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        } catch (error) {
            console.error('计算过程中出现错误:', error);
            hideLoading();
            showAlert('计算过程中出现错误，请重试');
        }
    }, 2000);
}

// 表单验证
function validateForm() {
    const name = elements.nameInput?.value.trim();
    const gender = elements.genderSelect?.value;
    const birthDate = elements.birthDateInput?.value;
    const birthTime = elements.birthTimeSelect?.value;
    
    if (!name) {
        showAlert('请输入姓名');
        elements.nameInput?.focus();
        return false;
    }
    
    if (!gender) {
        showAlert('请选择性别');
        elements.genderSelect?.focus();
        return false;
    }
    
    if (!birthDate) {
        showAlert('请选择出生日期');
        elements.birthDateInput?.focus();
        return false;
    }
    
    if (!birthTime) {
        showAlert('请选择出生时辰');
        elements.birthTimeSelect?.focus();
        return false;
    }
    
    // 验证日期是否有效
    const date = new Date(birthDate);
    const today = new Date();
    
    if (date > today) {
        showAlert('出生日期不能晚于今天');
        elements.birthDateInput?.focus();
        return false;
    }
    
    if (date.getFullYear() < 1900) {
        showAlert('出生日期不能早于1900年');
        elements.birthDateInput?.focus();
        return false;
    }
    
    return true;
}

// 获取表单数据
function getFormData() {
    return {
        name: elements.nameInput?.value.trim(),
        gender: elements.genderSelect?.value,
        birthDate: elements.birthDateInput?.value,
        birthTime: elements.birthTimeSelect?.value,
        timestamp: new Date().toISOString()
    };
}

// 八字计算（简化版）
function calculateBazi(formData) {
    const birthDate = new Date(formData.birthDate);
    const year = birthDate.getFullYear();
    const month = birthDate.getMonth() + 1;
    const day = birthDate.getDate();
    
    // 天干地支数组
    const heavenlyStems = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
    const earthlyBranches = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
    const timeMap = {
        '子时': '子', '丑时': '丑', '寅时': '寅', '卯时': '卯',
        '辰时': '辰', '巳时': '巳', '午时': '午', '未时': '未',
        '申时': '申', '酉时': '酉', '戌时': '戌', '亥时': '亥'
    };
    
    // 简化的八字计算
    const yearStem = heavenlyStems[(year - 4) % 10];
    const yearBranch = earthlyBranches[(year - 4) % 12];
    const monthStem = heavenlyStems[(month - 1) % 10];
    const monthBranch = earthlyBranches[(month - 1) % 12];
    const dayStem = heavenlyStems[(day - 1) % 10];
    const dayBranch = earthlyBranches[(day - 1) % 12];
    const timeBranch = timeMap[formData.birthTime] || '子';
    const timeIndex = earthlyBranches.indexOf(timeBranch);
    const timeStem = heavenlyStems[timeIndex % 10];
    
    // 五行计算
    const elements = calculateElements({
        year: yearStem + yearBranch,
        month: monthStem + monthBranch,
        day: dayStem + dayBranch,
        time: timeStem + timeBranch
    });
    
    // 评分计算
    const scores = calculateScores(elements, formData.gender);
    
    return {
        personal: {
            name: formData.name,
            gender: formData.gender === 'male' ? '男' : '女',
            birthDate: formatDate(birthDate),
            birthTime: formData.birthTime,
            age: calculateAge(birthDate)
        },
        bazi: {
            year: { stem: yearStem, branch: yearBranch },
            month: { stem: monthStem, branch: monthBranch },
            day: { stem: dayStem, branch: dayBranch },
            time: { stem: timeStem, branch: timeBranch }
        },
        elements: elements,
        scores: scores,
        analysis: generateAnalysis(elements, scores, formData.gender)
    };
}

// 五行计算
function calculateElements(bazi) {
    const elementMap = {
        '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土',
        '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水',
        '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土',
        '巳': '火', '午': '火', '未': '土', '申': '金', '酉': '金',
        '戌': '土', '亥': '水'
    };
    
    const elements = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
    
    // 计算天干地支的五行分布
    Object.values(bazi).forEach(pillar => {
        for (let char of pillar) {
            if (elementMap[char]) {
                elements[elementMap[char]]++;
            }
        }
    });
    
    // 转换为百分比
    const total = Object.values(elements).reduce((sum, count) => sum + count, 0);
    const percentages = {};
    Object.keys(elements).forEach(element => {
        percentages[element] = Math.round((elements[element] / total) * 100);
    });
    
    return {
        counts: elements,
        percentages: percentages,
        dominant: Object.keys(elements).reduce((a, b) => elements[a] > elements[b] ? a : b),
        weakest: Object.keys(elements).reduce((a, b) => elements[a] < elements[b] ? a : b)
    };
}

// 评分计算
function calculateScores(elements, gender) {
    const base = 60;
    const variation = 40;
    
    // 基于五行平衡度计算命格评分
    const balance = calculateBalance(elements.percentages);
    const destinyScore = Math.round(base + (balance * variation / 100));
    
    // 基于主导五行计算财富评分
    const wealthMultiplier = {
        '金': 0.9, '木': 0.7, '水': 0.8, '火': 0.6, '土': 0.8
    };
    const wealthScore = Math.round(base + (wealthMultiplier[elements.dominant] * variation));
    
    return {
        destiny: {
            score: destinyScore,
            level: getScoreLevel(destinyScore),
            description: getDestinyDescription(destinyScore)
        },
        wealth: {
            score: wealthScore,
            level: getScoreLevel(wealthScore),
            description: getWealthDescription(wealthScore)
        }
    };
}

// 计算五行平衡度
function calculateBalance(percentages) {
    const ideal = 20; // 理想情况下每个五行占20%
    const deviations = Object.values(percentages).map(p => Math.abs(p - ideal));
    const totalDeviation = deviations.reduce((sum, dev) => sum + dev, 0);
    return Math.max(0, 100 - totalDeviation);
}

// 获取评分等级
function getScoreLevel(score) {
    if (score >= 90) return '极佳';
    if (score >= 80) return '优秀';
    if (score >= 70) return '良好';
    if (score >= 60) return '一般';
    return '较弱';
}

// 获取命格描述
function getDestinyDescription(score) {
    if (score >= 90) return '天赋异禀，命格极佳，一生多贵人相助';
    if (score >= 80) return '命格优秀，运势较佳，事业有成';
    if (score >= 70) return '命格良好，平稳发展，小有成就';
    if (score >= 60) return '命格一般，需要努力奋斗';
    return '命格较弱，需要多加注意调理';
}

// 获取财富描述
function getWealthDescription(score) {
    if (score >= 90) return '财运极佳，投资理财能力强，容易积累财富';
    if (score >= 80) return '财运优秀，收入稳定，有一定的理财能力';
    if (score >= 70) return '财运良好，通过努力可以获得不错的收入';
    if (score >= 60) return '财运一般，需要谨慎理财';
    return '财运较弱，需要开源节流';
}

// 生成分析内容
function generateAnalysis(elements, scores, gender) {
    return {
        personality: generatePersonalityAnalysis(elements, gender),
        career: generateCareerAnalysis(elements, gender),
        wealth: generateWealthAnalysis(elements, scores.wealth),
        health: generateHealthAnalysis(elements),
        marriage: generateMarriageAnalysis(elements, gender),
        fortune: generateFortuneAnalysis(elements, scores)
    };
}

// 性格分析
function generatePersonalityAnalysis(elements, gender) {
    const dominant = elements.dominant;
    const personalities = {
        '木': '性格温和，富有同情心，具有创造力和想象力，但有时过于理想化',
        '火': '性格热情开朗，积极主动，具有领导能力，但有时过于急躁',
        '土': '性格稳重踏实，忠诚可靠，具有很强的责任心，但有时过于保守',
        '金': '性格坚毅果断，原则性强，具有很强的执行力，但有时过于严厉',
        '水': '性格聪明灵活，适应能力强，具有很强的洞察力，但有时过于多变'
    };
    
    return `您的主导五行为${dominant}，${personalities[dominant]}。建议在日常生活中注意平衡各方面的发展。`;
}

// 事业分析
function generateCareerAnalysis(elements, gender) {
    const dominant = elements.dominant;
    const careers = {
        '木': '适合从事教育、文化、艺术、园林、医疗等行业',
        '火': '适合从事销售、媒体、娱乐、餐饮、能源等行业',
        '土': '适合从事建筑、房地产、农业、管理、服务等行业',
        '金': '适合从事金融、法律、机械、军警、技术等行业',
        '水': '适合从事贸易、运输、旅游、信息、流通等行业'
    };
    
    return `根据您的五行特质，${careers[dominant]}。建议选择与自己五行相配的职业发展方向。`;
}

// 财富分析
function generateWealthAnalysis(elements, wealthScore) {
    const level = wealthScore.level;
    const advice = {
        '极佳': '财运极佳，可以考虑多元化投资，但要注意风险控制',
        '优秀': '财运优秀，适合稳健投资，可以考虑长期理财规划',
        '良好': '财运良好，建议以储蓄为主，适当进行低风险投资',
        '一般': '财运一般，建议谨慎理财，避免高风险投资',
        '较弱': '财运较弱，建议开源节流，注重积累'
    };
    
    return `您的财运等级为${level}，${advice[level]}。`;
}

// 健康分析
function generateHealthAnalysis(elements) {
    const weakest = elements.weakest;
    const healthAdvice = {
        '木': '注意肝胆和神经系统的保养，多进行户外运动',
        '火': '注意心血管系统的保养，避免过度兴奋和熬夜',
        '土': '注意脾胃消化系统的保养，饮食要规律',
        '金': '注意肺部和呼吸系统的保养，避免吸烟和空气污染',
        '水': '注意肾脏和泌尿系统的保养，多喝水少熬夜'
    };
    
    return `您的${weakest}较弱，${healthAdvice[weakest]}。`;
}

// 婚姻分析
function generateMarriageAnalysis(elements, gender) {
    const dominant = elements.dominant;
    const marriageAdvice = {
        '木': '感情丰富，重视精神交流，适合找性格互补的伴侣',
        '火': '热情主动，容易一见钟情，需要学会控制情绪',
        '土': '忠诚专一，重视家庭，适合找踏实可靠的伴侣',
        '金': '原则性强，对伴侣要求较高，需要学会包容',
        '水': '感情细腻，善于沟通，但有时过于敏感'
    };
    
    return `在感情方面，您${marriageAdvice[dominant]}。建议在选择伴侣时注重性格互补。`;
}

// 运势分析
function generateFortuneAnalysis(elements, scores) {
    const avgScore = (scores.destiny.score + scores.wealth.score) / 2;
    let fortune = '';
    
    if (avgScore >= 85) {
        fortune = '整体运势极佳，各方面发展都比较顺利';
    } else if (avgScore >= 75) {
        fortune = '整体运势良好，大部分时候都能心想事成';
    } else if (avgScore >= 65) {
        fortune = '整体运势平稳，通过努力可以达到目标';
    } else {
        fortune = '整体运势一般，需要更加努力和谨慎';
    }
    
    return `${fortune}。建议保持积极心态，多行善事。`;
}

// 显示结果
function displayResults(results) {
    currentResults = results;
    
    // 显示基本信息
    displayBasicInfo(results.personal);
    
    // 显示八字表格
    displayBaziTable(results.bazi);
    
    // 显示评分
    displayScores(results.scores);
    
    // 显示五行图表
    displayElementsChart(results.elements);
    
    // 显示分析内容
    displayAnalysis(results.analysis);
    
    // 显示结果区域
    if (elements.resultsSection) {
        elements.resultsSection.style.display = 'block';
        elements.resultsSection.classList.add('fade-in');
    }
}

// 显示基本信息
function displayBasicInfo(personal) {
    const infoGrid = document.querySelector('.info-grid');
    if (!infoGrid) return;
    
    infoGrid.innerHTML = `
        <div class="info-item">
            <span class="info-label">姓名</span>
            <span class="info-value">${personal.name}</span>
        </div>
        <div class="info-item">
            <span class="info-label">性别</span>
            <span class="info-value">${personal.gender}</span>
        </div>
        <div class="info-item">
            <span class="info-label">出生日期</span>
            <span class="info-value">${personal.birthDate}</span>
        </div>
        <div class="info-item">
            <span class="info-label">出生时辰</span>
            <span class="info-value">${personal.birthTime}</span>
        </div>
        <div class="info-item">
            <span class="info-label">年龄</span>
            <span class="info-value">${personal.age}岁</span>
        </div>
    `;
}

// 显示八字表格
function displayBaziTable(bazi) {
    const baziTable = document.querySelector('.bazi-table');
    if (!baziTable) return;
    
    baziTable.innerHTML = `
        <div class="bazi-row header">
            <div class="bazi-cell">项目</div>
            <div class="bazi-cell">年柱</div>
            <div class="bazi-cell">月柱</div>
            <div class="bazi-cell">日柱</div>
            <div class="bazi-cell">时柱</div>
        </div>
        <div class="bazi-row">
            <div class="bazi-cell label">天干</div>
            <div class="bazi-cell">${bazi.year.stem}</div>
            <div class="bazi-cell">${bazi.month.stem}</div>
            <div class="bazi-cell">${bazi.day.stem}</div>
            <div class="bazi-cell">${bazi.time.stem}</div>
        </div>
        <div class="bazi-row">
            <div class="bazi-cell label">地支</div>
            <div class="bazi-cell">${bazi.year.branch}</div>
            <div class="bazi-cell">${bazi.month.branch}</div>
            <div class="bazi-cell">${bazi.day.branch}</div>
            <div class="bazi-cell">${bazi.time.branch}</div>
        </div>
        <div class="bazi-row">
            <div class="bazi-cell label">纳音</div>
            <div class="bazi-cell">${bazi.year.stem}${bazi.year.branch}</div>
            <div class="bazi-cell">${bazi.month.stem}${bazi.month.branch}</div>
            <div class="bazi-cell">${bazi.day.stem}${bazi.day.branch}</div>
            <div class="bazi-cell">${bazi.time.stem}${bazi.time.branch}</div>
        </div>
    `;
}

// 显示评分
function displayScores(scores) {
    // 命格评分
    const destinyCard = document.querySelector('.destiny-score-card');
    if (destinyCard) {
        destinyCard.innerHTML = `
            <div class="card-header">
                <h3><i class="fas fa-star"></i> 命格评分</h3>
            </div>
            <div class="score-display">
                <div class="score-circle">
                    <div class="score-value">${scores.destiny.score}</div>
                    <div class="score-label">分</div>
                </div>
                <div class="score-level">${scores.destiny.level}</div>
                <div class="score-description">${scores.destiny.description}</div>
            </div>
        `;
    }
    
    // 财富评分
    const wealthCard = document.querySelector('.wealth-score-card');
    if (wealthCard) {
        wealthCard.innerHTML = `
            <div class="card-header">
                <h3><i class="fas fa-coins"></i> 财富评分</h3>
            </div>
            <div class="score-display">
                <div class="score-circle">
                    <div class="score-value">${scores.wealth.score}</div>
                    <div class="score-label">分</div>
                </div>
                <div class="score-level">${scores.wealth.level}</div>
                <div class="score-description">${scores.wealth.description}</div>
            </div>
        `;
    }
}

// 显示五行图表
function displayElementsChart(elements) {
    const chartContainer = document.querySelector('.elements-chart-container');
    if (!chartContainer) return;
    
    // 创建图表
    const canvas = document.createElement('canvas');
    canvas.id = 'elementsChart';
    canvas.width = 400;
    canvas.height = 300;
    
    chartContainer.innerHTML = '';
    chartContainer.appendChild(canvas);
    
    // 绘制雷达图
    drawRadarChart(canvas, elements.percentages);
    
    // 显示图例
    const legend = document.querySelector('.elements-legend');
    if (legend) {
        legend.innerHTML = `
            <div class="legend-item">
                <div class="legend-color wood"></div>
                <span class="legend-label">木</span>
                <span class="legend-value">${elements.percentages.木}%</span>
            </div>
            <div class="legend-item">
                <div class="legend-color fire"></div>
                <span class="legend-label">火</span>
                <span class="legend-value">${elements.percentages.火}%</span>
            </div>
            <div class="legend-item">
                <div class="legend-color earth"></div>
                <span class="legend-label">土</span>
                <span class="legend-value">${elements.percentages.土}%</span>
            </div>
            <div class="legend-item">
                <div class="legend-color metal"></div>
                <span class="legend-label">金</span>
                <span class="legend-value">${elements.percentages.金}%</span>
            </div>
            <div class="legend-item">
                <div class="legend-color water"></div>
                <span class="legend-label">水</span>
                <span class="legend-value">${elements.percentages.水}%</span>
            </div>
        `;
    }
}

// 绘制雷达图
function drawRadarChart(canvas, data) {
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 40;
    
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 五行数据
    const elements = ['木', '火', '土', '金', '水'];
    const values = elements.map(element => data[element] || 0);
    const colors = ['#4CAF50', '#FF5722', '#795548', '#607D8B', '#2196F3'];
    
    // 绘制网格
    ctx.strokeStyle = '#e1e8ed';
    ctx.lineWidth = 1;
    
    for (let i = 1; i <= 5; i++) {
        ctx.beginPath();
        const r = (radius * i) / 5;
        
        for (let j = 0; j < 5; j++) {
            const angle = (j * 2 * Math.PI) / 5 - Math.PI / 2;
            const x = centerX + r * Math.cos(angle);
            const y = centerY + r * Math.sin(angle);
            
            if (j === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        
        ctx.closePath();
        ctx.stroke();
    }
    
    // 绘制轴线
    for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(x, y);
        ctx.stroke();
        
        // 绘制标签
        ctx.fillStyle = '#2c3e50';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const labelX = centerX + (radius + 20) * Math.cos(angle);
        const labelY = centerY + (radius + 20) * Math.sin(angle);
        ctx.fillText(elements[i], labelX, labelY);
    }
    
    // 绘制数据区域
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
        const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
        const value = values[i] / 100; // 转换为0-1的比例
        const x = centerX + radius * value * Math.cos(angle);
        const y = centerY + radius * value * Math.sin(angle);
        
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.closePath();
    
    // 填充区域
    ctx.fillStyle = 'rgba(52, 152, 219, 0.2)';
    ctx.fill();
    
    // 绘制边框
    ctx.strokeStyle = '#3498db';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // 绘制数据点
    for (let i = 0; i < 5; i++) {
        const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
        const value = values[i] / 100;
        const x = centerX + radius * value * Math.cos(angle);
        const y = centerY + radius * value * Math.sin(angle);
        
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fillStyle = colors[i];
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

// 显示分析内容
function displayAnalysis(analysis) {
    // 性格分析
    const personalityPanel = document.querySelector('#personality-panel');
    if (personalityPanel) {
        personalityPanel.innerHTML = `
            <div class="analysis-section">
                <h4><i class="fas fa-user"></i> 性格特征</h4>
                <p>${analysis.personality}</p>
            </div>
        `;
    }
    
    // 事业分析
    const careerPanel = document.querySelector('#career-panel');
    if (careerPanel) {
        careerPanel.innerHTML = `
            <div class="analysis-section">
                <h4><i class="fas fa-briefcase"></i> 事业发展</h4>
                <p>${analysis.career}</p>
            </div>
            <div class="analysis-section">
                <h4><i class="fas fa-coins"></i> 财富运势</h4>
                <p>${analysis.wealth}</p>
            </div>
        `;
    }
    
    // 健康婚姻
    const healthPanel = document.querySelector('#health-panel');
    if (healthPanel) {
        healthPanel.innerHTML = `
            <div class="analysis-section">
                <h4><i class="fas fa-heart"></i> 健康状况</h4>
                <p>${analysis.health}</p>
            </div>
            <div class="analysis-section">
                <h4><i class="fas fa-ring"></i> 婚姻感情</h4>
                <p>${analysis.marriage}</p>
            </div>
        `;
    }
    
    // 综合运势
    const fortunePanel = document.querySelector('#fortune-panel');
    if (fortunePanel) {
        fortunePanel.innerHTML = `
            <div class="analysis-section">
                <h4><i class="fas fa-chart-line"></i> 综合运势</h4>
                <p>${analysis.fortune}</p>
            </div>
        `;
    }
}

// 标签页切换
function handleTabClick(event) {
    const tabId = event.target.dataset.tab;
    if (!tabId) return;
    
    // 移除所有活动状态
    elements.analysisTabs.forEach(tab => {
        tab.classList.remove('active');
    });
    
    elements.tabPanels.forEach(panel => {
        panel.classList.remove('active');
    });
    
    // 添加当前活动状态
    event.target.classList.add('active');
    const targetPanel = document.querySelector(`#${tabId}-panel`);
    if (targetPanel) {
        targetPanel.classList.add('active');
    }
}

// 保存到历史记录
function saveToHistory(formData, results) {
    const historyItem = {
        id: Date.now(),
        name: formData.name,
        date: new Date().toLocaleDateString(),
        formData: formData,
        results: results
    };
    
    calculationHistory.unshift(historyItem);
    
    // 限制历史记录数量
    if (calculationHistory.length > 10) {
        calculationHistory = calculationHistory.slice(0, 10);
    }
    
    // 保存到本地存储
    localStorage.setItem('baziHistory', JSON.stringify(calculationHistory));
    
    // 更新历史记录显示
    updateHistoryDisplay();
}

// 从本地存储加载历史记录
function loadHistoryFromStorage() {
    const stored = localStorage.getItem('baziHistory');
    if (stored) {
        try {
            calculationHistory = JSON.parse(stored);
            updateHistoryDisplay();
        } catch (e) {
            console.error('Failed to load history:', e);
        }
    }
}

// 更新历史记录显示
function updateHistoryDisplay() {
    if (!elements.historyList) return;
    
    if (calculationHistory.length === 0) {
        elements.historyList.innerHTML = '<div class="no-history">暂无历史记录</div>';
        return;
    }
    
    elements.historyList.innerHTML = calculationHistory.map(item => `
        <div class="history-item" onclick="loadHistoryItem(${item.id})">
            <span class="history-name">${item.name}</span>
            <span class="history-date">${item.date}</span>
        </div>
    `).join('');
}

// 加载历史记录项
function loadHistoryItem(id) {
    const item = calculationHistory.find(h => h.id === id);
    if (!item) return;
    
    // 填充表单
    if (elements.nameInput) elements.nameInput.value = item.formData.name;
    if (elements.genderSelect) elements.genderSelect.value = item.formData.gender;
    if (elements.birthDateInput) elements.birthDateInput.value = item.formData.birthDate;
    if (elements.birthTimeSelect) elements.birthTimeSelect.value = item.formData.birthTime;
    
    // 显示结果
    displayResults(item.results);
    
    // 滚动到结果区域
    if (elements.resultsSection) {
        elements.resultsSection.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// 工具函数
function formatDate(date) {
    return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function calculateAge(birthDate) {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    
    return age;
}

function showAlert(message) {
    alert(message);
}

function showLoading() {
    console.log('显示加载状态, loadingOverlay元素:', elements.loadingOverlay);
    if (elements.loadingOverlay) {
        elements.loadingOverlay.style.display = 'flex';
        console.log('加载状态已显示');
    } else {
        console.error('找不到loadingOverlay元素');
    }
}

function hideLoading() {
    console.log('隐藏加载状态, loadingOverlay元素:', elements.loadingOverlay);
    if (elements.loadingOverlay) {
        elements.loadingOverlay.style.display = 'none';
        console.log('加载状态已隐藏');
    } else {
        console.error('找不到loadingOverlay元素');
    }
}

// 滚动效果
function handleScroll() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    // 导航栏背景透明度
    const nav = document.querySelector('.main-nav');
    if (nav) {
        if (scrollTop > 50) {
            nav.style.background = 'rgba(255, 255, 255, 0.98)';
        } else {
            nav.style.background = 'rgba(255, 255, 255, 0.95)';
        }
    }
    
    // 视差效果
    const stars = document.querySelector('.stars');
    if (stars) {
        stars.style.transform = `translateY(${scrollTop * 0.5}px)`;
    }
}

// 窗口大小改变处理
function handleResize() {
    // 重新绘制图表
    if (currentResults && currentResults.elements) {
        displayElementsChart(currentResults.elements);
    }
}

// 键盘事件处理
function handleKeyDown(event) {
    // ESC键关闭菜单
    if (event.key === 'Escape') {
        if (elements.navMenu && elements.navMenu.classList.contains('active')) {
            elements.navMenu.classList.remove('active');
        }
    }
    
    // Enter键提交表单
    if (event.key === 'Enter' && event.target.tagName !== 'TEXTAREA') {
        const activeElement = document.activeElement;
        if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'SELECT')) {
            event.preventDefault();
            handleCalculate();
        }
    }
}

// 初始化图表库
function initializeCharts() {
    // 这里可以初始化其他图表库，如Chart.js等
}

// 设置滚动效果
function setupScrollEffects() {
    // 添加滚动监听
    window.addEventListener('scroll', handleScroll);
    
    // 初始调用
    handleScroll();
}

// 设置八卦动画
function setupBaguaAnimation() {
    const symbols = document.querySelectorAll('.symbol');
    symbols.forEach((symbol, index) => {
        const angle = (index * 45) - 90; // 每个符号间隔45度
        symbol.style.setProperty('--angle', `${angle}deg`);
    });
}

// 导出函数供全局使用
window.loadHistoryItem = loadHistoryItem;
window.handleCalculate = handleCalculate;
window.handleTabClick = handleTabClick;

// 调试函数
window.debugBazi = function() {
    console.log('Current Results:', currentResults);
    console.log('Calculation History:', calculationHistory);
    console.log('Elements:', elements);
};