# 🚀 DEPLOY NEXT.JS TO HOSTINGER - STEP BY STEP

## Your CryptoRafts is a Next.js App - Special Deployment Required!

---

## ⚠️ IMPORTANT: HOSTINGER DEPLOYMENT OPTIONS

Hostinger offers **2 ways** to deploy Next.js:

### Option 1: **Static Export** (Easier - Recommended for Beginners)
- Converts Next.js to static HTML/CSS/JS
- Works on any Hostinger shared hosting plan
- No server-side features (SSR, API routes)
- **Best for:** Static websites, portfolios, landing pages

### Option 2: **Node.js Hosting** (Full Features)
- Full Next.js with server-side rendering
- Requires VPS or Business/Cloud hosting plan
- All Next.js features work
- **Best for:** Full web applications with dynamic features

---

## 🎯 **OPTION 1: STATIC EXPORT (RECOMMENDED)**

### Step 1: Configure Next.js for Static Export

Create or update `next.config.mjs`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true, // Required for static export
  },
  trailingSlash: true,
};

export default nextConfig;
```

### Step 2: Build Your Project

Open terminal in VS Code and run:

```bash
npm install
npm run build
```

This creates an **`out`** folder with your static site.

### Step 3: Upload to Hostinger

#### Using File Manager:
1. Login to **hPanel**: https://hpanel.hostinger.com
2. Click **"File Manager"**
3. Go to **`public_html`** folder
4. Delete any existing files
5. Upload **ALL files** from the **`out`** folder
6. Wait for upload to complete

#### Using FTP (FileZilla):
1. Download FileZilla: https://filezilla-project.org/
2. Get FTP credentials from hPanel → **"FTP Accounts"**
3. Connect to your site
4. Upload all files from **`out`** folder to **`public_html`**

### Step 4: Configure Domain & SSL

1. In hPanel → **"Domains"** → Verify domain is connected
2. In hPanel → **"SSL"** → Install **Free SSL Certificate**
3. Wait 10-15 minutes for SSL activation
4. Visit: **https://yourdomain.com** ✅

---

## 🔥 **OPTION 2: NODE.JS HOSTING (FULL FEATURES)**

### Prerequisites:
- Hostinger **Business, Cloud Premium, or VPS** plan
- Node.js enabled in hPanel

### Step 1: Check Your Hosting Plan

1. Login to hPanel
2. Check if you have **"Node.js"** option in sidebar
3. If not, you need to upgrade your plan

### Step 2: Enable Node.js

1. In hPanel → **"Advanced"** → **"Node.js"**
2. Click **"Create Application"**
3. Configure:
   - **Application mode**: Production
   - **Node.js version**: 18.x or 20.x
   - **Application URL**: Your domain
   - **Application root**: `/public_html`
   - **Application startup file**: `server.js`

### Step 3: Create Custom Server File

Create `server.js` in your project root:

```javascript
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  })
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
```

### Step 4: Upload Files via SSH

1. In hPanel → **"Advanced"** → **"SSH Access"**
2. Enable SSH
3. Use terminal or PuTTY to connect:

```bash
ssh username@yourdomain.com
```

4. Navigate to your directory:

```bash
cd public_html
```

5. Upload files using Git or FTP
6. Install dependencies:

```bash
npm install --production
```

7. Build the application:

```bash
npm run build
```

### Step 5: Start the Application

1. In hPanel → **"Node.js"** → Your application
2. Click **"Start Application"**
3. Application runs on assigned port
4. Access via your domain

---

## 📦 **QUICK DEPLOYMENT SCRIPT**

### For Windows (PowerShell):

Create `deploy-to-hostinger.ps1`:

```powershell
# CryptoRafts Hostinger Deployment Script

Write-Host "🚀 Starting CryptoRafts Deployment..." -ForegroundColor Cyan

# Step 1: Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install

# Step 2: Build for static export
Write-Host "🔨 Building static export..." -ForegroundColor Yellow
npm run build

# Step 3: Check if build succeeded
if (Test-Path "out") {
    Write-Host "✅ Build successful! Files ready in 'out' folder" -ForegroundColor Green
    Write-Host ""
    Write-Host "📁 Next Steps:" -ForegroundColor Cyan
    Write-Host "1. Login to hPanel: https://hpanel.hostinger.com" -ForegroundColor White
    Write-Host "2. Open File Manager → public_html" -ForegroundColor White
    Write-Host "3. Upload all files from 'out' folder" -ForegroundColor White
    Write-Host "4. Setup SSL certificate" -ForegroundColor White
    Write-Host "5. Visit your domain!" -ForegroundColor White
    Write-Host ""
    Write-Host "🌐 Your site will be live at: https://yourdomain.com" -ForegroundColor Green
} else {
    Write-Host "❌ Build failed! Check errors above." -ForegroundColor Red
}

