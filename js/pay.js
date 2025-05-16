// pay.js
document.addEventListener('DOMContentLoaded', function() {
    const calculateBtn = document.getElementById('calculate-btn');
    const savedProfilesList = document.getElementById('saved-profiles-list');
    
    // 检查是否已付费
    function checkPaymentStatus() {
        const paidUsers = JSON.parse(localStorage.getItem('paidUsers')) || [];
        const name = document.getElementById('name').value.trim();
        return paidUsers.includes(name);
    }
    
    // 保存付费用户
    function savePaidUser(name) {
        let paidUsers = JSON.parse(localStorage.getItem('paidUsers')) || [];
        if (!paidUsers.includes(name)) {
            paidUsers.push(name);
            localStorage.setItem('paidUsers', JSON.stringify(paidUsers));
            updateHistoryList();
        }
    }
    
    // 更新历史记录列表
    function updateHistoryList() {
        const paidUsers = JSON.parse(localStorage.getItem('paidUsers')) || [];
        savedProfilesList.innerHTML = '';
        
        if (paidUsers.length > 0) {
            savedProfilesList.innerHTML = '<div class="saved-profiles-title"><i class="fas fa-check-circle"></i> 已付费用户</div>';
            paidUsers.forEach(user => {
                const userEl = document.createElement('div');
                userEl.className = 'saved-profile';
                userEl.innerHTML = `<i class="fas fa-user"></i> ${user}`;
                savedProfilesList.appendChild(userEl);
            });
        } else {
            savedProfilesList.innerHTML = '<div class="no-history">暂无历史记录</div>';
        }
    }
    
    // 初始化检查
    updateHistoryList();
    
    // 支付函数
    function initiatePayment() {
        const name = document.getElementById('name').value.trim();
        const gender = document.getElementById('gender').value;
        const birthDate = document.getElementById('birth-date').value;
        const birthTime = document.getElementById('birth-time').value;
        
        if (!name || !gender || !birthDate || !birthTime) {
            alert('请填写完整信息后再进行支付');
            return;
        }
        
        if (checkPaymentStatus()) {
            alert('您已是付费用户，可以直接开始测算');
            return;
        }
        
        // 生成订单号
        const outTradeNo = 'bazi_' + Date.now() + Math.floor(Math.random() * 1000);
        
        // 支付参数
        const params = {
            pid: '2025051013380915',
            type: 'alipay',
            out_trade_no: outTradeNo,
            notify_url: 'https://mybazi.net/system/bazisystem.html',
            return_url: 'https://mybazi.net/system/bazisystem.html',
            name: '八字测算-' + name,
            money: '1.00',
            param: name
        };
        
        // 生成签名
        const sign = generateSign(params, 'UsXrSwn0wft5SeLB0LaQfecvJmpkS18T');
        params.sign = sign;
        params.sign_type = 'MD5';
        
        // 提交支付
        submitPayment(params);
    }
    
    // 生成签名
    function generateSign(params, key) {
        // 按参数名ASCII码从小到大排序
        const sortedKeys = Object.keys(params).sort();
        let signStr = '';
        
        sortedKeys.forEach((keyName, index) => {
            if (keyName !== 'sign' && keyName !== 'sign_type' && params[keyName] !== '') {
                if (index !== 0) signStr += '&';
                signStr += `${keyName}=${params[keyName]}`;
            }
        });
        
        // 拼接密钥并生成MD5
        signStr += key;
        return CryptoJS.MD5(signStr).toString();
    }
    
    // 提交支付
    function submitPayment(params) {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = 'https://zpayz.cn/submit.php';
        form.style.display = 'none';
        
        Object.keys(params).forEach(key => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = params[key];
            form.appendChild(input);
        });
        
        document.body.appendChild(form);
        form.submit();
    }
    
    // 处理支付回调
    function handlePaymentCallback() {
        const urlParams = new URLSearchParams(window.location.search);
        const tradeStatus = urlParams.get('trade_status');
        const name = urlParams.get('param');
        
        if (tradeStatus === 'TRADE_SUCCESS' && name) {
            savePaidUser(name);
            alert('支付成功！您现在可以开始测算');
        }
    }
    
    // 绑定事件
    calculateBtn.addEventListener('click', initiatePayment);
    
    // 页面加载时检查是否有支付回调
    handlePaymentCallback();
    
    // 如果已付费用户点击按钮，直接开始测算
    calculateBtn.addEventListener('click', function() {
        const name = document.getElementById('name').value.trim();
        if (checkPaymentStatus() && name) {
            // 这里可以调用原有的测算函数
            alert('开始测算...');
            // startCalculation(); // 假设这是原有的测算函数
        }
    });
});
