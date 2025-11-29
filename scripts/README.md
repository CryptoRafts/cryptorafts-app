# 📜 Blog Automation Scripts

Scripts for automated blog post generation and scheduling.

---

## 🚀 Main Scripts

### `cursor-blog-automation.ts`
**Main automation script** - Generates blog posts using OpenAI and sends to n8n webhook.

**Usage:**
```bash
npm run blog:generate
# or
npx tsx scripts/cursor-blog-automation.ts
```

**Requirements:**
- `.env.local` file with `OPENAI_API_KEY` and `N8N_WEBHOOK_URL`

---

### `test-blog-automation.ts`
**Test script** - Tests blog generation without sending to webhook.

**Usage:**
```bash
npx tsx scripts/test-blog-automation.ts
```

**What it does:**
- Validates environment variables
- Generates a test blog post
- Validates structure and content quality
- Shows detailed output without sending to webhook

---

## 📅 Scheduling Scripts

### Windows: `schedule-blog-automation.ps1`
**PowerShell script** to create Windows Task Scheduler task.

**Usage:**
```powershell
# Run as Administrator
.\scripts\schedule-blog-automation.ps1

# With options
.\scripts\schedule-blog-automation.ps1 -Schedule Daily -Time "09:00"
```

**Options:**
- `-Schedule`: Daily, Weekly, or Hourly
- `-Time`: Time in HH:mm format (e.g., "09:00")
- `-ProjectPath`: Path to project (default: parent directory)

---

### Linux/Mac: `schedule-blog-automation.sh`
**Shell script** to create cron job.

**Usage:**
```bash
# Make executable (Linux/Mac only)
chmod +x scripts/schedule-blog-automation.sh

# Run
./scripts/schedule-blog-automation.sh
```

**What it does:**
- Interactive menu to select schedule
- Creates cron job
- Sets up log directory
- Shows management commands

---

## 🔧 Configuration

### Environment Variables

Create `.env.local` file in project root:

```env
OPENAI_API_KEY=sk-proj-YOUR_KEY_HERE
N8N_WEBHOOK_URL=https://cryptorafts.app.n8n.cloud/webhook/cryptorafts-publish
DEFAULT_PUBLISH_MODE=false
ADMIN_EMAIL=cryptorafts.admin@gmail.com
NEXT_PUBLIC_BASE_URL=https://www.cryptorafts.com
```

### Package Scripts

Added to `package.json`:
- `npm run blog:generate` - Run automation script

---

## 📊 Logs

### Local Logs
- Scripts output to console
- For scheduled runs, logs go to `logs/blog-automation.log`

### GitHub Actions
- View logs in GitHub Actions tab
- Automatic issue creation on failure

---

## 🐛 Troubleshooting

### "OPENAI_API_KEY not configured"
- Add `OPENAI_API_KEY` to `.env.local`
- Restart terminal/IDE

### "Webhook failed"
- Check n8n workflow is activated
- Verify webhook URL matches `.env.local`
- Test webhook with Postman/curl

### "Cannot find module"
- Run `npm install` to install dependencies
- Check Node.js version (requires 18+)

---

## 📚 Related Documentation

- **Setup Guide**: `../BLOG_AUTOMATION_SETUP.md`
- **Quick Start**: `../QUICK_START_BLOG_AUTOMATION.md`
- **n8n Guide**: `../N8N_WORKFLOW_GUIDE.md`

