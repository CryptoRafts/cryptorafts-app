# 🔍 COMPLETE HOSTINGER CONFIGURATION CHECK

## 📋 COMPREHENSIVE CONFIGURATION VERIFICATION

### ✅ Your VPS Details:
- **VPS IP:** `145.79.211.130`
- **SSH Port:** `65002`
- **SSH Username:** `u386122906`
- **Domain:** `cryptorafts.com`

---

## 🌐 PART 1: DNS CONFIGURATION

### Required DNS Records:

#### ✅ A Record for Root Domain:
```
Type: A
Name: @ (or blank for root domain)
Points to: 145.79.211.130
TTL: 3600 (or Auto)
```

#### ✅ A Record for www:
```
Type: A
Name: www
Points to: 145.79.211.130
TTL: 3600 (or Auto)
```

### Current DNS Status:
- ❌ `cryptorafts.com` → `72.61.98.99` (WRONG!)
- ❌ `www.cryptorafts.com` → `72.61.98.99` (WRONG!)

**Should be:** Both → `145.79.211.130`

---

## 🔧 PART 2: NAMESERVER CONFIGURATION

### How to Check Nameservers in Hostinger:

1. Login to: https://hpanel.hostinger.com/
2. Go to: **Domains** → **cryptorafts.com**
3. Click: **"DNS / Name Servers"** tab
4. Look for **"Nameservers"** section

### Required Nameserver Configuration:

**Option 1: Use Hostinger Nameservers (Recommended)**
```
Nameserver 1: ns1.dns-parking.com
Nameserver 2: ns2.dns-parking.com
```
OR
```
Nameserver 1: ns1.hostinger.com
Nameserver 2: ns2.hostinger.com
```
OR (Check your Hostinger panel for exact nameservers)

**Option 2: Use Custom Nameservers**
If using external DNS (like Cloudflare), ensure:
- Nameservers point to your DNS provider
- DNS records are configured correctly

---

## ✅ PART 3: COMPLETE HOSTINGER SETUP GUIDE

### Step 1: Login to Hostinger Panel

1. Go to: **https://hpanel.hostinger.com/**
2. Login with your Hostinger account
3. Navigate to **"Domains"** section

---

### Step 2: Check Nameserver Configuration

#### A. Find Nameserver Settings

1. Click on **"Domains"** in left sidebar
2. Find **`cryptorafts.com`**
3. Click on it
4. Click **"DNS / Name Servers"** tab
5. Look for **"Nameservers"** or **"Name Servers"** section

#### B. Verify Nameservers

**If using Hostinger DNS:**
- Nameservers should be Hostinger's (e.g., `ns1.dns-parking.com`, `ns2.dns-parking.com`)
- OR Hostinger's specific nameservers (shown in panel)

**If using Custom Nameservers:**
- Verify nameservers are correct
- Check if DNS records are managed externally

#### C. Change Nameservers (If Needed)

1. Click **"Change"** or **"Edit"** button
2. Select **"Use Hostinger Nameservers"** (if available)
3. OR enter custom nameservers
4. Click **"Save"** or **"Update"**
5. Wait 24-48 hours for propagation

---

### Step 3: Configure DNS Records

#### A. Access DNS Management

1. Stay in **"DNS / Name Servers"** tab
2. Click **"Manage DNS"** or **"DNS Zone Editor"**
3. OR go to **"Advanced DNS"** tab

#### B. Check Existing Records

Look for existing A records:
- A record for `@` (root)
- A record for `www`

#### C. Update Root Domain A Record

1. Find A record with:
   - Type: **A**
   - Name: **@** (or blank)
   - Current Points to: `72.61.98.99` (WRONG)

2. Click **"Edit"** (pencil icon)

3. Update:
   - Type: **A** (keep same)
   - Name: **@** (keep same)
   - Points to: **145.79.211.130** (CHANGE THIS!)
   - TTL: **3600** (or Auto)

4. Click **"Save"** or **"Update"**

#### D. Update/Create www A Record

**If A record for www exists:**
1. Find A record with:
   - Type: **A**
   - Name: **www**
   - Current Points to: `72.61.98.99` (WRONG)

2. Click **"Edit"**

3. Update:
   - Points to: **145.79.211.130** (CHANGE THIS!)
   - TTL: **3600** (or Auto)

4. Click **"Save"**

**If A record for www doesn't exist:**
1. Click **"Add Record"** button
2. Fill in:
   - Type: **A**
   - Name: **www**
   - Points to: **145.79.211.130**
   - TTL: **3600** (or Auto)
3. Click **"Save"** or **"Add Record"**

#### E. Remove Old CNAME Records (If Any)

**If CNAME record for www exists:**
1. Find CNAME record with:
   - Type: **CNAME**
   - Name: **www**

2. Click **"Delete"** or **"Remove"**

3. Confirm deletion

**Note:** Use A records, not CNAME when pointing to VPS IP.

---

### Step 4: Verify DNS Configuration

After updating DNS, verify:

```powershell
# Check root domain
nslookup cryptorafts.com 8.8.8.8

# Check www subdomain
nslookup www.cryptorafts.com 8.8.8.8

# Both should show: 145.79.211.130
```

**Wait 10-30 minutes** for DNS propagation before checking.

---

## ✅ PART 4: VPS CONFIGURATION CHECK

### SSH Access Configuration:

✅ **IP:** `145.79.211.130`
✅ **Port:** `65002`
✅ **Username:** `u386122906`
✅ **SSH Status:** ACTIVE (from Hostinger panel)

