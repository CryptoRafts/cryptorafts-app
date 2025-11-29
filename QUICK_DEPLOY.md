# Quick Deployment Guide
## If scripts get stuck, use these manual commands

### Option 1: PowerShell Commands (Run one at a time)

```powershell
# 1. Clean local build
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue

# 2. Upload config files (run each separately)
scp package.json root@72.61.98.99:/var/www/cryptorafts/
scp package-lock.json root@72.61.98.99:/var/www/cryptorafts/
scp next.config.js root@72.61.98.99:/var/www/cryptorafts/
scp tsconfig.json root@72.61.98.99:/var/www/cryptorafts/
scp .env.local root@72.61.98.99:/var/www/cryptorafts/

# 3. Upload directories (these take longer - be patient)
scp -r src root@72.61.98.99:/var/www/cryptorafts/
scp -r public root@72.61.98.99:/var/www/cryptorafts/
```

### Option 2: VPS Commands (After uploading files)

```bash
# Connect to VPS
ssh root@72.61.98.99

# Once connected, run these:
cd /var/www/cryptorafts
npm install --legacy-peer-deps
npm run build
pm2 start npm --name cryptorafts -- start
pm2 save
pm2 status
```

### Option 3: All-in-One VPS Script

Create a file `build.sh` on VPS:

```bash
#!/bin/bash
cd /var/www/cryptorafts
npm install --legacy-peer-deps
npm run build
pm2 restart cryptorafts || pm2 start npm --name cryptorafts -- start
pm2 save
```

Then run:
```bash
chmod +x build.sh
./build.sh
```

### Troubleshooting

If uploads hang:
1. Check your internet connection
2. Try uploading files one at a time
3. Use smaller batches (upload config files first, then src, then public)
4. Check VPS is accessible: `ping 72.61.98.99`

If build fails:
1. Check PM2 logs: `pm2 logs cryptorafts`
2. Check if app is running: `pm2 status`
3. Check port 3000: `curl http://localhost:3000`
4. Check nginx: `sudo nginx -t && sudo systemctl reload nginx`

