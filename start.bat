@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ==============================================
echo   💕 虚拟女友 · 启动中...
echo ==============================================

python -m uvicorn app.main:app --host 0.0.0.0 --port 8000

pause
