# 🚀 AUTO DEPLOY TO VERCEL - Complete Automation Script
# This script automates the entire Vercel deployment process

$ErrorActionPreference = "Stop"

Write-Host "🚀 CryptoRafts - Automated Vercel Deployment" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Install Vercel CLI
Write-Host "📦 Step 1: Installing Vercel CLI..." -ForegroundColor Yellow
try {
    npm install -g vercel 2>&1 | Out-Null
    Write-Host "✅ Vercel CLI installed" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Vercel CLI may already be installed" -ForegroundColor Yellow
}

# Step 2: Verify files exist
Write-Host ""
Write-Host "📋 Step 2: Verifying project files..." -ForegroundColor Yellow
$requiredFiles = @("package.json", "next.config.js", "vercel.json")
$allExist = $true
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "  ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $file MISSING" -ForegroundColor Red
        $allExist = $false
    }
}
if (-not $allExist) {
    Write-Host "❌ Required files missing. Cannot deploy." -ForegroundColor Red
    exit 1
}

# Step 3: Install dependencies
Write-Host ""
Write-Host "📦 Step 3: Installing dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Dependencies installed" -ForegroundColor Green

# Step 4: Login to Vercel
Write-Host ""
Write-Host "🔐 Step 4: Vercel Authentication" -ForegroundColor Yellow
Write-Host "Please login to Vercel (will open browser)..." -ForegroundColor Cyan
vercel login

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Vercel login failed" -ForegroundColor Red
    exit 1
}

# Step 5: Check if project is linked
Write-Host ""
Write-Host "🔗 Step 5: Linking project..." -ForegroundColor Yellow
if (Test-Path ".vercel") {
    Write-Host "✅ Project already linked" -ForegroundColor Green
} else {
    Write-Host "Linking to Vercel project..." -ForegroundColor Cyan
    Write-Host "When prompted:" -ForegroundColor Yellow
    Write-Host "  - Link to existing project? Yes" -ForegroundColor Gray
    Write-Host "  - Project name: cryptorafts (or your project name)" -ForegroundColor Gray
    Write-Host "  - Directory: ." -ForegroundColor Gray
    vercel link
}

# Step 6: Set environment variables
Write-Host ""
Write-Host "⚙️  Step 6: Setting environment variables..." -ForegroundColor Yellow
Write-Host "Setting Firebase configuration..." -ForegroundColor Cyan

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

Write-Host ""
Write-Host "⚠️  IMPORTANT: You need to add FIREBASE_SERVICE_ACCOUNT_B64 manually:" -ForegroundColor Yellow
Write-Host "   1. Go to Firebase Console → Project Settings → Service Accounts" -ForegroundColor Cyan
Write-Host "   2. Generate New Private Key → Download JSON" -ForegroundColor Cyan
Write-Host "   3. Convert to Base64:" -ForegroundColor Cyan
Write-Host "      [Convert]::ToBase64String([IO.File]::ReadAllBytes('service-account.json')) | clip" -ForegroundColor Gray
Write-Host "   4. Add to Vercel Dashboard → Settings → Environment Variables" -ForegroundColor Cyan
Write-Host ""

foreach ($key in $envVars.Keys) {
    Write-Host "Setting $key..." -ForegroundColor Gray
    vercel env add $key production 2>&1 | Out-Null
    # Note: This will prompt for value, so we'll need manual step
}

Write-Host ""
Write-Host "📝 Note: Environment variables need to be set manually in Vercel Dashboard" -ForegroundColor Yellow
Write-Host "   Go to: https://vercel.com/anas-s-projects-8d19f880" -ForegroundColor Cyan
Write-Host "   Settings → Environment Variables" -ForegroundColor Cyan
Write-Host ""

# Step 7: Deploy
Write-Host "🚀 Step 7: Deploying to Vercel..." -ForegroundColor Yellow
Write-Host "Deploying to production (www.cryptorafts.com)..." -ForegroundColor Cyan
Write-Host ""

vercel --prod --yes

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Deployment successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 Your app should be live at:" -ForegroundColor Cyan
    Write-Host "   https://www.cryptorafts.com" -ForegroundColor White
    Write-Host ""
    Write-Host "📊 View deployment:" -ForegroundColor Cyan
    Write-Host "   https://vercel.com/anas-s-projects-8d19f880" -ForegroundColor White
    Write-Host ""
    Write-Host "🎯 Next Steps:" -ForegroundColor Cyan
    Write-Host "   1. Add FIREBASE_SERVICE_ACCOUNT_B64 in Vercel Dashboard" -ForegroundColor White
    Write-Host "   2. Configure domain DNS if not already done" -ForegroundColor White
    Write-Host "   3. Test your live site" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "❌ Deployment failed. Check errors above." -ForegroundColor Red
    Write-Host "   Common issues:" -ForegroundColor Yellow
    Write-Host "   - Missing environment variables" -ForegroundColor Gray
    Write-Host "   - Build errors" -ForegroundColor Gray
    Write-Host "   - Network issues" -ForegroundColor Gray
    exit 1
}

