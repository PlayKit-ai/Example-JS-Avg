@echo off
title AI Galgame Server

echo 正在启动AI Galgame服务器...
echo.

REM 直接尝试启动，如果失败会显示错误
node tts-proxy-server.js

echo.
echo 服务器已停止，按任意键退出...
pause >nul