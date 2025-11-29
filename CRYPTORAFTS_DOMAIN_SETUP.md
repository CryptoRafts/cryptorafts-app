# Setting Up www.cryptorafts.com Domain

## Production Deployment Complete ✅

Your latest code has been deployed to:
- **Production URL**: https://cryptorafts-starter-iu4w1ksvk-anas-s-projects-8d19f880.vercel.app
- **Inspect**: https://vercel.com/anas-s-projects-8d19f880/cryptorafts-starter/9E6zptuzRZ2pQeeB4VinN6WqiUi3

## Recent Fixes Applied

### 1. VC Dashboard Improvements ✅
- **Real-time stats** from Firestore (no demo data)
- **Responsive design** for mobile, tablet, and desktop
- **Proper cleanup** of Firebase listeners
- **Loading states** with spinners
- **Recent activity** tracking

### 2. VC Dealflow Page ✅
- **Shows ALL projects** to VCs (no KYB filter)
- **Beautiful glassmorphism UI** with hover effects
- **Responsive grid layout** (1 col mobile, 2 cols tablet, 3 cols desktop)
- **Real-time updates** from Firestore
- **Project cards** with rating, sector, chain, and summary

### 3. Firebase Rules Fixed ✅
- **Reviews collection** - Read/write access for authenticated users
- **Pitches collection** - Proper permissions for VCs and founders
- **Fixed permission errors** that were causing submission failures

---

## Domain Setup Instructions

### Step 1: Access Vercel Dashboard
1. Go to https://vercel.com/anas-s-projects-8d19f880/cryptorafts-starter
2. Click on **Settings** in the top navigation
3. Click on **Domains** in the left sidebar

### Step 2: Add Your Custom Domain
1. In the "Domains" section, you'll see a text input field
2. Type: `www.cryptorafts.com`
3. Click **Add** button
4. Vercel will show you the DNS configuration needed

### Step 3: Configure DNS Records

Vercel will provide you with specific DNS records. You need to add these to your domain registrar (where you bought cryptorafts.com).

#### Option A: Using CNAME (Recommended for www)
Add a CNAME record:
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 3600 (or Auto)
```

#### Option B: Using A Records (For apex domain)
If you want both `cryptorafts.com` AND `www.cryptorafts.com`:

**For root domain (cryptorafts.com):**
```
Type: A
Name: @ (or leave blank)
Value: 76.76.21.21
TTL: 3600
```

**For www subdomain:**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 3600
```

### Step 4: Add Root Domain (Optional)
If you also want `cryptorafts.com` (without www):
1. Go back to Vercel → Settings → Domains
2. Add `cryptorafts.com` as well
3. Vercel will automatically redirect `cryptorafts.com` → `www.cryptorafts.com`

---

## Common Domain Registrars - Where to Add DNS Records

### GoDaddy
1. Go to https://dcc.godaddy.com/manage/
2. Find your domain → Click **DNS**
3. Scroll to **Records** section
4. Click **Add** to add new records
5. Add the CNAME/A records from above

### Namecheap
1. Go to https://ap.www.namecheap.com/domains/list/
2. Click **Manage** next to your domain
3. Click **Advanced DNS** tab
4. Click **Add New Record**
5. Add the CNAME/A records from above

### Cloudflare
1. Go to https://dash.cloudflare.com/
2. Select your domain
3. Click **DNS** tab
4. Click **Add record**
5. Add the CNAME/A records from above
6. **Important**: Set proxy status to "DNS only" (grey cloud, not orange)

### Google Domains (now Squarespace)
1. Go to https://domains.squarespace.com/
2. Click on your domain
3. Click **DNS** in the left menu
4. Scroll to **Custom records**
5. Add the CNAME/A records from above

### Other Registrars
Most registrars have a similar process:
1. Log in to your account
2. Find "DNS Management", "DNS Settings", or "Name Servers"
3. Add the CNAME/A records provided by Vercel

---

## Verification Process

### 1. Wait for DNS Propagation
- DNS changes can take **5 minutes to 48 hours** to propagate
- Usually takes **15-30 minutes** for most records
- You can check propagation status at: https://dnschecker.org/

### 2. Check in Vercel
After adding DNS records:
1. Go back to Vercel → Settings → Domains
2. You should see your domain with a **checkmark** ✅ when verified
3. If not verified yet, click **Refresh** to check status

### 3. Test Your Domain
Once verified in Vercel:
```bash
# Open in browser
https://www.cryptorafts.com

# Or test with curl
curl -I https://www.cryptorafts.com
```

---

## Troubleshooting

### Domain Not Working After 24 Hours?

#### Check DNS Records
Use online DNS checker:
```
https://dnschecker.org/#CNAME/www.cryptorafts.com
```

Should show: `cname.vercel-dns.com`

#### Common Issues

**1. Wrong DNS Records**
- Make sure you added the **exact** records from Vercel
- Check for typos in the CNAME value
- Make sure there are no extra spaces

**2. Cloudflare Proxy Enabled**
- If using Cloudflare, disable the proxy (click the orange cloud to make it grey)
- Vercel needs direct DNS control for SSL

**3. Multiple Records**
- Remove any old/conflicting CNAME or A records for `www`
- Only keep the Vercel CNAME record

**4. TTL Too High**
- If you changed records, wait for old TTL to expire
- Some registrars cache DNS for up to 24 hours

**5. SSL Certificate Pending**
- Vercel auto-generates SSL certificates
- Can take 5-10 minutes after domain verification
- Check status in Vercel → Settings → Domains

---

## After Domain Is Live

### Update Firebase Authorized Domains
1. Go to Firebase Console: https://console.firebase.google.com/
2. Select your project: **cryptorafts-b9067**
3. Go to **Authentication** → **Settings** → **Authorized domains**
4. Click **Add domain**
5. Add: `www.cryptorafts.com`
6. Click **Add**

This allows Firebase Authentication to work on your custom domain.

### Update Environment Variables (If Needed)
If you have any hardcoded URLs in your app:
1. Go to Vercel → Settings → Environment Variables
2. Add/Update any variables like:
   ```
   NEXT_PUBLIC_APP_URL=https://www.cryptorafts.com
   ```
3. Redeploy to apply changes

---

## Current Status Summary

### ✅ Completed
- [x] Fixed Firebase permission errors for reviews
- [x] Updated VC dashboard with real-time data
- [x] Made VC dealflow responsive and beautiful
- [x] Fixed project overview functionality
- [x] Deployed to production

### 🔄 In Progress
- [ ] Domain DNS configuration (requires user action)
- [ ] Domain verification on Vercel
- [ ] Firebase authorized domains update

### 📋 Next Steps for You
1. **Add DNS records** at your domain registrar (see Step 3 above)
2. **Wait for verification** in Vercel (usually 15-30 minutes)
3. **Add domain to Firebase** authorized domains
4. **Test the site** at www.cryptorafts.com

---

## Production URL (Current)
https://cryptorafts-starter-iu4w1ksvk-anas-s-projects-8d19f880.vercel.app

This URL is already working with all the latest fixes. Once you configure the DNS, www.cryptorafts.com will point to this same deployment.

---

## Need Help?

If you encounter issues:
1. Check the **Troubleshooting** section above
2. Verify DNS records at https://dnschecker.org/
3. Check Vercel deployment logs in the dashboard
4. Check Firebase Console for any errors

The platform is ready and working perfectly at the production URL. The domain setup is just DNS configuration on your registrar's side.

