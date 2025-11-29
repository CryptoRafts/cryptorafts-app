# Automated Firebase Admin Credentials Setup Script
# This script helps you set up Firebase Admin credentials for Vercel

Write-Host "🔥 Firebase Admin Credentials Auto-Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if service account file exists locally
$secretsPath = Join-Path $PSScriptRoot "..\secrets\service-account.json"
$secretsPath = Resolve-Path $secretsPath -ErrorAction SilentlyContinue

if ($secretsPath -and (Test-Path $secretsPath)) {
    Write-Host "✅ Found service account file: $secretsPath" -ForegroundColor Green
    $useLocal = Read-Host "Use this file? (y/n)"
    
    if ($useLocal -eq 'y' -or $useLocal -eq 'Y') {
        $jsonPath = $secretsPath
    } else {
        $jsonPath = $null
    }
} else {
    Write-Host "ℹ️  No local service account file found" -ForegroundColor Yellow
    $jsonPath = $null
}

# Step 2: Get service account file
if (-not $jsonPath) {
    Write-Host ""
    Write-Host "📥 Step 1: Download Firebase Service Account" -ForegroundColor Cyan
    Write-Host "   1. Go to: https://console.firebase.google.com/project/cryptorafts-b9067/settings/serviceaccounts/adminsdk" -ForegroundColor White
    Write-Host "   2. Click 'Generate New Private Key'" -ForegroundColor White
    Write-Host "   3. Download the JSON file" -ForegroundColor White
    Write-Host ""
    
    $jsonPath = Read-Host "Enter the path to your downloaded service account JSON file (or press Enter to skip)"
    
    if ([string]::IsNullOrWhiteSpace($jsonPath)) {
        Write-Host "⚠️  Skipping file encoding. You'll need to set up credentials manually in Vercel." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "📋 Manual Setup Steps:" -ForegroundColor Cyan
        Write-Host "   1. Go to: https://vercel.com/anas-s-projects-8d19f880/settings/environment-variables" -ForegroundColor White
        Write-Host "   2. Add variable: FIREBASE_SERVICE_ACCOUNT_B64" -ForegroundColor White
        Write-Host "   3. See VERCEL_FIREBASE_CREDENTIALS_SETUP.md for details" -ForegroundColor White
        exit 0
    }
    
    # Remove quotes if user dragged and dropped
    $jsonPath = $jsonPath -replace '"', ''
}

# Step 3: Validate and encode
if (-not (Test-Path $jsonPath)) {
    Write-Host "❌ Error: File not found: $jsonPath" -ForegroundColor Red
    exit 1
}

try {
    Write-Host ""
    Write-Host "🔍 Validating JSON file..." -ForegroundColor Yellow
    $content = Get-Content -Path $jsonPath -Raw -Encoding UTF8
    
    # Validate JSON
    try {
        $json = $content | ConvertFrom-Json
        Write-Host "✅ Valid JSON file" -ForegroundColor Green
        Write-Host "   Project ID: $($json.project_id)" -ForegroundColor Gray
        Write-Host "   Client Email: $($json.client_email)" -ForegroundColor Gray
        
        # Check if private key is complete
        $privateKey = $json.private_key
        if ($privateKey.Length -lt 100) {
            Write-Host "⚠️  WARNING: Private key seems too short (${privateKey.Length} chars). Should be ~1700 chars." -ForegroundColor Yellow
            Write-Host "   This might be an incomplete key. Please download a new one from Firebase Console." -ForegroundColor Yellow
        } else {
            Write-Host "✅ Private key looks complete (${privateKey.Length} chars)" -ForegroundColor Green
        }
    } catch {
        Write-Host "⚠️  Warning: Could not parse JSON, but continuing..." -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "🔐 Encoding to Base64..." -ForegroundColor Yellow
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($content)
    $base64 = [Convert]::ToBase64String($bytes)
    
    # Copy to clipboard
    $base64 | Set-Clipboard
    
    Write-Host ""
    Write-Host "✅ SUCCESS! Base64 encoded credentials copied to clipboard!" -ForegroundColor Green
    Write-Host ""
    
    # Step 4: Display next steps
    Write-Host "📋 Next Steps:" -ForegroundColor Cyan
    Write-Host "   1. Open Vercel Dashboard:" -ForegroundColor White
    Write-Host "      https://vercel.com/anas-s-projects-8d19f880/settings/environment-variables" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   2. Click 'Add New' button" -ForegroundColor White
    Write-Host ""
    Write-Host "   3. Fill in:" -ForegroundColor White
    Write-Host "      Key: FIREBASE_SERVICE_ACCOUNT_B64" -ForegroundColor Yellow
    Write-Host "      Value: (Press Ctrl+V to paste from clipboard)" -ForegroundColor Yellow
    Write-Host "      Environments: ✅ Production ✅ Preview ✅ Development" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   4. Click 'Save'" -ForegroundColor White
    Write-Host ""
    Write-Host "   5. Redeploy your application:" -ForegroundColor White
    Write-Host "      - Go to Deployments tab" -ForegroundColor Gray
    Write-Host "      - Click ⋯ on latest deployment" -ForegroundColor Gray
    Write-Host "      - Click 'Redeploy'" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   6. Test the exchange accept-pitch functionality!" -ForegroundColor White
    Write-Host ""
    
    # Optionally save to file
    Write-Host "💾 Save Base64 to file? (y/n): " -NoNewline
    $saveToFile = Read-Host
    if ($saveToFile -eq 'y' -or $saveToFile -eq 'Y') {
        $outputPath = Join-Path (Split-Path $jsonPath) "firebase-credentials-base64.txt"
        $base64 | Out-File -FilePath $outputPath -Encoding UTF8 -NoNewline
        Write-Host "✅ Saved to: $outputPath" -ForegroundColor Green
        Write-Host "⚠️  Remember to delete this file after adding to Vercel!" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "🎉 Setup complete! The Base64 string is in your clipboard." -ForegroundColor Green
    Write-Host "   Just paste it into Vercel when prompted." -ForegroundColor Cyan
    
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Stack: $($_.ScriptStackTrace)" -ForegroundColor Gray
    exit 1
}

