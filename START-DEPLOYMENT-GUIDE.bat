@echo off
title CryptoRafts Hostinger Deployment
color 0B

echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║                                                          ║
echo ║     🚀 CRYPTORAFTS HOSTINGER DEPLOYMENT GUIDE 🚀       ║
echo ║                                                          ║
echo ╚══════════════════════════════════════════════════════════╝
echo.
echo Opening Interactive Deployment Guide...
echo.

REM Open the interactive HTML guide
start HOSTINGER-DEPLOYMENT-INTERACTIVE.html

timeout /t 2 /nobreak >nul

echo.
echo ✅ Interactive guide opened in your browser!
echo.
echo 📋 Available guides in your project folder:
echo.
echo   1. HOSTINGER-DEPLOYMENT-INTERACTIVE.html  (Interactive)
echo   2. QUICK_START_HOSTINGER.md               (10 minutes)
echo   3. HOSTINGER_VISUAL_GUIDE.md              (20 minutes)
echo   4. HOSTINGER_NEXTJS_DEPLOYMENT.md         (30 minutes)
echo   5. HOSTINGER_DEPLOYMENT_GUIDE.md          (45 minutes)
echo   6. 🚀_START_HOSTINGER_DEPLOYMENT.md       (Overview)
echo.
echo ⚡ QUICK DEPLOY:
echo    Run: deploy-to-hostinger.ps1
echo.
echo Press any key to close this window...
pause >nul

