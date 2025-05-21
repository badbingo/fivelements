/**
 * 终极支付解决方案 - 弹窗版 (gamepay.js v5.0)
 * 功能：仅在游戏成功后弹出支付窗口，完全移除自动生成的底部表单
 * 保留完整的支付状态验证和安全逻辑
 */

// ==================== 全局配置 ====================
const PAYMENT_CONFIG = {
  // 商户配置
  pid: '2025051013380915',
  key: 'UsXrSwn0wft5SeLB0LaQfecvJmpkS18T',
  apiUrl: 'https://zpayz.cn/submit.php',
  
  // 支付参数
  amount: '0.01',
  currency: 'CNY',
  successRedirectUrl: window.location.origin + '/system/bazisystem.html',
  debug: true
};

// ==================== 核心支付系统 ====================
class PaymentSystem {
  constructor(config = {}) {
    // 合并配置
    this.config = {
      ...PAYMENT_CONFIG,
      ...config
    };
    
    // 状态管理
    this.state = {
      initialized: false,
      processing: false,
      modalVisible: false
    };
    
    // 安全初始化
    this.safeInitialize();
  }

  // ============== 初始化系统 ==============
  async safeInitialize() {
    try {
      // 1. 加载必要依赖
      await this.loadDependencies();
      
      // 2. 检查历史支付状态
      this.checkPaymentStatus();
      
      this.state.initialized = true;
      this.log('支付系统初始化完成');
    } catch (error) {
      this.handleError('初始化失败', error);
    }
  }

  // ============== 依赖加载 ==============
  async loadDependencies() {
    if (typeof CryptoJS === 'undefined') {
      await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js');
    }
  }

  loadScript(url) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  // ============== 支付弹窗控制 ==============
  showPaymentModal() {
    if (this.state.modalVisible || this.state.processing) return;
    this.state.modalVisible = true;
    
    // 创建弹窗容器
    const modal = document.createElement('div');
    modal.id = 'payment-modal-overlay';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      z-index: 9999;
      display: flex;
      justify-content: center;
      align-items: center;
    `;
    
    // 弹窗内容
    modal.innerHTML = `
      <div style="
        background: white;
        padding: 25px;
        border-radius: 10px;
        width: 90%;
        max-width: 400px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
      ">
        <h3 style="margin-top: 0; color: #333;">完成支付解锁测算</h3>
        
        <input type="text" 
               id="payment-modal-name" 
               placeholder="请输入您的姓名"
               style="
                 width: 100%;
                 padding: 12px;
                 margin-bottom: 15px;
                 border: 1px solid #ddd;
                 border-radius: 6px;
                 font-size: 16px;
               ">
        
        <button id="payment-modal-submit"
                style="
                  width: 100%;
                  padding: 12px;
                  background: #07c160;
                  color: white;
                  border: none;
                  border-radius: 6px;
                  font-size: 16px;
                  cursor: pointer;
                ">
          <span id="payment-modal-btn-text">立即支付 (¥${this.config.amount})</span>
          <span id="payment-modal-loading" style="display: none;">处理中...</span>
        </button>
        
        <div id="payment-modal-error" style="color: red; margin-top: 10px; display: none;"></div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // 绑定事件
    document.getElementById('payment-modal-submit').addEventListener('click', () => {
      this.handleModalPayment();
    });
    
    // ESC键关闭
    modal.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.closeModal();
    });
  }

  closeModal() {
    const modal = document.getElementById('payment-modal-overlay');
    if (modal) {
      modal.remove();
      this.state.modalVisible = false;
    }
  }

  // ============== 支付流程控制 ==============
  async handleModalPayment() {
    const nameInput = document.getElementById('payment-modal-name');
    const errorDisplay = document.getElementById('payment-modal-error');
    const submitBtn = document.getElementById('payment-modal-submit');
    const btnText = document.getElementById('payment-modal-btn-text');
    const loadingText = document.getElementById('payment-modal-loading');
    
    const userName = nameInput.value.trim();
    if (!userName) {
      errorDisplay.textContent = '请输入您的姓名';
      errorDisplay.style.display = 'block';
      return;
    }
    
    // 显示加载状态
    errorDisplay.style.display = 'none';
    btnText.style.display = 'none';
    loadingText.style.display = 'inline';
    submitBtn.disabled = true;
    
    try {
      await this.processPayment(userName);
    } catch (error) {
      errorDisplay.textContent = '支付启动失败，请重试';
      errorDisplay.style.display = 'block';
    } finally {
      btnText.style.display = 'inline';
      loadingText.style.display = 'none';
      submitBtn.disabled = false;
    }
  }

  async processPayment(userName) {
    this.state.processing = true;
    
    const paymentData = {
      pid: this.config.pid,
      type: 'wxpay',
      out_trade_no: this.generateOrderId(),
      notify_url: location.href,
      return_url: this.config.successRedirectUrl,
      name: `测算服务-${userName}`,
      money: this.config.amount,
      param: encodeURIComponent(userName),
      sign_type: 'MD5'
    };
    
    paymentData.sign = this.generateSignature(paymentData);
    this.submitPaymentForm(paymentData);
  }

  submitPaymentForm(paymentData) {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = this.config.apiUrl;
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

  // ============== 支付状态验证 ==============
  checkPaymentStatus() {
    const params = new URLSearchParams(window.location.search);
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
      }
    }
  }

  verifyPayment(paymentData) {
    const { pid, trade_no, param, sign } = paymentData;
    const localSign = CryptoJS.MD5(`pid=${pid}&trade_no=${trade_no}&param=${param}${this.config.key}`).toString();
    return sign === localSign;
  }

  handlePaymentSuccess(userName) {
    localStorage.setItem(`paid_${userName}`, 'true');
    this.log(`支付成功: ${userName}`);
  }

  cleanUrl() {
    if (window.history.replaceState) {
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
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
      .filter(k => params[k] !== '' && !['sign', 'sign_type'].includes(k))
      .sort()
      .forEach(k => filtered[k] = params[k]);
    
    const signStr = Object.entries(filtered)
      .map(([k, v]) => `${k}=${v}`)
      .join('&') + this.config.key;
    
    return CryptoJS.MD5(signStr).toString();
  }

  log(...messages) {
    if (this.config.debug) console.log('[PaymentSystem]', ...messages);
  }

  handleError(context, error) {
    console.error(`[PaymentSystem] ${context}:`, error);
  }
}

// ==================== 自动初始化 ====================
(function() {
  if (typeof window !== 'undefined' && !window.paymentSystem) {
    window.paymentSystem = new PaymentSystem();
    
    // 暴露全局调用方法
    window.showPaymentModal = function() {
      if (window.paymentSystem) {
        window.paymentSystem.showPaymentModal();
      } else {
        console.error('支付系统未初始化');
      }
    };
  }
})();
