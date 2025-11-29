# 🚀 COMPLETE FIX INSTRUCTIONS

## ❌ Current Problem

- `package.json: No such file or directory`
- `Cannot find module 'next'`
- Files are NOT in `/var/www/cryptorafts`

## ✅ Solution

Upload files via Hostinger File Manager FIRST, then run deployment.

---

## 📋 STEP 1: Open Hostinger File Manager

1. Go to: **https://hpanel.hostinger.com/**
2. Click **"File Manager"**
3. Navigate to: `/var/www/cryptorafts`
   - Type `/var/www/cryptorafts` in the PATH BAR at the top
   - Press Enter

---

## 📋 STEP 2: Upload Files from Your Computer

**Local Location:** `C:\Users\dell\cryptorafts-starter`

**Upload to:** `/var/www/cryptorafts`

### Files to Upload:

1. **src/ folder** (ENTIRE folder)
   - Location: `C:\Users\dell\cryptorafts-starter\src`
   - Drag and drop entire folder
   - Wait for upload to complete (may take 5-10 minutes)

2. **package.json**
   - Location: `C:\Users\dell\cryptorafts-starter\package.json`
   - Upload this file

3. **next.config.js**
   - Location: `C:\Users\dell\cryptorafts-starter\next.config.js`
   - Upload this file

4. **tsconfig.json**
   - Location: `C:\Users\dell\cryptorafts-starter\tsconfig.json`
   - Upload this file

5. **public/ folder** (if exists)
   - Location: `C:\Users\dell\cryptorafts-starter\public`
   - Upload entire folder

---

## 📋 STEP 3: Verify Files Uploaded

### In Hostinger File Manager:
- ✅ `package.json` exists
- ✅ `src/` folder exists
- ✅ `next.config.js` exists
- ✅ `tsconfig.json` exists

### In SSH, run this verification:
```bash
cd /var/www/cryptorafts
ls -la package.json
ls -la src/app/page.tsx
ls -la next.config.js
```

**You MUST see all three files!** If not, go back to Step 2 and upload again.

---

## 📋 STEP 4: Complete Deployment Command

**ONLY after verifying files exist**, run this complete command in SSH:

```bash
cd /var/www/cryptorafts && \
ls -la package.json && \
ls -la src/app/page.tsx && \
export NVM_DIR="$HOME/.nvm" && \
. "$NVM_DIR/nvm.sh" && \
nvm use 20 && \
NODE_PATH=$(which node) && \
echo "✅ Using Node.js: $NODE_PATH ($(node --version))" && \
pm2 stop all && \
pm2 delete all && \
rm -rf node_modules package-lock.json && \
echo "📦 Installing dependencies (5-10 minutes)..." && \
npm install --legacy-peer-deps && \
ls -la node_modules/next/package.json && \
echo "✅ Dependencies installed!" && \
rm -rf .next out && \
echo "🔨 Building application..." && \
NODE_ENV=production npm run build && \
echo "✅ Build completed!" && \
cat > server.js << 'EOFSERVER'
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);
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
EOFSERVER
NODE_PATH=$(which node) && \
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'cryptorafts',
      script: './server.js',
      instances: 1,
      exec_mode: 'fork',
      interpreter: '$NODE_PATH',
      env: { NODE_ENV: 'production', PORT: 3000 },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
    },
  ],
};
EOF
mkdir -p logs && \
pm2 start ecosystem.config.js && \
pm2 save && \
pm2 status && \
sleep 15 && \
pm2 logs cryptorafts --lines 30 --nostream && \
echo "" && \
echo "✅ DEPLOYMENT COMPLETE!" && \
echo "🌐 Visit: https://www.cryptorafts.com"
```

---

## ⚠️ IMPORTANT REMINDERS

1. **Files MUST be uploaded FIRST** - deployment won't work without them
2. **Verify files exist** before running deployment
3. **Wait for uploads to complete** - may take 5-10 minutes
4. **The tar.gz is corrupted** - don't use it, upload files directly
5. **Upload from** `C:\Users\dell\cryptorafts-starter`

---

## ✅ Checklist

Before running deployment, verify:

- [ ] Files uploaded via Hostinger File Manager
- [ ] In File Manager: `package.json` visible
- [ ] In File Manager: `src/` folder visible
- [ ] In File Manager: `next.config.js` visible
- [ ] In SSH: `ls -la package.json` shows the file
- [ ] In SSH: `ls -la src/app/page.tsx` shows the file

**ONLY if ALL are checked, then run deployment!**

---

## 🎯 Summary

1. Upload files via Hostinger File Manager ✅
2. Verify files uploaded ✅
3. Run deployment command ✅
4. Done! 🎉

---

**View this file:** `Get-Content COMPLETE_FIX_INSTRUCTIONS.md`
