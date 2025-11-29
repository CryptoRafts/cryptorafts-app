# 🔧 FIX DNS IN HOSTINGER - POINT TO VPS

## ⚠️ CURRENT DNS ISSUE

**Current DNS:**
- `cryptorafts.com` → `72.61.98.99` ❌ (WRONG IP!)
- `www.cryptorafts.com` → Not resolving ❌

**Should be:**
- `cryptorafts.com` → `145.79.211.130` ✅ (Your VPS IP)
- `www.cryptorafts.com` → `145.79.211.130` ✅ (Your VPS IP)

---

## 🔧 HOW TO FIX DNS IN HOSTINGER

### Step 1: Login to Hostinger Panel

1. Go to: **https://hpanel.hostinger.com/**
2. Login with your Hostinger account
3. Click **"Domains"** in left sidebar
4. Find **`cryptorafts.com`**
5. Click on it

---

### Step 2: Access DNS Management

1. Click **"DNS / Name Servers"** tab
2. OR click **"Manage DNS"** button
3. OR click **"DNS Zone Editor"**

---

### Step 3: Update A Record for Root Domain

**Find existing A record for root domain:**
- Look for record with:
  - Type: **A**
  - Name: **@** (or blank)
  - Value: **72.61.98.99** (current wrong IP)

**Update it:**
1. Click **"Edit"** (pencil icon) on that A record
2. Change **"Points to"** or **"Value"** from `72.61.98.99` to `145.79.211.130`
3. Click **"Save"** or **"Update"**

---

### Step 4: Add/Update A Record for www

**If A record for www exists:**
1. Find record with:
   - Type: **A**
   - Name: **www**
2. Click **"Edit"**
3. Change **"Points to"** to: `145.79.211.130`
4. Click **"Save"**

**If A record for www doesn't exist:**
1. Click **"Add Record"** button
2. Fill in:
   - **Type:** `A`
   - **Name:** `www`
   - **Points to:** `145.79.211.130`
   - **TTL:** `3600` (or Auto)
3. Click **"Save"** or **"Add Record"**

---

### Step 5: Remove Old CNAME Records (If Any)

**If there's a CNAME record for www pointing to Vercel or other services:**
1. Find CNAME record with:
   - Type: **CNAME**
   - Name: **www**
2. Click **"Delete"** or **"Remove"**
3. Confirm deletion

**Important:** We need A record, not CNAME for www when using VPS.

---

## ✅ DNS Records After Fix

**Required DNS Records:**

```
Type: A
Name: @ (or blank for root)
Points to: 145.79.211.130
TTL: 3600

Type: A
Name: www
Points to: 145.79.211.130
TTL: 3600
```

---

## 🔍 Verify DNS After Update

**Wait 5-10 minutes** for DNS propagation, then verify:

```powershell
# Check root domain
nslookup cryptorafts.com 8.8.8.8

# Check www subdomain
nslookup www.cryptorafts.com 8.8.8.8
```

**Both should resolve to:** `145.79.211.130`

---

## 📋 Quick Checklist

Before deployment, ensure:

- [ ] A record for `@` (root) → `145.79.211.130`
- [ ] A record for `www` → `145.79.211.130`
- [ ] No CNAME records for `www` (only A records)
- [ ] DNS propagated (check with nslookup)
- [ ] Both domains resolve to `145.79.211.130`

---

## 🚀 After DNS is Fixed

Once DNS is correct:

1. ✅ Run deployment: `.\GET_SSH_AND_DEPLOY.ps1`
2. ✅ SSL certificate will be issued automatically
3. ✅ Website will be LIVE at https://www.cryptorafts.com

---

## 📸 Screenshots Guide (If Needed)

**In Hostinger DNS Zone Editor, you should see:**

```
┌─────────────────────────────────────┐
│ Type │ Name │ Points to          │ TTL │
├─────────────────────────────────────┤
│ A    │ @    │ 145.79.211.130    │ 3600│
│ A    │ www  │ 145.79.211.130    │ 3600│
└─────────────────────────────────────┘
```

---

## 🚨 Common Issues

### Issue 1: DNS Not Updating

**Problem:** Changed DNS but still shows old IP

**Solution:**
1. Wait 10-30 minutes for DNS propagation
2. Clear DNS cache: `ipconfig /flushdns` (Windows)
3. Check with different DNS server: `nslookup cryptorafts.com 8.8.8.8`
4. Verify changes in Hostinger panel

### Issue 2: Can't Edit DNS Records

**Problem:** DNS records are locked or can't edit

**Solution:**
1. Check if domain is using Hostinger nameservers
2. Nameservers should be Hostinger's (e.g., `ns1.dns-parking.com`)
3. If using external nameservers, update DNS there instead

---

## ✅ After DNS Fix

Once DNS is correctly pointing to `145.79.211.130`:

```powershell
# Verify DNS
nslookup cryptorafts.com 8.8.8.8
nslookup www.cryptorafts.com 8.8.8.8

# Both should show: 145.79.211.130

# Then run deployment
.\GET_SSH_AND_DEPLOY.ps1
```

**Your website will be LIVE! 🎉**

