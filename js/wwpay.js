/**
 * 命缘池支付系统 - 优化修复版 v6.1
 * 修复问题：
 * 1. 支付按钮文字混乱问题
 * 2. 按钮并排显示
 * 3. 支付成功提示和卡片移除功能
 */

class WWPay {
  constructor() {
    // 支付系统配置
    this.config = {
      // 支付网关配置
      paymentGateway: {
        apiBase: 'https://bazi-backend.owenjass.workers.dev',
        apiUrl: 'https://zpayz.cn/submit.php',
        pid: '2025051013380915',
        key: 'UsXrSwn0wft5SeLB0LaQfecvJmpkS18T',
        signType: 'MD5',
        successUrl: 'https://mybazi.net/system/wishingwell.html',
        checkInterval: 2000,
        maxChecks: 15
      },
      
      // 支付方式配置
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
    this.resetPaymentState();
    
    // 初始化
    this.initEventListeners();
    this.injectStyles();
    this.log('支付系统初始化完成');
  }

  /* ========== 初始化方法 ========== */

  initEventListeners() {
    document.addEventListener('click', (e) => {
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
    });
  }

  injectStyles() {
    const styleId = 'wwpay-styles';
    if (document.getElementById(styleId)) return;
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
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
        padding: 15px;
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
        width: 100%;
        max-width: 300px;
        margin: 20px auto 0;
        padding: 12px;
        background: #4CAF50;
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 16px;
        cursor: pointer;
        transition: background 0.3s;
      }
      
      #confirm-payment-btn:hover:not(:disabled) {
        background: #45a049;
      }
      
