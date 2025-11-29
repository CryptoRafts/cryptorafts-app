# Check Vercel Environment Variables
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "VERCEL ENVIRONMENT VARIABLES CHECK" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Checking Firebase API Key..." -ForegroundColor Yellow
vercel env ls | Select-String -Pattern "FIREBASE_API_KEY"

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "TO VIEW/UPDATE IN DASHBOARD:" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Go to:" -ForegroundColor White
Write-Host "   https://vercel.com/anas-s-projects-8d19f880/cryptorafts-starter/settings/environment-variables" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Find: NEXT_PUBLIC_FIREBASE_API_KEY" -ForegroundColor White
Write-Host ""
Write-Host "3. Check the value:" -ForegroundColor White
Write-Host "   Should be: AIzaSyAo2aRQPZU5naLm4bFCDbqTA1gNW8oFB14" -ForegroundColor Green
Write-Host "   Should NOT be: `"AIzaSyAo2aRQPZU5naLm4bFCDbqTA1gNW8oFB14`"" -ForegroundColor Red
Write-Host ""
Write-Host "4. If it has quotes, click Edit and remove them" -ForegroundColor Yellow
Write-Host ""
Write-Host "5. Make sure it's set for:" -ForegroundColor White
Write-Host "   ✅ Production" -ForegroundColor Green
Write-Host "   ✅ Preview" -ForegroundColor Green
Write-Host "   ✅ Development" -ForegroundColor Green
Write-Host ""

