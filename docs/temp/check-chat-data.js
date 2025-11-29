// Diagnostic script to check Firebase data
const { initializeApp } = require('firebase/app');
const { getAuth, connectAuthEmulator } = require('firebase/auth');
const { getFirestore, collection, query, where, getDocs, limit } = require('firebase/firestore');

// Firebase config - Load from environment variables for security
// NEVER hardcode API keys or credentials in code
require('dotenv').config({ path: '.env.local' });

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "your_api_key_here",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "your_project.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "your_project_id",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "your_project.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "your_sender_id",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "your_app_id",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "your_measurement_id"
};

async function checkData() {
  console.log('🔍 Checking Firebase Data...\n');
  
  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  
  try {
    // Check groupChats collection
    console.log('📂 Checking groupChats collection...');
    const groupChatsRef = collection(db, 'groupChats');
    const groupChatsQuery = query(groupChatsRef, limit(10));
    const groupChatsSnapshot = await getDocs(groupChatsQuery);
    
    console.log(`   Found ${groupChatsSnapshot.size} chat rooms`);
    
    if (groupChatsSnapshot.empty) {
      console.log('   ⚠️  No chat rooms exist yet!');
      console.log('   ℹ️  This is normal if no projects have been accepted');
    } else {
      console.log('\n   Chat Rooms:');
      groupChatsSnapshot.forEach(doc => {
        const data = doc.data();
        console.log(`   - ${doc.id}`);
        console.log(`     Name: ${data.name || 'N/A'}`);
        console.log(`     Members: ${data.members?.join(', ') || 'N/A'}`);
        console.log(`     Status: ${data.status || 'N/A'}`);
        console.log(`     Type: ${data.type || 'N/A'}`);
        console.log('');
      });
    }
    
    // Check projects collection
    console.log('\n📊 Checking projects collection...');
    const projectsRef = collection(db, 'projects');
    const projectsQuery = query(projectsRef, limit(5));
    const projectsSnapshot = await getDocs(projectsQuery);
    
    console.log(`   Found ${projectsSnapshot.size} projects`);
    
    if (projectsSnapshot.empty) {
      console.log('   ⚠️  No projects exist yet!');
    } else {
      console.log('\n   Recent Projects:');
      projectsSnapshot.forEach(doc => {
        const data = doc.data();
        console.log(`   - ${doc.id}`);
        console.log(`     Title: ${data.title || data.name || 'N/A'}`);
        console.log(`     Founder: ${data.founderId || 'N/A'}`);
        console.log(`     Status: ${data.status || 'N/A'}`);
        console.log('');
      });
    }
    
    // Check users collection
    console.log('\n👥 Checking users collection...');
    const usersRef = collection(db, 'users');
    const usersQuery = query(usersRef, limit(5));
    const usersSnapshot = await getDocs(usersQuery);
    
    console.log(`   Found ${usersSnapshot.size} users (showing first 5)`);
    
    if (!usersSnapshot.empty) {
      console.log('\n   Sample Users:');
      usersSnapshot.forEach(doc => {
        const data = doc.data();
        console.log(`   - ${doc.id}`);
        console.log(`     Email: ${data.email || 'N/A'}`);
        console.log(`     Role: ${data.role || 'N/A'}`);
        console.log(`     Name: ${data.displayName || data.company_name || 'N/A'}`);
        console.log('');
      });
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📋 SUMMARY:');
    console.log('='.repeat(60));
    console.log(`✅ Firebase Connection: Working`);
    console.log(`📂 Chat Rooms: ${groupChatsSnapshot.size}`);
    console.log(`📊 Projects: ${projectsSnapshot.size}`);
    console.log(`👥 Users: ${usersSnapshot.size}+`);
    
    if (groupChatsSnapshot.empty) {
      console.log('\n🎯 TO CREATE CHAT ROOMS:');
      console.log('   1. Login as Founder → Submit a project');
      console.log('   2. Login as VC/Exchange/etc → Accept the project');
      console.log('   3. Chat room will be created automatically!');
    }
    
    console.log('\n✨ Script completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('   Full error:', error);
  }
  
  process.exit(0);
}

checkData();

