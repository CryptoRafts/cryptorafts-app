# ========================================
# 🚀 FRESH DEPLOYMENT - ALL FILES
# ========================================
# This script uploads ALL files from fresh build to VPS
# Run this after deleting all files from VPS

$ErrorActionPreference = "Stop"

# VPS Configuration
$vpsUser = "root"
$vpsIp = "72.61.98.99"  # Replace with your actual VPS IP
$vpsPath = "/var/www/cryptorafts"
$projectRoot = $PSScriptRoot

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🚀 FRESH DEPLOYMENT - ALL FILES" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "VPS: $vpsUser@$vpsIp" -ForegroundColor Yellow
Write-Host "Path: $vpsPath" -ForegroundColor Yellow
Write-Host ""

# Step 1: Verify build exists
Write-Host "📋 Step 1: Verifying build..." -ForegroundColor Yellow
if (-not (Test-Path ".next")) {
    Write-Host "❌ Error: .next folder not found! Please run 'npm run build' first." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Build verified: .next folder exists" -ForegroundColor Green
Write-Host ""

# Step 2: Create deployment script for VPS
Write-Host "📝 Step 2: Creating VPS deployment script..." -ForegroundColor Yellow
$vpsScript = @"
#!/bin/bash
set -e

echo "========================================"
echo "🚀 FRESH DEPLOYMENT ON VPS"
echo "========================================"
echo ""

cd $vpsPath

# Step 1: Stop PM2
echo "📋 Step 1: Stopping PM2..."
pm2 stop cryptorafts || true
pm2 delete cryptorafts || true
echo "✅ PM2 stopped"
echo ""

# Step 2: Clean old files (if any remain)
echo "📋 Step 2: Cleaning old files..."
rm -rf .next node_modules package-lock.json || true
echo "✅ Old files cleaned"
echo ""

# Step 3: Install dependencies
echo "📋 Step 3: Installing dependencies..."
npm install --production=false
echo "✅ Dependencies installed"
echo ""

# Step 4: Build application
echo "📋 Step 4: Building application..."
npm run build
echo "✅ Build completed"
echo ""

# Step 5: Create logs directory
echo "📋 Step 5: Creating logs directory..."
mkdir -p logs
echo "✅ Logs directory created"
echo ""

# Step 6: Start PM2
echo "📋 Step 6: Starting PM2..."
pm2 start ecosystem.config.js
pm2 save
pm2 startup || true
echo "✅ PM2 started"
echo ""

# Step 7: Verify PM2 status
echo "📋 Step 7: Verifying PM2 status..."
pm2 status
echo ""

# Step 8: Check if server is running
echo "📋 Step 8: Checking server..."
sleep 3
curl -f http://localhost:3000 > /dev/null 2>&1 && echo "✅ Server is running on port 3000" || echo "⚠️ Server check failed (may need a moment to start)"
echo ""

echo "========================================"
echo "✅ DEPLOYMENT COMPLETE!"
echo "========================================"
echo ""
echo "Your app should now be live at: https://www.cryptorafts.com"
echo ""
"@

$vpsScript | Out-File -FilePath "FRESH_DEPLOY_VPS.sh" -Encoding UTF8
Write-Host "✅ VPS deployment script created: FRESH_DEPLOY_VPS.sh" -ForegroundColor Green
Write-Host ""

# Step 3: Upload VPS deployment script first
Write-Host "📤 Step 3: Uploading VPS deployment script..." -ForegroundColor Yellow
Write-Host "   (You will be prompted for SSH password)" -ForegroundColor Gray
try {
    scp "FRESH_DEPLOY_VPS.sh" "${vpsUser}@${vpsIp}:${vpsPath}/FRESH_DEPLOY_VPS.sh"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Deployment script uploaded" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to upload deployment script" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error uploading deployment script: $_" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 4: Upload all source files (excluding node_modules and .next)
Write-Host "📤 Step 4: Uploading all source files..." -ForegroundColor Yellow
Write-Host "   This may take a few minutes..." -ForegroundColor Gray
Write-Host "   (You will be prompted for SSH password)" -ForegroundColor Gray
Write-Host ""

# Files and directories to upload
$filesToUpload = @(
    "src",
    "public",
    "package.json",
    "package-lock.json",
    "next.config.js",
    "tsconfig.json",
    "tailwind.config.ts",
    "postcss.config.js",
    "ecosystem.config.js",
    "server.js",
    ".env.local",
    "README.md"
)

foreach ($item in $filesToUpload) {
    if (Test-Path $item) {
        Write-Host "   Uploading: $item" -ForegroundColor Gray
        try {
            if (Test-Path $item -PathType Container) {
                # Directory
                scp -r $item "${vpsUser}@${vpsIp}:${vpsPath}/"
            } else {
                # File
                scp $item "${vpsUser}@${vpsIp}:${vpsPath}/"
            }
            if ($LASTEXITCODE -ne 0) {
                Write-Host "   Warning: Failed to upload $item" -ForegroundColor Yellow
            }
        } catch {
            Write-Host "   Warning: Error uploading $item: $_" -ForegroundColor Yellow
        }
    } else {
        Write-Host "   ⚠️ Skipping: $item (not found)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "✅ Source files uploaded" -ForegroundColor Green
Write-Host ""

# Step 5: Run deployment script on VPS
Write-Host "🔧 Step 5: Running deployment on VPS..." -ForegroundColor Yellow
Write-Host "   (You will be prompted for SSH password)" -ForegroundColor Gray
Write-Host ""

try {
    $sshCommand = "ssh ${vpsUser}@${vpsIp} 'cd ${vpsPath} && chmod +x FRESH_DEPLOY_VPS.sh && bash FRESH_DEPLOY_VPS.sh'"
    Write-Host "   Running: $sshCommand" -ForegroundColor Gray
    Invoke-Expression $sshCommand
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Deployment completed successfully!" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Deployment completed with warnings (exit code: $LASTEXITCODE)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Error running deployment: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "You can manually SSH to the VPS and run:" -ForegroundColor Yellow
    Write-Host "  ssh ${vpsUser}@${vpsIp}" -ForegroundColor Cyan
    Write-Host "  cd ${vpsPath}" -ForegroundColor Cyan
    Write-Host "  chmod +x FRESH_DEPLOY_VPS.sh" -ForegroundColor Cyan
    Write-Host "  bash FRESH_DEPLOY_VPS.sh" -ForegroundColor Cyan
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ FRESH DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your app should now be live at: https://www.cryptorafts.com" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Wait 1-2 minutes for PM2 to fully start" -ForegroundColor Gray
Write-Host "2. Clear your browser cache (Ctrl+Shift+R)" -ForegroundColor Gray
Write-Host "3. Visit the website" -ForegroundColor Gray
Write-Host ""

