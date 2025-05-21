/**
 * 完整支付解决方案 - gamepay.js v2.2
 * 功能：
 * 1. 集中管理zpay平台支付流程
 * 2. 自动处理支付状态同步
 * 3. 动态UI生成与错误隔离
 */

class PaymentManager {
  constructor() {
    // 支付配置（需根据实际修改）
    this.config = {
      pid: '2025051013380915',
      key: 'UsXrSwn0wft5SeLB0LaQfecvJmpkS18T',
      apiUrl: 'https://zpayz.cn/submit.php',
      amount: '0.01',
      currency: 'CNY',
      successRedirectUrl: 'system/bazisystem.html'
    };

    // 元素引用缓存
    this.elements = {
      payBtn: null,
      calculateBtn: null,
      nameInput: null,
      loadingEl: null,
      successAlertEl: null
    };

    // 初始化支付系统（安全模式）
    this.initialize();
  }

  /* ==================== 初始化方法 ==================== */
  async initialize() {
    try {
      await this.waitForDOMReady();
      this.injectDependencies();
      this.createPaymentUI();
      this.cacheDOMElements();
      this.bindEventListeners();
      this.syncPaymentState();
      
      console.log('[Payment] 系统初始化完成');
    } catch (error) {
      console.error('[Payment] 初始化失败:', error);
      this.fallbackUI();
    }
  }

  waitForDOMReady() {
    return new Promise((resolve) => {
      if (document.readyState === 'complete') {
        resolve();
      } else {
        document.addEventListener('DOMContentLoaded', resolve);
        window.addEventListener('load', resolve);
      }
    });
  }

  injectDependencies() {
    // 确保CryptoJS可用（MD5签名依赖）
    if (typeof CryptoJS === 'undefined') {
      console.warn('[Payment] 正在动态加载CryptoJS');
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js';
      script.onload = () => console.log('[Payment] CryptoJS加载完成');
      script.onerror = () => console.error('[Payment] CryptoJS加载失败');
      document.head.appendChild(script);
    }
  }

  /* ==================== UI管理 ==================== */
  createPaymentUI() {
    // 创建加载动画容器
    if (!document.getElementById('payment-loading')) {
      const loadingDiv = document.createElement('div');
      loadingDiv.id = 'payment-loading';
      loadingDiv.className = 'payment-overlay';
      loadingDiv.innerHTML = `
        <div class="payment-spinner">
          <i class="fas fa-spinner fa-spin"></i>
          <p>支付处理中...</p>
        </div>
      `;
      document.body.appendChild(loadingDiv);
    }

    // 创建支付成功提示
    if (!document.getElementById('payment-alert')) {
      const alertDiv = document.createElement('div');
      alertDiv.id = 'payment-alert';
      alertDiv.className = 'payment-alert';
      alertDiv.innerHTML = `
        <div class="alert-content">
          <i class="fas fa-check-circle"></i>
          <span>支付成功！正在跳转...</span>
        </div>
      `;
      document.body.appendChild(alertDiv);
    }
  }

  cacheDOMElements() {
    this.elements = {
      payBtn: document.getElementById('pay-btn'),
      calculateBtn: document.getElementById('calculate-btn'),
      nameInput: document.getElementById('name'),
      loadingEl: document.getElementById('payment-loading'),
      successAlertEl: document.getElementById('payment-alert')
    };

    // 关键元素检查
    if (!this.elements.nameInput) {
      throw new Error('缺少姓名输入框');
    }
  }

  /* ==================== 支付核心逻辑 ==================== */
  async startPayment() {
    try {
      const userName = this.elements.nameInput.value.trim();
      if (!this.validateName(userName)) return;

      this.showLoading(true);

      const paymentData = {
        pid: this.config.pid,
        type: 'wxpay',
        out_trade_no: this.generateOrderNo(),
        notify_url: location.href,
        return_url: location.href,
        name: `八字测算-${userName.substring(0, 20)}`,
        money: this.config.amount,
        currency: this.config.currency,
        param: encodeURIComponent(userName),
        sign_type: 'MD5'
      };

      paymentData.sign = this.generateSignature(paymentData);
      this.submitPaymentForm(paymentData);

    } catch (error) {
      console.error('[Payment] 支付启动失败:', error);
      this.showLoading(false);
      alert('支付发起失败，请重试');
    }
  }

