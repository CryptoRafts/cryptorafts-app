# 📧 Connect Hostinger Email (business@cryptorafts.com) to Vercel

## ✅ MX Records Already Configured

Your MX records are already set up correctly:
- **mx1.hostinger.com** (Priority: 5)
- **mx2.hostinger.com** (Priority: 10)

These MX records handle **receiving** emails. Now we need to configure **SMTP** for **sending** emails from Vercel.

---

## 🎯 Goal

Configure Vercel to send emails **FROM** `business@cryptorafts.com` using Hostinger's SMTP server.

---

## 📋 Step 1: Get Your Hostinger Email Password

1. **Log in to Hostinger:**
   - Go to: https://hpanel.hostinger.com/
   - Navigate to **Email** → **Email Accounts**

2. **Find/Create Email Account:**
   - Ensure `business@cryptorafts.com` exists
   - Note your email password (or reset it if needed)

---

## 🚀 Step 2: Add Environment Variables to Vercel

### **Option A: Automated Script (Recommended)**

Run the PowerShell script:

```powershell
.\scripts\setup-hostinger-email-vercel.ps1
```

This will:
- Prompt for your email password
- Add all required environment variables to Vercel (Production, Preview, Development)
- Set up both `EMAIL_*` and `SMTP_*` variables for compatibility

### **Option B: Manual Setup via Vercel Dashboard**

1. **Go to Vercel Dashboard:**
   - https://vercel.com/anas-s-projects-8d19f880/cryptorafts-starter/settings/environment-variables

2. **Add These Variables** (for **Production**, **Preview**, and **Development**):

```bash
EMAIL_HOST=smtp.hostinger.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=business@cryptorafts.com
EMAIL_PASSWORD=your_hostinger_email_password
EMAIL_FROM_NAME=CryptoRafts
EMAIL_FROM_ADDRESS=business@cryptorafts.com

# Also add SMTP_* variables for compatibility:
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=business@cryptorafts.com
SMTP_PASS=your_hostinger_email_password
```

### **Option C: Vercel CLI (Manual)**

```powershell
# Production
echo "smtp.hostinger.com" | vercel env add EMAIL_HOST production
echo "587" | vercel env add EMAIL_PORT production
echo "false" | vercel env add EMAIL_SECURE production
echo "business@cryptorafts.com" | vercel env add EMAIL_USER production
echo "your_password" | vercel env add EMAIL_PASSWORD production
echo "CryptoRafts" | vercel env add EMAIL_FROM_NAME production
echo "business@cryptorafts.com" | vercel env add EMAIL_FROM_ADDRESS production

# Repeat for preview and development environments
```

---

## ⚙️ SMTP Configuration Details

### **Hostinger SMTP Settings:**

| Setting | Value |
|---------|-------|
| **SMTP Host** | `smtp.hostinger.com` |
| **SMTP Port** | `587` (TLS) or `465` (SSL) |
| **SMTP Username** | `business@cryptorafts.com` |
| **SMTP Password** | Your Hostinger email password |
| **Security** | TLS (port 587) or SSL (port 465) |

### **Recommended Configuration:**

- **Port 587 (TLS)**: `EMAIL_PORT=587`, `EMAIL_SECURE=false` ✅
- **Port 465 (SSL)**: `EMAIL_PORT=465`, `EMAIL_SECURE=true` (alternative)

---

## 🔄 Step 3: Redeploy to Vercel

After adding environment variables, redeploy:

```powershell
vercel --prod --yes
```

Or trigger a redeploy from the Vercel dashboard.

---

## 🧪 Step 4: Test Email Configuration

### **Test via API:**

```bash
POST https://cryptorafts-starter-qesdthv6r-anas-s-projects-8d19f880.vercel.app/api/test-email
Content-Type: application/json

{
  "to": "your-test-email@example.com",
  "subject": "Test Email from Vercel",
  "html": "<h1>Test</h1><p>This is a test email from business@cryptorafts.com</p>"
}
```

### **Test via Admin Panel:**

1. Go to: `/admin/blog/social`
2. Create a test post
3. Send a notification email
4. Verify it's sent from `business@cryptorafts.com`

---

## ✅ Verification Checklist

- [ ] MX records configured (already done ✅)
- [ ] Email account `business@cryptorafts.com` exists in Hostinger
- [ ] Environment variables added to Vercel
- [ ] Redeployed to Vercel
- [ ] Test email sent successfully
- [ ] Email received from `business@cryptorafts.com`

---

## 🔍 Troubleshooting

### **Issue: "Authentication failed"**

**Solution:**
- Verify email password is correct
- Check if email account exists in Hostinger
- Try resetting the email password

### **Issue: "Connection timeout"**

**Solution:**
- Verify `EMAIL_HOST=smtp.hostinger.com`
- Check if port 587 is not blocked
- Try port 465 with `EMAIL_SECURE=true`

### **Issue: "Email not received"**

**Solution:**
- Check spam folder
- Verify MX records are correct
- Check Hostinger email account inbox

---

## 📊 Current Configuration

### **Email Aliases Available:**

All these aliases will send FROM `business@cryptorafts.com`:

- ✅ `business@cryptorafts.com` - General business
- ✅ `support@cryptorafts.com` - Customer support
- ✅ `help@cryptorafts.com` - Help requests
- ✅ `blog@cryptorafts.com` - Blog updates
- ✅ `founder@cryptorafts.com` - Founder communications
- ✅ `vc@cryptorafts.com` - VC communications
- ✅ `investor@cryptorafts.com` - Investor relations
- ✅ `admin@cryptorafts.com` - Admin notifications
- ✅ `notifications@cryptorafts.com` - System alerts
- ✅ `legal@cryptorafts.com` - Legal matters
- ✅ `partnerships@cryptorafts.com` - Partnerships

---

## 🎉 Success!

Once configured, your Vercel deployment will:
- ✅ Send emails FROM `business@cryptorafts.com`
- ✅ Use Hostinger SMTP server
- ✅ Support all email aliases
- ✅ Work with blog notifications, team invitations, etc.

---

## 📞 Support

If you encounter issues:
1. Check Hostinger email account status
2. Verify environment variables in Vercel dashboard
3. Check Vercel deployment logs
4. Test SMTP connection manually

---

**Last Updated:** November 2024

