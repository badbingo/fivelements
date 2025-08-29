// 使用puppeteer来获取baziphone.html的测试结果
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // 监听所有控制台输出和错误
  page.on('console', msg => {
    const text = msg.text();
    console.log('浏览器控制台:', text);
    // 如果是错误对象，尝试获取更多信息
    if (text.includes('JSHandle@error')) {
      msg.args().forEach(async (arg, i) => {
        const val = await arg.jsonValue().catch(() => arg.toString());
        console.log(`参数 ${i}:`, val);
      });
    }
  });
  
  page.on('pageerror', error => {
    console.log('页面错误:', error.message);
    console.log('错误堆栈:', error.stack);
  });
  
  await page.goto('http://localhost:8000/bazi_mobile_app/assets/baziphone.html');
  
  // 等待页面加载
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // 设置测试八字：壬子，癸丑，己巳，癸酉
  await page.evaluate(() => {
    console.log('=== 测试八字：壬子，癸丑，己巳，癸酉 ===');
    
    // 使用baziphone.html的完整计算流程
    const yearStr = '壬子';
    const monthStr = '癸丑';
    const dayStr = '己巳';
    const hourStr = '癸酉';
    
    // 获取藏干
    const hiddenStems = {
      year: getHiddenStems('子'),
      month: getHiddenStems('丑'),
      day: getHiddenStems('巳'),
      hour: getHiddenStems('酉')
    };
    
    console.log('藏干:', hiddenStems);
    
    // 使用baziphone.html的calculateElements函数计算五行权重
    const elements = calculateElements(yearStr, monthStr, dayStr, hourStr, hiddenStems);
    console.log('五行权重:', elements);
    
    // 提取参数
    const dayStem = dayStr.charAt(0); // '己'
    const monthBranch = monthStr.charAt(1); // '丑'
    const branches = [yearStr.charAt(1), monthStr.charAt(1), dayStr.charAt(1), hourStr.charAt(1)];
    const stems = [yearStr.charAt(0), monthStr.charAt(0), dayStr.charAt(0), hourStr.charAt(0)];
    
    console.log('日主:', dayStem);
    console.log('月支:', monthBranch);
    console.log('地支:', branches);
    console.log('天干:', stems);
    
    // 触发计算
    if (typeof calculateStrength === 'function') {
      const result = calculateStrength(dayStem, elements, monthBranch, branches, stems);
      console.log('强度比例:', result.strengthRatio);
      console.log('强度百分比:', result.strengthPercentage + '%');
      console.log('生扶力量:', result.supportStrength);
      console.log('克泄力量:', result.weakenStrength);
      console.log('月令得分:', result.monthScore);
      console.log('身强身弱类型:', result.strengthType);
      
      // 更新页面标题
      document.title = `测试结果: ${result.strengthPercentage}% | 生扶:${result.supportStrength} | 克泄:${result.weakenStrength} | 月令:${result.monthScore} | 类型:${result.strengthType}`;
    }
  });
  
  // 等待计算完成
   await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 获取页面标题中的测试结果
  const title = await page.title();
  console.log('页面标题:', title);
  
  // 检查页面上是否有测试结果显示
  const resultDiv = await page.$('div[style*="position:fixed"]');
  if (resultDiv) {
    const resultText = await page.evaluate(el => el.textContent, resultDiv);
    console.log('页面显示结果:', resultText);
  }
  
  await browser.close();
})();