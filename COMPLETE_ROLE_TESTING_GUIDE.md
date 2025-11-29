# Complete Role Testing Guide

## Overview
This guide covers end-to-end testing for all four roles:
1. **Exchange** - Token listing platform
2. **IDO Platform** - Initial DEX Offering platform
3. **Marketing Agency** - Marketing and campaign management
4. **Influencer** - Campaign acceptance and collaboration

---

## ✅ Pre-Testing Checklist

### Code Fixes Applied:
- ✅ All API routes have comprehensive Firebase Admin error handling
- ✅ All dashboards have correct status logic (checking if action was by this user)
- ✅ All frontend error handlers display detailed error messages
- ✅ All routes use proper Firebase Admin initialization with retry logic

---

## 🔄 Exchange Role Testing

### Test Flow:
1. **Login**
   - Navigate to: `https://www.cryptorafts.com/login`
   - Login with exchange account (e.g., `exchangea1@gmail.com`)
   - Should redirect to `/exchange/dashboard`

2. **Dashboard**
   - Navigate to: `https://www.cryptorafts.com/exchange/dashboard`
   - ✅ Verify projects show correct status:
     - **Active**: Projects accepted by THIS exchange (`exchangeAction === 'accepted' && exchangeActionBy === user.uid`)
     - **Pending**: Projects approved but not yet accepted
     - **Suspended**: Only if explicitly rejected by THIS exchange OR rejected by admin
   - ✅ Verify real-time updates work
   - ✅ Verify projects filter correctly

3. **Listings Page**
   - Navigate to: `https://www.cryptorafts.com/exchange/listings`
   - ✅ Verify same status logic as dashboard
   - ✅ Verify projects display correctly

4. **Dealflow**
   - Navigate to: `https://www.cryptorafts.com/exchange/dealflow`
   - ✅ Verify projects are visible
   - ✅ Verify filtering works

5. **Accept Pitch** (CRITICAL TEST)
   - Navigate to a project: `https://www.cryptorafts.com/exchange/project/[projectId]`
   - Click "Accept Pitch" button
   - ✅ **Expected**: Should work without 500 errors
   - ✅ **Expected**: Should show detailed error if Firebase credentials missing (not generic 500)
   - ✅ **Expected**: Should create chat room and redirect to messages
   - ✅ **Expected**: Should update project status to "accepted"
   - ✅ **Expected**: Should create notification for founder

6. **Error Handling Test**
   - If Firebase credentials are missing, should see:
     - Error message: "Firebase Admin credentials not configured"
     - Details: Clear explanation
     - Solution: Instructions to add FIREBASE_SERVICE_ACCOUNT_B64
     - Help URL: Link to Vercel settings

---

## 🚀 IDO Platform Role Testing

### Test Flow:
1. **Login**
   - Navigate to: `https://www.cryptorafts.com/login`
   - Login with IDO account
   - Should redirect to `/ido/dashboard`

2. **Dashboard**
   - Navigate to: `https://www.cryptorafts.com/ido/dashboard`
   - ✅ Verify projects show correct status:
     - **Active**: Projects accepted by THIS IDO (`idoAction === 'accepted' && idoActionBy === user.uid`)
     - **Upcoming**: Projects approved but not yet accepted
     - **Cancelled**: Only if explicitly rejected by THIS IDO OR rejected by admin
   - ✅ Verify real-time updates work
   - ✅ Verify projects filter correctly

3. **Dealflow**
   - Navigate to: `https://www.cryptorafts.com/ido/dealflow`
   - ✅ Verify projects are visible
   - ✅ Verify filtering works

4. **Accept Pitch** (CRITICAL TEST)
   - Navigate to a project: `https://www.cryptorafts.com/ido/project/[projectId]`
   - Click "Accept Pitch" button
   - ✅ **Expected**: Should work without 500 errors
   - ✅ **Expected**: Should show detailed error if Firebase credentials missing
   - ✅ **Expected**: Should create chat room and redirect to messages
   - ✅ **Expected**: Should update project status to "accepted"
   - ✅ **Expected**: Should create notification for founder

5. **Error Handling Test**
   - Should display detailed error messages like Exchange role

---

## 🎯 Marketing Agency Role Testing

### Test Flow:
1. **Login**
   - Navigate to: `https://www.cryptorafts.com/login`
   - Login with agency account
   - Should redirect to `/agency/dashboard`

2. **Dashboard**
   - Navigate to: `https://www.cryptorafts.com/agency/dashboard`
   - ✅ Verify clients show correct status:
     - **Active**: Projects accepted by THIS agency (`agencyAction === 'accepted' && agencyActionBy === user.uid`)
     - **Pending**: Projects approved but not yet accepted
     - **Completed**: Only if explicitly rejected by THIS agency OR rejected by admin
   - ✅ Verify real-time updates work
   - ✅ Verify clients filter correctly

