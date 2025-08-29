import { calculateBaziLocally } from './src/bazi-calculator.js';

// 测试具体的八字：壬子 癸丑 己巳 癸酉
const testBirthData = {
    date: '1973-02-02',
    time: '18:12',
    gender: 'male'
};

console.log('=== 测试八字：壬子 癸丑 己巳 癸酉 ===');
console.log('日主：己土');
console.log('用户反馈：应该是从弱，但显示为身强');
console.log('');

const result = calculateBaziLocally(testBirthData);
console.log('计算结果：', result.strengthType);
console.log('当前大运：', result.currentDayun);
console.log('');

// 手动分析这个八字
console.log('=== 手动分析 ===');
console.log('八字：壬子 癸丑 己巳 癸酉');
console.log('日主：己土');
console.log('');

console.log('天干分析：');
console.log('- 壬水：克己土（耗身）');
console.log('- 癸水：克己土（耗身）');
console.log('- 癸水：克己土（耗身）');
console.log('天干中没有帮身的土或火');
console.log('');

console.log('地支分析：');
console.log('- 子水：克己土（耗身）');
console.log('- 丑土：帮身，但力量有限');
console.log('- 巳火：生己土（帮身）');
console.log('- 酉金：被己土克（耗身）');
console.log('');

console.log('藏干分析：');
console.log('- 子藏癸：克己土');
console.log('- 丑藏己癸辛：己帮身，癸辛耗身');
console.log('- 巳藏丙庚戊：丙生己土，戊帮身，庚耗身');
console.log('- 酉藏辛：耗身');
console.log('');

console.log('月令分析：');
console.log('- 月支丑土：虽然是土，但丑为湿土，且藏干中癸水辛金较强');
console.log('- 丑月为冬季末，水势仍强');
console.log('');

console.log('综合分析：');
console.log('- 天干三个水克土，无帮身');
console.log('- 地支中只有丑土和巳火帮身，但丑土湿润，巳火被子水冲克');
console.log('- 整体水势很强，土势很弱');
console.log('- 应该判断为身弱或从弱');