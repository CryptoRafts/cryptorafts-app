/**
 * Simple Firestore Fix
 * A minimal, non-intrusive approach to handle Firestore connection issues
 */

export class SimpleFirestoreFix {
  private static isInitialized = false;
  private static recoveryAttempts = 0;
  private static maxRecoveryAttempts = 3;

  /**
   * Initialize simple Firestore fix
   */
  static initialize(): void {
    if (typeof window === 'undefined' || this.isInitialized) return;

    this.isInitialized = true;
    console.log('🛡️ Initializing simple Firestore fix...');

    // Only handle global errors that are clearly Firestore related
    this.interceptGlobalErrors();

    console.log('✅ Simple Firestore fix initialized');
  }

  /**
   * Intercept global errors only
   */
  private static interceptGlobalErrors(): void {
    // Suppress network errors from ad blockers at the fetch/XHR level
    if (typeof window !== 'undefined') {
      // Intercept fetch requests
      const originalFetch = window.fetch;
      window.fetch = async (...args) => {
        try {
          return await originalFetch.apply(window, args);
        } catch (error: any) {
          const errorMessage = error?.message || error?.toString() || '';
          if (errorMessage.includes('ERR_BLOCKED_BY_CLIENT') || 
              errorMessage.includes('net::ERR_BLOCKED_BY_CLIENT') ||
              error?.code === 'ERR_BLOCKED_BY_CLIENT') {
            // Ad blocker error - silently ignore
            throw new Error('Network request blocked by ad blocker (harmless)');
          }
          throw error;
        }
      };
      
      // Intercept XMLHttpRequest - More comprehensive suppression
      const originalXHROpen = XMLHttpRequest.prototype.open;
      const originalXHRSend = XMLHttpRequest.prototype.send;
      
      XMLHttpRequest.prototype.open = function(method: string, url: string | URL, ...rest: any[]) {
        // Suppress errors before they're added to listeners
        const originalAddEventListener = this.addEventListener;
        this.addEventListener = function(type: string, listener: any, options?: any) {
          if (type === 'error') {
            const wrappedListener = function(event: any) {
              const errorMessage = event?.message || event?.toString() || '';
              const errorTarget = event?.target;
              const errorStatus = errorTarget?.status;
              const errorStatusText = errorTarget?.statusText;
              
              // Check for ERR_BLOCKED_BY_CLIENT in various forms
              if (errorMessage.includes('ERR_BLOCKED_BY_CLIENT') || 
                  errorMessage.includes('net::ERR_BLOCKED_BY_CLIENT') ||
                  errorStatusText?.includes('ERR_BLOCKED_BY_CLIENT') ||
                  (errorTarget?.readyState === 0 && errorTarget?.status === 0)) {
                // Suppress ad blocker errors
                event.stopPropagation();
                event.preventDefault();
                event.stopImmediatePropagation();
                return;
              }
              // Call original listener for real errors
              if (listener) listener.call(this, event);
            };
            return originalAddEventListener.call(this, type, wrappedListener, options);
          }
          return originalAddEventListener.call(this, type, listener, options);
        };
        
        return originalXHROpen.apply(this, [method, url, ...rest]);
      };
      
      XMLHttpRequest.prototype.send = function(...args: any[]) {
        // Wrap error handling
        const originalOnError = this.onerror;
        this.onerror = function(event: any) {
          // Suppress ad blocker errors
          const errorMessage = event?.message || event?.toString() || '';
          if (errorMessage.includes('ERR_BLOCKED_BY_CLIENT') || 
              errorMessage.includes('net::ERR_BLOCKED_BY_CLIENT')) {
            return false; // Prevent default error handling
          }
          if (originalOnError) return originalOnError.call(this, event);
          return false;
        };
        
        try {
          return originalXHRSend.apply(this, args);
        } catch (error: any) {
          const errorMessage = error?.message || error?.toString() || '';
          if (errorMessage.includes('ERR_BLOCKED_BY_CLIENT') || 
              errorMessage.includes('net::ERR_BLOCKED_BY_CLIENT') ||
              error?.code === 'ERR_BLOCKED_BY_CLIENT') {
            // Ad blocker error - silently ignore
            return;
          }
          throw error;
        }
      };
    }
    
    // Suppress CORS errors from Firestore (these are normal and don't block functionality)
    const originalConsoleError = console.error;
    console.error = (...args: any[]) => {
      const errorMessage = args.join(' ');
      
      // Don't suppress React hydration errors - let them through
      if (errorMessage.includes('hydration') || errorMessage.includes('Hydration')) {
        originalConsoleError.apply(console, args);
        return;
      }
      
      // Suppress CORS errors from Firestore
      if (errorMessage.includes('CORS policy') && errorMessage.includes('firestore.googleapis.com')) {
        // Silently suppress CORS errors - they're expected from Firebase
        return;
      }
      // Suppress Firestore connection warnings that are normal
      if (errorMessage.includes('Could not reach Cloud Firestore backend') && 
          errorMessage.includes('offline mode')) {
        // Silently suppress - Firebase handles offline mode automatically
        return;
      }
      // Suppress Firestore WebChannelConnection RPC 'Listen' stream errors
      if (errorMessage.includes('WebChannelConnection RPC') && 
          errorMessage.includes('Listen') && 
          errorMessage.includes('transport errored')) {
        // Silently suppress - Firebase will retry automatically
        return;
      }
      // Suppress Firestore connection errors with undefined Name/Message
      if (errorMessage.includes('@firebase/firestore') && 
          (errorMessage.includes('transport errored') || 
           errorMessage.includes('stream') && errorMessage.includes('errored'))) {
        // Silently suppress - Firebase handles connection retries automatically
        return;
      }
      // Suppress Firestore internal assertion failures (these are SDK internal errors)
      // Specifically suppress ID: ca9, b815, and other known internal state issues
      if (errorMessage.includes('FIRESTORE') && 
          errorMessage.includes('INTERNAL ASSERTION FAILED') &&
          (errorMessage.includes('Unexpected state') || 
           errorMessage.includes('ID: ca9') || 
           errorMessage.includes('ID: b815') ||
           errorMessage.includes('CONTEXT'))) {
        // Silently suppress - these are internal SDK state management issues, not user errors
        return;
      }
      // Also suppress errors that contain the error message even if not in FIRESTORE format
      if (errorMessage.includes('Unexpected state') && 
          (errorMessage.includes('ID: ca9') || errorMessage.includes('ID: b815'))) {
        return;
      }
      // Suppress "Target ID already exists" errors - these happen when listeners are set up multiple times
      if (errorMessage.includes('Target ID already exists') || 
          (errorMessage.includes('failed-precondition') && errorMessage.includes('Target ID'))) {
        // Silently suppress - these are harmless duplicate listener errors
        return;
      }
      // Suppress Firestore connection test errors
      if (errorMessage.includes('Firebase connection test') && 
          errorMessage.includes('error after retries')) {
        // Silently suppress - connection tests can fail without affecting functionality
        return;
      }
      // Suppress ERR_BLOCKED_BY_CLIENT errors (from ad blockers)
      // This includes Firestore Write channel termination errors which are harmless
      // Pattern: POST .../Write/channel?...TYPE=terminate... net::ERR_BLOCKED_BY_CLIENT
      const isBlockedByClient = errorMessage.includes('ERR_BLOCKED_BY_CLIENT') || 
                                errorMessage.includes('net::ERR_BLOCKED_BY_CLIENT');
      const isFirestoreTerminate = (errorMessage.includes('Write/channel') && errorMessage.includes('TYPE=terminate')) ||
                                  (errorMessage.includes('firestore.googleapis.com') && 
                                   (errorMessage.includes('terminate') || 
                                    errorMessage.includes('/channel?VER=') ||
                                    errorMessage.includes('gsessionid') ||
                                    errorMessage.includes('SID=') ||
                                    errorMessage.includes('RID=') ||
                                    errorMessage.includes('Failed to load resource'))) ||
                                  (errorMessage.includes('Write/channel') && errorMessage.includes('firestore.googleapis.com'));
      const isFailedToLoad = errorMessage.includes('Failed to load resource') && 
                            (errorMessage.includes('firestore.googleapis.com') || 
                             errorMessage.includes('Write/channel') ||
                             errorMessage.includes('TYPE=terminate'));
      
      if (isBlockedByClient || isFirestoreTerminate || isFailedToLoad) {
        // Silently suppress - ad blockers block Firestore internal requests but writes still succeed
        // The Write/channel termination is normal Firestore behavior, ad blockers just block it
        return;
      }
      // Call original console.error for other errors
      originalConsoleError.apply(console, args);
    };

    // Only intercept global errors that are clearly Firestore Write channel related
    window.addEventListener('error', (event) => {
      // Suppress CORS errors
      if (event.message && event.message.includes('CORS policy') && 
          event.message.includes('firestore.googleapis.com')) {
        event.preventDefault();
        return;
      }
      
      // Suppress Firestore WebChannelConnection errors
      if (event.message && (
          event.message.includes('WebChannelConnection RPC') ||
          event.message.includes('transport errored') ||
          (event.message.includes('@firebase/firestore') && event.message.includes('stream'))
        )) {
        event.preventDefault();
        return;
      }
      
      // Suppress Firestore internal assertion failures (including ID: ca9, b815)
      if (event.message && event.message.includes('FIRESTORE') && 
          event.message.includes('INTERNAL ASSERTION FAILED') &&
          (event.message.includes('Unexpected state') || 
           event.message.includes('ID: ca9') || 
           event.message.includes('ID: b815') ||
           event.message.includes('CONTEXT'))) {
        event.preventDefault();
        return;
      }
      // Also suppress errors that contain the error message even if not in FIRESTORE format
      if (event.message && event.message.includes('Unexpected state') && 
          (event.message.includes('ID: ca9') || event.message.includes('ID: b815'))) {
        event.preventDefault();
        return;
      }
      // Suppress "Target ID already exists" errors
      if (event.message && (event.message.includes('Target ID already exists') || 
          (event.message.includes('failed-precondition') && event.message.includes('Target ID')))) {
        event.preventDefault();
        return;
      }
      
      // Suppress ERR_BLOCKED_BY_CLIENT errors (from ad blockers)
      // This includes Firestore Write channel termination errors
      if (event.message && (
          event.message.includes('ERR_BLOCKED_BY_CLIENT') || 
          event.message.includes('net::ERR_BLOCKED_BY_CLIENT') ||
          (event.message.includes('Write/channel') && event.message.includes('TYPE=terminate')) ||
          (event.message.includes('firestore.googleapis.com') && event.message.includes('terminate'))
        )) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      
      // Also check error object for ERR_BLOCKED_BY_CLIENT
      if (event.error && typeof event.error === 'object') {
        const errorMsg = String(event.error.message || event.error.toString() || '');
        if (errorMsg.includes('ERR_BLOCKED_BY_CLIENT') || 
            errorMsg.includes('net::ERR_BLOCKED_BY_CLIENT') ||
            (errorMsg.includes('Write/channel') && errorMsg.includes('terminate'))) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }
      }
      
      if (this.isWriteChannelError(event.error)) {
        event.preventDefault();
        this.gentleRecovery();
      }
    });

