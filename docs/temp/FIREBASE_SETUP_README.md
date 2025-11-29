# 🔥 Firebase Complete Setup Guide

## 📅 Production-Grade Multi-Role Application

This comprehensive Firebase setup includes:
- ✅ 8 User Roles with Custom Claims
- ✅ Firestore Security Rules
- ✅ Cloud Storage Rules
- ✅ Optimized Indexes
- ✅ Cloud Functions (Auth, Claims, Audit Logging)
- ✅ Real-Time Notifications
- ✅ Complete Audit Trail

---

## 🎯 USER ROLES

The application supports 8 distinct roles:

| Role | Description | Access Level |
|------|-------------|--------------|
| `admin` | Platform administrator | Full access to everything |
| `founder` | Project creators | Can create/manage projects |
| `vc` | Venture capitalists | Access to deal flow, investments |
| `exchange` | Exchange platforms | Trading integration features |
| `ido` | IDO/IEO platforms | Token launch management |
| `influencer` | Marketing partners | Campaign and promotion tools |
| `agency` | Service providers | Multi-client management |
| `trader` | Default role | Basic platform access |

**Default Role:** All new users start as `trader` until verified by admin.

---

## 📁 FILE STRUCTURE

```
cryptorafts-starter/
├── firestore.rules              # Firestore security rules
├── storage.rules                # Cloud Storage security rules
├── firestore.indexes.json       # Composite indexes for queries
├── functions/
│   ├── package.json            # Cloud Functions dependencies
│   ├── tsconfig.json           # TypeScript configuration
│   └── src/
│       └── index.ts            # All Cloud Functions
├── firebase.json               # Firebase project configuration
└── .firebaserc                # Firebase project ID
```

---

## 🚀 DEPLOYMENT STEPS

### **1. Prerequisites**

```bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Login to Firebase
firebase login

# Verify your Firebase project
firebase projects:list
```

### **2. Initialize Firebase Project (if not done)**

```bash
# Set your Firebase project
firebase use cryptorafts-b9067

# Or add new project
firebase use --add
```

### **3. Install Functions Dependencies**

```bash
cd functions
npm install
cd ..
```

### **4. Deploy Everything**

#### **Option A: Deploy All at Once**
```bash
firebase deploy
```

#### **Option B: Deploy Individually**

```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Firestore indexes
firebase deploy --only firestore:indexes

# Deploy Storage rules
firebase deploy --only storage

# Deploy Cloud Functions
firebase deploy --only functions
```

### **5. Verify Deployment**

```bash
# Check Firestore rules
firebase firestore:rules:list

# Check deployed functions
firebase functions:list

# View logs
firebase functions:log
```

---

## 🔒 SECURITY FEATURES

### **Firestore Security Rules**

#### **Key Principles:**
1. ✅ **Authentication Required** - All operations require authenticated users
2. ✅ **UID-Based Access** - Users can only access their own data
3. ✅ **Role-Based Permissions** - Actions restricted by role
4. ✅ **Member Verification** - Chat/org access verified via membership arrays
5. ✅ **No Role Elevation** - Users cannot promote themselves to admin
6. ✅ **PII Protection** - KYC/KYB data highly restricted

#### **Collection Access Matrix:**

| Collection | Read | Create | Update | Delete |
|------------|------|--------|--------|--------|
| `users` | All | Self | Self* | Admin |
| `projects` | Public | Auth | Owner/Org | Owner/Admin |
| `chats` | Members | Auth | Members | Admin |
| `kyc` | Self/Admin | Self | Self/Admin | Admin |
| `kyb` | OrgAdmin/Admin | OrgAdmin | OrgAdmin/Admin | Admin |
| `spotlight` | Public** | Admin | Admin | Admin |
| `admin/audit` | Admin | Server | Never | Never |

\* Cannot elevate role  
\** Only if `published==true`

### **Storage Security Rules**

#### **Path Structure:**

```
storage/
├── user/{userId}/           # Private user files (50MB limit)
├── avatars/{userId}         # Public profile images (5MB limit)
├── org/{orgId}/             # Organization files (100MB limit)
├── org-logos/{orgId}        # Public org logos (5MB limit)
├── projects/{projectId}/    # Project files (100MB limit)
├── kyc/{userId}/            # KYC documents (20MB limit)
├── kyb/{orgId}/             # KYB documents (20MB limit)
├── chat-attachments/{chatId}/ # Chat files (25MB limit)
├── public/                  # Public content (50MB limit)
├── spotlight/{id}/          # Spotlight images (10MB limit)
├── temp/{userId}/           # Temporary files (50MB limit)
└── admin/                   # Admin-only files (200MB limit)
```

#### **File Type Restrictions:**

✅ **Allowed:**
- Images: `image/*`
- Documents: `application/pdf`, `application/msword`, `application/vnd.*`
- Text files: `text/*`
- JSON: `application/json`

