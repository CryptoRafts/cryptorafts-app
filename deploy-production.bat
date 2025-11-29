@echo off
echo ========================================
echo   CRYPTORAFTS PRODUCTION DEPLOYMENT
echo ========================================
echo.

echo [1/4] Checking if Vercel CLI is installed...
where vercel >nul 2>nul
if %errorlevel% neq 0 (
    echo Vercel CLI not found! Installing...
    call npm i -g vercel
) else (
    echo Vercel CLI is already installed!
)
echo.

echo [2/4] Running production build test...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Build failed! Please fix errors before deploying.
    pause
    exit /b 1
)
echo Build successful!
echo.

echo [3/4] Deploying to Vercel Production...
echo This will deploy your app to production.
echo.
set /p CONFIRM="Are you sure you want to deploy to production? (yes/no): "

if /i "%CONFIRM%" neq "yes" (
    echo Deployment cancelled.
    pause
    exit /b 0
)

echo.
echo Deploying...
call vercel --prod

echo.
echo [4/4] Deployment complete!
echo.
echo ========================================
echo   DEPLOYMENT SUCCESSFUL!
echo ========================================
echo.
echo Your app is now live on Vercel!
echo Check the URL above to access it.
echo.
pause

