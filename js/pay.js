// pay.js - 终极优化版
document.addEventListener('DOMContentLoaded', function() {
    // 配置参数
    const CONFIG = {
        pid: '2025051013380915',
        key: 'UsXrSwn0wft5SeLB0LaQfecvJmpkS18T',
        apiUrl: 'https://zpayz.cn/submit.php',
        returnUrl: window.location.href.split('?')[0],
        amount: '1.00'
    };

    // DOM元素
    const payBtn = document.getElementById('pay-btn');
    const calculateBtn = document.getElementById('calculate-btn');
    const nameInput = document.getElementById('name');
    const fullscreenLoading = document.getElementById('fullscreen-loading');

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
        if (!userName) {
            alert('请输入您的姓名');
            return;
        }

        // 显示全屏loading
        fullscreenLoading.style.display = 'flex';

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

    function submitPayment(data) {
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
        
        // 5秒后自动隐藏loading（防止卡死）
        setTimeout(() => {
            fullscreenLoading.style.display = 'none';
        }, 5000);
    }

    /* ========== 支付成功处理 ========== */
    function handlePaymentSuccess(userName) {
        fullscreenLoading.style.display = 'none';
        localStorage.setItem(`paid_${userName}`, 'true');
        localStorage.removeItem(`used_${userName}`);
        updateButtonState();
    }

    function handleCalculationStart() {
        const userName = nameInput.value.trim();
        if (!userName) return;
        
        // 执行测算逻辑
        startQuantumCalculation(userName);
    }

    /* ========== UI控制 ========== */
    function resetPayButton() {
        payBtn.style.display = 'block';
        calculateBtn.style.display = 'none';
    }

    function showCalculateButton() {
        payBtn.style.display = 'none';
        calculateBtn.style.display = 'block';
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

    function startQuantumCalculation(userName) {
        // 实际测算逻辑
        console.log(`开始测算: ${userName}`);
        // 可以在这里跳转到结果页或显示结果
    }

    /* ========== 事件监听 ========== */
    function setupEventListeners() {
        payBtn.addEventListener('click', startPayment);
        calculateBtn.addEventListener('click', handleCalculationStart);
        nameInput.addEventListener('input', updateButtonState);
        window.addEventListener('pageshow', updateButtonState);
    }
});
