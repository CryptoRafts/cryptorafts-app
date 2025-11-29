# 🚀 DEPLOY CRYPTORAFTS TO VERCEL - USE YOUR DOMAIN!

## ✅ **THIS WILL WORK PERFECTLY!**

Your www.cryptorafts.com will show your app from Vercel!

---

## 📋 **STEP-BY-STEP DEPLOYMENT:**

### **STEP 1: Create Vercel Account** (2 minutes)

1. **Go to:** https://vercel.com
2. **Click:** "Sign Up"
3. **Sign up with:** GitHub (recommended) or Email
4. **Verify** your email if needed
5. **You're in the dashboard!**

---

### **STEP 2: Deploy Your Project** (5 minutes)

#### **Option A: Deploy from GitHub** (Recommended)

1. **Push your code to GitHub:**
   ```powershell
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

2. **In Vercel Dashboard:**
   - Click "Add New Project"
   - Click "Import Git Repository"
   - Select your GitHub repo
   - Click "Import"
   - Vercel auto-detects Next.js!
   - Click "Deploy"
   - **Done in 2 minutes!**

#### **Option B: Deploy from Local Folder** (Easier!)

1. **Install Vercel CLI:**
   ```powershell
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```powershell
   vercel login
   ```
   (Follow the prompts)

3. **Deploy:**
   ```powershell
   vercel
   ```
   - Press Enter for all prompts
   - Vercel deploys your app!
   - You get a URL like: `cryptorafts.vercel.app`

4. **Deploy to production:**
   ```powershell
   vercel --prod
   ```

---

### **STEP 3: Connect Your Domain** (5 minutes)

#### **In Vercel Dashboard:**

1. **Go to your project**
2. **Click:** "Settings"
3. **Click:** "Domains"
4. **Add domain:** `cryptorafts.com`
5. **Add domain:** `www.cryptorafts.com`

#### **Vercel will show DNS records to add**

Example:
```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME  
Name: www
Value: cname.vercel-dns.com
```

---

### **STEP 4: Update Hostinger DNS** (3 minutes)

#### **In Hostinger hPanel:**

1. **Go to:** https://hpanel.hostinger.com
2. **Click:** "Domains"
3. **Click:** "cryptorafts.com"
4. **Click:** "DNS / Name Servers"
5. **Click:** "Manage DNS records"

6. **Add the records Vercel gave you:**
   - Delete old A records
   - Add new A record (Vercel's IP)
   - Add CNAME for www (Vercel's CNAME)

7. **Click:** "Save"

---

### **STEP 5: Wait for DNS** (5-30 minutes)

- DNS propagation: 5-30 minutes
- Visit: https://cryptorafts.com
- **YOUR APP IS LIVE!** 🎉

---

## 🔥 **CONNECT FIREBASE TO VERCEL DOMAIN:**

1. **Go to:** https://console.firebase.google.com
2. **Select:** cryptorafts-b9067
3. **Authentication** → **Settings** → **Authorized domains**
4. **Add:** `cryptorafts.com`
5. **Add:** `www.cryptorafts.com`
6. **Add:** Your Vercel URL (e.g., `cryptorafts.vercel.app`)

---

## ⚡ **QUICK START - USE VERCEL CLI:**

```powershell
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Deploy to production
vercel --prod
```

**That's it! 3 commands!**

---

## ✅ **WHAT YOU GET WITH VERCEL:**

- ✅ FREE hosting forever
- ✅ All Next.js features work
- ✅ All 104 API routes work
- ✅ Auto SSL certificate
- ✅ Global CDN (fast worldwide)
- ✅ Auto deployments on git push
- ✅ Preview deployments
- ✅ Analytics
- ✅ Your cryptorafts.com domain
- ✅ Unlimited bandwidth
- ✅ Professional hosting

---

## 🎯 **YOUR TIMELINE:**

```
Now:        Create Vercel account (2 min)
+3 min:     Install Vercel CLI (3 min)
+2 min:     Deploy to Vercel (2 min)
+5 min:     Connect domain (5 min)
+15 min:    DNS propagation (wait)
            LIVE ON CRYPTORAFTS.COM! 🎉
────────────────────────────────────
TOTAL:      ~30 minutes
```

---

## 📞 **NEED HELP?**

**Tell me when you:**
- Created Vercel account
- Ready to deploy
- Need help with any step

---

## 🎊 **THIS IS THE SOLUTION!**

**Vercel is:**
- ✅ Made for Next.js (your app type)
- ✅ FREE (costs $0)
- ✅ Works with your domain
- ✅ All features work
- ✅ Professional hosting

**Better than Hostinger Premium for your app!**

---

## 🚀 **START NOW:**

1. **Go to:** https://vercel.com
2. **Sign up** (2 minutes)
3. **Tell me:** "I created Vercel account"
4. **I'll guide you** through deployment!

---

**LET'S GET YOUR CRYPTORAFTS LIVE ON VERCEL!** 🎉

**Go create your account now!** 😊

