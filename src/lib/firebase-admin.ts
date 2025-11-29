// src/lib/firebase-admin.ts
// Firebase Admin SDK Configuration

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK
const apps = getApps();

let app;
if (apps.length === 0) {
  // Check if we have the required credentials
  const hasCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS || 
                        (process.env.FIREBASE_ADMIN_CLIENT_EMAIL && process.env.FIREBASE_ADMIN_PRIVATE_KEY);
  
  if (!hasCredentials) {
    console.warn('Firebase Admin credentials not found. Skipping initialization during build.');
    app = null;
  } else {
    // Initialize with available credentials
    app = initializeApp({
      credential: process.env.GOOGLE_APPLICATION_CREDENTIALS 
        ? cert(process.env.GOOGLE_APPLICATION_CREDENTIALS)
        : cert({
            projectId: process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n')
          }),
    });
  }
} else {
  app = apps[0];
}

// Export Firebase Admin services
export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;

export default app;
