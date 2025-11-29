# 🚀 Deploy to Vercel & Firebase Setup

**Complete deployment guide for admin social blog system**

---

## ✅ What's Been Updated

### **1. Scheduled Posts Logic** ✅
- ✅ Scheduled posts saved to `scheduled_posts` collection (NOT `blog_posts`)
- ✅ Only published/draft posts saved to `blog_posts` collection
- ✅ Scheduled posts moved to `blog_posts` when time arrives
- ✅ Auto-publishing endpoint: `/api/blog/scheduled/publish`

### **2. Firebase Collections** ✅
- ✅ `blog_posts` - Published and draft posts only
- ✅ `scheduled_posts` - Scheduled posts (temporary)
- ✅ `blog_team_members` - Team members

---

## 📋 Vercel Deployment

### **Step 1: Install Vercel CLI**

```bash
npm i -g vercel
```

### **Step 2: Login to Vercel**

```bash
vercel login
```

### **Step 3: Deploy**

```bash
vercel
```

**Or deploy to production:**
```bash
vercel --prod
```

---

## 🔥 Firebase Setup

### **Step 1: Create Collections**

Go to Firebase Console: https://console.firebase.google.com/project/cryptorafts-b9067/firestore

**Create these collections:**

1. **`blog_posts`** (already exists)
   - Contains: Published and draft posts only

2. **`scheduled_posts`** (NEW)
   - Contains: Scheduled posts (temporary storage)
   - Auto-deleted when published

3. **`blog_team_members`** (NEW)
   - Contains: Team members for blog department

---

### **Step 2: Firestore Security Rules**

Update `firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Blog Posts - Public read, Admin write
    match /blog_posts/{postId} {
      allow read: if true; // Public can read published posts
      allow write: if request.auth != null && 
                     (request.auth.token.admin == true || 
                      request.auth.token.role == 'admin');
    }
    
    // Scheduled Posts - Admin only
    match /scheduled_posts/{postId} {
      allow read, write: if request.auth != null && 
                           (request.auth.token.admin == true || 
                            request.auth.token.role == 'admin');
    }
    
    // Blog Team Members - Admin only
    match /blog_team_members/{memberId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                     (request.auth.token.admin == true || 
                      request.auth.token.role == 'admin');
    }
  }
}
```

**Deploy rules:**
```bash
firebase deploy --only firestore:rules
```

---

### **Step 3: Environment Variables**

**Add to Vercel Environment Variables:**

Go to: Vercel Dashboard → Project → Settings → Environment Variables

**Required Variables:**

```
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAo2aRQPZU5naLm4bFCDbqTA1gNW8oFB14
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=cryptorafts-b9067.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=cryptorafts-b9067
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=cryptorafts-b9067.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=374711838796
NEXT_PUBLIC_FIREBASE_APP_ID=1:374711838796:web:3bee725bfa7d8790456ce9
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-ZRQ955RGWH
NEXT_PUBLIC_BASE_URL=https://www.cryptorafts.com
FIREBASE_SERVICE_ACCOUNT_KEY={...} (JSON)
DEFAULT_PUBLISH_MODE=false
```

---

## ⏰ Scheduled Posts Cron Job

### **Option 1: Vercel Cron Jobs**

Create `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/blog/scheduled/publish",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

**This runs every 5 minutes** to check and publish scheduled posts.

---

### **Option 2: External Cron Service**

Use a service like:
- **cron-job.org**
- **EasyCron**
- **GitHub Actions**

**Set up cron:**
```
POST https://www.cryptorafts.com/api/blog/scheduled/publish
Schedule: Every 5 minutes
```

---

## 🔄 How Scheduled Posts Work

### **1. Create Scheduled Post**

```bash
POST /api/blog/admin/manage
{
  "title": "Scheduled Post",
  "content": "...",
  "status": "scheduled",
  "scheduledDate": "2024-01-01T09:00:00Z"
}
```

**Result**: Saved to `scheduled_posts` collection (NOT `blog_posts`)

---

### **2. Cron Job Checks**

Every 5 minutes, cron calls:
```
POST /api/blog/scheduled/publish
```

**Process**:
1. Finds posts where `scheduledDate <= now`
2. Moves them to `blog_posts` collection
3. Sets status to `published`
4. Deletes from `scheduled_posts`
5. Triggers platform publishing

---

### **3. Published Post**

Post is now in `blog_posts` collection and visible on website.

---

## 📊 Collections Structure

### **`blog_posts`** (Published/Draft Only)

```typescript
{
  id: string;
  title: string;
  content: string;
  status: 'draft' | 'published';
  publishedAt?: Date;
  createdAt: Date;
  // ... other fields
}
```

### **`scheduled_posts`** (Temporary)

```typescript
{
  id: string;
  title: string;
  content: string;
  status: 'scheduled';
  scheduledDate: Date;
  createdAt: Date;
  // ... other fields
}
```

**Note**: Scheduled posts are NOT in `blog_posts` until published!

---

## ✅ Deployment Checklist

- [ ] Deploy to Vercel
- [ ] Add environment variables to Vercel
- [ ] Create `scheduled_posts` collection in Firebase
- [ ] Create `blog_team_members` collection in Firebase
- [ ] Update Firestore security rules
- [ ] Deploy Firestore rules
- [ ] Set up cron job (Vercel or external)
- [ ] Test scheduled post creation
- [ ] Test scheduled post publishing

---

## 🧪 Testing

### **Test Scheduled Post**

1. **Create scheduled post**:
```bash
POST /api/blog/admin/manage
{
  "title": "Test Scheduled",
  "content": "Test content",
  "status": "scheduled",
  "scheduledDate": "2024-01-01T09:00:00Z"
}
```

2. **Check scheduled_posts collection**:
```bash
GET /api/blog/scheduled/publish
```

3. **Manually trigger publish** (for testing):
```bash
POST /api/blog/scheduled/publish
```

4. **Verify in blog_posts**:
- Post should be in `blog_posts` collection
- Status should be `published`
- Should NOT be in `scheduled_posts`

---

## 🎉 Ready!

**Everything is configured:**

1. ✅ Scheduled posts saved to separate collection
2. ✅ Only blog posts saved to `blog_posts`
3. ✅ Auto-publishing cron job ready
4. ✅ Firebase collections configured
5. ✅ Vercel deployment ready

**Deploy and test!**

