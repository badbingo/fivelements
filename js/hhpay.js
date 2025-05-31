// hhpay.js - 合婚测算支付系统
document.addEventListener('DOMContentLoaded', function() {
    // 配置参数
    const CONFIG = {
        pid: '2025051013380915',
        key: 'UsXrSwn0wft5SeLB0LaQfecvJmpkS18T',
        apiUrl: 'https://zpayz.cn/submit.php',
        returnUrl: window.location.href.split('?')[0],
        amount: '40.00'
    };

    // DOM元素
    const payBtn = document.getElementById('pay-btn');
    const calculateBtn = document.getElementById('calculate-btn');
    const maleNameInput = document.getElementById('male-name');
    const femaleNameInput = document.getElementById('female-name');
    const fullscreenLoading = document.getElementById('fullscreen-loading');
    const paymentSuccessAlert = document.getElementById('payment-success-alert');
    const recalculateBtn = document.getElementById('recalculate-btn');

    /* ========== 初始化 ========== */
    initPaymentSystem();

    function initPaymentSystem() {
        // 1. 检查URL支付回调
        checkPaymentReturn();
        
        // 2. 检查本地支付状态
        checkLocalPaymentStatus();
        
        // 3. 设置事件监听
        setupEventListeners();
    }

    /* ========== 支付状态检查 ========== */
    function checkPaymentReturn() {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('trade_status') === 'TRADE_SUCCESS') {
            const paymentData = {
                pid: urlParams.get('pid'),
                trade_no: urlParams.get('trade_no'),
                out_trade_no: urlParams.get('out_trade_no'),
                type: urlParams.get('type'),
                name: urlParams.get('name'),
                money: urlParams.get('money'),
                trade_status: urlParams.get('trade_status'),
                param: urlParams.get('param'),
                sign: urlParams.get('sign'),
                sign_type: urlParams.get('sign_type')
            };

            if (verifyPayment(paymentData)) {
                const userName = decodeURIComponent(paymentData.param || '');
                handlePaymentSuccess(userName);
                cleanUrl();
            }
        }
    }

    function checkLocalPaymentStatus() {
        const maleName = maleNameInput.value.trim();
        const femaleName = femaleNameInput.value.trim();
        if (maleName && femaleName && isPaidAndUnused(maleName + femaleName)) {
            showCalculateState();
        }
    }

    /* ========== 支付流程 ========== */
    function showPaymentOptions() {
        const maleName = maleNameInput.value.trim();
        const femaleName = femaleNameInput.value.trim();
        
        if (!validateNames(maleName, femaleName)) return;

        // 创建支付选择弹窗
        const paymentModal = document.createElement('div');
        paymentModal.className = 'payment-modal';
        paymentModal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
        `;

        const paymentContent = document.createElement('div');
        paymentContent.style.cssText = `
            background: white;
            padding: 30px;
            border-radius: 10px;
            width: 80%;
            max-width: 400px;
            text-align: center;
        `;

        const title = document.createElement('h3');
        title.textContent = '选择支付方式';
        title.style.marginBottom = '20px';

        const wxpayBtn = document.createElement('button');
        wxpayBtn.innerHTML = '<i class="fab fa-weixin"></i> 微信支付（仅限国内）';
        wxpayBtn.style.cssText = `
            display: block;
            width: 100%;
            padding: 12px;
            margin-bottom: 15px;
            background-color: #07C160;
            color: white;
            border: none;
            border-radius: 5px;
            font-size: 16px;
            cursor: pointer;
        `;
        wxpayBtn.onclick = () => startPayment('wxpay');

        const alipayBtn = document.createElement('button');
        alipayBtn.innerHTML = '<i class="fab fa-alipay"></i> 支付宝支付（全球支付）';
        alipayBtn.style.cssText = `
            display: block;
            width: 100%;
            padding: 12px;
            margin-bottom: 15px;
            background-color: #1677FF;
            color: white;
            border: none;
            border-radius: 5px;
            font-size: 16px;
            cursor: pointer;
        `;
        alipayBtn.onclick = () => startPayment('alipay');

        const closeBtn = document.createElement('button');
        closeBtn.textContent = '取消';
        closeBtn.style.cssText = `
            display: block;
            width: 100%;
            padding: 10px;
            background-color: #f5f5f5;
            color: #333;
            border: none;
            border-radius: 5px;
            font-size: 14px;
            cursor: pointer;
        `;
        closeBtn.onclick = () => document.body.removeChild(paymentModal);

        paymentContent.appendChild(title);
        paymentContent.appendChild(wxpayBtn);
        paymentContent.appendChild(alipayBtn);
        paymentContent.appendChild(closeBtn);
        paymentModal.appendChild(paymentContent);
        document.body.appendChild(paymentModal);
    }

    function startPayment(paymentType) {
        const maleName = maleNameInput.value.trim();
        const femaleName = femaleNameInput.value.trim();
        
        if (!validateNames(maleName, femaleName)) return;

        showFullscreenLoading(true);

        const paymentData = {
            pid: CONFIG.pid,
            type: paymentType, // 使用传入的支付类型
            out_trade_no: generateOrderNo(),
            notify_url: CONFIG.returnUrl,
            return_url: CONFIG.returnUrl,
            name: `合婚测算-${maleName.substring(0, 10)}&${femaleName.substring(0, 10)}`,
            money: CONFIG.amount,
            param: encodeURIComponent(maleName + '&' + femaleName),
            sign_type: 'MD5'
        };
        
        paymentData.sign = generateSign(paymentData);
        submitPaymentForm(paymentData);
    }

    function handlePaymentSuccess(names) {
        const [maleName, femaleName] = names.split('&');
        
        // 1. 存储支付状态
        localStorage.setItem(`paid_${maleName + femaleName}`, 'true');
        localStorage.removeItem(`used_${maleName + femaleName}`);
        
        // 2. 自动填充用户名
        maleNameInput.value = maleName;
        femaleNameInput.value = femaleName;
        
        // 3. 立即更新按钮状态
        showCalculateState();
        
        // 4. 显示成功提示
        showPaymentSuccessAlert();
        
        // 5. 隐藏loading
        showFullscreenLoading(false);
        
        // 6. 移除支付选择弹窗（如果有）
        const modal = document.querySelector('.payment-modal');
        if (modal) document.body.removeChild(modal);
    }

    /* ========== 测算流程 ========== */
    function startCalculation() {
        const maleName = maleNameInput.value.trim();
        const femaleName = femaleNameInput.value.trim();
        
        if (!validateCalculationInputs(maleName, femaleName)) return;

        // 标记为已使用测算
        localStorage.setItem(`used_${maleName + femaleName}`, 'true');
        
        // 执行测算
        executeHeHunCalculation();
    }

    function resetToPayState() {
        payBtn.style.display = 'block';
        calculateBtn.style.display = 'none';
    }

    function showCalculateState() {
        payBtn.style.display = 'none';
        calculateBtn.style.display = 'block';
    }

    /* ========== UI控制 ========== */
    function updateButtonState() {
        const maleName = maleNameInput.value.trim();
        const femaleName = femaleNameInput.value.trim();
        
        if (!maleName || !femaleName) {
            resetToPayState();
            return;
        }

        if (isPaidAndUnused(maleName + femaleName)) {
            showCalculateState();
        } else {
            resetToPayState();
        }
    }

    function showFullscreenLoading(show) {
        fullscreenLoading.style.display = show ? 'flex' : 'none';
    }

    function showPaymentSuccessAlert() {
        paymentSuccessAlert.style.display = 'block';
        setTimeout(() => {
            paymentSuccessAlert.style.display = 'none';
        }, 3000);
    }

    /* ========== 工具函数 ========== */
    function isPaidAndUnused(names) {
        return localStorage.getItem(`paid_${names}`) && 
              !localStorage.getItem(`used_${names}`);
    }

    function validateNames(maleName, femaleName) {
        if (!maleName || !femaleName) {
            alert('请输入双方姓名');
            showFullscreenLoading(false);
            return false;
        }
        return true;
    }

    function validateCalculationInputs(maleName, femaleName) {
        if (!maleName || !femaleName) {
            alert('请输入双方姓名');
            return false;
        }
        
        // 检查日期等其他必填项
        const maleDate = document.getElementById('male-birth-date').value;
        const femaleDate = document.getElementById('female-birth-date').value;
        const maleTime = document.getElementById('male-birth-time').value;
        const femaleTime = document.getElementById('female-birth-time').value;
        
        if (!maleDate || !femaleDate || !maleTime || !femaleTime) {
            alert('请填写完整的出生日期和时辰');
            return false;
        }
        
        return true;
    }

    function generateSign(params) {
        const filtered = {};
        Object.keys(params).forEach(k => {
            if (params[k] !== '' && k !== 'sign' && k !== 'sign_type') {
                filtered[k] = params[k];
            }
        });
        
        const signStr = Object.keys(filtered).sort()
            .map(k => `${k}=${filtered[k]}`)
            .join('&') + CONFIG.key;
        
        return CryptoJS.MD5(signStr).toString();
    }

    function verifyPayment(paymentData) {
        const sign = paymentData.sign;
        delete paymentData.sign;
        
        const calculatedSign = generateSign(paymentData);
        return calculatedSign === sign;
    }

    function generateOrderNo() {
        const now = new Date();
        return `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}` +
               `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}` +
               `${Math.floor(Math.random()*9000)+1000}`;
    }

    function pad(num) {
        return num < 10 ? `0${num}` : num;
    }

    function cleanUrl() {
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    function submitPaymentForm(data) {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = CONFIG.apiUrl;
        form.style.display = 'none';

        Object.entries(data).forEach(([key, value]) => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = value;
            form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
    }

    function executeHeHunCalculation() {
        // 这里调用原有的合婚测算逻辑
        // 假设原有逻辑在hehun.js中实现
        calculateCompatibility();
    }

    /* ========== 事件监听 ========== */
    function setupEventListeners() {
        // 支付按钮 - 现在显示支付选择弹窗
        payBtn.addEventListener('click', showPaymentOptions);
        
        // 测算按钮
        calculateBtn.addEventListener('click', startCalculation);
        
        // 重新测算按钮
        if (recalculateBtn) {
            recalculateBtn.addEventListener('click', function() {
                // 清除支付状态
                const maleName = maleNameInput.value.trim();
                const femaleName = femaleNameInput.value.trim();
                if (maleName && femaleName) {
                    localStorage.removeItem(`paid_${maleName + femaleName}`);
                    localStorage.removeItem(`used_${maleName + femaleName}`);
                }
                
                // 重置按钮状态
                resetToPayState();
                
                // 跳回输入部分
                document.getElementById('input-section').scrollIntoView();
            });
        }
        
        // 输入变化时更新状态
        maleNameInput.addEventListener('input', updateButtonState);
        femaleNameInput.addEventListener('input', updateButtonState);
        
        // 页面显示时检查状态
        window.addEventListener('pageshow', updateButtonState);
    }
});
