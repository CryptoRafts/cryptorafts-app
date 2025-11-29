# Complete Automated Deployment Script for Hostinger VPS
# This script provides commands to run in SSH terminal

param(
    [string]$VPS_IP = "145.79.211.130",
    [int]$SSH_PORT = 65002,
    [string]$SSH_USER = "u386122906",
    [string]$SSH_PASSWORD = ""
)

Write-Host "`n🚀 COMPLETE AUTOMATED DEPLOYMENT`n" -ForegroundColor Green
Write-Host "📋 This script will deploy your app to VPS`n" -ForegroundColor Cyan

# Deployment commands to run in SSH
$deployCommands = @"
# ============================================
# COMPLETE DEPLOYMENT SCRIPT
# ============================================

echo "🔍 STEP 1: Check current files..."
cd /var/www/cryptorafts
ls -la package.json 2>/dev/null || echo "❌ package.json NOT found"
ls -la src/app/page.tsx 2>/dev/null || echo "❌ src/app/page.tsx NOT found"
ls -la next.config.js 2>/dev/null || echo "❌ next.config.js NOT found"

echo ""
echo "📦 STEP 2: Extract cryptorafts.tar.gz if needed..."
if [ ! -f "package.json" ]; then
    echo "Extracting cryptorafts.tar.gz..."
    tar -xzf cryptorafts.tar.gz 2>/dev/null || true
    
    # Check if files extracted to subdirectory
    if [ -d "cryptorafts" ]; then
        echo "Moving files from cryptorafts/ subdirectory..."
        mv cryptorafts/* . 2>/dev/null || true
        mv cryptorafts/.* . 2>/dev/null || true
        rmdir cryptorafts 2>/dev/null || true
    fi
    
    if [ -d "DEPLOY_TO_VPS" ]; then
        echo "Moving files from DEPLOY_TO_VPS/ subdirectory..."
        mv DEPLOY_TO_VPS/* . 2>/dev/null || true
        mv DEPLOY_TO_VPS/.* . 2>/dev/null || true
        rmdir DEPLOY_TO_VPS 2>/dev/null || true
    fi
fi

echo ""
echo "✅ STEP 3: Verify files extracted..."
ls -la package.json || echo "❌ package.json still missing!"
ls -la src/app/page.tsx || echo "❌ src/app/page.tsx still missing!"
ls -la next.config.js || echo "❌ next.config.js still missing!"

if [ ! -f "package.json" ] || [ ! -f "src/app/page.tsx" ]; then
    echo ""
    echo "❌ ERROR: Required files still missing!"
    echo "Please upload files via Hostinger File Manager to /var/www/cryptorafts"
    exit 1
fi

echo ""
echo "📦 STEP 4: Load Node.js 20..."
export NVM_DIR="\$HOME/.nvm"
[ -s "\$NVM_DIR/nvm.sh" ] && \. "\$NVM_DIR/nvm.sh"
nvm use 20 2>/dev/null || {
    echo "Installing NVM and Node.js 20..."
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
    export NVM_DIR="\$HOME/.nvm"
    [ -s "\$NVM_DIR/nvm.sh" ] && \. "\$NVM_DIR/nvm.sh"
    nvm install 20
    nvm use 20
}
node --version

echo ""
echo "📦 STEP 5: Install dependencies..."
npm install --legacy-peer-deps

if [ \$? -ne 0 ]; then
    echo "❌ npm install failed!"
    exit 1
fi

echo ""
echo "🏗️  STEP 6: Clean and build app..."
rm -rf .next out node_modules/.cache
NODE_ENV=production npm run build

if [ \$? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo ""
echo "✅ STEP 7: Verify build succeeded..."
ls -la .next || echo "❌ Build output missing!"

echo ""
echo "📝 STEP 8: Create/verify server.js..."
if [ ! -f "server.js" ]; then
    cat > server.js << 'EOF'
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
    echo "Created server.js"
else
    echo "server.js already exists"
fi

echo ""
echo "📝 STEP 9: Create ecosystem.config.js..."
NODE_PATH=\$(which node)
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'cryptorafts',
      script: './server.js',
      instances: 1,
      exec_mode: 'fork',
      interpreter: '\$NODE_PATH',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
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
echo "Created ecosystem.config.js"

echo ""
echo "🔄 STEP 10: Stop old PM2 processes..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true

echo ""
echo "🚀 STEP 11: Start PM2..."
mkdir -p logs
pm2 start ecosystem.config.js
pm2 save
pm2 status

echo ""
echo "✅ STEP 12: Verify app is running..."
sleep 5
pm2 logs cryptorafts --lines 20 --nostream

echo ""
echo "🧪 STEP 13: Test app..."
curl -s http://localhost:3000 | head -n 5 || echo "❌ App not responding!"

echo ""
echo "✅ DEPLOYMENT COMPLETE!"
echo "🌐 Visit: https://www.cryptorafts.com"
"@

Write-Host "`n📋 Deployment Commands Ready!`n" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host $deployCommands -ForegroundColor White
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan

Write-Host "`n📝 Saving commands to file..." -ForegroundColor Yellow
$deployCommands | Out-File -FilePath "DEPLOY_COMMANDS.sh" -Encoding UTF8
Write-Host "✅ Saved to: DEPLOY_COMMANDS.sh`n" -ForegroundColor Green

Write-Host "`n📋 NEXT STEPS:`n" -ForegroundColor Cyan
Write-Host "1. Wake up VPS if sleeping (press 'Wake Server' in browser)" -ForegroundColor Yellow
Write-Host "2. Connect via SSH:" -ForegroundColor Yellow
Write-Host "   ssh -p $SSH_PORT $SSH_USER@$VPS_IP" -ForegroundColor White
Write-Host "3. Copy and paste DEPLOY_COMMANDS.sh contents" -ForegroundColor Yellow
Write-Host "   OR run: bash <(cat DEPLOY_COMMANDS.sh)" -ForegroundColor White
Write-Host "4. Wait for deployment to complete (10-15 minutes)" -ForegroundColor Yellow
Write-Host "5. Visit: https://www.cryptorafts.com`n" -ForegroundColor Yellow

Write-Host "`n💡 TIP: You can also upload DEPLOY_COMMANDS.sh to VPS and run it:`n" -ForegroundColor Cyan
Write-Host "   scp -P $SSH_PORT DEPLOY_COMMANDS.sh $SSH_USER@$VPS_IP:/tmp/" -ForegroundColor White
Write-Host "   ssh -p $SSH_PORT $SSH_USER@$VPS_IP 'bash /tmp/DEPLOY_COMMANDS.sh'`n" -ForegroundColor White

