# 🔑 Get Twitter API Credentials - Step by Step

## ✅ You're on the Dashboard!

I can see you have:
- ✅ Project: "Default project-1992058000719110144"
- ✅ App: "1992058000719110144cryptorafts"

## 📋 Next Steps:

### Step 1: Open Your App

1. **Click on the app name** "1992058000719110144cryptorafts" 
   - OR click the **gear icon** (settings) next to it
   - OR click the **key icon** (API keys) next to it

### Step 2: Set Up OAuth 2.0

Once you're in the app settings:

1. **Look for "User authentication settings"** or **"OAuth 2.0"** section
2. **Click "Set up"** or **"Edit"**
3. **Configure these settings:**
   - **App permissions:** Select **"Read and write"**
   - **Type of App:** Select **"Web App, Automated App or Bot"**
   - **Callback URI / Redirect URL:** 
     ```
     https://cryptorafts.com/api/blog/oauth/x/callback
     ```
   - **Website URL:**
     ```
     https://cryptorafts.com
     ```
4. **Click "Save"** or **"Update"**

### Step 3: Get Your Credentials

After saving, you'll see:
- **OAuth 2.0 Client ID** - Copy this!
- **OAuth 2.0 Client Secret** - Copy this! (Click "Regenerate" if needed)

### Step 4: Add to Your Project

**Run this command:**
```bash
npm run setup:twitter
```

Then paste your Client ID and Client Secret when prompted.

**OR manually add to `.env.local`:**
```env
TWITTER_CLIENT_ID=paste_your_client_id_here
TWITTER_CLIENT_SECRET=paste_your_client_secret_here
TWITTER_REDIRECT_URI=https://cryptorafts.com/api/blog/oauth/x/callback
NEXT_PUBLIC_APP_URL=https://cryptorafts.com
```

### Step 5: Test It!

1. **Restart dev server:** `npm run dev`
2. **Go to:** `/admin/blog`
3. **Click "Connect"** on X (Twitter)
4. **Authorize** your account
5. **Create a test post** and select X platform
6. **Publish** - Check your X account! 🎉

---

## 🎯 Quick Checklist

- [ ] Click on app name or gear/key icon
- [ ] Set up OAuth 2.0 with correct settings
- [ ] Copy Client ID and Client Secret
- [ ] Run `npm run setup:twitter` or add to `.env.local`
- [ ] Restart server and connect account
- [ ] Test posting!

---

**Need help?** The key icon or gear icon next to your app name will take you to the settings where you can get your credentials!

