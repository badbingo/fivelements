/**
 * 命缘池支付系统 - 感恩还愿充值功能
 * 文件路径：../js/wwpay.js
 */

class WWPay {
  constructor() {
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
      }
    };
    
    this.initEventListeners();
  }
  
  initEventListeners() {
    // 支付方式选择
    document.addEventListener('click', (e) => {
      if (e.target.closest('.fulfill-option')) {
        this.handleFulfillOptionClick(e.target.closest('.fulfill-option'));
      }
      
      if (e.target.closest('.payment-method-btn')) {
        this.handlePaymentMethodSelect(e.target.closest('.payment-method-btn'));
      }
      
      if (e.target.id === 'confirm-payment-btn') {
        this.processPayment();
      }
    });
  }
  
  // 处理还愿金额选择
  handleFulfillOptionClick(option) {
    const options = document.querySelectorAll('.fulfill-option');
    options.forEach(opt => opt.classList.remove('selected'));
    option.classList.add('selected');
    
    this.selectedAmount = option.dataset.amount;
    this.showToast(`已选择 ${this.selectedAmount}元 还愿金额`, 'success');
    
    // 显示支付方式选择
    this.showPaymentMethods();
  }
  
  // 显示支付方式选择
  showPaymentMethods() {
    const paymentSection = document.getElementById('payment-methods-section');
    if (!paymentSection) {
      this.createPaymentMethodsSection();
    } else {
      paymentSection.style.display = 'block';
    }
  }
  
  // 创建支付方式选择界面
  createPaymentMethods() {
    const methodsHtml = `
      <div class="payment-methods" id="payment-methods-section" style="display:none;">
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
            <i class="fas fa-check-circle"></i> 确认支付 ${this.selectedAmount}元
          </button>
        </div>
      </div>
    `;
    
    const modalContent = document.querySelector('.modal-content');
    modalContent.insertAdjacentHTML('beforeend', methodsHtml);
  }
  
  // 处理支付方式选择
  handlePaymentMethodSelect(btn) {
    const buttons = document.querySelectorAll('.payment-method-btn');
    buttons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    this.selectedMethod = btn.dataset.type;
  }
  
  // 处理支付流程
  async processPayment() {
    if (!this.selectedAmount || !this.selectedMethod) {
      this.showToast('请选择还愿金额和支付方式', 'error');
      return;
    }
    
    const paymentData = {
      amount: this.selectedAmount,
      method: this.selectedMethod,
      timestamp: new Date().toISOString(),
      type: 'fulfillment'
    };
    
    try {
      this.showLoading('正在创建支付订单...');
      
      // 调用后端API创建支付订单
      const response = await fetch(`${this.config.apiBase}/api/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentData)
      });
      
      if (!response.ok) {
        throw new Error('支付订单创建失败');
      }
      
      const data = await response.json();
      
      // 根据支付方式跳转到相应支付页面
      if (this.selectedMethod === 'wxpay') {
        this.handleWechatPay(data.paymentUrl);
      } else if (this.selectedMethod === 'alipay') {
        this.handleAlipay(data.paymentUrl);
      }
      
    } catch (error) {
      console.error('支付处理错误:', error);
      this.showToast(`支付失败: ${error.message}`, 'error');
      this.hideLoading();
    }
  }
  
  // 处理微信支付
  handleWechatPay(paymentUrl) {
    this.showLoading('正在跳转微信支付...');
    
    // 新窗口打开微信支付
    const payWindow = window.open(paymentUrl, '_blank');
    
    // 检查支付状态
    this.checkPaymentStatus(payWindow);
  }
  
  // 处理支付宝支付
  handleAlipay(paymentUrl) {
    this.showLoading('正在跳转支付宝支付...');
    
    // 直接跳转到支付宝支付页面
    window.location.href = paymentUrl;
  }
  
  // 检查支付状态
  async checkPaymentStatus(payWindow) {
    try {
      // 这里应该是轮询后端API检查支付状态
      // 简化示例，实际应该使用WebSocket或定时请求
      setTimeout(async () => {
        const response = await fetch(`${this.config.apiBase}/api/payments/status`);
        const data = await response.json();
        
        if (data.status === 'success') {
          this.paymentSuccess();
        } else {
          this.showToast('支付未完成，请检查支付状态', 'warning');
        }
        
        this.hideLoading();
      }, 3000);
      
    } catch (error) {
      console.error('支付状态检查错误:', error);
      this.hideLoading();
    }
  }
  
  // 支付成功处理
  paymentSuccess() {
    this.showToast('支付成功！感谢您的还愿', 'success');
    
    // 记录到数据库
    this.recordFulfillment();
    
    // 关闭模态框
    this.closeModal();
    
    // 刷新页面或更新UI
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  }
  
  // 记录还愿到数据库
  async recordFulfillment() {
    try {
      const fulfillmentData = {
        amount: this.selectedAmount,
        paymentMethod: this.selectedMethod,
        timestamp: new Date().toISOString()
      };
      
      await fetch(`${this.config.apiBase}/api/fulfillments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(fulfillmentData)
      });
      
    } catch (error) {
      console.error('记录还愿失败:', error);
    }
  }
  
  // 显示Toast消息
  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'check-circle'}"></i>
      ${message}
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('show');
      setTimeout(() => {
        toast.remove();
      }, 3000);
    }, 100);
  }
  
  // 显示加载状态
  showLoading(message) {
    if (!this.loadingElement) {
      this.loadingElement = document.createElement('div');
      this.loadingElement.className = 'fullscreen-loading';
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
  }
  
  // 隐藏加载状态
  hideLoading() {
    if (this.loadingElement) {
      this.loadingElement.style.display = 'none';
    }
  }
  
  // 关闭模态框
  closeModal() {
    const modal = document.getElementById('fulfillModal');
    if (modal) {
      modal.style.display = 'none';
    }
  }
}

// 初始化支付系统
document.addEventListener('DOMContentLoaded', () => {
  window.wwPay = new WWPay();
});
