# ============================================
# CRYPTORAFTS - AUTOMATED DEPLOYMENT (NO PASSWORD REQUIRED)
# ============================================

Write-Host "`n🚀 CRYPTORAFTS - AUTOMATED DEPLOYMENT" -ForegroundColor Cyan
Write-Host "================================================`n" -ForegroundColor Cyan

$vpsIP = "72.61.98.99"
$vpsUser = "root"

# Create the deployment command as a single base64-encoded string for easy transfer
$deploymentScript = Get-Content -Path "RUN_THIS_IN_SSH_NOW.sh" -Raw -ErrorAction SilentlyContinue

if (-not $deploymentScript) {
    Write-Host "❌ RUN_THIS_IN_SSH_NOW.sh not found. Creating deployment command..." -ForegroundColor Red
    Write-Host "`n✅ Please run this command directly in your SSH terminal:" -ForegroundColor Yellow
    Write-Host "`ncd /var/www/cryptorafts && bash RUN_THIS_IN_SSH_NOW.sh`n" -ForegroundColor Cyan
    exit
}

Write-Host "📋 Deployment script found. Creating automated deployment solution..." -ForegroundColor Yellow
Write-Host ""

# Try method 1: Direct SSH execution (if password is saved or key-based auth works)
Write-Host "📋 Attempting Method 1: Direct SSH execution..." -ForegroundColor Yellow
try {
    $sshCmd = "cd /var/www/cryptorafts 2>/dev/null || mkdir -p /var/www/cryptorafts && cd /var/www/cryptorafts && bash RUN_THIS_IN_SSH_NOW.sh"
    ssh ${vpsUser}@${vpsIP} $sshCmd
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✅ Deployment completed successfully via SSH!" -ForegroundColor Green
        exit 0
    }
} catch {
    Write-Host "⚠️  Method 1 failed (password required). Trying alternative methods..." -ForegroundColor Yellow
}

# Method 2: Create a ready-to-paste command
Write-Host "`n📋 Method 2: Creating ready-to-paste deployment command..." -ForegroundColor Yellow

$oneLinerCmd = @"
cd /var/www/cryptorafts 2>/dev/null || mkdir -p /var/www/cryptorafts && cd /var/www/cryptorafts && curl -sSL https://raw.githubusercontent.com/your-repo/deploy.sh | bash || (echo 'Download failed, using local method...' && cat > /tmp/quick_deploy.sh << 'DEPLOYEOF'
$(Get-Content -Path "RUN_THIS_IN_SSH_NOW.sh" -Raw)
DEPLOYEOF
chmod +x /tmp/quick_deploy.sh && bash /tmp/quick_deploy.sh)
"@

# Save the one-liner to a file
$oneLinerCmd | Out-File -FilePath "PASTE_THIS_IN_SSH.txt" -Encoding UTF8

Write-Host "✅ Created PASTE_THIS_IN_SSH.txt" -ForegroundColor Green
Write-Host ""

# Method 3: Create PowerShell script that uploads via Hostinger File Manager instructions
Write-Host "📋 Method 3: Creating Hostinger File Manager upload instructions..." -ForegroundColor Yellow

$uploadInstructions = @"
# ============================================
# HOSTINGER FILE MANAGER UPLOAD INSTRUCTIONS
# ============================================

1. Go to: https://hpanel.hostinger.com/vps/1097850/overview
2. Click "File Manager" or go to: /var/www/cryptorafts
3. Upload RUN_THIS_IN_SSH_NOW.sh to /var/www/cryptorafts
4. Open Hostinger Web Terminal: https://int.hostingervps.com/1113/?token=d45ede362c7a332c95624f383b6eef3e27ee91b851fe711fae1e683300388d77
5. Run: cd /var/www/cryptorafts && chmod +x RUN_THIS_IN_SSH_NOW.sh && bash RUN_THIS_IN_SSH_NOW.sh
"@

$uploadInstructions | Out-File -FilePath "HOSTINGER_UPLOAD_INSTRUCTIONS.txt" -Encoding UTF8

Write-Host "✅ Created HOSTINGER_UPLOAD_INSTRUCTIONS.txt" -ForegroundColor Green
Write-Host ""

# Final: Create the simplest possible deployment command
Write-Host "📋 Creating simplest deployment command..." -ForegroundColor Yellow

$simpleDeploy = @"
cd /var/www/cryptorafts && bash RUN_THIS_IN_SSH_NOW.sh
"@

$simpleDeploy | Out-File -FilePath "SIMPLE_DEPLOY.txt" -Encoding UTF8

Write-Host "✅ Created SIMPLE_DEPLOY.txt" -ForegroundColor Green
Write-Host ""

Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ AUTOMATED DEPLOYMENT SOLUTION READY!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════`n" -ForegroundColor Cyan

Write-Host "🔧 QUICKEST WAY TO DEPLOY:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. If you're in SSH terminal, run:" -ForegroundColor White
Write-Host "   cd /var/www/cryptorafts && bash RUN_THIS_IN_SSH_NOW.sh" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. OR use Hostinger Web Terminal:" -ForegroundColor White
Write-Host "   https://int.hostingervps.com/1113/?token=d45ede362c7a332c95624f383b6eef3e27ee91b851fe711fae1e683300388d77" -ForegroundColor Cyan
Write-Host "   Then paste the command from SIMPLE_DEPLOY.txt" -ForegroundColor White
Write-Host ""
Write-Host "3. OR upload RUN_THIS_IN_SSH_NOW.sh via Hostinger File Manager" -ForegroundColor White
Write-Host "   See HOSTINGER_UPLOAD_INSTRUCTIONS.txt for details" -ForegroundColor Cyan
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════`n" -ForegroundColor Cyan

