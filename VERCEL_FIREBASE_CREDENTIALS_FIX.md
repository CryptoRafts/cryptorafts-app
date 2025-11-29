# 🔧 VERCEL FIREBASE CREDENTIALS FIX

## 🚨 Error You're Seeing

```
Firebase Admin initialization failed: Failed to parse private key: Error: Invalid PEM formatted message.
```

This means the Firebase Admin credentials in Vercel are either:
1. Not set
2. Incorrectly formatted
3. Corrupted during copy/paste

---

## ✅ SOLUTION: Set Firebase Credentials in Vercel

### Option 1: Base64 Encoded Service Account (Recommended)

This is the **easiest and most reliable** method for Vercel deployment.

#### Step 1: Get Your Service Account JSON

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **cryptorafts-b9067**
3. Click **⚙️ Settings** → **Project Settings**
4. Go to **Service Accounts** tab
5. Click **Generate New Private Key**
6. Save the JSON file (e.g., `cryptorafts-b9067-firebase-adminsdk.json`)

#### Step 2: Convert to Base64

**On Windows (PowerShell):**
```powershell
# Navigate to where you saved the JSON file
cd C:\Users\dell\Downloads

# Convert to Base64
$json = Get-Content "cryptorafts-b9067-firebase-adminsdk.json" -Raw
$bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
$base64 = [Convert]::ToBase64String($bytes)
$base64 | Set-Clipboard
Write-Host "✅ Base64 encoded credentials copied to clipboard!"
Write-Host "Length: $($base64.Length) characters"
```

**On Mac/Linux (Terminal):**
```bash
# Navigate to where you saved the JSON file
cd ~/Downloads

# Convert to Base64
base64 -i cryptorafts-b9067-firebase-adminsdk.json | tr -d '\n' | pbcopy
echo "✅ Base64 encoded credentials copied to clipboard!"
```

#### Step 3: Add to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/anas-s-projects-8d19f880/cryptorafts-starter/settings/environment-variables)
2. Click **Add New** → **Environment Variable**
3. Set:
   - **Name:** `FIREBASE_SERVICE_ACCOUNT_B64`
   - **Value:** Paste the Base64 string from clipboard
   - **Environments:** Production, Preview, Development (select all)
4. Click **Save**

#### Step 4: Redeploy

```bash
vercel --prod --yes
```

---

### Option 2: Individual Environment Variables (Alternative)

If Option 1 doesn't work, you can set individual variables.

#### Step 1: Extract Values from Service Account JSON

Open your `cryptorafts-b9067-firebase-adminsdk.json` file and extract:

```json
{
  "project_id": "your-project-id",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com"
}
```

#### Step 2: Add to Vercel

Add these three environment variables in Vercel:

1. **FIREBASE_PROJECT_ID**
   - Value: `cryptorafts-b9067`

2. **FIREBASE_CLIENT_EMAIL**
   - Value: `firebase-adminsdk-xxxxx@cryptorafts-b9067.iam.gserviceaccount.com`

3. **FIREBASE_PRIVATE_KEY**
   - Value: The entire private key including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`
   - **IMPORTANT:** Keep the `\n` characters as literal `\n` (don't convert to actual newlines)

#### Step 3: Redeploy

```bash
vercel --prod --yes
```

---

## 🧪 Quick Test Script

Save this as `test-firebase-admin.js` in your project root:

```javascript
// test-firebase-admin.js
require('dotenv').config();

console.log('🔍 Checking Firebase Admin credentials...\n');

// Check Base64 method
const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64;
if (b64) {
  console.log('✅ FIREBASE_SERVICE_ACCOUNT_B64 is set');
  console.log(`   Length: ${b64.length} characters`);
  try {
    const json = Buffer.from(b64, 'base64').toString('utf8');
    const creds = JSON.parse(json);
    console.log('✅ Base64 decodes to valid JSON');
    console.log(`   Project ID: ${creds.project_id}`);
    console.log(`   Client Email: ${creds.client_email}`);
    console.log(`   Has Private Key: ${!!creds.private_key}`);
  } catch (e) {
    console.error('❌ Base64 is invalid:', e.message);
  }
} else {
  console.log('⚠️  FIREBASE_SERVICE_ACCOUNT_B64 is NOT set');
}

console.log('');

// Check individual env vars method
const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;

