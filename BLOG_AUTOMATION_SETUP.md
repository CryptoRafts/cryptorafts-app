# 🤖 Blog Automation Pipeline Setup Guide

Complete guide for setting up automated blog post generation using Cursor + OpenAI + n8n.

---

## 📋 Overview

This automation pipeline:
1. **Cursor script** generates AI blog posts using OpenAI
2. **n8n webhook** receives posts, validates, and routes them
3. **Your site** saves posts to Firestore (draft or published)
4. **Buffer** posts to your 3 social accounts
5. **Telegram** notifies admin
6. **Dev.to/Hashnode** (optional) cross-posting

---

## ✅ Prerequisites

Before starting, ensure you have:

- [ ] **OpenAI API key** (set in environment: `OPENAI_API_KEY`)
- [ ] **n8n instance** (cloud: `cryptorafts.app.n8n.cloud` or self-hosted)
- [ ] **n8n webhook URL** created and ready
- [ ] **Buffer account** with 3 social profiles connected
- [ ] **Buffer access token** and profile IDs
- [ ] **Telegram bot token** + chat ID (optional)
- [ ] **Site API endpoint** ready: `/api/blog/n8n-webhook`

---

## 🚀 Step 1: Configure Environment Variables

### For Local Development (.env.local)

```env
# OpenAI Configuration
OPENAI_API_KEY=sk-proj-YOUR_ACTUAL_KEY_HERE

# n8n Webhook URL
N8N_WEBHOOK_URL=https://cryptorafts.app.n8n.cloud/webhook/cryptorafts-publish

# Publish Mode (false = draft, true = auto-publish)
DEFAULT_PUBLISH_MODE=false

# Admin Email (for error notifications)
ADMIN_EMAIL=cryptorafts.admin@gmail.com

# Base URL
NEXT_PUBLIC_BASE_URL=https://www.cryptorafts.com
```

### For Vercel/Production

Add these same variables in **Vercel Dashboard** → **Settings** → **Environment Variables**:
- Set for **Production**, **Preview**, and **Development**
- Redeploy after adding variables

---

## 🎯 Step 2: Set Up n8n Workflow

### 2.1 Create Webhook Node

1. **Open n8n** (cloud or self-hosted)
2. **Create new workflow** → Name: "Cryptorafts Blog Automation"
3. **Add Webhook node** → Set method to `POST`
4. **Copy webhook URL** → Paste into `.env.local` as `N8N_WEBHOOK_URL`

### 2.2 Configure Workflow Nodes

Your n8n workflow should have these nodes in order:

#### **Node 1: Webhook** (Trigger)
- **Method**: POST
- **Path**: `/cryptorafts-publish` (or your custom path)
- **Response Mode**: Respond to Webhook

#### **Node 2: IF → Duplicate Check**
- **Condition**: Check if `{{ $json.sourceId }}` exists in processed IDs
- **Store**: Use Google Sheets, Firestore, or n8n's built-in storage
- **If duplicate**: Exit with `{ "success": false, "duplicate": true }`
- **If new**: Continue to next node

#### **Node 3: IF → Content Validation**
- **Check**: 
  - `{{ $json.content.length }}` >= 500
  - `{{ $json.title.length }}` >= 10
  - Count external links <= 20
- **If invalid**: Set `status = "draft"` and continue
- **If valid**: Continue

#### **Node 4: HTTP Request → Save to Site**
- **Method**: POST
- **URL**: `https://www.cryptorafts.com/api/blog/n8n-webhook`
- **Body**: Map all fields from webhook payload
- **Headers**: 
  ```
  Content-Type: application/json
  ```

#### **Node 5: Buffer Node → Post to Socials**
- **Service**: Buffer API
- **Action**: Create Post
- **Profiles**: Your 3 connected profiles (use profile IDs)
- **Text**: `{{ $json.social.linkedin }}` or `{{ $json.social.x }}`
- **Link**: `{{ $json.canonical_url }}`
- **Schedule**: Now or queue

#### **Node 6: Telegram Node → Notify Admin** (Optional)
- **Bot Token**: Your Telegram bot token
- **Chat ID**: Your admin chat ID
- **Message**: 
  ```
  ✅ New blog post: {{ $json.title }}
  Status: {{ $json.publish ? 'Published' : 'Draft' }}
  Link: {{ $json.canonical_url }}
  ```

#### **Node 7: Respond to Webhook**
- **Response**: 
  ```json
  {
    "success": true,
    "postId": "{{ $json.postId }}",
    "status": "{{ $json.status }}"
  }
  ```

### 2.3 Save and Activate Workflow

- **Save workflow**
- **Activate** (toggle switch in n8n UI)
- **Copy webhook URL** → Use in Cursor script

---

## 📝 Step 3: Configure Cursor Automation

### 3.1 Install Dependencies

```bash
npm install openai dotenv
npm install -D tsx @types/node
```

### 3.2 Run Script Manually (Test)

```bash
npx tsx scripts/cursor-blog-automation.ts
```

### 3.3 Schedule Automation

#### **Option A: Cron Job (Linux/Mac)**

```bash
# Edit crontab
crontab -e

# Add daily at 9 AM
0 9 * * * cd /path/to/cryptorafts-starter && npx tsx scripts/cursor-blog-automation.ts >> logs/blog-automation.log 2>&1
```

#### **Option B: Windows Task Scheduler**

1. **Open Task Scheduler**
2. **Create Basic Task** → Name: "Cryptorafts Blog Automation"
3. **Trigger**: Daily at 9:00 AM
4. **Action**: Start a program
5. **Program**: `npx`
6. **Arguments**: `tsx scripts/cursor-blog-automation.ts`
7. **Start in**: `C:\Users\dell\cryptorafts-starter`

