/**
 * 终极支付解决方案 - gamepay.js v3.0a
 * 功能：
 * 1. 全自动支付流程控制
 * 2. 哈希路由兼容处理
 * 3. 多层错误防御机制
 * 4. 智能状态同步
 */

// ==================== 配置区 ====================
const PAYMENT_CONFIG = {
  // 基础配置
  pid: '2025051013380915',
  key: 'UsXrSwn0wft5SeLB0LaQfecvJmpkS18T',
  apiUrl: 'https://zpayz.cn/submit.php',
  amount: '0.01',
  currency: 'CNY',
  
  // 页面配置
  successRedirectUrl: 'system/bazisystem.html',
  
  // 高级配置
  debug: true,  // 开启调试日志
  autoRedirect: true,
  maxRetryCount: 3
};

// ==================== 核心类 ====================
class PaymentSystem {
  constructor(config) {
    // 合并配置
    this.config = {
      ...PAYMENT_CONFIG,
      ...config
    };
    
    // 状态变量
    this.state = {
      initialized: false,
      paymentProcessed: false,
      retryCount: 0
    };
    
    // DOM元素缓存
    this.elements = {};
    
    // 启动系统
    this.boot();
  }

  // ================ 生命周期方法 ================
  async boot() {
    try {
      await this.prepareDependencies();
      this.setupEnvironment();
      this.createUIComponents();
      this.attachEventHandlers();
      this.processInitialState();
      
      this.state.initialized = true;
      this.log('系统启动完成');
    } catch (error) {
      this.handleCriticalError(error);
    }
  }

  // ================ 初始化流程 ================
  async prepareDependencies() {
    // 确保CryptoJS可用
    if (typeof CryptoJS === 'undefined') {
      await this.loadScript(
        'https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js',
        'CryptoJS'
      );
    }
  }

  setupEnvironment() {
    // 修复哈希路由问题
    if (window.location.hash.includes('?')) {
      const [hashPath, hashQuery] = window.location.hash.split('?');
      this.config.returnUrl = `${window.location.pathname}${hashPath}?${hashQuery}`;
      this.log('检测到哈希路由参数，已调整returnUrl:', this.config.returnUrl);
    }
  }

  createUIComponents() {
    // 加载动画
    if (!document.getElementById('payment-loader')) {
      const loader = document.createElement('div');
      loader.id = 'payment-loader';
      loader.className = 'payment-loader';
      loader.innerHTML = `
        <div class="payment-spinner">
          <svg viewBox="0 0 50 50">
            <circle cx="25" cy="25" r="20" fill="none" stroke-width="5"></circle>
          </svg>
          <p>支付处理中...</p>
        </div>
      `;
      document.body.appendChild(loader);
    }

    // 支付成功提示
    if (!document.getElementById('payment-notice')) {
      const notice = document.createElement('div');
      notice.id = 'payment-notice';
      notice.className = 'payment-notice';
      notice.innerHTML = `
        <div class="notice-content">
          <i class="icon-success"></i>
          <span class="notice-message"></span>
        </div>
      `;
      document.body.appendChild(notice);
    }
  }

  // ================ 支付核心逻辑 ================
  async initiatePayment() {
    if (!this.validateInputs()) return;
    
    try {
      this.setState('processing', true);
      
      const paymentData = {
        pid: this.config.pid,
        type: 'wxpay',
        out_trade_no: this.generateTransactionId(),
        notify_url: this.getCallbackUrl(),
        return_url: this.getCallbackUrl(),
        name: `八字测算-${this.getUserName().substring(0, 20)}`,
        money: this.config.amount,
        currency: this.config.currency,
        param: encodeURIComponent(this.getUserName()),
        sign_type: 'MD5'
      };

      paymentData.sign = this.generateSignature(paymentData);
      this.submitPaymentRequest(paymentData);
      
    } catch (error) {
      this.handlePaymentError(error);
    }
  }

  verifyPaymentResponse() {
    const params = this.extractCallbackParams();
    
    if (params.trade_status === 'TRADE_SUCCESS') {
      const isValid = this.validateSignature(params);
      
      if (isValid) {
        this.completePayment({
          userName: decodeURIComponent(params.param),
          transactionId: params.out_trade_no,
          amount: params.money
        });
        return true;
      }
    }
    return false;
  }

  // ================ 工具方法 ================
  generateTransactionId() {
    const now = new Date();
    const timestamp = `${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}${now.getHours().toString().padStart(2,'0')}${now.getMinutes().toString().padStart(2,'0')}${now.getSeconds().toString().padStart(2,'0')}`;
    const random = Math.floor(Math.random()*9000)+1000;
    return `${timestamp}${random}`;
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

  // ================ UI控制 ================
  showLoader(show) {
    const loader = document.getElementById('payment-loader');
    if (loader) loader.style.display = show ? 'flex' : 'none';
  }

  showNotice(message, isSuccess = true) {
    const notice = document.getElementById('payment-notice');
    if (notice) {
      notice.className = `payment-notice ${isSuccess ? 'success' : 'error'}`;
      notice.querySelector('.notice-message').textContent = message;
      notice.style.display = 'block';
      
      setTimeout(() => {
        notice.style.display = 'none';
      }, 3000);
    }
  }

  // ================ 错误处理 ================
  handlePaymentError(error) {
    this.state.retryCount++;
    
    if (this.state.retryCount <= this.config.maxRetryCount) {
      this.log(`支付失败，正在重试 (${this.state.retryCount}/${this.config.maxRetryCount})`);
      setTimeout(() => this.initiatePayment(), 1000);
    } else {
      this.showNotice('支付失败，请稍后重试', false);
      this.setState('processing', false);
    }
  }

  handleCriticalError(error) {
    console.error('支付系统崩溃:', error);
    this.showNotice('支付系统初始化失败', false);
    
    // 降级方案
    const payBtn = document.getElementById('pay-btn');
    if (payBtn) {
      payBtn.onclick = () => {
        alert('当前无法支付，请联系客服');
      };
    }
  }

  // ================ 辅助方法 ================
  log(...args) {
    if (this.config.debug) {
      console.log('[PaymentSystem]', ...args);
    }
  }
}

// ==================== 自动初始化 ====================
(function() {
  // 兼容不同加载方式
  const init = () => {
    try {
      window.paymentSystem = new PaymentSystem();
      
      // 暴露必要方法给全局
      window.processPaymentCallback = () => {
        window.paymentSystem.verifyPaymentResponse();
      };
    } catch (e) {
      console.error('支付系统初始化失败:', e);
    }
  };

  if (document.readyState === 'complete') {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init);
    window.addEventListener('load', init);
  }
})();
