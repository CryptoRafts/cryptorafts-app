@echo off
echo.
echo ╔════════════════════════════════════════════════════════════════════════════╗
echo ║                                                                            ║
echo ║           🚀 DEPLOYING SPOTLIGHT FIRESTORE INDEXES 🚀                       ║
echo ║                                                                            ║
echo ╚════════════════════════════════════════════════════════════════════════════╝
echo.
echo 📋 Step 1: Authenticating with Firebase...
call firebase login:add
echo.
echo 📋 Step 2: Deploying Firestore indexes...
call firebase deploy --only firestore:indexes --project cryptorafts-b9067
echo.
echo ╔════════════════════════════════════════════════════════════════════════════╗
echo ║                                                                            ║
echo ║           ✅ FIRESTORE INDEXES DEPLOYMENT COMPLETE! ✅                      ║
echo ║                                                                            ║
echo ╚════════════════════════════════════════════════════════════════════════════╝
echo.
pause

