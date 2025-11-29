# 🚀 ONE-CLICK DEPLOY TO VERCEL
# Run this script to deploy everything automatically

Write-Host "🚀 Deploying CryptoRafts to Vercel..." -ForegroundColor Cyan
Write-Host ""

# Link project (if not already linked)
if (-not (Test-Path .vercel)) {
    Write-Host "🔗 Linking project to Vercel..." -ForegroundColor Yellow
    Write-Host "When prompted:" -ForegroundColor Cyan
    Write-Host "  - Link to existing project? Yes" -ForegroundColor Gray
    Write-Host "  - Project name: cryptorafts (or press Enter)" -ForegroundColor Gray
    Write-Host "  - Directory: . (press Enter)" -ForegroundColor Gray
    Write-Host ""
    vercel link --yes
}

# Deploy to production
Write-Host ""
Write-Host "🌐 Deploying to production (www.cryptorafts.com)..." -ForegroundColor Yellow
Write-Host ""

vercel --prod --yes

Write-Host ""
Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  IMPORTANT: Add environment variables in Vercel Dashboard:" -ForegroundColor Yellow
Write-Host "   https://vercel.com/anas-s-projects-8d19f880" -ForegroundColor Cyan
Write-Host "   Settings → Environment Variables" -ForegroundColor Cyan
Write-Host ""
Write-Host "See DEPLOY_TO_VERCEL.md for the complete list" -ForegroundColor Gray
