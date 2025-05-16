// pay.js - 终极解决方案
document.addEventListener('DOMContentLoaded', function() {
    // 配置参数
    const CONFIG = {
        pid: '2025051013380915',
        key: 'UsXrSwn0wft5SeLB0LaQfecvJmpkS18T',
        apiUrl: 'https://zpayz.cn/submit.php',
        returnUrl: window.location.origin + window.location.pathname, // 动态获取当前页URL
        amount: '1.00',
        paymentExpireTime: 30 * 60 * 1000 // 30分钟有效期
    };

    // DOM元素
    const payBtn = document.getElementById('pay-btn');
    const calculateBtn = document.getElementById('calculate-btn');
    const nameInput = document.getElementById('name');

    /* ========== 初始化 ========== */
    initPaymentSystem();

    function initPaymentSystem() {
        // 1. 检查URL中的支付回调
        checkUrlPaymentStatus();
        
        // 2. 检查本地支付状态
        checkLocalPaymentStatus();
        
        // 3. 设置事件监听
        setupEventListeners();
        
        // 4. 添加定时状态检查（每5秒）
        setInterval(checkLocalPaymentStatus, 5000);
    }

    /* ========== 支付状态检查 ========== */
    function checkUrlPaymentStatus() {
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
                handleSuccessfulPayment(userName);
                cleanUrl();
            }
        }
    }

    function checkLocalPaymentStatus() {
        const userName = nameInput.value.trim();
        if (!userName) return;
        
        if (getPaymentStatus(userName)) {
            showCalculateButton();
        } else {
            showPayButton();
        }
    }

    /* ========== 支付操作 ========== */
    function startPayment() {
        const userName = nameInput.value.trim();
        if (!validateInputs(userName)) return;
        
        // 构建支付数据
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
        
        // 生成签名
        paymentData.sign = generateSign(paymentData);
        
        console.log('提交支付数据:', paymentData);
        submitPaymentForm(paymentData);
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

    /* ========== 支付成功处理 ========== */
    function handleSuccessfulPayment(userName) {
        // 1. 记录支付状态
        setPaymentStatus(userName, true);
        
        // 2. 更新UI
        showCalculateButton();
        
        // 3. 显示成功提示
        alert(`${userName}，支付成功！您现在可以开始量子测算`);
    }

    /* ========== 状态管理 ========== */
    function setPaymentStatus(userName, isPaid) {
        if (!userName) return;
        
        // 使用sessionStorage存储当前会话状态
        if (isPaid) {
            sessionStorage.setItem('paidUser', userName);
            sessionStorage.setItem('paymentTime', Date.now());
        } else {
            sessionStorage.removeItem('paidUser');
        }
        
        // 使用localStorage存储长期记录
        const paidUsers = JSON.parse(localStorage.getItem('paidUsers')) || [];
        if (isPaid && !paidUsers.includes(userName)) {
            paidUsers.push(userName);
            localStorage.setItem('paidUsers', JSON.stringify(paidUsers));
        }
    }

    function getPaymentStatus(userName) {
        if (!userName) return false;
        
        // 1. 检查当前会话状态
        const paidUser = sessionStorage.getItem('paidUser');
        const paymentTime = sessionStorage.getItem('paymentTime');
        
        if (paidUser === userName) {
            // 检查是否过期
            if (Date.now() - paymentTime < CONFIG.paymentExpireTime) {
                return true;
            }
            sessionStorage.removeItem('paidUser');
        }
        
        // 2. 检查长期记录
        const paidUsers = JSON.parse(localStorage.getItem('paidUsers')) || [];
        return paidUsers.includes(userName);
    }

    /* ========== UI控制 ========== */
    function showPayButton() {
        payBtn.style.display = 'block';
        calculateBtn.style.display = 'none';
    }

    function showCalculateButton() {
        payBtn.style.display = 'none';
        calculateBtn.style.display = 'block';
    }

    /* ========== 工具函数 ========== */
    function generateSign(params) {
        // 过滤空值和签名相关字段
        const filtered = {};
        Object.keys(params).forEach(k => {
            if (params[k] !== '' && k !== 'sign' && k !== 'sign_type') {
                filtered[k] = params[k];
            }
        });
        
        // 按ASCII码排序并拼接
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

    /* ========== 事件监听 ========== */
    function setupEventListeners() {
        // 支付按钮
        payBtn.addEventListener('click', startPayment);
        
        // 测算按钮
        calculateBtn.addEventListener('click', function() {
            const userName = nameInput.value.trim();
            if (userName) {
                alert(`开始为 ${userName} 进行量子测算...`);
                // 实际测算逻辑...
            }
        });
        
        // 姓名输入变化时检查状态
        nameInput.addEventListener('input', checkLocalPaymentStatus);
    }
});
