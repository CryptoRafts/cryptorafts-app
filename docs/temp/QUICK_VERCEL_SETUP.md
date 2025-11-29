# ⚡ QUICK VERCEL FIREBASE CREDENTIALS SETUP

## 🎯 5-Minute Setup Guide

### Step 1: Get Firebase Credentials (2 minutes)

1. Visit: https://console.firebase.google.com/project/cryptorafts-b9067/settings/serviceaccounts/adminsdk
2. Click **"Generate New Private Key"**
3. Click **"Generate Key"** in the popup
4. JSON file downloads automatically

### Step 2: Encode to Base64 (30 seconds)

**Windows (PowerShell):**
```powershell
# Navigate to where you downloaded the JSON file
cd Downloads
$content = Get-Content -Path "cryptorafts-b9067-firebase-adminsdk-*.json" -Raw
$base64 = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($content))
$base64 | Set-Clipboard
echo "✅ Copied to clipboard!"
```

**Mac/Linux:**
```bash
# Navigate to where you downloaded the JSON file
cd ~/Downloads
cat cryptorafts-b9067-firebase-adminsdk-*.json | base64 | pbcopy
echo "✅ Copied to clipboard!"
```

**Or use the helper script:**
```bash
# Windows
.\scripts\encode-firebase-credentials.ps1

# Mac/Linux
./scripts/encode-firebase-credentials.sh
```

### Step 3: Add to Vercel (2 minutes)

1. **Go to Vercel**: https://vercel.com/anas-s-projects-8d19f880/settings/environment-variables
2. **Click "Add New"**
3. **Fill in:**
   - **Key**: `FIREBASE_SERVICE_ACCOUNT_B64`
   - **Value**: Paste (Ctrl+V / Cmd+V)
   - **Environments**: ✅ Production ✅ Preview ✅ Development
4. **Click "Save"**
5. **Redeploy**: Go to Deployments → Latest → ⋯ → Redeploy

### Step 4: Test (30 seconds)

1. Visit: https://www.cryptorafts.com/exchange/dashboard
2. Click on a project
3. Click "Accept Pitch"
4. ✅ Should work!

---

## 🆘 Quick Troubleshooting

| Error | Solution |
|-------|----------|
| "Could not load credentials" | Credentials not set - follow steps above |
| "Invalid credentials" | Check Base64 is complete, no truncation |
| Still 500 error | Make sure you redeployed after adding variable |

---

## 📞 Need Help?

Check the detailed guide: `VERCEL_FIREBASE_CREDENTIALS_SETUP.md`

