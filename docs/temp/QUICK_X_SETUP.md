# 🚀 Quick X (Twitter) Setup - Get Credentials & Test

## ⚡ Fast Setup (3 Minutes)

### Step 1: Get Twitter API Credentials

1. **Go to:** https://developer.twitter.com/en/portal/dashboard
2. **Sign in** with your @cryptoraftsblog account
3. **Create App or Use Existing:**
   - Click "Create App" or select existing app
   - Name: "CryptoRafts Blog"
4. **Set up OAuth 2.0:**
   - Go to "User authentication settings"
   - Click "Set up" or "Edit"
   - **App permissions:** "Read and write"
   - **Type of App:** "Web App, Automated App or Bot"
   - **Callback URI:** `https://cryptorafts.com/api/blog/oauth/x/callback`
   - **Website URL:** `https://cryptorafts.com`
   - **Save**
5. **Copy Credentials:**
   - **Client ID** (OAuth 2.0 Client ID)
   - **Client Secret** (OAuth 2.0 Client Secret)

### Step 2: Add Credentials

**Run this command:**
```bash
npm run setup:twitter
```

Then paste your Client ID and Client Secret when prompted.

**OR manually add to `.env.local`:**
```env
TWITTER_CLIENT_ID=your_client_id_here
TWITTER_CLIENT_SECRET=your_client_secret_here
TWITTER_REDIRECT_URI=https://cryptorafts.com/api/blog/oauth/x/callback
NEXT_PUBLIC_APP_URL=https://cryptorafts.com
```

### Step 3: Restart Server & Connect

1. **Restart dev server:**
   ```bash
   npm run dev
   ```

2. **Go to:** http://localhost:3001/admin/blog

3. **Click "Connect"** on X (Twitter)

4. **Authorize** with your account

### Step 4: Test Posting

1. **Create a test blog post**
2. **Select "X (Twitter)"** platform
3. **Publish**
4. **Check** https://x.com/cryptoraftsblog - your tweet should be there! 🎉

---

**Need help?** The setup script will guide you through everything!

