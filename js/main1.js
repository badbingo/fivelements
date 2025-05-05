// 八字计算器功能实现 - 完整版
document.addEventListener('DOMContentLoaded', function() {
    // 表单提交处理
    document.getElementById('bazi-form').addEventListener('submit', function(e) {
        e.preventDefault();
        calculateBazi();
    });
    
    // 打印和保存功能
    document.getElementById('print-btn').addEventListener('click', window.print);
    document.getElementById('save-btn').addEventListener('click', saveBaziResult);
});

function calculateBazi() {
    // 获取并验证表单数据
    const birthDate = document.getElementById('birth-date').value;
    const birthHour = document.getElementById('birth-hour').value;
    const birthMinute = document.getElementById('birth-minute').value;
    if (!birthDate || birthHour === '' || birthMinute === '') {
        return alert('请填写完整的出生日期和时间');
    }

    try {
        // 计算八字核心数据
        const dateParts = birthDate.split('-');
        const solarDate = new Date(dateParts[0], dateParts[1]-1, dateParts[2], birthHour, birthMinute);
        const lunarDate = Lunar.fromDate(solarDate);
        
        // 1. 计算四柱
        const bazi = calculateFourPillars(lunarDate, birthHour);
        
        // 2. 计算十神
        const shishen = calculateShiShen(bazi.day.stem, bazi);
        
        // 3. 计算五行
        const wuxing = calculateWuXing(bazi);
        
        // 4. 计算大运
        const dayun = calculateDaYun(lunarDate, document.querySelector('input[name="gender"]:checked').value);
        
        // 显示完整结果
        displayFullResult(bazi, shishen, wuxing, dayun, {
            date: `${dateParts[0]}年${dateParts[1]}月${dateParts[2]}日`,
            time: `${birthHour}:${birthMinute.padStart(2, '0')}`,
            gender: document.querySelector('input[name="gender"]:checked').value === 'male' ? '男' : '女',
            zodiac: lunarDate.getYearShengXiao(),
            lunarDate: `${lunarDate.getYear()}年${lunarDate.getMonth()}月${lunarDate.getDay()}日`
        });

        document.getElementById('result-section').style.display = 'block';
        document.getElementById('result-section').scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
        console.error('八字计算错误:', error);
        alert('计算出错，请检查输入数据');
    }
}

// 计算四柱函数
function calculateFourPillars(lunarDate, hour) {
    return {
        year: { stem: lunarDate.getYearGan(), branch: lunarDate.getYearZhi() },
        month: { stem: lunarDate.getMonthGan(), branch: lunarDate.getMonthZhi() },
        day: { stem: lunarDate.getDayGan(), branch: lunarDate.getDayZhi() },
        hour: calculateHourPillar(lunarDate.getDayGan(), hour)
    };
}

// 计算时柱
function calculateHourPillar(dayGan, hour) {
    const zhiList = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
    const hourZhi = zhiList[Math.floor((parseInt(hour) + 1) / 2) % 12];
    
    const startGanMap = { '甲':0, '己':0, '乙':2, '庚':2, '丙':4, '辛':4, '丁':6, '壬':6, '戊':8, '癸':8 };
    const ganList = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
    const hourGan = ganList[(startGanMap[dayGan] + Math.floor((parseInt(hour) + 1) / 2)) % 10];
    
    return { stem: hourGan, branch: hourZhi };
}

// 计算十神
function calculateShiShen(dayGan, bazi) {
    const relations = {
        '比肩': ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'],
        '劫财': ['乙', '甲', '丁', '丙', '己', '戊', '辛', '庚', '癸', '壬'],
        '食神': ['丙', '丁', '戊', '己', '庚', '辛', '壬', '癸', '甲', '乙'],
        '伤官': ['丁', '丙', '己', '戊', '辛', '庚', '癸', '壬', '乙', '甲'],
        '偏财': ['戊', '己', '庚', '辛', '壬', '癸', '甲', '乙', '丙', '丁'],
        '正财': ['己', '戊', '辛', '庚', '癸', '壬', '乙', '甲', '丁', '丙'],
        '七杀': ['庚', '辛', '壬', '癸', '甲', '乙', '丙', '丁', '戊', '己'],
        '正官': ['辛', '庚', '癸', '壬', '乙', '甲', '丁', '丙', '己', '戊'],
        '偏印': ['壬', '癸', '甲', '乙', '丙', '丁', '戊', '己', '庚', '辛'],
        '正印': ['癸', '壬', '乙', '甲', '丁', '丙', '己', '戊', '辛', '庚']
    };
    
    const ganIndex = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'].indexOf(dayGan);
    
    return {
        year: getShiShen(relations, bazi.year.stem, ganIndex),
        month: getShiShen(relations, bazi.month.stem, ganIndex),
        day: '日主',
        hour: getShiShen(relations, bazi.hour.stem, ganIndex)
    };
}

