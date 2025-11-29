/**
 * Set Admin Custom Claims for anasshamsiggc@gmail.com
 * 
 * This script sets Firebase custom claims for the admin user
 * to ensure they have full access to all Firestore collections.
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('./secrets/service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const auth = admin.auth();
const db = admin.firestore();

async function setAdminClaims() {
  const adminEmail = 'anasshamsiggc@gmail.com';
  
  try {
    console.log(`🔍 Looking for user: ${adminEmail}`);
    
    // Get user by email
    const user = await auth.getUserByEmail(adminEmail);
    console.log(`✅ Found user: ${user.uid}`);
    
    // Set custom claims
    await auth.setCustomUserClaims(user.uid, {
      role: 'admin',
      admin: true,
      super: true
    });
    console.log(`✅ Custom claims set successfully!`);
    
    // Update Firestore user document
    await db.collection('users').doc(user.uid).set({
      role: 'admin',
      admin: true,
      email: adminEmail,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    console.log(`✅ Firestore user document updated!`);
    
    // Verify claims
    const userRecord = await auth.getUser(user.uid);
    console.log(`\n📋 Current custom claims:`);
    console.log(JSON.stringify(userRecord.customClaims, null, 2));
    
    console.log(`\n🎉 SUCCESS! Admin claims set for ${adminEmail}`);
    console.log(`\n⚠️  IMPORTANT: User must sign out and sign in again for claims to take effect!`);
    
    process.exit(0);
  } catch (error) {
    console.error(`❌ Error:`, error);
    process.exit(1);
  }
}

setAdminClaims();

