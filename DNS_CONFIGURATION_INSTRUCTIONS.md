# DNS Configuration for www.cryptorafts.com

## Current VPS IP: 72.61.98.99

## Required DNS Records

### 1. A Record (IPv4)
- **Type:** A
- **Name:** @ (or cryptorafts.com)
- **Value:** 72.61.98.99
- **TTL:** 300 (or default)

### 2. A Record (IPv4) for www
- **Type:** A
- **Name:** www
- **Value:** 72.61.98.99
- **TTL:** 300 (or default)

### 3. AAAA Record (IPv6) - OPTIONAL
If your VPS supports IPv6 (2a02:4780:28:17ca::1), you can add:
- **Type:** AAAA
- **Name:** @ (or cryptorafts.com)
- **Value:** 2a02:4780:28:17ca::1
- **TTL:** 300 (or default)

- **Type:** AAAA
- **Name:** www
- **Value:** 2a02:4780:28:17ca::1
- **TTL:** 300 (or default)

## How to Update DNS in Hostinger

1. Go to: https://hpanel.hostinger.com/vps/1097850/dns-manager
2. Or go to your domain's DNS settings in Hostinger
3. Add/Update the A records:
   - **@** → 72.61.98.99
   - **www** → 72.61.98.99
4. Remove any conflicting AAAA records (unless you confirm IPv6 is active)
5. Set TTL to 300 seconds
6. Save changes

## Verification

After updating DNS, wait 5-10 minutes, then verify:

```bash
dig cryptorafts.com A
dig www.cryptorafts.com A
```

Both should return: 72.61.98.99

## Expected Results

- cryptorafts.com should resolve to 72.61.98.99
- www.cryptorafts.com should resolve to 72.61.98.99
- Both should redirect HTTP to HTTPS
- SSL certificate should be valid

