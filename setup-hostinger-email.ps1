# Setup Hostinger Email for Vercel
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "SETUP HOSTINGER EMAIL FOR VERCEL" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Get email details from user
Write-Host "Enter your Hostinger email details:" -ForegroundColor Yellow
Write-Host ""

$emailUser = Read-Host "Email Address (e.g., business@cryptorafts.com)"
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
Write-Host "Adding environment variables to Vercel..." -ForegroundColor Yellow
Write-Host ""

# Add to Production
Write-Host "Adding to Production environment..." -ForegroundColor Cyan
echo "smtp.hostinger.com" | vercel env add EMAIL_HOST production
echo $emailPort | vercel env add EMAIL_PORT production
echo $emailSecure | vercel env add EMAIL_SECURE production
echo $emailUser | vercel env add EMAIL_USER production
echo $emailPasswordPlain | vercel env add EMAIL_PASSWORD production
echo "CryptoRafts" | vercel env add EMAIL_FROM_NAME production
echo $emailUser | vercel env add EMAIL_FROM_ADDRESS production

Write-Host ""
Write-Host "Adding to Preview environment..." -ForegroundColor Cyan
echo "smtp.hostinger.com" | vercel env add EMAIL_HOST preview
echo $emailPort | vercel env add EMAIL_PORT preview
echo $emailSecure | vercel env add EMAIL_SECURE preview
echo $emailUser | vercel env add EMAIL_USER preview
echo $emailPasswordPlain | vercel env add EMAIL_PASSWORD preview
echo "CryptoRafts" | vercel env add EMAIL_FROM_NAME preview
echo $emailUser | vercel env add EMAIL_FROM_ADDRESS preview

Write-Host ""
Write-Host "Adding to Development environment..." -ForegroundColor Cyan
echo "smtp.hostinger.com" | vercel env add EMAIL_HOST development
echo $emailPort | vercel env add EMAIL_PORT development
echo $emailSecure | vercel env add EMAIL_SECURE development
echo $emailUser | vercel env add EMAIL_USER development
echo $emailPasswordPlain | vercel env add EMAIL_PASSWORD development
echo "CryptoRafts" | vercel env add EMAIL_FROM_NAME development
echo $emailUser | vercel env add EMAIL_FROM_ADDRESS development

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "✅ EMAIL ENVIRONMENT VARIABLES ADDED!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Redeploy: vercel --prod --yes" -ForegroundColor White
Write-Host "  2. Test email: https://www.cryptorafts.com/api/email/send" -ForegroundColor White
Write-Host ""

