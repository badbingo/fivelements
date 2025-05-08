// 八字计算器 - 优化版
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
    
    // 初始化日期选择器为当前日期
    initDatePicker();
});

// 主计算函数
function calculateBazi() {
    const birthDate = document.getElementById('birth-date').value;
    const birthHour = document.getElementById('birth-hour').value;
    const birthMinute = document.getElementById('birth-minute').value;
    const timezone = document.getElementById('timezone').value;
    const gender = document.querySelector('input[name="gender"]:checked').value;

    if (!validateInput(birthDate, birthHour, birthMinute)) return;

    try {
        const dateParts = birthDate.split('-');
        const solarDate = new Date(dateParts[0], dateParts[1]-1, dateParts[2], birthHour, birthMinute);
        
        // 使用 lunar.js 1.7.2 的正确API
        const lunarDate = Lunar.fromDate(solarDate);
        
        // 获取年柱
        const yearGan = lunarDate.getYearGan();  // 年干
        const yearZhi = lunarDate.getYearZhi();  // 年支
        
        // 获取月柱
        const monthGan = lunarDate.getMonthGan(); // 月干
        const monthZhi = lunarDate.getMonthZhi(); // 月支
        
        // 获取日柱
        const dayGan = lunarDate.getDayGan();    // 日干
        const dayZhi = lunarDate.getDayZhi();    // 日支
        
        // 获取生肖
        const zodiac = lunarDate.getYearShengXiao();

        // 计算时柱
        const hourPillar = calculateHourPillar(dayGan, birthHour);

        // 构造四柱对象
        const bazi = {
            year: { stem: yearGan, branch: yearZhi },
            month: { stem: monthGan, branch: monthZhi },
            day: { stem: dayGan, branch: dayZhi },
            hour: hourPillar
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

// 计算时柱
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
        day: '日元',
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
    document.getElementById('result-minggong').textContent = calculateMingGong(bazi.year.branch, bazi.month.branch);
    document.getElementById('result-shengong').textContent = calculateShenGong(bazi.year.branch, bazi.hour.branch);
    
    // 2. 显示四柱
    const pillars = ['year', 'month', 'day', 'hour'];
    pillars.forEach(pillar => {
        const stemElement = document.getElementById(`${pillar}-stem`);
        const branchElement = document.getElementById(`${pillar}-branch`);
        
        stemElement.innerHTML = `${bazi[pillar].stem}<br><span class="ten-god">(${pillar === 'day' ? '日元' : shishen[pillar]})</span>`;
        branchElement.innerHTML = `${bazi[pillar].branch}<br><span class="ten-god">(${getShiShenForBranch(bazi[pillar].branch, bazi.day.stem)})</span>`;
        
        // 设置五行颜色类
        stemElement.className = `wuxing-${getElementFromStem(bazi[pillar].stem).toLowerCase()}`;
        branchElement.className = `wuxing-${getElementFromStem(bazi[pillar].branch).toLowerCase()}`;
    });
    
    // 3. 显示藏干十神
    document.getElementById('year-hidden-god').innerHTML = formatHiddenGods(bazi.year.branch, bazi.day.stem);
    document.getElementById('month-hidden-god').innerHTML = formatHiddenGods(bazi.month.branch, bazi.day.stem);
    document.getElementById('day-hidden-god').innerHTML = formatHiddenGods(bazi.day.branch, bazi.day.stem);
    document.getElementById('hour-hidden-god').innerHTML = formatHiddenGods(bazi.hour.branch, bazi.day.stem);
    
    // 4. 显示空亡
    const voidInfo = calculateVoid(bazi.day.branch);
    document.getElementById('year-void').textContent = voidInfo;
    document.getElementById('month-void').textContent = voidInfo;
    document.getElementById('day-void').textContent = voidInfo;
    document.getElementById('hour-void').textContent = voidInfo;
    
    // 5. 显示纳音
    document.getElementById('year-nayin').textContent = getNaYin(bazi.year.stem + bazi.year.branch);
    document.getElementById('month-nayin').textContent = getNaYin(bazi.month.stem + bazi.month.branch);
    document.getElementById('day-nayin').textContent = getNaYin(bazi.day.stem + bazi.day.branch);
    document.getElementById('hour-nayin').textContent = getNaYin(bazi.hour.stem + bazi.hour.branch);
}

// 计算地支对应的十神
function getShiShenForBranch(branch, dayGan) {
    const hiddenGods = getZhiHiddenGan(branch);
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
    if (ganIndex === -1) return '未知';
    
    for (const [name, gans] of Object.entries(relations)) {
        if (gans[ganIndex] === branch) return name;
    }
    return '未知';
}

// 格式化藏干显示
function formatHiddenGods(branch, dayGan) {
    const hiddenGods = getZhiHiddenGan(branch);
    const ganIndex = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'].indexOf(dayGan);
    
    if (ganIndex === -1) return hiddenGods.join('<br>');
    
    return hiddenGods.map(god => {
        const shishen = getShiShenForBranch(god, dayGan);
        return `${god}(${shishen})`;
    }).join('<br>');
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

// 计算空亡
function calculateVoid(dayZhi) {
    const zhiList = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
    const dayIndex = zhiList.indexOf(dayZhi);
    const voidIndex1 = (dayIndex + 10) % 12;
    const voidIndex2 = (dayIndex + 11) % 12;
    return `${zhiList[voidIndex1]}${zhiList[voidIndex2]}`;
}

// 计算命宫
function calculateMingGong(yearZhi, monthZhi) {
    const zhiList = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
    const yearIndex = zhiList.indexOf(yearZhi);
    const monthIndex = zhiList.indexOf(monthZhi);
    const mingGongIndex = (14 - (yearIndex + monthIndex)) % 12;
    return `${zhiList[mingGongIndex]}宫`;
}

// 计算身宫
function calculateShenGong(yearZhi, hourZhi) {
    const zhiList = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
    const yearIndex = zhiList.indexOf(yearZhi);
    const hourIndex = zhiList.indexOf(hourZhi);
    const shenGongIndex = (2 + yearIndex + hourIndex) % 12;
    return `${zhiList[shenGongIndex]}宫`;
}

// 获取纳音五行
function getNaYin(ganzhi) {
    const nayinMap = {
        '甲子': '海中金', '乙丑': '海中金', '丙寅': '炉中火', '丁卯': '炉中火',
        '戊辰': '大林木', '己巳': '大林木', '庚午': '路旁土', '辛未': '路旁土',
        '壬申': '剑锋金', '癸酉': '剑锋金', '甲戌': '山头火', '乙亥': '山头火',
        '丙子': '涧下水', '丁丑': '涧下水', '戊寅': '城头土', '己卯': '城头土',
        '庚辰': '白蜡金', '辛巳': '白蜡金', '壬午': '杨柳木', '癸未': '杨柳木',
        '甲申': '泉中水', '乙酉': '泉中水', '丙戌': '屋上土', '丁亥': '屋上土',
        '戊子': '霹雳火', '己丑': '霹雳火', '庚寅': '松柏木', '辛卯': '松柏木',
        '壬辰': '长流水', '癸巳': '长流水', '甲午': '砂中金', '乙未': '砂中金',
        '丙申': '山下火', '丁酉': '山下火', '戊戌': '平地木', '己亥': '平地木',
        '庚子': '壁上土', '辛丑': '壁上土', '壬寅': '金箔金', '癸卯': '金箔金',
        '甲辰': '覆灯火', '乙巳': '覆灯火', '丙午': '天河水', '丁未': '天河水',
        '戊申': '大驿土', '己酉': '大驿土', '庚戌': '钗钏金', '辛亥': '钗钏金',
        '壬子': '桑柘木', '癸丑': '桑柘木', '甲寅': '大溪水', '乙卯': '大溪水',
        '丙辰': '沙中土', '丁巳': '沙中土', '戊午': '天上火', '己未': '天上火',
        '庚申': '石榴木', '辛酉': '石榴木', '壬戌': '大海水', '癸亥': '大海水'
    };
    return nayinMap[ganzhi] || '未知';
}

// 获取五行属性
function getElementFromStem(gan) {
    const map = { 
        '甲':'木', '乙':'木', '丙':'火', '丁':'火',
        '戊':'土', '己':'土', '庚':'金', '辛':'金',
        '壬':'水', '癸':'水',
        '子':'水', '丑':'土', '寅':'木', '卯':'木',
        '辰':'土', '巳':'火', '午':'火', '未':'土',
        '申':'金', '酉':'金', '戌':'土', '亥':'水'
    };
    return map[gan] || '未知';
}

// 初始化日期选择器为当前日期
function initDatePicker() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    document.getElementById('birth-date').value = `${year}-${month}-${day}`;
}
