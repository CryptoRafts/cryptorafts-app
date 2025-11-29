/**
 * Comprehensive Firebase Utilities
 * Provides robust initialization, error handling, and retry logic for all Firebase operations
 */

import { db, storage, auth, getApp, getDb, getAuth, getStorage as getStorageInstance, getFirebaseServices as getFirebaseServicesFromClient } from './firebase.client';
import { getStorage as getFirebaseStorage } from 'firebase/storage';
import { Auth } from 'firebase/auth';
import { FirebaseConnectionManager } from './firebase-connection-manager';

export interface FirebaseServices {
  db: any;
  storage: any;
  auth: any;
}

/**
 * Get Firebase services with proper initialization and error handling
 */
export function getFirebaseServices(): FirebaseServices | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    // Use getAuth() and getDb() directly instead of lazy getters for proper initialization check
    const dbInstance = getDb();
    const storageInstance = getStorageInstance();
    const authInstance = getAuth();

    // Properly check if services are initialized (not just truthy)
    const isDbReady = dbInstance !== null && dbInstance !== undefined;
    const isStorageReady = storageInstance !== null && storageInstance !== undefined;
    const isAuthReady = authInstance !== null && authInstance !== undefined;

    if (!isDbReady || !isStorageReady || !isAuthReady) {
      // Don't spam console - suppress warning to reduce noise
      // Services will initialize when needed
      return null;
    }

    return {
      db: dbInstance,
      storage: storageInstance,
      auth: authInstance
    };
  } catch (error) {
    console.error('❌ Error getting Firebase services:', error);
    return null;
  }
}

/**
 * Ensure Firebase DB is initialized
 */
export function ensureDb(): any {
  const dbInstance = getDb();
  if (!dbInstance) {
    throw new Error('Firebase database not initialized. Please refresh the page.');
  }
  return dbInstance;
}

/**
 * Ensure Firebase Storage is initialized
 */
export function ensureStorage(): any {
  if (typeof window === 'undefined') {
    throw new Error('Storage is only available in the browser.');
  }

  // Try to get storage from the lazy getter first
  let storageInstance = getStorageInstance();
  
  // If null, try to get it from Firebase app
  if (!storageInstance) {
    const app = getApp();
    if (!app) {
      // Try to initialize Firebase services
      const services = getFirebaseServices();
      if (services && services.storage) {
        return services.storage;
      }
      throw new Error('Firebase app not initialized. Please refresh the page.');
    }
    
    try {
      storageInstance = getFirebaseStorage(app);
    } catch (error) {
      console.error('Error getting storage from app:', error);
      // Try one more time with services
      const services = getFirebaseServices();
      if (services && services.storage) {
        return services.storage;
      }
      throw new Error('Firebase storage not initialized. Please refresh the page.');
    }
  }
  
  if (!storageInstance) {
    // Last resort: try to get from services
    const services = getFirebaseServices();
    if (services && services.storage) {
      return services.storage;
    }
    throw new Error('Firebase storage not initialized. Please refresh the page.');
  }
  
  return storageInstance;
}

/**
 * Ensure Firebase Auth is initialized
 */
export function ensureAuth(): Auth {
  const authInstance = getAuth();
  if (!authInstance) {
    throw new Error('Firebase auth not initialized. Please refresh the page.');
  }
  return authInstance;
}

/**
 * Safe Firebase operation wrapper with retry logic
 */
export async function safeFirebaseOperation<T>(
  operation: () => Promise<T>,
  operationName: string = 'Firebase operation',
  retries: number = 3
): Promise<T> {
  return FirebaseConnectionManager.executeWithRetry(operation, operationName, retries);
}

/**
 * Check if Firebase is properly initialized
 */
export function isFirebaseInitialized(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const services = getFirebaseServices();
    return services !== null && 
           services.db !== null && 
           services.storage !== null && 
           services.auth !== null;
  } catch {
    return false;
  }
}

/**
 * Wait for Firebase to be initialized (with timeout)
 */
