# Complete Integration Setup Script
# Sets up all integrations: Dev.to, Blogger, IFTTT, Buffer, Telegram, n8n

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Complete Blog Automation Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Read current .env.local if exists
$envFile = ".env.local"
$envContent = @{}

if (Test-Path $envFile) {
    Write-Host "Reading existing .env.local..." -ForegroundColor Yellow
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            $envContent[$key] = $value
        }
    }
}

# Firebase Configuration (Updated)
$envContent["NEXT_PUBLIC_FIREBASE_API_KEY"] = "AIzaSyAolg0vzhqmChXs2NTlPu3SQ1zoq3Rigo4"
$envContent["NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"] = "cryptorafts.firebaseapp.com"
$envContent["NEXT_PUBLIC_FIREBASE_PROJECT_ID"] = "cryptorafts"
$envContent["NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"] = "cryptorafts.firebasestorage.app"
$envContent["NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"] = "1090891318609"
$envContent["NEXT_PUBLIC_FIREBASE_APP_ID"] = "1:1090891318609:web:c9d38e5f24f8c407d53f70"
$envContent["NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID"] = "G-323KT2S14X"
$envContent["NEXT_PUBLIC_FIREBASE_DATABASE_URL"] = "https://cryptorafts-default-rtdb.firebaseio.com"

# App Configuration
if (-not $envContent.ContainsKey("NEXT_PUBLIC_APP_URL")) {
    $envContent["NEXT_PUBLIC_APP_URL"] = "https://www.cryptorafts.com"
}
if (-not $envContent.ContainsKey("NEXT_PUBLIC_BASE_URL")) {
    $envContent["NEXT_PUBLIC_BASE_URL"] = "https://www.cryptorafts.com"
}
if (-not $envContent.ContainsKey("NODE_ENV")) {
    $envContent["NODE_ENV"] = "production"
}

# Admin Configuration
if (-not $envContent.ContainsKey("ADMIN_EMAIL")) {
    $envContent["ADMIN_EMAIL"] = "anasshamsiggc@gmail.com"
}
if (-not $envContent.ContainsKey("SUPER_ADMIN_EMAIL")) {
    $envContent["SUPER_ADMIN_EMAIL"] = "anasshamsiggc@gmail.com"
}

# Blog Automation - Keep existing or set defaults
if (-not $envContent.ContainsKey("OPENAI_API_KEY")) {
    $envContent["OPENAI_API_KEY"] = "sk-proj-YOUR_OPENAI_API_KEY_HERE"
}
if (-not $envContent.ContainsKey("N8N_WEBHOOK_URL")) {
    $envContent["N8N_WEBHOOK_URL"] = "https://cryptorafts.app.n8n.cloud/webhook/cryptorafts-publish"
}
if (-not $envContent.ContainsKey("DEFAULT_PUBLISH_MODE")) {
    $envContent["DEFAULT_PUBLISH_MODE"] = "false"
}

# Telegram Bot - Keep existing or set placeholder
if (-not $envContent.ContainsKey("TELEGRAM_BOT_TOKEN")) {
    $envContent["TELEGRAM_BOT_TOKEN"] = "YOUR_TELEGRAM_BOT_TOKEN_HERE"
}
if (-not $envContent.ContainsKey("TELEGRAM_CHAT_ID")) {
    $envContent["TELEGRAM_CHAT_ID"] = "YOUR_TELEGRAM_CHAT_ID_HERE"
}

# Dev.to Integration - New
if (-not $envContent.ContainsKey("DEVTO_API_KEY")) {
    $envContent["DEVTO_API_KEY"] = "YOUR_DEVTO_API_KEY_HERE"
}
Write-Host "Dev.to: Get API key from https://dev.to/settings/extensions" -ForegroundColor Gray

# Blogger Integration - New
if (-not $envContent.ContainsKey("BLOGGER_API_KEY")) {
    $envContent["BLOGGER_API_KEY"] = "YOUR_BLOGGER_API_KEY_HERE"
}
if (-not $envContent.ContainsKey("BLOGGER_BLOG_ID")) {
    $envContent["BLOGGER_BLOG_ID"] = "7738556816495172350"
}
Write-Host "Blogger: Blog ID set to 7738556816495172350" -ForegroundColor Gray
Write-Host "Blogger: Get API key from https://console.cloud.google.com/apis/credentials" -ForegroundColor Gray

# IFTTT Integration - New
if (-not $envContent.ContainsKey("IFTTT_WEBHOOK_KEY")) {
    $envContent["IFTTT_WEBHOOK_KEY"] = "YOUR_IFTTT_WEBHOOK_KEY_HERE"
}
Write-Host "IFTTT: Get webhook key from https://ifttt.com/maker_webhooks" -ForegroundColor Gray

# Buffer Integration (for n8n)
if (-not $envContent.ContainsKey("BUFFER_ACCESS_TOKEN")) {
    $envContent["BUFFER_ACCESS_TOKEN"] = "YOUR_BUFFER_ACCESS_TOKEN_HERE"
}
Write-Host "Buffer: Get access token from https://buffer.com/developers/apps" -ForegroundColor Gray

