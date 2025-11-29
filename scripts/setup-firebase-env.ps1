# Setup Firebase Environment Variables
# Updates .env.local with correct Firebase config

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Firebase Configuration Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Read existing .env.local if exists
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

# Firebase Configuration (Updated to cryptorafts-b9067)
Write-Host "Updating Firebase configuration..." -ForegroundColor Cyan

$envContent["NEXT_PUBLIC_FIREBASE_API_KEY"] = "AIzaSyAo2aRQPZU5naLm4bFCDbqTA1gNW8oFB14"
$envContent["NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"] = "cryptorafts-b9067.firebaseapp.com"
$envContent["NEXT_PUBLIC_FIREBASE_PROJECT_ID"] = "cryptorafts-b9067"
$envContent["NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"] = "cryptorafts-b9067.firebasestorage.app"
$envContent["NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"] = "374711838796"
$envContent["NEXT_PUBLIC_FIREBASE_APP_ID"] = "1:374711838796:web:3bee725bfa7d8790456ce9"
$envContent["NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID"] = "G-ZRQ955RGWH"
$envContent["NEXT_PUBLIC_FIREBASE_DATABASE_URL"] = "https://cryptorafts-b9067-default-rtdb.firebaseio.com"

# Keep other settings if they exist
if (-not $envContent.ContainsKey("NEXT_PUBLIC_APP_URL")) {
    $envContent["NEXT_PUBLIC_APP_URL"] = "https://www.cryptorafts.com"
}
if (-not $envContent.ContainsKey("NEXT_PUBLIC_BASE_URL")) {
    $envContent["NEXT_PUBLIC_BASE_URL"] = "https://www.cryptorafts.com"
}
if (-not $envContent.ContainsKey("NODE_ENV")) {
    $envContent["NODE_ENV"] = "production"
}
if (-not $envContent.ContainsKey("ADMIN_EMAIL")) {
    $envContent["ADMIN_EMAIL"] = "anasshamsiggc@gmail.com"
}
if (-not $envContent.ContainsKey("N8N_WEBHOOK_URL")) {
    $envContent["N8N_WEBHOOK_URL"] = "https://cryptorafts.app.n8n.cloud/webhook/cryptorafts-publish"
}

# Write .env.local
Write-Host ""
Write-Host "Writing .env.local..." -ForegroundColor Cyan

$output = @()
$output += "# Firebase Configuration (cryptorafts-b9067)"
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
$output += ""
$output += "# Blog Automation"
if ($envContent.ContainsKey("OPENAI_API_KEY")) {
    $output += "OPENAI_API_KEY=$($envContent['OPENAI_API_KEY'])"
} else {
    $output += "OPENAI_API_KEY=sk-proj-YOUR_OPENAI_API_KEY_HERE"
}
if ($envContent.ContainsKey("N8N_WEBHOOK_URL")) {
    $output += "N8N_WEBHOOK_URL=$($envContent['N8N_WEBHOOK_URL'])"
} else {
    $output += "N8N_WEBHOOK_URL=https://cryptorafts.app.n8n.cloud/webhook/cryptorafts-publish"
}
if ($envContent.ContainsKey("DEFAULT_PUBLISH_MODE")) {
    $output += "DEFAULT_PUBLISH_MODE=$($envContent['DEFAULT_PUBLISH_MODE'])"
} else {
    $output += "DEFAULT_PUBLISH_MODE=false"
}
$output += ""
$output += "# Telegram Bot"
if ($envContent.ContainsKey("TELEGRAM_BOT_TOKEN")) {
    $output += "TELEGRAM_BOT_TOKEN=$($envContent['TELEGRAM_BOT_TOKEN'])"
} else {
    $output += "TELEGRAM_BOT_TOKEN=YOUR_TELEGRAM_BOT_TOKEN_HERE"
}
if ($envContent.ContainsKey("TELEGRAM_CHAT_ID")) {
    $output += "TELEGRAM_CHAT_ID=$($envContent['TELEGRAM_CHAT_ID'])"
} else {
    $output += "TELEGRAM_CHAT_ID=YOUR_TELEGRAM_CHAT_ID_HERE"
}
$output += ""
$output += "# Cross-Posting (Optional)"
if ($envContent.ContainsKey("DEVTO_API_KEY")) {
    $output += "DEVTO_API_KEY=$($envContent['DEVTO_API_KEY'])"
} else {
    $output += "DEVTO_API_KEY=YOUR_DEVTO_API_KEY_HERE"
}
if ($envContent.ContainsKey("BLOGGER_API_KEY")) {
    $output += "BLOGGER_API_KEY=$($envContent['BLOGGER_API_KEY'])"
} else {
    $output += "BLOGGER_API_KEY=YOUR_BLOGGER_API_KEY_HERE"
}
if ($envContent.ContainsKey("BLOGGER_BLOG_ID")) {
    $output += "BLOGGER_BLOG_ID=$($envContent['BLOGGER_BLOG_ID'])"
} else {
    $output += "BLOGGER_BLOG_ID=7738556816495172350"
}
if ($envContent.ContainsKey("IFTTT_WEBHOOK_KEY")) {
    $output += "IFTTT_WEBHOOK_KEY=$($envContent['IFTTT_WEBHOOK_KEY'])"
} else {
    $output += "IFTTT_WEBHOOK_KEY=YOUR_IFTTT_WEBHOOK_KEY_HERE"
}
$output += ""
$output += "# Buffer Integration (for n8n)"
if ($envContent.ContainsKey("BUFFER_ACCESS_TOKEN")) {
    $output += "BUFFER_ACCESS_TOKEN=$($envContent['BUFFER_ACCESS_TOKEN'])"
} else {
    $output += "BUFFER_ACCESS_TOKEN=YOUR_BUFFER_ACCESS_TOKEN_HERE"
}
$output += ""
$output += "# Firebase Admin (Service Account - Base64 encoded)"
if ($envContent.ContainsKey("FIREBASE_SERVICE_ACCOUNT_B64")) {
    $output += "FIREBASE_SERVICE_ACCOUNT_B64=$($envContent['FIREBASE_SERVICE_ACCOUNT_B64'])"
} else {
    $output += "FIREBASE_SERVICE_ACCOUNT_B64=YOUR_SERVICE_ACCOUNT_B64_HERE"
}

$output | Out-File -FilePath $envFile -Encoding utf8

Write-Host "✅ .env.local updated with Firebase config (cryptorafts-b9067)!" -ForegroundColor Green
Write-Host ""
Write-Host "Firebase Project: cryptorafts-b9067" -ForegroundColor Cyan
Write-Host "n8n Webhook: https://cryptorafts.app.n8n.cloud/webhook/cryptorafts-publish" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Set up n8n workflow: See N8N_COMPLETE_SETUP_GUIDE.md" -ForegroundColor Gray
Write-Host "  2. Add API keys to .env.local" -ForegroundColor Gray
Write-Host "  3. Test: npm run blog:generate" -ForegroundColor Gray

