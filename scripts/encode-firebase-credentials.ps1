# PowerShell script to encode Firebase service account JSON to Base64
# Usage: .\scripts\encode-firebase-credentials.ps1

Write-Host "🔥 Firebase Service Account Base64 Encoder" -ForegroundColor Cyan
Write-Host ""

# Prompt for JSON file path
$jsonPath = Read-Host "Enter the path to your Firebase service account JSON file (or drag and drop the file here)"

# Remove quotes if user dragged and dropped
$jsonPath = $jsonPath -replace '"', ''

# Check if file exists
if (-not (Test-Path $jsonPath)) {
    Write-Host "❌ Error: File not found: $jsonPath" -ForegroundColor Red
    exit 1
}

# Read and encode
try {
    Write-Host "📖 Reading JSON file..." -ForegroundColor Yellow
    $content = Get-Content -Path $jsonPath -Raw -Encoding UTF8
    
    # Validate it's JSON
    try {
        $json = $content | ConvertFrom-Json
        Write-Host "✅ Valid JSON file detected" -ForegroundColor Green
        Write-Host "   Project ID: $($json.project_id)" -ForegroundColor Gray
        Write-Host "   Client Email: $($json.client_email)" -ForegroundColor Gray
    } catch {
        Write-Host "⚠️  Warning: File might not be valid JSON, but continuing..." -ForegroundColor Yellow
    }
    
    Write-Host "🔐 Encoding to Base64..." -ForegroundColor Yellow
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($content)
    $base64 = [Convert]::ToBase64String($bytes)
    
    # Copy to clipboard
    $base64 | Set-Clipboard
    
    Write-Host ""
    Write-Host "✅ SUCCESS! Base64 encoded credentials copied to clipboard!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Next steps:" -ForegroundColor Cyan
    Write-Host "   1. Go to Vercel Dashboard" -ForegroundColor White
    Write-Host "   2. Navigate to: Settings → Environment Variables" -ForegroundColor White
    Write-Host "   3. Add new variable:" -ForegroundColor White
    Write-Host "      Key: FIREBASE_SERVICE_ACCOUNT_B64" -ForegroundColor Yellow
    Write-Host "      Value: (paste from clipboard - Ctrl+V)" -ForegroundColor Yellow
    Write-Host "   4. Select all environments (Production, Preview, Development)" -ForegroundColor White
    Write-Host "   5. Save and redeploy" -ForegroundColor White
    Write-Host ""
    Write-Host "💡 Tip: The Base64 string is in your clipboard, just paste it in Vercel!" -ForegroundColor Cyan
    
    # Optionally save to file
    $saveToFile = Read-Host "Save Base64 to file? (y/n)"
    if ($saveToFile -eq 'y' -or $saveToFile -eq 'Y') {
        $outputPath = Join-Path (Split-Path $jsonPath) "firebase-credentials-base64.txt"
        $base64 | Out-File -FilePath $outputPath -Encoding UTF8
        Write-Host "✅ Saved to: $outputPath" -ForegroundColor Green
        Write-Host "⚠️  Remember to delete this file after adding to Vercel!" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

