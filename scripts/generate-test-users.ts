/**
 * Generate Test Users for All Roles
 * 
 * This script creates test users for each role in the system.
 * Run this AFTER deploying Cloud Functions to ensure profiles are created correctly.
 * 
 * Usage:
 *   npm install -g tsx
 *   tsx scripts/generate-test-users.ts
 */

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "YOUR_AUTH_DOMAIN",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "cryptorafts-b9067",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "YOUR_STORAGE_BUCKET",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "YOUR_SENDER_ID",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Test users by role
const testUsers = [
  { email: 'admin@test.com', password: 'TestAdmin123!', role: 'admin', displayName: 'Test Admin' },
  { email: 'founder@test.com', password: 'TestFounder123!', role: 'founder', displayName: 'Test Founder' },
  { email: 'vc@test.com', password: 'TestVC123!', role: 'vc', displayName: 'Test VC' },
  { email: 'exchange@test.com', password: 'TestExchange123!', role: 'exchange', displayName: 'Test Exchange' },
  { email: 'ido@test.com', password: 'TestIDO123!', role: 'ido', displayName: 'Test IDO' },
  { email: 'influencer@test.com', password: 'TestInfluencer123!', role: 'influencer', displayName: 'Test Influencer' },
  { email: 'agency@test.com', password: 'TestAgency123!', role: 'agency', displayName: 'Test Agency' },
  { email: 'trader@test.com', password: 'TestTrader123!', role: 'trader', displayName: 'Test Trader' },
];

async function createTestUser(email: string, password: string, role: string, displayName: string) {
  try {
    console.log(`Creating user: ${email}...`);
    
    // Create user (Cloud Function will create profile with default role)
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;
    
    console.log(`✅ User created: ${email} (${uid})`);
    
    // Wait for Cloud Function to create profile (2 seconds)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Update profile with desired role (if not default trader)
    if (role !== 'trader') {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        role,
        displayName,
        status: 'active',
        isVerified: true,
        updatedAt: new Date(),
      });
      console.log(`✅ Role updated to: ${role}`);
    }
    
    // Sign out
    await signOut(auth);
    console.log(`✅ User signed out: ${email}\n`);
    
    return { success: true, uid, email, role };
  } catch (error: any) {
    if (error.code === 'auth/email-already-in-use') {
      console.log(`ℹ️  User already exists: ${email}\n`);
      return { success: false, error: 'already-exists' };
    }
    
    console.error(`❌ Error creating ${email}:`, error.message, '\n');
    return { success: false, error: error.message };
  }
}

async function generateAllTestUsers() {
  console.log('========================================');
  console.log('  GENERATING TEST USERS');
  console.log('========================================');
  console.log('');
  console.log('This script will create test users for all roles.');
  console.log('Make sure Cloud Functions are deployed first!');
  console.log('');
  
  const results = [];
  
  for (const user of testUsers) {
    const result = await createTestUser(user.email, user.password, user.role, user.displayName);
    results.push({ ...user, ...result });
    
    // Wait 1 second between users
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('========================================');
  console.log('  SUMMARY');
  console.log('========================================');
  console.log('');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Successfully created: ${successful.length} users`);
  if (failed.length > 0) {
    console.log(`❌ Failed: ${failed.length} users`);
  }
  
  console.log('');
  console.log('TEST ACCOUNTS:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  results.forEach(r => {
    if (r.success) {
      console.log(`${r.email.padEnd(25)} | ${r.password.padEnd(20)} | ${r.role}`);
    }
  });
  console.log('');
  
  console.log('NEXT STEPS:');
  console.log('1. Login with any test account');
  console.log('2. Verify custom claims are set (check dev console)');
  console.log('3. Test role-based access control');
  console.log('4. Verify security rules work for each role');
  console.log('');
  
  console.log('🎉 Test users generated successfully!');
}

// Run the script
generateAllTestUsers().catch(console.error);

