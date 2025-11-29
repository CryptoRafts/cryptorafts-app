# ============================================
# DEPLOY COMPLETE BUILD TO VPS
# Uploads all fixes and rebuilds everything
# ============================================

$vpsUser = "root"
$vpsIp = "72.61.98.99"
$vpsPath = "/var/www/cryptorafts"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "DEPLOYING COMPLETE BUILD TO VPS" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$failedFiles = @()

# Function to upload file with retry
function Upload-FileWithRetry {
    param(
        [string]$localPath,
        [string]$remotePath
    )
    
    $maxRetries = 3
    $retryCount = 0
    
    while ($retryCount -lt $maxRetries) {
        scp -o ConnectTimeout=30 -o ServerAliveInterval=60 "$localPath" "${vpsUser}@${vpsIp}:${remotePath}"
        if ($LASTEXITCODE -eq 0) {
            return $true
        }
        $retryCount++
        Write-Host "  Retry $retryCount/$maxRetries..." -ForegroundColor Yellow
        Start-Sleep -Seconds 2
    }
    
    return $false
}

# Step 1: Upload homepage fixes
Write-Host "[1/8] Uploading homepage fixes..." -ForegroundColor Cyan
if (Test-Path "src/app/page.tsx") {
    if (Upload-FileWithRetry "src/app/page.tsx" "${vpsPath}/src/app/page.tsx") {
        Write-Host "  [OK] page.tsx uploaded" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] page.tsx failed" -ForegroundColor Red
        $failedFiles += "src/app/page.tsx"
    }
} else {
    Write-Host "  [WARN] page.tsx not found" -ForegroundColor Yellow
}

if (Test-Path "src/app/globals.css") {
    if (Upload-FileWithRetry "src/app/globals.css" "${vpsPath}/src/app/globals.css") {
        Write-Host "  [OK] globals.css uploaded" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] globals.css failed" -ForegroundColor Red
        $failedFiles += "src/app/globals.css"
    }
} else {
    Write-Host "  [WARN] globals.css not found" -ForegroundColor Yellow
}
Write-Host ""

# Step 2: Upload loading screen fixes
Write-Host "[2/8] Uploading loading screen fixes..." -ForegroundColor Cyan
if (Test-Path "src/app/loading.tsx") {
    if (Upload-FileWithRetry "src/app/loading.tsx" "${vpsPath}/src/app/loading.tsx") {
        Write-Host "  [OK] loading.tsx uploaded" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] loading.tsx failed" -ForegroundColor Red
        $failedFiles += "src/app/loading.tsx"
    }
} else {
    Write-Host "  [WARN] loading.tsx not found" -ForegroundColor Yellow
}

if (Test-Path "src/components/LoadingOptimizer.tsx") {
    if (Upload-FileWithRetry "src/components/LoadingOptimizer.tsx" "${vpsPath}/src/components/LoadingOptimizer.tsx") {
        Write-Host "  [OK] LoadingOptimizer.tsx uploaded" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] LoadingOptimizer.tsx failed" -ForegroundColor Red
        $failedFiles += "src/components/LoadingOptimizer.tsx"
    }
} else {
    Write-Host "  [WARN] LoadingOptimizer.tsx not found" -ForegroundColor Yellow
}
Write-Host ""

# Step 3: Upload admin UI fixes
Write-Host "[3/8] Uploading admin UI fixes..." -ForegroundColor Cyan
if (Test-Path "src/app/admin/blog/page.tsx") {
    if (Upload-FileWithRetry "src/app/admin/blog/page.tsx" "${vpsPath}/src/app/admin/blog/page.tsx") {
        Write-Host "  [OK] admin/blog/page.tsx uploaded" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] admin/blog/page.tsx failed" -ForegroundColor Red
        $failedFiles += "src/app/admin/blog/page.tsx"
    }
} else {
    Write-Host "  [WARN] admin/blog/page.tsx not found" -ForegroundColor Yellow
}

if (Test-Path "src/app/admin/blog/new/page.tsx") {
    if (Upload-FileWithRetry "src/app/admin/blog/new/page.tsx" "${vpsPath}/src/app/admin/blog/new/page.tsx") {
        Write-Host "  [OK] admin/blog/new/page.tsx uploaded" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] admin/blog/new/page.tsx failed" -ForegroundColor Red
        $failedFiles += "src/app/admin/blog/new/page.tsx"
    }
} else {
    Write-Host "  [WARN] admin/blog/new/page.tsx not found" -ForegroundColor Yellow
}
Write-Host ""

