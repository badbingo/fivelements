// 测试大运计算
const jiaZi = [
    '甲子', '乙丑', '丙寅', '丁卯', '戊辰', '己巳', '庚午', '辛未', '壬申', '癸酉',
    '甲戌', '乙亥', '丙子', '丁丑', '戊寅', '己卯', '庚辰', '辛巳', '壬午', '癸未',
    '甲申', '乙酉', '丙戌', '丁亥', '戊子', '己丑', '庚寅', '辛卯', '壬辰', '癸巳',
    '甲午', '乙未', '丙申', '丁酉', '戊戌', '己亥', '庚子', '辛丑', '壬寅', '癸卯',
    '甲辰', '乙巳', '丙午', '丁未', '戊申', '己酉', '庚戌', '辛亥', '壬子', '癸丑',
    '甲寅', '乙卯', '丙辰', '丁巳', '戊午', '己未', '庚申', '辛酉', '壬戌', '癸亥'
];

// 用户的八字：壬子 癸丑 己巳 癸酉
const baziInfo = {
    yearStem: '壬',
    yearBranch: '子',
    monthStem: '癸',
    monthBranch: '丑',
    dayStem: '己',
    dayBranch: '巳',
    hourStem: '癸',
    hourBranch: '酉'
};

const gender = 'male';
const birthYear = 1992;
const currentAge = 32; // 2024年

console.log('=== 大运计算测试 ===');
console.log('八字:', baziInfo.yearStem + baziInfo.yearBranch, baziInfo.monthStem + baziInfo.monthBranch, baziInfo.dayStem + baziInfo.dayBranch, baziInfo.hourStem + baziInfo.hourBranch);

// 1. 判断顺逆排
const yearGan = baziInfo.yearStem;
const isMale = gender === 'male';
const yangYears = ['甲', '丙', '戊', '庚', '壬'];
const isYangYear = yangYears.includes(yearGan);
const isForward = (isMale && isYangYear) || (!isMale && !isYangYear);

console.log('年干:', yearGan, '是否阳年:', isYangYear, '是否男性:', isMale, '是否顺排:', isForward);

// 2. 找到月柱位置
const monthPillar = baziInfo.monthStem + baziInfo.monthBranch;
const monthIndex = jiaZi.indexOf(monthPillar);
console.log('月柱:', monthPillar, '在六十甲子中的位置:', monthIndex);

// 3. 计算第一步大运
let targetIndex;
if (isForward) {
    // 顺排：月柱后一位开始
    targetIndex = (monthIndex + 1) % 60;
} else {
    // 逆排：月柱前一位开始
    targetIndex = (monthIndex - 1 + 60) % 60;
}

const firstDayun = jiaZi[targetIndex];
console.log('第一步大运应该是:', firstDayun, '索引:', targetIndex);

// 4. 计算当前大运
// 测试实际的起运年龄计算
function estimateDaysToJieQi(month, direction, day) {
    // 简化的节气天数差估算
    const jieQiDays = {
        1: [6, 20], 2: [4, 19], 3: [6, 21], 4: [5, 20],
        5: [6, 21], 6: [6, 21], 7: [7, 23], 8: [8, 23],
        9: [8, 23], 10: [8, 23], 11: [7, 22], 12: [7, 22]
    };
    
    const [firstJieQi, secondJieQi] = jieQiDays[month];
    let daysDiff;
    
    if (direction === '顺排') {
        // 顺排：计算到下个节气的天数
        if (day <= firstJieQi) {
            daysDiff = firstJieQi - day;
        } else if (day <= secondJieQi) {
            daysDiff = secondJieQi - day;
        } else {
            // 到下个月第一个节气
            const nextMonth = month === 12 ? 1 : month + 1;
            const nextFirstJieQi = jieQiDays[nextMonth][0];
            const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
            daysDiff = (daysInMonth - day) + nextFirstJieQi;
        }
    } else {
        // 逆排：计算到上个节气的天数
        if (day >= secondJieQi) {
            daysDiff = day - secondJieQi;
        } else if (day >= firstJieQi) {
            daysDiff = day - firstJieQi;
        } else {
            // 到上个月最后一个节气
            const prevMonth = month === 1 ? 12 : month - 1;
            const prevSecondJieQi = jieQiDays[prevMonth][1];
            daysDiff = day + (30 - prevSecondJieQi); // 简化计算
        }
    }
    
    return Math.abs(daysDiff);
}

