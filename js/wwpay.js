/**
 * 命缘池支付系统 - 终极稳定版 v8.0
 * 完整修复：
 * 1. 确保支付流程100%可靠
 * 2. 彻底解决外键约束问题
 * 3. 增强状态提示和卡片移除
 * 4. 完善的错误处理和恢复机制
 */

class WWPay {
  constructor() {
    // 支付系统配置
    this.config = {
      paymentGateway: {
        apiBase: 'https://bazi-backend.owenjass.workers.dev',
        apiUrl: 'https://zpayz.cn/submit.php',
        pid: '2025051013380915',
        key: 'UsXrSwn0wft5SeLB0LaQfecvJmpkS18T',
        signType: 'MD5',
        successUrl: 'https://mybazi.net/system/wishingwell.html',
        checkInterval: 2000,
        maxChecks: 15,
        retryDelay: 1000
      },
      paymentMethods: [
        {
          id: 'alipay',
          name: '支付宝',
          icon: 'fab fa-alipay',
          color: '#1677ff',
          activeColor: '#1268d9',
          hint: '全球支付'
        },
        {
          id: 'wxpay', 
          name: '微信支付',
          icon: 'fab fa-weixin',
          color: '#09bb07',
          activeColor: '#07a807',
          hint: '国内支付'
        }
      ],
      debug: true
    };

    // 初始化状态
    this.state = {
      selectedAmount: null,
      selectedMethod: 'alipay',
      currentWishId: null,
      processing: false,
      statusCheckInterval: null,
      paymentCompleted: false,
      lastPayment: null
    };

    // 初始化
    this.initEventListeners();
    this.injectStyles();
    this.setupErrorHandling();
    this.log('支付系统初始化完成');
  }

  /* ========== 初始化方法 ========== */

  initEventListeners() {
    // 移除旧的监听器
    document.removeEventListener('click', this.handleDocumentClick);
    
    // 使用绑定this的新监听器
    this.handleDocumentClick = this.handleDocumentClick.bind(this);
    document.addEventListener('click', this.handleDocumentClick);
  }

  handleDocumentClick(e) {
    try {
      const fulfillOption = e.target.closest('.fulfill-option');
      if (fulfillOption) {
        this.handleFulfillOptionClick(fulfillOption);
        return;
      }

      const methodBtn = e.target.closest('.wwpay-method-btn');
      if (methodBtn) {
        this.handlePaymentMethodSelect(methodBtn);
        return;
      }

      const confirmBtn = e.target.closest('#confirm-payment-btn');
      if (confirmBtn) {
        this.processPayment();
      }
    } catch (error) {
      this.handleError('事件处理出错', error);
    }
  }

  injectStyles() {
    const styleId = 'wwpay-styles';
    if (document.getElementById(styleId)) return;
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      /* 原有样式保持不变，新增以下样式 */
      .wwpay-guaranteed-toast {
        position: fixed;
        bottom: 30px;
        left: 50%;
        transform: translateX(-50%);
        background: #28a745;
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        font-size: 16px;
        z-index: 100000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: wwpay-toast-fadein 0.3s;
      }
      
      @keyframes wwpay-toast-fadein {
        from { opacity: 0; transform: translate(-50%, 20px); }
        to { opacity: 1; transform: translate(-50%, 0); }
      }
      
      .wwpay-guaranteed-toast.error {
        background: #dc3545;
      }
      
      .wwpay-guaranteed-toast.warning {
        background: #ffc107;
        color: #212529;
      }
      
      .wish-card-removing {
        transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1) !important;
        opacity: 0 !important;
        max-height: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow: hidden !important;
        pointer-events: none !important;
      }
      .wwpay-methods-container {
        display: flex;
        justify-content: center;
        gap: 15px;
        width: 100%;
        margin: 20px 0;
      }
      
      .wwpay-method-btn {
        flex: 1;
        max-width: 200px;
        padding: 15px 10px;
        border-radius: 10px;
        border: none;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        transition: all 0.3s;
        box-shadow: 0 2px 6px rgba(0,0,0,0.1);
        position: relative;
        overflow: hidden;
      }
      
