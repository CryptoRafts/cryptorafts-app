import * as admin from "firebase-admin";
import * as fs from "fs";
import * as path from "path";

// Singleton Firebase Admin App
let adminApp: admin.app.App | null = null;

export function getAdminApp(): admin.app.App | null {
  if (adminApp) return adminApp;
  
  if (admin.apps.length > 0) {
    const existingApp = admin.apps[0];
    if (existingApp) {
      adminApp = existingApp;
      return adminApp;
    }
  }

  try {
    // Try Base64 encoded service account first (best for production)
    const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64;
    if (b64) {
      console.log('🔥 Initializing Firebase Admin with Base64 credentials');
      const json = Buffer.from(b64, "base64").toString("utf8");
      const creds = JSON.parse(json);
      
      // Skip if template file
      if (creds.private_key && creds.private_key.includes('REPLACE_ME')) {
        console.log('⚠️ Template credentials detected, skipping initialization');
        throw new Error('Firebase Admin credentials not configured. Please upload real service account.');
      }
      
      adminApp = admin.initializeApp({
        credential: admin.credential.cert(creds)
      });
      console.log('✅ Firebase Admin initialized with Base64 credentials');
      return adminApp;
    }

    // Try service account file (good for development)
    const serviceAccountPath = path.join(process.cwd(), 'secrets', 'service-account.json');
    if (fs.existsSync(serviceAccountPath)) {
      console.log('🔥 Initializing Firebase Admin with service account file');
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      
      // Skip if template file
      if (serviceAccount.private_key && serviceAccount.private_key.includes('REPLACE_ME')) {
        console.log('⚠️ Template service account detected, skipping');
        throw new Error('Service account is a template. Please download real credentials from Firebase Console.');
      }
      
      // Fix private key formatting if needed
      if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
      }
      
      adminApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log('✅ Firebase Admin initialized with service account file');
      return adminApp;
    }

    // Try individual environment variables
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    
    if (projectId && clientEmail && privateKey) {
      console.log('🔥 Initializing Firebase Admin with environment variables');
      
      // Skip if template
      if (privateKey.includes('REPLACE_ME')) {
        console.log('⚠️ Template private key detected');
        throw new Error('Private key is a template placeholder');
      }
      
      // Fix private key formatting - handle multiple formats
      // 1. Replace literal \n with actual newlines
      privateKey = privateKey.replace(/\\n/g, '\n');
      
      // 2. If it doesn't start with -----BEGIN, it might be encoded
      if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
        // Try to add the header/footer if missing
        if (!privateKey.startsWith('-----')) {
          privateKey = `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----`;
        }
      }
      
      // 3. Ensure proper line breaks
      privateKey = privateKey
        .replace(/-----BEGIN PRIVATE KEY-----\\n/g, '-----BEGIN PRIVATE KEY-----\n')
        .replace(/\\n-----END PRIVATE KEY-----/g, '\n-----END PRIVATE KEY-----')
        .replace(/\\n/g, '\n');
      
      console.log('🔑 Private key length:', privateKey.length);
      console.log('🔑 Has BEGIN marker:', privateKey.includes('-----BEGIN'));
      console.log('🔑 Has END marker:', privateKey.includes('-----END'));
      
      adminApp = admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey
        })
      });
      console.log('✅ Firebase Admin initialized with environment variables');
      return adminApp;
    }

    // If we get here, no credentials available
    console.log('⚠️ No Firebase Admin credentials found');
    console.log('⚠️ Please configure FIREBASE_SERVICE_ACCOUNT_B64 in Vercel');
    // Return null instead of throwing - let the caller handle it
    return null;
    
  } catch (error: any) {
    console.error('❌ Firebase Admin initialization failed:', error);
    // Don't throw during build - just log and return null
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      console.log('⚠️ Build phase detected - skipping Firebase Admin for now');
      return null;
    }
    // In production, return null instead of throwing
    console.error('❌ Firebase Admin initialization error:', error?.message || error);
    return null;
  }
}

export function getAdminDb() {
  try {
    const app = getAdminApp();
    if (!app) {
      throw new Error('Firebase Admin app not initialized');
    }
    return app.firestore();
  } catch (error: any) {
    console.error('❌ [FIREBASE ADMIN] Error getting Firestore:', error);
    throw new Error(`Firebase Admin Firestore unavailable: ${error.message}`);
  }
}

export function getAdminAuth() {
  try {
    const app = getAdminApp();
    if (!app) {
      throw new Error('Firebase Admin app not initialized');
    }
    return app.auth();
  } catch (error: any) {
    console.error('❌ [FIREBASE ADMIN] Error getting Auth:', error);
    throw new Error(`Firebase Admin Auth unavailable: ${error.message}`);
  }
}

export function getAdminStorage() {
  return getAdminApp().storage();
}

// Export FieldValue for convenience
export { FieldValue } from "firebase-admin/firestore";

