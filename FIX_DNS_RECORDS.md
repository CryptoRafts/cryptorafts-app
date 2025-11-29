# Fix DNS Records for cryptorafts.com

## Problem
You have conflicting DNS A records:
- ❌ 145.79.211.130 (old/wrong IP - DELETE THIS)
- ✅ 72.61.98.99 (correct VPS IP - KEEP THIS)

## Solution: Fix DNS in Hostinger

### Step 1: Access DNS Management
1. Go to: https://hpanel.hostinger.com/
2. Login to your Hostinger account
3. Find your domain: **cryptorafts.com**
4. Click on **"DNS / Name Servers"** or **"Manage DNS"**

### Step 2: Delete Conflicting Records
1. Look for A records with IP: **145.79.211.130**
2. **DELETE** all A records pointing to **145.79.211.130**
3. Keep only records pointing to **72.61.98.99**

### Step 3: Set Correct A Records
You should have **ONLY** these A records:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | 72.61.98.99 | 3600 (or default) |
| A | www | 72.61.98.99 | 3600 (or default) |

**Important:**
- `@` means the root domain (cryptorafts.com)
- `www` means www.cryptorafts.com
- Both should point to **72.61.98.99**

### Step 4: Verify DNS Records
After making changes, wait 5-10 minutes, then verify:

**From PowerShell:**
```powershell
# Check A record for root domain
nslookup cryptorafts.com

# Check A record for www
nslookup www.cryptorafts.com
```

**From Command Line:**
```bash
# Check A record for root domain
dig cryptorafts.com +short

# Check A record for www
dig www.cryptorafts.com +short
```

Both should return: **72.61.98.99**

### Step 5: Wait for DNS Propagation
- DNS changes can take 5 minutes to 48 hours
- Usually takes 5-30 minutes
- You can check propagation status at: https://www.whatsmydns.net/#A/cryptorafts.com

## Quick Checklist
- [ ] Deleted A record pointing to 145.79.211.130
- [ ] A record for @ (root) points to 72.61.98.99
- [ ] A record for www points to 72.61.98.99
- [ ] No other conflicting A records exist
- [ ] Waited 5-10 minutes after changes
- [ ] Verified DNS with nslookup/dig

## After DNS is Fixed
Once DNS is correct, your site should work at:
- https://www.cryptorafts.com
- https://cryptorafts.com (will redirect to www)

## Need Help?
If you want me to help verify DNS after you make changes, I can create a script to check it.

