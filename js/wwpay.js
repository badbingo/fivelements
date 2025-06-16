// 安全沙箱兼容的支付系统
class WWPay {
  constructor() {
    try {
      // 基础配置 - 使用简单对象避免复杂结构
      this.config = {
        paymentGateway: {
          apiBase: 'https://bazi-backend.owenjass.workers.dev',
          apiUrl: 'https://zpayz.cn/submit.php',
          pid: '2025051013380915',
          key: 'UsXrSwn0wft5SeLB0LaQfecvJmpkS18T',
          signType: 'MD5',
          successUrl: 'https://mybazi.net/system/wishingwell.html',
          checkInterval: 2000,
          maxChecks: 15,
          retryDelay: 1000
        },
        debug: true
      };

      // 支付方式数据 - 使用数组避免复杂对象
      this.paymentMethods = [
        {
          id: 'alipay',
          name: '支付宝',
          icon: 'fab fa-alipay',
          color: '#1677ff',
          activeColor: '#1268d9',
          hint: '全球支付'
        },
        {
          id: 'wxpay', 
          name: '微信支付',
          icon: 'fab fa-weixin',
          color: '#09bb07',
          activeColor: '#07a807',
          hint: '国内支付'
        }
      ];

      // 初始状态 - 使用简单对象
      this.state = {
        selectedAmount: null,
        selectedMethod: 'alipay',
        currentWishId: null,
        processing: false,
        paymentCompleted: false
      };

      // 安全环境检测
      this.isSecureEnvironment = false;
      try {
        // 避免使用可能受限的全局变量检测
        this.isSecureEnvironment = (
          typeof ses !== 'undefined' || 
          (window.trustedTypes && typeof window.trustedTypes.createPolicy === 'function')
        );
      } catch (e) {
        this.isSecureEnvironment = true;
      }
      
      if (this.isSecureEnvironment) {
        console.warn('运行在安全沙箱环境中');
        this.config.debug = true;
      }

      // 绑定方法 - 只绑定必要的方法
      this.processPayment = this.safeBind(this.processPayment);
      this.handlePaymentSuccess = this.safeBind(this.handlePaymentSuccess);

      // 初始化核心功能
      this.initCore();
      
    } catch (error) {
      console.error('支付系统初始化失败:', error);
    }
  }

  // 安全的bind方法
  safeBind(fn) {
    try {
      return fn.bind(this);
    } catch (e) {
      return function() {
        return fn.apply(this, arguments);
      };
    }
  }

  // 核心初始化
  initCore() {
    try {
      this.addEventListeners();
      this.injectSafeStyles();
      this.cleanupLocalStorage();
      console.log('支付系统核心初始化完成');
    } catch (error) {
      console.error('核心初始化失败:', error);
    }
  }

  /* ========== 支付核心方法 - 避免复杂语法 ========== */
  async processPayment() {
    if (!this.validatePaymentState()) return;
    
    this.state.processing = true;
    this.updateConfirmButtonState();
    this.showFullscreenLoading('正在准备支付...');
    
    try {
      const orderInfo = this.generateOrderInfo();
      
      const paymentResponse = await this.createPaymentRequest(orderInfo);
      
      if (paymentResponse && paymentResponse.code === '10000') {
        this.handlePaymentResponse(paymentResponse);
      } else {
        const errorMsg = paymentResponse ? paymentResponse.message : '支付请求失败';
        throw new Error(errorMsg);
      }
    } catch (error) {
      this.handlePaymentError(error);
    }
  }

  // 生成订单信息 - 避免模板字符串
  generateOrderInfo() {
    const orderId = this.generateOrderId();
    const timestamp = Math.floor(Date.now() / 1000);
    const wishId = this.state.currentWishId;
    
    return {
      pid: this.config.paymentGateway.pid,
      type: this.state.selectedMethod,
      out_trade_no: orderId,
      notify_url: this.config.paymentGateway.apiBase + '/api/payment/notify',
      return_url: this.config.paymentGateway.successUrl,
      name: '愿望还愿 #' + wishId,
      money: this.state.selectedAmount.toString(),
      clientip: '127.0.0.1',
      device: 'pc',
      timestamp: timestamp.toString()
    };
  }

