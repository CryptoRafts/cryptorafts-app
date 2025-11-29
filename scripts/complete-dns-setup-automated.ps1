# Complete Automated DNS Setup Script
# This script provides maximum automation for DNS record addition

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "COMPLETE AUTOMATED DNS SETUP" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Generate all DNS record files
Write-Host "[1/5] Generating DNS record files..." -ForegroundColor Yellow
if (Test-Path "scripts\generate-hostinger-dns-import.ps1") {
    .\scripts\generate-hostinger-dns-import.ps1
    Write-Host "  [OK] DNS records generated" -ForegroundColor Green
} else {
    Write-Host "  [!] DNS generation script not found" -ForegroundColor Yellow
}

Write-Host ""

# Step 2: Read DNS records
Write-Host "[2/5] Reading DNS records..." -ForegroundColor Yellow
$dkimFile = "HOSTINGER_DKIM_KEY.txt"
if (-not (Test-Path $dkimFile)) {
    Write-Host "  [ERROR] DKIM key file not found!" -ForegroundColor Red
    Write-Host "  Please ensure HOSTINGER_DKIM_KEY.txt exists" -ForegroundColor Yellow
    exit 1
}

$dkimKey = Get-Content $dkimFile -Raw
Write-Host "  [OK] DKIM key loaded" -ForegroundColor Green

Write-Host ""

# Step 3: Create comprehensive DNS records JSON
Write-Host "[3/5] Creating DNS records configuration..." -ForegroundColor Yellow

$dnsRecords = @(
    @{
        Type = "MX"
        Name = "@"
        Value = "mx1.hostinger.com"
        Priority = 5
        TTL = 14400
    },
    @{
        Type = "MX"
        Name = "@"
        Value = "mx2.hostinger.com"
        Priority = 10
        TTL = 14400
    },
    @{
        Type = "TXT"
        Name = "@"
        Value = "v=spf1 include:hostinger.com ~all"
        TTL = 14400
    },
    @{
        Type = "TXT"
        Name = "default._domainkey"
        Value = $dkimKey.Trim()
        TTL = 14400
    }
)

$dnsRecords | ConvertTo-Json -Depth 10 | Out-File -FilePath "DNS_RECORDS_JSON.json" -Encoding UTF8
Write-Host "  [OK] DNS records JSON created" -ForegroundColor Green

Write-Host ""

# Step 4: Create HTML form with pre-filled values
Write-Host "[4/5] Creating HTML form with pre-filled DNS records..." -ForegroundColor Yellow

