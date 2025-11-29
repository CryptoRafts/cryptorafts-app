# Build Diagnostic Script
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  BUILD DIAGNOSTIC TOOL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check Node version
Write-Host "[1/6] Checking Node.js..." -ForegroundColor Yellow
$nodeVersion = node --version
Write-Host "  Node.js: $nodeVersion" -ForegroundColor Green

# Check npm version
Write-Host "[2/6] Checking npm..." -ForegroundColor Yellow
$npmVersion = npm --version
Write-Host "  npm: $npmVersion" -ForegroundColor Green

# Check for running node processes
Write-Host "[3/6] Checking for running Node processes..." -ForegroundColor Yellow
$nodeProcesses = Get-Process node -ErrorAction SilentlyContinue
$processCount = ($nodeProcesses | Measure-Object).Count
Write-Host "  Running Node processes: $processCount" -ForegroundColor $(if ($processCount -gt 3) { "Red" } else { "Green" })
if ($processCount -gt 3) {
    Write-Host "  WARNING: Multiple Node processes detected!" -ForegroundColor Red
    Write-Host "  Consider closing them with: Stop-Process -Name node -Force" -ForegroundColor Yellow
}

# Check disk space
Write-Host "[4/6] Checking disk space..." -ForegroundColor Yellow
$drive = Get-PSDrive -Name (Get-Location).Drive.Name
$freeGB = [math]::Round($drive.Free / 1GB, 2)
Write-Host "  Free space: $freeGB GB" -ForegroundColor $(if ($freeGB -lt 5) { "Red" } else { "Green" })
if ($freeGB -lt 5) {
    Write-Host "  WARNING: Low disk space may cause build issues!" -ForegroundColor Red
}

# Check .next folder size
Write-Host "[5/6] Checking build cache..." -ForegroundColor Yellow
if (Test-Path ".next") {
    $nextSize = (Get-ChildItem -Path .next -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum / 1MB
    $nextSizeGB = [math]::Round($nextSize / 1024, 2)
    Write-Host "  .next folder size: $nextSizeGB GB" -ForegroundColor Yellow
    if ($nextSizeGB -gt 2) {
        Write-Host "  Consider cleaning: Remove-Item -Recurse -Force .next" -ForegroundColor Yellow
    }
} else {
    Write-Host "  .next folder: Not found (fresh build)" -ForegroundColor Green
}

# Check for TypeScript errors
Write-Host "[6/6] Running TypeScript check..." -ForegroundColor Yellow
$tscResult = npm run type-check 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "  TypeScript: No errors found" -ForegroundColor Green
} else {
    Write-Host "  TypeScript: Errors found!" -ForegroundColor Red
    Write-Host "  Check TypeScript errors before building" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DIAGNOSTIC COMPLETE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. If multiple Node processes: Stop-Process -Name node -Force" -ForegroundColor White
Write-Host "2. If .next is large: Remove-Item -Recurse -Force .next" -ForegroundColor White
Write-Host "3. Try building: npm run build" -ForegroundColor White
Write-Host ""


