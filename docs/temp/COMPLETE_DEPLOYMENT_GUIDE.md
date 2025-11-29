# 🚀 Complete Deployment Guide - All Integrations

**Everything is set up and ready!**

---

## ✅ What's Been Done

### 1. Firebase Configuration ✅
- Updated to project: `cryptorafts`
- All config files updated
- `.env.local` created with Firebase config

### 2. Blog Automation ✅
- OpenAI integration ready
- n8n webhook endpoint ready
- Cursor automation script ready

### 3. Cross-Posting Integrations ✅
- **Dev.to** - Auto cross-posting service created
- **Blogger** - Auto cross-posting service created (Blog ID: 7738556816495172350)
- **IFTTT** - Webhook service created
- **Buffer** - Ready for n8n integration
- **Telegram** - Notification service ready

### 4. Environment Setup ✅
- `.env.local` created with all placeholders
- Setup script ready: `scripts/setup-all-integrations.ps1`

---

## 🎯 Quick Start (3 Steps)

### Step 1: Run Setup Script

```powershell
.\scripts\setup-all-integrations.ps1
```

This creates/updates `.env.local` with all integration placeholders.

### Step 2: Get API Keys

Follow the links provided by the script or see `INTEGRATIONS_SETUP_GUIDE.md`:

- **Dev.to**: https://dev.to/settings/extensions
- **Blogger**: https://console.cloud.google.com/apis/credentials
- **IFTTT**: https://ifttt.com/maker_webhooks
- **Buffer**: https://buffer.com/developers/apps
- **Telegram**: Message @BotFather
- **OpenAI**: https://platform.openai.com/api-keys

### Step 3: Add Keys to `.env.local`

Edit `.env.local` and replace placeholders with your actual keys.

---

## 📋 Complete Integration Flow

```
┌─────────────────────────────────────────────────────────┐
│  Cursor Script (npm run blog:generate)                  │
│  - Generates post with OpenAI                           │
│  - Formats JSON payload                                 │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  n8n Webhook                                            │
│  https://cryptorafts.app.n8n.cloud/webhook/...         │
│  - Receives JSON                                        │
│  - Duplicate check                                      │
│  - Validation                                           │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  Site API (/api/blog/n8n-webhook)                      │
│  - Saves to Firestore                                   │
│  - Cross-posts to Dev.to (if published)                │
│  - Cross-posts to Blogger (if published)                │
│  - Triggers IFTTT webhook                               │
│  - Sends Telegram notification                          │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  n8n Workflow Continues                                 │
│  - Posts to Buffer (3 social accounts)                  │
│  - Additional notifications                             │
└─────────────────────────────────────────────────────────┘
```

---

## 🔧 Platform-Specific Setup

### Dev.to Setup

1. **Get API Key**:
   - Go to: https://dev.to/settings/extensions
   - Scroll to "DEV Community API Keys"
   - Click "Generate API Key"
   - Copy key

2. **Add to `.env.local`**:
   ```env
   DEVTO_API_KEY=your_api_key_here
   ```

3. **Test**: Posts will auto-cross-post when `publish: true`

**API Docs**: https://developers.forem.com/api/v1

---

### Blogger Setup

1. **Enable Blogger API**:
   - Go to: https://console.cloud.google.com/apis/library/blogger.googleapis.com
   - Click "Enable"

2. **Get API Key**:
   - Go to: https://console.cloud.google.com/apis/credentials
   - Click "Create Credentials" → "API Key"
   - Copy key

3. **Add to `.env.local`**:
   ```env
   BLOGGER_API_KEY=your_api_key_here
   BLOGGER_BLOG_ID=7738556816495172350
   ```

4. **Test**: Posts will auto-cross-post when `publish: true`

**API Docs**: https://developers.google.com/blogger/docs/3.0/reference

---

### IFTTT Setup

1. **Get Webhook Key**:
   - Go to: https://ifttt.com/maker_webhooks
   - Click "Documentation" (or "Connect" if not connected)
   - Find your key (starts with `d...`)
   - Copy the key

2. **Create Applet**:
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
   Or test with blog generation:
   ```bash
   npm run blog:generate
   ```
   Check activity: https://ifttt.com/activity

**Full Guide**: See `IFTTT_SETUP_GUIDE.md`

**Docs**: https://ifttt.com/maker_webhooks

---

### Buffer Setup (via n8n)

1. **Get Access Token**:
   - Go to: https://buffer.com/developers/apps
   - Create app or use existing
   - Get Access Token

2. **Add to `.env.local`** (for reference):
   ```env
   BUFFER_ACCESS_TOKEN=your_token_here
   ```

3. **Configure in n8n**:
   - Open n8n workflow
   - Add Buffer node
   - Use Buffer credentials
   - Select 3 social profiles
   - Map fields from webhook payload

**API Docs**: https://buffer.com/developers/api

---

### Telegram Setup

1. **Create Bot**:
   - Message `@BotFather` on Telegram
   - Send `/newbot`
   - Follow instructions
   - Copy bot token

