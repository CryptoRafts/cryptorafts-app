@echo off
echo 🚀 CRYPTORAFTS.COM DEPLOYMENT SCRIPT
echo =====================================

echo.
echo 📦 Building application...
call npm run build

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Build failed! Please fix errors before deploying.
    pause
    exit /b 1
)

echo.
echo ✅ Build successful! 
echo.
echo 🌐 Deploying to cryptorafts.com...
echo.

echo 📋 Deployment options:
echo 1. Vercel (Recommended)
echo 2. Netlify
echo 3. Firebase Hosting
echo.

set /p choice="Choose deployment method (1-3): "

if "%choice%"=="1" (
    echo.
    echo 🚀 Deploying to Vercel...
    vercel --prod
) else if "%choice%"=="2" (
    echo.
    echo 🚀 Building for Netlify...
    call npm run build:export
    echo.
    echo 📁 Upload .next/out folder to Netlify
    echo 🌐 Or use Netlify CLI: netlify deploy --prod
) else if "%choice%"=="3" (
    echo.
    echo 🚀 Deploying to Firebase...
    firebase deploy
) else (
    echo ❌ Invalid choice. Please run the script again.
    pause
    exit /b 1
)

echo.
echo ✅ Deployment complete!
echo 🌐 Your app should be live at cryptorafts.com
echo.
pause
