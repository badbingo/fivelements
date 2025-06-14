/**
 * 命缘池支付系统 - 优化版 v5.2.0
 * 重构支付逻辑，参考 gamepay.js 的最佳实践
 * 主要改进：
 * - 简化支付流程
 * - 添加支付签名验证
 * - 直接对接支付网关
 * - 增强错误处理
 */

class WWPay {
  constructor() {
    // 支付系统配置
    this.config = {
      // 支付网关配置
      paymentGateway: {
        apiUrl: 'https://zpayz.cn/submit.php',
        pid: '2025051013380915',
        key: 'UsXrSwn0wft5SeLB0LaQfecvJmpkS18T',
        signType: 'MD5',
        successUrl: 'https://mybazi.net/system/bazisystem.html'
      },
      
      // 支付方式配置
      paymentMethods: {
        wxpay: {
          name: '微信支付',
          icon: 'fab fa-weixin',
          color: '#09bb07',
          type: 'wxpay'
        },
        alipay: {
          name: '支付宝',
          icon: 'fab fa-alipay',
          color: '#1677ff',
          type: 'alipay'
        }
      },
      
      // 调试模式
      debug: true
    };

    // 状态变量
    this.state = {
      selectedAmount: null,
      selectedMethod: 'wxpay', // 默认微信支付
      currentWishId: null,
      processing: false
    };

    // 初始化
    this.initEventListeners();
    this.log('支付系统初始化完成');
  }

  /* ========== 初始化方法 ========== */

  initEventListeners() {
    // 使用事件委托处理所有支付相关交互
    document.addEventListener('click', (e) => {
      try {
        // 还愿金额选择
        const fulfillOption = e.target.closest('.fulfill-option');
        if (fulfillOption) {
          this.handleFulfillOptionClick(fulfillOption);
          return;
        }

        // 支付方式选择
        const methodBtn = e.target.closest('.payment-method-btn');
        if (methodBtn) {
          this.handlePaymentMethodSelect(methodBtn);
          return;
        }

        // 确认支付按钮
        const confirmBtn = e.target.closest('#confirm-payment-btn');
        if (confirmBtn) {
          this.processPayment();
        }
      } catch (error) {
        this.handleError('事件处理出错', error);
      }
    });
  }

  /* ========== 核心支付方法 ========== */

  /**
   * 生成订单ID (格式: yyyyMMddHHmmss + 4位随机数)
   */
  generateOrderId() {
    const now = new Date();
    return `${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}${now.getHours().toString().padStart(2,'0')}${now.getMinutes().toString().padStart(2,'0')}${now.getSeconds().toString().padStart(2,'0')}${Math.floor(Math.random()*9000)+1000}`;
  }

  /**
   * 生成支付签名
   */
  generateSignature(params) {
    const filtered = {};
    Object.keys(params)
      .filter(k => params[k] !== '' && !['sign', 'sign_type'].includes(k))
      .sort()
      .forEach(k => filtered[k] = params[k]);
    
    const signStr = Object.entries(filtered)
      .map(([k, v]) => `${k}=${v}`)
      .join('&') + this.config.paymentGateway.key;
    
    return CryptoJS.MD5(signStr).toString();
  }

  /**
   * 创建支付订单并提交
   */
  async createPaymentOrder() {
    try {
      const orderId = this.generateOrderId();
      
      const paymentData = {
        pid: this.config.paymentGateway.pid,
        type: this.state.selectedMethod,
        out_trade_no: orderId,
        notify_url: location.href, // 支付结果通知地址
        return_url: this.config.paymentGateway.successUrl,
        name: `还愿-${this.state.currentWishId}`,
        money: this.state.selectedAmount,
        param: encodeURIComponent(JSON.stringify({
          wishId: this.state.currentWishId,
          amount: this.state.selectedAmount
        })),
        sign_type: this.config.paymentGateway.signType
      };
      
      // 生成签名
      paymentData.sign = this.generateSignature(paymentData);
      
      // 提交支付
      await this.submitPaymentForm(paymentData);
      
      return { success: true, orderId };
    } catch (error) {
      console.error('创建支付订单失败:', error);
      throw new Error(`创建订单失败: ${error.message}`);
    }
  }

  /**
   * 提交支付表单
   */
  async submitPaymentForm(paymentData) {
    return new Promise((resolve, reject) => {
      try {
        this.showLoading('正在准备支付...');
        
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = this.config.paymentGateway.apiUrl;
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
        
        // 小延迟确保表单提交
        setTimeout(resolve, 100);
      } catch (error) {
        reject(error);
      }
    });
  }

  /* ========== 支付流程处理 ========== */

  handleFulfillOptionClick(optionElement) {
    try {
      if (!optionElement || !optionElement.dataset) {
        throw new Error('无效的选项元素');
      }

      const amount = optionElement.dataset.amount;
      if (!amount || isNaN(Number(amount))) {
        throw new Error('金额必须是数字');
      }

      const modal = document.getElementById('fulfillModal');
      if (!modal) throw new Error('找不到还愿模态框');
      
      const wishId = modal.dataset.wishId;
      if (!wishId) throw new Error('未关联愿望ID');

      // 更新状态
      this.state = {
        ...this.state,
        selectedAmount: amount,
        currentWishId: wishId
      };

      // 显示支付方式
      this.showPaymentMethods();
      
    } catch (error) {
      this.handleError('处理还愿选项失败', error);
      this.showToast(`操作失败: ${error.message}`, 'error');
    }
  }

