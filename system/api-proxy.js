const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// 从环境变量获取API密钥
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || 'placeholder_key_for_local_dev_only';

if (!process.env.DEEPSEEK_API_KEY) {
    console.warn('警告: 未设置DEEPSEEK_API_KEY环境变量，使用默认密钥（不推荐用于生产环境）');
}

app.use(cors());
app.use(express.json());

// 提供静态文件服务
app.use(express.static(path.join(__dirname, '..')));

// 添加路由处理/system/路径下的文件
app.use('/system', express.static(__dirname));

// 根路径处理
app.get('/', (req, res) => {
    res.json({ message: 'DeepSeek API代理服务器', status: 'running', endpoints: ['/api/deepseek'] });
});

// 代理DeepSeek API请求
app.post('/api/deepseek', async (req, res) => {
    try {
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
            },
            body: JSON.stringify(req.body)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            return res.status(response.status).json(data);
        }
        
        res.json(data);
    } catch (error) {
        console.error('API代理错误:', error);
        res.status(500).json({ error: '服务器内部错误' });
    }
});

app.listen(port, () => {
    console.log(`API代理服务器运行在 http://localhost:${port}`);
});