# 🌐 SETUP www.cryptorafts.com - PERMANENT DOMAIN

## 🎯 **GOAL:**
Make **www.cryptorafts.com** the permanent production URL so you never have authorization issues again!

---

## 📋 **3-STEP SETUP:**

---

## **STEP 1: Add Domain to Vercel** ⚡

### 1.1 Go to Vercel Dashboard
```
https://vercel.com/anas-s-projects-8d19f880/cryptorafts-starter
```

### 1.2 Navigate to Settings
- Click on your project: **cryptorafts-starter**
- Click **"Settings"** tab
- Click **"Domains"** in left sidebar

### 1.3 Add Custom Domain
- Click **"Add"** button
- Enter: `www.cryptorafts.com`
- Click **"Add"**

### 1.4 Also Add Root Domain (Recommended)
- Click **"Add"** again
- Enter: `cryptorafts.com`
- Set to **redirect to** `www.cryptorafts.com`
- Click **"Add"**

### 1.5 Get DNS Records
Vercel will show you DNS records to add. They'll look like:

**For www.cryptorafts.com:**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

**For cryptorafts.com:**
```
Type: A
Name: @
Value: 76.76.21.21
```

---

## **STEP 2: Configure DNS** 🌐

### 2.1 Go to Your Domain Provider
This is where you bought cryptorafts.com (GoDaddy, Namecheap, Cloudflare, etc.)

### 2.2 Access DNS Settings
- Login to your domain provider
- Find your domain: **cryptorafts.com**
- Go to **DNS Settings** or **DNS Management**

### 2.3 Add DNS Records

#### Add CNAME Record for www:
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: Auto (or 3600)
```

#### Add A Record for root domain:
```
Type: A
Name: @ (or leave blank for root)
Value: 76.76.21.21
TTL: Auto (or 3600)
```

### 2.4 Save Changes
- Click **"Save"** or **"Update"**
- DNS propagation takes 5-60 minutes (usually ~5-10 minutes)

---

## **STEP 3: Add Domain to Firebase** 🔥

### 3.1 Go to Firebase Console
```
https://console.firebase.google.com/project/cryptorafts-b9067/authentication/settings
```

### 3.2 Navigate to Authorized Domains
- Click **"Authentication"** (left sidebar)
- Click **"Settings"** (top tab)
- Click **"Authorized domains"** tab

### 3.3 Add Both Domains
Click **"Add domain"** and add each:

1. Add: `www.cryptorafts.com`
2. Add: `cryptorafts.com` (if you want root domain to work too)

### 3.4 Save
- Click **"Add"** for each
- Wait 60 seconds for propagation

---

## ✅ **VERIFICATION:**

### After 10-15 Minutes (DNS Propagation):

#### Test 1: Check Domain Works
Open in incognito:
```
https://www.cryptorafts.com
```
Should show your app! ✅

#### Test 2: Check Admin Login Works
Open:
```
https://www.cryptorafts.com/admin/login
```
Click "Continue with Google" - should work! ✅

#### Test 3: Check SSL Certificate
Vercel automatically provisions SSL. Check that you see:
- 🔒 Lock icon in browser
- `https://` (not `http://`)

---

## 🎯 **BENEFITS:**

### Before (Vercel URLs):
❌ New URL for every deployment
❌ Need to authorize each URL in Firebase
❌ URLs look unprofessional
❌ Can't share stable links

### After (Custom Domain):
✅ Same URL forever: `www.cryptorafts.com`
✅ Authorize once in Firebase
✅ Professional branded URL
✅ Stable links you can share
✅ Automatic SSL certificate
✅ All deployments go to same domain

---

## 📝 **DETAILED INSTRUCTIONS BY DOMAIN PROVIDER:**

### GoDaddy:
1. Login to GoDaddy
2. My Products → Domains → cryptorafts.com → DNS
3. Add Records → CNAME → Name: www, Value: cname.vercel-dns.com
4. Add Records → A → Name: @, Value: 76.76.21.21
5. Save

### Namecheap:
1. Login to Namecheap
2. Domain List → Manage → Advanced DNS
3. Add New Record → CNAME → Host: www, Value: cname.vercel-dns.com
4. Add New Record → A Record → Host: @, Value: 76.76.21.21
5. Save

