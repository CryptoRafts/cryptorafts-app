# 🔧 PRODUCTION CONFIGURATION FOR CRYPTORAFTS.COM

## 🌐 **ENVIRONMENT VARIABLES**

Add these environment variables to your deployment platform (Vercel/Netlify/Firebase):

```env
# Firebase Configuration (Production)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAo2aRQPZU5naLm4bFCDbqTA1gNW8oFB14
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=cryptorafts-b9067.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=cryptorafts-b9067
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=cryptorafts-b9067.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=374711838796
NEXT_PUBLIC_FIREBASE_APP_ID=1:374711838796:web:3bee725bfa7d8790456ce9

# Production Settings
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://cryptorafts.com
NEXT_PUBLIC_APP_NAME=CryptoRafts

# Performance Settings
NEXT_PUBLIC_ANALYTICS_ID=G-XXXXXXXXXX
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=vercel_analytics

# Security Settings
NEXTAUTH_SECRET=your-production-secret-key
NEXTAUTH_URL=https://cryptorafts.com

# API Settings (Optional - for full functionality)
OPENAI_API_KEY=your-openai-key
STRIPE_SECRET_KEY=your-stripe-secret
STRIPE_PUBLISHABLE_KEY=your-stripe-publishable

# Email Settings (Optional - for contact forms)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## 🚀 **DEPLOYMENT PLATFORMS**

### **1. Vercel (Recommended)**
```bash
# Install Vercel CLI
npm i -g vercel

# Login and deploy
vercel login
vercel --prod

# Set environment variables in Vercel dashboard
# Add all the variables above
```

### **2. Netlify**
```bash
# Build for static export
npm run build:export

# Deploy via Netlify CLI
npm i -g netlify-cli
netlify deploy --prod

# Or drag & drop .next/out folder to Netlify
```

### **3. Firebase Hosting**
```bash
# Install Firebase CLI
npm i -g firebase-tools

# Login and deploy
firebase login
firebase deploy

# Set environment variables in Firebase console
```

## 🔧 **VERCEL SPECIFIC SETUP**

### **1. Connect Repository:**
- Go to vercel.com
- Import your GitHub repository
- Set build command: `npm run build`
- Set output directory: `.next`

### **2. Environment Variables:**
Add all the environment variables listed above in Vercel dashboard:
- Go to Project Settings → Environment Variables
- Add each variable for Production environment

### **3. Custom Domain:**
- Go to Project Settings → Domains
- Add `cryptorafts.com`
- Add `www.cryptorafts.com` (redirects to non-www)
- Update DNS records as instructed

## 📊 **PERFORMANCE MONITORING**

### **Vercel Analytics:**
```bash
# Enable Vercel Analytics
npm install @vercel/analytics

# Add to your app
import { Analytics } from '@vercel/analytics/react'
```

### **Google Analytics:**
```javascript
// Add to layout.tsx
<Script
  src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"
  strategy="afterInteractive"
/>
```

## 🔒 **SECURITY SETTINGS**

### **Headers Configuration:**
The `vercel.json` file already includes security headers:
- X-Frame-Options: SAMEORIGIN
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin

### **SSL Certificate:**
- Automatically provided by Vercel
- Force HTTPS redirect
- HSTS headers enabled

## 🎯 **FINAL DEPLOYMENT CHECKLIST**

### **Before Deployment:**
- [ ] All environment variables set
- [ ] Build successful (`npm run build`)
- [ ] No console errors
- [ ] All pages load correctly
- [ ] Mobile responsive

### **After Deployment:**
- [ ] Homepage loads at cryptorafts.com
- [ ] All 5 pages scroll smoothly
- [ ] Animations work correctly
- [ ] Video background plays
- [ ] Network statistics display
- [ ] Contact form functions
- [ ] SSL certificate active
- [ ] Performance score 90+

## 🚀 **QUICK DEPLOY COMMAND**

```bash
# One-command deployment to Vercel
vercel --prod --yes
```

**Your app will be live at: https://cryptorafts.com**
