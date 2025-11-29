@echo off
echo ========================================
echo RESTARTING DEV SERVER
echo ========================================
echo.

echo Stopping all Node.js processes...
taskkill /F /IM node.exe /T >nul 2>&1

echo Waiting 3 seconds...
timeout /t 3 /nobreak >nul

echo Clearing Next.js cache...
if exist .next rmdir /s /q .next

echo.
echo ========================================
echo STARTING DEV SERVER
echo ========================================
echo.
echo Watch for this message:
echo "Firebase Admin initialized with service account file"
echo.

npm run dev

