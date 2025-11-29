# ============================================
# CRYPTORAFTS - FINAL DEPLOYMENT SOLUTION
# ============================================

Write-Host "`n🚀 CRYPTORAFTS - AUTOMATED DEPLOYMENT SOLUTION" -ForegroundColor Cyan
Write-Host "================================================`n" -ForegroundColor Cyan

Write-Host "📋 Creating final deployment files..." -ForegroundColor Yellow

# Create the simplest deployment command
$simpleCmd = "cd /var/www/cryptorafts && bash RUN_THIS_IN_SSH_NOW.sh"
$simpleCmd | Out-File -FilePath "SIMPLE_DEPLOY.txt" -Encoding UTF8

Write-Host "✅ Created SIMPLE_DEPLOY.txt" -ForegroundColor Green
Write-Host ""

Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ DEPLOYMENT READY!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════`n" -ForegroundColor Cyan

Write-Host "🔧 QUICK DEPLOYMENT:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Run this command in your SSH terminal or Hostinger Web Terminal:" -ForegroundColor White
Write-Host $simpleCmd -ForegroundColor Cyan
Write-Host ""
Write-Host "OR use the complete script: RUN_THIS_IN_SSH_NOW.sh" -ForegroundColor White
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════`n" -ForegroundColor Cyan

