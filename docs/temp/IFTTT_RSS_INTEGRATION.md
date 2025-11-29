# 🔗 IFTTT RSS Feed Integration Guide

## ✅ Your RSS Feed URLs

### Main RSS Feed:
```
https://www.cryptorafts.com/feed.xml
```

### Alternative RSS Feed:
```
https://www.cryptorafts.com/api/blog/rss
```

---

## 🔧 How to Add RSS Feed to IFTTT

### Step 1: Create an IFTTT Account
1. Go to [IFTTT.com](https://ifttt.com) and sign up or log in
2. Click "Create" to start building an applet

### Step 2: Set Up RSS Feed Trigger
1. Click **"+ This"** to add a trigger
2. Search for **"RSS Feed"** in the services
3. Select **"RSS Feed"** service
4. Choose trigger: **"New feed item"**
5. Enter your RSS feed URL:
   ```
   https://www.cryptorafts.com/feed.xml
   ```
6. Click **"Create trigger"**

### Step 3: Add Action (What happens when new post is published)
1. Click **"+ That"** to add an action
2. Choose your desired action:
   - **Email** - Send email notification
   - **Twitter** - Post to Twitter
   - **Facebook** - Post to Facebook
   - **Slack** - Send to Slack channel
   - **Google Sheets** - Add to spreadsheet
   - **Webhook** - Send to custom webhook
   - And many more...

### Step 4: Configure and Finish
1. Configure your action settings
2. Click **"Finish"** to activate your applet

---

## ✅ Troubleshooting "Invalid URL" Error

### If IFTTT says the URL is invalid:

1. **Verify RSS Feed is Accessible:**
   - Test the URL in your browser: `https://www.cryptorafts.com/feed.xml`
   - You should see XML content (not a webpage)
   - If you see a webpage or error, the feed isn't working

2. **Check RSS Feed Format:**
   - The feed must return valid RSS 2.0 XML
   - Content-Type header must be `application/rss+xml`
   - Feed must be publicly accessible (no authentication required)

3. **Common Issues:**
   - ❌ Feed not deployed to production server
   - ❌ No published blog posts (feed will still work but show welcome message)
   - ❌ Firewall blocking RSS feed access
   - ❌ SSL certificate issues

4. **Test RSS Feed Locally First:**
   ```bash
   # Test locally
   curl http://localhost:3000/feed.xml
   
   # Should return XML, not JSON
   ```

5. **Deploy to VPS:**
   - Make sure `src/app/feed.xml/route.ts` is uploaded to VPS
   - Restart the app after deployment
   - Test on VPS: `curl https://www.cryptorafts.com/feed.xml`

---

## 📋 RSS Feed Requirements for IFTTT

- ✅ Valid RSS 2.0 XML format
- ✅ Publicly accessible URL
- ✅ HTTPS (preferred) or HTTP
- ✅ Content-Type: `application/rss+xml`
- ✅ At least one `<item>` in the feed
- ✅ Valid XML structure

---

## 🔍 Testing Your RSS Feed

### Test in Browser:
1. Open: `https://www.cryptorafts.com/feed.xml`
2. Should see XML content (not error page)
3. Browser may auto-format the XML

### Test with curl:
```bash
curl -I https://www.cryptorafts.com/feed.xml
# Should return: Content-Type: application/rss+xml
```

### Test with RSS Validator:
- Use [W3C Feed Validator](https://validator.w3.org/feed/)
- Enter your RSS URL
- Check for validation errors

---

## 📱 Alternative: Use RSS Feed in Other Services

### Feedly:
1. Go to [Feedly.com](https://feedly.com)
2. Click "Add Content"
3. Paste RSS URL: `https://www.cryptorafts.com/feed.xml`

### Zapier:
1. Create new Zap
2. Trigger: "RSS Feed" → "New Item in Feed"
3. Enter RSS URL

### Other RSS Readers:
- Inoreader
- The Old Reader
- FeedReader
- Browser RSS extensions

---

## 🎯 Your RSS Feed Details

- **Feed URL:** `https://www.cryptorafts.com/feed.xml`
- **Feed Format:** RSS 2.0
- **Update Frequency:** Every hour (TTL: 60)
- **Max Items:** 50 latest posts
- **Content:** Full post content with HTML
- **Metadata:** Author, category, tags, dates

---

## ✅ Next Steps

1. ✅ Deploy RSS feed files to VPS
2. ✅ Test RSS feed URL in browser
3. ✅ Add RSS feed to IFTTT
4. ✅ Configure IFTTT actions
5. ✅ Test with a new blog post

---

## 📞 Need Help?

If you're still getting "invalid URL" errors:
1. Check that the RSS feed is deployed to production
2. Verify the feed returns XML (not JSON or HTML)
3. Test the URL directly in browser
4. Check VPS logs for errors
5. Ensure at least one blog post is published

