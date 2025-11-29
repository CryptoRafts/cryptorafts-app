# 🚀 Deploy to Vercel - Fresh Build Guide

## ✅ Pre-Deployment Checklist

Before deploying, make sure:

- [x] Twitter/X credentials are set in `.env.local`
- [ ] Environment variables are added to Vercel
- [ ] Build passes locally: `npm run build`
- [ ] Git is committed and pushed

## 📋 Step-by-Step Deployment

### Step 1: Add Environment Variables to Vercel

**IMPORTANT:** Add these to Vercel dashboard before deploying:

1. **Go to Vercel Dashboard:**
   - https://vercel.com/dashboard
   - Select your project

2. **Go to Settings → Environment Variables**

3. **Add these variables:**

   ```env
   # X (Twitter) OAuth 2.0
   TWITTER_CLIENT_ID=bzBaXzl4dmxCamoxLU5RUlNvOUg6MTpjaQ
   TWITTER_CLIENT_SECRET=7W4BMtgX2Raui8Q8UJySy71KKjEFRJYRy8Lo0k-frs-tlMPj3e
   TWITTER_REDIRECT_URI=https://cryptorafts.com/api/blog/oauth/x/callback
   
   # App URL
   NEXT_PUBLIC_APP_URL=https://cryptorafts.com
   ```

4. **Also add any other environment variables** from your `.env.local`:
   - Firebase credentials
   - Database URLs
   - Other API keys
   - etc.

5. **Make sure to set them for:**
   - ✅ Production
   - ✅ Preview
   - ✅ Development

### Step 2: Commit and Push Changes

```bash
git add .
git commit -m "Add Twitter/X OAuth integration"
git push
```

### Step 3: Deploy to Vercel

**Option A: Via Vercel Dashboard (Recommended)**

1. **Go to:** https://vercel.com/dashboard
2. **Select your project**
3. **Click "Deployments" tab**
4. **Click "Redeploy"** on the latest deployment
5. **Or push to your main branch** - Vercel will auto-deploy

**Option B: Via Vercel CLI**

```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

### Step 4: Verify Deployment

1. **Check build logs** in Vercel dashboard
2. **Wait for deployment to complete**
3. **Visit:** https://cryptorafts.com
4. **Test X connection:**
   - Go to: https://cryptorafts.com/admin/blog
   - Click "Connect" on X (Twitter)
   - Should redirect to Twitter OAuth

### Step 5: Test X Integration

1. **Connect X account** on production site
2. **Create a test blog post**
3. **Select X platform** and publish
4. **Check** https://x.com/cryptoraftsblog - tweet should appear! 🎉

---

## 🔧 Troubleshooting

### Build Fails

- Check build logs in Vercel dashboard
- Make sure all environment variables are set
- Try building locally: `npm run build`

### X Connection Fails

- Verify `TWITTER_REDIRECT_URI` matches exactly: `https://cryptorafts.com/api/blog/oauth/x/callback`
- Check Twitter app settings - callback URL must match
- Verify credentials are correct in Vercel environment variables

### Environment Variables Not Working

- Make sure variables are set for **Production** environment
- Redeploy after adding variables
- Check variable names match exactly (case-sensitive)

---

## ✅ Post-Deployment Checklist

- [ ] Build completed successfully
- [ ] Site loads at https://cryptorafts.com
- [ ] X connection works
- [ ] Test post published to X
- [ ] All features working

---

**Ready to deploy!** Make sure environment variables are set in Vercel first! 🚀
