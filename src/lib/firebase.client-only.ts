// Client-only Firebase utilities
// This module ensures Firebase is only used in Client Components

import { useEffect, useState } from 'react';

/**
 * Hook to ensure Firebase is only used on the client side
 * Returns Firebase services only when running in the browser
 */
export function useFirebase() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  // Dynamic import to ensure Firebase is only loaded on client
  return import('./firebase.client');
}

/**
 * Client-only Firebase initialization
 * Use this in components that need Firebase services
 */
export async function getFirebaseClient() {
  if (typeof window === 'undefined') {
    throw new Error('Firebase can only be used in Client Components');
  }

  const firebase = await import('./firebase.client');
  return firebase;
}

/**
 * Guard function to ensure code only runs on client
 */
export function clientOnly<T>(fn: () => T): T | null {
  if (typeof window === 'undefined') {
    console.warn('Attempted to use Firebase on server side');
    return null;
  }
  return fn();
}
