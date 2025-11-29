# 🔗 IFTTT RSS Feed URL Guide

## ❌ Common Mistake

**Wrong URL for IFTTT:**
```
https://www.cryptorafts.com/blog
```
This is a **webpage URL**, not an RSS feed URL. IFTTT will reject it.

---

## ✅ Correct URL for IFTTT

**Use this RSS feed URL:**
```
https://www.cryptorafts.com/feed.xml
```
This is the **RSS feed URL** that IFTTT requires.

---

## 🔍 How to Verify RSS Feed is Working

### Test from VPS:

```bash
# Test API endpoint
curl -I http://localhost:3000/api/blog/rss

# Test feed.xml (via rewrite)
curl -I http://localhost:3000/feed.xml

# Test content
curl http://localhost:3000/feed.xml | head -20
```

### Test from Browser:

1. Open: `https://www.cryptorafts.com/feed.xml`
2. Should see **XML content** (not HTML)
3. Should start with: `<?xml version="1.0" encoding="UTF-8"?>`

### Test from External:

```bash
curl -I https://www.cryptorafts.com/feed.xml
```

Should return:
- HTTP 200 OK
- Content-Type: `application/rss+xml; charset=utf-8`

---

## 📋 IFTTT Requirements

IFTTT RSS Feed service requires:

1. ✅ **RSS feed URL** (not webpage URL)
2. ✅ **Valid RSS 2.0 XML format**
3. ✅ **Publicly accessible** (no authentication)
4. ✅ **Content-Type: application/rss+xml**
5. ✅ **At least one `<item>` tag**

---

## 🚀 Adding to IFTTT (Correct Steps)

1. Go to [IFTTT Create](https://ifttt.com/create)
2. Click **"+ This"**
3. Search for **"RSS Feed"**
4. Choose **"New feed item"**
5. Enter: `https://www.cryptorafts.com/feed.xml`
6. Click **"Create trigger"**

---

## ❌ If IFTTT Still Says "Invalid URL"

### Check 1: Verify RSS Feed is Accessible

```bash
curl -I https://www.cryptorafts.com/feed.xml
```

Should return HTTP 200 OK, not 404.

---

### Check 2: Verify RSS Feed Returns XML

```bash
curl https://www.cryptorafts.com/feed.xml | head -5
```

Should show:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"...
```

---

### Check 3: Verify Content-Type

```bash
curl -I https://www.cryptorafts.com/feed.xml | grep -i content-type
```

Should return:
```
Content-Type: application/rss+xml; charset=utf-8
```

---

### Check 4: Verify Feed Has Items

Open `https://www.cryptorafts.com/feed.xml` in browser
- Should see `<item>` tags
- At least one item is required

---

## 🔧 Troubleshooting

### Issue: RSS Feed Returns 404

**Solution:**
1. Verify `next.config.js` has rewrites
2. Restart PM2: `pm2 restart cryptorafts`
3. Wait 5 seconds for app to start
4. Test again: `curl -I http://localhost:3000/feed.xml`

---

### Issue: RSS Feed Returns HTML

**Solution:**
1. Check if rewrite is working
2. Verify `/api/blog/rss` endpoint exists
3. Check PM2 logs for errors
4. Restart PM2 completely

---

### Issue: RSS Feed Returns JSON

**Solution:**
1. Check route file returns XML (not JSON)
2. Verify Content-Type header is set
3. Check route handler logic

---

### Issue: IFTTT Still Rejects URL

**Possible Causes:**
1. RSS feed not accessible from external
2. Content-Type not correct
3. Feed format invalid
4. No items in feed

**Solution:**
1. Test feed with [W3C Feed Validator](https://validator.w3.org/feed/)
2. Enter: `https://www.cryptorafts.com/feed.xml`
3. Fix any validation errors

---

## ✅ Summary

- **Use:** `https://www.cryptorafts.com/feed.xml` (RSS feed)
- **Don't use:** `https://www.cryptorafts.com/blog` (webpage)

IFTTT requires an RSS feed URL, not a regular webpage URL!

---

## 🎯 Quick Test

```bash
# Test from VPS
curl -I http://localhost:3000/feed.xml

# Should return:
# HTTP/1.1 200 OK
# Content-Type: application/rss+xml; charset=utf-8
```

If this works, use `https://www.cryptorafts.com/feed.xml` in IFTTT!

