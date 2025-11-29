# Fully Automated Firebase Admin Setup
# This script does everything possible automatically

Write-Host ""
Write-Host "FULLY AUTOMATED FIREBASE ADMIN SETUP" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check Firebase CLI
Write-Host "Step 1: Checking Firebase CLI..." -ForegroundColor Yellow
$firebaseCheck = firebase --version 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Firebase CLI: $firebaseCheck" -ForegroundColor Green
    firebase use cryptorafts-b9067 2>&1 | Out-Null
} else {
    Write-Host "[ERROR] Firebase CLI not found" -ForegroundColor Red
    exit 1
}

# Step 2: Check Vercel CLI
Write-Host ""
Write-Host "Step 2: Checking Vercel CLI..." -ForegroundColor Yellow
$vercelCheck = vercel --version 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Vercel CLI: $vercelCheck" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Vercel CLI not found" -ForegroundColor Red
    exit 1
}

# Step 3: Check if credentials already exist in Vercel
Write-Host ""
Write-Host "Step 3: Checking existing Vercel environment variables..." -ForegroundColor Yellow
$existingVars = vercel env ls 2>&1 | Select-String "FIREBASE_SERVICE_ACCOUNT_B64"
if ($existingVars) {
    Write-Host "[INFO] FIREBASE_SERVICE_ACCOUNT_B64 already exists in Vercel" -ForegroundColor Yellow
    Write-Host "   Checking if it needs to be updated..." -ForegroundColor Gray
    
    $update = Read-Host "Do you want to update it? (y/n)"
    if ($update -ne 'y' -and $update -ne 'Y') {
        Write-Host "[INFO] Skipping - using existing credentials" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Redeploying to ensure credentials are active..." -ForegroundColor Yellow
        vercel --prod --yes
        Write-Host "[OK] Deployment complete!" -ForegroundColor Green
        exit 0
    }
}

# Step 4: Try to find existing service account file
Write-Host ""
Write-Host "Step 4: Looking for existing service account file..." -ForegroundColor Yellow

$possiblePaths = @(
    "$env:USERPROFILE\Downloads\cryptorafts-b9067-firebase-adminsdk-*.json",
    "$env:USERPROFILE\Desktop\cryptorafts-b9067-firebase-adminsdk-*.json",
    ".\secrets\service-account.json",
    ".\service-account.json"
)

$jsonPath = $null
foreach ($path in $possiblePaths) {
    $files = Get-ChildItem -Path $path -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending
    if ($files.Count -gt 0) {
        $jsonPath = $files[0].FullName
        Write-Host "[OK] Found existing file: $jsonPath" -ForegroundColor Green
        break
    }
}

# Step 5: If no file found, guide through download
if (-not $jsonPath) {
    Write-Host "[INFO] No existing service account file found" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Opening Firebase Console to download service account..." -ForegroundColor Yellow
    
    $firebaseUrl = "https://console.firebase.google.com/project/cryptorafts-b9067/settings/serviceaccounts/adminsdk"
    Start-Process $firebaseUrl
    
    Write-Host ""
    Write-Host "Please:" -ForegroundColor Cyan
    Write-Host "   1. Click 'Generate New Private Key'" -ForegroundColor White
    Write-Host "   2. Download the JSON file" -ForegroundColor White
    Write-Host ""
    
    # Wait and check Downloads folder periodically
    Write-Host "Waiting for file download..." -ForegroundColor Gray
    $maxWait = 300 # 5 minutes
    $waited = 0
    $found = $false
    
    while ($waited -lt $maxWait -and -not $found) {
        Start-Sleep -Seconds 5
        $waited += 5
        
        $downloads = Get-ChildItem -Path "$env:USERPROFILE\Downloads" -Filter "cryptorafts-b9067-firebase-adminsdk-*.json" -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending
        if ($downloads.Count -gt 0) {
            # Check if file was modified in last 2 minutes
            $recentFile = $downloads | Where-Object { (Get-Date) - $_.LastWriteTime -lt (New-TimeSpan -Minutes 2) } | Select-Object -First 1
            if ($recentFile) {
                $jsonPath = $recentFile.FullName
                Write-Host "[OK] File detected: $($recentFile.Name)" -ForegroundColor Green
                $found = $true
                break
            }
        }
        
        if ($waited % 30 -eq 0) {
            Write-Host "   Still waiting... ($($waited)s)" -ForegroundColor Gray
        }
    }
    
    if (-not $found) {
        Write-Host "[WARNING] File not detected automatically" -ForegroundColor Yellow
        $manualPath = Read-Host "Enter the full path to the downloaded JSON file"
        if (Test-Path $manualPath) {
            $jsonPath = $manualPath
        } else {
            Write-Host "[ERROR] File not found. Exiting." -ForegroundColor Red
            exit 1
        }
    }
}

