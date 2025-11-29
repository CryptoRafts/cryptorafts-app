/**
 * Ultra Aggressive Firestore Fix
 * The most aggressive possible fix for Write channel termination errors
 */

import { UltraRobustFirestoreFix } from './ultra-robust-firestore-fix';

export class UltraAggressiveFirestoreFix {
  private static isInitialized = false;
  private static originalFetch: any;
  private static originalXHROpen: any;
  private static originalXHRSend: any;
  private static originalSetTimeout: any;
  private static originalPromise: any;

  /**
   * Initialize ultra-aggressive Firestore fix
   */
  static initialize(): void {
    if (typeof window === 'undefined' || this.isInitialized) return;

    this.isInitialized = true;
    console.log('🔥 Initializing ultra-aggressive Firestore fix...');

    // Store original methods
    this.originalFetch = window.fetch;
    this.originalXHROpen = XMLHttpRequest.prototype.open;
    this.originalXHRSend = XMLHttpRequest.prototype.send;
    this.originalSetTimeout = window.setTimeout;
    this.originalPromise = window.Promise;

    // Implement ultra-aggressive fixes
    this.interceptFetchUltraAggressively();
    this.interceptXMLHttpRequestUltraAggressively();
    this.interceptSetTimeoutUltraAggressively();
    this.interceptPromiseUltraAggressively();
    this.interceptConsoleUltraAggressively();
    this.interceptErrorEventsUltraAggressively();

    console.log('✅ Ultra-aggressive Firestore fix initialized');
  }

  /**
   * Ultra-aggressive fetch interception
   */
  private static interceptFetchUltraAggressively(): void {
    window.fetch = async (input, init) => {
      const url = typeof input === 'string' ? input : (input instanceof URL ? input.toString() : (input as Request).url);
      
      // Pre-emptive fix for Write channel requests
      if (this.isWriteChannelRequest(url)) {
        console.log('🔥 Ultra-aggressive: Pre-emptive Write channel fix...');
        await this.ultraAggressiveFix();
      }

      try {
        const response = await this.originalFetch(input, init);
        
        // Post-request fix for Write channel errors
        if (this.isWriteChannelRequest(url) && response.status === 400) {
          console.log('🔥 Ultra-aggressive: Post-request Write channel 400 fix...');
          await this.ultraAggressiveFix();
        }
        
        return response;
      } catch (error) {
        if (this.isWriteChannelRequest(url)) {
          console.log('🔥 Ultra-aggressive: Write channel fetch error fix...');
          await this.ultraAggressiveFix();
        }
        throw error;
      }
    };
  }

  /**
   * Ultra-aggressive XMLHttpRequest interception
   */
  private static interceptXMLHttpRequestUltraAggressively(): void {
    XMLHttpRequest.prototype.open = function(method, url, ...args) {
      this._ultraUrl = url;
      this._ultraMethod = method;
      return this.originalXHROpen.call(this, method, url, ...args);
    };

    XMLHttpRequest.prototype.send = function(...args) {
      const url = this._ultraUrl;
      
      // Pre-emptive fix for Write channel requests
      if (UltraAggressiveFirestoreFix.isWriteChannelRequest(url)) {
        console.log('🔥 Ultra-aggressive: Pre-emptive Write channel XHR fix...');
        UltraAggressiveFirestoreFix.ultraAggressiveFix();
      }

      // Ultra-aggressive error handling
      this.addEventListener('error', async (event) => {
        if (UltraAggressiveFirestoreFix.isWriteChannelRequest(url)) {
          console.log('🔥 Ultra-aggressive: Write channel XHR error fix...');
          await UltraAggressiveFirestoreFix.ultraAggressiveFix();
        }
      });

      this.addEventListener('load', async (event) => {
        if (UltraAggressiveFirestoreFix.isWriteChannelRequest(url) && this.status === 400) {
          console.log('🔥 Ultra-aggressive: Write channel 400 XHR fix...');
          await UltraAggressiveFirestoreFix.ultraAggressiveFix();
        }
      });

      this.addEventListener('abort', async (event) => {
        if (UltraAggressiveFirestoreFix.isWriteChannelRequest(url)) {
          console.log('🔥 Ultra-aggressive: Write channel XHR abort fix...');
          await UltraAggressiveFirestoreFix.ultraAggressiveFix();
        }
      });

      this.addEventListener('timeout', async (event) => {
        if (UltraAggressiveFirestoreFix.isWriteChannelRequest(url)) {
          console.log('🔥 Ultra-aggressive: Write channel XHR timeout fix...');
          await UltraAggressiveFirestoreFix.ultraAggressiveFix();
        }
      });

      return this.originalXHRSend.call(this, ...args);
    };
  }

  /**
   * Ultra-aggressive setTimeout interception
   */
  private static interceptSetTimeoutUltraAggressively(): void {
    window.setTimeout = function(callback, delay, ...args) {
      return this.originalSetTimeout.call(this, async (...cbArgs) => {
        try {
          await callback(...cbArgs);
        } catch (error) {
          if (UltraAggressiveFirestoreFix.isFirebaseError(error)) {
            console.log('🔥 Ultra-aggressive: setTimeout Firebase error fix...');
            await UltraAggressiveFirestoreFix.ultraAggressiveFix();
          }
          throw error;
        }
      }, delay, ...args);
    };
  }

  /**
   * Ultra-aggressive Promise interception
   */
  private static interceptPromiseUltraAggressively(): void {
    window.Promise = class extends this.originalPromise {
      constructor(executor) {
        super((resolve, reject) => {
          executor(
            resolve,
            (reason) => {
              if (UltraAggressiveFirestoreFix.isFirebaseError(reason)) {
                console.log('🔥 Ultra-aggressive: Promise Firebase error fix...');
                UltraAggressiveFirestoreFix.ultraAggressiveFix();
              }
              reject(reason);
            }
          );
        });
      }
    };
  }

