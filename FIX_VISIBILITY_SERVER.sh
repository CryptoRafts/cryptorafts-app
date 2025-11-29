#!/bin/bash

# ============================================
# FIX HERO SECTION VISIBILITY ON SERVER
# ============================================

echo "=========================================="
echo "🔧 FIXING HERO SECTION VISIBILITY"
echo "=========================================="
echo ""

cd /var/www/cryptorafts || exit 1

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 1. Check if globals.css exists
if [ ! -f "src/app/globals.css" ]; then
    echo -e "${RED}❌ globals.css not found${NC}"
    exit 1
fi

echo "1. Checking current CSS..."
echo ""

# 2. Add aggressive visibility fix to globals.css
echo "2. Adding visibility fix to globals.css..."
echo ""

# Backup original
cp src/app/globals.css src/app/globals.css.backup.$(date +%Y%m%d_%H%M%S)

# Add visibility fix at the end of globals.css
cat >> src/app/globals.css << 'EOF'

/* ============================================
   CRITICAL: FORCE HERO SECTION VISIBILITY
   ============================================ */

/* Force hero section to be visible */
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

/* Force hero content to be visible */
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

/* Force all hero text to be visible */
section[aria-label*="Hero section"] h1,
section[aria-label*="Hero section"] h2,
section[aria-label*="Hero section"] h3,
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

/* Force hero text containers */
section[aria-label*="Hero section"] .text-center {
  display: flex !important;
  visibility: visible !important;
  opacity: 1 !important;
}

EOF

echo -e "${GREEN}✅ Visibility fix added to globals.css${NC}"
echo ""

# 3. Rebuild application
echo "3. Rebuilding application..."
npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build successful${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi
echo ""

# 4. Restart PM2
echo "4. Restarting PM2..."
pm2 restart cryptorafts
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ PM2 restarted${NC}"
else
    echo -e "${YELLOW}⚠️  PM2 restart failed, trying start...${NC}"
    pm2 start ecosystem.config.js || pm2 start server.js --name cryptorafts
fi
echo ""

# 5. Reload Nginx
echo "5. Reloading Nginx..."
systemctl reload nginx
echo -e "${GREEN}✅ Nginx reloaded${NC}"
echo ""

# 6. Wait and test
echo "6. Waiting for server to start..."
sleep 5

echo ""
echo "7. Testing local server..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/ 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Server responding (HTTP $HTTP_CODE)${NC}"
else
    echo -e "${RED}❌ Server not responding (HTTP $HTTP_CODE)${NC}"
fi

echo ""
echo "=========================================="
echo -e "${GREEN}✅ VISIBILITY FIX COMPLETE${NC}"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Clear browser cache (Ctrl+Shift+R)"
echo "2. Hard refresh the page"
echo "3. Check if hero section is now visible"
echo ""

