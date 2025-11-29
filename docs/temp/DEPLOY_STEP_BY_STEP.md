# 🚀 VPS Deployment - Step by Step Guide

## Current Issue
Files were deleted on VPS but not uploaded yet. Follow these steps:

---

## **STEP 1: Build Production (Windows)**

```powershell
cd C:\Users\dell\cryptorafts-starter
npm run build
```

Wait for build to complete (~2-3 minutes)

---

## **STEP 2: Upload Files to VPS (Windows)**

**Option A: Using SCP (recommended)**
```powershell
cd C:\Users\dell\cryptorafts-starter
scp -r .next root@72.61.98.99:/var/www/cryptorafts/
scp -r src root@72.61.98.99:/var/www/cryptorafts/
scp -r public root@72.61.98.99:/var/www/cryptorafts/
scp package.json root@72.61.98.99:/var/www/cryptorafts/
scp package-lock.json root@72.61.98.99:/var/www/cryptorafts/
scp next.config.js root@72.61.98.99:/var/www/cryptorafts/
scp server.js root@72.61.98.99:/var/www/cryptorafts/
scp tsconfig.json root@72.61.98.99:/var/www/cryptorafts/
```

**Option B: Using SFTP (FileZilla/WinSCP)**
1. Connect to: `root@72.61.98.99`
2. Navigate to: `/var/www/cryptorafts`
3. Upload these folders/files:
   - `.next` folder
   - `src` folder
   - `public` folder
   - `package.json`
   - `package-lock.json`
   - `next.config.js`
   - `server.js`
   - `tsconfig.json`

---

## **STEP 3: Deploy on VPS (SSH)**

```bash
# SSH into VPS
ssh root@72.61.98.99

# Navigate to app directory
cd /var/www/cryptorafts

# Install dependencies with legacy peer deps (fixes zod conflict)
npm install --legacy-peer-deps --production=false

# Create PM2 ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'cryptorafts',
    script: './server.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      HOSTNAME: '0.0.0.0'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '1G'
  }]
};
EOF

# Create logs directory
mkdir -p logs

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Check status
pm2 status
pm2 logs cryptorafts --lines 50
```

---

## **ONE-LINER (After uploading files)**

Copy-paste this entire command into VPS SSH:

```bash
cd /var/www/cryptorafts && npm install --legacy-peer-deps --production=false && cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'cryptorafts',
    script: './server.js',
    instances: 1,
    exec_mode: 'fork',
    env: { NODE_ENV: 'production', PORT: 3000, HOSTNAME: '0.0.0.0' },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    merge_logs: true,
    autorestart: true
  }]
};
EOF
mkdir -p logs && pm2 delete cryptorafts 2>/dev/null || true && pm2 start ecosystem.config.js && pm2 save && pm2 logs cryptorafts --lines 50
```

---

## **Troubleshooting**

### If npm install fails:
```bash
npm install --legacy-peer-deps --force --production=false
```

### If PM2 can't start:
```bash
pm2 delete cryptorafts
pm2 start ecosystem.config.js
pm2 logs cryptorafts
```

### Check if files are uploaded:
```bash
cd /var/www/cryptorafts
ls -la
# Should see: .next, src, package.json, server.js, etc.
```

---

## **Files Required on VPS:**

✅ `.next/` - Build output  
✅ `src/` - Source code  
✅ `public/` - Static files  
✅ `package.json` - Dependencies  
✅ `package-lock.json` - Lock file  
✅ `next.config.js` - Next.js config  
✅ `server.js` - Server file  
✅ `tsconfig.json` - TypeScript config  

---

## **After Deployment:**

Your app will be available at:
- `http://72.61.98.99:3000`
- `https://www.cryptorafts.com` (if Nginx is configured)

Check logs:
```bash
pm2 logs cryptorafts
```

Restart app:
```bash
pm2 restart cryptorafts
```

