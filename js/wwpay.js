/**
 * 命缘池支付系统 - 感恩还愿充值功能
 * 文件路径：../js/wwpay.js
 * 修复版本：1.0.1
 * 修复内容：
 * 1. 统一方法命名为 createPaymentMethodsSection
 * 2. 添加构造函数初始化检查
 * 3. 增强错误处理
 * 4. 改进支付状态检查机制
 */

class WWPay {
  constructor() {
    // 初始化配置
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
    
    // 初始化状态变量
    this.selectedAmount = null;
    this.selectedMethod = null;
    this.loadingElement = null;
    this.paymentStatusInterval = null;
    
    // 安全初始化事件监听
    this.safeInit();
  }
  
  // 安全初始化方法
  safeInit() {
    try {
      if (document.readyState === 'complete' || document.readyState === 'interactive') {
        this.initEventListeners();
      } else {
        document.addEventListener('DOMContentLoaded', () => this.initEventListeners());
      }
    } catch (error) {
      console.error('支付系统初始化失败:', error);
    }
  }
  
  // 初始化事件监听
  initEventListeners() {
    try {
      document.addEventListener('click', (e) => {
        // 还愿金额选择
        if (e.target.closest('.fulfill-option')) {
          this.handleFulfillOptionClick(e.target.closest('.fulfill-option'));
        }
        
        // 支付方式选择
        if (e.target.closest('.payment-method-btn')) {
          this.handlePaymentMethodSelect(e.target.closest('.payment-method-btn'));
        }
        
        // 确认支付
        if (e.target.id === 'confirm-payment-btn') {
          this.processPayment();
        }
      });
    } catch (error) {
      console.error('事件监听初始化失败:', error);
    }
  }
  
  // 处理还愿金额选择
  handleFulfillOptionClick(option) {
    try {
      const options = document.querySelectorAll('.fulfill-option');
      options.forEach(opt => opt.classList.remove('selected'));
      option.classList.add('selected');
      
      this.selectedAmount = option.dataset.amount;
      this.showToast(`已选择 ${this.selectedAmount}元 还愿金额`, 'success');
      
      // 显示支付方式选择
      this.showPaymentMethods();
    } catch (error) {
      console.error('处理还愿金额选择失败:', error);
      this.showToast('选择金额失败，请重试', 'error');
    }
  }
  
  // 显示支付方式选择
  showPaymentMethods() {
    try {
      const paymentSection = document.getElementById('payment-methods-section');
      if (!paymentSection) {
        this.createPaymentMethodsSection();
      } else {
        paymentSection.style.display = 'block';
      }
    } catch (error) {
      console.error('显示支付方式失败:', error);
      this.showToast('加载支付方式失败', 'error');
    }
  }
  
  // 创建支付方式选择界面
  createPaymentMethodsSection() {
    try {
      // 如果已经存在则先移除
      const existingSection = document.getElementById('payment-methods-section');
      if (existingSection) {
        existingSection.remove();
      }
      
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
      if (modalContent) {
        modalContent.insertAdjacentHTML('beforeend', methodsHtml);
        
        // 默认选择第一个支付方式
        const firstMethodBtn = modalContent.querySelector('.payment-method-btn');
        if (firstMethodBtn) {
          this.selectedMethod = firstMethodBtn.dataset.type;
        }
      } else {
        throw new Error('未找到模态框内容区域');
      }
    } catch (error) {
      console.error('创建支付方式界面失败:', error);
      this.showToast('创建支付选项失败', 'error');
    }
  }
  
