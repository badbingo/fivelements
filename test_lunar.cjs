// 测试农历日期的Node.js脚本
const fs = require('fs');

// 读取lunar.js文件内容
const lunarJs = fs.readFileSync('./js/lunar.js', 'utf8');

// 在全局作用域中执行lunar.js
eval(lunarJs);

// 测试今天的日期 2025年8月26日
const today = new Date(2025, 7, 26); // 月份从0开始，所以8月是7
console.log('测试日期:', today.toDateString());

try {
    const solar = Solar.fromDate(today);
    const lunar = solar.getLunar();
    
    console.log('公历:', `${solar.getYear()}年${solar.getMonth()}月${solar.getDay()}日`);
    console.log('农历年:', lunar.getYear());
    console.log('农历月:', lunar.getMonth());
    console.log('农历日:', lunar.getDay());
    console.log('农历月中文:', lunar.getMonthInChinese());
    console.log('农历日中文:', lunar.getDayInChinese());
    console.log('完整农历:', `${lunar.getMonthInChinese()}${lunar.getDayInChinese()}`);
    
    // 测试几个不同的日期
    const testDates = [
        new Date(2025, 7, 1),  // 2025年8月1日
        new Date(2025, 7, 15), // 2025年8月15日
        new Date(2025, 7, 26), // 2025年8月26日（今天）
        new Date(2025, 8, 1),  // 2025年9月1日
    ];
    
    console.log('\n其他测试日期:');
    testDates.forEach(date => {
        const s = Solar.fromDate(date);
        const l = s.getLunar();
        console.log(`${s.getYear()}年${s.getMonth()}月${s.getDay()}日 -> ${l.getMonthInChinese()}${l.getDayInChinese()}`);
    });
    
} catch (error) {
    console.error('错误:', error.message);
}