# Route Debugging Guide

## ✅ Fixed Issues

1. **Route Conflict**: Removed `src/app/test-wallet/route.ts` that was conflicting with `page.tsx`

## 🔍 Route Verification

**Founder Registration Page:**
- ✅ File exists: `src/app/founder/register/page.tsx`
- ✅ Export: `export default function FounderRegisterPage()`
- ✅ Route: `/founder/register`
- ✅ URL: `http://localhost:3000/founder/register`

## 🐛 Troubleshooting 404 Error

### Step 1: Restart Dev Server
```bash
# Stop current server (Ctrl+C)
npm run dev
```

### Step 2: Check Browser Console
- Open DevTools (F12)
- Check for errors in Console tab
- Check Network tab for failed requests

### Step 3: Verify Authentication
- Make sure you're logged in
- The layout guard might be redirecting
- Check if you have `founder` role

### Step 4: Check Layout Guard
The `src/app/founder/layout.tsx` has an `OnboardingGuard` that:
- Checks if user is authenticated
- Validates onboarding flow
- May redirect if conditions aren't met

### Step 5: Direct URL Test
Try accessing directly:
```
http://localhost:3000/founder/register
```

## 📝 Common Causes

1. **Not Logged In**: Layout guard redirects to `/login`
2. **Wrong Role**: User doesn't have `founder` role
3. **Build Error**: Check terminal for build errors
4. **Dev Server Not Running**: Restart with `npm run dev`
5. **Cache Issue**: Clear browser cache or use incognito mode

## 🔧 Quick Fixes

### Clear Next.js Cache
```bash
rm -rf .next
npm run dev
```

### Check Build Status
```bash
npm run build
```

### Verify Route Structure
```
src/app/
  └── founder/
      ├── layout.tsx
      ├── page.tsx (redirects to dashboard)
      └── register/
          └── page.tsx ✅ (This is the registration page)
```

## 🚀 Expected Behavior

1. Navigate to: `http://localhost:3000/founder/register`
2. If not logged in → Redirects to `/login`
3. If logged in but no founder role → May redirect
4. If logged in with founder role → Shows registration form
5. After form submission → Shows wallet connection
6. After wallet connection → Redirects to `/founder/kyc`

---

**Status**: Route exists and should work  
**Next Step**: Restart dev server and try again


