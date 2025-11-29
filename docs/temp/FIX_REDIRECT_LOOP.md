# 🔧 Fix Redirect Loop - ERR_TOO_MANY_REDIRECTS

## ❌ Problem:
```
ERR_TOO_MANY_REDIRECTS (-310)
```

The site is stuck in a redirect loop.

## ✅ Solution:

The redirect loop is likely caused by:
1. Multiple redirects in nginx configuration
2. Next.js middleware redirecting
3. Conflicting redirect rules

## 🚀 Quick Fix:

### **Option 1: Run the Fix Script**

```bash
# On your VPS
chmod +x FIX_REDIRECT_LOOP.sh
sudo ./FIX_REDIRECT_LOOP.sh
```

### **Option 2: Manual Fix (Copy-Paste)**

Run these commands on your VPS:

```bash
# Fix nginx configuration
sudo tee /etc/nginx/sites-available/cryptorafts > /dev/null <<'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name cryptorafts.com www.cryptorafts.com;
    return 301 https://www.cryptorafts.com$request_uri;
}
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name www.cryptorafts.com cryptorafts.com;
    ssl_certificate /etc/letsencrypt/live/cryptorafts.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/cryptorafts.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Redirect non-www to www (only if accessing via cryptorafts.com)
    if ($host = cryptorafts.com) {
        return 301 https://www.cryptorafts.com$request_uri;
    }
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Test and reload
sudo nginx -t && sudo systemctl reload nginx
```

### **Option 3: Check Next.js Middleware**

The redirect loop might also be caused by Next.js middleware. Check `src/middleware.ts`:

```bash
# On your VPS
cat /var/www/cryptorafts/src/middleware.ts
```

If middleware has redirects, we may need to adjust it.

## 🔍 Troubleshooting:

### **Check Nginx Configuration:**
```bash
sudo nginx -t
cat /etc/nginx/sites-available/cryptorafts
```

### **Check Nginx Logs:**
```bash
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### **Test Direct Access:**
```bash
# Test if app is running on port 3000
curl http://localhost:3000

# Test nginx proxy
curl -I https://www.cryptorafts.com
```

### **Check PM2 Status:**
```bash
pm2 status
pm2 logs cryptorafts --lines 50
```

## ✅ After Fix:

Your site should be accessible at:
- ✅ https://www.cryptorafts.com
- ✅ https://cryptorafts.com (redirects to www)

Test it:
```bash
curl -I https://www.cryptorafts.com
```

Expected response:
```
HTTP/2 200
```

