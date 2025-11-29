# ⚙️ Add Environment Variables to Vercel

## 🚀 Your App is Deployed!

**Live URL**: https://cryptorafts-starter-iphx9ll5p-anas-s-projects-8d19f880.vercel.app

## ⚠️ CRITICAL: Add Environment Variables Now

Your app is deployed but **won't work properly** until you add environment variables.

### Quick Steps:

1. **Go to Vercel Dashboard**:
   - https://vercel.com/anas-s-projects-8d19f880/cryptorafts-starter
   - Or: https://vercel.com/anas-s-projects-8d19f880

2. **Click**: Settings → Environment Variables

3. **Add these variables** (set for **Production**, **Preview**, **Development**):

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAo2aRQPZU5naLm4bFCDbqTA1gNW8oFB14
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=cryptorafts-b9067.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=cryptorafts-b9067
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=cryptorafts-b9067.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=374711838796
NEXT_PUBLIC_FIREBASE_APP_ID=1:374711838796:web:3bee725bfa7d8790456ce9
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-ZRQ955RGWH
NEXT_PUBLIC_APP_URL=https://www.cryptorafts.com
NODE_ENV=production
ADMIN_EMAIL=anasshamsiggc@gmail.com
SUPER_ADMIN_EMAIL=anasshamsiggc@gmail.com
```

4. **Add FIREBASE_SERVICE_ACCOUNT_B64**:
   - Go to Firebase Console → Project Settings → Service Accounts
   - Generate New Private Key → Download JSON
   - Convert to Base64 (PowerShell):
     ```powershell
     [Convert]::ToBase64String([IO.File]::ReadAllBytes("service-account.json")) | clip
     ```
   - Paste into Vercel as `FIREBASE_SERVICE_ACCOUNT_B64`

5. **Redeploy** after adding variables:
   ```powershell
   vercel --prod
   ```

## 🌐 Configure Custom Domain

1. **Vercel Dashboard** → Your Project → **Settings** → **Domains**
2. Add: `www.cryptorafts.com` and `cryptorafts.com`
3. **Configure DNS** at your domain registrar:
   - **CNAME**: `www` → `cname.vercel-dns.com`
   - **A Record**: `@` → `76.76.21.21`
4. Wait 5-60 minutes for DNS propagation

## ✅ After Adding Variables

Your app will be fully functional at:
- **Vercel URL**: https://cryptorafts-starter-iphx9ll5p-anas-s-projects-8d19f880.vercel.app
- **Custom Domain**: https://www.cryptorafts.com (after DNS setup)

## 🎉 Success!

Once environment variables are added and domain is configured, your complete app will be live at **www.cryptorafts.com**!

