# Test IFTTT Webhook Script
# Tests your IFTTT webhook configuration

param(
    [string]$WebhookKey = "",
    [string]$EventName = "blog_post_created"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  IFTTT Webhook Test" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if webhook key provided
if ([string]::IsNullOrEmpty($WebhookKey)) {
    # Try to read from .env.local
    if (Test-Path ".env.local") {
        $envContent = Get-Content ".env.local" -Raw
        if ($envContent -match 'IFTTT_WEBHOOK_KEY=(.+)') {
            $WebhookKey = $matches[1].Trim()
            Write-Host "Found IFTTT_WEBHOOK_KEY in .env.local" -ForegroundColor Green
        }
    }
    
    if ([string]::IsNullOrEmpty($WebhookKey)) {
        Write-Host "Error: IFTTT_WEBHOOK_KEY not found" -ForegroundColor Red
        Write-Host ""
        Write-Host "Usage:" -ForegroundColor Yellow
        Write-Host "  .\scripts\test-ifttt-webhook.ps1 -WebhookKey YOUR_KEY" -ForegroundColor Gray
        Write-Host ""
        Write-Host "Or add IFTTT_WEBHOOK_KEY to .env.local" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host "Event Name: $EventName" -ForegroundColor Cyan
Write-Host "Webhook Key: $($WebhookKey.Substring(0, [Math]::Min(10, $WebhookKey.Length)))..." -ForegroundColor Cyan
Write-Host ""

# Test payload
$testPayload = @{
    value1 = "Test Blog Post Title"
    value2 = "https://www.cryptorafts.com/blog/test-post"
    value3 = "published"
} | ConvertTo-Json

$url = "https://maker.ifttt.com/trigger/$EventName/with/key/$WebhookKey"

Write-Host "Sending test webhook..." -ForegroundColor Yellow
Write-Host "URL: $url" -ForegroundColor Gray
Write-Host "Payload: $testPayload" -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri $url -Method Post -Body $testPayload -ContentType "application/json"
    
    Write-Host "Success! Webhook triggered." -ForegroundColor Green
    Write-Host ""
    Write-Host "Check your IFTTT activity log:" -ForegroundColor Yellow
    Write-Host "  https://ifttt.com/activity" -ForegroundColor Gray
    Write-Host ""
    Write-Host "If your applet didn't trigger, check:" -ForegroundColor Yellow
    Write-Host "  1. Event name matches: $EventName" -ForegroundColor Gray
    Write-Host "  2. Applet is enabled" -ForegroundColor Gray
    Write-Host "  3. Webhook key is correct" -ForegroundColor Gray
    
} catch {
    Write-Host "Error: Failed to trigger webhook" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "  1. Verify webhook key at: https://ifttt.com/maker_webhooks" -ForegroundColor Gray
    Write-Host "  2. Check event name matches your applet" -ForegroundColor Gray
    Write-Host "  3. Ensure applet is enabled" -ForegroundColor Gray
}

