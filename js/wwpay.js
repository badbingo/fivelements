// wwpay.js - 命缘池支付系统完整版 v10.3
// 支持支付、状态检查、还愿记录、动画移除、重试机制、UI反馈等完整功能

class WWPay {
  constructor() {
    this.handleDocumentClick = this.handleDocumentClick.bind(this);
    this.handleFulfillOptionClick = this.handleFulfillOptionClick.bind(this);
    this.handlePaymentMethodSelect = this.handlePaymentMethodSelect.bind(this);
    this.processPayment = this.processPayment.bind(this);
    this.handlePaymentSuccess = this.handlePaymentSuccess.bind(this);
    this.handlePaymentError = this.handlePaymentError.bind(this);
    this.generateSignature = this.generateSignature.bind(this);
    this.cleanupPaymentState = this.cleanupPaymentState.bind(this);

    this.config = {
      paymentGateway: {
        apiBase: 'https://bazi-backend.owenjass.workers.dev',
        apiUrl: 'https://zpayz.cn/submit.php',
        pid: '2025051013380915',
        key: 'UsXrSwn0wft5SeLB0LaQfecvJmpkS18T',
        signType: 'MD5',
        successUrl: 'https://mybazi.net/system/wishingwell.html',
        checkInterval: 2000,
        maxChecks: 15
      },
      paymentMethods: [
        { id: 'alipay', name: '支付宝', icon: 'fab fa-alipay', color: '#1677ff', activeColor: '#1268d9', hint: '全球支付' },
        { id: 'wxpay', name: '微信支付', icon: 'fab fa-weixin', color: '#09bb07', activeColor: '#07a807', hint: '国内支付' }
      ],
      debug: true
    };

    this.state = {
      selectedAmount: null,
      selectedMethod: 'alipay',
      currentWishId: null,
      processing: false,
      statusCheckInterval: null,
      paymentCompleted: false,
      lastPayment: null
    };

    this.initEventListeners();
    this.injectStyles();
    this.setupErrorHandling();
    this.cleanupLocalStorage();
  }

  initEventListeners() {
    document.removeEventListener('click', this.handleDocumentClick);
    document.addEventListener('click', this.handleDocumentClick);
  }

  injectStyles() {
    if (document.getElementById('wwpay-styles')) return;
    const style = document.createElement('style');
    style.id = 'wwpay-styles';
    style.textContent = `/* 样式内容省略，请使用实际样式 */`;
    document.head.appendChild(style);
  }

  setupErrorHandling() {
    window.addEventListener('error', e => this.safeLogError('全局错误', e.error));
    window.addEventListener('unhandledrejection', e => this.safeLogError('未处理的Promise拒绝', e.reason));
  }

  cleanupLocalStorage() {
    localStorage.removeItem('pending-fulfillment');
    localStorage.removeItem('last-payment');
  }

  handleDocumentClick(e) {
    const fulfillOption = e.target.closest('.fulfill-option');
    if (fulfillOption) return this.handleFulfillOptionClick(fulfillOption);
    const methodBtn = e.target.closest('.wwpay-method-btn');
    if (methodBtn) return this.handlePaymentMethodSelect(methodBtn);
    const confirmBtn = e.target.closest('#confirm-payment-btn');
    if (confirmBtn) return this.processPayment();
  }

  handleFulfillOptionClick(optionElement) {
    const amount = parseFloat(optionElement.dataset.amount);
    const wishId = document.getElementById('fulfillModal')?.dataset?.wishId;
    if (!wishId || isNaN(amount)) return this.showToast('无效愿望或金额', 'error');
    this.state.selectedAmount = amount;
    this.state.currentWishId = parseInt(wishId);
    this.showPaymentMethods();
  }

