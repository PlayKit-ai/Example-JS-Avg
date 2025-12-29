@echo off
echo ========================================
echo     AI Galgame 存档整理工具
echo ========================================
echo.
echo 正在检查下载文件夹中的存档文件...

set "download_folder=%USERPROFILE%\Downloads"
set "save_folder=%~dp0"

echo 下载文件夹: %download_folder%
echo 存档文件夹: %save_folder%
echo.

:: 检查是否有存档文件
dir "%download_folder%\存档_*.json" >nul 2>&1
if errorlevel 1 (
    echo 未找到存档文件（存档_*.json）
    echo 请确保已经保存过游戏
    goto :end
)

:: 移动存档文件
echo 找到存档文件，正在移动...
move "%download_folder%\存档_*.json" "%save_folder%" >nul 2>&1

if errorlevel 1 (
    echo 移动失败，请检查文件权限
) else (
    echo 存档文件已成功移动到saved_games文件夹！
)

:end
echo.
echo 按任意键退出...
pause >nul