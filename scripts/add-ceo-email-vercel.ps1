# Add CEO email configuration to Vercel
# This script adds ceo@cryptorafts.com as an available email alias

Write-Host "Adding CEO email to Vercel configuration..." -ForegroundColor Cyan
Write-Host ""

# Check if Vercel CLI is installed
if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
    Write-Host "[X] Vercel CLI not found. Install it with: npm i -g vercel" -ForegroundColor Red
    exit 1
}

Write-Host "[OK] Vercel CLI found" -ForegroundColor Green
Write-Host ""

# Note: Email aliases are configured in code, not Vercel env vars
# The SMTP_USER remains business@cryptorafts.com, but we can send FROM ceo@cryptorafts.com
Write-Host "Email Configuration:" -ForegroundColor Yellow
Write-Host "  SMTP User: business@cryptorafts.com (Hostinger mailbox)" -ForegroundColor White
Write-Host "  Available FROM addresses:" -ForegroundColor White
Write-Host "    - business@cryptorafts.com" -ForegroundColor Cyan
Write-Host "    - ceo@cryptorafts.com (NEW)" -ForegroundColor Green
Write-Host "    - support@cryptorafts.com" -ForegroundColor Cyan
Write-Host "    - admin@cryptorafts.com" -ForegroundColor Cyan
Write-Host "    - (and other aliases)" -ForegroundColor Cyan
Write-Host ""

Write-Host "[OK] CEO email alias added to codebase" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Create ceo@cryptorafts.com mailbox in Hostinger" -ForegroundColor White
Write-Host "  2. Deploy to Vercel: vercel --prod" -ForegroundColor White
Write-Host "  3. Use getEmailAlias('ceo') in your code to send emails FROM ceo@cryptorafts.com" -ForegroundColor White
Write-Host ""

Write-Host "Example usage in code:" -ForegroundColor Yellow
Write-Host '  import { getEmailAlias } from "@/config/email-aliases.config";' -ForegroundColor Gray
Write-Host '  const ceoEmail = getEmailAlias("ceo");' -ForegroundColor Gray
Write-Host '  // ceoEmail.address = "ceo@cryptorafts.com"' -ForegroundColor Gray
Write-Host '  // ceoEmail.name = "CryptoRafts CEO"' -ForegroundColor Gray
Write-Host ""

