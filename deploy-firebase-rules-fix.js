const { exec } = require('child_process');
const fs = require('fs');

console.log('🚀 Deploying Firebase rules to fix permission issues...');

// Check if firebase.json exists
if (!fs.existsSync('firebase.json')) {
  console.error('❌ firebase.json not found. Please run this from the project root.');
  process.exit(1);
}

// Deploy Firestore rules
console.log('📝 Deploying Firestore rules...');
exec('firebase deploy --only firestore:rules --force', (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Firestore rules deployment failed:', error.message);
    console.log('💡 Try running: firebase login --no-localhost');
    console.log('💡 Or deploy manually via Firebase Console');
  } else {
    console.log('✅ Firestore rules deployed successfully');
  }
});

// Deploy Storage rules
console.log('📦 Deploying Storage rules...');
exec('firebase deploy --only storage --force', (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Storage rules deployment failed:', error.message);
    console.log('💡 Try running: firebase login --no-localhost');
    console.log('💡 Or deploy manually via Firebase Console');
  } else {
    console.log('✅ Storage rules deployed successfully');
  }
});

console.log('🎯 Firebase rules deployment initiated. Check console for results.');
console.log('📋 Manual deployment instructions:');
console.log('1. Go to Firebase Console');
console.log('2. Navigate to Firestore Database > Rules');
console.log('3. Replace with: allow read, write: if true;');
console.log('4. Navigate to Storage > Rules');
console.log('5. Replace with: allow read, write: if true;');
console.log('6. Publish changes');
