# PowerShell Script to Setup Firebase Credentials for Vercel
# Run this in PowerShell: .\setup-vercel-firebase.ps1

Write-Host "🔥 Firebase to Vercel Setup Script" -ForegroundColor Cyan
Write-Host "==================================`n" -ForegroundColor Cyan

# Check if service account file exists
$serviceAccountPath = Read-Host "Enter path to your Firebase service account JSON file"

if (-not (Test-Path $serviceAccountPath)) {
    Write-Host "❌ File not found: $serviceAccountPath" -ForegroundColor Red
    Write-Host "`nPlease download it from:" -ForegroundColor Yellow
    Write-Host "https://console.firebase.google.com/project/cryptorafts-b9067/settings/serviceaccounts/adminsdk" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Found service account file`n" -ForegroundColor Green

# Read and convert to Base64
try {
    $json = Get-Content $serviceAccountPath -Raw
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
    $base64 = [Convert]::ToBase64String($bytes)
    
    Write-Host "✅ Converted to Base64" -ForegroundColor Green
    Write-Host "   Length: $($base64.Length) characters`n" -ForegroundColor Gray
    
    # Copy to clipboard
    $base64 | Set-Clipboard
    Write-Host "✅ Copied to clipboard!`n" -ForegroundColor Green
    
    # Save to file for reference
    $base64 | Out-File -FilePath "firebase-credentials-base64.txt" -Encoding utf8
    Write-Host "✅ Saved to: firebase-credentials-base64.txt`n" -ForegroundColor Green
    
    # Display instructions
    Write-Host "📋 Next Steps:" -ForegroundColor Cyan
    Write-Host "==================================`n" -ForegroundColor Cyan
    
    Write-Host "1. Go to Vercel Dashboard:" -ForegroundColor Yellow
    Write-Host "   https://vercel.com/anas-s-projects-8d19f880/cryptorafts-starter/settings/environment-variables`n" -ForegroundColor White
    
    Write-Host "2. Click 'Add New' → 'Environment Variable'`n" -ForegroundColor Yellow
    
    Write-Host "3. Set:" -ForegroundColor Yellow
    Write-Host "   Name: FIREBASE_SERVICE_ACCOUNT_B64" -ForegroundColor White
    Write-Host "   Value: Ctrl+V (paste from clipboard)" -ForegroundColor White
    Write-Host "   Environments: Select ALL (Production, Preview, Development)" -ForegroundColor White
    Write-Host "`n4. Click 'Save'`n" -ForegroundColor Yellow
    
    Write-Host "5. Redeploy:" -ForegroundColor Yellow
    Write-Host "   vercel --prod --yes`n" -ForegroundColor White
    
    Write-Host "✨ The Base64 string is already in your clipboard!" -ForegroundColor Green
    Write-Host "   Just paste it into Vercel!`n" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "Press any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

