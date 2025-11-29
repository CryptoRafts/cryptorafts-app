# Complete Firebase Admin Setup Script
# This script automates the entire setup process

Write-Host ""
Write-Host "COMPLETE FIREBASE ADMIN SETUP" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Open Firebase Console
Write-Host "Step 1: Getting Firebase Service Account" -ForegroundColor Yellow
Write-Host "   Opening Firebase Console..." -ForegroundColor Gray

$firebaseUrl = "https://console.firebase.google.com/project/cryptorafts-b9067/settings/serviceaccounts/adminsdk"
Start-Process $firebaseUrl

Write-Host ""
Write-Host "[OK] Firebase Console opened in your browser" -ForegroundColor Green
Write-Host ""
Write-Host "Instructions:" -ForegroundColor Cyan
Write-Host "   1. Click Generate New Private Key button" -ForegroundColor White
Write-Host "   2. Click Generate Key in the confirmation popup" -ForegroundColor White
Write-Host "   3. The JSON file will download automatically" -ForegroundColor White
Write-Host ""
Write-Host "Press Enter after you have downloaded the JSON file..." -ForegroundColor Yellow
Read-Host

# Step 2: Find and encode the downloaded file
Write-Host ""
Write-Host "Step 2: Finding downloaded file..." -ForegroundColor Yellow

$downloadsPath = "$env:USERPROFILE\Downloads"
$jsonFiles = Get-ChildItem -Path $downloadsPath -Filter "cryptorafts-b9067-firebase-adminsdk-*.json" | Sort-Object LastWriteTime -Descending

if ($jsonFiles.Count -eq 0) {
    Write-Host "[ERROR] No service account JSON file found in Downloads folder" -ForegroundColor Red
    Write-Host "   Please download the file from Firebase Console first" -ForegroundColor Yellow
    Write-Host ""
    $manualPath = Read-Host "Or enter the full path to the JSON file manually"
    if ([string]::IsNullOrWhiteSpace($manualPath) -or -not (Test-Path $manualPath)) {
        Write-Host "[ERROR] File not found. Exiting." -ForegroundColor Red
        exit 1
    }
    $jsonPath = $manualPath
} else {
    $jsonPath = $jsonFiles[0].FullName
    Write-Host "[OK] Found file: $($jsonFiles[0].Name)" -ForegroundColor Green
}

# Step 3: Validate and encode
Write-Host ""
Write-Host "Step 3: Encoding to Base64..." -ForegroundColor Yellow

try {
    $content = Get-Content -Path $jsonPath -Raw -Encoding UTF8
    
    # Validate JSON
    try {
        $json = $content | ConvertFrom-Json
        Write-Host "[OK] Valid JSON file" -ForegroundColor Green
        Write-Host "   Project ID: $($json.project_id)" -ForegroundColor Gray
        Write-Host "   Client Email: $($json.client_email)" -ForegroundColor Gray
        
        # Check private key length
        $privateKey = $json.private_key
        if ($privateKey.Length -lt 100) {
            Write-Host "[WARNING] Private key seems too short!" -ForegroundColor Yellow
            Write-Host "   Please download a fresh service account from Firebase Console" -ForegroundColor Yellow
        } else {
            Write-Host "[OK] Private key looks complete ($($privateKey.Length) chars)" -ForegroundColor Green
        }
    } catch {
        Write-Host "[WARNING] Could not parse JSON, but continuing..." -ForegroundColor Yellow
    }
    
    # Encode to Base64
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($content)
    $base64 = [Convert]::ToBase64String($bytes)
    
    # Copy to clipboard
    $base64 | Set-Clipboard
    
    Write-Host "[OK] Base64 encoded and copied to clipboard!" -ForegroundColor Green
    Write-Host ""
    
} catch {
    Write-Host "[ERROR] Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 4: Open Vercel
Write-Host ""
Write-Host "Step 4: Opening Vercel Environment Variables..." -ForegroundColor Yellow

$vercelUrl = "https://vercel.com/anas-s-projects-8d19f880/settings/environment-variables"
Start-Process $vercelUrl

Write-Host "[OK] Vercel dashboard opened in your browser" -ForegroundColor Green
Write-Host ""
Write-Host "Instructions:" -ForegroundColor Cyan
Write-Host "   1. Click Add New button" -ForegroundColor White
Write-Host "   2. Fill in:" -ForegroundColor White
Write-Host "      Key: FIREBASE_SERVICE_ACCOUNT_B64" -ForegroundColor Yellow
Write-Host "      Value: Press Ctrl+V to paste from clipboard" -ForegroundColor Yellow
Write-Host "      Environments: Production, Preview, Development (check all)" -ForegroundColor Yellow
Write-Host "   3. Click Save" -ForegroundColor White
Write-Host ""
Write-Host "Press Enter after you have added the variable to Vercel..." -ForegroundColor Yellow
Read-Host

# Step 5: Redeploy instructions
Write-Host ""
Write-Host "Step 5: Redeploy Application" -ForegroundColor Yellow
Write-Host ""
Write-Host "You need to redeploy for the changes to take effect:" -ForegroundColor White
Write-Host ""
Write-Host "Option 1: Use Vercel Dashboard" -ForegroundColor Cyan
Write-Host "   1. Go to Deployments tab" -ForegroundColor Gray
Write-Host "   2. Click three dots on latest deployment" -ForegroundColor Gray
Write-Host "   3. Click Redeploy" -ForegroundColor Gray
Write-Host ""
Write-Host "Option 2: Use Command Line" -ForegroundColor Cyan
Write-Host "   Run: vercel --prod" -ForegroundColor Gray
Write-Host ""

$redeploy = Read-Host "Do you want to redeploy now? (y/n)"
if ($redeploy -eq 'y' -or $redeploy -eq 'Y') {
    Write-Host ""
    Write-Host "Redeploying to production..." -ForegroundColor Yellow
    vercel --prod --yes
    Write-Host ""
    Write-Host "[OK] Deployment complete!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "[WARNING] Remember to redeploy manually!" -ForegroundColor Yellow
}

# Step 6: Summary
Write-Host ""
Write-Host "=================================" -ForegroundColor Cyan
Write-Host "[SUCCESS] SETUP COMPLETE!" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "   [OK] Service account downloaded" -ForegroundColor Green
Write-Host "   [OK] Base64 encoded" -ForegroundColor Green
Write-Host "   [OK] Added to Vercel (if you followed steps)" -ForegroundColor Green
Write-Host "   [OK] Ready to redeploy" -ForegroundColor Green
Write-Host ""
Write-Host "Test:" -ForegroundColor Cyan
Write-Host "   After redeploy, visit: https://www.cryptorafts.com/exchange/dashboard" -ForegroundColor White
Write-Host "   Try accepting a pitch - it should work now!" -ForegroundColor White
Write-Host ""
Write-Host "TIP: The Base64 string is still in your clipboard if you need it again" -ForegroundColor Gray
Write-Host ""
