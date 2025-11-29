# ============================================
# CHECK DNS RECORDS
# Verifies DNS is pointing to correct IP
# ============================================

$correctIP = "72.61.98.99"
$wrongIP = "145.79.211.130"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "CHECKING DNS RECORDS" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check root domain
Write-Host "[1/2] Checking cryptorafts.com..." -ForegroundColor Cyan
try {
    $rootDNS = (Resolve-DnsName -Name "cryptorafts.com" -Type A -ErrorAction Stop | Where-Object { $_.Type -eq "A" }).IPAddress
    Write-Host "  Found IPs: $($rootDNS -join ', ')" -ForegroundColor White
    
    if ($rootDNS -contains $correctIP) {
        Write-Host "  ✅ Correct IP found: $correctIP" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Correct IP NOT found!" -ForegroundColor Red
    }
    
    if ($rootDNS -contains $wrongIP) {
        Write-Host "  ❌ WRONG IP still present: $wrongIP" -ForegroundColor Red
        Write-Host "  ⚠️  You need to DELETE this record!" -ForegroundColor Yellow
    } else {
        Write-Host "  ✅ Wrong IP not found" -ForegroundColor Green
    }
} catch {
    Write-Host "  ❌ Could not resolve DNS: $_" -ForegroundColor Red
}
Write-Host ""

# Check www subdomain
Write-Host "[2/2] Checking www.cryptorafts.com..." -ForegroundColor Cyan
try {
    $wwwDNS = (Resolve-DnsName -Name "www.cryptorafts.com" -Type A -ErrorAction Stop | Where-Object { $_.Type -eq "A" }).IPAddress
    Write-Host "  Found IPs: $($wwwDNS -join ', ')" -ForegroundColor White
    
    if ($wwwDNS -contains $correctIP) {
        Write-Host "  ✅ Correct IP found: $correctIP" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Correct IP NOT found!" -ForegroundColor Red
    }
    
    if ($wwwDNS -contains $wrongIP) {
        Write-Host "  ❌ WRONG IP still present: $wrongIP" -ForegroundColor Red
        Write-Host "  ⚠️  You need to DELETE this record!" -ForegroundColor Yellow
    } else {
        Write-Host "  ✅ Wrong IP not found" -ForegroundColor Green
    }
} catch {
    Write-Host "  ❌ Could not resolve DNS: $_" -ForegroundColor Red
}
Write-Host ""

# Summary
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "DNS CHECK SUMMARY" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Expected IP: $correctIP" -ForegroundColor Cyan
Write-Host "Wrong IP (should be deleted): $wrongIP" -ForegroundColor Red
Write-Host ""
Write-Host "If you see the wrong IP above:" -ForegroundColor Yellow
Write-Host "  1. Go to Hostinger DNS management" -ForegroundColor White
Write-Host "  2. Delete A record pointing to $wrongIP" -ForegroundColor White
Write-Host "  3. Ensure @ and www both point to $correctIP" -ForegroundColor White
Write-Host "  4. Wait 5-10 minutes" -ForegroundColor White
Write-Host "  5. Run this script again to verify" -ForegroundColor White
Write-Host ""

