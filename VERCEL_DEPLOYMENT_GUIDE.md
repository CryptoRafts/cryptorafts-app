# Vercel Deployment Guide

## 🚀 Quick Deploy to Vercel

### Option 1: Deploy via Vercel CLI (Recommended)

1. **Install Vercel CLI** (if not already installed):
```bash
npm i -g vercel
```

2. **Login to Vercel**:
```bash
vercel login
```

3. **Deploy**:
```bash
vercel
```

4. **For Production**:
```bash
vercel --prod
```

### Option 2: Deploy via GitHub Integration

1. **Push to GitHub** (if not already):
```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js settings

3. **Configure Environment Variables**:
   - Add all required env vars in Vercel dashboard
   - Settings → Environment Variables

### Option 3: Deploy via Vercel Dashboard

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import your repository
4. Configure build settings (auto-detected for Next.js)
5. Add environment variables
6. Click "Deploy"

---

## ⚙️ Build Configuration

**Current Settings** (in `vercel.json`):
- Framework: Next.js
- Build Command: `npm run build`
- Install Command: `npm install`
- Output Directory: `.next` (auto)

---

## 🔧 Environment Variables

Add these in Vercel Dashboard → Settings → Environment Variables:

### Required:
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_BNB_CHAIN_ID` (97 for testnet)
- `NEXT_PUBLIC_BNB_RPC_URL`

### Optional:
- `NEXT_PUBLIC_BNB_PROJECT_REGISTRY_ADDRESS`
- `NEXT_PUBLIC_BNB_KYC_CONTRACT_ADDRESS`
- Other API keys as needed

---

## 🐛 Current Build Issue

**Status**: Build has syntax error in `WebRTCCallModal.tsx`

**Workaround Options**:

1. **Fix the syntax error** (recommended):
   - Error at line 5196 in `src/components/WebRTCCallModal.tsx`
   - Remove all `!important` from React inline styles
   - Fix any missing brackets/braces

2. **Temporarily exclude the component**:
   - Comment out imports of `WebRTCCallModal`
   - Deploy without it
   - Fix later

3. **Deploy with build errors** (not recommended):
   - Vercel will show build failures
   - Won't deploy successfully

---

## 📝 Pre-Deployment Checklist

- [ ] Fix build errors
- [ ] Test `npm run build` locally
- [ ] Add all environment variables to Vercel
- [ ] Verify `vercel.json` configuration
- [ ] Check `.vercelignore` excludes unnecessary files
- [ ] Test wallet connection on testnet
- [ ] Verify all routes work

---

## 🧪 Testing After Deployment

1. **Test Wallet Connection**:
   - Navigate to: `https://your-app.vercel.app/founder/register`
   - Complete registration
   - Test wallet connection
   - Verify network switches to BSC Testnet

2. **Check Console**:
   - Open browser DevTools
   - Check for errors
   - Verify wallet detection

---

## 🔄 Continuous Deployment

Once connected to GitHub:
- Every push to `main` branch auto-deploys
- Preview deployments for PRs
- Automatic rollback on errors

---

## 📊 Deployment Status

**Current**: ❌ Build failing (syntax error)  
**Next Step**: Fix `WebRTCCallModal.tsx` syntax error  
**Target**: Deploy to Vercel for testing

---

**Note**: Fix the build error before deploying to Vercel. The deployment will fail if the build fails.