function calculateLuckStartingAge(baziInfo, birthDate, gender) {
    const yearGan = baziInfo.yearStem;
    const yangTianGan = ['甲', '丙', '戊', '庚', '壬'];
    const yinTianGan = ['乙', '丁', '己', '辛', '癸'];
    const isMale = gender === 'male';
    
    let direction;
    if ((yangTianGan.includes(yearGan) && isMale) || (yinTianGan.includes(yearGan) && !isMale)) {
        direction = '顺排';
    } else {
        direction = '逆排';
    }
    
    const estimatedDaysDiff = estimateDaysToJieQi(birthDate.getMonth() + 1, direction, birthDate.getDate());
    const years = Math.floor(estimatedDaysDiff / 3);
    
    console.log('起运年龄计算详情:');
    console.log('- 方向:', direction);
    console.log('- 节气天数差:', estimatedDaysDiff);
    console.log('- 起运年龄:', years);
    
    return years;
}

// 用户的出生日期：1992年12月25日
const birthDate = new Date(1992, 11, 25); // 月份从0开始
const actualStartAge = calculateLuckStartingAge(baziInfo, birthDate, gender);
console.log('实际起运年龄:', actualStartAge);

const startAge = actualStartAge;

// 让我们列出所有大运步骤来验证
console.log('\n=== 所有大运步骤 ===');
for (let i = 0; i < 8; i++) {
    const ageStart = startAge + i * 10;
    const ageEnd = ageStart + 9;
    const yearStart = birthYear + ageStart;
    const yearEnd = birthYear + ageEnd;
    
    let targetIndex;
    if (isForward) {
        targetIndex = (monthIndex + i + 1) % 60;
    } else {
        targetIndex = (monthIndex - i - 1 + 60) % 60;
    }
    
    const dayunGanZhi = jiaZi[targetIndex];
    console.log(`第${i+1}步: ${dayunGanZhi} (${ageStart}-${ageEnd}岁, ${yearStart}-${yearEnd}年)`);
    
    if (currentAge >= ageStart && currentAge <= ageEnd) {
        console.log(`  ★ 当前大运: ${dayunGanZhi}`);
    }
}

const currentDayunStep = Math.floor((currentAge - startAge) / 10);
console.log('起运年龄:', startAge, '当前年龄:', currentAge, '当前大运步数:', currentDayunStep);

let currentDayunIndex;
if (isForward) {
    currentDayunIndex = (monthIndex + currentDayunStep + 1) % 60;
} else {
    currentDayunIndex = (monthIndex - currentDayunStep - 1 + 60) % 60;
}

const currentDayun = jiaZi[currentDayunIndex];
console.log('当前大运应该是:', currentDayun, '索引:', currentDayunIndex);

// 5. 验证年份区间
const dayunStartAge = startAge + currentDayunStep * 10;
const dayunEndAge = dayunStartAge + 9;
const dayunStartYear = birthYear + dayunStartAge;
const dayunEndYear = birthYear + dayunEndAge;
console.log('当前大运年龄区间:', dayunStartAge + '-' + dayunEndAge + '岁');
console.log('当前大运年份区间:', dayunStartYear + '-' + dayunEndYear);

// 让我们也测试一下如果当前大运是己未，应该在什么年龄段
const jiWeiIndex = jiaZi.indexOf('己未');
console.log('\n=== 己未大运分析 ===');
console.log('己未在六十甲子中的位置:', jiWeiIndex);

// 如果己未是当前大运，那么从月柱癸丑(49)到己未(55)需要几步
const stepsToJiWei = (jiWeiIndex - monthIndex + 60) % 60;
console.log('从月柱到己未需要:', stepsToJiWei, '步');

// 如果是顺排，己未应该是第几步大运
const jiWeiStep = stepsToJiWei - 1; // 减1因为第一步是月柱后一位
console.log('己未应该是第', jiWeiStep + 1, '步大运');

// 己未大运的年龄区间
const jiWeiStartAge = startAge + jiWeiStep * 10;
const jiWeiEndAge = jiWeiStartAge + 9;
console.log('己未大运年龄区间:', jiWeiStartAge + '-' + jiWeiEndAge + '岁');
console.log('己未大运年份区间:', (birthYear + jiWeiStartAge) + '-' + (birthYear + jiWeiEndAge));

// 检查32岁是否在己未大运范围内
if (currentAge >= jiWeiStartAge && currentAge <= jiWeiEndAge) {
    console.log('✓ 32岁确实在己未大运范围内！');
} else {
    console.log('✗ 32岁不在己未大运范围内');
}