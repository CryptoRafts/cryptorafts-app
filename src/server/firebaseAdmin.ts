import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';

let adminApp: App | null = null;
let adminDbInstance: Firestore | null = null;
let adminAuthInstance: Auth | null = null;

export function initAdmin(config?: any) {
  // Skip initialization during build time to avoid errors
  if (typeof window === 'undefined' && process.env.NEXT_PHASE === 'phase-production-build') {
    return null;
  }
  
  // If already initialized, return existing app
  if (getApps().length > 0) {
    const existingApp = getApps()[0];
    if (!adminApp) {
      adminApp = existingApp;
      adminDbInstance = getFirestore(existingApp);
      adminAuthInstance = getAuth(existingApp);
      console.log('✅ [FIREBASE ADMIN] Using existing app');
    }
    return existingApp;
  }
  
  // Use default project ID if not set (for development)
  const projectId = process.env.FIREBASE_PROJECT_ID || 'cryptorafts-b9067';
  
  // Try Base64 credentials first (for Vercel)
  let creds: any = null;
  if (process.env.FIREBASE_SERVICE_ACCOUNT_B64) {
    try {
      console.log('🔄 [FIREBASE ADMIN] Attempting Base64 credential parsing...');
      const json = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_B64, "base64").toString("utf8");
      creds = JSON.parse(json);
      if (creds.private_key && creds.private_key.includes('REPLACE_ME')) {
        console.warn('⚠️ [FIREBASE ADMIN] Template credentials detected, skipping');
        creds = null; // Skip template file
      } else {
        console.log('✅ [FIREBASE ADMIN] Base64 credentials parsed successfully');
      }
    } catch (b64Error: any) {
      console.warn('⚠️ [FIREBASE ADMIN] Failed to parse Base64 credentials:', b64Error?.message);
    }
  }
  
  // Fallback to individual env vars
  if (!creds) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const hasCredentials = privateKey && process.env.FIREBASE_CLIENT_EMAIL;
    
    if (hasCredentials) {
      console.log('🔄 [FIREBASE ADMIN] Using individual environment variables');
      creds = {
        projectId: projectId,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
        privateKey: privateKey || '',
      };
    }
  }
  
  try {
    if (creds) {
      // Initialize with credentials
      console.log('🔄 [FIREBASE ADMIN] Initializing Firebase Admin with credentials...');
      try {
      adminApp = initializeApp(config || {
        credential: cert(creds),
        projectId: creds.project_id || creds.projectId || projectId,
        storageBucket: `${creds.project_id || creds.projectId || projectId}.appspot.com`,
      });
      } catch (initError: any) {
        // Catch initialization errors specifically
        const errorMsg = initError?.message || '';
        if (errorMsg.includes('Could not load the default credentials') || 
            errorMsg.includes('Application Default Credentials')) {
          console.warn('⚠️ [FIREBASE ADMIN] Credential initialization failed - credentials may be invalid');
          throw new Error('Firebase Admin credentials are invalid or malformed');
        }
        throw initError; // Re-throw other errors
      }
    } else {
      // Try Application Default Credentials (ADC) as last resort
      // This works if Vercel has Google Cloud integration or service account attached
      // Only try ADC if we're in a production environment (Vercel) or if explicitly configured
      const shouldTryADC = process.env.VERCEL || process.env.GOOGLE_APPLICATION_CREDENTIALS;
      
      if (shouldTryADC) {
      try {
        console.log('🔄 [FIREBASE ADMIN] No explicit credentials, trying Application Default Credentials...');
        // Try without credential parameter - Firebase Admin will use ADC
        adminApp = initializeApp({
          projectId: projectId,
        });
        console.log('✅ [FIREBASE ADMIN] Initialized with Application Default Credentials');
      } catch (adcError: any) {
          // Suppress the "Could not load the default credentials" error message
          const errorMsg = adcError?.message || '';
          if (errorMsg.includes('Could not load the default credentials') || 
              errorMsg.includes('Application Default Credentials')) {
            console.warn('⚠️ [FIREBASE ADMIN] Application Default Credentials not available');
            console.warn('⚠️ [FIREBASE ADMIN] This is expected if credentials are not configured in the environment');
          } else {
            console.warn('⚠️ [FIREBASE ADMIN] ADC initialization error:', adcError?.message);
          }
          
        // If ADC fails, try with empty config to let Firebase Admin SDK discover credentials
        try {
          console.log('🔄 [FIREBASE ADMIN] ADC failed, trying minimal initialization...');
          adminApp = initializeApp();
          console.log('✅ [FIREBASE ADMIN] Initialized with minimal config (auto-discovery)');
        } catch (minimalError: any) {
            const minimalMsg = minimalError?.message || '';
            if (minimalMsg.includes('Could not load the default credentials') || 
                minimalMsg.includes('Application Default Credentials')) {
              console.warn('⚠️ [FIREBASE ADMIN] Minimal initialization also failed - credentials not available');
            } else {
              console.warn('⚠️ [FIREBASE ADMIN] Minimal initialization error:', minimalError?.message);
            }
            
          console.warn('⚠️ [FIREBASE ADMIN] All initialization methods failed');
          console.warn('⚠️ [FIREBASE ADMIN] Environment check:', {
            hasB64: !!process.env.FIREBASE_SERVICE_ACCOUNT_B64,
            b64Length: process.env.FIREBASE_SERVICE_ACCOUNT_B64?.length || 0,
            hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
            hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
            hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
            nodeEnv: process.env.NODE_ENV,
            vercel: !!process.env.VERCEL,
            googleApplicationCredentials: !!process.env.GOOGLE_APPLICATION_CREDENTIALS,
            allEnvKeys: Object.keys(process.env).filter(k => k.includes('FIREBASE') || k.includes('GOOGLE')).join(', ')
          });
          return null;
        }
      }
      } else {
        // In development without ADC, don't try to initialize without credentials
        console.warn('⚠️ [FIREBASE ADMIN] No credentials found and ADC not configured');
        console.warn('⚠️ [FIREBASE ADMIN] Please set FIREBASE_SERVICE_ACCOUNT_B64 or FIREBASE_PRIVATE_KEY + FIREBASE_CLIENT_EMAIL');
        return null;
      }
    }
    
    // Only initialize services if app was successfully created
    if (!adminApp) {
      console.error('❌ [FIREBASE ADMIN] App is null, cannot initialize services');
      return null;
    }
    
    try {
    adminDbInstance = getFirestore(adminApp);
    adminAuthInstance = getAuth(adminApp);
    
    // Always log success for debugging
    const finalProjectId = creds?.project_id || creds?.projectId || projectId;
    console.log('✅ [FIREBASE ADMIN] Initialized with project:', finalProjectId);
    
    return adminApp;
    } catch (serviceError: any) {
      console.error('❌ [FIREBASE ADMIN] Failed to initialize services:', serviceError?.message);
      // Return the app anyway - services might be initialized later
      return adminApp;
    }
  } catch (error: any) {
    // Always log errors for debugging
    console.error('❌ [FIREBASE ADMIN] Failed to initialize:', error?.message || error);
    console.error('❌ [FIREBASE ADMIN] Error details:', {
      name: error?.name,
      code: error?.code,
      stack: error?.stack?.split('\n').slice(0, 3).join('\n')
    });
    
    // In development, try to continue without credentials
    if (process.env.NODE_ENV === 'development') {
      try {
        adminApp = initializeApp({
          projectId: projectId,
        });
        adminDbInstance = getFirestore(adminApp);
        adminAuthInstance = getAuth(adminApp);
        console.log('✅ Firebase Admin initialized without credentials (development mode)');
        return adminApp;
      } catch (retryError) {
        console.error('❌ Failed to initialize Firebase Admin even without credentials:', retryError);
        return null;
      }
    }
    return null;
  }
}

