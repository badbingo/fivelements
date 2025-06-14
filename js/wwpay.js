/**
 * 命缘池支付系统 - 完整修复版
 * 版本: 2.2.0
 * 修复内容:
 * 1. 移除SES依赖(harden)
 * 2. 修复金额选择错误
 * 3. 完善支付全流程
 * 4. 增强错误处理
 */

class WWPay {
  constructor() {
    // 支付系统配置
    this.config = {
      apiBase: 'https://bazi-backend.owenjass.workers.dev',
      paymentMethods: {
        wxpay: {
          name: '微信支付',
          icon: 'fab fa-weixin',
          color: '#09bb07'
        },
        alipay: {
          name: '支付宝',
          icon: 'fab fa-alipay',
          color: '#1677ff'
        }
      },
      paymentCheck: {
        maxRetries: 10,
        retryInterval: 2000
      }
    };

    // 状态变量
    this.state = {
      selectedAmount: null,
      selectedMethod: 'wxpay', // 默认微信支付
      currentWishId: null,
      paymentStatusCheck: null
    };

    // 初始化
    this.initEventListeners();
  }

  /* 初始化事件监听 */
  initEventListeners() {
    document.addEventListener('click', (e) => {
      // 还愿金额选择
      if (e.target.closest('.fulfill-option')) {
        this.handleFulfillOptionClick(e.target.closest('.fulfill-option'));
      }
      
      // 支付方式选择
      if (e.target.closest('.payment-method-btn')) {
        this.handlePaymentMethodSelect(e.target.closest('.payment-method-btn'));
      }
      
      // 确认支付按钮
      if (e.target.closest('#confirm-payment-btn')) {
        this.processPayment();
      }
    });
  }

  /* 处理还愿选项点击 */
  handleFulfillOptionClick(optionElement) {
    try {
      // 1. 获取金额
      const amount = optionElement.getAttribute('data-amount');
      if (!amount || isNaN(Number(amount))) {
        throw new Error('无效的金额值');
      }

      // 2. 获取愿望ID
      const modal = document.getElementById('fulfillModal');
      if (!modal) throw new Error('找不到还愿模态框');
      
      const wishId = modal.getAttribute('data-wish-id');
      if (!wishId) throw new Error('未关联愿望ID');

      // 3. 更新状态
      this.state = {
        ...this.state,
        selectedAmount: amount,
        currentWishId: wishId
      };

      console.log('[WWPay] 状态更新:', this.state);
      
      // 4. 显示支付方式
      this.showPaymentMethods();
      
    } catch (error) {
      console.error('[WWPay] 处理还愿选项失败:', error);
      this.showToast(`选择金额失败: ${error.message}`, 'error');
    }
  }

