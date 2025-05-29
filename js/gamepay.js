/**
 * 终极支付解决方案 - gamepay.js v4.8
 * 支持支付宝(alipay)和微信支付(wxpay)
 * 优化支付方式选择界面
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
  successRedirectUrl: 'https://mybazi.net/system/bazisystem.html',
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
    
    // 当前选择的支付方式
    this.selectedPaymentType = null;
    
    // 启动系统
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
      
      this.state.initialized = true;
      this.log('支付系统就绪');
    } catch (error) {
      this.handleError('初始化失败', error);
      this.fallbackUI();
    }
  }

  // ============== 加载依赖 ==============
  async loadDependencies() {
    // 确保CryptoJS已加载
    if (typeof CryptoJS === 'undefined') {
      await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js');
    }
    
    return Promise.resolve();
  }

  // ============== 动态加载脚本 ==============
  loadScript(url) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  // ============== DOM准备 ==============
  prepareDOM() {
    // 检查是否已有HTML支付表单
    const existingPaymentForm = document.getElementById('nameInputModal');
    
    if (existingPaymentForm) {
      // 使用HTML表单的元素
      this.elements = {
        nameInput: document.getElementById('userName'),
        payOptions: document.querySelectorAll('.payment-option')
      };
    } else {
      // 否则创建默认支付表单
      if (!document.getElementById(this.config.elements.container)) {
        this.createContainer();
      }
      
      this.elements = {
        nameInput: this.getElement(this.config.elements.nameInput, true),
        payOptions: document.querySelectorAll('.payment-option')
      };
    }

    // 如果仍然找不到输入框，尝试手动绑定
    if (!this.elements.nameInput || !this.elements.payOptions) {
      console.warn('无法自动检测支付表单，尝试手动绑定...');
      this.elements.nameInput = document.getElementById('userName');
      this.elements.payOptions = document.querySelectorAll('.payment-option');
    }

    // 如果还是找不到，报错
    if (!this.elements.nameInput || !this.elements.payOptions) {
      throw new Error('无法找到支付表单的输入框或支付选项！');
    }
  }

  createContainer() {
    const container = document.createElement('div');
    container.id = this.config.elements.container;
    container.style.display = 'none';
    container.innerHTML = `
      <input type="text" 
             id="${this.config.elements.nameInput}" 
             placeholder="请输入姓名"
             style="width:100%; padding:10px; margin-bottom:15px; border:1px solid #ddd; border-radius:4px;">
      
      <div class="payment-options" style="margin: 20px 0;">
        <div class="payment-option" data-type="alipay" style="margin-bottom: 15px;">
          <button class="payment-btn" style="background: #009fe8; color: white; width: 100%; padding: 12px; border: none; border-radius: 4px; cursor: pointer;">
            <img src="https://zpayz.cn/static/img/alipay.png" alt="支付宝" style="height: 24px; vertical-align: middle; margin-right: 10px;">
            支付宝支付（全球）
          </button>
        </div>
        <div class="payment-option" data-type="wxpay">
          <button class="payment-btn" style="background: #07c160; color: white; width: 100%; padding: 12px; border: none; border-radius: 4px; cursor: pointer;">
            <img src="https://zpayz.cn/static/img/wxpay.png" alt="微信支付" style="height: 24px; vertical-align: middle; margin-right: 10px;">
            微信支付（国内）
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(container);
    return container;
  }

  getElement(id, required = false) {
    const element = document.getElementById(id);
    if (!element && required) {
      throw new Error(`缺少必要元素: #${id}`);
    }
    return element;
  }

  // ============== 事件绑定 ==============
  bindEvents() {
    // 绑定支付选项点击事件
    if (this.elements.payOptions && this.elements.payOptions.length > 0) {
      this.elements.payOptions.forEach(option => {
        option.addEventListener('click', (e) => {
          // 防止事件冒泡
          if (e.target.closest('.payment-option')) {
            this.selectedPaymentType = option.getAttribute('data-type');
            this.processPayment();
          }
        });
      });
    }
  }

  // ============== 支付流程 ==============
  async processPayment() {
    try {
      const userName = this.getUserName();
      if (!userName) {
        alert('请输入您的姓名');
        this.elements.nameInput.focus();
        return;
      }

      if (!this.selectedPaymentType) {
        alert('请选择支付方式');
        return;
      }

      this.setProcessingState(true);
      
      const paymentData = {
        pid: this.config.pid,
        type: this.selectedPaymentType,
        out_trade_no: this.generateOrderId(),
        notify_url: location.href,
        return_url: this.config.successRedirectUrl,
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

  // ============== 提交支付 ==============
  submitPayment(paymentData) {
    // 显示全屏loading
    this.showLoading();
    
    // 创建支付表单
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = this.config.apiUrl;
    form.style.display = 'none';
    
    // 添加支付参数
    Object.entries(paymentData).forEach(([key, value]) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = value;
      form.appendChild(input);
    });
    
    document.body.appendChild(form);
    form.submit();
  }

  // ============== UI控制 ==============
  updateButtonState() {
    // 总是显示支付按钮
    if (this.elements.payBtn) {
      this.elements.payBtn.style.display = 'block';
    }
  }

  // ============== 显示/隐藏Loading ==============
  showLoading() {
    const loadingDiv = document.getElementById('fullscreen-loading') || this.createLoadingElement();
    loadingDiv.style.display = 'flex';
  }

  hideLoading() {
    const loadingDiv = document.getElementById('fullscreen-loading');
    if (loadingDiv) loadingDiv.style.display = 'none';
  }

  createLoadingElement() {
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'fullscreen-loading';
    loadingDiv.style.cssText = `
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      z-index: 9999;
      justify-content: center;
      align-items: center;
    `;
    
    loadingDiv.innerHTML = `
      <div style="color:white; font-size:24px; text-align:center;">
        <div class="loading" style="margin:0 auto 20px;"></div>
        <div>支付处理中，请稍候...</div>
      </div>
    `;
    
    document.body.appendChild(loadingDiv);
    return loadingDiv;
  }

  // ============== 工具方法 ==============
  getUserName() {
    return this.elements.nameInput ? this.elements.nameInput.value.trim() : '';
  }

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

  // ============== 错误处理 ==============
  handlePaymentError(error) {
    console.error('支付流程错误:', error);
    this.hideLoading();
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

  setProcessingState(processing) {
    this.state.processing = processing;
    if (this.elements.payBtn) {
      this.elements.payBtn.disabled = processing;
      this.elements.payBtn.innerHTML = processing 
        ? '<i class="fas fa-spinner fa-spin"></i> 处理中...' 
        : '<i class="fas fa-credit-card"></i> 立即支付';
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

// ==================== 支付工具函数 ====================
function generateOrderId() {
  const now = new Date();
  return `${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}${now.getHours().toString().padStart(2,'0')}${now.getMinutes().toString().padStart(2,'0')}${now.getSeconds().toString().padStart(2,'0')}${Math.floor(Math.random()*9000)+1000}`;
}

function generateSignature(params) {
  const filtered = {};
  Object.keys(params)
    .filter(k => params[k] !== '' && !['sign', 'sign_type'].includes(k))
    .sort()
    .forEach(k => filtered[k] = params[k]);
  
  const signStr = Object.entries(filtered)
    .map(([k, v]) => `${k}=${v}`)
    .join('&') + PAYMENT_CONFIG.key;
  
  return CryptoJS.MD5(signStr).toString();
}

function submitPaymentForm(paymentData) {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = PAYMENT_CONFIG.apiUrl;
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
}

// ==================== 暴露支付启动函数 ====================
window.startPayment = function(userName, paymentType = 'alipay') {
  if (!userName || userName.trim() === '') {
    alert('请输入有效的姓名');
    return;
  }

  if (!['alipay', 'wxpay'].includes(paymentType)) {
    alert('请选择有效的支付方式');
    return;
  }

  const paymentData = {
    pid: PAYMENT_CONFIG.pid,
    type: paymentType,
    out_trade_no: generateOrderId(),
    notify_url: location.href,
    return_url: PAYMENT_CONFIG.successRedirectUrl,
    name: `支付-${userName}`,
    money: PAYMENT_CONFIG.amount,
    param: encodeURIComponent(userName),
    sign_type: 'MD5'
  };
  
  paymentData.sign = generateSignature(paymentData);
  submitPaymentForm(paymentData);
};
