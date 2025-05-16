// pay.js - 完整支付解决方案
document.addEventListener('DOMContentLoaded', function() {
    // DOM元素
    const payBtn = document.getElementById('pay-btn');
    const calculateBtn = document.getElementById('calculate-btn');
    const savedProfilesList = document.getElementById('saved-profiles-list');
    
    // 配置常量
    const PAY_CONFIG = {
        pid: '2025051013380915',
        key: 'UsXrSwn0wft5SeLB0LaQfecvJmpkS18T',
        apiUrl: 'https://zpayz.cn/submit.php',
        paymentAmount: '0.01'
    };

    /* ========== 核心功能 ========== */

    // 初始化支付检查
    function initPaymentCheck() {
        checkPaymentStatus();
        checkPaymentSuccess();
        updateHistoryDisplay();
        
        // 5秒后再次检查（防止异步延迟）
        setTimeout(checkPaymentSuccess, 5000);
    }

    // 检查本地支付状态
    function checkPaymentStatus() {
        const currentUser = document.getElementById('name').value.trim();
        if (currentUser && isUserPaid(currentUser)) {
            togglePaymentUI(false);
        }
    }

    // 检查URL中的支付成功参数
    function checkPaymentSuccess() {
        const urlParams = new URLSearchParams(window.location.search);
        const tradeStatus = urlParams.get('trade_status');
        
        if (tradeStatus === 'TRADE_SUCCESS') {
            const verifyParams = {
                pid: urlParams.get('pid'),
                trade_no: urlParams.get('trade_no'),
                out_trade_no: urlParams.get('out_trade_no'),
                type: urlParams.get('type'),
                name: urlParams.get('name'),
                money: urlParams.get('money'),
                trade_status: tradeStatus,
                param: urlParams.get('param'),
                sign_type: urlParams.get('sign_type')
            };

            // 过滤空值
            Object.keys(verifyParams).forEach(key => {
                if (!verifyParams[key]) delete verifyParams[key];
            });

            if (verifyPayment(verifyParams, urlParams.get('sign'))) {
                const name = decodeURIComponent(verifyParams.param || '');
                handleSuccessfulPayment(name);
                cleanUrlParams();
                return true;
            }
        }
        return false;
    }

    // 验证支付结果
    function verifyPayment(params, receivedSign) {
        const calculatedSign = generateSign(params, PAY_CONFIG.key);
        console.log('签名验证:', { params, calculatedSign, receivedSign });
        return calculatedSign === receivedSign;
    }

    // 处理支付成功
    function handleSuccessfulPayment(name) {
        if (!name) return;
        
        // 记录支付状态
        markUserAsPaid(name);
        
        // 更新UI
        togglePaymentUI(false);
        
        // 显示成功提示
        showPaymentSuccessAlert(name);
    }

    /* ========== 支付操作 ========== */

    // 初始化支付
    function initiatePayment(name) {
        const paymentData = {
            pid: PAY_CONFIG.pid,
            type: 'wxpay',
            out_trade_no: generateOrderNo(),
            notify_url: 'https://mybazi.net/system/bazisystem.html', // 不编码
            return_url: 'https://mybazi.net/system/bazisystem.html', // 不编码
            name: `八字测算-${name.substring(0, 20)}`,
            money: PAY_CONFIG.paymentAmount,
            param: encodeURIComponent(name),
            sign_type: 'MD5'
        };

        paymentData.sign = generateSign(paymentData, PAY_CONFIG.key);
        console.log('发起支付:', paymentData);
        
        submitPaymentForm(paymentData);
        startPaymentStatusCheck(paymentData.out_trade_no, name);
    }

    // 提交支付表单
    function submitPaymentForm(data) {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = PAY_CONFIG.apiUrl;
        form.style.display = 'none';
        
        Object.keys(data).forEach(key => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = data[key];
            form.appendChild(input);
        });
        
        document.body.appendChild(form);
        form.submit();
        setTimeout(() => form.remove(), 1000);
    }

    /* ========== 工具函数 ========== */

    // 生成订单号
    function generateOrderNo() {
        const now = new Date();
        return now.getFullYear() + 
               padZero(now.getMonth() + 1) + 
               padZero(now.getDate()) + 
               padZero(now.getHours()) + 
               padZero(now.getMinutes()) + 
               padZero(now.getSeconds()) + 
               Math.floor(Math.random() * 1000);
    }

    // 生成签名
    function generateSign(params, key) {
        // 过滤空值和sign/sign_type
        const filtered = {};
        Object.keys(params).forEach(k => {
            if (params[k] && k !== 'sign' && k !== 'sign_type') {
                filtered[k] = params[k];
            }
        });
        
        // 按ASCII码排序并拼接
        const signStr = Object.keys(filtered).sort()
            .map(k => `${k}=${filtered[k]}`)
            .join('&') + key;
        
        return CryptoJS.MD5(signStr).toString();
    }

    // 检查用户是否已支付
    function isUserPaid(name) {
        const paidUsers = JSON.parse(localStorage.getItem('paidUsers')) || [];
        return paidUsers.includes(name);
    }

    // 标记用户为已支付
    function markUserAsPaid(name) {
        const paidUsers = JSON.parse(localStorage.getItem('paidUsers')) || [];
        if (!paidUsers.includes(name)) {
            paidUsers.push(name);
            localStorage.setItem('paidUsers', JSON.stringify(paidUsers));
        }
    }

    // 更新支付UI状态
    function togglePaymentUI(isPaid) {
        payBtn.style.display = isPaid ? 'block' : 'none';
        calculateBtn.style.display = isPaid ? 'none' : 'block';
    }

    // 显示支付成功提示
    function showPaymentSuccessAlert(name) {
        alert(`${name}，支付成功！您现在可以开始量子测算`);
    }

    // 清除URL参数
    function cleanUrlParams() {
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    // 补零函数
    function padZero(num) {
        return num < 10 ? `0${num}` : num;
    }

    // 更新历史记录显示
    function updateHistoryDisplay() {
        const paidUsers = JSON.parse(localStorage.getItem('paidUsers')) || [];
        savedProfilesList.innerHTML = paidUsers.map(user => `
            <div class="saved-profile-item">
                <div class="saved-profile-name">${user}</div>
                <div class="saved-profile-status">已付费用户</div>
            </div>
        `).join('');
    }

    // 支付状态检查（备用方案）
    function startPaymentStatusCheck(outTradeNo, name) {
        let checks = 0;
        const maxChecks = 5;
        const interval = 3000;
        
        const timer = setInterval(() => {
            if (checks >= maxChecks || isUserPaid(name)) {
                clearInterval(timer);
                return;
            }
            
            checks++;
            console.log(`支付状态检查 (${checks}/${maxChecks})`);
            
            // 最后一次尝试检查URL参数
            if (checks === maxChecks && checkPaymentSuccess()) {
                clearInterval(timer);
            }
        }, interval);
    }

    /* ========== 事件监听 ========== */

    // 支付按钮点击
    payBtn.addEventListener('click', function() {
        const name = document.getElementById('name').value.trim();
        if (!name) {
            alert('请输入您的姓名');
            return;
        }
        
        if (isUserPaid(name)) {
            togglePaymentUI(false);
            return;
        }
        
        initiatePayment(name);
    });

    // 测算按钮点击
    calculateBtn.addEventListener('click', function() {
        const name = document.getElementById('name').value.trim();
        if (name) {
            alert(`开始为 ${name} 进行量子测算...`);
            // 这里添加实际测算逻辑
        }
    });

    // 初始化
    initPaymentCheck();
});
