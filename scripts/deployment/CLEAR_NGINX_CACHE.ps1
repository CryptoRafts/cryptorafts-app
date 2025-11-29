# ========================================
# CLEAR NGINX CACHE
# ========================================
# This script clears nginx cache on VPS

$ErrorActionPreference = "Stop"

# VPS Configuration
$vpsUser = "root"
$vpsIp = "72.61.98.99"  # Replace with your actual VPS IP

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "CLEARING NGINX CACHE" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "VPS: $vpsUser@$vpsIp" -ForegroundColor Yellow
Write-Host ""

# Step 1: Clear nginx cache
Write-Host "Step 1: Clearing nginx cache..." -ForegroundColor Yellow
Write-Host "   (You will be prompted for SSH password)" -ForegroundColor Gray
Write-Host ""

try {
    $clearCacheCommand = 'cd /var/www/cryptorafts; echo "Clearing nginx cache..."; sudo rm -rf /var/cache/nginx/* 2>/dev/null || true; sudo rm -rf /var/lib/nginx/cache/* 2>/dev/null || true; sudo rm -rf /tmp/nginx_cache/* 2>/dev/null || true; echo "Nginx cache cleared"; echo ""; echo "Reloading nginx..."; sudo nginx -t && sudo systemctl reload nginx || sudo service nginx reload; echo "Nginx reloaded"; echo ""; echo "Clearing browser cache headers..."; sudo nginx -s reload 2>/dev/null || true; echo "Nginx cache cleared and reloaded"'

    Write-Host "   Running cache clear commands..." -ForegroundColor Gray
    ssh "${vpsUser}@${vpsIp}" $clearCacheCommand
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Nginx cache cleared successfully!" -ForegroundColor Green
    } else {
        Write-Host "Cache clear completed with warnings (exit code: $LASTEXITCODE)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "Error clearing nginx cache: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "You can manually SSH to the VPS and run:" -ForegroundColor Yellow
    Write-Host "  ssh ${vpsUser}@${vpsIp}" -ForegroundColor Cyan
    Write-Host "  sudo rm -rf /var/cache/nginx/*" -ForegroundColor Cyan
    Write-Host "  sudo rm -rf /var/lib/nginx/cache/*" -ForegroundColor Cyan
    Write-Host "  sudo systemctl reload nginx" -ForegroundColor Cyan
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "NGINX CACHE CLEARED!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Run deployment: .\FRESH_DEPLOY_ALL.ps1" -ForegroundColor Cyan
Write-Host "2. Clear your browser cache (Ctrl+Shift+R)" -ForegroundColor Gray
Write-Host "3. Visit https://www.cryptorafts.com" -ForegroundColor Gray
Write-Host ""
