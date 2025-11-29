#!/usr/bin/env node

/**
 * Force Firebase Storage Rules Deployment
 * This script will deploy storage rules using Firebase Admin SDK
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, 'secrets', 'service-account.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ Service account file not found at:', serviceAccountPath);
  console.error('Please ensure the service account JSON file exists');
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'cryptorafts-b9067.appspot.com'
});

async function deployStorageRules() {
  try {
    console.log('🚀 Starting Firebase Storage Rules deployment...');
    
    // Read the storage rules file
    const rulesPath = path.join(__dirname, 'storage.rules');
    const rulesContent = fs.readFileSync(rulesPath, 'utf8');
    
    console.log('📄 Rules content:');
    console.log(rulesContent);
    console.log('\n');
    
    // Get the storage bucket
    const bucket = admin.storage().bucket();
    const bucketName = bucket.name;
    
    console.log(`📦 Deploying to bucket: ${bucketName}`);
    
    // Note: Firebase Admin SDK doesn't have direct storage rules deployment
    // We need to use the Firebase CLI or REST API
    
    console.log('⚠️  Firebase Admin SDK cannot deploy storage rules directly');
    console.log('📋 Please deploy manually using Firebase Console:');
    console.log('');
    console.log('1. Go to: https://console.firebase.google.com/');
    console.log('2. Select project: cryptorafts-b9067');
    console.log('3. Navigate to Storage → Rules');
    console.log('4. Copy and paste this rule:');
    console.log('');
    console.log('```javascript');
    console.log(rulesContent);
    console.log('```');
    console.log('');
    console.log('5. Click "Publish"');
    console.log('');
    
    // Test if we can access the bucket
    try {
      const [files] = await bucket.getFiles({ maxResults: 1 });
      console.log('✅ Storage bucket access confirmed');
      console.log(`📁 Bucket has ${files.length} files (showing first 1)`);
    } catch (error) {
      console.error('❌ Cannot access storage bucket:', error.message);
    }
    
    console.log('🎯 Next steps:');
    console.log('1. Deploy the storage rules manually');
    console.log('2. Test VC onboarding with logo upload');
    console.log('3. Verify no more 403 errors');
    
  } catch (error) {
    console.error('❌ Deployment failed:', error);
  } finally {
    process.exit(0);
  }
}

// Run the deployment
deployStorageRules();
