/**
 * 终极支付解决方案 - gamepay.js v4.35
 * 修复初始化问题和依赖加载
 * 增强支付流程和页面跳转
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

  // ============== 加载依赖 ==============
  async loadDependencies() {
    // 确保CryptoJS已加载
    if (typeof CryptoJS === 'undefined') {
      await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js');
    }
    
    // 其他必要依赖检查
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
    // 获取按钮时直接排除标记为 payjs 的按钮
    this.elements = {
        nameInput: this.getElement(this.config.elements.nameInput, true),
        payBtn: (() => {
            const btn = document.getElementById(this.config.elements.payBtn);
            return btn && !btn.hasAttribute('data-payment-handler') ? btn : null;
        })(),
        calculateBtn: this.getElement(this.config.elements.calculateBtn)
    };

    // 如果 payBtn 被排除，后续代码不会处理它
    if (!this.elements.payBtn) {
        console.log('[GamePay] 跳过已标记的支付按钮');
        return;
    }
}
 createContainer() {
  // 判断当前是否是 bazisystem.html 页面
  const isBaziSystemPage = window.location.pathname.includes('bazisystem.html');
  
  // 如果在第二个页面，直接返回不创建元素
  if (isBaziSystemPage) {
    return null; 
  }

  // 第一个页面：创建支付表单但默认隐藏
  const container = document.createElement('div');
  container.id = this.config.elements.container;
  container.style.display = 'none'; // 默认隐藏
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
        return_url: this.config.successRedirectUrl, // 使用配置的跳转URL
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
        const userName = decodeURIComponent(paymentData.param);
        this.handlePaymentSuccess(userName);
        this.cleanUrl();
        
        // 存储支付状态
        localStorage.setItem(`paid_${userName}`, 'true');
        
        // 显示"开始测算"按钮
        this.showCalculateButton(userName);
      }
    }
    
    this.updateButtonState();
  }

  // ============== 显示"开始测算"按钮 ==============
  showCalculateButton(userName) {
    if (this.elements.calculateBtn) {
      this.elements.calculateBtn.style.display = 'block';
      this.elements.payBtn.style.display = 'none';
      
      // 设置点击事件
      this.elements.calculateBtn.onclick = () => {
        // 这里可以添加跳转或执行测算的逻辑
        window.location.href = this.config.successRedirectUrl;
      };
    }
  }

  // ============== 验证支付 ==============
  verifyPayment(paymentData) {
    const { pid, trade_no, param, sign } = paymentData;
    const localSign = CryptoJS.MD5(`pid=${pid}&trade_no=${trade_no}&param=${param}${this.config.key}`).toString();
    return sign === localSign;
  }

  // ============== 支付成功处理 ==============
  handlePaymentSuccess(userName) {
    this.log(`支付成功: ${userName}`);
    this.hideLoading();
    
    // 显示成功提示
    this.showSuccessAlert();
    
    // 更新UI状态
    this.updateButtonState();
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

  // ============== 显示成功提示 ==============
  showSuccessAlert() {
    const alertDiv = document.getElementById('payment-success-alert') || this.createSuccessAlert();
    alertDiv.style.display = 'block';
  }

  createSuccessAlert() {
    const alertDiv = document.createElement('div');
    alertDiv.id = 'payment-success-alert';
    alertDiv.style.cssText = `
      display: none;
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%,-50%);
      background: white;
      padding: 20px;
      border-radius: 5px;
      z-index: 10000;
      box-shadow: 0 0 10px rgba(0,0,0,0.3);
      text-align: center;
    `;
    
    alertDiv.innerHTML = `
      <p style="margin-bottom:15px; font-size:18px;">支付已成功，请输入出生信息开始测算！</p>
      <button style="padding:5px 15px; background:#2196F3; color:white; border:none; border-radius:3px; cursor:pointer;">
        确定
      </button>
    `;
    
    alertDiv.querySelector('button').onclick = () => {
      alertDiv.style.display = 'none';
    };
    
    document.body.appendChild(alertDiv);
    return alertDiv;
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

  cleanUrl() {
    if (window.history.replaceState) {
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
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

// 暴露支付启动函数
window.startPayment = function(userName) {
  if (window.paymentSystem) {
    const nameInput = document.getElementById(window.paymentSystem.config.elements.nameInput);
    if (nameInput) {
      nameInput.value = userName;
      window.paymentSystem.processPayment();
    } else {
      alert('无法找到姓名输入框');
    }
  } else {
    alert('支付系统未初始化，请刷新页面重试');
  }
};
