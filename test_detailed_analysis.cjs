// 使用Node.js内置的fetch API (Node.js 18+)

// 测试详细分析API
async function testDetailedAnalysis() {
  console.log('开始测试详细分析API...');
  
  // 模拟八字数据
  const testBaziData = {
    paipan: {
      yearPillar: '甲子',
      monthPillar: '丙寅',
      dayPillar: '戊辰',
      hourPillar: '庚申',
      dayMaster: '戊',
      yearNayin: '海中金'
    },
    wuxing: {
      wood: 2,
      fire: 1,
      earth: 2,
      metal: 2,
      water: 1,
      strength: '身强',
      favorableElements: ['金', '水'],
      unfavorableElements: ['木', '火']
    },
    personality: {
      detailedAnalysis: '性格稳重，做事踏实',
      strengths: ['责任心强', '意志坚定'],
      weaknesses: ['有时过于固执', '不够灵活'],
      suggestions: ['多听取他人意见', '保持开放心态']
    },
    dayun: {
      currentPeriod: '己巳',
      periods: []
    },
    liunian: {
      currentYear: '甲辰',
      fortune: '平稳'
    },
    career: {
      suitableFields: ['管理', '金融'],
      development: '稳步上升'
    },
    marriage: {
      timing: '适中',
      compatibility: '良好'
    },
    health: {
      constitution: '偏强',
      risks: ['消化系统'],
      advice: ['注意饮食规律']
    }
  };

  // 测试所有九个分析类型
  const analysisTypes = [
    'full-analysis',
    'annual-fortune', 
    'monthly-fortune',
    'decade-fortune',
    'personality',
    'career',
    'marriage',
    'children',
    'health'
  ];

  const results = {};
  
  for (const analysisType of analysisTypes) {
    try {
      console.log(`\n测试分析类型: ${analysisType}`);
      
      const response = await fetch('http://192.168.1.56:8788/api/detailed-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          baziData: testBaziData,
          analysisType: analysisType
        })
      });

      if (response.ok) {
        const result = await response.json();
        results[analysisType] = {
          success: true,
          analysisType: result.analysisType,
          contentLength: result.content ? result.content.length : 0,
          timestamp: result.timestamp
        };
        console.log(`✅ ${analysisType} 测试成功`);
        console.log(`   内容长度: ${results[analysisType].contentLength} 字符`);
      } else {
        const errorText = await response.text();
        results[analysisType] = {
          success: false,
          error: `HTTP ${response.status}: ${errorText}`
        };
        console.log(`❌ ${analysisType} 测试失败: ${results[analysisType].error}`);
      }
    } catch (error) {
      results[analysisType] = {
        success: false,
        error: error.message
      };
      console.log(`❌ ${analysisType} 测试异常: ${error.message}`);
    }
    
    // 添加延迟避免请求过快
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // 输出测试总结
  console.log('\n=== 测试总结 ===');
  const successCount = Object.values(results).filter(r => r.success).length;
  const totalCount = analysisTypes.length;
  
  console.log(`成功: ${successCount}/${totalCount}`);
  console.log(`失败: ${totalCount - successCount}/${totalCount}`);
  
  if (successCount === totalCount) {
    console.log('\n🎉 所有分析模块测试通过！');
  } else {
    console.log('\n⚠️  部分分析模块测试失败，请检查：');
    Object.entries(results).forEach(([type, result]) => {
      if (!result.success) {
        console.log(`   - ${type}: ${result.error}`);
      }
    });
  }
  
  return results;
}

// 运行测试
testDetailedAnalysis().catch(console.error);