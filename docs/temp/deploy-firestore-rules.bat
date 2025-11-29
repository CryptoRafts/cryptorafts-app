@echo off
echo ========================================
echo   DEPLOYING FIRESTORE RULES
echo ========================================
echo.
echo This will deploy security rules to Firebase...
echo.

firebase deploy --only firestore:rules

echo.
echo ========================================
echo   DONE!
echo ========================================
echo.
echo Firestore rules deployed successfully!
echo.
pause

