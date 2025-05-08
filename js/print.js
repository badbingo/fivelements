// 确保在页面完全加载后执行
window.addEventListener('load', function() {
    // 1. 添加全局打印按钮
    const globalPrintBtn = document.createElement('button');
    globalPrintBtn.className = 'print-btn';
    globalPrintBtn.innerHTML = '<i class="fas fa-print"></i>';
    globalPrintBtn.title = '打印全部内容';
    document.body.appendChild(globalPrintBtn);
    
    // 全局打印功能
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
            
            // 将按钮添加到内容区域
            section.appendChild(sectionPrintBtn);
        });
    });
});

// 打印特定区块内容
function printSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (!section) return;

    // 创建打印窗口
    const printWindow = window.open('', '_blank');
    
    // 构建打印内容
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>机缘命理 - ${section.previousElementSibling.querySelector('span').textContent}</title>
            <link rel="stylesheet" href="../css/print.css">
            <style>
                body { 
                    padding: 20px; 
                    font-family: 'Noto Serif SC', serif;
                }
                .print-header {
                    text-align: center;
                    margin-bottom: 20px;
                    border-bottom: 1px solid #eee;
                    padding-bottom: 10px;
                }
                @page {
                    margin: 15mm;
                    @top-center {
                        content: "机缘命理分析报告";
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
                <h2>${section.previousElementSibling.querySelector('span').textContent}</h2>
                <p>${document.getElementById('user-name-display').textContent} | ${new Date().toLocaleString()}</p>
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
