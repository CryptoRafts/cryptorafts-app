# Setup All Email Aliases for Vercel
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "SETUP ALL EMAIL ALIASES FOR VERCEL" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Email aliases to configure
$emailAliases = @(
    @{alias="business@cryptorafts.com"; name="CryptoRafts Business"; purpose="General business communications"},
    @{alias="support@cryptorafts.com"; name="CryptoRafts Support"; purpose="Customer support and help requests"},
    @{alias="help@cryptorafts.com"; name="CryptoRafts Help"; purpose="Help desk and assistance"},
    @{alias="blog@cryptorafts.com"; name="CryptoRafts Blog"; purpose="Blog updates and newsletters"},
    @{alias="founder@cryptorafts.com"; name="CryptoRafts Founders"; purpose="Founder-specific communications"},
    @{alias="vc@cryptorafts.com"; name="CryptoRafts VCs"; purpose="VC and investor communications"}
)

Write-Host "Email Aliases to Configure:" -ForegroundColor Yellow
foreach ($email in $emailAliases) {
    Write-Host "  - $($email.alias) ($($email.name))" -ForegroundColor White
}
Write-Host ""

# Get SMTP credentials
Write-Host "Enter SMTP Configuration:" -ForegroundColor Yellow
$smtpHost = Read-Host "SMTP Host (default: smtp.hostinger.com)"
if ([string]::IsNullOrWhiteSpace($smtpHost)) {
    $smtpHost = "smtp.hostinger.com"
}

$smtpPort = Read-Host "SMTP Port (default: 587)"
if ([string]::IsNullOrWhiteSpace($smtpPort)) {
    $smtpPort = "587"
}

$smtpSecure = Read-Host "SMTP Secure (true/false, default: false)"
if ([string]::IsNullOrWhiteSpace($smtpSecure)) {
    $smtpSecure = "false"
}

# Get primary email account (used for SMTP authentication)
Write-Host ""
Write-Host "Primary Email Account (for SMTP authentication):" -ForegroundColor Yellow
$primaryEmail = Read-Host "Email Address (e.g., business@cryptorafts.com)"
$primaryPassword = Read-Host "Email Password" -AsSecureString
$primaryPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($primaryPassword))

Write-Host ""
Write-Host "Adding environment variables to Vercel..." -ForegroundColor Yellow
Write-Host ""

# Add SMTP configuration
Write-Host "Adding SMTP Configuration..." -ForegroundColor Cyan
$environments = @("production", "preview", "development")

foreach ($env in $environments) {
    Write-Host "  Environment: $env" -ForegroundColor Gray
    
    # SMTP Host
    echo $smtpHost | vercel env add EMAIL_HOST $env 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "    ✅ EMAIL_HOST added" -ForegroundColor Green
    } else {
        Write-Host "    ⚠️ EMAIL_HOST already exists or failed" -ForegroundColor Yellow
    }
    
    # SMTP Port
    echo $smtpPort | vercel env add EMAIL_PORT $env 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "    ✅ EMAIL_PORT added" -ForegroundColor Green
    } else {
        Write-Host "    ⚠️ EMAIL_PORT already exists or failed" -ForegroundColor Yellow
    }
    
    # SMTP Secure
    echo $smtpSecure | vercel env add EMAIL_SECURE $env 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "    ✅ EMAIL_SECURE added" -ForegroundColor Green
    } else {
        Write-Host "    ⚠️ EMAIL_SECURE already exists or failed" -ForegroundColor Yellow
    }
    
    # Primary Email User (for SMTP auth)
    echo $primaryEmail | vercel env add EMAIL_USER $env 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "    ✅ EMAIL_USER added" -ForegroundColor Green
    } else {
        Write-Host "    ⚠️ EMAIL_USER already exists or failed" -ForegroundColor Yellow
    }
    
    # Primary Email Password
    echo $primaryPasswordPlain | vercel env add EMAIL_PASSWORD $env 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "    ✅ EMAIL_PASSWORD added" -ForegroundColor Green
    } else {
        Write-Host "    ⚠️ EMAIL_PASSWORD already exists or failed" -ForegroundColor Yellow
    }
    
    # Default From Name
    echo "CryptoRafts" | vercel env add EMAIL_FROM_NAME $env 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "    ✅ EMAIL_FROM_NAME added" -ForegroundColor Green
    } else {
        Write-Host "    ⚠️ EMAIL_FROM_NAME already exists or failed" -ForegroundColor Yellow
    }
    
    # Default From Address
    echo $primaryEmail | vercel env add EMAIL_FROM_ADDRESS $env 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "    ✅ EMAIL_FROM_ADDRESS added" -ForegroundColor Green
    } else {
        Write-Host "    ⚠️ EMAIL_FROM_ADDRESS already exists or failed" -ForegroundColor Yellow
    }
    
    Write-Host ""
}

Write-Host "==========================================" -ForegroundColor Green
Write-Host "✅ EMAIL CONFIGURATION COMPLETE!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Email Aliases Configured:" -ForegroundColor Yellow
foreach ($email in $emailAliases) {
    Write-Host "  ✅ $($email.alias) - $($email.purpose)" -ForegroundColor White
}
Write-Host ""
Write-Host "Note: All aliases use the same SMTP server ($smtpHost)" -ForegroundColor Gray
Write-Host "      but send from different 'from' addresses based on email type." -ForegroundColor Gray
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Create email aliases in Hostinger:" -ForegroundColor White
Write-Host "     - Go to: https://hpanel.hostinger.com/" -ForegroundColor Gray
Write-Host "     - Navigate to: Email > Email Accounts" -ForegroundColor Gray
Write-Host "     - Create forwarding aliases for each email address" -ForegroundColor Gray
Write-Host "  2. Redeploy: vercel --prod --yes" -ForegroundColor White
Write-Host "  3. Test email: Use admin email page or /api/email/send" -ForegroundColor White
Write-Host ""

