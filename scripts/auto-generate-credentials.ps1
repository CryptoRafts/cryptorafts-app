# Automated Firebase Credentials Generation Script
# This script attempts to get credentials using Firebase CLI

Write-Host ""
Write-Host "AUTOMATED FIREBASE CREDENTIALS SETUP" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Check if Firebase CLI is available
Write-Host "Checking Firebase CLI..." -ForegroundColor Yellow
$firebaseVersion = firebase --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Firebase CLI not found. Please install it first." -ForegroundColor Red
    Write-Host "   Run: npm install -g firebase-tools" -ForegroundColor Yellow
    exit 1
}
Write-Host "[OK] Firebase CLI found: $firebaseVersion" -ForegroundColor Green

# Check if logged in
Write-Host ""
Write-Host "Checking Firebase login status..." -ForegroundColor Yellow
$loginCheck = firebase login:list 2>&1
if ($LASTEXITCODE -ne 0 -or $loginCheck -match "No authorized accounts") {
    Write-Host "[WARNING] Not logged in to Firebase CLI" -ForegroundColor Yellow
    Write-Host "   Attempting to login..." -ForegroundColor Gray
    Write-Host "   (This will open a browser for authentication)" -ForegroundColor Gray
    firebase login --no-localhost
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Firebase login failed" -ForegroundColor Red
        Write-Host "   Please login manually: firebase login" -ForegroundColor Yellow
        exit 1
    }
}
Write-Host "[OK] Firebase CLI authenticated" -ForegroundColor Green

# Set project
Write-Host ""
Write-Host "Setting Firebase project..." -ForegroundColor Yellow
firebase use cryptorafts-b9067
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Failed to set project" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Project set to cryptorafts-b9067" -ForegroundColor Green

# Note: Firebase CLI doesn't have a direct command to generate service accounts
# Service accounts must be created through Firebase Console
Write-Host ""
Write-Host "[INFO] Firebase CLI cannot generate service accounts directly" -ForegroundColor Yellow
Write-Host "   Service accounts must be created through Firebase Console" -ForegroundColor White
Write-Host ""
Write-Host "Opening Firebase Console..." -ForegroundColor Yellow

$firebaseUrl = "https://console.firebase.google.com/project/cryptorafts-b9067/settings/serviceaccounts/adminsdk"
Start-Process $firebaseUrl

Write-Host "[OK] Firebase Console opened" -ForegroundColor Green
Write-Host ""
Write-Host "Please:" -ForegroundColor Cyan
Write-Host "   1. Click 'Generate New Private Key' in the browser" -ForegroundColor White
Write-Host "   2. Download the JSON file" -ForegroundColor White
Write-Host "   3. Press Enter here when done..." -ForegroundColor Yellow
Read-Host

# Find and process the downloaded file
Write-Host ""
Write-Host "Looking for downloaded file..." -ForegroundColor Yellow

$downloadsPath = "$env:USERPROFILE\Downloads"
$jsonFiles = Get-ChildItem -Path $downloadsPath -Filter "cryptorafts-b9067-firebase-adminsdk-*.json" | Sort-Object LastWriteTime -Descending

if ($jsonFiles.Count -eq 0) {
    Write-Host "[ERROR] No service account file found" -ForegroundColor Red
    $manualPath = Read-Host "Enter the full path to the JSON file manually"
    if (-not (Test-Path $manualPath)) {
        Write-Host "[ERROR] File not found. Exiting." -ForegroundColor Red
        exit 1
    }
    $jsonPath = $manualPath
} else {
    $jsonPath = $jsonFiles[0].FullName
    Write-Host "[OK] Found: $($jsonFiles[0].Name)" -ForegroundColor Green
}

# Encode to Base64
Write-Host ""
Write-Host "Encoding to Base64..." -ForegroundColor Yellow
try {
    $content = Get-Content -Path $jsonPath -Raw -Encoding UTF8
    $json = $content | ConvertFrom-Json
    
    Write-Host "[OK] Valid JSON" -ForegroundColor Green
    Write-Host "   Project: $($json.project_id)" -ForegroundColor Gray
    
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($content)
    $base64 = [Convert]::ToBase64String($bytes)
    $base64 | Set-Clipboard
    
    Write-Host "[OK] Base64 encoded and copied to clipboard" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Failed to process file: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Add to Vercel using CLI
Write-Host ""
Write-Host "Adding to Vercel..." -ForegroundColor Yellow

# Check if Vercel CLI is logged in
$vercelWhoami = vercel whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "[WARNING] Not logged in to Vercel CLI" -ForegroundColor Yellow
    Write-Host "   Opening Vercel dashboard instead..." -ForegroundColor Gray
    Start-Process "https://vercel.com/anas-s-projects-8d19f880/settings/environment-variables"
    Write-Host ""
    Write-Host "Please add the variable manually:" -ForegroundColor Cyan
    Write-Host "   Key: FIREBASE_SERVICE_ACCOUNT_B64" -ForegroundColor Yellow
    Write-Host "   Value: (Press Ctrl+V - already in clipboard)" -ForegroundColor Yellow
    Write-Host "   Environments: Production, Preview, Development" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter when done..."
} else {
    Write-Host "[OK] Vercel CLI authenticated" -ForegroundColor Green
    
    # Add to all environments
    Write-Host "   Adding to Production..." -ForegroundColor Gray
    echo $base64 | vercel env add FIREBASE_SERVICE_ACCOUNT_B64 production --yes 2>&1
    
    Write-Host "   Adding to Preview..." -ForegroundColor Gray
    echo $base64 | vercel env add FIREBASE_SERVICE_ACCOUNT_B64 preview --yes 2>&1
    
    Write-Host "   Adding to Development..." -ForegroundColor Gray
    echo $base64 | vercel env add FIREBASE_SERVICE_ACCOUNT_B64 development --yes 2>&1
    
    Write-Host "[OK] Added to all environments" -ForegroundColor Green
}

# Redeploy
Write-Host ""
Write-Host "Redeploying..." -ForegroundColor Yellow
vercel --prod --yes

Write-Host ""
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "[SUCCESS] SETUP COMPLETE!" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Test: https://www.cryptorafts.com/exchange/dashboard" -ForegroundColor Cyan
Write-Host ""