  /* 显示支付方式 */
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
                      data-type="${key}" style="border-color: ${method.color}">
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
      }
    } catch (error) {
      console.error('[WWPay] 支付方式显示失败:', error);
      this.showToast('加载支付选项失败', 'error');
    }
  }

  /* 处理支付方式选择 */
  handlePaymentMethodSelect(buttonElement) {
    try {
      const buttons = document.querySelectorAll('.payment-method-btn');
      buttons.forEach(btn => btn.classList.remove('active'));
      buttonElement.classList.add('active');
      this.state.selectedMethod = buttonElement.getAttribute('data-type');
    } catch (error) {
      console.error('[WWPay] 选择支付方式失败:', error);
    }
  }

  /* 处理支付流程 */
  async processPayment() {
    // 验证状态
    if (!this.validatePaymentState()) return;

    try {
      this.showLoading('正在创建支付订单...');
      
      // 1. 记录还愿意向
      const fulfillmentResponse = await this.recordFulfillment();
      if (!fulfillmentResponse.success) {
        throw new Error('还愿记录失败');
      }
      
      // 2. 创建支付订单
      const paymentResponse = await this.createPaymentOrder();
      if (!paymentResponse.success) {
        throw new Error(paymentResponse.error || '支付订单创建失败');
      }
      
      // 3. 处理支付
      if (this.state.selectedMethod === 'wxpay') {
        this.handleWechatPay(paymentResponse.paymentUrl);
      } else if (this.state.selectedMethod === 'alipay') {
        this.handleAlipay(paymentResponse.paymentUrl);
      }
    } catch (error) {
      console.error('[WWPay] 支付处理失败:', error);
      this.showToast(`支付失败: ${error.message}`, 'error');
      this.hideLoading();
    }
  }

  /* 微信支付处理 */
  handleWechatPay(paymentUrl) {
    try {
      this.showLoading('正在跳转微信支付...');
      const payWindow = window.open(paymentUrl, '_blank');
      if (!payWindow) {
        throw new Error('无法打开支付窗口，请允许弹窗');
      }
      this.checkPaymentStatus();
    } catch (error) {
      console.error('[WWPay] 微信支付处理失败:', error);
      this.showToast(error.message, 'error');
      this.hideLoading();
    }
  }

  /* 支付宝处理 */
  handleAlipay(paymentUrl) {
    try {
      this.showLoading('正在跳转支付宝...');
      window.location.href = paymentUrl;
    } catch (error) {
      console.error('[WWPay] 支付宝处理失败:', error);
      this.showToast('跳转支付宝失败', 'error');
      this.hideLoading();
    }
  }

  /* 支付状态检查 */
  async checkPaymentStatus() {
    this.clearPaymentStatusCheck();
    let retries = 0;
    
    this.state.paymentStatusCheck = setInterval(async () => {
      try {
        if (retries >= this.config.paymentCheck.maxRetries) {
          this.clearPaymentStatusCheck();
          this.showToast('支付超时，请检查支付状态', 'warning');
          this.hideLoading();
          return;
        }
        
        retries++;
        
        const response = await fetch(
          `${this.config.apiBase}/api/payments/status?wishId=${this.state.currentWishId}`
        );
        
        if (!response.ok) throw new Error('状态检查请求失败');
        
        const data = await response.json();
        if (data.status === 'success') {
          this.clearPaymentStatusCheck();
          this.paymentSuccess();
        } else if (data.status === 'failed') {
          this.clearPaymentStatusCheck();
          this.showToast(`支付失败: ${data.message || '未知错误'}`, 'error');
          this.hideLoading();
        }
      } catch (error) {
        console.error('[WWPay] 支付状态检查错误:', error);
      }
    }, this.config.paymentCheck.retryInterval);
  }

  /* 支付成功处理 */
  paymentSuccess() {
    try {
      this.showToast('支付成功！感谢您的还愿', 'success');
      this.closeModal();
      setTimeout(() => window.location.reload(), 3000);
    } catch (error) {
      console.error('[WWPay] 支付成功处理失败:', error);
    } finally {
      this.hideLoading();
      this.resetPaymentState();
    }
  }

  /* 辅助方法 */
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

  resetPaymentState() {
    this.state = {
      selectedAmount: null,
      selectedMethod: 'wxpay',
      currentWishId: null,
      paymentStatusCheck: null
    };
  }

  clearPaymentStatusCheck() {
    if (this.state.paymentStatusCheck) {
      clearInterval(this.state.paymentStatusCheck);
      this.state.paymentStatusCheck = null;
    }
  }

  /* UI 方法 */
  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `wwpay-toast toast ${type}`;
    toast.innerHTML = `
      <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
      ${message}
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  showLoading(message) {
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
  }

  hideLoading() {
    if (this.loadingElement) {
      this.loadingElement.remove();
      this.loadingElement = null;
    }
  }

  closeModal() {
    const modal = document.getElementById('fulfillModal');
    if (modal) modal.style.display = 'none';
  }
}

// 自动初始化
(function initWWPay() {
  if (typeof window !== 'undefined') {
    window.wwPay = new WWPay();
  }
})();