  // 生成签名 - 避免复杂逻辑
  generateSignature(params) {
    try {
      const keys = Object.keys(params).sort();
      let signStr = '';
      
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        signStr += key + '=' + params[key];
        if (i < keys.length - 1) signStr += '&';
      }
      
      signStr += this.config.paymentGateway.key;
      
      if (typeof CryptoJS !== 'undefined' && CryptoJS.MD5) {
        return CryptoJS.MD5(signStr).toString().toUpperCase();
      }
      
      // 简单的MD5替代方案
      let hash = 0;
      for (let i = 0; i < signStr.length; i++) {
        const char = signStr.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // 转换为32位整数
      }
      return Math.abs(hash).toString(16).toUpperCase();
      
    } catch (error) {
      console.error('生成签名失败:', error);
      return '';
    }
  }

  // 创建支付请求 - 简化逻辑
  async createPaymentRequest(orderInfo) {
    try {
      // 添加签名
      orderInfo.sign = this.generateSignature(orderInfo);
      
      const formData = new FormData();
      for (const key in orderInfo) {
        if (Object.prototype.hasOwnProperty.call(orderInfo, key)) {
          formData.append(key, orderInfo[key]);
        }
      }
      
      const response = await fetch(this.config.paymentGateway.apiUrl, {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        return response.json();
      } else {
        throw new Error('支付网关错误: ' + response.status);
      }
    } catch (error) {
      console.error('支付请求失败:', error);
      throw error;
    }
  }

  // 处理支付响应 - 简化逻辑
  handlePaymentResponse(response) {
    try {
      this.state.lastPayment = {
        orderId: response.out_trade_no,
        qrCode: response.qrcode,
        timestamp: Date.now()
      };
      
      if (response.qrcode) {
        this.showQRCode(response.qrcode);
        this.startPaymentStatusCheck(response.out_trade_no);
      } else if (response.payurl) {
        window.location.href = response.payurl;
      } else {
        throw new Error('无效的支付响应');
      }
    } catch (error) {
      this.handlePaymentError(error);
    }
  }

  // 显示二维码 - 使用简单DOM操作
  showQRCode(qrCodeUrl) {
    this.hideFullscreenLoading();
    
    const qrModal = document.createElement('div');
    qrModal.className = 'wwpay-qr-modal';
    
    const qrContainer = document.createElement('div');
    qrContainer.className = 'wwpay-qr-container';
    
    const title = document.createElement('h3');
    title.textContent = '请扫码完成支付';
    
    const img = document.createElement('img');
    img.src = qrCodeUrl;
    img.alt = '支付二维码';
    
    const amountText = document.createElement('p');
    amountText.textContent = '支付金额: ' + this.state.selectedAmount + '元';
    
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'wwpay-cancel-btn';
    cancelBtn.textContent = '取消支付';
    
    cancelBtn.addEventListener('click', () => {
      this.cleanupPaymentState();
      qrModal.remove();
    });
    
    qrContainer.appendChild(title);
    qrContainer.appendChild(img);
    qrContainer.appendChild(amountText);
    qrContainer.appendChild(cancelBtn);
    qrModal.appendChild(qrContainer);
    document.body.appendChild(qrModal);
  }

  // 启动支付状态检查 - 简化逻辑
  startPaymentStatusCheck(orderId) {
    const checkInterval = setInterval(async () => {
      try {
        const status = await this.checkPaymentStatus(orderId);
        
        if (status && status.paid) {
          clearInterval(checkInterval);
          document.querySelector('.wwpay-qr-modal')?.remove();
          this.handlePaymentSuccess();
        }
      } catch (error) {
        console.log('支付状态检查失败:', error);
      }
    }, this.config.paymentGateway.checkInterval);
  }

  // 检查支付状态 - 简化逻辑
  async checkPaymentStatus(orderId) {
    try {
      const response = await fetch(
        this.config.paymentGateway.apiBase + '/api/payment/check?orderId=' + orderId
      );
      
      if (response.ok) {
        return response.json();
      } else {
        throw new Error('状态检查失败: ' + response.status);
      }
    } catch (error) {
      console.error('支付状态检查失败:', error);
      throw error;
    }
  }

  /* ========== 支付成功处理 - 简化逻辑 ========== */
  async handlePaymentSuccess() {
    try {
      this.showToast('还愿成功！正在更新状态...');
      
      // 准备跳转
      this.prepareSuccessRedirect();
      
    } catch (error) {
      console.error('支付成功处理失败:', error);
      this.showToast('支付已完成！请手动刷新查看', 'warning');
      this.redirectToSuccess();
    }
  }

  // 准备跳转 - 简化逻辑
  prepareSuccessRedirect() {
    this.showToast('处理完成！即将跳转...', 'success');
    setTimeout(() => {
      this.cleanupPaymentState();
      this.redirectToSuccess();
    }, 1500);
  }

  // 跳转到成功页面
  redirectToSuccess() {
    const successUrl = new URL(this.config.paymentGateway.successUrl);
    successUrl.searchParams.append('fulfillment_success', 'true');
    successUrl.searchParams.append('wish_id', this.state.currentWishId);
    window.location.href = successUrl.toString();
  }

  /* ========== UI 方法 - 避免复杂DOM操作 ========== */
  showToast(message, type) {
    try {
      this.removeAllToasts();
      
      const toast = document.createElement('div');
      toast.className = 'wwpay-toast ' + (type || '');
      toast.textContent = message;
      
      document.body.appendChild(toast);
      
      setTimeout(() => {
        try {
          toast.remove();
        } catch (e) {
          console.log('移除Toast失败');
        }
      }, 3000);
      
    } catch (error) {
      console.error('显示Toast失败:', error);
    }
  }

  showFullscreenLoading(message) {
    this.hideFullscreenLoading();
    
    this.loadingElement = document.createElement('div');
    this.loadingElement.className = 'wwpay-loading';
    
    const loader = document.createElement('div');
    loader.className = 'loader';
    
    const text = document.createElement('p');
    text.textContent = message;
    
    this.loadingElement.appendChild(loader);
    this.loadingElement.appendChild(text);
    document.body.appendChild(this.loadingElement);
  }

  hideFullscreenLoading() {
    if (this.loadingElement) {
      try {
        this.loadingElement.remove();
      } catch (e) {
        console.log('移除加载动画失败');
      }
      this.loadingElement = null;
    }
  }

  /* ========== 事件处理 - 简化逻辑 ========== */
  addEventListeners() {
    try {
      // 支付方式选择
      document.addEventListener('click', (e) => {
        const btn = e.target.closest('.wwpay-method-btn');
        if (btn) {
          this.state.selectedMethod = btn.dataset.type;
          this.updatePaymentMethodsUI();
        }
      });
      
      // 确认支付按钮
      document.addEventListener('click', (e) => {
        if (e.target.closest('#confirm-payment-btn')) {
          this.processPayment();
        }
      });
    } catch (e) {
      console.error('事件监听失败:', e);
    }
  }

  /* ========== 辅助方法 ========== */
  generateOrderId() {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 9000) + 1000;
    
    return year + month + day + hours + minutes + seconds + random;
  }

  cleanupPaymentState() {
    try {
      this.state = {
        selectedAmount: null,
        selectedMethod: 'alipay',
        currentWishId: null,
        processing: false,
        paymentCompleted: false
      };
    } catch (e) {
      console.log('状态清理失败');
    }
  }

  validatePaymentState() {
    return this.state.selectedAmount && this.state.currentWishId;
  }

  updateConfirmButtonState() {
    const confirmBtn = document.getElementById('confirm-payment-btn');
    if (confirmBtn) {
      confirmBtn.disabled = this.state.processing;
      confirmBtn.textContent = this.state.processing 
        ? '处理中...' 
        : '确认支付 ' + this.state.selectedAmount + '元';
    }
  }

  // 安全注入样式
  injectSafeStyles() {
    try {
      if (document.getElementById('wwpay-styles')) return;
      
      const style = document.createElement('style');
      style.id = 'wwpay-styles';
      
      // 使用纯CSS字符串避免模板语法
      style.textContent = [
        '.wwpay-toast {',
        '  position: fixed;',
        '  top: 20px;',
        '  left: 50%;',
        '  transform: translateX(-50%);',
        '  background: rgba(0, 0, 0, 0.7);',
        '  color: white;',
        '  padding: 12px 24px;',
        '  border-radius: 4px;',
        '  z-index: 9999;',
        '}',
        '',
        '.wwpay-loading {',
        '  position: fixed;',
        '  top: 0;',
        '  left: 0;',
        '  right: 0;',
        '  bottom: 0;',
        '  background: rgba(0, 0, 0, 0.5);',
        '  display: flex;',
        '  flex-direction: column;',
        '  justify-content: center;',
        '  align-items: center;',
        '  z-index: 9998;',
        '}',
        '',
        '.wwpay-loading .loader {',
        '  border: 5px solid #f3f3f3;',
        '  border-top: 5px solid #3498db;',
        '  border-radius: 50%;',
        '  width: 50px;',
        '  height: 50px;',
        '  animation: spin 1s linear infinite;',
        '  margin-bottom: 20px;',
        '}',
        '',
        '@keyframes spin {',
        '  0% { transform: rotate(0deg); }',
        '  100% { transform: rotate(360deg); }',
        '}',
        '',
        '.wwpay-qr-modal {',
        '  position: fixed;',
        '  top: 0;',
        '  left: 0;',
        '  right: 0;',
        '  bottom: 0;',
        '  background: rgba(0, 0, 0, 0.8);',
        '  display: flex;',
        '  justify-content: center;',
        '  align-items: center;',
        '  z-index: 9997;',
        '}',
        '',
        '.wwpay-qr-container {',
        '  background: white;',
        '  padding: 30px;',
        '  border-radius: 8px;',
        '  text-align: center;',
        '  max-width: 90%;',
        '}',
        '',
        '.wwpay-qr-container img {',
        '  width: 200px;',
        '  height: 200px;',
        '  margin: 20px 0;',
        '}',
        '',
        '.wwpay-cancel-btn {',
        '  background: #F44336;',
        '  color: white;',
        '  border: none;',
        '  padding: 10px 20px;',
        '  border-radius: 4px;',
        '  cursor: pointer;',
        '  margin-top: 20px;',
        '}'
      ].join('\n');
      
      document.head.appendChild(style);
    } catch (e) {
      console.error('样式注入失败:', e);
    }
  }

  cleanupLocalStorage() {
    try {
      // 简化清理逻辑
      const now = Date.now();
      const lastPayment = localStorage.getItem('last-payment');
      
      if (lastPayment) {
        const payment = JSON.parse(lastPayment);
        if (now - payment.timestamp > 86400000) { // 24小时
          localStorage.removeItem('last-payment');
        }
      }
    } catch (e) {
      console.log('本地存储清理失败');
    }
  }
}

