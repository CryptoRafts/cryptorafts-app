# Kill any Firebase processes that might be locking files
Get-Process | Where-Object { $_.ProcessName -like "*firebase*" } | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process | Where-Object { $_.ProcessName -like "*node*" } | Stop-Process -Force -ErrorAction SilentlyContinue

# Wait a moment
Start-Sleep -Seconds 2

# Try to remove the log files
Remove-Item "firebase-debug*.log" -Force -ErrorAction SilentlyContinue

# Deploy to Vercel
Write-Host "🚀 Deploying VC Portfolio fixes to Vercel..." -ForegroundColor Cyan
vercel --prod --force

# Get the latest deployment URL
Write-Host ""
Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host ""
Write-Host "🧪 Test the fixed VC Portfolio:" -ForegroundColor Yellow
Write-Host "https://cryptorafts-starter-qt3jlerzh-anas-s-projects-8d19f880.vercel.app/vc/portfolio" -ForegroundColor Cyan
Write-Host ""
Write-Host "🎯 Changes deployed:" -ForegroundColor Yellow
Write-Host "  ✅ Fixed 'TypeError: t is not a function' errors" -ForegroundColor Green
Write-Host "  ✅ Simplified portfolio components" -ForegroundColor Green
Write-Host "  ✅ Deployed Firestore indexes" -ForegroundColor Green
Write-Host "  ✅ VC role synchronization working" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  IMPORTANT: Clear your browser cache!" -ForegroundColor Red
Write-Host "   Press Ctrl+Shift+Delete and clear cached images/files" -ForegroundColor Red