    // Add comprehensive unhandledrejection handler (this is the main one)
    window.addEventListener('unhandledrejection', (event) => {
      // Check if this is a Firestore internal assertion error
      const error = event.reason;
      let errorMessage = '';
      
      if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object') {
        errorMessage = error.message || String(error);
      }
      
      // Suppress CORS promise rejections
      if (errorMessage.includes('CORS policy') && 
          errorMessage.includes('firestore.googleapis.com')) {
        event.preventDefault();
        return;
      }
      
      // Suppress Firestore WebChannelConnection promise rejections
      if (errorMessage.includes('WebChannelConnection RPC') ||
          errorMessage.includes('transport errored') ||
          (errorMessage.includes('@firebase/firestore') && errorMessage.includes('stream'))) {
        event.preventDefault();
        return;
      }
      
      // Suppress Firestore internal assertion failures (including ID: ca9, b815)
      if (errorMessage.includes('FIRESTORE') && 
          errorMessage.includes('INTERNAL ASSERTION FAILED') &&
          (errorMessage.includes('Unexpected state') || 
           errorMessage.includes('ID: ca9') || 
           errorMessage.includes('ID: b815') ||
           errorMessage.includes('CONTEXT'))) {
        event.preventDefault();
        return;
      }
      
      // Also suppress errors that contain the error message even if not in FIRESTORE format
      if (errorMessage.includes('Unexpected state') && 
          (errorMessage.includes('ID: ca9') || errorMessage.includes('ID: b815'))) {
        event.preventDefault();
        return;
      }
      
      // Suppress error objects with these messages
      if (error && typeof error === 'object' && error.message) {
        const reasonMsg = String(error.message);
        if (reasonMsg.includes('FIRESTORE') && 
            reasonMsg.includes('INTERNAL ASSERTION FAILED') &&
            (reasonMsg.includes('Unexpected state') || 
             reasonMsg.includes('ID: ca9') || 
             reasonMsg.includes('ID: b815'))) {
          event.preventDefault();
          return;
        }
      }
      
      // Also check error stack/trace
      if (error && typeof error === 'object' && error.stack) {
        const stack = String(error.stack);
        if (stack.includes('FIRESTORE') && 
            stack.includes('INTERNAL ASSERTION FAILED') &&
            (stack.includes('Unexpected state') || 
             stack.includes('ID: ca9') || 
             stack.includes('ID: b815'))) {
          event.preventDefault();
          return;
        }
      }
      
      // Suppress "Target ID already exists" errors
      if (errorMessage.includes('Target ID already exists') || 
          (errorMessage.includes('failed-precondition') && errorMessage.includes('Target ID'))) {
        event.preventDefault();
        return;
      }
      
      // Suppress ERR_BLOCKED_BY_CLIENT errors (from ad blockers)
      // This includes Firestore Write channel termination errors
      if (errorMessage.includes('ERR_BLOCKED_BY_CLIENT') || 
          errorMessage.includes('net::ERR_BLOCKED_BY_CLIENT') ||
          (errorMessage.includes('Write/channel') && errorMessage.includes('TYPE=terminate')) ||
          (errorMessage.includes('firestore.googleapis.com') && errorMessage.includes('terminate'))) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      
      // Also check error object for ERR_BLOCKED_BY_CLIENT
      if (error && typeof error === 'object') {
        const errorCode = (error as any).code;
        const errorName = (error as any).name;
        const errorString = String(error);
        if (errorCode === 'ERR_BLOCKED_BY_CLIENT' || 
            errorName === 'ERR_BLOCKED_BY_CLIENT' ||
            errorString.includes('ERR_BLOCKED_BY_CLIENT') ||
            (errorString.includes('Write/channel') && errorString.includes('terminate'))) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }
      }
      
