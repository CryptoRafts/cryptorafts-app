# ⚡ Quick IFTTT Setup (2 Minutes)

**Fast setup for IFTTT webhooks**

---

## 🚀 Two Steps

### Step 1: Get Webhook Key

1. Visit: https://ifttt.com/maker_webhooks
2. Click "Documentation"
3. Copy your webhook key

### Step 2: Create Applet

1. Visit: https://ifttt.com/create?recommended_services=maker_webhooks
2. **If This**: Webhooks → "Receive a web request"
3. **Event Name**: `blog_post_created`
4. **Then That**: Choose action (Email, Sheets, Twitter, etc.)
5. **Finish**

---

## ✅ Add to `.env.local`

```env
IFTTT_WEBHOOK_KEY=your_webhook_key_here
```

---

## 🧪 Test

```powershell
.\scripts\test-ifttt-webhook.ps1
```

Or test manually:
```bash
npm run blog:generate
```

Check: https://ifttt.com/activity

---

## 📚 Full Guide

See `IFTTT_SETUP_GUIDE.md` for detailed instructions.

---

**Done!** Your blog posts will now trigger IFTTT automatically. 🎉

