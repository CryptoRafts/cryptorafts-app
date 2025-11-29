/**
 * Firebase SDK Level Interceptor
 * Intercepts Firebase SDK internal errors at the lowest possible level
 */

import { UltraRobustFirestoreFix } from './ultra-robust-firestore-fix';

export class FirebaseSDKInterceptor {
  private static isInitialized = false;
  private static originalConsoleError: any;
  private static originalConsoleWarn: any;

  /**
   * Initialize SDK-level interception
   */
  static initialize(): void {
    if (typeof window === 'undefined' || this.isInitialized) return;

    this.isInitialized = true;
    console.log('🔧 Initializing Firebase SDK interceptor...');

    // Intercept console errors to catch Firebase SDK errors
    this.originalConsoleError = console.error;
    this.originalConsoleWarn = console.warn;

    console.error = (...args) => {
      const errorMessage = args.join(' ');
      if (this.isFirebaseWriteChannelError(errorMessage)) {
        console.log('🛡️ SDK interceptor caught Firebase Write channel error...');
        UltraRobustFirestoreFix.ultraFixConnection();
      }
      this.originalConsoleError.apply(console, args);
    };

    console.warn = (...args) => {
      const warningMessage = args.join(' ');
      if (this.isFirebaseWriteChannelError(warningMessage)) {
        console.log('🛡️ SDK interceptor caught Firebase Write channel warning...');
        UltraRobustFirestoreFix.ultraFixConnection();
      }
      this.originalConsoleWarn.apply(console, args);
    };

    // Intercept all network requests at the lowest level
    this.interceptNetworkRequests();

    // Intercept Firebase SDK internal errors
    this.interceptFirebaseSDKErrors();

    console.log('✅ Firebase SDK interceptor initialized');
  }

  /**
   * Intercept network requests at the lowest level
   */
  private static interceptNetworkRequests(): void {
    // Intercept fetch at the lowest level
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        
        // Check for Write channel termination errors
        if (response.url.includes('firestore.googleapis.com') && 
            response.url.includes('Write/channel') && 
            response.url.includes('TYPE=terminate') && 
            response.status === 400) {
          console.log('🛡️ SDK interceptor caught Write channel termination 400...');
          await UltraRobustFirestoreFix.ultraFixConnection();
        }
        
        return response;
      } catch (error) {
        if (this.isFirebaseWriteChannelError(error)) {
          console.log('🛡️ SDK interceptor caught Write channel fetch error...');
          await UltraRobustFirestoreFix.ultraFixConnection();
        }
        throw error;
      }
    };

    // Intercept XMLHttpRequest at the lowest level
    const originalXHROpen = XMLHttpRequest.prototype.open;
    const originalXHRSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function(method: string, url: string | URL, async?: boolean, username?: string | null, password?: string | null) {
      (this as any)._url = url;
      (this as any)._method = method;
      return originalXHROpen.call(this, method, url, async ?? true, username ?? null, password ?? null);
    };

    XMLHttpRequest.prototype.send = function(...args) {
      // Add error handler for Write channel errors
      this.addEventListener('error', async (event) => {
        const url = (this as any)._url;
        if (url && FirebaseSDKInterceptor.isWriteChannelRequest(url)) {
          console.log('🛡️ SDK interceptor caught Write channel XHR error...');
          await UltraRobustFirestoreFix.ultraFixConnection();
        }
      });

      this.addEventListener('load', async (event) => {
        const url = (this as any)._url;
        if (url && FirebaseSDKInterceptor.isWriteChannelRequest(url) && this.status === 400) {
          console.log('🛡️ SDK interceptor caught Write channel 400 response...');
          await UltraRobustFirestoreFix.ultraFixConnection();
        }
      });

      return originalXHRSend.call(this, ...args);
    };
  }

  /**
   * Intercept Firebase SDK internal errors
   */
  private static interceptFirebaseSDKErrors(): void {
    // Override Firebase SDK error handling
    const originalError = Error;
    (window as any).Error = function(message: string, ...args: any[]) {
      const error = new originalError(message, ...args);
      
      if (FirebaseSDKInterceptor.isFirebaseWriteChannelError(message)) {
        console.log('🛡️ SDK interceptor caught Firebase SDK error...');
        setTimeout(() => {
          UltraRobustFirestoreFix.ultraFixConnection();
        }, 100);
      }
      
      return error;
    };

    // Intercept Promise rejections at the lowest level
    const originalPromiseReject = Promise.reject;
    Promise.reject = function<T = never>(reason?: any): Promise<T> {
      if (FirebaseSDKInterceptor.isFirebaseWriteChannelError(reason)) {
        console.log('🛡️ SDK interceptor caught Firebase Promise rejection...');
        setTimeout(() => {
          UltraRobustFirestoreFix.ultraFixConnection();
        }, 100);
      }
      return originalPromiseReject.call(Promise, reason) as Promise<T>;
    };
  }

  /**
   * Check if error is Firebase Write channel related
   */
  private static isFirebaseWriteChannelError(error: any): boolean {
    if (!error) return false;

    const errorString = String(error);
    const errorMessage = error.message || '';
    const errorCode = error.code || '';

    return (
      errorString.includes('Write/channel') ||
      errorString.includes('TYPE=terminate') ||
      errorString.includes('gsessionid') ||
      errorString.includes('SID') ||
      errorString.includes('RID') ||
      errorString.includes('firestore.googleapis.com') ||
      errorMessage.includes('400') ||
      errorMessage.includes('Bad Request') ||
      errorCode === 'unavailable' ||
      error.status === 400 ||
      errorString.includes('terminate') ||
      errorString.includes('channel')
    );
  }

  /**
   * Check if URL is a Write channel request
   */
  private static isWriteChannelRequest(url: string): boolean {
    return (
      url.includes('firestore.googleapis.com') &&
      url.includes('Write/channel') &&
      (url.includes('TYPE=terminate') || url.includes('TYPE=write'))
    );
  }

  /**
   * Restore original console methods
   */
  static restore(): void {
    if (this.originalConsoleError) {
      console.error = this.originalConsoleError;
    }
    if (this.originalConsoleWarn) {
      console.warn = this.originalConsoleWarn;
    }
  }
}

// Auto-initialize DISABLED - Only initialize when explicitly imported
// if (typeof window !== 'undefined') {
//   FirebaseSDKInterceptor.initialize();
// }

export default FirebaseSDKInterceptor;
