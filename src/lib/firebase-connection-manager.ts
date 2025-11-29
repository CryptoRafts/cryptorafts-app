/**
 * Firebase Connection Manager
 * Handles Firebase connection issues and provides retry logic
 */

export class FirebaseConnectionManager {
  private static connectionRetries = 0;
  private static maxRetries = 3;
  private static isRecovering = false;

  /**
   * Handle Firestore write operations with retry logic
   */
  static async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string = 'Firestore operation',
    maxRetries: number = this.maxRetries
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 [${operationName}] Attempt ${attempt}/${maxRetries}`);
        const result = await operation();
        console.log(`✅ [${operationName}] Success on attempt ${attempt}`);
        this.connectionRetries = 0; // Reset on success
        return result;
      } catch (error: any) {
        lastError = error;
        console.log(`❌ [${operationName}] Attempt ${attempt} failed:`, error.message);

        // Check if it's a connection-related error (not permission errors)
        // Permission errors should not be retried as they're not transient
        if (error.code === 'permission-denied' || error.code === 'permissions-denied') {
          // Don't retry permission errors - they're not transient
          throw error;
        }
        
        if (this.isConnectionError(error)) {
          if (attempt < maxRetries) {
            const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Exponential backoff
            console.log(`⏳ [${operationName}] Retrying in ${delay}ms...`);
            await this.delay(delay);
          }
        } else {
          // Non-connection error, don't retry
          throw error;
        }
      }
    }

    console.error(`💥 [${operationName}] All attempts failed`);
    throw lastError;
  }

  /**
   * Check if error is connection-related
   */
  private static isConnectionError(error: any): boolean {
    if (!error) return false;

    const errorMessage = error.message || '';
    const errorCode = error.code || '';

    return (
      errorCode === 'unavailable' ||
      errorCode === 'deadline-exceeded' ||
      errorMessage.includes('Write/channel') ||
      errorMessage.includes('Listen/channel') ||
      (errorMessage.includes('400') && !errorMessage.includes('permission')) ||
      errorMessage.includes('network') ||
      errorMessage.includes('connection')
    );
  }

  /**
   * Delay utility
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Reset connection state
   */
  static reset(): void {
    this.connectionRetries = 0;
    this.isRecovering = false;
  }

  /**
   * Get connection status
   */
  static getStatus(): { retries: number; isRecovering: boolean } {
    return {
      retries: this.connectionRetries,
      isRecovering: this.isRecovering
    };
  }
}

export default FirebaseConnectionManager;
