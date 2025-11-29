@echo off
REM ============================================
REM SIMPLE DEPLOYMENT - Copy & Paste Commands
REM ============================================

echo ============================================
echo DEPLOYMENT COMMANDS
echo ============================================
echo.
echo Password: Shamsi2627@@
echo.
echo Run these commands ONE AT A TIME in PowerShell:
echo.
echo 1. Upload SpotlightDisplay:
echo    scp src/components/SpotlightDisplay.tsx root@72.61.98.99:/var/www/cryptorafts/src/components/SpotlightDisplay.tsx
echo.
echo 2. Upload PerfectHeader:
echo    scp src/components/PerfectHeader.tsx root@72.61.98.99:/var/www/cryptorafts/src/components/PerfectHeader.tsx
echo.
echo 3. Upload SimpleAuthProvider:
echo    scp src/providers/SimpleAuthProvider.tsx root@72.61.98.99:/var/www/cryptorafts/src/providers/SimpleAuthProvider.tsx
echo.
echo 4. Upload page:
echo    scp src/app/page.tsx root@72.61.98.99:/var/www/cryptorafts/src/app/page.tsx
echo.
echo 5. SSH and rebuild:
echo    ssh root@72.61.98.99
echo    cd /var/www/cryptorafts ^&^& npm run build ^&^& pm2 restart cryptorafts
echo.
echo ============================================
pause

