# ⚙️ Add All Environment Variables to Vercel
# This script adds all required environment variables

Write-Host "⚙️  Adding Environment Variables to Vercel..." -ForegroundColor Cyan
Write-Host ""

$envVars = @{
    "NEXT_PUBLIC_FIREBASE_API_KEY" = "AIzaSyAo2aRQPZU5naLm4bFCDbqTA1gNW8oFB14"
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN" = "cryptorafts-b9067.firebaseapp.com"
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID" = "cryptorafts-b9067"
    "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET" = "cryptorafts-b9067.firebasestorage.app"
    "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID" = "374711838796"
    "NEXT_PUBLIC_FIREBASE_APP_ID" = "1:374711838796:web:3bee725bfa7d8790456ce9"
    "NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID" = "G-ZRQ955RGWH"
    "NEXT_PUBLIC_APP_URL" = "https://www.cryptorafts.com"
    "NODE_ENV" = "production"
    "ADMIN_EMAIL" = "anasshamsiggc@gmail.com"
    "SUPER_ADMIN_EMAIL" = "anasshamsiggc@gmail.com"
}

$environments = @("production", "preview", "development")

foreach ($key in $envVars.Keys) {
    Write-Host "Adding: $key" -ForegroundColor Yellow
    
    foreach ($env in $environments) {
        Write-Host "  → Setting for $env..." -ForegroundColor Gray
        echo $envVars[$key] | vercel env add $key $env --yes 2>&1 | Out-Null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "    ✅ $env" -ForegroundColor Green
        } else {
            Write-Host "    ⚠️  $env (may already exist)" -ForegroundColor Yellow
        }
    }
    Write-Host ""
}

Write-Host "✅ Environment variables added!" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  IMPORTANT: Add FIREBASE_SERVICE_ACCOUNT_B64 manually:" -ForegroundColor Yellow
Write-Host "   1. Get service account JSON from Firebase Console" -ForegroundColor Cyan
Write-Host "   2. Convert to Base64:" -ForegroundColor Cyan
Write-Host "      [Convert]::ToBase64String([IO.File]::ReadAllBytes('service-account.json')) | clip" -ForegroundColor Gray
Write-Host "   3. Add to Vercel:" -ForegroundColor Cyan
Write-Host "      vercel env add FIREBASE_SERVICE_ACCOUNT_B64 production" -ForegroundColor Gray
Write-Host ""
Write-Host "Then redeploy:" -ForegroundColor Cyan
Write-Host "  vercel --prod" -ForegroundColor White

