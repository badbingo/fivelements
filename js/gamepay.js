/**
 * 终极支付解决方案 - gamepay.js v4.0
 * 功能特性：
 * 1. 完整的支付流程管理（从发起支付到状态验证）
 * 2. 自动处理哈希路由和URL参数
 * 3. 多层错误防御和自动恢复机制
 * 4. 智能DOM元素检测与自动修复
 * 5. 详细的调试日志系统
 */

// ==================== 全局配置 ====================
const PAYMENT_DEFAULTS = {
  // 必填商户配置
  pid: '2025051013380915',
  key: 'UsXrSwn0wft5SeLB0LaQfecvJmpkS18T',
  
  // 支付接口配置
  apiUrl: 'https://zpayz.cn/submit.php',
  paymentTypes: ['wxpay', 'alipay'],
  
  // 页面行为配置
  amount: '0.01',
  currency: 'CNY',
  successRedirectUrl: 'system/bazisystem.html',
  
  // 元素ID配置（可覆盖）
  elementIds: {
    container: 'payment-container',  // 支付容器
    nameInput: 'name',              // 姓名输入
    payBtn: 'pay-btn',              // 支付按钮
    calculateBtn: 'calculate-btn',  // 测算按钮
    loadingIndicator: 'payment-loader', // 加载动画
    noticePanel: 'payment-notice'   // 通知面板
  },
  
  // 系统配置
  debug: true,
  maxRetryCount: 3,
  autoCreateElements: true
};

// ==================== 核心支付类 ====================
class PaymentSystem {
  constructor(userConfig = {}) {
    // 深度合并配置
    this.config = this.deepMerge(PAYMENT_DEFAULTS, userConfig);
    
    // 初始化状态
    this.state = {
      initialized: false,
      processing: false,
      paymentCompleted: false,
      retryCount: 0
    };
    
    // DOM元素引用
    this.elements = {};
    
    // 启动系统（带重试机制）
    this.initializeWithRetry();
  }

