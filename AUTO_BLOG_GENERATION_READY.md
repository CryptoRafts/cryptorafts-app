# ✅ Auto Blog Generation - Ready!

**Fully automated blog generation using your existing OpenAI service**

---

## 🚀 Quick Start

### Option 1: Use API Endpoint (Recommended)

**Start your dev server**:
```bash
npm run dev
```

**In another terminal, trigger generation**:
```powershell
.\scripts\trigger-auto-blog.ps1
```

**Or use curl**:
```bash
curl -X POST http://localhost:3000/api/blog/generate-auto
```

### Option 2: Use Script Directly

```bash
npm run blog:generate:auto
```

**Note**: Requires `OPENAI_API_KEY` in `.env.local`

---

## ✨ What Happens Automatically

When you trigger the API endpoint:

1. ✅ **Generates blog post** using OpenAI GPT-4
2. ✅ **Selects trending topic** from pool
3. ✅ **Optimizes SEO** (meta tags, canonical URLs)
4. ✅ **Formats for all platforms** (LinkedIn, X, Telegram, Dev.to, Blogger, Buffer)
5. ✅ **Validates content** (word count, links, spam)
6. ✅ **Saves to Firestore** (draft or published)
7. ✅ **Cross-posts** to Dev.to (if published + API key set)
8. ✅ **Cross-posts** to Blogger (if published + API key set)
9. ✅ **Triggers IFTTT** webhook (if key set)
10. ✅ **Sends Telegram** notification (if keys set)
11. ✅ **Sends to n8n** webhook (if URL configured)

---

## 📊 API Endpoint

### POST `/api/blog/generate-auto`

**No parameters needed** - Everything is automatic!

**Response**:
```json
{
  "success": true,
  "postId": "...",
  "title": "...",
  "status": "draft" | "published",
  "canonical_url": "https://www.cryptorafts.com/blog/...",
  "sourceId": "cursor-...",
  "crossPosted": {
    "telegram": true/false,
    "devto": true/false,
    "blogger": true/false,
    "ifttt": true/false,
    "n8n": true/false
  }
}
```

---

## 🎯 Features

### Automatic Topic Selection
- ✅ 15 trending crypto/finance topics
- ✅ Random selection each run
- ✅ Can specify topic in future

### SEO Optimization
- ✅ Meta title ≤ 60 chars
- ✅ Meta description ≤ 155 chars
- ✅ Canonical URLs
- ✅ 5-8 keywords
- ✅ 3-6 tags
- ✅ 3-5 trending hashtags

### Multi-Platform Formatting
- ✅ LinkedIn: 120-200 chars
- ✅ X/Twitter: ≤280 chars
- ✅ Telegram: 1-2 lines
- ✅ Dev.to: Markdown
- ✅ Blogger: HTML
- ✅ Buffer: Universal

### Content Validation
- ✅ 500+ words
- ✅ Title ≥ 10 chars
- ✅ Max 5 external links
- ✅ Spam detection
- ✅ Quality checks

### Duplicate Prevention
- ✅ Unique sourceId per post
- ✅ Timestamp-based IDs
- ✅ Firestore duplicate check

---

## 🧪 Testing

### Test API Endpoint

1. **Start dev server**:
   ```bash
   npm run dev
   ```

2. **Trigger generation**:
   ```powershell
   .\scripts\trigger-auto-blog.ps1
   ```

3. **Check results**:
   - Firestore: `/admin/blog`
   - Dev.to: https://dev.to/dashboard
   - Blogger: https://www.blogger.com/blog/posts/7738556816495172350
   - Telegram: Your chat
   - n8n: Executions tab

---

## 📋 Requirements

### Required
- ✅ OpenAI API key (in environment or `.env.local`)
- ✅ Firebase configured
- ✅ Dev server running (for API endpoint)

### Optional (for cross-posting)
- ⚠️ Dev.to API key
- ⚠️ Blogger API key
- ⚠️ IFTTT webhook key
- ⚠️ Telegram bot token
- ⚠️ n8n webhook URL

---

## 🎯 Usage Examples

### Daily Automation

**GitHub Actions**:
```yaml
- name: Generate Blog Post
  run: |
    curl -X POST https://www.cryptorafts.com/api/blog/generate-auto
```

**Cron**:
```bash
0 9 * * * curl -X POST https://www.cryptorafts.com/api/blog/generate-auto
```

**n8n**:
- Add HTTP Request node
- POST to: `https://www.cryptorafts.com/api/blog/generate-auto`
- Schedule daily

---

## ✅ Status

- ✅ API endpoint created
- ✅ Uses existing OpenAI service
- ✅ All integrations ready
- ✅ Cross-posting configured
- ✅ Validation active
- ✅ Duplicate prevention active

---

## 🎉 Ready!

**Everything is automated!** Just call the API endpoint and it will:
1. Generate blog post
2. Save to Firestore
3. Cross-post to all platforms
4. Send notifications

**Test it**: `.\scripts\trigger-auto-blog.ps1` (with dev server running)

---

**API Endpoint**: `/api/blog/generate-auto`  
**Method**: POST  
**No Parameters**: Fully automatic!

