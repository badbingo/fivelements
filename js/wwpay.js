class WWPay {
  constructor() {
    // 初始化配置和状态
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

    this.state = {
      selectedAmount: null,
      selectedMethod: 'alipay',
      currentWishId: null,
      processing: false,
      statusCheckInterval: null,
      paymentCompleted: false,
      lastPayment: null
    };

    // 安全检查
    try {
      this.isSecureEnvironment = (typeof lockdown !== 'undefined') || 
                               (typeof ses !== 'undefined') ||
                               (window.trustedTypes && window.trustedTypes.createPolicy);
    } catch (e) {
      this.isSecureEnvironment = true;
    }
    
    if (this.isSecureEnvironment) {
      console.warn('运行在安全沙箱环境中，功能可能受限');
      this.config.debug = true;
    }

    // 方法绑定
    this.handleDocumentClick = this.handleDocumentClick.bind(this);
    this.handleFulfillOptionClick = this.handleFulfillOptionClick.bind(this);
    this.processPayment = this.processPayment.bind(this);
    this.handlePaymentSuccess = this.handlePaymentSuccess.bind(this);
    this.generateSignature = this.generateSignature.bind(this);
    this.cleanupPaymentState = this.cleanupPaymentState.bind(this);
    this.recordFulfillment = this.recordFulfillment.bind(this);

    this.initEventListeners();
    this.injectStyles();
    this.setupErrorHandling();
    this.cleanupLocalStorage();
    this.log('支付系统初始化完成');
  }

  /* ========== 占位方法实现 ========== */
  handleDocumentClick() {
    // 文档点击处理逻辑
  }
  
  handleFulfillOptionClick() {
    // 还愿选项点击处理
  }
  
  recordFulfillment() {
    // 记录还愿到数据库
    return Promise.resolve({ success: true });
  }

  /* ========== 支付核心方法 ========== */
  async processPayment() {
    if (!this.validatePaymentState()) return;
    
    this.state.processing = true;
    this.updateConfirmButtonState();
    this.showFullscreenLoading('正在准备支付...');
    
    try {
      const orderInfo = this.generateOrderInfo();
      this.log('生成的订单信息:', orderInfo);
      
      const paymentResponse = await this.createPaymentRequest(orderInfo);
      this.log('支付网关响应:', paymentResponse);
      
      if (paymentResponse.code === '10000') {
        this.handlePaymentResponse(paymentResponse);
      } else {
        throw new Error(paymentResponse.message || '支付请求失败');
      }
    } catch (error) {
      this.handlePaymentError(error);
    }
  }

  generateOrderInfo() {
    const orderId = this.generateOrderId();
    const timestamp = Math.floor(Date.now() / 1000);
    
    return {
      pid: this.config.paymentGateway.pid,
      type: this.state.selectedMethod,
      out_trade_no: orderId,
      notify_url: `${this.config.paymentGateway.apiBase}/api/payment/notify`,
      return_url: this.config.paymentGateway.successUrl,
      name: `愿望还愿 #${this.state.currentWishId}`,
      money: this.state.selectedAmount.toString(),
      clientip: '127.0.0.1',
      device: 'pc',
      timestamp: timestamp.toString(),
      sign: this.generateSignature(orderId, timestamp)
    };
  }

  generateSignature(orderId, timestamp) {
    const params = {
      pid: this.config.paymentGateway.pid,
      type: this.state.selectedMethod,
      out_trade_no: orderId,
      notify_url: `${this.config.paymentGateway.apiBase}/api/payment/notify`,
      return_url: this.config.paymentGateway.successUrl,
      name: `愿望还愿 #${this.state.currentWishId}`,
      money: this.state.selectedAmount.toString(),
      clientip: '127.0.0.1',
      device: 'pc',
      timestamp: timestamp.toString()
    };
    
    const sortedKeys = Object.keys(params).sort();
    const signStr = sortedKeys.map(key => `${key}=${params[key]}`).join('&') + 
                    this.config.paymentGateway.key;
    
    if (typeof CryptoJS !== 'undefined') {
      return CryptoJS.MD5(signStr).toString().toUpperCase();
    }
    
    if (this.config.debug) {
      console.warn('CryptoJS未加载，使用简单签名方法');
      let hash = 0;
      for (let i = 0; i < signStr.length; i++) {
        const char = signStr.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      return Math.abs(hash).toString(16).toUpperCase();
    }
    
    throw new Error('无法生成安全签名');
  }

  async createPaymentRequest(orderInfo) {
    const formData = new FormData();
    for (const key in orderInfo) {
      formData.append(key, orderInfo[key]);
    }
    
    const response = await fetch(this.config.paymentGateway.apiUrl, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`支付网关错误: ${response.status}`);
    }
    
    return await response.json();
  }

  handlePaymentResponse(response) {
    this.state.lastPayment = {
      orderId: response.out_trade_no,
      qrCode: response.qrcode,
      timestamp: Date.now()
    };
    
    localStorage.setItem('last-payment', JSON.stringify(this.state.lastPayment));
    
    if (response.qrcode) {
      this.showQRCode(response.qrcode);
      this.startPaymentStatusCheck(response.out_trade_no);
    } else if (response.payurl) {
      window.location.href = response.payurl;
    } else {
      throw new Error('无效的支付响应');
    }
  }

  showQRCode(qrCodeUrl) {
    this.hideFullscreenLoading();
    
    const qrModal = document.createElement('div');
    qrModal.className = 'wwpay-qr-modal';
    qrModal.innerHTML = `
      <div class="wwpay-qr-container">
        <h3>请扫码完成支付</h3>
        <img src="${qrCodeUrl}" alt="支付二维码">
        <p>支付金额: ${this.state.selectedAmount}元</p>
        <button class="wwpay-cancel-btn">取消支付</button>
      </div>
    `;
    
    document.body.appendChild(qrModal);
    
    qrModal.querySelector('.wwpay-cancel-btn').addEventListener('click', () => {
      this.cleanupPaymentState();
      qrModal.remove();
    });
  }

  startPaymentStatusCheck(orderId) {
    this.state.statusCheckInterval = setInterval(async () => {
      try {
        const status = await this.checkPaymentStatus(orderId);
        
        if (status.paid) {
          clearInterval(this.state.statusCheckInterval);
          this.state.paymentCompleted = true;
          document.querySelector('.wwpay-qr-modal')?.remove();
          this.handlePaymentSuccess();
        }
      } catch (error) {
        this.log('支付状态检查失败:', error);
      }
    }, this.config.paymentGateway.checkInterval);
  }

  async checkPaymentStatus(orderId) {
    const response = await fetch(`${this.config.paymentGateway.apiBase}/api/payment/check?orderId=${orderId}`);
    
    if (!response.ok) {
      throw new Error(`状态检查失败: ${response.status}`);
    }
    
    return await response.json();
  }

  /* ========== 支付成功处理 ========== */
  async handlePaymentSuccess() {
    try {
      this.showGuaranteedToast('还愿成功！正在更新状态...');
      
      // 1. 确保记录到fulfillments表
      const fulfillmentResult = await this.ensureFulfillmentRecorded();
      if (!fulfillmentResult.success) {
        throw new Error(fulfillmentResult.message);
      }
      
      // 2. 验证愿望已从wishes表删除
      const verified = await this.verifyWishRemoved();
      if (!verified) {
        throw new Error('愿望删除验证失败');
      }

      // 3. 准备跳转
      this.prepareSuccessRedirect();
      
    } catch (error) {
      this.handlePaymentSuccessError(error);
    }
  }

  async ensureFulfillmentRecorded() {
    try {
      // 先检查是否有未完成的记录
      const pending = localStorage.getItem('pending-fulfillment');
      if (pending) {
        const pendingData = JSON.parse(pending);
        if (pendingData.wishId === this.state.currentWishId) {
          const result = await this.recordFulfillment();
          localStorage.removeItem('pending-fulfillment');
          return result;
        }
      }
      
      // 正常记录流程
      return await this.recordFulfillment();
    } catch (error) {
      this.savePendingFulfillment();
      throw error;
    }
  }

  async verifyWishRemoved() {
    for (let i = 0; i < 5; i++) {
      try {
        const response = await fetch(
          `${this.config.paymentGateway.apiBase}/api/wishes/check?wishId=${this.state.currentWishId}`
        );
        
        const data = await response.json();
        
        // 验证：愿望不存在且已还愿
        if (!data.exists && data.fulfilled) {
          return true;
        }
        
        // 如果愿望还存在但标记为已还愿，尝试强制删除
        if (data.exists && data.fulfilled) {
          await this.forceDeleteWish();
        }
      } catch (error) {
        this.log(`验证失败 (${i+1}/5): ${error.message}`);
      }
      await this.delay(1000);
    }
    return false;
  }

  prepareSuccessRedirect() {
    const successUrl = new URL(this.config.paymentGateway.successUrl);
    successUrl.searchParams.append('fulfillment_success', 'true');
    successUrl.searchParams.append('wish_id', this.state.currentWishId);
    
    this.showGuaranteedToast('处理完成！即将跳转...', 'success');
    setTimeout(() => {
      this.cleanupPaymentState();
      window.location.href = successUrl.toString();
    }, 1500);
  }

  /* ========== 数据库操作 ========== */

  async forceDeleteWish() {
    try {
      this.log('尝试强制删除愿望...');
      const response = await fetch(`${this.config.paymentGateway.apiBase}/api/wishes/force-fulfill`, {
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
        throw new Error(data.message || '强制删除失败');
      }
      
      this.log('强制删除成功');
      return true;
    } catch (error) {
      throw new Error(`强制删除愿望失败: ${error.message}`);
    }
  }

  /* ========== 愿望卡片处理 ========== */

  async safeRemoveWishCard(wishId, retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        const card = this.findWishCard(wishId);
        if (!card) {
          this.log('未找到愿望卡片，可能已移除');
          return true;
        }

        await this.applyRemovalAnimation(card);
        return true;
      } catch (error) {
        this.log(`移除卡片失败 (${i+1}/${retries}): ${error.message}`);
        await this.delay(500);
      }
    }
    throw new Error('多次尝试移除卡片失败');
  }

  findWishCard(wishId) {
    const selectors = [
      `.wish-card[data-wish-id="${wishId}"]`,
      `[data-wish-id="${wishId}"]`,
      `#wish-${wishId}`
    ];
    
    for (const selector of selectors) {
      const card = document.querySelector(selector);
      if (card) return card;
    }
    return null;
  }

  applyRemovalAnimation(card) {
    return new Promise((resolve) => {
      card.classList.add('wish-card-removing');
      
      const onTransitionEnd = () => {
        card.removeEventListener('transitionend', onTransitionEnd);
        card.remove();
        resolve();
      };
      
      card.addEventListener('transitionend', onTransitionEnd);
      
      setTimeout(() => {
        if (card.parentNode) {
          card.removeEventListener('transitionend', onTransitionEnd);
          card.remove();
        }
        resolve();
      }, 800);
    });
  }

  /* ========== 状态管理 ========== */

  cleanupPaymentState() {
    localStorage.removeItem('last-payment');
    localStorage.removeItem('pending-fulfillment');
    this.resetPaymentState();
  }

  resetPaymentState() {
    this.state = {
      selectedAmount: null,
      selectedMethod: 'alipay',
      currentWishId: null,
      processing: false,
      statusCheckInterval: null,
      paymentCompleted: false,
      lastPayment: null
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

  savePendingFulfillment() {
    localStorage.setItem('pending-fulfillment', JSON.stringify({
      wishId: this.state.currentWishId,
      amount: this.state.selectedAmount,
      method: this.state.selectedMethod,
      timestamp: Date.now()
    }));
  }

  /* ========== UI 方法 ========== */

  showGuaranteedToast(message, type = 'success') {
    this.removeAllToasts();
    
    const toast = document.createElement('div');
    toast.className = `wwpay-guaranteed-toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 500);
    }, 3000);
    
    this.log(`[TOAST] ${type}: ${message}`);
  }

  removeAllToasts() {
    document.querySelectorAll('.wwpay-toast, .wwpay-guaranteed-toast').forEach(el => {
      try {
        el.remove();
      } catch (e) {
        this.safeLogError('移除Toast失败', e);
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

  showToast(message, type = 'info') {
    try {
      this.removeAllToasts();
      
      const icon = type === 'success' ? 'check-circle' : 
                  type === 'error' ? 'exclamation-circle' : 'info-circle';
      
      const toast = document.createElement('div');
      toast.className = `wwpay-toast ${type}`;
      toast.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <span>${message}</span>
      `;
      
      document.body.appendChild(toast);
      toast.offsetHeight;
      toast.classList.add('show');
      
      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
      }, 3000);
      
    } catch (error) {
      this.safeLogError('显示Toast失败', error);
      alert(message);
    }
  }

  showPaymentMethods() {
    try {
      const oldSection = document.getElementById('payment-methods-section');
      if (oldSection) oldSection.remove();
      
      const activeColor = this.config.paymentMethods.find(m => m.id === this.state.selectedMethod)?.activeColor || '#1268d9';
      const color = this.config.paymentMethods.find(m => m.id === this.state.selectedMethod)?.color || '#1677ff';
      
      const methodsHtml = `
        <div class="payment-methods" id="payment-methods-section">
          <h4 style="text-align: center; margin-bottom: 20px; color: #333;">
            <i class="fas fa-wallet" style="margin-right: 8px;"></i>选择支付方式
          </h4>
          <div class="wwpay-methods-container">
            ${this.config.paymentMethods.map(method => {
              const isActive = method.id === this.state.selectedMethod;
              return `
                <button class="wwpay-method-btn ${isActive ? 'active' : ''}" 
                        data-type="${method.id}" 
                        style="background: ${isActive ? method.activeColor : method.color}; 
                               color: white;">
                  <i class="${method.icon}"></i>
                  <span class="wwpay-method-name">${method.name}</span>
                  <span class="wwpay-method-hint">${method.hint}</span>
                </button>
              `;
            }).join('')}
          </div>
          <div style="text-align: center; margin-top: 20px;">
            <button id="confirm-payment-btn" style="background: ${activeColor};">
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
      this.safeLogError('支付方式显示失败', error);
    }
  }

  /* ========== 工具方法 ========== */

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  generateOrderId() {
    const now = new Date();
    return `${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}${now.getHours().toString().padStart(2,'0')}${now.getMinutes().toString().padStart(2,'0')}${now.getSeconds().toString().padStart(2,'0')}${Math.floor(Math.random()*9000)+1000}`;
  }

  safeLogError(context, error) {
    try {
      // 安全环境下使用更简单的错误日志
      if (this.isSecureEnvironment) {
        console.error(`[WWPay] ${context}: ${error.message || error}`);
      } else {
        console.error(`[WWPay] ${context}:`, error);
      }
    } catch (e) {
      console.error('[WWPay] 记录错误失败');
    }
  }

  handlePaymentError(error) {
    this.safeLogError('支付处理失败', error);
    this.showGuaranteedToast(`支付失败: ${error.message}`, 'error');
    this.hideFullscreenLoading();
    this.state.processing = false;
    this.updateConfirmButtonState();
  }

  handlePaymentSuccessError(error) {
    this.safeLogError('支付成功处理异常', error);
    this.showGuaranteedToast('支付已完成！请手动刷新查看', 'warning');
    window.location.href = this.config.paymentGateway.successUrl;
  }

  /* ========== 初始化方法 ========== */
  
  initEventListeners() {
    document.addEventListener('click', this.handleDocumentClick);
    
    // 支付方式选择
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.wwpay-method-btn');
      if (btn) {
        const method = btn.dataset.type;
        this.state.selectedMethod = method;
        this.showPaymentMethods();
      }
    });
    
    // 确认支付按钮
    document.addEventListener('click', (e) => {
      if (e.target.closest('#confirm-payment-btn')) {
        this.processPayment();
      }
    });
  }

  injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .wwpay-toast {
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.7);
        color: white;
        padding: 12px 24px;
        border-radius: 4px;
        display: flex;
        align-items: center;
        z-index: 9999;
        opacity: 0;
        transition: opacity 0.3s;
      }
      
      .wwpay-toast.show {
        opacity: 1;
      }
      
      .wwpay-toast i {
        margin-right: 8px;
      }
      
      .wwpay-toast.success {
        background: #4CAF50;
      }
      
      .wwpay-toast.error {
        background: #F44336;
      }
      
      .wwpay-loading {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 9998;
      }
      
      .wwpay-loading .loader {
        border: 5px solid #f3f3f3;
        border-top: 5px solid #3498db;
        border-radius: 50%;
        width: 50px;
        height: 50px;
        animation: spin 1s linear infinite;
        margin-bottom: 20px;
      }
      
      .wwpay-loading p {
        color: white;
        font-size: 18px;
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      .wwpay-qr-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9997;
      }
      
      .wwpay-qr-container {
        background: white;
        padding: 30px;
        border-radius: 8px;
        text-align: center;
        max-width: 90%;
      }
      
      .wwpay-qr-container img {
        width: 200px;
        height: 200px;
        margin: 20px 0;
      }
      
      .wwpay-cancel-btn {
        background: #F44336;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 4px;
        cursor: pointer;
        margin-top: 20px;
      }
      
      .wwpay-methods-container {
        display: flex;
        justify-content: center;
        gap: 15px;
        margin-bottom: 25px;
      }
      
      .wwpay-method-btn {
        border: none;
        padding: 12px 20px;
        border-radius: 6px;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        transition: all 0.2s;
      }
      
      .wwpay-method-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      }
      
      .wwpay-method-btn i {
        font-size: 24px;
        margin-bottom: 5px;
      }
      
      .wwpay-method-name {
        font-weight: bold;
        margin-bottom: 3px;
      }
      
      .wwpay-method-hint {
        font-size: 12px;
        opacity: 0.8;
      }
      
      #confirm-payment-btn {
        background: #4CAF50;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 6px;
        font-size: 16px;
        cursor: pointer;
        transition: background 0.2s;
      }
      
      #confirm-payment-btn:hover {
        background: #3e8e41;
      }
      
      #confirm-payment-btn:disabled {
        background: #cccccc;
        cursor: not-allowed;
      }
      
      .fulfillment-notification {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 15px 20px;
        border-radius: 4px;
        display: flex;
        align-items: center;
        z-index: 9999;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        animation: slideIn 0.3s;
      }
      
      .fulfillment-notification svg {
        width: 20px;
        height: 20px;
        margin-right: 10px;
      }
      
      .fulfillment-notification.fade-out {
        animation: fadeOut 0.5s;
        opacity: 0;
      }
      
      @keyframes slideIn {
        from { transform: translateX(100%); }
        to { transform: translateX(0); }
      }
      
      @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }
      
      .wish-card-removing {
        animation: fadeOutCard 0.5s;
        opacity: 0;
        transform: scale(0.95);
      }
      
      @keyframes fadeOutCard {
        from { opacity: 1; transform: scale(1); }
        to { opacity: 0; transform: scale(0.95); }
      }
    `;
    document.head.appendChild(style);
  }

  setupErrorHandling() {
    window.addEventListener('error', (event) => {
      this.safeLogError('全局错误', event.error || event.message);
    });
    
    window.addEventListener('unhandledrejection', (event) => {
      this.safeLogError('未处理的Promise拒绝', event.reason);
    });
  }

  cleanupLocalStorage() {
    // 清理过期的支付记录
    const lastPayment = localStorage.getItem('last-payment');
    if (lastPayment) {
      const payment = JSON.parse(lastPayment);
      if (Date.now() - payment.timestamp > 24 * 60 * 60 * 1000) {
        localStorage.removeItem('last-payment');
      }
    }
    
    // 清理过期的待处理还愿
    const pending = localStorage.getItem('pending-fulfillment');
    if (pending) {
      const data = JSON.parse(pending);
      if (Date.now() - data.timestamp > 7 * 24 * 60 * 60 * 1000) {
        localStorage.removeItem('pending-fulfillment');
      }
    }
  }

  log(...args) {
    if (this.config.debug) {
      console.log('[WWPay]', ...args);
    }
  }
}