  // ============== 初始化流程 ==============
  async initializeWithRetry(retryCount = 3, delay = 300) {
    try {
      await this.initialize();
      this.log('系统初始化成功');
    } catch (error) {
      if (retryCount > 0) {
        this.log(`初始化失败，${delay}ms后重试... (剩余 ${retryCount}次)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.initializeWithRetry(retryCount - 1, delay * 2);
      }
      this.handleFatalError(error);
    }
  }

  async initialize() {
    // 1. 准备DOM环境
    this.prepareDOM();
    
    // 2. 加载必要依赖
    await this.loadDependencies();
    
    // 3. 设置事件监听
    this.setupEventListeners();
    
    // 4. 检查支付状态
    this.checkInitialPaymentStatus();
    
    // 标记初始化完成
    this.state.initialized = true;
  }

  // ============== DOM准备 ==============
  prepareDOM() {
    // 确保容器存在
    const container = document.getElementById(this.config.elementIds.container) || 
      this.createPaymentContainer();
    
    // 检测/创建必要元素
    this.elements = {
      nameInput: this.getElement('nameInput', () => this.createNameInput()),
      payBtn: this.getElement('payBtn', null, true), // 必须存在
      calculateBtn: this.getElement('calculateBtn'),
      loader: this.getElement('loadingIndicator', () => this.createLoader()),
      notice: this.getElement('noticePanel', () => this.createNoticePanel())
    };
    
    // 初始化UI状态
    this.updateUIState();
  }

  getElement(idKey, createFn, required = false) {
    const id = this.config.elementIds[idKey];
    let element = document.getElementById(id);
    
    if (!element && this.config.autoCreateElements && createFn) {
      element = createFn();
      this.log(`已自动创建元素: #${id}`);
    }
    
    if (!element && required) {
      throw new Error(`缺少必要元素: #${id}`);
    }
    
    return element;
  }

  createPaymentContainer() {
    const container = document.createElement('div');
    container.id = this.config.elementIds.container;
    container.style.cssText = `
      position: relative;
      margin: 20px 0;
      padding: 15px;
      border: 1px solid #eee;
      border-radius: 5px;
    `;
    document.body.appendChild(container);
    return container;
  }

  // ============== 支付流程控制 ==============
  async processPayment(paymentType = 'wxpay') {
    if (this.state.processing) {
      this.showNotice('已有支付正在进行');
      return;
    }
    
    try {
      // 1. 验证输入
      const userName = this.getUserName();
      if (!this.validateUserName(userName)) return;
      
      // 2. 准备支付数据
      const paymentData = this.preparePaymentData(userName, paymentType);
      
      // 3. 显示加载状态
      this.setProcessingState(true);
      
      // 4. 提交支付
      this.submitPaymentForm(paymentData);
      
    } catch (error) {
      this.handlePaymentError(error);
    }
  }

  preparePaymentData(userName, paymentType) {
    const data = {
      pid: this.config.pid,
      type: paymentType,
      out_trade_no: this.generateOrderId(),
      notify_url: this.getCallbackUrl(),
      return_url: this.getCallbackUrl(),
      name: `服务支付-${userName.substring(0, 20)}`,
      money: this.config.amount,
      currency: this.config.currency,
      param: encodeURIComponent(userName),
      sign_type: 'MD5'
    };
    
    data.sign = this.generateSignature(data);
    return data;
  }

  // ============== 支付状态管理 ==============
  checkInitialPaymentStatus() {
    const params = this.getUrlParams();
    
    if (params.trade_status === 'TRADE_SUCCESS') {
      try {
        if (this.verifyPayment(params)) {
          this.handlePaymentSuccess(params);
          this.cleanUrlParams();
        }
      } catch (error) {
        this.log('支付状态验证失败:', error);
      }
    }
    
    this.updateUIState();
  }

  handlePaymentSuccess(params) {
    const userName = decodeURIComponent(params.param || '');
    
    // 1. 保存支付状态
    localStorage.setItem(`paid_${userName}`, 'true');
    localStorage.removeItem(`used_${userName}`);
    
    // 2. 更新UI
    this.state.paymentCompleted = true;
    this.updateUIState();
    
    // 3. 显示成功通知
    this.showNotice('支付成功！正在跳转...');
    
    // 4. 跳转处理
    if (this.config.successRedirectUrl) {
      setTimeout(() => {
        location.href = `${this.config.successRedirectUrl}?name=${encodeURIComponent(userName)}`;
      }, 1500);
    }
  }

  // ============== 工具方法 ==============
  generateOrderId() {
    const now = new Date();
    return `${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}${now.getHours().toString().padStart(2,'0')}${now.getMinutes().toString().padStart(2,'0')}${now.getSeconds().toString().padStart(2,'0')}${Math.floor(Math.random()*9000)+1000}`;
  }

  generateSignature(params) {
    // 过滤空值和签名字段
    const filtered = {};
    Object.keys(params)
      .filter(k => params[k] !== '' && !['sign', 'sign_type'].includes(k))
      .sort()
      .forEach(k => filtered[k] = params[k]);
    
    // 生成签名字符串
    const signStr = Object.entries(filtered)
      .map(([k, v]) => `${k}=${v}`)
      .join('&') + this.config.key;
    
    // 计算MD5签名
    return CryptoJS.MD5(signStr).toString();
  }

  // ============== UI控制 ==============
  updateUIState() {
    if (!this.elements.payBtn || !this.elements.calculateBtn) return;
    
    const userName = this.getUserName();
    const isPaid = userName && localStorage.getItem(`paid_${userName}`);
    
    // 支付按钮状态
    this.elements.payBtn.style.display = (isPaid || !userName) ? 'none' : 'block';
    
    // 测算按钮状态
    if (this.elements.calculateBtn) {
      this.elements.calculateBtn.style.display = isPaid ? 'block' : 'none';
    }
  }

  setProcessingState(processing) {
    this.state.processing = processing;
    if (this.elements.loader) {
      this.elements.loader.style.display = processing ? 'flex' : 'none';
    }
    if (this.elements.payBtn) {
      this.elements.payBtn.disabled = processing;
    }
  }

  // ============== 错误处理 ==============
  handlePaymentError(error) {
    this.state.retryCount++;
    
    if (this.state.retryCount <= this.config.maxRetryCount) {
      this.log(`支付失败，正在重试 (${this.state.retryCount}/${this.config.maxRetryCount})`);
      setTimeout(() => this.processPayment(), 1000 * this.state.retryCount);
    } else {
      this.showNotice('支付失败，请联系客服', false);
      this.setProcessingState(false);
    }
  }

  handleFatalError(error) {
    console.error('!!! 支付系统崩溃 !!!', error);
    
    // 降级方案
    if (this.elements.payBtn) {
      this.elements.payBtn.onclick = () => {
        alert('支付系统暂时不可用，请稍后再试');
      };
      this.elements.payBtn.style.backgroundColor = '#f5f5f5';
      this.elements.payBtn.style.color = '#999';
    }
    
    // 显示错误标记
    const errorMark = document.createElement('div');
    errorMark.textContent = '支付系统异常';
    errorMark.style.cssText = `
      color: #f44336;
      font-size: 12px;
      margin-top: 5px;
    `;
    this.elements.payBtn.parentNode.appendChild(errorMark);
  }

  // ============== 辅助方法 ==============
  log(...messages) {
    if (this.config.debug) {
      console.log('[PaymentSystem]', ...messages);
    }
  }
}

// ==================== 自动初始化 ====================
(function() {
  // 确保只初始化一次
  if (window.__paymentSystemInitialized) return;
  window.__paymentSystemInitialized = true;
  
  // 兼容不同加载时机
  const init = () => {
    try {
      window.paymentSystem = new PaymentSystem();
      
      // 暴露全局回调方法
      window.handlePaymentCallback = () => {
        window.paymentSystem.checkInitialPaymentStatus();
      };
    } catch (e) {
      console.error('支付系统初始化失败:', e);
    }
  };
  
  if (document.readyState === 'complete') {
    setTimeout(init, 0);
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }
})();
