/**
 * 命缘池支付系统 - 完整版 v11.0
 * 包含功能：
 * 1. 还愿支付系统
 * 2. 账户充值系统
 * 3. 支付状态管理
 * 4. 错误处理和重试机制
 */

class WWPay {
  constructor() {
    // 绑定所有方法上下文
    this.handleDocumentClick = this.handleDocumentClick.bind(this);
    this.handleFulfillOptionClick = this.handleFulfillOptionClick.bind(this);
    this.handlePaymentMethodSelect = this.handlePaymentMethodSelect.bind(this);
    this.processPayment = this.processPayment.bind(this);
    this.handlePaymentSuccess = this.handlePaymentSuccess.bind(this);
    this.handlePaymentError = this.handlePaymentError.bind(this);
    this.generateSignature = this.generateSignature.bind(this);
    this.cleanupPaymentState = this.cleanupPaymentState.bind(this);
    this.showRechargeModal = this.showRechargeModal.bind(this);
    this.handleRechargeSubmit = this.handleRechargeSubmit.bind(this);

    // 系统配置
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

    // 状态管理
    this.state = {
      selectedAmount: null,
      selectedMethod: 'alipay',
      currentWishId: null,
      processing: false,
      statusCheckInterval: null,
      paymentCompleted: false,
      lastPayment: null,
      isRechargeMode: false
    };

    // 初始化
    this.initEventListeners();
    this.injectStyles();
    this.setupErrorHandling();
    this.cleanupLocalStorage();
    this.log('支付系统初始化完成');
  }

  /* ========== 初始化方法 ========== */

  initEventListeners() {
    document.removeEventListener('click', this.handleDocumentClick);
    document.addEventListener('click', this.handleDocumentClick);
    
    // 充值按钮点击事件
    document.getElementById('rechargeBtn')?.addEventListener('click', this.showRechargeModal);
    document.getElementById('closeRecharge')?.addEventListener('click', () => this.toggleRechargeModal(false));
    document.getElementById('submitRecharge')?.addEventListener('click', this.handleRechargeSubmit);
  }

