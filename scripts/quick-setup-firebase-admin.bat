@echo off
echo.
echo ========================================
echo Firebase Admin SDK Quick Setup
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Step 1: Getting service account from Firebase Console...
echo.
echo Please follow these steps:
echo 1. Open: https://console.firebase.google.com/project/cryptorafts-b9067/settings/serviceaccounts/adminsdk
echo 2. Click "Generate new private key"
echo 3. Save the downloaded JSON file
echo.
pause

echo.
echo Step 2: Encoding service account to Base64...
echo.
node scripts/setup-firebase-admin.js

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo Setup Complete!
    echo ========================================
    echo.
    echo Next steps:
    echo 1. Copy the Base64 string from secrets\service-account-base64.txt
    echo 2. Go to Vercel: https://vercel.com/your-project/settings/environment-variables
    echo 3. Add variable: FIREBASE_SERVICE_ACCOUNT_B64
    echo 4. Paste the Base64 string
    echo 5. Apply to: Production, Preview, Development
    echo 6. Redeploy your application
    echo.
) else (
    echo.
    echo Setup failed. Please check the error messages above.
    echo.
)

pause

