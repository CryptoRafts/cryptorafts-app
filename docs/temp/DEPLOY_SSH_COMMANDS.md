# 🚀 VPS Deployment Commands

## Quick Deployment Steps

### Step 1: SSH into your VPS
```bash
ssh your-username@your-vps-ip
```

### Step 2: Navigate to your app directory
```bash
cd /var/www/cryptorafts
# OR your custom path
```

### Step 3: Stop existing app (if running)
```bash
pm2 stop cryptorafts
pm2 delete cryptorafts
```

### Step 4: Clean old files
```bash
rm -rf .next
rm -rf src
rm -rf app
rm -f server.js
rm -f ecosystem.config.js
rm -f next.config.js
```

### Step 5: Upload files from local machine
**Option A: Using SCP (from your local machine)**
```bash
scp -r deploy-package/* your-username@your-vps-ip:/var/www/cryptorafts/
```

**Option B: Using SFTP (FileZilla/WinSCP)**
- Connect to your VPS via SFTP
- Upload entire `deploy-package` folder contents to `/var/www/cryptorafts/`

### Step 6: Install dependencies (on VPS)
```bash
npm install --production
```

### Step 7: Setup environment variables
```bash
nano .env.local
```
Add your environment variables:
```
NEXT_PUBLIC_FIREBASE_API_KEY=your-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project
OPENAI_API_KEY=your-key
# ... other variables
```

### Step 8: Start with PM2
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Step 9: Check status
```bash
pm2 status
pm2 logs cryptorafts
```

### Step 10: Configure Nginx (Optional - for port 80/443)
```bash
sudo nano /etc/nginx/sites-available/cryptorafts
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/cryptorafts /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## One-Liner Deployment (After uploading files)
```bash
cd /var/www/cryptorafts && pm2 stop cryptorafts 2>/dev/null || true && pm2 delete cryptorafts 2>/dev/null || true && npm install --production && pm2 start ecosystem.config.js && pm2 save && pm2 logs cryptorafts --lines 50
```

## Troubleshooting

### If PM2 is not installed:
```bash
npm install -g pm2
```

### If port 3000 is in use:
```bash
# Find process using port 3000
sudo lsof -i :3000
# Kill it
sudo kill -9 <PID>
```

### Check logs:
```bash
pm2 logs cryptorafts --lines 100
```

### Restart app:
```bash
pm2 restart cryptorafts
```

### View app status:
```bash
pm2 status
pm2 monit
```

## Your app will be available at:
- Direct: `http://your-vps-ip:3000`
- With Nginx: `http://your-domain.com`

