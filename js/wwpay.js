/**
 * 命缘池支付系统 - 终极版 v6.0
 * 完整功能包括：
 * 1. 美观居中的支付按钮设计
 * 2. 完善的选中状态效果
 * 3. 支付成功跳转与愿望移除
 * 4. 全流程状态管理
 * 5. 与后端API深度集成
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
        // 支付状态检查配置
        checkInterval: 2000,
        maxChecks: 15
      },
      
      // 支付方式配置
      paymentMethods: {
        wxpay: {
          name: '微信支付（仅限国内）',
          icon: 'fab fa-weixin',
          color: '#09bb07',
          activeColor: '#07a807',
          type: 'wxpay',
          logo: 'https://mybazi.com/static/img/wxpay.png'
        },
        alipay: {
          name: '支付宝（全球支付）',
          icon: 'fab fa-alipay',
          color: '#1677ff',
          activeColor: '#1268d9',
          type: 'alipay',
          logo: 'https://mybazi.com/static/img/alipay.png'
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
        const methodBtn = e.target.closest('.wwpay-payment-btn');
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
      .wwpay-payment-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 15px;
        width: 100%;
        margin: 20px 0;
      }
      
      .wwpay-payment-btn {
        position: relative;
        padding: 18px 25px;
        width: 85%;
        max-width: 320px;
        text-align: center;
        border-radius: 16px;
        transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
        border: none;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        transform: translateY(0);
        overflow: hidden;
        z-index: 1;
      }
      
      .wwpay-payment-btn::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0));
        z-index: -1;
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      
      .wwpay-payment-btn:hover {
        transform: translateY(-3px);
        box-shadow: 0 8px 16px rgba(0,0,0,0.15);
      }
      
      .wwpay-payment-btn.active {
        transform: translateY(-3px);
        box-shadow: 0 8px 24px rgba(0,0,0,0.2);
      }
      
      .wwpay-payment-btn.active::before {
        opacity: 1;
      }
      
      .wwpay-payment-btn i {
        font-size: 28px;
        margin-bottom: 10px;
      }
      
      .wwpay-payment-hint {
        display: block;
        font-size: 13px;
        margin-top: 6px;
        font-weight: normal;
        opacity: 0.9;
      }
      
      .wwpay-payment-btn.active .wwpay-payment-hint {
        opacity: 1;
      }
      
      .wwpay-payment-btn:after {
        content: '';
        position: absolute;
        bottom: 8px;
        left: 50%;
        transform: translateX(-50%);
        width: 0;
        height: 4px;
        background: rgba(255,255,255,0.8);
        border-radius: 4px;
        transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
      }
      
      .wwpay-payment-btn.active:after {
        width: 70%;
      }
      
      #confirm-payment-btn {
        width: 85%;
        max-width: 320px;
        padding: 16px;
        background: linear-gradient(135deg, #4CAF50, #45a049);
        color: white;
        border: none;
        border-radius: 16px;
        font-size: 17px;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        margin-top: 10px;
      }
      
      #confirm-payment-btn:hover:not(:disabled) {
        transform: translateY(-3px);
        box-shadow: 0 8px 16px rgba(0,0,0,0.15);
        background: linear-gradient(135deg, #45a049, #3d8b40);
      }
      
      #confirm-payment-btn:disabled {
        background: #cccccc;
        transform: none;
        box-shadow: none;
        cursor: not-allowed;
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
          <h4 style="text-align: center; margin-bottom: 25px; font-size: 20px; color: #333;">
            <i class="fas fa-wallet" style="margin-right: 10px;"></i>选择支付方式
          </h4>
          <div class="wwpay-payment-container">
            ${Object.values(this.config.paymentMethods).map(method => `
              <button class="wwpay-payment-btn ${method.type === this.state.selectedMethod ? 'active' : ''}" 
                      data-type="${method.type}" 
                      style="background: ${method.type === this.state.selectedMethod ? method.activeColor : method.color}; 
                             color: white;">
                <img src="${method.logo}" alt="${method.name}" style="height: 30px; margin-bottom: 8px;">
                ${method.name}
                <small class="wwpay-payment-hint">${method.hint}</small>
              </button>
            `).join('')}
            
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
      document.querySelectorAll('.wwpay-payment-btn').forEach(btn => {
        const methodType = btn.dataset.type;
        const methodConfig = this.config.paymentMethods[methodType];
        btn.style.background = methodConfig.color;
        btn.classList.remove('active');
      });
      
      const selectedMethod = buttonElement.dataset.type;
      const selectedConfig = this.config.paymentMethods[selectedMethod];
      buttonElement.style.background = selectedConfig.activeColor;
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
