#!/bin/bash

cd /var/www/cryptorafts || exit 1

echo "🔧 Adding ULTIMATE CSS fix..."

# Check if CSS already exists
if grep -q "CRITICAL: FORCE HERO SECTION VISIBILITY - ULTIMATE FIX" src/app/globals.css; then
    echo "⚠️  CSS fix already exists, removing old version..."
    # Remove old version (lines between the comment and the closing brace)
    sed -i '/\/\* CRITICAL: FORCE HERO SECTION VISIBILITY - ULTIMATE FIX \*\//,/^}$/d' src/app/globals.css
    # Also remove the next two blocks
    sed -i '/^section\[aria-label\*="Hero section"\] \.hero-content,/,/^}$/d' src/app/globals.css
    sed -i '/^section\[aria-label\*="Hero section"\] h1,/,/^}$/d' src/app/globals.css
fi

# Add the complete CSS fix using printf to avoid heredoc issues
printf '\n/* CRITICAL: FORCE HERO SECTION VISIBILITY - ULTIMATE FIX */\n' >> src/app/globals.css
printf 'section[aria-label*="Hero section"] {\n' >> src/app/globals.css
printf '  display: flex !important;\n' >> src/app/globals.css
printf '  visibility: visible !important;\n' >> src/app/globals.css
printf '  opacity: 1 !important;\n' >> src/app/globals.css
printf '  position: relative !important;\n' >> src/app/globals.css
printf '  z-index: 200 !important;\n' >> src/app/globals.css
printf '  width: 100%% !important;\n' >> src/app/globals.css
printf '  height: 100vh !important;\n' >> src/app/globals.css
printf '  min-height: 100vh !important;\n' >> src/app/globals.css
printf '  overflow: visible !important;\n' >> src/app/globals.css
printf '}\n\n' >> src/app/globals.css

printf 'section[aria-label*="Hero section"] .hero-content,\n' >> src/app/globals.css
printf '.hero-content {\n' >> src/app/globals.css
printf '  display: flex !important;\n' >> src/app/globals.css
printf '  visibility: visible !important;\n' >> src/app/globals.css
printf '  opacity: 1 !important;\n' >> src/app/globals.css
printf '  position: relative !important;\n' >> src/app/globals.css
printf '  z-index: 300 !important;\n' >> src/app/globals.css
printf '  width: 100%% !important;\n' >> src/app/globals.css
printf '  height: 100%% !important;\n' >> src/app/globals.css
printf '  min-height: 100vh !important;\n' >> src/app/globals.css
printf '}\n\n' >> src/app/globals.css

printf 'section[aria-label*="Hero section"] h1,\n' >> src/app/globals.css
printf 'section[aria-label*="Hero section"] h2,\n' >> src/app/globals.css
printf 'section[aria-label*="Hero section"] h3,\n' >> src/app/globals.css
printf 'section[aria-label*="Hero section"] h4,\n' >> src/app/globals.css
printf 'section[aria-label*="Hero section"] h5,\n' >> src/app/globals.css
printf 'section[aria-label*="Hero section"] h6,\n' >> src/app/globals.css
printf 'section[aria-label*="Hero section"] p,\n' >> src/app/globals.css
printf 'section[aria-label*="Hero section"] button,\n' >> src/app/globals.css
printf 'section[aria-label*="Hero section"] a,\n' >> src/app/globals.css
printf 'section[aria-label*="Hero section"] span,\n' >> src/app/globals.css
printf 'section[aria-label*="Hero section"] div {\n' >> src/app/globals.css
printf '  display: block !important;\n' >> src/app/globals.css
printf '  visibility: visible !important;\n' >> src/app/globals.css
printf '  opacity: 1 !important;\n' >> src/app/globals.css
printf '  position: relative !important;\n' >> src/app/globals.css
printf '  z-index: 500 !important;\n' >> src/app/globals.css
printf '  color: white !important;\n' >> src/app/globals.css
printf '}\n' >> src/app/globals.css

echo "✅ CSS fix added successfully"

echo ""
echo "🔨 Rebuilding..."
rm -f .next/lock
npm run build

echo ""
echo "🔄 Restarting services..."
pm2 restart cryptorafts
systemctl reload nginx

echo ""
echo "✅ Complete! Clear browser cache (Ctrl+Shift+R) and test."

