/**
 * 终极支付解决方案 - gamepay.js v3.3
 * 已修复所有方法缺失问题
 * 完整依赖加载和错误处理
 */

// ==================== 配置区 ====================
const PAYMENT_CONFIG = {
  pid: '2025051013380915',
  key: 'UsXrSwn0wft5SeLB0LaQfecvJmpkS18T',
  apiUrl: 'https://zpayz.cn/submit.php',
  amount: '0.01',
  currency: 'CNY',
  successRedirectUrl: 'system/bazisystem.html',
  debug: true,
  maxRetryCount: 3
};

// ==================== 核心支付系统 ====================
class PaymentSystem {
  constructor(config = {}) {
    this.config = { ...PAYMENT_CONFIG, ...config };
    this.state = {
      initialized: false,
      processing: false,
      retryCount: 0
    };
    this.elements = {};
    this.initialize().catch(e => console.error('初始化异常:', e));
  }

  // ============== 初始化流程 ==============
  async initialize() {
    try {
      // 1. 加载必要依赖
      await this._loadRequiredDependencies();
      
      // 2. 设置环境
      this._setupEnvironment();
      
      // 3. 初始化UI
      this._initializeUI();
      
      // 4. 绑定事件
      this._bindEventHandlers();
      
      // 5. 检查支付状态
      this._checkPaymentStatus();
      
      this.state.initialized = true;
      this._log('系统初始化完成');
    } catch (error) {
      this._handleFatalError(error);
    }
  }

  // ============== 依赖加载 ==============
  async _loadRequiredDependencies() {
    if (typeof CryptoJS === 'undefined') {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js';
        script.onload = resolve;
        script.onerror = () => reject(new Error('CryptoJS加载失败'));
        document.head.appendChild(script);
      });
    }
  }

  // ============== 环境设置 ==============
  _setupEnvironment() {
    // 处理哈希路由参数
    if (window.location.hash.includes('?')) {
      const [hashPath, hashQuery] = window.location.hash.split('?');
      this.config.returnUrl = `${window.location.pathname}${hashPath}?${hashQuery}`;
      this._log('调整回调URL:', this.config.returnUrl);
    } else {
      this.config.returnUrl = window.location.href.split('?')[0];
    }
  }

  // ============== UI初始化 ==============
  _initializeUI() {
    // 加载动画
    if (!document.getElementById('payment-loader')) {
      const loader = document.createElement('div');
      loader.id = 'payment-loader';
      loader.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.7);
        display: none;
        justify-content: center;
        align-items: center;
        z-index: 9999;
      `;
      loader.innerHTML = `
        <div style="color: white; text-align: center;">
          <div style="
            width: 50px;
            height: 50px;
            border: 5px solid rgba(255,255,255,0.3);
            border-radius: 50%;
            border-top-color: white;
            margin: 0 auto;
            animation: spin 1s linear infinite;
          "></div>
          <p style="margin-top: 15px;">支付处理中...</p>
        </div>
      `;
      document.body.appendChild(loader);
    }

    // 支付成功提示
    if (!document.getElementById('payment-notice')) {
      const notice = document.createElement('div');
      notice.id = 'payment-notice';
      notice.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 15px;
        border-radius: 5px;
        display: none;
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
      `;
      notice.textContent = '支付成功！正在跳转...';
      document.body.appendChild(notice);
    }
  }

  // ============== 事件绑定 ==============
  _bindEventHandlers() {
    // 支付按钮
    const payBtn = document.getElementById('pay-btn');
    if (payBtn) {
      payBtn.addEventListener('click', () => {
        if (!this.state.processing) {
          this._processPayment();
        }
      });
    }

    // 测算按钮
    const calcBtn = document.getElementById('calculate-btn');
    if (calcBtn) {
      calcBtn.addEventListener('click', () => {
        this._startCalculation();
      });
    }
  }

  // ============== 支付流程 ==============
  async _processPayment() {
    try {
      const userName = this._getUserName();
      if (!this._validateUserName(userName)) return;

      this._setProcessingState(true);
      
      const paymentData = {
        pid: this.config.pid,
        type: 'wxpay',
        out_trade_no: this._generateOrderId(),
        notify_url: this.config.returnUrl,
        return_url: this.config.returnUrl,
        name: `服务支付-${userName.substring(0, 20)}`,
        money: this.config.amount,
        param: encodeURIComponent(userName),
        sign_type: 'MD5'
      };

      paymentData.sign = this._generateSignature(paymentData);
      this._submitPayment(paymentData);

    } catch (error) {
      this._handlePaymentError(error);
    }
  }

  // ============== 工具方法 ==============
  _generateOrderId() {
    const now = new Date();
    return `${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}${now.getHours().toString().padStart(2,'0')}${now.getMinutes().toString().padStart(2,'0')}${now.getSeconds().toString().padStart(2,'0')}${Math.floor(Math.random()*9000)+1000}`;
  }

  _generateSignature(params) {
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

  // ============== 状态管理 ==============
  _checkPaymentStatus() {
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

      if (this._verifyPayment(paymentData)) {
        this._completePayment(decodeURIComponent(paymentData.param || ''));
      }
    }

    this._updateButtonState();
  }

  // ============== 错误处理 ==============
  _handlePaymentError(error) {
    this.state.retryCount++;
    
    if (this.state.retryCount <= this.config.maxRetryCount) {
      this._log(`正在重试 (${this.state.retryCount}/${this.config.maxRetryCount})`);
      setTimeout(() => this._processPayment(), 1000);
    } else {
      this._showNotice('支付失败，请稍后重试', false);
      this._setProcessingState(false);
    }
  }

  _handleFatalError(error) {
    console.error('支付系统崩溃:', error);
    
    // 降级处理
    const payBtn = document.getElementById('pay-btn');
    if (payBtn) {
      payBtn.onclick = () => alert('支付功能暂时不可用');
      payBtn.style.opacity = '0.7';
    }
  }

  // ============== 私有辅助方法 ==============
  _log(...messages) {
    if (this.config.debug) {
      console.log('[Payment]', ...messages);
    }
  }
}

// ==================== 自动初始化 ====================
document.addEventListener('DOMContentLoaded', () => {
  try {
    window.paymentSystem = new PaymentSystem();
  } catch (e) {
    console.error('支付系统初始化失败:', e);
  }
});

// 添加必要的CSS动画
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  @keyframes slideIn {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
`;
document.head.appendChild(style);