  handlePaymentSuccess(userName) {
    // 状态存储
    localStorage.setItem(`paid_${userName}`, 'true');
    localStorage.removeItem(`used_${userName}`);

    // UI更新
    this.updateButtonState();
    this.showSuccessAlert();

    // 页面跳转（仅在第一个页面需要）
    if (this.config.successRedirectUrl && !location.pathname.includes('bazisystem')) {
      setTimeout(() => {
        location.href = `${this.config.successRedirectUrl}?name=${encodeURIComponent(userName)}`;
      }, 1500);
    }
  }

  /* ==================== 工具方法 ==================== */
  generateSignature(params) {
    const filtered = {};
    Object.keys(params).forEach(k => {
      if (params[k] !== '' && k !== 'sign' && k !== 'sign_type') {
        filtered[k] = params[k];
      }
    });

    const signStr = Object.keys(filtered).sort()
      .map(k => `${k}=${filtered[k]}`)
      .join('&') + this.config.key;

    return CryptoJS.MD5(signStr).toString();
  }

  verifyPayment(paymentData) {
    try {
      const sign = paymentData.sign;
      const calculatedSign = this.generateSignature(paymentData);
      return sign === calculatedSign;
    } catch (error) {
      console.error('[Payment] 签名验证失败:', error);
      return false;
    }
  }

  generateOrderNo() {
    const now = new Date();
    return `${now.getFullYear()}${this.pad(now.getMonth()+1)}${this.pad(now.getDate())}` +
           `${this.pad(now.getHours())}${this.pad(now.getMinutes())}${this.pad(now.getSeconds())}` +
           `${Math.floor(Math.random()*9000)+1000}`;
  }

  /* ==================== 状态管理 ==================== */
  syncPaymentState() {
    // 1. 检查URL回调
    const urlParams = new URLSearchParams(location.search);
    if (urlParams.get('trade_status') === 'TRADE_SUCCESS') {
      const paymentData = {
        pid: urlParams.get('pid'),
        trade_no: urlParams.get('trade_no'),
        out_trade_no: urlParams.get('out_trade_no'),
        type: urlParams.get('type'),
        name: urlParams.get('name'),
        money: urlParams.get('money'),
        trade_status: urlParams.get('trade_status'),
        param: urlParams.get('param'),
        sign: urlParams.get('sign'),
        sign_type: urlParams.get('sign_type')
      };

      if (this.verifyPayment(paymentData)) {
        const userName = decodeURIComponent(paymentData.param || '');
        this.handlePaymentSuccess(userName);
        this.cleanURLParams();
      }
    }

    // 2. 检查本地状态
    this.updateButtonState();
  }

  updateButtonState() {
    const userName = this.elements.nameInput?.value.trim();
    if (!userName) {
      this.resetToPayState();
      return;
    }

    if (this.isPaidAndUnused(userName)) {
      this.showCalculateState();
    } else {
      this.resetToPayState();
    }
  }

  /* ==================== UI控制 ==================== */
  showLoading(show) {
    if (this.elements.loadingEl) {
      this.elements.loadingEl.style.display = show ? 'flex' : 'none';
    }
  }

  showSuccessAlert() {
    if (this.elements.successAlertEl) {
      this.elements.successAlertEl.style.display = 'block';
      setTimeout(() => {
        this.elements.successAlertEl.style.display = 'none';
      }, 3000);
    }
  }

  resetToPayState() {
    if (this.elements.payBtn) this.elements.payBtn.style.display = 'block';
    if (this.elements.calculateBtn) this.elements.calculateBtn.style.display = 'none';
  }

  showCalculateState() {
    if (this.elements.payBtn) this.elements.payBtn.style.display = 'none';
    if (this.elements.calculateBtn) this.elements.calculateBtn.style.display = 'block';
  }

  /* ==================== 辅助方法 ==================== */
  validateName(name) {
    if (!name || name.length < 2) {
      alert('请输入有效姓名（至少2个字符）');
      return false;
    }
    return true;
  }

  isPaidAndUnused(userName) {
    return localStorage.getItem(`paid_${userName}`) && 
          !localStorage.getItem(`used_${userName}`);
  }

  cleanURLParams() {
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  pad(num) {
    return num < 10 ? `0${num}` : num;
  }

  submitPaymentForm(data) {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = this.config.apiUrl;
    form.style.display = 'none';

    Object.entries(data).forEach(([key, value]) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = value;
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
  }

  fallbackUI() {
    console.warn('[Payment] 启用降级UI');
    if (this.elements.payBtn) {
      this.elements.payBtn.onclick = () => {
        alert('支付系统初始化失败，请刷新页面重试');
      };
    }
  }
}

// 自动初始化（兼容新旧浏览器）
if (document.readyState === 'complete') {
  new PaymentManager();
} else {
  document.addEventListener('DOMContentLoaded', () => new PaymentManager());
}