2. **Get Chat ID**:
   - Message your bot
   - Visit: `https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates`
   - Find `"chat":{"id":123456789}`
   - Copy ID

3. **Add to `.env.local`**:
   ```env
   TELEGRAM_BOT_TOKEN=your_bot_token_here
   TELEGRAM_CHAT_ID=your_chat_id_here
   ```

4. **Test**: Notifications sent automatically

**API Docs**: https://core.telegram.org/bots/api

---

### n8n Workflow Setup

1. **Access n8n**:
   - Go to: https://cryptorafts.app.n8n.cloud/home/workflows

2. **Create Workflow**:
   - Click "New Workflow"
   - Name: "Cryptorafts Blog Automation"

3. **Add Nodes** (see `N8N_WORKFLOW_GUIDE.md`):
   - **Webhook** (trigger)
   - **IF** (duplicate check)
   - **IF** (validation)
   - **HTTP Request** (save to site)
   - **Buffer** (post to socials)
   - **Telegram** (notify admin)
   - **Respond to Webhook**

4. **Activate Workflow**:
   - Toggle switch to activate
   - Copy webhook URL
   - Update `.env.local`: `N8N_WEBHOOK_URL=your_webhook_url`

**Docs**: https://docs.n8n.io

---

## 🧪 Testing

### Test Blog Generation

```bash
npm run blog:generate
```

**Expected**:
- ✅ Post generated
- ✅ Sent to n8n webhook
- ✅ Saved to Firestore
- ✅ Cross-posted to Dev.to (if published + API key set)
- ✅ Cross-posted to Blogger (if published + API key set)
- ✅ IFTTT webhook triggered (if key set)
- ✅ Telegram notification sent (if keys set)

### Test Individual Integrations

**Dev.to**:
- Check: https://dev.to/dashboard
- Look for new article

**Blogger**:
- Check: https://www.blogger.com/blog/posts/7738556816495172350
- Look for new post

**IFTTT**:
- Check: https://ifttt.com/activity
- Look for webhook trigger

**Telegram**:
- Check your Telegram chat
- Should receive notification

**Buffer**:
- Check: https://publish.buffer.com/all-channels
- Look for queued posts

---

## 📊 Environment Variables Checklist

```env
# Firebase (✅ Already Set)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAolg0vzhqmChXs2NTlPu3SQ1zoq3Rigo4
NEXT_PUBLIC_FIREBASE_PROJECT_ID=cryptorafts
# ... (all Firebase vars set)

# Blog Automation (Required)
OPENAI_API_KEY=sk-proj-YOUR_KEY_HERE ⚠️
N8N_WEBHOOK_URL=https://cryptorafts.app.n8n.cloud/webhook/cryptorafts-publish ✅

# Cross-Posting (Optional)
DEVTO_API_KEY=YOUR_KEY_HERE ⚠️
BLOGGER_API_KEY=YOUR_KEY_HERE ⚠️
BLOGGER_BLOG_ID=7738556816495172350 ✅

# Notifications (Optional)
TELEGRAM_BOT_TOKEN=YOUR_TOKEN_HERE ⚠️
TELEGRAM_CHAT_ID=YOUR_CHAT_ID_HERE ⚠️
IFTTT_WEBHOOK_KEY=YOUR_KEY_HERE ⚠️

# Buffer (for n8n)
BUFFER_ACCESS_TOKEN=YOUR_TOKEN_HERE ⚠️

# Firebase Admin (Required)
FIREBASE_SERVICE_ACCOUNT_B64=YOUR_B64_HERE ⚠️
```

---

## 🎯 Deployment Steps

### 1. Local Setup

```powershell
# Run setup script
.\scripts\setup-all-integrations.ps1

# Add API keys to .env.local
# (Edit file manually)

# Test locally
npm run blog:generate
```

### 2. Deploy to Vercel

```bash
# Install Vercel CLI (if not installed)
npm install -g vercel

# Deploy
vercel --prod

# Add environment variables in Vercel Dashboard:
# Settings → Environment Variables
# (Add all variables from .env.local)
```

### 3. Verify Deployment

- ✅ Check Vercel deployment logs
- ✅ Test webhook endpoint
- ✅ Run blog generation
- ✅ Check all platforms for posts

---

## 📚 Documentation Index

- **`INTEGRATIONS_SETUP_GUIDE.md`** - Detailed integration setup
- **`N8N_WORKFLOW_GUIDE.md`** - n8n workflow configuration
- **`BLOG_AUTOMATION_SETUP.md`** - Complete automation guide
- **`QUICK_START_BLOG_AUTOMATION.md`** - 5-minute quick start
- **`DEPLOYMENT_COMPLETE.md`** - Deployment summary

---

## ✅ Status

- ✅ Firebase config updated
- ✅ All integrations implemented
- ✅ Environment file created
- ✅ Cross-posting services ready
- ✅ Notification services ready
- ⏳ **Waiting for**: API keys in `.env.local`

---

## 🎉 Ready!

**Everything is set up!** Just add your API keys and you're ready to deploy.

**Next**: Follow `INTEGRATIONS_SETUP_GUIDE.md` to get all API keys.
