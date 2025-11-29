# 🔧 FIX UI - Manual Deployment Commands

## Password: `Shamsi2627@@`

## Step 1: Upload All Fixed Files

Run these commands **ONE AT A TIME** in PowerShell (enter password when prompted):

```powershell
scp src/components/SpotlightDisplay.tsx root@72.61.98.99:/var/www/cryptorafts/src/components/SpotlightDisplay.tsx
```

```powershell
scp src/components/PerfectHeader.tsx root@72.61.98.99:/var/www/cryptorafts/src/components/PerfectHeader.tsx
```

```powershell
scp src/providers/SimpleAuthProvider.tsx root@72.61.98.99:/var/www/cryptorafts/src/providers/SimpleAuthProvider.tsx
```

```powershell
scp src/app/page.tsx root@72.61.98.99:/var/www/cryptorafts/src/app/page.tsx
```

```powershell
scp src/app/globals.css root@72.61.98.99:/var/www/cryptorafts/src/app/globals.css
```

## Step 2: SSH and Rebuild

```powershell
ssh root@72.61.98.99
```

**Enter password:** `Shamsi2627@@`

Then run this single command:

```bash
cd /var/www/cryptorafts && rm -rf .next && npm run build && pm2 restart cryptorafts && sleep 3 && pm2 status
```

## Step 3: Verify

1. Wait 30 seconds for the app to restart
2. Open: https://www.cryptorafts.com
3. Press **Ctrl+Shift+R** (hard refresh) to clear cache
4. Check that everything is working

## What This Fixes

✅ **Loading State**: Clears immediately when data loads
✅ **SpotlightDisplay**: Shows data without stuck "Loading..."
✅ **Header**: Doesn't block homepage
✅ **Auth Provider**: Has timeout to prevent stuck loading
✅ **CSS**: All styles properly loaded
✅ **Hydration**: No React hydration errors

## If Still Not Working

1. **Clear browser cache completely:**
   - Press `Ctrl+Shift+Delete`
   - Select "Cached images and files"
   - Click "Clear data"

2. **Try Incognito mode:**
   - Open new Incognito window
   - Visit: https://www.cryptorafts.com

3. **Check PM2 logs:**
   ```bash
   ssh root@72.61.98.99
   pm2 logs cryptorafts --lines 50
   ```

Your app should now be working perfectly! 🎉

