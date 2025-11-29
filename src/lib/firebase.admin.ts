import "server-only";
import * as admin from "firebase-admin";

let app: admin.app.App | undefined;

function initializeAdmin() {
  if (app) {
    return app;
  }

  if (!admin.apps.length) {
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
    
    // Skip initialization during build if credentials are not available
    if (!clientEmail || !privateKey) {
      console.warn('Firebase Admin credentials not found. Skipping initialization during build.');
      return null as any;
    }
    
    app = admin.initializeApp({
      credential: admin.credential.cert({ 
        projectId, 
        clientEmail, 
        privateKey: privateKey.replace(/\\n/g, "\n") 
      }),
      projectId,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
    });
  } else {
    app = admin.app();
  }

  return app;
}

// Initialize and export services
const adminApp = initializeAdmin();
export const adminAuth = adminApp?.auth();
export const adminDb = adminApp?.firestore();
export const adminStorage = adminApp?.storage();
