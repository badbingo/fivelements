// 测试余额支付功能
import fetch from 'node-fetch';

async function testBalancePayment() {
  try {
    // 生成一个有效的JWT token用于测试
    // 注意：实际环境中应从环境变量获取JWT_SECRET
    const JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_placeholder';
    const userId = 6; // Owen用户的ID
    
    // 简化版的JWT生成函数
    function base64Encode(bytes) {
      return Buffer.from(bytes).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    }
    
    function generateJWT(payload, secret) {
      const header = { alg: 'HS256', typ: 'JWT' };
      const encodedHeader = base64Encode(Buffer.from(JSON.stringify(header)));
      const encodedPayload = base64Encode(Buffer.from(JSON.stringify(payload)));
      const signature = base64Encode(Buffer.from(`${encodedHeader}.${encodedPayload}.${secret}`));
      return `${encodedHeader}.${encodedPayload}.${signature}`;
    }
    
    const token = generateJWT({ id: userId, name: 'Owen' }, JWT_SECRET);
    console.log('使用生成的token进行测试...');

    console.log('使用预设token继续测试');

    // 2. 获取用户余额
    console.log('\n2. 获取用户余额...');
    const balanceResponse = await fetch('http://localhost:8787/api/users/balance', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!balanceResponse.ok) {
      throw new Error(`获取余额失败: ${balanceResponse.status} ${balanceResponse.statusText}`);
    }

    const { balance } = await balanceResponse.json();
    console.log(`当前余额: ${balance}`);

    // 3. 检查愿望状态
    const wishId = 23;  // 林小甜的愿望ID
    console.log(`\n3. 检查愿望 #${wishId} 状态...`);
    const wishStatusResponse = await fetch(`http://localhost:8787/api/wishes/status?wishId=${wishId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!wishStatusResponse.ok) {
      throw new Error(`检查愿望状态失败: ${wishStatusResponse.status} ${wishStatusResponse.statusText}`);
    }

    const wishStatus = await wishStatusResponse.json();
    console.log('愿望状态:', wishStatus);

    if (!wishStatus.exists) {
      throw new Error('愿望不存在');
    }

    if (wishStatus.fulfilled) {
      throw new Error('愿望已还愿');
    }

    // 4. 使用余额支付
    const paymentAmount = 1.0;  // 支付金额
    console.log(`\n4. 使用余额支付 ${paymentAmount} 元...`);
    const paymentResponse = await fetch('http://localhost:8787/api/payments/balance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        wishId,
        amount: paymentAmount
      })
    });

    const paymentResult = await paymentResponse.json();
    
    if (!paymentResponse.ok) {
      console.error('支付失败:', paymentResult);
      throw new Error(`支付失败: ${paymentResponse.status} ${paymentResponse.statusText}`);
    }

    console.log('支付成功:', paymentResult);

    // 5. 再次检查愿望状态
    console.log(`\n5. 再次检查愿望 #${wishId} 状态...`);
    const wishStatusAfterResponse = await fetch(`http://localhost:8787/api/wishes/status?wishId=${wishId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const wishStatusAfter = await wishStatusAfterResponse.json();
    console.log('支付后愿望状态:', wishStatusAfter);

    // 6. 检查更新后的余额
    console.log('\n6. 检查更新后的余额...');
    const balanceAfterResponse = await fetch('http://localhost:8787/api/users/balance', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const { balance: balanceAfter } = await balanceAfterResponse.json();
    console.log(`支付后余额: ${balanceAfter}`);
    console.log(`余额变化: ${balance} -> ${balanceAfter}`);

  } catch (error) {
    console.error('测试过程中出错:', error.message);
  }
}

// 使用立即执行的异步函数
(async () => {
  await testBalancePayment();
})();