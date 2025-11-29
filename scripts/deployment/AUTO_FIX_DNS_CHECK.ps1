# ============================================
# 🔍 AUTO DNS CHECK & VERIFICATION
# ============================================

$VPS_IP = "145.79.211.130"
$Domain = "cryptorafts.com"
$WrongIP = "72.61.98.99"

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   🔍 AUTO DNS CHECK & VERIFICATION 🔍                     ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 Configuration:" -ForegroundColor Cyan
Write-Host "   VPS IP: $VPS_IP" -ForegroundColor White
Write-Host "   Domain: $Domain`n" -ForegroundColor White

Write-Host "🔍 Checking DNS Resolution...`n" -ForegroundColor Yellow

# Check root domain
$rootResult = nslookup -type=A $Domain 8.8.8.8 2>&1
$rootIP = ($rootResult | Select-String "Address:" | Select-Object -Last 1) -replace '.*Address:\s+', ''

# Check www domain
$wwwResult = nslookup -type=A "www.$Domain" 8.8.8.8 2>&1
$wwwIP = ($wwwResult | Select-String "Address:" | Select-Object -Last 1) -replace '.*Address:\s+', ''

# Check nameservers
$nsResult = nslookup -type=NS $Domain 8.8.8.8 2>&1
$nameservers = ($nsResult | Select-String "nameserver" | ForEach-Object { ($_ -split '\s+')[-1] })

Write-Host "Current DNS Status:" -ForegroundColor Cyan
Write-Host "───────────────────────────────────────────" -ForegroundColor Gray

Write-Host "Root Domain ($Domain):" -ForegroundColor White
if ($rootIP -eq $VPS_IP) {
    Write-Host "   ✅ $rootIP (CORRECT!)" -ForegroundColor Green
    $rootOK = $true
} elseif ($rootIP -eq $WrongIP) {
    Write-Host "   ❌ $rootIP (WRONG! Should be: $VPS_IP)" -ForegroundColor Red
    $rootOK = $false
} else {
    Write-Host "   ⚠️  $rootIP (Should be: $VPS_IP)" -ForegroundColor Yellow
    $rootOK = $false
}

Write-Host ""
Write-Host "www Subdomain (www.$Domain):" -ForegroundColor White
if ($wwwIP -eq $VPS_IP) {
    Write-Host "   ✅ $wwwIP (CORRECT!)" -ForegroundColor Green
    $wwwOK = $true
} elseif ($wwwIP -eq $WrongIP) {
    Write-Host "   ❌ $wwwIP (WRONG! Should be: $VPS_IP)" -ForegroundColor Red
    $wwwOK = $false
} elseif ([string]::IsNullOrEmpty($wwwIP)) {
    Write-Host "   ❌ Not resolving (Should be: $VPS_IP)" -ForegroundColor Red
    $wwwOK = $false
} else {
    Write-Host "   ⚠️  $wwwIP (Should be: $VPS_IP)" -ForegroundColor Yellow
    $wwwOK = $false
}

Write-Host ""
Write-Host "Nameservers:" -ForegroundColor White
if ($nameservers) {
    $nameservers | ForEach-Object {
        Write-Host "   ✅ $_" -ForegroundColor Green
    }
} else {
    Write-Host "   ⚠️  Could not retrieve nameservers" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan

if ($rootOK -and $wwwOK) {
    Write-Host "✅ DNS CONFIGURATION IS CORRECT!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🚀 Ready to deploy:" -ForegroundColor Cyan
    Write-Host "   .\GET_SSH_AND_DEPLOY.ps1`n" -ForegroundColor White
} else {
    Write-Host "❌ DNS NEEDS FIXING!" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔧 FIX DNS IN HOSTINGER:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Login: https://hpanel.hostinger.com/" -ForegroundColor White
    Write-Host "2. Go to: Domains → $Domain → Manage DNS" -ForegroundColor White
    Write-Host "3. Update A Record for root (at symbol):" -ForegroundColor White
    Write-Host "   Points to: $VPS_IP" -ForegroundColor Cyan
    Write-Host "4. Update/Add A Record for www:" -ForegroundColor White
    Write-Host "   Points to: $VPS_IP" -ForegroundColor Cyan
    Write-Host "5. Save changes" -ForegroundColor White
    Write-Host "6. Wait 10-30 minutes" -ForegroundColor White
    Write-Host "7. Run this check again: .\AUTO_FIX_DNS_CHECK.ps1`n" -ForegroundColor Yellow
}

Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

