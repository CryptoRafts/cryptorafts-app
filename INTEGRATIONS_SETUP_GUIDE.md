# 🔗 Complete Integrations Setup Guide

**All platforms integrated and ready!**

---

## ✅ What's Integrated

1. ✅ **Dev.to** - Auto cross-posting
2. ✅ **Blogger** - Auto cross-posting  
3. ✅ **IFTTT** - Webhook triggers
4. ✅ **Buffer** - Social media posting (via n8n)
5. ✅ **Telegram** - Notifications
6. ✅ **n8n** - Workflow automation

---

## 🚀 Quick Setup

### Run the setup script:

```powershell
.\scripts\setup-all-integrations.ps1
```

This will:
- ✅ Update Firebase config
- ✅ Add all integration placeholders
- ✅ Set Blogger Blog ID (7738556816495172350)
- ✅ Configure n8n webhook URL

---

## 📋 API Keys to Get

### 1. Dev.to API Key

1. Go to: https://dev.to/settings/extensions
2. Scroll to **"DEV Community API Keys"**
3. Click **"Generate API Key"**
4. Copy the key
5. Add to `.env.local`: `DEVTO_API_KEY=your_key_here`

**Docs**: https://developers.forem.com/api/v1

---

### 2. Blogger API Key

1. Go to: https://console.cloud.google.com/apis/credentials
2. Select project (or create new)
3. Click **"Create Credentials"** → **"API Key"**
4. Copy the key
5. Add to `.env.local`: `BLOGGER_API_KEY=your_key_here`

**Blog ID**: Already set to `7738556816495172350` (from your Blogger URL)

**Enable Blogger API**:
1. Go to: https://console.cloud.google.com/apis/library/blogger.googleapis.com
2. Click **"Enable"**

**Docs**: https://developers.google.com/blogger/docs/3.0/reference

---

### 3. IFTTT Webhook Key

1. **Get Webhook Key**:
   - Go to: https://ifttt.com/maker_webhooks
   - Click **"Documentation"** (or "Connect" if not connected)
   - Find your webhook key (starts with `d...`)
   - Copy the key

2. **Create IFTTT Applet**:
   - Go to: https://ifttt.com/create?recommended_services=maker_webhooks
   - **If This**: Webhooks → "Receive a web request"
   - **Event Name**: `blog_post_created` (exact match, case-sensitive)
   - **Then That**: Choose action:
     - Email notification
     - Google Sheets log
     - Twitter/X post
     - Slack notification
     - Or any other IFTTT action
   - **Click**: "Finish"

3. **Add to `.env.local`**:
   ```env
   IFTTT_WEBHOOK_KEY=your_webhook_key_here
   ```

4. **Test**:
   ```powershell
   .\scripts\test-ifttt-webhook.ps1
   ```

**Full Guide**: See `IFTTT_SETUP_GUIDE.md`

**Docs**: https://ifttt.com/maker_webhooks

---

### 4. Buffer Access Token

1. Go to: https://buffer.com/developers/apps
2. Create new app (or use existing)
3. Get **Access Token**
4. Add to `.env.local`: `BUFFER_ACCESS_TOKEN=your_token_here`

**For n8n**: Use Buffer credentials in n8n workflow (see `N8N_WORKFLOW_GUIDE.md`)

**Docs**: https://buffer.com/developers/api

---

### 5. Telegram Bot Token

1. Open Telegram
2. Message `@BotFather`
3. Send `/newbot`
4. Follow instructions
5. Copy bot token
6. Add to `.env.local`: `TELEGRAM_BOT_TOKEN=your_token_here`

**Get Chat ID**:
1. Message your bot
2. Visit: `https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates`
3. Find `"chat":{"id":123456789}`
4. Add to `.env.local`: `TELEGRAM_CHAT_ID=123456789`

---

### 6. OpenAI API Key

1. Go to: https://platform.openai.com/api-keys
2. Create new secret key
3. Copy the key
4. Add to `.env.local`: `OPENAI_API_KEY=sk-proj-your_key_here`

---

### 7. n8n Webhook URL