// ========== 全局初始化 - 简化逻辑 ==========
function initPaySystem() {
  if (window.wwPayInitialized) return;
  window.wwPayInitialized = true;
  
  try {
    // 简化URL处理
    const urlParams = new URLSearchParams(window.location.search);
    const wishId = urlParams.get('wish_id');
    
    if (urlParams.get('fulfillment_success') === 'true' && wishId) {
      showFulfillmentNotification(wishId);
    }

    if (!window.wwPay) {
      window.wwPay = new WWPay();
    }
  } catch (e) {
    console.error('支付系统初始化失败:', e);
  }
}

function showFulfillmentNotification(wishId) {
  try {
    const notification = document.createElement('div');
    notification.className = 'fulfillment-notification';
    notification.textContent = '还愿已成功，愿望 #' + wishId + ' 已被移除';
    document.body.appendChild(notification);
    
    setTimeout(() => {
      try {
        notification.remove();
      } catch (e) {
        console.log('移除通知失败');
      }
    }, 3000);
  } catch (e) {
    console.error('显示通知失败:', e);
  }
}

// 安全启动
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(initPaySystem, 1000);
});

// 全局支付方法 - 简化接口
window.startWishPayment = function(wishId, amount, method) {
  if (!window.wwPay) {
    console.error('支付系统未初始化');
    return;
  }
  
  try {
    window.wwPay.state = {
      selectedAmount: amount,
      selectedMethod: method || 'alipay',
      currentWishId: wishId,
      processing: false,
      paymentCompleted: false
    };
    
    window.wwPay.processPayment();
  } catch (error) {
    console.error('启动支付失败:', error);
  }
};
