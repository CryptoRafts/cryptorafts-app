# Firebase Connection Diagnostic Script
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "FIREBASE CONNECTION DIAGNOSTIC" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check Firebase config
Write-Host "1. Checking Firebase Configuration..." -ForegroundColor Yellow
$firebaseConfig = @{
    apiKey = "AIzaSyAo2aRQPZU5naLm4bFCDbqTA1gNW8oFB14"
    authDomain = "cryptorafts-b9067.firebaseapp.com"
    databaseURL = "https://cryptorafts-b9067-default-rtdb.firebaseio.com"
    projectId = "cryptorafts-b9067"
    storageBucket = "cryptorafts-b9067.firebasestorage.app"
    messagingSenderId = "374711838796"
    appId = "1:374711838796:web:3bee725bfa7d8790456ce9"
    measurementId = "G-ZRQ955RGWH"
}

Write-Host "   Project ID: $($firebaseConfig.projectId)" -ForegroundColor White
Write-Host "   Auth Domain: $($firebaseConfig.authDomain)" -ForegroundColor White
Write-Host "   Database URL: $($firebaseConfig.databaseURL)" -ForegroundColor White
Write-Host ""

# Check if domain needs to be authorized
Write-Host "2. Domain Authorization Check..." -ForegroundColor Yellow
Write-Host "   ⚠️  IMPORTANT: Add these domains to Firebase Console:" -ForegroundColor Yellow
Write-Host "   - www.cryptorafts.com" -ForegroundColor White
Write-Host "   - cryptorafts.com" -ForegroundColor White
Write-Host "   - cryptorafts-starter-*.vercel.app (for preview deployments)" -ForegroundColor White
Write-Host ""
Write-Host "   Steps:" -ForegroundColor Cyan
Write-Host "   1. Go to: https://console.firebase.google.com/project/cryptorafts-b9067/authentication/settings" -ForegroundColor White
Write-Host "   2. Scroll to 'Authorized domains'" -ForegroundColor White
Write-Host "   3. Click 'Add domain'" -ForegroundColor White
Write-Host "   4. Add: www.cryptorafts.com" -ForegroundColor White
Write-Host "   5. Add: cryptorafts.com" -ForegroundColor White
Write-Host "   6. Save changes" -ForegroundColor White
Write-Host ""

# Check Firestore rules
Write-Host "3. Firestore Security Rules Check..." -ForegroundColor Yellow
Write-Host "   ⚠️  IMPORTANT: Check Firestore rules allow public read:" -ForegroundColor Yellow
Write-Host "   Go to: https://console.firebase.google.com/project/cryptorafts-b9067/firestore/rules" -ForegroundColor White
Write-Host ""
Write-Host "   Rules should include:" -ForegroundColor Cyan
Write-Host "   match /spotlights/{document=**} {" -ForegroundColor White
Write-Host "     allow read: if true;" -ForegroundColor Green
Write-Host "   }" -ForegroundColor White
Write-Host "   match /users/{document=**} {" -ForegroundColor White
Write-Host "     allow read: if true;" -ForegroundColor Green
Write-Host "   }" -ForegroundColor White
Write-Host "   match /projects/{document=**} {" -ForegroundColor White
Write-Host "     allow read: if true;" -ForegroundColor Green
Write-Host "   }" -ForegroundColor White
Write-Host ""

# Check API key restrictions
Write-Host "4. API Key Restrictions Check..." -ForegroundColor Yellow
Write-Host "   Go to: https://console.cloud.google.com/apis/credentials?project=cryptorafts-b9067" -ForegroundColor White
Write-Host "   Check if API key has HTTP referrer restrictions" -ForegroundColor White
Write-Host "   If yes, add: https://www.cryptorafts.com/*" -ForegroundColor White
Write-Host ""

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "NEXT STEPS" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "1. Add domains to Firebase Console (most important!)" -ForegroundColor Yellow
Write-Host "2. Check Firestore rules allow public read" -ForegroundColor Yellow
Write-Host "3. Check API key restrictions" -ForegroundColor Yellow
Write-Host "4. Wait 2-3 minutes for changes to propagate" -ForegroundColor Yellow
Write-Host "5. Clear browser cache and test" -ForegroundColor Yellow
Write-Host ""