  showPaymentMethods() {
    try {
      // 清理旧元素
      const oldSection = document.getElementById('payment-methods-section');
      if (oldSection) oldSection.remove();
      
      // 创建支付面板
      const methodsHtml = `
        <div class="payment-methods" id="payment-methods-section">
          <h4><i class="fas fa-wallet"></i> 选择支付方式</h4>
          <div class="payment-options">
            ${Object.entries(this.config.paymentMethods).map(([key, method]) => `
              <button class="payment-method-btn ${key === this.state.selectedMethod ? 'active' : ''}" 
                      data-type="${method.type}" style="border-color: ${method.color}">
                <i class="${method.icon}" style="color: ${method.color}"></i> ${method.name}
              </button>
            `).join('')}
          </div>
          <div class="payment-actions">
            <button id="confirm-payment-btn" class="btn-confirm">
              <i class="fas fa-check-circle"></i> 确认支付 ${this.state.selectedAmount}元
            </button>
          </div>
        </div>
      `;
      
      // 插入到模态框
      const modalContent = document.querySelector('#fulfillModal .modal-content');
      if (modalContent) {
        modalContent.insertAdjacentHTML('beforeend', methodsHtml);
      } else {
        throw new Error('找不到模态框内容区域');
      }
    } catch (error) {
      this.handleError('支付方式显示失败', error);
      this.showToast('加载支付选项失败', 'error');
    }
  }

  handlePaymentMethodSelect(buttonElement) {
    try {
      const buttons = document.querySelectorAll('.payment-method-btn');
      buttons.forEach(btn => btn.classList.remove('active'));
      buttonElement.classList.add('active');
      this.state.selectedMethod = buttonElement.dataset.type;
    } catch (error) {
      this.handleError('选择支付方式失败', error);
    }
  }

  async processPayment() {
    // 验证状态
    if (!this.validatePaymentState()) return;

    try {
      this.state.processing = true;
      this.updateConfirmButtonState();
      
      // 创建并提交支付订单
      await this.createPaymentOrder();
      
      // 支付表单提交后会跳转到支付平台，此处不需要额外处理
      
    } catch (error) {
      this.handleError('支付处理失败', error);
      this.showToast(`支付失败: ${error.message}`, 'error');
    } finally {
      this.state.processing = false;
      this.updateConfirmButtonState();
    }
  }

  /* ========== 辅助方法 ========== */

  validatePaymentState() {
    if (!this.state.selectedAmount) {
      this.showToast('请选择还愿金额', 'error');
      return false;
    }
    if (!this.state.currentWishId) {
      this.showToast('无法识别当前愿望', 'error');
      return false;
    }
    return true;
  }

  updateConfirmButtonState() {
    const confirmBtn = document.getElementById('confirm-payment-btn');
    if (confirmBtn) {
      confirmBtn.disabled = this.state.processing;
      confirmBtn.innerHTML = this.state.processing 
        ? '<i class="fas fa-spinner fa-spin"></i> 处理中...' 
        : `<i class="fas fa-check-circle"></i> 确认支付 ${this.state.selectedAmount}元`;
    }
  }

  /* ========== UI 方法 ========== */

  showToast(message, type = 'info') {
    try {
      // 移除旧toast
      document.querySelectorAll('.wwpay-toast').forEach(el => el.remove());
      
      const icon = type === 'success' ? 'check-circle' : 
                  type === 'error' ? 'exclamation-circle' : 'info-circle';
      
      const toast = document.createElement('div');
      toast.className = `wwpay-toast toast ${type}`;
      toast.innerHTML = `
        <i class="fas fa-${icon}"></i>
        ${message}
      `;
      document.body.appendChild(toast);
      
      setTimeout(() => toast.classList.add('show'), 10);
      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
      }, 3000);
    } catch (error) {
      console.error('显示Toast失败:', error);
    }
  }

  showLoading(message = '处理中...') {
    try {
      this.hideLoading();
      
      this.loadingElement = document.createElement('div');
      this.loadingElement.className = 'wwpay-loading fullscreen-loading';
      this.loadingElement.innerHTML = `
        <div class="loading-content">
          <div class="loader"></div>
          <p>${message}</p>
        </div>
      `;
      
      document.body.appendChild(this.loadingElement);
    } catch (error) {
      console.error('显示加载状态失败:', error);
    }
  }

  hideLoading() {
    try {
      if (this.loadingElement) {
        this.loadingElement.remove();
        this.loadingElement = null;
      }
    } catch (error) {
      console.error('隐藏加载状态失败:', error);
    }
  }

  closeModal() {
    try {
      const modal = document.getElementById('fulfillModal');
      if (modal) modal.style.display = 'none';
    } catch (error) {
      console.error('关闭模态框失败:', error);
    }
  }

  /* ========== 工具方法 ========== */

  handleError(context, error) {
    console.error(`[WWPay] ${context}:`, error);
    this.log(`系统错误: ${error.message}`);
  }

  log(...messages) {
    if (this.config.debug) {
      console.log('[WWPay]', ...messages);
    }
  }
}

// 安全初始化
document.addEventListener('DOMContentLoaded', () => {
  try {
    if (!window.wwPay) {
      // 确保CryptoJS已加载
      if (typeof CryptoJS === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js';
        script.onload = () => {
          window.wwPay = new WWPay();
        };
        document.head.appendChild(script);
      } else {
        window.wwPay = new WWPay();
      }
    }
  } catch (error) {
    console.error('支付系统初始化失败:', error);
  }
});

// 暴露支付方法给全局
window.startWishPayment = function(wishId, amount, method = 'wxpay') {
  if (!window.wwPay) {
    console.error('支付系统未初始化');
    return;
  }
  
  window.wwPay.state = {
    selectedAmount: amount,
    selectedMethod: method,
    currentWishId: wishId,
    processing: false
  };
  
  window.wwPay.processPayment();
};
