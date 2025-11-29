# Generate Hostinger DNS Records in Import Format
# This script creates DNS records in a format that can be easily added to Hostinger

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Generating Hostinger DNS Records" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Read DKIM key
$dkimFile = "HOSTINGER_DKIM_KEY.txt"
if (-not (Test-Path $dkimFile)) {
    Write-Host "ERROR: DKIM key not found!" -ForegroundColor Red
    Write-Host "Run: .\scripts\setup-hostinger-complete.ps1 first" -ForegroundColor Yellow
    exit 1
}

$dkimKey = Get-Content $dkimFile -Raw

# Generate DNS records in multiple formats
Write-Host "Generating DNS records in multiple formats..." -ForegroundColor Yellow

# Format 1: Hostinger DNS Zone Editor format
$hostingerFormat = @"
# ========================================
# HOSTINGER DNS ZONE EDITOR - COPY & PASTE
# ========================================
# Go to: Domains → DNS / Name Servers → DNS Zone Editor
# Domain: cryptorafts.com
# ========================================

# STEP 1: DELETE OLD MX RECORDS FIRST!
# Find and delete any existing MX records

# STEP 2: ADD THESE 4 RECORDS:

# --- RECORD 1: MX (Priority 5) ---
Type: MX
Name: @
Value: mx1.hostinger.com
Priority: 5
TTL: 14400

# --- RECORD 2: MX (Priority 10) ---
Type: MX
Name: @
Value: mx2.hostinger.com
Priority: 10
TTL: 14400

# --- RECORD 3: SPF (TXT) ---
Type: TXT
Name: @
Value: v=spf1 include:hostinger.com ~all
TTL: 14400

# --- RECORD 4: DKIM (TXT) ---
Type: TXT
Name: default._domainkey
Value: $dkimKey
TTL: 14400

# ========================================
"@

$hostingerFormat | Out-File -FilePath "HOSTINGER_DNS_COPY_PASTE.txt" -Encoding UTF8
Write-Host "  OK: Created HOSTINGER_DNS_COPY_PASTE.txt" -ForegroundColor Green

# Format 2: JSON format (for potential API use)
$jsonFormat = @"
{
  "domain": "cryptorafts.com",
  "records": [
    {
      "type": "MX",
      "name": "@",
      "value": "mx1.hostinger.com",
      "priority": 5,
      "ttl": 14400
    },
    {
      "type": "MX",
      "name": "@",
      "value": "mx2.hostinger.com",
      "priority": 10,
      "ttl": 14400
    },
    {
      "type": "TXT",
      "name": "@",
      "value": "v=spf1 include:hostinger.com ~all",
      "ttl": 14400
    },
    {
      "type": "TXT",
      "name": "default._domainkey",
      "value": "$dkimKey",
      "ttl": 14400
    }
  ]
}
"@

$jsonFormat | Out-File -FilePath "HOSTINGER_DNS_JSON.json" -Encoding UTF8
Write-Host "  OK: Created HOSTINGER_DNS_JSON.json" -ForegroundColor Green

# Format 3: CSV format
$csvFormat = @"
Type,Name,Value,Priority,TTL
MX,@,mx1.hostinger.com,5,14400
MX,@,mx2.hostinger.com,10,14400
TXT,@,v=spf1 include:hostinger.com ~all,,14400
TXT,default._domainkey,$dkimKey,,14400
"@

$csvFormat | Out-File -FilePath "HOSTINGER_DNS_CSV.csv" -Encoding UTF8
Write-Host "  OK: Created HOSTINGER_DNS_CSV.csv" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DNS Records Generated!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Files Created:" -ForegroundColor Yellow
Write-Host "  1. HOSTINGER_DNS_COPY_PASTE.txt - Copy-paste format" -ForegroundColor White
Write-Host "  2. HOSTINGER_DNS_JSON.json - JSON format" -ForegroundColor White
Write-Host "  3. HOSTINGER_DNS_CSV.csv - CSV format" -ForegroundColor White
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Open HOSTINGER_DNS_COPY_PASTE.txt" -ForegroundColor White
Write-Host "  2. Go to Hostinger: Domains → DNS / Name Servers → DNS Zone Editor" -ForegroundColor White
Write-Host "  3. Delete old MX records" -ForegroundColor White
Write-Host "  4. Add the 4 records from the file" -ForegroundColor White
Write-Host ""

