# ============================================
# FIX HERO SECTION VISIBILITY - PowerShell
# ============================================

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "🔧 FIXING HERO SECTION VISIBILITY" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Upload fix script to VPS
Write-Host "1. Uploading fix script to VPS..." -ForegroundColor Yellow
$uploadScript = @"
scp FIX_VISIBILITY_SERVER.sh root@72.61.98.99:/var/www/cryptorafts/
"@

Write-Host "Run this command:" -ForegroundColor Green
Write-Host $uploadScript -ForegroundColor White
Write-Host ""

# 2. SSH and run fix
Write-Host "2. SSH into VPS and run fix..." -ForegroundColor Yellow
$sshCommand = @"
ssh root@72.61.98.99 "cd /var/www/cryptorafts && chmod +x FIX_VISIBILITY_SERVER.sh && bash FIX_VISIBILITY_SERVER.sh"
"@

Write-Host "Run this command:" -ForegroundColor Green
Write-Host $sshCommand -ForegroundColor White
Write-Host ""

# 3. Alternative: Direct commands
Write-Host "3. OR run these commands directly on VPS:" -ForegroundColor Yellow
Write-Host ""

$directCommands = @"
cd /var/www/cryptorafts

# Add visibility fix to CSS
cat >> src/app/globals.css << 'CSSFIX'

/* CRITICAL: FORCE HERO SECTION VISIBILITY */
section[aria-label*="Hero section"] {
  display: flex !important;
  visibility: visible !important;
  opacity: 1 !important;
  z-index: 200 !important;
}
section[aria-label*="Hero section"] .hero-content {
  display: flex !important;
  visibility: visible !important;
  opacity: 1 !important;
  z-index: 300 !important;
}
section[aria-label*="Hero section"] h1,
section[aria-label*="Hero section"] h2,
section[aria-label*="Hero section"] h3,
section[aria-label*="Hero section"] p {
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
  z-index: 500 !important;
  color: white !important;
}
CSSFIX

# Rebuild
npm run build

# Restart
pm2 restart cryptorafts
systemctl reload nginx
"@

Write-Host $directCommands -ForegroundColor White
Write-Host ""

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "✅ Commands ready!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan

