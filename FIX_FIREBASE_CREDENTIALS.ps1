# PowerShell Script to Fix Firebase Credentials
# Run this script to automatically configure Firebase and deploy

Write-Host "`n🔑 FIREBASE CREDENTIALS FIX SCRIPT" -ForegroundColor Cyan
Write-Host "====================================`n" -ForegroundColor Cyan

# Step 1: Check current file
Write-Host "📋 Step 1: Checking current service account file..." -ForegroundColor Yellow
$currentFile = "secrets\service-account.json"

if (Test-Path $currentFile) {
    $json = Get-Content $currentFile -Raw | ConvertFrom-Json
    $keyLength = $json.private_key.Length
    Write-Host "   Current private key length: $keyLength" -ForegroundColor White
    
    if ($keyLength -lt 100) {
        Write-Host "   ❌ This is a TEMPLATE file with placeholder values!" -ForegroundColor Red
        Write-Host "`n🚨 YOU NEED TO DOWNLOAD REAL CREDENTIALS FROM FIREBASE!" -ForegroundColor Red
        Write-Host "`n📖 Follow these steps:" -ForegroundColor Yellow
        Write-Host "   1. Visit: https://console.firebase.google.com/project/cryptorafts-b9067/settings/serviceaccounts/adminsdk" -ForegroundColor White
        Write-Host "   2. Click 'Generate new private key' button" -ForegroundColor White
        Write-Host "   3. Click 'Generate key' in the popup" -ForegroundColor White
        Write-Host "   4. File will download: cryptorafts-b9067-firebase-adminsdk-*.json" -ForegroundColor White
        Write-Host "   5. Move it to: C:\Users\dell\cryptorafts-starter\secrets\service-account.json" -ForegroundColor White
        Write-Host "   6. Run this script again`n" -ForegroundColor White
        
        Write-Host "🔗 Direct link to open in browser:" -ForegroundColor Cyan
        Write-Host "   https://console.firebase.google.com/project/cryptorafts-b9067/settings/serviceaccounts/adminsdk`n" -ForegroundColor Green
        
        # Try to open in browser
        $openBrowser = Read-Host "Open Firebase Console in browser now? (y/n)"
        if ($openBrowser -eq 'y') {
            Start-Process "https://console.firebase.google.com/project/cryptorafts-b9067/settings/serviceaccounts/adminsdk"
            Write-Host "`n✅ Browser opened! Generate the key, download it, then run this script again." -ForegroundColor Green
        }
        
        exit
    } else {
        Write-Host "   ✅ File looks valid (key length: $keyLength)" -ForegroundColor Green
    }
} else {
    Write-Host "   ❌ Service account file not found at: $currentFile" -ForegroundColor Red
    Write-Host "   Please download from Firebase Console first!" -ForegroundColor Red
    exit
}

# Step 2: Encode to Base64
Write-Host "`n📦 Step 2: Encoding service account to Base64..." -ForegroundColor Yellow
$content = Get-Content $currentFile -Raw
$bytes = [System.Text.Encoding]::UTF8.GetBytes($content)
$base64 = [Convert]::ToBase64String($bytes)
Write-Host "   ✅ Encoded successfully (length: $($base64.Length))" -ForegroundColor Green

# Step 3: Check if env var already exists
Write-Host "`n🔍 Step 3: Checking Vercel environment variables..." -ForegroundColor Yellow
$envList = vercel env ls 2>&1 | Out-String

if ($envList -match "FIREBASE_SERVICE_ACCOUNT_B64") {
    Write-Host "   ⚠️  Variable already exists. Removing old one..." -ForegroundColor Yellow
    Write-Output "y" | vercel env rm FIREBASE_SERVICE_ACCOUNT_B64 production
    Write-Host "   ✅ Old variable removed" -ForegroundColor Green
}

# Step 4: Add new environment variable
Write-Host "`n⬆️  Step 4: Uploading credentials to Vercel..." -ForegroundColor Yellow
Write-Output $base64 | vercel env add FIREBASE_SERVICE_ACCOUNT_B64 production
Write-Host "   ✅ Credentials uploaded to Vercel!" -ForegroundColor Green

# Step 5: Deploy
Write-Host "`n🚀 Step 5: Deploying to production..." -ForegroundColor Yellow
vercel --prod

Write-Host "`n✅ DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "====================================`n" -ForegroundColor Cyan

Write-Host "🧪 NEXT STEPS:" -ForegroundColor Cyan
Write-Host "   1. Open Incognito mode (Ctrl+Shift+N)" -ForegroundColor White
Write-Host "   2. Visit: https://www.cryptorafts.com" -ForegroundColor White
Write-Host "   3. Login as VC: vc@gmail.com" -ForegroundColor White
Write-Host "   4. Accept a pitch" -ForegroundColor White
Write-Host "   5. Watch chat creation SUCCESS! 🎉`n" -ForegroundColor White

Write-Host "📊 Look for these console logs:" -ForegroundColor Cyan
Write-Host "   ✅ [VC-DASHBOARD] Using API route..." -ForegroundColor Green
Write-Host "   ✅ [VC-DASHBOARD] Project accepted!" -ForegroundColor Green
Write-Host "   🚀 [VC-DASHBOARD] Redirecting to chat..." -ForegroundColor Green
Write-Host "   ✅ Chat opens automatically!`n" -ForegroundColor Green

Write-Host "🎊 Everything should work now!" -ForegroundColor Green

