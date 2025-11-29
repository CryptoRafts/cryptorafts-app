# 🌐 Nginx Configuration for www.cryptorafts.com

## ⚠️ CRITICAL: Domain 404 Error Fix

The domain www.cryptorafts.com is showing 404 because nginx needs to be configured to proxy requests to the Next.js app on port 3000.

## 🔧 Setup Nginx Configuration

### Step 1: Create Nginx Config File

SSH into your VPS and run:

```bash
sudo nano /etc/nginx/sites-available/cryptorafts
```

### Step 2: Paste This Configuration

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name cryptorafts.com www.cryptorafts.com;
    
    # Redirect all HTTP to HTTPS
    return 301 https://www.cryptorafts.com$request_uri;
}

# HTTPS Server Block
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name www.cryptorafts.com cryptorafts.com;
    
    # SSL Certificate (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/cryptorafts.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/cryptorafts.com/privkey.pem;
    
    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Proxy to Next.js App
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Cache static files
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 30d;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

### Step 3: Enable Site and Reload Nginx

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/cryptorafts /etc/nginx/sites-enabled/

# Test nginx configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

### Step 4: Install SSL Certificate (if not already installed)

```bash
# Install Certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d cryptorafts.com -d www.cryptorafts.com

# Auto-renewal (already set up by certbot)
```

## ✅ Verify Configuration

After setup, test:

1. **HTTP redirects to HTTPS:**
   ```bash
   curl -I http://www.cryptorafts.com
   # Should show: 301 Moved Permanently
   ```

2. **HTTPS works:**
   ```bash
   curl -I https://www.cryptorafts.com
   # Should show: 200 OK
   ```

3. **Check nginx status:**
   ```bash
   sudo systemctl status nginx
   ```

## 🔍 Troubleshooting

### If domain still shows 404:

1. **Check nginx is running:**
   ```bash
   sudo systemctl status nginx
   ```

2. **Check Next.js app is running on port 3000:**
   ```bash
   curl http://localhost:3000
   pm2 list
   ```

3. **Check DNS is pointing to your server:**
   ```bash
   dig www.cryptorafts.com
   # Should show your VPS IP: 72.61.98.99
   ```

4. **Check nginx error logs:**
   ```bash
   sudo tail -f /var/log/nginx/error.log
   ```

5. **Check nginx access logs:**
   ```bash
   sudo tail -f /var/log/nginx/access.log
   ```

## 🎯 After Configuration

Your site should be accessible at:
- ✅ https://www.cryptorafts.com
- ✅ https://cryptorafts.com (redirects to www)

The app will work perfectly with all roles and features!

