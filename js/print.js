// 初始化内容加载器
function initContentLoaders() {
  document.querySelectorAll('.load-btn').forEach(btn => {
    btn.addEventListener('click', async function() {
      const sectionId = this.dataset.section + '-content';
      const section = document.getElementById(sectionId);
      if (!section) return;

      // 隐藏并清空现有按钮
      const btnContainer = getOrCreateButtonContainer(section);
      btnContainer.style.display = 'none';
      btnContainer.innerHTML = '';

      // 显示加载状态
      section.innerHTML = '<div class="loading-indicator">内容加载中...</div>';

      try {
        // 模拟内容加载（替换为您的实际加载逻辑）
        await loadContent(sectionId);
        
        // 内容加载完成后显示打印按钮
        showPrintButton(section, sectionId);
      } catch (error) {
        section.innerHTML = '<div class="error-message">内容加载失败</div>';
        console.error('加载失败:', error);
      }
    });
  });
}

// 获取或创建按钮容器
function getOrCreateButtonContainer(section) {
  let btnContainer = section.nextElementSibling;
  if (!btnContainer || !btnContainer.classList.contains('print-btn-container')) {
    btnContainer = document.createElement('div');
    btnContainer.className = 'print-btn-container';
    section.parentNode.insertBefore(btnContainer, section.nextSibling);
  }
  return btnContainer;
}

// 显示打印按钮
function showPrintButton(section, sectionId) {
  const btnContainer = section.nextElementSibling;
  
  // 创建打印按钮
  const printBtn = document.createElement('button');
  printBtn.className = 'section-print-btn';
  printBtn.innerHTML = '<i class="fas fa-print"></i> 打印本段内容';
  
  // 添加点击事件
  printBtn.addEventListener('click', () => {
    printSection(sectionId);
  });

  // 添加到容器并显示
  btnContainer.innerHTML = '';
  btnContainer.appendChild(printBtn);
  btnContainer.style.display = 'block';
  
  // 滚动到内容底部（可选）
  setTimeout(() => {
    section.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, 100);
}

// 打印功能
function printSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (!section) return;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('请允许弹出窗口以使用打印功能');
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>打印内容</title>
      <style>
        body { font-family: 'Noto Serif SC', serif; padding: 20px; line-height: 1.6 }
        @page { size: auto; margin: 15mm }
      </style>
    </head>
    <body>
      ${section.innerHTML}
      <script>
        setTimeout(() => {
          window.print();
          setTimeout(() => window.close(), 300);
        }, 200);
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
}

// 模拟内容加载（替换为您的实际实现）
async function loadContent(sectionId) {
  return new Promise(resolve => {
    setTimeout(() => {
      document.getElementById(sectionId).innerHTML = `
        <div class="loaded-content">
          <h3>${sectionId.replace('-content', '')}内容</h3>
          <p>这里是实际加载的内容...</p>
          <p>更多详细内容显示在这里...</p>
        </div>
      `;
      resolve();
    }, 800); // 模拟网络延迟
  });
}

// 初始化
document.addEventListener('DOMContentLoaded', initContentLoaders);
