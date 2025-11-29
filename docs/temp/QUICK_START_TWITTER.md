# 🚀 Quick Start: Connect @cryptoraftsblog to Your Blog

## ⚡ Fast Setup (5 Minutes)

### **Step 1: Get Twitter API Credentials** (2 minutes)

1. **Go to:** https://developer.twitter.com/en/portal/dashboard
2. **Sign in** with your @cryptoraftsblog account
3. **Create a new App:**
   - Click "Create App" or "Create Project"
   - Name: "CryptoRafts Blog"
4. **Set up OAuth 2.0:**
   - Go to "User authentication settings"
   - Permissions: **"Read and write"**
   - App type: **"Web App, Automated App or Bot"**
   - Callback URL: `https://cryptorafts.com/api/blog/oauth/x/callback`
   - Website: `https://cryptorafts.com`
5. **Copy your credentials:**
   - **Client ID** (OAuth 2.0 Client ID)
   - **Client Secret** (OAuth 2.0 Client Secret)

### **Step 2: Add to Project** (1 minute)

1. **Create `.env.local` file** in project root (if it doesn't exist)

2. **Add these lines:**
   ```env
   TWITTER_CLIENT_ID=paste_your_client_id_here
   TWITTER_CLIENT_SECRET=paste_your_client_secret_here
   TWITTER_REDIRECT_URI=https://cryptorafts.com/api/blog/oauth/x/callback
   NEXT_PUBLIC_APP_URL=https://cryptorafts.com
   ```

3. **Save the file**

### **Step 3: Verify Setup** (30 seconds)

Run this command:
```bash
npm run verify:twitter
```

You should see all ✅ green checkmarks!

### **Step 4: Connect Account** (1 minute)

1. **Start your server:**
   ```bash
   npm run dev
   ```

2. **Go to:** http://localhost:3001/admin/blog

3. **Click "Connect"** on X (Twitter) platform

4. **Authorize** with your @cryptoraftsblog account

5. **Done!** ✅

---

## ✅ Test It Out

1. **Create a blog post** at `/admin/blog/new`
2. **Select "X (Twitter)"** in platform selection
3. **Click "Publish"**
4. **Check** https://x.com/cryptoraftsblog - your tweet should be there!

---

## 🆘 Having Issues?

### **"Twitter OAuth 2.0 not configured"**
- Run `npm run verify:twitter` to check your setup
- Make sure `.env.local` has the correct values
- **Restart your dev server** after adding env variables

### **"Invalid redirect URI"**
- Make sure the callback URL in Twitter Developer Portal is exactly:
  ```
  https://cryptorafts.com/api/blog/oauth/x/callback
  ```
- No trailing slashes or extra characters

### **Can't find OAuth 2.0 settings**
- Make sure you're in the **new** Twitter Developer Portal
- Look for "User authentication settings" in your app
- If you only see OAuth 1.0a, create a new app

---

## 📚 Need More Help?

- **Detailed guide:** See `TWITTER_OAUTH_SETUP_STEPS.md`
- **Full integration docs:** See `X_MEDIUM_INTEGRATION_GUIDE.md`

---

**That's it! Your blog will now auto-post to @cryptoraftsblog! 🎉**

