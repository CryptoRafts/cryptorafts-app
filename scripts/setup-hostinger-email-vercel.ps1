# 🔧 Setup Hostinger Email for Vercel
# This script adds Hostinger SMTP environment variables to Vercel

Write-Host "📧 Setting up Hostinger Email (business@cryptorafts.com) for Vercel..." -ForegroundColor Cyan
Write-Host ""

# Check if Vercel CLI is installed
if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Vercel CLI not found. Please install it first:" -ForegroundColor Red
    Write-Host "   npm install -g vercel" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Vercel CLI found" -ForegroundColor Green
Write-Host ""

# Prompt for email password
$emailPassword = Read-Host "Enter your Hostinger email password for business@cryptorafts.com" -AsSecureString
$emailPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($emailPassword)
)

Write-Host ""
Write-Host "🔐 Adding environment variables to Vercel..." -ForegroundColor Cyan
Write-Host ""

# Add environment variables to Vercel
# Production environment
Write-Host "📦 Adding to Production environment..." -ForegroundColor Yellow

echo "smtp.hostinger.com" | vercel env add EMAIL_HOST production
echo "587" | vercel env add EMAIL_PORT production
echo "false" | vercel env add EMAIL_SECURE production
echo "business@cryptorafts.com" | vercel env add EMAIL_USER production
echo $emailPasswordPlain | vercel env add EMAIL_PASSWORD production
echo "CryptoRafts" | vercel env add EMAIL_FROM_NAME production
echo "business@cryptorafts.com" | vercel env add EMAIL_FROM_ADDRESS production

# Also add SMTP_* variables for compatibility
echo "smtp.hostinger.com" | vercel env add SMTP_HOST production
echo "587" | vercel env add SMTP_PORT production
echo "false" | vercel env add SMTP_SECURE production
echo "business@cryptorafts.com" | vercel env add SMTP_USER production
echo $emailPasswordPlain | vercel env add SMTP_PASS production

Write-Host ""
Write-Host "📦 Adding to Preview environment..." -ForegroundColor Yellow

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
Write-Host "📦 Adding to Development environment..." -ForegroundColor Yellow

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
Write-Host "✅ Environment variables added successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Summary:" -ForegroundColor Cyan
Write-Host "   EMAIL_HOST: smtp.hostinger.com" -ForegroundColor White
Write-Host "   EMAIL_PORT: 587 (TLS)" -ForegroundColor White
Write-Host "   EMAIL_SECURE: false" -ForegroundColor White
Write-Host "   EMAIL_USER: business@cryptorafts.com" -ForegroundColor White
Write-Host "   EMAIL_FROM_ADDRESS: business@cryptorafts.com" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Redeploy your Vercel project:" -ForegroundColor Yellow
Write-Host "      vercel --prod --yes" -ForegroundColor White
Write-Host ""
Write-Host "   2. Test email sending:" -ForegroundColor Yellow
Write-Host "      POST https://your-vercel-url.vercel.app/api/test-email" -ForegroundColor White
Write-Host ""
Write-Host "   3. Verify MX records are set (already done):" -ForegroundColor Yellow
Write-Host "      mx1.hostinger.com (priority 5)" -ForegroundColor White
Write-Host "      mx2.hostinger.com (priority 10)" -ForegroundColor White
Write-Host ""

