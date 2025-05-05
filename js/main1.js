// 八字计算器功能实现
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
        // 使用lunar.js计算八字
        // 注意：根据实际lunar.js库的API进行调整
        const solarDate = new Date(year, month - 1, day, hour, minute);
        const lunarDate = Lunar.fromDate(solarDate);
        
        // 获取八字信息 - 根据实际lunar.js库的API进行调整
        const bazi = {
            year: {
                stem: lunarDate.getYearGan(),
                branch: lunarDate.getYearZhi(),
                element: getElementFromStem(lunarDate.getYearGan())
            },
            month: {
                stem: lunarDate.getMonthGan(),
                branch: lunarDate.getMonthZhi(),
                element: getElementFromStem(lunarDate.getMonthGan())
            },
            day: {
                stem: lunarDate.getDayGan(),
                branch: lunarDate.getDayZhi(),
                element: getElementFromStem(lunarDate.getDayGan())
            },
            hour: {
                stem: lunarDate.getHourGan(hour),
                branch: lunarDate.getHourZhi(hour),
                element: getElementFromStem(lunarDate.getHourGan(hour))
            },
            lunarDate: lunarDate.toYMD(), // 农历日期
            zodiac: lunarDate.getYearShengXiao(), // 生肖
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
}

function saveBaziResult() {
    // 这里可以实现保存功能，如生成图片或PDF
    alert('保存功能将在后续版本实现');
}
