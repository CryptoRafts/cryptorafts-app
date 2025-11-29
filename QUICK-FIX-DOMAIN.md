# ⚡ QUICK FIX - 2 MINUTES

## Problem:
Domain assigned to **OLD project** (`cryptorafts`), not the working one (`cryptorafts-starter`)

## Fix:

### 1. I OPENED THE PAGE - Remove domains (30 seconds)

In the browser I opened:
1. Find `www.cryptorafts.com` → Click **"Remove"**
2. Find `cryptorafts.com` → Click **"Remove"**

### 2. RUN THESE COMMANDS (30 seconds)

```powershell
vercel domains add www.cryptorafts.com --yes
vercel domains add cryptorafts.com --yes
```

### 3. ADD TO FIREBASE (1 minute)

Go to: https://console.firebase.google.com/project/cryptorafts-b9067/authentication/settings

Add domains:
- `www.cryptorafts.com`
- `cryptorafts.com`

### 4. WAIT 2 MINUTES

Then visit: **https://www.cryptorafts.com**

✅ DONE!

