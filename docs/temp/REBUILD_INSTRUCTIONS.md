# 🔧 QUICK REBUILD INSTRUCTIONS

## The .next folder is locked. Do this:

### **STEP 1: Close Everything**
1. Close ALL VS Code/Cursor windows
2. Stop any running dev servers
3. Close all terminals

### **STEP 2: Delete Build Folders**
Open PowerShell and run:
```powershell
cd C:\Users\dell\cryptorafts-starter
Remove-Item -Recurse -Force .next
Remove-Item -Recurse -Force out
```

### **STEP 3: Rebuild**
```powershell
npm run build
```

### **STEP 4: Recreate .htaccess**
```powershell
New-Item -Path "out\.htaccess" -ItemType File
```

Then copy this into `out/.htaccess`:

```apache
# Force HTTPS
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Handle Next.js routing
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>

# Gzip Compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css text/javascript application/javascript application/json
</IfModule>

# Browser Caching
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
</IfModule>
```

### **STEP 5: Upload to Hostinger**
1. Delete all files in Hostinger public_html
2. Upload ALL files from `out` folder
3. Done!

---

## OR USE THE WORKING BUILD FROM BEFORE!

The files you already uploaded to Hostinger should work! Just:

1. Go to: https://cryptorafts.com
2. Clear browser cache: Ctrl + Shift + Delete
3. Hard refresh: Ctrl + Shift + R
4. Try incognito mode: Ctrl + Shift + N

**The site might actually be working!**

