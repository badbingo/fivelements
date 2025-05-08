// 初始化内容加载器
function initContentLoaders() {
  document.querySelectorAll('.load-btn').forEach(btn => {
    btn.addEventListener('click', async function() {
      const sectionId = this.dataset.section + '-content';
      const section = document.getElementById(sectionId);
      if (!section) return;

      // 1. 准备阶段 - 隐藏所有内容
      section.classList.remove('loaded');
      hidePrintButton(section);
      
      // 2. 显示加载动画
      showLoadingAnimation(section);

      try {
        // 3. 加载内容（替换为您的实际加载逻辑）
        await loadContent(sectionId);
        
        // 4. 隐藏加载动画
        hideLoadingAnimation(section);
        
        // 5. 显示内容和打印按钮
        section.classList.add('loaded');
        showPrintButton(section, sectionId);
        
      } catch (error) {
        hideLoadingAnimation(section);
        console.error('加载失败:', error);
      }
    });
  });
}

// 显示加载动画
function showLoadingAnimation(section) {
  // 移除旧的加载动画
  const existingOverlay = section.querySelector('.loading-overlay');
  if (existingOverlay) existingOverlay.remove();

  // 创建新的加载动画
  const overlay = document.createElement('div');
  overlay.className = 'loading-overlay';
  overlay.innerHTML = '<div class="spinner"></div>';
  section.appendChild(overlay);
}

// 隐藏加载动画
function hideLoadingAnimation(section) {
  const overlay = section.querySelector('.loading-overlay');
  if (overlay) overlay.remove();
}

// 隐藏打印按钮
function hidePrintButton(section) {
  const btnContainer = section.nextElementSibling;
  if (btnContainer && btnContainer.classList.contains('print-btn-container')) {
    btnContainer.style.display = 'none';
  }
}

// 显示打印按钮
function showPrintButton(section, sectionId) {
  let btnContainer = section.nextElementSibling;
  
  // 创建按钮容器（如果不存在）
  if (!btnContainer || !btnContainer.classList.contains('print-btn-container')) {
    btnContainer = document.createElement('div');
    btnContainer.className = 'print-btn-container';
    section.parentNode.insertBefore(btnContainer, section.nextSibling);
  }

  // 创建/更新打印按钮
  btnContainer.innerHTML = '';
  const printBtn = document.createElement('button');
  printBtn.className = 'section-print-btn';
  printBtn.innerHTML = '<i class="fas fa-print"></i> 打印本段内容';
  
  printBtn.addEventListener('click', () => {
    printSection(sectionId);
  });

  btnContainer.appendChild(printBtn);
  btnContainer.style.display = 'block';
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
        body { font-family: 'Noto Serif SC', serif; padding: 20px }
        @page { size: auto; margin: 15mm }
      </style>
    </head>
    <body>
      ${section.innerHTML.replace(/loading-overlay/g, '')}
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
      const section = document.getElementById(sectionId);
      section.innerHTML = `
        <div class="loaded-content">
          <h3>${sectionId.replace('-content', '')}</h3>
          <p>这是实际加载完成的内容...</p>
          <p>所有内容都在加载完成后才会显示</p>
        </div>
      `;
      resolve();
    }, 1500); // 模拟网络请求延迟
  });
}

// 初始化
document.addEventListener('DOMContentLoaded', initContentLoaders);
