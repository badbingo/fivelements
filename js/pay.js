// pay.js - 完整实现版
document.addEventListener('DOMContentLoaded', function() {
    // ==================== 配置常量 ====================
    const CONFIG = {
        pid: '2025051013380915',
        key: 'UsXrSwn0wft5SeLB0LaQfecvJmpkS18T',
        apiUrl: 'https://zpayz.cn/submit.php',
        returnUrl: window.location.href.split('?')[0],
        amount: '50.00'
    };

    // ==================== DOM元素 ====================
    const elements = {
        nameInput: document.getElementById('name'),
        payBtn: document.getElementById('pay-btn'),
        calculateBtn: document.getElementById('calculate-btn'),
        genderSelect: document.getElementById('gender'),
        birthDate: document.getElementById('birth-date'),
        fullscreenLoading: document.getElementById('fullscreen-loading'),
        paymentSuccessAlert: document.getElementById('payment-success-alert'),
        recalculateBtn: document.getElementById('recalculate-btn')
    };

    // ==================== 初始化函数 ====================
    function init() {
        // 设置初始状态
        resetFormState();
        
        // 检查支付回调
        checkPaymentReturn();
        
        // 设置事件监听
        setupEventListeners();
        
        // 安全监测
        initSecurityCheck();
    }

    // ==================== 核心功能函数 ====================
    function checkPaymentReturn() {
        const params = new URLSearchParams(window.location.search);
        if (params.get('trade_status') === 'TRADE_SUCCESS') {
            const paymentData = {
                pid: params.get('pid'),
                trade_no: params.get('trade_no'),
                out_trade_no: params.get('out_trade_no'),
                type: params.get('type'),
                name: params.get('name'),
                money: params.get('money'),
                trade_status: params.get('trade_status'),
                param: params.get('param'),
                sign: params.get('sign'),
                sign_type: params.get('sign_type')
            };

            if (verifyPayment(paymentData)) {
                const userName = decodeURIComponent(paymentData.param || '');
                handlePaymentSuccess(userName);
                cleanUrl();
            }
        }
    }

    function startPayment(paymentMethod) {
    showFullscreenLoading(true);
    
    const paymentData = {
        pid: CONFIG.pid,
        type: paymentMethod, // 使用传入的支付方式
        out_trade_no: generateOrderNo(),
        notify_url: CONFIG.returnUrl,
        return_url: CONFIG.returnUrl,
        name: `八字测算-${elements.nameInput.value.trim().substring(0, 20)}`,
        money: CONFIG.amount,
        param: encodeURIComponent(elements.nameInput.value.trim()),
        sign_type: 'MD5'
    };
    
    paymentData.sign = generateSign(paymentData);
    submitPaymentForm(paymentData);
}

    function handlePaymentSuccess(userName) {
        // 锁定姓名输入
        lockNameInput(userName);
        
        // 更新UI状态
        elements.payBtn.style.display = 'none';
        elements.calculateBtn.style.display = 'block';
        
        // 显示成功提示
        showPaymentSuccessAlert();
        
        // 隐藏loading
        showFullscreenLoading(false);
    }

    function startCalculation() {
        const userName = elements.nameInput.value.trim();
        const gender = elements.genderSelect.value;
        
        if (!validateCalculationInputs(userName, gender)) return;
        
        // 保持姓名锁定状态
        lockNameInput(userName);
        
        // 执行测算
        executeQuantumCalculation(userName, gender);
    }

    function resetFormState() {
        // 解锁姓名输入
        elements.nameInput.readOnly = false;
        elements.nameInput.style.backgroundColor = '';
        elements.nameInput.style.cursor = '';
        
        // 重置按钮状态
        elements.payBtn.style.display = 'block';
        elements.calculateBtn.style.display = 'none';
        
        // 重置表单值
        elements.nameInput.value = '';
        elements.genderSelect.value = '';
        elements.birthDate.value = '';
    }

    // ==================== UI控制函数 ====================
    function lockNameInput(userName) {
        elements.nameInput.readOnly = true;
        elements.nameInput.style.backgroundColor = '#f5f5f5';
        elements.nameInput.style.cursor = 'not-allowed';
        if (userName && !elements.nameInput.value) {
            elements.nameInput.value = userName;
        }
    }

    function showFullscreenLoading(show) {
        elements.fullscreenLoading.style.display = show ? 'flex' : 'none';
    }

    function showPaymentSuccessAlert() {
        elements.paymentSuccessAlert.style.display = 'block';
        setTimeout(() => {
            elements.paymentSuccessAlert.style.display = 'none';
        }, 3000);
    }

    // ==================== 安全验证函数 ====================
    function initSecurityCheck() {
        // 防止通过开发者工具修改
        setInterval(() => {
            if (elements.calculateBtn.style.display === 'block' && 
                !elements.nameInput.readOnly) {
                lockNameInput(elements.nameInput.value);
                console.warn('安全监测：检测到异常操作，已重新锁定姓名框');
            }
        }, 1000);

        // 防止移动端键盘弹出
        elements.nameInput.addEventListener('focus', function() {
            if (this.readOnly) {
                this.blur();
            }
        });
    }

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

    // ==================== 工具函数 ====================
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
        return generateSign(paymentData) === sign;
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

    // ==================== 事件监听 ====================
    function setupEventListeners() {
    // 支付按钮点击事件 - 显示支付方式弹窗
    elements.payBtn.addEventListener('click', function() {
        const userName = elements.nameInput.value.trim();
        if (!userName) {
            alert('请输入您的姓名');
            return;
        }
        document.getElementById('payment-modal').style.display = 'flex';
    });

    // 关闭模态框
    document.querySelector('.close-modal').addEventListener('click', function() {
        document.getElementById('payment-modal').style.display = 'none';
    });

    // 点击模态框外部关闭
    document.getElementById('payment-modal').addEventListener('click', function(e) {
        if (e.target === this) {
            this.style.display = 'none';
        }
    });

    // 支付方式选择
    document.querySelectorAll('.payment-method').forEach(method => {
        method.addEventListener('click', function() {
            const paymentMethod = this.getAttribute('data-method');
            document.getElementById('payment-modal').style.display = 'none';
            startPayment(paymentMethod);
        });
    });

    // 测算按钮点击事件
    elements.calculateBtn.addEventListener('click', startCalculation);

    // 重新测算按钮
    if (elements.recalculateBtn) {
        elements.recalculateBtn.addEventListener('click', resetFormState);
    }

    // 页面显示时检查状态
    window.addEventListener('pageshow', function() {
        if (elements.nameInput.readOnly && 
            elements.calculateBtn.style.display === 'block') {
            lockNameInput(elements.nameInput.value);
        }
    });

    // 防止移动端键盘弹出
    elements.nameInput.addEventListener('focus', function() {
        if (this.readOnly) {
            this.blur();
        }
    });
}

    // ==================== 启动初始化 ====================
    init();
});
