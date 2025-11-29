# Hostinger DNS Setup Script
# This script helps add DNS records if domain is with Hostinger

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Hostinger DNS Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if DKIM key exists
$dkimFile = "HOSTINGER_DKIM_KEY.txt"
if (-not (Test-Path $dkimFile)) {
    Write-Host "WARNING: DKIM key not found!" -ForegroundColor Yellow
    Write-Host "Run: .\scripts\setup-hostinger-complete.ps1 first" -ForegroundColor White
    Write-Host ""
    exit 1
}

$dkimKey = Get-Content $dkimFile -Raw

# Generate complete DNS records
Write-Host "Generating DNS Records for Hostinger..." -ForegroundColor Yellow
Write-Host ""

$dnsRecords = @"
# DNS Records for Hostinger DNS Zone Editor
# Domain: cryptorafts.com
# Add these records in Hostinger: Domains → DNS / Name Servers → DNS Zone Editor

# ========================================
# STEP 1: DELETE OLD MX RECORDS
# ========================================
# Find and delete any existing MX records first!

# ========================================
# STEP 2: ADD MX RECORDS (2 records)
# ========================================

Record 1:
Type: MX
Name: @
Value: mx1.hostinger.com
Priority: 5
TTL: 14400

Record 2:
Type: MX
Name: @
Value: mx2.hostinger.com
Priority: 10
TTL: 14400

# ========================================
# STEP 3: ADD SPF RECORD (1 record)
# ========================================

Record 3:
Type: TXT
Name: @
Value: v=spf1 include:hostinger.com ~all
TTL: 14400

# ========================================
# STEP 4: ADD DKIM RECORD (1 record)
# ========================================

Record 4:
Type: TXT
Name: default._domainkey
Value: $dkimKey
TTL: 14400

# ========================================
# INSTRUCTIONS FOR HOSTINGER:
# ========================================
# 1. Log in to: https://hpanel.hostinger.com/
# 2. Go to: Domains → DNS / Name Servers
# 3. Find: cryptorafts.com
# 4. Click: "DNS Zone Editor" or "Manage DNS"
# 5. Delete: Any existing MX records
# 6. Add: The 4 records above (one by one)
# 7. Save: Click "Save" or "Add Record" for each
# 8. Wait: 15-30 minutes for DNS propagation
# 9. Verify: Run .\scripts\check-dns-records.ps1
"@

$dnsRecords | Out-File -FilePath "HOSTINGER_DNS_RECORDS.txt" -Encoding UTF8
Write-Host "OK: DNS records file created: HOSTINGER_DNS_RECORDS.txt" -ForegroundColor Green
Write-Host ""

# Open Hostinger DNS Zone Editor
Write-Host "Opening Hostinger DNS Zone Editor..." -ForegroundColor Yellow
Start-Process "https://hpanel.hostinger.com/domains/dns"
Write-Host "OK: Browser opened" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. In Hostinger, go to DNS Zone Editor" -ForegroundColor White
Write-Host "  2. Delete old MX records" -ForegroundColor White
Write-Host "  3. Add the 4 records from HOSTINGER_DNS_RECORDS.txt" -ForegroundColor White
Write-Host "  4. Wait 15-30 minutes" -ForegroundColor White
Write-Host "  5. Verify: .\scripts\check-dns-records.ps1" -ForegroundColor White
Write-Host ""

