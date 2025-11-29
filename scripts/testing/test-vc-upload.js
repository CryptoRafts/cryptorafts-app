// Test script to verify VC organization logo upload
// Run this in browser console after deploying storage rules

async function testVCLogoUpload() {
  console.log('🧪 Testing VC Logo Upload...');
  
  // Check if user is authenticated
  if (!firebase.auth().currentUser) {
    console.error('❌ No authenticated user found');
    return;
  }
  
  const user = firebase.auth().currentUser;
  console.log('✅ User authenticated:', user.uid);
  
  // Check user role
  const token = await user.getIdTokenResult();
  console.log('✅ User role:', token.claims.role);
  
  if (token.claims.role !== 'vc') {
    console.warn('⚠️ User is not a VC, but testing anyway...');
  }
  
  // Create a test file
  const testFile = new File(['test content'], 'test-logo.png', { type: 'image/png' });
  
  // Test upload to organizations/logos/ path
  try {
    console.log('📤 Testing upload to organizations/logos/...');
    const storageRef = firebase.storage().ref();
    const logoRef = storageRef.child(`organizations/logos/${user.uid}_${Date.now()}.png`);
    
    const uploadTask = await logoRef.put(testFile);
    console.log('✅ Upload successful!');
    console.log('📁 File path:', uploadTask.ref.fullPath);
    
    // Get download URL
    const downloadURL = await logoRef.getDownloadURL();
    console.log('🔗 Download URL:', downloadURL);
    
    // Clean up - delete the test file
    await logoRef.delete();
    console.log('🗑️ Test file cleaned up');
    
  } catch (error) {
    console.error('❌ Upload failed:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    if (error.code === 'storage/unauthorized') {
      console.error('🚨 STORAGE RULES NOT DEPLOYED!');
      console.error('Please deploy the storage rules to Firebase console');
    }
  }
}

// Auto-run if Firebase is available
if (typeof firebase !== 'undefined') {
  testVCLogoUpload();
} else {
  console.log('Firebase not loaded. Run this script in a page with Firebase SDK');
}
