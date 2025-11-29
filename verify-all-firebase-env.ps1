# Verify All Firebase Environment Variables
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "VERIFYING ALL FIREBASE ENV VARS" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$firebaseVars = @{
    "NEXT_PUBLIC_FIREBASE_API_KEY" = "AIzaSyAo2aRQPZU5naLm4bFCDbqTA1gNW8oFB14"
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN" = "cryptorafts-b9067.firebaseapp.com"
    "NEXT_PUBLIC_FIREBASE_DATABASE_URL" = "https://cryptorafts-b9067-default-rtdb.firebaseio.com"
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID" = "cryptorafts-b9067"
    "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET" = "cryptorafts-b9067.firebasestorage.app"
    "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID" = "374711838796"
    "NEXT_PUBLIC_FIREBASE_APP_ID" = "1:374711838796:web:3bee725bfa7d8790456ce9"
    "NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID" = "G-ZRQ955RGWH"
}

Write-Host "Expected Firebase Configuration:" -ForegroundColor Yellow
Write-Host ""
foreach ($var in $firebaseVars.GetEnumerator()) {
    Write-Host "  $($var.Key) = $($var.Value)" -ForegroundColor White
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "CHECKING VERCEL ENV VARS:" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Run this command to see all Firebase vars:" -ForegroundColor Yellow
Write-Host "  vercel env ls | Select-String -Pattern 'FIREBASE'" -ForegroundColor Cyan
Write-Host ""
Write-Host "Or check in dashboard:" -ForegroundColor Yellow
Write-Host "  https://vercel.com/anas-s-projects-8d19f880/cryptorafts-starter/settings/environment-variables" -ForegroundColor Cyan
Write-Host ""
Write-Host "Make sure ALL these vars are set for:" -ForegroundColor Yellow
Write-Host "  ✅ Production" -ForegroundColor Green
Write-Host "  ✅ Preview" -ForegroundColor Green
Write-Host "  ✅ Development" -ForegroundColor Green
Write-Host ""

