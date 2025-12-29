@echo off
chcp 65001 >nul
title AI Galgame TTS Server

echo ========================================
echo    AI Galgame TTS Proxy Server
echo ========================================
echo.

REM 检查当前目录
echo 当前目录: %CD%
echo.

REM 设置错误处理
setlocal enabledelayedexpansion

REM 检查Node.js
echo 正在检查Node.js...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误: 未找到Node.js
    echo.
    echo 请先安装Node.js:
    echo 1. 访问 https://nodejs.org/
    echo 2. 下载并安装最新版本
    echo 3. 重启命令提示符
    echo.
    pause
    exit /b 1
)

node --version
echo ✅ Node.js已安装
echo.

REM 检查npm
echo 正在检查npm...
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误: 未找到npm
    echo npm通常随Node.js一起安装，请重新安装Node.js
    pause
    exit /b 1
)

npm --version
echo ✅ npm已安装
echo.

REM 检查package.json
if not exist package.json (
    echo ❌ 错误: 未找到package.json文件
    echo 请确保在正确的项目目录中运行此脚本
    pause
    exit /b 1
)

echo ✅ package.json文件存在
echo.

REM 检查并安装依赖
echo 正在检查依赖...
if not exist node_modules (
    echo 📦 首次运行，正在安装依赖包...
    echo 这可能需要几分钟时间，请耐心等待...
    echo.
    
    npm install
    
    if %errorlevel% neq 0 (
        echo.
        echo ❌ 依赖安装失败
        echo.
        echo 可能的解决方案:
        echo 1. 检查网络连接
        echo 2. 尝试使用管理员权限运行
        echo 3. 手动运行: npm install
        echo.
        pause
        exit /b 1
    )
    
    echo.
    echo ✅ 依赖安装完成
) else (
    echo ✅ 依赖已安装
)

echo.

REM 检查关键文件
if not exist tts-proxy-server.js (
    echo ❌ 错误: 未找到tts-proxy-server.js文件
    pause
    exit /b 1
)

echo ✅ 服务器文件检查完成
echo.

REM 启动服务器
echo 🚀 正在启动TTS代理服务器...
echo.
echo 服务器启动后，请访问:
echo   游戏地址: http://localhost:3001/index.html
echo   TTS测试: http://localhost:3001/test-tts.html
echo   健康检查: http://localhost:3001/api/health
echo.
echo 按 Ctrl+C 停止服务器
echo ========================================
echo.

node tts-proxy-server.js

REM 如果服务器意外退出
echo.
echo ⚠️ 服务器已停止
echo.
pause