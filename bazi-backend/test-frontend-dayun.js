// 测试前端大运计算逻辑
const birthDate = new Date(1992, 11, 25); // 1992年12月25日 (月份从0开始)
const currentYear = new Date().getFullYear();
const currentAge = currentYear - birthDate.getFullYear() + 1; // 虚岁

console.log('=== 前端大运计算测试 ===');
console.log('出生日期:', birthDate.getFullYear() + '-' + (birthDate.getMonth() + 1) + '-' + birthDate.getDate());
console.log('当前年份:', currentYear);
console.log('当前虚岁年龄:', currentAge);

// 八字信息
const monthPillar = '癸丑';
const yearPillar = '壬子';
const yearGan = yearPillar[0]; // '壬'

// 判断顺逆排
const yangTianGan = ['甲', '丙', '戊', '庚', '壬'];
const yinTianGan = ['乙', '丁', '己', '辛', '癸'];
const isMale = true; // 男性

const isForward = (yangTianGan.includes(yearGan) && isMale) || (yinTianGan.includes(yearGan) && !isMale);

console.log('年干:', yearGan);
console.log('性别: 男');
console.log('是否顺排:', isForward);

// 完整的六十甲子表
const jiaZi = [
  '甲子', '乙丑', '丙寅', '丁卯', '戊辰', '己巳', '庚午', '辛未', '壬申', '癸酉', // 0-9
  '甲戌', '乙亥', '丙子', '丁丑', '戊寅', '己卯', '庚辰', '辛巳', '壬午', '癸未', // 10-19
  '甲申', '乙酉', '丙戌', '丁亥', '戊子', '己丑', '庚寅', '辛卯', '壬辰', '癸巳', // 20-29
  '甲午', '乙未', '丙申', '丁酉', '戊戌', '己亥', '庚子', '辛丑', '壬寅', '癸卯', // 30-39
  '甲辰', '乙巳', '丙午', '丁未', '戊申', '己酉', '庚戌', '辛亥', '壬子', '癸丑', // 40-49
  '甲寅', '乙卯', '丙辰', '丁巳', '戊午', '己未', '庚申', '辛酉', '壬戌', '癸亥'  // 50-59
];

console.log('六十甲子表长度:', jiaZi.length);
console.log('己未位置:', jiaZi.indexOf('己未'));

// 找到月柱在六十甲子中的位置
const monthIndex = jiaZi.indexOf(monthPillar);
console.log('月柱:', monthPillar, '位置:', monthIndex);

// 简化的起运年龄计算（前端使用的逻辑）
function estimateDaysToJieQi(month, direction, day) {
    // 简化计算：假设每月30天，节气在月中
    const jieqiDay = 15; // 假设节气在15号
    let daysDiff;
    
    if (direction === '顺排') {
        // 顺排：计算到下个节气的天数
        if (day <= jieqiDay) {
            daysDiff = jieqiDay - day;
        } else {
            daysDiff = 30 - day + jieqiDay; // 到下个月节气
        }
    } else {
        // 逆排：计算到上个节气的天数
        if (day >= jieqiDay) {
            daysDiff = day - jieqiDay;
        } else {
            daysDiff = day + 30 - jieqiDay; // 到上个月节气
        }
    }
    
    return Math.max(1, daysDiff); // 至少1天
}

const direction = isForward ? '顺排' : '逆排';
const estimatedDaysDiff = estimateDaysToJieQi(birthDate.getMonth() + 1, direction, birthDate.getDate());
const startAge = Math.floor(estimatedDaysDiff / 3); // 3天=1岁

console.log('方向:', direction);
console.log('估算天数差:', estimatedDaysDiff);
console.log('起运年龄:', startAge);

// 计算当前大运序号
const dayunIndex = Math.floor((currentAge - startAge) / 10);
console.log('大运序号:', dayunIndex);

if (dayunIndex < 0) {
    console.log('结果: 未起运');
} else {
    // 计算大运干支
    let targetIndex;
    if (isForward) {
        // 顺排：月柱后一位开始
        targetIndex = (monthIndex + dayunIndex + 1) % 60;
    } else {
        // 逆排：月柱前一位开始
        targetIndex = (monthIndex - dayunIndex - 1 + 60) % 60;
    }
    
    const dayunGanZhi = jiaZi[targetIndex];
    const dayunStartAge = startAge + dayunIndex * 10;
    const dayunEndAge = dayunStartAge + 9;
    
    // 计算年份区间（前端逻辑）
    const birthYear = birthDate.getFullYear();
    const dayunStartYear = birthYear + dayunStartAge - 1; // 虚岁转实岁
    const dayunEndYear = birthYear + dayunEndAge - 1;
    
    console.log('\n=== 前端计算结果 ===');
    console.log('当前大运:', dayunGanZhi);
    console.log('年龄区间:', dayunStartAge + '-' + dayunEndAge + '岁');
    console.log('年份区间:', dayunStartYear + '-' + dayunEndYear);
    console.log('完整结果:', dayunGanZhi + ' ' + dayunStartYear + '-' + dayunEndYear);
    
    // 检查己未大运
    const jiWeiIndex = jiaZi.indexOf('己未');
    console.log('\n=== 己未大运分析 ===');
    console.log('己未在六十甲子中的位置:', jiWeiIndex);
    
    // 计算己未是第几步大运
    let jiWeiStep = -1;
    for (let i = 0; i < 8; i++) {
        let stepIndex;
        if (isForward) {
            stepIndex = (monthIndex + i + 1) % 60;
        } else {
            stepIndex = (monthIndex - i - 1 + 60) % 60;
        }
        
        if (stepIndex === jiWeiIndex) {
            jiWeiStep = i;
            break;
        }
    }
    
    if (jiWeiStep >= 0) {
        const jiWeiStartAge = startAge + jiWeiStep * 10;
        const jiWeiEndAge = jiWeiStartAge + 9;
        const jiWeiStartYear = birthYear + jiWeiStartAge - 1;
        const jiWeiEndYear = birthYear + jiWeiEndAge - 1;
        
        console.log('己未是第' + (jiWeiStep + 1) + '步大运');
        console.log('己未年龄区间:', jiWeiStartAge + '-' + jiWeiEndAge + '岁');
        console.log('己未年份区间:', jiWeiStartYear + '-' + jiWeiEndYear);
        console.log('当前年龄' + currentAge + '岁是否在己未大运范围内:', currentAge >= jiWeiStartAge && currentAge <= jiWeiEndAge);
    } else {
        console.log('己未不在8步大运范围内');
    }
}