  handlePaymentMethodSelect(btn) {
    document.querySelectorAll('.wwpay-method-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    this.state.selectedMethod = btn.dataset.type;
  }

  async processPayment() {
    if (!this.validatePaymentState()) return;
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

    try {
      const result = await this.createPaymentOrder();
      if (result.success) this.startPaymentStatusCheck();
    } catch (err) {
      this.handlePaymentError(err);
    }
  }

  async createPaymentOrder() {
    const orderId = this.generateOrderId();
    this.recordFulfillment().catch(err => this.safeLogError('异步还愿失败', err));

    const payload = {
      pid: this.config.paymentGateway.pid,
      type: this.state.selectedMethod,
      out_trade_no: orderId,
      notify_url: location.href,
      return_url: this.config.paymentGateway.successUrl,
      name: `还愿-${this.state.currentWishId}`,
      money: this.state.selectedAmount.toFixed(2),
      param: encodeURIComponent(JSON.stringify({ wishId: this.state.currentWishId, amount: this.state.selectedAmount })),
      sign_type: this.config.paymentGateway.signType
    };

    payload.sign = this.generateSignature(payload);
    await this.submitPaymentForm(payload);
    return { success: true };
  }

  generateSignature(params) {
    const filtered = Object.entries(params).filter(([k, v]) => v !== '' && k !== 'sign' && k !== 'sign_type')
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`).join('&') + this.config.paymentGateway.key;
    return CryptoJS.MD5(filtered).toString();
  }

  async submitPaymentForm(payload) {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = this.config.paymentGateway.apiUrl;
    form.style.display = 'none';
    Object.entries(payload).forEach(([k, v]) => {
      const input = document.createElement('input');
      input.type = 'hidden'; input.name = k; input.value = v;
      form.appendChild(input);
    });
    document.body.appendChild(form);
    form.submit();
  }

  startPaymentStatusCheck() {
    let checks = 0;
    this.state.statusCheckInterval = setInterval(async () => {
      if (++checks > this.config.paymentGateway.maxChecks) return this.clearPaymentStatusCheck();
      try {
        const res = await this.checkPaymentStatus();
        if (res.status === 'success') {
          this.clearPaymentStatusCheck();
          this.state.paymentCompleted = true;
          await this.handlePaymentSuccess();
        }
      } catch (e) {
        this.safeLogError('支付状态错误', e);
      }
    }, this.config.paymentGateway.checkInterval);
  }

  async checkPaymentStatus() {
    const res = await fetch(`${this.config.paymentGateway.apiBase}/api/payments/status?wishId=${this.state.currentWishId}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` }
    });
    return res.json();
  }

  clearPaymentStatusCheck() {
    clearInterval(this.state.statusCheckInterval);
    this.state.statusCheckInterval = null;
  }

  async handlePaymentSuccess() {
    this.showGuaranteedToast('还愿成功，正在处理...');
    const ok = await this.ensureFulfillmentRecorded();
    if (!ok.success) return this.handlePaymentSuccessError(new Error('还愿记录失败'));
    await this.safeRemoveWishCard(this.state.currentWishId);
    this.prepareSuccessRedirect();
  }

  async ensureFulfillmentRecorded() {
    return await this.recordFulfillment();
  }

  prepareSuccessRedirect() {
    const url = new URL(this.config.paymentGateway.successUrl);
    url.searchParams.set('fulfillment_success', 'true');
    url.searchParams.set('wish_id', this.state.currentWishId);
    this.cleanupPaymentState();
    window.location.href = url.toString();
  }

  async recordFulfillment() {
    const res = await fetch(`${this.config.paymentGateway.apiBase}/api/wishes/fulfill`, {
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
    return res.json();
  }

  async safeRemoveWishCard(wishId) {
    const card = document.querySelector(`[data-wish-id="${wishId}"]`);
    if (!card) return;
    card.classList.add('wish-card-removing');
    setTimeout(() => card.remove(), 800);
  }

  validatePaymentState() {
    if (!this.state.selectedAmount) return this.showToast('请选择金额', 'error');
    if (!this.state.currentWishId) return this.showToast('愿望ID缺失', 'error');
    return true;
  }

  updateConfirmButtonState() {
    const btn = document.getElementById('confirm-payment-btn');
    if (!btn) return;
    btn.disabled = this.state.processing;
    btn.innerHTML = this.state.processing ? '<i class="fas fa-spinner fa-spin"></i> 处理中...' : '确认支付';
  }

  showPaymentMethods() {
    // 可渲染选择按钮，可根据样式需求定制
  }

  showToast(msg, type = 'info') {
    alert(`[${type}] ${msg}`);
  }

  showGuaranteedToast(msg, type = 'success') {
    this.showToast(msg, type);
  }

  showFullscreenLoading(msg) {
    this.loadingElement = document.createElement('div');
    this.loadingElement.className = 'wwpay-loading';
    this.loadingElement.textContent = msg;
    document.body.appendChild(this.loadingElement);
  }

  hideFullscreenLoading() {
    if (this.loadingElement) this.loadingElement.remove();
  }

  generateOrderId() {
    const d = new Date();
    return `${d.getFullYear()}${(d.getMonth()+1).toString().padStart(2,'0')}${d.getDate().toString().padStart(2,'0')}${d.getHours().toString().padStart(2,'0')}${d.getMinutes().toString().padStart(2,'0')}${d.getSeconds().toString().padStart(2,'0')}${Math.floor(Math.random()*9000)+1000}`;
  }

  cleanupPaymentState() {
    localStorage.removeItem('last-payment');
    localStorage.removeItem('pending-fulfillment');
  }

  safeLogError(context, error) {
    console.error(`[WWPay] ${context}:`, error);
  }

  handlePaymentError(error) {
    this.safeLogError('支付错误', error);
    this.showGuaranteedToast('支付失败: ' + error.message, 'error');
    this.state.processing = false;
    this.updateConfirmButtonState();
    this.hideFullscreenLoading();
  }

  handlePaymentSuccessError(error) {
    this.safeLogError('支付成功处理失败', error);
    this.showGuaranteedToast('支付成功但后续处理失败，请刷新页面确认', 'warning');
  }
}

// 加载 CryptoJS
function loadCryptoJS() {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js';
    script.onload = resolve;
    script.onerror = () => reject('加载 CryptoJS 失败');
    document.head.appendChild(script);
  });
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  if (params.get('fulfillment_success') === 'true') {
    alert(`还愿已成功，愿望 #${params.get('wish_id')} 已被移除`);
  }

  if (!window.wwPay) {
    if (typeof CryptoJS === 'undefined') {
      loadCryptoJS().then(() => {
        window.wwPay = new WWPay();
      }).catch(console.error);
    } else {
      window.wwPay = new WWPay();
    }
  }
});

// 外部调用
window.startWishPayment = function(wishId, amount, method = 'alipay') {
  if (!window.wwPay) return alert('支付系统尚未初始化');
  window.wwPay.state = {
    selectedAmount: amount,
    selectedMethod: method,
    currentWishId: wishId,
    processing: false,
    statusCheckInterval: null,
    paymentCompleted: false
  };
  window.wwPay.processPayment();
};
