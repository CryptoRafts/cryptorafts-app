# Automated Deployment Script for Blog Automation Pipeline
# This script sets up everything automatically

param(
    [switch]$SkipBuild = $false,
    [switch]$SkipDeploy = $false,
    [string]$DeployTarget = "vercel"  # vercel, vps, or both
)

Write-Host "🚀 Starting Automated Deployment..." -ForegroundColor Cyan
Write-Host ""

# Check if .env.local exists
if (-not (Test-Path ".env.local")) {
    Write-Host "✅ Creating .env.local from template..." -ForegroundColor Green
    Copy-Item ".env.example" ".env.local" -ErrorAction SilentlyContinue
    
    if (-not (Test-Path ".env.local")) {
        Write-Host "⚠️  .env.example not found, creating .env.local with defaults..." -ForegroundColor Yellow
        $envContent = @"
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAolg0vzhqmChXs2NTlPu3SQ1zoq3Rigo4
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=cryptorafts.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=cryptorafts
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=cryptorafts.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1090891318609
NEXT_PUBLIC_FIREBASE_APP_ID=1:1090891318609:web:c9d38e5f24f8c407d53f70
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-323KT2S14X
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://cryptorafts-default-rtdb.firebaseio.com

# App Configuration
NEXT_PUBLIC_APP_URL=https://www.cryptorafts.com
NEXT_PUBLIC_BASE_URL=https://www.cryptorafts.com
NODE_ENV=production

# Admin Configuration
ADMIN_EMAIL=anasshamsiggc@gmail.com
SUPER_ADMIN_EMAIL=anasshamsiggc@gmail.com

# Blog Automation
OPENAI_API_KEY=sk-proj-YOUR_OPENAI_API_KEY_HERE
N8N_WEBHOOK_URL=https://cryptorafts.app.n8n.cloud/webhook/cryptorafts-publish
DEFAULT_PUBLISH_MODE=false

# Telegram Bot
TELEGRAM_BOT_TOKEN=YOUR_TELEGRAM_BOT_TOKEN_HERE
TELEGRAM_CHAT_ID=YOUR_TELEGRAM_CHAT_ID_HERE

# Firebase Admin
FIREBASE_SERVICE_ACCOUNT_B64=YOUR_SERVICE_ACCOUNT_B64_HERE
"@
        $envContent | Out-File -FilePath ".env.local" -Encoding UTF8
    }
    Write-Host "✅ .env.local created. Please add your API keys!" -ForegroundColor Green
}

# Check Node.js
Write-Host "🔍 Checking Node.js..." -ForegroundColor Cyan
$nodeVersion = node --version 2>$null
if ($nodeVersion) {
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Node.js not found. Please install Node.js 18+ first." -ForegroundColor Red
    exit 1
}

# Install dependencies
Write-Host ""
Write-Host "📦 Installing dependencies..." -ForegroundColor Cyan
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Dependencies installed" -ForegroundColor Green

# Build project
if (-not $SkipBuild) {
    Write-Host ""
    Write-Host "🔨 Building project..." -ForegroundColor Cyan
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Build failed" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Build successful" -ForegroundColor Green
}

# Deploy to Vercel
if ($DeployTarget -eq "vercel" -or $DeployTarget -eq "both") {
    if (-not $SkipDeploy) {
        Write-Host ""
        Write-Host "🚀 Deploying to Vercel..." -ForegroundColor Cyan
        
        # Check if Vercel CLI is installed
        $vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue
        if (-not $vercelInstalled) {
            Write-Host "⚠️  Vercel CLI not found. Installing..." -ForegroundColor Yellow
            npm install -g vercel
        }
        
        Write-Host "📤 Deploying to production..." -ForegroundColor Cyan
        vercel --prod --yes
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Deployed to Vercel successfully!" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Vercel deployment may have issues. Check manually." -ForegroundColor Yellow
        }
    }
}

# Create logs directory
Write-Host ""
Write-Host "📁 Creating logs directory..." -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path "logs" | Out-Null
Write-Host "✅ Logs directory created" -ForegroundColor Green

# Test blog automation
Write-Host ""
Write-Host "🧪 Testing blog automation script..." -ForegroundColor Cyan
Write-Host "   Run: npm run blog:generate" -ForegroundColor Yellow
Write-Host "   Or test: npx tsx scripts/test-blog-automation.ts" -ForegroundColor Yellow

Write-Host ""
Write-Host "✅ Deployment setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Add your API keys to .env.local:" -ForegroundColor White
Write-Host "      - OPENAI_API_KEY" -ForegroundColor Gray
Write-Host "      - N8N_WEBHOOK_URL" -ForegroundColor Gray
Write-Host "      - TELEGRAM_BOT_TOKEN (optional)" -ForegroundColor Gray
Write-Host "      - FIREBASE_SERVICE_ACCOUNT_B64" -ForegroundColor Gray
Write-Host "   2. Test blog generation: npm run blog:generate" -ForegroundColor White
Write-Host "   3. Set up n8n workflow (see N8N_WORKFLOW_GUIDE.md)" -ForegroundColor White
Write-Host "   4. Schedule automation (see BLOG_AUTOMATION_SETUP.md)" -ForegroundColor White
Write-Host ""

