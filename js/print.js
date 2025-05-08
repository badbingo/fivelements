document.addEventListener('DOMContentLoaded', function() {
    // 为所有可展开的子目录添加点击事件
    document.querySelectorAll('.load-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const sectionId = this.getAttribute('data-section') + '-content';
            const section = document.getElementById(sectionId);
            
            // 先移除可能存在的旧打印按钮
            const existingBtn = section.querySelector('.section-print-btn');
            if (existingBtn) existingBtn.remove();
            
            // 创建新的打印按钮
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

function printSubsection(sectionId) {
    const section = document.getElementById(sectionId);
    if (!section) return;

    // 获取标题和用户信息
    const title = section.closest('.detail-card').querySelector('.load-btn span').textContent;
    const userName = document.getElementById('user-name-display')?.textContent || '匿名用户';
    const birthInfo = document.getElementById('user-birth-display')?.textContent || '';
    
    // 创建打印窗口
    const printWindow = window.open('', '_blank');
    
    // 构建打印内容
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>机缘命理 - ${title}</title>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
            <style>
                body { font-family: 'Noto Serif SC', serif; padding: 20px; }
                .print-header { text-align: center; margin-bottom: 20px; }
                @page { size: auto; margin: 15mm; }
            </style>
        </head>
        <body>
            <div class="print-header">
                <h2>${title}</h2>
                <p>${userName} ${birthInfo ? '· '+birthInfo : ''}</p>
            </div>
            ${section.innerHTML.replace('section-print-btn', '')}
            <script>setTimeout(()=>{window.print();window.close()},300)</script>
        </body>
        </html>
    `);
    printWindow.document.close();
}
