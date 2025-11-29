# Deploy to Vercel
# Complete deployment script

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Vercel Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Vercel CLI is installed
$vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue

if (-not $vercelInstalled) {
    Write-Host "⚠️  Vercel CLI not found. Installing..." -ForegroundColor Yellow
    npm install -g vercel
    Write-Host "✅ Vercel CLI installed" -ForegroundColor Green
} else {
    Write-Host "✅ Vercel CLI found" -ForegroundColor Green
}

Write-Host ""
Write-Host "Deployment Options:" -ForegroundColor Yellow
Write-Host "  1. Preview deployment (vercel)" -ForegroundColor Gray
Write-Host "  2. Production deployment (vercel --prod)" -ForegroundColor Gray
Write-Host ""

$choice = Read-Host "Choose option (1 or 2)"

if ($choice -eq "1") {
    Write-Host ""
    Write-Host "🚀 Deploying to preview..." -ForegroundColor Cyan
    vercel
} elseif ($choice -eq "2") {
    Write-Host ""
    Write-Host "🚀 Deploying to production..." -ForegroundColor Cyan
    vercel --prod
} else {
    Write-Host "❌ Invalid choice" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Add environment variables in Vercel dashboard" -ForegroundColor Gray
Write-Host "  2. Set up cron job (see DEPLOY_VERCEL_FIREBASE.md)" -ForegroundColor Gray
Write-Host "  3. Create Firebase collections" -ForegroundColor Gray
Write-Host ""

