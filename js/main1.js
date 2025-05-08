// 八字计算器 - 完整版
document.addEventListener('DOMContentLoaded', function() {
    // 初始化表单提交
    document.getElementById('bazi-form').addEventListener('submit', function(e) {
        e.preventDefault();
        calculateBazi();
    });

    // 打印按钮 - 完整功能
    document.getElementById('print-btn').addEventListener('click', function() {
        const resultSection = document.getElementById('result-section');
        if (resultSection.style.display === 'none' || resultSection.style.display === '') {
            alert('请先计算八字结果再打印');
            return;
        }
        
        // 创建一个打印优化的版本
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>八字命盘打印</title>
                <meta charset="UTF-8">
                <style>
                    body { font-family: "Microsoft YaHei", Arial, sans-serif; padding: 20px; color: #333; }
                    .print-header { text-align: center; margin-bottom: 20px; }
                    .print-header h2 { color: #333; margin-bottom: 5px; }
                    .print-header p { color: #666; }
                    .bazi-grid { 
                        display: grid; 
                        grid-template-columns: repeat(4, 1fr); 
                        gap: 15px; 
                        margin: 20px 0;
                    }
                    .pillar { 
                        border: 1px solid #ddd; 
                        padding: 15px; 
                        text-align: center;
                        border-radius: 5px;
                        background-color: #f9f9f9;
                    }
                    .pillar-title { 
                        font-weight: bold; 
                        margin-bottom: 10px;
                        font-size: 18px;
                        color: #444;
                    }
                    .pillar-content {
                        font-size: 16px;
                        line-height: 1.6;
                    }
                    .wuxing-木 { color: #388e3c; font-weight: bold; }
                    .wuxing-火 { color: #d32f2f; font-weight: bold; }
                    .wuxing-土 { color: #5d4037; font-weight: bold; }
                    .wuxing-金 { color: #ffa000; font-weight: bold; }
                    .wuxing-水 { color: #1976d2; font-weight: bold; }
                    .ten-god { 
                        display: block; 
                        font-size: 14px; 
                        color: #666;
                        margin-top: 5px;
                    }
                    .info-table { 
                        width: 100%; 
                        border-collapse: collapse; 
                        margin: 20px 0;
                        font-size: 14px;
                    }
                    .info-table th { 
                        background-color: #f5f5f5; 
                        padding: 10px; 
                        text-align: left;
                        border: 1px solid #ddd;
                    }
                    .info-table td { 
                        padding: 10px; 
                        border: 1px solid #ddd;
                        vertical-align: top;
                    }
                    .info-table tr:nth-child(even) { background-color: #f9f9f9; }
                    .hidden-god { line-height: 1.6; }
                    .footer-note {
                        margin-top: 30px;
                        font-size: 12px;
                        color: #777;
                        text-align: center;
                        border-top: 1px solid #eee;
                        padding-top: 10px;
                    }
                    @media print {
                        .no-print { display: none !important; }
                        body { padding: 5mm; }
                        .bazi-grid { page-break-inside: avoid; }
                        .info-table { page-break-inside: avoid; }
                    }
                    @page { size: auto; margin: 5mm; }
                </style>
            </head>
            <body>
                <div class="print-header">
                    <h2>八字命盘分析报告</h2>
                    <p>生成时间: ${new Date().toLocaleString()}</p>
                </div>
                
                <h3>基本信息</h3>
                <table class="info-table">
                    <tr>
                        <th>出生日期</th>
                        <td>${document.getElementById('result-date').textContent}</td>
                        <th>出生时间</th>
                        <td>${document.getElementById('result-time').textContent}</td>
                    </tr>
                    <tr>
                        <th>农历日期</th>
                        <td>${document.getElementById('result-lunar').textContent}</td>
                        <th>生肖属相</th>
                        <td>${document.getElementById('result-zodiac').textContent}</td>
                    </tr>
                    <tr>
                        <th>命宫</th>
                        <td>${document.getElementById('result-minggong').textContent}</td>
                        <th>身宫</th>
                        <td>${document.getElementById('result-shengong').textContent}</td>
                    </tr>
                </table>
                
                <h3>四柱排盘</h3>
                <div class="bazi-grid">
                    ${['year', 'month', 'day', 'hour'].map(pillar => `
                        <div class="pillar">
                            <div class="pillar-title">${pillar === 'year' ? '年柱' : pillar === 'month' ? '月柱' : pillar === 'day' ? '日柱' : '时柱'}</div>
                            <div class="pillar-content">
                                <span class="wuxing-${getElementFromStem(document.getElementById(`${pillar}-stem`).textContent.split('\n')[0]).toLowerCase()}">
                                    ${document.getElementById(`${pillar}-stem`).textContent.split('\n')[0]}
                                </span>
                                <span class="wuxing-${getElementFromStem(document.getElementById(`${pillar}-branch`).textContent.split('\n')[0]).toLowerCase()}">
                                    ${document.getElementById(`${pillar}-branch`).textContent.split('\n')[0]}
                                </span>
                                <span class="ten-god">${document.querySelector(`#${pillar}-stem .ten-god`).textContent}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <h3>详细分析</h3>
                <table class="info-table">
                    <tr>
                        <th width="15%">柱位</th>
                        <th width="20%">藏干</th>
                        <th width="15%">空亡</th>
                        <th width="25%">纳音</th>
                        <th>五行</th>
                    </tr>
                    ${['year', 'month', 'day', 'hour'].map(pillar => `
                        <tr>
                            <td>${pillar === 'year' ? '年柱' : pillar === 'month' ? '月柱' : pillar === 'day' ? '日柱' : '时柱'}</td>
                            <td class="hidden-god">${document.getElementById(`${pillar}-hidden-god`).innerHTML.replace(/<br>/g, '\n')}</td>
                            <td>${document.getElementById(`${pillar}-void`).textContent}</td>
                            <td>${document.getElementById(`${pillar}-nayin`).
