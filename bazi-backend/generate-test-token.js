import { SignJWT } from 'jose';
import crypto from 'crypto';

// 使用与后端相同的密钥
const JWT_SECRET = 'test_jwt_secret_placeholder';
const secret = new TextEncoder().encode(JWT_SECRET);

async function generateTestToken() {
    try {
        // 从命令行参数获取用户ID和名称，如果没有提供则使用默认值
        const userId = process.argv[2] ? parseInt(process.argv[2]) : 1;
        const userName = process.argv[3] || 'testuser';
        
        const payload = {
            id: userId,
            name: userName,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24小时后过期
        };

        const token = await new SignJWT(payload)
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('24h')
            .sign(secret);

        console.log('Generated JWT Token:');
        console.log(token);
        console.log('\nPayload:');
        console.log(JSON.stringify(payload, null, 2));
        
        return token;
    } catch (error) {
        console.error('Error generating token:', error);
        throw error;
    }
}

generateTestToken().catch(console.error);