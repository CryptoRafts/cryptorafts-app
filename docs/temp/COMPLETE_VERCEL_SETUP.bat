@echo off
title CryptoRafts Vercel Deployment
color 0A

echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║                                                          ║
echo ║     🚀 CRYPTORAFTS VERCEL DEPLOYMENT 🚀                ║
echo ║                                                          ║
echo ╚══════════════════════════════════════════════════════════╝
echo.
echo 📋 AUTOMATED DEPLOYMENT SCRIPT
echo.
echo ⚠️  YOU MUST DO THESE 3 THINGS MANUALLY:
echo.
echo    1. Run: vercel login (and verify email)
echo    2. Run: vercel --prod (to deploy)
echo    3. Update DNS in Hostinger
echo.
echo ✅ I'll open all the pages you need!
echo.
pause

echo.
echo 🌐 Opening required pages...
echo.

REM Open Vercel
start https://vercel.com/dashboard

timeout /t 2 /nobreak >nul

REM Open Hostinger
start https://hpanel.hostinger.com

timeout /t 2 /nobreak >nul

REM Open Firebase
start https://console.firebase.google.com

timeout /t 2 /nobreak >nul

REM Open the guide
start 🚀_VERCEL_DEPLOY_NOW.md

echo.
echo ✅ All pages opened!
echo.
echo 📋 NOW DO THIS IN POWERSHELL:
echo.
echo    1. vercel login
echo    2. vercel --prod
echo.
echo 📖 Follow the guide: 🚀_VERCEL_DEPLOY_NOW.md
echo.
pause

