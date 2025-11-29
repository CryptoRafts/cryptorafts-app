# ⚡ QUICK DNS FIX - 5 Minutes

## 🎯 What You Need to Do:

### **1. Go to Your Domain Registrar**
(Where you bought cryptorafts.com - Namecheap, GoDaddy, Cloudflare, etc.)

### **2. Delete Old MX Records**
- Find all MX records
- Delete them

### **3. Add These 4 Records:**

#### **Record 1: MX**
```
Type: MX
Name: @
Value: mx1.hostinger.com
Priority: 5
```

#### **Record 2: MX**
```
Type: MX
Name: @
Value: mx2.hostinger.com
Priority: 10
```

#### **Record 3: SPF (TXT)**
```
Type: TXT
Name: @
Value: v=spf1 include:hostinger.com ~all
```

#### **Record 4: DKIM (TXT)**
```
Type: TXT
Name: default._domainkey
Value: [Get from Hostinger - Email → Email Accounts → DKIM]
```

### **4. Get DKIM from Hostinger:**
1. https://hpanel.hostinger.com/
2. Email → Email Accounts
3. Create `business@cryptorafts.com` (if not exists)
4. Copy DKIM key
5. Paste in Record 4 above

### **5. Wait 15-30 minutes**

### **6. Check:**
- https://dnschecker.org/#MX/cryptorafts.com
- Hostinger should show "Domain connected"

---

**See `FIX_DNS_NOW.md` for detailed instructions**

