# 🚀 DEPLOY NOW - Follow These Steps

## ⚡ QUICK DEPLOYMENT GUIDE

Follow these steps **IN ORDER** to deploy your CryptoRafts app to Hostinger VPS #1097850.

---

## 📋 STEP 1: GET SSH CREDENTIALS FROM HOSTINGER

1. **Open browser:** Go to https://hpanel.hostinger.com/vps/1097850/overview
2. **Login** with your Hostinger account
3. **Find "SSH Access"** or **"Server Details"** section
4. **Note down:**
   - **IP Address:** (e.g., 185.xxx.xxx.xxx)
   - **Username:** (usually `root`)
   - **Password:** (your VPS password)

**Copy these credentials - you'll need them!**

---

## 📤 STEP 2: UPLOAD FILES TO YOUR VPS

**On your Windows machine, open PowerShell:**

```powershell
# Navigate to your project
cd C:\Users\dell\cryptorafts-starter

# Upload all files to VPS (replace YOUR_VPS_IP with your actual IP)
scp -r . root@YOUR_VPS_IP:/var/www/cryptorafts/

# When prompted, enter your VPS password
```

**OR use WinSCP (easier):**
1. Download WinSCP: https://winscp.net/
2. Connect to your VPS:
   - Host: Your VPS IP
   - Username: `root`
   - Password: Your VPS password
3. Navigate to `/var/www/cryptorafts`
4. Upload all files from your project folder

---

## 🔧 STEP 3: CONNECT TO YOUR VPS VIA SSH

**On Windows:**

**Option A: PowerShell/CMD**
```powershell
ssh root@YOUR_VPS_IP
# Enter password when prompted
```

**Option B: PuTTY**
1. Download PuTTY: https://www.putty.org/
2. Enter VPS IP, Port: 22
3. Click "Open"
4. Login: `root`
5. Enter password

---

## ⚙️ STEP 4: RUN SETUP SCRIPT ON VPS

**Once connected to VPS via SSH, run:**

```bash
# Navigate to app directory
cd /var/www/cryptorafts

# Make setup script executable
chmod +x deploy-to-hostinger-vps.sh

# Run setup script (this installs everything)
sudo bash deploy-to-hostinger-vps.sh
```

**This will automatically:**
- ✅ Install Node.js 18.x
- ✅ Install PM2
- ✅ Install Nginx
- ✅ Install Certbot
- ✅ Configure Nginx
- ✅ Setup firewall

**Wait for script to complete (5-10 minutes)**

---

## 🚀 STEP 5: CONFIGURE AND DEPLOY APPLICATION

**Still on your VPS, run:**

```bash
cd /var/www/cryptorafts

# Switch to VPS config
cp next.config.vps.js next.config.js

# Install dependencies
npm install --production

# Create environment file
nano .env.production
```

**In the nano editor, paste this (replace with your actual keys):**

```env
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain_here
NEXT_PUBLIC_FIREBASE_PROJECT_ID=cryptorafts-b9067
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket_here
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id_here
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id_here
OPENAI_API_KEY=your_openai_key_here
```

**Save:** Press `Ctrl + X`, then `Y`, then `Enter`

**Continue with:**

```bash
# Build application
npm run build

# Create logs directory
mkdir -p logs

# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Copy and run the command that PM2 shows you
```

---

## 🔒 STEP 6: SETUP SSL CERTIFICATE

**Still on your VPS:**

```bash
# Get SSL certificate
sudo certbot --nginx -d cryptorafts.com -d www.cryptorafts.com
```

**Follow prompts:**
- Enter email address
- Agree to terms (type `Y`)
- Choose to redirect HTTP to HTTPS (recommended: `2`)

**Wait for SSL to be installed (1-2 minutes)**

---

## 🔥 STEP 7: ADD DOMAIN TO FIREBASE

1. **Go to:** https://console.firebase.google.com
2. **Select project:** `cryptorafts-b9067`
3. **Navigate to:** Authentication → Settings → Authorized domains
4. **Click "Add domain"**
5. **Add:** `cryptorafts.com`
6. **Add again:** `www.cryptorafts.com`

---

## ✅ STEP 8: TEST YOUR DEPLOYMENT!

1. **Visit:** https://www.cryptorafts.com
2. **Check:**
   - ✅ Website loads
   - ✅ HTTPS active (🔒 padlock in browser)
   - ✅ Homepage displays correctly
   - ✅ Login works
   - ✅ All pages accessible

**If everything works, you're live! 🎉**

---

## 🚨 TROUBLESHOOTING

### Can't connect via SSH?

**Check:**
- ✅ VPS IP is correct
- ✅ Username is `root`
- ✅ Password is correct
- ✅ Firewall allows SSH (port 22)

**In Hostinger panel:**
- Go to VPS settings
- Check SSH access is enabled

### Application not starting?

```bash
# Check PM2 logs
pm2 logs cryptorafts --lines 100

# Check status
pm2 status

# Restart app
pm2 restart cryptorafts
```

### Nginx 502 Bad Gateway?

```bash
# Check if app is running
pm2 status

# Check if app responds
curl http://localhost:3000

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log
```

### SSL not working?

```bash
# Check certificate status
sudo certbot certificates

# Test renewal
sudo certbot renew --dry-run
```

---

## 🎯 QUICK COMMAND REFERENCE

**On your VPS:**

```bash
# Check app status
pm2 status

# View logs
pm2 logs cryptorafts

# Restart app
pm2 restart cryptorafts

# Check Nginx
sudo nginx -t
sudo systemctl status nginx

# Check if app is responding
curl http://localhost:3000
```

---

## 📞 NEED HELP?

**If stuck at any step:**
1. Check error messages
2. Review troubleshooting section above
3. Check PM2 logs: `pm2 logs cryptorafts`
4. Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
5. Ask me what step you're on and what error you see!

---

## 🎊 DEPLOYMENT COMPLETE!

Once all steps are done:
- ✅ Your app is live at https://www.cryptorafts.com
- ✅ SSL/HTTPS enabled
- ✅ PM2 managing the app (auto-restart on crash)
- ✅ Production-ready!

**Congratulations! 🚀**