  injectStyles() {
    const styleId = 'wwpay-styles';
    if (document.getElementById(styleId)) return;
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      /* 原有样式... */
      
      /* 充值按钮样式 */
      .recharge-btn {
        background: linear-gradient(135deg, #f6d365 0%, #fda085 100%);
        color: #fff;
        border: none;
        padding: 8px 15px;
        border-radius: 20px;
        cursor: pointer;
        font-size: 14px;
        margin-right: 10px;
        transition: all 0.3s ease;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      }

      .recharge-btn:hover {
        background: linear-gradient(135deg, #fda085 0%, #f6d365 100%);
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.15);
      }

      /* 充值模态框样式 */
      .recharge-modal {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0,0,0,0.7);
        z-index: 1000;
        justify-content: center;
        align-items: center;
      }

      .recharge-container {
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        padding: 25px;
        border-radius: 10px;
        width: 90%;
        max-width: 400px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        position: relative;
        border: 1px solid rgba(255,255,255,0.1);
      }

      .recharge-header {
        text-align: center;
        margin-bottom: 20px;
        color: #fff;
      }

      .recharge-header h2 {
        margin: 0;
        font-size: 1.5rem;
        color: #f6d365;
      }

      .recharge-header p {
        margin: 5px 0 0;
        color: #b8c2cc;
        font-size: 0.9rem;
      }

      .close-recharge {
        position: absolute;
        top: 15px;
        right: 20px;
        color: #b8c2cc;
        font-size: 24px;
        cursor: pointer;
        transition: color 0.3s;
      }

      .close-recharge:hover {
        color: #f6d365;
      }

      .recharge-form {
        color: #fff;
      }

      .recharge-form .form-group {
        margin-bottom: 20px;
      }

      .recharge-form label {
        display: block;
        margin-bottom: 8px;
        font-size: 0.9rem;
        color: #b8c2cc;
      }

      .recharge-form input[type="number"] {
        width: 100%;
        padding: 10px 15px;
        border-radius: 5px;
        border: 1px solid rgba(255,255,255,0.2);
        background-color: rgba(0,0,0,0.3);
        color: #fff;
        font-size: 1rem;
      }

      .recharge-form input[type="number"]:focus {
        outline: none;
        border-color: #f6d365;
        box-shadow: 0 0 0 2px rgba(246, 211, 101, 0.3);
      }

      .payment-methods {
        display: flex;
        gap: 10px;
        margin-top: 10px;
      }

      .payment-method {
        flex: 1;
        padding: 12px;
        border-radius: 5px;
        background-color: rgba(0,0,0,0.3);
        border: 1px solid rgba(255,255,255,0.1);
        cursor: pointer;
        text-align: center;
        transition: all 0.3s;
      }

      .payment-method:hover {
        background-color: rgba(0,0,0,0.5);
        border-color: rgba(246, 211, 101, 0.5);
      }

      .payment-method.active {
        background-color: rgba(246, 211, 101, 0.2);
        border-color: #f6d365;
        color: #f6d365;
      }

      .payment-method i {
        margin-right: 5px;
        font-size: 1.2rem;
      }

      .btn-recharge {
        width: 100%;
        padding: 12px;
        background: linear-gradient(135deg, #f6d365 0%, #fda085 100%);
        color: #1a1a2e;
        border: none;
        border-radius: 5px;
        font-weight: bold;
        cursor: pointer;
        font-size: 1rem;
        margin-top: 10px;
        transition: all 0.3s;
      }

      .btn-recharge:hover:not(:disabled) {
        background: linear-gradient(135deg, #fda085 0%, #f6d365 100%);
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
      }

      .btn-recharge:disabled {
        background: #6c757d;
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
      }

      .recharge-message {
        margin-top: 15px;
        padding: 10px;
        border-radius: 5px;
        font-size: 0.9rem;
        text-align: center;
        display: none;
      }

      .recharge-message.success {
        background-color: rgba(40, 167, 69, 0.2);
        color: #28a745;
        border: 1px solid #28a745;
      }

      .recharge-message.error {
        background-color: rgba(220, 53, 69, 0.2);
        color: #dc3545;
        border: 1px solid #dc3545;
      }
    `;
    document.head.appendChild(style);
  }

  setupErrorHandling() {
    window.addEventListener('error', (event) => {
      this.safeLogError('全局错误', event.error);
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.safeLogError('未处理的Promise拒绝', event.reason);
    });
  }

  cleanupLocalStorage() {
    localStorage.removeItem('pending-fulfillment');
    localStorage.removeItem('last-payment');
    localStorage.removeItem('pending-recharge');
  }

  /* ========== 事件处理方法 ========== */

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
      
      // 充值模态框外部点击关闭
      const rechargeModal = document.getElementById('rechargeModal');
      if (rechargeModal && e.target === rechargeModal) {
        this.toggleRechargeModal(false);
      }
    } catch (error) {
      this.safeLogError('事件处理出错', error);
    }
  }

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
      this.state.isRechargeMode = false;

      this.showPaymentMethods();
    } catch (error) {
      this.showToast(`操作失败: ${error.message}`, 'error');
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
      this.safeLogError('选择支付方式失败', error);
    }
  }

  /* ========== 充值功能 ========== */

  showRechargeModal() {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        this.showToast('请先登录后再充值', 'error');
        document.getElementById('authModal').style.display = 'flex';
        return;
      }
      
      // 重置状态
      this.state = {
        selectedAmount: null,
        selectedMethod: 'alipay',
        currentWishId: null,
        processing: false,
        statusCheckInterval: null,
        paymentCompleted: false,
        lastPayment: null,
        isRechargeMode: true
      };
      
      // 重置表单
      document.getElementById('rechargeAmount').value = '';
      document.getElementById('rechargeMessage').style.display = 'none';
      
      // 选中默认支付方式
      document.querySelectorAll('.payment-method').forEach(method => {
        method.classList.remove('active');
        if (method.dataset.method === 'alipay') {
          method.classList.add('active');
        }
      });
      
      this.toggleRechargeModal(true);
    } catch (error) {
      this.safeLogError('显示充值模态框失败', error);
      this.showToast('打开充值页面失败', 'error');
    }
  }

  toggleRechargeModal(show) {
    const modal = document.getElementById('rechargeModal');
    if (modal) {
      modal.style.display = show ? 'flex' : 'none';
      document.body.style.overflow = show ? 'hidden' : '';
    }
  }

  async handleRechargeSubmit() {
    try {
      const amountInput = document.getElementById('rechargeAmount');
      const amount = parseFloat(amountInput.value);
      
      if (!amount || amount <= 0) {
        this.showRechargeMessage('请输入有效的充值金额', 'error');
        return;
      }
      
      const token = localStorage.getItem('token');
      if (!token) {
        this.toggleRechargeModal(false);
        document.getElementById('authModal').style.display = 'flex';
        return;
      }
      
      // 获取选中的支付方式
      const selectedMethod = document.querySelector('.payment-method.active')?.dataset.method || 'alipay';
      
      // 更新状态
      this.state.selectedAmount = amount;
      this.state.selectedMethod = selectedMethod;
      this.state.isRechargeMode = true;
      
      // 禁用按钮
      const submitBtn = document.getElementById('submitRecharge');
      submitBtn.disabled = true;
      document.getElementById('rechargeText').style.display = 'none';
      document.getElementById('rechargeSpinner').style.display = 'inline-block';
      
      // 创建充值订单
      const orderResponse = await fetch(`${this.config.paymentGateway.apiBase}/api/recharge/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: amount,
          payment_method: selectedMethod
        })
      });
      
      if (!orderResponse.ok) {
        throw new Error(await orderResponse.text());
      }
      
      const orderData = await orderResponse.json();
      
      // 准备支付数据
      const paymentData = {
        pid: this.config.paymentGateway.pid,
        type: selectedMethod,
        out_trade_no: orderData.order_id,
        notify_url: location.href,
        return_url: this.config.paymentGateway.successUrl,
        name: `命缘池充值-${amount}元`,
        money: amount.toFixed(2),
        param: encodeURIComponent(localStorage.getItem('username') || ''),
        sign_type: this.config.paymentGateway.signType
      };
      
      // 生成签名
      paymentData.sign = this.generateSignature(paymentData);
      
      // 提交支付
      await this.submitPaymentForm(paymentData);
      
    } catch (error) {
      this.showRechargeMessage(`充值失败: ${error.message}`, 'error');
      console.error('充值失败:', error);
    } finally {
      const submitBtn = document.getElementById('submitRecharge');
      if (submitBtn) {
        submitBtn.disabled = false;
        document.getElementById('rechargeText').style.display = 'inline';
        document.getElementById('rechargeSpinner').style.display = 'none';
      }
    }
  }

  showRechargeMessage(message, type) {
    const messageElement = document.getElementById('rechargeMessage');
    if (messageElement) {
      messageElement.textContent = message;
      messageElement.className = `recharge-message ${type}`;
      messageElement.style.display = 'block';
      
      setTimeout(() => {
        messageElement.style.display = 'none';
      }, 5000);
    }
  }

  /* ========== 核心支付方法 ========== */

  async processPayment() {
    if (!this.validatePaymentState()) return;

    try {
      this.state.processing = true;
      this.updateConfirmButtonState();
      this.showFullscreenLoading('正在准备支付...');
      
      this.state.lastPayment = {
        wishId: this.state.currentWishId,
        amount: this.state.selectedAmount,
        method: this.state.selectedMethod,
        timestamp: Date.now(),
        isRecharge: this.state.isRechargeMode
      };
      localStorage.setItem('last-payment', JSON.stringify(this.state.lastPayment));

      const result = await this.createPaymentOrder();
      
      if (result.success) {
        this.startPaymentStatusCheck();
      }
    } catch (error) {
      this.handlePaymentError(error);
    }
  }

  async createPaymentOrder() {
    try {
      const orderId = this.generateOrderId();
      
      if (!this.state.isRechargeMode) {
        // 异步记录还愿
        this.recordFulfillment().catch(error => {
          this.safeLogError('异步记录还愿失败', error);
          this.savePendingFulfillment();
        });
      }

      const paymentData = {
        pid: this.config.paymentGateway.pid,
        type: this.state.selectedMethod,
        out_trade_no: orderId,
        notify_url: location.href,
        return_url: this.config.paymentGateway.successUrl,
        name: this.state.isRechargeMode 
          ? `充值-${this.state.selectedAmount}元` 
          : `还愿-${this.state.currentWishId}`,
        money: this.state.selectedAmount.toFixed(2),
        param: encodeURIComponent(JSON.stringify({
          wishId: this.state.currentWishId,
          amount: this.state.selectedAmount,
          isRecharge: this.state.isRechargeMode
        })),
        sign_type: this.config.paymentGateway.signType
      };
      
      // 生成签名
      paymentData.sign = this.generateSignature(paymentData);
      
      if (!paymentData.sign) {
        throw new Error('签名生成失败');
      }

      await this.submitPaymentForm(paymentData);
      
      return { success: true, orderId };
    } catch (error) {
      throw new Error(`创建订单失败: ${error.message}`);
    }
  }

  generateSignature(params) {
    try {
      if (!params || typeof params !== 'object') {
        throw new Error('无效的签名参数');
      }

      // 过滤空值和排除签名字段
      const filtered = {};
      Object.keys(params)
        .filter(k => params[k] !== '' && !['sign', 'sign_type'].includes(k))
        .sort()
        .forEach(k => filtered[k] = params[k]);

      // 构建签名字符串
      const signStr = Object.entries(filtered)
        .map(([k, v]) => `${k}=${v}`)
        .join('&') + this.config.paymentGateway.key;

      // 使用CryptoJS生成MD5签名
      if (typeof CryptoJS === 'undefined') {
        throw new Error('CryptoJS未加载');
      }

      return CryptoJS.MD5(signStr).toString();
    } catch (error) {
      console.error('生成签名失败:', error);
      throw new Error(`签名生成失败: ${error.message}`);
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

  /* ========== 支付状态检查 ========== */

  startPaymentStatusCheck() {
    let checks = 0;
    const maxChecks = this.config.paymentGateway.maxChecks;
    const checkInterval = this.config.paymentGateway.checkInterval;
    
    this.state.statusCheckInterval = setInterval(async () => {
      if (this.state.paymentCompleted) {
        this.clearPaymentStatusCheck();
        return;
      }
      
      checks++;
      
      if (checks >= maxChecks) {
        this.clearPaymentStatusCheck();
        this.showGuaranteedToast('支付超时，请检查支付状态', 'warning');
        this.hideFullscreenLoading();
        return;
      }
      
      try {
        const statusData = await this.checkPaymentStatus();
        
        if (statusData.status === 'success') {
          this.clearPaymentStatusCheck();
          this.state.paymentCompleted = true;
          await this.handlePaymentSuccess();
          this.hideFullscreenLoading();
        } else if (statusData.status === 'failed') {
          throw new Error(statusData.message || '支付失败');
        }
      } catch (error) {
        this.clearPaymentStatusCheck();
        this.safeLogError('支付状态检查失败', error);
        this.showGuaranteedToast(error.message, 'error');
        this.hideFullscreenLoading();
      }
    }, checkInterval);
  }

  async checkPaymentStatus() {
    try {
      const endpoint = this.state.isRechargeMode 
        ? '/api/recharge/status' 
        : '/api/payments/status';
        
      const param = this.state.isRechargeMode 
        ? `orderId=${this.state.lastPayment?.out_trade_no}`
        : `wishId=${this.state.currentWishId}`;
      
      const response = await fetch(
        `${this.config.paymentGateway.apiBase}${endpoint}?${param}`,
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
      throw error;
    }
  }

  clearPaymentStatusCheck() {
    if (this.state.statusCheckInterval) {
      clearInterval(this.state.statusCheckInterval);
      this.state.statusCheckInterval = null;
    }
  }

  /* ========== 支付成功处理 ========== */

  async handlePaymentSuccess() {
    try {
      this.showGuaranteedToast('处理成功！正在更新状态...');
      
      if (this.state.isRechargeMode) {
        // 充值成功处理
        this.showGuaranteedToast('充值成功！正在更新余额...');
        await this.verifyRechargeCompleted();
      } else {
        // 还愿成功处理
        const fulfillmentResult = await this.ensureFulfillmentRecorded();
        if (!fulfillmentResult.success) {
          throw new Error(fulfillmentResult.message);
        }
        
        const verified = await this.verifyWishRemoved();
        if (!verified) {
          throw new Error('愿望删除验证失败');
        }
      }

      // 准备跳转
      this.prepareSuccessRedirect();
      
    } catch (error) {
      this.handlePaymentSuccessError(error);
    }
  }

  async verifyRechargeCompleted() {
    try {
      const response = await fetch(
        `${this.config.paymentGateway.apiBase}/api/user/balance`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          }
        }
      );
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '获取余额失败');
      }
      
      this.showGuaranteedToast(`充值成功！当前余额: ${data.balance}元`);
      return true;
    } catch (error) {
      throw new Error(`验证充值状态失败: ${error.message}`);
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
    
    if (this.state.isRechargeMode) {
      successUrl.searchParams.append('recharge_success', 'true');
      successUrl.searchParams.append('amount', this.state.selectedAmount);
    } else {
      successUrl.searchParams.append('fulfillment_success', 'true');
      successUrl.searchParams.append('wish_id', this.state.currentWishId);
    }
    
    this.showGuaranteedToast('处理完成！即将跳转...', 'success');
    setTimeout(() => {
      this.cleanupPaymentState();
      window.location.href = successUrl.toString();
    }, 1500);
  }

  /* ========== 数据库操作 ========== */

  async recordFulfillment(retryCount = 3) {
    const baseDelay = 1000;
    const url = `${this.config.paymentGateway.apiBase}/api/wishes/fulfill`;
    
    if (!this.state.currentWishId || typeof this.state.currentWishId !== 'number' || this.state.currentWishId <= 0) {
      const errorMsg = `无效的愿望ID: ${this.state.currentWishId}`;
      this.safeLogError(errorMsg);
      this.showToast('愿望ID无效，无法记录还愿', 'error');
      this.savePendingFulfillment();
      throw new Error(errorMsg);
    }
    
    const wishCard = document.querySelector(`[data-wish-id="${this.state.currentWishId}"]`);
    if (!wishCard) {
      const errorMsg = `找不到愿望卡片: ${this.state.currentWishId}`;
      this.safeLogError(errorMsg);
      this.showToast('愿望不存在或已被删除', 'error');
      this.savePendingFulfillment();
      throw new Error(errorMsg);
    }
    
    const requestData = {
      wishId: this.state.currentWishId,
      amount: this.state.selectedAmount,
      paymentMethod: this.state.selectedMethod
    };
    
    for (let attempt = 1; attempt <= retryCount; attempt++) {
      try {
        this.log(`[还愿记录] 尝试 ${attempt}/${retryCount} | 愿望ID: ${this.state.currentWishId} | 金额: ${this.state.selectedAmount} | 方式: ${this.state.selectedMethod}`);
        
        const response = await fetch(url, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          },
          body: JSON.stringify(requestData)
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP错误 ${response.status}: ${errorText}`);
        }
        
        const data = await response.json();
        
        if (!data.success) {
          throw new Error(`后端错误: ${data.error || data.message || '未知错误'}`);
        }
        
        this.log(`[还愿记录] 成功! fulfillmentId: ${data.fulfillmentId}`);
        return data;
        
      } catch (error) {
        const errorMsg = `记录还愿失败 (尝试 ${attempt}/${retryCount}): ${error.message}`;
        
        if (attempt === retryCount) {
          this.safeLogError(errorMsg, error);
          
          const pending = JSON.parse(localStorage.getItem('pendingFulfillments') || '[]');
          pending.push({
            wishId: this.state.currentWishId,
            amount: this.state.selectedAmount,
            method: this.state.selectedMethod,
            timestamp: Date.now(),
            error: error.message,
            attempts: 0
          });
          
          localStorage.setItem('pendingFulfillments', JSON.stringify(pending));
          this.log(`已保存到待处理列表，当前待处理记录: ${pending.length}`);
          
          this.startBackgroundRetry();
          
          throw new Error(`所有尝试均失败: ${error.message}`);
        }
        
        const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 500;
        this.log(`${errorMsg} - ${Math.round(delay)}ms后重试`);
        await this.delay(delay);
      }
    }
  }

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
      lastPayment: null,
      isRechargeMode: false
    };
  }

  validatePaymentState() {
    if (!this.state.selectedAmount) {
      this.showToast('请选择还愿金额', 'error');
      return false;
    }
    if (!this.state.isRechargeMode && !this.state.currentWishId) {
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
      
      const methodsHtml = `
        <div class="payment-methods" id="payment-methods-section">
          <h4 style="text-align: center; margin-bottom: 20px; color: white;">
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

  log(...messages) {
    if (this.config.debug) {
      console.log('[WWPay]', ...messages);
    }
  }

  safeLogError(context, error) {
    try {
      console.error(`[WWPay] ${context}:`, error);
    } catch (e) {
      console.error('[WWPay] 记录错误失败:', e);
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
}

// ========== 全局初始化 ==========

document.addEventListener('DOMContentLoaded', () => {
  try {
    // 1. 处理还愿成功通知
    const urlParams = new URLSearchParams(window.location.search);
    const wishId = urlParams.get('wish_id');
    const rechargeAmount = urlParams.get('amount');
    
    if (urlParams.get('fulfillment_success') === 'true') {
      showFulfillmentNotification(wishId);
      
      // 清理URL参数
      urlParams.delete('fulfillment_success');
      urlParams.delete('wish_id');
      const cleanUrl = `${window.location.pathname}${urlParams.toString() ? '?' + urlParams.toString() : ''}`;
      window.history.replaceState(null, '', cleanUrl);
    } else if (urlParams.get('recharge_success') === 'true') {
      showRechargeSuccessNotification(rechargeAmount);
      
      // 清理URL参数
      urlParams.delete('recharge_success');
      urlParams.delete('amount');
      const cleanUrl = `${window.location.pathname}${urlParams.toString() ? '?' + urlParams.toString() : ''}`;
      window.history.replaceState(null, '', cleanUrl);
    }

    // 2. 初始化支付系统
    if (!window.wwPay) {
      if (typeof CryptoJS === 'undefined') {
        loadCryptoJS().then(() => {
          window.wwPay = new WWPay();
          checkPendingFulfillments();
        }).catch(console.error);
      } else {
        window.wwPay = new WWPay();
        checkPendingFulfillments();
      }
    }
  } catch (error) {
    console.error('初始化失败:', error);
    alert('系统初始化失败，请刷新页面重试');
  }
});

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

function showRechargeSuccessNotification(amount) {
  const notification = document.createElement('div');
  notification.className = 'fulfillment-notification';
  notification.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
    </svg>
    <span>充值成功！已到账 ${amount} 元</span>
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
      selectedMethod: data.method,
      isRechargeMode: false
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
    paymentCompleted: false,
    isRechargeMode: false
  };
  
  try {
    await window.wwPay.processPayment();
  } catch (error) {
    console.error('支付流程出错:', error);
    window.wwPay.showGuaranteedToast('支付流程出错，请重试', 'error');
  }
};

// 全局充值方法
window.startRecharge = async function(amount, method = 'alipay') {
  if (!window.wwPay) {
    console.error('支付系统未初始化');
    alert('支付系统正在初始化，请稍后再试');
    return;
  }
  
  window.wwPay.state = {
    selectedAmount: amount,
    selectedMethod: method,
    currentWishId: null,
    processing: false,
    statusCheckInterval: null,
    paymentCompleted: false,
    isRechargeMode: true
  };
  
  try {
    await window.wwPay.processPayment();
  } catch (error) {
    console.error('充值流程出错:', error);
    window.wwPay.showGuaranteedToast('充值流程出错，请重试', 'error');
  }
};
