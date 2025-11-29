const { exec } = require('child_process');

console.log('🚀 Deploying completely open Firestore rules for VC testing...');

// Deploy the open rules
exec('firebase deploy --only firestore:rules', (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Error deploying rules:', error);
    console.log('\n📋 Manual deployment instructions:');
    console.log('1. Go to Firebase Console: https://console.firebase.google.com/');
    console.log('2. Select your project: cryptorafts-b9067');
    console.log('3. Go to Firestore Database > Rules');
    console.log('4. Replace the rules with:');
    console.log(`
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    allow read, write: if true;
  }
}
    `);
    console.log('5. Click "Publish"');
    return;
  }
  
  if (stderr) {
    console.warn('⚠️ Warnings:', stderr);
  }
  
  console.log('✅ Rules deployed successfully!');
  console.log(stdout);
});

// Also deploy storage rules
exec('firebase deploy --only storage', (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Error deploying storage rules:', error);
    console.log('\n📋 Manual storage rules deployment:');
    console.log('1. Go to Firebase Console > Storage > Rules');
    console.log('2. Replace with: allow read, write: if true;');
    return;
  }
  
  console.log('✅ Storage rules deployed successfully!');
  console.log(stdout);
});