# Step 6: Process the file
Write-Host ""
Write-Host "Step 5: Processing service account file..." -ForegroundColor Yellow

try {
    $content = Get-Content -Path $jsonPath -Raw -Encoding UTF8
    $json = $content | ConvertFrom-Json
    
    Write-Host "[OK] Valid JSON file" -ForegroundColor Green
    Write-Host "   Project ID: $($json.project_id)" -ForegroundColor Gray
    Write-Host "   Client Email: $($json.client_email)" -ForegroundColor Gray
    
    # Validate private key
    if ($json.private_key.Length -lt 100) {
        Write-Host "[WARNING] Private key seems incomplete!" -ForegroundColor Yellow
    } else {
        Write-Host "[OK] Private key validated ($($json.private_key.Length) chars)" -ForegroundColor Green
    }
    
    # Encode to Base64
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($content)
    $base64 = [Convert]::ToBase64String($bytes)
    
    Write-Host "[OK] Base64 encoded" -ForegroundColor Green
    
} catch {
    Write-Host "[ERROR] Failed to process file: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 7: Add to Vercel using CLI
Write-Host ""
Write-Host "Step 6: Adding to Vercel environment variables..." -ForegroundColor Yellow

# Check Vercel login
$vercelWhoami = vercel whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "[WARNING] Not logged in to Vercel CLI" -ForegroundColor Yellow
    Write-Host "   Opening Vercel dashboard..." -ForegroundColor Gray
    Start-Process "https://vercel.com/anas-s-projects-8d19f880/settings/environment-variables"
    Write-Host ""
    Write-Host "Please add manually:" -ForegroundColor Cyan
    Write-Host "   Key: FIREBASE_SERVICE_ACCOUNT_B64" -ForegroundColor Yellow
    Write-Host "   Value: (Base64 string will be saved to file)" -ForegroundColor Yellow
    $base64 | Out-File -FilePath "firebase-credentials-base64.txt" -Encoding UTF8 -NoNewline
    Write-Host "[OK] Base64 saved to: firebase-credentials-base64.txt" -ForegroundColor Green
    Write-Host "   Copy the contents and paste into Vercel" -ForegroundColor White
    Read-Host "Press Enter when done..."
} else {
    Write-Host "[OK] Vercel CLI authenticated: $vercelWhoami" -ForegroundColor Green
    
    # Add to all environments
    Write-Host "   Adding to Production..." -ForegroundColor Gray
    $base64 | vercel env add FIREBASE_SERVICE_ACCOUNT_B64 production 2>&1
    
    Write-Host "   Adding to Preview..." -ForegroundColor Gray
    $base64 | vercel env add FIREBASE_SERVICE_ACCOUNT_B64 preview 2>&1
    
    Write-Host "   Adding to Development..." -ForegroundColor Gray
    $base64 | vercel env add FIREBASE_SERVICE_ACCOUNT_B64 development 2>&1
    
    Write-Host "[OK] Added to all environments" -ForegroundColor Green
}

# Step 8: Redeploy
Write-Host ""
Write-Host "Step 7: Redeploying to production..." -ForegroundColor Yellow
vercel --prod --yes

Write-Host ""
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "[SUCCESS] SETUP COMPLETE!" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Test your setup:" -ForegroundColor Cyan
Write-Host "   https://www.cryptorafts.com/exchange/dashboard" -ForegroundColor White
Write-Host ""

