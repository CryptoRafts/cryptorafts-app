# Add DNS Records to Hostinger - Interactive Script
# This script opens Hostinger and guides you through adding DNS records

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Add DNS Records to Hostinger" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if DKIM key exists
$dkimFile = "HOSTINGER_DKIM_KEY.txt"
if (-not (Test-Path $dkimFile)) {
    Write-Host "ERROR: DKIM key not found!" -ForegroundColor Red
    Write-Host "Run: .\scripts\setup-hostinger-complete.ps1 first" -ForegroundColor Yellow
    exit 1
}

Write-Host "Step 1: Opening Hostinger DNS Zone Editor..." -ForegroundColor Yellow
Start-Process "https://hpanel.hostinger.com/domains/dns"
Write-Host "  OK: Browser opened" -ForegroundColor Green
Write-Host ""

Write-Host "Step 2: Displaying DNS Records to Add" -ForegroundColor Yellow
Write-Host ""
Write-Host "Copy these records and add them in Hostinger:" -ForegroundColor Cyan
Write-Host ""

Write-Host "RECORD 1 - MX:" -ForegroundColor Yellow
Write-Host "  Type: MX" -ForegroundColor White
Write-Host "  Name: @" -ForegroundColor White
Write-Host "  Value: mx1.hostinger.com" -ForegroundColor White
Write-Host "  Priority: 5" -ForegroundColor White
Write-Host ""

Write-Host "RECORD 2 - MX:" -ForegroundColor Yellow
Write-Host "  Type: MX" -ForegroundColor White
Write-Host "  Name: @" -ForegroundColor White
Write-Host "  Value: mx2.hostinger.com" -ForegroundColor White
Write-Host "  Priority: 10" -ForegroundColor White
Write-Host ""

Write-Host "RECORD 3 - SPF:" -ForegroundColor Yellow
Write-Host "  Type: TXT" -ForegroundColor White
Write-Host "  Name: @" -ForegroundColor White
Write-Host "  Value: v=spf1 include:hostinger.com ~all" -ForegroundColor White
Write-Host ""

Write-Host "RECORD 4 - DKIM:" -ForegroundColor Yellow
Write-Host "  Type: TXT" -ForegroundColor White
Write-Host "  Name: default._domainkey" -ForegroundColor White
$dkimKey = Get-Content $dkimFile -Raw
Write-Host "  Value: $dkimKey" -ForegroundColor White
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Instructions:" -ForegroundColor Yellow
Write-Host "  1. In Hostinger, go to: Domains → DNS / Name Servers" -ForegroundColor White
Write-Host "  2. Find cryptorafts.com" -ForegroundColor White
Write-Host "  3. Click 'DNS Zone Editor' or 'Manage DNS'" -ForegroundColor White
Write-Host "  4. DELETE any existing MX records first!" -ForegroundColor Red
Write-Host "  5. ADD the 4 records above (one by one)" -ForegroundColor White
Write-Host "  6. Click 'Save' or 'Add Record' for each" -ForegroundColor White
Write-Host ""
Write-Host "Press Enter when DNS records are added..." -ForegroundColor Yellow
Read-Host
Write-Host ""

Write-Host "Step 3: Waiting for DNS Propagation" -ForegroundColor Yellow
Write-Host "  DNS changes take 15-30 minutes to propagate" -ForegroundColor White
Write-Host "  After waiting, run: .\scripts\check-dns-records.ps1" -ForegroundColor Cyan
Write-Host ""

Write-Host "Step 4: Verify in Hostinger" -ForegroundColor Yellow
Write-Host "  1. Go to: Email → Email Accounts" -ForegroundColor White
Write-Host "  2. Click on business@cryptorafts.com" -ForegroundColor White
Write-Host "  3. Check status - should show 'Domain connected'" -ForegroundColor White
Write-Host "  4. MX, SPF, DKIM should all show 'OK'" -ForegroundColor White
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DNS Records Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Wait 15-30 minutes for DNS propagation" -ForegroundColor White
Write-Host "  2. Verify: .\scripts\check-dns-records.ps1" -ForegroundColor White
Write-Host "  3. Check Hostinger: Email → Email Accounts" -ForegroundColor White
Write-Host "  4. Redeploy: vercel --prod --yes" -ForegroundColor White
Write-Host ""

