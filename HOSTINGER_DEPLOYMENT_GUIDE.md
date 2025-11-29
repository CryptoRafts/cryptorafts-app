# 🚀 HOSTINGER DEPLOYMENT GUIDE - CryptoRafts

## Complete Step-by-Step Guide to Deploy Your CryptoRafts Platform

---

## 📋 **STEP 1: PREPARE YOUR PROJECT FOR DEPLOYMENT**

### 1.1 Check Your Project Structure
Your project needs to be built before deployment. Let's check what type of project this is:

```bash
# Open terminal and run:
npm install
npm run build
```

This will create a `build` or `dist` folder with all your production files.

---

## 🌐 **STEP 2: ACCESS YOUR HOSTINGER ACCOUNT**

### 2.1 Login to Hostinger
1. Go to: **https://www.hostinger.com**
2. Click **"Login"** (top right)
3. Enter your **email** and **password**
4. You'll be directed to **hPanel** (Hostinger Control Panel)

### 2.2 Find Your Hosting Account
- In hPanel, you'll see your **hosting plan**
- Click on **"Manage"** next to your hosting account
- This is where we'll deploy your site!

---

## 📁 **STEP 3: UPLOAD YOUR FILES**

### Option A: Using File Manager (Recommended for Beginners)

#### 3.1 Access File Manager
1. In hPanel, scroll down to **"Files"** section
2. Click **"File Manager"**
3. You'll see your file directory

#### 3.2 Navigate to public_html
1. Open the **`public_html`** folder
2. This is where your website files go
3. **Delete** any default files (index.html, etc.)

#### 3.3 Upload Your Build Files
1. Click **"Upload Files"** button (top right)
2. Select ALL files from your **`build`** or **`dist`** folder
3. Wait for upload to complete (this may take 5-10 minutes)
4. Make sure these files are uploaded:
   - `index.html`
   - `assets/` folder
   - All CSS/JS files
   - Any images

### Option B: Using FTP (For Advanced Users)

#### 3.4 Get FTP Credentials
1. In hPanel, go to **"Files"** → **"FTP Accounts"**
2. You'll see your FTP credentials:
   - **FTP Host**: usually `ftp.yourdomain.com`
   - **Username**: your FTP username
   - **Password**: (use "Change Password" if needed)
   - **Port**: 21

#### 3.5 Use FTP Client (FileZilla)
1. Download **FileZilla** from: https://filezilla-project.org/
2. Install and open FileZilla
3. Enter your FTP credentials:
   - Host: `ftp.yourdomain.com`
   - Username: (from hPanel)
   - Password: (from hPanel)
   - Port: 21
4. Click **"Quickconnect"**
5. Navigate to **`public_html`** folder on right side
6. Drag and drop all files from your **`build`** folder to **`public_html`**

---

## 🌍 **STEP 4: CONFIGURE YOUR DOMAIN**

### 4.1 Point Domain to Hosting
1. In hPanel, go to **"Domains"**
2. Click **"Add Domain"** or select your existing domain
3. If you bought domain from Hostinger, it's **already connected**! ✅
4. If domain is from another provider:
   - Get nameservers from Hostinger (usually `ns1.dns-parking.com` and `ns2.dns-parking.com`)
   - Go to your domain registrar
   - Update DNS/Nameservers to Hostinger's nameservers

