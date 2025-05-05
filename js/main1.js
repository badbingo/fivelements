// 八字计算器功能实现 - 兼容 lunar.js 1.7.2 版本c
document.addEventListener('DOMContentLoaded', function() {
    // 表单提交处理
    document.getElementById('bazi-form').addEventListener('submit', function(e) {
        e.preventDefault();
        calculateBazi();
    });
    
    // 打印功能
    document.getElementById('print-btn').addEventListener('click', function() {
        window.print();
    });
    
    // 保存功能
    document.getElementById('save-btn').addEventListener('click', function() {
        saveBaziResult();
    });
});

function calculateBazi() {
    // 获取表单数据
    const birthDate = document.getElementById('birth-date').value;
    const birthHour = document.getElementById('birth-hour').value;
    const birthMinute = document.getElementById('birth-minute').value;
    const timezone = document.getElementById('timezone').value;
    const gender = document.querySelector('input[name="gender"]:checked').value;
    
    // 验证输入
    if (!birthDate || birthHour === '' || birthMinute === '') {
        alert('请填写完整的出生日期和时间');
        return;
    }
    
    // 解析日期
    const dateParts = birthDate.split('-');
    const year = parseInt(dateParts[0]);
    const month = parseInt(dateParts[1]);
    const day = parseInt(dateParts[2]);
    const hour = parseInt(birthHour);
    const minute = parseInt(birthMinute);
    
    try {
        // 使用lunar.js 1.7.2计算八字
        const solarDate = new Date(year, month - 1, day, hour, minute);
        const lunarDate = Lunar.fromDate(solarDate);
        
        // 获取年柱 - 使用lunar.js 1.7.2的正确API
        const yearGan = lunarDate.getYearGan();
        const yearZhi = lunarDate.getYearZhi();
        
        // 获取月柱
        const monthGan = lunarDate.getMonthGan();
        const monthZhi = lunarDate.getMonthZhi();
        
        // 获取日柱
        const dayGan = lunarDate.getDayGan();
        const dayZhi = lunarDate.getDayZhi();
        
        // 获取时柱 - 需要根据日干计算
        const hourGanZhi = getHourGanZhi(dayGan, hour);
        
        // 构建八字对象
        const bazi = {
            year: {
                stem: yearGan,
                branch: yearZhi,
                element: getElementFromStem(yearGan)
            },
            month: {
                stem: monthGan,
                branch: monthZhi,
                element: getElementFromStem(monthGan)
            },
            day: {
                stem: dayGan,
                branch: dayZhi,
                element: getElementFromStem(dayGan)
            },
            hour: {
                stem: hourGanZhi.substring(0, 1),
                branch: hourGanZhi.substring(1),
                element: getElementFromStem(hourGanZhi.substring(0, 1))
            },
            lunarDate: lunarDate.getYear() + '年' + lunarDate.getMonth() + '月' + lunarDate.getDay() + '日',
            zodiac: lunarDate.getYearShengXiao(),
            // 其他信息...
        };
        
        // 显示结果
        displayBaziResult(bazi, {
            date: `${year}年${month}月${day}日`,
            time: `${hour}:${minute.toString().padStart(2, '0')}`,
            gender: gender === 'male' ? '男' : '女',
            timezone: `UTC${timezone >= 0 ? '+' : ''}${timezone}`
        });
        
        // 显示结果区域
        document.getElementById('result-section').style.display = 'block';
        
        // 滚动到结果区域
        document.getElementById('result-section').scrollIntoView({ behavior: 'smooth' });
        
    } catch (error) {
        console.error('八字计算错误:', error);
        alert('八字计算出错，请检查输入数据是否正确');
    }
}

// 根据日干和小时计算时柱
function getHourGanZhi(dayGan, hour) {
    // 时柱地支固定顺序
    const zhiList = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
    const hourZhi = zhiList[Math.floor((hour + 1) / 2) % 12];
    
    // 五鼠遁口诀：甲己还加甲，乙庚丙作初，丙辛从戊起，丁壬庚子居，戊癸何方发，壬子是真途
    const startGanMap = {
        '甲': 0, '己': 0,
        '乙': 2, '庚': 2,
        '丙': 4, '辛': 4,
        '丁': 6, '壬': 6,
        '戊': 8, '癸': 8
    };
    
    const ganList = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
    const startIndex = startGanMap[dayGan];
    const hourGan = ganList[(startIndex + Math.floor((hour + 1) / 2)) % 10];
    
    return hourGan + hourZhi;
}

// 天干对应的五行
function getElementFromStem(gan) {
    const elementMap = {
        '甲': '木', '乙': '木',
        '丙': '火', '丁': '火',
        '戊': '土', '己': '土',
        '庚': '金', '辛': '金',
        '壬': '水', '癸': '水'
    };
    return elementMap[gan] || '未知';
}

// 显示八字结果
function displayBaziResult(bazi, info) {
    // 更新基本信息
    document.getElementById('result-date').textContent = info.date;
    document.getElementById('result-time').textContent = info.time;
    document.getElementById('result-lunar').textContent = bazi.lunarDate;
    document.getElementById('result-zodiac').textContent = bazi.zodiac;
    
    // 更新八字四柱
    document.getElementById('year-stem').textContent = bazi.year.stem;
    document.getElementById('month-stem').textContent = bazi.month.stem;
    document.getElementById('day-stem').textContent = bazi.day.stem;
    document.getElementById('hour-stem').textContent = bazi.hour.stem;
    
    document.getElementById('year-branch').textContent = bazi.year.branch;
    document.getElementById('month-branch').textContent = bazi.month.branch;
    document.getElementById('day-branch').textContent = bazi.day.branch;
    document.getElementById('hour-branch').textContent = bazi.hour.branch;
    
    document.getElementById('year-element').textContent = bazi.year.element;
    document.getElementById('month-element').textContent = bazi.month.element;
    document.getElementById('day-element').textContent = bazi.day.element;
    document.getElementById('hour-element').textContent = bazi.hour.element;
    
    // 其他信息更新...
    document.getElementById('result-minggong').textContent = '待计算';
    document.getElementById('result-shengong').textContent = '待计算';
    document.getElementById('result-wuxing').textContent = '待计算';
    document.getElementById('result-xiyong').textContent = '待计算';
    document.getElementById('result-jishen').textContent = '待计算';
    
    // 十神分析
    document.getElementById('year-main-god').textContent = '待计算';
    document.getElementById('month-main-god').textContent = '待计算';
    document.getElementById('day-main-god').textContent = '日元';
    document.getElementById('hour-main-god').textContent = '待计算';
    
    document.getElementById('year-hidden-god').textContent = '待计算';
    document.getElementById('month-hidden-god').textContent = '待计算';
    document.getElementById('day-hidden-god').textContent = '待计算';
    document.getElementById('hour-hidden-god').textContent = '待计算';
}

function saveBaziResult() {
    // 这里可以实现保存功能，如生成图片或PDF
    alert('保存功能将在后续版本实现');
}
