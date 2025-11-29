# ============================================
# 🚀 CRYPTORAFTS HOSTINGER DEPLOYMENT SCRIPT
# ============================================

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   🚀 CRYPTORAFTS - HOSTINGER DEPLOYMENT SCRIPT 🚀      ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Function to display step
function Show-Step {
    param([string]$step, [string]$message)
    Write-Host "[$step] $message" -ForegroundColor Yellow
}

# Function to display success
function Show-Success {
    param([string]$message)
    Write-Host "✅ $message" -ForegroundColor Green
}

# Function to display error
function Show-Error {
    param([string]$message)
    Write-Host "❌ $message" -ForegroundColor Red
}

# Function to display info
function Show-Info {
    param([string]$message)
    Write-Host "ℹ️  $message" -ForegroundColor Blue
}

# ============================================
# STEP 1: BACKUP ORIGINAL CONFIG
# ============================================
Show-Step "1/5" "Backing up original next.config.js..."

if (Test-Path "next.config.js") {
    Copy-Item "next.config.js" "next.config.js.backup" -Force
    Show-Success "Backup created: next.config.js.backup"
} else {
    Show-Error "next.config.js not found!"
    exit 1
}

# ============================================
# STEP 2: USE HOSTINGER CONFIG
# ============================================
Show-Step "2/5" "Switching to Hostinger configuration..."

if (Test-Path "next.config.hostinger.js") {
    Copy-Item "next.config.hostinger.js" "next.config.js" -Force
    Show-Success "Using Hostinger-optimized configuration"
} else {
    Show-Error "next.config.hostinger.js not found!"
    exit 1
}

# ============================================
# STEP 3: INSTALL DEPENDENCIES
# ============================================
Show-Step "3/5" "Installing dependencies..."
Write-Host ""

npm install

if ($LASTEXITCODE -eq 0) {
    Show-Success "Dependencies installed successfully"
} else {
    Show-Error "Failed to install dependencies"
    exit 1
}

Write-Host ""

# ============================================
# STEP 4: BUILD FOR PRODUCTION
# ============================================
Show-Step "4/5" "Building CryptoRafts for production..."
Write-Host ""

npm run build

if ($LASTEXITCODE -eq 0) {
    Show-Success "Build completed successfully!"
} else {
    Show-Error "Build failed! Please check errors above."
    # Restore original config
    Copy-Item "next.config.js.backup" "next.config.js" -Force
    exit 1
}

Write-Host ""

# ============================================
# STEP 5: VERIFY OUTPUT
# ============================================
Show-Step "5/5" "Verifying build output..."

if (Test-Path "out") {
    $fileCount = (Get-ChildItem -Path "out" -Recurse -File).Count
    Show-Success "Build successful! Generated $fileCount files in 'out' folder"
    
    # Create .htaccess file
    $htaccessContent = @"
# Force HTTPS
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Handle client-side routing
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME} !-l
  RewriteRule . /index.html [L]
</IfModule>

# Enable Gzip Compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html
  AddOutputFilterByType DEFLATE text/css
  AddOutputFilterByType DEFLATE text/javascript
  AddOutputFilterByType DEFLATE application/javascript
  AddOutputFilterByType DEFLATE application/json
</IfModule>

# Browser Caching
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/webp "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
  ExpiresByType text/javascript "access plus 1 month"
</IfModule>
"@
    
    Set-Content -Path "out\.htaccess" -Value $htaccessContent
    Show-Success "Created .htaccess file with optimizations"
    
} else {
    Show-Error "Output folder 'out' not found!"
    # Restore original config
    Copy-Item "next.config.js.backup" "next.config.js" -Force
    exit 1
}

# ============================================
# DEPLOYMENT COMPLETE - SHOW INSTRUCTIONS
# ============================================
Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║              🎉 BUILD SUCCESSFUL! 🎉                    ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

Show-Info "Your CryptoRafts is ready for Hostinger deployment!"
Write-Host ""

Write-Host "📁 Deployment Files Location:" -ForegroundColor Cyan
Write-Host "   $(Get-Location)\out" -ForegroundColor White
Write-Host ""

Write-Host "📋 NEXT STEPS - UPLOAD TO HOSTINGER:" -ForegroundColor Cyan
Write-Host ""
Write-Host "   1️⃣  Login to Hostinger hPanel" -ForegroundColor Yellow
Write-Host "       🔗 https://hpanel.hostinger.com" -ForegroundColor Blue
Write-Host ""
Write-Host "   2️⃣  Open File Manager" -ForegroundColor Yellow
Write-Host "       📂 Navigate to 'public_html' folder" -ForegroundColor White
Write-Host ""
Write-Host "   3️⃣  Clear existing files" -ForegroundColor Yellow
Write-Host "       🗑️  Delete all files in public_html" -ForegroundColor White
Write-Host ""
Write-Host "   4️⃣  Upload your files" -ForegroundColor Yellow
Write-Host "       📤 Upload ALL files from 'out' folder" -ForegroundColor White
Write-Host "       ⚠️  Include hidden .htaccess file!" -ForegroundColor Red
Write-Host ""
Write-Host "   5️⃣  Setup SSL Certificate" -ForegroundColor Yellow
Write-Host "       🔒 Go to: SSL → Install Free SSL" -ForegroundColor White
Write-Host "       ⏱️  Wait 10-15 minutes for activation" -ForegroundColor White
Write-Host ""
Write-Host "   6️⃣  Configure Firebase" -ForegroundColor Yellow
Write-Host "       🔥 Add your domain to Firebase authorized domains" -ForegroundColor White
Write-Host "       🔗 https://console.firebase.google.com" -ForegroundColor Blue
Write-Host ""
Write-Host "   7️⃣  Test Your Website!" -ForegroundColor Yellow
Write-Host "       🌐 Visit: https://yourdomain.com" -ForegroundColor White
Write-Host ""

Write-Host "PRO TIPS:" -ForegroundColor Magenta
Write-Host "   - The .htaccess file includes performance optimizations" -ForegroundColor White
Write-Host "   - Make sure to upload .htaccess (it's hidden by default)" -ForegroundColor White
Write-Host "   - Clear browser cache if changes don't appear" -ForegroundColor White
Write-Host "   - Enable Cloudflare CDN in hPanel for faster loading" -ForegroundColor White
Write-Host ""

Write-Host "📚 Need Help?" -ForegroundColor Cyan
Write-Host "   📖 Read: HOSTINGER_NEXTJS_DEPLOYMENT.md" -ForegroundColor White
Write-Host "   💬 Hostinger 24/7 Chat: In hPanel (bottom right)" -ForegroundColor White
Write-Host ""

# Ask if user wants to open folder
$openFolder = Read-Host "📂 Open 'out' folder now? (Y/N)"
if ($openFolder -eq "Y" -or $openFolder -eq "y") {
    explorer out
    Show-Success "Opened 'out' folder"
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🎊 Ready to deploy! Good luck with your launch! 🚀" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Restore original config
Show-Info "Restoring original next.config.js..."
Copy-Item "next.config.js.backup" "next.config.js" -Force
Show-Success "Original configuration restored"
Write-Host ""

