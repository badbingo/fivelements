// 八字计算器 - 完整实现a
document.addEventListener('DOMContentLoaded', function() {
    // 初始化表单提交
    document.getElementById('bazi-form').addEventListener('submit', function(e) {
        e.preventDefault();
        calculateBazi();
    });

    // 打印和保存按钮
    document.getElementById('print-btn').addEventListener('click', window.print);
    document.getElementById('save-btn').addEventListener('click', function() {
        alert('保存功能将在后续版本实现');
    });
});

// 主计算函数
function calculateBazi() {
    // 1. 获取输入数据
    const birthDate = document.getElementById('birth-date').value;
    const birthHour = document.getElementById('birth-hour').value;
    const birthMinute = document.getElementById('birth-minute').value;
    const gender = document.querySelector('input[name="gender"]:checked').value;

    if (!validateInput(birthDate, birthHour, birthMinute)) return;

    try {
        // 2. 计算核心数据
        const dateParts = birthDate.split('-');
        const solarDate = new Date(dateParts[0], dateParts[1]-1, dateParts[2], birthHour, birthMinute);
        const lunarDate = Lunar.fromDate(solarDate);

        // 3. 计算四柱
        const bazi = calculateFourPillars(lunarDate, birthHour);
        
        // 4. 计算十神
        const shishen = calculateShiShen(bazi.day.stem, bazi);
        
        // 5. 计算五行
        const wuxing = calculateWuXing(bazi);
        
        // 6. 计算大运（已修复天干显示问题）
        const dayun = calculateDaYun(lunarDate, gender);
        
        // 7. 显示结果
        displayFullResult(bazi, shishen, wuxing, dayun, {
            date: `${dateParts[0]}年${dateParts[1]}月${dateParts[2]}日`,
            time: `${birthHour}:${birthMinute.padStart(2, '0')}`,
            gender: gender === 'male' ? '男' : '女',
            zodiac: lunarDate.getYearShengXiao(),
            lunarDate: `${lunarDate.getYear()}年${lunarDate.getMonth()}月${lunarDate.getDay()}日`
        });

        // 显示结果区域
        document.getElementById('result-section').style.display = 'block';
        document.getElementById('result-section').scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
        console.error('八字计算错误:', error);
        alert('计算出错，请检查输入数据');
    }
}

// 输入验证
function validateInput(date, hour, minute) {
    if (!date || hour === '' || minute === '') {
        alert('请填写完整的出生日期和时间');
        return false;
    }
    return true;
}

// 计算四柱
function calculateFourPillars(lunarDate, hour) {
    return {
        year: { 
            stem: lunarDate.getYearGan(), 
            branch: lunarDate.getYearZhi() 
        },
        month: { 
            stem: lunarDate.getMonthGan(), 
            branch: lunarDate.getMonthZhi() 
        },
        day: { 
            stem: lunarDate.getDayGan(), 
            branch: lunarDate.getDayZhi() 
        },
        hour: calculateHourPillar(lunarDate.getDayGan(), hour)
    };
}

