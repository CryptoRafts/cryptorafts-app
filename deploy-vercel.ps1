# 🚀 Vercel Deployment Script for CryptoRafts
# This script helps you deploy your app to Vercel

Write-Host "🚀 CryptoRafts - Vercel Deployment Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Vercel CLI is installed
Write-Host "📦 Checking Vercel CLI installation..." -ForegroundColor Yellow
$vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue

if (-not $vercelInstalled) {
    Write-Host "⚠️  Vercel CLI not found. Installing..." -ForegroundColor Yellow
    npm install -g vercel
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install Vercel CLI" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Vercel CLI installed successfully" -ForegroundColor Green
} else {
    Write-Host "✅ Vercel CLI is already installed" -ForegroundColor Green
}

Write-Host ""
Write-Host "🔐 Step 1: Login to Vercel" -ForegroundColor Cyan
Write-Host "Please login to your Vercel account..." -ForegroundColor Yellow
vercel login

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Login failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📋 Step 2: Environment Variables Checklist" -ForegroundColor Cyan
Write-Host "Before deploying, make sure you've added these in Vercel Dashboard:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Required Environment Variables:" -ForegroundColor White
Write-Host "  - NEXT_PUBLIC_FIREBASE_API_KEY" -ForegroundColor Gray
Write-Host "  - NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN" -ForegroundColor Gray
Write-Host "  - NEXT_PUBLIC_FIREBASE_PROJECT_ID" -ForegroundColor Gray
Write-Host "  - NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET" -ForegroundColor Gray
Write-Host "  - NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID" -ForegroundColor Gray
Write-Host "  - NEXT_PUBLIC_FIREBASE_APP_ID" -ForegroundColor Gray
Write-Host "  - FIREBASE_SERVICE_ACCOUNT_B64" -ForegroundColor Gray
Write-Host "  - NEXT_PUBLIC_APP_URL" -ForegroundColor Gray
Write-Host "  - ADMIN_EMAIL" -ForegroundColor Gray
Write-Host ""
$continue = Read-Host "Have you added all environment variables in Vercel Dashboard? (y/n)"

if ($continue -ne "y" -and $continue -ne "Y") {
    Write-Host ""
    Write-Host "⚠️  Please add environment variables first:" -ForegroundColor Yellow
    Write-Host "   1. Go to: https://vercel.com/anas-s-projects-8d19f880" -ForegroundColor Cyan
    Write-Host "   2. Select your project" -ForegroundColor Cyan
    Write-Host "   3. Go to Settings → Environment Variables" -ForegroundColor Cyan
    Write-Host "   4. Add all required variables" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "See DEPLOY_TO_VERCEL.md for complete list" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "🔍 Step 3: Checking Git status..." -ForegroundColor Cyan
$gitStatus = git status --porcelain

if ($gitStatus) {
    Write-Host "⚠️  You have uncommitted changes:" -ForegroundColor Yellow
    Write-Host $gitStatus -ForegroundColor Gray
    Write-Host ""
    $commit = Read-Host "Do you want to commit changes before deploying? (y/n)"
    
    if ($commit -eq "y" -or $commit -eq "Y") {
        Write-Host "📝 Committing changes..." -ForegroundColor Yellow
        git add .
        $commitMessage = Read-Host "Enter commit message (or press Enter for default)"
        if ([string]::IsNullOrWhiteSpace($commitMessage)) {
            $commitMessage = "Deploy to Vercel"
        }
        git commit -m $commitMessage
        
        Write-Host "📤 Pushing to remote..." -ForegroundColor Yellow
        git push
    }
} else {
    Write-Host "✅ No uncommitted changes" -ForegroundColor Green
}

Write-Host ""
Write-Host "🚀 Step 4: Deploying to Vercel..." -ForegroundColor Cyan
Write-Host "This will deploy to production (www.cryptorafts.com)" -ForegroundColor Yellow
Write-Host ""

$deployType = Read-Host "Deploy type: (1) Preview, (2) Production (default: 2)"

if ($deployType -eq "1") {
    Write-Host "📦 Deploying preview..." -ForegroundColor Yellow
    vercel
} else {
    Write-Host "🌐 Deploying to production..." -ForegroundColor Yellow
    vercel --prod
}

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Deployment successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 Your app is live at:" -ForegroundColor Cyan
    Write-Host "   https://www.cryptorafts.com" -ForegroundColor White
    Write-Host ""
    Write-Host "📊 View deployment:" -ForegroundColor Cyan
    Write-Host "   https://vercel.com/anas-s-projects-8d19f880" -ForegroundColor White
    Write-Host ""
    Write-Host "🎉 Next steps:" -ForegroundColor Cyan
    Write-Host "   1. Test your live site" -ForegroundColor White
    Write-Host "   2. Check Vercel dashboard for analytics" -ForegroundColor White
    Write-Host "   3. Monitor for any errors" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "❌ Deployment failed. Check the error messages above." -ForegroundColor Red
    Write-Host "   Common issues:" -ForegroundColor Yellow
    Write-Host "   - Missing environment variables" -ForegroundColor Gray
    Write-Host "   - Build errors (check logs)" -ForegroundColor Gray
    Write-Host "   - Network issues" -ForegroundColor Gray
    exit 1
}

