document.addEventListener('DOMContentLoaded', function() {
    // 创建打印按钮
    const printBtn = document.createElement('button');
    printBtn.className = 'print-btn';
    printBtn.title = '打印本页内容';
    printBtn.innerHTML = '<i class="fas fa-print"></i>';
    document.body.appendChild(printBtn);
    
    // 打印功能
    printBtn.addEventListener('click', function() {
        // 添加打印日期
        const printDate = document.createElement('div');
        printDate.className = 'print-date';
        printDate.textContent = '打印日期: ' + new Date().toLocaleString();
        document.querySelector('.header-container').appendChild(printDate);
        
        // 展开所有折叠内容
        document.querySelectorAll('.load-btn-container').forEach(container => {
            container.classList.add('active');
        });
        document.querySelectorAll('.section-content').forEach(content => {
            content.classList.add('active');
        });
        
        // 延迟执行打印以确保内容已展开
        setTimeout(() => {
            window.print();
            
            // 打印完成后移除日期
            const existingDate = document.querySelector('.print-date');
            if (existingDate) {
                existingDate.remove();
            }
        }, 500);
    });
    
    // 监听打印事件
    window.addEventListener('afterprint', function() {
        // 打印完成后移除日期
        const existingDate = document.querySelector('.print-date');
        if (existingDate) {
            existingDate.remove();
        }
    });
});

// 打印特定部分的功能
function printSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (!section) return;
    
    // 创建打印窗口
    const printWindow = window.open('', '_blank');
    printWindow.document.open();
    
    // 获取当前页面样式
    let styles = '';
    Array.from(document.styleSheets).forEach(sheet => {
        try {
            if (sheet.cssRules) {
                Array.from(sheet.cssRules).forEach(rule => {
                    styles += rule.cssText + '\n';
                });
            }
        } catch (e) {
            console.log('无法读取样式表:', e);
        }
    });
    
    // 构建打印内容
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>赛博命理系统 - ${section.querySelector('h2,h3')?.textContent || '分析报告'}</title>
            <style>
                ${styles}
                
                body {
                    background: white !important;
                    color: black !important;
                    font-size: 14px;
                }
                
                .cyber-grid, 
                .neon-particles, 
                .scanlines,
                .print-btn,
                .menu-tabs,
                .calculate-btn-container,
                .copyright,
                .bazi-qa-container,
                .gambling-analysis,
                .tab-content:not(.active) {
                    display: none !important;
                }
                
                .container {
                    width: 100% !important;
                    padding: 20px !important;
                }
                
                .info-section {
                    break-inside: avoid;
                    page-break-inside: avoid;
                }
                
                @page {
                    size: auto;
                    margin: 15mm;
                    
                    @top-center {
                        content: "赛博命理系统分析报告";
                        font-family: 'Orbitron', sans-serif;
                        font-size: 14px;
                        color: #666;
                    }
                    
                    @bottom-right {
                        content: "页 " counter(page);
                        font-family: 'Orbitron', sans-serif;
                        font-size: 12px;
                        color: #666;
                    }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="print-header">
                    <h1>赛博命理系统</h1>
                    <div class="print-subtitle">${section.querySelector('h2,h3')?.textContent || '专项分析报告'}</div>
                    <div class="print-info">
                        <span>${document.getElementById('user-name-display')?.textContent || ''}</span>
                        <span>打印时间: ${new Date().toLocaleString()}</span>
                    </div>
                </div>
                ${section.innerHTML}
            </div>
            <script>
                window.onload = function() {
                    setTimeout(function() {
                        window.print();
                        window.close();
                    }, 300);
                };
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
}
