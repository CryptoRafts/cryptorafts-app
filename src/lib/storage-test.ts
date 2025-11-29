// Storage Test Utility
import { storage } from './firebase.client';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export async function testStorageUpload() {
  try {
    console.log('Testing storage upload...');
    
    // Create a simple test file
    const testContent = 'This is a test file for KYC upload debugging';
    const testBlob = new Blob([testContent], { type: 'text/plain' });
    
    // Try to upload to kyc-documents path
    const testRef = ref(storage, 'kyc-documents/test-upload.txt');
    console.log('Upload reference:', testRef.fullPath);
    
    const snapshot = await uploadBytes(testRef, testBlob);
    console.log('Upload successful:', snapshot);
    
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('Download URL:', downloadURL);
    
    return { success: true, downloadURL };
  } catch (error) {
    console.error('Storage test failed:', error);
    return { success: false, error };
  }
}

export async function testStorageAccess() {
  try {
    console.log('Testing storage access...');
    
    // Check if we can create a reference
    const testRef = ref(storage, 'kyc-documents/access-test.txt');
    console.log('Storage reference created:', testRef.fullPath);
    console.log('Storage bucket:', testRef.bucket);
    
    return { success: true, bucket: testRef.bucket };
  } catch (error) {
    console.error('Storage access test failed:', error);
    return { success: false, error };
  }
}
