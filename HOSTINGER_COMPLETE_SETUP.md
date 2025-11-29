# 🎯 Complete Hostinger Setup Guide

## 🚀 **AUTOMATED SETUP:**

Run this script to automate Hostinger setup:
```powershell
.\scripts\setup-hostinger-complete.ps1
```

This script will:
- ✅ Guide you through email account creation
- ✅ Help you get DKIM key
- ✅ Save DKIM key to file
- ✅ Update DNS records file
- ✅ Open Hostinger control panel

---

## 📋 **MANUAL STEPS (If Script Doesn't Work):**

### **Step 1: Create Email Account**

1. **Log in to Hostinger:**
   - Go to: https://hpanel.hostinger.com/
   - Sign in with your credentials

2. **Navigate to Email Accounts:**
   - Click **"Email"** in left menu
   - Click **"Email Accounts"**

3. **Create Email Account:**
   - Click **"Create Email Account"** button
   - **Email:** `business@cryptorafts.com`
   - **Password:** Create a strong password (save it!)
   - Click **"Create"**

4. **Verify Account Created:**
   - You should see `business@cryptorafts.com` in the list
   - Status should show as active

---

### **Step 2: Get DKIM Key**

1. **Click on Email Account:**
   - In Email Accounts list, click on `business@cryptorafts.com`

2. **Find DKIM Section:**
   - Scroll down to find **"DKIM"** section
   - Click **"Show"** or **"Copy"** button

3. **Copy DKIM Key:**
   - Copy the ENTIRE key (it's very long)
   - It starts with: `v=DKIM1; k=rsa; p=...`
   - Save it to: `HOSTINGER_DKIM_KEY.txt`

---

### **Step 3: Add DNS Records in Hostinger**

**If cryptorafts.com is registered with Hostinger:**

1. **Go to DNS Zone Editor:**
   - Navigate to: **Domains** → **DNS / Name Servers**
   - Find: **cryptorafts.com**
   - Click **"DNS Zone Editor"** or **"Manage DNS"**

2. **Delete Old MX Records:**
   - Find any existing MX records
   - Delete them (they're pointing to wrong server)

3. **Add New Records:**

   **Record 1 - MX:**
   ```
   Type: MX
   Name: @
   Value: mx1.hostinger.com
   Priority: 5
   TTL: 14400
   ```

   **Record 2 - MX:**
   ```
   Type: MX
   Name: @
   Value: mx2.hostinger.com
   Priority: 10
   TTL: 14400
   ```

   **Record 3 - SPF:**
   ```
   Type: TXT
   Name: @
   Value: v=spf1 include:hostinger.com ~all
   TTL: 14400
   ```

   **Record 4 - DKIM:**
   ```
   Type: TXT
   Name: default._domainkey
   Value: [Paste DKIM key from Step 2]
   TTL: 14400
   ```

4. **Save Records:**
   - Click **"Save"** or **"Add Record"** for each
   - Wait for confirmation

---

### **Step 4: Verify DNS Records**

**Wait 15-30 minutes** for DNS propagation, then:

**Option 1: PowerShell Script**
```powershell
.\scripts\check-dns-records.ps1
```

**Option 2: Online Tools**
- https://dnschecker.org/#MX/cryptorafts.com
- https://mxtoolbox.com/SuperTool.aspx?action=mx%3acryptorafts.com

**Option 3: Check in Hostinger**
- Go to: Email → Email Accounts
- Click on business@cryptorafts.com
- Check status:
  - ✅ Should show "Domain connected"
  - ✅ MX: OK
  - ✅ SPF: OK
  - ✅ DKIM: OK

---

## ✅ **COMPLETE CHECKLIST:**

### **Email Account:**
- [ ] Logged in to Hostinger
- [ ] Created business@cryptorafts.com
- [ ] Password saved securely
- [ ] Account shows as active

### **DKIM Key:**
- [ ] Opened email account details
- [ ] Found DKIM section
- [ ] Copied entire DKIM key
- [ ] Saved to HOSTINGER_DKIM_KEY.txt

### **DNS Records:**
- [ ] Opened DNS Zone Editor
- [ ] Deleted old MX records
- [ ] Added MX: mx1.hostinger.com (Priority 5)
- [ ] Added MX: mx2.hostinger.com (Priority 10)
- [ ] Added SPF: v=spf1 include:hostinger.com ~all
- [ ] Added DKIM: default._domainkey (with full key)
- [ ] Saved all records

### **Verification:**
- [ ] Waited 15-30 minutes
- [ ] Checked DNS records (nslookup or online)
- [ ] Verified in Hostinger (should show "Domain connected")
- [ ] All status indicators show "OK"

---

## 🚨 **TROUBLESHOOTING:**

### **"Domain not connected" in Hostinger**
- **Solution:** Wait longer (up to 48 hours)
- Verify DNS records are correct
- Check record names are `@` (not `cryptorafts.com`)

### **"DKIM key not found"**
- **Solution:** Make sure email account is created first
- Check DKIM section in email account details
- Copy the ENTIRE key (it's very long)

### **"Cannot add DNS records"**
- **Solution:** Make sure you're in DNS Zone Editor
- Check if domain is registered with Hostinger
- If not, add records in your domain registrar instead

---

## 📞 **SUPPORT:**

**Hostinger Support:**
- Live chat: https://www.hostinger.com/contact
- Available 24/7

**DNS Check:**
- https://dnschecker.org/
- https://www.whatsmydns.net/

---

**Last Updated:** Just now

