# 🔧 Email Connection Fix Guide

## ❌ **PROBLEM IDENTIFIED:**

Your email is not connected because **DNS records are missing** in Hostinger.

Hostinger shows "Domain is not connected" because:
- ❌ MX records are NOT configured
- ❌ SPF record is NOT configured  
- ❌ DKIM record is NOT configured

---

## ✅ **SOLUTION: Add DNS Records**

### **Step 1: Open Hostinger DNS Zone Editor**

1. **Go to:** https://hpanel.hostinger.com/
2. **Navigate:** Domains → DNS / Name Servers → DNS Zone Editor
3. **Select:** cryptorafts.com

### **Step 2: Delete Old MX Records**

⚠️ **IMPORTANT:** Delete any existing MX records first (they're pointing to wrong servers)

### **Step 3: Add These 4 DNS Records**

Open `HOSTINGER_DNS_COPY_PASTE.txt` and copy-paste each record:

#### **Record 1: MX (Priority 5)**
```
Type: MX
Name: @
Value: mx1.hostinger.com
Priority: 5
TTL: 14400
```

#### **Record 2: MX (Priority 10)**
```
Type: MX
Name: @
Value: mx2.hostinger.com
Priority: 10
TTL: 14400
```

#### **Record 3: SPF (TXT)**
```
Type: TXT
Name: @
Value: v=spf1 include:hostinger.com ~all
TTL: 14400
```

#### **Record 4: DKIM (TXT)**
```
Type: TXT
Name: default._domainkey
Value: v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAtR70HDS2LO4deGoJbWzTISXiggtOOjibyWsgVmPRvaXPVCFC3onR2+G7TCmMxiysI7/0EZeIDlWAeRTLC9u0IOltZotZwbEBzlHX5tiZYA4JMMDobDnNG/P8sv5iYyUaStT7KOH2UJYUZbpoi9RjXg49lGEMIVrHh1LO5K2U5iMkVNgQTDrfhg2QUikp3ZMy31Rs3oo+PqeBDiggofE+93GdD+Nbnye9BNTOZk5GgLZzJli1WxoQcPsKtf76w2ABipaRpFcie+pLshTjcdYG0gw/i+R6uL9/ysHSi4J0ymt98RwFY9UcnLPNfaTvGxq8dZ8t3YF0ncavMOSslfS2ewIDAQAB
TTL: 14400
```

### **Step 4: Save All Records**

Click "Save" or "Add Record" for each record in Hostinger.

---

## ⏳ **Step 5: Wait for DNS Propagation**

DNS changes take **15-30 minutes** to propagate globally.

### **Verify DNS Records:**

```powershell
.\scripts\check-dns-records.ps1
```

Or check online:
- https://dnschecker.org/#MX/cryptorafts.com
- https://mxtoolbox.com/SuperTool.aspx?action=mx%3acryptorafts.com

---

## ✅ **Step 6: Verify in Hostinger**

1. **Go to:** https://hpanel.hostinger.com/email/accounts
2. **Check:** Domain status should show "Connected" ✅
3. **Verify:** MX, SPF, DKIM should all show "OK" ✅

---

## 🚀 **Step 7: Redeploy Vercel (if needed)**

After DNS propagation, redeploy:

```powershell
vercel --prod --yes
```

---

## 📋 **Complete Checklist**

- [ ] DNS records added in Hostinger (4 records)
- [ ] Old MX records deleted
- [ ] Waited 15-30 minutes for propagation
- [ ] Verified DNS records with script
- [ ] Checked Hostinger email status (shows "Connected")
- [ ] Verified Vercel environment variables
- [ ] Redeployed Vercel (if needed)
- [ ] Tested email sending

---

## 🔍 **Quick Diagnostic**

Run this to check current status:

```powershell
.\scripts\diagnose-email-issue.ps1
```

---

## 📞 **Still Not Working?**

If DNS records are added but email still doesn't work:

1. **Check Vercel Environment Variables:**
   - Go to: https://vercel.com/anas-s-projects-8d19f880/cryptorafts-starter/settings/environment-variables
   - Verify: `SMTP_PASS` and `EMAIL_PASSWORD` are set

2. **Check Email Account Password:**
   - Go to: https://hpanel.hostinger.com/email/accounts
   - Verify: `business@cryptorafts.com` password is correct

3. **Test SMTP Connection:**
   ```powershell
   # Test email API endpoint
   curl -X POST https://www.cryptorafts.com/api/email/test
   ```

---

## 🎯 **Summary**

**The Problem:** DNS records are missing → Hostinger can't connect domain → Email doesn't work

**The Fix:** Add 4 DNS records in Hostinger DNS Zone Editor → Wait for propagation → Email works!

**Time Required:** 5 minutes to add records + 15-30 minutes for propagation = **~30 minutes total**
