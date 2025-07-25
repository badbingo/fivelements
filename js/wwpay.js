/**
 * 命缘池支付系统 - 完整修复版 v10.2
 * 修复问题：
 * 1. 修复所有语法错误
 * 2. 增强错误处理
 * 3. 完善支付流程
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
    this.processRecharge = this.processRecharge.bind(this);

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
        },
        {
          id: 'balance',
          name: '余额支付',
          icon: 'fas fa-wallet',
          color: '#722ed1',
          activeColor: '#531dab',
          hint: '账户余额'
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
      lastPayment: null
    };

    // 初始化
    this.initEventListeners();
    this.injectStyles();
    this.setupErrorHandling();
    this.cleanupLocalStorage();
    this.log('支付系统初始化完成');
  }

  /* ========== 初始化方法 ========== */

  // 处理充值请求
  async processRecharge(amount, paymentMethod) {
    try {
      this.log(`发起充值流程: ${amount}元, 方式: ${paymentMethod}`);
      
      // 1. 创建充值订单
      const orderResponse = await this.createRechargeOrder(amount, paymentMethod);
      
      // 2. 跳转支付平台
      await this.redirectToPaymentGateway(orderResponse);
      
      // 3. 启动支付状态轮询
      // 不再需要轮询状态检查
// this.startPaymentStatusCheck(orderResponse.orderId);
      
    } catch (error) {
      this.handlePaymentError(error);
    }
  }
  
  async verifyPayment(orderId, amount) {
    try {
      const response = await fetch(`${this.config.paymentGateway.apiBase}/api/recharge/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          orderId,
          amount
        })
      });
      
      if (!response.ok) {
        throw new Error(await response.text());
      }
      
      const data = await response.json();
      return data.success;
      
    } catch (error) {
      this.logError('支付验证失败', error);
      return false;
    }
  }

  async createRechargeOrder(amount, method) {
    const response = await fetch(`${this.config.paymentGateway.apiBase}/api/recharge/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        amount: parseFloat(amount),
        paymentMethod: method
      })
    });
    
    if (!response.ok) {
      throw new Error(await response.text());
    }
    
    return response.json();
  }
  
  async redirectToPaymentGateway(order) {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = this.config.paymentGateway.apiUrl;
    
    const params = {
      pid: this.config.paymentGateway.pid,
      type: order.paymentMethod === 'wechat' ? 'wxpay' : order.paymentMethod,
      out_trade_no: order.orderId,
      notify_url: `${window.location.origin}/api/recharge/notify`,
      return_url: `${window.location.origin}/system/charge.html?orderId=${order.orderId}&amount=${order.amount.toFixed(2)}`,
      name: `账户充值-${order.orderId}`,
      money: order.amount.toFixed(2),
      sign_type: 'MD5',
      sitename: '命缘池'
    };
    
    // 生成签名
    params.sign = this.generateSignature(params);
    
    // 添加隐藏表单字段
    Object.entries(params).forEach(([key, value]) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = value;
      form.appendChild(input);
    });
    
    document.body.appendChild(form);
    form.submit();
  }

  
  initEventListeners() {
    document.removeEventListener('click', this.handleDocumentClick);
    document.addEventListener('click', this.handleDocumentClick);
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
      
      #confirmPaymentBtn {
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
      
      #confirmPaymentBtn:hover:not(:disabled) {
        background: #45a049;
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
      }
      
      #confirmPaymentBtn:disabled {
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
      
      .wwpay-guaranteed-toast.error {
        background: #dc3545;
      }
      
      .wwpay-guaranteed-toast.warning {
        background: #ffc107;
        color: #212529;
      }
      
      @keyframes wwpay-toast-fadein {
        from { opacity: 0; transform: translate(-50%, 20px); }
        to { opacity: 1; transform: translate(-50%, 0); }
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
      
      .fulfillment-notification {
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background-color: #4CAF50;
        color: white;
        padding: 15px 30px;
        border-radius: 4px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 10000;
        transition: all 0.3s ease;
        opacity: 1;
        display: flex;
        align-items: center;
      }
      
      .fulfillment-notification.fade-out {
        opacity: 0;
        transform: translateX(-50%) translateY(-20px);
      }
      
      .fulfillment-notification svg {
        width: 20px;
        height: 20px;
        margin-right: 10px;
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

      const confirmBtn = e.target.closest('#confirmPaymentBtn');
      if (confirmBtn) {
        this.processPayment();
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
        timestamp: Date.now()
      };
      localStorage.setItem('last-payment', JSON.stringify(this.state.lastPayment));

      const result = await this.createPaymentOrder();
      
      if (result.success) {
        // 对于余额支付，processing状态已在processBalancePayment中处理完成
        if (this.state.selectedMethod === 'balance') {
          this.state.processing = false;
        } else {
          this.startPaymentStatusCheck();
        }
      }
    } catch (error) {
      this.handlePaymentError(error);
    } finally {
      // 确保在任何情况下都重置processing状态（除非是非余额支付的成功情况）
      if (this.state.selectedMethod === 'balance' || this.state.processing) {
        this.state.processing = false;
      }
    }
  }

  async createPaymentOrder() {
     try {
       const orderId = this.generateOrderId();
       
       // 如果是余额支付，直接处理
       if (this.state.selectedMethod === 'balance') {
         return await this.processBalancePayment(orderId);
       }
       
       // 对于非余额支付，异步记录还愿
       // 注意：余额支付的还愿记录在processBalancePayment中处理
       this.recordFulfillment().catch(error => {
         this.safeLogError('异步记录还愿失败', error);
         this.savePendingFulfillment();
       });
 
       const paymentData = {
         pid: this.config.paymentGateway.pid,
         type: this.state.selectedMethod,
         out_trade_no: orderId,
         notify_url: location.href,
         return_url: this.config.paymentGateway.successUrl,
         name: `还愿-${this.state.currentWishId}`,
         money: this.state.selectedAmount.toFixed(2),
         param: encodeURIComponent(JSON.stringify({
           wishId: this.state.currentWishId,
           amount: this.state.selectedAmount
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

 async recordFulfillment(retryCount = 3) {
  const baseDelay = 1000; // 基础延迟1秒
  const url = `${this.config.paymentGateway.apiBase}/api/wishes/fulfill`;
  
  // 1. 验证愿望ID是否有效
  if (!this.state.currentWishId || typeof this.state.currentWishId !== 'number' || this.state.currentWishId <= 0) {
    const errorMsg = `无效的愿望ID: ${this.state.currentWishId}`;
    this.safeLogError(errorMsg);
    this.showToast('愿望ID无效，无法记录还愿', 'error');
    this.savePendingFulfillment(); // 保存为待处理记录
    throw new Error(errorMsg);
  }
  
  // 2. 验证愿望在本地是否存在
  const wishCard = document.querySelector(`[data-wish-id="${this.state.currentWishId}"]`);
  if (!wishCard) {
    const errorMsg = `找不到愿望卡片: ${this.state.currentWishId}`;
    this.safeLogError(errorMsg);
    this.showToast('愿望不存在或已被删除', 'error');
    this.savePendingFulfillment(); // 保存为待处理记录
    throw new Error(errorMsg);
  }
  
  // 3. 创建请求数据
  const requestData = {
    wishId: this.state.currentWishId,
    amount: this.state.selectedAmount,
    paymentMethod: this.state.selectedMethod
  };
  
  // 4. 重试循环
  for (let attempt = 1; attempt <= retryCount; attempt++) {
    try {
      // 详细日志
      this.log(`[还愿记录] 尝试 ${attempt}/${retryCount} | 愿望ID: ${this.state.currentWishId} | 金额: ${this.state.selectedAmount} | 方式: ${this.state.selectedMethod}`);
      
      // 发送请求
      const response = await fetch(url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify(requestData)
      });
      
      // 处理HTTP响应
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP错误 ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      
      // 检查后端响应
      if (!data.success) {
        throw new Error(`后端错误: ${data.error || data.message || '未知错误'}`);
      }
      
      // 记录成功
      this.log(`[还愿记录] 成功! fulfillmentId: ${data.fulfillmentId}`);
      return data;
      
    } catch (error) {
      const errorMsg = `记录还愿失败 (尝试 ${attempt}/${retryCount}): ${error.message}`;
      
      // 最后一次尝试失败
      if (attempt === retryCount) {
        this.safeLogError(errorMsg, error);
        
        // 保存到待处理列表
        const pending = JSON.parse(localStorage.getItem('pendingFulfillments') || '[]');
        pending.push({
          wishId: this.state.currentWishId,
          amount: this.state.selectedAmount,
          method: this.state.selectedMethod,
          timestamp: Date.now(),
          error: error.message,
          attempts: 0 // 重试次数计数器
        });
        
        localStorage.setItem('pendingFulfillments', JSON.stringify(pending));
        this.log(`已保存到待处理列表，当前待处理记录: ${pending.length}`);
        
        // 启动后台重试
        this.startBackgroundRetry();
        
        throw new Error(`所有尝试均失败: ${error.message}`);
      }
      
      // 指数退避 + 随机抖动
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
    if (this.state.processing) {
      this.showToast('支付正在处理中，请勿重复操作', 'warning');
      return false;
    }
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
    const confirmBtn = document.getElementById('confirmPaymentBtn');
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

  // 设置当前愿望ID
  setCurrentWishId(wishId) {
    this.state.currentWishId = wishId;
    this.log('设置当前愿望ID:', wishId);
  }

  // 选择金额
  selectAmount(amount) {
    this.state.selectedAmount = amount;
    this.log('选择金额:', amount);
  }

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

  async showPaymentMethods() {
     try {
       // 强制清理所有可能的支付方式区域
       const oldSections = document.querySelectorAll('#payment-methods-section, .payment-methods, .payment-methods-container > *');
       oldSections.forEach(section => section.remove());
       
       // 清理payment-methods-container内容
       const container = document.querySelector('.payment-methods-container');
       if (container) {
         container.innerHTML = '';
       }
       
       // 等待DOM更新
       await new Promise(resolve => setTimeout(resolve, 50));
       
       // 检查用户余额
       const userBalance = await this.getUserBalance();
       const availableMethods = await this.getAvailablePaymentMethods(userBalance);
       
       // 如果当前选择的支付方式不可用，切换到第一个可用的方式
       if (!availableMethods.find(m => m.id === this.state.selectedMethod)) {
         this.state.selectedMethod = availableMethods[0]?.id || 'alipay';
       }
       
     const methodsHtml = `
   <div class="payment-methods" id="payment-methods-section" style="display: flex; flex-direction: column; gap: 20px;">
     <!-- 第一层：标题和余额显示 -->
     <div style="display: flex; justify-content: space-between; align-items: center;">
       <h4 style="color: white; margin: 0;">
         <i class="fas fa-wallet" style="margin-right: 8px;"></i>选择支付方式
       </h4>
       ${userBalance !== null ? `
         <span style="color: #ffd700; font-size: 14px;">
           <i class="fas fa-coins" style="margin-right: 5px;"></i>
           余额: ¥${userBalance.toFixed(2)}
         </span>
       ` : ''}
     </div>
 
     <!-- 第二层：支付按钮（居中） -->
     <div style="display: flex; justify-content: center; gap: 15px; flex-wrap: wrap;">
       ${availableMethods.map(method => `
         <button class="wwpay-method-btn ${method.id === this.state.selectedMethod ? 'active' : ''}" 
                 data-type="${method.id}" 
                 style="background: ${method.id === this.state.selectedMethod ? method.activeColor : method.color}; 
                        color: white; padding: 12px 20px; border: none; border-radius: 8px; 
                        min-width: 120px; text-align: center; cursor: pointer;
                        transition: all 0.3s ease;">
           <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
             <i class="${method.icon}" style="font-size: 20px;"></i>
             <span class="wwpay-method-name" style="font-size: 14px; font-weight: bold;">${method.name}</span>
             <span class="wwpay-method-hint" style="font-size: 11px; opacity: 0.9;">${method.hint}</span>
           </div>
         </button>
       `).join('')}
     </div>
 
     <!-- 第三层：确认按钮（居中） -->
     <div style="display: flex; justify-content: center;">
       <button id="confirmPaymentBtn" 
               style="padding: 12px 40px; background: #52c41a; color: white; border: none; 
                      border-radius: 8px; font-size: 16px; font-weight: bold; cursor: pointer;
                      transition: all 0.3s ease; box-shadow: 0 2px 8px rgba(82, 196, 26, 0.3);">
         <i class="fas fa-check-circle" style="margin-right: 8px;"></i> 
         确认支付 ¥${this.state.selectedAmount}
       </button>
     </div>
   </div>
 `;
       
       // 优先插入到专门的支付方式容器中
       const paymentContainer = document.querySelector('.payment-methods-container');
       if (paymentContainer) {
         paymentContainer.innerHTML = methodsHtml;
       } else {
         // 如果没有专门容器，则插入到modal-content末尾
         const modalContent = document.querySelector('#fulfillModal .modal-content');
         if (modalContent) {
           modalContent.insertAdjacentHTML('beforeend', methodsHtml);
         }
       }
     } catch (error) {
       this.safeLogError('支付方式显示失败', error);
       // 如果获取余额失败，显示默认的支付方式（不包含余额支付）
       this.showDefaultPaymentMethods();
     }
   }

  /* ========== 余额支付处理 ========== */
   
   async processBalancePayment(orderId) {
     try {
       this.log('开始余额支付流程', '订单ID:', orderId, '愿望ID:', this.state.currentWishId, '金额:', this.state.selectedAmount);
       
       // 注意：processing状态检查已在processPayment中完成，这里不再重复检查
       
       // 1. 获取JWT令牌
       const token = localStorage.getItem('token');
       if (!token) {
         throw new Error('请先登录');
       }
       
       // 2. 调用余额支付接口
       this.log('发送余额支付请求到后端API');
       const response = await fetch(`${this.config.paymentGateway.apiBase}/api/payments/balance`, {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
           'Authorization': `Bearer ${token}`
         },
         body: JSON.stringify({
           wishId: this.state.currentWishId,
           amount: this.state.selectedAmount,
           orderId: orderId
         })
       });
       this.log('收到后端API响应');
       
       // 3. 处理响应
       const result = await response.json();
       
       if (!response.ok) {
         // 处理特定错误
         if (result.error === '余额不足') {
           throw new Error('余额不足，请充值后再试');
         } else if (result.error === '愿望不存在') {
           throw new Error('愿望不存在或已被删除');
         } else {
           throw new Error(result.error || '余额支付失败');
         }
       }
       
       // 4. 支付成功处理
       this.log('余额支付成功');
       this.state.paymentCompleted = true;
       this.state.processing = false; // 重置处理状态
       
       // 5. 余额支付接口已经处理了还愿记录，无需再次调用
       // await this.recordFulfillment(); // 已移除，避免重复调用
       
       // 6. 显示成功通知
       this.showGuaranteedToast('余额支付成功！', 'success');
       
       // 7. 关闭模态框
       const modal = document.getElementById('fulfillModal');
       if (modal) {
         modal.style.display = 'none';
       }
       
       // 8. 刷新余额显示（如果页面有余额显示）
       this.refreshBalanceDisplay();
       
       // 9. 准备跳转
       this.prepareSuccessRedirect();
       
       return { success: true, orderId, message: '余额支付成功' };
       
     } catch (error) {
       this.safeLogError('余额支付失败', error);
       throw error;
     }
   }
   
   async refreshBalanceDisplay() {
     try {
       // 刷新页面上的余额显示
       const balanceElements = document.querySelectorAll('.user-balance, #user-balance, .balance-display');
       if (balanceElements.length > 0) {
         const newBalance = await this.getUserBalance();
         if (newBalance !== null) {
           balanceElements.forEach(el => {
             if (el.textContent.includes('¥') || el.textContent.includes('余额')) {
               el.textContent = `余额: ¥${newBalance.toFixed(2)}`;
             }
           });
         }
       }
     } catch (error) {
       this.safeLogError('刷新余额显示失败', error);
     }
   }

   /* ========== 余额和支付方式管理 ========== */
   
   async getUserBalance() {
     try {
       const token = localStorage.getItem('token');
       if (!token) {
         this.log('用户未登录，无法获取余额');
         return null;
       }
       
       const response = await fetch(`${this.config.paymentGateway.apiBase}/api/users/balance`, {
         headers: {
           'Authorization': `Bearer ${token}`
         }
       });
       
       if (!response.ok) {
         throw new Error(`获取余额失败: ${response.status}`);
       }
       
       const data = await response.json();
       return data.balance || 0;
     } catch (error) {
       this.safeLogError('获取用户余额失败', error);
       return null;
     }
   }
   
   async getAvailablePaymentMethods(userBalance) {
     const methods = [...this.config.paymentMethods];
     
     // 如果余额不足或无法获取余额，移除余额支付选项
     if (userBalance === null || userBalance < this.state.selectedAmount) {
       return methods.filter(method => method.id !== 'balance');
     }
     
     return methods;
   }
   
   showDefaultPaymentMethods() {
     try {
       const oldSection = document.getElementById('payment-methods-section');
       if (oldSection) oldSection.remove();
       
       // 只显示支付宝和微信支付
       const defaultMethods = this.config.paymentMethods.filter(method => 
         method.id === 'alipay' || method.id === 'wxpay'
       );
       
       // 确保选择的支付方式是可用的
       if (this.state.selectedMethod === 'balance') {
         this.state.selectedMethod = 'alipay';
       }
       
       const methodsHtml = `
     <div class="payment-methods" id="payment-methods-section" style="display: flex; flex-direction: column; gap: 20px;">
       <!-- 标题 -->
       <h4 style="color: white; margin: 0;">
         <i class="fas fa-wallet" style="margin-right: 8px;"></i>选择支付方式
       </h4>
       
       <!-- 支付按钮 -->
       <div style="display: flex; justify-content: center; gap: 15px;">
         ${defaultMethods.map(method => `
           <button class="wwpay-method-btn ${method.id === this.state.selectedMethod ? 'active' : ''}" 
                   data-type="${method.id}" 
                   style="background: ${method.id === this.state.selectedMethod ? method.activeColor : method.color}; 
                          color: white; padding: 12px 20px; border: none; border-radius: 8px; 
                          min-width: 120px; text-align: center; cursor: pointer;
                          transition: all 0.3s ease;">
             <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
               <i class="${method.icon}" style="font-size: 20px;"></i>
               <span class="wwpay-method-name" style="font-size: 14px; font-weight: bold;">${method.name}</span>
               <span class="wwpay-method-hint" style="font-size: 11px; opacity: 0.9;">${method.hint}</span>
             </div>
           </button>
         `).join('')}
       </div>
       
       <!-- 确认按钮 -->
       <div style="display: flex; justify-content: center;">
         <button id="confirmPaymentBtn" 
                 style="padding: 12px 40px; background: #52c41a; color: white; border: none; 
                        border-radius: 8px; font-size: 16px; font-weight: bold; cursor: pointer;
                        transition: all 0.3s ease; box-shadow: 0 2px 8px rgba(82, 196, 26, 0.3);">
           <i class="fas fa-check-circle" style="margin-right: 8px;"></i> 
           确认支付 ¥${this.state.selectedAmount}
         </button>
       </div>
     </div>
   `;
       
       const modalContent = document.querySelector('#fulfillModal .modal-content');
       if (modalContent) {
         modalContent.insertAdjacentHTML('beforeend', methodsHtml);
       }
     } catch (error) {
       this.safeLogError('显示默认支付方式失败', error);
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
    
    if (urlParams.get('fulfillment_success') === 'true') {
      showFulfillmentNotification(wishId);
      
      // 清理URL参数
      urlParams.delete('fulfillment_success');
      urlParams.delete('wish_id');
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
    <span>还愿成功！感谢您对愿望 #${wishId} 的感恩回馈</span>
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
  
  // 检查是否正在处理中，防止重复调用
  if (window.wwPay.state.processing) {
    console.log('支付正在处理中，忽略重复调用');
    return;
  }
  
  // 只更新必要的状态，不重置processing状态
  window.wwPay.state.selectedAmount = amount;
  window.wwPay.state.selectedMethod = method;
  window.wwPay.state.currentWishId = wishId;
  
  try {
    await window.wwPay.processPayment();
  } catch (error) {
    console.error('支付流程出错:', error);
    window.wwPay.showGuaranteedToast('支付流程出错，请重试', 'error');
  }
};