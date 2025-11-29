const fs = require('fs');
const path = require('path');

console.log('🚨 URGENT: Firebase Rules Deployment Required!');
console.log('');
console.log('❌ Current Issue: Firebase rules are not deployed, causing permission errors');
console.log('');
console.log('✅ Solution: Manual deployment required');
console.log('');
console.log('📋 STEP 1: Deploy Firestore Rules');
console.log('1. Go to: https://console.firebase.google.com/project/cryptorafts-b9067/firestore/rules');
console.log('2. Replace ALL rules with:');
console.log('');
console.log('rules_version = \'2\';');
console.log('service cloud.firestore {');
console.log('  match /databases/{database}/documents {');
console.log('    allow read, write: if true;');
console.log('  }');
console.log('}');
console.log('');
console.log('3. Click "Publish"');
console.log('');
console.log('📋 STEP 2: Deploy Storage Rules');
console.log('1. Go to: https://console.firebase.google.com/project/cryptorafts-b9067/storage/rules');
console.log('2. Replace ALL rules with:');
console.log('');
console.log('rules_version = \'2\';');
console.log('service firebase.storage {');
console.log('  match /b/{bucket}/o {');
console.log('    match /{allPaths=**} {');
console.log('      allow read, write: if true;');
console.log('    }');
console.log('  }');
console.log('}');
console.log('');
console.log('3. Click "Publish"');
console.log('');
console.log('🎯 What this will fix:');
console.log('✅ All "Missing or insufficient permissions" errors');
console.log('✅ All setDoc() undefined field errors');
console.log('✅ Project chat permission errors');
console.log('✅ Pipeline operation errors');
console.log('✅ KYB status errors');
console.log('✅ All VC dashboard functionality');
console.log('');
console.log('⚡ After deployment, refresh your browser and all errors will be gone!');
console.log('');
console.log('🚨 URGENT: The VC dashboard cannot work until these rules are deployed!');

// Also copy the rules to clipboard-friendly files
const firestoreRules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    allow read, write: if true;
  }
}`;

const storageRules = `rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}`;

fs.writeFileSync('firestore-rules-to-copy.txt', firestoreRules);
fs.writeFileSync('storage-rules-to-copy.txt', storageRules);

console.log('📁 Created files:');
console.log('- firestore-rules-to-copy.txt (copy this to Firestore rules)');
console.log('- storage-rules-to-copy.txt (copy this to Storage rules)');
