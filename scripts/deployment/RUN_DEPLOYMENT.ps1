# Run Complete Deployment on VPS
# This script connects to VPS and runs DEPLOY_COMMANDS.sh

param(
    [string]$VPS_IP = "145.79.211.130",
    [int]$SSH_PORT = 65002,
    [string]$SSH_USER = "u386122906",
    [string]$SSH_PASSWORD = ""
)

Write-Host "`n🚀 RUNNING COMPLETE DEPLOYMENT ON VPS`n" -ForegroundColor Green

# Check if WSL is available
$wslAvailable = $false
try {
    wsl --list 2>&1 | Out-Null
    $wslAvailable = $true
} catch {
    $wslAvailable = $false
}

if ($wslAvailable) {
    Write-Host "✅ WSL detected. Using WSL for SSH connection...`n" -ForegroundColor Green
    
    # Check if DEPLOY_COMMANDS.sh exists
    if (-not (Test-Path "DEPLOY_COMMANDS.sh")) {
        Write-Host "❌ DEPLOY_COMMANDS.sh not found!" -ForegroundColor Red
        Write-Host "Creating DEPLOY_COMMANDS.sh...`n" -ForegroundColor Yellow
        # The file should have been created by COMPLETE_DEPLOYMENT_AUTO.ps1
    }
    
    Write-Host "📤 Uploading DEPLOY_COMMANDS.sh to VPS...`n" -ForegroundColor Cyan
    
    # Upload script to VPS
    $uploadCmd = "scp -P $SSH_PORT DEPLOY_COMMANDS.sh ${SSH_USER}@${VPS_IP}:/tmp/DEPLOY_COMMANDS.sh"
    Write-Host "Running: $uploadCmd`n" -ForegroundColor Yellow
    
    wsl bash -c "echo '$SSH_PASSWORD' | $uploadCmd" 2>&1
    
    if ($LASTEXITCODE -eq 0 -or $SSH_PASSWORD -eq "") {
        Write-Host "`n✅ Upload successful!`n" -ForegroundColor Green
        
        Write-Host "🚀 Running deployment script on VPS...`n" -ForegroundColor Cyan
        Write-Host "⚠️  You may be prompted for SSH password`n" -ForegroundColor Yellow
        
        $runCmd = "ssh -p $SSH_PORT ${SSH_USER}@${VPS_IP} 'bash /tmp/DEPLOY_COMMANDS.sh'"
        Write-Host "Running: $runCmd`n" -ForegroundColor Yellow
        
        wsl bash -c $runCmd
        
        Write-Host "`n✅ Deployment script executed!`n" -ForegroundColor Green
        Write-Host "📋 Check output above for deployment status`n" -ForegroundColor Cyan
    } else {
        Write-Host "`n⚠️  Upload failed. Please run commands manually in SSH terminal:`n" -ForegroundColor Yellow
        Write-Host "1. Connect via SSH:" -ForegroundColor Cyan
        Write-Host "   ssh -p $SSH_PORT $SSH_USER@$VPS_IP`n" -ForegroundColor White
        Write-Host "2. Copy and paste contents of DEPLOY_COMMANDS.sh`n" -ForegroundColor Cyan
    }
} else {
    Write-Host "⚠️  WSL not available. Please run commands manually in SSH terminal:`n" -ForegroundColor Yellow
    Write-Host "1. Connect via SSH:" -ForegroundColor Cyan
    Write-Host "   ssh -p $SSH_PORT $SSH_USER@$VPS_IP`n" -ForegroundColor White
    Write-Host "2. Copy and paste contents of DEPLOY_COMMANDS.sh`n" -ForegroundColor Cyan
    Write-Host "   OR upload DEPLOY_COMMANDS.sh via Hostinger File Manager`n" -ForegroundColor Yellow
}

Write-Host "📋 Full deployment commands saved in: DEPLOY_COMMANDS.sh`n" -ForegroundColor Cyan
Write-Host "📋 To view commands: Get-Content DEPLOY_COMMANDS.sh`n" -ForegroundColor Cyan

