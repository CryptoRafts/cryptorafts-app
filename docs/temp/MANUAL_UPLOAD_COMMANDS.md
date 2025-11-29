# Manual Upload Commands
## Copy and paste these commands one by one

### STEP 1: Upload Files from PowerShell

```powershell
# Set variables
$vpsUser = "root"
$vpsIp = "72.61.98.99"
$vpsPath = "/var/www/cryptorafts"

# Upload fixed SpotlightDisplay component
scp src/components/SpotlightDisplay.tsx ${vpsUser}@${vpsIp}:${vpsPath}/src/components/SpotlightDisplay.tsx

# Upload critical files
scp src/app/page.tsx ${vpsUser}@${vpsIp}:${vpsPath}/src/app/page.tsx
scp src/app/layout.tsx ${vpsUser}@${vpsIp}:${vpsPath}/src/app/layout.tsx
scp src/app/globals.css ${vpsUser}@${vpsIp}:${vpsPath}/src/app/globals.css
scp src/middleware.ts ${vpsUser}@${vpsIp}:${vpsPath}/src/middleware.ts
scp next.config.js ${vpsUser}@${vpsIp}:${vpsPath}/next.config.js

# Upload public assets
scp public/favicon.ico ${vpsUser}@${vpsIp}:${vpsPath}/public/favicon.ico
```

### STEP 2: Connect to VPS and Run Commands

```bash
# Connect to VPS
ssh root@72.61.98.99

# Once connected, run these commands:

# Go to app directory
cd /var/www/cryptorafts

# Clean old build
rm -rf .next
rm -rf node_modules/.cache

# Build the application
npm run build

# Restart PM2
pm2 restart cryptorafts

# Check PM2 status
pm2 status

# Check if app is running
pm2 logs cryptorafts --lines 20

# Exit VPS
exit
```

### STEP 3: Test from PowerShell

```powershell
# Test if app is responding
ssh root@72.61.98.99 "curl -s http://localhost:3000 | head -c 200"

# Check PM2 status
ssh root@72.61.98.99 "pm2 status"
```

