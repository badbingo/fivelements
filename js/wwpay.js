/**
 * 命缘池支付系统 - 完整优化版 v6.2
 * 功能：
 * 1. 修复支付按钮文字混乱问题
 * 2. 支付宝和微信支付按钮并排显示
 * 3. 支付成功后显示提示并移除愿望卡片
 * 4. 优化支付流程和状态管理
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
        successUrl: 'https://mybazi.com/system/wishingwell.html',
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
    this.state = {
      selectedAmount: null,
      selectedMethod: 'alipay',
      currentWishId: null,
      processing: false,
      statusCheckInterval: null
    };

    // 初始化
    this.initEventListeners();
    this.injectStyles();
    this.log('支付系统初始化完成');
  }

  /* ========== 初始化方法 ========== */

  initEventListeners() {
    document.addEventListener('click', (e) => {
      try {
        // 还愿金额选择
        const fulfillOption = e.target.closest('.fulfill-option');
        if (fulfillOption) {
          this.handleFulfillOptionClick(fulfillOption);
          return;
        }

        // 支付方式选择
        const methodBtn = e.target.closest('.wwpay-method-btn');
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
      
      .wish-card-removing {
        transition: all 0.4s ease !important;
        opacity: 0 !important;
        height: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow: hidden !important;
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

  async recordFulfillment() {
    try {
      const response = await fetch(`${this.config.paymentGateway.apiBase}/api/wishes/fulfill`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({
          wishId: this.state.currentWishId,
          amount: this.state.selectedAmount,
          paymentMethod: this.state.selectedMethod
        })
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || '还愿记录失败');
      }
      
      return data;
    } catch (error) {
      console.error('记录还愿失败:', error);
      throw new Error(`记录还愿失败: ${error.message}`);
    }
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
      
      // 先记录还愿意向
      await this.recordFulfillment();
      
      // 提交支付
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
          <h4 style="text-align: center; margin-bottom: 20px; color: #333;">
            <i class="fas fa-wallet" style="margin-right: 8px;"></i>选择支付方式
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
              <i class="fas fa-check-circle" style="margin-right: 8px;"></i> 
              确认支付 ${this.state.selectedAmount}元
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
      const wishCard = document.querySelector(`.wish-card[data-wish-id="${wishId}"]`);
      if (wishCard) {
        // 添加移除动画类
        wishCard.classList.add('wish-card-removing');
        
        // 动画完成后移除元素
        setTimeout(() => {
          wishCard.remove();
        }, 400);
      }
    } catch (error) {
      console.error('移除愿望卡片失败:', error);
    }
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
      statusCheckInterval: null
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
window.startWishPayment = function(wishId, amount, method = 'alipay') {
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
