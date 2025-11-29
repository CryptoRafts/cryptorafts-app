# 🚀 QUICK SETUP - Send Demo Test Email

## ✅ **SCRIPT IS WORKING!**

The script is running correctly. You just need to add your Gmail App Password.

## 📋 **SUPER SIMPLE SETUP (2 minutes):**

### **Step 1: Get Gmail App Password**
1. **Sign in to Gmail:**
   - Go to [Gmail.com](https://gmail.com)
   - Sign in with: `cryptorafts@gmail.com`

2. **Enable 2-Step Verification:**
   - Go to [myaccount.google.com](https://myaccount.google.com) → Security
   - Click "2-Step Verification"
   - Enable it

3. **Generate App Password:**
   - Go to [myaccount.google.com](https://myaccount.google.com) → Security → App passwords
   - Select "Mail" as the app
   - Click "Generate"
   - **Copy the 16-character password** (looks like: `abcd efgh ijkl mnop`)

### **Step 2: Update the Script**
1. Open `send-demo-test-email-simple.js`
2. Find line 12: `const password = 'REPLACE_WITH_YOUR_CRYPTORAFTS_GMAIL_APP_PASSWORD';`
3. Replace with: `const password = 'your_16_character_app_password';`
4. Save the file

### **Step 3: Send Demo Email**
```bash
node send-demo-test-email-simple.js
```

## 📧 **WHAT WILL HAPPEN:**

The script will:
1. ✅ Connect to Gmail
2. ✅ Verify connection
3. ✅ Send email FROM: business@cryptorafts.com
4. ✅ Send email TO: cryptorafts@gmail.com
5. ✅ Show success message

## 🎯 **CHECK YOUR EMAIL:**

After running the script:
1. Check **cryptorafts@gmail.com** inbox
2. Look for email from **business@cryptorafts.com**
3. Verify it shows "Demo Test Email" subject
4. Confirm everything is working!

## 🚀 **READY TO USE:**

Once you get the App Password and update the script, just run:
```bash
node send-demo-test-email-simple.js
```

**The script is ready and waiting for your Gmail App Password!** 🎉

