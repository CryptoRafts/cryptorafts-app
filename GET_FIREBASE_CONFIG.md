# 🔑 GET YOUR FIREBASE CONFIGURATION

## ⚠️ URGENT: Invalid Firebase API Key

The error `auth/api-key-not-valid` means you need to use **YOUR ACTUAL** Firebase project credentials.

---

## 📋 **HOW TO GET YOUR FIREBASE CONFIG**

### **Step 1: Go to Firebase Console**

1. Open: https://console.firebase.google.com/
2. Select your project: **cryptorafts-b9067** (or your project name)
3. Click the **⚙️ Settings** icon (top left, next to "Project Overview")
4. Click **Project settings**

### **Step 2: Find Your Web App Config**

1. Scroll down to **"Your apps"** section
2. If you have a web app, click on it
3. If NOT, click **"Add app"** → Select **Web** (</> icon) → Register app

### **Step 3: Copy the Configuration**

You'll see something like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};
```

### **Step 4: Update `.env.local`**

Replace the values in your `.env.local` file:

```env
# ============================================
# FIREBASE CONFIGURATION (USE YOUR REAL VALUES!)
# ============================================
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456

# ============================================
# RAFTAI CONFIGURATION (KEEP THIS)
# ============================================
RAFT_AI_API_KEY=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
RAFT_AI_BASE_URL=https://api.raftai.com/v1

# ============================================
# SUPER ADMIN CONFIGURATION (KEEP THIS)
# ============================================
SUPER_ADMIN_EMAIL=anasshamsiggc@gmail.com

# ============================================
# NEXT.JS CONFIGURATION (KEEP THIS)
# ============================================
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### **Step 5: Restart Server**

```powershell
taskkill /F /IM node.exe
npm run dev
```

---

## 🔍 **WHERE TO FIND EACH VALUE**

### **Firebase Console → Project Settings → General Tab:**

| Variable | Where to Find |
|----------|---------------|
| `apiKey` | **Web API Key** field |
| `authDomain` | Usually `your-project-id.firebaseapp.com` |
| `projectId` | **Project ID** field (top of page) |
| `storageBucket` | Usually `your-project-id.appspot.com` |
| `messagingSenderId` | **Sender ID** in Cloud Messaging tab |
| `appId` | In your web app config (scroll down to "Your apps") |

---

## 📱 **ALTERNATIVE: Check Your Existing Firebase Setup**

If you've already set up Firebase for this project before, you might have the config somewhere:

### **Check 1: Search Your Codebase**

Look for files like:
- `firebase.config.js`
- `firebaseConfig.js`
- `.env`
- `.env.production`
- Previous `.env.local` (if you have a backup)

### **Check 2: Git History**

If this project was in Git:
```bash
git log --all --full-history -- .env.local
git show <commit-hash>:.env.local
```

### **Check 3: Documentation**

Check if you have any setup documentation or notes with the Firebase config.

---

## ⚡ **QUICK FIX: Use Service Account**

If you have a `service-account.json` file in the `secrets/` folder:

1. The Firebase Admin SDK uses that for server-side
2. But the **client-side** Firebase (browser) needs the web API key
3. These are **different** credentials - both are needed

---

## 🆘 **IF YOU DON'T HAVE FIREBASE SETUP**

If this is a **new project** or you don't have Firebase configured:

### **Option A: Create New Firebase Project**

1. Go to: https://console.firebase.google.com/
2. Click **"Add project"**
3. Name it: `cryptorafts` (or any name)
4. Enable Google Analytics (optional)
5. Create project
6. Enable **Authentication** → **Email/Password**
7. Enable **Firestore Database**
8. Enable **Storage**
9. Get web app config (steps above)

### **Option B: Ask Project Owner**

If someone else set up Firebase:
1. Ask them for the Firebase web app configuration
2. They can find it in Firebase Console → Project Settings
3. It's safe to share (these are **public** client keys)

---

## 🔒 **SECURITY NOTE**

**Firebase web API keys are PUBLIC** - they're meant to be in client-side code. They're safe to commit to Git (though we don't for best practice). The real security is in your Firebase Security Rules.

---

## ✅ **VERIFICATION**

After updating `.env.local` and restarting:

### **Check Console (F12):**

✅ **Should see:**
```
✅ Firebase initialized successfully
✅ Firebase Auth initialized
```

❌ **Should NOT see:**
```
❌ auth/api-key-not-valid
❌ Firebase configuration is missing
```

### **Test Signup:**

1. Go to: `http://localhost:3000/signup`
2. Enter email & password
3. Click "Sign Up"
4. Should create account successfully

---

## 📞 **NEED HELP?**

If you can't find your Firebase config:

1. **Check** if `secrets/service-account.json` exists
2. **Look** at the `projectId` in that file
3. **Go** to Firebase Console
4. **Find** that project
5. **Get** the web app config

---

## 🎯 **SUMMARY**

```
❌ Current: Using placeholder Firebase API key
✅ Need: Your ACTUAL Firebase project credentials
📍 Where: Firebase Console → Project Settings → Your apps
🔄 Action: Update .env.local → Restart server
```

---

**Next Steps:**
1. 🔍 Find your Firebase project in Console
2. 📋 Copy the web app configuration
3. ✏️ Update `.env.local` with real values
4. 🔄 Restart: `taskkill /F /IM node.exe; npm run dev`
5. ✅ Test signup/login

---

**Version**: 1.0.0  
**Status**: ⚠️ **AWAITING REAL FIREBASE CONFIG**  
**Priority**: 🔴 **HIGH**  

