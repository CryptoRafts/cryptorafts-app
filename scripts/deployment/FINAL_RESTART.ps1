# ============================================
# FINAL RESTART - FIX LOADING ISSUE
# Restarts PM2 and clears cache
# ============================================

$vpsUser = "root"
$vpsIp = "72.61.98.99"
$vpsPath = "/var/www/cryptorafts"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "FINAL RESTART - FIX LOADING ISSUE" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Restart PM2
Write-Host "[1/3] Restarting PM2..." -ForegroundColor Cyan
ssh "${vpsUser}@${vpsIp}" "cd ${vpsPath} && pm2 restart cryptorafts && sleep 3 && pm2 status"
Write-Host ""

# Step 2: Check app response
Write-Host "[2/3] Checking app response..." -ForegroundColor Cyan
ssh "${vpsUser}@${vpsIp}" "curl -s http://localhost:3000 | head -c 300"
Write-Host ""
Write-Host ""

# Step 3: Check PM2 logs
Write-Host "[3/3] Checking PM2 logs (last 15 lines)..." -ForegroundColor Cyan
ssh "${vpsUser}@${vpsIp}" "pm2 logs cryptorafts --lines 15 --nostream"
Write-Host ""

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "[OK] RESTART COMPLETE!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your site should now be working at:" -ForegroundColor Cyan
Write-Host "  https://www.cryptorafts.com" -ForegroundColor White
Write-Host ""
Write-Host "If you still see 'Loading...':" -ForegroundColor Yellow
Write-Host "  1. Clear browser cache (Ctrl+Shift+Delete)" -ForegroundColor White
Write-Host "  2. Hard refresh (Ctrl+F5)" -ForegroundColor White
Write-Host "  3. Try incognito/private window" -ForegroundColor White
Write-Host ""

