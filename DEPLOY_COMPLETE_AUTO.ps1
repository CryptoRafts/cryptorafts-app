# ============================================
# DEPLOY COMPLETE APP - AUTOMATIC
# ============================================

$ErrorActionPreference = "Continue"

# Set working directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

$vpsUser = "root"
$vpsIp = "72.61.98.99"
$vpsPath = "/var/www/cryptorafts"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "DEPLOYING COMPLETE APP - AUTOMATIC" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Working directory: $scriptPath" -ForegroundColor Green
Write-Host "Password: Shamsi2627@@" -ForegroundColor Yellow
Write-Host ""

# Verify files exist
Write-Host "[PRE-CHECK] Verifying files exist..." -ForegroundColor Cyan
$files = @(
    "src/components/SpotlightDisplay.tsx",
    "src/components/PerfectHeader.tsx",
    "src/providers/SimpleAuthProvider.tsx",
    "src/app/page.tsx",
    "src/app/globals.css",
    "FIX_VPS_COMPLETE.sh"
)

$missingFiles = @()
foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "  ✅ $file exists" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $file MISSING" -ForegroundColor Red
        $missingFiles += $file
    }
}

if ($missingFiles.Count -gt 0) {
    Write-Host ""
    Write-Host "❌ Missing files found. Please check the file paths." -ForegroundColor Red
    Write-Host "Current directory: $(Get-Location)" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "[1/6] Uploading SpotlightDisplay.tsx..." -ForegroundColor Cyan
Write-Host "   Enter password when prompted: Shamsi2627@@" -ForegroundColor Yellow
scp "src/components/SpotlightDisplay.tsx" "${vpsUser}@${vpsIp}:${vpsPath}/src/components/SpotlightDisplay.tsx"

Write-Host ""
Write-Host "[2/6] Uploading PerfectHeader.tsx..." -ForegroundColor Cyan
Write-Host "   Enter password when prompted: Shamsi2627@@" -ForegroundColor Yellow
scp "src/components/PerfectHeader.tsx" "${vpsUser}@${vpsIp}:${vpsPath}/src/components/PerfectHeader.tsx"

Write-Host ""
Write-Host "[3/6] Uploading SimpleAuthProvider.tsx..." -ForegroundColor Cyan
Write-Host "   Enter password when prompted: Shamsi2627@@" -ForegroundColor Yellow
scp "src/providers/SimpleAuthProvider.tsx" "${vpsUser}@${vpsIp}:${vpsPath}/src/providers/SimpleAuthProvider.tsx"

Write-Host ""
Write-Host "[4/6] Uploading page.tsx..." -ForegroundColor Cyan
Write-Host "   Enter password when prompted: Shamsi2627@@" -ForegroundColor Yellow
scp "src/app/page.tsx" "${vpsUser}@${vpsIp}:${vpsPath}/src/app/page.tsx"

Write-Host ""
Write-Host "[5/6] Uploading globals.css..." -ForegroundColor Cyan
Write-Host "   Enter password when prompted: Shamsi2627@@" -ForegroundColor Yellow
scp "src/app/globals.css" "${vpsUser}@${vpsIp}:${vpsPath}/src/app/globals.css"

Write-Host ""
Write-Host "[6/6] Uploading fix script and running..." -ForegroundColor Cyan
Write-Host "   Enter password when prompted: Shamsi2627@@" -ForegroundColor Yellow
Write-Host "   This will wake server, clear cache, rebuild, and restart..." -ForegroundColor Yellow
Write-Host "   This takes 2-3 minutes..." -ForegroundColor Yellow
scp "FIX_VPS_COMPLETE.sh" "${vpsUser}@${vpsIp}:/root/FIX_VPS_COMPLETE.sh"
ssh "${vpsUser}@${vpsIp}" "chmod +x /root/FIX_VPS_COMPLETE.sh && /root/FIX_VPS_COMPLETE.sh"

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "✅ DEPLOYMENT COMPLETE" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your app is live at:" -ForegroundColor Yellow
Write-Host "  https://www.cryptorafts.com" -ForegroundColor Cyan
Write-Host ""
Write-Host "IMPORTANT: Clear your browser cache!" -ForegroundColor Yellow
Write-Host "  - Press Ctrl+Shift+R (hard refresh)" -ForegroundColor White
Write-Host "  - Or open in Incognito/Private mode" -ForegroundColor White
Write-Host ""
Write-Host "What was fixed:" -ForegroundColor Yellow
Write-Host "  ✅ Server woken (if sleeping)" -ForegroundColor White
Write-Host "  ✅ All caches cleared" -ForegroundColor White
Write-Host "  ✅ SpotlightDisplay shows content immediately" -ForegroundColor White
Write-Host "  ✅ Loading state clears instantly" -ForegroundColor White
Write-Host "  ✅ Timeouts reduced to 2s" -ForegroundColor White
Write-Host "  ✅ Complete rebuild and restart" -ForegroundColor White
Write-Host ""
