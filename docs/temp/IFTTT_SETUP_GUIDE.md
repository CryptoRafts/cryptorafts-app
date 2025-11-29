# 🔗 IFTTT Webhook Setup Guide

**Complete guide for setting up IFTTT Maker Webhooks for blog automation**

---

## 🎯 What IFTTT Does

IFTTT (If This Then That) will trigger actions when your blog posts are created. Examples:
- Send email notifications
- Post to social media
- Add to Google Sheets
- Send SMS
- Create calendar events
- And 100+ more actions!

---

## 🚀 Quick Setup (5 Minutes)

### Step 1: Get Your Webhook Key

1. **Go to**: https://ifttt.com/maker_webhooks
2. **Click**: "Documentation" (or "Connect" if not connected)
3. **Find your webhook key** - It looks like: `dAbCdEfGhIjKlMnOpQrStUvWxYz`
4. **Copy the key** - You'll need this for `.env.local`

**Direct Link**: https://ifttt.com/maker_webhooks

---

### Step 2: Create Your First Applet

1. **Go to**: https://ifttt.com/create?recommended_services=maker_webhooks
2. **Click**: "If This" → Search for **"Webhooks"**
3. **Select**: "Receive a web request"
4. **Event Name**: Enter `blog_post_created`
5. **Click**: "Create trigger"

**Then That** - Choose what happens:

#### Option A: Email Notification
- **Select**: "Email"
- **Choose**: "Send me an email"
- **Subject**: `New Blog Post: {{Value1}}`
- **Body**: `Title: {{Value1}}\nURL: {{Value2}}\nStatus: {{Value3}}`

#### Option B: Google Sheets Log
- **Select**: "Google Sheets"
- **Choose**: "Add row to spreadsheet"
- **Spreadsheet**: Create or select one
- **Row**: `{{Value1}} | {{Value2}} | {{Value3}}`

#### Option C: Twitter/X Post
- **Select**: "Twitter" or "X"
- **Choose**: "Post a tweet"
- **Tweet**: `New blog post: {{Value1}} - {{Value2}}`

#### Option D: Slack Notification
- **Select**: "Slack"
- **Choose**: "Post a message"
- **Channel**: Your channel
- **Message**: `New blog post: {{Value1}}\n{{Value2}}`

6. **Click**: "Finish"

---

### Step 3: Add Webhook Key to `.env.local`

Edit `.env.local` and add:

```env
IFTTT_WEBHOOK_KEY=your_webhook_key_here
```

**Example**:
```env
IFTTT_WEBHOOK_KEY=dAbCdEfGhIjKlMnOpQrStUvWxYz
```

---

### Step 4: Test It!

```bash
npm run blog:generate
```

**Check IFTTT**:
- Go to: https://ifttt.com/activity
- Look for the webhook trigger
- Verify your action executed (email sent, sheet updated, etc.)

---

## 📋 Webhook Payload Format

When a blog post is created, IFTTT receives:

```json
{
  "value1": "Blog Post Title",
  "value2": "https://www.cryptorafts.com/blog/post-slug",
  "value3": "published" // or "draft"
}
```

**In your IFTTT applet**:
- `{{Value1}}` = Blog post title
- `{{Value2}}` = Blog post URL
- `{{Value3}}` = Status (published/draft)

---

## 🎨 Popular Applet Ideas

### 1. Email Digest
**If**: Webhook `blog_post_created`  
**Then**: Email with post details

### 2. Social Media Auto-Post
**If**: Webhook `blog_post_created`  
**Then**: Post to Twitter/X, LinkedIn, Facebook

### 3. Analytics Log
**If**: Webhook `blog_post_created`  
**Then**: Add row to Google Sheets

### 4. Team Notification
**If**: Webhook `blog_post_created`  
**Then**: Send Slack message

### 5. Calendar Reminder
**If**: Webhook `blog_post_created`  
**Then**: Create calendar event for review

### 6. SMS Alert
**If**: Webhook `blog_post_created`  
**Then**: Send SMS notification

---

## 🔧 Advanced: Multiple Applets

You can create multiple applets for the same event:

1. **Applet 1**: Email notification
2. **Applet 2**: Google Sheets log
3. **Applet 3**: Twitter post
4. **Applet 4**: Slack notification

All will trigger when `blog_post_created` webhook fires!

---

## 🧪 Testing Your Webhook

### Manual Test

Visit this URL (replace `YOUR_KEY` and `YOUR_EVENT`):

```
https://maker.ifttt.com/trigger/blog_post_created/with/key/YOUR_WEBHOOK_KEY?value1=Test+Title&value2=https://example.com&value3=published
```

**Expected**: Your IFTTT applet should trigger!

### Test from Code

```bash
# Test IFTTT webhook
curl -X POST "https://maker.ifttt.com/trigger/blog_post_created/with/key/YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"value1":"Test Title","value2":"https://example.com","value3":"published"}'
```

---

## 📊 Monitoring

### Check Activity Log

1. Go to: https://ifttt.com/activity
2. Filter by "Webhooks"
3. See all triggered events
4. Check success/failure status

### Debug Failed Applets

1. Go to: https://ifttt.com/my_applets
2. Find your applet
3. Click "Settings"
4. Check "Activity" for errors

---

## 🔐 Security Notes

- ✅ Webhook key is private - don't share it
- ✅ Event name is case-sensitive: `blog_post_created`
- ✅ IFTTT has rate limits (check your plan)
- ✅ Free plan: Limited applets and executions

---

## 📚 Resources

- **Maker Webhooks**: https://ifttt.com/maker_webhooks
- **Documentation**: https://ifttt.com/maker_webhooks/trigger
- **Activity Log**: https://ifttt.com/activity
- **My Applets**: https://ifttt.com/my_applets

---

## ✅ Checklist

- [ ] Get webhook key from https://ifttt.com/maker_webhooks
- [ ] Create applet at https://ifttt.com/create?recommended_services=maker_webhooks
- [ ] Event name: `blog_post_created`
- [ ] Add `IFTTT_WEBHOOK_KEY` to `.env.local`
- [ ] Test with `npm run blog:generate`
- [ ] Check activity log: https://ifttt.com/activity
- [ ] Verify action executed successfully

---

## 🎉 Done!

Your IFTTT integration is ready. Every blog post will trigger your IFTTT applets automatically!

**Next**: See `COMPLETE_DEPLOYMENT_GUIDE.md` for full deployment instructions.

