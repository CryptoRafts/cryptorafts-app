@echo off
echo.
echo ========================================
echo   Deploying Firebase Indexes
echo ========================================
echo.
echo This will deploy the required indexes to Firebase...
echo.

firebase deploy --only firestore:indexes

echo.
echo ========================================
echo   Deployment Complete!
echo ========================================
echo.
echo The listings index has been created.
echo Refresh your Exchange dashboard to see it work.
echo.
pause

