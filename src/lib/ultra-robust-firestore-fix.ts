/**
 * Ultra Robust Firestore Connection Fix
 * The most aggressive Firestore connection management to eliminate ALL errors
 */

import { db } from './firebase.client';
import { doc, getDoc, setDoc, onSnapshot, enableNetwork, disableNetwork } from 'firebase/firestore';

export class UltraRobustFirestoreFix {
  private static connectionRetries = 0;
  private static maxRetries = 5; // Increased retries
  private static isReconnecting = false;
  private static lastConnectionCheck = 0;
  private static connectionCheckInterval = 30000; // 30 seconds
  private static isInitialized = false;

  /**
   * Ultra aggressive connection test
   */
  static async ultraTestConnection(): Promise<boolean> {
    try {
      if (!db) {
        console.error('❌ Firestore not initialized');
        return false;
      }

      // Multiple test operations to ensure connection is truly stable
      const testDoc = doc(db!, 'test', 'ultra-connection-test');
      
      // Test 1: Simple read
      await getDoc(testDoc);
      
      // Test 2: Write operation
      await setDoc(testDoc, { 
        test: true, 
        timestamp: Date.now(),
        ultraTest: true
      }, { merge: true });
      
      // Test 3: Read again to confirm write worked
      const result = await getDoc(testDoc);
      if (!result.exists()) {
        throw new Error('Write test failed');
      }
      
      console.log('✅ Ultra Firestore connection test successful');
      this.connectionRetries = 0;
      return true;
    } catch (error) {
      console.error('❌ Ultra Firestore connection test failed:', error);
      this.connectionRetries++;
      return false;
    }
  }

  /**
   * Ultra aggressive connection fix
   */
  static async ultraFixConnection(): Promise<boolean> {
    if (this.isReconnecting) {
      console.log('🔄 Already ultra-reconnecting, skipping...');
      return false;
    }

    this.isReconnecting = true;
    console.log('🔧 Ultra-aggressive Firestore connection fix...');

    try {
      // Step 1: Disable network completely
      await disableNetwork(db);
      console.log('📴 Network disabled');
      
      // Step 2: Wait longer for complete disconnection
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Step 3: Re-enable network
      await enableNetwork(db);
      console.log('📶 Network re-enabled');
      
      // Step 4: Wait for network to stabilize
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Step 5: Multiple connection tests with increasing delays
      let isConnected = false;
      const testDelays = [1000, 2000, 3000, 5000]; // Increasing delays
      
      for (let i = 0; i < testDelays.length; i++) {
        console.log(`🔄 Ultra connection test ${i + 1}/${testDelays.length}...`);
        await new Promise(resolve => setTimeout(resolve, testDelays[i]));
        
        isConnected = await this.ultraTestConnection();
        if (isConnected) {
          console.log(`✅ Ultra connection successful on test ${i + 1}`);
          break;
        }
      }
      
      if (isConnected) {
        console.log('✅ Ultra Firestore connection fixed');
        this.isReconnecting = false;
        return true;
      } else {
        console.log('❌ Ultra Firestore connection fix failed');
        this.isReconnecting = false;
        return false;
      }
    } catch (error) {
      console.error('❌ Error in ultra Firestore connection fix:', error);
      this.isReconnecting = false;
      return false;
    }
  }

  /**
   * Handle ALL Firestore errors with ultra-aggressive retry
   */
  static async ultraHandleError(error: any, context: string = 'Ultra Firestore Operation'): Promise<boolean> {
    console.error(`❌ ${context} Error:`, error);
    
    // Check for ANY Firestore-related error
    const isFirestoreError = 
      error.code === 'unavailable' || 
      error.code === 'deadline-exceeded' || 
      error.message?.includes('400') ||
      error.message?.includes('connection') ||
      error.status === 400 ||
      error.code === 'aborted' ||
      error.message?.includes('Firestore') ||
      error.message?.includes('Write/channel') ||
      error.message?.includes('terminate') ||
      error.message?.includes('gsessionid') ||
      error.message?.includes('SID') ||
      error.message?.includes('RID');
    
    if (isFirestoreError) {
      console.log('🔄 Ultra Firestore error detected, attempting ultra fix...');
      
      if (this.connectionRetries < this.maxRetries) {
        const fixed = await this.ultraFixConnection();
        if (fixed) {
          console.log('✅ Ultra connection fixed, retrying operation');
          return true;
        }
      } else {
        console.log('❌ Max ultra retries reached, giving up');
        this.connectionRetries = 0;
      }
    }
    
    return false;
  }

