# 🚀 Copy-Paste Deployment Commands

## Option 1: You're Already on VPS (root@www:/var/www/cryptorafts#)

If you're already logged into your VPS, just copy-paste these commands:

```bash
cd /var/www/cryptorafts

# Make scripts executable
chmod +x FINAL_DEPLOYMENT_COMPLETE.sh
chmod +x NGINX_CONFIG_CHECK.sh
chmod +x COMPREHENSIVE_VPS_DIAGNOSTIC.sh

# Check Nginx configuration
./NGINX_CONFIG_CHECK.sh

# Deploy fixed code
./FINAL_DEPLOYMENT_COMPLETE.sh

# Verify deployment
curl -s http://127.0.0.1:3000/ | grep "WELCOME TO CRYPTORAFTS"
```

---

## Option 2: PowerShell Commands (Windows to VPS)

### Step 1: Upload Files Using SCP (PowerShell)

Replace `YOUR_VPS_IP` with your actual VPS IP address:

```powershell
# Navigate to project directory
cd C:\Users\dell\cryptorafts-starter

# Upload fixed source files
scp src/app/page.tsx root@YOUR_VPS_IP:/var/www/cryptorafts/src/app/page.tsx
scp src/app/HomePageClient.tsx root@YOUR_VPS_IP:/var/www/cryptorafts/src/app/HomePageClient.tsx

# Upload deployment scripts
scp FINAL_DEPLOYMENT_COMPLETE.sh root@YOUR_VPS_IP:/var/www/cryptorafts/
scp NGINX_CONFIG_CHECK.sh root@YOUR_VPS_IP:/var/www/cryptorafts/
scp COMPREHENSIVE_VPS_DIAGNOSTIC.sh root@YOUR_VPS_IP:/var/www/cryptorafts/
```

### Step 2: SSH into VPS and Deploy (PowerShell)

```powershell
# SSH into VPS
ssh root@YOUR_VPS_IP

# Once connected, run these commands:
cd /var/www/cryptorafts
chmod +x *.sh
./NGINX_CONFIG_CHECK.sh
./FINAL_DEPLOYMENT_COMPLETE.sh
curl -s http://127.0.0.1:3000/ | grep "WELCOME TO CRYPTORAFTS"
```

---

## Option 3: All-in-One PowerShell Script

Create a file `deploy.ps1` and run it:

```powershell
# Set your VPS IP
$VPS_IP = "YOUR_VPS_IP"
$VPS_USER = "root"
$PROJECT_DIR = "C:\Users\dell\cryptorafts-starter"
$VPS_DIR = "/var/www/cryptorafts"

# Navigate to project
cd $PROJECT_DIR

# Upload files
Write-Host "Uploading files to VPS..." -ForegroundColor Green
scp "$PROJECT_DIR\src\app\page.tsx" "${VPS_USER}@${VPS_IP}:${VPS_DIR}/src/app/page.tsx"
scp "$PROJECT_DIR\src\app\HomePageClient.tsx" "${VPS_USER}@${VPS_IP}:${VPS_DIR}/src/app/HomePageClient.tsx"
scp "$PROJECT_DIR\FINAL_DEPLOYMENT_COMPLETE.sh" "${VPS_USER}@${VPS_IP}:${VPS_DIR}/"
scp "$PROJECT_DIR\NGINX_CONFIG_CHECK.sh" "${VPS_USER}@${VPS_IP}:${VPS_DIR}/"
scp "$PROJECT_DIR\COMPREHENSIVE_VPS_DIAGNOSTIC.sh" "${VPS_USER}@${VPS_IP}:${VPS_DIR}/"

Write-Host "Files uploaded! Now SSH into VPS and run deployment..." -ForegroundColor Yellow
Write-Host "Run: ssh ${VPS_USER}@${VPS_IP}" -ForegroundColor Yellow
```

---

## Option 4: Direct VPS Commands (If Already Connected)

If you're already on the VPS (root@www:/var/www/cryptorafts#), just run:

```bash
cd /var/www/cryptorafts && chmod +x *.sh && ./NGINX_CONFIG_CHECK.sh && ./FINAL_DEPLOYMENT_COMPLETE.sh && curl -s http://127.0.0.1:3000/ | grep "WELCOME TO CRYPTORAFTS"
```

---

## Quick Reference

### If Already on VPS:
```bash
cd /var/www/cryptorafts
chmod +x *.sh
./FINAL_DEPLOYMENT_COMPLETE.sh
```

### If Uploading from Windows:
```powershell
cd C:\Users\dell\cryptorafts-starter
scp src/app/page.tsx root@YOUR_VPS_IP:/var/www/cryptorafts/src/app/page.tsx
scp src/app/HomePageClient.tsx root@YOUR_VPS_IP:/var/www/cryptorafts/src/app/HomePageClient.tsx
scp *.sh root@YOUR_VPS_IP:/var/www/cryptorafts/
```

---

**Note**: Replace `YOUR_VPS_IP` with your actual VPS IP address or domain name.







