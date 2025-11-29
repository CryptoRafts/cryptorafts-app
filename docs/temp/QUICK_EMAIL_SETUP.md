# ⚡ Quick Setup: Connect business@cryptorafts.com to Vercel

## ✅ Status

**MX Records:** ✅ Already configured
- mx1.hostinger.com (Priority: 5)
- mx2.hostinger.com (Priority: 10)

**Environment Variables:** ⚠️ Partially configured
- ✅ EMAIL_HOST, EMAIL_PORT, EMAIL_SECURE, EMAIL_USER added
- ⚠️ EMAIL_PASSWORD and SMTP_PASS need to be added

---

## 🚀 Quick Fix: Add Missing Password Variables

### **Option 1: Via Vercel Dashboard (Easiest)**

1. **Go to:** https://vercel.com/anas-s-projects-8d19f880/cryptorafts-starter/settings/environment-variables

2. **Add these TWO variables** (for Production, Preview, Development):

   ```
   EMAIL_PASSWORD=your_hostinger_email_password
   SMTP_PASS=your_hostinger_email_password
   ```

3. **Click "Save"** for each environment

### **Option 2: Via PowerShell**

Run this command (replace `your_password` with your actual password):

```powershell
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

### **Option 3: Use the Script**

```powershell
.\scripts\add-email-env-vercel.ps1
```

---

## ✅ Complete Environment Variables List

Make sure ALL these are set in Vercel:

```
EMAIL_HOST=smtp.hostinger.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=business@cryptorafts.com
EMAIL_PASSWORD=your_password_here ⚠️ ADD THIS
EMAIL_FROM_NAME=CryptoRafts
EMAIL_FROM_ADDRESS=business@cryptorafts.com

SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=business@cryptorafts.com
SMTP_PASS=your_password_here ⚠️ ADD THIS
```

---

## 🔄 After Adding Password: Redeploy

```powershell
vercel --prod --yes
```

---

## 🧪 Test Email

After redeploying, test email sending:

```bash
POST https://cryptorafts-starter-qesdthv6r-anas-s-projects-8d19f880.vercel.app/api/test-email
```

---

## ✅ Done!

Once password variables are added and you redeploy, emails will be sent FROM `business@cryptorafts.com` using Hostinger SMTP!

