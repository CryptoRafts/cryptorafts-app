# Full Automation Runner
# Tests and runs the complete blog automation pipeline

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Full Blog Automation Test" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check OpenAI API key
$envContent = Get-Content ".env.local" -ErrorAction SilentlyContinue | Where-Object { $_ -match '^OPENAI_API_KEY=' }
if ($envContent) {
    $apiKey = ($envContent -split '=')[1]
    if ($apiKey -and $apiKey.Length -gt 20 -and -not $apiKey.Contains('YOUR_')) {
        Write-Host "✅ OpenAI API Key found" -ForegroundColor Green
    } else {
        Write-Host "⚠️  OpenAI API Key appears to be placeholder" -ForegroundColor Yellow
        Write-Host "   Please add your actual API key to .env.local" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  OPENAI_API_KEY not found in .env.local" -ForegroundColor Yellow
}

# Check n8n webhook URL
$n8nUrl = Get-Content ".env.local" -ErrorAction SilentlyContinue | Where-Object { $_ -match '^N8N_WEBHOOK_URL=' }
if ($n8nUrl) {
    Write-Host "✅ n8n Webhook URL configured" -ForegroundColor Green
} else {
    Write-Host "⚠️  N8N_WEBHOOK_URL not found" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Running blog generation..." -ForegroundColor Cyan
Write-Host ""

# Run the automation
npm run blog:generate:auto

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Automation completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Yellow
    Write-Host "  1. Check n8n workflow executions" -ForegroundColor Gray
    Write-Host "  2. Verify post in Firestore" -ForegroundColor Gray
    Write-Host "  3. Check cross-posting platforms" -ForegroundColor Gray
} else {
    Write-Host ""
    Write-Host "❌ Automation failed. Check errors above." -ForegroundColor Red
}

