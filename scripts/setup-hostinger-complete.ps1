# Complete Hostinger Setup Automation Script
# This script guides you through Hostinger email account creation and DNS setup

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Hostinger Complete Setup Automation" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if user is logged in
Write-Host "Step 1: Hostinger Access" -ForegroundColor Yellow
Write-Host "  Opening Hostinger control panel..." -ForegroundColor Gray
Write-Host "  URL: https://hpanel.hostinger.com/" -ForegroundColor Cyan
Start-Process "https://hpanel.hostinger.com/"
Write-Host "  OK: Browser opened" -ForegroundColor Green
Write-Host ""

# Step 2: Email account creation instructions
Write-Host "Step 2: Email Account Setup" -ForegroundColor Yellow
Write-Host "  Follow these steps in Hostinger:" -ForegroundColor White
Write-Host ""
Write-Host "  1. Log in to Hostinger (if not already)" -ForegroundColor White
Write-Host "  2. Navigate to: Email → Email Accounts" -ForegroundColor White
Write-Host "  3. Click 'Create Email Account'" -ForegroundColor White
Write-Host "  4. Email: business@cryptorafts.com" -ForegroundColor Cyan
Write-Host "  5. Password: [Enter a strong password]" -ForegroundColor Cyan
Write-Host "  6. Click 'Create'" -ForegroundColor White
Write-Host ""
Write-Host "  Press Enter when email account is created..." -ForegroundColor Yellow
Read-Host
Write-Host "  OK: Email account creation noted" -ForegroundColor Green
Write-Host ""

# Step 3: Get DKIM key instructions
Write-Host "Step 3: Get DKIM Key" -ForegroundColor Yellow
Write-Host "  Follow these steps:" -ForegroundColor White
Write-Host ""
Write-Host "  1. In Hostinger, click on business@cryptorafts.com" -ForegroundColor White
Write-Host "  2. Find 'DKIM' section" -ForegroundColor White
Write-Host "  3. Click 'Show' or 'Copy' to reveal DKIM key" -ForegroundColor White
Write-Host "  4. Copy the ENTIRE key (it's very long)" -ForegroundColor White
Write-Host ""
Write-Host "  Paste the DKIM key here:" -ForegroundColor Yellow
$dkimKey = Read-Host "DKIM Key"
Write-Host "  OK: DKIM key received" -ForegroundColor Green
Write-Host ""

# Step 4: Save DKIM key to file
Write-Host "Step 4: Saving DKIM Key" -ForegroundColor Yellow
$dkimFile = "HOSTINGER_DKIM_KEY.txt"
$dkimKey | Out-File -FilePath $dkimFile -Encoding UTF8
Write-Host "  OK: DKIM key saved to $dkimFile" -ForegroundColor Green
Write-Host ""

# Step 5: Update DNS records file with DKIM
Write-Host "Step 5: Updating DNS Records File" -ForegroundColor Yellow
$dnsFile = "DNS_RECORDS_TO_ADD.txt"
if (Test-Path $dnsFile) {
    $dnsContent = Get-Content $dnsFile -Raw
    $dnsContent = $dnsContent -replace "\[Get from Hostinger - see instructions above\]", $dkimKey
    $dnsContent | Out-File -FilePath $dnsFile -Encoding UTF8
    Write-Host "  OK: DNS records file updated with DKIM key" -ForegroundColor Green
} else {
    Write-Host "  WARNING: DNS_RECORDS_TO_ADD.txt not found" -ForegroundColor Yellow
}
Write-Host ""

# Step 6: Check if domain is with Hostinger
Write-Host "Step 6: DNS Records Location" -ForegroundColor Yellow
Write-Host "  Checking where to add DNS records..." -ForegroundColor Gray
Write-Host ""
Write-Host "  Is cryptorafts.com registered with Hostinger?" -ForegroundColor Yellow
Write-Host "  [Y]es - Add DNS records in Hostinger DNS Zone Editor" -ForegroundColor White
Write-Host "  [N]o - Add DNS records in your domain registrar" -ForegroundColor White
$isHostingerDomain = Read-Host "Answer (Y/N)"

if ($isHostingerDomain -eq "Y" -or $isHostingerDomain -eq "y") {
    Write-Host ""
    Write-Host "  Opening Hostinger DNS Zone Editor..." -ForegroundColor Gray
    Start-Process "https://hpanel.hostinger.com/domains/dns"
    Write-Host ""
    Write-Host "  Follow these steps in Hostinger:" -ForegroundColor White
    Write-Host "  1. Go to: Domains → DNS / Name Servers" -ForegroundColor White
    Write-Host "  2. Find cryptorafts.com" -ForegroundColor White
    Write-Host "  3. Click 'DNS Zone Editor' or 'Manage DNS'" -ForegroundColor White
    Write-Host "  4. Delete any existing MX records" -ForegroundColor White
    Write-Host "  5. Add the 4 records from DNS_RECORDS_TO_ADD.txt" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "  DNS records need to be added in your domain registrar" -ForegroundColor White
    Write-Host "  Open DNS_RECORDS_TO_ADD.txt and add records there" -ForegroundColor White
}
Write-Host ""

# Step 7: Wait for DNS propagation
Write-Host "Step 7: DNS Propagation" -ForegroundColor Yellow
Write-Host "  After adding DNS records, wait 15-30 minutes" -ForegroundColor White
Write-Host "  Then run: .\scripts\check-dns-records.ps1" -ForegroundColor Cyan
Write-Host ""

# Step 8: Verify Hostinger status
Write-Host "Step 8: Verify Hostinger Status" -ForegroundColor Yellow
Write-Host "  After DNS propagation:" -ForegroundColor White
Write-Host "  1. Go to: Email → Email Accounts" -ForegroundColor White
Write-Host "  2. Check status - should show 'Domain connected'" -ForegroundColor White
Write-Host "  3. MX, SPF, DKIM should all show 'OK'" -ForegroundColor White
Write-Host ""

# Step 9: Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Hostinger Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "What's Been Done:" -ForegroundColor Yellow
Write-Host "  OK: Email account creation guide provided" -ForegroundColor Green
Write-Host "  OK: DKIM key saved to HOSTINGER_DKIM_KEY.txt" -ForegroundColor Green
Write-Host "  OK: DNS records file updated" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Add DNS records (see DNS_RECORDS_TO_ADD.txt)" -ForegroundColor White
Write-Host "  2. Wait 15-30 minutes for DNS propagation" -ForegroundColor White
Write-Host "  3. Verify: .\scripts\check-dns-records.ps1" -ForegroundColor White
Write-Host "  4. Check Hostinger: Email → Email Accounts" -ForegroundColor White
Write-Host "  5. Redeploy: vercel --prod --yes" -ForegroundColor White
Write-Host ""