$htmlForm = @"
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hostinger DNS Records - Copy & Paste</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #1a1a1a;
            color: #fff;
        }
        .header {
            background: linear-gradient(135deg, #06b6d4, #3b82f6);
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 30px;
            text-align: center;
        }
        .record {
            background: #2a2a2a;
            border: 2px solid #06b6d4;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
        }
        .record h3 {
            color: #06b6d4;
            margin-top: 0;
        }
        .field {
            margin: 10px 0;
            display: flex;
            align-items: center;
        }
        .field label {
            min-width: 100px;
            font-weight: bold;
            color: #06b6d4;
        }
        .field input, .field textarea {
            flex: 1;
            padding: 8px;
            background: #1a1a1a;
            border: 1px solid #06b6d4;
            border-radius: 4px;
            color: #fff;
            font-family: monospace;
        }
        .field textarea {
            min-height: 60px;
            resize: vertical;
        }
        .copy-btn {
            background: #06b6d4;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            margin-left: 10px;
            font-weight: bold;
        }
        .copy-btn:hover {
            background: #0891b2;
        }
        .instructions {
            background: #2a2a2a;
            border-left: 4px solid #06b6d4;
            padding: 20px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .instructions ol {
            margin-left: 20px;
        }
        .instructions li {
            margin: 10px 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔧 Hostinger DNS Records Setup</h1>
        <p>Copy each record and add it in Hostinger DNS Zone Editor</p>
    </div>

    <div class="instructions">
        <h2>📋 Instructions:</h2>
        <ol>
            <li>Go to: <a href="https://hpanel.hostinger.com/domains/dns" target="_blank" style="color: #06b6d4;">Hostinger DNS Zone Editor</a></li>
            <li>Select domain: <strong>cryptorafts.com</strong></li>
            <li><strong>DELETE</strong> any old MX records first</li>
            <li>Add each record below (click "Copy" button for each field)</li>
            <li>Click "Save" after adding each record</li>
            <li>Wait 15-30 minutes for DNS propagation</li>
        </ol>
    </div>

"@

$recordNumber = 1
foreach ($record in $dnsRecords) {
    $htmlForm += @"
    <div class="record">
        <h3>Record $recordNumber : $($record.Type) - $($record.Name)</h3>
        <div class="field">
            <label>Type:</label>
            <input type="text" value="$($record.Type)" id="type$recordNumber" readonly>
            <button class="copy-btn" onclick="copyToClipboard('type$recordNumber')">Copy</button>
        </div>
        <div class="field">
            <label>Name:</label>
            <input type="text" value="$($record.Name)" id="name$recordNumber" readonly>
            <button class="copy-btn" onclick="copyToClipboard('name$recordNumber')">Copy</button>
        </div>
"@
    
    if ($record.Priority) {
        $htmlForm += @"
        <div class="field">
            <label>Priority:</label>
            <input type="text" value="$($record.Priority)" id="priority$recordNumber" readonly>
            <button class="copy-btn" onclick="copyToClipboard('priority$recordNumber')">Copy</button>
        </div>
"@
    }
    
    $valueField = if ($record.Value.Length -gt 100) { "textarea" } else { "input" }
    $htmlForm += @"
        <div class="field">
            <label>Value:</label>
            <$valueField value="$($record.Value)" id="value$recordNumber" readonly></$valueField>
            <button class="copy-btn" onclick="copyToClipboard('value$recordNumber')">Copy</button>
        </div>
        <div class="field">
            <label>TTL:</label>
            <input type="text" value="$($record.TTL)" id="ttl$recordNumber" readonly>
            <button class="copy-btn" onclick="copyToClipboard('ttl$recordNumber')">Copy</button>
        </div>
    </div>

"@
    $recordNumber++
}

$htmlForm += @"
    <script>
        function copyToClipboard(elementId) {
            const element = document.getElementById(elementId);
            element.select();
            element.setSelectionRange(0, 99999); // For mobile devices
            document.execCommand('copy');
            
            // Visual feedback
            const btn = event.target;
            const originalText = btn.textContent;
            btn.textContent = 'Copied!';
            btn.style.background = '#10b981';
            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.background = '#06b6d4';
            }, 2000);
        }
    </script>
</body>
</html>
"@

$htmlForm | Out-File -FilePath "DNS_RECORDS_FORM.html" -Encoding UTF8
Write-Host "  [OK] HTML form created" -ForegroundColor Green

Write-Host ""

# Step 5: Open everything
Write-Host "[5/5] Opening all resources..." -ForegroundColor Yellow

# Open Hostinger DNS Zone Editor
Write-Host "  Opening Hostinger DNS Zone Editor..." -ForegroundColor Cyan
Start-Process "https://hpanel.hostinger.com/domains/dns"

# Open HTML form
Write-Host "  Opening DNS records form..." -ForegroundColor Cyan
$htmlPath = Join-Path $PWD "DNS_RECORDS_FORM.html"
Start-Process $htmlPath

# Open DNS records file
if (Test-Path "HOSTINGER_DNS_COPY_PASTE.txt") {
    Write-Host "  Opening DNS records text file..." -ForegroundColor Cyan
    Start-Process notepad.exe -ArgumentList "HOSTINGER_DNS_COPY_PASTE.txt"
}

Write-Host "  [OK] All resources opened" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SETUP COMPLETE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "All DNS records are ready:" -ForegroundColor Yellow
Write-Host "  1. Hostinger DNS Zone Editor (browser)" -ForegroundColor White
Write-Host "  2. DNS Records HTML Form (browser - with copy buttons)" -ForegroundColor White
Write-Host "  3. DNS Records Text File (Notepad)" -ForegroundColor White
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Log in to Hostinger (if needed)" -ForegroundColor White
Write-Host "  2. Use the HTML form to copy each DNS record field" -ForegroundColor White
Write-Host "  3. Paste into Hostinger DNS Zone Editor" -ForegroundColor White
Write-Host "  4. Save each record" -ForegroundColor White
Write-Host "  5. Wait 15-30 minutes for DNS propagation" -ForegroundColor White
Write-Host "  6. Run: .\scripts\check-dns-records.ps1" -ForegroundColor Cyan
Write-Host ""

