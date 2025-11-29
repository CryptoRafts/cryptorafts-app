# ⚡ Quick Deploy to Vercel - www.cryptorafts.com

## 🎯 Fast Track Deployment (5 Minutes)

### Step 1: Add Environment Variables to Vercel (2 minutes)

1. Go to: **https://vercel.com/anas-s-projects-8d19f880**
2. Click your project → **Settings** → **Environment Variables**
3. Add these variables (set for **Production**, **Preview**, **Development**):

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAo2aRQPZU5naLm4bFCDbqTA1gNW8oFB14
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=cryptorafts-b9067.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=cryptorafts-b9067
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=cryptorafts-b9067.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=374711838796
NEXT_PUBLIC_FIREBASE_APP_ID=1:374711838796:web:3bee725bfa7d8790456ce9
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-ZRQ955RGWH
FIREBASE_SERVICE_ACCOUNT_B64=<get from Firebase Console>
NEXT_PUBLIC_APP_URL=https://www.cryptorafts.com
NODE_ENV=production
ADMIN_EMAIL=anasshamsiggc@gmail.com
SUPER_ADMIN_EMAIL=anasshamsiggc@gmail.com
```

**Get FIREBASE_SERVICE_ACCOUNT_B64:**
- Firebase Console → Project Settings → Service Accounts
- Generate New Private Key → Download JSON
- Convert to Base64:
  ```powershell
  [Convert]::ToBase64String([IO.File]::ReadAllBytes("service-account.json")) | clip
  ```
- Paste into Vercel

---

### Step 2: Deploy (1 minute)

**Option A: Via Dashboard**
1. Go to: **https://vercel.com/anas-s-projects-8d19f880**
2. Click **"Deploy"** or push to GitHub (auto-deploys)

**Option B: Via CLI**
```powershell
.\deploy-vercel.ps1
```

---

### Step 3: Connect Domain (2 minutes)

1. Vercel Dashboard → Your Project → **Settings** → **Domains**
2. Add: `www.cryptorafts.com` and `cryptorafts.com`
3. Configure DNS at your registrar:
   - **CNAME**: `www` → `cname.vercel-dns.com`
   - **A Record**: `@` → `76.76.21.21`
4. Wait 5-60 minutes for DNS propagation

---

## ✅ Done!

Your app is live at: **https://www.cryptorafts.com**

---

## 📚 Full Guide

See `DEPLOY_TO_VERCEL.md` for detailed instructions.

