# 🌐 CONNECT HOSTINGER DOMAIN TO VERCEL

## ✅ **You have cryptorafts.com at Hostinger - Let's point it to Vercel!**

---

## 🎯 **2 OPTIONS:**

### **Option A: Point DNS to Vercel** (Recommended - Use Vercel's App)
Keep domain at Hostinger, point DNS to Vercel app

### **Option B: Keep Hostinger** (Upload Next.js Build)
Deploy the built app to Hostinger's server

**I recommend Option A** - Vercel is optimized for Next.js with auto-deployments, CDN, etc.

---

## 🚀 **OPTION A: POINT HOSTINGER DNS TO VERCEL** (Recommended)

---

### **STEP 1: Add Domain to Vercel**

Go to:
```
https://vercel.com/anas-s-projects-8d19f880/cryptorafts-starter/settings/domains
```

1. Click **"Add"** button
2. Enter: `www.cryptorafts.com`
3. Click **"Add"**
4. Vercel shows: `CNAME: www → cname.vercel-dns.com`
5. **Keep tab open!**

---

### **STEP 2: Login to Hostinger**

Go to:
```
https://hpanel.hostinger.com
```

Login with your Hostinger account

---

### **STEP 3: Access DNS Zone Editor**

1. Click on **"Domains"** in top menu
2. Find **cryptorafts.com**
3. Click **"Manage"** button next to it
4. Click **"DNS / Name Servers"** tab
5. You'll see "DNS Zone Editor" section

---

### **STEP 4: Update DNS Records**

#### 4.1 Add/Update CNAME for www:

Look for existing **"www"** CNAME record:
- **If it exists**: Click **"Edit"** icon
- **If not**: Click **"Add Record"**

Set values:
```
Type: CNAME
Name: www
Points to: cname.vercel-dns.com
TTL: 3600 (or 14400)
```

Click **"Save"** or **"Add Record"**

#### 4.2 Update A Record for Root:

Look for **"@"** or root A record:
- **If it exists**: Click **"Edit"** icon
- **If not**: Click **"Add Record"**

Set values:
```
Type: A
Name: @ (or leave empty for root)
Points to: 76.76.21.21
TTL: 3600 (or 14400)
```

Click **"Save"** or **"Add Record"**

---

### **STEP 5: Add to Firebase**

Go to:
```
https://console.firebase.google.com/project/cryptorafts-b9067/authentication/settings
```

1. Scroll to **"Authorized domains"**
2. Click **"Add domain"**
3. Enter: `www.cryptorafts.com`
4. Click **"Add"**
5. Click **"Add domain"** again
6. Enter: `cryptorafts.com`
7. Click **"Add"**

---

### **STEP 6: Wait 10-15 Minutes**

DNS propagation takes time:
- ⏰ Set a timer for 15 minutes
- ☕ Take a break

---

### **STEP 7: Test!**

After 15 minutes, open:
```
https://www.cryptorafts.com
```

Should show your app! 🎉

Then test admin:
```
https://www.cryptorafts.com/admin/login
```

Should work perfectly with all fixes! ✅

---

## 📋 **HOSTINGER DNS SCREENSHOTS (What to Look For):**

### DNS Zone Editor Section:
```
┌─────────────────────────────────────────────┐
│ DNS Records                                  │
├──────┬────────┬──────────────────────────────┤
│ Type │ Name   │ Points to                     │
├──────┼────────┼──────────────────────────────┤
│ A    │ @      │ 76.76.21.21                  │ ← Update this
│ CNAME│ www    │ cname.vercel-dns.com         │ ← Update this
└──────┴────────┴──────────────────────────────┘
```

---

## 🔧 **OPTION B: DEPLOY TO HOSTINGER** (Alternative)

If you want to use Hostinger's hosting instead of Vercel:

### STEP 1: Build the App Locally

Run in your terminal:
```bash
npm run build
```

This creates a `.next` folder with the built app.

### STEP 2: Export Static Version

Add to `next.config.js`:
```javascript
module.exports = {
  output: 'export',
  images: {
    unoptimized: true
  }
}
```

Then run:
```bash
npm run build
```

### STEP 3: Upload to Hostinger

1. Go to Hostinger File Manager
2. Upload contents of `out` folder
3. Point domain to the uploaded files

**⚠️ WARNING**: This option is more complex and you lose:
- Auto-deployments
- Server-side features
- Optimized CDN
- Easy updates

**I strongly recommend Option A (point DNS to Vercel)!**

---

## ✅ **RECOMMENDED: OPTION A**

Here's why:
- ✅ Vercel is optimized for Next.js
- ✅ Auto-deploys when you push code
- ✅ Global CDN (super fast)
- ✅ Free SSL certificate
- ✅ Easy rollbacks
- ✅ Analytics included
- ✅ Just works!

---

## 🎯 **YOUR EXACT STEPS (OPTION A):**

1. **Vercel**: Add www.cryptorafts.com
2. **Hostinger hPanel**: Update DNS records (CNAME www → cname.vercel-dns.com)
3. **Hostinger hPanel**: Update A record (@ → 76.76.21.21)
4. **Firebase**: Add www.cryptorafts.com and cryptorafts.com to authorized domains
5. **Wait**: 15 minutes
6. **Test**: https://www.cryptorafts.com
7. **Enjoy**: Professional domain with all fixes! 🎉

---

## 📞 **NEED HELP?**

Tell me:
1. **Do you want to use Option A** (point Hostinger DNS to Vercel)? ✅ Recommended
2. **Or Option B** (deploy to Hostinger servers)? ⚠️ More complex

For Option A, I just need you to:
- Login to Hostinger hPanel
- Go to DNS settings for cryptorafts.com
- Update the 2 records (CNAME and A)
- That's it!

---

**🚀 START WITH STEP 1: Add www.cryptorafts.com to Vercel!**

Link: https://vercel.com/anas-s-projects-8d19f880/cryptorafts-starter/settings/domains

