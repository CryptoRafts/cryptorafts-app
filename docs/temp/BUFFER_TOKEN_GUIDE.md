# 🔑 Get Buffer API Access Token

## ✅ Current Status
- Buffer token: ⏳ Need to get API access token
- Buffer profiles: ⏳ Will fetch automatically after token is set

## 🎯 How to Get Buffer API Access Token

### Step 1: Go to Buffer Developer Portal

1. **Navigate to**: https://buffer.com/developers/apps
2. **Sign in** to your Buffer account (or create one if needed)

### Step 2: Create or Access Your App

1. **Click**: "My Apps" or "Create App"
2. If you have an existing app, click on it
3. If you need to create one:
   - Click "Create App"
   - Fill in app name (e.g., "CryptoRafts Blog")
   - Fill in website (e.g., "https://cryptorafts.com")
   - Click "Create"

### Step 3: Generate Access Token

1. In your app settings, look for **"Access Token"** or **"Generate Token"** section
2. Click **"Generate Access Token"** or **"Create Token"**
3. **Copy** the token (it's a long string like: `1/abc123def456...`)

### Step 4: Connect Social Accounts

1. **Go to**: https://publish.buffer.com
2. **Connect** your X (Twitter) account
3. **Connect** your LinkedIn account
4. Make sure both are active and connected

### Step 5: Complete Setup

Run this command:
```bash
npm run setup:buffer:complete
```

Then:
- **Paste** your Buffer API access token when prompted
- The script will automatically:
  - Fetch your connected profiles (X & LinkedIn)
  - Extract profile IDs
  - Update `.env.local`
  - Complete the setup! ✅

## 📝 Important Notes

- **Access Token** ≠ Join/Invite Link
- The token should be a long string starting with something like `1/` or just alphanumeric
- Token should be from: https://buffer.com/developers/apps (not a join link)
- Make sure X and LinkedIn are connected in Buffer dashboard first

## 🎉 After Setup

Once complete:
1. Restart dev server: `npm run dev`
2. Go to: http://localhost:3001/admin/blog
3. Create a blog post
4. Select "Buffer" platform
5. Publish - posts will go to X and LinkedIn! 🚀

---

**Need help?** The token should look like: `1/abc123def456ghi789...` (long alphanumeric string)

