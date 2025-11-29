# 🔧 Quick Fix for Nginx SSL Error

## ❌ Error:
```
no "ssl_certificate" is defined for the "listen ... ssl" directive
```

## ✅ Solution:

The issue is that nginx requires SSL certificates when using `listen 443 ssl`, but we need to get the certificates first. Run this fix:

### **Option 1: Run the Fix Script (Recommended)**

```bash
# On your VPS
chmod +x FIX_NGINX_SSL.sh
sudo ./FIX_NGINX_SSL.sh
```

### **Option 2: Manual Fix (Copy-Paste)**

Run these commands on your VPS:

```bash
# Fix nginx configuration (remove ssl from listen directive)
sudo tee /etc/nginx/sites-available/cryptorafts > /dev/null <<'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name cryptorafts.com www.cryptorafts.com;
    return 301 https://www.cryptorafts.com$request_uri;
}
server {
    listen 443 http2;
    listen [::]:443 http2;
    server_name www.cryptorafts.com cryptorafts.com;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
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

# Get SSL certificate (certbot will add SSL directives automatically)
sudo certbot --nginx -d cryptorafts.com -d www.cryptorafts.com --non-interactive --agree-tos --redirect --email admin@cryptorafts.com

# Reload nginx
sudo systemctl reload nginx
```

### **What Changed:**

- Changed `listen 443 ssl http2;` to `listen 443 http2;` (removed `ssl`)
- Certbot will automatically add the SSL directives when it installs the certificate
- This is the correct way to set up SSL with Let's Encrypt

### **After Running:**

Your site will be accessible at:
- ✅ https://www.cryptorafts.com
- ✅ https://cryptorafts.com (redirects to www)

Test it:
```bash
curl -I https://www.cryptorafts.com
```