3. **Dealflow**
   - Navigate to: `https://www.cryptorafts.com/agency/dealflow`
   - ✅ Verify projects are visible
   - ✅ Verify filtering works

4. **Accept Pitch** (CRITICAL TEST)
   - Navigate to a project: `https://www.cryptorafts.com/agency/project/[projectId]`
   - Click "Accept Pitch" button
   - ✅ **Expected**: Should work without 500 errors
   - ✅ **Expected**: Should show detailed error if Firebase credentials missing
   - ✅ **Expected**: Should create chat room and redirect to messages
   - ✅ **Expected**: Should update project status to "accepted"
   - ✅ **Expected**: Should create notification for founder

5. **Error Handling Test**
   - Should display detailed error messages like Exchange role

---

## 📱 Influencer Role Testing

### Test Flow:
1. **Login**
   - Navigate to: `https://www.cryptorafts.com/login`
   - Login with influencer account
   - Should redirect to `/influencer/dashboard`

2. **Dashboard**
   - Navigate to: `https://www.cryptorafts.com/influencer/dashboard`
   - ✅ Verify campaigns show correct status:
     - **Active**: Campaigns accepted by THIS influencer (`influencerAction === 'accepted' && influencerActionBy === user.uid`)
     - **Pending**: Campaigns approved but not yet accepted
     - **Completed**: Only if explicitly rejected by THIS influencer OR rejected by admin
   - ✅ Verify real-time updates work
   - ✅ Verify campaigns filter correctly

3. **Dealflow**
   - Navigate to: `https://www.cryptorafts.com/influencer/dealflow`
   - ✅ Verify projects are visible
   - ✅ Verify filtering works

4. **Accept Campaign** (CRITICAL TEST)
   - Navigate to a project: `https://www.cryptorafts.com/influencer/project/[projectId]`
   - Click "Accept Campaign" button
   - ✅ **Expected**: Should work without 500 errors
   - ✅ **Expected**: Should show detailed error if Firebase credentials missing
   - ✅ **Expected**: Should create campaign room and redirect to messages
   - ✅ **Expected**: Should update project status to "accepted"
   - ✅ **Expected**: Should create notification for founder

5. **Error Handling Test**
   - Should display detailed error messages like Exchange role

---

## 🧪 Common Test Scenarios

### Scenario 1: Firebase Credentials Missing
**Expected Behavior:**
- API returns 503 status
- Error message: "Firebase Admin credentials not configured"
- Details: Clear explanation
- Solution: Instructions provided
- Help URL: Link to Vercel settings

### Scenario 2: Project Already Accepted
**Expected Behavior:**
- Should reuse existing chat room
- Should not create duplicate relations
- Should show appropriate message

### Scenario 3: Invalid Project ID
**Expected Behavior:**
- API returns 404 status
- Error message: "Project not found"
- Frontend shows clear error

### Scenario 4: Unauthorized Access
**Expected Behavior:**
- API returns 401 status
- Error message: "Invalid or expired token"
- User redirected to login

---

## ✅ Verification Checklist

### For Each Role:
- [ ] Dashboard loads without errors
- [ ] Status logic works correctly (active/pending/suspended)
- [ ] Real-time updates work
- [ ] Accept pitch/campaign works
- [ ] Error messages are detailed and helpful
- [ ] Chat room is created correctly
- [ ] Notification is sent to founder
- [ ] Project status updates correctly
- [ ] Relations are created correctly

### API Endpoints to Verify:
- [ ] `/api/exchange/accept-pitch` - Works with proper error handling
- [ ] `/api/ido/accept-pitch` - Works with proper error handling
- [ ] `/api/agency/accept-pitch` - Works with proper error handling
- [ ] `/api/influencer/accept-campaign` - Works with proper error handling

---

## 🐛 Known Issues Fixed

1. ✅ **500 Internal Server Error** - Fixed with comprehensive error handling
2. ✅ **"Could not load the default credentials"** - Fixed with proper initialization
3. ✅ **Projects showing as "suspended" incorrectly** - Fixed status logic
4. ✅ **Generic error messages** - Fixed with detailed error responses
5. ✅ **Database errors not caught** - Fixed with try-catch blocks

---

## 📝 Test Results Template

```
Role: [Exchange/IDO/Agency/Influencer]
Date: [Date]
Tester: [Name]

Dashboard:
- [ ] Loads correctly
- [ ] Status logic works
- [ ] Real-time updates work

Accept Pitch/Campaign:
- [ ] Works without errors
- [ ] Creates chat room
- [ ] Updates project status
- [ ] Sends notification
- [ ] Error handling works

Notes:
[Any issues found]
```

---

## 🚀 Next Steps

1. Test each role with valid credentials
2. Verify all error scenarios
3. Check chat room creation
4. Verify notifications
5. Test status updates
6. Document any issues found

---

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Check network tab for API responses
3. Verify Firebase credentials are configured
4. Check Vercel environment variables
5. Review error messages for specific guidance

