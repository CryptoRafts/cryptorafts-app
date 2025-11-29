# Fix MailChannels SPF Record
# Vercel serverless functions route emails through MailChannels relay
# We need to include MailChannels in the SPF record

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "FIX MAILCHANNELS SPF RECORD" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Domain: cryptorafts.com" -ForegroundColor Yellow
Write-Host "Issue: Emails routed through MailChannels but SPF doesn't authorize it" -ForegroundColor Red
Write-Host ""

# Get the current SPF record ID
Write-Host "Step 1: Finding current SPF record..." -ForegroundColor Yellow
$dnsList = vercel dns ls cryptorafts.com 2>&1
$spfRecordId = ($dnsList | Select-String -Pattern "rec_81cec28fde7e99f1b585f2b5" | ForEach-Object { $_ -match "rec_\w+" | Out-Null; $matches[0] })

if ($spfRecordId) {
    Write-Host "  Found SPF record: $spfRecordId" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "Step 2: Removing old SPF record..." -ForegroundColor Yellow
    $removeResult = vercel dns remove $spfRecordId 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [OK] Old SPF record removed" -ForegroundColor Green
    } else {
        Write-Host "  [!] Error removing record: $removeResult" -ForegroundColor Yellow
    }
} else {
    Write-Host "  [!] SPF record ID not found, will add new one" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Step 3: Adding updated SPF record with MailChannels..." -ForegroundColor Yellow
$newSpfValue = "v=spf1 include:hostinger.com include:relay.mailchannels.net ~all"
Write-Host "  SPF Value: $newSpfValue" -ForegroundColor Cyan

$addResult = vercel dns add cryptorafts.com '@' TXT $newSpfValue 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "  [OK] Updated SPF record added successfully" -ForegroundColor Green
} else {
    Write-Host "  [!] Error adding record: $addResult" -ForegroundColor Red
    Write-Host ""
    Write-Host "  Manual fix required:" -ForegroundColor Yellow
    Write-Host "  1. Go to: https://vercel.com/dashboard" -ForegroundColor White
    Write-Host "  2. Navigate to: Domains > cryptorafts.com > DNS" -ForegroundColor White
    Write-Host "  3. Remove old SPF record (v=spf1 include:hostinger.com ~all)" -ForegroundColor White
    Write-Host "  4. Add new SPF record:" -ForegroundColor White
    Write-Host "     Type: TXT" -ForegroundColor Cyan
    Write-Host "     Name: @" -ForegroundColor Cyan
    Write-Host "     Value: $newSpfValue" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "VERIFICATION" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Current DNS records:" -ForegroundColor Yellow
vercel dns ls cryptorafts.com | Select-String -Pattern "TXT|SPF"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "NEXT STEPS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Wait 15-30 minutes for DNS propagation" -ForegroundColor White
Write-Host "2. Test email sending again" -ForegroundColor White
Write-Host "3. MailChannels should now be authorized to send emails" -ForegroundColor Green
Write-Host ""


