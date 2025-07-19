/**
 * 愿望池支付系统
 * 支持支付宝、微信支付和余额支付
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
    this.init = this.init.bind(this);
    
    // 系统配置
    this.config = {
      paymentGateway: {
        apiBase: '',  // 默认使用相对路径
        successUrl: '/system/wishingwell.html?fulfillment_success=true',
        maxChecks: 30,  // 最大检查次数
        checkInterval: 3000,  // 检查间隔（毫秒）
      },
      paymentMethods: [
        {
          id: 'alipay',
          name: '支付宝',
          icon: '<i class="fab fa-alipay"></i>',
          description: '使用支付宝支付',
          enabled: true
        },
        {
          id: 'wechat',
          name: '微信支付',
          icon: '<i class="fab fa-weixin"></i>',
          description: '使用微信支付',
          enabled: true
        }
      ],
      fulfillOptions: [
        { amount: 6.8, description: '基础还愿' },
        { amount: 16.8, description: '标准还愿' },
        { amount: 38, description: '高级还愿' },
        { amount: 88, description: '尊享还愿' },
        { amount: 168, description: '至尊还愿' }
      ]
    };
    
    // 状态管理
    this.state = {
      selectedAmount: null,
      selectedMethod: null,
      currentWishId: null,
      processing: false,
      statusCheckInterval: null,
      paymentCompleted: false,
      lastPayment: null
    };
    
    // 成功回调函数
    this.onSuccessCallback = null;
    
    // 初始化
    this.initEventListeners();
    this.injectStyles();
    this.setupErrorHandling();
    this.cleanupLocalStorage();
  }
  
  // 日志方法
  log(...args) {
    console.log('[WWPay]', ...args);
  }
  
  logError(message, error) {
    console.error(`[WWPay] ${message}:`, error);
  }
  
  safeLogError(message, error) {
    try {
      this.logError(message, error);
    } catch (e) {
      console.error('[WWPay] 日志记录失败:', e);
    }
  }
  
  /**
   * 初始化支付系统
   * @param {Object} options - 配置选项
   * @param {string} options.wishId - 愿望ID
   * @param {Function} options.onSuccess - 支付成功回调
   */
  init(options) {
    this.log('初始化支付系统', options);
    
    // 设置愿望ID
    if (options && options.wishId) {
      this.state.currentWishId = options.wishId;
    }
    
    // 保存成功回调
    if (options && typeof options.onSuccess === 'function') {
      this.onSuccessCallback = options.onSuccess;
    }
    
    // 重置支付状态
    this.resetPaymentState();
    
    // 显示支付方法
    this.showPaymentMethods();
  }
  
  /**
   * 处理充值请求
   * @param {number} amount - 充值金额
   * @param {string} paymentMethod - 支付方式
   */
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
  
  /**
   * 创建充值订单
   * @param {number} amount - 充值金额
   * @param {string} paymentMethod - 支付方式
   * @returns {Promise<Object>} - 订单响应
   */
  async createRechargeOrder(amount, paymentMethod) {
    this.log(`创建充值订单: ${amount}元, 方式: ${paymentMethod}`);
    
    // 获取JWT令牌
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('请先登录');
    }
    
    // 准备请求数据
    const payload = {
      amount: parseFloat(amount),
      paymentMethod
    };
    
    // 发送请求
    const response = await fetch(`${this.config.paymentGateway.apiBase}/api/recharge/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    
    // 处理响应
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `创建充值订单失败: ${response.status}`);
    }
    
    return await response.json();
  }
  
  /**
   * 跳转到支付网关
   * @param {Object} orderData - 订单数据
   */
  async redirectToPaymentGateway(orderData) {
    this.log('跳转到支付网关', orderData);
    
    if (!orderData || !orderData.paymentData) {
      throw new Error('无效的订单数据');
    }
    
    // 创建支付表单
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = orderData.paymentUrl || 'https://api.mybazi.net/pay';
    form.style.display = 'none';
    
    // 添加支付参数
    Object.entries(orderData.paymentData).forEach(([key, value]) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = value;
      form.appendChild(input);
    });
    
    // 提交表单
    document.body.appendChild(form);
    form.submit();
  }
  
  /**
   * 清理本地存储中的过期数据
   */
  cleanupLocalStorage() {
    try {
      // 清理超过24小时的最后支付记录
      const lastPayment = localStorage.getItem('last-payment');
      if (lastPayment) {
        try {
          const paymentData = JSON.parse(lastPayment);
          const timestamp = paymentData.timestamp;
          const now = Date.now();
          
          // 如果超过24小时，删除记录
          if (now - timestamp > 24 * 60 * 60 * 1000) {
            localStorage.removeItem('last-payment');
          }
        } catch (e) {
          // 如果解析失败，直接删除
          localStorage.removeItem('last-payment');
        }
      }
    } catch (error) {
      this.logError('清理本地存储失败', error);
    }
  }
  
  /**
   * 设置全局错误处理
   */
  setupErrorHandling() {
    window.addEventListener('error', (event) => {
      // 只处理来自我们脚本的错误
      if (event.filename && event.filename.includes('wwpay.js')) {
        this.safeLogError('全局错误', {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        });
      }
    });
    
    window.addEventListener('unhandledrejection', (event) => {
      // 尝试判断是否是我们的Promise错误
      const error = event.reason;
      if (error && error.stack && error.stack.includes('wwpay.js')) {
        this.safeLogError('未处理的Promise拒绝', error);
      }
    });
  }
  
  /**
   * 注入必要的CSS样式
   */
  injectStyles() {
    const styleId = 'wwpay-styles';
    
    // 避免重复注入
    if (document.getElementById(styleId)) return;
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .wwpay-fullscreen-loading {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.7);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        color: white;
      }
      
      .wwpay-spinner {
        border: 4px solid rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        border-top: 4px solid white;
        width: 40px;
        height: 40px;
        animation: wwpay-spin 1s linear infinite;
        margin-bottom: 20px;
      }
      
      @keyframes wwpay-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      .wwpay-toast {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        background-color: #333;
        color: white;
        border-radius: 4px;
        z-index: 10000;
        max-width: 300px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        animation: wwpay-fadein 0.3s, wwpay-fadeout 0.5s 2.5s;
        animation-fill-mode: forwards;
      }
      
      .wwpay-toast.success { background-color: #4CAF50; }
      .wwpay-toast.error { background-color: #F44336; }
      .wwpay-toast.warning { background-color: #FF9800; }
      .wwpay-toast.info { background-color: #2196F3; }
      
      @keyframes wwpay-fadein {
        from { opacity: 0; transform: translateY(-20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      @keyframes wwpay-fadeout {
        from { opacity: 1; }
        to { opacity: 0; }
      }
      
      .fulfillment-notification {
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background-color: #4CAF50;
        color: white;
        padding: 15px 25px;
        border-radius: 4px;
        display: flex;
        align-items: center;
        gap: 10px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        z-index: 10000;
        animation: notification-fadein 0.5s;
      }
      
      .fulfillment-notification svg {
        width: 24px;
        height: 24px;
      }
      
      .fulfillment-notification.fade-out {
        animation: notification-fadeout 1s forwards;
      }
      
      @keyframes notification-fadein {
        from { opacity: 0; transform: translate(-50%, -20px); }
        to { opacity: 1; transform: translate(-50%, 0); }
      }
      
      @keyframes notification-fadeout {
        from { opacity: 1; }
        to { opacity: 0; transform: translate(-50%, -20px); }
      }
    `;
    
    document.head.appendChild(style);
  }
  
  /**
   * 初始化事件监听器
   */
  initEventListeners() {
    document.removeEventListener('click', this.handleDocumentClick);
    document.addEventListener('click', this.handleDocumentClick);
  }
  
  /**
   * 处理文档点击事件
   * @param {Event} event - 点击事件
   */
  handleDocumentClick(event) {
    // 处理还愿选项点击
    if (event.target.closest('.fulfill-option')) {
      this.handleFulfillOptionClick(event);
    }
    
    // 处理支付方式选择
    if (event.target.closest('.payment-method-item')) {
      this.handlePaymentMethodSelect(event);
    }
    
    // 处理确认支付按钮点击
    if (event.target.closest('#confirmPaymentBtn')) {
      event.preventDefault();
      this.processPayment();
    }
  }
  
  /**
   * 处理还愿选项点击
   * @param {Event} event - 点击事件
   */
  handleFulfillOptionClick(event) {
    const option = event.target.closest('.fulfill-option');
    if (!option) return;
    
    // 移除其他选项的选中状态
    document.querySelectorAll('.fulfill-option').forEach(el => {
      el.classList.remove('selected');
    });
    
    // 添加当前选项的选中状态
    option.classList.add('selected');
    
    // 更新选中金额
    const amount = parseFloat(option.dataset.amount);
    this.state.selectedAmount = amount;
    
    // 更新确认按钮状态
    this.updateConfirmButtonState();
  }
  
  /**
   * 处理支付方式选择
   * @param {Event} event - 点击事件
   */
  handlePaymentMethodSelect(event) {
    const methodItem = event.target.closest('.payment-method-item');
    if (!methodItem) return;
    
    // 移除其他方式的选中状态
    document.querySelectorAll('.payment-method-item').forEach(el => {
      el.classList.remove('selected');
    });
    
    // 添加当前方式的选中状态
    methodItem.classList.add('selected');
    
    // 更新选中方式
    const method = methodItem.dataset.method;
    this.state.selectedMethod = method;
    
    // 更新确认按钮状态
    this.updateConfirmButtonState();
  }
  
  /**
   * 处理支付流程
   */
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
      
      // 4. 处理第三方支付
      await this.processThirdPartyPayment();
      
    } catch (error) {
      this.handlePaymentError(error);
    }
  }
  
  /**
   * 处理第三方支付
   */
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
  
  /**
   * 验证支付状态
   * @returns {boolean} - 验证结果
   */
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
  
  /**
   * 重定向到登录页面
   */
  redirectToLogin() {
    this.log('重定向到登录页面');
    // 保存当前URL作为登录后的重定向目标
    const currentUrl = window.location.href;
    localStorage.setItem('login_redirect', currentUrl);
    
    // 重定向到用户登录页面
    window.location.href = '/system/user.html';
  }
  
  /**
   * 创建支付订单
   * @returns {Promise<Object>} - 订单响应
   */
  async createPaymentOrder() {
    try {
      // 1. 生成订单ID
      const orderId = this.generateOrderId();
      
      // 2. 异步记录还愿
      this.recordFulfillment().catch(error => {
        this.logError('记录还愿失败', error);
      });
      
      // 3. 构建支付数据
      const paymentData = {
        out_trade_no: orderId,
        subject: `愿望还愿 - ID: ${this.state.currentWishId}`,
        total_amount: this.state.selectedAmount.toFixed(2),
        body: `还愿金额: ${this.state.selectedAmount}元`,
        product_code: 'FAST_INSTANT_TRADE_PAY',
        return_url: window.location.origin + this.config.paymentGateway.successUrl + '&wish_id=' + this.state.currentWishId,
        notify_url: window.location.origin + '/api/payments/notify',
        passback_params: JSON.stringify({
          wishId: this.state.currentWishId,
          type: 'fulfillment'
        })
      };
      
      // 4. 生成签名
      const signature = await this.generateSignature(paymentData);
      paymentData.sign = signature;
      paymentData.sign_type = 'MD5';
      
      return {
        success: true,
        orderId,
        paymentData,
        paymentUrl: 'https://api.mybazi.net/pay'
      };
    } catch (error) {
      this.logError('创建支付订单失败', error);
      return {
        success: false,
        error: error.message || '创建支付订单失败'
      };
    }
  }
  
  /**
   * 生成签名
   * @param {Object} data - 待签名数据
   * @returns {Promise<string>} - 签名
   */
  async generateSignature(data) {
    try {
      // 1. 过滤参数
      const filteredParams = {};
      Object.keys(data).forEach(key => {
        if (data[key] !== undefined && data[key] !== null && data[key] !== '') {
          filteredParams[key] = data[key];
        }
      });
      
      // 2. 按键名排序
      const sortedKeys = Object.keys(filteredParams).sort();
      
      // 3. 构建签名字符串
      let signStr = '';
      sortedKeys.forEach(key => {
        signStr += `${key}=${filteredParams[key]}&`;
      });
      
      // 4. 添加密钥
      signStr += 'key=your_payment_secret_key';
      
      // 5. 使用MD5生成签名
      // 确保CryptoJS已加载
      if (typeof CryptoJS === 'undefined') {
        await this.loadCryptoJS();
      }
      
      const signature = CryptoJS.MD5(signStr).toString();
      return signature;
    } catch (error) {
      this.logError('生成签名失败', error);
      throw new Error('生成支付签名失败');
    }
  }
  
  /**
   * 加载CryptoJS库
   * @returns {Promise<void>}
   */
  async loadCryptoJS() {
    return new Promise((resolve, reject) => {
      if (typeof CryptoJS !== 'undefined') {
        resolve();
        return;
      }
      
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js';
      script.integrity = 'sha512-E8QSvWZ0eCLGk4km3hxSsNmGWbLtSCSUcewDQPQWZF6pEU8GlT8a5fF32wOl1i8ftdMhssTrF/OhyGWwonTcXA==';
      script.crossOrigin = 'anonymous';
      script.onload = resolve;
      script.onerror = () => reject(new Error('加载CryptoJS失败'));
      document.head.appendChild(script);
    });
  }
  
  /**
   * 提交支付表单
   * @param {Object} paymentData - 支付数据
   */
  submitPaymentForm(paymentData) {
    // 创建表单
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = 'https://api.mybazi.net/pay';
    form.target = '_self';
    form.style.display = 'none';
    
    // 添加支付参数
    Object.entries(paymentData).forEach(([key, value]) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = value;
      form.appendChild(input);
    });
    
    // 提交表单
    document.body.appendChild(form);
    form.submit();
  }
  
  /**
   * 启动支付状态检查
   * @param {string} orderId - 订单ID
   */
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
        this.log('支付状态检查超时');
        return;
      }
      
      try {
        const result = await this.checkPaymentStatus();
        
        if (result.paid) {
          this.state.paymentCompleted = true;
          this.clearPaymentStatusCheck();
          await this.handlePaymentSuccess();
        }
      } catch (error) {
        // 特殊处理认证错误
        if (error.code === 'USER_NOT_AUTHENTICATED') {
          this.clearPaymentStatusCheck();
          this.showToast('登录已过期，请重新登录', 'warning');
          // 触发页面内登录模态框
          if (typeof toggleAuthModal === 'function') {
            toggleAuthModal(true);
            if (typeof switchAuthTab === 'function') {
              switchAuthTab('login');
            }
          }
          return;
        }
        
        this.logError('检查支付状态失败', error);
      }
    }, checkInterval);
  }
  
  /**
   * 检查支付状态
   * @returns {Promise<Object>} - 支付状态
   */
  async checkPaymentStatus() {
    const token = localStorage.getItem('token');
    if (!token) {
      const error = new Error('用户未登录');
      error.code = 'USER_NOT_AUTHENTICATED';
      throw error;
    }
    
    const response = await fetch(`${this.config.paymentGateway.apiBase}/api/payments/status?wishId=${this.state.currentWishId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    // 特殊处理401错误
    if (response.status === 401) {
      const error = new Error('登录已过期');
      error.code = 'USER_NOT_AUTHENTICATED';
      throw error;
    }
    
    if (!response.ok) {
      throw new Error(`检查支付状态失败: ${response.status}`);
    }
    
    return await response.json();
  }
  
  /**
   * 清除支付状态检查
   */
  clearPaymentStatusCheck() {
    if (this.state.statusCheckInterval) {
      clearInterval(this.state.statusCheckInterval);
      this.state.statusCheckInterval = null;
    }
  }
  
  /**
   * 处理支付成功
   */
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

      // 3. 调用成功回调
      if (typeof this.onSuccessCallback === 'function') {
        try {
          this.onSuccessCallback();
        } catch (callbackError) {
          this.logError('成功回调执行失败', callbackError);
        }
      }

      // 4. 准备跳转
      this.prepareSuccessRedirect();
      
    } catch (error) {
      this.handlePaymentSuccessError(error);
    }
  }
  
  /**
   * 确保还愿记录到fulfillments表
   * @returns {Promise<Object>} - 记录结果
   */
  async ensureFulfillmentRecorded() {
    try {
      // 检查是否已记录
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('用户未登录');
      }
      
      const response = await fetch(`${this.config.paymentGateway.apiBase}/api/fulfillments/check?wishId=${this.state.currentWishId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // 特殊处理401错误
      if (response.status === 401) {
        const error = new Error('登录已过期');
        error.code = 'USER_NOT_AUTHENTICATED';
        throw error;
      }
      
      if (!response.ok) {
        throw new Error(`检查还愿记录失败: ${response.status}`);
      }
      
      const data = await response.json();
      
      // 如果已记录，直接返回成功
      if (data.recorded) {
        return { success: true, message: '还愿已记录' };
      }
      
      // 如果未记录，尝试记录
      return await this.recordFulfillment();
      
    } catch (error) {
      this.logError('确保还愿记录失败', error);
      return { success: false, message: error.message };
    }
  }
  
  /**
   * 验证愿望是否已从wishes表中删除
   * @returns {Promise<boolean>} - 验证结果
   */
  async verifyWishRemoved() {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('用户未登录');
      }
      
      const response = await fetch(`${this.config.paymentGateway.apiBase}/api/wishes/check?wishId=${this.state.currentWishId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // 特殊处理401错误
      if (response.status === 401) {
        const error = new Error('登录已过期');
        error.code = 'USER_NOT_AUTHENTICATED';
        throw error;
      }
      
      if (!response.ok) {
        throw new Error(`验证愿望删除失败: ${response.status}`);
      }
      
      const data = await response.json();
      
      // 如果愿望不存在或已标记为已还愿，则验证成功
      return !data.exists || data.fulfilled;
      
    } catch (error) {
      this.logError('验证愿望删除失败', error);
      return false;
    }
  }
  
  /**
   * 准备成功跳转
   */
  prepareSuccessRedirect() {
    // 添加查询参数
    const url = new URL(this.config.paymentGateway.successUrl, window.location.origin);
    url.searchParams.append('wish_id', this.state.currentWishId);
    
    // 显示提示
    this.showGuaranteedToast('还愿成功！正在跳转...', 'success');
    
    // 延迟跳转，给用户时间看到提示
    setTimeout(() => {
      window.location.href = url.toString();
    }, 2000);
  }
  
  /**
   * 记录还愿信息
   * @returns {Promise<Object>} - 记录结果
   */
  async recordFulfillment() {
    try {
      // 验证愿望ID
      if (!this.state.currentWishId) {
        throw new Error('无效的愿望ID');
      }
      
      // 验证本地愿望卡片是否存在
      const wishCard = this.findWishCard(this.state.currentWishId);
      if (!wishCard) {
        this.log('未找到愿望卡片，可能在其他页面');
      }
      
      // 构建请求数据
      const payload = {
        wishId: this.state.currentWishId,
        amount: this.state.selectedAmount || 0,
        paymentMethod: this.state.selectedMethod || 'unknown'
      };
      
      // 获取JWT令牌
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('用户未登录');
      }
      
      // 发送请求
      let retries = 3;
      let delay = 1000;
      let success = false;
      let lastError = null;
      
      while (retries > 0 && !success) {
        try {
          const response = await fetch(`${this.config.paymentGateway.apiBase}/api/fulfillments/record`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
          });
          
          // 特殊处理401错误
          if (response.status === 401) {
            const error = new Error('登录已过期');
            error.code = 'USER_NOT_AUTHENTICATED';
            throw error;
          }
          
          if (!response.ok) {
            throw new Error(`记录还愿失败: ${response.status}`);
          }
          
          const data = await response.json();
          success = true;
          
          // 如果找到愿望卡片，安全移除
          if (wishCard) {
            this.safeRemoveWishCard(wishCard);
          }
          
          return { success: true, message: '还愿记录成功', data };
          
        } catch (error) {
          lastError = error;
          
          // 如果是认证错误，不再重试
          if (error.code === 'USER_NOT_AUTHENTICATED') {
            break;
          }
          
          retries--;
          if (retries > 0) {
            await this.delay(delay);
            delay *= 2; // 指数退避
          }
        }
      }
      
      // 所有尝试失败，保存到本地存储的待处理列表
      if (!success) {
        this.savePendingFulfillment();
        
        // 如果是认证错误，显示友好提示
        if (lastError && lastError.code === 'USER_NOT_AUTHENTICATED') {
          return { success: false, message: '登录已过期，请重新登录' };
        }
        
        return { success: false, message: lastError ? lastError.message : '记录还愿失败' };
      }
      
    } catch (error) {
      this.logError('记录还愿失败', error);
      this.savePendingFulfillment();
      return { success: false, message: error.message };
    }
  }
  
  /**
   * 安全移除愿望卡片
   * @param {HTMLElement} wishCard - 愿望卡片元素
   */
  safeRemoveWishCard(wishCard) {
    try {
      // 应用移除动画
      this.applyRemovalAnimation(wishCard);
      
      // 延迟后移除DOM元素
      setTimeout(() => {
        try {
          if (wishCard && wishCard.parentNode) {
            wishCard.parentNode.removeChild(wishCard);
          }
        } catch (e) {
          this.logError('移除愿望卡片DOM失败', e);
        }
      }, 500);
    } catch (error) {
      this.logError('安全移除愿望卡片失败', error);
    }
  }
  
  /**
   * 查找愿望卡片
   * @param {string} wishId - 愿望ID
   * @returns {HTMLElement|null} - 愿望卡片元素
   */
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
  
  /**
   * 应用移除动画
   * @param {HTMLElement} element - 目标元素
   */
  applyRemovalAnimation(element) {
    try {
      if (!element) return;
      
      // 添加淡出和缩小动画
      element.style.transition = 'all 0.5s ease';
      element.style.opacity = '0';
      element.style.transform = 'scale(0.8)';
      element.style.pointerEvents = 'none';
    } catch (error) {
      this.logError('应用移除动画失败', error);
    }
  }
  
  /**
   * 清理支付状态
   */
  cleanupPaymentState() {
    this.clearPaymentStatusCheck();
    this.hideFullscreenLoading();
    this.state.processing = false;
    this.updateConfirmButtonState();
  }
  
  /**
   * 重置支付状态
   */
  resetPaymentState() {
    this.state.selectedAmount = null;
    this.state.selectedMethod = null;
    this.state.processing = false;
    this.state.paymentCompleted = false;
    this.onSuccessCallback = null;
    
    // 清除UI选中状态
    document.querySelectorAll('.fulfill-option, .payment-method-item').forEach(el => {
      el.classList.remove('selected');
    });
    
    // 更新确认按钮状态
    this.updateConfirmButtonState();
  }
  
  /**
   * 验证支付状态
   * @returns {boolean} - 验证结果
   */
  validatePaymentState() {
    if (this.state.processing) {
      this.showToast('支付正在处理中，请稍候', 'warning');
      return false;
    }
    
    if (!this.state.selectedAmount) {
      this.showToast('请选择还愿金额', 'warning');
      return false;
    }
    
    if (!this.state.selectedMethod) {
      this.showToast('请选择支付方式', 'warning');
      return false;
    }
    
    if (!this.state.currentWishId) {
      this.showToast('无效的愿望ID', 'error');
      return false;
    }
    
    return true;
  }
  
  /**
   * 更新确认按钮状态
   */
  updateConfirmButtonState() {
    const confirmBtn = document.getElementById('confirmPaymentBtn');
    if (!confirmBtn) return;
    
    const isValid = this.state.selectedAmount && this.state.selectedMethod && !this.state.processing;
    
    confirmBtn.disabled = !isValid;
    confirmBtn.classList.toggle('disabled', !isValid);
    
    if (this.state.processing) {
      confirmBtn.textContent = '处理中...';
    } else {
      confirmBtn.textContent = '确认支付';
    }
  }
  
  /**
   * 保存待处理还愿信息
   */
  savePendingFulfillment() {
    try {
      const pendingData = {
        wishId: this.state.currentWishId,
        amount: this.state.selectedAmount,
        method: this.state.selectedMethod,
        timestamp: Date.now()
      };
      
      localStorage.setItem('pending-fulfillment', JSON.stringify(pendingData));
      this.log('已保存待处理还愿信息', pendingData);
    } catch (error) {
      this.logError('保存待处理还愿信息失败', error);
    }
  }
  
  /**
   * 显示保证显示的Toast
   * @param {string} message - 消息内容
   * @param {string} type - 消息类型
   */
  showGuaranteedToast(message, type = 'info') {
    // 先移除所有现有的toast
    this.removeAllToasts();
    
    // 延迟一帧再显示新toast
    setTimeout(() => {
      this.showToast(message, type);
    }, 50);
  }
  
  /**
   * 移除所有Toast
   */
  removeAllToasts() {
    document.querySelectorAll('.wwpay-toast').forEach(toast => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    });
  }
  
  /**
   * 显示全屏加载
   * @param {string} message - 加载消息
   */
  showFullscreenLoading(message = '加载中...') {
    // 移除现有的加载层
    this.hideFullscreenLoading();
    
    // 创建新的加载层
    const loading = document.createElement('div');
    loading.className = 'wwpay-fullscreen-loading';
    loading.innerHTML = `
      <div class="wwpay-spinner"></div>
      <div>${message}</div>
    `;
    
    document.body.appendChild(loading);
  }
  
  /**
   * 隐藏全屏加载
   */
  hideFullscreenLoading() {
    document.querySelectorAll('.wwpay-fullscreen-loading').forEach(el => {
      if (el.parentNode) {
        el.parentNode.removeChild(el);
      }
    });
  }
  
  /**
   * 显示Toast消息
   * @param {string} message - 消息内容
   * @param {string} type - 消息类型
   */
  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `wwpay-toast ${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // 3秒后自动移除
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 3000);
  }
  
  /**
   * 显示支付方法
   */
  showPaymentMethods() {
    const container = document.querySelector('.payment-methods-container');
    if (!container) return;
    
    // 清空容器
    container.innerHTML = '';
    
    // 添加支付方法
    this.config.paymentMethods.forEach(method => {
      if (!method.enabled) return;
      
      const methodItem = document.createElement('div');
      methodItem.className = 'payment-method-item';
      methodItem.dataset.method = method.id;
      methodItem.innerHTML = `
        <div class="payment-method-icon">${method.icon}</div>
        <div class="payment-method-name">${method.name}</div>
      `;
      
      container.appendChild(methodItem);
    });
  }
  
  /**
   * 延迟函数
   * @param {number} ms - 延迟毫秒数
   * @returns {Promise<void>}
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * 生成订单ID
   * @returns {string} - 订单ID
   */
  generateOrderId() {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `WW${timestamp}${random}`;
  }
  
  /**
   * 检查愿望状态
   * @param {string} wishId - 愿望ID
   * @returns {Promise<Object>} - 愿望状态
   */
  async checkWishStatus(wishId) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        const error = new Error('用户未登录');
        error.code = 'USER_NOT_AUTHENTICATED';
        // 不在这里调用redirectToLogin，让调用者决定是否重定向
        throw error;
      }
      
      // 修改为调用正确的后端接口路径 /api/wishes/check
      const response = await fetch(`${this.config.paymentGateway.apiBase}/api/wishes/check?wishId=${wishId}`, {
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
       
       // 检查愿望是否存在
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
        return '登录已过期，请重新登录';
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
      // 显示友好提示并触发页面内登录
      this.showToast('登录已过期，请重新登录', 'warning');
      // 触发页面内登录模态框
      if (typeof toggleAuthModal === 'function') {
        toggleAuthModal(true);
        if (typeof switchAuthTab === 'function') {
          switchAuthTab('login');
        }
      }
      // 隐藏加载动画和更新按钮状态
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