  /**
   * Ultra safe Firestore operation
   */
  static async ultraSafeOperation<T>(
    operation: () => Promise<T>,
    context: string = 'Ultra Firestore Operation'
  ): Promise<T | null> {
    try {
      return await operation();
    } catch (error) {
      const shouldRetry = await this.ultraHandleError(error, context);
      
      if (shouldRetry) {
        try {
          return await operation();
        } catch (retryError) {
          console.error(`❌ ${context} failed after ultra retry:`, retryError);
          return null;
        }
      }
      
      return null;
    }
  }

  /**
   * Ultra connection monitoring
   */
  static initializeUltraMonitoring(): void {
    if (typeof window === 'undefined' || this.isInitialized) return;

    this.isInitialized = true;
    console.log('🔧 Initializing ultra Firestore monitoring...');

    // Ultra connection monitoring
    setInterval(async () => {
      const now = Date.now();
      if (now - this.lastConnectionCheck < this.connectionCheckInterval) return;
      
      this.lastConnectionCheck = now;
      const isConnected = await this.ultraTestConnection();
      
      if (!isConnected && !this.isReconnecting) {
        console.log('🔄 Ultra connection lost, attempting ultra reconnect...');
        await this.ultraFixConnection();
      }
    }, this.connectionCheckInterval);

    // Ultra page visibility handling
    let lastVisibilityCheck = 0;
    document.addEventListener('visibilitychange', async () => {
      if (!document.hidden) {
        const now = Date.now();
        if (now - lastVisibilityCheck < 10000) return; // 10 second throttle
        lastVisibilityCheck = now;
        
        console.log('🔄 Page visible, ultra Firestore check...');
        await this.ultraTestConnection();
      }
    });

    // Ultra network event handling
    window.addEventListener('online', async () => {
      console.log('🔄 Network online, ultra Firestore fix...');
      await this.ultraFixConnection();
    });

    window.addEventListener('offline', () => {
      console.log('📴 Network offline, Firestore operations paused');
    });

    // Ultra global error handling
    window.addEventListener('error', async (event) => {
      if (event.error && this.isFirestoreRelatedError(event.error)) {
        console.log('🔄 Ultra global Firestore error detected...');
        await this.ultraFixConnection();
      }
    });

    window.addEventListener('unhandledrejection', async (event) => {
      if (event.reason && this.isFirestoreRelatedError(event.reason)) {
        console.log('🔄 Ultra global Firestore promise rejection...');
        await this.ultraFixConnection();
      }
    });

    console.log('✅ Ultra Firestore monitoring initialized');
  }

  /**
   * Check if error is Firestore-related
   */
  private static isFirestoreRelatedError(error: any): boolean {
    return (
      error.message?.includes('400') ||
      error.message?.includes('Firestore') ||
      error.message?.includes('Write/channel') ||
      error.message?.includes('terminate') ||
      error.message?.includes('gsessionid') ||
      error.message?.includes('SID') ||
      error.message?.includes('RID') ||
      error.code === 'unavailable' ||
      error.status === 400
    );
  }

  /**
   * Create ultra robust onSnapshot listener
   */
  static createUltraRobustListener(
    docRef: any,
    callback: (doc: any) => void,
    errorCallback?: (error: any) => void
  ) {
    const listener = onSnapshot(
      docRef,
      (doc) => {
        callback(doc);
      },
      async (error) => {
        console.error('❌ Ultra Firestore listener error:', error);
        
        const shouldRetry = await this.ultraHandleError(error, 'Ultra Firestore Listener');
        
        if (shouldRetry) {
          console.log('🔄 Ultra retrying listener after ultra fix...');
          setTimeout(() => {
            this.createUltraRobustListener(docRef, callback, errorCallback);
          }, 2000);
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
//   UltraRobustFirestoreFix.initializeUltraMonitoring();
// }

export default UltraRobustFirestoreFix;
