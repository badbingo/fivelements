// pay.js - 终极支付解决方案
document.addEventListener('DOMContentLoaded', function() {
    // 配置参数
    const CONFIG = {
        pid: '2025051013380915',
        key: 'UsXrSwn0wft5SeLB0LaQfecvJmpkS18T',
        apiUrl: 'https://zpayz.cn/submit.php',
        returnUrl: 'https://mybazi.net/system/bazisystem.html', // 绝对URL，不编码
        notifyUrl: 'https://mybazi.net/system/bazisystem.html', // 绝对URL，不编码
        amount: '1.00'
    };

    // DOM元素
    const payBtn = document.getElementById('pay-btn');
    const calculateBtn = document.getElementById('calculate-btn');
    const savedProfilesList = document.getElementById('saved-profiles-list');

    /* ========== 初始化 ========== */
    initPaymentSystem();

    function initPaymentSystem() {
        checkLocalPaymentStatus();
        processPaymentReturn();
        setupEventListeners();
    }

    /* ========== 支付核心逻辑 ========== */
    function startPayment() {
        const name = document.getElementById('name').value.trim();
        if (!validateInputs(name)) return;

        if (checkAlreadyPaid(name)) {
            togglePaymentUI(false);
            return;
        }

        const paymentData = buildPaymentRequest(name);
        submitPayment(paymentData);
        startPaymentMonitor(paymentData.out_trade_no, name);
    }

    function buildPaymentRequest(name) {
        return {
            pid: CONFIG.pid,
            type: 'wxpay',
            out_trade_no: generateOrderNo(),
            notify_url: CONFIG.notifyUrl, // 不编码完整URL
            return_url: CONFIG.returnUrl, // 不编码完整URL
            name: `八字测算-${name.substring(0, 20)}`,
            money: CONFIG.amount,
            param: encodeURIComponent(name), // 只编码参数值
            sign_type: 'MD5',
            sign: '' // 临时留空
        };
    }

    /* ========== 支付结果处理 ========== */
    function processPaymentReturn() {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('trade_status') === 'TRADE_SUCCESS') {
            verifyAndProcessPayment(urlParams);
        }
    }

    function verifyAndProcessPayment(urlParams) {
        const paymentParams = extractPaymentParams(urlParams);
        
        if (validatePaymentSignature(paymentParams, urlParams.get('sign'))) {
            completePayment(decodeURIComponent(paymentParams.param));
            cleanUrl();
        }
    }

    function extractPaymentParams(urlParams) {
        const params = {
            pid: urlParams.get('pid'),
            trade_no: urlParams.get('trade_no'),
            out_trade_no: urlParams.get('out_trade_no'),
            type: urlParams.get('type'),
            name: urlParams.get('name'),
            money: urlParams.get('money'),
            trade_status: urlParams.get('trade_status'),
            param: urlParams.get('param'),
            sign_type: urlParams.get('sign_type')
        };
        
        // 过滤空值
        return Object.fromEntries(
            Object.entries(params).filter(([_, v]) => v)
        );
    }

    /* ========== 支付工具函数 ========== */
    function generateOrderNo() {
        const now = new Date();
        return `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}` +
               `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}` +
               `${Math.floor(Math.random()*9000)+1000}`;
    }

    function generateSign(params, key) {
        const signStr = Object.keys(params)
            .sort()
            .map(k => `${k}=${params[k]}`)
            .join('&') + key;
        return CryptoJS.MD5(signStr).toString();
    }

    function submitPayment(data) {
        // 深拷贝避免修改原对象
        const postData = JSON.parse(JSON.stringify(data));
        postData.sign = generateSign(postData, CONFIG.key);

        console.log('提交支付数据:', postData);

        // 使用form提交避免URL编码问题
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = CONFIG.apiUrl;
        form.style.display = 'none';

        Object.entries(postData).forEach(([key, value]) => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = value;
            form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
        setTimeout(() => form.remove(), 1000);
    }

    /* ========== 支付状态监控 ========== */
    function startPaymentMonitor(orderNo, name) {
        let checks = 0;
        const maxChecks = 5;
        const checkInterval = 3000;

        const monitor = setInterval(() => {
            checks++;
            console.log(`支付状态检查 (${checks}/${maxChecks})`);

            if (checks >= maxChecks || checkLocalPaymentStatus(name)) {
                clearInterval(monitor);
            }
        }, checkInterval);
    }

    /* ========== 支付完成处理 ========== */
    function completePayment(name) {
        if (!name) return;

        // 记录支付状态
        const paidUsers = JSON.parse(localStorage.getItem('paidUsers')) || [];
        if (!paidUsers.includes(name)) {
            paidUsers.push(name);
            localStorage.setItem('paidUsers', JSON.stringify(paidUsers));
        }

        // 更新UI
        togglePaymentUI(false);
        updateHistoryDisplay();
        
        // 显示成功提示
        alert(`${name}，支付成功！您现在可以开始量子测算`);
    }

    /* ========== 辅助函数 ========== */
    function validateInputs(name) {
        if (!name) {
            alert('请输入您的姓名');
            return false;
        }
        if (!document.getElementById('birth-date').value) {
            alert('请输入出生日期');
            return false;
        }
        if (!document.getElementById('birth-time').value) {
            alert('请选择出生时辰');
            return false;
        }
        return true;
    }

    function checkAlreadyPaid(name) {
        const paidUsers = JSON.parse(localStorage.getItem('paidUsers')) || [];
        return paidUsers.includes(name);
    }

    function checkLocalPaymentStatus(name) {
        if (name && checkAlreadyPaid(name)) {
            togglePaymentUI(false);
            return true;
        }
        return false;
    }

    function validatePaymentSignature(params, receivedSign) {
        const calculatedSign = generateSign(params, CONFIG.key);
        console.log('签名验证:', { params, calculatedSign, receivedSign });
        return calculatedSign === receivedSign;
    }

    function togglePaymentUI(showPayBtn) {
        payBtn.style.display = showPayBtn ? 'block' : 'none';
        calculateBtn.style.display = showPayBtn ? 'none' : 'block';
    }

    function updateHistoryDisplay() {
        const paidUsers = JSON.parse(localStorage.getItem('paidUsers')) || [];
        savedProfilesList.innerHTML = paidUsers.map(user => `
            <div class="saved-profile-item">
                <div class="saved-profile-name">${user}</div>
                <div class="saved-profile-status">已付费用户</div>
            </div>
        `).join('');
    }

    function cleanUrl() {
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    function pad(num) {
        return num < 10 ? `0${num}` : num;
    }

    /* ========== 事件监听 ========== */
    function setupEventListeners() {
        payBtn.addEventListener('click', startPayment);
        
        calculateBtn.addEventListener('click', () => {
            const name = document.getElementById('name').value.trim();
            if (name) {
                alert(`开始为 ${name} 进行量子测算...`);
                // 实际测算逻辑
            }
        });
    }
});
