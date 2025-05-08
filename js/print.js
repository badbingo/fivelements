// 为每个可展开的部分添加打印按钮
document.addEventListener('DOMContentLoaded', function() {
    // 监听所有加载按钮的点击事件
    document.querySelectorAll('.load-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            // 确保内容已经加载完成（这里假设您的API调用完成后会显示内容）
            setTimeout(() => {
                const sectionId = this.getAttribute('data-section') + '-content';
                const section = document.getElementById(sectionId);
                
                // 如果已经添加过打印按钮，则不再添加
                if (section.querySelector('.section-print-btn')) return;
                
                // 创建打印按钮
                const printBtn = document.createElement('button');
                printBtn.className = 'section-print-btn';
                printBtn.innerHTML = '<i class="fas fa-print"></i> 打印本段内容';
                printBtn.onclick = (e) => {
                    e.stopPropagation();
                    printSection(sectionId);
                };
                
                // 将打印按钮添加到内容底部
                section.appendChild(printBtn);
            }, 500); // 延迟确保内容已加载
        });
    });
});

// 打印特定部分的功能
function printSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (!section) return;
    
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
    
    // 创建打印窗口
    const printWindow = window.open('', '_blank');
    printWindow.document.open();
    
    // 构建打印内容
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>机缘命理 - ${section.previousElementSibling?.querySelector('span')?.textContent || '分析报告'}</title>
            <style>
                ${styles}
                
                body {
                    background: white !important;
                    color: black !important;
                    font-size: 14px;
                    padding: 20px;
                }
                
                .print-header {
                    text-align: center;
                    margin-bottom: 20px;
                    border-bottom: 1px solid #eee;
                    padding-bottom: 15px;
                }
                
                .print-title {
                    font-size: 22px;
                    font-weight: bold;
                    margin-bottom: 5px;
                }
                
                .print-info {
                    font-size: 12px;
                    color: #666;
                    margin-top: 10px;
                }
                
                .section-print-btn {
                    display: none;
                }
                
                @page {
                    size: auto;
                    margin: 15mm;
                    
                    @top-center {
                        content: "机缘命理分析报告";
                        font-family: 'Noto Serif SC', serif;
                        font-size: 14px;
                        color: #666;
                    }
                    
                    @bottom-right {
                        content: "页 " counter(page);
                        font-family: 'Noto Serif SC', serif;
                        font-size: 12px;
                        color: #666;
                    }
                }
            </style>
        </head>
        <body>
            <div class="print-header">
                <div class="print-title">机缘命理系统</div>
                <div class="print-subtitle">${section.previousElementSibling?.querySelector('span')?.textContent || '专项分析报告'}</div>
                <div class="print-info">
                    <span>${document.getElementById('user-name-display')?.textContent || ''}</span> | 
                    <span>${document.getElementById('user-birth-display')?.textContent || ''}</span> | 
                    <span>打印时间: ${new Date().toLocaleString()}</span>
                </div>
            </div>
            ${section.innerHTML.replace('section-print-btn', '')}
        </body>
        </html>
    `);
    printWindow.document.close();
}
