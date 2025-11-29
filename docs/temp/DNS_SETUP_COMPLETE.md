# 🌐 **Complete DNS Setup Guide for www.cryptorafts.com**

## 📋 **DNS Records Required**

### **1. A Record (IPv4)**
Point your domain to the VPS IP address:

```
Type: A
Name: @ (or cryptorafts.com)
Value: 72.61.98.99
TTL: 3600 (or Auto)
```

### **2. A Record for www subdomain**
Point www subdomain to the VPS IP:

```
Type: A
Name: www
Value: 72.61.98.99
TTL: 3600 (or Auto)
```

### **3. CNAME Record (Alternative - if your DNS provider supports it)**
Instead of A record, you can use CNAME:

```
Type: CNAME
Name: www
Value: cryptorafts.com
TTL: 3600 (or Auto)
```

---

## 🔧 **Step-by-Step DNS Configuration**

### **For Hostinger DNS (hPanel):**

1. **Login to Hostinger hPanel:**
   - Go to: https://hpanel.hostinger.com
   - Login with your credentials

2. **Navigate to DNS Management:**
   - Click on "Domains" → Select "cryptorafts.com"
   - Click on "DNS / Name Servers"
   - Click on "Manage DNS Records"

3. **Delete ALL existing DNS records:**
   - Select all records
   - Click "Delete"
   - Confirm deletion

4. **Add A Record for root domain:**
   - Click "Add Record"
   - Type: **A**
   - Name: **@** (or leave blank for root domain)
   - Points to: **72.61.98.99**
   - TTL: **3600** (or Auto)
   - Click "Save"

5. **Add A Record for www subdomain:**
   - Click "Add Record"
   - Type: **A**
   - Name: **www**
   - Points to: **72.61.98.99**
   - TTL: **3600** (or Auto)
   - Click "Save"

6. **Verify DNS Records:**
   - You should see:
     ```
     A    @    72.61.98.99    3600
     A    www  72.61.98.99    3600
     ```

---

## ✅ **DNS Verification Commands**

After setting up DNS, verify with these commands:

### **Windows (Command Prompt):**
```cmd
nslookup www.cryptorafts.com
nslookup cryptorafts.com
```

### **Linux/Mac:**
```bash
dig www.cryptorafts.com +short
dig cryptorafts.com +short
```

### **Online DNS Checkers:**
- https://www.whatsmydns.net/#A/www.cryptorafts.com
- https://dnschecker.org/#A/www.cryptorafts.com
- https://mxtoolbox.com/DNSLookup.aspx

---

## ⏱️ **DNS Propagation Time**

- **Typical:** 5 minutes to 24 hours
- **Average:** 1-4 hours
- **Maximum:** 48 hours

**To speed up propagation:**
1. Use Google Public DNS: `8.8.8.8` / `8.8.4.4`
2. Flush DNS cache: `ipconfig /flushdns` (Windows)
3. Restart your router/modem

---

## 🔍 **Verify DNS is Working**

After DNS propagates, verify:

1. **Check DNS resolution:**
   ```cmd
   nslookup www.cryptorafts.com
   ```
   Should return: `72.61.98.99`

2. **Check website loads:**
   - Visit: https://www.cryptorafts.com
   - Should load the website (not show DNS error)

3. **Check SSL certificate:**
   - Visit: https://www.cryptorafts.com
   - Should show green padlock (SSL working)

---

## 🚨 **Common DNS Issues & Fixes**

### **Issue 1: DNS not resolving**
- **Fix:** Wait for propagation (up to 48 hours)
- **Fix:** Check DNS records are correct
- **Fix:** Clear DNS cache: `ipconfig /flushdns`

### **Issue 2: www works but root domain doesn't**
- **Fix:** Add A record for `@` (root domain)
- **Fix:** Ensure both `@` and `www` point to `72.61.98.99`

### **Issue 3: DNS resolves but website doesn't load**
- **Fix:** Check Nginx is running: `systemctl status nginx`
- **Fix:** Check PM2 is running: `pm2 status`
- **Fix:** Check firewall allows port 80/443

---

## 📝 **Complete DNS Records Summary**

```
Type    Name    Value           TTL
A       @       72.61.98.99     3600
A       www     72.61.98.99     3600
```

**That's it!** Only these 2 records are needed.

---

## 🔐 **SSL Certificate (Already Configured)**

Your SSL certificate should already be configured via Let's Encrypt. If not, run:

```bash
certbot --nginx -d cryptorafts.com -d www.cryptorafts.com
```

---

## ✅ **Final Checklist**

- [ ] DNS records added in Hostinger hPanel
- [ ] A record for `@` (root domain) → `72.61.98.99`
- [ ] A record for `www` → `72.61.98.99`
- [ ] DNS propagation verified (check with nslookup/dig)
- [ ] Website loads at https://www.cryptorafts.com
- [ ] SSL certificate working (green padlock)

---

## 🎯 **After DNS is Set Up**

Once DNS is configured and propagated:

1. **Clear browser cache** on all devices
2. **Hard refresh:** `Ctrl + Shift + R`
3. **Test on multiple devices**
4. **Verify website loads correctly**

The website should now work perfectly! 🚀

