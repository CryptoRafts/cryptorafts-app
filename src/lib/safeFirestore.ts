import { db } from "@/lib/firebase.client";
import { collection, query, onSnapshot, doc, getDoc, setDoc, updateDoc, addDoc, orderBy, limit, where } from "firebase/firestore";

// Safe onSnapshot wrapper that handles errors gracefully
export function safeOnSnapshot(
  target: any,
  callback: (snapshot: any) => void,
  errorCallback?: (error: any) => void
) {
  let isActive = true;
  
  const unsubscribe = onSnapshot(
    target, 
    (snapshot: any) => {
      if (isActive) {
        callback(snapshot);
      }
    }, 
    (error: any) => {
      if (!isActive) return;
      
      console.warn('Firestore onSnapshot error:', error);
      
      // Handle specific Firebase errors
      if (error.code === 'permission-denied') {
        console.warn('Firestore permission denied - this is expected for unauthorized users');
        // Call callback with empty snapshot
        callback({
          docs: [],
          empty: true,
          size: 0,
          forEach: () => {},
          docChanges: () => []
        });
        return;
      }
      
      if (error.message?.includes('INTERNAL ASSERTION FAILED') || 
          error.message?.includes('Unexpected state') ||
          error.code === 'internal') {
        console.error('Firestore internal assertion failed - preventing crash');
        // Call callback with empty snapshot to prevent crashes
        callback({
          docs: [],
          empty: true,
          size: 0,
          forEach: () => {},
          docChanges: () => []
        });
        return;
      }
      
      if (errorCallback) {
        errorCallback(error);
      }
    }
  );
  
  // Return a wrapped unsubscribe function
  return () => {
    isActive = false;
    try {
      unsubscribe();
    } catch (error) {
      console.warn('Error during unsubscribe:', error);
    }
  };
}

// Safe Firestore operations with error handling
export async function safeFirestoreOperation<T>(
  operation: () => Promise<T>,
  fallback: T,
  context: string = 'Firestore operation'
): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    console.warn(`${context} failed:`, error);
    return fallback;
  }
}

// Safe collection reference
export function safeCollection(collectionPath: string) {
  try {
    return collection(db!, collectionPath);
  } catch (error) {
    console.warn(`Failed to create collection reference for ${collectionPath}:`, error);
    return null;
  }
}

// Safe document reference
export function safeDoc(docPath: string) {
  try {
    return doc(db!, docPath);
  } catch (error) {
    console.warn(`Failed to create document reference for ${docPath}:`, error);
    return null;
  }
}
