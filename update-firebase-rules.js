const admin = require('firebase-admin');
const fs = require('fs');

// Initialize Firebase Admin
const serviceAccount = require('./secrets/service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'cryptorafts-b9067'
});

async function updateFirestoreRules() {
  try {
    console.log('🔄 Updating Firestore rules...');
    
    const firestoreRules = fs.readFileSync('firestore-rules-complete.txt', 'utf8');
    
    // Note: Firebase Admin SDK doesn't have direct rule deployment
    // This would need to be done through the REST API or Firebase CLI
    console.log('📋 Firestore rules ready for deployment:');
    console.log('Go to: https://console.firebase.google.com/project/cryptorafts-b9067/firestore/rules');
    console.log('Copy and paste the rules from firestore-rules-complete.txt');
    console.log('✅ Firestore rules prepared');
    
  } catch (error) {
    console.error('❌ Error preparing Firestore rules:', error);
  }
}

async function updateStorageRules() {
  try {
    console.log('🔄 Updating Storage rules...');
    
    const storageRules = fs.readFileSync('storage-rules-complete.txt', 'utf8');
    
    console.log('📋 Storage rules ready for deployment:');
    console.log('Go to: https://console.firebase.google.com/project/cryptorafts-b9067/storage/rules');
    console.log('Copy and paste the rules from storage-rules-complete.txt');
    console.log('✅ Storage rules prepared');
    
  } catch (error) {
    console.error('❌ Error preparing Storage rules:', error);
  }
}

async function main() {
  console.log('🚀 Firebase Rules Update Script');
  console.log('================================\n');
  
  await updateFirestoreRules();
  console.log('');
  await updateStorageRules();
  
  console.log('\n🎯 MANUAL DEPLOYMENT REQUIRED:');
  console.log('Since Firebase CLI requires authentication, please deploy manually:');
  console.log('');
  console.log('1. Firestore Rules:');
  console.log('   https://console.firebase.google.com/project/cryptorafts-b9067/firestore/rules');
  console.log('   Copy from: firestore-rules-complete.txt');
  console.log('');
  console.log('2. Storage Rules:');
  console.log('   https://console.firebase.google.com/project/cryptorafts-b9067/storage/rules');
  console.log('   Copy from: storage-rules-complete.txt');
  console.log('');
  console.log('✅ All rules are ready for deployment!');
}

main().catch(console.error);
