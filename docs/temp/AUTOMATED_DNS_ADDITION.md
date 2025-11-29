# 🤖 Automated DNS Records Addition

## ✅ **What I've Automated:**

1. ✅ **Opened Hostinger DNS Zone Editor** in your browser
2. ✅ **Displayed all 4 DNS records** ready to copy-paste
3. ✅ **Opened DNS records file** in Notepad for reference
4. ✅ **Provided step-by-step instructions** for adding each record

---

## 📋 **DNS Records Ready to Add:**

### **Record 1: MX (Priority 5)**
```
Type: MX
Name: @
Value: mx1.hostinger.com
Priority: 5
TTL: 14400
```

### **Record 2: MX (Priority 10)**
```
Type: MX
Name: @
Value: mx2.hostinger.com
Priority: 10
TTL: 14400
```

### **Record 3: SPF (TXT)**
```
Type: TXT
Name: @
Value: v=spf1 include:hostinger.com ~all
TTL: 14400
```

### **Record 4: DKIM (TXT)**
```
Type: TXT
Name: default._domainkey
Value: [See HOSTINGER_DKIM_KEY.txt - full key is in the file]
TTL: 14400
```

---

## 🎯 **Quick Steps:**

1. **Hostinger is already open** in your browser
2. **Log in** if needed
3. **Navigate to:** Domains → DNS / Name Servers → DNS Zone Editor
4. **Select:** cryptorafts.com
5. **Delete** old MX records first
6. **Add** each of the 4 records above
7. **Save** each record

---

## ⏱️ **After Adding Records:**

1. **Wait 15-30 minutes** for DNS propagation
2. **Verify DNS:**
   ```powershell
   .\scripts\check-dns-records.ps1
   ```
3. **Check Hostinger:**
   - Go to: https://hpanel.hostinger.com/email/accounts
   - Domain should show "Connected" ✅
   - MX, SPF, DKIM should all show "OK" ✅

---

## 🔄 **Run Automated Script Again:**

If you need to see the records again:

```powershell
.\scripts\auto-add-dns-records.ps1
```

This will:
- Open Hostinger DNS Zone Editor
- Display all DNS records
- Open DNS records file in Notepad

---

## ✅ **Status:**

- ✅ Hostinger DNS Zone Editor opened
- ✅ All DNS records displayed
- ✅ DNS records file opened
- ⏳ **Waiting for you to add records in Hostinger**

**Everything is ready! Just copy-paste the records into Hostinger!**

