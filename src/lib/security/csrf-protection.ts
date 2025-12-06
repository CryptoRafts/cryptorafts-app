/**
 * CSRF Protection Security Module
 * Prevents Cross-Site Request Forgery attacks
 */

import crypto from 'crypto';

/**
 * Generate CSRF token
 */
export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Validate CSRF token
 */
export function validateCSRFToken(
  token: string,
  sessionToken: string
): boolean {
  if (!token || !sessionToken) return false;
  
  // Use constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(token),
    Buffer.from(sessionToken)
  );
}

/**
 * Verify CSRF token from request
 */
export function verifyCSRFToken(
  requestToken: string | null,
  sessionToken: string | null
): boolean {
  if (!requestToken || !sessionToken) {
    return false;
  }
  
  try {
    return validateCSRFToken(requestToken, sessionToken);
  } catch {
    return false;
  }
}



