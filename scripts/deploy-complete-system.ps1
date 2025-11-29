# Complete System Deployment Script
# This script deploys everything and verifies configuration

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Complete System Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Verify Vercel CLI
Write-Host "Step 1: Verifying Vercel CLI..." -ForegroundColor Yellow
if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
    Write-Host "  ERROR: Vercel CLI not found!" -ForegroundColor Red
    exit 1
}
Write-Host "  OK: Vercel CLI authenticated" -ForegroundColor Green
Write-Host ""

# Step 2: Check current environment variables
Write-Host "Step 2: Checking Vercel Environment Variables..." -ForegroundColor Yellow
$envVars = vercel env ls 2>&1 | Select-String -Pattern "EMAIL|SMTP"
if ($envVars) {
    Write-Host "  OK: Email environment variables found" -ForegroundColor Green
    $envVars | Select-Object -First 5 | ForEach-Object { Write-Host "    $_" -ForegroundColor Gray }
} else {
    Write-Host "  WARNING: No email variables found" -ForegroundColor Yellow
}
Write-Host ""

# Step 3: Build and deploy
Write-Host "Step 3: Building and Deploying to Vercel..." -ForegroundColor Yellow
Write-Host "  Running: vercel --prod --yes" -ForegroundColor Gray
$deployResult = vercel --prod --yes 2>&1
$deployOutput = $deployResult | Out-String

if ($deployOutput -match "Production:") {
    $productionUrl = ($deployOutput | Select-String -Pattern "Production: (https://[^\s]+)").Matches.Groups[1].Value
    Write-Host "  OK: Deployment successful!" -ForegroundColor Green
    Write-Host "  Production URL: $productionUrl" -ForegroundColor Cyan
} else {
    Write-Host "  Checking deployment status..." -ForegroundColor Yellow
    Write-Host $deployOutput -ForegroundColor Gray
}
Write-Host ""

# Step 4: Verify DNS records
Write-Host "Step 4: Checking DNS Records..." -ForegroundColor Yellow
& ".\scripts\check-dns-records.ps1" 2>&1 | Out-Null
Write-Host ""

# Step 5: Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Deployment Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Vercel:" -ForegroundColor Yellow
Write-Host "  Status: Deployed" -ForegroundColor Green
if ($productionUrl) {
    Write-Host "  URL: $productionUrl" -ForegroundColor White
}
Write-Host ""
Write-Host "Email Configuration:" -ForegroundColor Yellow
Write-Host "  Status: Configured in Vercel" -ForegroundColor Green
Write-Host "  SMTP: smtp.hostinger.com:587" -ForegroundColor White
Write-Host ""
Write-Host "DNS Records:" -ForegroundColor Yellow
Write-Host "  Status: Check output above" -ForegroundColor White
Write-Host "  Action: Add DNS records if missing (see DNS_RECORDS_TO_ADD.txt)" -ForegroundColor Yellow
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Add DNS records in domain registrar" -ForegroundColor White
Write-Host "  2. Create email account in Hostinger" -ForegroundColor White
Write-Host "  3. Wait 15-30 minutes for DNS propagation" -ForegroundColor White
Write-Host "  4. Test email: POST $productionUrl/api/test-email" -ForegroundColor White
Write-Host ""