# Firebase Admin
if (-not $envContent.ContainsKey("FIREBASE_SERVICE_ACCOUNT_B64")) {
    $envContent["FIREBASE_SERVICE_ACCOUNT_B64"] = "YOUR_SERVICE_ACCOUNT_B64_HERE"
}

# Write .env.local
Write-Host ""
Write-Host "Writing .env.local..." -ForegroundColor Cyan

$output = @()
$output += "# Firebase Configuration (Updated)"
$output += "NEXT_PUBLIC_FIREBASE_API_KEY=$($envContent['NEXT_PUBLIC_FIREBASE_API_KEY'])"
$output += "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$($envContent['NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'])"
$output += "NEXT_PUBLIC_FIREBASE_PROJECT_ID=$($envContent['NEXT_PUBLIC_FIREBASE_PROJECT_ID'])"
$output += "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=$($envContent['NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'])"
$output += "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$($envContent['NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'])"
$output += "NEXT_PUBLIC_FIREBASE_APP_ID=$($envContent['NEXT_PUBLIC_FIREBASE_APP_ID'])"
$output += "NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=$($envContent['NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID'])"
$output += "NEXT_PUBLIC_FIREBASE_DATABASE_URL=$($envContent['NEXT_PUBLIC_FIREBASE_DATABASE_URL'])"
$output += ""
$output += "# App Configuration"
$output += "NEXT_PUBLIC_APP_URL=$($envContent['NEXT_PUBLIC_APP_URL'])"
$output += "NEXT_PUBLIC_BASE_URL=$($envContent['NEXT_PUBLIC_BASE_URL'])"
$output += "NODE_ENV=$($envContent['NODE_ENV'])"
$output += ""
$output += "# Admin Configuration"
$output += "ADMIN_EMAIL=$($envContent['ADMIN_EMAIL'])"
$output += "SUPER_ADMIN_EMAIL=$($envContent['SUPER_ADMIN_EMAIL'])"
$output += ""
$output += "# Blog Automation"
$output += "OPENAI_API_KEY=$($envContent['OPENAI_API_KEY'])"
$output += "N8N_WEBHOOK_URL=$($envContent['N8N_WEBHOOK_URL'])"
$output += "DEFAULT_PUBLISH_MODE=$($envContent['DEFAULT_PUBLISH_MODE'])"
$output += ""
$output += "# Telegram Bot"
$output += "TELEGRAM_BOT_TOKEN=$($envContent['TELEGRAM_BOT_TOKEN'])"
$output += "TELEGRAM_CHAT_ID=$($envContent['TELEGRAM_CHAT_ID'])"
$output += ""
$output += "# Dev.to Integration"
$output += "DEVTO_API_KEY=$($envContent['DEVTO_API_KEY'])"
$output += ""
$output += "# Blogger Integration"
$output += "BLOGGER_API_KEY=$($envContent['BLOGGER_API_KEY'])"
$output += "BLOGGER_BLOG_ID=$($envContent['BLOGGER_BLOG_ID'])"
$output += ""
$output += "# IFTTT Integration"
$output += "IFTTT_WEBHOOK_KEY=$($envContent['IFTTT_WEBHOOK_KEY'])"
$output += ""
$output += "# Buffer Integration (for n8n)"
$output += "BUFFER_ACCESS_TOKEN=$($envContent['BUFFER_ACCESS_TOKEN'])"
$output += ""
$output += "# Firebase Admin"
$output += "FIREBASE_SERVICE_ACCOUNT_B64=$($envContent['FIREBASE_SERVICE_ACCOUNT_B64'])"

$output | Out-File -FilePath $envFile -Encoding utf8

Write-Host "✅ .env.local updated with all integrations!" -ForegroundColor Green
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Next Steps:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Dev.to API Key:" -ForegroundColor White
Write-Host "   https://dev.to/settings/extensions" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Blogger API Key:" -ForegroundColor White
Write-Host "   https://console.cloud.google.com/apis/credentials" -ForegroundColor Gray
Write-Host "   Blog ID: 7738556816495172350 (already set)" -ForegroundColor Gray
Write-Host ""
Write-Host "3. IFTTT Webhook Key:" -ForegroundColor White
Write-Host "   https://ifttt.com/maker_webhooks" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Buffer Access Token:" -ForegroundColor White
Write-Host "   https://buffer.com/developers/apps" -ForegroundColor Gray
Write-Host ""
Write-Host "5. Telegram Bot:" -ForegroundColor White
Write-Host "   Message @BotFather on Telegram" -ForegroundColor Gray
Write-Host ""
Write-Host "6. OpenAI API Key:" -ForegroundColor White
Write-Host "   https://platform.openai.com/api-keys" -ForegroundColor Gray
Write-Host ""
Write-Host "Edit .env.local and add your API keys!" -ForegroundColor Yellow