### 4.2 Setup SSL Certificate (HTTPS)
1. In hPanel, go to **"Security"** → **"SSL"**
2. Click **"Install SSL"** for your domain
3. Select **"Free SSL"** (Let's Encrypt)
4. Click **"Install"**
5. Wait 5-15 minutes for activation

### 4.3 Force HTTPS (Recommended)
1. In hPanel, go to **"Advanced"** → **".htaccess Editor"**
2. Add this code at the top:

```apache
# Force HTTPS
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

3. Click **"Save"**

---

## 🔧 **STEP 5: CONFIGURE FIREBASE (CRITICAL!)**

### 5.1 Update Firebase Configuration
Since you're using Firebase, you need to add your domain to Firebase:

1. Go to **Firebase Console**: https://console.firebase.google.com/
2. Select your project: **"cryptorafts-b9067"**
3. Click **"Authentication"** → **"Settings"** → **"Authorized domains"**
4. Click **"Add domain"**
5. Add your Hostinger domain: `yourdomain.com`
6. Also add: `www.yourdomain.com`

### 5.2 Update CORS Settings
If using Firebase Storage or Functions:
1. Add your domain to CORS whitelist
2. Update any API endpoint URLs in your code

---

## 🎯 **STEP 6: SETUP ENVIRONMENT VARIABLES**

### 6.1 Create .env File (if needed)
If your project uses environment variables:

1. In File Manager, navigate to `public_html`
2. Create a file named **`.env`**
3. Add your environment variables:

```env
REACT_APP_FIREBASE_API_KEY=AIzaSyD4u9bSdXm9xJO-WqgmVMY-zJQwQ8sF3p8
REACT_APP_FIREBASE_AUTH_DOMAIN=cryptorafts-b9067.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=cryptorafts-b9067
REACT_APP_FIREBASE_STORAGE_BUCKET=cryptorafts-b9067.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=909155646246
REACT_APP_FIREBASE_APP_ID=1:909155646246:web:85f9a68b9c4e3d8f8c8e3e
```

---

## 📱 **STEP 7: CONFIGURE PHP & NODE.JS (IF NEEDED)**

### 7.1 Select PHP Version
1. In hPanel, go to **"Advanced"** → **"PHP Configuration"**
2. Select **PHP 8.1** or higher (recommended)
3. Enable required extensions

### 7.2 Setup Node.js (if using SSR)
1. In hPanel, go to **"Advanced"** → **"Node.js"**
2. Enable Node.js
3. Select version (18.x recommended)
4. Set application startup file
5. Install dependencies via terminal

---

## ✅ **STEP 8: TEST YOUR WEBSITE**

### 8.1 Visit Your Domain
1. Open browser
2. Go to: **https://yourdomain.com**
3. Check if website loads correctly
4. Test all features:
   - Login/Authentication
   - Firebase connections
   - All pages and routes
   - Forms and submissions

### 8.2 Check for Errors
1. Open browser **Console** (F12)
2. Check for any errors
3. Fix any CORS or API issues
4. Verify Firebase is connecting

---

## 🔍 **STEP 9: SETUP CUSTOM REDIRECTS**

### 9.1 For Single Page Application (React)
If using React Router, add this to `.htaccess`:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME} !-l
  RewriteRule . /index.html [L]
</IfModule>
```

This ensures all routes work correctly.

---

## 📊 **STEP 10: SETUP ANALYTICS & MONITORING**

### 10.1 Enable Hostinger Analytics
1. In hPanel, go to **"Statistics"** → **"Visitors"**
2. View your website traffic

### 10.2 Setup Google Analytics (Optional)
1. Go to: https://analytics.google.com/
2. Create property for your domain
3. Add tracking code to your site

---

## 🎨 **STEP 11: OPTIMIZE PERFORMANCE**

### 11.1 Enable Caching
In hPanel → **"Advanced"** → **"Cache Manager"**:
- Enable **LiteSpeed Cache**
- Clear cache after any updates

### 11.2 Enable CDN (Optional)
1. Go to **"Website"** → **"Cloudflare"**
2. Enable Cloudflare integration
3. Follow setup instructions

### 11.3 Optimize Images
- Use compressed images
- Enable lazy loading
- Use WebP format where possible

---

## 🛠️ **TROUBLESHOOTING COMMON ISSUES**

### Issue 1: Website Not Loading
**Solution:**
- Check if files are in `public_html` folder
- Verify domain is pointing to Hostinger
- Wait 24-48 hours for DNS propagation

### Issue 2: 404 Errors on Routes
**Solution:**
- Add `.htaccess` file with React Router rules
- Enable mod_rewrite in PHP settings

### Issue 3: Firebase Not Connecting
**Solution:**
- Add domain to Firebase authorized domains
- Check CORS settings
- Verify API keys in environment variables

### Issue 4: SSL Not Working
**Solution:**
- Wait 15-30 minutes after installation
- Clear browser cache
- Force HTTPS redirect in .htaccess

### Issue 5: Slow Loading
**Solution:**
- Enable caching in hPanel
- Optimize images
- Minify CSS/JS files
- Enable CDN

---

## 📞 **NEED HELP?**

### Hostinger Support
- **Live Chat**: Available 24/7 in hPanel
- **Email**: support@hostinger.com
- **Knowledge Base**: https://support.hostinger.com

### Quick Access Links
- **hPanel Login**: https://hpanel.hostinger.com
- **Hostinger Home**: https://www.hostinger.com
- **Firebase Console**: https://console.firebase.google.com

---

## ✨ **QUICK DEPLOYMENT CHECKLIST**

- [ ] Build project (`npm run build`)
- [ ] Login to Hostinger hPanel
- [ ] Upload files to `public_html` via File Manager or FTP
- [ ] Configure domain settings
- [ ] Install SSL certificate
- [ ] Add domain to Firebase authorized domains
- [ ] Setup `.htaccess` for React routing
- [ ] Test website on live domain
- [ ] Enable caching and optimization
- [ ] Setup analytics
- [ ] Monitor for errors

---

## 🎉 **CONGRATULATIONS!**

Your CryptoRafts platform is now live on Hostinger! 🚀

**Your website will be accessible at:**
- **https://yourdomain.com**
- **https://www.yourdomain.com**

---

## 📝 **NEXT STEPS AFTER DEPLOYMENT**

1. **Share your domain** with users
2. **Monitor performance** in hPanel analytics
3. **Regular backups** (Hostinger provides automatic backups)
4. **Update content** as needed
5. **Scale as you grow** - upgrade hosting plan if needed

---

## 💡 **PRO TIPS**

1. **Always backup** before making changes
2. **Use staging environment** for testing
3. **Monitor Firebase usage** to avoid overages
4. **Enable security features** in hPanel
5. **Regular updates** keep your site secure
6. **Use Hostinger Email** for professional emails

---

## 🔒 **SECURITY BEST PRACTICES**

1. **Strong passwords** for all accounts
2. **2FA enabled** on Hostinger account
3. **Regular backups** scheduled
4. **SSL certificate** always active
5. **Firewall rules** configured
6. **Update dependencies** regularly
7. **Monitor access logs** for suspicious activity

---

**Need more specific help? Tell me:**
- What's your domain name?
- What type of hosting plan do you have?
- Are you stuck on any particular step?

I'm here to help you through every step! 🎯