// ========== 全局初始化 ==========
document.addEventListener('DOMContentLoaded', () => {
  try {
    setTimeout(() => {
      initPaySystem();
    }, 500);
  } catch (error) {
    console.error('初始化失败:', error);
    alert('系统初始化失败，请刷新页面重试');
  }
});

function initPaySystem() {
  if (window.wwPayInitialized) return;
  window.wwPayInitialized = true;
  
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const wishId = urlParams.get('wish_id');
    
    if (urlParams.get('fulfillment_success') === 'true') {
      showFulfillmentNotification(wishId);
      
      urlParams.delete('fulfillment_success');
      urlParams.delete('wish_id');
      const cleanUrl = `${window.location.pathname}${urlParams.toString() ? '?' + urlParams.toString() : ''}`;
      window.history.replaceState(null, '', cleanUrl);
    }

    if (!window.wwPay) {
      window.wwPay = new WWPay();
      checkPendingFulfillments();
    }
  } catch (e) {
    console.error('支付系统初始化失败:', e);
  }
}

function handleInitError(error) {
  console.error('CryptoJS加载失败:', error);
  alert('安全组件加载失败，请禁用广告拦截器后重试');
}

function showFulfillmentNotification(wishId) {
  const notification = document.createElement('div');
  notification.className = 'fulfillment-notification';
  notification.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
    </svg>
    <span>还愿已成功，愿望 #${wishId} 已被移除</span>
  `;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.classList.add('fade-out');
    setTimeout(() => notification.remove(), 1000);
  }, 3000);
}

function checkPendingFulfillments() {
  const pending = localStorage.getItem('pending-fulfillment');
  if (!pending || !window.wwPay) return;

  try {
    const data = JSON.parse(pending);
    window.wwPay.state = {
      currentWishId: data.wishId,
      selectedAmount: data.amount,
      selectedMethod: data.method
    };
    
    window.wwPay.recordFulfillment()
      .then(() => localStorage.removeItem('pending-fulfillment'))
      .catch(console.error);
  } catch (error) {
    console.error('处理待还愿记录失败:', error);
    localStorage.removeItem('pending-fulfillment');
  }
}

function loadCryptoJS() {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js';
    script.integrity = 'sha512-E8QSvWZ0eCLGk4km3hxSsNmGWbLtSCSUcewDQPQWZF6pEU8GlT8a5fF32wOl1i8ftdMhssTrF/OhyGWwonTcXA==';
    script.crossOrigin = 'anonymous';
    script.onload = resolve;
    script.onerror = () => reject('加载CryptoJS失败');
    document.head.appendChild(script);
  });
}

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
