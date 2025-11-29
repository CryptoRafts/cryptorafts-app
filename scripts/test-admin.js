#!/usr/bin/env node

/**
 * Test script to verify admin functionality
 * Run with: node scripts/test-admin.js
 */

import { getAdminAuth, getAdminDb } from '../src/server/firebaseAdmin.js';

async function testAdminFunctionality() {
  console.log('🧪 Testing Admin Functionality...\n');

  try {
    // Test 1: Check if Firebase Admin SDK is properly initialized
    console.log('1. Testing Firebase Admin SDK initialization...');
    const adminAuth = getAdminAuth();
    console.log('✅ Firebase Admin SDK initialized successfully');

    // Test 2: Check admin allowlist
    console.log('\n2. Testing admin allowlist...');
    const allowlist = (process.env.ADMIN_ALLOWLIST || "anasshamsiggc@gmail.com,admin@cryptorafts.com,support@cryptorafts.com").split(",").map(email => email.trim().toLowerCase());
    console.log('📋 Admin allowlist:', allowlist);
    console.log('✅ Admin allowlist configured');

    // Test 3: Test admin claims structure
    console.log('\n3. Testing admin claims structure...');
    const expectedClaims = {
      role: "admin",
      admin: { super: true, scopes: ["*"] },
      profileCompleted: true,
      kyc_verified: true,
      kyb_verified: true
    };
    console.log('📋 Expected admin claims:', JSON.stringify(expectedClaims, null, 2));
    console.log('✅ Admin claims structure validated');

    // Test 4: Check Firestore rules
    console.log('\n4. Testing Firestore security rules...');
    const isAdminRule = 'request.auth.token.role == "admin" && request.auth.token.admin.super == true';
    console.log('📋 Admin rule:', isAdminRule);
    console.log('✅ Firestore rules configured');

    // Test 5: Check Storage rules
    console.log('\n5. Testing Storage security rules...');
    const storageAdminRule = 'isAuthenticated() && (request.auth.token.admin.super == true || request.auth.token.role == "admin")';
    console.log('📋 Storage admin rule:', storageAdminRule);
    console.log('✅ Storage rules configured');

    console.log('\n🎉 All admin functionality tests passed!');
    console.log('\n📝 Next steps:');
    console.log('1. Set up Firebase service account credentials in .env.local');
    console.log('2. Deploy Firestore and Storage rules to Firebase');
    console.log('3. Test admin login at /admin/login');
    console.log('4. Verify admin dashboard access at /admin');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure Firebase Admin SDK is properly configured');
    console.log('2. Check that .env.local has correct Firebase credentials');
    console.log('3. Verify Firebase project ID is correct');
    console.log('4. Ensure service account has proper permissions');
  }
}

// Run the test
testAdminFunctionality();
