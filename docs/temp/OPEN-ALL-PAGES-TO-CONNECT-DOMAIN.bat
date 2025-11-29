@echo off
title Connect Domain to Vercel
color 0A

echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║                                                          ║
echo ║     🎉 YOUR APP IS DEPLOYED TO VERCEL! 🎉              ║
echo ║                                                          ║
echo ╚══════════════════════════════════════════════════════════╝
echo.
echo ✅ Your app is LIVE at:
echo    https://cryptorafts-7nqe2n6k7-anas-s-projects-8d19f880.vercel.app
echo.
echo 📋 Now connecting cryptorafts.com domain...
echo.
echo Opening all the pages you need...
echo.
pause

echo.
echo 🌐 Opening Vercel Domains Settings...
start https://vercel.com/anas-s-projects-8d19f880/cryptorafts/settings/domains
timeout /t 3 /nobreak >nul

echo 🌐 Opening Hostinger DNS Settings...
start https://hpanel.hostinger.com
timeout /t 3 /nobreak >nul

echo 🔥 Opening Firebase Console...
start https://console.firebase.google.com/project/cryptorafts-b9067/authentication/settings
timeout /t 3 /nobreak >nul

echo 📖 Opening Connection Guide...
start 🎯_CONNECT_DOMAIN_EXACT_STEPS.md
timeout /t 2 /nobreak >nul

echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║              ALL PAGES OPENED!                           ║
echo ╚══════════════════════════════════════════════════════════╝
echo.
echo 📋 NOW DO THIS:
echo.
echo 1️⃣  In VERCEL: Copy the DNS records (A and CNAME)
echo.
echo 2️⃣  In HOSTINGER: Update DNS with Vercel's values
echo     - Change A record to Vercel's IP
echo     - Add CNAME for www
echo.
echo 3️⃣  In FIREBASE: Add these domains:
echo     - cryptorafts.com
echo     - www.cryptorafts.com
echo     - cryptorafts-7nqe2n6k7-anas-s-projects-8d19f880.vercel.app
echo.
echo 4️⃣  WAIT 15-20 minutes for DNS
echo.
echo 5️⃣  Visit: https://cryptorafts.com
echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║           🎊 YOU'RE ALMOST THERE! 🎊                    ║
echo ╚══════════════════════════════════════════════════════════╝
echo.
echo Read the guide: 🎯_CONNECT_DOMAIN_EXACT_STEPS.md
echo.
echo For detailed instructions with screenshots!
echo.
pause

