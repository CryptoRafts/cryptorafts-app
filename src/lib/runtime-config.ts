// Runtime configuration and environment validation

export interface RuntimeConfig {
  isClient: boolean;
  isServer: boolean;
  isDevelopment: boolean;
  isProduction: boolean;
  firebase: {
    projectId: string;
    authDomain: string;
    apiKey: string;
  };
}

let runtimeConfig: RuntimeConfig | null = null;

export function getRuntimeConfig(): RuntimeConfig {
  if (runtimeConfig) {
    return runtimeConfig;
  }

  const isClient = typeof window !== 'undefined';
  const isServer = typeof window === 'undefined';
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isProduction = process.env.NODE_ENV === 'production';

  // Validate Firebase environment variables
  const firebaseConfig = {
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  };

  if (!firebaseConfig.projectId) {
    throw new Error('NEXT_PUBLIC_FIREBASE_PROJECT_ID is required');
  }

  if (!firebaseConfig.authDomain) {
    throw new Error('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN is required');
  }

  if (!firebaseConfig.apiKey) {
    throw new Error('NEXT_PUBLIC_FIREBASE_API_KEY is required');
  }

  runtimeConfig = {
    isClient,
    isServer,
    isDevelopment,
    isProduction,
    firebase: firebaseConfig
  };

  console.log('Runtime Config:', {
    isClient,
    isServer,
    isDevelopment,
    isProduction,
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain,
    hasApiKey: !!firebaseConfig.apiKey
  });

  return runtimeConfig;
}

export function validateClientSide() {
  const config = getRuntimeConfig();
  if (!config.isClient) {
    throw new Error('This function can only be called on the client side');
  }
  return config;
}

export function validateServerSide() {
  const config = getRuntimeConfig();
  if (!config.isServer) {
    throw new Error('This function can only be called on the server side');
  }
  return config;
}