      #confirm-payment-btn:disabled {
        background: #cccccc;
        cursor: not-allowed;
      }
      
      /* 加载中和提示样式保持不变 */
    `;
    document.head.appendChild(style);
  }

  /* ========== 核心支付方法 ========== */

  async handlePaymentSuccess() {
    // 显示成功提示
    this.showToast('还愿已成功，您的愿望将会被移除', 'success');
    
    // 移除愿望卡片
    this.removeWishCard(this.state.currentWishId);
    
    // 3秒后跳转
    setTimeout(() => {
      window.location.href = this.config.paymentGateway.successUrl;
    }, 3000);
  }

  removeWishCard(wishId) {
    try {
      const wishCard = document.querySelector(`[data-wish-id="${wishId}"]`);
      if (wishCard) {
        // 添加移除动画
        wishCard.style.transition = 'all 0.3s ease';
        wishCard.style.opacity = '0';
        wishCard.style.height = '0';
        wishCard.style.margin = '0';
        wishCard.style.padding = '0';
        wishCard.style.overflow = 'hidden';
        
        // 动画完成后移除元素
        setTimeout(() => {
          wishCard.remove();
        }, 300);
      }
    } catch (error) {
      console.error('移除愿望卡片失败:', error);
    }
  }

  /* ========== 支付界面渲染 ========== */

  showPaymentMethods() {
    try {
      const oldSection = document.getElementById('payment-methods-section');
      if (oldSection) oldSection.remove();
      
      const methodsHtml = `
        <div class="payment-methods" id="payment-methods-section">
          <h4 style="text-align: center; margin-bottom: 20px;">
            <i class="fas fa-wallet"></i> 选择支付方式
          </h4>
          <div class="wwpay-methods-container">
            ${this.config.paymentMethods.map(method => `
              <button class="wwpay-method-btn ${method.id === this.state.selectedMethod ? 'active' : ''}" 
                      data-type="${method.id}" 
                      style="background: ${method.id === this.state.selectedMethod ? method.activeColor : method.color}; 
                             color: white;">
                <i class="${method.icon}"></i>
                <span class="wwpay-method-name">${method.name}</span>
                <span class="wwpay-method-hint">${method.hint}</span>
              </button>
            `).join('')}
          </div>
          <div style="text-align: center;">
            <button id="confirm-payment-btn">
              <i class="fas fa-check-circle"></i> 确认支付 ${this.state.selectedAmount}元
            </button>
          </div>
        </div>
      `;
      
      const modalContent = document.querySelector('#fulfillModal .modal-content');
      if (modalContent) {
        modalContent.insertAdjacentHTML('beforeend', methodsHtml);
      }
    } catch (error) {
      this.handleError('支付方式显示失败', error);
    }
  }

  handlePaymentMethodSelect(buttonElement) {
    try {
      document.querySelectorAll('.wwpay-method-btn').forEach(btn => {
        const methodId = btn.dataset.type;
        const method = this.config.paymentMethods.find(m => m.id === methodId);
        btn.style.background = method.color;
        btn.classList.remove('active');
      });
      
      const selectedMethod = buttonElement.dataset.type;
      const selectedMethodConfig = this.config.paymentMethods.find(m => m.id === selectedMethod);
      buttonElement.style.background = selectedMethodConfig.activeColor;
      buttonElement.classList.add('active');
      
      this.state.selectedMethod = selectedMethod;
    } catch (error) {
      this.handleError('选择支付方式失败', error);
    }
  }

  async processPayment() {
    if (!this.validatePaymentState()) return;

    try {
      this.state.processing = true;
      this.updateConfirmButtonState();
      
      this.showFullscreenLoading('正在准备支付...');
      
      // 创建并提交支付订单
      const result = await this.createPaymentOrder();
      
      if (result.success) {
        this.startPaymentStatusCheck();
      }
    } catch (error) {
      this.handleError('支付处理失败', error);
      this.showToast(`支付失败: ${error.message}`, 'error');
      this.hideFullscreenLoading();
      this.state.processing = false;
      this.updateConfirmButtonState();
    }
  }

  /* ========== 支付状态检查 ========== */

  async checkPaymentStatus() {
    try {
      const response = await fetch(
        `${this.config.paymentGateway.apiBase}/api/payments/status?wishId=${this.state.currentWishId}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          }
        }
      );
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '支付状态检查失败');
      }
      
      return data;
    } catch (error) {
      console.error('支付状态检查错误:', error);
      throw error;
    }
  }

  startPaymentStatusCheck() {
    let checks = 0;
    const maxChecks = this.config.paymentGateway.maxChecks;
    const checkInterval = this.config.paymentGateway.checkInterval;
    
    this.state.statusCheckInterval = setInterval(async () => {
      checks++;
      
      if (checks >= maxChecks) {
        this.clearPaymentStatusCheck();
        this.showToast('支付超时，请检查支付状态', 'warning');
        this.hideFullscreenLoading();
        return;
      }
      
      try {
        const statusData = await this.checkPaymentStatus();
        
        if (statusData.status === 'success') {
          this.clearPaymentStatusCheck();
          this.handlePaymentSuccess();
        } else if (statusData.status === 'failed') {
          throw new Error(statusData.message || '支付失败');
        }
      } catch (error) {
        this.clearPaymentStatusCheck();
        this.handleError('支付状态检查失败', error);
        this.showToast(error.message, 'error');
        this.hideFullscreenLoading();
      }
    }, checkInterval);
  }

  handlePaymentSuccess() {
    // 移除愿望卡片
    this.removeWishCard(this.state.currentWishId);
    
    // 显示成功提示
    this.showToast('还愿已成功，您的愿望将会被移除', 'success');
    this.hideFullscreenLoading();
    
    // 3秒后跳转
    setTimeout(() => {
      window.location.href = this.config.paymentGateway.successUrl;
    }, 3000);
  }

  /* ========== 愿望卡片处理 ========== */

  removeWishCard(wishId) {
    try {
      // 查找包含该愿望ID的卡片
      const wishCard = document.querySelector(`[data-wish-id="${wishId}"]`);
      if (wishCard) {
        // 添加移除动画
        wishCard.style.transition = 'all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)';
        wishCard.style.opacity = '0';
        wishCard.style.transform = 'translateY(-20px) scale(0.95)';
        wishCard.style.marginBottom = '0';
        wishCard.style.padding = '0';
        wishCard.style.height = '0';
        wishCard.style.overflow = 'hidden';
        
        // 动画完成后移除元素
        setTimeout(() => {
          wishCard.remove();
        }, 400);
      }
    } catch (error) {
      console.error('移除愿望卡片失败:', error);
    }
  }

  /* ========== 状态管理方法 ========== */

  resetPaymentState() {
    this.state = {
      selectedAmount: null,
      selectedMethod: 'wxpay',
      currentWishId: null,
      processing: false,
      statusCheckInterval: null
    };
  }

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

  /* ========== UI 方法 ========== */

  showToast(message, type = 'info') {
    try {
      document.querySelectorAll('.wwpay-toast').forEach(el => el.remove());
      
      const icon = type === 'success' ? 'check-circle' : 
                  type === 'error' ? 'exclamation-circle' : 'info-circle';
      
      const toast = document.createElement('div');
      toast.className = `wwpay-toast ${type}`;
      toast.innerHTML = `
        <i class="fas fa-${icon}"></i>
        ${message}
      `;
      document.body.appendChild(toast);
      
      setTimeout(() => toast.classList.add('show'), 10);
      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
      }, 3000);
    } catch (error) {
      console.error('显示Toast失败:', error);
    }
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
          console.log('支付系统初始化完成');
        };
        script.onerror = () => {
          console.error('加载CryptoJS失败');
          alert('支付系统初始化失败，请刷新页面重试');
        };
        document.head.appendChild(script);
      } else {
        window.wwPay = new WWPay();
      }
    }
  } catch (error) {
    console.error('支付系统初始化失败:', error);
    alert('支付系统初始化失败，请刷新页面重试');
  }
});

// 全局支付方法
window.startWishPayment = function(wishId, amount, method = 'wxpay') {
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
    statusCheckInterval: null
  };
  
  window.wwPay.processPayment();
};
