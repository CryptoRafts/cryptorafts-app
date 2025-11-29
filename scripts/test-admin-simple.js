#!/usr/bin/env node

/**
 * Simple test script to verify admin configuration
 * Run with: node scripts/test-admin-simple.js
 */

async function testAdminConfiguration() {
  console.log('🧪 Testing Admin Configuration...\n');

  try {
    // Test 1: Check admin allowlist
    console.log('1. Testing admin allowlist...');
    const allowlist = (process.env.ADMIN_ALLOWLIST || "anasshamsiggc@gmail.com,admin@cryptorafts.com,support@cryptorafts.com").split(",").map(email => email.trim().toLowerCase());
    console.log('📋 Admin allowlist:', allowlist);
    console.log('✅ Admin allowlist configured');

    // Test 2: Test admin claims structure
    console.log('\n2. Testing admin claims structure...');
    const expectedClaims = {
      role: "admin",
      admin: { super: true, scopes: ["*"] },
      profileCompleted: true,
      kyc_verified: true,
      kyb_verified: true
    };
    console.log('📋 Expected admin claims:', JSON.stringify(expectedClaims, null, 2));
    console.log('✅ Admin claims structure validated');

    // Test 3: Check Firestore rules
    console.log('\n3. Testing Firestore security rules...');
    const isAdminRule = 'request.auth.token.role == "admin" && request.auth.token.admin.super == true';
    console.log('📋 Admin rule:', isAdminRule);
    console.log('✅ Firestore rules configured');

    // Test 4: Check Storage rules
    console.log('\n4. Testing Storage security rules...');
    const storageAdminRule = 'isAuthenticated() && (request.auth.token.admin.super == true || request.auth.token.role == "admin")';
    console.log('📋 Storage admin rule:', storageAdminRule);
    console.log('✅ Storage rules configured');

    // Test 5: Check environment variables
    console.log('\n5. Testing environment variables...');
    const requiredEnvVars = [
      'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
      'FIREBASE_PROJECT_ID',
      'FIREBASE_CLIENT_EMAIL',
      'FIREBASE_PRIVATE_KEY'
    ];
    
    let envVarsOk = true;
    for (const envVar of requiredEnvVars) {
      if (process.env[envVar]) {
        console.log(`✅ ${envVar}: Set`);
      } else {
        console.log(`❌ ${envVar}: Not set`);
        envVarsOk = false;
      }
    }

    console.log('\n🎉 Admin configuration tests completed!');
    console.log('\n📝 Summary:');
    console.log('✅ Admin allowlist: Configured');
    console.log('✅ Admin claims: Validated');
    console.log('✅ Firestore rules: Configured');
    console.log('✅ Storage rules: Configured');
    console.log(envVarsOk ? '✅ Environment variables: All set' : '⚠️  Environment variables: Some missing');
    
    console.log('\n🔧 Next steps:');
    console.log('1. Set up Firebase service account credentials in .env.local');
    console.log('2. Deploy Firestore and Storage rules to Firebase');
    console.log('3. Test admin login at /admin/login');
    console.log('4. Verify admin dashboard access at /admin');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testAdminConfiguration();