### VPS Requirements:

1. ✅ **SSH Access:** Active (confirmed)
2. ✅ **Root Access:** Available (via sudo)
3. ⏳ **Node.js:** Will be installed during deployment
4. ⏳ **PM2:** Will be installed during deployment
5. ⏳ **Nginx:** Will be installed during deployment
6. ⏳ **SSL Certificate:** Will be issued automatically via Certbot

---

## 📋 PART 5: COMPLETE CHECKLIST

### Before Deployment, Ensure:

#### DNS Configuration:
- [ ] Nameservers are set correctly (Hostinger or Custom)
- [ ] A record for `@` (root) → `145.79.211.130`
- [ ] A record for `www` → `145.79.211.130`
- [ ] No conflicting CNAME records for `www`
- [ ] DNS propagated (check with nslookup)

#### VPS Configuration:
- [ ] SSH access is active
- [ ] SSH credentials are available (IP, Port, Username, Password)
- [ ] VPS has sufficient resources (CPU, RAM, Storage)
- [ ] Port 80 and 443 are open (for HTTP/HTTPS)

#### Domain Configuration:
- [ ] Domain is registered and active
- [ ] Domain is pointing to correct nameservers
- [ ] Domain is not expired

---

## 🔧 PART 6: FIX ALL ISSUES - STEP BY STEP

### Issue 1: Wrong DNS A Records

**Current:** Both domains point to `72.61.98.99`  
**Should be:** Both point to `145.79.211.130`

**Fix:**
1. Login to Hostinger: https://hpanel.hostinger.com/
2. Go to: Domains → cryptorafts.com
3. Click: "Manage DNS" or "DNS Zone Editor"
4. Edit A record for `@` → Change to `145.79.211.130`
5. Edit/Add A record for `www` → Change to `145.79.211.130`
6. Save changes
7. Wait 10-30 minutes

---

### Issue 2: Nameserver Configuration

**Check:**
1. Login to Hostinger: https://hpanel.hostinger.com/
2. Go to: Domains → cryptorafts.com
3. Click: "DNS / Name Servers" tab
4. Verify nameservers are correct

**If using Hostinger DNS:**
- Should be Hostinger nameservers (shown in panel)

**If using Custom DNS (like Cloudflare):**
- Should be your DNS provider's nameservers
- Ensure DNS records are configured in your DNS provider

---

### Issue 3: DNS Propagation

**After making changes:**
1. Wait 10-30 minutes for DNS propagation
2. Clear DNS cache: `ipconfig /flushdns` (Windows)
3. Verify with multiple DNS servers:
   ```powershell
   # Google DNS
   nslookup cryptorafts.com 8.8.8.8
   nslookup www.cryptorafts.com 8.8.8.8
   
   # Cloudflare DNS
   nslookup cryptorafts.com 1.1.1.1
   nslookup www.cryptorafts.com 1.1.1.1
   ```

---

## ✅ PART 7: VERIFICATION COMMANDS

### Check DNS Resolution:

```powershell
# Check root domain
nslookup cryptorafts.com 8.8.8.8

# Check www subdomain
nslookup www.cryptorafts.com 8.8.8.8

# Check nameservers
nslookup -type=NS cryptorafts.com 8.8.8.8

# Check all records
nslookup -type=ANY cryptorafts.com 8.8.8.8
```

### Expected Results:

```
# Root domain
cryptorafts.com → 145.79.211.130 ✅

# www subdomain
www.cryptorafts.com → 145.79.211.130 ✅

# Nameservers
Should show Hostinger nameservers or your custom nameservers
```

---

## 🚀 PART 8: AFTER FIXING - DEPLOYMENT

Once all configuration is correct:

1. ✅ **Verify DNS:**
   ```powershell
   nslookup cryptorafts.com 8.8.8.8
   # Should show: 145.79.211.130
   ```

2. ✅ **Run Deployment:**
   ```powershell
   .\GET_SSH_AND_DEPLOY.ps1
   ```

3. ✅ **SSL Certificate:**
   - Will be issued automatically via Certbot
   - Takes 5-10 minutes

4. ✅ **Website LIVE:**
   - Visit: https://www.cryptorafts.com
   - Should be accessible!

---

## 📋 QUICK REFERENCE

### Required DNS Records:
```
cryptorafts.com        A    145.79.211.130
www.cryptorafts.com    A    145.79.211.130
```

### VPS Details:
```
IP: 145.79.211.130
SSH Port: 65002
Username: u386122906
```

### Hostinger Panel:
- Login: https://hpanel.hostinger.com/
- Domains: Domains → cryptorafts.com
- DNS: DNS / Name Servers → Manage DNS
- VPS: VPS → 1097850
- SSH: Websites → cryptorafts.com → SSH Access

---

## 🚨 TROUBLESHOOTING

### DNS Not Updating?

1. Wait 30-60 minutes for global propagation
2. Clear DNS cache: `ipconfig /flushdns`
3. Check with different DNS servers
4. Verify changes in Hostinger panel

### Can't Edit DNS?

1. Ensure you're using Hostinger nameservers
2. Or verify custom nameservers are correct
3. Check domain status (not expired/suspended)

### Nameservers Wrong?

1. Login to Hostinger panel
2. Go to Domains → cryptorafts.com
3. Click "DNS / Name Servers"
4. Update nameservers
5. Wait 24-48 hours for propagation

---

**Once everything is configured correctly, run:**
```powershell
.\GET_SSH_AND_DEPLOY.ps1
```

**Your website will be LIVE! 🎉**

