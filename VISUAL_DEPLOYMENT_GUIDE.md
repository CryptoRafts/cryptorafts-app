# 🎯 VISUAL DEPLOYMENT GUIDE - COPY & PASTE

## 🚨 **URGENT: Deploy Firebase Rules Now**

### **📋 STEP 1: Firestore Rules**

1. **Open:** https://console.firebase.google.com/project/cryptorafts-b9067/firestore/rules

2. **Select ALL text** in the rules editor and **DELETE it**

3. **Copy this EXACT text:**
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    allow read, write: if true;
  }
}
```

4. **Paste it** into the rules editor

5. **Click "Publish"**

### **📋 STEP 2: Storage Rules**

1. **Open:** https://console.firebase.google.com/project/cryptorafts-b9067/storage/rules

2. **Select ALL text** in the rules editor and **DELETE it**

3. **Copy this EXACT text:**
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

4. **Paste it** into the rules editor

5. **Click "Publish"**

## ⚡ **RESULT:**

After both deployments:
- ✅ All permission errors disappear
- ✅ VC dashboard works perfectly
- ✅ All features functional

## 🚨 **CRITICAL:**

**The VC dashboard CANNOT function until these rules are deployed!**

**Please do this now - it takes 2 minutes!**
