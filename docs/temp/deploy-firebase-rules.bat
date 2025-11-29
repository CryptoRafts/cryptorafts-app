@echo off
REM Complete Firebase Rules Deployment Script for Windows
REM This script deploys comprehensive Firebase rules with admin override

echo 🚀 Starting Firebase Rules Deployment...

REM Check if Firebase CLI is installed
firebase --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Firebase CLI not found. Please install it first:
    echo npm install -g firebase-tools
    pause
    exit /b 1
)

REM Check if user is logged in
firebase projects:list >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Not logged in to Firebase. Please run:
    echo firebase login
    pause
    exit /b 1
)

echo ✅ Firebase CLI is ready

REM Backup current rules
echo 📦 Backing up current rules...
if exist "firestore.rules" (
    copy "firestore.rules" "firestore.rules.backup.%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%.txt"
    echo ✅ Firestore rules backed up
)

if exist "storage.rules" (
    copy "storage.rules" "storage.rules.backup.%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%.txt"
    echo ✅ Storage rules backed up
)

REM Deploy complete rules
echo 🔄 Deploying complete Firebase rules...

REM Copy complete rules to main files
if exist "firestore.rules.complete" (
    copy "firestore.rules.complete" "firestore.rules"
    echo ✅ Firestore rules updated
) else (
    echo ❌ firestore.rules.complete not found
    pause
    exit /b 1
)

if exist "storage.rules.complete" (
    copy "storage.rules.complete" "storage.rules"
    echo ✅ Storage rules updated
) else (
    echo ❌ storage.rules.complete not found
    pause
    exit /b 1
)

REM Deploy to Firebase
echo 🚀 Deploying to Firebase...

REM Deploy Firestore rules
echo 📊 Deploying Firestore rules...
firebase deploy --only firestore:rules
if %errorlevel% neq 0 (
    echo ❌ Firestore rules deployment failed
    pause
    exit /b 1
)
echo ✅ Firestore rules deployed successfully

REM Deploy Storage rules
echo 📁 Deploying Storage rules...
firebase deploy --only storage
if %errorlevel% neq 0 (
    echo ❌ Storage rules deployed successfully
    pause
    exit /b 1
)
echo ✅ Storage rules deployed successfully

echo.
echo 🎉 Firebase rules deployment completed successfully!
echo.
echo 📋 Summary:
echo   ✅ Firestore rules deployed with admin override
echo   ✅ Storage rules deployed with admin override
echo   ✅ All user roles supported (Admin, VC, Founder, Exchange, Agency, Influencer)
echo   ✅ Complete security with role-based access control
echo.
echo 🔍 Next steps:
echo   1. Test the rules in Firebase console
echo   2. Verify admin access works correctly
echo   3. Test role-based access for each user type
echo   4. Monitor for any permission issues
echo.
echo 📚 Documentation: firebase-rules-deployment.md
pause
