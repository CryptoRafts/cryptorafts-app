# 🔧 Complete Hostinger Email & DNS Setup Guide

## 🎯 Goal
Connect `cryptorafts.com` domain to Hostinger email and configure Vercel to use Hostinger SMTP.

---

## 📋 Part 1: DNS Records Setup (Domain Registrar)

### **Where to Add DNS Records:**
Go to your **domain registrar** (where you bought cryptorafts.com) DNS management panel:
- **Namecheap**: Domain List → Manage → Advanced DNS
- **GoDaddy**: My Products → DNS Management
- **Cloudflare**: DNS → Records
- **Google Domains**: DNS → Custom records

---

### **Step 1: Add MX Records (Receive Emails)**

Add these **2 MX records**:

| Type | Name | Value | Priority | TTL |
|------|------|-------|----------|-----|
| MX | @ | mx1.hostinger.com | 5 | 14400 |
| MX | @ | mx2.hostinger.com | 10 | 14400 |

**Instructions:**
1. Go to DNS management
2. Click "Add Record" or "Add"
3. Select Type: **MX**
4. Name/Host: **@** (or leave blank, or enter `cryptorafts.com`)
5. Value: **mx1.hostinger.com**
6. Priority: **5**
7. TTL: **14400** (or Auto)
8. Click "Save"
9. Repeat for **mx2.hostinger.com** with Priority **10**

---

### **Step 2: Add SPF Record (Email Security)**

Add this **TXT record**:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| TXT | @ | `v=spf1 include:hostinger.com ~all` | 14400 |

**Instructions:**
1. Click "Add Record"
2. Type: **TXT**
3. Name/Host: **@**
4. Value: **`v=spf1 include:hostinger.com ~all`**
5. TTL: **14400**
6. Click "Save"

---

### **Step 3: Add DKIM Record (Email Deliverability)**

**Get DKIM Key from Hostinger:**

1. **Log in to Hostinger:**
   - Go to: https://hpanel.hostinger.com/
   - Navigate to **Email** → **Email Accounts**
   - Click on **business@cryptorafts.com** (or create it)
   - Look for **DKIM** section
   - Copy the DKIM key (it looks like: `v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3...`)

2. **Add TXT Record:**

| Type | Name | Value | TTL |
|------|------|-------|-----|
| TXT | default._domainkey | `[Your DKIM key from Hostinger]` | 14400 |

**Instructions:**
1. Click "Add Record"
2. Type: **TXT**
3. Name/Host: **default._domainkey**
4. Value: **Paste the full DKIM key from Hostinger**
5. TTL: **14400**
6. Click "Save"

---

### **Step 4: Add DMARC Record (Optional but Recommended)**

Add this **TXT record**:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| TXT | _dmarc | `v=DMARC1; p=none; rua=mailto:admin@cryptorafts.com` | 14400 |

**Instructions:**
1. Click "Add Record"
2. Type: **TXT**
3. Name/Host: **_dmarc**
4. Value: **`v=DMARC1; p=none; rua=mailto:admin@cryptorafts.com`**
5. TTL: **14400**
6. Click "Save"

---

## 📋 Part 2: Create Email Account in Hostinger

1. **Log in to Hostinger:**
   - https://hpanel.hostinger.com/

2. **Create Email Account:**
   - Go to **Email** → **Email Accounts**
   - Click **"Create Email Account"**
   - Email: **business@cryptorafts.com**
   - Password: **Create a strong password** (save this!)
   - Click **"Create"**

3. **Get DKIM Key:**
   - After creating, click on the email account
   - Find **DKIM** section
   - Copy the DKIM key for DNS setup (Step 3 above)

---

## 📋 Part 3: Configure Vercel Environment Variables

### **Step 1: Remove Gmail Variables (if any)**

Check current variables:
```powershell
vercel env ls
```

Remove Gmail-related variables if they exist:
```powershell
vercel env rm EMAIL_HOST production
vercel env rm SMTP_HOST production
# Remove any Gmail settings
```

### **Step 2: Add Hostinger Variables**

Run the setup script:
```powershell
.\scripts\setup-hostinger-vercel-complete.ps1
```

Or manually add via Vercel Dashboard:
https://vercel.com/anas-s-projects-8d19f880/cryptorafts-starter/settings/environment-variables

**Add these variables** (Production, Preview, Development):

