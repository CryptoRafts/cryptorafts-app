# ============================================
# CRYPTORAFTS - CHECK AND FIX NOW
# Quick check of server status and logs
# ============================================

$vpsIP = "72.61.98.99"
$vpsUser = "root"
$appDir = "/var/www/cryptorafts"

Write-Host ""
Write-Host "CRYPTORAFTS - CHECK AND FIX NOW" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Step 1: Checking PM2 status..." -ForegroundColor Yellow
ssh "${vpsUser}@${vpsIP}" "cd ${appDir} && pm2 status"

Write-Host ""
Write-Host "Step 2: Checking PM2 logs (last 30 lines)..." -ForegroundColor Yellow
ssh "${vpsUser}@${vpsIP}" "cd ${appDir} && pm2 logs cryptorafts --lines 30 --nostream"

Write-Host ""
Write-Host "Step 3: Testing local server..." -ForegroundColor Yellow
ssh "${vpsUser}@${vpsIP}" "curl -sS -I http://127.0.0.1:3000 | head -5"

Write-Host ""
Write-Host "Step 4: Testing public URL..." -ForegroundColor Yellow
ssh "${vpsUser}@${vpsIP}" "curl -sS -I https://www.cryptorafts.com | head -5"

Write-Host ""
Write-Host "Step 5: Restarting PM2..." -ForegroundColor Yellow
ssh "${vpsUser}@${vpsIP}" "cd ${appDir} && pm2 restart cryptorafts && sleep 5 && pm2 status"

Write-Host ""
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "CHECK COMPLETE" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Cyan

