# Check DNS Records for cryptorafts.com
# This script verifies if DNS records are properly configured

Write-Host "Checking DNS Records for cryptorafts.com" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check MX Records
Write-Host "Checking MX Records..." -ForegroundColor Yellow
try {
    $mxResult = Resolve-DnsName -Name cryptorafts.com -Type MX -ErrorAction SilentlyContinue
    if ($mxResult) {
        Write-Host "  MX Records Found:" -ForegroundColor Green
        foreach ($record in $mxResult) {
            $hostinger = $record.NameExchange -like "*hostinger*"
            $status = if ($hostinger) { "OK" } else { "WRONG" }
            $color = if ($hostinger) { "Green" } else { "Red" }
            Write-Host "    $($record.NameExchange) (Priority: $($record.Preference)) - $status" -ForegroundColor $color
        }
        
        $hasHostinger = $mxResult | Where-Object { $_.NameExchange -like "*hostinger*" }
        if (-not $hasHostinger) {
            Write-Host "  WARNING: No Hostinger MX records found!" -ForegroundColor Red
            Write-Host "  Expected: mx1.hostinger.com (Priority 5)" -ForegroundColor Yellow
            Write-Host "  Expected: mx2.hostinger.com (Priority 10)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  ERROR: No MX records found!" -ForegroundColor Red
        Write-Host "  You need to add MX records in your domain registrar" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ERROR: Could not check MX records" -ForegroundColor Red
    Write-Host "  Error: $_" -ForegroundColor Red
}

Write-Host ""

# Check SPF Record
Write-Host "Checking SPF Record..." -ForegroundColor Yellow
try {
    $txtResult = Resolve-DnsName -Name cryptorafts.com -Type TXT -ErrorAction SilentlyContinue
    if ($txtResult) {
        $spfRecord = $txtResult | Where-Object { $_.Strings -like "*spf1*" }
        if ($spfRecord) {
            Write-Host "  SPF Record Found:" -ForegroundColor Green
            foreach ($string in $spfRecord.Strings) {
                if ($string -like "*spf1*") {
                    $hasHostinger = $string -like "*hostinger*"
                    $status = if ($hasHostinger) { "OK" } else { "CHECK" }
                    $color = if ($hasHostinger) { "Green" } else { "Yellow" }
                    Write-Host "    $string - $status" -ForegroundColor $color
                }
            }
            
            if (-not ($spfRecord.Strings -like "*hostinger*")) {
                Write-Host "  WARNING: SPF record doesn't include Hostinger!" -ForegroundColor Red
                Write-Host "  Expected: v=spf1 include:hostinger.com ~all" -ForegroundColor Yellow
            }
        } else {
            Write-Host "  ERROR: No SPF record found!" -ForegroundColor Red
            Write-Host "  You need to add SPF TXT record in your domain registrar" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  ERROR: No TXT records found!" -ForegroundColor Red
    }
} catch {
    Write-Host "  ERROR: Could not check SPF record" -ForegroundColor Red
}

Write-Host ""

# Check DKIM Record
Write-Host "Checking DKIM Record..." -ForegroundColor Yellow
try {
    $dkimResult = Resolve-DnsName -Name "default._domainkey.cryptorafts.com" -Type TXT -ErrorAction SilentlyContinue
    if ($dkimResult) {
        Write-Host "  DKIM Record Found:" -ForegroundColor Green
        foreach ($string in $dkimResult.Strings) {
            if ($string -like "*DKIM1*") {
                Write-Host "    DKIM is configured" -ForegroundColor Green
            }
        }
    } else {
        Write-Host "  WARNING: No DKIM record found!" -ForegroundColor Yellow
        Write-Host "  You need to:" -ForegroundColor Yellow
        Write-Host "    1. Get DKIM key from Hostinger" -ForegroundColor White
        Write-Host "    2. Add TXT record: default._domainkey" -ForegroundColor White
    }
} catch {
    Write-Host "  WARNING: DKIM record not found" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "  If records are missing, add them in your domain registrar" -ForegroundColor Yellow
Write-Host "  See: COMPLETE_HOSTINGER_DNS_SETUP.md for detailed instructions" -ForegroundColor White
Write-Host ""
Write-Host "Online DNS Checkers:" -ForegroundColor Cyan
Write-Host "  - https://dnschecker.org/#MX/cryptorafts.com" -ForegroundColor White
Write-Host "  - https://mxtoolbox.com/SuperTool.aspx?action=mx%3acryptorafts.com" -ForegroundColor White
Write-Host ""