  // 处理支付方式选择
  handlePaymentMethodSelect(btn) {
    try {
      const buttons = document.querySelectorAll('.payment-method-btn');
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      this.selectedMethod = btn.dataset.type;
    } catch (error) {
      console.error('选择支付方式失败:', error);
    }
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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || '支付订单创建失败');
      }
      
      const data = await response.json();
      
      // 根据支付方式处理
      if (this.selectedMethod === 'wxpay') {
        this.handleWechatPay(data.paymentUrl);
      } else if (this.selectedMethod === 'alipay') {
        this.handleAlipay(data.paymentUrl);
      } else {
        throw new Error('不支持的支付方式');
      }
      
    } catch (error) {
      console.error('支付处理错误:', error);
      this.showToast(`支付失败: ${error.message}`, 'error');
      this.hideLoading();
    }
  }
  
  // 处理微信支付
  handleWechatPay(paymentUrl) {
    try {
      this.showLoading('正在跳转微信支付...');
      
      // 新窗口打开微信支付
      const payWindow = window.open(paymentUrl, '_blank');
      
      if (!payWindow) {
        throw new Error('无法打开支付窗口，请检查浏览器弹窗设置');
      }
      
      // 检查支付状态
      this.checkPaymentStatus();
      
    } catch (error) {
      console.error('微信支付处理失败:', error);
      this.showToast(error.message, 'error');
      this.hideLoading();
    }
  }
  
  // 处理支付宝支付
  handleAlipay(paymentUrl) {
    try {
      this.showLoading('正在跳转支付宝支付...');
      
      // 直接跳转到支付宝支付页面
      window.location.href = paymentUrl;
      
    } catch (error) {
      console.error('支付宝支付处理失败:', error);
      this.showToast('跳转支付宝失败', 'error');
      this.hideLoading();
    }
  }
  
  // 检查支付状态
  async checkPaymentStatus() {
    // 清除之前的检查间隔
    if (this.paymentStatusInterval) {
      clearInterval(this.paymentStatusInterval);
    }
    
    let retries = 0;
    const maxRetries = 10; // 最多尝试10次
    const retryInterval = 2000; // 每2秒检查一次
    
    this.paymentStatusInterval = setInterval(async () => {
      try {
        if (retries >= maxRetries) {
          clearInterval(this.paymentStatusInterval);
          this.showToast('支付超时，请检查支付状态', 'warning');
          this.hideLoading();
          return;
        }
        
        retries++;
        
        const response = await fetch(`${this.config.apiBase}/api/payments/status`, {
          credentials: 'include' // 确保携带cookie
        });
        
        if (!response.ok) {
          throw new Error('状态检查请求失败');
        }
        
        const data = await response.json();
        
        if (data.status === 'success') {
          clearInterval(this.paymentStatusInterval);
          this.paymentSuccess();
        } else if (data.status === 'failed') {
          clearInterval(this.paymentStatusInterval);
          this.showToast('支付失败: ' + (data.message || '未知错误'), 'error');
          this.hideLoading();
        }
        // 其他状态继续等待
        
      } catch (error) {
        console.error('支付状态检查错误:', error);
        // 网络错误等不增加重试次数
        retries = Math.max(retries, maxRetries - 1);
      }
    }, retryInterval);
  }
  
  // 支付成功处理
  paymentSuccess() {
    try {
      this.showToast('支付成功！感谢您的还愿', 'success');
      
      // 记录到数据库
      this.recordFulfillment();
      
      // 关闭模态框
      this.closeModal();
      
      // 3秒后刷新页面
      setTimeout(() => {
        window.location.reload();
      }, 3000);
      
    } catch (error) {
      console.error('支付成功处理失败:', error);
    } finally {
      this.hideLoading();
    }
  }
  
  // 记录还愿到数据库
  async recordFulfillment() {
    try {
      if (!this.selectedAmount || !this.selectedMethod) {
        console.warn('无法记录还愿: 缺少金额或支付方式');
        return;
      }
      
      const fulfillmentData = {
        amount: this.selectedAmount,
        paymentMethod: this.selectedMethod,
        timestamp: new Date().toISOString()
      };
      
      const response = await fetch(`${this.config.apiBase}/api/fulfillments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(fulfillmentData)
      });
      
      if (!response.ok) {
        throw new Error('记录还愿请求失败');
      }
      
    } catch (error) {
      console.error('记录还愿失败:', error);
    }
  }
  
  // 显示Toast消息
  showToast(message, type = 'info') {
    try {
      // 移除现有的toast
      const existingToasts = document.querySelectorAll('.wwpay-toast');
      existingToasts.forEach(toast => toast.remove());
      
      const icons = {
        info: 'info-circle',
        success: 'check-circle',
        warning: 'exclamation-triangle',
        error: 'exclamation-circle'
      };
      
      const toast = document.createElement('div');
      toast.className = `wwpay-toast toast ${type}`;
      toast.innerHTML = `
        <i class="fas fa-${icons[type] || 'info-circle'}"></i>
        <span>${message}</span>
      `;
      
      document.body.appendChild(toast);
      
      // 显示动画
      setTimeout(() => {
        toast.classList.add('show');
      }, 10);
      
      // 3秒后自动消失
      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
          toast.remove();
        }, 300);
      }, 3000);
      
    } catch (error) {
      console.error('显示Toast失败:', error);
    }
  }
  
  // 显示加载状态
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
      console.error('显示加载状态失败:', error);
    }
  }
  
  // 隐藏加载状态
  hideLoading() {
    try {
      if (this.loadingElement) {
        this.loadingElement.style.display = 'none';
      }
    } catch (error) {
      console.error('隐藏加载状态失败:', error);
    }
  }
  
  // 关闭模态框
  closeModal() {
    try {
      const modal = document.getElementById('fulfillModal');
      if (modal) {
        modal.style.display = 'none';
      }
    } catch (error) {
      console.error('关闭模态框失败:', error);
    }
  }
  
  // 清理资源
  cleanup() {
    if (this.paymentStatusInterval) {
      clearInterval(this.paymentStatusInterval);
    }
  }
}

// 安全初始化支付系统
(function initWWPay() {
  try {
    if (typeof window !== 'undefined') {
      // 清理旧实例
      if (window.wwPay && window.wwPay.cleanup) {
        window.wwPay.cleanup();
      }
      
      // 创建新实例
      window.wwPay = new WWPay();
      
      // 确保在页面卸载时清理
      window.addEventListener('beforeunload', () => {
        if (window.wwPay && window.wwPay.cleanup) {
          window.wwPay.cleanup();
        }
      });
    }
  } catch (error) {
    console.error('支付系统全局初始化失败:', error);
  }
})();
