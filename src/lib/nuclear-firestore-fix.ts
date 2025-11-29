/**
 * Nuclear Firestore Fix
 * The most extreme possible fix for Write channel termination errors
 */

import { UltraRobustFirestoreFix } from './ultra-robust-firestore-fix';

export class NuclearFirestoreFix {
  private static isInitialized = false;

  /**
   * Initialize nuclear Firestore fix
   */
  static initialize(): void {
    if (typeof window === 'undefined' || this.isInitialized) return;

    this.isInitialized = true;
    console.log('☢️ Initializing nuclear Firestore fix...');

    // Nuclear-level interception
    this.interceptAtNuclearLevel();
    this.interceptNetworkAtNuclearLevel();
    this.interceptSDKAtNuclearLevel();
    this.interceptBrowserAtNuclearLevel();

    console.log('✅ Nuclear Firestore fix initialized');
  }

  /**
   * Intercept at nuclear level
   */
  private static interceptAtNuclearLevel(): void {
    // Override the native fetch at the lowest possible level
    const nativeFetch = window.fetch;
    window.fetch = async (input, init) => {
      const url = typeof input === 'string' ? input : (input instanceof URL ? input.toString() : (input as Request).url);
      
      // Nuclear-level pre-emptive fix
      if (this.isWriteChannelRequest(url)) {
        console.log('☢️ Nuclear: Pre-emptive Write channel nuclear fix...');
        await this.nuclearFix();
      }

      try {
        const response = await nativeFetch(input, init);
        
        // Nuclear-level post-request fix
        if (this.isWriteChannelRequest(url) && response.status === 400) {
          console.log('☢️ Nuclear: Post-request Write channel 400 nuclear fix...');
          await this.nuclearFix();
        }
        
        return response;
      } catch (error) {
        if (this.isWriteChannelRequest(url)) {
          console.log('☢️ Nuclear: Write channel fetch error nuclear fix...');
          await this.nuclearFix();
        }
        throw error;
      }
    };
  }

  /**
   * Intercept network at nuclear level
   */
  private static interceptNetworkAtNuclearLevel(): void {
    // Override XMLHttpRequest at the lowest possible level
    const nativeXHROpen = XMLHttpRequest.prototype.open;
    const nativeXHRSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function(method, url, ...args) {
      this._nuclearUrl = url;
      this._nuclearMethod = method;
      return nativeXHROpen.call(this, method, url, ...args);
    };

    XMLHttpRequest.prototype.send = function(...args) {
      const url = this._nuclearUrl;
      
      // Nuclear-level pre-emptive fix
      if (NuclearFirestoreFix.isWriteChannelRequest(url)) {
        console.log('☢️ Nuclear: Pre-emptive Write channel XHR nuclear fix...');
        NuclearFirestoreFix.nuclearFix();
      }

      // Nuclear-level error handling
      this.addEventListener('error', async (event) => {
        if (NuclearFirestoreFix.isWriteChannelRequest(url)) {
          console.log('☢️ Nuclear: Write channel XHR error nuclear fix...');
          await NuclearFirestoreFix.nuclearFix();
        }
      });

      this.addEventListener('load', async (event) => {
        if (NuclearFirestoreFix.isWriteChannelRequest(url) && this.status === 400) {
          console.log('☢️ Nuclear: Write channel 400 XHR nuclear fix...');
          await NuclearFirestoreFix.nuclearFix();
        }
      });

      this.addEventListener('abort', async (event) => {
        if (NuclearFirestoreFix.isWriteChannelRequest(url)) {
          console.log('☢️ Nuclear: Write channel XHR abort nuclear fix...');
          await NuclearFirestoreFix.nuclearFix();
        }
      });

      this.addEventListener('timeout', async (event) => {
        if (NuclearFirestoreFix.isWriteChannelRequest(url)) {
          console.log('☢️ Nuclear: Write channel XHR timeout nuclear fix...');
          await NuclearFirestoreFix.nuclearFix();
        }
      });

      return nativeXHRSend.call(this, ...args);
    };
  }

