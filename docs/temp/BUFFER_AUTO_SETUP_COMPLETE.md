# 🚀 Buffer Auto Setup - Complete Guide

## ✅ What's Ready

1. **Buffer Integration Code**: ✅ Complete
2. **Auto-Posting System**: ✅ Ready
3. **Profile Fetching Scripts**: ✅ Ready
4. **Token Extraction Script**: ✅ Created

## 📋 Quick Setup (5 minutes)

### Step 1: Sign In to Buffer

1. **Go to**: https://login.buffer.com/login
2. **Sign in** with your Buffer account
   - If you don't have an account, click "Create an account"
   - Use any email to sign up (free plan available)

### Step 2: Get API Access Token

1. **Navigate to**: https://buffer.com/developers/apps
2. **Click**: "My Apps" (or "Create App" if you don't have one)
3. **Create App** (if needed):
   - App name: "CryptoRafts Blog"
   - Website: "https://cryptorafts.com"
   - Click "Create"
4. **Generate Token**:
   - Look for "Access Token" section
   - Click "Generate Access Token" or "Create Token"
   - **Copy the token** (long string like `1/abc123...`)

### Step 3: Extract Token Automatically (Optional)

Instead of manually copying, you can use the automated script:

1. **Stay on**: https://buffer.com/developers/apps (after generating token)
2. **Open browser console** (Press F12)
3. **Run this command**:
   ```bash
   node scripts/extract-buffer-token-browser.js
   ```
4. **Copy the script output** from terminal
5. **Paste it** into the browser console
6. **Token will be extracted and copied to clipboard automatically!**

### Step 4: Connect Social Accounts

1. **Go to**: https://publish.buffer.com
2. **Connect X (Twitter)**:
   - Click "Connect Account" or "+"
   - Select "X (Twitter)"
   - Authorize the connection
3. **Connect LinkedIn**:
   - Click "Connect Account" or "+"
   - Select "LinkedIn"
   - Authorize the connection

### Step 5: Complete Setup

Run this command:
```bash
npm run setup:buffer:complete
```

Then:
- **Paste** your Buffer API access token when prompted
- The script will automatically:
  - ✅ Fetch your connected profiles (X & LinkedIn)
  - ✅ Extract profile IDs
  - ✅ Update `.env.local`
  - ✅ Complete the setup!

## 🎉 After Setup

Once complete:
1. **Restart dev server**: `npm run dev`
2. **Go to**: http://localhost:3001/admin/blog
3. **Create a blog post**
4. **Select "Buffer" platform**
5. **Publish** - posts will automatically go to X and LinkedIn! 🚀

## 📝 Important Notes

- **Access Token** is different from join/referral links
- Token should be from: https://buffer.com/developers/apps
- Token format: Usually starts with `1/` or long alphanumeric string
- Make sure X and LinkedIn are connected in Buffer dashboard first
- Free Buffer plan works perfectly for this integration

## 🔧 Available Scripts

- `npm run setup:buffer:complete` - Complete Buffer setup (recommended)
- `npm run get-buffer-profiles` - Get profile IDs only
- `node scripts/extract-buffer-token-browser.js` - See token extraction script

## ❓ Troubleshooting

**"Invalid access token" error:**
- Make sure you copied the full token
- Token should be from developer portal, not a join link
- Regenerate token if needed

**"No profiles found" error:**
- Make sure X and LinkedIn are connected in Buffer dashboard
- Go to https://publish.buffer.com and verify connections
- Run setup again after connecting accounts

---

**You're almost there!** Just sign in, get the token, connect accounts, and run the setup script! 🎯

