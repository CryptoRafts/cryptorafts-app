/**
 * Network Level Interceptor
 * Intercepts network requests at the lowest possible level to catch Write channel errors
 */

import { UltraRobustFirestoreFix } from './ultra-robust-firestore-fix';

export class NetworkLevelInterceptor {
  private static isInitialized = false;

  /**
   * Initialize network-level interception
   */
  static initialize(): void {
    if (typeof window === 'undefined' || this.isInitialized) return;

    this.isInitialized = true;
    console.log('🌐 Initializing network-level interceptor...');

    // Intercept at the lowest network level
    this.interceptLowLevelNetwork();

    // Intercept Firebase SDK network calls
    this.interceptFirebaseNetworkCalls();

    console.log('✅ Network-level interceptor initialized');
  }

  /**
   * Intercept at the lowest network level
   */
  private static interceptLowLevelNetwork(): void {
    // Override the native fetch
    const nativeFetch = window.fetch;
    window.fetch = async (input, init) => {
      const url = typeof input === 'string' ? input : (input instanceof URL ? input.toString() : (input as Request).url);
      
      // Check if this is a Write channel termination request
      if (this.isWriteChannelTerminationRequest(url)) {
        console.log('🌐 Network interceptor: Write channel termination detected, attempting ultra fix...');
        try {
          await UltraRobustFirestoreFix.ultraFixConnection();
        } catch (error) {
          console.log('🌐 Network interceptor: Ultra fix failed, continuing with request...');
        }
      }

      try {
        const response = await nativeFetch(input, init);
        
        // Check response for Write channel errors
        if (this.isWriteChannelTerminationRequest(url) && response.status === 400) {
          console.log('🌐 Network interceptor: Write channel 400 response, attempting ultra fix...');
          await UltraRobustFirestoreFix.ultraFixConnection();
        }
        
        return response;
      } catch (error) {
        if (this.isWriteChannelTerminationRequest(url)) {
          console.log('🌐 Network interceptor: Write channel fetch error, attempting ultra fix...');
          await UltraRobustFirestoreFix.ultraFixConnection();
        }
        throw error;
      }
    };

    // Override XMLHttpRequest at the lowest level
    const nativeXHROpen = XMLHttpRequest.prototype.open;
    const nativeXHRSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function(method: string, url: string | URL, async?: boolean, username?: string | null, password?: string | null) {
      (this as any)._interceptorUrl = url;
      (this as any)._interceptorMethod = method;
      return nativeXHROpen.call(this, method, url, async ?? true, username ?? null, password ?? null);
    };

    XMLHttpRequest.prototype.send = function(...args) {
      const url = (this as any)._interceptorUrl;
      
      // Check if this is a Write channel termination request
      if (NetworkLevelInterceptor.isWriteChannelTerminationRequest(url)) {
        console.log('🌐 Network interceptor: Write channel XHR detected, attempting ultra fix...');
        UltraRobustFirestoreFix.ultraFixConnection().catch(() => {
          console.log('🌐 Network interceptor: Ultra fix failed, continuing with XHR...');
        });
      }

      // Add comprehensive error handling
      this.addEventListener('error', async (event) => {
        if (NetworkLevelInterceptor.isWriteChannelTerminationRequest(url)) {
          console.log('🌐 Network interceptor: Write channel XHR error, attempting ultra fix...');
          await UltraRobustFirestoreFix.ultraFixConnection();
        }
      });

      this.addEventListener('load', async (event) => {
        if (NetworkLevelInterceptor.isWriteChannelTerminationRequest(url) && this.status === 400) {
          console.log('🌐 Network interceptor: Write channel 400 XHR response, attempting ultra fix...');
          await UltraRobustFirestoreFix.ultraFixConnection();
        }
      });

      this.addEventListener('abort', async (event) => {
        if (NetworkLevelInterceptor.isWriteChannelTerminationRequest(url)) {
          console.log('🌐 Network interceptor: Write channel XHR abort, attempting ultra fix...');
          await UltraRobustFirestoreFix.ultraFixConnection();
        }
      });

      return nativeXHRSend.call(this, ...args);
    };
  }

  /**
   * Intercept Firebase SDK network calls
   */
  private static interceptFirebaseNetworkCalls(): void {
    // Intercept Firebase SDK internal network calls
    // Note: setTimeout override temporarily disabled due to TypeScript type issues
    // const originalSetTimeout = window.setTimeout;
    // window.setTimeout = function(callback, delay, ...args) { ... };

    // Intercept Promise-based network calls
    // Note: Promise interception is complex and may cause issues
    // Commenting out for now to fix build
    /*
    const originalPromise = window.Promise;
    window.Promise = class extends originalPromise {
      constructor(executor) {
        super((resolve, reject) => {
          executor(
            resolve,
            (reason) => {
              if (NetworkLevelInterceptor.isFirebaseWriteChannelError(reason)) {
                console.log('🌐 Network interceptor: Firebase Promise rejection, attempting ultra fix...');
                UltraRobustFirestoreFix.ultraFixConnection().catch(() => {
                  console.log('🌐 Network interceptor: Ultra fix failed in Promise...');
                });
              }
              reject(reason);
            }
          );
        });
      }
    };
    */
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
   * Check if error is Firebase Write channel related
   */
  private static isFirebaseWriteChannelError(error: any): boolean {
    if (!error) return false;

    const errorString = String(error);
    const errorMessage = error.message || '';

    return (
      errorString.includes('Write/channel') ||
      errorString.includes('TYPE=terminate') ||
      errorString.includes('gsessionid') ||
      errorString.includes('SID') ||
      errorString.includes('RID') ||
      errorString.includes('firestore.googleapis.com') ||
      errorMessage.includes('400') ||
      errorMessage.includes('Bad Request') ||
      errorString.includes('terminate') ||
      errorString.includes('channel')
    );
  }
}

// Auto-initialize DISABLED - Only initialize when explicitly imported
// if (typeof window !== 'undefined') {
//   NetworkLevelInterceptor.initialize();
// }

export default NetworkLevelInterceptor;
