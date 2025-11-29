# 🔧 Add Hostinger Email Environment Variables to Vercel
# Simple script to add email configuration to Vercel

Write-Host "📧 Adding Hostinger Email Configuration to Vercel" -ForegroundColor Cyan
Write-Host ""

# Get email password
Write-Host "Enter your Hostinger email password for business@cryptorafts.com:" -ForegroundColor Yellow
$emailPassword = Read-Host -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($emailPassword)
$emailPasswordPlain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

Write-Host ""
Write-Host "Adding to Production environment..." -ForegroundColor Yellow

# Production
Write-Host "EMAIL_HOST..." -ForegroundColor Gray
echo "smtp.hostinger.com" | vercel env add EMAIL_HOST production

Write-Host "EMAIL_PORT..." -ForegroundColor Gray
echo "587" | vercel env add EMAIL_PORT production

Write-Host "EMAIL_SECURE..." -ForegroundColor Gray
echo "false" | vercel env add EMAIL_SECURE production

Write-Host "EMAIL_USER..." -ForegroundColor Gray
echo "business@cryptorafts.com" | vercel env add EMAIL_USER production

Write-Host "EMAIL_PASSWORD..." -ForegroundColor Gray
echo $emailPasswordPlain | vercel env add EMAIL_PASSWORD production

Write-Host "EMAIL_FROM_NAME..." -ForegroundColor Gray
echo "CryptoRafts" | vercel env add EMAIL_FROM_NAME production

Write-Host "EMAIL_FROM_ADDRESS..." -ForegroundColor Gray
echo "business@cryptorafts.com" | vercel env add EMAIL_FROM_ADDRESS production

Write-Host "SMTP_HOST..." -ForegroundColor Gray
echo "smtp.hostinger.com" | vercel env add SMTP_HOST production

Write-Host "SMTP_PORT..." -ForegroundColor Gray
echo "587" | vercel env add SMTP_PORT production

Write-Host "SMTP_SECURE..." -ForegroundColor Gray
echo "false" | vercel env add SMTP_SECURE production

Write-Host "SMTP_USER..." -ForegroundColor Gray
echo "business@cryptorafts.com" | vercel env add SMTP_USER production

Write-Host "SMTP_PASS..." -ForegroundColor Gray
echo $emailPasswordPlain | vercel env add SMTP_PASS production

Write-Host ""
Write-Host "✅ Production environment configured!" -ForegroundColor Green
Write-Host ""
Write-Host "Do you want to add to Preview and Development environments? (Y/N)" -ForegroundColor Yellow
$addMore = Read-Host

if ($addMore -eq "Y" -or $addMore -eq "y") {
    Write-Host ""
    Write-Host "Adding to Preview environment..." -ForegroundColor Yellow
    
    echo "smtp.hostinger.com" | vercel env add EMAIL_HOST preview
    echo "587" | vercel env add EMAIL_PORT preview
    echo "false" | vercel env add EMAIL_SECURE preview
    echo "business@cryptorafts.com" | vercel env add EMAIL_USER preview
    echo $emailPasswordPlain | vercel env add EMAIL_PASSWORD preview
    echo "CryptoRafts" | vercel env add EMAIL_FROM_NAME preview
    echo "business@cryptorafts.com" | vercel env add EMAIL_FROM_ADDRESS preview
    echo "smtp.hostinger.com" | vercel env add SMTP_HOST preview
    echo "587" | vercel env add SMTP_PORT preview
    echo "false" | vercel env add SMTP_SECURE preview
    echo "business@cryptorafts.com" | vercel env add SMTP_USER preview
    echo $emailPasswordPlain | vercel env add SMTP_PASS preview
    
    Write-Host ""
    Write-Host "Adding to Development environment..." -ForegroundColor Yellow
    
    echo "smtp.hostinger.com" | vercel env add EMAIL_HOST development
    echo "587" | vercel env add EMAIL_PORT development
    echo "false" | vercel env add EMAIL_SECURE development
    echo "business@cryptorafts.com" | vercel env add EMAIL_USER development
    echo $emailPasswordPlain | vercel env add EMAIL_PASSWORD development
    echo "CryptoRafts" | vercel env add EMAIL_FROM_NAME development
    echo "business@cryptorafts.com" | vercel env add EMAIL_FROM_ADDRESS development
    echo "smtp.hostinger.com" | vercel env add SMTP_HOST development
    echo "587" | vercel env add SMTP_PORT development
    echo "false" | vercel env add SMTP_SECURE development
    echo "business@cryptorafts.com" | vercel env add SMTP_USER development
    echo $emailPasswordPlain | vercel env add SMTP_PASS development
    
    Write-Host ""
    Write-Host "✅ All environments configured!" -ForegroundColor Green
}

Write-Host ""
Write-Host "📋 Summary:" -ForegroundColor Cyan
Write-Host "   ✅ EMAIL_HOST: smtp.hostinger.com" -ForegroundColor White
Write-Host "   ✅ EMAIL_PORT: 587" -ForegroundColor White
Write-Host "   ✅ EMAIL_USER: business@cryptorafts.com" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Next: Redeploy to Vercel" -ForegroundColor Yellow
Write-Host "   vercel --prod --yes" -ForegroundColor White
Write-Host ""

