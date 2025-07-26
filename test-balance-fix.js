// 测试余额支付修复
const API_BASE = 'http://localhost:8787';

// 模拟登录并测试余额支付
async function testBalancePayment() {
  try {
    console.log('开始测试余额支付修复...');
    
    // 1. 模拟登录获取token
    const loginResponse = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'owen@example.com',
        password: 'password123'
      })
    });
    
    if (!loginResponse.ok) {
      throw new Error('登录失败');
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('登录成功，获取到token');
    
    // 2. 获取用户当前余额
    const userResponse = await fetch(`${API_BASE}/api/user/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const userData = await userResponse.json();
    const initialBalance = userData.balance;
    console.log(`当前余额: ${initialBalance}元`);
    
    // 3. 测试1元余额支付
    const paymentResponse = await fetch(`${API_BASE}/api/payments/balance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        wishId: 1, // 假设愿望ID为1
        amount: 1  // 支付1元
      })
    });
    
    if (!paymentResponse.ok) {
      const errorData = await paymentResponse.json();
      throw new Error(`支付失败: ${errorData.error}`);
    }
    
    console.log('1元余额支付成功');
    
    // 4. 再次获取用户余额，验证是否只扣除了1元
    const updatedUserResponse = await fetch(`${API_BASE}/api/user/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const updatedUserData = await updatedUserResponse.json();
    const finalBalance = updatedUserData.balance;
    const deductedAmount = initialBalance - finalBalance;
    
    console.log(`支付后余额: ${finalBalance}元`);
    console.log(`实际扣除金额: ${deductedAmount}元`);
    
    if (deductedAmount === 1) {
      console.log('✅ 测试通过：余额扣费正确，只扣除了1元');
    } else {
      console.log(`❌ 测试失败：预期扣除1元，实际扣除${deductedAmount}元`);
    }
    
  } catch (error) {
    console.error('测试失败:', error.message);
  }
}

// 运行测试
testBalancePayment();