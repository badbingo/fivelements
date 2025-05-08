document.addEventListener('DOMContentLoaded', function() {
  // 新版按钮加载机制
  function initPrintButtons() {
    // 先移除所有旧按钮
    document.querySelectorAll('.section-print-btn').forEach(btn => btn.remove());
    
    // 为每个内容区域添加按钮
    document.querySelectorAll('[id$="-content"]').forEach(section => {
      if (section.innerHTML.trim() === '') return;
      
      const btn = document.createElement('button');
      btn.className = 'section-print-btn';
      btn.innerHTML = '<i class="fas fa-print"></i> 打印本段内容';
      
      btn.onclick = (e) => {
        e.stopPropagation();
        const sectionId = section.id;
        const content = section.innerHTML;
        const title = section.closest('.detail-card')?.querySelector('.load-btn span')?.textContent || '命理分析';
        
        // 创建打印窗口
        const printWin = window.open('', '_blank');
        printWin.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>打印: ${title}</title>
            <style>
              body { font-family: 'Noto Serif SC', serif; padding: 20px }
              h2 { color: #333; border-bottom: 1px solid #eee; padding-bottom: 10px }
            </style>
          </head>
          <body>
            <h2>${title}</h2>
            ${content.replace(/section-print-btn/g, '')}
            <script>
              setTimeout(() => {
                window.print();
                setTimeout(() => window.close(), 300);
              }, 200);
            </script>
          </body>
          </html>
        `);
        printWin.document.close();
      };
      
      // 确保按钮添加到内容底部
      const container = document.createElement('div');
      container.style.textAlign = 'center';
      container.style.marginTop = '25px';
      container.appendChild(btn);
      section.appendChild(container);
    });
  }

  // 监听内容加载事件（根据您的实际加载方式调整）
  const observer = new MutationObserver(() => initPrintButtons());
  observer.observe(document.getElementById('result-section'), {
    childList: true,
    subtree: true
  });

  // 初始加载
  setTimeout(initPrintButtons, 500);
  
  // 修复滚动问题
  document.body.style.overflow = 'auto';
  window.addEventListener('scroll', () => {
    document.documentElement.style.overflowAnchor = 'none';
  });
});
