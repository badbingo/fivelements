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
        // 初始化日志方法
    this.log = this.log.bind(this);
    this.logError = this.logError.bind(this);
    this.safeLogError = this.safeLogError.bind(this);

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
          color: '#ff9500',
          activeColor: '#e68a00',
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

// 日志方法
  log(...messages) {
    if (this.config.debug) {
      console.log('[WWPay]', new Date().toISOString(), ...messages);
    }
  }

  logError(context, error) {
    try {
      // 确保错误对象是有效的
      let errorMessage, errorCode, errorStack, errorStatus;
      
      // 处理不同类型的错误对象
      if (error instanceof Error) {
        errorMessage = error.message;
        errorStack = error.stack || 'No stack trace available';
        errorCode = error.code || 'UNKNOWN_ERROR';
        errorStatus = error.status || (error.response ? error.response.status : null);
      } else if (typeof error === 'string') {
        errorMessage = error;
        errorStack = 'No stack trace available';
        errorCode = 'STRING_ERROR';
        errorStatus = error.includes('401') ? 401 : null;
      } else if (error && typeof error === 'object') {
        errorMessage = error.message || error.error || JSON.stringify(error);
        errorStack = error.stack || 'No stack trace available';
        errorCode = error.code || error.status || 'OBJECT_ERROR';
        errorStatus = error.status || (error.response ? error.response.status : null);
      } else {
        errorMessage = error ? String(error) : 'Unknown error';
        errorStack = 'No stack trace available';
        errorCode = 'UNKNOWN_TYPE_ERROR';
        errorStatus = null;
      }
      
      // 特殊处理401错误
      if (errorStatus === 401 || errorCode === 'USER_NOT_AUTHENTICATED' || 
          (errorMessage && errorMessage.includes('登录') && errorMessage.includes('过期'))) {
        errorCode = 'USER_NOT_AUTHENTICATED';
      }
      
      // 记录错误信息
      console.error(`[WWPay] ERROR [${new Date().toISOString()}] ${context}:`, {
        error: errorMessage,
        code: errorCode,
        status: errorStatus,
        stack: errorStack,
        paymentState: this.state ? { ...this.state } : 'No state available'
      });
    } catch (e) {
      // 如果记录错误时出错，使用更简单的方式记录
      try {
        console.error(`[WWPay] ERROR [${new Date().toISOString()}] ${context}: 无法记录详细错误信息`, 
          typeof error === 'object' ? JSON.stringify(error) : String(error));
      } catch (finalError) {
        // 最后的容错处理
        try {
          console.error(`[WWPay] CRITICAL ERROR: 无法记录错误信息 - ${context}`);
        } catch (ultimateError) {
          // 什么都不做，已经尽力了
        }
      }
    }
  }

  safeLogError(context, error) {
    try {
      this.logError(context, error);
    } catch (logError) {
      console.error('[WWPay] CRITICAL: Failed to log error', logError);
    }
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

      const confirmBtn = e.target.closest('#confirm-payment-btn');
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
    try {
      // 1. 验证支付状态
      if (!this.validatePaymentState()) {
        this.log('支付状态验证失败');
        throw new Error('INVALID_PAYMENT_STATE');
      }

      // 2. 更新处理状态
      this.state.processing = true;
      this.updateConfirmButtonState();
      this.showFullscreenLoading('正在准备支付...');
      
      // 3. 记录支付信息
      this.state.lastPayment = {
        wishId: this.state.currentWishId,
        amount: this.state.selectedAmount,
        method: this.state.selectedMethod,
        timestamp: Date.now()
      };
      localStorage.setItem('last-payment', JSON.stringify(this.state.lastPayment));

      // 4. 处理不同类型的支付
      if (this.state.selectedMethod === 'balance') {
        return await this.processBalancePayment();
      } else {
        return await this.processThirdPartyPayment();
      }
    } catch (error) {
      // 5. 错误处理
      this.handlePaymentError(error);
      return { 
        success: false, 
        error: 'PAYMENT_FAILED',
        message: this.getUserFriendlyError(error),
        code: error.code || 'UNKNOWN_ERROR'
      };
    } finally {
      // 6. 清理状态
      this.state.processing = false;
      this.updateConfirmButtonState();
      this.hideFullscreenLoading();
    }
  }

  async processBalancePayment() {
  try {
    // 1. 验证必要参数
    if (!this.state.currentWishId || !this.state.selectedAmount) {
      throw { code: 'MISSING_REQUIRED_FIELDS', message: '请选择还愿金额和愿望' };
    }

    // 2. 获取JWT令牌
    const token = localStorage.getItem('token');
    if (!token) {
      const error = new Error('请先登录');
      error.code = 'USER_NOT_AUTHENTICATED';
      // 显示友好提示，但不立即跳转
      this.showToast('请先登录后再使用余额支付', 'warning');
      // 延迟跳转，给用户时间看到提示
      setTimeout(() => this.redirectToLogin(), 1500);
      throw error;
    }
    
    // 3. 支付前检查愿望状态
    try {
      await this.checkWishStatus(this.state.currentWishId);
    } catch (statusError) {
      // 如果是认证错误，显示提示并延迟跳转
      if (statusError.code === 'USER_NOT_AUTHENTICATED') {
        this.showToast('登录已过期，请重新登录', 'warning');
        // 延迟跳转，给用户时间看到提示
        setTimeout(() => this.redirectToLogin(), 1500);
        throw statusError;
      }
      // 其他错误继续抛出
      throw statusError;
    }

    // 4. 准备请求数据
    const payload = {
      wishId: this.state.currentWishId,
      amount: parseFloat(this.state.selectedAmount).toFixed(2)
    };

    // 5. 发送支付请求
    const response = await fetch(`${this.config.paymentGateway.apiBase}/api/payments/balance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    // 6. 处理响应
    // 特殊处理401错误
    if (response.status === 401) {
      const error = new Error('登录已过期，请重新登录');
      error.code = 'USER_NOT_AUTHENTICATED';
      this.redirectToLogin();
      throw error;
    }
    
    const data = await response.json();
    
    if (!response.ok) {
      // 如果是余额不足错误，提供更友好的提示
      if (data.error === '余额不足') {
        const error = new Error(`余额不足 (当前余额: ${data.currentBalance || '未知'}, 需要: ${data.requiredAmount || '未知'})`);
        error.code = 'INSUFFICIENT_BALANCE';
        error.serverResponse = data;
        throw error;
      }
      
      // 如果是愿望已还愿错误
      if (data.error === '愿望已还愿') {
        const error = new Error('该愿望已经还愿，无需重复支付');
        error.code = 'WISH_ALREADY_FULFILLED';
        error.serverResponse = data;
        throw error;
      }
      
      const error = new Error(data.message || data.error || '支付失败');
      error.code = data.error || 'PAYMENT_FAILED';
      error.serverResponse = data;
      throw error;
    }

    // 6. 更新本地状态
    if (data.newBalance !== undefined) {
      this.updateUserBalance(data.newBalance);
    }

    // 7. 处理支付成功
    await this.handlePaymentSuccess();
    
    return {
      success: true,
      transactionId: data.transactionId,
      newBalance: data.newBalance
    };

  } catch (error) {
    // 如果是网络错误，尝试重试
    if (error.message.includes('Failed to fetch') || error.message.includes('CORS')) {
      this.log('余额支付网络错误，尝试重试...');
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return await this.processBalancePayment();
      } catch (retryError) {
        this.handlePaymentError(retryError);
        throw retryError;
      }
    }
    
    this.handlePaymentError(error);
    throw error;
  }
}

async processThirdPartyPayment() {
    this.log('开始第三方支付流程');
    
    // 1. 创建支付订单
    const orderResponse = await this.createPaymentOrder();
    if (!orderResponse.success) {
        throw new Error(orderResponse.error || '创建支付订单失败');
    }

    // 2. 显示重定向提示
    this.showToast('正在跳转支付平台...', 'info');

    // 3. 提交支付表单
    await this.submitPaymentForm(orderResponse.paymentData);

    // 4. 启动支付状态检查
    this.startPaymentStatusCheck(orderResponse.orderId);

    return { 
        success: true, 
        orderId: orderResponse.orderId,
        message: '已跳转至支付平台' 
    };
}

// 辅助方法
updateUserBalance(newBalance) {
    this.log('更新用户余额:', newBalance);
    // 更新全局状态或触发事件
    const event = new CustomEvent('balance-updated', { detail: { newBalance } });
    document.dispatchEvent(event);
}

validatePaymentState() {
    if (!this.state.selectedAmount || this.state.selectedAmount <= 0) {
        this.showToast('请选择有效的支付金额', 'error');
        return false;
    }
    
    if (!this.state.currentWishId) {
        this.showToast('无效的愿望ID', 'error');
        return false;
    }
    
    if (!this.state.selectedMethod) {
        this.showToast('请选择支付方式', 'error');
        return false;
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
        this.showToast('请先登录', 'error');
        this.redirectToLogin();
        return false;
    }
    
    return true;
}

  redirectToLogin() {
    this.log('重定向到登录页面');
    // 保存当前URL作为登录后的重定向目标
    const currentUrl = window.location.href;
    localStorage.setItem('login_redirect', currentUrl);
    
    // 重定向到用户登录页面
    window.location.href = '/system/user.html';
  }

  async createPaymentOrder() {
    try {
      const orderId = this.generateOrderId();
      
      // 异步记录还愿
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
        
        // 特殊处理认证错误，避免显示重复的错误提示
        if (error.code === 'USER_NOT_AUTHENTICATED') {
          // 已经在 processBalancePayment 或 checkPaymentStatus 中处理了重定向和提示
          // 这里只需要隐藏加载动画
          this.hideFullscreenLoading();
          return;
        }
        
        // 显示友好的错误信息
        const friendlyError = this.getUserFriendlyError(error);
        this.showGuaranteedToast(friendlyError, 'error');
        this.hideFullscreenLoading();
      }
    }, checkInterval);
  }

  async checkPaymentStatus() {
    try {
      // 检查token是否存在
      const token = localStorage.getItem('token');
      if (!token) {
        const error = new Error('用户未登录');
        error.code = 'USER_NOT_AUTHENTICATED';
        this.redirectToLogin();
        throw error;
      }
      
      const response = await fetch(
        `${this.config.paymentGateway.apiBase}/api/payments/status?wishId=${this.state.currentWishId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      // 特殊处理401错误
      if (response.status === 401) {
        const error = new Error('登录已过期，请重新登录');
        error.code = 'USER_NOT_AUTHENTICATED';
        this.redirectToLogin();
        throw error;
      }
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '支付状态检查失败');
      }
      
      return data;
    } catch (error) {
      this.logError('支付状态检查失败', error);
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
      
    const methodsHtml = `
  <div class="payment-methods" id="payment-methods-section" style="display: flex; flex-direction: column; gap: 20px;">
    <!-- 第一层：标题（靠左） -->
    <h4 style="color: white; margin: 0;">
      <i class="fas fa-wallet" style="margin-right: 8px;"></i>选择支付方式
    </h4>

    <!-- 第二层：支付按钮（居中） -->
    <div style="display: flex; justify-content: center; gap: 15px;">
      ${this.config.paymentMethods.map(method => `
        <button class="wwpay-method-btn ${method.id === this.state.selectedMethod ? 'active' : ''}" 
                data-type="${method.id}" 
                style="background: ${method.id === this.state.selectedMethod ? method.activeColor : method.color}; 
                       color: white; padding: 10px 20px; border: none; border-radius: 5px;">
          <i class="${method.icon}"></i>
          <span class="wwpay-method-name">${method.name}</span>
          <span class="wwpay-method-hint">${method.hint}</span>
        </button>
      `).join('')}
    </div>

    <!-- 第三层：确认按钮（居中） -->
    <div style="display: flex; justify-content: center;">
      <button id="confirm-payment-btn" style="padding: 10px 30px; background: #1890ff; color: white; border: none; border-radius: 5px;">
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

  async checkWishStatus(wishId) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        const error = new Error('用户未登录');
        error.code = 'USER_NOT_AUTHENTICATED';
        // 不在这里调用redirectToLogin，让调用者决定是否重定向
        throw error;
      }
      
      const response = await fetch(`${this.config.paymentGateway.apiBase}/api/wishes/status?wishId=${wishId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        // 特殊处理401错误
        if (response.status === 401) {
          const error = new Error('登录已过期，请重新登录');
          error.code = 'USER_NOT_AUTHENTICATED';
          // 不在这里调用redirectToLogin，让调用者决定是否重定向
          throw error;
        }
        throw new Error(`检查愿望状态失败: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.fulfilled) {
         const error = new Error('该愿望已经还愿');
         error.code = 'WISH_ALREADY_FULFILLED';
         throw error;
       }
       
       if (!data.exists) {
         const error = new Error('愿望不存在');
         error.code = 'WISH_NOT_FOUND';
         throw error;
       }
      
      return data;
    } catch (error) {
      this.logError('检查愿望状态失败', error);
      throw error;
    }
  }

  getUserFriendlyError(error) {
    if (error.message && error.message.includes('db.transaction is not a function')) {
      return '支付系统内部错误，请稍后再试';
    }
    
    // 处理401错误
    if (error.message && error.message.includes('401')) {
      return '登录已过期，正在为您跳转到登录页面...';
    }
    
    // 根据错误代码提供友好的错误信息
    switch (error.code) {
      case 'WISH_ALREADY_FULFILLED':
        return '该愿望已经还愿，无需重复支付';
      case 'WISH_NOT_FOUND':
        return '愿望不存在或已被删除';
      case 'INSUFFICIENT_BALANCE':
        return error.message || '余额不足';
      case 'USER_NOT_AUTHENTICATED':
        return '登录已过期，正在为您跳转到登录页面...';
      case 'MISSING_REQUIRED_FIELDS':
        return '请选择还愿金额和愿望';
      case 'INVALID_PAYMENT_STATE':
        return '支付状态异常，请刷新页面重试';
      default:
        return error.message || '支付处理失败，请稍后重试';
    }
  }

  handlePaymentError(error) {
    this.safeLogError('支付处理失败', error);
    
    // 特殊处理认证错误，避免显示重复的错误提示
    if (error.code === 'USER_NOT_AUTHENTICATED') {
      // 已经在 processBalancePayment 或 checkPaymentStatus 中处理了重定向和提示
      // 这里只需要隐藏加载动画和更新按钮状态
      this.hideFullscreenLoading();
      this.state.processing = false;
      this.updateConfirmButtonState();
      return;
    }
    
    // 获取友好的错误信息并显示
    const friendlyError = this.getUserFriendlyError(error);
    this.showGuaranteedToast(`支付失败: ${friendlyError}`, 'error');
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