❌ **Blocked:**
- Executables: `.exe`, `.bat`, `.sh`
- Scripts: `.js`, `.py`, `.rb` (as executables)
- Any files marked with `virus=detected` metadata

---

## ⚙️ CLOUD FUNCTIONS

### **Auth Triggers**

#### **1. `onAuthCreate`**
- **Triggered:** When user signs up
- **Actions:**
  - Creates user profile in `users/{uid}`
  - Sets default role to `trader`
  - Auto-promotes admin emails
  - Sets initial custom claims
  - Creates audit log

```typescript
// User profile structure
{
  uid: string;
  email: string;
  role: 'trader' | 'founder' | 'vc' | ... ;
  status: 'pending' | 'active' | 'suspended';
  isVerified: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  orgId?: string;
}
```

#### **2. `onAuthDelete`**
- **Triggered:** When user is deleted
- **Actions:**
  - Removes user profile
  - Creates audit log

### **Firestore Triggers**

#### **3. `onUserWrite`**
- **Triggered:** When `users/{userId}` is created/updated
- **Actions:**
  - Validates role (rejects unknown roles)
  - Prevents unauthorized role elevation to admin
  - Syncs custom claims to Firebase Auth
  - Creates audit log for role changes

**Custom Claims Set:**
```typescript
{
  role: string;           // User's current role
  isVerified: boolean;    // Verification status
  orgId: string | null;   // Organization membership
  admin: boolean;         // Is admin role
}
```

#### **4. `onProjectMilestoneVerified`**
- **Triggered:** When milestone is marked as verified
- **Actions:**
  - Creates audit log
  - Sends notification to project founder

#### **5. `onKYCStatusChange`**
- **Triggered:** When KYC status updates
- **Actions:**
  - Creates audit log
  - Sends approval notification

#### **6. `onKYBStatusChange`**
- **Triggered:** When KYB status updates
- **Actions:**
  - Creates audit log
  - Sends approval notification to org admin

### **Callable Functions (HTTPS)**

#### **7. `updateUserRole`**
- **Access:** Admin only
- **Purpose:** Update user roles
- **Parameters:**
  ```typescript
  {
    userId: string;
    role: 'admin' | 'founder' | 'vc' | ...;
  }
  ```

#### **8. `verifyUser`**
- **Access:** Admin only
- **Purpose:** Verify and activate users
- **Parameters:**
  ```typescript
  {
    userId: string;
  }
  ```

#### **9. `getAuditLogs`**
- **Access:** Admin only
- **Purpose:** Retrieve audit logs with filtering
- **Parameters:**
  ```typescript
  {
    limit?: number;    // Default: 100
    userId?: string;   // Filter by user
    action?: string;   // Filter by action
  }
  ```

---

## 📊 FIRESTORE INDEXES

### **Automatic Indexes:**
All single-field queries are auto-indexed by Firebase.

### **Composite Indexes (43 total):**

#### **Key Indexes for Real-Time Features:**

1. **Chat Messages:**
   ```
   chats → members (array-contains) → updatedAt (desc)
   messages → chatId (asc) → createdAt (asc)
   ```

2. **Projects:**
   ```
   projects → status (asc) → updatedAt (desc)
   projects → founderId (asc) → updatedAt (desc)
   projects → badges.kyc (asc) → raftai.rating (asc) → updatedAt (desc)
   ```

3. **Notifications:**
   ```
   notifications → userId (asc) → isRead (asc) → createdAt (desc)
   ```

4. **Spotlight:**
   ```
   spotlight → published (asc) → priority (desc)
   spotlight → published (asc) → createdAt (desc)
   ```

5. **Audit Logs:**
   ```
   audit → userId (asc) → timestamp (desc)
   audit → action (asc) → timestamp (desc)
   ```

---

## 🧪 TESTING

### **Test Users by Role**

Create test users for each role to verify access control:

```bash
# Create test users via Firebase Console:
# Authentication → Users → Add user

# Test accounts:
admin@test.com         → role: admin
founder@test.com       → role: founder
vc@test.com           → role: vc
exchange@test.com     → role: exchange
ido@test.com          → role: ido
influencer@test.com   → role: influencer
agency@test.com       → role: agency
trader@test.com       → role: trader
```

### **Access Control Tests**

#### **1. User Profile Access**
- ✅ Users can read own profile
- ✅ Users can update own profile (except role)
- ❌ Users cannot update role/admin/isVerified
- ✅ Admin can update any profile

#### **2. Chat Access**
- ✅ Users see only chats where they're members
- ❌ Users cannot access chats they're not in
- ✅ Members can send messages
- ❌ Non-members cannot read/write messages

#### **3. KYC/KYB Privacy**
- ✅ Users can read own KYC
- ❌ Users cannot read others' KYC
- ✅ Admin can read all KYC/KYB
- ❌ Cross-user access blocked