// OPTIMIZED: Faster Firebase initialization with reduced default timeout
export async function waitForFirebase(timeout: number = 5000): Promise<boolean> {
  if (typeof window === 'undefined') {
    return false;
  }
  
  const startTime = Date.now();
  const checkInterval = 50; // Check every 50ms (faster)
  
  // FIXED: Force Firebase initialization IMMEDIATELY and aggressively
  try {
    // Trigger initialization by accessing services - use CLIENT version to trigger initialization
    const clientServices = getFirebaseServicesFromClient();
    // FIXED: Storage is optional for read operations - only require db and auth
    if (clientServices && clientServices.db && clientServices.auth) {
      console.log('✅ Firebase already initialized (db + auth ready)');
      return true; // Already initialized
    }
    
    // Force initialization multiple times to ensure it happens
    console.log('🔄 Forcing Firebase initialization...');
    getFirebaseServicesFromClient(); // This will trigger initializeFirebase()
    getDb();
    getAuth();
    getStorageInstance();
    
    // OPTIMIZED: Reduced wait time for faster initialization
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Check again after wait - use both client and utils versions
    const clientServicesAfterWait = getFirebaseServicesFromClient();
    const utilsServicesAfterWait = getFirebaseServices();
    
    // FIXED: Storage is optional for read operations - only require db and auth
    if (clientServicesAfterWait && clientServicesAfterWait.db && clientServicesAfterWait.auth) {
      console.log('✅ Firebase initialized after wait (client check - db + auth ready)');
      return true;
    }
    
    if (utilsServicesAfterWait && utilsServicesAfterWait.db && utilsServicesAfterWait.auth) {
      console.log('✅ Firebase initialized after wait (utils check - db + auth ready)');
      return true;
    }
  } catch (error) {
    console.warn('⚠️ Firebase init attempt failed, will retry:', error);
    // Continue - Firebase might still initialize
  }
  
  // FIXED: More aggressive polling with faster checks
  let lastCheckTime = Date.now();
  while (Date.now() - startTime < timeout) {
    try {
      // Force initialization check on each iteration - use CLIENT version
      const clientServices = getFirebaseServicesFromClient();
      const utilsServices = getFirebaseServices();
      const dbInstance = getDb();
      const authInstance = getAuth();
      const storageInstance = getStorageInstance();
      
      // FIXED: Storage is optional for read operations - only require db and auth
      const clientReady = clientServices && clientServices.db && clientServices.auth; // Removed storage requirement
      const utilsReady = utilsServices && utilsServices.db && utilsServices.auth; // Removed storage requirement
      const directReady = dbInstance && authInstance; // Removed storageInstance requirement
      
      if (clientReady || (utilsReady && directReady)) {
        console.log('✅ Firebase initialized successfully (db + auth ready, storage optional)');
        return true; // Early exit when ready
      }
      
      // If we've been waiting a while, try to force initialization again
      if (Date.now() - lastCheckTime > 1000) {
        lastCheckTime = Date.now();
        try {
          getFirebaseServicesFromClient(); // Force client initialization
          getDb();
          getAuth();
          getStorageInstance();
        } catch {
          // Continue
        }
      }
    } catch (error) {
      // Continue waiting - Firebase might still be initializing
    }
    
    await new Promise(resolve => setTimeout(resolve, checkInterval));
  }
  
  // Final check with error handling
  try {
    const clientServices = getFirebaseServicesFromClient();
    const utilsServices = getFirebaseServices();
    const dbInstance = getDb();
    const authInstance = getAuth();
    const storageInstance = getStorageInstance();
    
    // FIXED: Storage is optional for read operations - only require db and auth
    const clientReady = clientServices && clientServices.db && clientServices.auth; // Removed storage requirement
    const utilsReady = utilsServices && utilsServices.db && utilsServices.auth; // Removed storage requirement
    const directReady = dbInstance && authInstance; // Removed storageInstance requirement
    
    const isReady = clientReady || (utilsReady && directReady);
    
    if (isReady) {
      console.log('✅ Firebase initialized on final check (db + auth ready, storage optional)');
    } else {
      console.warn('⚠️ Firebase initialization timeout - services not ready', {
        clientReady,
        utilsReady,
        directReady,
        hasDb: !!dbInstance,
        hasAuth: !!authInstance,
        hasStorage: !!storageInstance
      });
    }
    
    return isReady;
  } catch (error) {
    console.warn('⚠️ Firebase final check failed:', error);
    return false;
  }
}

/**
 * Get user document with proper error handling
 */
export async function getUserDocument(userId: string): Promise<any | null> {
  try {
    const dbInstance = ensureDb();
    const { doc, getDoc } = await import('firebase/firestore');
    const userDoc = await getDoc(doc(dbInstance, 'users', userId));
    return userDoc.exists() ? userDoc.data() : null;
  } catch (error) {
    console.error(`❌ Error getting user document for ${userId}:`, error);
    return null;
  }
}

/**
 * Update user document with proper error handling
 */
export async function updateUserDocument(
  userId: string, 
  updates: any
): Promise<void> {
  try {
    const dbInstance = ensureDb();
    const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
    
    await safeFirebaseOperation(
      () => updateDoc(doc(dbInstance, 'users', userId), {
        ...updates,
        updatedAt: serverTimestamp()
      }),
      'Update user document'
    );
  } catch (error) {
    console.error(`❌ Error updating user document for ${userId}:`, error);
    throw error;
  }
}

