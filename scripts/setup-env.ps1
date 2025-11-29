# Quick Environment Setup Script
# Creates .env.local with updated Firebase config

Write-Host "Setting up environment..." -ForegroundColor Cyan

$lines = @(
    "# Firebase Configuration (Updated)",
    "NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAolg0vzhqmChXs2NTlPu3SQ1zoq3Rigo4",
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=cryptorafts.firebaseapp.com",
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID=cryptorafts",
    "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=cryptorafts.firebasestorage.app",
    "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1090891318609",
    "NEXT_PUBLIC_FIREBASE_APP_ID=1:1090891318609:web:c9d38e5f24f8c407d53f70",
    "NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-323KT2S14X",
    "NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://cryptorafts-default-rtdb.firebaseio.com",
    "",
    "# App Configuration",
    "NEXT_PUBLIC_APP_URL=https://www.cryptorafts.com",
    "NEXT_PUBLIC_BASE_URL=https://www.cryptorafts.com",
    "NODE_ENV=production",
    "",
    "# Admin Configuration",
    "ADMIN_EMAIL=anasshamsiggc@gmail.com",
    "SUPER_ADMIN_EMAIL=anasshamsiggc@gmail.com",
    "",
    "# Blog Automation (Add your keys)",
    "OPENAI_API_KEY=sk-proj-YOUR_OPENAI_API_KEY_HERE",
    "N8N_WEBHOOK_URL=https://cryptorafts.app.n8n.cloud/webhook/cryptorafts-publish",
    "DEFAULT_PUBLISH_MODE=false",
    "",
    "# Telegram Bot (Add your bot token and chat ID)",
    "TELEGRAM_BOT_TOKEN=YOUR_TELEGRAM_BOT_TOKEN_HERE",
    "TELEGRAM_CHAT_ID=YOUR_TELEGRAM_CHAT_ID_HERE",
    "",
    "# Firebase Admin (Service Account - Base64 encoded)",
    "FIREBASE_SERVICE_ACCOUNT_B64=YOUR_SERVICE_ACCOUNT_B64_HERE"
)

$lines | Out-File -FilePath ".env.local" -Encoding utf8

Write-Host ".env.local created!" -ForegroundColor Green
Write-Host ""
Write-Host "Next: Add your API keys to .env.local" -ForegroundColor Yellow
Write-Host "  - OPENAI_API_KEY" -ForegroundColor Gray
Write-Host "  - N8N_WEBHOOK_URL" -ForegroundColor Gray
Write-Host "  - TELEGRAM_BOT_TOKEN (optional)" -ForegroundColor Gray
Write-Host "  - FIREBASE_SERVICE_ACCOUNT_B64" -ForegroundColor Gray