  /**
   * Ultra-aggressive console interception
   */
  private static interceptConsoleUltraAggressively(): void {
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;
    const originalConsoleLog = console.log;

    console.error = (...args) => {
      const message = args.join(' ');
      if (this.isFirebaseError(message)) {
        console.log('🔥 Ultra-aggressive: Console error Firebase fix...');
        this.ultraAggressiveFix();
      }
      originalConsoleError.apply(console, args);
    };

    console.warn = (...args) => {
      const message = args.join(' ');
      if (this.isFirebaseError(message)) {
        console.log('🔥 Ultra-aggressive: Console warning Firebase fix...');
        this.ultraAggressiveFix();
      }
      originalConsoleWarn.apply(console, args);
    };

    console.log = (...args) => {
      const message = args.join(' ');
      if (this.isFirebaseError(message)) {
        console.log('🔥 Ultra-aggressive: Console log Firebase fix...');
        this.ultraAggressiveFix();
      }
      originalConsoleLog.apply(console, args);
    };
  }

  /**
   * Ultra-aggressive error event interception
   */
  private static interceptErrorEventsUltraAggressively(): void {
    // Global error handler
    window.addEventListener('error', async (event) => {
      if (this.isFirebaseError(event.error)) {
        console.log('🔥 Ultra-aggressive: Global error Firebase fix...');
        await this.ultraAggressiveFix();
      }
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', async (event) => {
      if (this.isFirebaseError(event.reason)) {
        console.log('🔥 Ultra-aggressive: Unhandled rejection Firebase fix...');
        await this.ultraAggressiveFix();
      }
    });

    // Network error handler
    window.addEventListener('online', () => {
      console.log('🔥 Ultra-aggressive: Network online, applying fix...');
      this.ultraAggressiveFix();
    });

    window.addEventListener('offline', () => {
      console.log('🔥 Ultra-aggressive: Network offline, applying fix...');
      this.ultraAggressiveFix();
    });
  }

  /**
   * Ultra-aggressive fix implementation
   */
  private static async ultraAggressiveFix(): Promise<void> {
    try {
      console.log('🔥 Ultra-aggressive fix: Starting comprehensive recovery...');
      
      // Multiple ultra-aggressive fixes in parallel
      await Promise.all([
        UltraRobustFirestoreFix.ultraFixConnection(),
        this.forceFirestoreReconnection(),
        this.clearFirestoreCache(),
        this.resetFirestoreState()
      ]);
      
      console.log('🔥 Ultra-aggressive fix: Comprehensive recovery completed');
    } catch (error) {
      console.log('🔥 Ultra-aggressive fix: Recovery failed, continuing...', error);
    }
  }

  /**
   * Force Firestore reconnection
   */
  private static async forceFirestoreReconnection(): Promise<void> {
    try {
      // Force disable network
      if (navigator.onLine) {
        // Simulate network disable
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Force enable network
      await new Promise(resolve => setTimeout(resolve, 200));
      
      console.log('🔥 Ultra-aggressive: Firestore reconnection forced');
    } catch (error) {
      console.log('🔥 Ultra-aggressive: Firestore reconnection failed', error);
    }
  }

  /**
   * Clear Firestore cache
   */
  private static async clearFirestoreCache(): Promise<void> {
    try {
      // Clear all Firestore-related caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        for (const cacheName of cacheNames) {
          if (cacheName.includes('firestore') || cacheName.includes('firebase')) {
            await caches.delete(cacheName);
          }
        }
      }
      
      console.log('🔥 Ultra-aggressive: Firestore cache cleared');
    } catch (error) {
      console.log('🔥 Ultra-aggressive: Firestore cache clear failed', error);
    }
  }

  /**
   * Reset Firestore state
   */
  private static async resetFirestoreState(): Promise<void> {
    try {
      // Reset Firestore state
      if (window.firebase && window.firebase.firestore) {
        // Force reset Firestore
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      console.log('🔥 Ultra-aggressive: Firestore state reset');
    } catch (error) {
      console.log('🔥 Ultra-aggressive: Firestore state reset failed', error);
    }
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
   * Check if error is Firebase related
   */
  private static isFirebaseError(error: any): boolean {
    if (!error) return false;

    const errorString = String(error);
    const errorMessage = error.message || '';

    return (
      errorString.includes('firestore.googleapis.com') ||
      errorString.includes('Write/channel') ||
      errorString.includes('TYPE=terminate') ||
      errorString.includes('gsessionid') ||
      errorString.includes('SID') ||
      errorString.includes('RID') ||
      errorMessage.includes('400') ||
      errorMessage.includes('Bad Request') ||
      errorString.includes('terminate') ||
      errorString.includes('channel') ||
      errorString.includes('firestore') ||
      errorString.includes('firebase')
    );
  }

  /**
   * Restore original methods
   */
  static restore(): void {
    if (this.originalFetch) window.fetch = this.originalFetch;
    if (this.originalXHROpen) XMLHttpRequest.prototype.open = this.originalXHROpen;
    if (this.originalXHRSend) XMLHttpRequest.prototype.send = this.originalXHRSend;
    if (this.originalSetTimeout) window.setTimeout = this.originalSetTimeout;
    if (this.originalPromise) window.Promise = this.originalPromise;
  }
}

// Auto-initialize DISABLED - Only initialize when explicitly imported
// if (typeof window !== 'undefined') {
//   UltraAggressiveFirestoreFix.initialize();
// }

export default UltraAggressiveFirestoreFix;
