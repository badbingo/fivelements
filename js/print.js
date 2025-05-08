// 子目录打印功能
document.addEventListener('DOMContentLoaded', function() {
    // 移除全局打印按钮（如果存在）
    const globalPrintBtn = document.querySelector('.print-btn');
    if (globalPrintBtn) globalPrintBtn.remove();

    // 为所有可展开的子目录添加点击事件
    document.querySelectorAll('.load-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const sectionId = this.getAttribute('data-section') + '-content';
            const section = document.getElementById(sectionId);
            
            // 先移除可能存在的旧打印按钮
            const existingBtn = section.querySelector('.section-print-btn');
            if (existingBtn) existingBtn.remove();
            
            // 创建新的打印按钮（放在内容下方）
            const printBtn = document.createElement('button');
            printBtn.className = 'section-print-btn';
            printBtn.innerHTML = '<i class="fas fa-print"></i> 打印本段内容';
            
            // 添加点击事件
            printBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                printSubsection(sectionId);
            });
            
            // 将按钮添加到内容区域的底部
            section.appendChild(printBtn);
        });
    });
});

// 打印子目录专用函数
function printSubsection(sectionId) {
    const section = document.getElementById(sectionId);
    if (!section) return;

    // 获取标题和用户信息
    const title = section.closest('.detail-card').querySelector('.load-btn span').textContent;
    const userName = document.getElementById('user-name-display').textContent || '匿名用户';
    const birthInfo = document.getElementById('user-birth-display').textContent || '';
    
    // 创建打印窗口
    const printWindow = window.open('', '_blank');
    
    // 构建打印内容
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>赛博命理 - ${title}</title>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
            <style>
                body {
                    padding: 20px;
                    font-family: "Noto Serif SC", serif;
                    color: #333;
                    line-height: 1.6;
                }
                .print-header {
                    text-align: center;
                    margin-bottom: 20px;
                    padding-bottom: 10px;
                    border-bottom: 1px solid #eee;
                }
                .print-header h2 {
                    color: #222;
                    margin-bottom: 5px;
                }
                .user-info {
                    font-size: 14px;
                    color: #666;
                }
                @page {
                    size: A4;
                    margin: 15mm;
                    @top-center {
                        content: "赛博命理 - ${title}";
                        font-size: 10pt;
                    }
                    @bottom-right {
                        content: "页码 " counter(page);
                        font-size: 9pt;
                    }
                }
                /* 保留原有内容样式 */
                .bazi-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 15px 0;
                }
                .bazi-cell {
                    border: 1px solid #ddd;
                    padding: 8px;
                    text-align: center;
                }
                .element-chart-container {
                    width: 80%;
                    margin: 0 auto;
                }
            </style>
        </head>
        <body>
            <div class="print-header">
                <h2>${title}</h2>
                <div class="user-info">
                    ${userName} ${birthInfo ? '· '+birthInfo : ''}
                </div>
            </div>
            ${section.innerHTML.replace('section-print-btn', '')}
            <script>
                // 自动触发打印并关闭窗口
                setTimeout(() => {
                    window.print();
                    window.close();
                }, 300);
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
}
