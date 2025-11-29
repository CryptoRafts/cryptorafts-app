# Gmail Integration Setup for business@cryptorafts.com

## Overview
This guide shows you how to use your business email `business@cryptorafts.com` with Gmail for sending approval emails to CryptoRafts users.

## 🎯 Recommended Approach: Gmail SMTP

This is the easiest and most reliable method for Gmail users.

### Step 1: Add Business Email to Gmail Account

1. **Open Gmail Settings**
   - Go to Gmail.com
   - Click the gear icon ⚙️
   - Select "See all settings"

2. **Add Another Email Address**
   - Go to "Accounts and Import" tab
   - Find "Send mail as" section
   - Click "Add another email address"

3. **Configure Business Email**
   - **Name**: CryptoRafts
   - **Email address**: business@cryptorafts.com
   - **Treat as an alias**: ✅ Check this box
   - Click "Next Step"

4. **Verify Ownership**
   - Gmail will send a verification email
   - Check your business email inbox
   - Click the verification link
   - Or enter the verification code

### Step 2: Enable 2-Factor Authentication

1. **Go to Google Account Settings**
   - Visit [myaccount.google.com](https://myaccount.google.com)
   - Click "Security" in the left sidebar

2. **Enable 2-Step Verification**
   - Find "2-Step Verification"
   - Click "Get started"
   - Follow the setup process

### Step 3: Generate App Password

1. **Access App Passwords**
   - Go to Google Account > Security
   - Under "2-Step Verification", click "App passwords"
   - You may need to sign in again

2. **Create App Password**
   - Select app: "Mail"
   - Select device: "Other (custom name)"
   - Enter: "CryptoRafts Email Service"
   - Click "Generate"

3. **Save the Password**
   - Copy the 16-character password
   - You'll use this in your .env.local file

### Step 4: Configure Environment Variables

Create or update your `.env.local` file:

```bash
# Gmail SMTP Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=business@cryptorafts.com
EMAIL_PASSWORD=your_16_character_app_password_here

# Application settings
NEXT_PUBLIC_APP_URL=https://cryptorafts.com
EMAIL_FROM_NAME=CryptoRafts
EMAIL_FROM_ADDRESS=business@cryptorafts.com
```

### Step 5: Test the Configuration

Run the test script:
```bash
npx tsx scripts/test-email.ts
```

## 🔄 Alternative Approaches

### Option 2: Hostinger SMTP + Gmail Forwarding

If you prefer to keep emails in Hostinger but manage them through Gmail:

1. **Set up Hostinger Email**
   - Create business@cryptorafts.com in Hostinger
   - Set up email forwarding to your Gmail

2. **Configure Gmail to Send As**
   - Add business@cryptorafts.com to Gmail
   - Use Hostinger SMTP settings in your app

3. **Environment Variables**
   ```bash
   EMAIL_HOST=smtp.hostinger.com
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=business@cryptorafts.com
   EMAIL_PASSWORD=your_hostinger_password
   ```

### Option 3: Gmail Workspace (Advanced)

For businesses wanting full Gmail integration:

1. **Set up Google Workspace**
   - Create business@cryptorafts.com domain
   - Use Gmail for Business features
   - Full integration with Gmail interface

## 🧪 Testing Your Setup

### Test Individual Email
```bash
curl -X POST http://localhost:3001/api/email/send \
  -H "Content-Type: application/json" \
  -d '{
    "type": "approval",
    "userData": {
      "firstName": "Test",
      "lastName": "User",
      "email": "your-test-email@gmail.com"
    }
  }'
```

### Test Bulk Emails
Visit `/admin/email` in your browser to use the admin interface.

## 🔧 Troubleshooting

### Common Issues

1. **"Authentication failed"**
   - ✅ Check your app password (not regular Gmail password)
   - ✅ Ensure 2FA is enabled
   - ✅ Verify business@cryptorafts.com is added to Gmail

2. **"Connection timeout"**
   - ✅ Check internet connection
   - ✅ Verify SMTP settings (smtp.gmail.com:587)
   - ✅ Check firewall settings

3. **"Email not delivered"**
   - ✅ Check spam folders
   - ✅ Verify recipient email addresses
   - ✅ Check Gmail sending limits

### Gmail Sending Limits

- **Free Gmail**: 500 emails/day, 100 emails/hour
- **Google Workspace**: 2000 emails/day
- **App passwords**: Same limits as regular Gmail

## 📊 Monitoring Email Delivery

### Check Email Status
1. **Gmail Sent Folder**: Check if emails appear in sent items
2. **Application Logs**: Monitor console for success/failure messages
3. **Admin Interface**: Use `/admin/email` for statistics

### Email Analytics
- Track delivery rates
- Monitor bounce rates
- Check user engagement

## 🚀 Production Considerations

### Rate Limiting
The system includes built-in rate limiting:
- 1 second delay between emails
- Configurable via `EMAIL_RATE_LIMIT_DELAY`

### Error Handling
- Graceful failure handling
- Retry mechanisms
- Detailed logging

### Security
- Use app passwords (not regular passwords)
- Enable 2FA on Gmail account
- Monitor for suspicious activity

## 📝 Quick Setup Checklist

- [ ] Add business@cryptorafts.com to Gmail account
- [ ] Enable 2-factor authentication
- [ ] Generate app password
- [ ] Update .env.local with Gmail settings
- [ ] Test email sending
- [ ] Verify email delivery
- [ ] Set up monitoring

## 🆘 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Verify all environment variables
3. Test with a simple email first
4. Check Gmail account settings
5. Review application logs

This setup will allow you to send professional approval emails from business@cryptorafts.com using Gmail's reliable infrastructure! 🎉
