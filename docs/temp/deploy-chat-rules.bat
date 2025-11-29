@echo off
echo ========================================
echo   Deploying Chat Firebase Rules
echo ========================================
echo.
echo This will deploy the updated Firestore rules
echo to enable chat for all roles.
echo.
echo Make sure you're logged in to Firebase CLI
echo Run 'firebase login' if needed
echo.
pause
echo.
echo Deploying Firestore rules...
firebase deploy --only firestore:rules
echo.
if %ERRORLEVEL% EQU 0 (
    echo ========================================
    echo   SUCCESS! Rules deployed successfully
    echo ========================================
    echo.
    echo Chat is now enabled for all roles:
    echo   - Founder
    echo   - VC
    echo   - Exchange
    echo   - IDO Platform
    echo   - Influencer
    echo   - Agency
    echo   - Admin
    echo.
    echo Next steps:
    echo 1. Navigate to /messages in your app
    echo 2. Test chat with different roles
    echo 3. See CHAT_FIXES_COMPLETE.md for testing guide
) else (
    echo ========================================
    echo   ERROR! Deployment failed
    echo ========================================
    echo.
    echo Possible issues:
    echo 1. Not logged in - Run 'firebase login'
    echo 2. No Firebase project - Run 'firebase use [project-id]'
    echo 3. Permission issues - Check Firebase console
    echo.
    echo For help, see CHAT_FIXES_COMPLETE.md
)
echo.
pause

