@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ============================================
echo   自媒体创作剪辑工作台 - 局域网共享服务
echo ============================================
echo.
echo  启动后，本机和手机（连同一 WiFi）用下面地址打开：
echo.
"C:\Users\26088\.workbuddy\binaries\node\versions\22.22.2\node.exe" server.js
echo.
echo  服务已停止。按任意键退出。
pause >nul
