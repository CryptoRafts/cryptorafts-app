# 🚀 DEPLOY NOW - Automated Setup

**Everything is ready!** Run this single command to deploy:

```powershell
.\scripts\deploy-automation.ps1
```

---

## ✅ What This Does

1. ✅ Creates `.env.local` with updated Firebase config
2. ✅ Installs all dependencies
3. ✅ Builds the project
4. ✅ Deploys to Vercel (if configured)
5. ✅ Sets up logs directory
6. ✅ Tests automation scripts

---

## 🔧 Manual Steps (After Deployment)

### 1. Add API Keys to `.env.local`

Edit `.env.local` and add:

```env
# Required
OPENAI_API_KEY=sk-proj-YOUR_KEY_HERE
N8N_WEBHOOK_URL=https://cryptorafts.app.n8n.cloud/webhook/cryptorafts-publish

# Optional (for Telegram notifications)
TELEGRAM_BOT_TOKEN=YOUR_BOT_TOKEN
TELEGRAM_CHAT_ID=YOUR_CHAT_ID

# Required (Firebase Admin)
FIREBASE_SERVICE_ACCOUNT_B64=YOUR_BASE64_SERVICE_ACCOUNT
```

### 2. Get Telegram Bot Token

1. Message `@BotFather` on Telegram
2. Send `/newbot`
3. Follow instructions
4. Copy bot token → Add to `.env.local`

### 3. Get Telegram Chat ID

1. Message your bot
2. Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
3. Find `"chat":{"id":123456789}` → Copy ID
4. Add to `.env.local` as `TELEGRAM_CHAT_ID`

### 4. Test Blog Generation

```bash
npm run blog:generate
```

### 5. Set Up n8n Workflow

Follow: `N8N_WORKFLOW_GUIDE.md`

---

## 🎯 Quick Deploy Options

### Option 1: Full Auto Deploy
```powershell
.\scripts\deploy-automation.ps1
```

### Option 2: Skip Build (if already built)
```powershell
.\scripts\deploy-automation.ps1 -SkipBuild
```

### Option 3: Skip Deploy (setup only)
```powershell
.\scripts\deploy-automation.ps1 -SkipDeploy
```

---

## ✅ Firebase Config Updated

Your Firebase config has been updated to:
- **Project**: `cryptorafts`
- **API Key**: `AIzaSyAolg0vzhqmChXs2NTlPu3SQ1zoq3Rigo4`
- **Auth Domain**: `cryptorafts.firebaseapp.com`

All files have been updated automatically!

---

## 🎉 Ready!

Run the deploy script and you're done!

```powershell
.\scripts\deploy-automation.ps1
```
