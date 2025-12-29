@echo off
chcp 65001 >nul
title 安装依赖包

echo ========================================
echo    安装AI Galgame依赖包
echo ========================================
echo.

REM 检查Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误: 未找到Node.js
    echo.
    echo 请先安装Node.js:
    echo 1. 访问 https://nodejs.org/
    echo 2. 下载LTS版本
    echo 3. 安装后重启命令提示符
    echo.
    pause
    exit /b 1
)

echo ✅ Node.js版本: 
node --version
echo.

REM 检查npm
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误: 未找到npm
    pause
    exit /b 1
)

echo ✅ npm版本:
npm --version
echo.

echo 📦 开始安装依赖包...
echo 这可能需要几分钟时间，请耐心等待...
echo.

REM 清理可能存在的缓存
if exist node_modules (
    echo 清理旧的node_modules...
    rmdir /s /q node_modules
)

if exist package-lock.json (
    echo 清理package-lock.json...
    del package-lock.json
)

REM 安装依赖
npm install express cors node-fetch

if %errorlevel% neq 0 (
    echo.
    echo ❌ 依赖安装失败
    echo.
    echo 尝试其他方法:
    echo 1. 使用管理员权限运行
    echo 2. 检查网络连接
    echo 3. 尝试使用淘宝镜像: npm install -g cnpm --registry=https://registry.npm.taobao.org
    echo.
    pause
    exit /b 1
)

echo.
echo ✅ 依赖安装完成！
echo.
echo 现在可以运行 start-server.bat 启动服务器
echo.
pause