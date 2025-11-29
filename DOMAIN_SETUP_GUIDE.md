# 🌐 CUSTOM DOMAIN SETUP: www.cryptorafts.com

## ✅ **DOMAIN CONFIGURATION**

### **Steps to Make www.cryptorafts.com Live:**

---

## **1. DNS Configuration**

You need to add DNS records to your domain registrar (where you purchased cryptorafts.com):

### **Option A: CNAME Record (Recommended)**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 3600 (or Auto)
```

### **Option B: A Record (Alternative)**
```
Type: A
Name: @ (or blank for root domain)
Value: 76.76.21.21
TTL: 3600
```

### **For Root Domain (cryptorafts.com):**
```
Type: A
Name: @
Value: 76.76.21.21
TTL: 3600
```

---

## **2. Vercel Domain Configuration**

The domain has been added to your Vercel project. Vercel will automatically:
- ✅ Provision SSL certificate (Let's Encrypt)
- ✅ Configure HTTPS
- ✅ Set up redirects
- ✅ Enable CDN caching

---

## **3. Verification Steps**

### **Check Domain Status:**
```bash
vercel domains ls
```

### **Verify DNS Propagation:**
- Visit: https://dnschecker.org
- Check for `www.cryptorafts.com`
- Verify it points to Vercel's servers

### **Test Domain:**
- Wait 5-15 minutes for DNS propagation
- Visit: https://www.cryptorafts.com
- Check SSL certificate is active

---

## **4. Domain Providers**

### **Common Domain Registrars:**
- **GoDaddy:** DNS Management → Add Record
- **Namecheap:** Advanced DNS → Add Record
- **Cloudflare:** DNS → Add Record
- **Google Domains:** DNS → Custom Records
- **AWS Route 53:** Hosted Zones → Create Record

---

## **5. Vercel Automatic Configuration**

Once DNS is configured, Vercel will:
1. ✅ Detect the domain
2. ✅ Issue SSL certificate (usually takes 1-5 minutes)
3. ✅ Configure HTTPS redirect
4. ✅ Enable CDN
5. ✅ Set up edge caching

---

## **6. Troubleshooting**

### **If Domain Not Working:**

1. **Check DNS Propagation:**
   ```bash
   nslookup www.cryptorafts.com
   ```

2. **Verify Vercel Domain:**
   ```bash
   vercel domains ls
   ```

3. **Check SSL Certificate:**
   - Visit: https://www.ssllabs.com/ssltest/
   - Enter: www.cryptorafts.com

4. **Wait for Propagation:**
   - DNS changes can take up to 48 hours
   - Usually works within 15-30 minutes

---

## **7. Redirect Configuration**

Vercel automatically handles:
- ✅ `cryptorafts.com` → `www.cryptorafts.com` (if configured)
- ✅ HTTP → HTTPS redirect
- ✅ All routes preserved

---

## **8. Final Steps**

1. ✅ Add DNS records at your domain registrar
2. ✅ Wait for DNS propagation (5-15 minutes)
3. ✅ Verify domain in Vercel dashboard
4. ✅ Test: https://www.cryptorafts.com
5. ✅ Check SSL certificate is active

---

## **✅ STATUS**

**Domain Added to Vercel:** ✅
**Next Step:** Configure DNS records at your domain registrar
**Expected Time:** 5-15 minutes for DNS propagation

**Your site will be live at www.cryptorafts.com once DNS is configured!** 🚀

