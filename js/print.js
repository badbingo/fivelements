/**
 * 机缘命理系统 - 子目录打印功能
 * 版本: 2.1
 * 最后更新: 2025-05-08
 */

document.addEventListener('DOMContentLoaded', function() {
    // 初始化打印功能
    initPrintFunctionality();
    
    // 监听内容加载事件（根据你的实际内容加载机制可能需要调整）
    document.addEventListener('contentLoaded', function() {
        initPrintButtons();
    });
});

/**
 * 初始化打印功能
 */
function initPrintFunctionality() {
    // 为所有可展开的子目录添加点击事件
    document.querySelectorAll('.load-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const sectionId = this.getAttribute('data-section') + '-content';
            const section = document.getElementById(sectionId);
            
            // 使用MutationObserver监听内容变化
            const observer = new MutationObserver(function(mutations) {
                mutations.forEach(() => {
                    // 当内容变化时添加打印按钮
                    addPrintButton(section, sectionId);
                });
            });
            
            // 配置观察选项
            const config = { 
                childList: true, 
                subtree: true,
                attributes: false,
                characterData: false
            };
            
            // 开始观察
            observer.observe(section, config);
            
            // 初始添加打印按钮
            addPrintButton(section, sectionId);
        });
    });
    
    // 如果内容已经加载，立即初始化打印按钮
    if (document.querySelector('.section-content')) {
        initPrintButtons();
    }
}

/**
 * 初始化所有内容区域的打印按钮
 */
function initPrintButtons() {
    document.querySelectorAll('.section-content').forEach(section => {
        const sectionId = section.id;
        if (sectionId && sectionId.endsWith('-content')) {
            addPrintButton(section, sectionId);
        }
    });
}

/**
 * 添加打印按钮到指定区域
 * @param {HTMLElement} section - 内容区域元素
 * @param {string} sectionId - 内容区域ID
 */
function addPrintButton(section, sectionId) {
    if (!section) return;
    
    // 先移除可能存在的旧打印按钮
    const existingBtn = section.querySelector('.section-print-btn');
    if (existingBtn) {
        existingBtn.remove();
    }
    
    // 创建新的打印按钮
    const printBtn = document.createElement('button');
    printBtn.className = 'section-print-btn';
    printBtn.innerHTML = '<i class="fas fa-print"></i> 打印本段内容';
    printBtn.title = '打印当前章节内容';
    
    // 添加点击事件
    printBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        printSubsection(sectionId);
    });
    
    // 确保内容区域已完全渲染
    setTimeout(() => {
        // 检查是否已经有打印按钮
        if (!section.querySelector('.section-print-btn')) {
            section.appendChild(printBtn);
            
            // 滚动到按钮位置确保可见
            printBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, 300);
}

/**
 * 打印指定子目录内容
 * @param {string} sectionId - 要打印的内容区域ID
 */
function printSubsection(sectionId) {
    const section = document.getElementById(sectionId);
    if (!section) {
        console.error('打印错误: 未找到内容区域', sectionId);
        return;
    }

    // 获取标题和用户信息
    const title = section.closest('.detail-card')?.querySelector('.load-btn span')?.textContent || '命理分析';
    const userName = document.getElementById('user-name-display')?.textContent || '匿名用户';
    const birthInfo = document.getElementById('user-birth-display')?.textContent || '';
    
    // 创建打印窗口
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert('弹出窗口被阻止，请允许本站点弹出窗口或使用浏览器打印功能手动选择内容。');
        return;
    }
    
    // 构建打印内容HTML
    const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>机缘命理 - ${title}</title>
            <meta charset="UTF-8">
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
            <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;500;700&display=swap" rel="stylesheet">
            <style>
                body { 
                    font-family: 'Noto Serif SC', serif; 
                    padding: 20px; 
                    line-height: 1.6;
                    color: #333;
                }
                .print-header { 
                    text-align: center; 
                    margin-bottom: 20px;
                    padding-bottom: 15px;
                    border-bottom: 1px solid #eee;
                }
                .print-header h2 {
                    color: #222;
                    margin-bottom: 5px;
                }
                .user-info {
                    color: #666;
                    font-size: 14px;
                }
                .section-content {
                    max-width: 800px;
                    margin: 0 auto;
                }
                @page { 
                    size: auto; 
                    margin: 15mm; 
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 15px 0;
                }
                th, td {
                    border: 1px solid #ddd;
                    padding: 8px;
                    text-align: center;
                }
                th {
                    background-color: #f5f5f5;
                }
                .section-print-btn {
                    display: none !important;
                }
                .detail-card {
                    page-break-inside: avoid;
                }
            </style>
        </head>
        <body>
            <div class="print-header">
                <h2>${title}</h2>
                <p class="user-info">${userName} ${birthInfo ? '· '+birthInfo : ''}</p>
            </div>
            <div class="section-content">
                ${section.innerHTML}
            </div>
            <script>
                // 自动触发打印
                setTimeout(function() {
                    window.print();
                    window.addEventListener('afterprint', function() {
                        window.close();
                    });
                    
                    // 备用关闭机制
                    setTimeout(function() {
                        if (!window.closed) {
                            window.close();
                        }
                    }, 3000);
                }, 300);
            </script>
        </body>
        </html>
    `;
    
    // 写入打印内容
    printWindow.document.open();
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // 焦点转移到打印窗口
    printWindow.focus();
}

// 导出函数以便其他模块使用（如果需要）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initPrintFunctionality,
        printSubsection
    };
}
