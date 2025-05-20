/**
 * 集中式支付管理模块 - gamepay.js
 * 功能：处理zpay平台支付流程，包括订单生成、签名验证、状态跳转
 * 特点：
 * 1. 完全独立，不依赖HTML中的支付代码
 * 2. 动态创建支付相关UI元素
 * 3. 自动处理支付状态检查和回调
 */

class PaymentManager {
  constructor() {
    // 支付配置
    this.config = {
      pid: '2025051013380915',
      key: 'UsXrSwn0wft5SeLB0LaQfecvJmpkS18T',
      apiUrl: 'https://zpayz.cn/submit.php',
      returnUrl: window.location.href.split('?')[0],
      amount: '0.01',
      successRedirectUrl: 'system/bazisystem.html'
    };

    // 初始化支付系统
    this.init();
  }

  /* ==================== 初始化方法 ==================== */
  init() {
    // 创建必要UI元素
    this.createPaymentUI();
    
    // 获取DOM元素引用
    this.payBtn = document.getElementById('pay-btn');
    this.calculateBtn = document.getElementById('calculate-btn');
    this.nameInput = document.getElementById('name');
    this.loadingEl = document.getElementById('fullscreen-loading');
    this.successAlertEl = document.getElementById('payment-success-alert');

    // 绑定事件
    this.bindEvents();
    
    // 检查支付状态
    this.checkPaymentStatus();
  }

  createPaymentUI() {
    // 动态创建全屏加载层（如果不存在）
    if (!document.getElementById('fullscreen-loading')) {
      const loadingDiv = document.createElement('div');
      loadingDiv.id = 'fullscreen-loading';
      loadingDiv.style.cssText = `
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.7);
        z-index: 9999;
        justify-content: center;
        align-items: center;
      `;
      loadingDiv.innerHTML = `
        <div style="color: white; text-align: center;">
          <i class="fas fa-spinner fa-spin fa-3x"></i>
          <p>正在处理支付请求，请稍候...</p>
        </div>
      `;
      document.body.appendChild(loadingDiv);
    }

    // 动态创建支付成功提示（如果不存在）
    if (!document.getElementById('payment-success-alert')) {
      const alertDiv = document.createElement('div');
      alertDiv.id = 'payment-success-alert';
      alertDiv.style.cssText = `
        display: none;
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 15px;
        border-radius: 5px;
        z-index: 1000;
      `;
      alertDiv.textContent = '支付成功！正在跳转到测算页面...';
      document.body.appendChild(alertDiv);
    }
  }

  bindEvents() {
    // 支付按钮事件
    if (this.payBtn) {
      this.payBtn.addEventListener('click', () => this.startPayment());
    }

    // 测算按钮事件
    if (this.calculateBtn) {
      this.calculateBtn.addEventListener('click', () => this.startCalculation());
    }

    // 姓名输入变化事件
    if (this.nameInput) {
      this.nameInput.addEventListener('input', () => this.updateButtonState());
    }
  }

  /* ==================== 支付核心逻辑 ==================== */
  startPayment() {
    const userName = this.nameInput?.value.trim();
    if (!this.validateName(userName)) return;

    this.showLoading(true);

    const paymentData = {
      pid: this.config.pid,
      type: 'wxpay',
      out_trade_no: this.generateOrderNo(),
      notify_url: this.config.returnUrl,
      return_url: this.config.returnUrl,
      name: `八字测算-${userName.substring(0, 20)}`,
      money: this.config.amount,
      param: encodeURIComponent(userName),
      sign_type: 'MD5'
    };

    // 生成签名并提交支付
    paymentData.sign = this.generateSign(paymentData);
    this.submitPaymentForm(paymentData);
  }

  handlePaymentSuccess(userName) {
    // 1. 存储支付状态
    localStorage.setItem(`paid_${userName}`, 'true');
    localStorage.removeItem(`used_${userName}`);

    // 2. 更新按钮状态
    this.updateButtonState();

    // 3. 显示成功提示
    this.showSuccessAlert();

    // 4. 3秒后跳转
    setTimeout(() => {
      window.location.href = `${this.config.successRedirectUrl}?name=${encodeURIComponent(userName)}`;
    }, 3000);
  }

  /* ==================== 支付状态管理 ==================== */
  checkPaymentStatus() {
    // 检查URL回调参数
    const urlParams = new URLSearchParams(window.location.search);
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
        this.cleanUrl();
      }
    }

    // 检查本地存储状态
    this.updateButtonState();
  }

  updateButtonState() {
    const userName = this.nameInput?.value.trim();
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

  /* ==================== 工具方法 ==================== */
  // 生成订单号 (格式: yyyyMMddHHmmss + 随机4位)
  generateOrderNo() {
    const now = new Date();
    return `${now.getFullYear()}${this.pad(now.getMonth()+1)}${this.pad(now.getDate())}` +
           `${this.pad(now.getHours())}${this.pad(now.getMinutes())}${this.pad(now.getSeconds())}` +
           `${Math.floor(Math.random()*9000)+1000}`;
  }

  // 生成支付签名
  generateSign(params) {
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

  // 验证支付回调签名
  verifyPayment(paymentData) {
    const sign = paymentData.sign;
    const calculatedSign = this.generateSign(paymentData);
    return calculatedSign === sign;
  }

  // 提交支付表单
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

  /* ==================== UI控制方法 ==================== */
  showLoading(show) {
    if (this.loadingEl) {
      this.loadingEl.style.display = show ? 'flex' : 'none';
    }
  }

  showSuccessAlert() {
    if (this.successAlertEl) {
      this.successAlertEl.style.display = 'block';
      setTimeout(() => {
        this.successAlertEl.style.display = 'none';
      }, 3000);
    }
  }

  resetToPayState() {
    if (this.payBtn) this.payBtn.style.display = 'block';
    if (this.calculateBtn) this.calculateBtn.style.display = 'none';
  }

  showCalculateState() {
    if (this.payBtn) this.payBtn.style.display = 'none';
    if (this.calculateBtn) this.calculateBtn.style.display = 'block';
  }

  /* ==================== 辅助方法 ==================== */
  validateName(name) {
    if (!name) {
      alert('请输入姓名');
      this.showLoading(false);
      return false;
    }
    return true;
  }

  isPaidAndUnused(userName) {
    return localStorage.getItem(`paid_${userName}`) && 
          !localStorage.getItem(`used_${userName}`);
  }

  cleanUrl() {
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  pad(num) {
    return num < 10 ? `0${num}` : num;
  }

  // 测算功能（示例）
  startCalculation() {
    const userName = this.nameInput?.value.trim();
    const gender = document.getElementById('gender')?.value;
    
    if (!userName || !gender) {
      alert('请填写完整信息');
      return;
    }

    // 标记为已使用
    localStorage.setItem(`used_${userName}`, 'true');
    console.log(`开始测算: ${userName}, 性别: ${gender}`);
    // 实际测算逻辑...
  }
}

// 页面加载后初始化支付系统
document.addEventListener('DOMContentLoaded', () => {
  new PaymentManager();
});
