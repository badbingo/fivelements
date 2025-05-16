// pay.js - 签名修正版b
document.addEventListener('DOMContentLoaded', function() {
    // 配置参数
    const CONFIG = {
        pid: '2025051013380915',
        key: 'UsXrSwn0wft5SeLB0LaQfecvJmpkS18T', // 您的商户密钥
        apiUrl: 'https://zpayz.cn/submit.php',
        returnUrl: 'https://mybazi.net/system/bazisystem.html',
        notifyUrl: 'https://mybazi.net/system/bazisystem.html',
        amount: '0.01'
    };

    // 生成正确的支付签名
    function generateCorrectSign(params) {
        // 1. 过滤空值和sign/sign_type
        const signParams = {};
        Object.keys(params).forEach(key => {
            if (params[key] !== '' && key !== 'sign' && key !== 'sign_type') {
                signParams[key] = params[key];
            }
        });

        // 2. 按照ASCII码从小到大排序
        const sortedKeys = Object.keys(signParams).sort();

        // 3. 拼接成URL键值对格式
        let signStr = '';
        sortedKeys.forEach((key, index) => {
            signStr += (index === 0 ? '' : '&') + key + '=' + signParams[key];
        });

        // 4. 拼接商户密钥
        signStr += CONFIG.key;

        console.log('签名字符串:', signStr); // 调试用

        // 5. MD5加密并转为小写
        return CryptoJS.MD5(signStr).toString();
    }

    // 构建支付请求
    function buildPaymentRequest(name) {
        const requestData = {
            pid: CONFIG.pid,
            type: 'wxpay',
            out_trade_no: generateOrderNo(),
            notify_url: CONFIG.notifyUrl,
            return_url: CONFIG.returnUrl,
            name: '八字测算-' + name.substring(0, 20),
            money: CONFIG.amount,
            param: encodeURIComponent(name),
            sign_type: 'MD5'
        };

        // 生成签名
        requestData.sign = generateCorrectSign(requestData);
        
        return requestData;
    }

    // 提交支付（保持不变）
    function submitPayment(data) {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = CONFIG.apiUrl;
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
    }

    // 支付按钮点击处理
    document.getElementById('pay-btn').addEventListener('click', function() {
        const name = document.getElementById('name').value.trim();
        if (!name) {
            alert('请输入您的姓名');
            return;
        }

        const paymentData = buildPaymentRequest(name);
        console.log('最终支付参数:', paymentData); // 调试用
        submitPayment(paymentData);
    });

    // 其他辅助函数（保持不变）
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

    function padZero(num) {
        return num < 10 ? '0' + num : num;
    }
});
