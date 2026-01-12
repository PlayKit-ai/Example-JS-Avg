/**
 * AI Galgame 本地服务器
 * 用于处理游戏存档的保存和加载
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3001;
const SAVE_DIR = path.join(__dirname, 'saved_games');

// 确保存档目录存在
if (!fs.existsSync(SAVE_DIR)) {
    fs.mkdirSync(SAVE_DIR, { recursive: true });
    console.log('✅ 创建存档目录:', SAVE_DIR);
}

// 创建HTTP服务器
const server = http.createServer((req, res) => {
    // 设置CORS头，允许跨域请求
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // 处理OPTIONS预检请求
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    // API: 保存游戏
    if (pathname === '/api/save' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const { saveData } = JSON.parse(body);
                
                // 使用客户端提供的文件名，如果没有则使用时间戳
                let fileName;
                if (saveData.fileName) {
                    // 使用客户端指定的文件名（用于角色存档覆盖）
                    fileName = saveData.fileName;
                } else {
                    // 生成时间戳文件名（用于手动保存）
                    const now = new Date();
                    fileName = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}.json`;
                }
                
                const filePath = path.join(SAVE_DIR, fileName);
                
                // 保存文件（如果文件已存在会覆盖）
                fs.writeFileSync(filePath, JSON.stringify(saveData, null, 2), 'utf8');
                
                console.log('✅ 存档已保存:', fileName);
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    fileName: fileName,
                    filePath: filePath
                }));
            } catch (error) {
                console.error('❌ 保存失败:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    error: '保存失败',
                    details: error.message
                }));
            }
        });
        return;
    }

    // API: 获取存档列表
    if (pathname === '/api/saves' && req.method === 'GET') {
        try {
            const files = fs.readdirSync(SAVE_DIR)
                .filter(file => file.endsWith('.json'))
                .map(file => {
                    const filePath = path.join(SAVE_DIR, file);
                    const stats = fs.statSync(filePath);
                    return {
                        fileName: file,
                        modifiedTime: stats.mtime,
                        size: stats.size
                    };
                })
                .sort((a, b) => b.modifiedTime - a.modifiedTime); // 按时间倒序

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ saves: files }));
        } catch (error) {
            console.error('❌ 获取存档列表失败:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                error: '获取存档列表失败',
                details: error.message
            }));
        }
        return;
    }

    // API: 加载指定存档
    if (pathname.startsWith('/api/save/') && req.method === 'GET') {
        try {
            const fileName = pathname.replace('/api/save/', '');
            const filePath = path.join(SAVE_DIR, fileName);
            
            if (!fs.existsSync(filePath)) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: '存档不存在' }));
                return;
            }

            const saveData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ saveData }));
        } catch (error) {
            console.error('❌ 加载存档失败:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                error: '加载存档失败',
                details: error.message
            }));
        }
        return;
    }

    // 健康检查
    if (pathname === '/api/health' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', message: 'Server is running' }));
        return;
    }

    // 404
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not Found' }));
});

server.listen(PORT, () => {
    console.log('🚀 AI Galgame 服务器已启动');
    console.log(`📡 监听端口: ${PORT}`);
    console.log(`💾 存档目录: ${SAVE_DIR}`);
    console.log(`🌐 API地址: http://localhost:${PORT}`);
    console.log('\n可用的API端点:');
    console.log('  POST /api/save - 保存游戏');
    console.log('  GET  /api/saves - 获取存档列表');
    console.log('  GET  /api/save/:fileName - 加载指定存档');
    console.log('  GET  /api/health - 健康检查');
});
