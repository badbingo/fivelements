/**
 * 命缘池支付系统 - 完整修复版
 * 版本: 2.1.0
 * 修复内容:
 * 1. 修复 createPaymentMethodsSection 方法缺失问题
 * 2. 完善还愿支付全流程
 * 3. 增强错误处理和状态管理
 * 4. 优化支付状态检查机制
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
          color: '#09bb07',
          handler: this.handleWechatPay.bind(this)
        },
        alipay: {
          name: '支付宝',
          icon: 'fab fa-alipay',
          color: '#1677ff',
          handler: this.handleAlipay.bind(this)
        }
      },
      // 支付状态检查配置
      paymentCheck: {
        maxRetries: 10,
        retryInterval: 2000 // 2秒
      }
    };

    // 状态变量
    this.state = {
      selectedAmount: null,
      selectedMethod: null,
      currentWishId: null,
      paymentStatusCheck: null
    };

    // 初始化
    this.safeInitialize();
  }

  /* 初始化方法 */
  safeInitialize() {
    try {
      if (document.readyState === 'complete' || document.readyState === 'interactive') {
        this.initEventListeners();
      } else {
        document.addEventListener('DOMContentLoaded', () => this.initEventListeners());
      }
      
      // 清理可能的旧实例
      window._wwPayCleanup?.();
      window._wwPayCleanup = this.cleanup.bind(this);
    } catch (error) {
      console.error('[WWPay] 初始化失败:', error);
    }
  }

  initEventListeners() {
    try {
      // 使用事件委托处理动态元素
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
        if (e.target.id === 'confirm-payment-btn') {
          this.processPayment();
        }
      });

      // 窗口关闭时清理
      window.addEventListener('beforeunload', () => this.cleanup());
    } catch (error) {
      console.error('[WWPay] 事件监听初始化失败:', error);
    }
  }

  /* 核心支付流程方法 */
  handleFulfillOptionClick(optionElement) {
  try {
    console.debug('[WWPay] 处理还愿选项点击', optionElement);
    
    // 验证点击元素
    if (!optionElement || !optionElement.dataset) {
      throw new Error('无效的选项元素');
    }

    // 获取金额
    const amount = optionElement.dataset.amount;
    if (!amount || isNaN(amount)) {
      throw new Error('无效的金额值');
    }

    // 获取愿望ID - 现在从模态框获取
    const modal = document.getElementById('fulfillModal');
    if (!modal) {
      throw new Error('还愿模态框未找到');
    }

    const wishId = modal.dataset.wishId;
    if (!wishId) {
      throw new Error('未关联愿望ID');
    }

    // 更新状态
    this.state = {
      ...this.state,
      selectedAmount: amount,
      currentWishId: wishId
    };

    console.debug('[WWPay] 更新后的状态:', this.state);
    
    // 显示支付方式
    this.showPaymentMethods();
    
  } catch (error) {
    console.error('[WWPay] 处理还愿选项失败:', error);
    this.showToast(`选择金额失败: ${error.message}`, 'error');
    
    // 调试信息
    console.debug('当前点击元素:', optionElement);
    console.debug('模态框状态:', document.getElementById('fulfillModal'));
  }
}
      
  showPaymentMethods() {
    try {
      const existingSection = document.getElementById('payment-methods-section');
      
      if (existingSection) {
        existingSection.style.display = 'block';
      } else {
        this.createPaymentMethodsSection();
      }
    } catch (error) {
      console.error('[WWPay] 显示支付方式失败:', error);
      this.showToast('加载支付选项失败', 'error');
    }
  }

  createPaymentMethodsSection() {
    try {
      // 清理旧元素
      const oldSection = document.getElementById('payment-methods-section');
      if (oldSection) oldSection.remove();
      
      // 创建新支付面板
      const methodsHtml = `
        <div class="payment-methods" id="payment-methods-section">
          <h4><i class="fas fa-wallet"></i> 选择支付方式</h4>
          <div class="payment-options">
            ${Object.entries(this.config.paymentMethods).map(([key, method]) => `
              <button class="payment-method-btn ${key === 'wxpay' ? 'active' : ''}" 
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
      const modalContent = document.querySelector('.modal-content');
      if (!modalContent) throw new Error('找不到模态框内容区域');
      
      modalContent.insertAdjacentHTML('beforeend', methodsHtml);
      
      // 设置默认支付方式
      const firstMethodBtn = modalContent.querySelector('.payment-method-btn');
      if (firstMethodBtn) {
        this.state.selectedMethod = firstMethodBtn.dataset.type;
      }
    } catch (error) {
      console.error('[WWPay] 创建支付面板失败:', error);
      this.showToast('创建支付选项失败', 'error');
      throw error;
    }
  }

  handlePaymentMethodSelect(buttonElement) {
    try {
      const buttons = document.querySelectorAll('.payment-method-btn');
      buttons.forEach(btn => btn.classList.remove('active'));
      buttonElement.classList.add('active');
      this.state.selectedMethod = buttonElement.dataset.type;
    } catch (error) {
      console.error('[WWPay] 选择支付方式失败:', error);
    }
  }

  async processPayment() {
    // 验证状态
    if (!this.validatePaymentState()) {
      return;
    }

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
      const paymentMethod = this.config.paymentMethods[this.state.selectedMethod];
      if (paymentMethod && typeof paymentMethod.handler === 'function') {
        paymentMethod.handler(paymentResponse.paymentUrl);
      } else {
        throw new Error('不支持的支付方式');
      }
    } catch (error) {
      console.error('[WWPay] 支付处理失败:', error);
      this.showToast(`支付失败: ${error.message}`, 'error');
      this.hideLoading();
    }
  }

  /* 支付处理方法 */
  async recordFulfillment() {
    try {
      const response = await fetch(`${this.config.apiBase}/api/fulfill`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wishId: this.state.currentWishId,
          amount: this.state.selectedAmount,
          paymentMethod: this.state.selectedMethod
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || '还愿记录请求失败');
      }
      
      return await response.json();
    } catch (error) {
      console.error('[WWPay] 记录还愿失败:', error);
      throw error;
    }
  }

  async createPaymentOrder() {
    try {
      const response = await fetch(`${this.config.apiBase}/api/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: this.state.selectedAmount,
          method: this.state.selectedMethod,
          wishId: this.state.currentWishId,
          timestamp: new Date().toISOString()
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || '支付订单创建失败');
      }
      
      return await response.json();
    } catch (error) {
      console.error('[WWPay] 创建支付订单失败:', error);
      throw error;
    }
  }

  handleWechatPay(paymentUrl) {
    try {
      this.showLoading('正在跳转微信支付...');
      
      // 新窗口打开支付
      const payWindow = window.open(paymentUrl, '_blank');
      
      if (!payWindow) {
        throw new Error('无法打开支付窗口，请允许弹窗');
      }
      
      // 开始检查支付状态
      this.checkPaymentStatus();
    } catch (error) {
      console.error('[WWPay] 微信支付处理失败:', error);
      this.showToast(error.message, 'error');
      this.hideLoading();
    }
  }

  handleAlipay(paymentUrl) {
    try {
      this.showLoading('正在跳转支付宝...');
      
      // 直接跳转支付
      window.location.href = paymentUrl;
    } catch (error) {
      console.error('[WWPay] 支付宝处理失败:', error);
      this.showToast('跳转支付宝失败', 'error');
      this.hideLoading();
    }
  }

  /* 支付状态检查 */
  async checkPaymentStatus() {
    // 清理之前的检查
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
          `${this.config.apiBase}/api/payments/status?wishId=${this.state.currentWishId}`,
          { credentials: 'include' }
        );
        
        if (!response.ok) {
          throw new Error('状态检查请求失败');
        }
        
        const data = await response.json();
        
        if (data.status === 'success') {
          this.clearPaymentStatusCheck();
          this.paymentSuccess();
        } else if (data.status === 'failed') {
          this.clearPaymentStatusCheck();
          this.showToast('支付失败: ' + (data.message || '未知错误'), 'error');
          this.hideLoading();
        }
        // 其他状态继续等待
      } catch (error) {
        console.error('[WWPay] 支付状态检查错误:', error);
      }
    }, this.config.paymentCheck.retryInterval);
  }

  /* 支付结果处理 */
  paymentSuccess() {
    try {
      this.showToast('支付成功！感谢您的还愿', 'success');
      
      // 关闭模态框
      this.closeModal();
      
      // 3秒后刷新页面
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    } catch (error) {
      console.error('[WWPay] 支付成功处理失败:', error);
    } finally {
      this.hideLoading();
      this.resetPaymentState();
    }
  }

  /* 工具方法 */
  validatePaymentState() {
    if (!this.state.selectedAmount) {
      this.showToast('请选择还愿金额', 'error');
      return false;
    }
    
    if (!this.state.selectedMethod) {
      this.showToast('请选择支付方式', 'error');
      return false;
    }
    
    if (!this.state.currentWishId) {
      this.showToast('无法识别当前愿望', 'error');
      return false;
    }
    
    return true;
  }

  resetPaymentState() {
    this.state.selectedAmount = null;
    this.state.selectedMethod = null;
    this.clearPaymentStatusCheck();
  }

  clearPaymentStatusCheck() {
    if (this.state.paymentStatusCheck) {
      clearInterval(this.state.paymentStatusCheck);
      this.state.paymentStatusCheck = null;
    }
  }

  /* UI 方法 */
  showToast(message, type = 'info') {
    try {
      // 移除旧toast
      document.querySelectorAll('.wwpay-toast').forEach(el => el.remove());
      
      const iconMap = {
        info: 'info-circle',
        success: 'check-circle',
        warning: 'exclamation-triangle',
        error: 'exclamation-circle'
      };
      
      const toast = document.createElement('div');
      toast.className = `wwpay-toast toast ${type}`;
      toast.innerHTML = `
        <i class="fas fa-${iconMap[type] || 'info-circle'}"></i>
        <span>${message}</span>
      `;
      
      document.body.appendChild(toast);
      
      // 动画显示
      setTimeout(() => toast.classList.add('show'), 10);
      
      // 3秒后自动消失
      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
      }, 3000);
    } catch (error) {
      console.error('[WWPay] 显示Toast失败:', error);
    }
  }

  showLoading(message) {
    try {
      if (!this.loadingElement) {
        this.loadingElement = document.createElement('div');
        this.loadingElement.className = 'wwpay-loading fullscreen-loading';
        this.loadingElement.innerHTML = `
          <div class="loading-content">
            <div class="loader"></div>
            <p>${message}</p>
          </div>
        `;
        document.body.appendChild(this.loadingElement);
      } else {
        this.loadingElement.querySelector('p').textContent = message;
        this.loadingElement.style.display = 'flex';
      }
    } catch (error) {
      console.error('[WWPay] 显示加载状态失败:', error);
    }
  }

  hideLoading() {
    try {
      if (this.loadingElement) {
        this.loadingElement.style.display = 'none';
      }
    } catch (error) {
      console.error('[WWPay] 隐藏加载状态失败:', error);
    }
  }

  closeModal() {
    try {
      const modal = document.getElementById('fulfillModal');
      if (modal) {
        modal.style.display = 'none';
      }
    } catch (error) {
      console.error('[WWPay] 关闭模态框失败:', error);
    }
  }

  /* 清理方法 */
  cleanup() {
    this.clearPaymentStatusCheck();
    
    if (this.loadingElement) {
      this.loadingElement.remove();
      this.loadingElement = null;
    }
    
    // 清理全局引用
    if (window._wwPayCleanup) {
      delete window._wwPayCleanup;
    }
  }
}

// 自动初始化
(function initWWPay() {
  try {
    // 清理旧实例
    if (window.wwPay && typeof window.wwPay.cleanup === 'function') {
      window.wwPay.cleanup();
    }
    
    // 创建新实例
    window.wwPay = new WWPay();
    
    // 确保卸载时清理
    window.addEventListener('beforeunload', () => {
      if (window.wwPay && typeof window.wwPay.cleanup === 'function') {
        window.wwPay.cleanup();
      }
    });
  } catch (error) {
    console.error('[WWPay] 全局初始化失败:', error);
  }
})();