function getShiShen(relations, gan, ganIndex) {
    for (const [name, gans] of Object.entries(relations)) {
        if (gans[ganIndex] === gan) return name;
    }
    return '未知';
}

// 计算五行
function calculateWuXing(bazi) {
    const elements = { '木':0, '火':0, '土':0, '金':0, '水':0 };
    const elementMap = {
        '甲':'木', '乙':'木', '寅':'木', '卯':'木',
        '丙':'火', '丁':'火', '巳':'火', '午':'火',
        '戊':'土', '己':'土', '辰':'土', '戌':'土', '丑':'土', '未':'土',
        '庚':'金', '辛':'金', '申':'金', '酉':'金',
        '壬':'水', '癸':'水', '亥':'水', '子':'水'
    };
    
    // 统计天干地支五行
    ['year', 'month', 'day', 'hour'].forEach(pillar => {
        elements[elementMap[bazi[pillar].stem]]++;
        elements[elementMap[bazi[pillar].branch]]++;
    });
    
    // 计算五行强度
    const total = Object.values(elements).reduce((a, b) => a + b, 0);
    const percentages = {};
    Object.keys(elements).forEach(el => {
        percentages[el] = Math.round((elements[el] / total) * 100);
    });
    
    return { elements, percentages };
}

// 计算大运
function calculateDaYun(lunarDate, gender) {
    const startAge = 1; // 起运年龄
    const dayunList = [];
    const yearGan = lunarDate.getYearGan();
    
    // 简化的起运计算（实际应根据具体规则）
    for (let i = 0; i < 8; i++) {
        dayunList.push({
            period: `${i+1}岁运`,
            startAge: startAge + i * 10,
            endAge: startAge + (i + 1) * 10 - 1,
            stem: ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'][(yearGan.charCodeAt(0) - 0x7532 + i) % 10],
            branch: ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'][i % 12],
            fortune: ['平运', '吉运', '凶运'][i % 3] // 简化的运势判断
        });
    }
    
    return dayunList;
}

// 显示完整结果
function displayFullResult(bazi, shishen, wuxing, dayun, info) {
    // 1. 显示基本信息
    document.getElementById('result-date').textContent = info.date;
    document.getElementById('result-time').textContent = info.time;
    document.getElementById('result-lunar').textContent = info.lunarDate;
    document.getElementById('result-zodiac').textContent = info.zodiac;
    
    // 2. 显示四柱表格
    const pillars = ['year', 'month', 'day', 'hour'];
    pillars.forEach(pillar => {
        document.getElementById(`${pillar}-stem`).textContent = bazi[pillar].stem;
        document.getElementById(`${pillar}-branch`).textContent = bazi[pillar].branch;
        document.getElementById(`${pillar}-element`).textContent = 
            getElementFromStem(bazi[pillar].stem);
    });
    
    // 3. 显示十神表格
    pillars.forEach(pillar => {
        document.getElementById(`${pillar}-main-god`).textContent = shishen[pillar];
    });
    
    // 4. 显示五行分析
    const wuxingElements = ['wood', 'fire', 'earth', 'metal', 'water'];
    const elementNames = {'wood':'木', 'fire':'火', 'earth':'土', 'metal':'金', 'water':'水'};
    wuxingElements.forEach(el => {
        const bar = document.querySelector(`.wuxing-bar.${el}`);
        if (bar) bar.style.height = `${wuxing.percentages[elementNames[el]]}%`;
    });
    
    document.getElementById('result-wuxing').textContent = 
        Object.entries(wuxing.elements).map(([k, v]) => `${k}${v}`).join('、');
    
    // 5. 显示大运表格
    const dayunTable = document.getElementById('dayun-table');
    dayunTable.innerHTML = dayun.map(d => `
        <tr>
            <td>${d.period}</td>
            <td>${d.startAge}-${d.endAge}岁</td>
            <td>${d.stem}</td>
            <td>${d.branch}</td>
            <td>${getElementFromStem(d.stem)}</td>
            <td>${d.fortune}</td>
        </tr>
    `).join('');
}

function getElementFromStem(gan) {
    const map = { '甲':'木', '乙':'木', '丙':'火', '丁':'火', '戊':'土', 
                 '己':'土', '庚':'金', '辛':'金', '壬':'水', '癸':'水' };
    return map[gan] || '未知';
}

function saveBaziResult() {
    alert('保存功能将在后续版本实现');
}
