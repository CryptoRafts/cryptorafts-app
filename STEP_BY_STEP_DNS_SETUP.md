# 🔧 Step-by-Step DNS Setup for cryptorafts.com

## ⚠️ IMPORTANT: DNS records must be added in your DOMAIN REGISTRAR, not Vercel!

Vercel hosts your website, but **DNS records are managed where you bought the domain** (Namecheap, GoDaddy, Cloudflare, etc.).

---

## 🎯 Step 1: Find Your Domain Registrar

**Where did you buy cryptorafts.com?**

Common registrars:
- **Namecheap** → https://www.namecheap.com/
- **GoDaddy** → https://www.godaddy.com/
- **Cloudflare** → https://www.cloudflare.com/
- **Google Domains** → https://domains.google.com/
- **Hostinger** → https://www.hostinger.com/ (if domain is with Hostinger)

**Check your email** for purchase confirmation from the registrar.

---

## 🎯 Step 2: Log In to Domain Registrar

1. Go to your registrar's website
2. Log in to your account
3. Find **"My Domains"** or **"Domain Management"**
4. Click on **cryptorafts.com**

---

## 🎯 Step 3: Access DNS Management

Look for:
- **"DNS Management"**
- **"Advanced DNS"**
- **"DNS Records"**
- **"Manage DNS"**

Click on it to see your current DNS records.

---

## 🎯 Step 4: Add MX Records (2 records)

### **Record 1:**
1. Click **"Add Record"** or **"+"**
2. **Type:** Select **MX**
3. **Name/Host:** Enter **@** (or leave blank, or `cryptorafts.com`)
4. **Value/Target:** Enter **mx1.hostinger.com**
5. **Priority:** Enter **5**
6. **TTL:** Enter **14400** (or select "Auto")
7. Click **"Save"** or **"Add Record"**

### **Record 2:**
1. Click **"Add Record"** again
2. **Type:** Select **MX**
3. **Name/Host:** Enter **@** (same as above)
4. **Value/Target:** Enter **mx2.hostinger.com**
5. **Priority:** Enter **10**
6. **TTL:** Enter **14400**
7. Click **"Save"**

**✅ You should now have 2 MX records**

---

## 🎯 Step 5: Add SPF Record (1 record)

1. Click **"Add Record"**
2. **Type:** Select **TXT**
3. **Name/Host:** Enter **@** (or leave blank)
4. **Value:** Enter exactly: **`v=spf1 include:hostinger.com ~all`**
   - ⚠️ Copy this EXACTLY, including spaces
5. **TTL:** Enter **14400**
6. Click **"Save"**

**✅ You should now have 1 SPF TXT record**

---

## 🎯 Step 6: Get DKIM Key from Hostinger

1. **Log in to Hostinger:**
   - Go to: https://hpanel.hostinger.com/
   - Navigate to **Email** → **Email Accounts**

2. **Create Email Account (if not exists):**
   - Click **"Create Email Account"**
   - Email: **business@cryptorafts.com**
   - Password: Create a strong password (save it!)
   - Click **"Create"**

3. **Get DKIM Key:**
   - Click on **business@cryptorafts.com**
   - Find **"DKIM"** section
   - Click **"Show"** or **"Copy"** to reveal DKIM key
   - Copy the ENTIRE key (it's long, starts with `v=DKIM1; k=rsa; p=...`)

---

## 🎯 Step 7: Add DKIM Record (1 record)

1. Go back to your **domain registrar DNS management**
2. Click **"Add Record"**
3. **Type:** Select **TXT**
4. **Name/Host:** Enter **default._domainkey**
   - ⚠️ Important: Include the underscore and dot
5. **Value:** Paste the **ENTIRE DKIM key** from Hostinger
   - It should look like: `v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3...` (very long)
6. **TTL:** Enter **14400**
7. Click **"Save"**

**✅ You should now have 1 DKIM TXT record**

---

## 🎯 Step 8: Verify Records

### **Wait 15 minutes to 2 hours** for DNS propagation

### **Check Records:**

**Option 1: PowerShell Script**
```powershell
.\scripts\check-dns-records.ps1
```

**Option 2: Online Tools**
- https://dnschecker.org/#MX/cryptorafts.com
- https://mxtoolbox.com/SuperTool.aspx?action=mx%3acryptorafts.com

**Option 3: Command Line**
```powershell
nslookup -type=MX cryptorafts.com
nslookup -type=TXT cryptorafts.com
nslookup -type=TXT default._domainkey.cryptorafts.com
```

---

## 🎯 Step 9: Check Hostinger Status

1. Log in to Hostinger: https://hpanel.hostinger.com/
2. Go to **Email** → **Email Accounts**
3. Check status:
   - ✅ Should show **"Domain connected"**
   - ✅ MX, SPF, DKIM should all show **"OK"**

**If still showing "No records":**
- Wait longer (up to 48 hours)
- Double-check DNS records in registrar
- Verify record names are exactly `@` (not `cryptorafts.com`)

---

## 📋 Complete Checklist

### **DNS Records Added:**
- [ ] MX: mx1.hostinger.com (Priority 5)
- [ ] MX: mx2.hostinger.com (Priority 10)
- [ ] SPF: v=spf1 include:hostinger.com ~all
- [ ] DKIM: default._domainkey (from Hostinger)

### **Hostinger:**
- [ ] Email account created: business@cryptorafts.com
- [ ] DKIM key copied
- [ ] Domain shows as "connected" (after DNS propagation)

### **Verification:**
- [ ] DNS records verified (nslookup or online tools)
- [ ] Hostinger shows all records as "OK"
- [ ] Test email sent successfully

---

## 🚨 Common Mistakes

### **Mistake 1: Adding records in Vercel**
- ❌ Wrong: Vercel doesn't manage DNS for custom domains
- ✅ Right: Add in your domain registrar

### **Mistake 2: Wrong record name**
- ❌ Wrong: `cryptorafts.com` or `www`
- ✅ Right: `@` (represents the root domain)

### **Mistake 3: Missing underscore in DKIM**
- ❌ Wrong: `default.domainkey`
- ✅ Right: `default._domainkey` (with underscore)

### **Mistake 4: Incomplete DKIM key**
- ❌ Wrong: Only part of the key
- ✅ Right: Copy the ENTIRE key from Hostinger

---

## 🔍 Troubleshooting

### **"No records found" after 2 hours**
1. Double-check records in registrar
2. Verify record names are `@` (not `cryptorafts.com`)
3. Check for typos in values
4. Try online DNS checker tools

### **"Domain not connected" in Hostinger**
1. Wait longer (up to 48 hours)
2. Verify MX records point to Hostinger
3. Check SPF includes `hostinger.com`
4. Verify DKIM key is complete

### **"Authentication failed" when sending emails**
- This is a different issue (Vercel configuration)
- See: `EMAIL_DNS_FIX_SUMMARY.md`

---

## 📞 Need Help?

**Hostinger Support:**
- Live chat: https://www.hostinger.com/contact
- Available 24/7

**DNS Propagation Check:**
- https://dnschecker.org/
- https://www.whatsmydns.net/

---

**⏱️ Total Time:** 15-30 minutes setup + 1-2 hours DNS propagation

