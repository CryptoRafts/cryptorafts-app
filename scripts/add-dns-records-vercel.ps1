# Add DNS Records to Vercel DNS
# Since your domain uses Vercel nameservers, we need to add DNS records via Vercel

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "ADD DNS RECORDS TO VERCEL DNS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Domain: cryptorafts.com" -ForegroundColor Yellow
Write-Host "Nameservers: ns1.vercel-dns.com, ns2.vercel-dns.com" -ForegroundColor Yellow
Write-Host ""

# Read DKIM key
$dkimFile = "HOSTINGER_DKIM_KEY.txt"
if (-not (Test-Path $dkimFile)) {
    Write-Host "[ERROR] DKIM key file not found!" -ForegroundColor Red
    exit 1
}

$dkimKey = (Get-Content $dkimFile -Raw).Trim()

Write-Host "DNS Records to Add:" -ForegroundColor Cyan
Write-Host ""

# Record 1: MX (Priority 5)
Write-Host "Record 1: MX - mx1.hostinger.com (Priority 5)" -ForegroundColor Green
Write-Host "  Adding..." -ForegroundColor Yellow
$result1 = vercel dns add cryptorafts.com '@' MX mx1.hostinger.com 5 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "  [OK] MX Record 1 added successfully" -ForegroundColor Green
} else {
    Write-Host "  [!] Error or record may already exist: $result1" -ForegroundColor Yellow
}

Write-Host ""

# Record 2: MX (Priority 10)
Write-Host "Record 2: MX - mx2.hostinger.com (Priority 10)" -ForegroundColor Green
Write-Host "  Adding..." -ForegroundColor Yellow
$result2 = vercel dns add cryptorafts.com '@' MX mx2.hostinger.com 10 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "  [OK] MX Record 2 added successfully" -ForegroundColor Green
} else {
    Write-Host "  [!] Error or record may already exist: $result2" -ForegroundColor Yellow
}

Write-Host ""

# Record 3: SPF (TXT)
Write-Host "Record 3: SPF TXT - v=spf1 include:hostinger.com ~all" -ForegroundColor Green
Write-Host "  Adding..." -ForegroundColor Yellow
$spfValue = "v=spf1 include:hostinger.com ~all"
$result3 = vercel dns add cryptorafts.com '@' TXT $spfValue 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "  [OK] SPF Record added successfully" -ForegroundColor Green
} else {
    Write-Host "  [!] Error or record may already exist: $result3" -ForegroundColor Yellow
}

Write-Host ""

# Record 4: DKIM (TXT)
Write-Host "Record 4: DKIM TXT - default._domainkey" -ForegroundColor Green
Write-Host "  Adding..." -ForegroundColor Yellow
$result4 = vercel dns add cryptorafts.com default._domainkey TXT $dkimKey 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "  [OK] DKIM Record added successfully" -ForegroundColor Green
} else {
    Write-Host "  [!] Error or record may already exist: $result4" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "VERIFICATION" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Listing all DNS records for cryptorafts.com..." -ForegroundColor Yellow
Write-Host ""

vercel dns ls cryptorafts.com

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "NEXT STEPS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Wait 15-30 minutes for DNS propagation" -ForegroundColor White
Write-Host "2. Verify DNS records:" -ForegroundColor White
Write-Host "   .\scripts\check-dns-records.ps1" -ForegroundColor Cyan
Write-Host "3. Check Hostinger email status:" -ForegroundColor White
Write-Host "   https://hpanel.hostinger.com/email/accounts" -ForegroundColor Cyan
Write-Host "4. Verify email is working" -ForegroundColor White
Write-Host ""

