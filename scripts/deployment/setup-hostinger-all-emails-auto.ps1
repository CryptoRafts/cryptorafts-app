# Auto Setup All Hostinger Email Aliases for Vercel (Fully Automated)
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "AUTO SETUP ALL HOSTINGER EMAIL ALIASES" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$emailUser = "business@cryptorafts.com"
$emailPort = "587"
$emailSecure = "false"

# Email aliases configuration
$emailAliases = @(
    @{key="business"; address="business@cryptorafts.com"; name="CryptoRafts"},
    @{key="support"; address="support@cryptorafts.com"; name="CryptoRafts Support"},
    @{key="help"; address="help@cryptorafts.com"; name="CryptoRafts Help"},
    @{key="blog"; address="blog@cryptorafts.com"; name="CryptoRafts Blog"},
    @{key="founder"; address="founder@cryptorafts.com"; name="CryptoRafts Founders"},
    @{key="vc"; address="vc@cryptorafts.com"; name="CryptoRafts VC"},
    @{key="investor"; address="investor@cryptorafts.com"; name="CryptoRafts Investors"},
    @{key="admin"; address="admin@cryptorafts.com"; name="CryptoRafts Admin"},
    @{key="notifications"; address="notifications@cryptorafts.com"; name="CryptoRafts Notifications"},
    @{key="legal"; address="legal@cryptorafts.com"; name="CryptoRafts Legal"},
    @{key="partnerships"; address="partnerships@cryptorafts.com"; name="CryptoRafts Partnerships"}
)

Write-Host "Email aliases to configure:" -ForegroundColor Cyan
foreach ($alias in $emailAliases) {
    Write-Host "  ✓ $($alias.address) - $($alias.name)" -ForegroundColor White
}
Write-Host ""

# Environments to configure
$environments = @("production", "preview", "development")

Write-Host "Setting up environment variables..." -ForegroundColor Yellow
Write-Host ""

foreach ($env in $environments) {
    Write-Host "[$env] Configuring..." -ForegroundColor Cyan
    
    # Basic SMTP settings
    "smtp.hostinger.com" | vercel env add EMAIL_HOST $env 2>&1 | Out-Null
    $emailPort | vercel env add EMAIL_PORT $env 2>&1 | Out-Null
    $emailSecure | vercel env add EMAIL_SECURE $env 2>&1 | Out-Null
    $emailUser | vercel env add EMAIL_USER $env 2>&1 | Out-Null
    "CryptoRafts" | vercel env add EMAIL_FROM_NAME $env 2>&1 | Out-Null
    $emailUser | vercel env add EMAIL_FROM_ADDRESS $env 2>&1 | Out-Null
    
    # SMTP configuration (for compatibility)
    "smtp.hostinger.com" | vercel env add SMTP_HOST $env 2>&1 | Out-Null
    $emailPort | vercel env add SMTP_PORT $env 2>&1 | Out-Null
    $emailSecure | vercel env add SMTP_SECURE $env 2>&1 | Out-Null
    $emailUser | vercel env add SMTP_USER $env 2>&1 | Out-Null
    
    # Add all email aliases as environment variables
    foreach ($alias in $emailAliases) {
        $aliasKey = "EMAIL_ALIAS_$($alias.key.ToUpper())"
        $alias.address | vercel env add $aliasKey $env 2>&1 | Out-Null
    }
    
    Write-Host "[$env] ✅ Configured" -ForegroundColor Green
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "✅ ALL EMAIL ALIASES CONFIGURED!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  IMPORTANT: Add EMAIL_PASSWORD and SMTP_PASS manually:" -ForegroundColor Yellow
Write-Host "   vercel env add EMAIL_PASSWORD production" -ForegroundColor White
Write-Host "   vercel env add SMTP_PASS production" -ForegroundColor White
Write-Host ""
Write-Host "Configured aliases:" -ForegroundColor Cyan
foreach ($alias in $emailAliases) {
    Write-Host "  ✅ $($alias.address)" -ForegroundColor White
}
Write-Host ""


