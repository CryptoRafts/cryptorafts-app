# 🔐 ENVIRONMENT VARIABLES - PRODUCTION CHECKLIST

## ✅ **REQUIRED FOR DEPLOYMENT:**

### **1. Firebase Client Configuration (Public - Safe to expose)**

These go in Vercel → Project Settings → Environment Variables:

```bash
# Firebase Web App Config
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAo2aRQPZU5naLm4bFCDbqTA1gNW8oFB14
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=cryptorafts-b9067.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=cryptorafts-b9067
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=cryptorafts-b9067.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=374711838796
NEXT_PUBLIC_FIREBASE_APP_ID=1:374711838796:web:3bee725bfa7d8790456ce9
```

**Status:** ✅ These are public and already in `firebase.client.ts` as fallback

---

### **2. Firebase Admin SDK (Private - Keep Secret!)**

**Required for server-side operations:**

```bash
# Method 1: Base64 Encoded Service Account (RECOMMENDED)
FIREBASE_SERVICE_ACCOUNT_B64=your_base64_encoded_service_account_json
```

**How to get this:**
```bash
# 1. Download service account JSON from Firebase Console
https://console.firebase.google.com
→ Project Settings → Service Accounts
→ Generate New Private Key

# 2. Convert to Base64
# Windows PowerShell:
[Convert]::ToBase64String([IO.File]::ReadAllBytes("service-account.json")) | clip

# Mac/Linux:
base64 -i service-account.json | pbcopy

# 3. Paste into Vercel env var
```

