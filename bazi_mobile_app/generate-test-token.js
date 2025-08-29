import { SignJWT } from 'jose';
import crypto from 'crypto';

// 使用与后端相同的密钥
const JWT_SECRET = 'your-secret-key-here';
const secret = new TextEncoder().encode(JWT_SECRET);

async function generateTestToken() {
    try {
        const payload = {
            userId: 1,
            username: 'testuser',
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