# Step 4: Upload RSS feed files (if needed)
Write-Host "[4/8] Uploading RSS feed files..." -ForegroundColor Cyan
if (Test-Path "src/app/api/blog/rss/route.ts") {
    if (Upload-FileWithRetry "src/app/api/blog/rss/route.ts" "${vpsPath}/src/app/api/blog/rss/route.ts") {
        Write-Host "  [OK] api/blog/rss/route.ts uploaded" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] api/blog/rss/route.ts failed" -ForegroundColor Red
        $failedFiles += "src/app/api/blog/rss/route.ts"
    }
} else {
    Write-Host "  [WARN] api/blog/rss/route.ts not found" -ForegroundColor Yellow
}

if (Test-Path "src/app/feed.xml/route.ts") {
    if (Upload-FileWithRetry "src/app/feed.xml/route.ts" "${vpsPath}/src/app/feed.xml/route.ts") {
        Write-Host "  [OK] feed.xml/route.ts uploaded" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] feed.xml/route.ts failed" -ForegroundColor Red
        $failedFiles += "src/app/feed.xml/route.ts"
    }
} else {
    Write-Host "  [WARN] feed.xml/route.ts not found" -ForegroundColor Yellow
}
Write-Host ""

# Step 5: Upload config files
Write-Host "[5/8] Uploading config files..." -ForegroundColor Cyan
if (Test-Path "next.config.js") {
    if (Upload-FileWithRetry "next.config.js" "${vpsPath}/next.config.js") {
        Write-Host "  [OK] next.config.js uploaded" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] next.config.js failed" -ForegroundColor Red
        $failedFiles += "next.config.js"
    }
} else {
    Write-Host "  [WARN] next.config.js not found" -ForegroundColor Yellow
}

if (Test-Path "server.js") {
    if (Upload-FileWithRetry "server.js" "${vpsPath}/server.js") {
        Write-Host "  [OK] server.js uploaded" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] server.js failed" -ForegroundColor Red
        $failedFiles += "server.js"
    }
} else {
    Write-Host "  [WARN] server.js not found" -ForegroundColor Yellow
}

if (Test-Path "ecosystem.config.js") {
    if (Upload-FileWithRetry "ecosystem.config.js" "${vpsPath}/ecosystem.config.js") {
        Write-Host "  [OK] ecosystem.config.js uploaded" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] ecosystem.config.js failed" -ForegroundColor Red
        $failedFiles += "ecosystem.config.js"
    }
} else {
    Write-Host "  [WARN] ecosystem.config.js not found" -ForegroundColor Yellow
}
Write-Host ""

# Step 6: Upload middleware and critical fixes
Write-Host "[6/9] Uploading middleware and critical fixes..." -ForegroundColor Cyan
if (Test-Path "src/middleware.ts") {
    if (Upload-FileWithRetry "src/middleware.ts" "${vpsPath}/src/middleware.ts") {
        Write-Host "  [OK] middleware.ts uploaded" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] middleware.ts failed" -ForegroundColor Red
        $failedFiles += "src/middleware.ts"
    }
} else {
    Write-Host "  [WARN] middleware.ts not found" -ForegroundColor Yellow
}

# Upload critical provider fixes
if (Test-Path "src/providers/AuthProvider.tsx") {
    if (Upload-FileWithRetry "src/providers/AuthProvider.tsx" "${vpsPath}/src/providers/AuthProvider.tsx") {
        Write-Host "  [OK] AuthProvider.tsx uploaded" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] AuthProvider.tsx failed" -ForegroundColor Red
        $failedFiles += "src/providers/AuthProvider.tsx"
    }
}

# Upload cache module
if (Test-Path "src/lib/cache/adminCache.ts") {
    if (Upload-FileWithRetry "src/lib/cache/adminCache.ts" "${vpsPath}/src/lib/cache/adminCache.ts") {
        Write-Host "  [OK] adminCache.ts uploaded" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] adminCache.ts failed" -ForegroundColor Red
        $failedFiles += "src/lib/cache/adminCache.ts"
    }
}

# Upload isolation middleware fix
if (Test-Path "src/middleware/isolation-middleware.ts") {
    if (Upload-FileWithRetry "src/middleware/isolation-middleware.ts" "${vpsPath}/src/middleware/isolation-middleware.ts") {
        Write-Host "  [OK] isolation-middleware.ts uploaded" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] isolation-middleware.ts failed" -ForegroundColor Red
        $failedFiles += "src/middleware/isolation-middleware.ts"
    }
}
Write-Host ""

