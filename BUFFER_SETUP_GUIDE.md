# 🚀 Buffer Setup Guide - Connect Medium & X

## 🎯 Why Use Buffer?

Buffer is perfect for connecting Medium and X because:
- ✅ **Single API** - Manage both platforms from one place
- ✅ **Cross-posting** - Post to multiple platforms simultaneously
- ✅ **Scheduling** - Schedule posts for optimal times
- ✅ **Easy Setup** - Connect accounts through Buffer's UI
- ✅ **No Complex OAuth** - Buffer handles all the OAuth flows

---

## 📋 Step-by-Step Setup

### **Step 1: Create Buffer Account**

1. **Go to:** https://buffer.com/signup
2. **Sign up** for a free account (or use existing)
3. **Verify your email**

### **Step 2: Connect X (Twitter) to Buffer**

1. **Log into Buffer:** https://publish.buffer.com/all-channels
2. **Click "Connect a Channel"** or **"Add Channel"**
3. **Select "X (Twitter)"**
4. **Authorize Buffer** to access your @cryptoraftsblog account
5. **Note the Profile ID** (you'll need this)

### **Step 3: Connect Medium to Buffer**

1. **In Buffer, click "Connect a Channel"** again
2. **Select "Medium"**
3. **Authorize Buffer** to access your Medium account
4. **Note the Profile ID** (you'll need this)

### **Step 4: Get Buffer API Access Token**

1. **Go to:** https://buffer.com/developers/apps/create
2. **Create a new app:**
   - Name: "CryptoRafts Blog Integration"
   - Description: "Auto-posting blog content"
   - Website: https://cryptorafts.com
3. **After creating, go to "Access Tokens"**
4. **Generate a new token** with "publish" scope
5. **Copy the Access Token**

### **Step 5: Get Profile IDs**

**Option A: Via Buffer API (Recommended)**

Run this in your terminal (after adding access token):
```bash
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" https://api.bufferapp.com/1/profiles.json
```

Look for the `id` field for each profile.

**Option B: Via Buffer Dashboard**

1. Go to https://publish.buffer.com/all-channels
2. Click on each connected channel
3. The Profile ID is in the URL or settings

### **Step 6: Add to Your Project**

**Run the setup script:**
```bash
npm run setup:buffer
```

**Or manually add to `.env.local`:**
```env
# Buffer Configuration
BUFFER_ACCESS_TOKEN=your_buffer_access_token_here
BUFFER_PROFILE_IDS=profile_id_for_x,profile_id_for_medium
```

---

## ✅ Verify Setup

```bash
npm run verify:buffer
```

You should see:
- ✅ Buffer Access Token configured
- ✅ X (Twitter) profile connected
- ✅ Medium profile connected

---

## 🎯 Usage

Once set up, your blog will automatically post to both X and Medium via Buffer when you publish!

### **Automatic Posting**

When you publish a blog post:
1. Go to `/admin/blog`
2. Create or edit a post
3. Select "Buffer" in platform selection
4. Click "Publish"
5. Buffer will post to both X and Medium! ✅

### **Manual Posting**

```typescript
// API: POST /api/blog/post/buffer
{
  "title": "Post Title",
  "excerpt": "Post excerpt...",
  "url": "https://cryptorafts.com/blog/post-slug",
  "platforms": ["twitter", "medium"],
  "now": true
}
```

---

## 🔧 Advanced Configuration

### **Post to Specific Platforms Only**

In your blog post metadata, you can specify which platforms:
```json
{
  "platformSelection": {
    "buffer": true,
    "bufferPlatforms": ["twitter", "medium"]
  }
}
```

### **Schedule Posts**

```typescript
{
  "scheduledAt": "2024-01-15T10:00:00Z",
  "platforms": ["twitter", "medium"]
}
```

---

## 📊 Benefits of Using Buffer

1. **Simplified OAuth** - No need to set up OAuth for each platform
2. **Unified Management** - Manage all social accounts in one place
3. **Better Analytics** - Track performance across platforms
4. **Scheduling** - Post at optimal times automatically
5. **Content Optimization** - Buffer optimizes content for each platform

---

## 🆘 Troubleshooting

### **"Buffer service not configured"**
- Make sure `BUFFER_ACCESS_TOKEN` is set in `.env.local`
- Restart dev server after adding

### **"No profiles found"**
- Verify `BUFFER_PROFILE_IDS` are correct
- Make sure profiles are connected in Buffer dashboard
- Check profile IDs match the ones in Buffer

### **Posts not appearing?**
- Check Buffer dashboard for any errors
- Verify profiles are active in Buffer
- Check Buffer API rate limits

---

## 🎉 That's It!

Once set up, Buffer will handle posting to both X and Medium automatically!

**Total setup time: ~10 minutes**

---

**Next:** See `BUFFER_COMPLETE_SETUP.md` for detailed instructions!

