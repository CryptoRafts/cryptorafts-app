# 🚨 URGENT: Firebase Admin Credentials Setup Required

## ⚠️ Current Error

You're seeing this error:
```
Database error: Failed to fetch project: Could not load the default credentials
```

**This means**: Firebase Admin credentials are not configured in Vercel.

---

## ✅ Quick Fix (5 Minutes)

### Step 1: Get Firebase Service Account (2 min)

1. **Open**: https://console.firebase.google.com/project/cryptorafts-b9067/settings/serviceaccounts/adminsdk
2. **Click**: "Generate New Private Key"
3. **Confirm**: Click "Generate Key"
4. **Download**: JSON file downloads automatically

### Step 2: Encode to Base64 (30 sec)

**Run this in PowerShell:**
```powershell
cd $env:USERPROFILE\Downloads
$file = Get-ChildItem "cryptorafts-b9067-firebase-adminsdk-*.json" | Select-Object -First 1
$content = Get-Content -Path $file.FullName -Raw
$base64 = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($content))
$base64 | Set-Clipboard
Write-Host "✅ Copied to clipboard!"
```

**Or use the automated script:**
```powershell
.\scripts\auto-setup-firebase.ps1
```

### Step 3: Add to Vercel (2 min)

1. **Go to**: https://vercel.com/anas-s-projects-8d19f880/settings/environment-variables
2. **Click**: "Add New"
3. **Fill in**:
   - **Key**: `FIREBASE_SERVICE_ACCOUNT_B64`
   - **Value**: Paste (Ctrl+V)
   - **Environments**: ✅ Production ✅ Preview ✅ Development
4. **Click**: "Save"
5. **Redeploy**: 
   - Go to "Deployments" tab
   - Click ⋯ on latest deployment
   - Click "Redeploy"

### Step 4: Test (30 sec)

1. Visit: https://www.cryptorafts.com/exchange/dashboard
2. Click on a project
3. Click "Accept Pitch"
4. ✅ Should work!

---

## 🎯 Why This Error Happens

The exchange accept-pitch API route needs Firebase Admin SDK to:
- Verify user authentication tokens
- Update project status in Firestore
- Create chat rooms
- Create notifications
- Create relations between users

All of these require **server-side Admin privileges**, which need credentials.

---

## 📋 Verification Checklist

After setup, verify:

- [ ] Service account JSON downloaded
- [ ] Base64 encoded and copied
- [ ] Variable added to Vercel: `FIREBASE_SERVICE_ACCOUNT_B64`
- [ ] All environments selected
- [ ] Application redeployed
- [ ] Tested accept-pitch functionality

---

## 🆘 Still Having Issues?

1. **Check Vercel Logs**:
   - Go to: https://vercel.com/anas-s-projects-8d19f880
   - Click on latest deployment
   - Check "Logs" tab

2. **Verify Variable Name**:
   - Must be exactly: `FIREBASE_SERVICE_ACCOUNT_B64`
   - Case-sensitive!

3. **Check Base64 String**:
   - Should be very long (several thousand characters)
   - No line breaks or spaces
   - Complete from start to end

4. **Try Individual Variables** (if Base64 doesn't work):
   - `FIREBASE_PROJECT_ID=cryptorafts-b9067`
   - `FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@cryptorafts-b9067.iam.gserviceaccount.com`
   - `FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n`

---

## 📚 More Help

- **Detailed Guide**: `COMPLETE_SETUP_INSTRUCTIONS.md`
- **Quick Guide**: `QUICK_VERCEL_SETUP.md`
- **Automated Script**: `scripts/auto-setup-firebase.ps1`

---

**Once credentials are added and you redeploy, the error will be fixed!** 🎉

