# 🔧 Complete n8n Workflow Setup Guide

**Step-by-step guide for setting up your n8n workflow at https://cryptorafts.app.n8n.cloud/home/workflows**

---

## 🎯 Overview

This guide will help you create a complete blog automation workflow in n8n that:
- ✅ Receives blog posts from Cursor automation
- ✅ Checks for duplicates using Firebase
- ✅ Validates content
- ✅ Saves to your site
- ✅ Posts to Buffer (3 social accounts)
- ✅ Sends Telegram notifications

---

## 🚀 Quick Setup (15 Minutes)

### Step 1: Access n8n

1. **Go to**: https://cryptorafts.app.n8n.cloud/home/workflows
2. **Login** (if required)
3. **Click**: "Add workflow" or "New workflow"
4. **Name**: "Cryptorafts Blog Automation"

---

### Step 2: Add Webhook Node (Trigger)

1. **Click**: "+" to add node
2. **Search**: "Webhook"
3. **Select**: "Webhook" node
4. **Configure**:
   - **HTTP Method**: `POST`
   - **Path**: `cryptorafts-publish`
   - **Response Mode**: "Respond to Webhook"
   - **Response Code**: `200`
5. **Click**: "Execute Node" to activate
6. **Copy Webhook URL** - Looks like:
   ```
   https://cryptorafts.app.n8n.cloud/webhook/cryptorafts-publish
   ```
7. **Save this URL** - You'll need it for `.env.local`

---

### Step 3: Add Firebase Credentials

1. **Go to**: n8n Settings → Credentials
2. **Click**: "Add Credential"
3. **Search**: "Google Firestore"
4. **Select**: "Google Firestore OAuth2 API"
5. **Configure**:
   - **Project ID**: `cryptorafts-b9067`
   - **Service Account Email**: (from Firebase service account JSON)
   - **Private Key**: (from Firebase service account JSON)
6. **Name**: "Firebase Credentials"
7. **Save**

**Get Firebase Service Account**:
- Go to: https://console.firebase.google.com/project/cryptorafts-b9067/settings/serviceaccounts/adminsdk
- Click "Generate New Private Key"
- Download JSON file
- Use values from JSON

---

### Step 4: Add Duplicate Check Node

1. **Add Node**: "IF" node
2. **Configure**:
   - **Condition**: String
   - **Value 1**: `{{ $json.sourceId }}`
   - **Operation**: "is not empty"
3. **Connect**: From Webhook to IF node

**If sourceId exists** → Check for duplicate  
**If no sourceId** → Skip duplicate check

---

### Step 5: Add Firebase Duplicate Check

1. **Add Node**: "Google Firestore" node
2. **Configure**:
   - **Operation**: "Get"
   - **Collection**: `blog_posts`
   - **Filter**:
     - **Field**: `metadata.sourceId`
     - **Condition**: "equal"
     - **Value**: `{{ $json.sourceId }}`
3. **Credentials**: Select "Firebase Credentials"
4. **Connect**: From IF node (true path)

**If duplicate found** → Respond with error  
**If no duplicate** → Continue

---

### Step 6: Add Content Validation Node

1. **Add Node**: "IF" node
2. **Configure**:
   - **Condition**: Number
   - **Value 1**: `{{ $json.content.length }}`
   - **Operation**: "larger"
   - **Value 2**: `500`
   - **Add Condition**:
     - **Value 1**: `{{ $json.title.length }}`
     - **Operation**: "larger"
     - **Value 2**: `10`
3. **Connect**: From duplicate check (false path) or from first IF

**If valid** → Continue  
**If invalid** → Set `publish: false` and continue

---

### Step 7: Add HTTP Request Node (Save to Site)

1. **Add Node**: "HTTP Request" node
2. **Configure**:
   - **Method**: `POST`
   - **URL**: `https://www.cryptorafts.com/api/blog/n8n-webhook`
   - **Authentication**: None
   - **Headers**:
     - **Name**: `Content-Type`
     - **Value**: `application/json`
   - **Body**: JSON
   - **JSON Body**: `={{ $json }}`
3. **Connect**: From validation node

This sends the post to your site API.

---

### Step 8: Add Buffer Node (Social Media)

1. **Add Node**: "Buffer" node (or HTTP Request if Buffer node not available)
2. **Configure**:
   - **Operation**: "Create Post"
   - **Profiles**: Select your 3 Buffer profiles
   - **Text**: `={{ $json.social.linkedin || $json.social.x || $json.title }}`
   - **Link**: `={{ $json.canonical_url }}`
   - **Schedule**: "Now"
3. **Credentials**: Add Buffer API credentials
   - **Access Token**: Your Buffer access token
4. **Connect**: From HTTP Request node

**Get Buffer Access Token**:
- Go to: https://buffer.com/developers/apps
- Create app or use existing
- Get access token

---

### Step 9: Add Telegram Notification Node

1. **Add Node**: "Telegram" node
2. **Configure**:
   - **Operation**: "Send Message"
   - **Chat ID**: `{{ $env.TELEGRAM_CHAT_ID }}` or your chat ID
   - **Text**: 
     ```
     ✅ New Blog Post
     
     Title: {{ $json.title }}
     Status: {{ $json.publish ? 'Published' : 'Draft' }}
     Link: {{ $json.canonical_url }}
     ```
   - **Parse Mode**: HTML
3. **Credentials**: Add Telegram Bot credentials
   - **Bot Token**: Your Telegram bot token