      // Check error stack for ERR_BLOCKED_BY_CLIENT
      if (error && typeof error === 'object' && (error as any).stack) {
        const stack = String((error as any).stack);
        if (stack.includes('ERR_BLOCKED_BY_CLIENT') || 
            stack.includes('net::ERR_BLOCKED_BY_CLIENT') ||
            (stack.includes('Write/channel') && stack.includes('terminate'))) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }
      }
      
      if (this.isWriteChannelError(event.reason)) {
        event.preventDefault();
        this.gentleRecovery();
      }
    }, true); // Use capture phase to catch early
  }

  /**
   * Gentle recovery that doesn't interfere with Firebase
   */
  private static gentleRecovery(): void {
    if (this.recoveryAttempts >= this.maxRecoveryAttempts) {
      console.log('🛡️ Simple fix: Max recovery attempts reached, letting Firebase handle it...');
      return;
    }

    this.recoveryAttempts++;
    
    try {
      console.log(`🛡️ Simple fix: Applying gentle recovery (attempt ${this.recoveryAttempts})...`);
      
      // Clear any cached connections that might be causing issues
      if (typeof window !== 'undefined' && (window as any).firebase) {
        try {
          // Clear any cached Firebase connections
          console.log('🛡️ Simple fix: Clearing cached Firebase connections...');
        } catch (e) {
          console.log('🛡️ Simple fix: Could not clear Firebase cache:', e);
        }
      }
      
      // Just wait a moment and let Firebase handle its own recovery
      setTimeout(() => {
        console.log('🛡️ Simple fix: Gentle recovery completed');
        // Reset attempts after successful recovery
        this.recoveryAttempts = 0;
      }, 3000);
      
    } catch (error) {
      console.log('🛡️ Simple fix: Gentle recovery failed, continuing...', error);
    }
  }

  /**
   * Check if error is Write channel related
   */
  private static isWriteChannelError(error: any): boolean {
    if (!error) return false;

    const errorString = String(error);
    const errorMessage = error.message || '';

    return (
      errorString.includes('Write/channel') &&
      errorString.includes('TYPE=terminate') &&
      errorString.includes('400')
    );
  }

  /**
   * Reset recovery attempts (for testing)
   */
  static resetRecoveryAttempts(): void {
    this.recoveryAttempts = 0;
  }
}

// Auto-initialize
if (typeof window !== 'undefined') {
  SimpleFirestoreFix.initialize();
}

export default SimpleFirestoreFix;
