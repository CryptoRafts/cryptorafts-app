# 🌐 Setup www.cryptorafts.com - Step by Step

## 📋 Vercel Domains Page is Now Open

---

## ✅ STEP 1: ADD DOMAINS IN VERCEL

### **Add Both Domains:**

1. In the Vercel page that just opened, click **"Add"** button

2. **First, add the apex domain:**
   - Type: `cryptorafts.com`
   - Click **"Add"**

3. **Then, add www subdomain:**
   - Click **"Add"** again
   - Type: `www.cryptorafts.com`
   - Click **"Add"**

---

## ✅ STEP 2: GET DNS RECORDS FROM VERCEL

After adding the domains, Vercel will show you DNS records to add.

### **For cryptorafts.com (apex):**
You'll see one of these:

**Option A: A Records**
```
Type: A
Name: @ (or leave blank)
Value: 76.76.21.21
TTL: Auto
```

**Option B: CNAME**
```
Type: CNAME
Name: @ (or leave blank)
Value: cname.vercel-dns.com.
TTL: Auto
```

### **For www.cryptorafts.com:**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com.
TTL: Auto
```

---

## ✅ STEP 3: ADD DNS RECORDS AT YOUR DOMAIN REGISTRAR

### **Where did you buy cryptorafts.com?**

#### **If GoDaddy:**
1. Go to: https://dcc.godaddy.com/manage/dns
2. Find `cryptorafts.com`
3. Click **"DNS"** button
4. Click **"Add"** to add records
5. Add the A or CNAME record from Vercel
6. Add the www CNAME record
7. Click **"Save"**

#### **If Namecheap:**
1. Go to: https://ap.www.namecheap.com/domains/list/
2. Click **"Manage"** next to cryptorafts.com
3. Click **"Advanced DNS"** tab
4. Click **"Add New Record"**
5. Add the A or CNAME record from Vercel
6. Add the www CNAME record
7. Click **"Save All Changes"**

#### **If Cloudflare:**
1. Go to: https://dash.cloudflare.com/
2. Select cryptorafts.com
3. Click **"DNS"** tab
4. Click **"Add record"**
5. Add the A or CNAME record from Vercel
6. Add the www CNAME record
7. **IMPORTANT:** Set **Proxy status** to **DNS only** (gray cloud, not orange)
8. Click **"Save"**

#### **If Google Domains / Squarespace:**
1. Go to your domain management
2. Find DNS settings
3. Add Custom records
4. Add the A or CNAME record from Vercel
5. Add the www CNAME record
6. Click **"Save"**

---

## ✅ STEP 4: WAIT FOR DNS PROPAGATION

### **How Long?**
- **Minimum:** 5 minutes
- **Typical:** 1-2 hours
- **Maximum:** 24-48 hours

### **Check Propagation:**
Visit these sites to check:
- https://dnschecker.org/
- https://www.whatsmydns.net/

Enter: `cryptorafts.com` and check if it points to Vercel

---

## ✅ STEP 5: VERIFY IN VERCEL

### **Back in Vercel Domains Page:**
1. Wait for the domains to show **"Valid Configuration"**
2. Vercel will automatically provision SSL certificates
3. You'll see green checkmarks when ready

---

## ✅ STEP 6: SET UP REDIRECT (RECOMMENDED)

### **Redirect www to apex (or vice versa):**

1. In Vercel Domains page
2. Find `www.cryptorafts.com`
3. Click the **⋮** menu next to it
4. Click **"Edit"**
5. Select **"Redirect to cryptorafts.com"**
6. Save

This ensures users always see the same URL!

---

## 🎯 AFTER SETUP IS COMPLETE:

### **Your site will be accessible at:**
```
https://cryptorafts.com
https://www.cryptorafts.com (redirects to apex)
```

### **Automatic Features:**
✅ HTTPS (SSL certificate)  
✅ Global CDN  
✅ All your VC features  
✅ Complete onboarding flow  
✅ All dashboards working  

---

## 💡 CURRENT WORKING URL (WHILE DNS PROPAGATES):

```
https://cryptorafts-starter-r1pxa15nb-anas-s-projects-8d19f880.vercel.app
```

This URL will continue to work even after you set up the custom domain!

---

## 📊 DNS RECORDS SUMMARY:

### **What You Need to Add:**

**For cryptorafts.com:**
- Type: A or CNAME
- Name: @ (root)
- Value: From Vercel

**For www.cryptorafts.com:**
- Type: CNAME
- Name: www
- Value: cname.vercel-dns.com.

---

## 🔍 TROUBLESHOOTING:

### **Domain Not Verifying?**
1. Wait 1-2 hours for DNS propagation
2. Check DNS records are correct
3. Make sure no conflicting records exist
4. If using Cloudflare, set to "DNS only" (not proxied)

### **SSL Certificate Not Issuing?**
1. Vercel auto-provisions SSL after DNS is verified
2. Wait up to 24 hours
3. If still not working, contact Vercel support

---

## ✨ EXPECTED RESULT:

After DNS propagates, your complete CryptoRafts platform will be live at:

**https://www.cryptorafts.com** 🚀

With:
- ✅ Complete VC onboarding
- ✅ Registration with logo
- ✅ KYB verification
- ✅ Approval workflow
- ✅ Full dashboard
- ✅ All features working!

---

**Current Status:** Vercel domains page opened  
**Next Step:** Add domains in Vercel, then update DNS  
**Time Required:** 5 minutes to add + 1-2 hours for DNS propagation

