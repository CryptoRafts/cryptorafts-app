/**
 * Firebase Error Handler
 * Comprehensive error handling for Firebase services
 */

export class FirebaseErrorHandler {
  /**
   * Handle Firebase authentication errors
   */
  static handleAuthError(error: any, context: string = 'Authentication') {
    console.error(`❌ ${context} Error:`, error);
    
    if (error.code) {
      switch (error.code) {
        case 'auth/user-not-found':
          return 'User not found. Please check your email and try again.';
        case 'auth/wrong-password':
          return 'Incorrect password. Please try again.';
        case 'auth/email-already-in-use':
          return 'An account with this email already exists.';
        case 'auth/weak-password':
          return 'Password is too weak. Please choose a stronger password.';
        case 'auth/invalid-email':
          return 'Invalid email address. Please check your email.';
        case 'auth/too-many-requests':
          return 'Too many attempts. Please wait a moment and try again.';
        case 'auth/network-request-failed':
          return 'Network error. Please check your connection and try again.';
        case 'auth/popup-closed-by-user':
          return 'Sign-in was cancelled. Please try again.';
        case 'auth/popup-blocked':
          return 'Popup was blocked. Please allow popups for this site.';
        default:
          return error.message || 'An authentication error occurred.';
      }
    }
    
    return error.message || 'An unexpected error occurred.';
  }

  /**
   * Handle Firestore errors
   */
  static handleFirestoreError(error: any, context: string = 'Firestore') {
    console.error(`❌ ${context} Error:`, error);
    
    if (error.code) {
      switch (error.code) {
        case 'permission-denied':
          return 'Permission denied. You may not have access to this data.';
        case 'unavailable':
          return 'Service temporarily unavailable. Please try again.';
        case 'deadline-exceeded':
          return 'Request timeout. Please try again.';
        case 'resource-exhausted':
          return 'Service temporarily overloaded. Please try again.';
        case 'unauthenticated':
          return 'Authentication required. Please sign in again.';
        case 'not-found':
          return 'Data not found.';
        default:
          return error.message || 'A database error occurred.';
      }
    }
    
    return error.message || 'A database error occurred.';
  }

  /**
   * Handle Firebase Storage errors
   */
  static handleStorageError(error: any, context: string = 'Storage') {
    console.error(`❌ ${context} Error:`, error);
    
    if (error.code) {
      switch (error.code) {
        case 'storage/unauthorized':
          return 'You do not have permission to access this file.';
        case 'storage/canceled':
          return 'Upload was cancelled.';
        case 'storage/unknown':
          return 'An unknown error occurred during file upload.';
        case 'storage/invalid-format':
          return 'Invalid file format. Please check the file type.';
        case 'storage/invalid-checksum':
          return 'File corruption detected. Please try again.';
        default:
          return error.message || 'A storage error occurred.';
      }
    }
    
    return error.message || 'A storage error occurred.';
  }

  /**
   * Handle general Firebase errors
   */
  static handleFirebaseError(error: any, context: string = 'Firebase') {
    console.error(`❌ ${context} Error:`, error);
    
    // Check if it's a network error
    if (error.code === 'unavailable' || error.message?.includes('network')) {
      return 'Network error. Please check your connection and try again.';
    }
    
    // Check if it's a permission error
    if (error.code === 'permission-denied' || error.message?.includes('permission')) {
      return 'Permission denied. You may not have access to this feature.';
    }
    
    // Check if it's an authentication error
    if (error.code === 'unauthenticated' || error.message?.includes('auth')) {
      return 'Authentication required. Please sign in again.';
    }
    
    return error.message || 'An unexpected error occurred.';
  }

  /**
   * Handle connection errors
   */
  static handleConnectionError(error: any, context: string = 'Connection') {
    console.error(`❌ ${context} Error:`, error);
    
    if (error.code === 'unavailable' || error.message?.includes('network')) {
      return 'Connection lost. Please check your internet connection.';
    }
    
    if (error.code === 'deadline-exceeded' || error.message?.includes('timeout')) {
      return 'Request timeout. Please try again.';
    }
    
    return 'Connection error. Please try again.';
  }

  /**
   * Log error for debugging
   */
  static logError(error: any, context: string = 'Firebase') {
    console.error(`❌ ${context} Error:`, {
      code: error.code,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Check if error is retryable
   */
  static isRetryableError(error: any): boolean {
    const retryableCodes = [
      'unavailable',
      'deadline-exceeded',
      'resource-exhausted',
      'network-request-failed'
    ];
    
    return retryableCodes.includes(error.code) || 
           error.message?.includes('network') ||
           error.message?.includes('timeout');
  }

  /**
   * Get user-friendly error message
   */
  static getUserFriendlyMessage(error: any, context: string = 'Firebase'): string {
    // Try different error handlers
    const authMessage = this.handleAuthError(error, context);
    const firestoreMessage = this.handleFirestoreError(error, context);
    const storageMessage = this.handleStorageError(error, context);
    const generalMessage = this.handleFirebaseError(error, context);
    
    // Return the most specific message
    if (authMessage !== generalMessage) return authMessage;
    if (firestoreMessage !== generalMessage) return firestoreMessage;
    if (storageMessage !== generalMessage) return storageMessage;
    
    return generalMessage;
  }
}

// Export default instance
export const errorHandler = new FirebaseErrorHandler();
export default FirebaseErrorHandler;
