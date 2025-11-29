# Trigger Auto Blog Generation via API
# Uses the API endpoint which has access to OpenAI service

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Triggering Auto Blog Generation" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = $env:NEXT_PUBLIC_BASE_URL
if (-not $baseUrl) {
    $baseUrl = "http://localhost:3000"
    Write-Host "Using localhost (set NEXT_PUBLIC_BASE_URL for production)" -ForegroundColor Yellow
}

$apiUrl = "$baseUrl/api/blog/generate-auto"

Write-Host "Calling API: $apiUrl" -ForegroundColor Cyan
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri $apiUrl -Method Post -ContentType "application/json"
    
    Write-Host "✅ Success!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Post Details:" -ForegroundColor Cyan
    Write-Host "  Title: $($response.title)" -ForegroundColor White
    Write-Host "  Status: $($response.status)" -ForegroundColor White
    Write-Host "  Post ID: $($response.postId)" -ForegroundColor White
    Write-Host "  URL: $($response.canonical_url)" -ForegroundColor White
    Write-Host "  Source ID: $($response.sourceId)" -ForegroundColor White
    Write-Host ""
    Write-Host "Cross-Posting:" -ForegroundColor Cyan
    Write-Host "  Telegram: $($response.crossPosted.telegram)" -ForegroundColor $(if ($response.crossPosted.telegram) { "Green" } else { "Gray" })
    Write-Host "  Dev.to: $($response.crossPosted.devto)" -ForegroundColor $(if ($response.crossPosted.devto) { "Green" } else { "Gray" })
    Write-Host "  Blogger: $($response.crossPosted.blogger)" -ForegroundColor $(if ($response.crossPosted.blogger) { "Green" } else { "Gray" })
    Write-Host "  IFTTT: $($response.crossPosted.ifttt)" -ForegroundColor $(if ($response.crossPosted.ifttt) { "Green" } else { "Gray" })
    Write-Host "  n8n: $($response.crossPosted.n8n)" -ForegroundColor $(if ($response.crossPosted.n8n) { "Green" } else { "Gray" })
    
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "  1. Ensure dev server is running: npm run dev" -ForegroundColor Gray
    Write-Host "  2. Check OpenAI API key is configured" -ForegroundColor Gray
    Write-Host "  3. Verify API endpoint is accessible" -ForegroundColor Gray
}

