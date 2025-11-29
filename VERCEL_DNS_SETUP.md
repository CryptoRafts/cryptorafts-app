# 🔧 Vercel DNS Configuration for cryptorafts.com

## 📋 **Current Status:**

Your domain `cryptorafts.com` needs DNS records configured in Vercel.

---

## ✅ **Step-by-Step DNS Setup:**

### **Option 1: Use Vercel Nameservers (Recommended)**

1. **Go to Vercel Dashboard:**
   - Visit: https://vercel.com/dashboard
   - Select your project: `cryptorafts-starter`

2. **Navigate to Domain Settings:**
   - Click on **Settings** → **Domains**
   - Find `cryptorafts.com` in the list

3. **Configure Nameservers:**
   - Vercel will show you nameservers like:
     - `ns1.vercel-dns.com`
     - `ns2.vercel-dns.com`
   
4. **Update at Your Domain Registrar (Hostinger):**
   - Log in to Hostinger
   - Go to **Domains** → **cryptorafts.com** → **DNS / Nameservers**
   - Change nameservers to Vercel's nameservers
   - Save changes

5. **Wait for Propagation:**
   - DNS changes take 24-48 hours to propagate
   - Vercel will automatically configure all DNS records

---

### **Option 2: Manual DNS Records (If Not Using Vercel Nameservers)**

If you're using Hostinger's nameservers, add these DNS records:

#### **A Record (Root Domain):**
```
Type: A
Name: @ (or leave blank)
Value: 76.76.21.21
TTL: 3600 (or Auto)
```

#### **CNAME Record (www subdomain):**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 3600 (or Auto)
```

#### **Or Use Vercel's ALIAS Record:**
```
Type: ALIAS
Name: @
Value: [Your Vercel deployment URL].vercel-dns.com
TTL: 3600
```

---

## 🔍 **Verify DNS Configuration:**

### **Check Current DNS Records:**

Run these commands to check your DNS:

```bash
# Check A record
nslookup cryptorafts.com

# Check www subdomain
nslookup www.cryptorafts.com

# Check all DNS records
dig cryptorafts.com ANY
```

### **Expected Results:**

- **A Record**: Should point to Vercel's IP (76.76.21.21) or Vercel's DNS
- **CNAME**: www should point to `cname.vercel-dns.com` or similar

---

## 📝 **Vercel Domain Configuration:**

1. **Add Domain in Vercel:**
   - Go to: https://vercel.com/dashboard → Your Project → Settings → Domains
   - Click **Add Domain**
   - Enter: `cryptorafts.com`
   - Enter: `www.cryptorafts.com` (for www subdomain)

2. **Vercel will show you:**
   - Required DNS records
   - Nameserver information
   - Verification status

3. **After DNS is configured:**
   - Vercel will automatically issue SSL certificate
   - Your site will be accessible at `https://www.cryptorafts.com`

---

## ⚠️ **Important Notes:**

1. **DNS Propagation:**
   - Changes can take 24-48 hours
   - Some regions may see changes faster (minutes to hours)
   - Use DNS checker tools to verify: https://dnschecker.org

2. **SSL Certificate:**
   - Vercel automatically issues SSL certificates
   - Wait for DNS to propagate before SSL can be issued
   - Usually takes 1-2 hours after DNS is correct

3. **Current Status:**
   - Your domain is registered with Hostinger ✅
   - Nameservers need to be updated to Vercel's ✅
   - Or DNS records need to be added manually ✅

---

## 🚀 **Quick Setup Commands:**

### **If Using Vercel CLI:**

```bash
# Add domain to Vercel project
vercel domains add cryptorafts.com

# Check domain status
vercel domains ls

# View DNS records needed
vercel domains inspect cryptorafts.com
```

---

## ✅ **After DNS is Configured:**

1. **Wait 24-48 hours** for DNS propagation
2. **Check DNS status** using DNS checker tools
3. **Verify SSL certificate** is issued by Vercel
4. **Test your site** at `https://www.cryptorafts.com`

---

## 📞 **Need Help?**

- **Vercel DNS Docs**: https://vercel.com/docs/domains/managing-dns-records
- **Hostinger DNS Guide**: Check Hostinger's documentation
- **DNS Checker**: https://dnschecker.org

---

## 🎯 **Current Action Required:**

1. ✅ **Go to Vercel Dashboard** → Settings → Domains
2. ✅ **Add `cryptorafts.com`** if not already added
3. ✅ **Copy Vercel's nameservers** or DNS records
4. ✅ **Update at Hostinger** (nameservers or DNS records)
5. ✅ **Wait for propagation** (24-48 hours)
6. ✅ **Verify** using DNS checker tools

Your site will be live at `https://www.cryptorafts.com` once DNS propagates! 🎉

