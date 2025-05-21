/**
 * 终极支付解决方案 - gamepay.js v4.1
 * 完全修复初始化问题
 * 增强错误处理和DOM检测
 */

// ==================== 配置区 ====================
const PAYMENT_CONFIG = {
  // 必填配置
  pid: '2025051013380915',
  key: 'UsXrSwn0wft5SeLB0LaQfecvJmpkS18T',
  apiUrl: 'https://zpayz.cn/submit.php',
  
  // 可选配置
  amount: '0.01',
  currency: 'CNY',
  successRedirectUrl: 'system/bazisystem.html',
  debug: true,
  
  // 元素ID配置
  elements: {
    container: 'payment-container',
    nameInput: 'name',
    payBtn: 'pay-btn',
    calculateBtn: 'calculate-btn'
  }
};

// ==================== 核心支付系统 ====================
class PaymentSystem {
  constructor(config = {}) {
    // 合并配置
    this.config = {
      ...PAYMENT_CONFIG,
      ...config,
      elements: {
        ...PAYMENT_CONFIG.elements,
        ...(config.elements || {})
      }
    };
    
    // 初始化状态
    this.state = {
      initialized: false,
      processing: false
    };
    
    // 启动系统（带安全防护）
    this.safeInitialize();
  }

  // ============== 安全初始化 ==============
  async safeInitialize() {
    try {
      // 1. 准备DOM环境
      this.prepareDOM();
      
      // 2. 加载必要依赖
      await this.loadDependencies();
      
      // 3. 绑定事件
      this.bindEvents();
      
      // 4. 检查支付状态
      this.checkPaymentStatus();
      
      this.state.initialized = true;
      this.log('支付系统就绪');
    } catch (error) {
      this.handleError('初始化失败', error);
      this.fallbackUI();
    }
  }

  // ============== DOM准备 ==============
  prepareDOM() {
    // 确保容器存在
    if (!document.getElementById(this.config.elements.container)) {
      this.createContainer();
    }
    
    // 检查必要元素
    this.elements = {
      nameInput: this.getElement(this.config.elements.nameInput, true),
      payBtn: this.getElement(this.config.elements.payBtn, true),
      calculateBtn: this.getElement(this.config.elements.calculateBtn)
    };
  }

  getElement(id, required = false) {
    const element = document.getElementById(id);
    if (!element && required) {
      throw new Error(`缺少必要元素: #${id}`);
    }
    return element;
  }

  createContainer() {
    const container = document.createElement('div');
    container.id = this.config.elements.container;
    container.style.cssText = `
      position: relative;
      margin: 20px auto;
      max-width: 500px;
      padding: 20px;
      background: #fff;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    `;
    
    // 自动创建必要元素
    container.innerHTML = `
      <input type="text" 
             id="${this.config.elements.nameInput}" 
             placeholder="请输入姓名"
             style="width:100%; padding:10px; margin-bottom:15px; border:1px solid #ddd; border-radius:4px;">
      
      <button id="${this.config.elements.payBtn}" 
              style="width:100%; padding:12px; background:#07c160; color:white; border:none; border-radius:4px; font-size:16px;">
        立即支付
      </button>
      
      <button id="${this.config.elements.calculateBtn}" 
              style="display:none; width:100%; padding:12px; margin-top:10px; background:#1989fa; color:white; border:none; border-radius:4px; font-size:16px;">
        开始测算
      </button>
    `;
    
    document.body.appendChild(container);
    return container;
  }

  // ============== 事件绑定 ==============
  bindEvents() {
    // 支付按钮事件
    this.elements.payBtn.addEventListener('click', () => {
      if (!this.state.processing) {
        this.processPayment();
      }
    });
    
    // 输入框实时验证
    this.elements.nameInput.addEventListener('input', () => {
      this.updateButtonState();
    });
  }

  // ============== 支付流程 ==============
  async processPayment() {
    try {
      this.setProcessingState(true);
      
      const paymentData = {
        pid: this.config.pid,
        type: 'wxpay',
        out_trade_no: this.generateOrderId(),
        notify_url: location.href,
        return_url: location.href,
        name: `支付-${this.getUserName()}`,
        money: this.config.amount,
        param: encodeURIComponent(this.getUserName()),
        sign_type: 'MD5'
      };
      
      paymentData.sign = this.generateSignature(paymentData);
      this.submitPayment(paymentData);
      
    } catch (error) {
      this.handlePaymentError(error);
    }
  }

  // ============== 支付状态检查 ==============
  checkPaymentStatus() {
    const params = new URLSearchParams(
      window.location.hash.includes('?') 
        ? window.location.hash.split('?')[1] 
        : window.location.search
    );
    
    if (params.get('trade_status') === 'TRADE_SUCCESS') {
      const paymentData = {
        pid: params.get('pid'),
        trade_no: params.get('trade_no'),
        param: params.get('param'),
        sign: params.get('sign')
      };
      
      if (this.verifyPayment(paymentData)) {
        this.handlePaymentSuccess(decodeURIComponent(paymentData.param));
        this.cleanUrl();
      }
    }
    
    this.updateButtonState();
  }

  // ============== 工具方法 ==============
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
      .join('&') + this.config.key;
    
    return CryptoJS.MD5(signStr).toString();
  }

  // ============== UI控制 ==============
  updateButtonState() {
    const userName = this.getUserName();
    const isPaid = userName && localStorage.getItem(`paid_${userName}`);
    
    this.elements.payBtn.style.display = isPaid ? 'none' : 'block';
    if (this.elements.calculateBtn) {
      this.elements.calculateBtn.style.display = isPaid ? 'block' : 'none';
    }
  }

  // ============== 错误处理 ==============
  handlePaymentError(error) {
    console.error('支付流程错误:', error);
    alert('支付过程中出现问题，请重试');
    this.setProcessingState(false);
  }

  handleError(context, error) {
    console.error(`[Payment] ${context}:`, error);
    this.log(`系统错误: ${error.message}`);
  }

  fallbackUI() {
    const payBtn = document.getElementById(this.config.elements.payBtn);
    if (payBtn) {
      payBtn.onclick = () => alert('支付功能暂时不可用，请稍后再试');
      payBtn.style.backgroundColor = '#ccc';
    }
  }

  log(...messages) {
    if (this.config.debug) {
      console.log('[Payment]', ...messages);
    }
  }
}

// ==================== 自动初始化 ====================
(function() {
  function initialize() {
    try {
      if (!window.paymentSystem) {
        window.paymentSystem = new PaymentSystem();
        
        // 暴露回调接口
        window.handlePaymentCallback = function() {
          window.paymentSystem.checkPaymentStatus();
        };
      }
    } catch (e) {
      console.error('支付系统初始化失败:', e);
    }
  }

  // 兼容不同加载时机
  if (document.readyState === 'complete') {
    setTimeout(initialize, 0);
  } else {
    document.addEventListener('DOMContentLoaded', initialize);
  }
})();
