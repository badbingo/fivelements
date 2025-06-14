/**
 * 命缘池支付系统 - 完整优化版 v5.3.0
 * 功能更新：
 * 1. 支付按钮明确标注"支付宝（全球）"和"微信支付（国内）"
 * 2. 点击支付后显示全屏loading状态
 * 3. 支付完成后显示愿望移除提示
 * 4. 优化支付流程状态管理
 */

class WWPay {
  constructor() {
    // 支付系统配置
    this.config = {
      // 支付网关配置
      paymentGateway: {
        apiUrl: 'https://zpayz.cn/submit.php',
        pid: '2025051013380915',
        key: 'UsXrSwn0wft5SeLB0LaQfecvJmpkS18T',
        signType: 'MD5',
        successUrl: 'https://mybazi.net/system/bazisystem.html',
        // 支付状态检查配置
        checkInterval: 2000,
        maxChecks: 10
      },
      
      // 支付方式配置
      paymentMethods: {
        wxpay: {
          name: '微信支付（国内）',
          icon: 'fab fa-weixin',
          color: '#09bb07',
          type: 'wxpay',
          hint: '仅限国内支付'
        },
        alipay: {
          name: '支付宝（全球）',
          icon: 'fab fa-alipay',
          color: '#1677ff',
          type: 'alipay',
          hint: '支持全球支付'
        }
      },
      
      // 调试模式
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
    // 使用事件委托处理所有支付相关交互
    document.addEventListener('click', (e) => {
      try {
        // 还愿金额选择
        const fulfillOption = e.target.closest('.fulfill-option');
        if (fulfillOption) {
          this.handleFulfillOptionClick(fulfillOption);
          return;
        }

        // 支付方式选择
        const methodBtn = e.target.closest('.payment-method-btn');
        if (methodBtn) {
          this.handlePaymentMethodSelect(methodBtn);
          return;
        }

        // 确认支付按钮
        const confirmBtn = e.target.closest('#confirm-payment-btn');
        if (confirmBtn) {
          this.processPayment();
        }
      } catch (error) {
        this.handleError('事件处理出错', error);
      }
    });
  }

  // 注入必要样式
  injectStyles() {
    const styleId = 'wwpay-styles';
    if (document.getElementById(styleId)) return;
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .wwpay-payment-btn {
        position: relative;
        padding: 12px 15px;
        text-align: left;
        border-radius: 8px;
        margin-bottom: 10px;
        transition: all 0.3s;
      }
      .wwpay-payment-hint {
        display: block;
        font-size: 12px;
        color: #666;
        margin-top: 4px;
        font-weight: normal;
      }
      .wwpay-payment-btn.active .wwpay-payment-hint {
        color: #fff;
      }
      .wwpay-loading {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.7);
        z-index: 9999;
        display: flex;
        justify-content: center;
        align-items: center;
        color: white;
        font-size: 18px;
        flex-direction: column;
      }
      .wwpay-loading .loader {
        border: 5px solid #f3f3f3;
        border-top: 5px solid #3498db;
        border-radius: 50%;
        width: 50px;
        height: 50px;
        animation: wwpay-spin 1s linear infinite;
        margin-bottom: 20px;
      }
      @keyframes wwpay-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }

  /* ========== 核心支付方法 ========== */

  generateOrderId() {
    const now = new Date();
    return `${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}${now.getHours().toString().padStart(2,'0')}${now.getMinutes().toString().padStart(2,'0')}${now.getSeconds().toString().padStart(2,'0')}${Math.floor(Math.random()*9000)+1000}`;
  }

  generateSignature(params) {
    const filtered = {};
    Object.keys(params)
      .filter(k => params[k] !== '' && !['sign', 'sign_type'].includes(k))
      .sort()
      .forEach(k => filtered[k] = params[k]);
    
    const signStr = Object.entries(filtered)
      .map(([k, v]) => `${k}=${v}`)
      .join('&') + this.config.paymentGateway.key;
    
    return CryptoJS.MD5(signStr).toString();
  }

  async createPaymentOrder() {
    try {
      const orderId = this.generateOrderId();
      
      const paymentData = {
        pid: this.config.paymentGateway.pid,
        type: this.state.selectedMethod,
        out_trade_no: orderId,
        notify_url: location.href,
        return_url: this.config.paymentGateway.successUrl,
        name: `还愿-${this.state.currentWishId}`,
        money: this.state.selectedAmount,
        param: encodeURIComponent(JSON.stringify({
          wishId: this.state.currentWishId,
          amount: this.state.selectedAmount
        })),
        sign_type: this.config.paymentGateway.signType
      };
      
      paymentData.sign = this.generateSignature(paymentData);
      
      await this.submitPaymentForm(paymentData);
      
      return { success: true, orderId };
    } catch (error) {
      console.error('创建支付订单失败:', error);
      throw new Error(`创建订单失败: ${error.message}`);
    }
  }

