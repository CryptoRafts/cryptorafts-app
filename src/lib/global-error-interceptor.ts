/**
 * Global Error Interceptor
 * Intercepts and handles ALL Firestore errors globally
 */

import { UltraRobustFirestoreFix } from './ultra-robust-firestore-fix';

export class GlobalErrorInterceptor {
  private static isInitialized = false;

  /**
   * Initialize global error interception
   */
  static initialize(): void {
    if (typeof window === 'undefined' || this.isInitialized) return;

    this.isInitialized = true;
    console.log('🛡️ Initializing global error interceptor...');

    // Intercept ALL network errors
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        
        // Check for Firestore 400 errors
        if (response.url.includes('firestore.googleapis.com') && response.status === 400) {
          console.log('🛡️ Intercepted Firestore 400 error, attempting ultra fix...');
          await UltraRobustFirestoreFix.ultraFixConnection();
        }
        
        return response;
      } catch (error) {
        if (this.isFirestoreError(error)) {
          console.log('🛡️ Intercepted Firestore fetch error, attempting ultra fix...');
          await UltraRobustFirestoreFix.ultraFixConnection();
        }
        throw error;
      }
    };

    // Intercept XMLHttpRequest errors
    const originalXHROpen = XMLHttpRequest.prototype.open;
    const originalXHRSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function(method: string, url: string | URL, async?: boolean, username?: string | null, password?: string | null) {
      (this as any)._url = url;
      return originalXHROpen.call(this, method, url, async ?? true, username ?? null, password ?? null);
    };

    XMLHttpRequest.prototype.send = function(...args) {
      this.addEventListener('error', async (event) => {
        const url = (this as any)._url;
        if (url && typeof url === 'string' && url.includes('firestore.googleapis.com')) {
          console.log('🛡️ Intercepted Firestore XHR error, attempting ultra fix...');
          await UltraRobustFirestoreFix.ultraFixConnection();
        }
      });

      this.addEventListener('load', async (event) => {
        const url = (this as any)._url;
        if (url && typeof url === 'string' && url.includes('firestore.googleapis.com') && this.status === 400) {
          console.log('🛡️ Intercepted Firestore 400 XHR response, attempting ultra fix...');
          await UltraRobustFirestoreFix.ultraFixConnection();
        }
      });

      return originalXHRSend.call(this, ...args);
    };

    // Global error handler
    window.addEventListener('error', async (event) => {
      if (this.isFirestoreError(event.error)) {
        console.log('🛡️ Global error interceptor caught Firestore error...');
        await UltraRobustFirestoreFix.ultraFixConnection();
      }
    });

    // Global promise rejection handler
    window.addEventListener('unhandledrejection', async (event) => {
      if (this.isFirestoreError(event.reason)) {
        console.log('🛡️ Global error interceptor caught Firestore promise rejection...');
        await UltraRobustFirestoreFix.ultraFixConnection();
      }
    });

    console.log('✅ Global error interceptor initialized');
  }

  /**
   * Check if error is Firestore-related
   */
  private static isFirestoreError(error: any): boolean {
    if (!error) return false;

    const errorString = JSON.stringify(error);
    const errorMessage = error.message || '';
    const errorCode = error.code || '';

    return (
      errorString.includes('firestore.googleapis.com') ||
      errorString.includes('Write/channel') ||
      errorString.includes('terminate') ||
      errorString.includes('gsessionid') ||
      errorString.includes('SID') ||
      errorString.includes('RID') ||
      errorMessage.includes('400') ||
      errorMessage.includes('Firestore') ||
      errorCode === 'unavailable' ||
      error.status === 400
    );
  }
}

// Auto-initialize DISABLED - Only initialize when explicitly imported
// if (typeof window !== 'undefined') {
//   GlobalErrorInterceptor.initialize();
// }

export default GlobalErrorInterceptor;
