# CRYPTORAFTS - PREMIUM HOSTING DEPLOYMENT
# This creates a basic static version for Hostinger Premium

Write-Host "🚀 Creating static build for Hostinger Premium..." -ForegroundColor Cyan

# 1. Backup original config
Write-Host "📦 Backing up config..." -ForegroundColor Yellow
if (Test-Path "next.config.js") {
    Copy-Item "next.config.js" "next.config.original.bak" -Force
}

# 2. Create simple static config
Write-Host "⚙️ Creating static export config..." -ForegroundColor Yellow
$config = @"
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  trailingSlash: true,
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  reactStrictMode: false,
};
module.exports = nextConfig;
"@
Set-Content -Path "next.config.js" -Value $config

# 3. Clean build
Write-Host "🧹 Cleaning old builds..." -ForegroundColor Yellow
Remove-Item -Recurse -Force .next, out -ErrorAction SilentlyContinue

# 4. Build
Write-Host "🔨 Building static site..." -ForegroundColor Yellow
npm run build

# 5. Create .htaccess
if (Test-Path "out") {
    Write-Host "✅ Build successful!" -ForegroundColor Green
    Write-Host "📝 Creating .htaccess..." -ForegroundColor Yellow
    
    $htaccess = @"
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
"@
    Set-Content -Path "out\.htaccess" -Value $htaccess
    
    Write-Host ""
    Write-Host "🎉 READY TO UPLOAD!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📁 Files to upload: out\" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "NEXT STEPS:" -ForegroundColor Yellow
    Write-Host "1. Login to hPanel: https://hpanel.hostinger.com" -ForegroundColor White
    Write-Host "2. File Manager → public_html" -ForegroundColor White
    Write-Host "3. Upload ALL files from 'out' folder" -ForegroundColor White
    Write-Host "4. Visit: https://cryptorafts.com" -ForegroundColor White
    Write-Host ""
    
    explorer out
} else {
    Write-Host "❌ Build failed!" -ForegroundColor Red
}

# Restore original config
if (Test-Path "next.config.original.bak") {
    Copy-Item "next.config.original.bak" "next.config.js" -Force
    Write-Host "✅ Original config restored" -ForegroundColor Green
}

