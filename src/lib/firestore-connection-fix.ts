/**
 * Firestore Connection Fix
 * Handles Firestore connection issues and provides robust error handling
 */

import { db } from './firebase.client';
import { doc, getDoc, setDoc, onSnapshot, enableNetwork, disableNetwork } from 'firebase/firestore';

export class FirestoreConnectionFix {
  private static connectionRetries = 0;
  private static maxRetries = 3;
  private static isReconnecting = false;

  /**
   * Test Firestore connection
   */
  static async testConnection(): Promise<boolean> {
    try {
      if (!db) {
        console.error('❌ Firestore not initialized');
        return false;
      }

      // Test with a simple read operation
      const testDoc = doc(db!, 'test', 'connection');
      await getDoc(testDoc);
      console.log('✅ Firestore connection test successful');
      this.connectionRetries = 0;
      return true;
    } catch (error) {
      console.error('❌ Firestore connection test failed:', error);
      this.connectionRetries++;
      return false;
    }
  }

  /**
   * Fix Firestore connection issues
   */
  static async fixConnection(): Promise<boolean> {
    if (this.isReconnecting) {
      console.log('🔄 Already reconnecting, skipping...');
      return false;
    }

    this.isReconnecting = true;
    console.log('🔧 Attempting to fix Firestore connection...');

    try {
      if (!db) {
        throw new Error('Firestore is not initialized');
      }
      // More aggressive connection fix
      await disableNetwork(db);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      await enableNetwork(db);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Additional wait
      
      // Test connection multiple times
      let isConnected = false;
      for (let i = 0; i < 3; i++) {
        isConnected = await this.testConnection();
        if (isConnected) break;
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait between tests
      }
      
      if (isConnected) {
        console.log('✅ Firestore connection fixed');
        this.isReconnecting = false;
        return true;
      } else {
        console.log('❌ Firestore connection fix failed');
        this.isReconnecting = false;
        return false;
      }
    } catch (error) {
      console.error('❌ Error fixing Firestore connection:', error);
      this.isReconnecting = false;
      return false;
    }
  }

  /**
   * Handle Firestore errors with automatic retry
   */
  static async handleError(error: any, context: string = 'Firestore Operation'): Promise<boolean> {
    console.error(`❌ ${context} Error:`, error);
    
    // Check if it's a connection error
    if (error.code === 'unavailable' || 
        error.code === 'deadline-exceeded' || 
        error.message?.includes('400') ||
        error.message?.includes('connection') ||
        error.status === 400 ||
        error.code === 'aborted') {
      
      console.log('🔄 Connection error detected, attempting fix...');
      
      if (this.connectionRetries < this.maxRetries) {
        const fixed = await this.fixConnection();
        if (fixed) {
          console.log('✅ Connection fixed, retrying operation');
          return true;
        }
      } else {
        console.log('❌ Max retries reached, giving up');
        this.connectionRetries = 0;
      }
    }
    
    return false;
  }

  /**
   * Safe Firestore operation with error handling
   */
  static async safeOperation<T>(
    operation: () => Promise<T>,
    context: string = 'Firestore Operation'
  ): Promise<T | null> {
    try {
      return await operation();
    } catch (error) {
      const shouldRetry = await this.handleError(error, context);
      
      if (shouldRetry) {
        try {
          return await operation();
        } catch (retryError) {
          console.error(`❌ ${context} failed after retry:`, retryError);
          return null;
        }
      }
      
      return null;
    }
  }

  /**
   * Initialize connection monitoring
   */
  static initializeMonitoring(): void {
    if (typeof window === 'undefined') return;

    let lastCheck = 0;
    const checkInterval = 60000; // Check every 60 seconds instead of 30

    // Monitor connection every 60 seconds
    setInterval(async () => {
      const now = Date.now();
      if (now - lastCheck < checkInterval) return; // Prevent excessive checks
      
      lastCheck = now;
      const isConnected = await this.testConnection();
      if (!isConnected && !this.isReconnecting) {
        console.log('🔄 Connection lost, attempting to reconnect...');
        await this.fixConnection();
      }
    }, checkInterval);

    // Handle page visibility changes with throttling
    let lastVisibilityCheck = 0;
    document.addEventListener('visibilitychange', async () => {
      if (!document.hidden) {
        const now = Date.now();
        if (now - lastVisibilityCheck < 5000) return; // Throttle to once per 5 seconds
        lastVisibilityCheck = now;
        
        console.log('🔄 Page visible, checking Firestore connection...');
        await this.testConnection();
      }
    });

    // Handle online/offline events
    window.addEventListener('online', async () => {
      console.log('🔄 Network online, checking Firestore connection...');
      await this.fixConnection();
    });

    window.addEventListener('offline', () => {
      console.log('📴 Network offline, Firestore operations may fail');
    });
  }

  /**
   * Create a robust onSnapshot listener
   */
  static createRobustListener(
    docRef: any,
    callback: (doc: any) => void,
    errorCallback?: (error: any) => void
  ) {
    const listener = onSnapshot(
      docRef,
      (doc: any) => {
        callback(doc);
      },
      async (error: any) => {
        console.error('❌ Firestore listener error:', error);
        
        const shouldRetry = await this.handleError(error, 'Firestore Listener');
        
        if (shouldRetry) {
          console.log('🔄 Retrying listener after connection fix...');
          // Recreate the listener
          setTimeout(() => {
            this.createRobustListener(docRef, callback, errorCallback);
          }, 1000);
        } else if (errorCallback) {
          errorCallback(error);
        }
      }
    );

    return listener;
  }
}

// Auto-initialize DISABLED - Only initialize when explicitly imported
// if (typeof window !== 'undefined') {
//   FirestoreConnectionFix.initializeMonitoring();
//   
//   // Global error handler for unhandled Firestore errors
//   window.addEventListener('error', async (event) => {
//     if (event.error && (
//       event.error.message?.includes('400') ||
//       event.error.message?.includes('Firestore') ||
//       event.error.code === 'unavailable'
//     )) {
//       console.log('🔄 Global Firestore error detected, attempting fix...');
//       await FirestoreConnectionFix.fixConnection();
//     }
//   });
//   
//   // Handle unhandled promise rejections
//   window.addEventListener('unhandledrejection', async (event) => {
//     if (event.reason && (
//       event.reason.message?.includes('400') ||
//       event.reason.message?.includes('Firestore') ||
//       event.reason.code === 'unavailable'
//     )) {
//       console.log('🔄 Global Firestore promise rejection detected, attempting fix...');
//       await FirestoreConnectionFix.fixConnection();
//     }
//   });
// }

export default FirestoreConnectionFix;
