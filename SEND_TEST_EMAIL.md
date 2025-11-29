# 📧 Send Test Email - Instructions

## 🎯 **How to Send Test Email to anasshamsiggc@gmail.com**

### **Method 1: Using Node Script (Recommended)**

1. **Open terminal** in your project directory
2. **Run the test script:**
   ```bash
   node test-email.js
   ```

The script will:
- ✅ Check email configuration
- ✅ Send test email to `anasshamsiggc@gmail.com`
- ✅ Show success/error message

### **Method 2: Through API Endpoint**

Once your server is running:

1. **Start your Next.js server:**
   ```bash
   npm run dev
   ```

2. **Send POST request to test endpoint:**
   
   Using PowerShell:
   ```powershell
   Invoke-WebRequest -Uri "http://localhost:3000/api/test-email" -Method POST -ContentType "application/json" -Body '{"email":"anasshamsiggc@gmail.com","type":"promotional"}'
   ```

   Using cURL (in Git Bash):
   ```bash
   curl -X POST http://localhost:3000/api/test-email \
     -H "Content-Type: application/json" \
     -d '{"email":"anasshamsiggc@gmail.com","type":"promotional"}'
   ```

### **Test Email Types:**

You can test different email types by changing the `type` parameter:

```json
{
  "email": "anasshamsiggc@gmail.com",
  "type": "promotional"  // Options: welcome, promotional, kyc-approval, kyc-rejection, or omit for all
}
```

## ✅ **What You Need:**

Make sure your `.env.local` file has:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=business@cryptorafts.com
EMAIL_PASSWORD=your_gmail_app_password
NEXT_PUBLIC_APP_URL=https://www.cryptorafts.com
```

## 🔍 **Troubleshooting:**

### **Email not received?**
1. Check spam folder
2. Wait 1-2 minutes for delivery
3. Verify email credentials
4. Check console for error messages

### **Connection error?**
1. Make sure Gmail app password is set correctly
2. Check internet connection
3. Verify EMAIL_USER and EMAIL_PASSWORD are correct

### **"Less secure app" error?**
Use Gmail App Password instead of regular password:
1. Go to Google Account settings
2. Security → 2-Step Verification → App passwords
3. Generate password for "Mail"
4. Use that password in EMAIL_PASSWORD

## 📧 **What the Test Email Contains:**

- ✅ Confirmation that email system works
- ✅ List of all available email types
- ✅ Instructions for using the system
- ✅ Professional branding and design

---

**Ready to test?** Run `node test-email.js` now! 🚀

