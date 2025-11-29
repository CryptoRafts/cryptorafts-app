# 🚀 VERCEL DOMAIN + HOSTINGER EMAIL SETUP

## ✅ **YOUR MX RECORDS ARE PERFECT!**

Your Hostinger MX records are correctly configured:
- **mx1.hostinger.com** - Priority: 5
- **mx2.hostinger.com** - Priority: 10

## 🎯 **ADD MX RECORDS TO VERCEL DOMAIN:**

### **Step 1: Go to Vercel DNS Settings**
1. Go to [vercel.com](https://vercel.com)
2. Sign in to your account
3. Go to your project dashboard
4. Click on your domain name
5. Go to **"DNS"** tab

### **Step 2: Add MX Records**
Add these **2 MX records** to your Vercel domain:

#### **MX Record 1:**
- **Type:** `MX`
- **Name:** `@` (or leave empty)
- **Value:** `mx1.hostinger.com`
- **Priority:** `5`
- **TTL:** `14400` (or leave default)

#### **MX Record 2:**
- **Type:** `MX`
- **Name:** `@` (or leave empty)
- **Value:** `mx2.hostinger.com`
- **Priority:** `10`
- **TTL:** `14400` (or leave default)

### **Step 3: Add Additional Records (Optional)**
For better email delivery, also add:

#### **TXT Record (SPF):**
- **Type:** `TXT`
- **Name:** `@`
- **Value:** `v=spf1 include:_spf.google.com include:hostinger.com ~all`
- **TTL:** `14400`

#### **TXT Record (DKIM):**
- **Type:** `TXT`
- **Name:** `default._domainkey`
- **Value:** `v=DKIM1; k=rsa; p=YOUR_DKIM_KEY_FROM_HOSTINGER`
- **TTL:** `14400`

### **Step 4: Wait for Propagation**
- DNS changes can take 5-60 minutes to propagate
- Check with: [whatsmydns.net](https://whatsmydns.net)

## 📧 **TEST YOUR EMAIL SETUP:**

### **Step 1: Update Email Script**
1. Open `fix-email-sending.js`
2. Make sure you have the Gmail App Password set
3. Save the file

### **Step 2: Test Email**
```bash
node fix-email-sending.js
```

### **Step 3: Check Email Delivery**
1. Check cryptorafts@gmail.com inbox
2. Look for email from business@cryptorafts.com
3. Verify it was received

## 🚀 **READY-TO-USE COMMANDS:**

```bash
# Test email with Vercel domain
node fix-email-sending.js

# Send approval emails to all users
node admin.js approve-all

# Get user statistics
node admin.js stats
```

## 🎉 **BENEFITS:**

✅ **Professional business email** - business@cryptorafts.com
✅ **Vercel domain integration** - Your domain works with email
✅ **Reliable Gmail SMTP** - anasshamsiggc@gmail.com for sending
✅ **Proper MX records** - Email routing configured
✅ **All emails show** - "From: business@cryptorafts.com"

## 🔧 **TROUBLESHOOTING:**

### **If emails don't work:**
1. Check DNS propagation: [whatsmydns.net](https://whatsmydns.net)
2. Verify MX records are added to Vercel
3. Make sure Gmail App Password is correct
4. Check spam folder

### **If MX records don't appear:**
1. Wait 10-15 minutes for propagation
2. Clear your DNS cache
3. Check Vercel DNS settings again

## 🎯 **YOU'RE ALL SET!**

After adding the MX records to Vercel:
1. Your domain will work with business@cryptorafts.com
2. All emails will be sent from business@cryptorafts.com
3. Recipients will see professional business email
4. You can send approval emails to all users!

**Add the MX records to Vercel and your email system will work perfectly!** 🚀
