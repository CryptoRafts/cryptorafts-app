#!/bin/bash
# Verify DNS Configuration

echo "🔍 Checking DNS Configuration for cryptorafts.com..."
echo ""

echo "1. Checking root domain (cryptorafts.com):"
dig cryptorafts.com +short
echo ""

echo "2. Checking www subdomain (www.cryptorafts.com):"
dig www.cryptorafts.com +short
echo ""

echo "3. Expected IP: 72.61.98.99"
echo ""

echo "4. Testing website accessibility:"
curl -I https://www.cryptorafts.com 2>&1 | grep -E 'HTTP|Server'
echo ""

echo "✅ DNS Check Complete!"
echo ""
echo "If IP addresses match 72.61.98.99, DNS is configured correctly."
echo "If not, wait for DNS propagation (up to 48 hours) or check DNS records."

