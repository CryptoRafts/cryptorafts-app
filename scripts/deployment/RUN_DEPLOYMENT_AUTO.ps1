# Automatically run deployment on VPS via SSH
# This script will SSH into VPS and run all deployment commands

param(
    [string]$VPS_IP = "145.79.211.130",
    [int]$SSH_PORT = 65002,
    [string]$SSH_USER = "u386122906",
    [string]$SSH_PASSWORD = ""
)

Write-Host "`n🚀 AUTOMATIC DEPLOYMENT ON VPS`n" -ForegroundColor Green
Write-Host "Connecting to VPS and running deployment...`n" -ForegroundColor Cyan

# Read deployment commands
$deployScript = Get-Content "DEPLOY_COMMANDS.sh" -Raw

# Check if WSL is available
$wslAvailable = $false
try {
    wsl --list 2>&1 | Out-Null
    $wslAvailable = $true
} catch {
    $wslAvailable = $false
}

if ($wslAvailable) {
    Write-Host "✅ Using WSL for SSH connection...`n" -ForegroundColor Green
    
    # Create a temporary script on the VPS
    Write-Host "📤 Uploading deployment script to VPS...`n" -ForegroundColor Yellow
    
    # Save script to temp file and upload
    $deployScript | Out-File -FilePath "temp_deploy.sh" -Encoding UTF8 -NoNewline
    
    # Upload via SCP
    $uploadCmd = "scp -P $SSH_PORT temp_deploy.sh ${SSH_USER}@${VPS_IP}:/tmp/deploy.sh"
    Write-Host "Running: $uploadCmd`n" -ForegroundColor Cyan
    
    $uploadResult = wsl bash -c "`"$uploadCmd`"" 2>&1
    
    if ($LASTEXITCODE -eq 0 -or $uploadResult -notmatch "Permission denied") {
        Write-Host "✅ Upload successful!`n" -ForegroundColor Green
        
        # Run the script
        Write-Host "🚀 Running deployment script on VPS...`n" -ForegroundColor Yellow
        Write-Host "This will take 10-15 minutes. Please wait...`n" -ForegroundColor Cyan
        
        $runCmd = "ssh -p $SSH_PORT ${SSH_USER}@${VPS_IP} 'bash /tmp/deploy.sh'"
        Write-Host "Running: $runCmd`n" -ForegroundColor Cyan
        
        wsl bash -c "`"$runCmd`""
        
        # Cleanup
        Remove-Item "temp_deploy.sh" -ErrorAction SilentlyContinue
        
        Write-Host "`n✅ Deployment script executed!`n" -ForegroundColor Green
    } else {
        Write-Host "`n⚠️  Upload failed. Please run commands manually.`n" -ForegroundColor Yellow
        Write-Host "Copy and paste the contents of DEPLOY_COMMANDS.sh in your SSH terminal.`n" -ForegroundColor Cyan
    }
} else {
    Write-Host "`n⚠️  WSL not available. Please run commands manually in SSH terminal:`n" -ForegroundColor Yellow
    Write-Host "Copy and paste the contents of DEPLOY_COMMANDS.sh in your SSH terminal.`n" -ForegroundColor Cyan
}

Write-Host "`n📋 Alternative: Run directly in SSH terminal`n" -ForegroundColor Cyan
Write-Host "Paste this one-liner in your SSH terminal:`n" -ForegroundColor Yellow
Write-Host "curl -s https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash && export NVM_DIR=`$HOME/.nvm && [ -s `$NVM_DIR/nvm.sh ] && . `$NVM_DIR/nvm.sh && nvm install 20 && nvm use 20 && cd /var/www/cryptorafts && (tar -xzf cryptorafts.tar.gz 2>/dev/null || true) && ([ -d cryptorafts ] && mv cryptorafts/* . 2>/dev/null || true) && ([ -d DEPLOY_TO_VPS ] && mv DEPLOY_TO_VPS/* . 2>/dev/null || true) && npm install --legacy-peer-deps && rm -rf .next out && NODE_ENV=production npm run build && cat > server.js << 'EOF'
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();
app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  })
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(\`> Ready on http://\${hostname}:\${port}\`);
    });
});
EOF
NODE_PATH=`$(which node) && cat > ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'cryptorafts',
      script: './server.js',
      instances: 1,
      exec_mode: 'fork',
      interpreter: '\$NODE_PATH',
      env: { NODE_ENV: 'production', PORT: 3000 },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
    },
  ],
};
EOF
mkdir -p logs && pm2 stop all 2>/dev/null || true && pm2 delete all 2>/dev/null || true && pm2 start ecosystem.config.js && pm2 save && pm2 status
" -ForegroundColor White

