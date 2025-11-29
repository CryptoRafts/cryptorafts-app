# 🔧 Fix RSS Feed 404 Error

## ❌ Problem: RSS Feed Returns 404

The RSS feed at `https://www.cryptorafts.com/feed.xml` returns 404 Not Found.

**Root Cause:** Next.js App Router doesn't recognize `/feed.xml` as a valid route segment directly.

---

## ✅ Solution: Use Rewrites

I've added rewrites in `next.config.js` to map `/feed.xml` to `/api/blog/rss` which works correctly.

### What Changed:

1. **Added rewrites in next.config.js:**
   - `/feed.xml` → `/api/blog/rss`
   - `/rss` → `/api/blog/rss`
   - `/rss.xml` → `/api/blog/rss`

2. **The API route `/api/blog/rss` already works correctly**

---

## 🚀 Deploy the Fix

### Step 1: Upload updated next.config.js to VPS

```powershell
scp next.config.js root@72.61.98.99:/var/www/cryptorafts/next.config.js
```

### Step 2: SSH to VPS and restart

```bash
ssh root@72.61.98.99
cd /var/www/cryptorafts
pm2 restart cryptorafts
```

### Step 3: Test RSS feed

```bash
# Test locally
curl -I http://localhost:3000/feed.xml

# Should return:
# HTTP/1.1 200 OK
# Content-Type: application/rss+xml; charset=utf-8

# Test content
curl http://localhost:3000/feed.xml | head -20
```

### Step 4: Test from external

```bash
curl -I https://www.cryptorafts.com/feed.xml
```

---

## ✅ Expected Results

After deploying:

- ✅ `https://www.cryptorafts.com/feed.xml` returns RSS XML
- ✅ `https://www.cryptorafts.com/api/blog/rss` still works
- ✅ `https://www.cryptorafts.com/rss` works (alternative)
- ✅ `https://www.cryptorafts.com/rss.xml` works (alternative)
- ✅ IFTTT will accept the RSS feed URL

---

## 📋 Alternative URLs for IFTTT

After deploying, you can use any of these URLs:

1. **Primary:** `https://www.cryptorafts.com/feed.xml`
2. **Alternative:** `https://www.cryptorafts.com/api/blog/rss`
3. **Alternative:** `https://www.cryptorafts.com/rss`
4. **Alternative:** `https://www.cryptorafts.com/rss.xml`

All will work with IFTTT!

---

## 🔍 Verify It's Working

1. **Test in browser:**
   - Open: `https://www.cryptorafts.com/feed.xml`
   - Should see XML content (browser may format it)

2. **Test with curl:**
   ```bash
   curl -I https://www.cryptorafts.com/feed.xml
   # Should return: Content-Type: application/rss+xml
   ```

3. **Add to IFTTT:**
   - Go to [IFTTT Create](https://ifttt.com/create)
   - Click "+ This" → Search "RSS Feed"
   - Enter: `https://www.cryptorafts.com/feed.xml`
   - Should now work!

---

## 🎯 Summary

The fix uses Next.js rewrites to map `/feed.xml` to the working `/api/blog/rss` endpoint. This is the standard way to handle custom file extensions in Next.js App Router.

