# Setup script that works with an existing service account JSON file
# Use this if you already have the service account JSON file

Write-Host ""
Write-Host "FIREBASE ADMIN SETUP - Using Existing JSON File" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Get the JSON file path
Write-Host "Step 1: Locate your Firebase Service Account JSON file" -ForegroundColor Yellow
Write-Host ""
Write-Host "If you already downloaded it, provide the path." -ForegroundColor White
Write-Host "If not, download it from:" -ForegroundColor White
Write-Host "  https://console.firebase.google.com/project/cryptorafts-b9067/settings/serviceaccounts/adminsdk" -ForegroundColor Cyan
Write-Host ""

$jsonPath = Read-Host "Enter the full path to your service account JSON file (or drag and drop the file here)"

# Remove quotes if user dragged and dropped
$jsonPath = $jsonPath -replace '"', ''

# Check if file exists
if (-not (Test-Path $jsonPath)) {
    Write-Host "[ERROR] File not found: $jsonPath" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please make sure:" -ForegroundColor Yellow
    Write-Host "  1. You have downloaded the service account JSON from Firebase Console" -ForegroundColor White
    Write-Host "  2. The file path is correct" -ForegroundColor White
    Write-Host "  3. The file exists at that location" -ForegroundColor White
    exit 1
}

Write-Host ""
Write-Host "[OK] File found: $jsonPath" -ForegroundColor Green

# Step 2: Validate and encode
Write-Host ""
Write-Host "Step 2: Validating and encoding..." -ForegroundColor Yellow

try {
    $content = Get-Content -Path $jsonPath -Raw -Encoding UTF8
    
    # Validate JSON
    try {
        $json = $content | ConvertFrom-Json
        Write-Host "[OK] Valid JSON file" -ForegroundColor Green
        Write-Host "   Project ID: $($json.project_id)" -ForegroundColor Gray
        Write-Host "   Client Email: $($json.client_email)" -ForegroundColor Gray
        
        # Check private key
        $privateKey = $json.private_key
        if ($privateKey.Length -lt 100) {
            Write-Host "[WARNING] Private key seems too short ($($privateKey.Length) chars)!" -ForegroundColor Yellow
            Write-Host "   Should be around 1700 characters. Please download a fresh service account." -ForegroundColor Yellow
        } else {
            Write-Host "[OK] Private key looks complete ($($privateKey.Length) chars)" -ForegroundColor Green
        }
    } catch {
        Write-Host "[WARNING] Could not parse JSON, but continuing..." -ForegroundColor Yellow
    }
    
    # Encode to Base64
    Write-Host ""
    Write-Host "Encoding to Base64..." -ForegroundColor Gray
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

# Step 3: Open Vercel
Write-Host "Step 3: Opening Vercel Environment Variables..." -ForegroundColor Yellow

$vercelUrl = "https://vercel.com/anas-s-projects-8d19f880/settings/environment-variables"
Start-Process $vercelUrl

Write-Host "[OK] Vercel dashboard opened in your browser" -ForegroundColor Green
Write-Host ""
Write-Host "Instructions:" -ForegroundColor Cyan
Write-Host "   1. Click 'Add New' button" -ForegroundColor White
Write-Host "   2. Fill in:" -ForegroundColor White
Write-Host "      Key: FIREBASE_SERVICE_ACCOUNT_B64" -ForegroundColor Yellow
Write-Host "      Value: Press Ctrl+V to paste (already in clipboard)" -ForegroundColor Yellow
Write-Host "      Environments: Check Production, Preview, and Development" -ForegroundColor Yellow
Write-Host "   3. Click 'Save'" -ForegroundColor White
Write-Host ""
Write-Host "Press Enter after you have added the variable to Vercel..." -ForegroundColor Yellow
Read-Host

# Step 4: Redeploy
Write-Host ""
Write-Host "Step 4: Redeploy Application" -ForegroundColor Yellow
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
    Write-Host "   Run: vercel --prod" -ForegroundColor Gray
}

Write-Host ""
Write-Host "=================================" -ForegroundColor Cyan
Write-Host "[SUCCESS] SETUP COMPLETE!" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Test your setup:" -ForegroundColor Cyan
Write-Host "   Visit: https://www.cryptorafts.com/exchange/dashboard" -ForegroundColor White
Write-Host "   Try accepting a pitch - it should work now!" -ForegroundColor White
Write-Host ""

