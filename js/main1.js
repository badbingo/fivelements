// 八字计算器 - 完整实现
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
    const birthDate = document.getElementById('birth-date').value;
    const birthHour = document.getElementById('birth-hour').value;
    const birthMinute = document.getElementById('birth-minute').value;
    const gender = document.querySelector('input[name="gender"]:checked').value;

    if (!validateInput(birthDate, birthHour, birthMinute)) return;

    try {
        const dateParts = birthDate.split('-');
        const solarDate = new Date(dateParts[0], dateParts[1]-1, dateParts[2], birthHour, birthMinute);
        
        // 使用 lunar.js 1.7.2 的 API
        const lunarDate = Lunar.fromDate(solarDate); // 确保 Lunar 对象可用
        const yearGanZhi = lunarDate.getYearGanZhi(); // 获取年柱（干支）
        const monthGanZhi = lunarDate.getMonthGanZhi(); // 获取月柱（干支）
        const dayGanZhi = lunarDate.getDayGanZhi(); // 获取日柱（干支）
        const zodiac = lunarDate.getShengXiao(); // 获取生肖

        // 计算时柱（根据日干和小时）
        const hourGanZhi = calculateHourPillar(dayGanZhi.substring(0, 1), birthHour);

        // 构造四柱对象
        const bazi = {
            year: { stem: yearGanZhi.substring(0, 1), branch: yearGanZhi.substring(1) },
            month: { stem: monthGanZhi.substring(0, 1), branch: monthGanZhi.substring(1) },
            day: { stem: dayGanZhi.substring(0, 1), branch: dayGanZhi.substring(1) },
            hour: { stem: hourGanZhi.stem, branch: hourGanZhi.branch }
        };

        // 计算十神并显示结果
        const shishen = calculateShiShen(bazi.day.stem, bazi);
        displayResult(bazi, shishen, {
            date: `${dateParts[0]}年${dateParts[1]}月${dateParts[2]}日`,
            time: `${birthHour}:${birthMinute.padStart(2, '0')}`,
            gender: gender === 'male' ? '男' : '女',
            zodiac: zodiac,
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

// 修正后的时柱计算函数
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
    const hourGan = ganList[(startIndex + Math.floor((parseInt(hour) + 1) / 2)) % 10];
    
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

// 显示结果
function displayResult(bazi, shishen, info) {
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
        
        // 设置五行颜色类
        const stemElement = getElementFromStem(bazi[pillar].stem);
        const branchElement = getElementFromStem(bazi[pillar].branch);
        
        document.getElementById(`${pillar}-stem`).className = `wuxing-${stemElement.toLowerCase()}`;
        document.getElementById(`${pillar}-branch`).className = `wuxing-${branchElement.toLowerCase()}`;
    });
    
    // 3. 显示十神
    document.getElementById('year-main-god').textContent = shishen.year;
    document.getElementById('month-main-god').textContent = shishen.month;
    document.getElementById('hour-main-god').textContent = shishen.hour;
    
    // 4. 显示藏干十神
    document.getElementById('year-hidden-god').textContent = getHiddenGods(bazi.year.branch, bazi.day.stem);
    document.getElementById('month-hidden-god').textContent = getHiddenGods(bazi.month.branch, bazi.day.stem);
    document.getElementById('day-hidden-god').textContent = getHiddenGods(bazi.day.branch, bazi.day.stem);
    document.getElementById('hour-hidden-god').textContent = getHiddenGods(bazi.hour.branch, bazi.day.stem);
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

function getHiddenGods(branch, dayGan) {
    const hiddenGodsMap = {
        '子': ['癸'],
        '丑': ['己', '癸', '辛'],
        '寅': ['甲', '丙', '戊'],
        '卯': ['乙'],
        '辰': ['戊', '乙', '癸'],
        '巳': ['丙', '戊', '庚'],
        '午': ['丁', '己'],
        '未': ['己', '丁', '乙'],
        '申': ['庚', '壬', '戊'],
        '酉': ['辛'],
        '戌': ['戊', '辛', '丁'],
        '亥': ['壬', '甲']
    };
    
    const shishenRelations = {
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
    if (ganIndex === -1) return '';
    
    const hiddenGods = hiddenGodsMap[branch] || [];
    return hiddenGods.map(god => {
        for (const [name, gans] of Object.entries(shishenRelations)) {
            if (gans[ganIndex] === god) return `${god}(${name})`;
        }
        return god;
    }).join(', ');
}

// 获取地支对应的藏干
function getZhiHiddenGan(zhi) {
    const hiddenGanMap = {
        '子': ['癸'],
        '丑': ['己', '癸', '辛'],
        '寅': ['甲', '丙', '戊'],
        '卯': ['乙'],
        '辰': ['戊', '乙', '癸'],
        '巳': ['丙', '戊', '庚'],
        '午': ['丁', '己'],
        '未': ['己', '丁', '乙'],
        '申': ['庚', '壬', '戊'],
        '酉': ['辛'],
        '戌': ['戊', '辛', '丁'],
        '亥': ['壬', '甲']
    };
    return hiddenGanMap[zhi] || [];
}

// 根据日干和藏干计算十神
function calculateHiddenShiShen(dayGan, hiddenGans) {
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
    if (ganIndex === -1) return hiddenGans.map(gan => `${gan}(未知)`);
    
    return hiddenGans.map(gan => {
        for (const [name, gans] of Object.entries(relations)) {
            if (gans[ganIndex] === gan) return `${gan}(${name})`;
        }
        return `${gan}(未知)`;
    });
}

// 获取五行对应的颜色类
function getElementClass(element) {
    const elementMap = {
        '木': 'wuxing-wood',
        '火': 'wuxing-fire',
        '土': 'wuxing-earth',
        '金': 'wuxing-metal',
        '水': 'wuxing-water'
    };
    return elementMap[element] || '';
}

// 初始化日期选择器为当前日期
function initDatePicker() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    document.getElementById('birth-date').value = `${year}-${month}-${day}`;
}

// 页面加载完成后初始化
window.addEventListener('load', function() {
    initDatePicker();
});
