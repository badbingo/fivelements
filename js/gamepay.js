/**
 * 终极支付解决方案 - gamepay.js v3.2
 * 功能：
 * - 全自动支付流程管理
 * - 哈希路由兼容处理
 * - 多层错误防御机制
 * - 智能状态同步
 * - 详细调试日志
 */

// ==================== 配置区 ====================
const PAYMENT_CONFIG = {
  // 必填配置
  pid: '2025051013380915',              // 商户ID
  key: 'UsXrSwn0wft5SeLB0LaQfecvJmpkS18T', // 签名密钥
  apiUrl: 'https://zpayz.cn/submit.php', // 支付接口地址
  
  // 可选配置
  amount: '0.01',                       // 默认金额
  currency: 'CNY',                      // 货币类型
  successRedirectUrl: 'system/bazisystem.html', // 支付成功跳转
  debug: true,                          // 调试模式
  maxRetryCount: 3,                     // 最大重试次数
  paymentTypes: ['wxpay', 'alipay']     // 支持的支付方式
};

// ==================== 核心支付系统 ====================
class PaymentSystem {
  constructor(userConfig = {}) {
    // 合并配置
    this.config = {
      ...PAYMENT_CONFIG,
      ...userConfig
    };
    
    // 初始化状态
    this.state = {
      initialized: false,
      processing: false,
      retryCount: 0,
      currentPayment: null
    };
    
    // DOM元素缓存
    this.elements = {};
    
    // 启动系统
    this.initialize();
  }

  // ============== 初始化方法 ==============
  async initialize() {
    try {
      this.log('系统启动中...');
      
      // 1. 准备依赖
      await this.loadDependencies();
      
      // 2. 环境检测
      this.checkEnvironment();
      
      // 3. 创建UI
      this.createUI();
      
      // 4. 绑定事件
      this.bindEvents();
      
      // 5. 处理初始状态
      this.checkInitialState();
      
      this.state.initialized = true;
      this.log('系统就绪');
    } catch (error) {
      this.handleFatalError(error);
    }
  }

  // ============== 支付流程控制 ==============
  async startPayment(paymentType = 'wxpay') {
    if (this.state.processing) {
      this.showNotice('已有支付正在进行', false);
      return;
    }
    
    try {
      // 1. 验证输入
      const userName = this.getUserName();
      if (!this.validateUserName(userName)) return;
      
      // 2. 准备支付数据
      const paymentData = this.preparePaymentData(userName, paymentType);
      
      // 3. 显示加载状态
      this.setProcessingState(true);
      
      // 4. 提交支付
      this.submitPayment(paymentData);
      
    } catch (error) {
      this.handlePaymentError(error);
    }
  }

  // ============== 核心工具方法 ==============
  preparePaymentData(userName, paymentType) {
    return {
      pid: this.config.pid,
      type: paymentType,
      out_trade_no: this.generateOrderId(),
      notify_url: this.getCallbackUrl(),
      return_url: this.getCallbackUrl(),
      name: `服务支付-${userName.substring(0, 20)}`,
      money: this.config.amount,
      currency: this.config.currency,
      param: encodeURIComponent(userName),
      sign_type: 'MD5',
      timestamp: Date.now()
    };
  }

  generateOrderId() {
    const now = new Date();
    return `${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}${now.getHours().toString().padStart(2,'0')}${now.getMinutes().toString().padStart(2,'0')}${now.getSeconds().toString().padStart(2,'0')}${Math.floor(Math.random()*9000)+1000}`;
  }

  generateSignature(params) {
    // 过滤空值和签名字段
    const filtered = Object.fromEntries(
      Object.entries(params).filter(([k, v]) => v !== '' && !['sign', 'sign_type'].includes(k))
    );
    
    // 排序后生成签名字符串
    const signStr = Object.keys(filtered).sort()
      .map(key => `${key}=${filtered[key]}`)
      .join('&') + this.config.key;
    
    // 使用CryptoJS生成MD5签名
    return CryptoJS.MD5(signStr).toString();
  }

  // ============== UI管理 ==============
  createUI() {
    // 创建加载动画
    if (!document.getElementById('payment-loader')) {
      const loader = document.createElement('div');
      loader.id = 'payment-loader';
      loader.className = 'payment-loader';
      loader.innerHTML = `
        <div class="spinner-container">
          <div class="spinner"></div>
          <p>支付处理中，请稍候...</p>
        </div>
      `;
      document.body.appendChild(loader);
    }
    
    // 创建通知弹窗
    if (!document.getElementById('payment-notification')) {
      const notice = document.createElement('div');
      notice.id = 'payment-notification';
      notice.className = 'payment-notification';
      notice.innerHTML = `
        <div class="notification-content">
          <span class="icon"></span>
          <p class="message"></p>
        </div>
      `;
      document.body.appendChild(notice);
    }
  }

  showNotice(message, isSuccess = true) {
    const notice = document.getElementById('payment-notification');
    if (notice) {
      notice.className = `payment-notification ${isSuccess ? 'success' : 'error'}`;
      notice.querySelector('.message').textContent = message;
      notice.style.display = 'block';
      
      // 自动隐藏
      setTimeout(() => {
        notice.style.display = 'none';
      }, 3000);
    }
  }

  // ============== 错误处理 ==============
  handlePaymentError(error) {
    this.state.retryCount++;
    
    if (this.state.retryCount <= this.config.maxRetryCount) {
      this.log(`支付失败，正在重试 (${this.state.retryCount}/${this.config.maxRetryCount})`);
      setTimeout(() => this.startPayment(), 1000);
    } else {
      this.showNotice('支付失败，请联系客服', false);
      this.setProcessingState(false);
    }
  }

  handleFatalError(error) {
    console.error('!!! 支付系统崩溃 !!!', error);
    
    // 降级方案
    const payBtn = document.getElementById('pay-btn');
    if (payBtn) {
      payBtn.onclick = () => {
        alert('支付系统暂时不可用，请稍后再试');
      };
      payBtn.style.backgroundColor = '#ccc';
    }
  }

  // ============== 辅助方法 ==============
  log(...messages) {
    if (this.config.debug) {
      console.log('[PaymentSystem]', ...messages);
    }
  }
}

// ==================== 自动初始化 ====================
(function() {
  // 确保DOM就绪后初始化
  function init() {
    try {
      window.paymentSystem = new PaymentSystem();
      
      // 暴露回调方法
      window.handlePaymentCallback = function() {
        return window.paymentSystem.processCallback();
      };
    } catch (e) {
      console.error('支付系统初始化失败:', e);
    }
  }

  // 多种初始化方式兼容
  if (document.readyState === 'complete') {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init);
    window.addEventListener('load', init);
  }
})();
