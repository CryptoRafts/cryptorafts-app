# Automated DNS Records Addition Script
# This script opens Hostinger and displays all DNS records ready to copy-paste

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "AUTOMATED DNS RECORDS SETUP" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Read DNS records from file
$dnsFile = "HOSTINGER_DNS_COPY_PASTE.txt"
if (-not (Test-Path $dnsFile)) {
    Write-Host "[ERROR] DNS records file not found!" -ForegroundColor Red
    Write-Host "Generating DNS records..." -ForegroundColor Yellow
    .\scripts\generate-hostinger-dns-import.ps1
}

Write-Host "Opening Hostinger DNS Zone Editor..." -ForegroundColor Yellow
Write-Host ""

# Open Hostinger DNS Zone Editor in default browser
$hostingerUrl = "https://hpanel.hostinger.com/domains/dns"
Start-Process $hostingerUrl

Write-Host "Browser opened! Please log in to Hostinger if needed." -ForegroundColor Cyan
Write-Host ""
Write-Host "Waiting 5 seconds for you to navigate to DNS Zone Editor..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DNS RECORDS TO ADD (Copy-Paste Ready)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Display DNS records
Write-Host "RECORD 1: MX (Priority 5)" -ForegroundColor Green
Write-Host "------------------------" -ForegroundColor Gray
Write-Host "Type: MX" -ForegroundColor White
Write-Host "Name: @" -ForegroundColor White
Write-Host "Value: mx1.hostinger.com" -ForegroundColor White
Write-Host "Priority: 5" -ForegroundColor White
Write-Host "TTL: 14400" -ForegroundColor White
Write-Host ""

Write-Host "RECORD 2: MX (Priority 10)" -ForegroundColor Green
Write-Host "------------------------" -ForegroundColor Gray
Write-Host "Type: MX" -ForegroundColor White
Write-Host "Name: @" -ForegroundColor White
Write-Host "Value: mx2.hostinger.com" -ForegroundColor White
Write-Host "Priority: 10" -ForegroundColor White
Write-Host "TTL: 14400" -ForegroundColor White
Write-Host ""

Write-Host "RECORD 3: SPF (TXT)" -ForegroundColor Green
Write-Host "------------------------" -ForegroundColor Gray
Write-Host "Type: TXT" -ForegroundColor White
Write-Host "Name: @" -ForegroundColor White
Write-Host "Value: v=spf1 include:hostinger.com ~all" -ForegroundColor White
Write-Host "TTL: 14400" -ForegroundColor White
Write-Host ""

Write-Host "RECORD 4: DKIM (TXT)" -ForegroundColor Green
Write-Host "------------------------" -ForegroundColor Gray
Write-Host "Type: TXT" -ForegroundColor White
Write-Host "Name: default._domainkey" -ForegroundColor White

# Read DKIM key
$dkimFile = "HOSTINGER_DKIM_KEY.txt"
if (Test-Path $dkimFile) {
    $dkimKey = Get-Content $dkimFile -Raw
    Write-Host "Value: $dkimKey" -ForegroundColor White
} else {
    Write-Host "Value: [Check HOSTINGER_DKIM_KEY.txt]" -ForegroundColor Yellow
}
Write-Host "TTL: 14400" -ForegroundColor White
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "INSTRUCTIONS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. In Hostinger DNS Zone Editor:" -ForegroundColor Yellow
Write-Host "   - Find cryptorafts.com domain" -ForegroundColor White
Write-Host "   - DELETE any old MX records first" -ForegroundColor Red
Write-Host ""
Write-Host "2. Add Record 1 (MX - Priority 5):" -ForegroundColor Yellow
Write-Host "   - Click 'Add Record' or '+'" -ForegroundColor White
Write-Host "   - Select Type: MX" -ForegroundColor White
Write-Host "   - Name: @" -ForegroundColor White
Write-Host "   - Value: mx1.hostinger.com" -ForegroundColor White
Write-Host "   - Priority: 5" -ForegroundColor White
Write-Host "   - TTL: 14400" -ForegroundColor White
Write-Host "   - Click Save" -ForegroundColor White
Write-Host ""
Write-Host "3. Add Record 2 (MX - Priority 10):" -ForegroundColor Yellow
Write-Host "   - Click 'Add Record' again" -ForegroundColor White
Write-Host "   - Select Type: MX" -ForegroundColor White
Write-Host "   - Name: @" -ForegroundColor White
Write-Host "   - Value: mx2.hostinger.com" -ForegroundColor White
Write-Host "   - Priority: 10" -ForegroundColor White
Write-Host "   - TTL: 14400" -ForegroundColor White
Write-Host "   - Click Save" -ForegroundColor White
Write-Host ""
Write-Host "4. Add Record 3 (SPF - TXT):" -ForegroundColor Yellow
Write-Host "   - Click 'Add Record'" -ForegroundColor White
Write-Host "   - Select Type: TXT" -ForegroundColor White
Write-Host "   - Name: @" -ForegroundColor White
Write-Host "   - Value: v=spf1 include:hostinger.com ~all" -ForegroundColor White
Write-Host "   - TTL: 14400" -ForegroundColor White
Write-Host "   - Click Save" -ForegroundColor White
Write-Host ""
Write-Host "5. Add Record 4 (DKIM - TXT):" -ForegroundColor Yellow
Write-Host "   - Click 'Add Record'" -ForegroundColor White
Write-Host "   - Select Type: TXT" -ForegroundColor White
Write-Host "   - Name: default._domainkey" -ForegroundColor White
Write-Host "   - Value: [Copy from above]" -ForegroundColor White
Write-Host "   - TTL: 14400" -ForegroundColor White
Write-Host "   - Click Save" -ForegroundColor White
Write-Host ""
Write-Host "6. After adding all records:" -ForegroundColor Yellow
Write-Host "   - Wait 15-30 minutes for DNS propagation" -ForegroundColor White
Write-Host "   - Run: .\scripts\check-dns-records.ps1" -ForegroundColor Cyan
Write-Host "   - Check Hostinger: https://hpanel.hostinger.com/email/accounts" -ForegroundColor Cyan
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "QUICK COPY VALUES" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Create a simple copy-paste format
$copyPaste = @"
MX Record 1:
Type: MX | Name: @ | Value: mx1.hostinger.com | Priority: 5 | TTL: 14400

MX Record 2:
Type: MX | Name: @ | Value: mx2.hostinger.com | Priority: 10 | TTL: 14400

SPF Record:
Type: TXT | Name: @ | Value: v=spf1 include:hostinger.com ~all | TTL: 14400

DKIM Record:
Type: TXT | Name: default._domainkey | Value: [See HOSTINGER_DKIM_KEY.txt] | TTL: 14400
"@

Write-Host $copyPaste -ForegroundColor White
Write-Host ""

# Also open the DNS records file
if (Test-Path $dnsFile) {
    Write-Host "Opening DNS records file for easy reference..." -ForegroundColor Yellow
    Start-Process notepad.exe -ArgumentList $dnsFile
}

Write-Host ""
Write-Host "All DNS records are displayed above!" -ForegroundColor Green
Write-Host "Copy each record and add it in Hostinger DNS Zone Editor." -ForegroundColor Cyan
Write-Host ""