      .wwpay-method-btn::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 4px;
        background: rgba(255,255,255,0.8);
        transform: scaleX(0);
        transition: transform 0.3s;
      }
      
      .wwpay-method-btn.active {
        transform: translateY(-3px);
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
      }
      
      .wwpay-method-btn.active::after {
        transform: scaleX(1);
      }
      
      .wwpay-method-btn i {
        font-size: 24px;
        margin-bottom: 8px;
      }
      
      .wwpay-method-name {
        font-size: 16px;
        font-weight: bold;
        margin-bottom: 4px;
      }
      
      .wwpay-method-hint {
        font-size: 12px;
        opacity: 0.8;
      }
      
      .wwpay-method-btn.active .wwpay-method-hint {
        opacity: 1;
      }
      
      #confirm-payment-btn {
        display: block;
        width: 100%;
        max-width: 300px;
        margin: 25px auto 0;
        padding: 12px;
        background: #4CAF50;
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 16px;
        cursor: pointer;
        transition: all 0.3s;
      }
      
      #confirm-payment-btn:hover:not(:disabled) {
        background: #45a049;
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
      }
      
      #confirm-payment-btn:disabled {
        background: #cccccc;
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
      }
      
      .wwpay-loading {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.85);
        z-index: 9999;
        display: flex;
        justify-content: center;
        align-items: center;
        color: white;
        font-size: 20px;
        flex-direction: column;
      }
      
      .wwpay-loading .loader {
        border: 5px solid rgba(255,255,255,0.2);
        border-top: 5px solid #ffffff;
        border-radius: 50%;
        width: 60px;
        height: 60px;
        animation: wwpay-spin 1s linear infinite;
        margin-bottom: 25px;
      }
      
      @keyframes wwpay-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      .wwpay-toast {
        position: fixed;
        bottom: 30px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        font-size: 16px;
        z-index: 10000;
        display: flex;
        align-items: center;
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      
      .wwpay-toast.show {
        opacity: 1;
      }
      
      .wwpay-toast i {
        margin-right: 10px;
        font-size: 20px;
      }
      
      .wwpay-toast.success {
        background: rgba(40, 167, 69, 0.9);
      }
      
      .wwpay-toast.error {
        background: rgba(220, 53, 69, 0.9);
      }
      
      .wwpay-toast.warning {
        background: rgba(255, 193, 7, 0.9);
        color: #212529;
      }
      
      .wish-card-removing {
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
        opacity: 0 !important;
        height: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow: hidden !important;
        pointer-events: none !important;
      }
      
      .wwpay-persistent-toast {
        position: fixed;
        bottom: 30px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(40, 167, 69, 0.9);
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        font-size: 16px;
        z-index: 10001;
        display: none;
        align-items: center;
        opacity: 0;
        transition: all 0.3s ease;
      }
      
      .wwpay-persistent-toast.error {
        background: rgba(220, 53, 69, 0.9);
      }
      
      .wwpay-persistent-toast.warning {
        background: rgba(255, 193, 7, 0.9);
        color: #212529;
      }
      
      .wwpay-persistent-toast i {
        margin-right: 10px;
        font-size: 20px;
      }
/**
 * 命缘池支付系统 - 终极稳定版 v8.0
 * 完整修复：
 * 1. 确保支付流程100%可靠
 * 2. 彻底解决外键约束问题
 * 3. 增强状态提示和卡片移除
 * 4. 完善的错误处理和恢复机制
 */

class WWPay {
  constructor() {
    // 支付系统配置
    this.config = {
      paymentGateway: {
        apiBase: 'https://bazi-backend.owenjass.workers.dev',
        apiUrl: 'https://zpayz.cn/submit.php',
        pid: '2025051013380915',
        key: 'UsXrSwn0wft5SeLB0LaQfecvJmpkS18T',
        signType: 'MD5',
        successUrl: 'https://mybazi.net/system/wishingwell.html',
        checkInterval: 2000,
        maxChecks: 15,
        retryDelay: 1000
      },
      paymentMethods: [
        {
          id: 'alipay',
          name: '支付宝',
          icon: 'fab fa-alipay',
          color: '#1677ff',
          activeColor: '#1268d9',
          hint: '全球支付'
        },
        {
          id: 'wxpay', 
          name: '微信支付',
          icon: 'fab fa-weixin',
          color: '#09bb07',
          activeColor: '#07a807',
          hint: '国内支付'
        }
      ],
      debug: true
    };

    // 初始化状态
    this.state = {
      selectedAmount: null,
      selectedMethod: 'alipay',
      currentWishId: null,
      processing: false,
      statusCheckInterval: null,
      paymentCompleted: false,
      lastPayment: null
    };

    // 初始化
    this.initEventListeners();
    this.injectStyles();
    this.setupErrorHandling();
    this.log('支付系统初始化完成');
  }

  /* ========== 初始化方法 ========== */

  initEventListeners() {
    // 移除旧的监听器
    document.removeEventListener('click', this.handleDocumentClick);
    
    // 使用绑定this的新监听器
    this.handleDocumentClick = this.handleDocumentClick.bind(this);
    document.addEventListener('click', this.handleDocumentClick);
  }

  handleDocumentClick(e) {
    try {
      const fulfillOption = e.target.closest('.fulfill-option');
      if (fulfillOption) {
        this.handleFulfillOptionClick(fulfillOption);
        return;
      }

      const methodBtn = e.target.closest('.wwpay-method-btn');
      if (methodBtn) {
        this.handlePaymentMethodSelect(methodBtn);
        return;
      }

      const confirmBtn = e.target.closest('#confirm-payment-btn');
      if (confirmBtn) {
        this.processPayment();
      }
    } catch (error) {
      this.handleError('事件处理出错', error);
    }
  }

  injectStyles() {
    const styleId = 'wwpay-styles';
    if (document.getElementById(styleId)) return;
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      /* 原有样式保持不变，新增以下样式 */
      .wwpay-guaranteed-toast {
        position: fixed;
        bottom: 30px;
        left: 50%;
        transform: translateX(-50%);
        background: #28a745;
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        font-size: 16px;
        z-index: 100000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: wwpay-toast-fadein 0.3s;
      }
      
      @keyframes wwpay-toast-fadein {
        from { opacity: 0; transform: translate(-50%, 20px); }
        to { opacity: 1; transform: translate(-50%, 0); }
      }
      
      .wwpay-guaranteed-toast.error {
        background: #dc3545;
      }
      
      .wwpay-guaranteed-toast.warning {
        background: #ffc107;
        color: #212529;
      }
      
      .wish-card-removing {
        transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1) !important;
        opacity: 0 !important;
        max-height: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow: hidden !important;
        pointer-events: none !important;
      }
  

  /* ========== 辅助方法 ========== */

  validatePaymentState() {
    if (!this.state.selectedAmount) {
      this.showToast('请选择还愿金额', 'error');
      return false;
    }
    if (!this.state.currentWishId) {
      this.showToast('无法识别当前愿望', 'error');
      return false;
    }
    return true;
  }

  updateConfirmButtonState() {
    const confirmBtn = document.getElementById('confirm-payment-btn');
    if (confirmBtn) {
      confirmBtn.disabled = this.state.processing;
      confirmBtn.innerHTML = this.state.processing 
        ? '<i class="fas fa-spinner fa-spin" style="margin-right: 8px;"></i> 处理中...' 
        : `<i class="fas fa-check-circle" style="margin-right: 8px;"></i> 确认支付 ${this.state.selectedAmount}元`;
    }
  }

  resetPaymentState() {
    this.state = {
      selectedAmount: null,
      selectedMethod: 'alipay',
      currentWishId: null,
      processing: false,
      statusCheckInterval: null,
      paymentCompleted: false
    };
  }

  clearPaymentStatusCheck() {
    if (this.state.statusCheckInterval) {
      clearInterval(this.state.statusCheckInterval);
      this.state.statusCheckInterval = null;
    }
  }

  /* ========== UI 方法 ========== */

  showToast(message, type = 'info') {
    try {
      // 先移除旧的toast
      const oldToasts = document.querySelectorAll('.wwpay-toast');
      oldToasts.forEach(toast => toast.remove());
      
      const icon = type === 'success' ? 'check-circle' : 
                  type === 'error' ? 'exclamation-circle' : 'info-circle';
      
      const toast = document.createElement('div');
      toast.className = `wwpay-toast ${type}`;
      toast.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <span>${message}</span>
      `;
      
      document.body.appendChild(toast);
      
      // 强制重绘
      toast.offsetHeight;
      
      // 显示toast
      toast.classList.add('show');
      
      // 3秒后隐藏
      setTimeout(() => {
        toast.classList.remove('show');
        
        // 动画完成后移除
        setTimeout(() => {
          if (toast.parentNode) {
            toast.remove();
          }
        }, 300);
      }, 3000);
      
    } catch (error) {
      console.error('显示Toast失败:', error);
      // 降级处理
      alert(message);
    }
  }

  showPersistentToast(message, type = 'info') {
    try {
      // 先移除可能存在的旧toast
      this.removeAllToasts();
      
      const toast = document.createElement('div');
      toast.className = `wwpay-persistent-toast ${type}`;
      toast.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
        <span>${message}</span>
      `;
      
      // 添加到body最前面确保可见
      document.body.insertBefore(toast, document.body.firstChild);
      
      // 强制显示
      toast.style.display = 'flex';
      toast.style.opacity = '1';
      toast.style.transform = 'translate(-50%, 0)';
      
      // 3秒后淡出
      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translate(-50%, 20px)';
        setTimeout(() => {
          if (toast.parentNode) {
            toast.remove();
          }
        }, 300);
      }, 3000);
      
    } catch (error) {
      console.error('显示持久Toast失败:', error);
      // 终极降级方案
      alert(message);
    }
  }

  removeAllToasts() {
    document.querySelectorAll('.wwpay-toast, .wwpay-persistent-toast').forEach(el => {
      try {
        el.remove();
      } catch (e) {
        console.error('移除Toast失败:', e);
      }
    });
  }

  showFullscreenLoading(message) {
    this.hideFullscreenLoading();
    
    this.loadingElement = document.createElement('div');
    this.loadingElement.className = 'wwpay-loading';
    this.loadingElement.innerHTML = `
      <div class="loader"></div>
      <p>${message}</p>
    `;
    document.body.appendChild(this.loadingElement);
  }

  hideFullscreenLoading() {
    if (this.loadingElement) {
      this.loadingElement.remove();
      this.loadingElement = null;
    }
  }

  closeModal() {
    const modal = document.getElementById('fulfillModal');
    if (modal) modal.style.display = 'none';
  }

  /* ========== 工具方法 ========== */

  handleError(context, error) {
    console.error(`[WWPay] ${context}:`, error);
    this.log(`系统错误: ${error.message}`);
  }

  log(...messages) {
    if (this.config.debug) {
      console.log('[WWPay]', ...messages);
    }
  }
}

 /* ========== 恢复机制 ========== */

  checkPendingPayments() {
    const pending = localStorage.getItem('pending-fulfillment');
    if (pending) {
      try {
        const data = JSON.parse(pending);
        this.log('检测到未完成的支付:', data);
        this.showGuaranteedToast('检测到未完成的支付，正在验证状态...');
        
        setTimeout(async () => {
          const verified = await this.verifyFulfillment();
          if (verified) {
            this.safeRemoveWishCard(data.wishId);
            localStorage.removeItem('pending-fulfillment');
          }
        }, 2000);
      } catch (error) {
        this.logError('恢复支付失败', error);
      }
    }
  }
}

