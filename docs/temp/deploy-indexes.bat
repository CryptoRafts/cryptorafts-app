@echo off
echo 🚀 Deploying Firestore Indexes...

REM Check if firebase CLI is installed
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

REM Deploy indexes
echo 📊 Deploying Firestore indexes...
firebase deploy --only firestore:indexes

if %errorlevel% equ 0 (
    echo ✅ Firestore indexes deployed successfully!
    echo 🎉 All database queries should now work properly.
) else (
    echo ❌ Error deploying indexes
)

pause
