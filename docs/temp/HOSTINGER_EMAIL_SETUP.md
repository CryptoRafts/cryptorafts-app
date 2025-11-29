# 📧 Hostinger Email Configuration Guide

## ✅ **MX Records Already Configured**

Your MX records are correctly set up:

```
Type: MX
Name: @
Value: mx1.hostinger.com
Priority: 5
TTL: 14400

Type: MX
Name: @
Value: mx2.hostinger.com
Priority: 10
TTL: 14400
```

## 🎯 **What You Need to Do**

### **1. Create Email Account in Hostinger**

1. **Login to Hostinger Control Panel**
   - Go to https://hpanel.hostinger.com
   - Login with your credentials

2. **Navigate to Email Section**
   - Click on **"Email"** from the main menu
   - Select **"Email Accounts"**

3. **Create Business Email**
   - Click **"Create Email Account"**
   - Enter:
     - **Email**: `business@cryptorafts.com`
     - **Password**: (Choose a strong password)
   - Click **"Create"**

### **2. Verify MX Records Are Active**

Check if MX records are propagating:
- Visit: https://mxtoolbox.com/SuperTool.aspx?action=mx%3acryptorafts.com
- Should show `mx1.hostinger.com` and `mx2.hostinger.com`

Wait 24-48 hours after DNS changes for full propagation.

### **3. Access Your Email**

**Option A: Webmail**
- Visit: https://webmail.hostinger.com
- Login with: `business@cryptorafts.com`
- Use your password

**Option B: Email Client (Outlook, Thunderbird)**
```
Incoming Server (IMAP):
- Server: imap.hostinger.com
- Port: 993
- Security: SSL/TLS
- Username: business@cryptorafts.com
- Password: (your email password)

Outgoing Server (SMTP):
- Server: smtp.hostinger.com
- Port: 465
- Security: SSL/TLS
- Username: business@cryptorafts.com
- Password: (your email password)
```

### **4. Alternative: Gmail with Custom Domain (Recommended)**

If you want better email management:

1. **Sign up for Google Workspace**
   - Visit: https://workspace.google.com
   - Choose Business Starter plan ($6/user/month)

2. **Verify Domain**
   - Add TXT record for domain verification
   - Update MX records to Google:
     ```
     Type: MX
     Name: @
     Value: aspmx.l.google.com
     Priority: 1
     
     Type: MX
     Name: @
     Value: alt1.aspmx.l.google.com
     Priority: 5
     
     Type: MX
     Name: @
     Value: alt2.aspmx.l.google.com
     Priority: 5
     
     Type: MX
     Name: @
     Value: alt3.aspmx.l.google.com
     Priority: 10
     
     Type: MX
     Name: @
     Value: alt4.aspmx.l.google.com
     Priority: 10
     ```

### **5. Update Your Website Contact Information**

Once email is live, update these files:

1. **`src/app/structured-data.tsx`** - Update contact email:
```typescript
contactPoint: {
  '@type': 'ContactPoint',
  contactType: 'Customer Service',
  email: 'business@cryptorafts.com'  // ← Update this
}
```

2. **Check all contact forms and pages** to use this email

## 🚨 **Troubleshooting**

### Email Not Working?

1. **Check DNS Propagation**
   - Wait 24-48 hours after creating MX records
   - Use https://mxtoolbox.com to verify

2. **Verify Email Account Created**
   - Login to Hostinger panel
   - Confirm email account exists

3. **Check Spam Folder**
   - First emails might go to spam
   - Mark as "Not Spam"

4. **Contact Hostinger Support**
   - If still not working after 48 hours
   - Contact via live chat in Hostinger panel

## ✅ **Verification Checklist**

- [ ] MX records added to DNS (Done ✅)
- [ ] Email account created in Hostinger
- [ ] MX records propagated (check mxtoolbox.com)
- [ ] Test sending email to business@cryptorafts.com
- [ ] Test receiving email from business@cryptorafts.com
- [ ] Updated website contact information

## 📞 **Need Help?**

If you need assistance:
1. Check Hostinger documentation
2. Contact Hostinger support via live chat
3. Visit: https://www.hostinger.com/tutorials

---

**Note**: DNS changes can take up to 48 hours to fully propagate worldwide. Be patient if it doesn't work immediately.

