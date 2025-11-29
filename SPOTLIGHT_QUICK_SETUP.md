# 🚀 SPOTLIGHT - QUICK SETUP GUIDE

## ⚡ Fix the Firestore Index Error (2 Minutes)

You're seeing this error because Firestore needs a composite index for the spotlight query. Here's the fastest way to fix it:

---

## 🎯 Option 1: Click the Link (FASTEST - 30 seconds)

1. **Open your browser console** (F12)
2. **Find this error message:**
   ```
   The query requires an index. You can create it here: https://console.firebase.google.com/...
   ```
3. **Click the link** in the error message
4. **Firebase Console will open** with the index pre-configured
5. **Click "Create Index"** button
6. **Wait 2-3 minutes** for index to build
7. **Refresh your app** - spotlight will work! ✅

---

## 🎯 Option 2: Manual Creation (5 minutes)

### Step 1: Go to Firebase Console
1. Open https://console.firebase.google.com/
2. Select your project: **cryptorafts-b9067**
3. Click **Firestore Database** in left menu
4. Click **Indexes** tab at top

### Step 2: Create the Index
Click "Create Index" and enter:

**Collection ID:** `spotlightApplications`

**Fields to index:**
1. Field: `status` | Order: `Ascending`
2. Field: `startDate` | Order: `Descending`

**Query scope:** Collection

Click **Create** button.

### Step 3: Wait for Build
- Status will show "Building..."
- Takes 2-5 minutes
- Refreshes automatically when done

### Step 4: Test
- Refresh your Cryptorafts app
- Error should be gone! ✅

---

## 🎯 Option 3: Deploy via Firebase CLI (If authenticated)

```bash
firebase deploy --only firestore:indexes
```

Or run the batch file:
```bash
.\deploy-spotlight-indexes.bat
```

---

## ✅ Verify It's Working

After creating the index:

1. **Refresh homepage**
2. **Check browser console** - no errors
3. **Premium Spotlight section** should appear (if any active)
4. **Go to `/explore`** - Featured Spotlights should load

---

## 🧪 Create Your First Test Spotlight

### Step 1: Create Test Data (Admin)

You can manually create a test spotlight in Firestore:

1. Go to **Firestore Database** > **Data** tab
2. Click **Start Collection**
3. Collection ID: `spotlightApplications`
4. Document ID: (auto-generate)
5. Add these fields:

```javascript
{
  projectId: "test-project-123",
  projectName: "Test Crypto Project",
  founderId: "your-founder-uid",
  founderEmail: "founder@test.com",
  bannerUrl: "https://via.placeholder.com/1200x400/4F46E5/FFFFFF?text=Premium+Spotlight",
  logoUrl: "https://via.placeholder.com/150/10B981/FFFFFF?text=LOGO",
  tagline: "Building the future of Web3",
  description: "A revolutionary blockchain platform",
  slotType: "premium",
  price: 300,
  status: "approved",
  paymentStatus: "completed",
  verificationData: {
    kycVerified: true,
    kybVerified: true,
    raftaiRating: "High"
  },
  startDate: (today's timestamp),
  endDate: (30 days from now timestamp),
  createdAt: (today's timestamp),
  updatedAt: (today's timestamp),
  analytics: {
    impressions: 0,
    profileViews: 0,
    clicks: 0
  }
}
```

### Step 2: Refresh Homepage

The spotlight should now appear at the top of your homepage!

---

## 🐛 Still Not Working?

### Error: "Authentication Error"
**Fix:** The Firebase CLI needs re-authentication
```bash
firebase login --reauth
```

### Error: "Index not found"
**Fix:** Wait a few more minutes for index to build, then refresh

### Error: "Permission denied"
**Fix:** Deploy Firestore security rules
```bash
firebase deploy --only firestore:rules
```

### Spotlight Not Displaying
**Checklist:**
- ✅ Index created and built?
- ✅ Test data has `status: "approved"`?
- ✅ Test data has `paymentStatus: "completed"`?
- ✅ `startDate` is today or earlier?
- ✅ `endDate` is today or later?
- ✅ `slotType` is "premium" or "featured"?

---

## 📞 Need Help?

1. **Check browser console** for specific errors
2. **Read full guide**: `SPOTLIGHT_COMPLETE_GUIDE.md`
3. **Firestore indexes**: Check build status in Firebase Console
4. **Security rules**: Ensure they're deployed

---

## 🎉 Success Checklist

- [ ] Firestore index created
- [ ] Index status = "Enabled" (not "Building")
- [ ] No console errors
- [ ] Premium Spotlight appears on homepage
- [ ] Featured Spotlight appears on /explore
- [ ] Click tracking works
- [ ] Application form accessible at /spotlight/apply
- [ ] Admin dashboard accessible at /admin/spotlight

---

## 🚀 Next Steps

Once everything works:

1. **Create real applications** via `/spotlight/apply`
2. **Set up payment gateway** (Stripe/Crypto)
3. **Announce feature** to users
4. **Monitor analytics** in admin dashboard
5. **Start earning** $300-750/month! 💰

---

**Ready to make your first spotlight?**

👉 Go to `/spotlight/apply` and get started!

🌟 **Pitch. Invest. Build. Verified.** 🌟

