# 🔍 CHECK HOSTINGER DNS CONFIGURATION

## 📋 DNS Requirements for cryptorafts.com

### ✅ Required DNS Records

**1. A Record (IPv4):**
```
Type: A
Name: @ (or cryptorafts.com)
Value: 145.79.211.130 (your VPS IP)
TTL: 3600 (or Auto)
```

**2. A Record for www:**
```
Type: A
Name: www
Value: 145.79.211.130 (your VPS IP)
TTL: 3600 (or Auto)
```

**3. CNAME Record (Alternative):**
```
Type: CNAME
Name: www
Value: cryptorafts.com
TTL: 3600 (or Auto)
```

---

## 🔍 How to Check DNS in Hostinger

### Step 1: Login to Hostinger Panel

1. Go to: https://hpanel.hostinger.com/
2. Login with your Hostinger account
3. Find "Domains" section

### Step 2: Find Your Domain

1. Click on "Domains" or "Domain Manager"
2. Find `cryptorafts.com`
3. Click on it

### Step 3: Check DNS Records

1. Look for "DNS Zone" or "DNS Management"
2. Click "Manage DNS" or "DNS Zone Editor"
3. Check these records exist:

**Required Records:**
- ✅ **A Record** for `@` (or `cryptorafts.com`) → `145.79.211.130`
- ✅ **A Record** for `www` → `145.79.211.130`

---

## 🔍 How to Verify DNS is Working

### Method 1: Check from Windows (PowerShell)

```powershell
# Check A record
nslookup cryptorafts.com
nslookup www.cryptorafts.com

# Check with Google DNS
nslookup -type=A cryptorafts.com 8.8.8.8
nslookup -type=A www.cryptorafts.com 8.8.8.8
```

### Method 2: Check Online

1. Go to: https://dnschecker.org/
2. Enter: `cryptorafts.com`
3. Check if it resolves to: `145.79.211.130`

---

## 📋 Current DNS Configuration

**Your VPS IP:** `145.79.211.130`

**Required DNS Records:**
```
cryptorafts.com        A    145.79.211.130
www.cryptorafts.com    A    145.79.211.130
```

---

## 🔧 How to Update DNS in Hostinger

### Step 1: Access DNS Zone Editor

1. Login to Hostinger Panel: https://hpanel.hostinger.com/
2. Go to "Domains" → "cryptorafts.com"
3. Click "Manage DNS" or "DNS Zone Editor"

### Step 2: Add/Update A Records

**Add A Record for Root Domain:**
1. Click "Add Record"
2. Type: `A`
3. Name: `@` (or leave blank for root domain)
4. Points to: `145.79.211.130`
5. TTL: `3600` (or Auto)
6. Click "Save"

**Add A Record for www:**
1. Click "Add Record"
2. Type: `A`
3. Name: `www`
4. Points to: `145.79.211.130`
5. TTL: `3600` (or Auto)
6. Click "Save"

### Step 3: Verify

1. Wait 5-10 minutes for DNS propagation
2. Check with: `nslookup cryptorafts.com`
3. Should resolve to: `145.79.211.130`

---

## 🚨 Common DNS Issues

### Issue 1: Domain Not Resolving

**Problem:** `nslookup cryptorafts.com` returns nothing or wrong IP

**Solution:**
1. Check DNS records in Hostinger panel
2. Ensure A record points to `145.79.211.130`
3. Wait 10-30 minutes for DNS propagation
4. Clear DNS cache: `ipconfig /flushdns` (Windows)

### Issue 2: www Subdomain Not Working

**Problem:** `www.cryptorafts.com` not resolving

**Solution:**
1. Add A record for `www` → `145.79.211.130`
2. Or add CNAME: `www` → `cryptorafts.com`
3. Wait 10-30 minutes for propagation

### Issue 3: DNS Propagation Delays

**Problem:** Changes not showing immediately

**Solution:**
1. DNS changes take 5-30 minutes to propagate globally
2. Use `nslookup` with different DNS servers:
   - Google: `8.8.8.8`
   - Cloudflare: `1.1.1.1`
3. Check on: https://dnschecker.org/

---

## ✅ Verification Checklist

Before deployment, ensure:

- [ ] A record for `cryptorafts.com` → `145.79.211.130`
- [ ] A record for `www.cryptorafts.com` → `145.79.211.130`
- [ ] DNS propagation complete (check with nslookup)
- [ ] Domain resolves to correct IP
- [ ] Both `cryptorafts.com` and `www.cryptorafts.com` work

---

## 🚀 After DNS is Configured

Once DNS is correct:

1. ✅ SSH to VPS and run deployment
2. ✅ SSL certificate will be issued automatically
3. ✅ Website will be LIVE at https://www.cryptorafts.com

---

**Quick Check Commands:**

```powershell
# Check DNS resolution
nslookup cryptorafts.com
nslookup www.cryptorafts.com

# Flush DNS cache
ipconfig /flushdns

# Check with Google DNS
nslookup cryptorafts.com 8.8.8.8
```

---

**If DNS is correct, run deployment:**
```powershell
.\GET_SSH_AND_DEPLOY.ps1
```

