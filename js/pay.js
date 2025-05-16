// pay.js - 使用现有loading样式版a
document.addEventListener('DOMContentLoaded', function() {
    // 配置参数
    const CONFIG = {
        pid: '2025051013380915',
        key: 'UsXrSwn0wft5SeLB0LaQfecvJmpkS18T',
        apiUrl: 'https://zpayz.cn/submit.php',
        returnUrl: window.location.href.split('?')[0],
        amount: '0.01'
    };

    // DOM元素
    const payBtn = document.getElementById('pay-btn');
    const calculateBtn = document.getElementById('calculate-btn');
    const nameInput = document.getElementById('name');

    /* ========== 初始化 ========== */
    initPaymentSystem();

    function initPaymentSystem() {
        checkPaymentReturn();
        updateButtonState();
        setupEventListeners();
    }

    /* ========== 支付状态管理 ========== */
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

    function updateButtonState() {
        const userName = nameInput.value.trim();
        if (!userName) {
            resetPayButton();
            return;
        }

        if (localStorage.getItem(`paid_${userName}`) && !localStorage.getItem(`used_${userName}`)) {
            showCalculateButton();
        } else {
            resetPayButton();
        }
    }

    /* ========== 支付操作 ========== */
    function startPayment() {
        const userName = nameInput.value.trim();
        if (!validateInputs(userName)) return;

        // 使用现有loading样式
        payBtn.innerHTML = '<div class="loading"></div> 支付处理中';
        payBtn.disabled = true;

        const paymentData = {
            pid: CONFIG.pid,
            type: 'wxpay',
            out_trade_no: generateOrderNo(),
            notify_url: CONFIG.returnUrl,
            return_url: CONFIG.returnUrl,
            name: `八字测算-${userName.substring(0, 20)}`,
            money: CONFIG.amount,
            param: encodeURIComponent(userName),
            sign_type: 'MD5'
        };
        
        paymentData.sign = generateSign(paymentData);
        submitPayment(paymentData);
    }

    /* ========== 支付成功处理 ========== */
    function handlePaymentSuccess(userName) {
        localStorage.setItem(`paid_${userName}`, 'true');
        localStorage.removeItem(`used_${userName}`);
        updateButtonState();
    }

    function handleCalculationStart() {
        const userName = nameInput.value.trim();
        if (!userName) return;
        
        // 使用现有loading样式
        calculateBtn.innerHTML = '<div class="loading"></div> 测算中';
        
        // 执行测算逻辑
        setTimeout(() => {
            localStorage.setItem(`used_${userName}`, 'true');
            calculateBtn.innerHTML = '<i class="fas fa-atom"></i> 开始量子测算';
            // 实际测算逻辑...
        }, 100);
    }

    /* ========== UI控制 ========== */
    function resetPayButton() {
        payBtn.innerHTML = '<i class="fas fa-credit-card"></i> 点击付款';
        payBtn.style.display = 'block';
        calculateBtn.style.display = 'none';
        payBtn.disabled = false;
    }

    function showCalculateButton() {
        payBtn.style.display = 'none';
        calculateBtn.style.display = 'block';
        calculateBtn.innerHTML = '<i class="fas fa-atom"></i> 开始量子测算';
    }

    /* ========== 工具函数 ========== */
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
        console.log('验证签名:', { paymentData, calculatedSign, receivedSign: sign });
        
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

    function validateInputs(userName) {
        if (!userName) {
            showPayButtonLoading(false);
            alert('请输入您的姓名');
            return false;
        }
        if (!document.getElementById('birth-date').value) {
            showPayButtonLoading(false);
            alert('请输入出生日期');
            return false;
        }
        if (!document.getElementById('birth-time').value) {
            showPayButtonLoading(false);
            alert('请选择出生时辰');
            return false;
        }
        return true;
    }

    /* ========== 事件监听 ========== */
    function setupEventListeners() {
        // 支付按钮
        payBtn.addEventListener('click', startPayment);
        
        // 测算按钮
        calculateBtn.addEventListener('click', handleCalculationStart);
        
        // 姓名输入变化时更新状态
        nameInput.addEventListener('input', updateButtonState);
        
        // 页面显示时检查状态
        window.addEventListener('pageshow', updateButtonState);
    }
});