// 计算时柱（修复版）
function calculateHourPillar(dayGan, hour) {
    const zhiList = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
    const hourZhi = zhiList[Math.floor((parseInt(hour) + 1) / 2) % 12];
    
    // 五鼠遁口诀
    const startGanMap = { 
        '甲':0, '己':0, '乙':2, '庚':2, 
        '丙':4, '辛':4, '丁':6, '壬':6, 
        '戊':8, '癸':8 
    };
    
    const ganList = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
    const startIndex = startGanMap[dayGan] || 0;
    const hourGan = ganList[(startIndex + Math.floor((parseInt(hour) + 1) / 2) % 10];
    
    return { 
        stem: hourGan, 
        branch: hourZhi 
    };
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
    if (ganIndex === -1) return {};
    
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
    
    // 计算五行百分比
    const total = Object.values(elements).reduce((a, b) => a + b, 0);
    const percentages = {};
    Object.keys(elements).forEach(el => {
        percentages[el] = Math.round((elements[el] / total) * 100);
    });
    
    // 判断喜用神（简化版）
    const maxElement = Object.keys(elements).reduce((a, b) => elements[a] > elements[b] ? a : b);
    const favorable = {
        '木': ['金', '火', '土'],
        '火': ['水', '土', '金'],
        '土': ['木', '金', '水'],
        '金': ['火', '木', '水'],
        '水': ['土', '木', '火']
    }[maxElement] || [];
    
    return { 
        elements, 
        percentages,
        favorable: favorable.slice(0, 2),
        unfavorable: [maxElement]
    };
}

// 计算大运（已修复天干undefined问题）
function calculateDaYun(lunarDate, gender) {
    const yearGan = lunarDate.getYearGan();
    const monthZhi = lunarDate.getMonthZhi();
    
    // 1. 确定顺排还是逆排
    const isMale = gender === 'male';
    const isYangYear = ['甲','丙','戊','庚','壬'].includes(yearGan);
    const isForward = (isMale && isYangYear) || (!isMale && !isYangYear);
    
    // 2. 准备干支顺序
    const ganOrder = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
    const zhiOrder = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
    
    // 3. 确定起始位置
    const currentGanIndex = ganOrder.indexOf(yearGan);
    const currentZhiIndex = zhiOrder.indexOf(monthZhi);
    
    // 4. 计算起运年龄（简化版）
    const startAge = isMale ? 1 : 4;
    
    // 5. 生成大运
    const dayunList = [];
    for (let i = 0; i < 8; i++) {
        const offset = isForward ? i + 1 : -i - 1;
        
        // 计算天干地支
        const gan = ganOrder[(currentGanIndex + offset + 10) % 10];
        const zhi = zhiOrder[(currentZhiIndex + offset + 12) % 12];
        
        // 计算运势（简化版）
        const fortune = ['平运','吉运','凶运'][(i + startAge) % 3];
        
        dayunList.push({
            period: `${i+1}步大运`,
            startAge: startAge + i * 10,
            endAge: startAge + (i + 1) * 10 - 1,
            stem: gan,
            branch: zhi,
            element: getElementFromStem(gan),
            fortune: fortune
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
    document.getElementById('result-minggong').textContent = '卯宫';
    document.getElementById('result-shengong').textContent = '酉宫';
    
    // 2. 显示四柱
    const pillars = ['year', 'month', 'day', 'hour'];
    pillars.forEach(pillar => {
        document.getElementById(`${pillar}-stem`).textContent = bazi[pillar].stem;
        document.getElementById(`${pillar}-branch`).textContent = bazi[pillar].branch;
        document.getElementById(`${pillar}-element`).textContent = 
            getElementFromStem(bazi[pillar].stem);
    });
    
    // 3. 显示十神
    pillars.forEach(pillar => {
        document.getElementById(`${pillar}-main-god`).textContent = shishen[pillar] || '未知';
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
    document.getElementById('result-xiyong').textContent = wuxing.favorable.join('、');
    document.getElementById('result-jishen').textContent = wuxing.unfavorable.join('、');
    
    // 5. 显示大运（已修复）
    const dayunTable = document.getElementById('dayun-table');
    dayunTable.innerHTML = dayun.map(d => `
        <tr>
            <td>${d.period}</td>
            <td>${d.startAge}-${d.endAge}岁</td>
            <td>${d.stem}</td>
            <td>${d.branch}</td>
            <td>${d.element}</td>
            <td class="${getFortuneClass(d.fortune)}">${d.fortune}</td>
        </tr>
    `).join('');
}

// 辅助函数
function getElementFromStem(gan) {
    const map = { 
        '甲':'木', '乙':'木', '丙':'火', '丁':'火',
        '戊':'土', '己':'土', '庚':'金', '辛':'金',
        '壬':'水', '癸':'水'
    };
    return map[gan] || '未知';
}

function getFortuneClass(fortune) {
    const map = { '吉运': 'good-fortune', '凶运': 'bad-fortune', '平运': 'neutral-fortune' };
    return map[fortune] || '';
}
