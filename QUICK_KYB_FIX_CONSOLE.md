# 🚀 QUICK KYB STATUS FIX - Browser Console

## **If you're stuck on "KYB Verification Pending":**

### **Option 1: Use Fix Tool (Recommended)**
Open this file in your browser:
```
http://localhost:3000/fix-kyb-status.html
```

---

### **Option 2: Run This in Browser Console**

1. **Open Browser Console:**
   - Press `F12` or `Ctrl+Shift+I` (Windows/Linux)
   - Press `Cmd+Option+I` (Mac)

2. **Go to Console tab**

3. **Paste and run this code:**

```javascript
// Quick KYB Status Fix
(async function() {
  console.log('🔧 Starting KYB Status Fix...');
  
  try {
    // Import Firebase
    const { getAuth } = await import('https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js');
    const { getFirestore, doc, getDoc, setDoc } = await import('https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js');
    
    const auth = getAuth();
    const db = getFirestore();
    const user = auth.currentUser;
    
    if (!user) {
      console.error('❌ No user logged in. Please login first.');
      return;
    }
    
    console.log('✅ User:', user.email);
    
    // Get current status
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) {
      console.error('❌ User document not found');
      return;
    }
    
    const data = userDoc.data();
    console.log('📊 Current KYB Status:', data.kybStatus);
    console.log('📊 Profile Completed:', data.profileCompleted);
    console.log('📊 Has KYB Data:', !!data.kyb);
    
    // Check if stuck
    if (data.kybStatus === 'pending' && !data.kyb) {
      console.log('⚠️ STUCK! You have "pending" status but no KYB data.');
      console.log('🔧 Fixing status...');
      
      await setDoc(doc(db, 'users', user.uid), {
        kybStatus: 'not_submitted',
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      console.log('✅ Status fixed! Refresh the page to see the KYB form.');
      alert('✅ KYB Status fixed! Refresh the page (F5) to continue.');
    } else if (data.kybStatus === 'not_submitted') {
      console.log('✅ Status is correct! You should see the KYB form.');
    } else if (data.kybStatus === 'pending' && data.kyb) {
      console.log('⏳ Your KYB is legitimately pending. Wait for admin approval.');
    } else if (data.kybStatus === 'approved') {
      console.log('🎉 Your KYB is approved! You can access the dashboard.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
})();
```

4. **Press Enter**

5. **Check the console output:**
   - If it says "✅ Status fixed!", refresh the page (F5)
   - You should now see the KYB form instead of "Pending"

---

### **Option 3: Manual Firebase Console Fix**

1. Go to: https://console.firebase.google.com/
2. Select project: `cryptorafts-b9067`
3. Go to: **Firestore Database**
4. Navigate to: `users` collection
5. Find your user document (by your UID)
6. Edit the `kybStatus` field
7. Change from `pending` to `not_submitted`
8. Save
9. Refresh your browser page

---

## 🔍 **Check Your Current Status:**

Run this in console to just CHECK (doesn't fix):

```javascript
(async function() {
  const { getAuth } = await import('https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js');
  const { getFirestore, doc, getDoc } = await import('https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js');
  
  const auth = getAuth();
  const db = getFirestore();
  const user = auth.currentUser;
  
  if (!user) {
    console.error('❌ Not logged in');
    return;
  }
  
  const userDoc = await getDoc(doc(db, 'users', user.uid));
  if (userDoc.exists()) {
    const data = userDoc.data();
    console.log('👤 Email:', user.email);
    console.log('📊 KYB Status:', data.kybStatus);
    console.log('📊 Profile Completed:', data.profileCompleted);
    console.log('📊 Has KYB Data:', !!data.kyb);
    console.log('📊 Onboarding Step:', data.onboardingStep);
  }
})();
```

---

## 📋 **Status Meanings:**

| Status | What It Means | What You Should See |
|--------|---------------|---------------------|
| `not_submitted` | Haven't submitted KYB yet | **KYB Form** ✅ |
| `pending` | Submitted, waiting for approval | **Pending Screen** ⏳ |
| `approved` | Admin approved your KYB | **Dashboard Access** 🎉 |
| `rejected` | KYB was rejected | **Resubmit Form** ❌ |

---

## 🆘 **Still Stuck?**

**Check Console Logs:**
Look for these messages when you visit `/vc/kyb`:

```
🔍 Checking KYB status for user: [your-email]
📊 KYB Status: [status]
📊 Profile Completed: [true/false]
📊 Has KYB Data: [true/false]
```

**If you see:**
- ✅ `KYB Status: not_submitted` → You should see the form
- ⏳ `KYB Status: pending` + `Has KYB Data: true` → Legitimately pending
- ❌ `KYB Status: pending` + `Has KYB Data: false` → You're STUCK! Use fix tool

---

**ALL FIXES ARE NOW IN PLACE! Use any of the above methods to fix your status.** 🎉

