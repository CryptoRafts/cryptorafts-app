# 🔥 Firebase Admin Setup - Alternative Methods

Since Firebase Console requires Google sign-in (which I cannot do), here are alternative methods:

## Method 1: Use Existing JSON File (Easiest)

If you already have the service account JSON file:

```powershell
.\scripts\setup-with-existing-json.ps1
```

This script will:
- ✅ Accept any existing JSON file path
- ✅ Validate the file
- ✅ Encode to Base64
- ✅ Copy to clipboard
- ✅ Open Vercel for you
- ✅ Optionally redeploy

## Method 2: Manual Download + Script

1. **Download the JSON file manually:**
   - Go to: https://console.firebase.google.com/project/cryptorafts-b9067/settings/serviceaccounts/adminsdk
   - Sign in with your Google account
   - Click "Generate New Private Key"
   - Download the JSON file

2. **Run the setup script:**
   ```powershell
   .\scripts\setup-with-existing-json.ps1
   ```
   - Provide the path to the downloaded JSON file
   - Script handles the rest!

## Method 3: Quick PowerShell One-Liner

If you have the JSON file, you can encode it directly:

```powershell
# Navigate to where your JSON file is
cd $env:USERPROFILE\Downloads

# Find and encode (replace with your actual filename)
$file = Get-ChildItem "cryptorafts-b9067-firebase-adminsdk-*.json" | Select-Object -First 1
$content = Get-Content -Path $file.FullName -Raw
$base64 = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($content))
$base64 | Set-Clipboard

Write-Host "Base64 copied to clipboard! Now add it to Vercel."
```

## Method 4: Using the Complete Setup Script

The complete setup script will:
- Open Firebase Console for you
- Wait for you to download the file
- Process everything automatically

```powershell
.\scripts\complete-firebase-setup.ps1
```

## 📋 What You Need

1. **Firebase Service Account JSON** - Download from Firebase Console
2. **Vercel Access** - To add environment variable
3. **5 Minutes** - To complete the setup

## 🎯 Recommended Approach

**Best for you:** Use Method 1 or 2
- Download the JSON file manually (requires your Google sign-in)
- Run `.\scripts\setup-with-existing-json.ps1`
- Provide the file path
- Everything else is automated!

## ✅ After Setup

Once you've added `FIREBASE_SERVICE_ACCOUNT_B64` to Vercel:
1. Redeploy: `vercel --prod`
2. Test: Visit https://www.cryptorafts.com/exchange/dashboard
3. Try accepting a pitch - it should work!

---

**The scripts handle everything except the initial download (which requires your Google account).**

