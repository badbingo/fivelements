// 八字计算器功能实现
document.addEventListener('DOMContentLoaded', function() {
    // 加载lunar.js库
    loadLunarScript();
    
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

function loadLunarScript() {
    // 检查是否已加载
    if (typeof Lunar !== 'undefined') return;
    
    // 动态加载lunar.js
    const script = document.createElement('script');
    script.src = '../js/lunar.js';
    script.onload = function() {
        console.log('lunar.js loaded successfully');
    };
    script.onerror = function() {
        console.error('Failed to load lunar.js');
        alert('无法加载八字计算库，请稍后再试');
    };
    document.head.appendChild(script);
}

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
        const lunarDate = Lunar.fromDate(new Date(year, month - 1, day, hour, minute));
        const bazi = lunarDate.getBazi();
        
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
    
    // 更新十神分析
    document.getElementById('year-main-god').textContent = bazi.year.mainGod;
    document.getElementById('month-main-god').textContent = bazi.month.mainGod;
    document.getElementById('day-main-god').textContent = bazi.day.mainGod;
    document.getElementById('hour-main-god').textContent = bazi.hour.mainGod;
    
    document.getElementById('year-hidden-god').textContent = bazi.year.hiddenGods.join(', ');
    document.getElementById('month-hidden-god').textContent = bazi.month.hiddenGods.join(', ');
    document.getElementById('day-hidden-god').textContent = bazi.day.hiddenGods.join(', ');
    document.getElementById('hour-hidden-god').textContent = bazi.hour.hiddenGods.join(', ');
    
    // 更新五行分析
    updateWuxingChart(bazi.wuxing);
    document.getElementById('result-wuxing').textContent = bazi.wuxing.strength;
    document.getElementById('result-xiyong').textContent = bazi.wuxing.favorableElements.join('、');
    document.getElementById('result-jishen').textContent = bazi.wuxing.unfavorableElements.join('、');
    
    // 更新大运
    updateDayunTable(bazi.dayun);
    
    // 更新流年
    updateLiunian(bazi.liunian);
}

function updateWuxingChart(wuxing) {
    const elements = ['wood', 'fire', 'earth', 'metal', 'water'];
    elements.forEach(el => {
        const bar = document.querySelector(`.wuxing-bar.${el}`);
        if (bar) {
            bar.style.height = `${wuxing.percentages[el]}%`;
        }
    });
}

function updateDayunTable(dayunList) {
    const tbody = document.getElementById('dayun-table');
    tbody.innerHTML = '';
    
    dayunList.forEach(dayun => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${dayun.period}</td>
            <td>${dayun.startYear}-${dayun.endYear}</td>
            <td>${dayun.stem}</td>
            <td>${dayun.branch}</td>
            <td>${dayun.element}</td>
            <td>${dayun.fortune}</td>
        `;
        tbody.appendChild(row);
    });
}

function updateLiunian(liunian) {
    document.getElementById('liunian-ganzhi').textContent = liunian.ganzhi;
    document.getElementById('liunian-yunshi').textContent = liunian.fortune;
    document.getElementById('liunian-notice').textContent = liunian.notice;
}

function saveBaziResult() {
    // 这里可以实现保存功能，如生成图片或PDF
    alert('保存功能将在后续版本实现');
}
