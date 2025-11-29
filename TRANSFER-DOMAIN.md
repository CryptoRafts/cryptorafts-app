# 🌐 TRANSFER DOMAIN - SIMPLE STEPS

## Current Problem:
- ✅ NEW app works: `cryptorafts-starter-c8rv3j911`
- ❌ OLD domain points to wrong project: `www.cryptorafts.com` → `cryptorafts` project
- ❌ You're seeing OLD cached code with errors

## Solution: Transfer Domain (1 Minute)

### Step 1: Open Vercel Dashboard
I'll open it for you in 3 seconds...

### Step 2: Remove from OLD project
Go to: https://vercel.com/anas-s-projects-8d19f880/cryptorafts/settings/domains

Find these domains and click REMOVE:
- `www.cryptorafts.com` → Click "..." → Remove
- `cryptorafts.com` → Click "..." → Remove

### Step 3: Add to NEW project (Run these commands)
```powershell
vercel domains add www.cryptorafts.com
vercel domains add cryptorafts.com
```

### Step 4: Update Firebase
Go to: https://console.firebase.google.com/project/cryptorafts-b9067/authentication/settings

Add domains:
- `www.cryptorafts.com`
- `cryptorafts.com`

### Step 5: Wait 2 minutes
Then visit: https://www.cryptorafts.com

## ✅ DONE!

Your domain will now point to the WORKING app with NO errors!

