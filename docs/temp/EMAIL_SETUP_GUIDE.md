# CryptoRafts Email System Setup Guide

## Overview
This guide will help you set up the business email `business@cryptorafts.com` from Hostinger and configure it to send approval emails to registered members.

## Prerequisites
- Hostinger hosting account with email service
- Access to Hostinger control panel
- Node.js environment variables configuration

## Step 1: Set Up Hostinger Email Account

### 1.1 Create Email Account
1. Log into your Hostinger control panel
2. Navigate to **Email** section
3. Click **Create Email Account**
4. Set up the email:
   - **Email Address**: `business@cryptorafts.com`
   - **Password**: Create a strong password (save this for later)
   - **Mailbox Size**: Set appropriate size (e.g., 1GB)

### 1.2 Configure SMTP Settings
Hostinger SMTP settings:
- **SMTP Host**: `smtp.hostinger.com`
- **SMTP Port**: `587` (TLS) or `465` (SSL)
- **Security**: STARTTLS or SSL
- **Authentication**: Required

## Step 2: Configure Environment Variables

### 2.1 Create Environment File
Create a `.env.local` file in your project root:

```bash
# Email Configuration for CryptoRafts
EMAIL_HOST=smtp.hostinger.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=business@cryptorafts.com
EMAIL_PASSWORD=your_actual_hostinger_password_here

# Application URL for email links
NEXT_PUBLIC_APP_URL=https://cryptorafts.com

# Email Service Settings
EMAIL_FROM_NAME=CryptoRafts
EMAIL_FROM_ADDRESS=business@cryptorafts.com
```

### 2.2 Security Notes
- Never commit `.env.local` to version control
- Use strong passwords for email accounts
- Consider using app-specific passwords if available

## Step 3: Test Email Configuration

### 3.1 Run Test Script
```bash
npx tsx scripts/test-email.ts
```

### 3.2 Manual API Test
You can also test via the API:
```bash
curl -X GET http://localhost:3001/api/email/send
```

## Step 4: Email Templates

The system includes three email templates:

### 4.1 Registration Confirmation
- Sent when user completes profile registration
- Includes next steps and timeline information

### 4.2 Approval Email
- Sent when user account is approved
- Includes welcome message and dashboard access

### 4.3 KYC Approval Notification
- Sent when KYC verification is completed
- Confirms identity verification and full access

## Step 5: Admin Email Management

### 5.1 Access Admin Panel
Navigate to `/admin/email` to access the email management interface.

### 5.2 Available Actions
- **Get Statistics**: View user registration statistics
- **Send Approval to All Users**: Send approval emails to all registered users
- **Send Approval to Pending Users**: Send approval emails to users with pending KYC
- **Send KYC Approval Notifications**: Send notifications to approved users

### 5.3 Bulk Email Operations
The system supports bulk email operations with rate limiting to prevent spam.

## Step 6: Integration Points

### 6.1 Registration Flow
- Email sent automatically after profile completion
- Integrated in `src/app/founder/register/page.tsx`

### 6.2 API Endpoints
- `POST /api/email/send`: Send individual emails
- `POST /api/admin/email`: Bulk email operations
- `GET /api/admin/email`: Get user statistics

### 6.3 Service Classes
- `EmailService`: Core email functionality
- `RegistrationEmailManager`: Registration-specific emails
- `AdminEmailManager`: Admin bulk operations

## Step 7: Monitoring and Troubleshooting

### 7.1 Logs
Check console logs for email sending status:
- ✅ Success indicators
- ❌ Error messages
- ⚠️ Warning messages

### 7.2 Common Issues
1. **Authentication Failed**
   - Check EMAIL_PASSWORD in .env.local
   - Verify email account exists in Hostinger

2. **Connection Timeout**
   - Check SMTP host and port settings
   - Verify firewall/network settings

3. **Email Not Delivered**
   - Check spam folders
   - Verify recipient email addresses
   - Check Hostinger email quotas

### 7.3 Rate Limiting
- Default delay: 1 second between emails
- Configurable via EMAIL_RATE_LIMIT_DELAY
- Prevents email service blocking

## Step 8: Production Deployment

### 8.1 Environment Variables
Ensure all email environment variables are set in production:
- Hostinger SMTP credentials
- Application URL
- Email service settings

### 8.2 Security Considerations
- Use environment variables for all sensitive data
- Implement proper error handling
- Monitor email sending logs
- Set up email delivery monitoring

## Step 9: Maintenance

### 9.1 Regular Tasks
- Monitor email delivery rates
- Check Hostinger email quotas
- Update email templates as needed
- Review and rotate passwords

### 9.2 Scaling Considerations
- Consider email service providers for high volume
- Implement email queuing for large batches
- Monitor API rate limits
- Set up email analytics

## Support

For issues with:
- **Hostinger Email**: Contact Hostinger support
- **Email Service**: Check logs and configuration
- **Application Integration**: Review API endpoints and service classes

## Files Created/Modified

### New Files
- `src/lib/email.service.ts` - Core email service
- `src/config/email.config.ts` - Email configuration
- `src/lib/registration-email.manager.ts` - Registration email manager
- `src/lib/admin-email.manager.ts` - Admin email operations
- `src/app/api/email/send/route.ts` - Email API endpoint
- `src/app/api/admin/email/route.ts` - Admin email API
- `src/app/admin/email/page.tsx` - Admin email interface
- `scripts/test-email.ts` - Email testing script

### Modified Files
- `src/app/founder/register/page.tsx` - Added email integration
- `package.json` - Added nodemailer dependencies

This completes the setup of the business email system for CryptoRafts!
