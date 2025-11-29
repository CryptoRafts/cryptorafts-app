# 🔍 Verify DNS Records for Hostinger Email
# This script checks if DNS records are properly configured

Write-Host "🔍 Verifying DNS Records for cryptorafts.com" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Check MX Records
Write-Host "📧 Checking MX Records..." -ForegroundColor Yellow
$mxRecords = nslookup -type=MX cryptorafts.com 2>&1 | Select-String "hostinger"
if ($mxRecords) {
    Write-Host "  ✅ MX Records found:" -ForegroundColor Green
    $mxRecords | ForEach-Object { Write-Host "     $_" -ForegroundColor White }
} else {
    Write-Host "  ❌ MX Records not found or not pointing to Hostinger" -ForegroundColor Red
    Write-Host "     Expected: mx1.hostinger.com (Priority 5)" -ForegroundColor Yellow
    Write-Host "     Expected: mx2.hostinger.com (Priority 10)" -ForegroundColor Yellow
}

Write-Host ""

# Check SPF Record
Write-Host "🔒 Checking SPF Record..." -ForegroundColor Yellow
$spfRecord = nslookup -type=TXT cryptorafts.com 2>&1 | Select-String "spf1"
if ($spfRecord) {
    Write-Host "  ✅ SPF Record found:" -ForegroundColor Green
    $spfRecord | ForEach-Object { Write-Host "     $_" -ForegroundColor White }
} else {
    Write-Host "  ❌ SPF Record not found" -ForegroundColor Red
    Write-Host "     Expected: v=spf1 include:hostinger.com ~all" -ForegroundColor Yellow
}

Write-Host ""

# Check DKIM Record
Write-Host "🔐 Checking DKIM Record..." -ForegroundColor Yellow
$dkimRecord = nslookup -type=TXT default._domainkey.cryptorafts.com 2>&1 | Select-String "DKIM1"
if ($dkimRecord) {
    Write-Host "  ✅ DKIM Record found:" -ForegroundColor Green
    Write-Host "     DKIM is configured" -ForegroundColor White
} else {
    Write-Host "  ⚠️  DKIM Record not found" -ForegroundColor Yellow
    Write-Host "     Get DKIM key from Hostinger and add as TXT record" -ForegroundColor Yellow
    Write-Host "     Name: default._domainkey" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 Tip: DNS changes can take 15 minutes to 48 hours to propagate" -ForegroundColor Cyan
Write-Host "   Use online tools to check globally:" -ForegroundColor Cyan
Write-Host "   - https://dnschecker.org/" -ForegroundColor White
Write-Host "   - https://mxtoolbox.com/" -ForegroundColor White
Write-Host ""