**Alternative Method: Individual variables (if Base64 doesn't work)**
```bash
FIREBASE_PROJECT_ID=cryptorafts-b9067
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@cryptorafts-b9067.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYourPrivateKeyHere\n-----END PRIVATE KEY-----\n"
```

**Status:** ⚠️ **MUST BE SET IN VERCEL DASHBOARD**

---

### **3. Application Configuration**

```bash
# App URL (Update with your Vercel domain after first deploy)
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

# Session Secret (Generate with: openssl rand -base64 32)
SESSION_SECRET=your_32_character_or_longer_secret_key_here

# Environment
NODE_ENV=production
```

**Status:** ⚠️ **MUST BE SET IN VERCEL DASHBOARD**

---

## 🎯 **OPTIONAL (For Enhanced Features):**

### **4. RaftAI Service (Optional - AI Features)**

```bash
# RaftAI Service URL (if you deploy the raftai-service separately)
RAFTAI_SERVICE_URL=https://your-raftai-service.vercel.app
RAFTAI_SERVICE_TOKEN=your_secure_token_here
```

**Status:** ⏭️ Optional - App works without this

---

### **5. OpenAI API (Optional - Advanced AI)**

```bash
# OpenAI API Key (for AI-powered features)
OPENAI_API_KEY=sk-...your_openai_api_key
```

**Status:** ⏭️ Optional - RaftAI works without this (uses fallback responses)

---

### **6. Email Configuration (Optional - Notifications)**

```bash
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_specific_password
SMTP_FROM=noreply@cryptorafts.com
```

**Status:** ⏭️ Optional - Email notifications won't work without this

---

### **7. Analytics (Optional - Tracking)**

```bash
# Google Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Vercel Analytics (automatically enabled)
# No config needed!
```

**Status:** ⏭️ Optional - Analytics won't track without this

---

## 📋 **MINIMUM REQUIRED FOR DEPLOYMENT:**

**Absolute Minimum (App will work):**
```bash
✅ NEXT_PUBLIC_FIREBASE_API_KEY (has fallback in code)
✅ NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN (has fallback)
✅ NEXT_PUBLIC_FIREBASE_PROJECT_ID (has fallback)
✅ NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET (has fallback)
✅ NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID (has fallback)
✅ NEXT_PUBLIC_FIREBASE_APP_ID (has fallback)
⚠️ FIREBASE_SERVICE_ACCOUNT_B64 (MUST SET for server features)
⚠️ SESSION_SECRET (MUST SET for sessions)
⚠️ NEXT_PUBLIC_APP_URL (Update after first deploy)
✅ NODE_ENV=production (Vercel sets automatically)
```

---

## 🚀 **HOW TO SET IN VERCEL:**

### **Method 1: Vercel Dashboard (Easiest)**

1. Go to https://vercel.com/dashboard
2. Select your project
3. Click "Settings" → "Environment Variables"
4. Add each variable:
   - **Key:** `FIREBASE_SERVICE_ACCOUNT_B64`
   - **Value:** `eyJhb...` (paste your base64 string)
   - **Environment:** `Production`, `Preview`, `Development` (check all)
5. Click "Save"
6. Repeat for each variable

### **Method 2: Vercel CLI**

```bash
# Set one variable
vercel env add FIREBASE_SERVICE_ACCOUNT_B64 production

# Set from file
vercel env pull .env.production
```

### **Method 3: Import from .env file**

```bash
# Create .env.production locally (DO NOT COMMIT!)
echo "FIREBASE_SERVICE_ACCOUNT_B64=..." > .env.production
echo "SESSION_SECRET=..." >> .env.production

# Upload to Vercel
vercel env pull .env.production
```

---

## ✅ **VERIFICATION CHECKLIST:**

After setting variables in Vercel:

### **Before Deploying:**
- [ ] All required Firebase client vars are set
- [ ] `FIREBASE_SERVICE_ACCOUNT_B64` is set
- [ ] `SESSION_SECRET` is generated and set (32+ chars)
- [ ] `NODE_ENV=production` is set
- [ ] Optional vars added if needed

### **After First Deploy:**
- [ ] Update `NEXT_PUBLIC_APP_URL` with actual Vercel URL
- [ ] Redeploy with updated URL
- [ ] Test login/signup
- [ ] Test chat system
- [ ] Test file uploads
- [ ] Verify Firebase connection

---

## 🔒 **SECURITY BEST PRACTICES:**

### **DO:**
- ✅ Use Base64 encoded service account (one string, no formatting issues)
- ✅ Generate strong SESSION_SECRET (32+ characters)
- ✅ Set different secrets for production vs preview
- ✅ Keep private keys secret (never commit to git)
- ✅ Use Vercel's environment variable encryption

### **DON'T:**
- ❌ Don't commit .env files to git
- ❌ Don't share private keys in public channels
- ❌ Don't use weak SESSION_SECRET
- ❌ Don't expose FIREBASE_SERVICE_ACCOUNT_B64
- ❌ Don't hardcode secrets in code

---

## 🎯 **QUICK SETUP GUIDE:**

### **Step 1: Get Firebase Service Account**
```bash
# 1. Go to Firebase Console
open https://console.firebase.google.com

# 2. Click your project (cryptorafts-b9067)
# 3. Settings → Service Accounts
# 4. Generate New Private Key
# 5. Save as service-account.json
```

### **Step 2: Convert to Base64**
```bash
# Windows:
[Convert]::ToBase64String([IO.File]::ReadAllBytes("service-account.json"))

# Mac/Linux:
base64 -i service-account.json
```

### **Step 3: Generate Session Secret**
```bash
# Windows:
-join ((33..126) | Get-Random -Count 32 | % {[char]$_})

# Mac/Linux:
openssl rand -base64 32
```

### **Step 4: Add to Vercel**
```bash
# Go to Vercel Dashboard
# Project → Settings → Environment Variables
# Add:
# - FIREBASE_SERVICE_ACCOUNT_B64
# - SESSION_SECRET
# - NEXT_PUBLIC_APP_URL (after first deploy)
```

### **Step 5: Deploy!**
```bash
vercel --prod
```

---

## 📊 **CURRENT STATUS:**

**Firebase Client:** ✅ Configured with fallback values in code  
**Firebase Admin:** ⚠️ Needs `FIREBASE_SERVICE_ACCOUNT_B64` in Vercel  
**Session Secret:** ⚠️ Needs `SESSION_SECRET` in Vercel  
**App URL:** ⚠️ Needs `NEXT_PUBLIC_APP_URL` after first deploy  

**Ready to Deploy:** ⚠️ Almost! Just add the 2 required variables to Vercel Dashboard

---

## 🎊 **DEPLOYMENT READY WHEN:**

```
✅ Firebase client vars (already in code as fallback)
✅ FIREBASE_SERVICE_ACCOUNT_B64 added to Vercel
✅ SESSION_SECRET added to Vercel
✅ NEXT_PUBLIC_APP_URL added to Vercel (after first deploy)
```

Then run: `vercel --prod` 🚀

---

**All environment variables documented and ready!** 🔐✨

