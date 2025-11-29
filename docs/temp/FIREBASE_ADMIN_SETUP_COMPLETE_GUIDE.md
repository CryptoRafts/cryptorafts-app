# 🔥 Firebase Admin SDK Setup - Complete Guide

## Why You Need This

The blog auto-posting feature requires Firebase Admin SDK to create blog posts server-side. Without it, you'll see the error:
```
Firebase Admin SDK not configured. 
Please set FIREBASE_SERVICE_ACCOUNT_B64 in Vercel environment variables.
```

---

## ✅ Quick Setup (5 Minutes)

### Step 1: Get Service Account from Firebase Console

1. **Open Firebase Console:**
   - Go to: https://console.firebase.google.com/project/cryptorafts-b9067/settings/serviceaccounts/adminsdk
   - Sign in with your Google account if needed

2. **Generate Service Account:**
   - Click **"Generate new private key"** button
   - Confirm the dialog (click "Generate key")
   - A JSON file will download automatically

3. **Save the File:**
   - The file will be named something like: `cryptorafts-b9067-firebase-adminsdk-xxxxx.json`
   - Save it somewhere safe (e.g., `secrets/service-account.json`)

---

### Step 2: Encode to Base64

**Option A: Using the Helper Script (Recommended)**

```bash
# Run the interactive setup script
node scripts/setup-firebase-admin.js
```

The script will:
- Ask for the path to your service account JSON file
- Validate the file
- Encode it to Base64
- Save it to `secrets/service-account-base64.txt`

**Option B: Quick Encode Script**

```bash
# If you already have the file in secrets/service-account.json
node scripts/encode-service-account.js

# Or specify a custom path
node scripts/encode-service-account.js /path/to/your/service-account.json
```

**Option C: Manual Encoding (Mac/Linux)**

```bash
cat secrets/service-account.json | base64 > secrets/service-account-base64.txt
```

**Option D: Manual Encoding (Windows PowerShell)**

```powershell
$json = Get-Content -Path "secrets\service-account.json" -Raw
$bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
$base64 = [Convert]::ToBase64String($bytes)
$base64 | Out-File -FilePath "secrets\service-account-base64.txt" -Encoding utf8
```

---

### Step 3: Add to Vercel Environment Variables

1. **Go to Vercel Dashboard:**
   - Visit: https://vercel.com/your-project/settings/environment-variables
   - Or navigate: Your Project → Settings → Environment Variables

2. **Add New Variable:**
   - **Key:** `FIREBASE_SERVICE_ACCOUNT_B64`
   - **Value:** Copy the entire Base64 string from `secrets/service-account-base64.txt`
   - **Environment:** Select all three:
     - ✅ Production
     - ✅ Preview  
     - ✅ Development

3. **Save:**
   - Click "Save" or "Add"

---

### Step 4: Redeploy

After adding the environment variable, you need to redeploy:

**Option A: Via Vercel Dashboard**
- Go to your project's Deployments tab
- Click "Redeploy" on the latest deployment
- Or trigger a new deployment by pushing to your repo

**Option B: Via CLI**
```bash
vercel --prod
```

---

## ✅ Verify Setup

After redeploying, test the blog generation:

1. Go to: https://cryptorafts.com/admin/blog
2. Click "Post Now" button
3. It should work without errors!

---

## 🔒 Security Notes

- ⚠️ **Never commit** `secrets/service-account.json` to Git
- ⚠️ **Never commit** `secrets/service-account-base64.txt` to Git
- ✅ The `.gitignore` should already exclude the `secrets/` directory
- ✅ Base64 encoding in Vercel environment variables is secure

---

## 🐛 Troubleshooting

### Error: "Firebase Admin SDK not configured"

**Solution:** Make sure:
1. `FIREBASE_SERVICE_ACCOUNT_B64` is set in Vercel
2. Applied to Production, Preview, and Development
3. Redeployed after adding the variable

### Error: "Invalid service account file"

**Solution:** 
- Make sure you downloaded a real service account (not a template)
- The JSON file should have `project_id`, `private_key`, and `client_email` fields

### Error: "Template credentials detected"

**Solution:**
- You're using a placeholder/template file
- Download a real service account from Firebase Console

### Base64 encoding issues

**Solution:**
- Make sure the entire JSON is on one line when encoding
- Don't add line breaks in the Base64 string
- Use the helper scripts provided

---

## 📋 Checklist

- [ ] Downloaded service account JSON from Firebase Console
- [ ] Saved file to `secrets/service-account.json`
- [ ] Encoded to Base64 (using script or manual method)
- [ ] Added `FIREBASE_SERVICE_ACCOUNT_B64` to Vercel environment variables
- [ ] Applied to Production, Preview, and Development
- [ ] Redeployed the application
- [ ] Tested blog generation (click "Post Now")

---

## 🎉 Success!

Once setup is complete, your blog auto-posting will work perfectly! The system will:
- Generate blog posts automatically
- Use trending topics from Google Trends
- Fall back to template-based generation if OpenAI quota is exceeded
- Create posts in Firestore successfully

---

## 📞 Need Help?

If you encounter any issues:
1. Check Vercel deployment logs
2. Verify the environment variable is set correctly
3. Make sure the service account JSON is valid
4. Try redeploying after making changes

