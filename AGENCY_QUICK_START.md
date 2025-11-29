# 🚀 Agency Role - Quick Start Guide

## ✅ Complete Flow (Step-by-Step)

### 1️⃣ **REGISTRATION** (30 seconds)
```
URL: /register/agency
```
**Fill out:**
- ✏️ Agency Name
- 🌐 Website  
- 🌍 Country
- 👥 Team Size
- 📅 Year Established
- 💼 Clients Served
- 📁 Portfolio URL
- ✅ Services (select multiple)

**Click:** `Complete Registration` → Auto redirects to KYB

---

### 2️⃣ **KYB SUBMISSION** (5 minutes)
```
URL: /agency/kyb
```
**Business Info:**
- Legal Entity Name *
- Registration Number *
- Country of Registration *
- Business Address
- Tax ID

**Upload Documents:**
- 📄 Certificate of Incorporation *
- 📋 Tax ID Document *
- 📊 Portfolio (optional)
- 📝 Client References (optional)

**Click:** `Submit for Verification`

**What Happens:**
1. 📤 Documents upload
2. 🤖 RaftAI analyzes (instant)
3. ⏳ Pending admin review (1-2 days)

---

### 3️⃣ **WAITING** (1-2 days)
```
URL: /agency/kyb OR /agency/dashboard
```
**You see:**
- ✅ AI Analysis Complete
- ⏳ Admin Review In Progress
- 🔔 Timeline: Documents → Admin → Approval

**You can:**
- Check status anytime
- Refresh page
- Wait for email notification

---

### 4️⃣ **APPROVED** (Instant access)
```
URL: /agency/dashboard
```
**Full Access Granted:**
- 📊 Dashboard with metrics
- 🎯 Real-time projects
- 🤖 RaftAI analysis on each project
- ✅ Accept/Decline campaigns
- 💬 Auto-created chat rooms

**Project Actions:**
1. **Review** → See full details
2. **Accept** → Creates chat room + redirects
3. **Decline** → Marks as declined

---

## 🎯 Real-Time Projects

Once approved, you'll see projects like:

```
┌─────────────────────────────────────┐
│ 🚀 DeFi Trading Platform     [High] │
│ Revolutionary trading experience    │
│                                     │
│ 🤖 RaftAI Analysis                 │
│ ▰▰▰▰▰▰▰▰▱▱  85/100                │
│ Low Risk • Pre-approved             │
│                                     │
│ Sector: DeFi   Goal: $5M           │
│ Founder: Alex Chen                  │
│                                     │
│ [Review] [✓ Accept] [✗ Decline]    │
└─────────────────────────────────────┘
```

**When you accept:**
1. ✅ Project marked as `accepted`
2. 💬 Chat room created with Founder + You + RaftAI
3. 🚀 Redirects to messages page
4. 🎉 Start working on campaign!

---

## 🔧 Quick Testing

### Test with Console Commands:

**1. Check your KYB status:**
```javascript
// In browser console on any page
const user = firebase.auth().currentUser;
const db = firebase.firestore();
db.collection('users').doc(user.uid).get().then(doc => {
  console.log('KYB Status:', doc.data().kybStatus);
});
```

**2. Manually approve (if you're admin):**
```javascript
// Replace USER_ID with actual agency user ID
const userId = 'USER_ID_HERE';
db.collection('users').doc(userId).update({
  kybStatus: 'approved',
  'kyb.status': 'approved',
  updatedAt: new Date()
});
```

**3. Check projects showing for agency:**
```javascript
db.collection('projects')
  .where('targetRoles', 'array-contains', 'agency')
  .get()
  .then(snap => {
    console.log(`${snap.size} projects found for agency`);
    snap.forEach(doc => {
      console.log(doc.data().title || doc.data().name);
    });
  });
```

---

## 🎨 UI Features

### Beautiful Screens:
✅ Modern glassmorphism design
✅ Gradient backgrounds
✅ Animated icons (pulse, spin)
✅ Progress indicators
✅ Real-time updates
✅ Responsive layout
✅ Hover effects
✅ Status badges

### Color Coding:
- 🟢 **Green:** Approved, Completed, Low Risk
- 🟡 **Yellow:** Pending, Normal Rating
- 🔵 **Blue:** Info, Processing
- 🔴 **Red:** Rejected, High Risk

---

## ⚡ Key Points

1. **Registration:** Takes 30 seconds, saves org info
2. **KYB:** Takes 5 minutes, uploads docs + AI analysis
3. **Waiting:** 1-2 business days for admin approval
4. **Dashboard:** Full access once approved
5. **Projects:** Real-time feed with RaftAI analysis
6. **Chat Rooms:** Auto-created on project acceptance

---

## 🎯 Common Issues

**Issue:** Can't access dashboard
**Solution:** Check KYB status - must be `approved`

**Issue:** No projects showing
**Solution:** Projects must have `targetRoles: ['agency']` in Firestore

**Issue:** KYB stuck on pending
**Solution:** Admin needs to manually approve (or wait for auto-approval)

**Issue:** Chat room not created
**Solution:** Check Firebase security rules allow chat creation

---

## 📞 Quick Links

- **Registration:** `/register/agency`
- **KYB:** `/agency/kyb`
- **Dashboard:** `/agency/dashboard`
- **Messages:** `/messages`
- **Profile:** `/profile`

---

## ✅ Status: COMPLETE & WORKING

The agency role is now **100% functional** and matches the VC role perfectly! 🎉

**Last Updated:** October 17, 2025

