#!/usr/bin/env node

const fs = require('fs');

console.log('🚀 FIREBASE RULES DEPLOYMENT - ALL ROLES');
console.log('==========================================\n');

// Read the complete rules
const firestoreRules = fs.readFileSync('firestore-rules-complete.txt', 'utf8');
const storageRules = fs.readFileSync('storage-rules-complete.txt', 'utf8');

console.log('🎯 STEP 1: DEPLOY FIRESTORE RULES');
console.log('==================================');
console.log('1. Open: https://console.firebase.google.com/project/cryptorafts-b9067/firestore/rules');
console.log('2. Delete ALL existing rules');
console.log('3. Copy and paste this EXACT code:\n');
console.log('```javascript');
console.log(firestoreRules);
console.log('```\n');
console.log('4. Click "Publish"\n');

console.log('🎯 STEP 2: DEPLOY STORAGE RULES');
console.log('===============================');
console.log('1. Open: https://console.firebase.google.com/project/cryptorafts-b9067/storage/rules');
console.log('2. Delete ALL existing rules');
console.log('3. Copy and paste this EXACT code:\n');
console.log('```javascript');
console.log(storageRules);
console.log('```\n');
console.log('4. Click "Publish"\n');

console.log('✅ ROLES SUPPORTED:');
console.log('- Admin: Full access to everything');
console.log('- VC: Venture Capital with organization-based permissions');
console.log('- Founder: Project and pitch management');
console.log('- Exchange: Token listing and trading features');
console.log('- Agency: Marketing and campaign management\n');

console.log('🛡️ SECURITY FEATURES:');
console.log('- Role-based access control');
console.log('- Data isolation between roles');
console.log('- Organization-based permissions');
console.log('- Project ownership validation');
console.log('- Room membership checks\n');

console.log('⚡ AFTER DEPLOYMENT:');
console.log('- All permission errors will be resolved');
console.log('- Each role will have appropriate access');
console.log('- Data isolation will be enforced');
console.log('- Cross-role collaboration will work');
console.log('- Security will be maintained\n');

console.log('🚨 CRITICAL:');
console.log('The VC dashboard CANNOT function until these rules are deployed!');
console.log('All the code fixes are already in place - the ONLY thing blocking everything is the Firebase rules deployment!\n');

console.log('📁 FILES READY:');
console.log('- firestore-rules-complete.txt');
console.log('- storage-rules-complete.txt');
console.log('- COMPLETE_FIREBASE_RULES_ALL_ROLES.md\n');

console.log('🎯 DEPLOY NOW TO FIX ALL PERMISSION ERRORS!');
