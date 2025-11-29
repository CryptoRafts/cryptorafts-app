# Auto Setup All Hostinger Email Aliases for Vercel (Non-Interactive)
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "AUTO SETUP ALL HOSTINGER EMAIL ALIASES" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Default configuration (can be modified)
$emailUser = "business@cryptorafts.com"
$emailPassword = ""  # Will be set via environment variable or manual input
$emailPort = "587"
$emailSecure = "false"

Write-Host "Configuring Hostinger SMTP for all email aliases..." -ForegroundColor Yellow
Write-Host ""

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

Write-Host "Setting up environment variables for all environments..." -ForegroundColor Yellow
Write-Host ""

foreach ($env in $environments) {
    Write-Host "Configuring $env environment..." -ForegroundColor Cyan
    
    # Basic SMTP settings
    Write-Host "  Adding EMAIL_HOST..." -ForegroundColor Gray
    echo "smtp.hostinger.com" | vercel env add EMAIL_HOST $env 2>&1 | Out-Null
    
    Write-Host "  Adding EMAIL_PORT..." -ForegroundColor Gray
    echo $emailPort | vercel env add EMAIL_PORT $env 2>&1 | Out-Null
    
    Write-Host "  Adding EMAIL_SECURE..." -ForegroundColor Gray
    echo $emailSecure | vercel env add EMAIL_SECURE $env 2>&1 | Out-Null
    
    Write-Host "  Adding EMAIL_USER..." -ForegroundColor Gray
    echo $emailUser | vercel env add EMAIL_USER $env 2>&1 | Out-Null
    
    Write-Host "  Adding EMAIL_FROM_NAME..." -ForegroundColor Gray
    echo "CryptoRafts" | vercel env add EMAIL_FROM_NAME $env 2>&1 | Out-Null
    
    Write-Host "  Adding EMAIL_FROM_ADDRESS..." -ForegroundColor Gray
    echo $emailUser | vercel env add EMAIL_FROM_ADDRESS $env 2>&1 | Out-Null
    
    # SMTP configuration (for compatibility)
    Write-Host "  Adding SMTP_HOST..." -ForegroundColor Gray
    echo "smtp.hostinger.com" | vercel env add SMTP_HOST $env 2>&1 | Out-Null
    
    Write-Host "  Adding SMTP_PORT..." -ForegroundColor Gray
    echo $emailPort | vercel env add SMTP_PORT $env 2>&1 | Out-Null
    
    Write-Host "  Adding SMTP_SECURE..." -ForegroundColor Gray
    echo $emailSecure | vercel env add SMTP_SECURE $env 2>&1 | Out-Null
    
    Write-Host "  Adding SMTP_USER..." -ForegroundColor Gray
    echo $emailUser | vercel env add SMTP_USER $env 2>&1 | Out-Null
    
    # Add all email aliases as environment variables
    foreach ($alias in $emailAliases) {
        $aliasKey = "EMAIL_ALIAS_$($alias.key.ToUpper())"
        Write-Host "  Adding $aliasKey..." -ForegroundColor Gray
        echo $alias.address | vercel env add $aliasKey $env 2>&1 | Out-Null
    }
    
    Write-Host "  ✅ $env environment configured" -ForegroundColor Green
    Write-Host ""
}

Write-Host "==========================================" -ForegroundColor Green
Write-Host "✅ ALL EMAIL ALIASES CONFIGURED!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  IMPORTANT: You need to manually add EMAIL_PASSWORD:" -ForegroundColor Yellow
Write-Host "   vercel env add EMAIL_PASSWORD production" -ForegroundColor White
Write-Host "   vercel env add EMAIL_PASSWORD preview" -ForegroundColor White
Write-Host "   vercel env add EMAIL_PASSWORD development" -ForegroundColor White
Write-Host ""
Write-Host "   And SMTP_PASS:" -ForegroundColor Yellow
Write-Host "   vercel env add SMTP_PASS production" -ForegroundColor White
Write-Host "   vercel env add SMTP_PASS preview" -ForegroundColor White
Write-Host "   vercel env add SMTP_PASS development" -ForegroundColor White
Write-Host ""
Write-Host "Configured email aliases:" -ForegroundColor Cyan
foreach ($alias in $emailAliases) {
    Write-Host "  ✅ $($alias.address) - $($alias.name)" -ForegroundColor White
}
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Add EMAIL_PASSWORD and SMTP_PASS to Vercel (see above)" -ForegroundColor White
Write-Host "  2. Create email aliases in Hostinger:" -ForegroundColor White
Write-Host "     - Go to: https://hpanel.hostinger.com/" -ForegroundColor Gray
Write-Host "     - Navigate to: Email > Email Accounts" -ForegroundColor Gray
Write-Host "     - Create forwarding aliases for all addresses above" -ForegroundColor Gray
Write-Host ""
Write-Host "  3. Redeploy application:" -ForegroundColor White
Write-Host "     vercel --prod --yes" -ForegroundColor Gray
Write-Host ""


