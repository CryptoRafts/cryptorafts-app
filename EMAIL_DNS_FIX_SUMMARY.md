# ✅ Email & DNS Setup - Complete Solution

## 🔍 Current Status

### **Vercel Environment Variables:**
- ✅ Email variables exist in **Preview** environment
- ❌ Missing in **Production** and **Development**
- ❌ **EMAIL_PASSWORD** and **SMTP_PASS** are missing (need to be added)

### **Hostinger:**
- ❌ Domain not connected (DNS records missing)
- ❌ MX, SPF, DKIM records need to be added

---

## 🎯 Complete Fix (Do These Steps)

### **STEP 1: Add DNS Records** ⚠️ CRITICAL

**Go to your domain registrar** (Namecheap, GoDaddy, Cloudflare, etc.) DNS management:

#### **1. MX Records** (2 records)
```
Record 1:
Type: MX
Name: @
Value: mx1.hostinger.com
Priority: 5
TTL: 14400

Record 2:
Type: MX
Name: @
Value: mx2.hostinger.com
Priority: 10
TTL: 14400
```

#### **2. SPF Record** (1 record)
```
Type: TXT
Name: @
Value: v=spf1 include:hostinger.com ~all
TTL: 14400
```

#### **3. DKIM Record** (1 record)
1. **Get DKIM from Hostinger:**
   - Log in: https://hpanel.hostinger.com/
   - Email → Email Accounts → Create `business@cryptorafts.com`
   - Copy DKIM key

2. **Add TXT Record:**
```
Type: TXT
Name: default._domainkey
Value: [Paste DKIM key from Hostinger]
TTL: 14400
```

**📚 Detailed Guide:** `COMPLETE_HOSTINGER_DNS_SETUP.md`

---

### **STEP 2: Add Missing Password Variables to Vercel**

**Option A: Via Vercel Dashboard** (Easiest)

1. Go to: https://vercel.com/anas-s-projects-8d19f880/cryptorafts-starter/settings/environment-variables

2. **Add these 2 variables** to **Production**, **Preview**, and **Development**:
   - `EMAIL_PASSWORD` = your Hostinger email password
   - `SMTP_PASS` = your Hostinger email password

**Option B: Via PowerShell**

```powershell
# Replace 'your_password' with your actual Hostinger email password

# Production
echo "your_password" | vercel env add EMAIL_PASSWORD production
echo "your_password" | vercel env add SMTP_PASS production

# Preview
echo "your_password" | vercel env add EMAIL_PASSWORD preview
echo "your_password" | vercel env add SMTP_PASS preview

# Development
echo "your_password" | vercel env add EMAIL_PASSWORD development
echo "your_password" | vercel env add SMTP_PASS development
```

---

### **STEP 3: Copy Email Variables to Production & Development**

**Current:** Only Preview has email variables  
**Need:** Production and Development also need them

**Run this script:**
```powershell
.\scripts\setup-hostinger-vercel-complete.ps1
```

**Or manually add via Vercel Dashboard** (copy from Preview to Production/Development):

```
EMAIL_HOST=smtp.hostinger.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=business@cryptorafts.com
EMAIL_PASSWORD=your_password
EMAIL_FROM_NAME=CryptoRafts
EMAIL_FROM_ADDRESS=business@cryptorafts.com

SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=business@cryptorafts.com
SMTP_PASS=your_password
```

---

### **STEP 4: Redeploy to Vercel**

```powershell
vercel --prod --yes
```

---

### **STEP 5: Wait & Verify**

1. **Wait 1-2 hours** for DNS propagation

2. **Verify DNS Records:**
   ```powershell
   .\scripts\verify-dns-records.ps1
   ```
   
   Or use online tools:
   - https://dnschecker.org/
   - https://mxtoolbox.com/

3. **Check Hostinger:**
   - Log in to Hostinger
   - Email → Email Accounts
   - Should show "Domain connected" ✅

4. **Test Email:**
   ```bash
   POST https://your-vercel-url.vercel.app/api/test-email
   ```

---

## ✅ Final Checklist

### **DNS Records:**
- [ ] MX record: mx1.hostinger.com (Priority 5)
- [ ] MX record: mx2.hostinger.com (Priority 10)
- [ ] SPF record: v=spf1 include:hostinger.com ~all
- [ ] DKIM record: default._domainkey (from Hostinger)

### **Hostinger:**
- [ ] Email account created: business@cryptorafts.com
- [ ] DKIM key copied
- [ ] Domain shows as "connected" (after DNS propagation)

### **Vercel:**
- [ ] EMAIL_HOST=smtp.hostinger.com (all environments)
- [ ] EMAIL_PORT=587 (all environments)
- [ ] EMAIL_SECURE=false (all environments)
- [ ] EMAIL_USER=business@cryptorafts.com (all environments)
- [ ] **EMAIL_PASSWORD** added (all environments) ⚠️
- [ ] EMAIL_FROM_ADDRESS=business@cryptorafts.com (all environments)
- [ ] SMTP_* variables added (all environments)
- [ ] **SMTP_PASS** added (all environments) ⚠️
- [ ] Redeployed to Vercel

### **Testing:**
- [ ] DNS records verified (nslookup or online tools)
- [ ] Hostinger shows domain connected
- [ ] Test email sent from Vercel
- [ ] Test email received successfully

---

## 🚨 Common Issues

### **"Domain not connected" in Hostinger**
- **Solution:** Wait 1-2 hours for DNS propagation, then verify MX records

### **"Authentication failed" in Vercel**
- **Solution:** Check EMAIL_PASSWORD and SMTP_PASS are correct

### **"No MX records found"**
- **Solution:** Verify DNS records in registrar, ensure Name is `@`

---

## 📚 Documentation Files

- **START_HERE_DNS_EMAIL_SETUP.md** - Quick start guide
- **COMPLETE_HOSTINGER_DNS_SETUP.md** - Detailed DNS setup
- **HOSTINGER_EMAIL_VERCEL_SETUP.md** - Email configuration
- **scripts/setup-hostinger-vercel-complete.ps1** - Automated setup
- **scripts/verify-dns-records.ps1** - DNS verification

---

**⏱️ Estimated Time:** 20 minutes setup + 1-2 hours DNS propagation

