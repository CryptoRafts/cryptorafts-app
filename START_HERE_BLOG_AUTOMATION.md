# 🚀 START HERE: Blog Automation Setup

**Welcome!** This guide will get your automated blog pipeline running in 5 minutes.

---

## ⚡ Quick Setup (5 Minutes)

### 1️⃣ Create `.env.local` File

Copy `.env.example` to `.env.local` and fill in your values:

```bash
# Windows PowerShell
Copy-Item .env.example .env.local

# Linux/Mac
cp .env.example .env.local
```

Then edit `.env.local` and add:
- Your **OpenAI API key** (get from https://platform.openai.com/api-keys)
- Your **n8n webhook URL** (get from n8n dashboard)

### 2️⃣ Test It Works

```bash
npm run blog:generate
```

**Expected output:**
```
🚀 Starting Cursor blog automation...
📝 Generating blog post for topic: crypto
✅ Blog post generated successfully
📤 Sending to n8n webhook...
✅ Automation completed successfully!
```

### 3️⃣ Set Up n8n Workflow

Follow the guide: **`N8N_WORKFLOW_GUIDE.md`**

**Quick version:**
1. Open n8n (cloud or self-hosted)
2. Create workflow → Add Webhook node
3. Copy webhook URL → Paste into `.env.local`
4. Add HTTP Request node → POST to `https://www.cryptorafts.com/api/blog/n8n-webhook`
5. Activate workflow

---

## 📚 Documentation Guide

**New to this?** Read in this order:

1. **`QUICK_START_BLOG_AUTOMATION.md`** ← Start here (5 min)
2. **`N8N_WORKFLOW_GUIDE.md`** ← Configure n8n (10 min)
3. **`BLOG_AUTOMATION_SETUP.md`** ← Full details (30 min)

**Already set up?** Reference:
- **`CURSOR_PROMPT_SHORT.md`** - Copy-paste prompt for Cursor
- **`scripts/README.md`** - Script documentation
- **`BLOG_AUTOMATION_COMPLETE.md`** - Implementation summary

---

## ✅ Checklist

Before you start:
- [ ] Node.js 18+ installed
- [ ] OpenAI API key ready
- [ ] n8n account ready (or self-hosted)
- [ ] Buffer account with 3 social profiles (optional)

After setup:
- [ ] `.env.local` created and configured
- [ ] Test run successful (`npm run blog:generate`)
- [ ] n8n workflow created and activated
- [ ] Post appears in Firestore (check `/admin/blog`)
- [ ] Schedule automation (GitHub Actions/cron/Task Scheduler)

---

## 🎯 What This Does

Your automation will:
1. ✅ Generate blog posts using OpenAI GPT-4
2. ✅ Validate content quality
3. ✅ Check for duplicates
4. ✅ Save to your site (Firestore)
5. ✅ Post to Buffer (3 social accounts)
6. ✅ Notify via Telegram (optional)

---

## 🐛 Having Issues?

### "OPENAI_API_KEY not configured"
→ Add it to `.env.local`

### "Webhook failed"
→ Check n8n workflow is activated

### "Post not appearing"
→ Check Firestore rules, verify duplicate detection

**More help:** See troubleshooting in `BLOG_AUTOMATION_SETUP.md`

---

## 🎉 Ready to Start?

1. **Create `.env.local`** (copy from `.env.example`)
2. **Add your API keys**
3. **Run test**: `npm run blog:generate`
4. **Set up n8n** (follow `N8N_WORKFLOW_GUIDE.md`)

**That's it!** Your blog automation is ready. 🚀

---

**Questions?** Check the full documentation or review the code in `scripts/cursor-blog-automation.ts`.

