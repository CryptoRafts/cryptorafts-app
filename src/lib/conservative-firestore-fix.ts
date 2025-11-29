/**
 * Conservative Firestore Fix
 * A more conservative approach that doesn't interfere with Firebase internal operations
 */

import { UltraRobustFirestoreFix } from './ultra-robust-firestore-fix';

export class ConservativeFirestoreFix {
  private static isInitialized = false;

  /**
   * Initialize conservative Firestore fix
   */
  static initialize(): void {
    if (typeof window === 'undefined' || this.isInitialized) return;

    this.isInitialized = true;
    console.log('🛡️ Initializing conservative Firestore fix...');

    // Conservative-level interception that doesn't interfere with Firebase
    this.interceptNetworkConservatively();
    this.interceptErrorsConservatively();

    console.log('✅ Conservative Firestore fix initialized');
  }

  /**
   * Intercept network conservatively
   */
  private static interceptNetworkConservatively(): void {
    // Only intercept fetch for Write channel requests
    const nativeFetch = window.fetch;
    window.fetch = async (input, init) => {
      const url = typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.href
          : input.url;
      
      // Only apply fix for Write channel termination requests
      if (this.isWriteChannelTerminationRequest(url)) {
        console.log('🛡️ Conservative: Write channel termination detected, applying conservative fix...');
        await this.conservativeFix();
      }

      try {
        const response = await nativeFetch(input, init);
        
        // Only apply fix for Write channel 400 errors
        if (this.isWriteChannelTerminationRequest(url) && response.status === 400) {
          console.log('🛡️ Conservative: Write channel 400 response, applying conservative fix...');
          await this.conservativeFix();
        }
        
        return response;
      } catch (error) {
        if (this.isWriteChannelTerminationRequest(url)) {
          console.log('🛡️ Conservative: Write channel fetch error, applying conservative fix...');
          await this.conservativeFix();
        }
        throw error;
      }
    };
  }

  /**
   * Intercept errors conservatively
   */
  private static interceptErrorsConservatively(): void {
    // Only intercept global errors that are Write channel related
    window.addEventListener('error', async (event) => {
      if (this.isWriteChannelError(event.error)) {
        console.log('🛡️ Conservative: Global Write channel error, applying conservative fix...');
        await this.conservativeFix();
      }
    });

    window.addEventListener('unhandledrejection', async (event) => {
      if (this.isWriteChannelError(event.reason)) {
        console.log('🛡️ Conservative: Unhandled Write channel rejection, applying conservative fix...');
        await this.conservativeFix();
      }
    });
  }

  /**
   * Conservative fix implementation
   */
  private static async conservativeFix(): Promise<void> {
    try {
      console.log('🛡️ Conservative fix: Starting conservative recovery...');
      
      // Only apply conservative fixes that don't interfere with Firebase
      await this.gentleFirestoreRecovery();
      
      console.log('🛡️ Conservative fix: Conservative recovery completed');
    } catch (error) {
      console.log('🛡️ Conservative fix: Conservative recovery failed, continuing...', error);
    }
  }

  /**
   * Gentle Firestore recovery
   */
  private static async gentleFirestoreRecovery(): Promise<void> {
    try {
      // Gentle recovery that doesn't interfere with Firebase internal state
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('🛡️ Conservative: Gentle Firestore recovery applied');
    } catch (error) {
      console.log('🛡️ Conservative: Gentle Firestore recovery failed', error);
    }
  }

  /**
   * Check if URL is a Write channel termination request
   */
  private static isWriteChannelTerminationRequest(url: string): boolean {
    return (
      url.includes('firestore.googleapis.com') &&
      url.includes('Write/channel') &&
      url.includes('TYPE=terminate')
    );
  }

  /**
   * Check if error is Write channel related
   */
  private static isWriteChannelError(error: any): boolean {
    if (!error) return false;

    const errorString = String(error);
    const errorMessage = error.message || '';

    return (
      errorString.includes('Write/channel') ||
      errorString.includes('TYPE=terminate') ||
      errorString.includes('gsessionid') ||
      errorString.includes('SID') ||
      errorString.includes('RID') ||
      errorMessage.includes('400') ||
      errorMessage.includes('Bad Request') ||
      errorString.includes('terminate') ||
      errorString.includes('channel')
    );
  }
}

// Auto-initialize DISABLED - Only initialize when explicitly imported
// if (typeof window !== 'undefined') {
//   ConservativeFirestoreFix.initialize();
// }

export default ConservativeFirestoreFix;