Already configured: `https://cryptorafts.app.n8n.cloud/webhook/cryptorafts-publish`

**To get your webhook URL**:
1. Go to: https://cryptorafts.app.n8n.cloud/home/workflows
2. Open/create workflow
3. Add **Webhook** node
4. Copy webhook URL
5. Update `.env.local` if different

---

## 🔄 How It Works

### Blog Post Flow:

```
1. Cursor Script generates post
   ↓
2. Sends to n8n webhook
   ↓
3. n8n workflow processes:
   - Duplicate check
   - Validation
   - Save to Firestore
   ↓
4. Site API (/api/blog/n8n-webhook):
   - Saves to Firestore
   - Cross-posts to Dev.to (if published)
   - Cross-posts to Blogger (if published)
   - Triggers IFTTT webhook
   - Sends Telegram notification
   ↓
5. n8n continues:
   - Posts to Buffer (3 social accounts)
   - Additional notifications
   ↓
6. Done! ✅
```

---

## 📊 Integration Status

| Platform | Status | Auto-Post | Required |
|----------|--------|-----------|----------|
| **Dev.to** | ✅ Ready | Yes (if published) | DEVTO_API_KEY |
| **Blogger** | ✅ Ready | Yes (if published) | BLOGGER_API_KEY |
| **IFTTT** | ✅ Ready | Yes | IFTTT_WEBHOOK_KEY |
| **Buffer** | ✅ Ready | Via n8n | BUFFER_ACCESS_TOKEN |
| **Telegram** | ✅ Ready | Yes | TELEGRAM_BOT_TOKEN |
| **n8n** | ✅ Ready | Yes | N8N_WEBHOOK_URL |

---

## 🧪 Test Integrations

### Test Dev.to:
```bash
# After adding DEVTO_API_KEY, test with:
npm run blog:generate
# Check Dev.to dashboard for published article
```

### Test Blogger:
```bash
# After adding BLOGGER_API_KEY, test with:
npm run blog:generate
# Check Blogger dashboard
```

### Test IFTTT:
```bash
# After adding IFTTT_WEBHOOK_KEY, test with:
npm run blog:generate
# Check IFTTT activity log
```

### Test Telegram:
```bash
# After adding TELEGRAM_BOT_TOKEN and CHAT_ID, test with:
npm run blog:generate
# Check Telegram for notification
```

---

## 📝 Environment Variables Summary

Add these to `.env.local`:

```env
# Required for Blog Generation
OPENAI_API_KEY=sk-proj-your_key
N8N_WEBHOOK_URL=https://cryptorafts.app.n8n.cloud/webhook/cryptorafts-publish

# Cross-Posting (Optional but Recommended)
DEVTO_API_KEY=your_devto_key
BLOGGER_API_KEY=your_blogger_key
BLOGGER_BLOG_ID=7738556816495172350

# Notifications (Optional)
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
IFTTT_WEBHOOK_KEY=your_ifttt_key

# Buffer (for n8n)
BUFFER_ACCESS_TOKEN=your_buffer_token

# Firebase Admin (Required)
FIREBASE_SERVICE_ACCOUNT_B64=your_service_account_b64
```

---

## 🎯 Next Steps

1. ✅ Run: `.\scripts\setup-all-integrations.ps1`
2. ✅ Get API keys (see links above)
3. ✅ Add keys to `.env.local`
4. ✅ Test: `npm run blog:generate`
5. ✅ Check all platforms for published posts

---

## 📚 Documentation

- **Dev.to API**: https://developers.forem.com/api/v1
- **Blogger API**: https://developers.google.com/blogger/docs/3.0/reference
- **IFTTT Webhooks**: https://ifttt.com/maker_webhooks
- **Buffer API**: https://buffer.com/developers/api
- **Telegram Bot API**: https://core.telegram.org/bots/api
- **n8n Docs**: https://docs.n8n.io

---

## ✅ Status: Ready!

All integrations are implemented. Add your API keys and you're ready to go!

**See `DEPLOYMENT_COMPLETE.md` for deployment instructions.**