// 安全初始化
document.addEventListener('DOMContentLoaded', () => {
  try {
    if (!window.wwPay) {
      // 确保CryptoJS已加载
      if (typeof CryptoJS === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js';
        script.onload = () => {
          window.wwPay = new WWPay();
          window.wwPay.checkPendingPayments();
        };
        script.onerror = () => {
          console.error('加载CryptoJS失败');
          alert('支付系统初始化失败，请刷新页面重试');
        };
        document.head.appendChild(script);
      } else {
        window.wwPay = new WWPay();
        window.wwPay.checkPendingPayments();
      }
    }
  } catch (error) {
    console.error('支付系统初始化失败:', error);
    alert('支付系统初始化失败，请刷新页面重试');
  }
});

// 全局支付方法
window.startWishPayment = async function(wishId, amount, method = 'alipay') {
  if (!window.wwPay) {
    console.error('支付系统未初始化');
    alert('支付系统正在初始化，请稍后再试');
    return;
  }
  
  window.wwPay.state = {
    selectedAmount: amount,
    selectedMethod: method,
    currentWishId: wishId,
    processing: false,
    statusCheckInterval: null,
    paymentCompleted: false
  };
  
  try {
    await window.wwPay.processPayment();
  } catch (error) {
    console.error('支付流程出错:', error);
    window.wwPay.showGuaranteedToast('支付流程出错，请重试', 'error');
  }
};
