// 使用事件委托处理所有交互
document.addEventListener('click', async function(e) {
  // 处理目录按钮点击
  if (e.target.closest('.load-btn')) {
    const btn = e.target.closest('.load-btn');
    const sectionId = btn.dataset.section + '-content';
    const section = document.getElementById(sectionId);
    
    if (!section) return;
    
    // 添加保护容器
    if (!section.classList.contains('section-content-protected')) {
      section.classList.add('section-content-protected');
      
      // 创建按钮容器（放在内容外部）
      const btnContainer = document.createElement('div');
      btnContainer.className = 'print-btn-container';
      btnContainer.id = `${sectionId}-btn-container`;
      
      // 插入到内容之后
      section.parentNode.insertBefore(btnContainer, section.nextSibling);
    }
    
    // 显示加载状态
    section.innerHTML = '<div class="loading-spinner">内容加载中...</div>';
    
    // 加载内容（替换为您的实际加载逻辑）
    await loadSectionContent(sectionId);
    
    // 确保按钮存在
    ensurePrintButton(sectionId);
  }
  
  // 处理打印按钮点击
  if (e.target.closest('.section-print-btn')) {
    e.preventDefault();
    const btn = e.target.closest('.section-print-btn');
    const sectionId = btn.dataset.targetSection;
    printSection(sectionId);
  }
});

// 确保打印按钮存在
function ensurePrintButton(sectionId) {
  const container = document.getElementById(`${sectionId}-btn-container`);
  if (!container) return;
  
  // 移除旧按钮
  container.querySelectorAll('.section-print-btn').forEach(btn => btn.remove());
  
  // 添加新按钮
  const printBtn = document.createElement('button');
  printBtn.className = 'section-print-btn';
  printBtn.innerHTML = '<i class="fas fa-print"></i> 打印本段内容';
  printBtn.dataset.targetSection = sectionId;
  container.appendChild(printBtn);
}

// 打印功能
function printSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (!section) return;
  
  const printContent = section.innerHTML;
  const title = section.closest('.detail-card')?.querySelector('.load-btn span')?.textContent || '内容打印';
  
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('请允许弹出窗口以使用打印功能');
    return;
  }
  
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>打印: ${title}</title>
      <style>
        body { font-family: 'Noto Serif SC', serif; padding: 20px }
        @page { size: auto; margin: 10mm }
        .no-print { display: none !important }
      </style>
    </head>
    <body>
      <h2>${title}</h2>
      ${printContent}
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
}

// 模拟内容加载（替换为您的实际数据加载）
async function loadSectionContent(sectionId) {
  return new Promise(resolve => {
    setTimeout(() => {
      document.getElementById(sectionId).innerHTML = `
        <div class="loaded-content">
          <h3>${sectionId.replace('-content', '')}内容</h3>
          <p>这里是加载完成的具体内容...</p>
        </div>
      `;
      resolve();
    }, 300);
  });
}
