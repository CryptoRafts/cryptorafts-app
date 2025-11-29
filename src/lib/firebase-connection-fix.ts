"use client";

import { useEffect } from 'react';
import { app, auth, db } from '@/lib/firebase.client';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { errorHandler } from './firebase-error-handler';

const FirebaseConnectionFix = () => {
  useEffect(() => {
    const checkAndFixConnection = () => {
      if (!app || !auth || !db) {
        console.warn('⚠️ Firebase services not fully initialized. Attempting re-initialization...');
        try {
          // Attempt to re-initialize if services are null
          if (app) {
            getAuth(app);
            getFirestore(app);
            console.log('✅ Firebase services re-checked/re-initialized.');
          }
        } catch (error) {
          // Static method access
          if (typeof errorHandler !== 'undefined' && 'handleFirebaseError' in errorHandler) {
            (errorHandler as any).handleFirebaseError(error, 'Firebase Re-initialization');
          }
        }
      }
    };

    // Check on mount
    checkAndFixConnection();

    // Set up a periodic check (e.g., every 2 minutes)
    const intervalId = setInterval(checkAndFixConnection, 2 * 60 * 1000); // 2 minutes

    // Listen for auth state changes to ensure connection is active
    // Use ensureAuth to get a valid auth instance
    let unsubscribeAuth: (() => void) | null = null;
    
    const setupAuthListener = async () => {
      try {
        const { ensureAuth } = await import('@/lib/firebase-utils');
        const authInstance = ensureAuth();
        
        if (authInstance) {
          unsubscribeAuth = onAuthStateChanged(authInstance, (user) => {
            if (user) {
              console.log('✅ Auth state changed: User is logged in. Firebase connection active.');
            } else {
              console.log('ℹ️ Auth state changed: No user logged in. Firebase connection status updated.');
            }
          }, (error) => {
            if (typeof errorHandler !== 'undefined' && 'handleFirebaseError' in errorHandler) {
              (errorHandler as any).handleFirebaseError(error, 'Auth State Change Listener');
            }
          });
        }
      } catch (error) {
        // Auth not ready yet, skip listener setup
        console.warn('⚠️ Auth not ready for connection fix listener');
      }
    };
    
    setupAuthListener();

    return () => {
      clearInterval(intervalId);
      if (unsubscribeAuth) {
        unsubscribeAuth();
      }
    };
  }, []);

  return null; // This component doesn't render anything
};

export default FirebaseConnectionFix;
