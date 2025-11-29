#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Deploying Firestore Indexes...');

try {
  // Check if firebase CLI is installed
  try {
    execSync('firebase --version', { stdio: 'ignore' });
  } catch (error) {
    console.error('❌ Firebase CLI not found. Please install it first:');
    console.error('npm install -g firebase-tools');
    process.exit(1);
  }

  // Check if user is logged in
  try {
    execSync('firebase projects:list', { stdio: 'ignore' });
  } catch (error) {
    console.error('❌ Not logged in to Firebase. Please run:');
    console.error('firebase login');
    process.exit(1);
  }

  // Deploy indexes
  console.log('📊 Deploying Firestore indexes...');
  execSync('firebase deploy --only firestore:indexes', { stdio: 'inherit' });

  console.log('✅ Firestore indexes deployed successfully!');
  console.log('🎉 All database queries should now work properly.');

} catch (error) {
  console.error('❌ Error deploying indexes:', error.message);
  process.exit(1);
}
