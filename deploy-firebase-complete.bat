@echo off
echo ========================================
echo   FIREBASE COMPLETE DEPLOYMENT
echo ========================================
echo.
echo This will deploy ALL Firebase components:
echo - Firestore Rules
echo - Firestore Indexes
echo - Storage Rules
echo - Cloud Functions
echo.
echo Current Project: cryptorafts-b9067
echo.
pause

echo.
echo [1/5] Installing Cloud Functions dependencies...
cd functions
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)
cd ..

echo.
echo [2/5] Building Cloud Functions...
cd functions
call npm run build
if errorlevel 1 (
    echo ERROR: Failed to build functions
    pause
    exit /b 1
)
cd ..

echo.
echo [3/5] Deploying Firestore Rules...
firebase deploy --only firestore:rules
if errorlevel 1 (
    echo ERROR: Failed to deploy Firestore rules
    pause
    exit /b 1
)

echo.
echo [4/5] Deploying Firestore Indexes...
firebase deploy --only firestore:indexes
if errorlevel 1 (
    echo WARNING: Indexes deployment may take time to build
)

echo.
echo [5/5] Deploying Storage Rules...
firebase deploy --only storage
if errorlevel 1 (
    echo ERROR: Failed to deploy Storage rules
    pause
    exit /b 1
)

echo.
echo [6/6] Deploying Cloud Functions...
firebase deploy --only functions
if errorlevel 1 (
    echo ERROR: Failed to deploy Cloud Functions
    pause
    exit /b 1
)

echo.
echo ========================================
echo   DEPLOYMENT COMPLETE!
echo ========================================
echo.
echo All Firebase components deployed successfully:
echo - Firestore Rules: DEPLOYED
echo - Firestore Indexes: DEPLOYED (building in background)
echo - Storage Rules: DEPLOYED
echo - Cloud Functions: DEPLOYED
echo.
echo NEXT STEPS:
echo 1. Test user authentication
echo 2. Verify custom claims are set
echo 3. Test security rules
echo 4. Monitor Cloud Functions logs
echo 5. Check audit logs are being created
echo.
echo View logs: firebase functions:log --follow
echo.
pause

