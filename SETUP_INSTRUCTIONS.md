# 🚀 CryptoRafts Email Setup - COMPLETE AUTOMATION

## ✅ What's Already Done:
- ✅ Email service configured
- ✅ Dependencies installed  
- ✅ Admin interface created
- ✅ Test scripts ready
- ✅ Environment file created

## 🔧 What YOU Need to Do (5 minutes):

### Step 1: Set up business@cryptorafts.com in Gmail
1. Go to Gmail.com → Settings (gear icon) → See all settings
2. Click "Accounts and Import" tab
3. Click "Add another email address" 
4. Enter: business@cryptorafts.com
5. Check "Treat as an alias"
6. Click "Next Step" and verify ownership

### Step 2: Enable 2-Factor Authentication
1. Go to myaccount.google.com → Security
2. Enable "2-Step Verification"

### Step 3: Generate App Password
1. Go to Google Account → Security → App passwords
2. Select "Mail" and generate password
3. Copy the 16-character password

### Step 4: Update .env.local
1. Open .env.local file
2. Replace "REPLACE_WITH_YOUR_GMAIL_APP_PASSWORD" with your app password
3. Save the file

### Step 5: Test Everything
Run these commands:
```bash
# Test email service
node quick-test.js

# Get user statistics  
node admin.js stats

# Send approval emails to all users
node admin.js approve-all
```

## 🎯 Ready to Use Commands:

```bash
# Quick test
node quick-test.js

# Admin operations
node admin.js stats
node admin.js approve-all
node admin.js approve-pending

# Web interface
# Visit: http://localhost:3001/admin/email
```

## 📧 Email Templates Ready:
- ✅ Registration confirmation
- ✅ Account approval  
- ✅ KYC approval notification

## 🚀 Your email system is 100% automated!
Just update the password and you're ready to send professional emails from business@cryptorafts.com!