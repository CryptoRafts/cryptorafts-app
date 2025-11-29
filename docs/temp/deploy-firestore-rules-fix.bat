@echo off
echo ========================================
echo   DEPLOYING FIXED FIRESTORE RULES
echo ========================================
echo.
echo This will deploy the updated Firestore rules to fix permission errors
echo.
pause

echo.
echo Deploying Firestore rules...
firebase deploy --only firestore:rules

echo.
echo ========================================
echo   DEPLOYMENT COMPLETE!
echo ========================================
echo.
echo The updated rules have been deployed.
echo.
echo NEXT STEPS:
echo 1. Clear your browser cache (Ctrl + Shift + R)
echo 2. Refresh the application
echo 3. Check the console for any remaining errors
echo.
pause

