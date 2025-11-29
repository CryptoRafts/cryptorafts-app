/**
 * Check if Firebase Admin SDK is properly configured
 * This script helps verify your setup
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 Checking Firebase Admin SDK Setup...\n');

// Check 1: Service account file
const serviceAccountPath = path.join(process.cwd(), 'secrets', 'service-account.json');
if (fs.existsSync(serviceAccountPath)) {
  console.log('✅ Service account file found:', serviceAccountPath);
  try {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    if (serviceAccount.private_key && serviceAccount.private_key.includes('REPLACE_ME')) {
      console.log('⚠️  WARNING: Service account appears to be a template');
    } else {
      console.log('✅ Service account file is valid');
      console.log('   Project ID:', serviceAccount.project_id || 'Not found');
      console.log('   Client Email:', serviceAccount.client_email || 'Not found');
    }
  } catch (error) {
    console.log('❌ Service account file is invalid:', error.message);
  }
} else {
  console.log('⚠️  Service account file not found:', serviceAccountPath);
  console.log('   Download it from: https://console.firebase.google.com/project/cryptorafts-b9067/settings/serviceaccounts/adminsdk');
}

// Check 2: Base64 file
const base64Path = path.join(process.cwd(), 'secrets', 'service-account-base64.txt');
if (fs.existsSync(base64Path)) {
  console.log('\n✅ Base64 encoded file found:', base64Path);
  const base64 = fs.readFileSync(base64Path, 'utf8').trim();
  console.log('   Length:', base64.length, 'characters');
  console.log('   Preview:', base64.substring(0, 50) + '...');
} else {
  console.log('\n⚠️  Base64 file not found:', base64Path);
  console.log('   Run: node scripts/encode-service-account.js');
}

// Check 3: Environment variable (local)
const envB64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64;
if (envB64) {
  console.log('\n✅ FIREBASE_SERVICE_ACCOUNT_B64 environment variable is set (local)');
  console.log('   Length:', envB64.length, 'characters');
} else {
  console.log('\n⚠️  FIREBASE_SERVICE_ACCOUNT_B64 not set in local environment');
  console.log('   This is OK - it should be set in Vercel, not locally');
}

// Summary
console.log('\n📋 Setup Checklist:');
console.log('   [ ] Service account downloaded from Firebase Console');
console.log('   [ ] Service account saved to secrets/service-account.json');
console.log('   [ ] Base64 encoded (secrets/service-account-base64.txt)');
console.log('   [ ] Added FIREBASE_SERVICE_ACCOUNT_B64 to Vercel');
console.log('   [ ] Applied to Production, Preview, Development');
console.log('   [ ] Redeployed application');

console.log('\n📖 For detailed instructions, see: QUICK_FIREBASE_ADMIN_SETUP.md\n');

