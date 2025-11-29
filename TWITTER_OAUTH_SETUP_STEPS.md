# 🔐 X (Twitter) OAuth Setup - Step by Step Guide

## For Account: @cryptoraftsblog

### **Step 1: Get Twitter Developer API Access**

1. **Go to Twitter Developer Portal:**
   - Visit: https://developer.twitter.com/en/portal/dashboard
   - Sign in with your @cryptoraftsblog account (email: the email you provided, password: shamsi4269)

2. **Apply for Developer Access (if needed):**
   - Click "Sign up" or "Apply"
   - Select "Making a bot" or "Exploring the API"
   - Fill out the application form
   - Wait for approval (usually instant for basic access)

### **Step 2: Create a New App**

1. **Create App:**
   - In the Developer Portal, click "Create App" or "Create Project"
   - Name it: "CryptoRafts Blog Integration"
   - Description: "Auto-posting blog content to X/Twitter"

2. **Get App Credentials:**
   - Note your **API Key** and **API Secret** (if using OAuth 1.0a)
   - OR proceed to OAuth 2.0 setup (recommended)

### **Step 3: Set Up OAuth 2.0**

1. **Go to User Authentication Settings:**
   - In your app settings, find "User authentication settings"
   - Click "Set up" or "Edit"

2. **Configure OAuth 2.0:**
   - **App permissions:** Select "Read and write"
   - **Type of App:** Select "Web App, Automated App or Bot"
   - **Callback URI / Redirect URL:** 
     ```
     https://cryptorafts.com/api/blog/oauth/x/callback
     ```
   - **Website URL:**
     ```
     https://cryptorafts.com
     ```
   - **Save changes**

3. **Get OAuth 2.0 Credentials:**
   - After saving, you'll see:
     - **Client ID** (OAuth 2.0 Client ID)
     - **Client Secret** (OAuth 2.0 Client Secret)
   - **Copy these values** - you'll need them for `.env.local`

### **Step 4: Add Credentials to Your Project**

1. **Open `.env.local` file** in your project root

2. **Add these lines:**
   ```env
   # X (Twitter) OAuth 2.0
   TWITTER_CLIENT_ID=your_client_id_here
   TWITTER_CLIENT_SECRET=your_client_secret_here
   TWITTER_REDIRECT_URI=https://cryptorafts.com/api/blog/oauth/x/callback
   
   # App URL
   NEXT_PUBLIC_APP_URL=https://cryptorafts.com
   ```

3. **Replace the placeholder values** with your actual Client ID and Client Secret

4. **Save the file**

### **Step 5: Connect Your Account**

1. **Start your development server:**
   ```bash
   npm run dev
   ```

2. **Go to Admin Blog Panel:**
   - Visit: http://localhost:3001/admin/blog (or https://cryptorafts.com/admin/blog in production)

3. **Click "Connect" on X (Twitter):**
   - In the "Platform Connections" section
   - Click the "Connect" button for X (Twitter)

4. **Authorize the App:**
   - You'll be redirected to Twitter/X
   - Sign in with @cryptoraftsblog account
   - Click "Authorize app"
   - You'll be redirected back to your admin panel

5. **Verify Connection:**
   - You should see "✅ Connected" status
   - The platform should show as connected

### **Step 6: Test Posting**

1. **Create a Test Blog Post:**
   - Go to `/admin/blog/new`
   - Create a test post
   - Select "X (Twitter)" in platform selection
   - Click "Publish"

2. **Check Your X Account:**
   - Visit https://x.com/cryptoraftsblog
   - You should see the tweet posted!

---

## 🔧 Troubleshooting

### **Issue: "Twitter OAuth 2.0 not configured"**
- **Solution:** Make sure `TWITTER_CLIENT_ID` and `TWITTER_CLIENT_SECRET` are set in `.env.local`
- Restart your development server after adding env variables

### **Issue: "Invalid redirect URI"**
- **Solution:** Make sure the callback URL in Twitter Developer Portal exactly matches:
  ```
  https://cryptorafts.com/api/blog/oauth/x/callback
  ```
- For local development, you might need:
  ```
  http://localhost:3001/api/blog/oauth/x/callback
  ```

### **Issue: "OAuth callback error"**
- **Solution:** 
  - Check that your app has "Read and write" permissions
  - Verify the callback URL is correct
  - Make sure you're using OAuth 2.0 (not OAuth 1.0a)

### **Issue: Can't find OAuth 2.0 settings**
- **Solution:**
  - Make sure you're using the new Twitter Developer Portal (not the old one)
  - Look for "User authentication settings" in your app settings
  - If you only see OAuth 1.0a, you may need to create a new app

---

## 📝 Important Notes

1. **Never commit `.env.local` to git** - it contains sensitive credentials
2. **OAuth 2.0 is more secure** than using passwords directly
3. **Tokens are stored securely** in Firestore, not in your code
4. **You can revoke access** anytime from Twitter Developer Portal

---

## ✅ Success Checklist

- [ ] Twitter Developer account created/accessed
- [ ] App created in Developer Portal
- [ ] OAuth 2.0 configured with correct callback URL
- [ ] Client ID and Client Secret copied
- [ ] Credentials added to `.env.local`
- [ ] Development server restarted
- [ ] Account connected via admin panel
- [ ] Test post published successfully

---

**Once you complete these steps, your @cryptoraftsblog account will be connected and ready to auto-post!**

