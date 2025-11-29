# 🌐 Setting Up cryptorafts.com on Vercel

## 📋 Prerequisites

- Access to your domain registrar (where you bought cryptorafts.com)
- Vercel account with the CryptoRafts project deployed

---

## 🚀 Step-by-Step Instructions

### **Step 1: Go to Vercel Dashboard**

1. Open: https://vercel.com/dashboard
2. Click on your project: **cryptorafts-starter**
3. Click **Settings** tab
4. Click **Domains** in the left sidebar

---

### **Step 2: Add Your Domains**

Add **BOTH** of these domains:

#### **Add cryptorafts.com (apex domain)**
1. Click **"Add"** button
2. Enter: `cryptorafts.com`
3. Click **"Add"**

#### **Add www.cryptorafts.com**
1. Click **"Add"** button again
2. Enter: `www.cryptorafts.com`
3. Click **"Add"**

---

### **Step 3: Configure DNS Records**

Vercel will show you the DNS records you need to add. You'll need to add these in your domain registrar's DNS settings.

#### **For cryptorafts.com (apex domain):**

**Option A: A Records (Recommended)**
```
Type: A
Name: @ (or leave blank for root domain)
Value: 76.76.21.21
TTL: 3600 (or Auto)
```

**Option B: CNAME Records (Alternative)**
```
Type: CNAME
Name: @ (or leave blank)
Value: cname.vercel-dns.com.
TTL: 3600 (or Auto)
```

#### **For www.cryptorafts.com:**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com.
TTL: 3600 (or Auto)
```

---

### **Step 4: Update DNS at Your Registrar**

#### **Common Registrars:**

**GoDaddy:**
1. Go to https://dcc.godaddy.com/manage/dns
2. Find cryptorafts.com
3. Click **"DNS"**
4. Click **"Add"** to add records
5. Add the A and CNAME records from Step 3

**Namecheap:**
1. Go to https://ap.www.namecheap.com/domains/list/
2. Click **"Manage"** next to cryptorafts.com
3. Click **"Advanced DNS"** tab
4. Click **"Add New Record"**
5. Add the A and CNAME records from Step 3

**Cloudflare:**
1. Go to https://dash.cloudflare.com/
2. Select cryptorafts.com
3. Click **"DNS"** tab
4. Click **"Add record"**
5. Add the A and CNAME records from Step 3
6. **Important:** Set **Proxy status** to **DNS only** (gray cloud icon)

**Google Domains / Squarespace:**
1. Go to your domain management
2. Find DNS settings
3. Add Custom records
4. Add the A and CNAME records from Step 3

---

### **Step 5: Enable Automatic HTTPS**

Back in Vercel:
1. Vercel automatically provisions SSL certificates
2. Wait 24-48 hours for DNS propagation
3. Your site will be accessible via HTTPS automatically

---

### **Step 6: Set Up Redirect (Recommended)**

To redirect www to apex (or vice versa):

1. In Vercel **Domains** settings
2. Find `www.cryptorafts.com`
3. Click the **⋮** menu next to it
4. Click **"Edit"**
5. Select **"Redirect to cryptorafts.com"**
6. Save

This ensures users always see the same URL.

---

## ✅ Verification Steps

### **Check DNS Propagation:**
```bash
# Check A record
nslookup cryptorafts.com

# Check CNAME
nslookup www.cryptorafts.com
```

### **Online Tools:**
- https://dnschecker.org/
- https://www.whatsmydns.net/

### **Expected Results:**
- `cryptorafts.com` → Points to Vercel
- `www.cryptorafts.com` → Points to Vercel
- Both URLs show your CryptoRafts site
- HTTPS works automatically

---

## ⏱️ Timing

- **DNS propagation:** 5 minutes to 48 hours (usually 1-2 hours)
- **SSL certificate:** Automatic (issued within minutes after DNS is verified)

---

## 🔥 Current Production URL (Until Domain is Set Up):

```
https://cryptorafts-starter-doe1uu8cb-anas-s-projects-8d19f880.vercel.app
```

This URL will continue to work even after you set up your custom domain.

---

## 🛠️ Troubleshooting

### **Domain Not Verifying?**
1. Wait 1-2 hours for DNS propagation
2. Check DNS records are correct (use dnschecker.org)
3. Make sure there are no conflicting records
4. If using Cloudflare, set to "DNS only" (not proxied)

### **SSL Certificate Issues?**
1. Vercel provisions SSL automatically
2. Wait 24 hours after DNS is verified
3. If still not working, contact Vercel support

### **www vs Non-www?**
1. Add both domains in Vercel
2. Set one to redirect to the other
3. Choose which one you prefer as primary

---

## 📞 Need Help?

**Vercel Documentation:**
- https://vercel.com/docs/concepts/projects/custom-domains

**Vercel Support:**
- https://vercel.com/support

---

## ✨ After Setup is Complete:

Your CryptoRafts platform will be accessible at:
- ✅ https://cryptorafts.com
- ✅ https://www.cryptorafts.com (redirects to apex)
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Real-time features working
- ✅ Firebase connected
- ✅ All dashboards functional

---

**Generated:** October 18, 2025  
**Status:** Ready to configure domain ✅  
**Latest Deployment:** https://cryptorafts-starter-doe1uu8cb-anas-s-projects-8d19f880.vercel.app

