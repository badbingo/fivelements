// 使用轻量级事件委托替代多个监听器
document.addEventListener('click', function(e) {
  const loadBtn = e.target.closest('.load-btn');
  if (loadBtn) {
    handleLoadButtonClick(loadBtn);
  }
  
  const printBtn = e.target.closest('.section-print-btn');
  if (printBtn) {
    e.stopPropagation();
    const sectionId = printBtn.closest('.section-content')?.id;
    if (sectionId) printSubsection(sectionId);
  }
});

// 优化后的加载按钮处理
function handleLoadButtonClick(btn) {
  const sectionId = btn.getAttribute('data-section') + '-content';
  const section = document.getElementById(sectionId);
  if (!section) return;

  // 使用requestAnimationFrame优化渲染
  requestAnimationFrame(() => {
    // 移除旧内容时使用淡出动画
    section.style.transition = 'opacity 150ms';
    section.style.opacity = '0';
    
    setTimeout(() => {
      // 模拟内容加载（替换为您的实际加载逻辑）
      loadSectionContent(sectionId).then(() => {
        addPrintButton(section);
        section.style.opacity = '1';
      });
    }, 150);
  });
}

// 优化的内容加载函数（示例）
function loadSectionContent(sectionId) {
  return new Promise(resolve => {
    // 这里替换为您的实际内容加载逻辑
    const fakeContent = `<div class="content">${sectionId.replace('-content','')}内容加载...</div>`;
    document.getElementById(sectionId).innerHTML = fakeContent;
    setTimeout(resolve, 50); // 模拟异步加载
  });
}

// 防抖的打印按钮添加
const addPrintButton = debounce(function(section) {
  const existingBtn = section.querySelector('.section-print-btn');
  if (existingBtn) return;

  const btn = document.createElement('button');
  btn.className = 'section-print-btn';
  btn.innerHTML = '<i class="fas fa-print"></i> 打印本段内容';
  section.appendChild(btn);
}, 100);

// 优化的打印功能
function printSubsection(sectionId) {
  const content = document.getElementById(sectionId)?.innerHTML;
  if (!content) return;

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  // 使用模板字符串简化打印文档
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>打印内容</title>
      <style>body{font-family: sans-serif; padding: 20px}</style>
    </head>
    <body>
      ${content.replace(/section-print-btn/g, '')}
      <script>setTimeout(()=>window.print(),200)</script>
    </body>
    </html>
  `);
  printWindow.document.close();
}

// 防抖函数
function debounce(fn, delay) {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}
