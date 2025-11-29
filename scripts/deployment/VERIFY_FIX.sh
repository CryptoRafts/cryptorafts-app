#!/bin/bash

cd /var/www/cryptorafts || exit 1

echo "🔍 Verifying CSS fix and app status..."
echo ""

# 1. Check if CSS rules are in globals.css
echo "1. Checking globals.css for hero section CSS..."
if grep -q "FORCE HERO VISIBILITY\|CRITICAL: FORCE HERO SECTION VISIBILITY" src/app/globals.css; then
    echo "   ✅ Hero section CSS found in globals.css"
    grep -A 5 "FORCE HERO\|CRITICAL: FORCE HERO" src/app/globals.css | head -10
else
    echo "   ❌ Hero section CSS NOT found in globals.css"
    echo "   Adding CSS fix now..."
    cat >> src/app/globals.css << 'ENDOFCSS'

/* CRITICAL: FORCE HERO SECTION VISIBILITY */
section[aria-label*="Hero section"] {
  display: flex !important;
  visibility: visible !important;
  opacity: 1 !important;
  position: relative !important;
  z-index: 200 !important;
  width: 100% !important;
  height: 100vh !important;
  min-height: 100vh !important;
}

section[aria-label*="Hero section"] .hero-content,
.hero-content {
  display: flex !important;
  visibility: visible !important;
  opacity: 1 !important;
  position: relative !important;
  z-index: 300 !important;
  width: 100% !important;
  height: 100% !important;
}

section[aria-label*="Hero section"] h1,
section[aria-label*="Hero section"] h2,
section[aria-label*="Hero section"] h3,
section[aria-label*="Hero section"] h4,
section[aria-label*="Hero section"] h5,
section[aria-label*="Hero section"] h6,
section[aria-label*="Hero section"] p,
section[aria-label*="Hero section"] button,
section[aria-label*="Hero section"] a,
section[aria-label*="Hero section"] span,
section[aria-label*="Hero section"] div {
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
  position: relative !important;
  z-index: 500 !important;
  color: white !important;
}
ENDOFCSS
    echo "   ✅ CSS fix added"
fi

echo ""
echo "2. Checking PM2 status..."
pm2 status

echo ""
echo "3. Testing local server..."
curl -I http://127.0.0.1:3000/ 2>&1 | head -5

echo ""
echo "4. Checking Nginx status..."
systemctl status nginx --no-pager | head -5

echo ""
echo "5. If CSS was just added, you need to rebuild:"
echo "   npm run build && pm2 restart cryptorafts && systemctl reload nginx"

