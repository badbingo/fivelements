/**
 * 命缘池支付系统 - 完整修复版 v10.3
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
    this.checkBalanceForPayment = this.checkBalanceForPayment.bind(this);
    this.processBalancePayment = this.processBalancePayment.bind(this);

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
          color: '#6c757d',
          activeColor: '#5a6268',
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

      // 移除之前的金额选择按钮高亮
      document.querySelectorAll('.fulfill-option').forEach(option => {
        option.classList.remove('active');
      });
      
      // 高亮当前选择的金额按钮
      optionElement.classList.add('active');
      
      // 显示支付方式
      this.showPaymentMethods();
      
      // 检查余额是否足够
      this.checkBalanceForPayment();
    } catch (error) {
      this.showToast(`操作失败: ${error.message}`, 'error');
    }
  }

  handlePaymentMethodSelect(methodOrElement) {
    try {
      // 处理传入的是DOM元素或字符串的情况
      let selectedMethod;
      if (typeof methodOrElement === 'string') {
        selectedMethod = methodOrElement;
      } else if (methodOrElement && methodOrElement.dataset) {
        selectedMethod = methodOrElement.dataset.type;
      } else {
        throw new Error('无效的支付方式');
      }
      
      // 如果正在处理支付，不允许切换支付方式
      if (this.state.processing) {
        this.showToast('支付处理中，请稍候', 'warning');
        return;
      }
      
      // 验证支付方式是否有效
      const selectedMethodConfig = this.config.paymentMethods.find(m => m.id === selectedMethod);
      if (!selectedMethodConfig) {
        throw new Error(`未知的支付方式: ${selectedMethod}`);
      }
      
      // 如果选择了余额支付，但余额不足，显示提示并自动切换到支付宝
      if (selectedMethod === 'balance' && this.state.balance < this.state.selectedAmount) {
        this.showToast(`余额不足，当前余额${this.state.balance}元，需要${this.state.selectedAmount}元`, 'warning');
        // 延迟1秒后自动切换到支付宝支付
        setTimeout(() => {
          this.handlePaymentMethodSelect('alipay');
        }, 1000);
        return;
      }
      
      // 更新所有支付方式按钮的样式
      document.querySelectorAll('.wwpay-method-btn').forEach(btn => {
        const methodId = btn.dataset.type;
        const method = this.config.paymentMethods.find(m => m.id === methodId);
        if (method) {
          btn.style.background = method.color;
          btn.classList.remove('active');
        }
      });
      
      // 更新选中的支付方式按钮样式
      const buttonElement = document.querySelector(`.wwpay-method-btn[data-type="${selectedMethod}"]`);
      if (buttonElement) {
        buttonElement.style.background = selectedMethodConfig.activeColor;
        buttonElement.classList.add('active');
      }
      
      // 更新状态
      this.state.selectedMethod = selectedMethod;
      
      // 更新确认支付按钮文本和状态
      const confirmBtn = document.getElementById('confirm-payment-btn');
      if (confirmBtn) {
        // 根据支付方式显示不同的按钮文本
        let buttonText = `确认${selectedMethodConfig.name} ${this.state.selectedAmount}元`;
        if (selectedMethod === 'balance') {
          buttonText = `确认余额支付 ${this.state.selectedAmount}元 (剩余${(this.state.balance - this.state.selectedAmount).toFixed(2)}元)`;
        }
        confirmBtn.innerHTML = `<i class="fas fa-check-circle" style="margin-right: 8px;"></i> ${buttonText}`;
      }
      
      // 更新确认支付按钮状态
      this.updateConfirmButtonState();
      
      // 如果选择了余额支付，检查余额是否足够
      if (selectedMethod === 'balance') {
        this.checkBalanceForPayment();
      }
      
      this.log(`已选择支付方式: ${selectedMethodConfig.name}`);
    } catch (error) {
      this.safeLogError('选择支付方式失败', error);
      this.showToast(`选择支付方式失败: ${error.message}`, 'error');
    }
  }

  /* ========== 余额支付相关方法 ========== */
  
  updateConfirmButtonState() {
    try {
      const confirmBtn = document.getElementById('confirm-payment-btn');
      if (!confirmBtn) return;
      
      // 如果正在处理支付，禁用按钮
      if (this.state.processing) {
        confirmBtn.disabled = true;
        return;
      }
      
      // 如果选择了余额支付，检查余额是否足够
      if (this.state.selectedMethod === 'balance') {
        if (this.state.balance >= this.state.selectedAmount) {
          confirmBtn.disabled = false;
        } else {
          confirmBtn.disabled = true;
        }
      } else {
        // 其他支付方式，只要选择了金额就启用按钮
        confirmBtn.disabled = false;
      }
    } catch (error) {
      this.safeLogError('更新确认按钮状态失败', error);
    }
  }
  
  async checkBalanceForPayment(retryCount = 3) {
    try {
      // 先显示加载状态
      const modalBalanceAmount = document.getElementById('modalBalanceAmount');
      if (modalBalanceAmount) {
        modalBalanceAmount.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
      }
      
      // 检查是否已登录
      const token = localStorage.getItem('token');
      if (!token) {
        // 未登录状态
        if (modalBalanceAmount) {
          modalBalanceAmount.textContent = '未登录';
        }
        
        // 隐藏余额支付按钮
        const balanceBtn = document.querySelector('.wwpay-method-btn[data-type="balance"]');
        if (balanceBtn) {
          balanceBtn.style.display = 'none';
        }
        
        return;
      }
      
      // 发送请求获取余额
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时，进一步增加超时时间以适应非常慢的网络
      
      try {
        const response = await fetch(`${this.config.paymentGateway.apiBase}/api/users/balance`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Cache-Control': 'no-cache, no-store'
          },
          signal: controller.signal
        }).catch(error => {
          // 处理网络错误
          if (error.name === 'AbortError') {
            throw new Error('获取余额超时，服务器响应时间过长');
          } else if (!navigator.onLine) {
            throw new Error('网络连接已断开，请检查您的网络设置');
          } else if (error.message && error.message.includes('NetworkError')) {
            // 特别处理 NetworkError 类型的错误
            throw new Error('网络请求失败，请检查网络连接');
          } else if (error.message && (error.message.includes('CORS') || error.message.includes('cross-origin'))) {
            // 处理CORS错误
            throw new Error('跨域请求被阻止，请联系管理员');
          } else if (error.message && error.message.includes('Failed to fetch')) {
            // 处理fetch失败错误
            throw new Error('无法连接到服务器，请稍后再试');
          } else {
            // 记录详细错误信息到控制台
            console.error('[WWPay] 详细错误信息:', error);
            throw error;
          }
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`获取余额失败 (${response.status})`);
        }
        
        const data = await response.json();
        this.state.balance = data.balance;
        
        // 更新余额显示
        if (modalBalanceAmount) {
          modalBalanceAmount.textContent = data.balance.toFixed(2);
          modalBalanceAmount.style.color = ''; // 恢复默认颜色
        }
        
        // 更新余额支付方式提示和状态
        const balanceBtn = document.querySelector('.wwpay-method-btn[data-type="balance"]');
        if (balanceBtn) {
          const balanceHint = balanceBtn.querySelector('.wwpay-method-hint');
          
          if (data.balance >= this.state.selectedAmount) {
            // 余额充足
            balanceBtn.classList.remove('disabled');
            if (balanceHint) balanceHint.textContent = '可用余额支付';
            balanceBtn.style.display = 'flex';
          } else {
            // 余额不足
            balanceBtn.classList.add('disabled');
            if (balanceHint) balanceHint.textContent = '余额不足';
            
            // 如果余额不足，自动切换到支付宝支付
            if (this.state.selectedMethod === 'balance') {
              this.handlePaymentMethodSelect('alipay');
            }
          }
        }
        
        // 更新确认支付按钮状态
        this.updateConfirmButtonState();
        
        return data.balance;
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    } catch (error) {
      this.safeLogError('检查余额失败', error);
      
      // 获取更具体的错误信息
      let errorMessage = '未知错误';
      if (error.message) {
        if (error.message.includes('NetworkError')) {
          errorMessage = '网络连接错误';
        } else if (error.message.includes('超时')) {
          errorMessage = '请求超时';
        } else if (error.message.includes('断开')) {
          errorMessage = '网络已断开';
        } else if (error.message.includes('CORS') || error.message.includes('跨域')) {
          errorMessage = '跨域请求错误';
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = '请求失败';
        } else {
          errorMessage = error.message;
        }
      }
      
      // 记录详细错误信息到控制台
      console.error('[WWPay] 余额检查错误详情:', error);
      
      // 如果还有重试次数，则延迟后重试
      if (retryCount > 0) {
        this.log(`余额检查失败(${errorMessage})，${retryCount}次重试机会，3秒后重试...`);
        const modalBalanceAmount = document.getElementById('modalBalanceAmount');
        if (modalBalanceAmount) {
          modalBalanceAmount.innerHTML = `<i class="fas fa-sync-alt fa-spin" style="margin-right:4px;"></i>重试中(剩余${retryCount}次)...`;
          modalBalanceAmount.style.color = '#ffc107'; // 警告色
          // 添加完整错误信息的悬停提示
          modalBalanceAmount.title = `上次错误: ${errorMessage}`;
        }
        
        // 延迟后重试，进一步增加重试间隔时间
        setTimeout(() => {
          this.checkBalanceForPayment(retryCount - 1);
        }, 3000); // 增加到3秒，给网络更多恢复时间
        return 0;
      }
      
      // 重试次数用完，显示错误状态和具体错误信息
      const modalBalanceAmount = document.getElementById('modalBalanceAmount');
      if (modalBalanceAmount) {
        // 显示简短的错误信息，但保留更多信息
        modalBalanceAmount.textContent = errorMessage.length > 15 ? '加载失败' : errorMessage;
        modalBalanceAmount.style.color = '#dc3545';
        // 添加完整错误信息的悬停提示
        modalBalanceAmount.title = errorMessage;
        // 添加错误图标
        modalBalanceAmount.innerHTML = `<i class="fas fa-exclamation-circle" style="margin-right:4px;"></i>${modalBalanceAmount.textContent}`;
      }
      
      // 不要隐藏余额支付按钮，只是标记为禁用并显示错误状态
      const balanceBtn = document.querySelector('.wwpay-method-btn[data-type="balance"]');
      if (balanceBtn) {
        balanceBtn.classList.add('disabled');
        const balanceHint = balanceBtn.querySelector('.wwpay-method-hint');
        if (balanceHint) {
          // 显示简短的错误信息
          balanceHint.textContent = errorMessage.length > 15 ? '余额加载失败' : errorMessage;
          // 添加完整错误信息的悬停提示
          balanceHint.title = errorMessage;
          // 添加错误图标
          balanceHint.innerHTML = `<i class="fas fa-exclamation-triangle" style="margin-right:3px;"></i>${balanceHint.textContent}`;
        }
        // 确保按钮显示为禁用状态，而不是隐藏
        balanceBtn.style.opacity = '0.5';
        balanceBtn.style.cursor = 'not-allowed';
        balanceBtn.style.display = 'flex';
        // 添加错误边框
        balanceBtn.style.border = '1px solid #dc3545';
      }
      
      // 如果当前选择的是余额支付，自动切换到支付宝支付
      if (this.state.selectedMethod === 'balance') {
        this.handlePaymentMethodSelect('alipay');
      }
      
      return 0;
    }
  }
  
  async processBalancePayment() {
    // 创建一个可以取消的控制器
    const controller = new AbortController();
    // 设置超时定时器
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15秒超时
    
    try {
      // 验证网络连接
      if (!navigator.onLine) {
        throw new Error('网络连接已断开，请检查网络后重试');
      }
      
      this.showFullscreenLoading('正在处理余额支付...');
      this.state.processing = true;
      
      // 准备请求数据
      const requestData = {
        wishId: this.state.currentWishId,
        amount: this.state.selectedAmount,
        timestamp: Date.now() // 添加时间戳防止缓存
      };
      
      // 发送请求
      const response = await fetch(`${this.config.paymentGateway.apiBase}/api/payments/balance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Cache-Control': 'no-cache, no-store'
        },
        body: JSON.stringify(requestData),
        signal: controller.signal,
        // 添加重试和超时策略
        credentials: 'same-origin',
        mode: 'cors',
        redirect: 'follow'
      }).catch(error => {
        // 处理网络级别错误
        if (error.name === 'AbortError') {
          throw new Error('支付请求超时，请稍后重试');
        } else if (error.message.includes('NetworkError') || error.message.includes('network')) {
          throw new Error('网络连接失败，请检查网络后重试');
        } else {
          throw new Error(`支付请求失败: ${error.message}`);
        }
      });
      
      // 清除超时定时器
      clearTimeout(timeoutId);
      
      // 处理HTTP错误
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = '余额支付失败';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          // 如果解析JSON失败，使用HTTP状态码提示
          errorMessage = `余额支付失败 (${response.status})`;
        }
        throw new Error(errorMessage);
      }
      
      // 解析响应数据
      const result = await response.json().catch(error => {
        throw new Error('解析支付结果失败，请联系客服确认支付状态');
      });
      
      // 验证响应数据
      if (!result.success) {
        throw new Error(result.message || '支付处理失败');
      }
      
      // 更新内部状态的余额
      if (result.newBalance !== undefined) {
        this.state.balance = result.newBalance;
      }
      
      // 更新余额显示
      if (result.newBalance !== undefined) {
        // 更新模态框中的余额显示
        const modalBalanceAmount = document.getElementById('modalBalanceAmount');
        if (modalBalanceAmount) {
          modalBalanceAmount.textContent = result.newBalance.toFixed(2);
        }
        
        // 更新页面上的余额显示
        const balanceElement = document.getElementById('current-balance');
        if (balanceElement) {
          balanceElement.textContent = result.newBalance.toFixed(2);
        }
        
        // 更新用户界面上的余额显示
        const userBalanceElement = document.getElementById('user-balance');
        if (userBalanceElement) {
          userBalanceElement.textContent = result.newBalance.toFixed(2);
        }
        
        // 更新状态中的余额
        this.state.balance = result.newBalance;
      }
      
      return { success: true };
    } catch (error) {
      this.hideFullscreenLoading();
      // 处理网络错误
      if (error.name === 'AbortError') {
        throw new Error('支付请求超时，请稍后重试');
      } else if (error.message.includes('NetworkError') || error.message.includes('Network') || !navigator.onLine) {
        throw new Error('网络连接失败，请检查网络后重试');
      }
      throw error;
    }
  }
  
  /* ========== 核心支付方法 ========== */

  async processPayment() {
    try {
      // 验证支付状态
      if (!this.validatePaymentState()) {
        return;
      }

      // 检查网络连接
      if (!navigator.onLine) {
        this.showToast('网络连接已断开，请检查网络后重试', 'error');
        return;
      }

      // 更新处理状态
      this.state.processing = true;
      this.updateConfirmButtonState();
      
      // 记录本次支付信息
      this.state.lastPayment = {
        wishId: this.state.currentWishId,
        amount: this.state.selectedAmount,
        method: this.state.selectedMethod,
        timestamp: Date.now()
      };
      localStorage.setItem('last-payment', JSON.stringify(this.state.lastPayment));

      // 根据支付方式处理
      if (this.state.selectedMethod === 'balance') {
        // 余额支付 - 不需要在这里显示加载，processBalancePayment会处理
        try {
          const result = await this.processBalancePayment();
          if (result && result.success) {
            // 余额支付成功
            this.showGuaranteedToast('支付成功，正在处理...', 'success');
            await this.handlePaymentSuccess();
          }
        } catch (error) {
          // 余额支付错误处理
          this.state.processing = false;
          this.updateConfirmButtonState();
          this.handlePaymentError(error);
        } finally {
          this.hideFullscreenLoading();
        }
      } else {
        // 在线支付
        this.showFullscreenLoading('正在准备支付...');
        try {
          // 创建支付订单并跳转到支付网关
          const result = await this.createPaymentOrder();
          // 在线支付会跳转到支付网关，不需要在这里处理成功回调
          // 只有在创建订单失败时才会继续执行
          if (!result || !result.success) {
            throw new Error('创建支付订单失败');
          }
        } catch (error) {
          this.hideFullscreenLoading();
          this.state.processing = false;
          this.updateConfirmButtonState();
          this.handlePaymentError(error);
        }
      }
    } catch (error) {
      // 全局错误处理
      this.hideFullscreenLoading();
      this.state.processing = false;
      this.updateConfirmButtonState();
      
      // 区分不同类型的错误
      if (error.name === 'AbortError') {
        this.handlePaymentError(new Error('支付请求超时，请稍后重试'));
      } else if (error.message.includes('NetworkError') || error.message.includes('network') || !navigator.onLine) {
        this.handlePaymentError(new Error('网络连接失败，请检查网络后重试'));
      } else {
        this.handlePaymentError(error);
      }
    }
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
    try {
      // 验证金额
      if (!this.state.selectedAmount || isNaN(this.state.selectedAmount) || this.state.selectedAmount <= 0) {
        this.showToast('请选择有效的还愿金额', 'error');
        return false;
      }
      
      // 验证愿望ID
      if (!this.state.currentWishId) {
        this.showToast('无法识别当前愿望', 'error');
        return false;
      }
      
      // 验证支付方式
      if (!this.state.selectedMethod) {
        this.showToast('请选择支付方式', 'error');
        return false;
      }
      
      // 验证余额支付特殊情况
      if (this.state.selectedMethod === 'balance') {
        // 检查是否已登录
        if (!localStorage.getItem('token')) {
          this.showToast('请先登录后再使用余额支付', 'error');
          return false;
        }
        
        // 检查余额是否足够
        if (this.state.balance < this.state.selectedAmount) {
          this.showToast('余额不足，请选择其他支付方式或充值', 'error');
          return false;
        }
      }
      
      // 验证是否正在处理中
      if (this.state.processing) {
        this.showToast('支付正在处理中，请稍候', 'warning');
        return false;
      }
      
      return true;
    } catch (error) {
      this.safeLogError('验证支付状态失败', error);
      this.showToast('支付状态验证失败，请刷新页面重试', 'error');
      return false;
    }
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
      // 移除旧的支付方式区域
      const oldSection = document.getElementById('payment-methods-section');
      if (oldSection) oldSection.remove();
      
      // 创建新的支付界面 - 紧凑设计，添加滚动条
      const paymentSectionHtml = `
        <div class="payment-section" id="payment-methods-section" style="
          margin-top: 15px;
          padding: 0 12px 15px;
          background: #ffffff;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          max-height: 65vh;
          overflow-y: auto;
          overflow-x: hidden;
        ">
          <!-- 顶部标题栏 -->
          <div style="
            text-align: center;
            padding: 15px 0;
            border-bottom: 1px solid #f0f0f0;
            margin-bottom: 15px;
            position: sticky;
            top: 0;
            background: #ffffff;
            z-index: 10;
            border-radius: 16px 16px 0 0;
          ">
            <h4 style="
              font-size: 16px;
              color: #333;
              margin: 0;
              font-weight: 600;
            ">
              <i class="fas fa-credit-card" style="margin-right: 8px; color: #4a6cf7;"></i>
              支付详情
            </h4>
            <div style="
              font-size: 13px;
              color: #666;
              margin-top: 3px;
            ">
              还愿金额: <span style="font-weight: bold; color: #ff6b6b;">${this.state.selectedAmount}元</span>
            </div>
          </div>
          
          <!-- 余额信息卡片 - 更紧凑的设计 -->
          <div class="balance-card" style="
            background: linear-gradient(135deg, #4a6cf7, #2c3e8f);
            border-radius: 10px;
            padding: 12px;
            margin-bottom: 15px;
            box-shadow: 0 4px 15px rgba(74, 108, 247, 0.2);
            color: white;
            position: relative;
            overflow: hidden;
          ">
            <!-- 装饰元素 -->
            <div style="
              position: absolute;
              top: -15px;
              right: -15px;
              width: 80px;
              height: 80px;
              border-radius: 50%;
              background: rgba(255,255,255,0.1);
            "></div>
            <div style="
              position: absolute;
              bottom: -20px;
              left: -20px;
              width: 60px;
              height: 60px;
              border-radius: 50%;
              background: rgba(255,255,255,0.08);
            "></div>
            
            <div style="display: flex; align-items: center; justify-content: space-between; position: relative; z-index: 2;">
              <div style="display: flex; align-items: center;">
                <i class="fas fa-wallet" style="font-size: 18px; margin-right: 8px;"></i>
                <span style="font-size: 14px; font-weight: 500;">我的余额</span>
              </div>
              <div style="text-align: right;">
                <span id="modalBalanceAmount" style="font-weight: bold; font-size: 18px;">加载中...</span>
                <span style="margin-left: 3px; opacity: 0.9;">元</span>
                <button id="retryBalanceBtn" style="
                  margin-left: 8px;
                  background: rgba(255,255,255,0.3);
                  border: 1px solid rgba(255,255,255,0.4);
                  color: white;
                  cursor: pointer;
                  font-size: 14px;
                  padding: 3px 8px;
                  border-radius: 4px;
                  transition: all 0.2s ease;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                " title="点击重试获取余额">
                  <i class="fas fa-sync-alt"></i> 重试
                </button>
              </div>
            </div>
          </div>
          
          <!-- 支付方式标题 - 更紧凑的分隔 -->
          <div style="margin-bottom: 10px;">
            <h5 style="
              font-size: 14px;
              color: #333;
              margin: 0;
              padding-bottom: 8px;
              border-bottom: 1px dashed #eee;
              display: flex;
              align-items: center;
            ">
              <i class="fas fa-list-ul" style="margin-right: 6px; color: #4a6cf7;"></i>
              选择支付方式
            </h5>
          </div>
          
          <!-- 支付方式按钮组 - 并排一行布局 -->
          <div class="wwpay-methods-container" style="
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            gap: 8px;
            margin-bottom: 15px;
            flex-wrap: nowrap;
            overflow-x: auto;
            padding-bottom: 5px;
          ">
            ${this.config.paymentMethods.map(method => `
              <button class="wwpay-method-btn ${method.id === this.state.selectedMethod ? 'active' : ''}" 
                      data-type="${method.id}" 
                      style="
                        background: ${method.id === this.state.selectedMethod ? method.activeColor : method.color}; 
                        color: white;
                        border: none;
                        border-radius: 10px;
                        padding: 10px 5px;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        box-shadow: 0 4px 10px rgba(0,0,0,0.1);
                        flex: 1;
                        min-width: 0;
                        max-width: 33%;
                        word-break: break-word;
                        ${method.id === this.state.selectedMethod ? 'transform: translateY(-2px);' : ''}
                        ${method.id === 'balance' && (this.state.balance < this.state.selectedAmount || this.state.balance === undefined) ? 'opacity: 0.5; cursor: not-allowed; pointer-events: none;' : ''}
                      ">
                <i class="${method.icon}" style="font-size: 20px; margin-bottom: 6px;"></i>
                <span class="wwpay-method-name" style="font-weight: bold; margin-bottom: 2px; font-size: 13px;">${method.name}</span>
                <span class="wwpay-method-hint" style="font-size: 10px; opacity: 0.9; text-align: center;">${method.hint}</span>
              </button>
            `).join('')}
          </div>
          
          <!-- 确认支付按钮 - 更紧凑的设计 -->
          <div style="text-align: center; margin-top: 15px; position: sticky; bottom: 0; background: #ffffff; padding: 10px 0; border-top: 1px solid #f0f0f0; border-radius: 0 0 16px 16px;">
            <button id="confirm-payment-btn" style="
              background: linear-gradient(135deg, #28a745, #218838);
              color: white;
              border: none;
              border-radius: 8px;
              padding: 12px 20px;
              font-size: 15px;
              font-weight: bold;
              cursor: pointer;
              transition: all 0.3s ease;
              width: 100%;
              max-width: 280px;
              box-shadow: 0 4px 8px rgba(40, 167, 69, 0.25);
              position: relative;
              overflow: hidden;
            " disabled>
              <span style="position: relative; z-index: 2;">
                <i class="fas fa-check-circle" style="margin-right: 6px;"></i> 
                确认支付 ${this.state.selectedAmount}元
              </span>
              <span style="
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
                transform: translateX(-100%);
                animation: button-shine 3s infinite;
              "></span>
            </button>
            
            <!-- 安全提示 - 更紧凑的设计 -->
            <div style="
              text-align: center;
              margin-top: 8px;
              color: #666;
              font-size: 12px;
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <i class="fas fa-shield-alt" style="margin-right: 4px; color: #4a6cf7;"></i>
              <span>支付信息已加密，安全无忧</span>
            </div>
          </div>
        </div>
        
        <style>
          @keyframes button-shine {
            0% { transform: translateX(-100%); }
            20% { transform: translateX(100%); }
            100% { transform: translateX(100%); }
          }
          
          #confirm-payment-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 15px rgba(40, 167, 69, 0.3);
          }
          
          .wwpay-method-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 12px rgba(0,0,0,0.15);
          }
          
          .wwpay-method-btn.active {
            transform: translateY(-2px);
            box-shadow: 0 6px 12px rgba(0,0,0,0.15);
          }
          
          #retryBalanceBtn:hover {
            background: rgba(255,255,255,0.5) !important;
            transform: translateY(-1px);
            box-shadow: 0 3px 6px rgba(0,0,0,0.2) !important;
          }
        </style>
      `;
      
      // 添加到模态框
      const modalContent = document.querySelector('#fulfillModal .modal-content');
      if (modalContent) {
        // 添加支付界面
        modalContent.insertAdjacentHTML('beforeend', paymentSectionHtml);
        
        // 添加支付方式点击事件
        document.querySelectorAll('.wwpay-method-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            this.handlePaymentMethodSelect(btn.dataset.type);
          });
        });
        
        // 添加确认支付按钮点击事件
        const confirmBtn = document.getElementById('confirm-payment-btn');
        if (confirmBtn) {
          confirmBtn.addEventListener('click', () => {
            this.processPayment();
          });
        }
        
        // 添加余额重试按钮点击事件
        const retryBalanceBtn = document.getElementById('retryBalanceBtn');
        if (retryBalanceBtn) {
          retryBalanceBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // 阻止事件冒泡
            this.checkBalanceForPayment(3); // 重试3次
          });
        }
      }
      
      // 检查余额是否足够
      this.checkBalanceForPayment();
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
    
    // 根据错误类型提供更具体的反馈
    let errorMessage = error.message || '未知错误';
    let errorType = 'error';
    
    // 网络连接错误处理
    if (errorMessage.includes('网络连接') || errorMessage.includes('NetworkError') || !navigator.onLine) {
      errorMessage = '网络连接失败，请检查网络后重试';
      // 添加网络状态检测建议
      setTimeout(() => {
        if (!navigator.onLine) {
          this.showToast('请检查您的网络连接并重试', 'warning');
        }
      }, 3000);
    } 
    // 超时错误处理
    else if (errorMessage.includes('超时')) {
      errorMessage = '支付请求超时，服务器响应较慢，请稍后重试';
    }
    // 余额不足错误处理
    else if (errorMessage.includes('余额不足')) {
      errorMessage = '账户余额不足，请充值或选择其他支付方式';
      // 自动切换到支付宝支付
      setTimeout(() => {
        this.handlePaymentMethodSelect('alipay');
      }, 1500);
    }
    
    this.showGuaranteedToast(`支付失败: ${errorMessage}`, errorType);
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
