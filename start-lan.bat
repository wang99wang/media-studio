@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ============================================
echo   自媒体创作剪辑工作台 - 局域网共享服务
echo ============================================
echo.
echo   启动后，本机用  http://localhost:18788/  打开
echo   手机(连同一 WiFi)用下面"同 WiFi"行显示的地址打开
echo.
echo   [手机打不开时] 以管理员身份运行一次这行放行防火墙：
echo   netsh advfirewall firewall add rule name="media-studio-LAN" dir=in action=allow protocol=TCP localport=18788
echo.
echo   正在启动服务...（这个窗口不要关，关了服务就停）
echo.
REM 启动后自动用本机浏览器打开，确认本机能进
start "" "http://localhost:18788/"
"C:\Users\26088\.workbuddy\binaries\node\versions\22.22.2\node.exe" server.js
echo.
echo   服务已停止。按任意键退出。
pause >nul
