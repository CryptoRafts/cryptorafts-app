# 🔧 Fix RSS Feed for IFTTT Integration

## ❌ Problem: IFTTT Says "Invalid URL"

When you try to add `https://www.cryptorafts.com/feed.xml` to IFTTT, it shows "The URL is invalid".

---

## ✅ Solution Steps

### Step 1: Deploy RSS Feed to VPS

The RSS feed files need to be on your VPS server. Run this PowerShell script:

```powershell
.\UPLOAD_RSS_FEED_TO_VPS.ps1
```

Or manually upload:
```powershell
scp src/app/feed.xml/route.ts root@72.61.98.99:/var/www/cryptorafts/src/app/feed.xml/route.ts
scp src/app/api/blog/rss/route.ts root@72.61.98.99:/var/www/cryptorafts/src/app/api/blog/rss/route.ts
```

---

### Step 2: Restart App on VPS

SSH to your VPS and restart the app:

```bash
ssh root@72.61.98.99
cd /var/www/cryptorafts
pm2 restart cryptorafts
```

---

### Step 3: Test RSS Feed

Test if the feed is working:

```bash
# Test locally on VPS
curl -I http://localhost:3000/feed.xml

# Should return:
# HTTP/1.1 200 OK
# Content-Type: application/rss+xml; charset=utf-8
```

Test from external:
```bash
curl -I https://www.cryptorafts.com/feed.xml
```

---

### Step 4: Verify Feed Content

The feed must return **XML**, not HTML or JSON:

```bash
curl https://www.cryptorafts.com/feed.xml | head -20
```

**Expected output:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>CryptoRafts Blog</title>
    <link>https://www.cryptorafts.com/blog</link>
    ...
```

---

### Step 5: Test with RSS Validator

Validate your RSS feed using W3C Feed Validator:

1. Go to: https://validator.w3.org/feed/
2. Enter your RSS URL: `https://www.cryptorafts.com/feed.xml`
3. Click "Check"
4. Fix any validation errors

---

### Step 6: Add to IFTTT

Once the feed is working:

1. Go to [IFTTT Create](https://ifttt.com/create)
2. Click **"+ This"**
3. Search for **"RSS Feed"**
4. Choose **"New feed item"**
5. Enter: `https://www.cryptorafts.com/feed.xml`
6. Click **"Create trigger"**

---

## 🔍 Troubleshooting

### Issue: Feed returns 404 Not Found

**Solution:**
- Make sure `src/app/feed.xml/route.ts` exists on VPS
- Restart PM2: `pm2 restart cryptorafts`
- Check PM2 logs: `pm2 logs cryptorafts`

---

### Issue: Feed returns HTML instead of XML

**Solution:**
- Check Next.js routing configuration
- Verify the route file is correct
- Ensure `Content-Type: application/rss+xml` header is set

---

### Issue: Feed returns empty or no items

**Solution:**
- The feed will still work but show a welcome message
- Publish at least one blog post: `/admin/blog/new`
- Check Firestore has published posts

---

### Issue: IFTTT still says "Invalid URL"

**Check these:**

1. ✅ Feed is accessible: `curl https://www.cryptorafts.com/feed.xml`
2. ✅ Content-Type is `application/rss+xml`
3. ✅ Feed has valid XML structure
4. ✅ Feed has at least one `<item>` tag
5. ✅ No authentication required (public access)
6. ✅ HTTPS is working (not HTTP)

---

## 📋 Quick Test Commands

Run these on your VPS:

```bash
# Test 1: Check if files exist
ls -la src/app/feed.xml/route.ts
ls -la src/app/api/blog/rss/route.ts

# Test 2: Test feed locally
curl -I http://localhost:3000/feed.xml

# Test 3: Test feed content
curl http://localhost:3000/feed.xml | head -30

# Test 4: Check Content-Type
curl -I http://localhost:3000/feed.xml | grep -i content-type

# Test 5: Test from external
curl -I https://www.cryptorafts.com/feed.xml
```

---

## ✅ Success Checklist

- [ ] RSS feed files uploaded to VPS
- [ ] App restarted with PM2
- [ ] Feed returns HTTP 200 OK
- [ ] Content-Type is `application/rss+xml`
- [ ] Feed returns valid XML
- [ ] Feed has at least one item
- [ ] Feed passes W3C validation
- [ ] IFTTT accepts the URL

---

## 🎯 Expected Results

When everything works:

1. **Browser test:** `https://www.cryptorafts.com/feed.xml` shows XML
2. **curl test:** Returns `Content-Type: application/rss+xml`
3. **IFTTT:** Accepts the URL without errors
4. **RSS readers:** Can subscribe to the feed

---

## 📞 Still Having Issues?

If IFTTT still says "invalid URL" after all steps:

1. **Check VPS logs:**
   ```bash
   pm2 logs cryptorafts --lines 50
   ```

2. **Check Nginx configuration:**
   ```bash
   nginx -t
   cat /etc/nginx/sites-available/cryptorafts
   ```

3. **Test feed manually:**
   ```bash
   curl -v https://www.cryptorafts.com/feed.xml
   ```

4. **Validate RSS format:**
   - Use W3C Feed Validator
   - Check for XML errors
   - Verify all required RSS elements exist

---

## 🔗 Your RSS Feed URL

```
https://www.cryptorafts.com/feed.xml
```

Once this URL returns valid XML, IFTTT will accept it!

