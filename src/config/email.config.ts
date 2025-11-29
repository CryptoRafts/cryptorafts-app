// Email configuration for CryptoRafts
export const emailConfig = {
  // Hostinger SMTP Configuration (default) - Can be overridden with Gmail
  host: process.env.EMAIL_HOST || 'smtp.hostinger.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER || 'business@cryptorafts.com',
    pass: process.env.EMAIL_PASSWORD || '', // Hostinger email password
  },
  
  // Application settings
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://cryptorafts.com',
  fromName: process.env.EMAIL_FROM_NAME || 'CryptoRafts',
  fromAddress: process.env.EMAIL_FROM_ADDRESS || 'business@cryptorafts.com',
  
  // Rate limiting
  rateLimitDelay: parseInt(process.env.EMAIL_RATE_LIMIT_DELAY || '1000'),
  maxRetries: parseInt(process.env.EMAIL_MAX_RETRIES || '3'),
};

// Instructions for setting up business@cryptorafts.com with Gmail:
export const setupInstructions = `
To set up business@cryptorafts.com with Gmail:

OPTION 1: Gmail SMTP (Recommended)
1. Add business@cryptorafts.com to your Gmail account:
   - Go to Gmail Settings > Accounts and Import
   - Click "Add another email address"
   - Enter: business@cryptorafts.com
   - Verify ownership via email or domain verification

2. Enable 2-Factor Authentication on your Gmail account

3. Generate an App Password:
   - Go to Google Account settings
   - Security > 2-Step Verification > App passwords
   - Generate password for "Mail"
   - Use this password in EMAIL_PASSWORD

4. Configure .env.local:
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=business@cryptorafts.com
   EMAIL_PASSWORD=your_gmail_app_password

OPTION 2: Hostinger SMTP (RECOMMENDED FOR VERCEL)
1. Create email account in Hostinger control panel:
   - Go to: https://hpanel.hostinger.com/
   - Click "Email" > "Email Accounts"
   - Create: business@cryptorafts.com

2. Add to Vercel Environment Variables:
   EMAIL_HOST=smtp.hostinger.com
   EMAIL_PORT=587 (TLS) or 465 (SSL)
   EMAIL_SECURE=false (for 587) or true (for 465)
   EMAIL_USER=business@cryptorafts.com
   EMAIL_PASSWORD=your_hostinger_email_password
   EMAIL_FROM_NAME=CryptoRafts
   EMAIL_FROM_ADDRESS=business@cryptorafts.com

3. Hostinger SMTP Ports:
   - Port 587 (TLS) - Recommended: EMAIL_PORT=587, EMAIL_SECURE=false
   - Port 465 (SSL) - Alternative: EMAIL_PORT=465, EMAIL_SECURE=true

OPTION 3: Gmail Forwarding
1. Set up business@cryptorafts.com in Hostinger
2. Forward all emails to your Gmail account
3. Use Gmail SMTP to send from business address
4. Configure Gmail to send as business@cryptorafts.com
`;
