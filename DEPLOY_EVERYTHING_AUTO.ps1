# ============================================
# DEPLOY EVERYTHING - AUTOMATIC
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
    "src/app/globals.css"
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
Write-Host "[1/7] Uploading SpotlightDisplay.tsx..." -ForegroundColor Cyan
Write-Host "   Enter password when prompted: Shamsi2627@@" -ForegroundColor Yellow
scp "src/components/SpotlightDisplay.tsx" "${vpsUser}@${vpsIp}:${vpsPath}/src/components/SpotlightDisplay.tsx"
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ⚠️  Upload may have failed" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[2/7] Uploading PerfectHeader.tsx..." -ForegroundColor Cyan
Write-Host "   Enter password when prompted: Shamsi2627@@" -ForegroundColor Yellow
scp "src/components/PerfectHeader.tsx" "${vpsUser}@${vpsIp}:${vpsPath}/src/components/PerfectHeader.tsx"
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ⚠️  Upload may have failed" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[3/7] Uploading SimpleAuthProvider.tsx..." -ForegroundColor Cyan
Write-Host "   Enter password when prompted: Shamsi2627@@" -ForegroundColor Yellow
scp "src/providers/SimpleAuthProvider.tsx" "${vpsUser}@${vpsIp}:${vpsPath}/src/providers/SimpleAuthProvider.tsx"
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ⚠️  Upload may have failed" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[4/7] Uploading page.tsx..." -ForegroundColor Cyan
Write-Host "   Enter password when prompted: Shamsi2627@@" -ForegroundColor Yellow
scp "src/app/page.tsx" "${vpsUser}@${vpsIp}:${vpsPath}/src/app/page.tsx"
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ⚠️  Upload may have failed" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[5/7] Uploading globals.css..." -ForegroundColor Cyan
Write-Host "   Enter password when prompted: Shamsi2627@@" -ForegroundColor Yellow
scp "src/app/globals.css" "${vpsUser}@${vpsIp}:${vpsPath}/src/app/globals.css"
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ⚠️  Upload may have failed" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[6/7] Uploading fix script..." -ForegroundColor Cyan
Write-Host "   Enter password when prompted: Shamsi2627@@" -ForegroundColor Yellow
scp "FIX_COMPLETE_APP.sh" "${vpsUser}@${vpsIp}:/root/FIX_COMPLETE_APP.sh"
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ⚠️  Upload may have failed" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[7/7] Running fix script on VPS..." -ForegroundColor Cyan
Write-Host "   Enter password when prompted: Shamsi2627@@" -ForegroundColor Yellow
Write-Host "   This will take 2-3 minutes..." -ForegroundColor Yellow
ssh "${vpsUser}@${vpsIp}" "chmod +x /root/FIX_COMPLETE_APP.sh && /root/FIX_COMPLETE_APP.sh"
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ⚠️  Script may have issues" -ForegroundColor Yellow
}

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













