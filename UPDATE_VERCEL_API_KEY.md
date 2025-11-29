# 🔧 Update Vercel Firebase API Key

## ✅ **Status:**

The `NEXT_PUBLIC_FIREBASE_API_KEY` **EXISTS** in Vercel for all environments:
- ✅ Development
- ✅ Preview  
- ✅ Production

---

## 🔍 **Check the Value:**

### **Step 1: Go to Vercel Dashboard**

Open this link:
```
https://vercel.com/anas-s-projects-8d19f880/cryptorafts-starter/settings/environment-variables
```

### **Step 2: Find the Variable**

Look for: `NEXT_PUBLIC_FIREBASE_API_KEY`

### **Step 3: Check the Value**

**✅ CORRECT:**
```
AIzaSyAo2aRQPZU5naLm4bFCDbqTA1gNW8oFB14
```

**❌ WRONG (has quotes):**
```
"AIzaSyAo2aRQPZU5naLm4bFCDbqTA1gNW8oFB14"
```

---

## 🔧 **If Value Has Quotes:**

1. **Click "Edit"** on `NEXT_PUBLIC_FIREBASE_API_KEY`
2. **Remove quotes** from beginning and end
3. **Save**
4. **Redeploy** (or wait for next deployment)

---

## 🚀 **Update via CLI (Alternative):**

If you want to update it via command line:

```powershell
# Remove the old one (if needed)
vercel env rm NEXT_PUBLIC_FIREBASE_API_KEY production

# Add the correct one (without quotes)
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY production
# When prompted, paste: AIzaSyAo2aRQPZU5naLm4bFCDbqTA1gNW8oFB14
# (NO QUOTES!)
```

---

## ✅ **After Update:**

1. **Wait 1-2 minutes** for Vercel to update
2. **Redeploy** (or trigger a new deployment)
3. **Test admin login** - Google Sign-In should work

---

## 📋 **Current Value:**

The variable exists, but you need to check if it has quotes. The code will automatically remove quotes, but it's better to fix it in Vercel directly.

---

## 🎯 **Quick Fix:**

1. Go to Vercel Dashboard (link above)
2. Find `NEXT_PUBLIC_FIREBASE_API_KEY`
3. Check if value has quotes
4. If yes, edit and remove quotes
5. Save
6. Done! ✅

