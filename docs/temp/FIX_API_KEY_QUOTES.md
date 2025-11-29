# 🔧 Fix API Key Quotes Error

## 🚨 **Problem:**

```
Firebase: Error (auth/api-key-not-valid.-please-pass-a-valid-api-key.)
```

The API key is being passed with quotes: `key=%22AIzaSyAo2aRQPZU5naLm4bFCDbqTA1gNW8oFB14%22`

Where `%22` = `"` (quote character)

---

## ✅ **Fix Applied:**

### **1. Updated `cleanEnvVar()` Function**

Now removes quotes from all environment variables:

```typescript
const cleanEnvVar = (value: string | undefined, fallback: string): string => {
  // Remove quotes, whitespace, and newlines
  const cleaned = (value || fallback).trim().replace(/[\r\n]/g, '').replace(/^["']|["']$/g, '');
  return cleaned;
};
```

### **2. Added API Key Validation**

Validates and cleans API key before Firebase initialization:

```typescript
// Remove any quotes from API key (common issue with env vars)
if (firebaseConfig.apiKey) {
  firebaseConfig.apiKey = firebaseConfig.apiKey.replace(/^["']|["']$/g, '').trim();
}

// Validate API key format (should not have quotes)
if (firebaseConfig.apiKey && (firebaseConfig.apiKey.startsWith('"') || firebaseConfig.apiKey.startsWith("'"))) {
  console.warn('⚠️ API key has quotes, removing them...');
  firebaseConfig.apiKey = firebaseConfig.apiKey.replace(/^["']|["']$/g, '').trim();
}
```

---

## 🔍 **Check Vercel Environment Variables:**

If the error persists, check if your Vercel env vars have quotes:

1. **Go to Vercel Dashboard:**
   ```
   https://vercel.com/anas-s-projects-8d19f880/cryptorafts-starter/settings/environment-variables
   ```

2. **Check `NEXT_PUBLIC_FIREBASE_API_KEY`:**
   - Should be: `AIzaSyAo2aRQPZU5naLm4bFCDbqTA1gNW8oFB14`
   - Should NOT be: `"AIzaSyAo2aRQPZU5naLm4bFCDbqTA1gNW8oFB14"`

3. **If it has quotes, remove them:**
   - Edit the variable
   - Remove quotes from beginning and end
   - Save

---

## ✅ **Expected Results:**

After fix:
- ✅ API key is clean (no quotes)
- ✅ Google Sign-In works
- ✅ Firebase authentication works
- ✅ No "api-key-not-valid" errors

---

## 🚀 **Deployment:**

Code is fixed and deployed. The `cleanEnvVar()` function will automatically remove quotes from all Firebase config values.

If you still see the error, check your Vercel environment variables and remove any quotes manually.

