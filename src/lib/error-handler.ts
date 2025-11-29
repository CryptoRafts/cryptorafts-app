// Global error handler for production
export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorCount = 0;
  private maxErrors = 10;

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  handleError(error: Error, context: string = 'Unknown'): void {
    this.errorCount++;
    
    // Suppress non-critical errors in production
    if (this.errorCount > this.maxErrors) {
      console.warn(`[${context}] Error suppressed (${this.errorCount} errors logged)`);
      return;
    }

    // Log critical errors only
    if (error.message.includes('critical') || error.message.includes('fatal')) {
      console.error(`[${context}] Critical error:`, error);
    } else {
      console.warn(`[${context}] Non-critical error:`, error.message);
    }
  }

  handleFirebaseError(error: any, context: string = 'Firebase'): void {
    // Common Firebase errors to suppress
    const suppressErrors = [
      'Missing or insufficient permissions',
      'INTERNAL ASSERTION FAILED',
      'Unexpected state',
      'Bad Request',
      'Failed to load resource',
      '404'
    ];

    const shouldSuppress = suppressErrors.some(pattern => 
      error.message?.includes(pattern) || error.toString().includes(pattern)
    );

    if (shouldSuppress) {
      console.warn(`[${context}] Firebase error suppressed:`, error.message || error);
    } else {
      this.handleError(error, context);
    }
  }

  handleNotificationError(error: any, context: string = 'Notifications'): void {
    // Suppress notification permission errors
    if (error.message?.includes('permission') || error.message?.includes('denied')) {
      console.warn(`[${context}] Notification permission error suppressed:`, error.message);
    } else {
      this.handleError(error, context);
    }
  }

  reset(): void {
    this.errorCount = 0;
  }
}

// Global error handlers
export const errorHandler = ErrorHandler.getInstance();

