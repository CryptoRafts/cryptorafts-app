# 🚨 FIX DNS RECORDS NOW - Copy & Paste Guide

## ⚠️ CURRENT PROBLEM:
- ❌ MX records exist but pointing to WRONG server (not Hostinger)
- ❌ SPF record missing
- ❌ DKIM record needs verification

---

## 🎯 SOLUTION: Add These Exact Records

### **STEP 1: Find Your Domain Registrar**

**Where did you buy cryptorafts.com?**
- Check your email for purchase confirmation
- Common: Namecheap, GoDaddy, Cloudflare, Google Domains, Hostinger

**Go to your registrar's DNS management page**

---

### **STEP 2: DELETE OLD MX RECORDS**

1. Find **ALL existing MX records**
2. **DELETE them** (they're pointing to wrong server)
3. You'll add new ones in Step 3

---

### **STEP 3: ADD NEW MX RECORDS** (Copy & Paste)

Add these **2 records** exactly as shown:

#### **Record 1:**
```
Type: MX
Name: @
Value: mx1.hostinger.com
Priority: 5
TTL: 14400
```

#### **Record 2:**
```
Type: MX
Name: @
Value: mx2.hostinger.com
Priority: 10
TTL: 14400
```

**⚠️ IMPORTANT:** 
- Name must be `@` (not `cryptorafts.com` or blank)
- Priority must be exactly `5` and `10`
- Values must be exactly `mx1.hostinger.com` and `mx2.hostinger.com`

---

### **STEP 4: ADD SPF RECORD** (Copy & Paste)

Add this **1 TXT record**:

```
Type: TXT
Name: @
Value: v=spf1 include:hostinger.com ~all
TTL: 14400
```

**⚠️ Copy this EXACTLY:** `v=spf1 include:hostinger.com ~all`

---

### **STEP 5: GET DKIM FROM HOSTINGER**

1. **Log in to Hostinger:**
   - https://hpanel.hostinger.com/
   - Email → Email Accounts

2. **Create Email Account:**
   - Click "Create Email Account"
   - Email: `business@cryptorafts.com`
   - Password: [Create strong password]
   - Click "Create"

3. **Get DKIM Key:**
   - Click on `business@cryptorafts.com`
   - Find "DKIM" section
   - Click "Show" or "Copy"
   - Copy the ENTIRE key (it's very long, starts with `v=DKIM1; k=rsa; p=...`)

---

### **STEP 6: ADD DKIM RECORD** (Copy & Paste)

Add this **1 TXT record**:

```
Type: TXT
Name: default._domainkey
Value: [Paste ENTIRE DKIM key from Hostinger]
TTL: 14400
```

**⚠️ IMPORTANT:**
- Name must be exactly: `default._domainkey` (with underscore and dot)
- Value must be the COMPLETE DKIM key from Hostinger (very long)

---

## ✅ VERIFY RECORDS

### **Wait 15-30 minutes** for DNS propagation

### **Check Records:**

**Option 1: Run Script**
```powershell
.\scripts\check-dns-records.ps1
```

**Option 2: Online Checker**
- https://dnschecker.org/#MX/cryptorafts.com
- https://mxtoolbox.com/SuperTool.aspx?action=mx%3acryptorafts.com

**Option 3: Command Line**
```powershell
nslookup -type=MX cryptorafts.com
```

Should show:
```
mx1.hostinger.com (Priority 5)
mx2.hostinger.com (Priority 10)
```

---

## 🎯 CHECK HOSTINGER STATUS

1. Log in: https://hpanel.hostinger.com/
2. Go to: Email → Email Accounts
3. Check status:
   - ✅ Should show "Domain connected"
   - ✅ MX: OK
   - ✅ SPF: OK
   - ✅ DKIM: OK

**If still showing "No records":**
- Wait longer (up to 2 hours)
- Double-check records in registrar
- Verify names are `@` (not `cryptorafts.com`)

---

## 📋 COMPLETE CHECKLIST

- [ ] Deleted old/wrong MX records
- [ ] Added MX: mx1.hostinger.com (Priority 5)
- [ ] Added MX: mx2.hostinger.com (Priority 10)
- [ ] Added SPF: v=spf1 include:hostinger.com ~all
- [ ] Created email: business@cryptorafts.com in Hostinger
- [ ] Got DKIM key from Hostinger
- [ ] Added DKIM: default._domainkey (with full key)
- [ ] Waited 15-30 minutes
- [ ] Verified records (nslookup or online tools)
- [ ] Checked Hostinger status (should show "connected")

---

## 🚨 COMMON MISTAKES

### **Mistake 1: Wrong Name**
- ❌ `cryptorafts.com` or `www`
- ✅ `@` (represents root domain)

### **Mistake 2: Wrong Priority**
- ❌ Priority 0, 1, or same priority
- ✅ Priority 5 and 10 (exactly)

### **Mistake 3: Typo in Value**
- ❌ `mx1.hostinger.co` or `mx1hostinger.com`
- ✅ `mx1.hostinger.com` (exactly)

### **Mistake 4: Incomplete DKIM**
- ❌ Only part of the key
- ✅ ENTIRE key from Hostinger

---

## 📞 NEED HELP?

**Hostinger Support:**
- Live chat: https://www.hostinger.com/contact
- Available 24/7

**DNS Check:**
- https://dnschecker.org/
- https://www.whatsmydns.net/

---

**⏱️ Time:** 10-15 minutes setup + 15-30 minutes propagation

