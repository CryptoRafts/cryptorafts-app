# 📧 Setup Hostinger Email for Vercel

## 🎯 **Goal:**

Configure your Hostinger email (`business@cryptorafts.com` or your email) to work with Vercel deployment.

---

## 📋 **Step 1: Get Hostinger SMTP Settings**

### **From Hostinger Control Panel:**

1. **Log in to Hostinger:**
   - Go to: https://hpanel.hostinger.com/

2. **Go to Email Accounts:**
   - Click on **"Email"** in the left menu
   - Click **"Email Accounts"**

3. **Create/Select Email Account:**
   - Create: `business@cryptorafts.com` (if not exists)
   - Or use existing email account

4. **Get SMTP Settings:**
   - **SMTP Host:** `smtp.hostinger.com`
   - **SMTP Port:** `587` (TLS) or `465` (SSL)
   - **SMTP Username:** `business@cryptorafts.com` (your full email)
   - **SMTP Password:** Your email account password
   - **Security:** TLS (port 587) or SSL (port 465)

---

## 🔧 **Step 2: Add Environment Variables to Vercel**

### **Go to Vercel Dashboard:**

1. **Open:** https://vercel.com/anas-s-projects-8d19f880/cryptorafts-starter/settings/environment-variables

2. **Add These Variables** (for Production, Preview, and Development):

```
EMAIL_HOST=smtp.hostinger.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=business@cryptorafts.com
EMAIL_PASSWORD=your_hostinger_email_password
EMAIL_FROM_NAME=CryptoRafts
EMAIL_FROM_ADDRESS=business@cryptorafts.com
```

### **Important Notes:**

- **EMAIL_PASSWORD:** Use your Hostinger email account password
- **EMAIL_PORT:** Use `587` for TLS or `465` for SSL
- **EMAIL_SECURE:** Use `false` for port 587 (TLS), `true` for port 465 (SSL)
- **EMAIL_USER:** Your full email address (e.g., `business@cryptorafts.com`)

---

## 🚀 **Step 3: Test Email Configuration**

After adding environment variables:

1. **Redeploy:**
   ```powershell
   vercel --prod --yes
   ```

2. **Test Email API:**
   - Go to: `https://www.cryptorafts.com/api/email/send`
   - Or use the admin email page to test

---

## ✅ **Hostinger SMTP Settings Summary:**

```
SMTP Host: smtp.hostinger.com
SMTP Port: 587 (TLS) or 465 (SSL)
SMTP Username: business@cryptorafts.com
SMTP Password: [Your email password]
Security: TLS (port 587) or SSL (port 465)
```

---

## 🔍 **Alternative: Hostinger SMTP Ports**

Hostinger supports multiple ports:

- **Port 587** (TLS) - Recommended
  - `EMAIL_PORT=587`
  - `EMAIL_SECURE=false`

- **Port 465** (SSL) - Alternative
  - `EMAIL_PORT=465`
  - `EMAIL_SECURE=true`

- **Port 25** (Not recommended for Vercel)

---

## 📝 **Quick Setup Script:**

Run this to add all email env vars to Vercel:

```powershell
# Set your email password
$EMAIL_PASSWORD = "your_hostinger_password"

# Add to Production
vercel env add EMAIL_HOST production
# Enter: smtp.hostinger.com

vercel env add EMAIL_PORT production
# Enter: 587

vercel env add EMAIL_SECURE production
# Enter: false

vercel env add EMAIL_USER production
# Enter: business@cryptorafts.com

vercel env add EMAIL_PASSWORD production
# Enter: $EMAIL_PASSWORD

vercel env add EMAIL_FROM_NAME production
# Enter: CryptoRafts

vercel env add EMAIL_FROM_ADDRESS production
# Enter: business@cryptorafts.com
```

Repeat for **Preview** and **Development** environments.

---

## ✅ **After Setup:**

1. ✅ Environment variables added to Vercel
2. ✅ Email service configured
3. ✅ Test email sending
4. ✅ Verify emails are received

---

## 🎯 **What This Enables:**

- ✅ Email verification emails
- ✅ Password reset emails
- ✅ KYC/KYB approval notifications
- ✅ User registration confirmations
- ✅ Admin notifications

---

## 📞 **Troubleshooting:**

### **If emails don't send:**

1. **Check SMTP credentials** - Verify username/password
2. **Check port** - Try port 465 if 587 doesn't work
3. **Check firewall** - Vercel should allow outbound SMTP
4. **Check email logs** - Check Vercel function logs
5. **Test connection** - Use `/api/email/send` endpoint

---

## 🔒 **Security Notes:**

- ✅ Never commit email passwords to Git
- ✅ Use environment variables only
- ✅ Rotate passwords regularly
- ✅ Use strong email passwords

---

## ✅ **Summary:**

1. Get Hostinger SMTP settings
2. Add environment variables to Vercel
3. Redeploy application
4. Test email sending
5. Done! ✅

