const { exec } = require('child_process');

console.log('🚀 Deploying Firebase fixes...');

// Deploy Firestore rules
console.log('📝 Deploying Firestore rules...');
exec('firebase deploy --only firestore:rules', (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Firestore rules deployment failed:', error.message);
    console.log('💡 Try running: firebase login --no-localhost');
    return;
  }
  if (stderr) {
    console.error('⚠️ Firestore stderr:', stderr);
  }
  console.log('✅ Firestore rules deployed:', stdout);
});

// Deploy Storage rules
console.log('📦 Deploying Storage rules...');
exec('firebase deploy --only storage', (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Storage rules deployment failed:', error.message);
    console.log('💡 Try running: firebase login --no-localhost');
    return;
  }
  if (stderr) {
    console.error('⚠️ Storage stderr:', stderr);
  }
  console.log('✅ Storage rules deployed:', stdout);
});

console.log('🎯 Firebase fixes deployment initiated. Check console for results.');
