// pay.js - 修改后的版本（每次测算都需要支付）

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
    const genderInput = document.getElementById('gender');
    const fullscreenLoading = document.getElementById('fullscreen-loading');
    const paymentSuccessAlert = document.getElementById('payment-success-alert');

    /* ========== 初始化 ========== */
    initPaymentSystem();

    function initPaymentSystem() {
        // 1. 检查URL支付回调
        checkPaymentReturn();
        
        // 2. 设置事件监听
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

    /* ========== 支付流程 ========== */
    function startPayment() {
        const userName = nameInput.value.trim();
        if (!validateName(userName)) return;

        showFullscreenLoading(true);

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
        submitPaymentForm(paymentData);
    }

    function handlePaymentSuccess(userName) {
        // 1. 自动填充用户名
        nameInput.value = userName;
        
        // 2. 显示"开始测算"按钮
        showCalculateState();
        
        // 3. 显示成功提示
        showPaymentSuccessAlert();
        
        // 4. 隐藏loading
        showFullscreenLoading(false);
    }

    /* ========== 测算流程 ========== */
    function startCalculation() {
        const userName = nameInput.value.trim();
        const gender = genderInput.value;
        
        if (!validateCalculationInputs(userName, gender)) return;
        
        // 执行测算
        executeQuantumCalculation(userName, gender);
    }

    /* ========== UI控制 ========== */
    function showCalculateState() {
        payBtn.style.display = 'none';
        calculateBtn.style.display = 'block';
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
    function validateName(name) {
        if (!name) {
            alert('请输入您的姓名');
            showFullscreenLoading(false);
            return false;
        }
        return true;
    }

    function validateCalculationInputs(name, gender) {
        if (!name) {
            alert('请输入姓名');
            return false;
        }
        if (!gender) {
            alert('请选择性别');
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

    function executeQuantumCalculation(name, gender) {
        console.log(`开始量子测算 - 姓名: ${name}, 性别: ${gender}`);
        // 实际测算逻辑...
    }

    /* ========== 事件监听 ========== */
    function setupEventListeners() {
        // 支付按钮
        payBtn.addEventListener('click', startPayment);
        
        // 测算按钮
        calculateBtn.addEventListener('click', startCalculation);
    }
});