if (projectId && clientEmail && privateKey) {
  console.log('✅ Individual Firebase env vars are set');
  console.log(`   FIREBASE_PROJECT_ID: ${projectId}`);
  console.log(`   FIREBASE_CLIENT_EMAIL: ${clientEmail}`);
  console.log(`   FIREBASE_PRIVATE_KEY length: ${privateKey.length}`);
  console.log(`   Has BEGIN marker: ${privateKey.includes('-----BEGIN')}`);
  console.log(`   Has END marker: ${privateKey.includes('-----END')}`);
} else {
  console.log('⚠️  Individual Firebase env vars are NOT all set');
  if (!projectId) console.log('   ❌ FIREBASE_PROJECT_ID missing');
  if (!clientEmail) console.log('   ❌ FIREBASE_CLIENT_EMAIL missing');
  if (!privateKey) console.log('   ❌ FIREBASE_PRIVATE_KEY missing');
}

console.log('\n🎯 Recommendation:');
if (b64) {
  console.log('   Use Base64 method (already configured)');
} else if (projectId && clientEmail && privateKey) {
  console.log('   Use individual env vars method (already configured)');
} else {
  console.log('   Set FIREBASE_SERVICE_ACCOUNT_B64 in Vercel (preferred)');
}
```

Run it locally:
```bash
node test-firebase-admin.js
```

---

## 🔄 Complete Fix Steps

### Step-by-Step Fix for Your Production Error:

1. **Download Firebase Service Account**
   ```
   Firebase Console → Project Settings → Service Accounts → Generate New Private Key
   ```

2. **Convert to Base64 (PowerShell on Windows)**
   ```powershell
   $json = Get-Content "path\to\service-account.json" -Raw
   $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
   $base64 = [Convert]::ToBase64String($bytes)
   $base64 | Set-Clipboard
   ```

3. **Add to Vercel**
   ```
   Vercel Dashboard → Project Settings → Environment Variables
   Add: FIREBASE_SERVICE_ACCOUNT_B64 = [paste Base64 string]
   Select: All environments (Production, Preview, Development)
   Save
   ```

4. **Redeploy**
   ```bash
   vercel --prod --yes
   ```

5. **Test**
   ```
   Visit: https://cryptorafts-starter.vercel.app
   Login and try accepting a project
   ```

---

## 🐛 Common Issues & Solutions

### Issue 1: "Invalid PEM formatted message"
**Cause:** Private key has incorrect newline characters

**Solution:** Use Base64 method (Option 1) - it handles this automatically

### Issue 2: Base64 string too long for Vercel
**Cause:** Service account JSON is too large

**Solution:** Use individual environment variables (Option 2)

### Issue 3: Works locally but not on Vercel
**Cause:** Environment variables not set in Vercel

**Solution:** Check Vercel Dashboard → Settings → Environment Variables

### Issue 4: Still getting errors after setting variables
**Cause:** Need to redeploy for changes to take effect

**Solution:** Run `vercel --prod --yes` to trigger a new deployment

---

## 📋 Checklist

Before deploying, ensure:

- [ ] Firebase service account JSON downloaded
- [ ] JSON converted to Base64 (or individual vars extracted)
- [ ] `FIREBASE_SERVICE_ACCOUNT_B64` added to Vercel (or individual vars)
- [ ] Environment variables set for **all environments** (Production, Preview, Development)
- [ ] Redeployed to Vercel: `vercel --prod --yes`
- [ ] Tested in production by accepting a project

---

## 🚀 Quick Commands

```bash
# Check Vercel environment variables
vercel env ls

# Pull environment variables to local
vercel env pull

# Deploy to production
vercel --prod --yes

# View deployment logs
vercel logs --follow
```

---

## 📞 Still Having Issues?

If you're still getting errors:

1. **Check Vercel Logs:**
   ```bash
   vercel logs --follow
   ```
   Look for Firebase Admin initialization messages

2. **Verify Environment Variables:**
   - Go to Vercel Dashboard
   - Settings → Environment Variables
   - Ensure `FIREBASE_SERVICE_ACCOUNT_B64` is present
   - Check it's enabled for Production environment

3. **Test Locally First:**
   ```bash
   # Add to .env.local
   FIREBASE_SERVICE_ACCOUNT_B64=[your-base64-string]
   
   # Run locally
   npm run dev
   
   # Test accepting a project
   ```

4. **Regenerate Service Account:**
   - Sometimes service accounts expire or get revoked
   - Generate a new one from Firebase Console
   - Convert to Base64 again
   - Update in Vercel

---

## ✅ Expected Result

After fixing, you should see in Vercel logs:

```
🔥 Initializing Firebase Admin with Base64 credentials
✅ Firebase Admin initialized with Base64 credentials
```

And the project acceptance should work without errors! 🎉

---

**Need Help?** Check the Vercel Dashboard logs for detailed error messages.

