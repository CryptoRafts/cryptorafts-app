# ✅ n8n Workflow Setup Complete

**Everything is ready for your n8n workflow at https://cryptorafts.app.n8n.cloud/home/workflows**

---

## ✅ What's Been Done

### 1. Firebase Configuration Updated ✅
- ✅ Updated to project: `cryptorafts-b9067`
- ✅ All Firebase config files updated
- ✅ `.env.local` updated with correct Firebase config

### 2. n8n Workflow Configuration ✅
- ✅ Complete workflow guide created (`N8N_COMPLETE_SETUP_GUIDE.md`)
- ✅ Workflow JSON export created (`n8n-workflow-export.json`)
- ✅ Step-by-step setup instructions

### 3. Environment Setup ✅
- ✅ `.env.local` updated with Firebase config
- ✅ n8n webhook URL configured: `https://cryptorafts.app.n8n.cloud/webhook/cryptorafts-publish`

---

## 🚀 Quick Setup (Follow These Steps)

### Step 1: Access n8n

1. **Go to**: https://cryptorafts.app.n8n.cloud/home/workflows
2. **Click**: "Add workflow" or "New workflow"
3. **Name**: "Cryptorafts Blog Automation"

---

### Step 2: Create Webhook Trigger

1. **Add Node**: "Webhook"
2. **Configure**:
   - **HTTP Method**: `POST`
   - **Path**: `cryptorafts-publish`
   - **Response Mode**: "Respond to Webhook"
3. **Execute Node** to activate
4. **Copy Webhook URL** (save it)

---

### Step 3: Add Firebase Credentials

1. **Go to**: n8n Settings → Credentials
2. **Add**: "Google Firestore OAuth2 API"
3. **Configure**:
   - **Project ID**: `cryptorafts-b9067`
   - **Service Account**: From Firebase Console
4. **Save** as "Firebase Credentials"

**Get Service Account**:
- https://console.firebase.google.com/project/cryptorafts-b9067/settings/serviceaccounts/adminsdk
- Generate New Private Key → Download JSON

---

### Step 4: Build Workflow

Follow the complete guide: **`N8N_COMPLETE_SETUP_GUIDE.md`**

**Quick version**:
1. **Webhook** (trigger)
2. **IF** → Check `sourceId` exists
3. **Firestore** → Check duplicate by `sourceId`
4. **IF** → Validate content (length > 500)
5. **HTTP Request** → POST to `https://www.cryptorafts.com/api/blog/n8n-webhook`
6. **Buffer** → Post to social media
7. **Telegram** → Send notification
8. **Respond to Webhook** → Return success

---

### Step 5: Import Workflow (Optional)

1. **Download**: `n8n-workflow-export.json`
2. **In n8n**: Click "..." → "Import from File"
3. **Select**: `n8n-workflow-export.json`
4. **Configure**: Credentials
5. **Activate**: Toggle to active

---

## 📋 Firebase Configuration

Your Firebase config is now:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyAo2aRQPZU5naLm4bFCDbqTA1gNW8oFB14",
  authDomain: "cryptorafts-b9067.firebaseapp.com",
  databaseURL: "https://cryptorafts-b9067-default-rtdb.firebaseio.com",
  projectId: "cryptorafts-b9067",
  storageBucket: "cryptorafts-b9067.firebasestorage.app",
  messagingSenderId: "374711838796",
  appId: "1:374711838796:web:3bee725bfa7d8790456ce9",
  measurementId: "G-ZRQ955RGWH"
};
```

✅ All files updated with this config!

---

## 🔧 n8n Workflow Nodes

| Node | Purpose | Configuration |
|------|---------|---------------|
| **Webhook** | Trigger | POST, path: `cryptorafts-publish` |
| **IF** | Check SourceId | `sourceId` is not empty |
| **Firestore** | Duplicate Check | Get by `metadata.sourceId` |
| **IF** | Validate | Content > 500 chars, Title > 10 chars |
| **HTTP Request** | Save to Site | POST to `/api/blog/n8n-webhook` |
| **Buffer** | Social Media | Post to 3 profiles |
| **Telegram** | Notification | Send message |
| **Respond** | Return | Success JSON |

---

## 🧪 Testing

### Test Webhook

```bash
curl -X POST "https://cryptorafts.app.n8n.cloud/webhook/cryptorafts-publish" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Post",
    "content": "<p>This is a test post with enough content.</p>",
    "sourceId": "test-123",
    "publish": false
  }'
```

### Test from Cursor

```bash
npm run blog:generate
```

**Check**:
- n8n executions tab
- Firebase Firestore (blog_posts collection)
- Buffer queue
- Telegram notifications

---

## 📚 Documentation

- **`N8N_COMPLETE_SETUP_GUIDE.md`** - Complete step-by-step guide
- **`n8n-workflow-export.json`** - Workflow JSON (importable)
- **`N8N_WORKFLOW_GUIDE.md`** - Original workflow guide

---

## ✅ Checklist

- [x] Firebase config updated to `cryptorafts-b9067`
- [x] `.env.local` updated
- [x] n8n workflow guide created
- [x] Workflow JSON export created
- [ ] Create workflow in n8n (follow guide)
- [ ] Add Firebase credentials
- [ ] Add Buffer credentials
- [ ] Add Telegram credentials
- [ ] Activate workflow
- [ ] Test webhook

---

## 🎯 Next Steps

1. ✅ Firebase config updated (done)
2. ⏳ Create n8n workflow (follow `N8N_COMPLETE_SETUP_GUIDE.md`)
3. ⏳ Add credentials (Firebase, Buffer, Telegram)
4. ⏳ Activate workflow
5. ⏳ Test: `npm run blog:generate`

---

## 🎉 Ready!

Your Firebase config is updated and n8n workflow guide is ready.

**Next**: Follow `N8N_COMPLETE_SETUP_GUIDE.md` to create your workflow in n8n!

---

**Firebase Project**: `cryptorafts-b9067`  
**n8n URL**: https://cryptorafts.app.n8n.cloud/home/workflows  
**Webhook Path**: `cryptorafts-publish`

