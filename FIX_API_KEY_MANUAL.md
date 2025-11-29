# 🔧 Fix API Key - Manual Steps

## ⚠️ **Issue:**

The API key in Vercel still has quotes. Let's fix it manually.

---

## ✅ **Manual Fix Steps:**

### **Step 1: Go to Vercel Dashboard**

Open this link:
```
https://vercel.com/anas-s-projects-8d19f880/cryptorafts-starter/settings/environment-variables
```

### **Step 2: Find the Variable**

Look for: `NEXT_PUBLIC_FIREBASE_API_KEY`

### **Step 3: Edit Each Environment**

For **Production**, **Preview**, and **Development**:

1. **Click "Edit"** on `NEXT_PUBLIC_FIREBASE_API_KEY`
2. **Delete the entire value**
3. **Paste this (NO QUOTES):**
   ```
   AIzaSyAo2aRQPZU5naLm4bFCDbqTA1gNW8oFB14
   ```
4. **Click "Save"**
5. **Repeat for all 3 environments**

---

## 🎯 **Correct Value:**

```
AIzaSyAo2aRQPZU5naLm4bFCDbqTA1gNW8oFB14
```

**NO QUOTES!** ❌ Don't add `"` or `'` around it.

---

## ✅ **After Fix:**

1. **Wait 1-2 minutes** for Vercel to update
2. **Redeploy** (or wait for next deployment)
3. **Test admin login** - Google Sign-In should work

---

## 🚀 **Quick Redeploy:**

After fixing the env vars, run:
```powershell
vercel --prod --yes
```

---

## 📋 **Checklist:**

- [ ] Production env var updated (no quotes)
- [ ] Preview env var updated (no quotes)
- [ ] Development env var updated (no quotes)
- [ ] Redeployed app
- [ ] Tested admin login

---

## ✅ **The Code Will Also Help:**

Even if quotes remain, the code now automatically removes them. But it's better to fix it in Vercel directly!

