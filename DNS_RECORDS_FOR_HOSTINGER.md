# 📋 DNS RECORDS TO ADD IN HOSTINGER

## **AFTER VERCEL GIVES YOU THE RECORDS**

---

## 🎯 **VERCEL WILL SHOW YOU SOMETHING LIKE THIS:**

```
To add cryptorafts.com, add these DNS records:

Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

*(Your actual values might be different!)*

---

## 📋 **HOW TO ADD THEM IN HOSTINGER:**

### **STEP 1: Go to DNS Settings**

1. Login: https://hpanel.hostinger.com
2. Click: "Domains"
3. Click: "cryptorafts.com"
4. Click: "DNS / Name Servers"
5. Click: "Manage DNS records"

---

### **STEP 2: Update A Record**

**Find the existing A record:**
- Type: A
- Name: @ or blank
- Points to: Hostinger IP

**Edit it:**
1. Click "Edit" or trash icon (delete)
2. Change Value to: **Vercel's IP** (from Vercel dashboard)
3. Click "Save"

**Or add new A record:**
1. Click "Add Record"
2. Type: **A**
3. Name: **@** (or leave blank)
4. Value: **76.76.21.21** (use actual IP Vercel gave you!)
5. TTL: **3600**
6. Click "Add Record"

---

### **STEP 3: Add CNAME for www**

1. Click "Add Record"
2. Type: **CNAME**
3. Name: **www**
4. Value: **cname.vercel-dns.com** (use actual value Vercel gave you!)
5. TTL: **3600**
6. Click "Add Record"

---

### **STEP 4: Save**

1. Click "Save Changes" or "Save"
2. Done!

---

## ⏱️ **WAIT TIME:**

- DNS updates: 10-30 minutes
- Can take up to 48 hours (rare)
- Usually works in 15-20 minutes

---

## ✅ **TEST:**

After 15-20 minutes:

1. Visit: https://cryptorafts.com
2. Visit: https://www.cryptorafts.com
3. Both should show your app!

---

**COPY THIS FILE WHEN SETTING UP DNS!** 📋

