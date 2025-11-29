# Complete Hostinger Email Setup for Vercel
# This script ensures ALL email variables are set to Hostinger (not Gmail)

Write-Host "Complete Hostinger Email Setup for Vercel" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check if Vercel CLI is installed
if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
    Write-Host "Vercel CLI not found. Please install it first:" -ForegroundColor Red
    Write-Host "   npm install -g vercel" -ForegroundColor Yellow
    exit 1
}

Write-Host "Vercel CLI found" -ForegroundColor Green
Write-Host ""

# Get email password
Write-Host "Enter your Hostinger email password for business@cryptorafts.com:" -ForegroundColor Yellow
$emailPassword = Read-Host -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($emailPassword)
$emailPasswordPlain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

Write-Host ""
Write-Host "Setting up Hostinger SMTP configuration..." -ForegroundColor Cyan
Write-Host ""

# Function to add environment variable
function Add-EnvVar {
    param(
        [string]$Name,
        [string]$Value,
        [string]$Environment
    )
    Write-Host "  Adding $Name to $Environment..." -ForegroundColor Gray
    echo $Value | vercel env add $Name $Environment | Out-Null
}

# Environments to configure
$environments = @("production", "preview", "development")

foreach ($env in $environments) {
    Write-Host ""
    Write-Host "Configuring $env environment..." -ForegroundColor Yellow
    
    # EMAIL_* variables
    Add-EnvVar "EMAIL_HOST" "smtp.hostinger.com" $env
    Add-EnvVar "EMAIL_PORT" "587" $env
    Add-EnvVar "EMAIL_SECURE" "false" $env
    Add-EnvVar "EMAIL_USER" "business@cryptorafts.com" $env
    Add-EnvVar "EMAIL_PASSWORD" $emailPasswordPlain $env
    Add-EnvVar "EMAIL_FROM_NAME" "CryptoRafts" $env
    Add-EnvVar "EMAIL_FROM_ADDRESS" "business@cryptorafts.com" $env
    
    # SMTP_* variables (for compatibility)
    Add-EnvVar "SMTP_HOST" "smtp.hostinger.com" $env
    Add-EnvVar "SMTP_PORT" "587" $env
    Add-EnvVar "SMTP_SECURE" "false" $env
    Add-EnvVar "SMTP_USER" "business@cryptorafts.com" $env
    Add-EnvVar "SMTP_PASS" $emailPasswordPlain $env
    
    Write-Host "  $env environment configured" -ForegroundColor Green
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "All environments configured successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Configuration Summary:" -ForegroundColor Cyan
Write-Host "   EMAIL_HOST: smtp.hostinger.com" -ForegroundColor White
Write-Host "   EMAIL_PORT: 587 (TLS)" -ForegroundColor White
Write-Host "   EMAIL_SECURE: false" -ForegroundColor White
Write-Host "   EMAIL_USER: business@cryptorafts.com" -ForegroundColor White
Write-Host "   EMAIL_FROM_ADDRESS: business@cryptorafts.com" -ForegroundColor White
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Set up DNS records (MX, SPF, DKIM) - See COMPLETE_HOSTINGER_DNS_SETUP.md" -ForegroundColor White
Write-Host "   2. Redeploy to Vercel:" -ForegroundColor White
Write-Host "      vercel --prod --yes" -ForegroundColor Cyan
Write-Host "   3. Test email sending:" -ForegroundColor White
Write-Host "      POST https://your-vercel-url.vercel.app/api/test-email" -ForegroundColor Cyan
Write-Host ""
Write-Host "Documentation:" -ForegroundColor Yellow
Write-Host "   - COMPLETE_HOSTINGER_DNS_SETUP.md (DNS records guide)" -ForegroundColor White
Write-Host "   - HOSTINGER_EMAIL_VERCEL_SETUP.md (Email setup guide)" -ForegroundColor White
Write-Host ""
