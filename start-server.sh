#!/bin/bash

echo "========================================"
echo "    AI Galgame TTS Proxy Server"
echo "========================================"
echo

echo "正在检查Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未找到Node.js"
    echo "请先安装Node.js: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js已安装: $(node --version)"

echo
echo "正在检查依赖..."
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖包..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ 依赖安装失败"
        exit 1
    fi
else
    echo "✅ 依赖已安装"
fi

echo
echo "🚀 启动TTS代理服务器..."
echo
echo "服务器启动后，请访问:"
echo "  游戏地址: http://localhost:3001/index.html"
echo "  TTS测试: http://localhost:3001/test-tts.html"
echo
echo "按 Ctrl+C 停止服务器"
echo

npm start