/**
 * Upload file to Firebase Storage with proper error handling
 */
export async function uploadFile(
  file: File,
  path: string,
  userId?: string
): Promise<string> {
  try {
    const storageInstance = ensureStorage();
    const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
    
    const fullPath = userId ? `${path}/${userId}/${Date.now()}_${file.name}` : `${path}/${Date.now()}_${file.name}`;
    const storageRef = ref(storageInstance, fullPath);
    
    await safeFirebaseOperation(
      () => uploadBytes(storageRef, file),
      'Upload file'
    );
    
    return await safeFirebaseOperation(
      () => getDownloadURL(storageRef),
      'Get download URL'
    );
  } catch (error) {
    console.error(`❌ Error uploading file:`, error);
    throw error;
  }
}

/**
 * Create document with proper error handling
 */
export async function createDocument(
  collection: string,
  data: any,
  docId?: string
): Promise<string> {
  try {
    const dbInstance = ensureDb();
    const { doc, setDoc, addDoc, collection: collectionFn, serverTimestamp } = await import('firebase/firestore');
    
    const dataWithTimestamp = {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    if (docId) {
      await safeFirebaseOperation(
        () => setDoc(doc(dbInstance, collection, docId), dataWithTimestamp),
        `Create document in ${collection}`
      );
      return docId;
    } else {
      const docRef = await safeFirebaseOperation(
        () => addDoc(collectionFn(dbInstance, collection), dataWithTimestamp),
        `Create document in ${collection}`
      );
      return docRef.id;
    }
  } catch (error) {
    console.error(`❌ Error creating document in ${collection}:`, error);
    throw error;
  }
}

/**
 * Update document with proper error handling
 */
export async function updateDocument(
  collection: string,
  docId: string,
  updates: any
): Promise<void> {
  try {
    const dbInstance = ensureDb();
    const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
    
    await safeFirebaseOperation(
      () => updateDoc(doc(dbInstance, collection, docId), {
        ...updates,
        updatedAt: serverTimestamp()
      }),
      `Update document in ${collection}`
    );
  } catch (error) {
    console.error(`❌ Error updating document in ${collection}:`, error);
    throw error;
  }
}

/**
 * Get document with proper error handling
 */
export async function getDocument(
  collection: string,
  docId: string
): Promise<any | null> {
  try {
    const dbInstance = ensureDb();
    const { doc, getDoc } = await import('firebase/firestore');
    
    const docRef = await safeFirebaseOperation(
      () => getDoc(doc(dbInstance, collection, docId)),
      `Get document from ${collection}`
    );
    
    return docRef.exists() ? docRef.data() : null;
  } catch (error) {
    console.error(`❌ Error getting document from ${collection}:`, error);
    return null;
  }
}

/**
 * Query collection with proper error handling
 */
export async function queryCollection(
  collection: string,
  queryFn?: (collectionRef: any) => any
): Promise<any[]> {
  try {
    const dbInstance = ensureDb();
    const { collection: collectionFn, getDocs, query } = await import('firebase/firestore');
    
    const collectionRef = collectionFn(dbInstance, collection);
    const q = queryFn ? queryFn(collectionRef) : collectionRef;
    
    const snapshot = await safeFirebaseOperation(
      () => getDocs(q),
      `Query collection ${collection}`
    );
    
    return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error(`❌ Error querying collection ${collection}:`, error);
    return [];
  }
}

/**
 * Delete document with proper error handling
 */
export async function deleteDocument(
  collection: string,
  docId: string
): Promise<void> {
  try {
    const dbInstance = ensureDb();
    const { doc, deleteDoc } = await import('firebase/firestore');
    
    await safeFirebaseOperation(
      () => deleteDoc(doc(dbInstance, collection, docId)),
      `Delete document from ${collection}`
    );
  } catch (error) {
    console.error(`❌ Error deleting document from ${collection}:`, error);
    throw error;
  }
}

/**
 * Check if error is a Firestore internal assertion error that should be suppressed
 */
export function isFirestoreInternalError(error: any): boolean {
  const errorMessage = error?.message || String(error);
  return errorMessage.includes('FIRESTORE') && 
         errorMessage.includes('INTERNAL ASSERTION FAILED') &&
         (errorMessage.includes('Unexpected state') || 
          errorMessage.includes('ID: ca9') || 
          errorMessage.includes('ID: b815'));
}

/**
 * Create an error handler for onSnapshot that suppresses internal Firestore errors
 */
export function createSnapshotErrorHandler(context: string = 'Firestore listener'): (error: any) => void {
  return (error: any) => {
    if (isFirestoreInternalError(error)) {
      // Silently suppress - these are internal SDK errors
      return;
    }
    console.error(`❌ Error in ${context}:`, error);
  };
}

