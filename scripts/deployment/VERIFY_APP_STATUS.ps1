# ============================================
# VERIFY APP STATUS ON VPS
# Checks if app is actually working
# ============================================

$vpsUser = "root"
$vpsIp = "72.61.98.99"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "VERIFYING APP STATUS" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check PM2 status
Write-Host "[1/4] Checking PM2 status..." -ForegroundColor Cyan
ssh "${vpsUser}@${vpsIp}" "pm2 status"
Write-Host ""

# Check if app responds on port 3000
Write-Host "[2/4] Checking app on port 3000..." -ForegroundColor Cyan
ssh "${vpsUser}@${vpsIp}" "curl -s http://localhost:3000 | head -c 500"
Write-Host ""
Write-Host ""

# Check PM2 logs
Write-Host "[3/4] Checking PM2 logs (last 20 lines)..." -ForegroundColor Cyan
ssh "${vpsUser}@${vpsIp}" "pm2 logs cryptorafts --lines 20 --nostream"
Write-Host ""

# Check nginx
Write-Host "[4/4] Checking nginx..." -ForegroundColor Cyan
ssh "${vpsUser}@${vpsIp}" "sudo nginx -t && sudo systemctl status nginx --no-pager | head -n 10"
Write-Host ""

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "STATUS CHECK COMPLETE" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

