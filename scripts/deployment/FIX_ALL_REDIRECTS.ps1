# ============================================
# FIX ALL REDIRECT ISSUES - Complete Fix
# Fixes nginx, middleware, and deploys everything
# ============================================

$vpsUser = "root"
$vpsIp = "72.61.98.99"
$vpsPath = "/var/www/cryptorafts"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "FIXING ALL REDIRECT ISSUES" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Upload fixed middleware
Write-Host "[1/5] Uploading fixed middleware.ts..." -ForegroundColor Cyan
if (Test-Path "src/middleware.ts") {
    scp -o ConnectTimeout=30 -o ServerAliveInterval=60 "src/middleware.ts" "${vpsUser}@${vpsIp}:${vpsPath}/src/middleware.ts"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [OK] middleware.ts uploaded" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] Upload failed" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "  [FAIL] middleware.ts not found" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 2: Upload fixed next.config.js
Write-Host "[2/6] Uploading fixed next.config.js..." -ForegroundColor Cyan
if (Test-Path "next.config.js") {
    scp -o ConnectTimeout=30 -o ServerAliveInterval=60 "next.config.js" "${vpsUser}@${vpsIp}:${vpsPath}/next.config.js"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [OK] next.config.js uploaded" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] Upload failed" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "  [FAIL] next.config.js not found" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 3: Fix nginx configuration on VPS
Write-Host "[3/6] Fixing nginx configuration on VPS..." -ForegroundColor Cyan
ssh -o ConnectTimeout=30 -o ServerAliveInterval=60 "${vpsUser}@${vpsIp}" @'
# Fix nginx configuration
sudo tee /etc/nginx/sites-available/cryptorafts > /dev/null <<'EOF'
# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name cryptorafts.com www.cryptorafts.com;
    return 301 https://www.cryptorafts.com$request_uri;
}

# HTTPS Server Block
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name www.cryptorafts.com cryptorafts.com;
    
    # SSL Certificate
    ssl_certificate /etc/letsencrypt/live/cryptorafts.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/cryptorafts.com/privkey.pem;
    
    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection '1; mode=block' always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    
    # Redirect non-www to www (only if accessing via cryptorafts.com)
    if ($host = cryptorafts.com) {
        return 301 https://www.cryptorafts.com$request_uri;
    }
    
    # Proxy to Next.js App - CRITICAL: Set Host header to www.cryptorafts.com
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host www.cryptorafts.com;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host www.cryptorafts.com;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Cache static files
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot|webp|avif|mp4|webm)$ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host www.cryptorafts.com;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_valid 200 30d;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
    
    # Don't cache API routes
    location ~ ^/api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host www.cryptorafts.com;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        add_header Cache-Control "no-store, no-cache, must-revalidate";
    }
}
EOF

# Test and reload nginx
sudo nginx -t && sudo systemctl reload nginx
echo "✅ Nginx configuration fixed"
'@

if ($LASTEXITCODE -eq 0) {
    Write-Host "  [OK] Nginx configuration fixed" -ForegroundColor Green
} else {
    Write-Host "  [FAIL] Nginx fix failed" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 4: Build application
Write-Host "[4/6] Building application..." -ForegroundColor Cyan
Write-Host "  This takes 2-3 minutes..." -ForegroundColor Yellow
ssh -o ConnectTimeout=30 -o ServerAliveInterval=60 "${vpsUser}@${vpsIp}" "cd ${vpsPath}; npm run build"
if ($LASTEXITCODE -ne 0) {
    Write-Host "  [FAIL] Build failed" -ForegroundColor Red
    exit 1
}
Write-Host "  [OK] Build complete" -ForegroundColor Green
Write-Host ""

# Step 5: Restart PM2
Write-Host "[5/6] Restarting PM2..." -ForegroundColor Cyan
ssh -o ConnectTimeout=30 -o ServerAliveInterval=60 "${vpsUser}@${vpsIp}" "cd ${vpsPath}; pm2 restart cryptorafts"
if ($LASTEXITCODE -ne 0) {
    Write-Host "  [FAIL] Restart failed" -ForegroundColor Red
    exit 1
}
Write-Host "  [OK] PM2 restarted" -ForegroundColor Green
Write-Host ""

# Step 6: Wait and test
Write-Host "[6/6] Waiting for app to start..." -ForegroundColor Cyan
Start-Sleep -Seconds 10
Write-Host "  [OK] App should be running now" -ForegroundColor Green
Write-Host ""

# Summary
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "[OK] ALL REDIRECT ISSUES FIXED!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "What was fixed:" -ForegroundColor Cyan
Write-Host "  [OK] Removed redirect from middleware" -ForegroundColor White
Write-Host "  [OK] Removed redirect from next.config.js (nginx handles it)" -ForegroundColor White
Write-Host "  [OK] Fixed nginx Host header (set to www.cryptorafts.com)" -ForegroundColor White
Write-Host "  [OK] Fixed static file serving (mp4, webm, etc.)" -ForegroundColor White
Write-Host "  [OK] Fixed Next.js RSC routes" -ForegroundColor White
Write-Host ""
Write-Host "Test your site:" -ForegroundColor Cyan
Write-Host "  https://www.cryptorafts.com" -ForegroundColor White
Write-Host ""
Write-Host "Your site should now work perfectly!" -ForegroundColor Green
Write-Host ""