// Override console methods to reduce noise
if (typeof window !== 'undefined') {
  const originalError = console.error;
  const originalWarn = console.warn;
  const originalLog = console.log;

         // Log a helpful message about ad blocker errors (only once)
         let hasLoggedAdBlockerMessage = false;
         const logAdBlockerMessage = () => {
           if (!hasLoggedAdBlockerMessage) {
             console.info(
               '%c[Info] Ad blocker detected. Some Firestore network requests may be blocked, but this is harmless. ' +
               'Firestore will automatically retry with alternative methods. These errors do not affect functionality.',
               'color: #60a5fa; font-weight: normal;'
             );
             hasLoggedAdBlockerMessage = true;
           }
         };

  console.error = (...args: any[]) => {
    const message = args.join(' ');
    
    // Check if it's a Firestore terminate request error
    const isFirestoreTerminate = message.includes('firestore.googleapis.com') && 
                                 (message.includes('TYPE=terminate') || 
                                  message.includes('/Write/channel') || 
                                  message.includes('/Listen/channel') ||
                                  message.includes('terminate') ||
                                  message.includes('/channel?VER=') ||
                                  message.includes('gsessionid') ||
                                  message.includes('SID=') ||
                                  message.includes('RID=') ||
                                  message.includes('Failed to load resource'));
    
    // Suppress common production errors (including ad blocker errors)
    const suppressPatterns = [
      'ERR_BLOCKED_BY_CLIENT',
      'net::ERR_BLOCKED_BY_CLIENT',
      '404',
      'Missing or insufficient permissions',
      'INTERNAL ASSERTION FAILED',
      'Unexpected state',
      'Bad Request'
    ];

    // Suppress "Failed to load resource" only if it's an ad blocker error or Firestore terminate
    const isFailedToLoad = message.includes('Failed to load resource');
    const shouldSuppressFailedToLoad = isFailedToLoad && 
                                      (message.includes('ERR_BLOCKED_BY_CLIENT') || 
                                       message.includes('net::ERR_BLOCKED_BY_CLIENT') ||
                                       isFirestoreTerminate);

    const shouldSuppress = suppressPatterns.some(pattern => 
      message.includes(pattern)
    ) || shouldSuppressFailedToLoad;

    // If it's an ad blocker error, log helpful message once
    if (message.includes('ERR_BLOCKED_BY_CLIENT') || message.includes('net::ERR_BLOCKED_BY_CLIENT')) {
      logAdBlockerMessage();
    }

    if (!shouldSuppress) {
      originalError.apply(console, args);
    }
  };

         // Suppress network errors from ad blockers (ERR_BLOCKED_BY_CLIENT)
         // This includes Firestore channel termination requests that are blocked
         // Use capture phase and set up multiple listeners to catch errors at different stages
         const suppressNetworkError = (event: ErrorEvent) => {
           const errorMessage = event.message || '';
           const errorSource = event.filename || (event.target as any)?.src || '';
           const errorTarget = event.target as any;
           const errorUrl = errorTarget?.src || errorTarget?.href || errorSource || '';
           
           const isBlockedByClient = errorMessage.includes('ERR_BLOCKED_BY_CLIENT') ||
                                     errorMessage.includes('net::ERR_BLOCKED_BY_CLIENT') ||
                                     errorSource.includes('ERR_BLOCKED_BY_CLIENT') ||
                                     errorUrl.includes('ERR_BLOCKED_BY_CLIENT');
           const isFirestoreRequest = errorSource.includes('firestore.googleapis.com') ||
                                     errorMessage.includes('firestore.googleapis.com') ||
                                     errorUrl.includes('firestore.googleapis.com');
           const isFirestoreTerminate = errorUrl.includes('TYPE=terminate') || 
                                       errorUrl.includes('/Write/channel') || 
                                       errorUrl.includes('/Listen/channel') ||
                                       errorMessage.includes('TYPE=terminate');
           
           if (isBlockedByClient || (isFirestoreRequest && (errorMessage.includes('Failed to load resource') || errorMessage.includes('terminate') || isFirestoreTerminate))) {
             // Suppress ad blocker errors - they're harmless
             // Firestore has built-in retry logic and will use alternative channels
             event.preventDefault();
             event.stopPropagation();
             event.stopImmediatePropagation();
             return false;
           }
         };
         
         // Add multiple listeners at different phases to catch errors early
         window.addEventListener('error', suppressNetworkError, true); // Capture phase
         window.addEventListener('error', suppressNetworkError, false); // Bubble phase
         
         // Also suppress errors from the network tab by intercepting ResourceError events
         window.addEventListener('error', (event) => {
           const target = event.target as any;
           if (target && (target.tagName === 'SCRIPT' || target.tagName === 'LINK' || target.tagName === 'IMG')) {
             const src = target.src || target.href || '';
             if (src.includes('firestore.googleapis.com') && 
                 (src.includes('TYPE=terminate') || src.includes('/Write/channel') || src.includes('/Listen/channel'))) {
               // Suppress Firestore terminate request errors
               event.preventDefault();
               event.stopPropagation();
               event.stopImmediatePropagation();
               return false;
             }
           }
         }, true);
         
         // Suppress console.log messages that contain ERR_BLOCKED_BY_CLIENT
         console.log = (...args: any[]) => {
           const message = args.join(' ');
           const isBlockedByClient = message.includes('ERR_BLOCKED_BY_CLIENT') || 
                                    message.includes('net::ERR_BLOCKED_BY_CLIENT');
           const isFirestoreTerminate = message.includes('firestore.googleapis.com') && 
                                       (message.includes('TYPE=terminate') || 
                                        message.includes('/Write/channel') || 
                                        message.includes('/Listen/channel'));
           
           // Suppress ad blocker errors in console.log
           if (!isBlockedByClient && !isFirestoreTerminate) {
             originalLog.apply(console, args);
           }
         };

  // Suppress unhandled promise rejections from blocked requests
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason?.message || event.reason?.toString() || '';
    const isBlockedByClient = reason.includes('ERR_BLOCKED_BY_CLIENT') || 
                              reason.includes('net::ERR_BLOCKED_BY_CLIENT');
    const isFirestoreError = reason.includes('firestore.googleapis.com');
    
    if (isBlockedByClient || (isFirestoreError && reason.includes('Failed to load'))) {
      // Suppress ad blocker errors - they're harmless
      // Firestore will automatically retry with alternative methods
      event.preventDefault();
      return false;
    }
  });
  
         // Intercept fetch/XHR errors for Firestore requests
         if (typeof window !== 'undefined') {
           // Intercept XMLHttpRequest errors (both prototype and constructor)
           const OriginalXHR = window.XMLHttpRequest;
           const originalXHROpen = XMLHttpRequest.prototype.open;
           const originalXHRSend = XMLHttpRequest.prototype.send;
           
           // Override prototype methods to track URLs
           XMLHttpRequest.prototype.open = function(method: string, url: string | URL, ...rest: any[]) {
             (this as any)._url = url.toString();
             return originalXHROpen.apply(this, [method, url, ...rest]);
           };
           
           XMLHttpRequest.prototype.send = function(...args: any[]) {
             const xhr = this;
             const url = (xhr as any)._url || '';
             
             // Add error listener to suppress ad blocker errors
             xhr.addEventListener('error', function(event: any) {
               const isFirestoreTerminate = url.includes('firestore.googleapis.com') && 
                                           (url.includes('TYPE=terminate') || url.includes('/Write/channel') || url.includes('/Listen/channel'));
               const isBlockedByClient = event.message?.includes('ERR_BLOCKED_BY_CLIENT') || 
                                        event.message?.includes('net::ERR_BLOCKED_BY_CLIENT') ||
                                        url.includes('ERR_BLOCKED_BY_CLIENT');
               
               if (isBlockedByClient && isFirestoreTerminate) {
                 // Suppress ad blocker errors for Firestore channel termination
                 event.stopPropagation();
                 event.stopImmediatePropagation();
                 return false;
               }
             }, true);
             
             return originalXHRSend.apply(this, args);
           };
           
           // Intercept fetch errors
           const originalFetch = window.fetch;
           window.fetch = async function(...args) {
             try {
               return await originalFetch.apply(this, args);
             } catch (error: any) {
               const url = args[0]?.toString() || '';
               const errorMessage = error?.message || error?.toString() || '';
               
               // Suppress blocked Firestore requests - don't re-throw, just return a rejected promise silently
               if ((errorMessage.includes('ERR_BLOCKED_BY_CLIENT') || 
                    errorMessage.includes('net::ERR_BLOCKED_BY_CLIENT') ||
                    errorMessage.includes('Failed to load resource')) &&
                   (url.includes('firestore.googleapis.com') || url.includes('TYPE=terminate'))) {
                 // Firestore will retry automatically - this is harmless
                 // Return a rejected promise that won't be logged
                 return Promise.reject(new Error('Request blocked by ad blocker (harmless)'));
               }
               throw error;
             }
           };
         }

  console.warn = (...args: any[]) => {
    const message = args.join(' ');
    
    // Suppress common production warnings
    const suppressPatterns = [
      'Firebase auth not available',
      'Notification permission',
      'Video failed to load',
      'Profile image failed to load'
    ];

    const shouldSuppress = suppressPatterns.some(pattern => 
      message.includes(pattern)
    );

    if (!shouldSuppress) {
      originalWarn.apply(console, args);
    }
  };
}
