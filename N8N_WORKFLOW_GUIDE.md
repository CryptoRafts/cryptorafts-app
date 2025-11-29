# 🔧 n8n Workflow Configuration Guide

**Complete guide for setting up n8n workflow at https://cryptorafts.app.n8n.cloud/home/workflows**

Step-by-step guide for configuring your n8n workflow to receive blog posts from Cursor and distribute them.

> **📚 For complete setup**: See `N8N_COMPLETE_SETUP_GUIDE.md` for detailed instructions with Firebase integration.

---

## 📋 Workflow Overview

```
Webhook → Duplicate Check → Validation → Save to Site → Buffer → Telegram → Respond
```

---

## 🎯 Node-by-Node Setup

### **Node 1: Webhook (Trigger)**

**Settings:**
- **HTTP Method**: `POST`
- **Path**: `/cryptorafts-publish` (or your custom path)
- **Response Mode**: "Respond to Webhook"
- **Response Data**: "All Incoming Data"

**After Save:**
- Copy the **Webhook URL** (e.g., `https://cryptorafts.app.n8n.cloud/webhook/cryptorafts-publish`)
- Paste into `.env.local` as `N8N_WEBHOOK_URL`

---

### **Node 2: IF → Duplicate Check**

**Condition Type**: "String"

**Condition 1:**
- **Value 1**: `{{ $json.sourceId }}`
- **Operation**: "is not empty"

**Condition 2 (Add):**
- **Value 1**: `{{ $json.sourceId }}`
- **Operation**: "does not exist in"
- **Value 2**: `{{ $("Google Sheets").item.json.processedIds }}` (or your storage)

**If True (Duplicate):**
- Add **Respond to Webhook** node
- Set response: `{ "success": false, "duplicate": true, "sourceId": "{{ $json.sourceId }}" }`
- **Stop and Return**

**If False (New):**
- Continue to next node

**Alternative (Simple):**
- Use **Code** node to check Firestore:
  ```javascript
  const sourceId = $input.item.json.sourceId;
  // Query Firestore for existing post with this sourceId
  // Return { isDuplicate: true/false }
  ```

---

### **Node 3: IF → Content Validation**

**Condition Type**: "Number"

**Condition 1:**
- **Value 1**: `{{ $json.content.length }}`
- **Operation**: "larger"
- **Value 2**: `500`

**Condition 2:**
- **Value 1**: `{{ $json.title.length }}`
- **Operation**: "larger"
- **Value 2**: `10`

**If False (Invalid):**
- Set `{{ $json.publish }}` = `false`
- Continue (will save as draft)

**If True (Valid):**
- Continue normally

---

### **Node 4: HTTP Request → Save to Site**

**Method**: `POST`

**URL**: `https://www.cryptorafts.com/api/blog/n8n-webhook`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "title": "{{ $json.title }}",
  "excerpt": "{{ $json.excerpt }}",
  "content": "{{ $json.content }}",
  "meta_title": "{{ $json.meta_title }}",
  "meta_description": "{{ $json.meta_description }}",
  "canonical_url": "{{ $json.canonical_url }}",
  "slug": "{{ $json.slug }}",
  "tags": "{{ $json.tags }}",
  "category": "{{ $json.category }}",
  "keywords": "{{ $json.keywords }}",
  "social": "{{ $json.social }}",
  "reading_time": "{{ $json.reading_time }}",
  "images": "{{ $json.images }}",
  "claims_to_verify": "{{ $json.claims_to_verify }}",
  "publish": "{{ $json.publish }}",
  "source": "{{ $json.source }}",
  "sourceId": "{{ $json.sourceId }}"
}
```

**Expected Response:**
```json
{
  "success": true,
  "postId": "...",
  "status": "draft" | "published"
}
```

---

### **Node 5: Buffer → Post to Socials**

**Service**: Buffer API

**Authentication:**
- **Type**: OAuth2 or Access Token
- **Access Token**: Your Buffer access token (from Buffer Developer Settings)

**Action**: Create Post

**Profiles:**
- Select your 3 connected profiles (use profile IDs)

**Text:**
- **LinkedIn**: `{{ $json.social.linkedin }}`
- **X/Twitter**: `{{ $json.social.x }}`
- **Telegram**: `{{ $json.social.telegram }}`

**Link**: `{{ $json.canonical_url }}`

**Schedule**: "Now" or "Add to Queue"

**Note**: You may need to create separate Buffer nodes for each platform if Buffer doesn't support multi-profile posting in one node.

---

### **Node 6: Telegram → Notify Admin** (Optional)

**Bot Token**: Your Telegram bot token

**Chat ID**: Your admin chat ID

**Message:**
```
✅ New Blog Post Generated

Title: {{ $json.title }}
Status: {{ $json.publish ? 'Published' : 'Draft' }}
Category: {{ $json.category }}
Link: {{ $json.canonical_url }}

Tags: {{ $json.tags.join(', ') }}
```

**Parse Mode**: Markdown (optional)

---

### **Node 7: Respond to Webhook**

**Response Code**: `200`

**Response Body (JSON):**
```json
{
  "success": true,
  "postId": "{{ $('HTTP Request').item.json.postId }}",
  "status": "{{ $('HTTP Request').item.json.status }}",
  "message": "Post processed successfully"
}
```

---

## 🔐 Credentials Setup

### Buffer Credentials

1. **Go to**: https://buffer.com/developers/apps
2. **Create app** or use existing
3. **Get access token**
4. **In n8n**: Credentials → Add → Buffer API → Paste token

### Telegram Bot Setup

1. **Message** `@BotFather` on Telegram
2. **Create bot**: `/newbot`
3. **Get token**: Copy bot token
4. **Get chat ID**: Message your bot, then visit `https://api.telegram.org/bot<TOKEN>/getUpdates`
5. **In n8n**: Credentials → Add → Telegram → Paste token

---

## ✅ Testing Checklist

- [ ] Webhook URL copied to `.env.local`
- [ ] Webhook node responds to test POST
- [ ] Duplicate check works (test with same `sourceId`)
- [ ] Validation passes/fails correctly
- [ ] Site API saves post successfully
- [ ] Buffer posts appear in queue
- [ ] Telegram notification sent
- [ ] Response returns success JSON

---

## 🐛 Troubleshooting

### Webhook not receiving data

- **Check**: Workflow is **activated** (toggle switch)
- **Check**: Webhook URL matches `.env.local`
- **Test**: Use Postman/curl to POST test data

### Buffer posts not sending

- **Check**: Access token is valid
- **Check**: Profile IDs are correct
- **Check**: Buffer node is configured with correct profiles

### Site API returns error

- **Check**: `/api/blog/n8n-webhook` endpoint exists
- **Check**: Firestore rules allow writes
- **Check**: Required fields are present in payload

---

## 📊 Monitoring

### View Executions

1. **n8n Dashboard** → **Executions**
2. **Filter** by workflow name
3. **Check** success/failure rates
4. **Review** error messages

### Check Logs

- **n8n Cloud**: View execution logs in dashboard
- **Self-hosted**: Check n8n logs directory

---

## 🎉 You're Ready!

Your n8n workflow is configured. Test it by running the Cursor script or sending a test POST to your webhook URL.

For full automation setup, see `BLOG_AUTOMATION_SETUP.md`.

