@echo off
echo.
echo ========================================
echo    RaftAI Service Auto-Fix Script
echo ========================================
echo.

cd raftai-service

echo [1/5] Stopping any running services...
taskkill /F /IM node.exe 2>nul
timeout /t 2 >nul

echo [2/5] Cleaning old builds...
if exist dist rmdir /s /q dist
if exist node_modules\.cache rmdir /s /q node_modules\.cache

echo [3/5] Installing dependencies...
call npm install

echo [4/5] Building service...
call npm run build

echo.
echo ========================================
echo    Fix Complete! Starting Service...
echo ========================================
echo.
echo Look for these messages:
echo   - RaftAI service listening on port 8080
echo   - OPENAI_API_KEY not found (this is OK)
echo.
echo Press Ctrl+C to stop the service
echo.

call npm run dev