4. **Connect**: From Buffer node

---

### Step 10: Add Respond to Webhook Node

1. **Add Node**: "Respond to Webhook" node
2. **Configure**:
   - **Respond With**: JSON
   - **Response Body**:
     ```json
     {
       "success": true,
       "postId": "{{ $json.postId }}",
       "status": "{{ $json.status }}"
     }
     ```
3. **Connect**: From Telegram node

---

### Step 11: Add Error Handling

1. **Add Node**: "Respond to Webhook" node (for duplicates)
2. **Configure**:
   - **Respond With**: JSON
   - **Response Body**:
     ```json
     {
       "success": false,
       "duplicate": true,
       "sourceId": "{{ $json.sourceId }}"
     }
     ```
3. **Connect**: From duplicate check (if duplicate found)

---

### Step 12: Activate Workflow

1. **Toggle**: Switch at top right to "Active"
2. **Test**: Use webhook URL to test
3. **Monitor**: Check executions tab

---

## 📋 Node Configuration Summary

| Node | Type | Key Settings |
|------|------|--------------|
| **Webhook** | Trigger | POST, path: `cryptorafts-publish` |
| **Check SourceId** | IF | `sourceId` is not empty |
| **Check Duplicate** | Firestore | Get by `metadata.sourceId` |
| **Validate Content** | IF | Content length > 500, Title length > 10 |
| **Save to Site** | HTTP Request | POST to `/api/blog/n8n-webhook` |
| **Post to Buffer** | Buffer | Create post with social captions |
| **Telegram** | Telegram | Send notification |
| **Respond** | Respond | Return success JSON |

---

## 🔐 Credentials Needed

### 1. Firebase Credentials
- **Type**: Google Firestore OAuth2 API
- **Project ID**: `cryptorafts-b9067`
- **Service Account**: From Firebase Console

### 2. Buffer Credentials
- **Type**: Buffer API
- **Access Token**: From Buffer Developer Portal

### 3. Telegram Credentials
- **Type**: Telegram Bot API
- **Bot Token**: From @BotFather

---

## 🧪 Testing

### Test Webhook Manually

```bash
curl -X POST "https://cryptorafts.app.n8n.cloud/webhook/cryptorafts-publish" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Post",
    "content": "<p>This is a test post with enough content to pass validation.</p>",
    "sourceId": "test-123",
    "publish": false,
    "canonical_url": "https://www.cryptorafts.com/blog/test",
    "social": {
      "linkedin": "Test post on LinkedIn",
      "x": "Test post on X"
    }
  }'
```

### Test from Cursor Script

```bash
npm run blog:generate
```

Check n8n executions tab for results.

---

## 📊 Workflow Flow

```
Webhook (Trigger)
    ↓
Check SourceId (IF)
    ├─ Yes → Check Duplicate (Firestore)
    │         ├─ Found → Respond Duplicate
    │         └─ Not Found → Validate Content
    └─ No → Validate Content (IF)
              ├─ Valid → Save to Site (HTTP)
              │            ↓
              │         Post to Buffer
              │            ↓
              │         Telegram Notification
              │            ↓
              │         Respond Success
              └─ Invalid → Save as Draft → Continue
```

---

## 🔧 Troubleshooting

### Webhook Not Receiving Data
- ✅ Check workflow is **Active**
- ✅ Verify webhook URL matches `.env.local`
- ✅ Check webhook path is correct

### Firebase Connection Failed
- ✅ Verify service account JSON is correct
- ✅ Check Project ID matches: `cryptorafts-b9067`
- ✅ Ensure Firestore API is enabled

### Buffer Posts Not Sending
- ✅ Verify Buffer access token
- ✅ Check profile IDs are correct
- ✅ Ensure profiles are connected

### Telegram Not Sending
- ✅ Verify bot token
- ✅ Check chat ID is correct
- ✅ Ensure bot has permission

---

## 📚 Resources

- **n8n Docs**: https://docs.n8n.io
- **Firebase Console**: https://console.firebase.google.com/project/cryptorafts-b9067
- **Buffer API**: https://buffer.com/developers/api
- **Telegram Bot API**: https://core.telegram.org/bots/api

---

## ✅ Checklist

- [ ] Created workflow in n8n
- [ ] Added Webhook node (trigger)
- [ ] Configured Firebase credentials
- [ ] Added duplicate check (Firestore)
- [ ] Added content validation
- [ ] Added HTTP Request (save to site)
- [ ] Added Buffer node (social posting)
- [ ] Added Telegram notification
- [ ] Added Respond to Webhook nodes
- [ ] Activated workflow
- [ ] Copied webhook URL to `.env.local`
- [ ] Tested workflow

---

## 🎉 Done!

Your n8n workflow is ready. Every blog post will:
1. ✅ Check for duplicates
2. ✅ Validate content
3. ✅ Save to your site
4. ✅ Post to Buffer
5. ✅ Send Telegram notification

**Next**: Update `.env.local` with your n8n webhook URL and test!

---

## 📝 Import Workflow (Optional)

You can import the workflow JSON:
1. **Download**: `n8n-workflow-export.json`
2. **In n8n**: Click "..." → "Import from File"
3. **Select**: `n8n-workflow-export.json`
4. **Configure**: Credentials and environment variables
5. **Activate**: Toggle workflow to active

**Note**: You'll still need to configure credentials manually.

