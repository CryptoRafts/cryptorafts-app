# 🔥 VERCEL FIREBASE ADMIN CREDENTIALS SETUP GUIDE

## 🎯 Quick Setup Steps

### Step 1: Get Firebase Service Account JSON

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **cryptorafts-b9067**
3. Click the **⚙️ Settings** icon → **Project Settings**
4. Go to the **Service Accounts** tab
5. Click **Generate New Private Key**
6. Click **Generate Key** in the confirmation dialog
7. A JSON file will download (e.g., `cryptorafts-b9067-firebase-adminsdk-xxxxx.json`)

### Step 2: Convert to Base64

#### Option A: Using PowerShell (Windows)
```powershell
# Open PowerShell in the folder where you downloaded the JSON file
$content = Get-Content -Path "cryptorafts-b9067-firebase-adminsdk-xxxxx.json" -Raw -Encoding UTF8
$bytes = [System.Text.Encoding]::UTF8.GetBytes($content)
$base64 = [Convert]::ToBase64String($bytes)
$base64 | Set-Clipboard
Write-Host "✅ Base64 encoded credentials copied to clipboard!"
```

#### Option B: Using Command Line (Mac/Linux)
```bash
# In terminal, navigate to where you downloaded the JSON file
cat cryptorafts-b9067-firebase-adminsdk-xxxxx.json | base64 | pbcopy
echo "✅ Base64 encoded credentials copied to clipboard!"
```

#### Option C: Using Online Tool (if needed)
1. Go to https://www.base64encode.org/
2. Upload your service account JSON file
3. Click "Encode"
4. Copy the result

### Step 3: Add to Vercel Environment Variables

1. **Log in to Vercel**: https://vercel.com/login
2. **Navigate to your project**: https://vercel.com/anas-s-projects-8d19f880
3. **Go to Settings**:
   - Click on your project
   - Click **Settings** in the top navigation
   - Click **Environment Variables** in the left sidebar
4. **Add the variable**:
   - **Key**: `FIREBASE_SERVICE_ACCOUNT_B64`
   - **Value**: Paste the Base64 string you copied
   - **Environments**: Check all three:
     - ✅ Production
     - ✅ Preview  
     - ✅ Development
5. **Click "Save"**
6. **Redeploy your application**:
   - Go to **Deployments** tab
   - Click the **⋯** (three dots) on the latest deployment
   - Click **Redeploy**

### Step 4: Verify It's Working

After redeploying, test the exchange accept-pitch functionality:
1. Go to https://www.cryptorafts.com/exchange/dashboard
2. Click on a project
3. Click "Accept Pitch"
4. It should work without the 500 error!

---

## 🔄 Alternative: Individual Environment Variables

If Base64 encoding doesn't work, you can use individual variables:

### Extract from Service Account JSON

Open your downloaded JSON file and find these values:

```json
{
  "project_id": "cryptorafts-b9067",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@cryptorafts-b9067.iam.gserviceaccount.com"
}
```

### Add to Vercel (3 separate variables):

1. **FIREBASE_PROJECT_ID**
   - Value: `cryptorafts-b9067`
   - Environments: All

2. **FIREBASE_CLIENT_EMAIL**
   - Value: `firebase-adminsdk-xxxxx@cryptorafts-b9067.iam.gserviceaccount.com`
   - Environments: All

3. **FIREBASE_PRIVATE_KEY**
   - Value: `-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n`
   - ⚠️ **Important**: Include the entire key including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`
   - Environments: All

---

## 🛠️ Helper Script (Optional)

I've created a helper script to make this easier. Run it in your project root:

```bash
# Windows PowerShell
.\scripts\encode-firebase-credentials.ps1

# Mac/Linux
chmod +x scripts/encode-firebase-credentials.sh
./scripts/encode-firebase-credentials.sh
```

---

## ✅ Verification Checklist

After setting up, verify:

- [ ] Service account JSON downloaded from Firebase Console
- [ ] Base64 encoded (or individual variables set)
- [ ] Environment variable added to Vercel
- [ ] All environments selected (Production, Preview, Development)
- [ ] Application redeployed
- [ ] Tested accept-pitch functionality

---

## 🆘 Troubleshooting

### Error: "Could not load the default credentials"
- ✅ **Fixed**: This means credentials aren't set. Follow steps above.

### Error: "Invalid credentials"
- Check that the Base64 string is complete (no truncation)
- Verify the JSON file is valid
- Try using individual variables instead

### Error: "Permission denied"
- Check that the service account has proper permissions in Firebase
- Ensure the service account is enabled

### Still not working?
1. Check Vercel deployment logs for errors
2. Verify environment variables are set correctly
3. Make sure you redeployed after adding variables
4. Check that the variable name is exactly: `FIREBASE_SERVICE_ACCOUNT_B64`

---

## 📚 Additional Resources

- [Firebase Admin SDK Documentation](https://firebase.google.com/docs/admin/setup)
- [Vercel Environment Variables Guide](https://vercel.com/docs/concepts/projects/environment-variables)
- [Service Account Best Practices](https://cloud.google.com/iam/docs/service-accounts)

---

## 🔒 Security Notes

- ⚠️ **Never commit** the service account JSON file to git
- ⚠️ **Never share** your credentials publicly
- ✅ Service account JSON is already in `.gitignore`
- ✅ Environment variables in Vercel are encrypted at rest
- ✅ Only use production credentials in production environment

