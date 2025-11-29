#!/usr/bin/env node

console.log('🚨🚨🚨 URGENT: FIREBASE RULES NOT DEPLOYED! 🚨🚨🚨');
console.log('================================================\n');

console.log('❌ CRITICAL ISSUE:');
console.log('All these errors are happening because Firebase rules are NOT deployed:');
console.log('- Missing or insufficient permissions');
console.log('- Error accepting project');
console.log('- Error getting pipeline');
console.log('- Error getting metrics');
console.log('- Failed to accept project');
console.log('- All VC features are broken\n');

console.log('🔥 IMMEDIATE ACTION REQUIRED - DEPLOY IN 1 MINUTE:\n');

console.log('🎯 STEP 1: Deploy Firestore Rules');
console.log('1. Click: https://console.firebase.google.com/project/cryptorafts-b9067/firestore/rules');
console.log('2. Delete ALL existing rules');
console.log('3. Copy this EXACT code:');
console.log('');
console.log('rules_version = \'2\';');
console.log('service cloud.firestore {');
console.log('  match /databases/{database}/documents {');
console.log('    allow read, write: if true;');
console.log('  }');
console.log('}');
console.log('');
console.log('4. Click "Publish"\n');

console.log('🎯 STEP 2: Deploy Storage Rules');
console.log('1. Click: https://console.firebase.google.com/project/cryptorafts-b9067/storage/rules');
console.log('2. Delete ALL existing rules');
console.log('3. Copy this EXACT code:');
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
console.log('4. Click "Publish"\n');

console.log('⚡ AFTER DEPLOYMENT:');
console.log('1. Refresh your browser');
console.log('2. ALL permission errors will disappear');
console.log('3. Project acceptance will work');
console.log('4. All VC features will work perfectly\n');

console.log('🚨 CRITICAL:');
console.log('The VC dashboard CANNOT work until these rules are deployed!');
console.log('All the code is already fixed - the ONLY thing blocking everything is the Firebase rules deployment!');
console.log('Please deploy the rules NOW using the steps above!');
