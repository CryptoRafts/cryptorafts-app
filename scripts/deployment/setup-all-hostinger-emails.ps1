# Setup All Hostinger Email Aliases for Vercel
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "SETUP ALL HOSTINGER EMAIL ALIASES" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Get email details from user
Write-Host "Enter your Hostinger email details:" -ForegroundColor Yellow
Write-Host ""

$emailUser = Read-Host "Main Email Address (e.g., business@cryptorafts.com)"
$emailPassword = Read-Host "Email Password" -AsSecureString
$emailPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($emailPassword))

Write-Host ""
Write-Host "Choose SMTP Port:" -ForegroundColor Yellow
Write-Host "  1. Port 587 (TLS) - Recommended"
Write-Host "  2. Port 465 (SSL)"
$portChoice = Read-Host "Enter choice (1 or 2)"

if ($portChoice -eq "2") {
    $emailPort = "465"
    $emailSecure = "true"
} else {
    $emailPort = "587"
    $emailSecure = "false"
}

Write-Host ""
Write-Host "Setting up email environment variables..." -ForegroundColor Yellow
Write-Host ""

# Email aliases to configure
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
    Write-Host "  - $($alias.address) ($($alias.name))" -ForegroundColor White
}
Write-Host ""

# Environments to configure
$environments = @("production", "preview", "development")

foreach ($env in $environments) {
    Write-Host "Configuring $env environment..." -ForegroundColor Cyan
    
    # Basic SMTP settings
    echo "smtp.hostinger.com" | vercel env add EMAIL_HOST $env
    echo $emailPort | vercel env add EMAIL_PORT $env
    echo $emailSecure | vercel env add EMAIL_SECURE $env
    echo $emailUser | vercel env add EMAIL_USER $env
    echo $emailPasswordPlain | vercel env add EMAIL_PASSWORD $env
    echo "CryptoRafts" | vercel env add EMAIL_FROM_NAME $env
    echo $emailUser | vercel env add EMAIL_FROM_ADDRESS $env
    
    # Add all email aliases as environment variables (for reference)
    foreach ($alias in $emailAliases) {
        $aliasKey = "EMAIL_ALIAS_$($alias.key.ToUpper())"
        echo $alias.address | vercel env add $aliasKey $env
    }
    
    Write-Host "✅ $env environment configured" -ForegroundColor Green
    Write-Host ""
}

Write-Host "==========================================" -ForegroundColor Green
Write-Host "✅ ALL EMAIL ALIASES CONFIGURED!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Configured email aliases:" -ForegroundColor Yellow
foreach ($alias in $emailAliases) {
    Write-Host "  ✅ $($alias.address) - $($alias.name)" -ForegroundColor White
}
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Create email aliases in Hostinger:" -ForegroundColor White
Write-Host "     - Go to: https://hpanel.hostinger.com/" -ForegroundColor Gray
Write-Host "     - Navigate to: Email > Email Accounts" -ForegroundColor Gray
Write-Host "     - Create forwarding aliases for all addresses above" -ForegroundColor Gray
Write-Host ""
Write-Host "  2. Redeploy application:" -ForegroundColor White
Write-Host "     vercel --prod --yes" -ForegroundColor Gray
Write-Host ""
Write-Host "  3. Test email sending:" -ForegroundColor White
Write-Host "     https://www.cryptorafts.com/api/email/send" -ForegroundColor Gray
Write-Host ""