#### **Option C: GitHub Actions (Free)**

Create `.github/workflows/blog-automation.yml`:

```yaml
name: Blog Automation

on:
  schedule:
    - cron: '0 9 * * *'  # Daily at 9 AM UTC
  workflow_dispatch:  # Manual trigger

jobs:
  generate-blog:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npx tsx scripts/cursor-blog-automation.ts
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          N8N_WEBHOOK_URL: ${{ secrets.N8N_WEBHOOK_URL }}
          DEFAULT_PUBLISH_MODE: ${{ secrets.DEFAULT_PUBLISH_MODE }}
```

---

## 🔧 Step 4: Buffer Configuration

### 4.1 Get Buffer Access Token

1. **Go to**: https://buffer.com/developers/apps
2. **Create app** (or use existing)
3. **Get access token** → Save securely

### 4.2 Get Profile IDs

1. **Buffer Dashboard** → **Settings** → **Connected Accounts**
2. **Note profile IDs** for your 3 social accounts
3. **Add to n8n credentials**:
   - Buffer Access Token
   - Profile IDs (comma-separated)

### 4.3 Configure Buffer Node in n8n

- **Service**: Buffer API
- **Authentication**: OAuth2 or Access Token
- **Action**: Create Post
- **Profiles**: Select your 3 profiles
- **Text**: Map from `{{ $json.social.linkedin }}` or `{{ $json.social.x }}`
- **Link**: `{{ $json.canonical_url }}`

---

## 📊 Step 5: Testing & QA

### 5.1 Test with Draft Mode

1. **Set** `DEFAULT_PUBLISH_MODE=false` in `.env.local`
2. **Run script**: `npx tsx scripts/cursor-blog-automation.ts`
3. **Check**:
   - ✅ Post appears in Firestore as `draft`
   - ✅ n8n workflow executed successfully
   - ✅ Buffer queue updated (if configured)
   - ✅ Telegram notification sent (if configured)

### 5.2 Review Drafts

1. **Go to**: `/admin/blog` (your admin panel)
2. **Review** generated posts for 7-14 days
3. **Manually publish** quality posts
4. **Note** any issues or improvements

### 5.3 Enable Auto-Publish

After QA period:
1. **Set** `DEFAULT_PUBLISH_MODE=true`
2. **Monitor** for 48-72 hours
3. **Adjust** schedule frequency as needed

---

## 🎛️ Step 6: Operational Rules

### Duplicate Detection

- **Enabled by default** via `sourceId` check
- **Prevents** reposting same content
- **Stores** processed IDs in Firestore metadata

### Content Validation

- **Minimum**: 500 characters content, 10 characters title
- **Maximum**: 50,000 characters content
- **Links**: Max 20 external links (spam protection)
- **Spam detection**: Blocks titles with spam phrases

### Publish Rules

- **Draft mode** (`publish: false`): All posts saved as drafts
- **Auto-publish** (`publish: true`): Posts published if validation passes
- **Failed validation**: Always saved as draft

### Canonical URLs

- **Format**: `https://www.cryptorafts.com/blog/{slug}`
- **Required** for SEO and cross-posting
- **Prevents** duplicate content penalties

---

## 📈 Monitoring & Maintenance

### Check Logs

```bash
# View automation logs
tail -f logs/blog-automation.log

# Check n8n executions
# → n8n Dashboard → Executions
```

### Monitor Costs

- **OpenAI**: ~$0.01-0.05 per post (GPT-4)
- **n8n Cloud**: Free tier or paid plan
- **Buffer**: Free tier supports 3 profiles

### Adjust Schedule

- **Daily**: Good for consistent content
- **3x/week**: Less frequent, more curated
- **Weekly**: Minimal automation

---

## 🐛 Troubleshooting

### Issue: Script fails with "OPENAI_API_KEY not configured"

**Solution**: Add `OPENAI_API_KEY` to `.env.local` and restart

### Issue: Webhook returns 401 Unauthorized

**Solution**: Check n8n webhook URL is correct and workflow is activated

### Issue: Posts not appearing in Firestore

**Solution**: 
1. Check `/api/blog/n8n-webhook` endpoint logs
2. Verify Firestore rules allow writes
3. Check duplicate detection isn't blocking

### Issue: Buffer posts not sending

**Solution**:
1. Verify Buffer access token is valid
2. Check profile IDs are correct
3. Ensure Buffer node is configured in n8n

---

## ✅ Final Checklist

Before going live:

- [ ] Environment variables configured (local + Vercel)
- [ ] n8n workflow created and activated
- [ ] Webhook URL copied to `.env.local`
- [ ] Buffer credentials added to n8n
- [ ] Telegram bot configured (optional)
- [ ] Test run completed successfully
- [ ] Draft posts reviewed for quality
- [ ] Schedule configured (cron/GitHub Actions)
- [ ] Monitoring set up (logs, n8n executions)

---

## 🎉 You're Ready!

Your automated blog pipeline is now configured. Posts will be generated daily and delivered to your site, Buffer, and Telegram automatically.

**Next Steps**:
1. Run test generation
2. Review drafts for 7-14 days
3. Enable auto-publish
4. Monitor and adjust as needed

---

## 📚 Additional Resources

- **n8n Documentation**: https://docs.n8n.io
- **Buffer API Docs**: https://buffer.com/developers/api
- **OpenAI API Docs**: https://platform.openai.com/docs
- **Cursor Script**: `scripts/cursor-blog-automation.ts`
- **Webhook Endpoint**: `src/app/api/blog/n8n-webhook/route.ts`

