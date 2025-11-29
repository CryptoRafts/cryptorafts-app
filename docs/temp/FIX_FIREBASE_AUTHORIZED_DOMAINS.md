# 🔥 FIX: Firebase Unauthorized Domain Error

## ❌ Current Error:
```
Firebase: Error (auth/unauthorized-domain)
The current domain is not authorized for OAuth operations.
Domain: cryptorafts-starter-qt3jlerzh-anas-s-projects-8d19f880.vercel.app
```

---

## ✅ INSTANT FIX (5 minutes)

### Step 1: Open Firebase Console
**URL**: https://console.firebase.google.com/project/cryptorafts-b9067/authentication/settings

### Step 2: Go to Authorized Domains
1. Click **"Authentication"** in left sidebar
2. Click **"Settings"** tab at top
3. Scroll down to **"Authorized domains"** section

### Step 3: Add Your Vercel Domains
Click **"Add domain"** and add these **3 domains**:

```
cryptorafts-starter-qt3jlerzh-anas-s-projects-8d19f880.vercel.app
cryptorafts-starter-g70785zvx-anas-s-projects-8d19f880.vercel.app
cryptorafts-starter-mrfkpl7wg-anas-s-projects-8d19f880.vercel.app
```

### Step 4: Add Wildcard (Recommended)
For future deployments, add:
```
*.vercel.app
```

### Step 5: Save
Click **"Add"** for each domain.

---

## 🎯 Quick Steps (Copy-Paste)

### 1. Open Firebase Console:
```
https://console.firebase.google.com/project/cryptorafts-b9067/authentication/settings
```

### 2. Scroll to "Authorized domains"

### 3. Click "Add domain" and paste:
```
cryptorafts-starter-qt3jlerzh-anas-s-projects-8d19f880.vercel.app
```

### 4. Click "Add domain" again and paste:
```
*.vercel.app
```

### 5. Done! ✅

---

## 🔍 What's Happening?

Firebase requires **pre-authorization** of domains that can use Google Sign-In. Each time Vercel creates a new deployment, it generates a unique URL. You need to add these URLs to Firebase's allowlist.

---

## 📝 Complete Domain List to Add

### Current Deployment URLs:
1. `cryptorafts-starter-qt3jlerzh-anas-s-projects-8d19f880.vercel.app` ⭐ LATEST
2. `cryptorafts-starter-g70785zvx-anas-s-projects-8d19f880.vercel.app`
3. `cryptorafts-starter-mrfkpl7wg-anas-s-projects-8d19f880.vercel.app`

### Development:
4. `localhost` (already should be there)

### Wildcard (Recommended):
5. `*.vercel.app` (covers all future deployments)

---

## 🎬 Visual Guide

### Step-by-Step Screenshots:

**1. Firebase Console Homepage**
```
https://console.firebase.google.com
→ Select "cryptorafts-b9067" project
```

**2. Authentication Section**
```
Left Sidebar → Authentication
Top Menu → Settings (gear icon)
```

**3. Authorized Domains Section**
```
Scroll down → "Authorized domains"
You'll see: localhost, cryptorafts-b9067.firebaseapp.com
```

**4. Add Domain Button**
```
Click "Add domain" (blue button)
Paste domain URL
Click "Add"
```

**5. Verify**
```
You should see your new domain in the list
Status: Active ✅
```

---

## ⚡ After Adding Domains

### 1. Wait 1-2 Minutes
Firebase needs to propagate the changes.

### 2. Clear Browser Cache
```
Ctrl+Shift+Delete (Windows)
Cmd+Shift+Delete (Mac)
Clear "Cached images and files"
```

### 3. Test Admin Login
```
https://cryptorafts-starter-qt3jlerzh-anas-s-projects-8d19f880.vercel.app/admin/login
```

### 4. Click "Sign in with Google"
Should work now! ✅

---

## 🚨 Alternative: Use Custom Domain

### Option A: Vercel Custom Domain
1. Go to Vercel dashboard
2. Project Settings → Domains
3. Add your custom domain (e.g., `admin.cryptorafts.com`)
4. Add this custom domain to Firebase
5. **Benefit**: Domain never changes!

### Option B: Firebase Hosting
1. Use Firebase Hosting instead of Vercel
2. Deploy: `firebase deploy --only hosting`
3. Your domain: `cryptorafts-b9067.web.app`
4. **Benefit**: Already authorized by default!

---

## 🎯 FASTEST FIX (RIGHT NOW)

### 1. Click This Link:
```
https://console.firebase.google.com/project/cryptorafts-b9067/authentication/settings
```

### 2. Scroll to "Authorized domains"

### 3. Click "Add domain"

### 4. Paste this:
```
*.vercel.app
```

### 5. Click "Add"

### 6. Done! ✅

**This wildcard covers ALL your Vercel deployments!**

---

## ✅ Verification

After adding domains, you should see:

```
Authorized domains (5)
✅ localhost
✅ cryptorafts-b9067.firebaseapp.com
✅ cryptorafts-b9067.web.app
✅ cryptorafts-starter-qt3jlerzh-anas-s-projects-8d19f880.vercel.app
✅ *.vercel.app
```

---

## 🔄 What Happens Next?

### When You Test Admin Login:
```
Before: ❌ Firebase: Error (auth/unauthorized-domain)
After:  ✅ Google Sign-In popup opens
        ✅ Admin login successful
        ✅ Redirect to /admin/dashboard
```

---

## 🎊 Summary

**Problem**: Vercel deployment URLs not authorized in Firebase

**Solution**: Add domains to Firebase Console → Authentication → Settings → Authorized domains

**Time**: 2 minutes

**Result**: Admin Google Sign-In works perfectly! ✅

---

## 📞 Need Help?

If you're stuck:

1. **Check Firebase Project**: Make sure you're in `cryptorafts-b9067` project
2. **Check URL**: Make sure you copied the exact Vercel URL
3. **Wait**: Give Firebase 1-2 minutes after adding
4. **Clear Cache**: Clear browser cache and try again

---

## 🚀 Quick Action Required

**Click this link NOW**:
```
https://console.firebase.google.com/project/cryptorafts-b9067/authentication/settings
```

**Scroll to "Authorized domains"**

**Click "Add domain"**

**Paste**:
```
*.vercel.app
```

**Click "Add"**

**✅ FIXED!**

---

**Your admin login will work in 1-2 minutes!** 🎉

