# 🔧 Blog Troubleshooting Guide

## Current Issues

### **1. Build Error**
```
Parsing ecmascript source code failed
Unterminated regexp literal
```

**Solution**: This is likely a caching issue. Try:
1. Delete `.next` folder
2. Restart dev server
3. Check for any special characters in blog files

### **2. Demo Blogs Not Showing on Frontend**

**Possible Causes**:

#### **A. No Posts in Database**
- Run the seed first: http://localhost:3001/admin/blog/seed
- Click "Seed Blog Posts" button
- Wait for success message

#### **B. Posts Not Published**
- Check admin dashboard: http://localhost:3001/admin/blog
- Ensure posts have "published" status
- Not "draft" or "scheduled"

#### **C. Firebase Not Connected**
- Check browser console for errors
- Verify Firebase config in `.env.local`
- Ensure Firestore rules are deployed

#### **D. API Not Working**
- Test: http://localhost:3001/api/blog
- Should return `{"success": true, "posts": [...]}`
- Check for 500 errors

---

## 🔍 Debugging Steps

### **Step 1: Check Firebase Connection**
```javascript
// In browser console:
fetch('http://localhost:3001/api/blog')
  .then(r => r.json())
  .then(console.log)
```

### **Step 2: Verify Posts Exist**
1. Go to Firebase Console
2. Firestore Database
3. Check `blog_posts` collection
4. Should see 5 documents if seeded

### **Step 3: Check API Response**
1. Visit: http://localhost:3001/api/blog
2. Should see JSON with posts array
3. If empty `[]`, posts not loaded

### **Step 4: Test Seed Function**
1. Visit: http://localhost:3001/admin/blog/seed
2. Click "Seed Blog Posts"
3. Watch console for errors
4. Check success message

---

## 🚀 Quick Fix

### **If No Posts Showing:**

1. **First, seed the posts:**
```
Visit: http://localhost:3001/admin/blog/seed
Click: "Seed Blog Posts"
Wait: For success message
```

2. **Then verify:**
```
Visit: http://localhost:3001/admin/blog
Should see: 5 posts listed
Status: Published (green badge)
```

3. **Finally, check frontend:**
```
Visit: http://localhost:3001/blog
Should see: Blog posts displayed
```

---

## ✅ Expected Behavior

### **After Seeding:**
- Admin shows 5 posts
- All status "published"
- Categories: web3, tokenomics, ai, defi, investing
- Frontend shows blog grid with featured posts

### **If Still Not Working:**
1. Check browser console (F12)
2. Look for Firebase errors
3. Check network tab for failed requests
4. Verify `.env.local` has correct Firebase config

---

## 📞 Common Issues

### **Issue**: "No posts found" on frontend
**Solution**: Run seed at /admin/blog/seed

### **Issue**: "Firebase not initialized"
**Solution**: Check .env.local Firebase config

### **Issue**: "CORS error"
**Solution**: Verify API routes are accessible

### **Issue**: "Failed to fetch"
**Solution**: Ensure dev server is running (npm run dev)

---

## 🎯 Success Checklist

- [ ] Dev server running (http://localhost:3001)
- [ ] Firebase connected
- [ ] Seed completed successfully
- [ ] Posts visible in admin dashboard
- [ ] Posts have "published" status
- [ ] Frontend showing blog posts
- [ ] No console errors

---

## 📝 Final Check

**Visit these URLs in order:**

1. `http://localhost:3001/admin/blog/seed` - Seed posts
2. `http://localhost:3001/admin/blog` - Verify posts
3. `http://localhost:3001/blog` - View public blog
4. `http://localhost:3001/api/blog` - Check API

**All should work correctly!**

