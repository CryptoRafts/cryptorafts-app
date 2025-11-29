# Comprehensive Email Connection Diagnostic
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "EMAIL CONNECTION DIAGNOSTIC" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check 1: DNS Records
Write-Host "1. Checking DNS Records..." -ForegroundColor Yellow
Write-Host ""

$mxRecords = Resolve-DnsName -Name cryptorafts.com -Type MX -ErrorAction SilentlyContinue
$txtRecords = Resolve-DnsName -Name cryptorafts.com -Type TXT -ErrorAction SilentlyContinue
$dkimRecords = Resolve-DnsName -Name default._domainkey.cryptorafts.com -Type TXT -ErrorAction SilentlyContinue

$mxOk = $false
$spfOk = $false
$dkimOk = $false

# Check MX Records
Write-Host "   MX Records:" -ForegroundColor White
if ($mxRecords) {
    foreach ($record in $mxRecords) {
        Write-Host "     - $($record.NameExchange) (Priority: $($record.Preference))" -ForegroundColor Gray
        if ($record.NameExchange -like "*hostinger.com*") {
            $mxOk = $true
        }
    }
    if (-not $mxOk) {
        Write-Host "     [X] No Hostinger MX records found!" -ForegroundColor Red
        Write-Host "     Expected: mx1.hostinger.com (Priority 5)" -ForegroundColor Yellow
        Write-Host "     Expected: mx2.hostinger.com (Priority 10)" -ForegroundColor Yellow
    } else {
        Write-Host "     [OK] Hostinger MX records found!" -ForegroundColor Green
    }
} else {
    Write-Host "     [X] No MX records found!" -ForegroundColor Red
}

Write-Host ""

# Check SPF Record
Write-Host "   SPF Record:" -ForegroundColor White
if ($txtRecords) {
    $spfFound = $false
    foreach ($record in $txtRecords) {
        if ($record.Strings -like "*spf1*") {
            Write-Host "     - $($record.Strings)" -ForegroundColor Gray
            if ($record.Strings -like "*hostinger.com*") {
                $spfOk = $true
                $spfFound = $true
            }
        }
    }
    if (-not $spfFound) {
        Write-Host "     [X] No SPF record found!" -ForegroundColor Red
        Write-Host "     Expected: v=spf1 include:hostinger.com ~all" -ForegroundColor Yellow
    } elseif (-not $spfOk) {
        Write-Host "     [!] SPF record found but doesn't include Hostinger!" -ForegroundColor Yellow
    } else {
        Write-Host "     [OK] SPF record found and correct!" -ForegroundColor Green
    }
} else {
    Write-Host "     [X] No TXT records found!" -ForegroundColor Red
}

Write-Host ""

# Check DKIM Record
Write-Host "   DKIM Record:" -ForegroundColor White
if ($dkimRecords) {
    foreach ($record in $dkimRecords) {
        if ($record.Strings -like "*DKIM1*") {
            Write-Host "     [OK] DKIM record found!" -ForegroundColor Green
            $dkimOk = $true
            break
        }
    }
    if (-not $dkimOk) {
        Write-Host "     [X] DKIM record not found or invalid!" -ForegroundColor Red
    }
} else {
    Write-Host "     [X] No DKIM record found!" -ForegroundColor Red
    Write-Host "     Expected: default._domainkey TXT record" -ForegroundColor Yellow
}

Write-Host ""

# Check 2: Environment Variables
Write-Host "2. Checking Environment Variables..." -ForegroundColor Yellow
Write-Host ""

$envVars = @(
    "SMTP_HOST",
    "SMTP_PORT",
    "SMTP_USER",
    "SMTP_PASS",
    "EMAIL_HOST",
    "EMAIL_PORT",
    "EMAIL_USER",
    "EMAIL_PASSWORD"
)

$envOk = $true
foreach ($var in $envVars) {
    $value = [Environment]::GetEnvironmentVariable($var, "Process")
    if ($value) {
        if ($var -like "*PASS*" -or $var -like "*PASSWORD*") {
            Write-Host "     [OK] $var = [HIDDEN]" -ForegroundColor Green
        } else {
            Write-Host "     [OK] $var = $value" -ForegroundColor Green
        }
    } else {
        Write-Host "     [!] $var = Not set locally" -ForegroundColor Yellow
        Write-Host "       (Check Vercel environment variables)" -ForegroundColor Gray
    }
}

Write-Host ""

# Check 3: Email Account Status
Write-Host "3. Email Account Status..." -ForegroundColor Yellow
Write-Host ""
Write-Host "   Email: business@cryptorafts.com" -ForegroundColor White
Write-Host "   Status: Check Hostinger Email Accounts" -ForegroundColor Gray
Write-Host "   URL: https://hpanel.hostinger.com/email/accounts" -ForegroundColor Cyan
Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DIAGNOSTIC SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$issues = @()

if (-not $mxOk) {
    $issues += "[X] MX records not configured"
}
if (-not $spfOk) {
    $issues += "[X] SPF record not configured"
}
if (-not $dkimOk) {
    $issues += "[X] DKIM record not configured"
}

if ($issues.Count -eq 0) {
    Write-Host "[OK] All DNS records are configured correctly!" -ForegroundColor Green
    Write-Host ""
    Write-Host "If email still doesn't work:" -ForegroundColor Yellow
    Write-Host "  1. Wait 15-30 minutes for DNS propagation" -ForegroundColor White
    Write-Host "  2. Check Vercel environment variables" -ForegroundColor White
    Write-Host "  3. Verify email account exists in Hostinger" -ForegroundColor White
    Write-Host "  4. Redeploy Vercel: vercel --prod --yes" -ForegroundColor White
} else {
    Write-Host "[X] ISSUES FOUND:" -ForegroundColor Red
    Write-Host ""
    foreach ($issue in $issues) {
        Write-Host "  $issue" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "[FIX] FIX REQUIRED:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  Step 1: Add DNS Records in Hostinger" -ForegroundColor Cyan
    Write-Host "    - Go to: https://hpanel.hostinger.com/" -ForegroundColor White
    Write-Host "    - Navigate: Domains → DNS / Name Servers → DNS Zone Editor" -ForegroundColor White
    Write-Host "    - Open: HOSTINGER_DNS_COPY_PASTE.txt" -ForegroundColor White
    Write-Host "    - Add all 4 records from the file" -ForegroundColor White
    Write-Host ""
    Write-Host "  Step 2: Wait 15-30 minutes for DNS propagation" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  Step 3: Verify DNS records" -ForegroundColor Cyan
    Write-Host "    Run: .\scripts\check-dns-records.ps1" -ForegroundColor White
    Write-Host ""
    Write-Host "  Step 4: Check Hostinger Email Status" -ForegroundColor Cyan
    Write-Host "    - Go to: https://hpanel.hostinger.com/email/accounts" -ForegroundColor White
    Write-Host "    - Verify: business@cryptorafts.com exists" -ForegroundColor White
    Write-Host "    - Check: Domain should show 'Connected'" -ForegroundColor White
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