// Lazy initialization
export const adminDb = adminDbInstance as any;
export const adminAuth = adminAuthInstance as any;

export function getAdminDb() {
  // First check if we have a cached instance
  if (adminDbInstance && adminApp) {
    return adminDbInstance;
  }
  
  // Check for existing apps (might have been initialized elsewhere) - SERVERLESS-SAFE
  const existingApps = getApps();
  if (existingApps.length > 0) {
    const app = existingApps[0];
    // Always update cache from existing app (serverless-safe)
    adminApp = app;
    try {
    adminDbInstance = getFirestore(app);
    adminAuthInstance = getAuth(app);
    return adminDbInstance;
    } catch (error: any) {
      console.error('❌ [FIREBASE ADMIN] Error getting Firestore from existing app:', error?.message);
      return null;
    }
  }
  
  // Try to initialize - FORCE initialization
  const app = initAdmin();
  if (!app) {
    // If initAdmin returned null, credentials are missing
    console.error('❌ [FIREBASE ADMIN] getAdminDb: initAdmin returned null - credentials missing');
    return null;
  }
  
  // Ensure cache is set (serverless-safe)
  try {
  adminApp = app;
  adminDbInstance = getFirestore(app);
  adminAuthInstance = getAuth(app);
  return adminDbInstance;
  } catch (error: any) {
    console.error('❌ [FIREBASE ADMIN] Error initializing Firestore:', error?.message);
    // Check if it's a credentials error
    const errorMsg = error?.message || '';
    if (errorMsg.includes('Could not load the default credentials') || 
        errorMsg.includes('Application Default Credentials') ||
        errorMsg.includes('credential')) {
      console.error('❌ [FIREBASE ADMIN] Credentials error detected - Firebase Admin credentials not configured');
    }
    return null;
  }
}

export function getAdminAuth() {
  // First check if we have a cached instance
  if (adminAuthInstance && adminApp) {
    return adminAuthInstance;
  }
  
  // Check for existing apps (might have been initialized elsewhere) - SERVERLESS-SAFE
  const existingApps = getApps();
  if (existingApps.length > 0) {
    const app = existingApps[0];
    // Always update cache from existing app (serverless-safe)
    adminApp = app;
    adminAuthInstance = getAuth(app);
    adminDbInstance = getFirestore(app);
    return adminAuthInstance;
  }
  
  // Try to initialize - FORCE initialization
  const app = initAdmin();
  if (!app) {
    // If initAdmin returned null, credentials are missing
    console.error('❌ [FIREBASE ADMIN] getAdminAuth: initAdmin returned null - credentials missing');
    return null;
  }
  
  // Ensure cache is set (serverless-safe)
  adminApp = app;
  adminAuthInstance = getAuth(app);
  adminDbInstance = getFirestore(app);
  
  return adminAuthInstance;
}

export function verifyDepartmentToken(token: string) {
  // Implement department token verification
  return Promise.resolve({ uid: 'dept-user', departmentId: 'dept-id' });
}

export function setDepartmentClaims(uid: string, claims: any) {
  // Implement department claims setting
  return Promise.resolve();
}

export default initAdmin;
