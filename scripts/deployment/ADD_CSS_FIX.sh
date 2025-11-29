#!/bin/bash

# Add visibility fix to CSS
cd /var/www/cryptorafts || exit 1

cat >> src/app/globals.css << 'CSSFIX'

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

section[aria-label*="Hero section"] .text-center {
  display: flex !important;
  visibility: visible !important;
  opacity: 1 !important;
}
CSSFIX

echo "✅ CSS fix added"

