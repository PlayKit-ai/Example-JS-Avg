/**
 * TTS代理服务器
 * 解决火山引擎TTS API的CORS问题
 */

const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3001;

// 存档保存目录
const SAVE_DIR = path.join(__dirname, 'saved_games');

// 火山引擎TTS配置 - 请填入你自己的配置
const TTS_CONFIG = {
    appId: 'your-app-id',
    accessKey: 'your-access-key',
    resourceId: 'seed-tts-1.0',
    apiUrl: 'https://openspeech.bytedance.com/api/v3/tts/unidirectional'
};

// 中间件
app.use(cors()); // 允许跨域
app.use(express.json({ limit: '10mb' })); // 解析JSON请求体
app.use(express.static('.')); // 静态文件服务

// 生成请求ID
function generateRequestId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// TTS代理端点
app.post('/api/tts', async (req, res) => {
    try {
        console.log('🎵 Received TTS request:', {
            text: req.body.req_params?.text?.substring(0, 50) + '...',
            speaker: req.body.req_params?.speaker
        });

        // 构建请求头 - 完全按照Python示例格式
        const headers = {
            'X-Api-App-Id': TTS_CONFIG.appId,
            'X-Api-Access-Key': TTS_CONFIG.accessKey,
            'X-Api-Resource-Id': TTS_CONFIG.resourceId,
            'Content-Type': 'application/json',
            'Connection': 'keep-alive'
        };

        console.log('🔑 Request headers:', headers);
        console.log('📝 Request payload:', JSON.stringify(req.body, null, 2));

        // 发送请求到火山引擎
        const response = await fetch(TTS_CONFIG.apiUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(req.body)
        });

        console.log('📡 Response status:', response.status);
        console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ TTS API Error:', response.status, errorText);
            return res.status(response.status).json({
                error: `TTS API请求失败: ${response.status}`,
                details: errorText
            });
        }

        // 设置响应头
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Transfer-Encoding', 'chunked');

        // 流式转发响应
        const reader = response.body;
        let totalBytes = 0;
        let chunkCount = 0;

        reader.on('data', (chunk) => {
            totalBytes += chunk.length;
            chunkCount++;
            console.log(`📦 转发数据块 ${chunkCount}: ${chunk.length} bytes (总计: ${totalBytes} bytes)`);
            res.write(chunk);
        });

        reader.on('end', () => {
            res.end();
            console.log(`✅ TTS request completed - 总共转发 ${chunkCount} 个数据块，${totalBytes} bytes`);
        });

        reader.on('error', (error) => {
            console.error('❌ Stream error:', error);
            if (!res.headersSent) {
                res.status(500).json({ error: 'Stream error' });
            }
        });

    } catch (error) {
        console.error('❌ TTS Proxy Error:', error);
        if (!res.headersSent) {
            res.status(500).json({
                error: 'TTS代理服务器错误',
                details: error.message
            });
        }
    }
});

// 健康检查端点
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'TTS Proxy Server is running',
        config: {
            appId: TTS_CONFIG.appId,
            resourceId: TTS_CONFIG.resourceId,
            hasAccessKey: !!TTS_CONFIG.accessKey
        }
    });
});

// 保存存档端点
app.post('/api/save', (req, res) => {
    try {
        const { saveData } = req.body;
        
        if (!saveData) {
            return res.status(400).json({ error: '缺少存档数据' });
        }

        // 确保存档目录存在
        if (!fs.existsSync(SAVE_DIR)) {
            fs.mkdirSync(SAVE_DIR, { recursive: true });
        }

        // 生成文件名：时间格式
        const now = new Date();
        const fileName = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}.json`;
        const filePath = path.join(SAVE_DIR, fileName);

        // 写入文件
        fs.writeFileSync(filePath, JSON.stringify(saveData, null, 2), 'utf8');

        console.log(`💾 存档已保存: ${filePath}`);

        res.json({
            success: true,
            fileName: fileName,
            filePath: filePath,
            message: `存档已保存到 saved_games/${fileName}`
        });

    } catch (error) {
        console.error('❌ 保存存档失败:', error);
        res.status(500).json({
            error: '保存存档失败',
            details: error.message
        });
    }
});

// 获取存档列表端点
app.get('/api/saves', (req, res) => {
    try {
        if (!fs.existsSync(SAVE_DIR)) {
            return res.json({ saves: [] });
        }

        const files = fs.readdirSync(SAVE_DIR)
            .filter(f => f.endsWith('.json'))
            .map(f => {
                const filePath = path.join(SAVE_DIR, f);
                const stats = fs.statSync(filePath);
                return {
                    fileName: f,
                    size: stats.size,
                    modifiedTime: stats.mtime
                };
            })
            .sort((a, b) => new Date(b.modifiedTime) - new Date(a.modifiedTime));

        res.json({ saves: files });

    } catch (error) {
        console.error('❌ 获取存档列表失败:', error);
        res.status(500).json({ error: '获取存档列表失败' });
    }
});

// 加载存档端点
app.get('/api/save/:fileName', (req, res) => {
    try {
        const { fileName } = req.params;
        const filePath = path.join(SAVE_DIR, fileName);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: '存档不存在' });
        }

        const saveData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        res.json({ saveData, fileName });

    } catch (error) {
        console.error('❌ 加载存档失败:', error);
        res.status(500).json({ error: '加载存档失败' });
    }
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`🚀 TTS Proxy Server running on http://localhost:${PORT}`);
    console.log(`📁 Static files served from: ${path.resolve('.')}`);
    console.log(`🎵 TTS API endpoint: http://localhost:${PORT}/api/tts`);
    console.log(`❤️ Health check: http://localhost:${PORT}/api/health`);
    console.log('');
    console.log('🎮 You can now access your game at:');
    console.log(`   http://localhost:${PORT}/index.html`);
    console.log(`   http://localhost:${PORT}/test-tts.html`);
});

// 优雅关闭
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down TTS Proxy Server...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down TTS Proxy Server...');
    process.exit(0);
});