### Cloudflare:
1. Login to Cloudflare
2. Select domain: cryptorafts.com
3. DNS → Add record → CNAME → Name: www, Target: cname.vercel-dns.com
4. Add record → A → Name: @, IPv4: 76.76.21.21
5. Make sure proxy (orange cloud) is ON for security
6. Save

### Google Domains:
1. Login to Google Domains
2. My domains → cryptorafts.com → DNS
3. Custom records → Manage → Create new record
4. Type: CNAME, Host: www, Data: cname.vercel-dns.com
5. Create new record → Type: A, Host: @, Data: 76.76.21.21
6. Save

---

## 🔧 **TROUBLESHOOTING:**

### Issue: "Domain not yet propagated"
**Wait**: DNS takes 5-60 minutes to propagate globally
**Check**: Use https://www.whatsmydns.net to see propagation status

### Issue: "Invalid configuration"
**Fix**: Make sure CNAME value is exactly: `cname.vercel-dns.com` (no trailing dot)
**Fix**: Make sure A record value is: `76.76.21.21`

### Issue: "SSL certificate pending"
**Wait**: Vercel takes 2-5 minutes to provision SSL after DNS propagates
**Check**: Refresh Vercel dashboard to see certificate status

### Issue: "Firebase unauthorized domain"
**Fix**: Make sure you added both `www.cryptorafts.com` AND `cryptorafts.com` to Firebase authorized domains
**Wait**: 60 seconds after adding for Firebase to update

---

## 📊 **SETUP CHECKLIST:**

- [ ] **Vercel**: Added www.cryptorafts.com to domains
- [ ] **Vercel**: Added cryptorafts.com (redirects to www)
- [ ] **DNS**: Added CNAME record for www
- [ ] **DNS**: Added A record for root (@)
- [ ] **DNS**: Saved and confirmed changes
- [ ] **Firebase**: Added www.cryptorafts.com to authorized domains
- [ ] **Firebase**: Added cryptorafts.com to authorized domains
- [ ] **Wait**: 10-15 minutes for DNS propagation
- [ ] **Test**: www.cryptorafts.com loads the app
- [ ] **Test**: SSL certificate shows (🔒)
- [ ] **Test**: Admin login works with Google
- [ ] **Celebrate**: 🎉 Professional domain setup!

---

## 🚀 **QUICK START (If You Have Domain Access Now):**

### 5-Minute Setup:

1. **Vercel** (2 min):
   - Go to: https://vercel.com/anas-s-projects-8d19f880/cryptorafts-starter/settings/domains
   - Add: www.cryptorafts.com
   - Note the DNS records Vercel shows

2. **DNS Provider** (2 min):
   - Login to wherever you manage cryptorafts.com
   - Add CNAME: www → cname.vercel-dns.com
   - Add A: @ → 76.76.21.21
   - Save

3. **Firebase** (1 min):
   - Go to: https://console.firebase.google.com/project/cryptorafts-b9067/authentication/settings
   - Add authorized domain: www.cryptorafts.com
   - Add authorized domain: cryptorafts.com
   - Save

4. **Wait** (10 min):
   - DNS propagation: 5-15 minutes
   - SSL provisioning: 2-5 minutes

5. **Test**:
   - Open: https://www.cryptorafts.com
   - Should work! ✅

---

## 💡 **AFTER SETUP:**

### Your New Workflow:
```
1. Make code changes
2. Push to Git / Deploy to Vercel
3. Visit: www.cryptorafts.com
4. It just works! ✅
```

### No More:
❌ Changing URLs every deployment
❌ Adding domains to Firebase
❌ Authorization errors
❌ Ugly Vercel URLs

---

## 📞 **NEED HELP?**

### Can't Access Domain DNS?
If you don't have access to DNS settings:
1. Ask whoever manages the domain
2. Send them this guide
3. Or temporarily use: cryptorafts-starter.vercel.app

### Domain Provider Not Listed?
The process is similar for all providers:
1. Find DNS settings
2. Add CNAME record: www → cname.vercel-dns.com
3. Add A record: @ → 76.76.21.21
4. Save and wait 10 minutes

---

## ✅ **FINAL RESULT:**

After setup:
```
www.cryptorafts.com = Your live production app! 🎉
- Professional URL
- Automatic deployments
- Works forever
- No authorization issues
- SSL certificate
- Super fast
```

---

**🌐 Let's get www.cryptorafts.com live!** 

**Start with Step 1: Add domain to Vercel** 🚀

