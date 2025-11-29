# Vercel Deployment Guide

## ✅ Build Status
- **Build Status**: ✅ Successful
- **Build Time**: ~2 minutes
- **Routes Generated**: 261 pages
- **KYC Page**: `/founder/kyc` ✅ Included

## 🚀 Deployment Steps

### Option 1: Deploy via Vercel CLI (Recommended)

1. **Install Vercel CLI** (if not already installed):
```bash
npm i -g vercel
```

2. **Login to Vercel**:
```bash
vercel login
```

3. **Deploy to Production**:
```bash
vercel --prod
```

### Option 2: Deploy via Vercel Dashboard

1. **Push to GitHub** (if using Git):
   - Commit all changes
   - Push to your repository

2. **Deploy via Vercel Dashboard**:
   - Go to https://vercel.com/dashboard
   - Select your project
   - Click "Deploy" or it will auto-deploy on push

### Option 3: Deploy via GitHub Integration

1. **Connect Repository**:
   - Go to Vercel Dashboard → Add New Project
   - Connect your GitHub repository
   - Vercel will auto-detect Next.js

2. **Configure Build Settings**:
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

3. **Environment Variables**:
   Make sure these are set in Vercel Dashboard → Settings → Environment Variables:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
   - `FIREBASE_SERVICE_ACCOUNT_B64` (for server-side operations)

4. **Deploy**:
   - Click "Deploy"
   - Wait for build to complete

## 📋 Pre-Deployment Checklist

- [x] Build completes successfully
- [x] All routes generated correctly
- [x] KYC page included (`/founder/kyc`)
- [x] Firebase configuration correct
- [x] Error handling implemented (ERR_BLOCKED_BY_CLIENT suppressed)
- [x] KYC document sync to `kyc_documents` collection working
- [ ] Environment variables set in Vercel
- [ ] Firestore rules deployed
- [ ] Storage rules deployed

## 🔧 Post-Deployment Verification

After deployment, verify:

1. **KYC Page**:
   - Visit: `https://your-domain.com/founder/kyc`
   - Should show authentication check (if not logged in)
   - Should load KYC form (if logged in as founder)

2. **Admin KYC Page**:
   - Visit: `https://your-domain.com/admin/kyc`
   - Should show all founder KYC submissions
   - Documents should be viewable

3. **Console Check**:
   - Open browser console
   - Should see: ✅ Firebase initialized
   - Should NOT see: ERR_BLOCKED_BY_CLIENT errors (they're suppressed)

## 🐛 Troubleshooting

### Build Fails
- Check Node.js version (should be 18+)
- Verify all dependencies are in `package.json`
- Check for TypeScript errors: `npm run type-check`

### KYC Page Not Loading
- Verify Firebase environment variables are set
- Check Firestore rules are deployed
- Verify storage rules allow KYC document uploads

### Documents Not Syncing
- Check Firestore rules for `kyc_documents` collection
- Verify `updateKYCStatus` function is being called
- Check browser console for errors

## 📝 Notes

- The build uses `--webpack` flag for compatibility
- Static pages are pre-rendered for better performance
- Dynamic routes are server-rendered on demand
- All fixes for ERR_BLOCKED_BY_CLIENT are included in the build

