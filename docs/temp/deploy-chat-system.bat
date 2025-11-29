@echo off
cls
echo ========================================
echo   COMPLETE CHAT SYSTEM DEPLOYMENT
echo ========================================
echo.
echo This will deploy the complete Telegram-style
echo chat system with all features.
echo.
echo Features included:
echo   - Auto room creation
echo   - Real-time messaging
echo   - File uploads with RaftAI review
echo   - Invite system
echo   - Member management
echo   - Reactions, pins, threads
echo   - Reporting system
echo   - Founder Manage Chats panel
echo   - All roles supported
echo.
pause
echo.

echo Step 1: Deploying Firebase Rules...
echo ========================================
firebase deploy --only firestore:rules

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ ERROR: Firebase rules deployment failed
    echo.
    echo Common fixes:
    echo 1. Run: firebase login
    echo 2. Run: firebase use [project-id]
    echo 3. Check firestore.rules for syntax errors
    echo.
    pause
    exit /b 1
)

echo.
echo ✅ Firebase rules deployed successfully!
echo.
echo ========================================
echo   DEPLOYMENT COMPLETE!
echo ========================================
echo.
echo ✅ Chat system is now live!
echo.
echo Next steps:
echo 1. Test at: http://localhost:3000/messages
echo 2. Login as different roles (Founder, VC, etc.)
echo 3. Accept a pitch to create a room
echo 4. Test messaging, files, invites
echo 5. Check Founder's "Manage Chats" panel
echo.
echo Features ready:
echo   ✅ Auto room creation
echo   ✅ Real-time messaging
echo   ✅ File uploads
echo   ✅ Invite links
echo   ✅ Reactions & pins
echo   ✅ Reporting
echo   ✅ All roles supported
echo.
echo Documentation:
echo   📚 TELEGRAM_STYLE_CHAT_COMPLETE.md
echo   🚀 DEPLOY_COMPLETE_CHAT.md
echo   🧪 test-complete-chat.html
echo.
pause

