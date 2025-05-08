// 修改后的打印按钮添加逻辑
window.addEventListener('load', function() {
    // 1. 添加全局打印按钮
    const globalPrintBtn = document.createElement('button');
    globalPrintBtn.className = 'print-btn';
    globalPrintBtn.innerHTML = '<i class="fas fa-print"></i>';
    globalPrintBtn.title = '打印全部内容';
    document.body.appendChild(globalPrintBtn);
    
    globalPrintBtn.addEventListener('click', function() {
        window.print();
    });

    // 2. 为每个可加载的内容区块添加打印按钮
    document.querySelectorAll('.load-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const sectionId = this.getAttribute('data-section') + '-content';
            const section = document.getElementById(sectionId);
            
            // 确保只添加一次打印按钮
            if (!section || section.querySelector('.section-print-btn')) return;
            
            // 创建区块打印按钮
            const sectionPrintBtn = document.createElement('button');
            sectionPrintBtn.className = 'section-print-btn';
            sectionPrintBtn.innerHTML = '<i class="fas fa-print"></i> 打印本段内容';
            
            // 添加点击事件
            sectionPrintBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                printSection(sectionId);
            });
            
            // 将按钮添加到内容区域的顶部
            section.insertBefore(sectionPrintBtn, section.firstChild);
        });
    });
});

// 打印特定区块内容
function printSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (!section) return;

    // 获取标题文本
    const title = section.closest('.detail-card').querySelector('.load-btn span').textContent;
    
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
                    font-family: 'Noto Serif SC', serif;
                    color: #333;
                }
                .print-header {
                    text-align: center;
                    margin-bottom: 20px;
                    border-bottom: 1px solid #eee;
                    padding-bottom: 10px;
                }
                .print-header h2 {
                    margin-bottom: 5px;
                    color: #222;
                }
                .print-user-info {
                    font-size: 14px;
                    color: #666;
                }
                @page {
                    margin: 15mm;
                    @top-center {
                        content: "赛博命理分析报告";
                        font-size: 12px;
                    }
                    @bottom-right {
                        content: "页 " counter(page);
                        font-size: 10px;
                    }
                }
            </style>
        </head>
        <body>
            <div class="print-header">
                <h2>${title}</h2>
                <div class="print-user-info">
                    ${document.getElementById('user-name-display').textContent} | ${new Date().toLocaleString()}
                </div>
            </div>
            ${section.innerHTML.replace('section-print-btn', '')}
            <script>
                setTimeout(() => { window.print(); window.close(); }, 300);
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
}