```
EMAIL_HOST=smtp.hostinger.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=business@cryptorafts.com
EMAIL_PASSWORD=your_hostinger_email_password
EMAIL_FROM_NAME=CryptoRafts
EMAIL_FROM_ADDRESS=business@cryptorafts.com

SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=business@cryptorafts.com
SMTP_PASS=your_hostinger_email_password
```

---

## 📋 Part 4: Verify DNS Records

### **Wait for DNS Propagation:**
- DNS changes take **15 minutes to 48 hours** to propagate
- Usually takes **1-2 hours**

### **Check DNS Records:**

**Check MX Records:**
```bash
nslookup -type=MX cryptorafts.com
```
Should show: `mx1.hostinger.com` and `mx2.hostinger.com`

**Check SPF Record:**
```bash
nslookup -type=TXT cryptorafts.com
```
Should show: `v=spf1 include:hostinger.com ~all`

**Check DKIM Record:**
```bash
nslookup -type=TXT default._domainkey.cryptorafts.com
```
Should show your DKIM key

**Online Tools:**
- https://mxtoolbox.com/SuperTool.aspx
- https://www.dnswatch.info/dns/dnslookup
- https://dnschecker.org/

---

## 📋 Part 5: Test Email Configuration

### **1. Test in Hostinger:**
- Log in to Hostinger email webmail
- Send a test email to yourself
- Verify you can receive emails

### **2. Test from Vercel:**

After redeploying, test via API:
```bash
POST https://your-vercel-url.vercel.app/api/test-email
Content-Type: application/json

{
  "to": "your-test-email@example.com",
  "subject": "Test from Vercel",
  "html": "<h1>Test</h1><p>Email from business@cryptorafts.com</p>"
}
```

### **3. Verify Email Sent:**
- Check recipient inbox
- Verify sender shows as `business@cryptorafts.com`
- Check spam folder if not received

---

## ✅ Complete Checklist

### **DNS Records:**
- [ ] MX record: mx1.hostinger.com (Priority 5)
- [ ] MX record: mx2.hostinger.com (Priority 10)
- [ ] SPF record: `v=spf1 include:hostinger.com ~all`
- [ ] DKIM record: default._domainkey (from Hostinger)
- [ ] DMARC record: `v=DMARC1; p=none; rua=mailto:admin@cryptorafts.com`

### **Hostinger:**
- [ ] Email account created: business@cryptorafts.com
- [ ] DKIM key copied from Hostinger
- [ ] Email password saved securely

### **Vercel:**
- [ ] EMAIL_HOST=smtp.hostinger.com
- [ ] EMAIL_PORT=587
- [ ] EMAIL_SECURE=false
- [ ] EMAIL_USER=business@cryptorafts.com
- [ ] EMAIL_PASSWORD=[your password]
- [ ] SMTP_* variables added
- [ ] Redeployed to Vercel

### **Testing:**
- [ ] DNS records verified (nslookup or online tools)
- [ ] Email account accessible in Hostinger
- [ ] Test email sent from Vercel
- [ ] Test email received successfully

---

## 🔍 Troubleshooting

### **Issue: "Domain not connected" in Hostinger**

**Solution:**
- Wait 1-2 hours for DNS propagation
- Verify MX records are correct: `nslookup -type=MX cryptorafts.com`
- Check DNS records in your registrar
- Ensure records are exactly: `mx1.hostinger.com` and `mx2.hostinger.com`

### **Issue: "No MX records found"**

**Solution:**
- Double-check DNS records in registrar
- Ensure Name is `@` (or blank)
- Ensure Priority is 5 and 10
- Wait for DNS propagation

### **Issue: "SPF/DKIM not found"**

**Solution:**
- Verify TXT records are added correctly
- Check record names: `@` for SPF, `default._domainkey` for DKIM
- Wait for DNS propagation
- Use online DNS checker tools

### **Issue: "Authentication failed" in Vercel**

**Solution:**
- Verify EMAIL_PASSWORD is correct (Hostinger email password)
- Check EMAIL_USER is `business@cryptorafts.com`
- Ensure EMAIL_HOST is `smtp.hostinger.com`
- Try port 465 with EMAIL_SECURE=true

---

## 📞 Support

**Hostinger Support:**
- https://www.hostinger.com/contact
- Live chat available 24/7

**DNS Propagation Check:**
- https://dnschecker.org/
- https://www.whatsmydns.net/

---

**Last Updated:** November 2024

