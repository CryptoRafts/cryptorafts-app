# ============================================
# 🔧 FIX ALL HOSTINGER CONFIGURATIONS
# ============================================
# Comprehensive guide to fix DNS and Nameserver issues

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   🔧 FIX ALL HOSTINGER CONFIGURATIONS 🔧               ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$VPS_IP = "145.79.211.130"
$Domain = "cryptorafts.com"

Write-Host "📋 Your Configuration:" -ForegroundColor Cyan
Write-Host "   VPS IP: $VPS_IP" -ForegroundColor White
Write-Host "   Domain: $Domain`n" -ForegroundColor White

Write-Host "🔍 Checking Current DNS Configuration...`n" -ForegroundColor Cyan

# Check DNS resolution
Write-Host "[1/4] Checking DNS Resolution...`n" -ForegroundColor Yellow

$rootDNS = (nslookup $Domain 8.8.8.8 2>&1 | Select-String "Address:" | Select-Object -Last 1).ToString()
$wwwDNS = (nslookup "www.$Domain" 8.8.8.8 2>&1 | Select-String "Address:" | Select-Object -Last 1).ToString()

Write-Host "Current DNS Resolution:" -ForegroundColor White
Write-Host "   $Domain → " -NoNewline -ForegroundColor White
if ($rootDNS -match $VPS_IP) {
    Write-Host "$VPS_IP ✅" -ForegroundColor Green
} else {
    $rootIP = ($rootDNS -split '\s+')[-1]
    Write-Host "$rootIP ❌ (Should be: $VPS_IP)" -ForegroundColor Red
}

Write-Host "   www.$Domain → " -NoNewline -ForegroundColor White
if ($wwwDNS -match $VPS_IP) {
    Write-Host "$VPS_IP ✅" -ForegroundColor Green
} else {
    $wwwIP = ($wwwDNS -split '\s+')[-1]
    if ($wwwIP) {
        Write-Host "$wwwIP ❌ (Should be: $VPS_IP)" -ForegroundColor Red
    } else {
        Write-Host "Not resolving ❌" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "[2/4] Checking Nameservers...`n" -ForegroundColor Yellow

$nameservers = (nslookup -type=NS $Domain 8.8.8.8 2>&1 | Select-String "nameserver" | ForEach-Object { ($_ -split '\s+')[-1] })

Write-Host "Current Nameservers:" -ForegroundColor White
if ($nameservers) {
    $nameservers | ForEach-Object {
        Write-Host "   $_" -ForegroundColor White
    }
} else {
    Write-Host "   Unable to retrieve nameservers" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[3/4] Configuration Checklist:`n" -ForegroundColor Yellow

$allGood = $true

# Check DNS
Write-Host "DNS Configuration:" -ForegroundColor Cyan
if ($rootDNS -match $VPS_IP -and $wwwDNS -match $VPS_IP) {
    Write-Host "   ✅ DNS records are correct" -ForegroundColor Green
} else {
    Write-Host "   ❌ DNS records need fixing" -ForegroundColor Red
    $allGood = $false
}

# Check Nameservers
Write-Host "Nameserver Configuration:" -ForegroundColor Cyan
if ($nameservers) {
    Write-Host "   ✅ Nameservers are configured" -ForegroundColor Green
    Write-Host "   ℹ️  Verify in Hostinger panel they're correct" -ForegroundColor Yellow
} else {
    Write-Host "   ⚠️  Could not verify nameservers" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[4/4] Required Actions in Hostinger:`n" -ForegroundColor Yellow

if (-not $allGood) {
    Write-Host "🔧 Fix DNS Records:`n" -ForegroundColor Red
    
    Write-Host "1. Login to Hostinger:" -ForegroundColor Cyan
    Write-Host "   https://hpanel.hostinger.com/`n" -ForegroundColor White
    
    Write-Host "2. Go to DNS Management:" -ForegroundColor Cyan
    Write-Host "   Domains → $Domain → Manage DNS`n" -ForegroundColor White
    
    Write-Host "3. Update A Record for Root Domain:" -ForegroundColor Cyan
    Write-Host "   Type: A" -ForegroundColor White
    Write-Host "   Name: `@ (or blank)" -ForegroundColor White
    Write-Host "   Points to: $VPS_IP" -ForegroundColor White
    Write-Host "   TTL: 3600`n" -ForegroundColor White
    
    Write-Host "4. Update/Add A Record for www:" -ForegroundColor Cyan
    Write-Host "   Type: A" -ForegroundColor White
    Write-Host "   Name: www" -ForegroundColor White
    Write-Host "   Points to: $VPS_IP" -ForegroundColor White
    Write-Host "   TTL: 3600`n" -ForegroundColor White
    
    Write-Host "5. Remove CNAME records for www (if any)`n" -ForegroundColor Cyan
    
    Write-Host "6. Save changes and wait 10-30 minutes`n" -ForegroundColor Cyan
} else {
    Write-Host "✅ DNS configuration looks correct!`n" -ForegroundColor Green
}

Write-Host "📋 Verify Nameservers:`n" -ForegroundColor Cyan
Write-Host "1. Login to Hostinger:" -ForegroundColor White
Write-Host "   https://hpanel.hostinger.com/`n" -ForegroundColor White

Write-Host "2. Go to Nameserver Settings:" -ForegroundColor White
Write-Host "   Domains → $Domain → DNS / Name Servers`n" -ForegroundColor White

Write-Host "3. Verify nameservers are correct:" -ForegroundColor White
Write-Host "   - Should be Hostinger nameservers (if using Hostinger DNS)" -ForegroundColor Yellow
Write-Host "   - OR your custom nameservers (if using external DNS)`n" -ForegroundColor Yellow

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ CHECK COMPLETE!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

if ($allGood) {
    Write-Host "✅ All configurations look good!" -ForegroundColor Green
    Write-Host "🚀 Ready to deploy: .\GET_SSH_AND_DEPLOY.ps1`n" -ForegroundColor Cyan
} else {
    Write-Host "⚠️  DNS needs to be fixed before deployment" -ForegroundColor Yellow
    Write-Host "📚 Full guide: COMPLETE_HOSTINGER_CHECK.md`n" -ForegroundColor Cyan
    Write-Host "🔧 After fixing DNS, wait 10-30 minutes, then run this check again`n" -ForegroundColor Yellow
}

