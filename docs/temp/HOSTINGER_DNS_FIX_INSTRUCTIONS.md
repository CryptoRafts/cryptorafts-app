# 🔧 HOSTINGER DNS FIX - EXACT INSTRUCTIONS

## 📋 CURRENT ISSUE

**Current DNS:**
- `cryptorafts.com` → `72.61.98.99` ❌
- `www.cryptorafts.com` → `72.61.98.99` ❌

**Should be:**
- Both → `145.79.211.130` ✅

---

## 🔧 EXACT STEPS TO FIX IN HOSTINGER

### Step 1: Login to Hostinger Panel

1. **Open:** https://hpanel.hostinger.com/
2. **Login** with your Hostinger account credentials
3. You'll see the dashboard

---

### Step 2: Navigate to Domain Management

1. **Click:** "Domains" in the left sidebar menu
2. **Find:** `cryptorafts.com` in the list
3. **Click** on `cryptorafts.com`

---

### Step 3: Access DNS Management

1. **Look for:** "DNS / Name Servers" tab (at the top)
2. **Click** on "DNS / Name Servers" tab
3. **Click:** "Manage DNS" button
   - OR look for "DNS Zone Editor"
   - OR "Advanced DNS"

---

### Step 4: Update Root Domain A Record

**Find the existing A record:**
- Look for a record with:
  - **Type:** A
  - **Name:** @ (or blank/empty)
  - **Points to:** `72.61.98.99` (current wrong IP)

**Update it:**
1. **Click** the "Edit" button (pencil icon ✏️) next to that record
2. **Find:** "Points to" or "Value" field
3. **Change** from `72.61.98.99` to `145.79.211.130`
4. **TTL:** Keep as `3600` or `Auto`
5. **Click:** "Save" or "Update" button

---

### Step 5: Update/Create www A Record

**If A record for www exists:**
1. **Find** A record with:
   - **Type:** A
   - **Name:** www
   - **Points to:** `72.61.98.99` (current wrong IP)

2. **Click** "Edit" (pencil icon)

3. **Change** "Points to" to: `145.79.211.130`

4. **Click** "Save"

**If A record for www doesn't exist:**
1. **Click** "Add Record" button
2. **Fill in:**
   - **Type:** Select "A"
   - **Name:** Enter "www"
   - **Points to:** Enter "145.79.211.130"
   - **TTL:** `3600` or `Auto`
3. **Click** "Save" or "Add Record"

---

### Step 6: Remove CNAME Records (If Any)

**If there's a CNAME record for www:**
1. **Find** CNAME record with:
   - **Type:** CNAME
   - **Name:** www

2. **Click** "Delete" or "Remove" button

3. **Confirm** deletion

**Note:** We need A record, not CNAME when using VPS IP.

---

### Step 7: Save All Changes

1. **Review** all changes:
   - A record for `@` → `145.79.211.130` ✅
   - A record for `www` → `145.79.211.130` ✅

2. **Click** "Save" or "Save All" button (if available)

3. **Wait** for confirmation message

---

### Step 8: Wait for DNS Propagation

1. **Wait:** 10-30 minutes for DNS propagation globally
2. **Clear** your DNS cache (Windows):
   ```powershell
   ipconfig /flushdns
   ```

---

### Step 9: Verify DNS Fix

**Run verification:**
```powershell
.\AUTO_FIX_DNS_CHECK.ps1
```

**Or manually check:**
```powershell
nslookup cryptorafts.com 8.8.8.8
nslookup www.cryptorafts.com 8.8.8.8
```

**Both should show:** `145.79.211.130`

---

## ✅ AFTER DNS IS FIXED

Once DNS resolves to `145.79.211.130`:

1. **Run deployment:**
   ```powershell
   .\GET_SSH_AND_DEPLOY.ps1
   ```

2. **SSL certificate** will be issued automatically (5-10 minutes)

3. **Website will be LIVE** at: https://www.cryptorafts.com

---

## 🚨 TROUBLESHOOTING

### Can't find "Manage DNS" button?

**Look for:**
- "DNS Zone Editor"
- "Advanced DNS"
- "DNS Records"
- "Custom DNS"

### Can't edit DNS records?

**Check:**
1. Nameservers should be Hostinger's (ns1.dns-parking.com, ns2.dns-parking.com)
2. Domain should be active (not expired)
3. You should have admin access to the domain

### DNS not updating after changes?

**Try:**
1. Wait 30-60 minutes for global propagation
2. Clear DNS cache: `ipconfig /flushdns`
3. Check with different DNS servers:
   - Google DNS: `8.8.8.8`
   - Cloudflare DNS: `1.1.1.1`

---

## 📋 QUICK REFERENCE

**Required DNS Records:**
```
Type: A
Name: @
Points to: 145.79.211.130
TTL: 3600

Type: A
Name: www
Points to: 145.79.211.130
TTL: 3600
```

**Hostinger Panel:**
- Login: https://hpanel.hostinger.com/
- Path: Domains → cryptorafts.com → DNS / Name Servers → Manage DNS

---

**After fixing DNS, run:**
```powershell
.\AUTO_FIX_DNS_CHECK.ps1
```

**Then deploy:**
```powershell
.\GET_SSH_AND_DEPLOY.ps1
```