#### **4. Project Permissions**
- ✅ Public can read all projects
- ✅ Founders can update own projects
- ✅ Org members can edit org projects
- ❌ Non-owners cannot edit projects

#### **5. Spotlight**
- ✅ Public can read published spotlight
- ❌ Public cannot read unpublished
- ✅ Admin can write spotlight
- ❌ Non-admin cannot write

#### **6. Admin Audit Logs**
- ✅ Admin can read audit logs
- ❌ Non-admin cannot read
- ✅ Server functions can write
- ❌ Users cannot write directly

---

## 🔍 MONITORING & DEBUGGING

### **View Real-Time Logs**

```bash
# Stream function logs
firebase functions:log --follow

# Filter by function name
firebase functions:log --only onUserWrite

# View last 100 lines
firebase functions:log --limit 100
```

### **Check Firestore Usage**

```bash
# Firebase Console → Firestore → Usage
# Monitor:
- Reads/Writes/Deletes per day
- Storage usage
- Index usage
```

### **Storage Usage**

```bash
# Firebase Console → Storage → Usage
# Monitor:
- Total storage
- Bandwidth
- Operations
```

### **Debug Security Rules**

```bash
# Use Firebase Emulator Suite
firebase emulators:start

# Test rules locally
# Visit http://localhost:4000/firestore
```

---

## 🛠️ MAINTENANCE

### **Update Firestore Rules**

```bash
# Edit firestore.rules
# Then deploy
firebase deploy --only firestore:rules
```

### **Add New Indexes**

```bash
# Edit firestore.indexes.json
# Then deploy
firebase deploy --only firestore:indexes

# Or let Firebase auto-generate from error messages
```

### **Update Functions**

```bash
cd functions
npm install
npm run build
cd ..
firebase deploy --only functions
```

### **Backup Firestore Data**

```bash
# Export all data
gcloud firestore export gs://cryptorafts-backups/$(date +%Y%m%d)

# Or use Firebase Console → Firestore → Export
```

---

## 🌐 ENVIRONMENT VARIABLES

### **Required for Functions:**

```bash
# Set Firebase project config
firebase functions:config:set \
  admin.email="admin@cryptorafts.com" \
  app.url="https://cryptorafts.com"

# View current config
firebase functions:config:get
```

### **For Local Development:**

Create `functions/.env`:
```env
ADMIN_EMAIL=admin@cryptorafts.com
APP_URL=http://localhost:3000
```

---

## 📞 SUPPORT & TROUBLESHOOTING

### **Common Issues:**

#### **1. Permission Denied Errors**

```
FirebaseError: Missing or insufficient permissions
```

**Solution:**
- Check Firestore rules match query filters
- Ensure user has proper custom claims
- Verify user is authenticated
- Check member arrays for chat/org access

#### **2. Index Required Errors**

```
The query requires an index
```

**Solution:**
- Click the link in error message (auto-creates index)
- Or add index manually to `firestore.indexes.json`
- Deploy: `firebase deploy --only firestore:indexes`

#### **3. Function Timeout**

```
Function execution took too long
```

**Solution:**
- Optimize database queries
- Use batched writes
- Increase timeout in `firebase.json`

#### **4. Storage Upload Fails**

```
Storage: User does not have permission
```

**Solution:**
- Check storage.rules path matches upload path
- Verify file type is allowed
- Check file size limits
- Ensure user is authenticated

---

## 📚 ADDITIONAL RESOURCES

- **Firebase Documentation:** https://firebase.google.com/docs
- **Firestore Rules:** https://firebase.google.com/docs/firestore/security/get-started
- **Cloud Functions:** https://firebase.google.com/docs/functions
- **Firebase CLI:** https://firebase.google.com/docs/cli

---

## ✅ DEPLOYMENT CHECKLIST

Before going to production:

- [ ] Deploy Firestore rules
- [ ] Deploy Firestore indexes
- [ ] Deploy Storage rules
- [ ] Deploy Cloud Functions
- [ ] Test all user roles
- [ ] Verify security rules work
- [ ] Test file uploads
- [ ] Check audit logs are created
- [ ] Monitor function execution
- [ ] Set up backup strategy
- [ ] Configure alerts
- [ ] Test real-time features
- [ ] Verify custom claims sync

---

## 🎉 READY FOR PRODUCTION

Your Firebase setup is now production-grade with:

✅ Comprehensive security rules  
✅ Role-based access control  
✅ Audit logging  
✅ Real-time synchronization  
✅ Optimized indexes  
✅ Automated claim management  
✅ File storage with size limits  
✅ Executable blocking  
✅ PII protection  

**All set for launch!** 🚀

---

**Last Updated:** October 19, 2025  
**Firebase Project:** cryptorafts-b9067  
**Status:** Production Ready ✅

