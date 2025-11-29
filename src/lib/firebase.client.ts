import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { errorHandler } from './firebase-error-handler';
import { SimpleFirestoreFix } from './simple-firestore-fix';
import { 
  getAuth as getFirebaseAuth, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendEmailVerification,
  setPersistence,
  browserLocalPersistence,
  getIdToken,
  Auth
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  addDoc, 
  deleteDoc,
  limit,
  serverTimestamp,
  orderBy,
  getDocs,
  Firestore,
  enableNetwork
} from 'firebase/firestore';
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL,
  FirebaseStorage 
} from 'firebase/storage';

// Firebase configuration - Clean all values to remove whitespace/newlines/quotes
const cleanEnvVar = (value: string | undefined, fallback: string): string => {
  // Remove quotes, whitespace, and newlines
  const cleaned = (value || fallback).trim().replace(/[\r\n]/g, '').replace(/^["']|["']$/g, '');
  return cleaned;
};

// Main Firebase Configuration - Using correct credentials
let firebaseConfig = {
  apiKey: "AIzaSyAo2aRQPZU5naLm4bFCDbqTA1gNW8oFB14",
  authDomain: "cryptorafts-b9067.firebaseapp.com",
  databaseURL: "https://cryptorafts-b9067-default-rtdb.firebaseio.com",
  projectId: "cryptorafts-b9067",
  storageBucket: "cryptorafts-b9067.firebasestorage.app",
  messagingSenderId: "374711838796",
  appId: "1:374711838796:web:3bee725bfa7d8790456ce9",
  measurementId: "G-ZRQ955RGWH"
};

// Allow environment variables to override if needed (but use correct defaults)
if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
  firebaseConfig.apiKey = cleanEnvVar(process.env.NEXT_PUBLIC_FIREBASE_API_KEY, firebaseConfig.apiKey);
}
if (process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN) {
  firebaseConfig.authDomain = cleanEnvVar(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, firebaseConfig.authDomain);
}
if (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
  firebaseConfig.projectId = cleanEnvVar(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID, firebaseConfig.projectId);
}
if (process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET) {
  firebaseConfig.storageBucket = cleanEnvVar(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET, firebaseConfig.storageBucket);
}
if (process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID) {
  firebaseConfig.messagingSenderId = cleanEnvVar(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID, firebaseConfig.messagingSenderId);
}
if (process.env.NEXT_PUBLIC_FIREBASE_APP_ID) {
  firebaseConfig.appId = cleanEnvVar(process.env.NEXT_PUBLIC_FIREBASE_APP_ID, firebaseConfig.appId);
}
if (process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID) {
  firebaseConfig.measurementId = cleanEnvVar(process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, firebaseConfig.measurementId);
}
if (process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL) {
  firebaseConfig.databaseURL = cleanEnvVar(process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL, firebaseConfig.databaseURL);
}

// Singleton Firebase App - ensures exactly one app instance
let firebaseApp: FirebaseApp | null = null;
let firebaseAuth: Auth | null = null;
let firestoreDb: Firestore | null = null;
let firebaseStorage: FirebaseStorage | null = null;
let isInitialized = false;
let isInitializing = false; // Prevent recursive initialization

// OPTIMIZED: Faster Firebase initialization
function initializeFirebase() {
  // Return null values for server-side rendering
  if (typeof window === 'undefined') {
    return { 
      app: null, 
      auth: null, 
      db: null, 
      storage: null 
    };
  }

  // OPTIMIZED: Quick check for already initialized
  if (isInitialized && firebaseApp && firebaseAuth && firestoreDb && firebaseStorage) {
    return { 
      app: firebaseApp, 
      auth: firebaseAuth, 
      db: firestoreDb, 
      storage: firebaseStorage
    };
  }
  
  // OPTIMIZED: Prevent recursion with quick return
  if (isInitializing) {
    if (firebaseApp && firebaseAuth && firestoreDb && firebaseStorage) {
      return {
        app: firebaseApp,
        auth: firebaseAuth,
        db: firestoreDb,
        storage: firebaseStorage
      };
    }
    return { app: null, auth: null, db: null, storage: null };
  }
  
  isInitializing = true;

  // Ensure Firebase config is correct - always use the main Firebase project
  // Validate that we're using the correct Firebase project
  const correctProjectId = "cryptorafts-b9067";
  if (!firebaseConfig.apiKey || 
      firebaseConfig.apiKey === "placeholder_api_key" || 
      firebaseConfig.projectId !== correctProjectId) {
    // Always use correct Firebase config - ensure clean values
    console.log('✅ Using correct Firebase configuration for cryptorafts-b9067');
    firebaseConfig = {
      apiKey: "AIzaSyAo2aRQPZU5naLm4bFCDbqTA1gNW8oFB14".trim(),
      authDomain: "cryptorafts-b9067.firebaseapp.com".trim(),
      databaseURL: "https://cryptorafts-b9067-default-rtdb.firebaseio.com".trim(),
      projectId: correctProjectId.trim(),
      storageBucket: "cryptorafts-b9067.firebasestorage.app".trim(),
      messagingSenderId: "374711838796".trim(),
      appId: "1:374711838796:web:3bee725bfa7d8790456ce9".trim(),
      measurementId: "G-ZRQ955RGWH".trim()
    };
  }

  // Validate and clean Firebase config before initialization
  // Remove any quotes from API key (common issue with env vars)
  if (firebaseConfig.apiKey) {
    firebaseConfig.apiKey = firebaseConfig.apiKey.replace(/^["']|["']$/g, '').trim();
  }
  
  if (!firebaseConfig.authDomain || firebaseConfig.authDomain.includes('\n') || firebaseConfig.authDomain.includes('\r')) {
    console.error('❌ Invalid authDomain detected:', firebaseConfig.authDomain);
    // Force clean authDomain
    firebaseConfig.authDomain = "cryptorafts-b9067.firebaseapp.com";
    console.log('✅ Fixed authDomain to:', firebaseConfig.authDomain);
  }
  
  // Validate API key format (should not have quotes)
  if (firebaseConfig.apiKey && (firebaseConfig.apiKey.startsWith('"') || firebaseConfig.apiKey.startsWith("'"))) {
    console.warn('⚠️ API key has quotes, removing them...');
    firebaseConfig.apiKey = firebaseConfig.apiKey.replace(/^["']|["']$/g, '').trim();
  }
  
  // OPTIMIZED: Reduced logging for faster initialization
  // Only log critical errors, not config details

  // Check if app already exists (prevent duplicate initialization)
  const existingApps = getApps();
  if (existingApps.length > 0) {
    firebaseApp = existingApps[0];
  } else {
    firebaseApp = initializeApp(firebaseConfig);
  }

  // Initialize services only once
  firebaseAuth = getFirebaseAuth(firebaseApp);
  firestoreDb = getFirestore(firebaseApp);
  firebaseStorage = getStorage(firebaseApp);
  
  // FIXED: Verify Firestore is actually ready
  if (firestoreDb && typeof window !== 'undefined') {
    try {
      // Enable network immediately
      enableNetwork(firestoreDb).then(() => {
        console.log('✅ Firestore network enabled during initialization');
      }).catch((error) => {
        console.warn('⚠️ Firestore network enable failed during init:', error);
      });
    } catch (error) {
      console.warn('⚠️ Firestore network enable error during init:', error);
    }
  }

  // OPTIMIZED: Set persistence without blocking
  if (firebaseAuth) {
    setPersistence(firebaseAuth, browserLocalPersistence).catch(() => {
      // Silently fail - auth will work without persistence
    });
  }

  // OPTIMIZED: Initialize Firestore monitoring without blocking
  if (typeof window !== 'undefined') {
    try {
      SimpleFirestoreFix.initialize();
    } catch {
      // Silently fail - monitoring is optional
    }
  }

  // Network is already enabled above during initialization

  // FIXED: Mark as initialized if core services (db + auth) are ready - storage is optional
  if (firebaseApp && firebaseAuth && firestoreDb) {
    isInitialized = true;
    if (firebaseStorage) {
      console.log('✅ Firebase fully initialized with all services (db + auth + storage)');
    } else {
      console.log('✅ Firebase initialized with core services (db + auth) - storage will initialize when needed');
    }
  } else {
    console.warn('⚠️ Firebase initialization incomplete:', {
      hasApp: !!firebaseApp,
      hasAuth: !!firebaseAuth,
      hasDb: !!firestoreDb,
      hasStorage: !!firebaseStorage
    });
    // Still mark as initialized to prevent infinite retries if core services are ready
    if (firebaseApp && firebaseAuth && firestoreDb) {
      isInitialized = true;
    }
  }
  
  isInitializing = false;

  return { 
    app: firebaseApp, 
    auth: firebaseAuth, 
    db: firestoreDb, 
    storage: firebaseStorage 
  };
}

// Lazy initialization - only initialize when actually used (client-side)
let firebaseServices: ReturnType<typeof initializeFirebase> | null = null;

// Export function to reset services (for testing/debugging)
export function resetFirebaseServices() {
  firebaseServices = null;
  isInitialized = false;
  isInitializing = false;
}

export function getFirebaseServices() {
  // If already initialized, return immediately (storage is optional)
  if (isInitialized && firebaseServices && firebaseServices.app && firebaseServices.auth && firebaseServices.db) {
    return firebaseServices;
  }
  
  // Prevent multiple simultaneous initialization attempts
  if (isInitializing) {
    // Wait a bit and check again if services are ready
    if (firebaseApp && firebaseAuth && firestoreDb && firebaseStorage) {
      return {
        app: firebaseApp,
        auth: firebaseAuth,
        db: firestoreDb,
        storage: firebaseStorage
      };
    }
    // If still initializing, return what we have (don't return null)
    if (firebaseApp) {
      return {
        app: firebaseApp,
        auth: firebaseAuth || null,
        db: firestoreDb || null,
        storage: firebaseStorage || null
      };
    }
    // Return null services only if we have nothing
    return { app: null, auth: null, db: null, storage: null };
  }
  
  // Initialize synchronously
  try {
    firebaseServices = initializeFirebase();
    // Verify initialization succeeded (storage is optional)
    if (firebaseServices && firebaseServices.app && firebaseServices.db && firebaseServices.auth) {
      if (firebaseServices.storage) {
        console.log('✅ Firebase services initialized successfully (all services)');
      } else {
        console.log('✅ Firebase services initialized successfully (db + auth, storage will init when needed)');
      }
    } else {
      console.warn('⚠️ Firebase initialization returned incomplete services:', {
        hasApp: !!firebaseServices?.app,
        hasDb: !!firebaseServices?.db,
        hasAuth: !!firebaseServices?.auth,
        hasStorage: !!firebaseServices?.storage
      });
    }
    return firebaseServices;
  } catch (error) {
    isInitializing = false;
    isInitialized = false;
    console.error('❌ Firebase initialization failed:', error);
    // Return null services on error
    const nullServices = { app: null, auth: null, db: null, storage: null };
    firebaseServices = nullServices;
    return nullServices;
  }
}

// Export getter functions for lazy initialization - safe for SSR and build
export function getApp() {
  return typeof window !== 'undefined' ? getFirebaseServices().app : null;
}

// Note: getAuth() and getDb() are exported later after their initializers are defined

export function getStorage() {
  if (typeof window === 'undefined') return null;
  
  try {
    const services = getFirebaseServices();
    return services?.storage || null;
  } catch (error) {
    console.error('❌ Error getting storage:', error);
    return null;
  }
}

// Export lazy getters using Proxy - only initialize when accessed
// This prevents stack overflow by avoiding immediate initialization at module load

// Create a lazy getter that only initializes when accessed
function createLazyGetter<T>(initializer: () => T | null): T | null {
  if (typeof window === 'undefined') return null;
  
  let cached: T | null = undefined as any;
  let isInitialized = false;
  
  const initialize = () => {
    if (!isInitialized) {
      try {
        cached = initializer();
        isInitialized = true;
      } catch (error) {
        console.error('❌ Lazy getter initialization error:', error);
        cached = null;
        isInitialized = true;
      }
    }
    return cached;
  };
  
  return new Proxy({} as T, {
    get: (_target, prop) => {
      const value = initialize();
      if (value === null) return null;
      // Special handling for Symbol.toPrimitive
      if (prop === Symbol.toPrimitive) {
        return () => value;
      }
      return (value as any)[prop];
    },
    // For direct usage (like passing to functions)
    valueOf: () => initialize(),
    toString: () => {
      const value = initialize();
      return value === null ? 'null' : String(value);
    },
    // For Symbol.toPrimitive (used by some operations)
    [Symbol.toPrimitive]: () => initialize(),
  }) as T | null;
}

// Export lazy getters - these only initialize when accessed
export const app = createLazyGetter(() => getFirebaseServices().app);

// Export db - initialize lazily on client side only
// This ensures Firebase's collection() function works correctly
// IMPORTANT: db must be a real Firestore instance, not a Proxy
let _dbInstance: Firestore | null = null;

function initializeDb(): Firestore | null {
  if (typeof window === 'undefined') return null;
  if (_dbInstance) return _dbInstance;
  
  try {
    // Directly get db from initialized services
    if (isInitialized && firestoreDb) {
      _dbInstance = firestoreDb;
      return _dbInstance;
    }
    
    // If not initialized, try to initialize
    const services = getFirebaseServices();
    _dbInstance = services?.db || null;
    return _dbInstance;
  } catch (error) {
    console.error('❌ Error initializing db:', error);
    return null;
  }
}

// Export db as a function that returns the actual Firestore instance
// This ensures Firebase's collection() function works correctly
// CRITICAL: collection() requires a real Firestore instance, not a Proxy
export function getDb(): Firestore | null {
  return initializeDb();
}

// FIXED: Initialize Firebase early on client-side
// Export db as a direct reference - initialized on first access
// This will be null on server-side, and initialized on client-side
// IMPORTANT: This must be a real Firestore instance, not a Proxy
// Firebase's collection() function requires a real Firestore instance
export const db: Firestore | null = (() => {
  if (typeof window === 'undefined') return null;
  
  // FIXED: Try to initialize immediately on client-side
  try {
    return initializeDb();
  } catch {
    // Return null if initialization fails - will retry later
    return null;
  }
})();

// FIXED: Initialize Firebase IMMEDIATELY when module loads (no delay)
if (typeof window !== 'undefined') {
  // Initialize immediately - don't wait for idle callback
  try {
    // Force initialization by accessing services
    getFirebaseServices();
    initializeDb();
    getAuth();
    getStorage();
  } catch (error) {
    // Log error but continue - will retry when needed
    console.warn('⚠️ Initial Firebase init attempt failed, will retry:', error);
  }
}

export const storage = createLazyGetter(() => getFirebaseServices().storage);

// Export auth - initialize lazily on client side only
// This ensures Firebase's getModularInstance works correctly
function initializeAuth(): Auth | null {
  if (typeof window === 'undefined') return null;
  
  try {
    // Directly get auth from initialized services, not through getFirebaseServices() to avoid circular dependency
    if (isInitialized && firebaseAuth) {
      return firebaseAuth;
    }
    
    // If not initialized, try to initialize
    const services = getFirebaseServices();
    return services?.auth || null;
  } catch (error) {
    console.error('❌ Error initializing auth:', error);
    return null;
  }
}

// Export auth using lazy getter - only initializes when accessed
// This prevents immediate initialization at module load and handles null gracefully
export const auth = createLazyGetter(() => {
  if (typeof window === 'undefined') return null;
  return initializeAuth();
}) as Auth | null;

// Export getAuth function for cases where auth needs to be re-initialized
// This wraps initializeAuth() to ensure proper initialization
export function getAuth(): Auth | null {
  return initializeAuth();
}

// Initialize Google Auth Provider (singleton) - only in browser
function getGoogleProvider() {
  if (typeof window === 'undefined') return null;
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({
    prompt: 'select_account'
  });
  return provider;
}

export const googleProvider = typeof window !== 'undefined' ? getGoogleProvider() : null;

// Re-export all Firebase functions for convenience
export { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  addDoc, 
  deleteDoc,
  limit,
  serverTimestamp,
  orderBy,
  getDocs,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendEmailVerification,
  setPersistence,
  browserLocalPersistence,
  getIdToken,
  // Storage functions
  ref,
  uploadBytes,
  getDownloadURL
};

// Import and re-export Timestamp separately
import { Timestamp } from 'firebase/firestore';
export { Timestamp };

export default app;
