// 打印按钮功能实现
document.addEventListener('click', async function(e) {
  // 打印按钮点击处理
  if (e.target.closest('.section-print-btn')) {
    const printBtn = e.target.closest('.section-print-btn');
    const sectionId = printBtn.closest('.print-btn-container')?.previousElementSibling?.id;
    
    if (!sectionId || !sectionId.endsWith('-content')) return;
    
    // 添加加载状态
    printBtn.classList.add('loading');
    printBtn.innerHTML = '<i class="fas fa-spinner"></i> 准备打印';
    
    try {
      // 获取打印内容
      const section = document.getElementById(sectionId);
      if (!section) throw new Error('内容区域不存在');
      
      const content = section.innerHTML;
      const title = section.closest('.detail-card')?.querySelector('.load-btn span')?.textContent || '命理分析';
      
      // 打开打印窗口
      const printWindow = window.open('', '_blank');
      if (!printWindow) throw new Error('弹出窗口被阻止');
      
      // 构建打印文档
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>打印: ${title}</title>
          <meta charset="UTF-8">
          <style>
            body { 
              font-family: 'Noto Serif SC', serif;
              padding: 20px;
              line-height: 1.6;
              color: #333;
            }
            h2 {
              color: #4a6cf7;
              border-bottom: 1px solid #eee;
              padding-bottom: 10px;
            }
            @page {
              size: auto;
              margin: 15mm;
            }
          </style>
        </head>
        <body>
          <h2>${title}</h2>
          ${content.replace(/section-print-btn/g, '')}
          <script>
            setTimeout(() => {
              window.print();
              setTimeout(() => window.close(), 500);
            }, 200);
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
      
    } catch (error) {
      alert('打印失败: ' + error.message);
      console.error('打印错误:', error);
    } finally {
      // 恢复按钮状态
      setTimeout(() => {
        printBtn.classList.remove('loading');
        printBtn.innerHTML = '<i class="fas fa-print"></i> 打印本段内容';
      }, 500);
    }
  }
});

// 动态内容加载示例（需替换为您的实际逻辑）
function setupContentLoaders() {
  document.querySelectorAll('.load-btn').forEach(btn => {
    btn.addEventListener('click', async function() {
      const sectionId = this.dataset.section + '-content';
      const section = document.getElementById(sectionId);
      if (!section) return;
      
      // 确保按钮容器存在
      let btnContainer = section.nextElementSibling;
      if (!btnContainer?.classList?.contains('print-btn-container')) {
        btnContainer = document.createElement('div');
        btnContainer.className = 'print-btn-container';
        section.parentNode.insertBefore(btnContainer, section.nextSibling);
      }
      
      // 添加打印按钮
      if (!btnContainer.querySelector('.section-print-btn')) {
        const printBtn = document.createElement('button');
        printBtn.className = 'section-print-btn';
        printBtn.innerHTML = '<i class="fas fa-print"></i> 打印本段内容';
        btnContainer.appendChild(printBtn);
      }
      
      // 模拟内容加载
      section.innerHTML = '<div class="loading-text">内容加载中...</div>';
      await new Promise(resolve => setTimeout(resolve, 500));
      section.innerHTML = '<div class="loaded-content">实际内容已加载...</div>';
    });
  });
}

// 初始化
document.addEventListener('DOMContentLoaded', setupContentLoaders);