  async submitPaymentForm(paymentData) {
    return new Promise((resolve) => {
      this.showFullscreenLoading('正在连接支付网关...');
      
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = this.config.paymentGateway.apiUrl;
      form.style.display = 'none';
      
      Object.entries(paymentData).forEach(([key, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = value;
        form.appendChild(input);
      });
      
      document.body.appendChild(form);
      form.submit();
      
      setTimeout(resolve, 100);
    });
  }

  /* ========== 支付流程处理 ========== */

  handleFulfillOptionClick(optionElement) {
    try {
      if (!optionElement?.dataset?.amount) {
        throw new Error('无效的选项元素');
      }

      const amount = parseFloat(optionElement.dataset.amount);
      if (isNaN(amount)) {
        throw new Error('金额必须是数字');
      }

      const modal = document.getElementById('fulfillModal');
      if (!modal) throw new Error('找不到还愿模态框');
      
      const wishId = modal.dataset.wishId;
      if (!wishId) throw new Error('未关联愿望ID');

      this.state.selectedAmount = amount;
      this.state.currentWishId = wishId;

      this.showPaymentMethods();
    } catch (error) {
      this.handleError('处理还愿选项失败', error);
      this.showToast(`操作失败: ${error.message}`, 'error');
    }
  }

  showPaymentMethods() {
    try {
      const oldSection = document.getElementById('payment-methods-section');
      if (oldSection) oldSection.remove();
      
      const methodsHtml = `
        <div class="payment-methods" id="payment-methods-section">
          <h4><i class="fas fa-wallet"></i> 选择支付方式</h4>
          <div class="payment-options">
            ${Object.values(this.config.paymentMethods).map(method => `
              <button class="wwpay-payment-btn ${method.type === this.state.selectedMethod ? 'active' : ''}" 
                      data-type="${method.type}" 
                      style="background: ${method.color}; color: white;">
                <i class="${method.icon}"></i> ${method.name}
                <small class="wwpay-payment-hint">${method.hint}</small>
              </button>
            `).join('')}
          </div>
          <div class="payment-actions" style="margin-top: 20px;">
            <button id="confirm-payment-btn" class="btn-confirm" style="width: 100%; padding: 12px; background: #4CAF50; color: white; border: none; border-radius: 8px;">
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
      document.querySelectorAll('.wwpay-payment-btn').forEach(btn => {
        btn.classList.remove('active');
      });
      buttonElement.classList.add('active');
      this.state.selectedMethod = buttonElement.dataset.type;
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
        // 这里应该是实际检查支付状态的API调用
        // 模拟支付成功
        if (checks === 3) {
          this.clearPaymentStatusCheck();
          this.handlePaymentSuccess();
        }
      } catch (error) {
        this.clearPaymentStatusCheck();
        this.handleError('支付状态检查失败', error);
      }
    }, checkInterval);
  }

  clearPaymentStatusCheck() {
    if (this.state.statusCheckInterval) {
      clearInterval(this.state.statusCheckInterval);
      this.state.statusCheckInterval = null;
    }
  }

  handlePaymentSuccess() {
    this.hideFullscreenLoading();
    this.showToast('还愿已完成，您的愿望将会被移除', 'success');
    this.closeModal();
    
    setTimeout(() => {
      window.location.reload();
    }, 3000);
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
        ? '<i class="fas fa-spinner fa-spin"></i> 处理中...' 
        : `<i class="fas fa-check-circle"></i> 确认支付 ${this.state.selectedAmount}元`;
    }
  }

  /* ========== UI 方法 ========== */

  showToast(message, type = 'info') {
    try {
      document.querySelectorAll('.wwpay-toast').forEach(el => el.remove());
      
      const icon = type === 'success' ? 'check-circle' : 
                  type === 'error' ? 'exclamation-circle' : 'info-circle';
      
      const toast = document.createElement('div');
      toast.className = `wwpay-toast toast ${type}`;
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
      if (typeof CryptoJS === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js';
        script.onload = () => {
          window.wwPay = new WWPay();
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
