# Deploy Fix CSS/JS Crash to VPS
# Run this from your local machine (PowerShell)

Write-Output "=========================================="
Write-Output "DEPLOYING CSS/JS FIX TO VPS"
Write-Output "=========================================="
Write-Output ""

# Upload fix script
Write-Output "Step 1: Uploading fix script..."
scp FIX_CSS_JS_CRASH.sh root@72.61.98.99:/var/www/cryptorafts/
Write-Output "✅ Script uploaded"
Write-Output ""

# Run fix script
Write-Output "Step 2: Running fix script on VPS..."
Write-Output "This will:"
Write-Output "  - Clean build cache"
Write-Output "  - Rebuild application"
Write-Output "  - Verify CSS/JS files"
Write-Output "  - Fix file permissions"
Write-Output "  - Test file accessibility"
Write-Output ""
Write-Output "Please enter VPS password when prompted..."
Write-Output ""

ssh root@72.61.98.99 'cd /var/www/cryptorafts && chmod +x FIX_CSS_JS_CRASH.sh && bash FIX_CSS_JS_CRASH.sh'

Write-Output ""
Write-Output "=========================================="
Write-Output "DEPLOYMENT COMPLETE"
Write-Output "=========================================="
Write-Output ""
Write-Output "NEXT STEPS:"
Write-Output "1. Clear browser cache (Ctrl+Shift+Delete)"
Write-Output "2. Test in incognito mode (Ctrl+Shift+N)"
Write-Output "3. Visit: https://www.cryptorafts.com/"
Write-Output ""