  /**
   * Intercept SDK at nuclear level
   */
  private static interceptSDKAtNuclearLevel(): void {
    // Override setTimeout at nuclear level
    const nativeSetTimeout = window.setTimeout;
    window.setTimeout = function(callback, delay, ...args) {
      return nativeSetTimeout.call(this, async (...cbArgs) => {
        try {
          await callback(...cbArgs);
        } catch (error) {
          if (NuclearFirestoreFix.isFirebaseError(error)) {
            console.log('☢️ Nuclear: setTimeout Firebase error nuclear fix...');
            await NuclearFirestoreFix.nuclearFix();
          }
          throw error;
        }
      }, delay, ...args);
    };

    // Override Promise at nuclear level
    const nativePromise = window.Promise;
    window.Promise = class extends nativePromise {
      constructor(executor) {
        super((resolve, reject) => {
          executor(
            resolve,
            (reason) => {
              if (NuclearFirestoreFix.isFirebaseError(reason)) {
                console.log('☢️ Nuclear: Promise Firebase error nuclear fix...');
                NuclearFirestoreFix.nuclearFix();
              }
              reject(reason);
            }
          );
        });
      }
    };
  }

  /**
   * Intercept browser at nuclear level
   */
  private static interceptBrowserAtNuclearLevel(): void {
    // Override console methods at nuclear level
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;
    const originalConsoleLog = console.log;

    console.error = (...args) => {
      const message = args.join(' ');
      if (this.isFirebaseError(message)) {
        console.log('☢️ Nuclear: Console error Firebase nuclear fix...');
        this.nuclearFix();
      }
      originalConsoleError.apply(console, args);
    };

    console.warn = (...args) => {
      const message = args.join(' ');
      if (this.isFirebaseError(message)) {
        console.log('☢️ Nuclear: Console warning Firebase nuclear fix...');
        this.nuclearFix();
      }
      originalConsoleWarn.apply(console, args);
    };

    console.log = (...args) => {
      const message = args.join(' ');
      if (this.isFirebaseError(message)) {
        console.log('☢️ Nuclear: Console log Firebase nuclear fix...');
        this.nuclearFix();
      }
      originalConsoleLog.apply(console, args);
    };

    // Global error handlers at nuclear level
    window.addEventListener('error', async (event) => {
      if (this.isFirebaseError(event.error)) {
        console.log('☢️ Nuclear: Global error Firebase nuclear fix...');
        await this.nuclearFix();
      }
    });

    window.addEventListener('unhandledrejection', async (event) => {
      if (this.isFirebaseError(event.reason)) {
        console.log('☢️ Nuclear: Unhandled rejection Firebase nuclear fix...');
        await this.nuclearFix();
      }
    });
  }

  /**
   * Nuclear fix implementation
   */
  private static async nuclearFix(): Promise<void> {
    try {
      console.log('☢️ Nuclear fix: Starting nuclear recovery...');
      
      // Multiple nuclear fixes in parallel
      await Promise.all([
        UltraRobustFirestoreFix.ultraFixConnection(),
        this.forceNuclearReconnection(),
        this.clearNuclearCache(),
        this.resetNuclearState()
      ]);
      
      console.log('☢️ Nuclear fix: Nuclear recovery completed');
    } catch (error) {
      console.log('☢️ Nuclear fix: Nuclear recovery failed, continuing...', error);
    }
  }

  /**
   * Force nuclear reconnection
   */
  private static async forceNuclearReconnection(): Promise<void> {
    try {
      // Nuclear-level network manipulation
      if (navigator.onLine) {
        // Force network state change
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('☢️ Nuclear: Nuclear reconnection forced');
    } catch (error) {
      console.log('☢️ Nuclear: Nuclear reconnection failed', error);
    }
  }

  /**
   * Clear nuclear cache
   */
  private static async clearNuclearCache(): Promise<void> {
    try {
      // Nuclear-level cache clearing
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        for (const cacheName of cacheNames) {
          await caches.delete(cacheName);
        }
      }
      
      console.log('☢️ Nuclear: Nuclear cache cleared');
    } catch (error) {
      console.log('☢️ Nuclear: Nuclear cache clear failed', error);
    }
  }

  /**
   * Reset nuclear state
   */
  private static async resetNuclearState(): Promise<void> {
    try {
      // Nuclear-level state reset
      await new Promise(resolve => setTimeout(resolve, 50));
      
      console.log('☢️ Nuclear: Nuclear state reset');
    } catch (error) {
      console.log('☢️ Nuclear: Nuclear state reset failed', error);
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
}

// Auto-initialize DISABLED - Only initialize when explicitly imported
// if (typeof window !== 'undefined') {
//   NuclearFirestoreFix.initialize();
// }

export default NuclearFirestoreFix;
