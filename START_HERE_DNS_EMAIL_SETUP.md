# 🚀 START HERE: Complete Email & DNS Setup

## ⚠️ Current Issues:
1. ❌ Vercel showing Gmail (should be Hostinger)
2. ❌ Hostinger showing "Domain not connected" (DNS records missing)

---

## ✅ Solution: 3 Steps

### **Step 1: Add DNS Records** (15 minutes)

Go to your **domain registrar** (where you bought cryptorafts.com) and add these records:

#### **1. MX Records** (Receive Emails)
```
Type: MX
Name: @
Value: mx1.hostinger.com
Priority: 5
TTL: 14400

Type: MX
Name: @
Value: mx2.hostinger.com
Priority: 10
TTL: 14400
```

#### **2. SPF Record** (Email Security)
```
Type: TXT
Name: @
Value: v=spf1 include:hostinger.com ~all
TTL: 14400
```

#### **3. DKIM Record** (Email Deliverability)
1. Log in to Hostinger: https://hpanel.hostinger.com/
2. Go to Email → Email Accounts
3. Create `business@cryptorafts.com` (if not exists)
4. Copy the DKIM key
5. Add TXT record:
```
Type: TXT
Name: default._domainkey
Value: [Paste DKIM key from Hostinger]
TTL: 14400
```

**📚 Full DNS Guide:** See `COMPLETE_HOSTINGER_DNS_SETUP.md`

---

### **Step 2: Configure Vercel** (5 minutes)

Run this script to set all email variables to Hostinger:

```powershell
.\scripts\setup-hostinger-vercel-complete.ps1
```

**Or manually add to Vercel Dashboard:**
https://vercel.com/anas-s-projects-8d19f880/cryptorafts-starter/settings/environment-variables

**Add these variables** (Production, Preview, Development):
```
EMAIL_HOST=smtp.hostinger.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=business@cryptorafts.com
EMAIL_PASSWORD=your_hostinger_password
EMAIL_FROM_NAME=CryptoRafts
EMAIL_FROM_ADDRESS=business@cryptorafts.com

SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=business@cryptorafts.com
SMTP_PASS=your_hostinger_password
```

---

### **Step 3: Redeploy & Test** (2 minutes)

```powershell
vercel --prod --yes
```

**Wait 1-2 hours** for DNS propagation, then test:
```bash
POST https://your-vercel-url.vercel.app/api/test-email
```

---

## ✅ Verification Checklist

- [ ] MX records added (mx1.hostinger.com, mx2.hostinger.com)
- [ ] SPF record added (v=spf1 include:hostinger.com ~all)
- [ ] DKIM record added (from Hostinger)
- [ ] Email account created in Hostinger (business@cryptorafts.com)
- [ ] Vercel environment variables set to Hostinger
- [ ] Redeployed to Vercel
- [ ] DNS records verified (wait 1-2 hours)
- [ ] Test email sent successfully

---

## 🔍 Verify DNS Records

**Check MX:**
```powershell
nslookup -type=MX cryptorafts.com
```

**Or use online tools:**
- https://dnschecker.org/
- https://mxtoolbox.com/

---

## 📚 Full Documentation

- **DNS Setup:** `COMPLETE_HOSTINGER_DNS_SETUP.md`
- **Email Setup:** `HOSTINGER_EMAIL_VERCEL_SETUP.md`
- **Quick Fix:** `QUICK_EMAIL_SETUP.md`

---

**⏱️ Total Time:** ~20 minutes + DNS propagation (1-2 hours)

