# ⚙️ Setup Vercel Environment Variables Script
# This script helps you add environment variables to Vercel

Write-Host "⚙️  Vercel Environment Variables Setup" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Check if Vercel CLI is installed
$vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue
if (-not $vercelInstalled) {
    Write-Host "❌ Vercel CLI not found. Installing..." -ForegroundColor Yellow
    npm install -g vercel
}

Write-Host "📋 Environment Variables to Add:" -ForegroundColor Yellow
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

Write-Host "Adding environment variables interactively..." -ForegroundColor Cyan
Write-Host "You'll be prompted for each value." -ForegroundColor Yellow
Write-Host ""

foreach ($key in $envVars.Keys) {
    Write-Host "Adding: $key" -ForegroundColor Gray
    Write-Host "Value: $($envVars[$key])" -ForegroundColor DarkGray
    Write-Host ""
    
    # Add for production
    Write-Host "Setting for Production environment..." -ForegroundColor Cyan
    echo $envVars[$key] | vercel env add $key production
    
    # Add for preview
    Write-Host "Setting for Preview environment..." -ForegroundColor Cyan
    echo $envVars[$key] | vercel env add $key preview
    
    # Add for development
    Write-Host "Setting for Development environment..." -ForegroundColor Cyan
    echo $envVars[$key] | vercel env add $key development
    
    Write-Host "✅ $key added" -ForegroundColor Green
    Write-Host ""
}

Write-Host ""
Write-Host "⚠️  IMPORTANT: Add FIREBASE_SERVICE_ACCOUNT_B64 manually:" -ForegroundColor Yellow
Write-Host "   1. Get service account JSON from Firebase Console" -ForegroundColor Cyan
Write-Host "   2. Convert to Base64:" -ForegroundColor Cyan
Write-Host "      [Convert]::ToBase64String([IO.File]::ReadAllBytes('service-account.json')) | clip" -ForegroundColor Gray
Write-Host "   3. Add to Vercel:" -ForegroundColor Cyan
Write-Host "      vercel env add FIREBASE_SERVICE_ACCOUNT_B64 production" -ForegroundColor Gray
Write-Host ""

Write-Host "✅ Environment variables setup complete!" -ForegroundColor Green

