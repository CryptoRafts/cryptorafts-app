// Test Firebase Storage Rules Deployment
// Run this in browser console to check if rules are deployed

console.log('🧪 Testing Firebase Storage Rules...');

async function testStorageRules() {
  try {
    // Check if Firebase is available
    if (typeof firebase === 'undefined') {
      console.error('❌ Firebase SDK not loaded');
      return;
    }

    // Check if user is authenticated
    const user = firebase.auth().currentUser;
    if (!user) {
      console.error('❌ No authenticated user');
      return;
    }

    console.log('✅ User authenticated:', user.email);
    
    // Get user token to check role
    const token = await user.getIdTokenResult();
    console.log('✅ User role:', token.claims.role || 'No role');
    console.log('✅ User ID:', user.uid);

    // Test upload to organizations/logos/ path
    console.log('📤 Testing upload to organizations/logos/...');
    
    const testContent = 'test-logo-content';
    const testFile = new File([testContent], 'test-logo.png', { type: 'image/png' });
    
    const storageRef = firebase.storage().ref();
    const logoRef = storageRef.child(`organizations/logos/${user.uid}_test_${Date.now()}.png`);
    
    // Try upload
    const uploadTask = logoRef.put(testFile);
    
    uploadTask.on('state_changed', 
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log(`📤 Upload progress: ${progress.toFixed(2)}%`);
      },
      (error) => {
        console.error('❌ Upload failed:', error);
        console.error('Error code:', error.code);
        
        if (error.code === 'storage/unauthorized') {
          console.error('🚨 STORAGE RULES NOT DEPLOYED!');
          console.error('Please deploy the storage rules to Firebase console');
          console.error('Go to: https://console.firebase.google.com/');
          console.error('Project: cryptorafts-b9067');
          console.error('Storage → Rules');
        }
      },
      async () => {
        console.log('✅ Upload successful!');
        
        // Get download URL
        const downloadURL = await logoRef.getDownloadURL();
        console.log('🔗 Download URL:', downloadURL);
        
        // Clean up
        await logoRef.delete();
        console.log('🗑️ Test file cleaned up');
        
        console.log('🎉 STORAGE RULES ARE WORKING!');
      }
    );

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Auto-run the test
testStorageRules();
