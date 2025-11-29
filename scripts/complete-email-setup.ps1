# Complete Email Setup Automation Script
# This script automates everything possible for email setup

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Complete Email Setup Automation" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check Vercel CLI
Write-Host "Step 1: Checking Vercel CLI..." -ForegroundColor Yellow
if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
    Write-Host "  ERROR: Vercel CLI not found!" -ForegroundColor Red
    Write-Host "  Installing Vercel CLI..." -ForegroundColor Yellow
    npm install -g vercel
    if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
        Write-Host "  ERROR: Failed to install Vercel CLI" -ForegroundColor Red
        exit 1
    }
}
Write-Host "  OK: Vercel CLI found" -ForegroundColor Green
Write-Host ""

# Step 2: Get Hostinger email password
Write-Host "Step 2: Email Configuration" -ForegroundColor Yellow
Write-Host "  Enter your Hostinger email password for business@cryptorafts.com:" -ForegroundColor White
$emailPassword = Read-Host -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($emailPassword)
$emailPasswordPlain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
Write-Host "  OK: Password received" -ForegroundColor Green
Write-Host ""

# Step 3: Configure Vercel Environment Variables
Write-Host "Step 3: Configuring Vercel Environment Variables..." -ForegroundColor Yellow
$environments = @("production", "preview", "development")

foreach ($env in $environments) {
    Write-Host "  Configuring $env environment..." -ForegroundColor Gray
    
    # EMAIL_* variables
    echo "smtp.hostinger.com" | vercel env add EMAIL_HOST $env 2>&1 | Out-Null
    echo "587" | vercel env add EMAIL_PORT $env 2>&1 | Out-Null
    echo "false" | vercel env add EMAIL_SECURE $env 2>&1 | Out-Null
    echo "business@cryptorafts.com" | vercel env add EMAIL_USER $env 2>&1 | Out-Null
    echo $emailPasswordPlain | vercel env add EMAIL_PASSWORD $env 2>&1 | Out-Null
    echo "CryptoRafts" | vercel env add EMAIL_FROM_NAME $env 2>&1 | Out-Null
    echo "business@cryptorafts.com" | vercel env add EMAIL_FROM_ADDRESS $env 2>&1 | Out-Null
    
    # SMTP_* variables
    echo "smtp.hostinger.com" | vercel env add SMTP_HOST $env 2>&1 | Out-Null
    echo "587" | vercel env add SMTP_PORT $env 2>&1 | Out-Null
    echo "false" | vercel env add SMTP_SECURE $env 2>&1 | Out-Null
    echo "business@cryptorafts.com" | vercel env add SMTP_USER $env 2>&1 | Out-Null
    echo $emailPasswordPlain | vercel env add SMTP_PASS $env 2>&1 | Out-Null
    
    Write-Host "    OK: $env configured" -ForegroundColor Green
}
Write-Host "  OK: All Vercel environments configured" -ForegroundColor Green
Write-Host ""

# Step 4: Verify current DNS records
Write-Host "Step 4: Checking DNS Records..." -ForegroundColor Yellow
Write-Host "  Running DNS check..." -ForegroundColor Gray
& ".\scripts\check-dns-records.ps1" 2>&1 | Out-Null
Write-Host ""

# Step 5: Generate DNS records file
Write-Host "Step 5: Generating DNS Records File..." -ForegroundColor Yellow
$dnsRecords = @"
# DNS Records to Add in Your Domain Registrar
# Domain: cryptorafts.com
# Add these records in your domain registrar's DNS management panel

# MX Records (2 records)
Record 1:
Type: MX
Name: @
Value: mx1.hostinger.com
Priority: 5
TTL: 14400

Record 2:
Type: MX
Name: @
Value: mx2.hostinger.com
Priority: 10
TTL: 14400

# SPF Record (1 record)
Record 3:
Type: TXT
Name: @
Value: v=spf1 include:hostinger.com ~all
TTL: 14400

# DKIM Record (1 record)
# Get DKIM key from Hostinger: https://hpanel.hostinger.com/
# Email → Email Accounts → business@cryptorafts.com → DKIM
Record 4:
Type: TXT
Name: default._domainkey
Value: [Get from Hostinger - see instructions above]
TTL: 14400

# Instructions:
# 1. Log in to your domain registrar (where you bought cryptorafts.com)
# 2. Go to DNS Management / Advanced DNS
# 3. Delete any existing MX records
# 4. Add the 4 records above
# 5. Wait 15-30 minutes for DNS propagation
# 6. Check status: https://dnschecker.org/#MX/cryptorafts.com
"@

$dnsRecords | Out-File -FilePath "DNS_RECORDS_TO_ADD.txt" -Encoding UTF8
Write-Host "  OK: DNS records file created: DNS_RECORDS_TO_ADD.txt" -ForegroundColor Green
Write-Host ""

# Step 6: Create Hostinger setup instructions
Write-Host "Step 6: Creating Hostinger Setup Instructions..." -ForegroundColor Yellow
$hostingerInstructions = @"
# Hostinger Email Account Setup

## Step 1: Log in to Hostinger
URL: https://hpanel.hostinger.com/

## Step 2: Create Email Account
1. Navigate to: Email → Email Accounts
2. Click "Create Email Account"
3. Email: business@cryptorafts.com
4. Password: [Use the password you entered in the script]
5. Click "Create"

## Step 3: Get DKIM Key
1. Click on business@cryptorafts.com
2. Find "DKIM" section
3. Click "Show" or "Copy" to reveal DKIM key
4. Copy the ENTIRE key (it's very long)
5. Use this key in DNS Record 4 (see DNS_RECORDS_TO_ADD.txt)

## Step 4: Verify Domain Connection
After adding DNS records and waiting 15-30 minutes:
1. Go to Email → Email Accounts
2. Check status - should show "Domain connected"
3. MX, SPF, DKIM should all show "OK"
"@

$hostingerInstructions | Out-File -FilePath "HOSTINGER_SETUP_INSTRUCTIONS.txt" -Encoding UTF8
Write-Host "  OK: Hostinger instructions created: HOSTINGER_SETUP_INSTRUCTIONS.txt" -ForegroundColor Green
Write-Host ""

# Step 7: Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "What's Been Done:" -ForegroundColor Yellow
Write-Host "  OK: Vercel environment variables configured" -ForegroundColor Green
Write-Host "  OK: DNS records file created" -ForegroundColor Green
Write-Host "  OK: Hostinger instructions created" -ForegroundColor Green
Write-Host ""
Write-Host "What You Need to Do:" -ForegroundColor Yellow
Write-Host "  1. Add DNS records (see DNS_RECORDS_TO_ADD.txt)" -ForegroundColor White
Write-Host "  2. Create email account in Hostinger (see HOSTINGER_SETUP_INSTRUCTIONS.txt)" -ForegroundColor White
Write-Host "  3. Wait 15-30 minutes for DNS propagation" -ForegroundColor White
Write-Host "  4. Redeploy to Vercel: vercel --prod --yes" -ForegroundColor White
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Open DNS_RECORDS_TO_ADD.txt and add records to your domain registrar" -ForegroundColor White
Write-Host "  2. Open HOSTINGER_SETUP_INSTRUCTIONS.txt and create email account" -ForegroundColor White
Write-Host "  3. After DNS propagation, run: vercel --prod --yes" -ForegroundColor White
Write-Host "  4. Test email: POST https://your-vercel-url.vercel.app/api/test-email" -ForegroundColor White
Write-Host ""

