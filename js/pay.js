// pay.js - 支付功能实现

document.addEventListener('DOMContentLoaded', function() {
    const payBtn = document.getElementById('pay-btn');
    const calculateBtn = document.getElementById('calculate-btn');
    const savedProfilesList = document.getElementById('saved-profiles-list');
    
    // 检查本地存储中是否有已付费记录
    function checkPaymentStatus() {
        const paidUsers = JSON.parse(localStorage.getItem('paidUsers')) || [];
        const currentUser = document.getElementById('name').value.trim();
        
        if (currentUser && paidUsers.includes(currentUser)) {
            payBtn.style.display = 'none';
            calculateBtn.style.display = 'block';
        }
    }
    
    // 初始化时检查支付状态
    checkPaymentStatus();
    
    // 支付按钮点击事件
    payBtn.addEventListener('click', function() {
        const name = document.getElementById('name').value.trim();
        const birthDate = document.getElementById('birth-date').value;
        const birthTime = document.getElementById('birth-time').value;
        
        if (!name) {
            alert('请输入您的姓名');
            return;
        }
        
        if (!birthDate) {
            alert('请输入出生日期');
            return;
        }
        
        if (!birthTime) {
            alert('请选择出生时辰');
            return;
        }
        
        // 调用支付接口
        initiatePayment(name);
    });
    
    // 开始测算按钮点击事件
    calculateBtn.addEventListener('click', function() {
        const name = document.getElementById('name').value.trim();
        if (name) {
            // 记录已测算用户
            addToHistory(name);
            // 这里可以添加实际的测算逻辑
            alert('量子测算开始...');
        }
    });
    
    // 初始化支付
    function initiatePayment(name) {
        const pid = '2025051013380915';
        const key = 'UsXrSwn0wft5SeLB0LaQfecvJmpkS18T';
        const outTradeNo = generateOrderNo();
        const notifyUrl = encodeURIComponent('https://mybazi.net/system/bazisystem.html');
        const returnUrl = encodeURIComponent('https://mybazi.net/system/bazisystem.html');
        
        // 构造支付参数
        const params = {
            pid: pid,
            type: 'wxpay', // 只使用微信支付
            out_trade_no: outTradeNo,
            notify_url: notifyUrl,
            return_url: returnUrl,
            name: '八字测算-' + name,
            money: '0.01',
            param: name
        };
        
        // 生成签名
        params.sign = generateSign(params, key);
        params.sign_type = 'MD5';
        
        // 提交支付
        submitPayment(params);
    }
    
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
    
    // 补零函数
    function padZero(num) {
        return num < 10 ? '0' + num : num;
    }
    
    // 生成签名
    function generateSign(params, key) {
        // 过滤空值和sign/sign_type
        const filteredParams = {};
        for (const k in params) {
            if (params[k] !== '' && k !== 'sign' && k !== 'sign_type') {
                filteredParams[k] = params[k];
            }
        }
        
        // 按ASCII码排序
        const sortedKeys = Object.keys(filteredParams).sort();
        
        // 拼接字符串
        let signStr = '';
        sortedKeys.forEach((k, i) => {
            signStr += (i === 0 ? '' : '&') + k + '=' + filteredParams[k];
        });
        
        // 加上密钥并MD5加密
        signStr += key;
        return CryptoJS.MD5(signStr).toString();
    }
    
    // 提交支付
    function submitPayment(params) {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = 'https://zpayz.cn/submit.php';
        form.style.display = 'none';
        
        // 添加参数到form
        for (const key in params) {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = params[key];
            form.appendChild(input);
        }
        
        document.body.appendChild(form);
        form.submit();
    }
    
    // 添加到历史记录
    function addToHistory(name) {
        let paidUsers = JSON.parse(localStorage.getItem('paidUsers')) || [];
        if (!paidUsers.includes(name)) {
            paidUsers.push(name);
            localStorage.setItem('paidUsers', JSON.stringify(paidUsers));
        }
        
        // 更新历史记录显示
        updateHistoryDisplay();
    }
    
    // 更新历史记录显示
    function updateHistoryDisplay() {
        const paidUsers = JSON.parse(localStorage.getItem('paidUsers')) || [];
        savedProfilesList.innerHTML = '';
        
        paidUsers.forEach(user => {
            const item = document.createElement('div');
            item.className = 'saved-profile-item';
            item.innerHTML = `
                <div class="saved-profile-name">${user}</div>
                <div class="saved-profile-status">已付费用户</div>
            `;
            savedProfilesList.appendChild(item);
        });
    }
    
    // 检查URL中是否有支付成功参数
    function checkPaymentSuccess() {
        const urlParams = new URLSearchParams(window.location.search);
        const tradeStatus = urlParams.get('trade_status');
        const name = urlParams.get('param');
        
        if (tradeStatus === 'TRADE_SUCCESS' && name) {
            // 验证签名
            const sign = urlParams.get('sign');
            const pid = urlParams.get('pid');
            const money = urlParams.get('money');
            const outTradeNo = urlParams.get('out_trade_no');
            const tradeNo = urlParams.get('trade_no');
            const type = urlParams.get('type');
            
            const params = {
                pid: pid,
                money: money,
                out_trade_no: outTradeNo,
                trade_no: tradeNo,
                type: type,
                param: name,
                trade_status: tradeStatus
            };
            
            const key = 'UsXrSwn0wft5SeLB0LaQfecvJmpkS18T';
            const calculatedSign = generateSign(params, key);
            
            if (calculatedSign === sign) {
                // 签名验证通过，支付成功
                addToHistory(name);
                document.getElementById('pay-btn').style.display = 'none';
                document.getElementById('calculate-btn').style.display = 'block';
                
                // 清除URL参数
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        }
    }
    
    // 页面加载时检查支付成功
    checkPaymentSuccess();
    // 初始化历史记录显示
    updateHistoryDisplay();
});