# Step 7: Upload package.json and tsconfig.json
Write-Host "[7/9] Uploading configuration files..." -ForegroundColor Cyan
if (Test-Path "package.json") {
    if (Upload-FileWithRetry "package.json" "${vpsPath}/package.json") {
        Write-Host "  [OK] package.json uploaded" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] package.json failed" -ForegroundColor Red
        $failedFiles += "package.json"
    }
}

if (Test-Path "tsconfig.json") {
    if (Upload-FileWithRetry "tsconfig.json" "${vpsPath}/tsconfig.json") {
        Write-Host "  [OK] tsconfig.json uploaded" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] tsconfig.json failed" -ForegroundColor Red
        $failedFiles += "tsconfig.json"
    }
}
Write-Host ""

# Step 8: Build on VPS
Write-Host "[8/9] Building on VPS..." -ForegroundColor Cyan
Write-Host "  This takes 2-3 minutes..." -ForegroundColor Yellow
ssh -o ConnectTimeout=30 -o ServerAliveInterval=60 "${vpsUser}@${vpsIp}" "cd ${vpsPath}; npm run build"
if ($LASTEXITCODE -ne 0) {
    Write-Host "  [FAIL] Build failed" -ForegroundColor Red
    Write-Host "  Run manually: ssh root@72.61.98.99 'cd /var/www/cryptorafts; npm run build'" -ForegroundColor Yellow
    exit 1
}
Write-Host "  [OK] Build complete" -ForegroundColor Green
Write-Host ""

# Step 9: Restart PM2
Write-Host "[9/9] Restarting PM2..." -ForegroundColor Cyan
ssh -o ConnectTimeout=30 -o ServerAliveInterval=60 "${vpsUser}@${vpsIp}" "cd ${vpsPath}; pm2 restart cryptorafts"
if ($LASTEXITCODE -ne 0) {
    Write-Host "  [FAIL] Restart failed" -ForegroundColor Red
    Write-Host "  Run manually: ssh root@72.61.98.99 'cd /var/www/cryptorafts; pm2 restart cryptorafts'" -ForegroundColor Yellow
    exit 1
}
Write-Host "  [OK] PM2 restarted" -ForegroundColor Green
Write-Host ""

# Summary
Write-Host "==========================================" -ForegroundColor Cyan
if ($failedFiles.Count -eq 0) {
    Write-Host "[OK] DEPLOYMENT COMPLETE!" -ForegroundColor Green
} else {
    Write-Host "[WARN] DEPLOYMENT COMPLETE WITH WARNINGS" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Failed files:" -ForegroundColor Yellow
    foreach ($file in $failedFiles) {
        Write-Host "  [FAIL] $file" -ForegroundColor Red
    }
}
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "What was deployed:" -ForegroundColor Cyan
Write-Host "  [OK] Homepage UI fixes (page.tsx, globals.css)" -ForegroundColor White
Write-Host "  [OK] Loading screen fixes (loading.tsx, LoadingOptimizer.tsx)" -ForegroundColor White
Write-Host "  [OK] Admin UI fixes (admin/blog pages)" -ForegroundColor White
Write-Host "  [OK] RSS feed fixes" -ForegroundColor White
Write-Host "  [OK] Config files (next.config.js, server.js, ecosystem.config.js)" -ForegroundColor White
Write-Host "  [OK] Middleware (middleware.ts, isolation-middleware.ts)" -ForegroundColor White
Write-Host "  [OK] Critical fixes (AuthProvider.tsx, adminCache.ts)" -ForegroundColor White
Write-Host "  [OK] Configuration (package.json, tsconfig.json)" -ForegroundColor White
Write-Host ""
Write-Host "Test your site:" -ForegroundColor Cyan
Write-Host "  https://www.cryptorafts.com" -ForegroundColor White
Write-Host "  https://www.cryptorafts.com/blog" -ForegroundColor White
Write-Host "  https://www.cryptorafts.com/feed.xml" -ForegroundColor White
Write-Host ""
Write-Host "All roles should be working:" -ForegroundColor Cyan
Write-Host "  [OK] Founder - /founder/dashboard" -ForegroundColor White
Write-Host "  [OK] VC - /vc/dashboard" -ForegroundColor White
Write-Host "  [OK] Exchange - /exchange/dashboard" -ForegroundColor White
Write-Host "  [OK] IDO - /ido/dashboard" -ForegroundColor White
Write-Host "  [OK] Influencer - /influencer/dashboard" -ForegroundColor White
Write-Host "  [OK] Agency - /agency/dashboard" -ForegroundColor White
Write-Host "  [OK] Admin - /admin/dashboard" -ForegroundColor White
Write-Host ""