# Open out folder in explorer
explorer out
```

Run it:
```bash
powershell -ExecutionPolicy Bypass -File deploy-to-hostinger.ps1
```

---

## 🔧 **FIXING COMMON ISSUES**

### Issue 1: "Image optimization not available"
**Solution:** Add to `next.config.mjs`:
```javascript
images: {
  unoptimized: true,
}
```

### Issue 2: Routes not working (404 errors)
**Solution:** Create `.htaccess` in `public_html`:
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

### Issue 3: API routes not working
**Solution:** Static export doesn't support API routes. Options:
- Move API logic to Firebase Functions
- Use external API services
- Upgrade to Node.js hosting

### Issue 4: Dynamic routes not working
**Solution:** In static export, you need to generate all pages at build time using `generateStaticParams`.

### Issue 5: Environment variables not working
**Solution:** 
1. Create `.env.production`:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
```
2. Only variables with `NEXT_PUBLIC_` prefix work in browser

---

## 🎨 **FIREBASE CONFIGURATION FOR PRODUCTION**

Update Firebase authorized domains:

1. Go to **Firebase Console**: https://console.firebase.google.com
2. Select **"cryptorafts-b9067"**
3. **Authentication** → **Settings** → **Authorized domains**
4. Add:
   - `yourdomain.com`
   - `www.yourdomain.com`

Update Firestore rules if needed for your domain.

---

## 📊 **PERFORMANCE OPTIMIZATION**

### 1. Enable Caching in Hostinger
```apache
# Add to .htaccess
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/svg "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
  ExpiresByType text/javascript "access plus 1 month"
</IfModule>
```

### 2. Enable Gzip Compression
```apache
# Add to .htaccess
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html
  AddOutputFilterByType DEFLATE text/css
  AddOutputFilterByType DEFLATE text/javascript
  AddOutputFilterByType DEFLATE application/javascript
  AddOutputFilterByType DEFLATE application/json
</IfModule>
```

### 3. Enable Cloudflare CDN
1. In hPanel → **"Website"** → **"Cloudflare"**
2. Enable Cloudflare
3. Follow activation steps
4. Enjoy faster global loading

---

## ✅ **DEPLOYMENT CHECKLIST**

### Pre-Deployment:
- [ ] Update `next.config.mjs` for static export
- [ ] Test build locally: `npm run build`
- [ ] Check `out` folder is created
- [ ] Verify all pages work
- [ ] Test Firebase connections
- [ ] Update environment variables

### Deployment:
- [ ] Login to Hostinger hPanel
- [ ] Clear `public_html` folder
- [ ] Upload all files from `out` folder
- [ ] Create `.htaccess` file
- [ ] Setup domain (if new)
- [ ] Install SSL certificate
- [ ] Force HTTPS redirect

### Post-Deployment:
- [ ] Add domain to Firebase authorized domains
- [ ] Test website on live domain
- [ ] Check all pages and routes
- [ ] Test authentication
- [ ] Test Firebase database
- [ ] Check browser console for errors
- [ ] Setup analytics
- [ ] Enable caching
- [ ] Test on mobile devices

---

## 🌟 **RECOMMENDED HOSTINGER PLANS**

### For Static Export:
- ✅ **Premium Hosting** ($2.99/mo) - Perfect!
- ✅ **Business Hosting** ($3.99/mo) - Best value
- Supports multiple sites, unlimited bandwidth

### For Full Next.js (Node.js):
- ✅ **Business Hosting** ($3.99/mo) - Node.js included
- ✅ **Cloud Startup** ($8.99/mo) - Better performance
- ✅ **VPS Hosting** ($4.99/mo) - Full control

---

## 🎯 **YOUR ACTION PLAN RIGHT NOW**

### Quick Start (30 Minutes):

```bash
# 1. Update next config (already done above)
# 2. Run these commands:
npm install
npm run build
```

### After build completes:
1. Open the `out` folder - these are your website files! 📁
2. Login to **Hostinger hPanel**
3. Upload all files to `public_html`
4. Install SSL certificate
5. **DONE!** Visit your domain! 🎉

---

## 🆘 **NEED HELP?**

### Common Questions:

**Q: Which option should I choose?**
A: Start with **Option 1 (Static Export)** - it's easier and works perfectly for most cases!

**Q: Will my Firebase features work?**
A: Yes! Firebase (Auth, Firestore, Storage) works perfectly with static export!

**Q: What if I need server-side features later?**
A: You can upgrade to Business hosting and switch to Node.js hosting anytime.

**Q: How long does deployment take?**
A: First time: ~30 minutes. After that: ~5 minutes for updates.

---

## 📞 **SUPPORT**

- **Hostinger 24/7 Chat**: In hPanel (bottom right)
- **Firebase Support**: https://firebase.google.com/support
- **Next.js Docs**: https://nextjs.org/docs

---

## 🎉 **READY TO DEPLOY?**

Tell me:
1. **What's your domain name?**
2. **Which Hostinger plan do you have?**
3. **Do you see the Node.js option in hPanel?**

I'll guide you through the exact steps for YOUR specific setup! 🚀

---

**Let's get your CryptoRafts live! 💎**

