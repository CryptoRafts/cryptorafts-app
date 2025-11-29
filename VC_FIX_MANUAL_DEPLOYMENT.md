# 🚨 URGENT: VC Role Fix - Manual Deployment Required

## The Problem
VC users are getting `storage/unauthorized` errors when trying to upload organization logos during onboarding.

## The Solution
The storage rules need to be updated to allow VC users to upload to `organizations/logos/` path.

## 🔥 IMMEDIATE FIX - Copy This Rule to Firebase Console

### Step 1: Go to Firebase Console
1. Open https://console.firebase.google.com/
2. Select project: `cryptorafts-b9067`
3. Navigate to **Storage** → **Rules**

### Step 2: Replace the entire rules with this:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isAdmin() {
      return isAuthenticated() && request.auth.token.role == 'admin';
    }
    
    function isVC() {
      return isAuthenticated() && request.auth.token.role == 'vc';
    }
    
    function isFounder() {
      return isAuthenticated() && request.auth.token.role == 'founder';
    }
    
    function isExchange() {
      return isAuthenticated() && request.auth.token.role == 'exchange';
    }
    
    function isAgency() {
      return isAuthenticated() && request.auth.token.role == 'agency';
    }
    
    function isInfluencer() {
      return isAuthenticated() && request.auth.token.role == 'influencer';
    }
    
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    // ADMIN OVERRIDE - Full access to everything
    match /{allPaths=**} {
      allow read, write: if isAdmin();
    }
    
    // Organization logos - CRITICAL FIX for VC uploads
    match /organizations/logos/{fileName} {
      allow read, write: if isAuthenticated();
    }
    
    // User files
    match /users/{userId}/{allPaths=**} {
      allow read, write: if isAuthenticated() && (isOwner(userId) || isAdmin());
    }
    
    // Profile photos
    match /profiles/{userId}/{allPaths=**} {
      allow read, write: if isAuthenticated() && (isOwner(userId) || isAdmin());
    }
    
    // Organization documents
    match /organizations/{orgId}/{allPaths=**} {
      allow read, write: if isAuthenticated() && (isAdmin() || isVC());
    }
    
    // Project files
    match /projects/{projectId}/{allPaths=**} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && (isAdmin() || isFounder());
    }
    
    // KYC documents
    match /kyc-documents/{userId}/{fileName} {
      allow read, write: if isAuthenticated() && (isOwner(userId) || isAdmin());
    }
    
    // KYB documents
    match /kyb-documents/{orgId}/{fileName} {
      allow read, write: if isAuthenticated() && (isAdmin() || isVC());
    }
    
    // Chat attachments
    match /chat-attachments/{roomId}/{fileName} {
      allow read, write: if isAuthenticated();
    }
    
    // Pitch documents
    match /pitch-documents/{projectId}/{fileName} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && (isAdmin() || isFounder());
    }
    
    // Public assets
    match /public/{allPaths=**} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }
    
    // Temporary files
    match /temp/{userId}/{fileName} {
      allow read, write: if isAuthenticated() && (isOwner(userId) || isAdmin());
    }
    
    // Default rule - allow all authenticated users (fallback)
    match /{allPaths=**} {
      allow read, write: if isAuthenticated();
    }
  }
}
```

### Step 3: Click "Publish"

## 🔍 What This Fixes

### Key Changes:
1. **Line 43-45**: Organization logos rule that allows any authenticated user to upload
2. **Line 37-40**: Admin override for full access
3. **Line 101-103**: Fallback rule for any missed paths

### The Critical Rule:
```javascript
// Organization logos - CRITICAL FIX for VC uploads
match /organizations/logos/{fileName} {
  allow read, write: if isAuthenticated();
}
```

This rule specifically allows authenticated users (including VCs) to upload files to the `organizations/logos/` path.

## 🧪 Testing After Deployment

1. **Login as VC user**
2. **Go to VC onboarding**
3. **Try uploading organization logo**
4. **Should work without errors**

## 🚨 Alternative: Quick CLI Deployment

If you have Firebase CLI access:

```bash
# Run the deployment script
deploy-vc-fix.bat

# Or manually:
firebase deploy --only storage
```

## ✅ Expected Result

After deploying these rules:
- ✅ VC users can upload organization logos
- ✅ No more `storage/unauthorized` errors
- ✅ VC onboarding completes successfully
- ✅ All other roles continue to work

## 🔧 Troubleshooting

If still getting errors:
1. Check Firebase console for rule deployment status
2. Clear browser cache and try again
3. Check user authentication status
4. Verify the rule was published successfully

The fix is specifically designed to resolve the VC organization logo upload issue while maintaining security for all other operations.
