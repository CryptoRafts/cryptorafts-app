import crypto from 'crypto';

/**
 * Mask ID number for display purposes
 * Shows only the last 4 digits, replaces the rest with asterisks
 */
export function maskIdNumber(idNumber: string): string {
  if (!idNumber || idNumber.length <= 4) {
    return idNumber;
  }
  return '*'.repeat(idNumber.length - 4) + idNumber.slice(-4);
}

/**
 * Hash ID number for secure storage
 * Uses SHA-256 with a salt to create a hash
 */
export function hashIdNumber(idNumber: string, salt?: string): string {
  const defaultSalt = process.env.ID_HASH_SALT || 'default-salt-change-in-production';
  const actualSalt = salt || defaultSalt;
  
  return crypto
    .createHash('sha256')
    .update(idNumber + actualSalt)
    .digest('hex');
}

/**
 * Create a secure storage object for ID number
 * Stores hash + last 4 digits for verification and display
 */
export function createSecureIdStorage(idNumber: string, salt?: string): {
  hash: string;
  last4: string;
  masked: string;
} {
  return {
    hash: hashIdNumber(idNumber, salt),
    last4: idNumber.slice(-4),
    masked: maskIdNumber(idNumber)
  };
}

/**
 * Verify ID number against stored hash
 */
export function verifyIdNumber(idNumber: string, storedHash: string, salt?: string): boolean {
  const computedHash = hashIdNumber(idNumber, salt);
  return computedHash === storedHash;
}

/**
 * Validate ID number format based on type
 */
export function validateIdFormat(idNumber: string, idType: string): boolean {
  if (!idNumber || !idType) return false;
  
  const cleanId = idNumber.replace(/\s/g, '');
  
  switch (idType) {
    case 'passport':
      // Passport format: typically 6-9 alphanumeric characters
      return /^[A-Za-z0-9]{6,9}$/.test(cleanId);
    
    case 'national_id':
      // National ID format: varies by country, but typically 8-15 digits
      return /^[0-9]{8,15}$/.test(cleanId);
    
    case 'driving_license':
      // Driving license format: varies by country, typically 6-12 alphanumeric
      return /^[A-Za-z0-9]{6,12}$/.test(cleanId);
    
    default:
      // Default: alphanumeric, 6-20 characters
      return /^[A-Za-z0-9]{6,20}$/.test(cleanId);
  }
}

/**
 * Sanitize ID number input
 */
export function sanitizeIdNumber(idNumber: string): string {
  return idNumber
    .trim()
    .toUpperCase()
    .replace(/[^A-Za-z0-9]/g, ''); // Remove all non-alphanumeric characters
}
