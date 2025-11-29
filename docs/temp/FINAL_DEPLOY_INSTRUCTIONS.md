# 🚀 FINAL COMPLETE DEPLOYMENT INSTRUCTIONS

## ⚠️ CRITICAL: Upload Real Application Files First!

The server currently has ONLY placeholder files (2 files in src/).  
Your local project has **740+ files** with the full application.

---

## 📤 STEP 1: Upload Files via File Manager

### Option A: Upload Entire Folder Structure

1. Go to: https://hpanel.hostinger.com/
2. Click **"File Manager"**
3. Navigate to: `/var/www/cryptorafts`
4. **DELETE** existing placeholder `src/` folder
5. Upload from `C:\Users\dell\cryptorafts-starter`:
   - ✅ **`src/`** folder (ENTIRE folder - 740+ files)
   - ✅ **`package.json`** (your full version)
   - ✅ **`next.config.js`** (your actual config)
   - ✅ **`tsconfig.json`**
   - ✅ **`public/`** folder (if exists)

### Option B: Upload ZIP Package (if created)

If you ran the PowerShell script and it created a package:

1. Find package at: `$env:TEMP\cryptorafts-deploy.zip`
2. Upload via File Manager to `/var/www/cryptorafts`
3. Extract in SSH (see Step 2)

---

## 🚀 STEP 2: Run Deployment

### In SSH Terminal:

1. **If you uploaded ZIP:**
   ```bash
   cd /var/www/cryptorafts
   unzip -o cryptorafts-deploy.zip
   rm -f cryptorafts-deploy.zip
   ```

2. **Run complete deployment:**
   
   **Option 1:** Use the command from `DEPLOY_FRESH_BUILD.txt`
   
   **Option 2:** Use the script `DEPLOY_FRESH_COMPLETE.sh`:
   ```bash
   cd /var/www/cryptorafts
   bash DEPLOY_FRESH_COMPLETE.sh
   ```

   **Option 3:** Copy and paste this complete command:

```bash
cd /var/www/cryptorafts && pm2 stop all && pm2 delete all && rm -rf node_modules package-lock.json .next out /var/www/package-lock.json && chown -R root:root /var/www/cryptorafts && chmod -R 755 /var/www/cryptorafts && find /var/www/cryptorafts -type f -exec chmod 644 {} \; && echo "✅ Cleaned and fixed ownership" && export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh" && nvm use 20 && NODE_PATH=$(which node) && echo "✅ Node.js: $NODE_PATH ($(node --version))" && find src -type f | wc -l && echo "files in src/" && if [ $(find src -type f | wc -l) -lt 100 ]; then echo "❌ ERROR: Only $(find src -type f | wc -l) files found - need to upload src/ folder!"; exit 1; fi && echo "📦 Installing dependencies (10-15 minutes)..." && npm install --legacy-peer-deps && echo "✅ Dependencies installed" && echo "🔨 Building..." && NODE_ENV=production npm run build && echo "✅ Build completed" && cat > server.js << 'EOFSERVER'
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
NODE_PATH=$(which node) && cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{ name: 'cryptorafts', script: './server.js', instances: 1, exec_mode: 'fork', interpreter: '${NODE_PATH}', env: { NODE_ENV: 'production', PORT: 3000 }, error_file: './logs/pm2-error.log', out_file: './logs/pm2-out.log', log_date_format: 'YYYY-MM-DD HH:mm:ss Z', merge_logs: true, autorestart: true, watch: false, max_memory_restart: '1G', min_uptime: '10s', max_restarts: 10, restart_delay: 4000 }],
};
EOF
mkdir -p logs && pm2 start ecosystem.config.js && pm2 save && pm2 status && sleep 10 && pm2 logs cryptorafts --lines 20 --nostream && echo "" && echo "✅ DEPLOYMENT COMPLETE! Visit: https://www.cryptorafts.com"
```

---

## ✅ STEP 3: Verify

After deployment completes:

1. **Check PM2 status:**
   ```bash
   pm2 status
   ```
   Should show: `online`

2. **Check PM2 logs:**
   ```bash
   pm2 logs cryptorafts --lines 10 --nostream
   ```
   Should show: `> Ready on http://localhost:3000`

3. **Test server:**
   ```bash
   curl -I http://localhost:3000
   ```
   Should show: `HTTP/1.1 200 OK`

4. **Visit in browser:**
   - `https://cryptorafts.com`
   - `https://www.cryptorafts.com`

---

## ❌ If Errors Occur

### Error: "Only 2 files found"
- **Problem:** Real `src/` folder not uploaded
- **Fix:** Upload `src/` folder via File Manager

### Error: "npm install failed"
- **Problem:** Dependency conflicts
- **Fix:** Already using `--legacy-peer-deps`, check logs for specific errors

### Error: "Build failed"
- **Problem:** Missing dependencies or code errors
- **Fix:** Check build logs, ensure all dependencies installed

### Error: "PM2 can't start"
- **Problem:** Build failed or missing `.next` directory
- **Fix:** Run build again, verify `.next` directory exists

---

## 📋 Files Created

1. **`DEPLOY_FRESH_COMPLETE.sh`** - Complete deployment script
2. **`DEPLOY_FRESH_BUILD.txt`** - One-line deployment command
3. **`FINAL_DEPLOY_INSTRUCTIONS.md`** - This file

---

## 🎯 Summary

1. **Upload real `src/` folder** via File Manager (740+ files)
2. **Upload real `package.json`** (with all dependencies)
3. **Upload `public/` folder** (fixes favicon)
4. **Run deployment command** from `DEPLOY_FRESH_BUILD.txt`
5. **Verify** app is working at `https://cryptorafts.com`

**The current app is just a placeholder - you MUST upload the real files!**

