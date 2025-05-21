/**
 * 终极支付解决方案 - gamepay.js v3.4
 * 完全修复初始化问题
 * 增强错误处理和状态管理
 */

// ==================== 配置区 ====================
const PAYMENT_CONFIG = {
  pid: '2025051013380915',
  key: 'UsXrSwn0wft5SeLB0LaQfecvJmpkS18T',
  apiUrl: 'https://zpayz.cn/submit.php',
  amount: '0.01',
  successRedirectUrl: 'system/bazisystem.html',
  debug: true
};

// ==================== 核心支付系统 ====================
class PaymentSystem {
  constructor(config = {}) {
    // 合并配置
    this.config = { ...PAYMENT_CONFIG, ...config };
    
    // 初始化状态
    this.state = {
      isReady: false,
      isProcessing: false
    };
    
    // 启动系统
    this.init();
  }

  // ============== 初始化方法 ==============
  async init() {
    try {
      // 1. 准备环境
      this.prepareEnvironment();
      
      // 2. 检查必要元素
      this.checkRequiredElements();
      
      // 3. 加载依赖
      await this.loadDependencies();
      
      // 4. 设置事件监听
      this.setupEventListeners();
      
      // 5. 检查支付状态
      this.checkPaymentStatus();
      
      this.state.isReady = true;
      this.debugLog('系统初始化完成');
    } catch (error) {
      this.handleError('初始化失败', error);
    }
  }

  // ============== 环境准备 ==============
  prepareEnvironment() {
    // 修复哈希路由问题
    if (window.location.hash.includes('?')) {
      const [hashPath, hashQuery] = window.location.hash.split('?');
      this.config.returnUrl = `${location.pathname}${hashPath}?${hashQuery}`;
    }
  }

  // ============== DOM元素检查 ==============
  checkRequiredElements() {
    this.elements = {
      payBtn: document.getElementById('pay-btn'),
      nameInput: document.getElementById('name')
    };
    
    if (!this.elements.payBtn || !this.elements.nameInput) {
      throw new Error('缺少必要的DOM元素');
    }
  }

  // ============== 依赖加载 ==============
  async loadDependencies() {
    if (typeof CryptoJS === 'undefined') {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js';
        script.onload = resolve;
        script.onerror = () => reject(new Error('加载CryptoJS失败'));
        document.head.appendChild(script);
      });
    }
  }

  // ============== 事件监听 ==============
  setupEventListeners() {
    // 支付按钮事件
    this.elements.payBtn.addEventListener('click', () => {
      if (!this.state.isProcessing) {
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
      this.setState('processing', true);
      
      const paymentData = {
        pid: this.config.pid,
        type: 'wxpay',
        out_trade_no: this.generateOrderId(),
        notify_url: this.config.returnUrl,
        return_url: this.config.returnUrl,
        name: `支付-${this.getUserName()}`,
        money: this.config.amount,
        param: encodeURIComponent(this.getUserName()),
        sign_type: 'MD5'
      };
      
      paymentData.sign = this.generateSignature(paymentData);
      this.submitPayment(paymentData);
      
    } catch (error) {
      this.handleError('支付流程异常', error);
      this.setState('processing', false);
    }
  }

  // ============== 工具方法 ==============
  generateOrderId() {
    const now = new Date();
    return `${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}${now.getHours().toString().padStart(2,'0')}${now.getMinutes().toString().padStart(2,'0')}${now.getSeconds().toString().padStart(2,'0')}${Math.floor(Math.random()*9000)+1000}`;
  }

  generateSignature(params) {
    const filtered = {};
    Object.keys(params)
      .filter(k => params[k] && !['sign', 'sign_type'].includes(k))
      .sort()
      .forEach(k => filtered[k] = params[k]);
    
    const signStr = Object.entries(filtered)
      .map(([k, v]) => `${k}=${v}`)
      .join('&') + this.config.key;
    
    return CryptoJS.MD5(signStr).toString();
  }

  // ============== 状态管理 ==============
  checkPaymentStatus() {
    const params = new URLSearchParams(
      window.location.hash.includes('?') 
        ? window.location.hash.split('?')[1] 
        : window.location.search
    );
    
    if (params.get('trade_status') === 'TRADE_SUCCESS') {
      this.handlePaymentSuccess(params.get('param'));
    }
  }

  updateButtonState() {
    const isPaid = localStorage.getItem(`paid_${this.getUserName()}`);
    this.elements.payBtn.style.display = isPaid ? 'none' : 'block';
  }

  // ============== 错误处理 ==============
  handleError(context, error) {
    console.error(`[Payment] ${context}:`, error);
    alert(`${context}，请刷新页面重试`);
  }

  debugLog(...args) {
    if (this.config.debug) {
      console.log('[Payment]', ...args);
    }
  }
}

// ==================== 自动初始化 ====================
document.addEventListener('DOMContentLoaded', () => {
  try {
    window.paymentSystem = new PaymentSystem();
  } catch (e) {
    console.error('支付系统启动失败:', e);
    
    // 降级处理
    const payBtn = document.getElementById('pay-btn');
    if (payBtn) {
      payBtn.onclick = () => alert('支付功能暂不可用');
      payBtn.style.backgroundColor = '#eee';
    }
  }
});
