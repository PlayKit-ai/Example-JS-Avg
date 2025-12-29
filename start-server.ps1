# AI Galgame TTS Server Startup Script (PowerShell)
# 设置控制台编码
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    AI Galgame TTS Proxy Server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查当前目录
Write-Host "当前目录: $PWD" -ForegroundColor Yellow
Write-Host ""

# 检查Node.js
Write-Host "正在检查Node.js..." -ForegroundColor Yellow
$nodeCheck = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCheck) {
    Write-Host "❌ 错误: 未找到Node.js" -ForegroundColor Red
    Write-Host ""
    Write-Host "请先安装Node.js:" -ForegroundColor Yellow
    Write-Host "1. 访问 https://nodejs.org/"
    Write-Host "2. 下载并安装最新版本"
    Write-Host "3. 重启PowerShell"
    Write-Host ""
    Read-Host "按Enter键退出"
    exit 1
}

$nodeVersion = node --version
Write-Host "✅ Node.js已安装: $nodeVersion" -ForegroundColor Green
Write-Host ""

# 检查npm
Write-Host "正在检查npm..." -ForegroundColor Yellow
$npmCheck = Get-Command npm -ErrorAction SilentlyContinue
if (-not $npmCheck) {
    Write-Host "❌ 错误: 未找到npm" -ForegroundColor Red
    Write-Host "npm通常随Node.js一起安装，请重新安装Node.js"
    Read-Host "按Enter键退出"
    exit 1
}

$npmVersion = npm --version
Write-Host "✅ npm已安装: $npmVersion" -ForegroundColor Green
Write-Host ""

# 检查package.json
if (-not (Test-Path "package.json")) {
    Write-Host "❌ 错误: 未找到package.json文件" -ForegroundColor Red
    Write-Host "请确保在正确的项目目录中运行此脚本"
    Read-Host "按Enter键退出"
    exit 1
}

Write-Host "✅ package.json文件存在" -ForegroundColor Green
Write-Host ""

# 检查并安装依赖
Write-Host "正在检查依赖..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 首次运行，正在安装依赖包..." -ForegroundColor Cyan
    Write-Host "这可能需要几分钟时间，请耐心等待..." -ForegroundColor Yellow
    Write-Host ""
    
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "❌ 依赖安装失败" -ForegroundColor Red
        Write-Host ""
        Write-Host "可能的解决方案:" -ForegroundColor Yellow
        Write-Host "1. 检查网络连接"
        Write-Host "2. 尝试使用管理员权限运行"
        Write-Host "3. 手动运行: npm install"
        Write-Host ""
        Read-Host "按Enter键退出"
        exit 1
    }
    
    Write-Host ""
    Write-Host "✅ 依赖安装完成" -ForegroundColor Green
} else {
    Write-Host "✅ 依赖已安装" -ForegroundColor Green
}

Write-Host ""

# 检查关键文件
if (-not (Test-Path "tts-proxy-server.js")) {
    Write-Host "❌ 错误: 未找到tts-proxy-server.js文件" -ForegroundColor Red
    Read-Host "按Enter键退出"
    exit 1
}

Write-Host "✅ 服务器文件检查完成" -ForegroundColor Green
Write-Host ""

# 启动服务器
Write-Host "🚀 正在启动TTS代理服务器..." -ForegroundColor Cyan
Write-Host ""
Write-Host "服务器启动后，请访问:" -ForegroundColor Yellow
Write-Host "  游戏地址: http://localhost:3001/index.html" -ForegroundColor White
Write-Host "  TTS测试: http://localhost:3001/test-tts.html" -ForegroundColor White
Write-Host "  健康检查: http://localhost:3001/api/health" -ForegroundColor White
Write-Host ""
Write-Host "按 Ctrl+C 停止服务器" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

node tts-proxy-server.js

# 如果服务器意外退出
Write-Host ""
Write-Host "⚠️ 服务器已停止" -ForegroundColor Yellow
Write-Host ""
Read-Host "按Enter键退出"