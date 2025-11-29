@echo off
echo ========================================
echo    VC ROLE FIX DEPLOYMENT SCRIPT
echo ========================================
echo.

echo Step 1: Backing up current storage rules...
if exist "storage.rules" (
    copy "storage.rules" "storage.rules.backup.%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%.txt"
    echo ✅ Backup created
) else (
    echo ❌ No existing storage.rules found
)

echo.
echo Step 2: Checking Firebase CLI...
firebase --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Firebase CLI not found. Please install it:
    echo npm install -g firebase-tools
    pause
    exit /b 1
)
echo ✅ Firebase CLI is installed

echo.
echo Step 3: Checking Firebase login status...
firebase projects:list >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Not logged in to Firebase
    echo Please run: firebase login
    echo Then run this script again
    pause
    exit /b 1
)
echo ✅ Firebase CLI is authenticated

echo.
echo Step 4: Deploying updated storage rules...
echo 🔄 Deploying to Firebase Storage...
firebase deploy --only storage
if %errorlevel% neq 0 (
    echo ❌ Deployment failed
    pause
    exit /b 1
)

echo.
echo ✅ DEPLOYMENT SUCCESSFUL!
echo.
echo 🎉 VC Organization Logo Upload Fixed!
echo.
echo What was fixed:
echo - ✅ Organization logos can now be uploaded by authenticated users
echo - ✅ VC role has proper permissions for organization files
echo - ✅ Admin override ensures full access for administrators
echo - ✅ All user roles have appropriate permissions
echo.
echo Test your VC onboarding now - the logo upload should work!
echo.
pause
