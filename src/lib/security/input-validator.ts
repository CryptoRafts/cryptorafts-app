/**
 * Input Validation & Sanitization Security Module
 * Prevents injection attacks and validates user input
 */

/**
 * Sanitize string input to prevent XSS
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .slice(0, 10000); // Max length
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim()) && email.length <= 254;
}

/**
 * Validate wallet address format
 */
export function validateWalletAddress(address: string): boolean {
  if (!address || typeof address !== 'string') return false;
  
  // Ethereum/BSC address format: 0x followed by 40 hex characters
  const addressRegex = /^0x[a-fA-F0-9]{40}$/;
  return addressRegex.test(address);
}

/**
 * Validate URL format
 */
export function validateURL(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  
  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Validate file type
 */
export function validateFileType(
  fileName: string,
  allowedTypes: string[]
): boolean {
  if (!fileName || typeof fileName !== 'string') return false;
  
  const extension = fileName.split('.').pop()?.toLowerCase();
  if (!extension) return false;
  
  return allowedTypes.includes(extension);
}

/**
 * Validate file size
 */
export function validateFileSize(size: number, maxSizeBytes: number): boolean {
  return size > 0 && size <= maxSizeBytes;
}

/**
 * Sanitize object recursively
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized = { ...obj };
  
  for (const key in sanitized) {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitizeString(sanitized[key]);
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeObject(sanitized[key]);
    }
  }
  
  return sanitized;
}

/**
 * Validate required fields
 */
export function validateRequiredFields(
  data: Record<string, any>,
  requiredFields: string[]
): { valid: boolean; missing: string[] } {
  const missing: string[] = [];
  
  for (const field of requiredFields) {
    if (!data[field] || (typeof data[field] === 'string' && !data[field].trim())) {
      missing.push(field);
    }
  }
  
  return {
    valid: missing.length === 0,
    missing
  };
}

/**
 * Validate string length
 */
export function validateLength(
  value: string,
  min: number,
  max: number
): boolean {
  if (typeof value !== 'string') return false;
  return value.length >= min && value.length <= max;
}

/**
 * Validate numeric range
 */
export function validateRange(
  value: number,
  min: number,
  max: number
): boolean {
  if (typeof value !== 'number' || isNaN(value)) return false;
  return value >= min && value <= max;
}

/**
 * Validate UUID format
 */
export function validateUUID(uuid: string): boolean {
  if (!uuid || typeof uuid !== 'string') return false;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validate Firebase UID format
 */
export function validateFirebaseUID(uid: string): boolean {
  if (!uid || typeof uid !== 'string') return false;
  
  // Firebase UID: 28 characters, alphanumeric
  const uidRegex = /^[a-zA-Z0-9]{28}$/;
  return uidRegex.test(uid);
}

/**
 * Sanitize path to prevent directory traversal
 */
export function sanitizePath(path: string): string {
  if (!path || typeof path !== 'string') return '';
  
  return path
    .replace(/\.\./g, '') // Remove parent directory references
    .replace(/\/\//g, '/') // Remove double slashes
    .replace(/^\/+|\/+$/g, '') // Remove leading/trailing slashes
    .slice(0, 500); // Max length
}



