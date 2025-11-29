# 🧪 Test X (Twitter) Posting - Step by Step

## ✅ Credentials Added!

Your Twitter OAuth credentials have been added to `.env.local`.

## 📋 Next Steps to Test:

### Step 1: Restart Development Server

**Stop your current server** (if running) and restart it:

```bash
npm run dev
```

This will load the new credentials.

### Step 2: Connect Your X Account

1. **Go to:** http://localhost:3001/admin/blog
2. **Find** the "Platform Connections" section
3. **Click "Connect"** on **X (Twitter)**
4. **You'll be redirected to X** to authorize
5. **Click "Authorize app"** or "Allow"
6. **You'll be redirected back** - connection confirmed! ✅

### Step 3: Test Posting

1. **Create a test blog post:**
   - Go to `/admin/blog/new` or edit an existing post
   - Fill in:
     - **Title:** "Test Post from CryptoRafts"
     - **Excerpt:** "Testing X integration"
     - **Content:** Any content
   
2. **In the "Platform Selection" section:**
   - ✅ Check **"X (Twitter)"**
   
3. **Click "Publish"**

4. **Check your X account:**
   - Go to: https://x.com/cryptoraftsblog
   - Your tweet should appear! 🎉

### Step 4: Verify Tweet

The tweet should contain:
- Blog post title
- Excerpt
- Link to the blog post
- Hashtags (if you added tags)

---

## 🎯 Quick Test Command

After connecting, you can also test via API:

```bash
curl -X POST http://localhost:3001/api/blog/post/x \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Post",
    "excerpt": "Testing X integration",
    "url": "https://cryptorafts.com/blog/test",
    "hashtags": ["test", "crypto"]
  }'
```

---

## ✅ Success Checklist

- [ ] Credentials added to `.env.local` ✅
- [ ] Server restarted
- [ ] X account connected via OAuth
- [ ] Test post created
- [ ] Tweet appears on @cryptoraftsblog ✅

---

**You're almost there!** Just restart the server, connect your account, and test posting! 🚀

