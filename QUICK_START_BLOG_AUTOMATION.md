# ⚡ Quick Start: Blog Automation

**5-minute setup guide** to get your automated blog pipeline running.

---

## 🎯 What You'll Get

- ✅ AI-generated blog posts (OpenAI GPT-4)
- ✅ Automatic posting to your site (Firestore)
- ✅ Buffer integration (3 social accounts)
- ✅ Telegram notifications
- ✅ Duplicate detection & validation
- ✅ Draft/auto-publish modes

---

## 📋 Prerequisites Checklist

Before starting, ensure you have:

- [ ] **OpenAI API key** (from https://platform.openai.com/api-keys)
- [ ] **n8n account** (cloud: cryptorafts.app.n8n.cloud or self-hosted)
- [ ] **Buffer account** with 3 social profiles connected
- [ ] **Telegram bot** (optional, for notifications)

---

## 🚀 Step 1: Environment Setup (2 minutes)

### Create `.env.local` file:

```env
OPENAI_API_KEY=sk-proj-YOUR_KEY_HERE
N8N_WEBHOOK_URL=https://cryptorafts.app.n8n.cloud/webhook/cryptorafts-publish
DEFAULT_PUBLISH_MODE=false
ADMIN_EMAIL=cryptorafts.admin@gmail.com
NEXT_PUBLIC_BASE_URL=https://www.cryptorafts.com
```

**Replace:**
- `YOUR_KEY_HERE` with your OpenAI API key
- Webhook URL with your actual n8n webhook URL (get this in Step 2)

---

## 🔧 Step 2: n8n Webhook Setup (2 minutes)

1. **Open n8n** (cloud or self-hosted)
2. **Create new workflow** → Name: "Cryptorafts Blog"
3. **Add Webhook node** → Method: `POST` → Path: `/cryptorafts-publish`
4. **Copy webhook URL** → Paste into `.env.local` as `N8N_WEBHOOK_URL`
5. **Add HTTP Request node** → POST to `https://www.cryptorafts.com/api/blog/n8n-webhook`
6. **Activate workflow** (toggle switch)

**For full n8n setup**, see `N8N_WORKFLOW_GUIDE.md`

---

## 🧪 Step 3: Test Run (1 minute)

```bash
npm run blog:generate
```

**Expected output:**
```
🚀 Starting Cursor blog automation...
📝 Generating blog post for topic: crypto
✅ Blog post generated successfully
📤 Sending to n8n webhook...
✅ Webhook response: { success: true, postId: "..." }
✅ Automation completed successfully!
```

**Check results:**
- ✅ Post appears in Firestore (check `/admin/blog`)
- ✅ n8n workflow executed (check n8n executions)
- ✅ Post saved as `draft` (since `DEFAULT_PUBLISH_MODE=false`)

---

## 📅 Step 4: Schedule Automation (Optional)

### Option A: Daily Cron (Linux/Mac)

```bash
crontab -e

# Add this line (runs daily at 9 AM):
0 9 * * * cd /path/to/cryptorafts-starter && npm run blog:generate
```

### Option B: Windows Task Scheduler

1. **Task Scheduler** → Create Basic Task
2. **Trigger**: Daily at 9:00 AM
3. **Action**: Start program
4. **Program**: `npm`
5. **Arguments**: `run blog:generate`
6. **Start in**: `C:\Users\dell\cryptorafts-starter`

### Option C: GitHub Actions (Free)

Create `.github/workflows/blog-automation.yml`:

```yaml
name: Blog Automation
on:
  schedule:
    - cron: '0 9 * * *'  # Daily at 9 AM UTC
  workflow_dispatch:
jobs:
  generate-blog:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run blog:generate
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          N8N_WEBHOOK_URL: ${{ secrets.N8N_WEBHOOK_URL }}
          DEFAULT_PUBLISH_MODE: ${{ secrets.DEFAULT_PUBLISH_MODE }}
```

---

## ✅ Step 5: QA & Go Live

### Week 1-2: Draft Mode (QA)

1. **Keep** `DEFAULT_PUBLISH_MODE=false`
2. **Run** automation daily
3. **Review** drafts in `/admin/blog`
4. **Manually publish** quality posts
5. **Note** any issues or improvements

### Week 3+: Auto-Publish

1. **Set** `DEFAULT_PUBLISH_MODE=true` in `.env.local`
2. **Monitor** for 48-72 hours
3. **Adjust** schedule as needed

---

## 🎛️ Configuration Options

### Publish Modes

- **`DEFAULT_PUBLISH_MODE=false`**: All posts saved as drafts (recommended start)
- **`DEFAULT_PUBLISH_MODE=true`**: Posts auto-published if validation passes

### Topics

Edit `scripts/cursor-blog-automation.ts` → `TOPIC_POOL` array to customize topics.

### Schedule Frequency

- **Daily**: Consistent content
- **3x/week**: More curated
- **Weekly**: Minimal automation

---

## 🐛 Troubleshooting

### "OPENAI_API_KEY not configured"

**Fix**: Add `OPENAI_API_KEY` to `.env.local` and restart

### "Webhook failed"

**Fix**: 
1. Check n8n workflow is **activated**
2. Verify webhook URL matches `.env.local`
3. Test webhook with Postman/curl

### "Post not appearing"

**Fix**:
1. Check `/api/blog/n8n-webhook` endpoint logs
2. Verify Firestore rules allow writes
3. Check duplicate detection isn't blocking

---

## 📚 Full Documentation

- **Setup Guide**: `BLOG_AUTOMATION_SETUP.md`
- **n8n Workflow**: `N8N_WORKFLOW_GUIDE.md`
- **Cursor Prompt**: `CURSOR_PROMPT_SHORT.md`
- **Script**: `scripts/cursor-blog-automation.ts`
- **API Endpoint**: `src/app/api/blog/n8n-webhook/route.ts`

---

## 🎉 You're Done!

Your blog automation is ready. Run `npm run blog:generate` to test, then schedule it to run automatically.

**Next Steps:**
1. ✅ Test run completed
2. ✅ Review drafts for quality
3. ✅ Configure Buffer/Telegram (optional)
4. ✅ Enable auto-publish after QA
5. ✅ Monitor and adjust

---

**Questions?** Check the full documentation or review the code in `scripts/cursor-blog-automation.ts`.

