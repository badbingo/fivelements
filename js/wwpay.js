wwpay.js代码
/**
 * 命缘池支付系统 - 稳定版
 * 版本: 5.1.0
 * 功能:
 * - 完整的支付流程处理
 * - 微信/支付宝支付支持
 * - 增强的错误处理
 * - 兼容性优化
 * - 解决第三方库冲突
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

  /* ========== 初始化方法 ========== */

  initEventListeners() {
    // 使用安全的事件委托
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
        console.error('事件处理出错:', error);
      }
    });
  }

  /* ========== 核心支付方法 ========== */

  async handleResponse(response) {
    let responseData;
    const text = await response.text();
    
    // 尝试解析JSON
    try {
      responseData = text ? JSON.parse(text) : {};
    } catch (e) {
      console.warn('响应不是有效的JSON:', text);
      responseData = { raw: text };
    }

    // 检查HTTP状态
    if (!response.ok) {
      const errorMsg = responseData.message || 
                      responseData.error || 
                      `请求失败: ${response.status} ${response.statusText}`;
      throw new Error(errorMsg);
    }

    return responseData;
  }

  async recordFulfillment() {
    try {
      if (!this.state.currentWishId || !this.state.selectedAmount) {
        throw new Error('无效的支付状态');
      }

      const url = `${this.config.apiBase}/api/wishes/fulfill`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({
          wishId: this.state.currentWishId,
          amount: this.state.selectedAmount,
          paymentMethod: this.state.selectedMethod
        })
      });
      
      const data = await this.handleResponse(response);
      
      if (!data.success) {
        throw new Error(data.message || '还愿记录失败');
      }
      
      return data;
    } catch (error) {
      console.error('记录还愿失败:', error);
      throw new Error(`记录还愿失败: ${error.message}`);
    }
  }

  async createPaymentOrder() {
    try {
      const url = `${this.config.apiBase}/api/payments/create`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({
          amount: this.state.selectedAmount,
          method: this.state.selectedMethod,
          wishId: this.state.currentWishId
        })
      });
      
      const data = await this.handleResponse(response);
      
      if (!data.success) {
        throw new Error(data.message || '支付订单创建失败');
      }
      
      if (!data.paymentUrl) {
        throw new Error('支付链接缺失');
      }
      
      return data;
    } catch (error) {
      console.error('创建支付订单失败:', error);
      throw new Error(`创建订单失败: ${error.message}`);
    }
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
        selectedAmount: amount,
        selectedMethod: this.state.selectedMethod,
        currentWishId: wishId,
        paymentStatusCheck: null
      };

      // 显示支付方式
      this.showPaymentMethods();
      
    } catch (error) {
      console.error('处理还愿选项失败:', error);
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
      } else {
        throw new Error('找不到模态框内容区域');
      }
    } catch (error) {
      console.error('支付方式显示失败:', error);
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
      console.error('选择支付方式失败:', error);
    }
  }

  async processPayment() {
    // 验证状态
    if (!this.validatePaymentState()) return;

    try {
      this.showLoading('正在创建支付订单...');
      
      // 1. 记录还愿意向
      const fulfillmentResponse = await this.recordFulfillment();
      
      // 2. 创建支付订单
      const paymentResponse = await this.createPaymentOrder();
      
      // 3. 处理支付
      if (this.state.selectedMethod === 'wxpay') {
        this.handleWechatPay(paymentResponse.paymentUrl);
      } else {
        this.handleAlipay(paymentResponse.paymentUrl);
      }
    } catch (error) {
      console.error('支付处理失败:', error);
      this.showToast(`支付失败: ${error.message}`, 'error');
      this.hideLoading();
    }
  }

  handleWechatPay(paymentUrl) {
    try {
      this.showLoading('正在跳转微信支付...');
      const payWindow = window.open(paymentUrl, '_blank');
      if (!payWindow) {
        throw new Error('无法打开支付窗口，请允许弹窗');
      }
      this.checkPaymentStatus();
    } catch (error) {
      console.error('微信支付处理失败:', error);
      this.showToast(error.message, 'error');
      this.hideLoading();
    }
  }

  handleAlipay(paymentUrl) {
    try {
      this.showLoading('正在跳转支付宝...');
      window.location.href = paymentUrl;
    } catch (error) {
      console.error('支付宝处理失败:', error);
      this.showToast('跳转支付宝失败', 'error');
      this.hideLoading();
    }
  }

  /* ========== 支付状态检查 ========== */

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
          `${this.config.apiBase}/api/payments/status?wishId=${this.state.currentWishId}`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
            }
          }
        );
        
        const data = await this.handleResponse(response);
        
        if (data.status === 'success') {
          this.clearPaymentStatusCheck();
          this.paymentSuccess();
        } else if (data.status === 'failed') {
          throw new Error(data.message || '支付失败');
        }
      } catch (error) {
        console.error('支付状态检查错误:', error);
        this.showToast(error.message, 'error');
        this.hideLoading();
        this.clearPaymentStatusCheck();
      }
    }, this.config.paymentCheck.retryInterval);
  }

  paymentSuccess() {
    try {
      this.showToast('支付成功！感谢您的还愿', 'success');
      this.closeModal();
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    } catch (error) {
      console.error('支付成功处理失败:', error);
    } finally {
      this.hideLoading();
      this.resetPaymentState();
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

  showLoading(message) {
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
}

// 安全初始化
document.addEventListener('DOMContentLoaded', () => {
  try {
    if (!window.wwPay) {
      window.wwPay = new WWPay();
      console.log('支付系统初始化成功');
    }
  } catch (error) {
    console.error('支付系统初始化失败:', error);
  }
});
