# ============================================
# TEST RSS FEED FROM WINDOWS
# ============================================

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "TESTING RSS FEED" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Test RSS feed from VPS
Write-Host "[1/3] Testing RSS feed from VPS..." -ForegroundColor Yellow
Write-Host ""
try {
    $response = Invoke-WebRequest -Uri "https://www.cryptorafts.com/feed.xml" -Method Head -UseBasicParsing
    Write-Host "✅ Status Code: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "✅ Content-Type: $($response.Headers['Content-Type'])" -ForegroundColor Green
    
    if ($response.Headers['Content-Type'] -like "*application/rss+xml*") {
        Write-Host "✅ RSS feed is working correctly!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Content-Type might be incorrect" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Make sure the RSS feed is deployed to VPS" -ForegroundColor Yellow
}

Write-Host ""

# Test 2: Get RSS feed content
Write-Host "[2/3] Getting RSS feed content (first 500 chars)..." -ForegroundColor Yellow
Write-Host ""
try {
    $content = Invoke-WebRequest -Uri "https://www.cryptorafts.com/feed.xml" -UseBasicParsing
    $xmlPreview = $content.Content.Substring(0, [Math]::Min(500, $content.Content.Length))
    Write-Host "Preview:" -ForegroundColor Cyan
    Write-Host $xmlPreview -ForegroundColor White
    
    if ($content.Content -like "<?xml*") {
        Write-Host "✅ RSS feed returns valid XML" -ForegroundColor Green
    } else {
        Write-Host "⚠️  RSS feed might not return XML" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 3: Test alternative RSS endpoint
Write-Host "[3/3] Testing alternative RSS endpoint..." -ForegroundColor Yellow
Write-Host ""
try {
    $response = Invoke-WebRequest -Uri "https://www.cryptorafts.com/api/blog/rss" -Method Head -UseBasicParsing
    Write-Host "✅ Alternative endpoint status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "✅ Content-Type: $($response.Headers['Content-Type'])" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Alternative endpoint might not be accessible" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "✅ RSS FEED TEST COMPLETE" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. If RSS feed is working, add to IFTTT:" -ForegroundColor White
Write-Host "   https://www.cryptorafts.com/feed.xml" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. If RSS feed is not working, SSH to VPS and restart:" -ForegroundColor White
Write-Host "   ssh root@72.61.98.99" -ForegroundColor Cyan
Write-Host "   cd /var/www/cryptorafts" -ForegroundColor Cyan
Write-Host "   pm2 restart cryptorafts" -ForegroundColor Cyan
Write-Host ""

