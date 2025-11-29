# 🤖 Automated Complete Firebase Setup

## 🚀 One-Command Setup

Just run this single command and follow the prompts:

```powershell
.\scripts\complete-firebase-setup.ps1
```

## What the Script Does

The script will:

1. ✅ **Open Firebase Console** - Automatically opens the service accounts page
2. ✅ **Wait for you** - Pauses while you download the JSON file
3. ✅ **Find the file** - Automatically finds the downloaded JSON in your Downloads folder
4. ✅ **Validate** - Checks that the JSON is valid and complete
5. ✅ **Encode to Base64** - Converts the JSON to Base64 format
6. ✅ **Copy to clipboard** - Automatically copies the Base64 string
7. ✅ **Open Vercel** - Opens the environment variables page
8. ✅ **Guide you** - Shows step-by-step instructions
9. ✅ **Redeploy** - Optionally redeploys for you

## Step-by-Step (What You'll See)

### Step 1: Firebase Console
- Script opens: https://console.firebase.google.com/project/cryptorafts-b9067/settings/serviceaccounts/adminsdk
- You click "Generate New Private Key"
- You download the JSON file
- Press Enter to continue

### Step 2: File Processing
- Script finds your downloaded file automatically
- Validates the JSON
- Shows project ID and client email
- Encodes to Base64
- Copies to clipboard

### Step 3: Vercel Setup
- Script opens: https://vercel.com/anas-s-projects-8d19f880/settings/environment-variables
- You click "Add New"
- You paste (Ctrl+V) the Base64 string
- You select all environments
- You click "Save"
- Press Enter to continue

### Step 4: Redeploy
- Script asks if you want to redeploy
- If yes, runs `vercel --prod` automatically
- If no, reminds you to redeploy manually

## 🎯 That's It!

After running the script and following the prompts, everything will be set up and deployed!

## 🆘 Troubleshooting

### Script can't find the JSON file
- Make sure you downloaded it to your Downloads folder
- Or provide the full path when prompted

### Base64 encoding fails
- Make sure the JSON file is valid
- Try downloading a fresh service account

### Vercel page doesn't open
- Manually go to: https://vercel.com/anas-s-projects-8d19f880/settings/environment-variables
- Follow the instructions shown in the script

## ✅ Success Indicators

After setup, you should see:
- ✅ No "Could not load credentials" errors
- ✅ Exchange accept-pitch works
- ✅ Chat rooms are created
- ✅ All Firebase Admin operations work

---

**Just run the script and follow along!** 🚀

