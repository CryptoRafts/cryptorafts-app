# ✅ Hostinger Email Setup - Complete Guide

## 🎯 **What's Been Configured:**

### **Email Aliases System:**
All email aliases are configured in the codebase:

1. ✅ **business@cryptorafts.com** - General business communications
2. ✅ **support@cryptorafts.com** - Customer support
3. ✅ **help@cryptorafts.com** - Help and assistance
4. ✅ **blog@cryptorafts.com** - Blog updates and newsletters
5. ✅ **founder@cryptorafts.com** - Founder-specific communications
6. ✅ **vc@cryptorafts.com** - VC and investor communications
7. ✅ **investor@cryptorafts.com** - Investor relations
8. ✅ **admin@cryptorafts.com** - Administrative notifications
9. ✅ **notifications@cryptorafts.com** - System notifications
10. ✅ **legal@cryptorafts.com** - Legal and compliance
11. ✅ **partnerships@cryptorafts.com** - Partnership inquiries

---

## 📋 **Step 1: Add Environment Variables to Vercel**

### **Go to Vercel Dashboard:**
https://vercel.com/anas-s-projects-8d19f880/cryptorafts-starter/settings/environment-variables

### **Add These Variables** (for Production, Preview, and Development):

```bash
# SMTP Configuration
EMAIL_HOST=smtp.hostinger.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=business@cryptorafts.com
EMAIL_PASSWORD=your_hostinger_password_here
EMAIL_FROM_NAME=CryptoRafts
EMAIL_FROM_ADDRESS=business@cryptorafts.com

# SMTP Configuration (Alternative - for compatibility)
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=business@cryptorafts.com
SMTP_PASS=your_hostinger_password_here
```

### **Quick Add via CLI:**

```powershell
# Production
echo "smtp.hostinger.com" | vercel env add EMAIL_HOST production
echo "587" | vercel env add EMAIL_PORT production
echo "false" | vercel env add EMAIL_SECURE production
echo "business@cryptorafts.com" | vercel env add EMAIL_USER production
echo "your_password" | vercel env add EMAIL_PASSWORD production
echo "CryptoRafts" | vercel env add EMAIL_FROM_NAME production
echo "business@cryptorafts.com" | vercel env add EMAIL_FROM_ADDRESS production

# SMTP (for compatibility)
echo "smtp.hostinger.com" | vercel env add SMTP_HOST production
echo "587" | vercel env add SMTP_PORT production
echo "false" | vercel env add SMTP_SECURE production
echo "business@cryptorafts.com" | vercel env add SMTP_USER production
echo "your_password" | vercel env add SMTP_PASS production

# Repeat for "preview" and "development" environments
```

---

## 📧 **Step 2: Create Email Aliases in Hostinger**

### **Go to Hostinger Control Panel:**
1. Visit: https://hpanel.hostinger.com/
2. Navigate to: **Email** > **Email Accounts**
3. Create email forwarding aliases for each address:

### **Email Aliases to Create:**

- `support@cryptorafts.com` → Forward to `business@cryptorafts.com`
- `help@cryptorafts.com` → Forward to `business@cryptorafts.com`
- `blog@cryptorafts.com` → Forward to `business@cryptorafts.com`
- `founder@cryptorafts.com` → Forward to `business@cryptorafts.com`
- `vc@cryptorafts.com` → Forward to `business@cryptorafts.com`
- `investor@cryptorafts.com` → Forward to `business@cryptorafts.com`
- `admin@cryptorafts.com` → Forward to `business@cryptorafts.com`
- `notifications@cryptorafts.com` → Forward to `business@cryptorafts.com`
- `legal@cryptorafts.com` → Forward to `business@cryptorafts.com`
- `partnerships@cryptorafts.com` → Forward to `business@cryptorafts.com`

**Note:** All emails will be sent FROM these addresses but authenticated using `business@cryptorafts.com` SMTP credentials.

---

## 🚀 **Step 3: Redeploy Application**

After adding environment variables:

```powershell
vercel --prod --yes
```

---

## ✅ **How It Works:**

### **Email Sending:**
- All emails are sent through Hostinger SMTP (`smtp.hostinger.com`)
- Authentication uses `business@cryptorafts.com` credentials
- Emails can be sent FROM any configured alias address
- Reply-to addresses are set to match the "from" address

### **Usage in Code:**

```typescript
import { emailService } from '@/lib/email.service';
import { getEmailAlias } from '@/config/email-aliases.config';

// Send email using specific alias
await emailService.sendApprovalEmail(userData, { alias: 'notifications' });
await emailService.sendKYCApprovalNotification(userData, { alias: 'support' });
await emailService.sendPromotionalEmail(subscribers, subject, title, message, buttonText, buttonUrl, { alias: 'blog' });
```

### **Available Aliases:**
- `business` - Default for general emails
- `support` - Customer support emails
- `help` - Help desk emails
- `blog` - Blog and newsletter emails
- `founder` - Founder-specific emails
- `vc` - VC and investor emails
- `investor` - Investor relations emails
- `admin` - Administrative emails
- `notifications` - System notifications
- `legal` - Legal and compliance emails
- `partnerships` - Partnership emails

---

## 🧪 **Testing:**

### **Test Email API:**
```bash
POST https://www.cryptorafts.com/api/email/send
Content-Type: application/json

{
  "type": "approval",
  "userData": {
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com"
  }
}
```

---

## 📝 **Files Created/Modified:**

1. ✅ `src/config/email-aliases.config.ts` - Email aliases configuration
2. ✅ `src/lib/email.service.ts` - Updated to support multiple aliases
3. ✅ `src/config/email.config.ts` - Updated with Hostinger defaults
4. ✅ `setup-hostinger-all-emails-auto.ps1` - Automated setup script

---

## ✅ **Summary:**

1. ✅ Email alias system configured (11 aliases)
2. ⏳ Add environment variables to Vercel (manual step)
3. ⏳ Create email forwarding in Hostinger (manual step)
4. ⏳ Redeploy application
5. ✅ Ready to send emails from any alias!

---

## 🎯 **Next Steps:**

1. Add `EMAIL_PASSWORD` and `SMTP_PASS` to Vercel
2. Create email forwarding aliases in Hostinger
3. Redeploy: `vercel --prod --yes`
4. Test email sending
5. Done! ✅


