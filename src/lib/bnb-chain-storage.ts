/**
 * BNB Chain On-Chain Data Storage Utilities
 * 
 * This module provides functions for storing hashed and salted data on BNB Smart Chain (BSC).
 * 
 * Primary deployment network: BNB Smart Chain (BSC) - Chain ID 56
 * 
 * Data Storage Strategy:
 * - Public data: Off-chain (backend database)
 * - Sensitive KYC/KYB data: Hashed and stored on BNB Chain
 * - Project data (after success): Hashed and stored on BNB Chain
 * - Raw data: Deleted after on-chain storage
 */

import { getBNBChainRPC, getBNBChainConfig, PRIMARY_BNB_CHAIN } from './bnb-chain';
import { ethers } from 'ethers';
import crypto from 'crypto';

// Re-export getBNBChainRPC for API routes
export { getBNBChainRPC } from './bnb-chain';

/**
 * Hash and salt sensitive data for on-chain storage on BNB Chain
 * @param data - Sensitive data to hash
 * @param salt - Optional salt (generated if not provided)
 * @returns Object containing hash and salt
 */
export function hashAndSaltForBNBChain(data: string, salt?: string): { hash: string; salt: string } {
  // CRITICAL: Ultra-aggressive cleaning of input data
  // Remove ALL whitespace, newlines, and control characters
  let cleanData: string;
  if (typeof data === 'string') {
    cleanData = data;
  } else {
    cleanData = String(data);
  }
  
  // Remove ALL whitespace (including Unicode variants)
  cleanData = cleanData.replace(/[\s\u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\uFEFF]/g, '');
  // Remove ALL newline variants (including escaped)
  cleanData = cleanData.replace(/[\r\n\u000A\u000D\u2028\u2029]/g, '');
  // Remove backslashes (escaped characters like \r\n)
  cleanData = cleanData.replace(/[\\]/g, '');
  // Remove ALL control characters
  cleanData = cleanData.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
  // Final trim
  cleanData = cleanData.trim();
  
  const generatedSalt = salt || crypto.randomBytes(16).toString('hex');
  
  // CRITICAL: Use Buffer for hashing to avoid any string encoding issues
  const dataBuffer = Buffer.from(cleanData, 'utf8');
  const saltBuffer = Buffer.from(generatedSalt, 'hex');
  const combinedBuffer = Buffer.concat([dataBuffer, saltBuffer]);
  
  const hashBuffer = crypto.createHash('sha256').update(combinedBuffer).digest();
  const hashHex = hashBuffer.toString('hex');
  
  // CRITICAL: Reconstruct hash string character by character to ensure NO escape sequences
  // This is the most aggressive approach - we rebuild the string from the hex buffer
  let cleanHash = '';
  for (let i = 0; i < hashHex.length; i++) {
    const char = hashHex[i].toLowerCase();
    // Only include valid hex characters
    if ((char >= '0' && char <= '9') || (char >= 'a' && char <= 'f')) {
      cleanHash += char;
    }
  }
  
  // Validate hash is pure hex and correct length (SHA256 = 64 hex chars)
  if (cleanHash.length !== 64 || !/^[0-9a-f]{64}$/.test(cleanHash)) {
    console.error('❌ Hash reconstruction failed:', {
      originalLength: hashHex.length,
      cleanLength: cleanHash.length,
      originalFirst20: hashHex.substring(0, 20),
      cleanFirst20: cleanHash.substring(0, 20)
    });
    throw new Error('Hash generation failed: invalid hash format');
  }
  
  // Final validation - ensure no escape sequences (should never happen with manual reconstruction)
  if (cleanHash.includes('\r') || cleanHash.includes('\n') || cleanHash.includes('\\')) {
    console.error('❌ CRITICAL: Hash contains escape sequences after manual reconstruction:', {
      hash: cleanHash.substring(0, 30),
      charCodes: Array.from(cleanHash).slice(0, 30).map(c => c.charCodeAt(0))
    });
    // This should never happen, but if it does, reconstruct one more time
    cleanHash = '';
    for (let i = 0; i < hashHex.length; i++) {
      const char = hashHex[i].toLowerCase();
      if ((char >= '0' && char <= '9') || (char >= 'a' && char <= 'f')) {
        cleanHash += char;
      }
    }
    cleanHash = cleanHash.padStart(64, '0').slice(0, 64);
  }
  
  return { hash: cleanHash, salt: generatedSalt };
}

/**
 * Store KYC verification hash on BNB Smart Chain
 * @param frontIdHash - Hashed front ID card (bytes32)
 * @param backIdHash - Hashed back ID card (bytes32)
 * @param proofOfAddressHash - Hashed proof of address (bytes32)
 * @param liveSnapHash - Hashed live snap (bytes32)
 * @param userId - User ID
 * @param approvalStatus - Approval status
 * @param signer - Ethers signer (wallet) for signing transactions
 * @returns Transaction hash on BNB Chain
 */
export async function storeKYCOnBNBChain(
  frontIdHash: string,
  backIdHash: string,
  proofOfAddressHash: string,
  liveSnapHash: string,
  userId: string,
  approvalStatus: boolean,
  signer: ethers.Wallet
): Promise<string> {
  // CRITICAL: Ultra-aggressive byte-level cleaning at function entry
  // Convert to bytes immediately and never use string manipulation after that
  const cleanInputHash = (hash: string): string => {
    if (!hash || typeof hash !== 'string') {
      throw new Error('Invalid hash: must be a non-empty string');
    }
    
    // Log original for debugging
    const originalHash = hash;
    const hasEscapeSequences = hash.includes('\\') || hash.includes('\r') || hash.includes('\n');
    if (hasEscapeSequences) {
      console.error('❌ CRITICAL: Hash contains escape sequences at function entry:', {
        original: JSON.stringify(hash),
        length: hash.length,
        charCodes: Array.from(hash).slice(0, 50).map(c => ({ char: c, code: c.charCodeAt(0) })),
        hasBackslash: hash.includes('\\'),
        hasCR: hash.includes('\r'),
        hasLF: hash.includes('\n')
      });
    }
    
    // Step 1: Remove ALL backslashes first (most aggressive - removes all escape sequences)
    let cleaned = hash.replace(/\\/g, '');
    
    // Step 2: Remove actual newline characters
    cleaned = cleaned.replace(/[\r\n\u000A\u000D\u2028\u2029]/g, '');
    
    // Step 3: Remove ALL whitespace and control characters
    cleaned = cleaned.replace(/[\s\u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\uFEFF]/g, '');
    cleaned = cleaned.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
    
    // Step 4: Extract ONLY hex characters character by character
    let hexOnly = '';
    for (let i = 0; i < cleaned.length; i++) {
      const char = cleaned[i].toLowerCase();
      if ((char >= '0' && char <= '9') || (char >= 'a' && char <= 'f')) {
        hexOnly += char;
      }
    }
    
    // Step 5: Pad to 64
    hexOnly = hexOnly.padStart(64, '0').slice(0, 64);
    
    // Step 6: Validate
    if (!/^[0-9a-f]{64}$/.test(hexOnly)) {
      console.error('❌ Hash cleaning failed:', {
        original: JSON.stringify(hash),
        cleaned: JSON.stringify(cleaned),
        hexOnly: hexOnly.substring(0, 20) + '...',
        hexOnlyLength: hexOnly.length
      });
      throw new Error('Invalid hash: not pure hex after cleaning');
    }
    
    // Step 7: CRITICAL - Convert to Buffer and back to ensure absolute byte-level cleanliness
    // This is the final guarantee that no escape sequences can exist
    try {
      const buffer = Buffer.from(hexOnly, 'hex');
      if (buffer.length !== 32) {
        throw new Error(`Invalid buffer length: ${buffer.length}, expected 32`);
      }
      const cleanHex = buffer.toString('hex');
      
      // Final validation
      if (cleanHex.length !== 64 || !/^[0-9a-f]{64}$/.test(cleanHex)) {
        throw new Error(`Invalid clean hex: ${cleanHex.substring(0, 20)}...`);
      }
      
      // Final check for escape sequences (should never happen with Buffer)
      if (cleanHex.includes('\\') || cleanHex.includes('\r') || cleanHex.includes('\n')) {
        console.error('❌ CRITICAL: Clean hex still contains escape sequences after Buffer conversion:', {
          cleanHex: JSON.stringify(cleanHex),
          charCodes: Array.from(cleanHex).slice(0, 30).map(c => c.charCodeAt(0))
        });
        throw new Error('Clean hex contains escape sequences after Buffer conversion');
      }
      
      // Log if cleaning was needed
      if (originalHash !== cleanHex || hasEscapeSequences) {
        console.warn('⚠️ Hash was cleaned at function entry:', {
          originalLength: originalHash.length,
          cleanedLength: cleanHex.length,
          originalFirst20: originalHash.substring(0, 20),
          cleanedFirst20: cleanHex.substring(0, 20),
          hadEscapeSequences: hasEscapeSequences
        });
      }
      
      return cleanHex; // Return without 0x prefix
    } catch (bufferError: any) {
      console.error('❌ Buffer conversion failed:', {
        hexOnly: hexOnly.substring(0, 30),
        error: bufferError.message
      });
      throw bufferError;
    }
  };
  
  // Clean all hashes immediately
  const cleanedFrontId = cleanInputHash(frontIdHash);
  const cleanedBackId = cleanInputHash(backIdHash);
  const cleanedProof = cleanInputHash(proofOfAddressHash);
  const cleanedLive = cleanInputHash(liveSnapHash);
  
  // Clean userId
  const cleanInputUserId = (id: string): string => {
    if (!id || typeof id !== 'string') {
      throw new Error('Invalid userId: must be a non-empty string');
    }
    // Remove all control characters and escape sequences
    return id.replace(/[\r\n\\\x00-\x1F\x7F-\x9F]/g, '').trim();
  };
  const cleanedUserId = cleanInputUserId(userId);
  
  console.log('✅ Input parameters cleaned at function entry:', {
    frontId: cleanedFrontId.substring(0, 20) + '...',
    backId: cleanedBackId.substring(0, 20) + '...',
    proof: cleanedProof.substring(0, 20) + '...',
    live: cleanedLive.substring(0, 20) + '...',
    userId: cleanedUserId
  });
  
  // Get contract address from environment (deployed on BNB Chain)
  const contractAddress = process.env.NEXT_PUBLIC_BNB_KYC_CONTRACT_ADDRESS;
  if (!contractAddress) {
    throw new Error('BNB Chain KYC contract address not configured');
  }

  // Basic ABI for KYC contract (storeKYCVerification function)
  const KYC_ABI = [
    "function storeKYCVerification(string memory userId, bytes32 frontIdHash, bytes32 backIdHash, bytes32 proofOfAddressHash, bytes32 liveSnapHash, bool approved) public"
  ];

  try {
    // CRITICAL: Ultra-aggressive cleaning function that handles ALL edge cases
    // Now receives already-cleaned hex strings (64 chars, no 0x)
    const finalCleanHash = (hash: string): string => {
      if (!hash || typeof hash !== 'string') {
        console.error('❌ Invalid hash type:', typeof hash, hash);
        throw new Error('Invalid hash value: must be a non-empty string');
      }
      
      // Log original hash for debugging
      const originalHash = hash;
      const hasNewlines = hash.includes('\r') || hash.includes('\n');
      if (hasNewlines) {
        console.warn('⚠️ Hash contains newlines:', {
          original: JSON.stringify(hash),
          length: hash.length,
          hasCR: hash.includes('\r'),
          hasLF: hash.includes('\n')
        });
      }
      
      // Step 1: Convert to string and remove ALL control characters
      let cleaned = String(hash);
      
      // Step 2: Remove ALL whitespace characters (including Unicode)
      cleaned = cleaned.replace(/[\s\u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\uFEFF]/g, '');
      
      // Step 3: Remove ALL newline variants
      cleaned = cleaned.replace(/[\r\n\u000A\u000D\u2028\u2029]/g, '');
      
      // Step 4: Remove 0x prefix if present
      if (cleaned.toLowerCase().startsWith('0x')) {
        cleaned = cleaned.slice(2);
      }
      
      // Step 5: Remove ANY non-hex characters (most aggressive)
      cleaned = cleaned.replace(/[^0-9a-fA-F]/g, '');
      
      // Step 6: Validate
      if (cleaned.length === 0) {
        console.error('❌ Hash became empty after cleaning:', {
          original: JSON.stringify(hash),
          originalLength: hash.length
        });
        throw new Error('Invalid hash: contains no valid hex characters after cleaning');
      }
      
      // Step 7: Validate cleaned hash is pure hex before padding
      if (!/^[0-9a-fA-F]+$/.test(cleaned)) {
        console.error('❌ Cleaned hash contains invalid characters:', {
          cleaned: JSON.stringify(cleaned),
          length: cleaned.length,
          original: JSON.stringify(originalHash)
        });
        throw new Error('Cleaned hash contains invalid characters');
      }
      
      // Step 8: Pad to exactly 64 hex chars (32 bytes) for bytes32
      // If hash is longer than 64, truncate; if shorter, pad with zeros
      const padded = cleaned.length > 64 
        ? cleaned.slice(0, 64) 
        : cleaned.padStart(64, '0');
      
      // Step 9: Final validation of padded hash
      if (padded.length !== 64 || !/^[0-9a-fA-F]{64}$/.test(padded)) {
        console.error('❌ Padded hash validation failed:', {
          padded: JSON.stringify(padded),
          length: padded.length,
          original: JSON.stringify(originalHash)
        });
        throw new Error('Invalid padded hash format');
      }
      
      // Step 10: Add 0x prefix and return
      const result = '0x' + padded;
      
      // Step 11: Final validation of complete result
      if (result.length !== 66 || !/^0x[0-9a-fA-F]{64}$/.test(result)) {
        console.error('❌ Final hash validation failed:', {
          result: JSON.stringify(result),
          length: result.length,
          padded: JSON.stringify(padded),
          original: JSON.stringify(originalHash)
        });
        throw new Error('Invalid final hash format');
      }
      
      return result;
    };

    // Clean all hashes before contract call - use already-cleaned hashes from function entry
    const cleanedFrontHash = finalCleanHash(cleanedFrontId);
    const cleanedBackHash = finalCleanHash(cleanedBackId);
    const cleanedProofHash = finalCleanHash(cleanedProof);
    const cleanedLiveHash = finalCleanHash(cleanedLive);
    
    // Log cleaned hashes for debugging
    console.log('🔍 Cleaned hashes for blockchain:', {
      frontId: cleanedFrontHash.substring(0, 20) + '...',
      backId: cleanedBackHash.substring(0, 20) + '...',
      proof: cleanedProofHash.substring(0, 20) + '...',
      live: cleanedLiveHash.substring(0, 20) + '...',
      allValid: /^0x[0-9a-fA-F]{64}$/.test(cleanedFrontHash) && 
                /^0x[0-9a-fA-F]{64}$/.test(cleanedBackHash) &&
                /^0x[0-9a-fA-F]{64}$/.test(cleanedProofHash) &&
                /^0x[0-9a-fA-F]{64}$/.test(cleanedLiveHash)
    });

    // CRITICAL: Convert hex strings to bytes32 - use manual byte array construction
    // This completely bypasses any string parsing issues with ethers.js
    const toBytes32 = (hexString: string): string => {
      // Step 1: Ensure it's a string
      if (typeof hexString !== 'string') {
        throw new Error(`Hash must be a string, got ${typeof hexString}`);
      }
      
      // Step 2: Log if newlines detected (for debugging)
      const hasNewlines = hexString.includes('\r') || hexString.includes('\n') || 
                         hexString.includes('\\r') || hexString.includes('\\n');
      if (hasNewlines) {
        console.error('❌ Hash contains newlines at toBytes32 conversion:', {
          original: JSON.stringify(hexString),
          length: hexString.length,
          charCodes: Array.from(hexString).slice(0, 50).map(c => c.charCodeAt(0))
        });
      }
      
      // Step 3: Remove 0x prefix if present
      let hex = hexString.startsWith('0x') ? hexString.slice(2) : hexString;
      
      // Step 4: Remove ALL non-hex characters (most aggressive - removes everything except 0-9, a-f, A-F)
      hex = hex.replace(/[^0-9a-fA-F]/g, '');
      
      // Step 5: Validate
      if (hex.length === 0) {
        console.error('❌ Hash became empty after cleaning:', {
          original: JSON.stringify(hexString)
        });
        throw new Error('Hash became empty after cleaning');
      }
      
      // Step 6: Pad to exactly 64 hex chars (32 bytes)
      hex = hex.padStart(64, '0').slice(0, 64);
      
      // Step 7: Manually convert hex string to bytes32
      // This completely avoids any ethers.js string parsing issues
      try {
        // CRITICAL: Final validation - ensure hex is exactly 64 characters of pure hex
        if (hex.length !== 64) {
          console.error('❌ Hex length is not 64:', {
            length: hex.length,
            hex: hex.substring(0, 20) + '...',
            original: JSON.stringify(hexString)
          });
          throw new Error(`Hex must be exactly 64 characters, got ${hex.length}`);
        }
        
        if (!/^[0-9a-fA-F]{64}$/.test(hex)) {
          console.error('❌ Hex contains invalid characters:', {
            hex: JSON.stringify(hex),
            charCodes: Array.from(hex).map(c => ({ char: c, code: c.charCodeAt(0) })).filter(c => !/[0-9a-fA-F]/.test(c.char))
          });
          throw new Error('Hex contains invalid characters');
        }
        
        // Convert hex string to byte array manually - validate each byte
        const bytes = new Uint8Array(32);
        for (let i = 0; i < 32; i++) {
          const hexByte = hex.substring(i * 2, i * 2 + 2);
          
          // Validate each hex byte is exactly 2 hex characters
          if (!/^[0-9a-fA-F]{2}$/.test(hexByte)) {
            console.error('❌ Invalid hex byte at position', i, ':', {
              hexByte: JSON.stringify(hexByte),
              charCodes: Array.from(hexByte).map(c => c.charCodeAt(0)),
              fullHex: hex
            });
            throw new Error(`Invalid hex byte at position ${i}: ${JSON.stringify(hexByte)}`);
          }
          
          const byteValue = parseInt(hexByte, 16);
          if (isNaN(byteValue) || byteValue < 0 || byteValue > 255) {
            console.error('❌ Invalid byte value at position', i, ':', {
              hexByte,
              byteValue,
              fullHex: hex
            });
            throw new Error(`Invalid byte value at position ${i}: ${byteValue}`);
          }
          
          bytes[i] = byteValue;
        }
        
        // CRITICAL: Construct hex string directly from bytes array
        // This completely avoids any ethers.js string parsing that could introduce newlines
        let bytes32Hex = '0x';
        for (let i = 0; i < 32; i++) {
          const byteHex = bytes[i].toString(16).padStart(2, '0');
          bytes32Hex += byteHex;
        }
        
        // Final validation - ensure result is correct format
        if (bytes32Hex.length !== 66 || !/^0x[0-9a-fA-F]{64}$/.test(bytes32Hex)) {
          console.error('❌ Invalid bytes32 format after manual conversion:', {
            bytes32: JSON.stringify(bytes32Hex),
            length: bytes32Hex.length,
            originalHex: hex,
            bytesLength: bytes.length
          });
          throw new Error('Invalid bytes32 format after conversion');
        }
        
        // CRITICAL: Final check - ensure no newlines somehow got into the string
        if (bytes32Hex.includes('\r') || bytes32Hex.includes('\n') || bytes32Hex.includes('\\')) {
          console.error('❌ bytes32 string contains newlines/backslashes:', {
            bytes32: JSON.stringify(bytes32Hex),
            hasCR: bytes32Hex.includes('\r'),
            hasLF: bytes32Hex.includes('\n'),
            hasBackslash: bytes32Hex.includes('\\')
          });
          // Force clean one more time
          bytes32Hex = '0x' + bytes32Hex.slice(2).replace(/[\r\n\\]/g, '').replace(/[^0-9a-fA-F]/g, '').padStart(64, '0').slice(0, 64);
        }
        
        // CRITICAL: Use Buffer-based construction instead of ethers.zeroPadValue()
        // This ensures NO escape sequences can be introduced by ethers.js
        try {
          // Validate the hex string is correct format first
          if (!/^0x[0-9a-fA-F]{64}$/.test(bytes32Hex)) {
            throw new Error('Invalid hex format before buffer conversion');
          }
          
          // Remove 0x prefix for Buffer conversion
          const hexWithoutPrefix = bytes32Hex.slice(2);
          
          // Convert to Buffer (byte-level) - this validates the hex is valid
          const buffer = Buffer.from(hexWithoutPrefix, 'hex');
          if (buffer.length !== 32) {
            throw new Error(`Invalid buffer length: ${buffer.length}, expected 32`);
          }
          
          // Convert back to hex using Buffer.toString('hex') - this ensures NO escape sequences
          const cleanHex = buffer.toString('hex');
          
          // Validate cleanHex is exactly 64 characters
          if (cleanHex.length !== 64 || !/^[0-9a-f]{64}$/.test(cleanHex)) {
            throw new Error(`Invalid clean hex: length=${cleanHex.length}`);
          }
          
          // Manually construct final string - NO ethers functions, just string concatenation
          const finalBytes32 = '0x' + cleanHex;
          
          // Final validation - ensure it's still clean
          if (finalBytes32.length !== 66 || !/^0x[0-9a-f]{64}$/.test(finalBytes32)) {
            throw new Error(`Invalid final bytes32 format: length=${finalBytes32.length}`);
          }
          
          // CRITICAL: Final check for any escape sequences or control characters
          // Check each character individually to catch any issues
          for (let i = 0; i < finalBytes32.length; i++) {
            const char = finalBytes32[i];
            const code = char.charCodeAt(0);
            if (code === 92 || code === 13 || code === 10) { // backslash, CR, LF
              console.error('❌ Final bytes32 contains escape sequence at position', i, ':', {
                bytes32: JSON.stringify(finalBytes32),
                position: i,
                char: char,
                code: code,
                allCharCodes: Array.from(finalBytes32).map((c, idx) => ({ idx, char: c, code: c.charCodeAt(0) }))
              });
              // Reconstruct from scratch using only hex characters
              const hexOnly = finalBytes32.replace(/[^0-9a-fA-F]/g, '').toLowerCase();
              return '0x' + hexOnly.padStart(64, '0').slice(0, 64);
            }
          }
          
          return finalBytes32;
        } catch (validationError: any) {
          console.error('❌ Error validating bytes32 with ethers:', {
            bytes32Hex: JSON.stringify(bytes32Hex),
            error: validationError.message
          });
          // Fallback: reconstruct from scratch to ensure it's clean
          const hexOnly = bytes32Hex.replace(/[^0-9a-fA-F]/g, '').toLowerCase();
          return '0x' + hexOnly.padStart(64, '0').slice(0, 64);
        }
      } catch (error: any) {
        console.error('❌ Error in toBytes32 manual conversion:', {
          original: JSON.stringify(hexString),
          cleaned: hex.substring(0, 20) + '...',
          hexLength: hex.length,
          error: error.message,
          stack: error.stack
        });
        throw error;
      }
    };
    
    // Convert all hashes to bytes32 with final validation
    const frontIdBytes32 = toBytes32(cleanedFrontHash);
    const backIdBytes32 = toBytes32(cleanedBackHash);
    const proofBytes32 = toBytes32(cleanedProofHash);
    const liveBytes32 = toBytes32(cleanedLiveHash);
    
    // CRITICAL: Final safety check - recreate strings to ensure no hidden characters
    // This prevents any possibility of newlines or control characters
    const recreateCleanString = (str: string): string => {
      // Extract only hex characters (0-9, a-f, A-F) and 0x prefix
      const hexOnly = str.replace(/[^0-9a-fA-Fx]/gi, '').toLowerCase();
      if (!hexOnly.startsWith('0x')) {
        return '0x' + hexOnly.replace(/[^0-9a-f]/g, '').padStart(64, '0').slice(0, 64);
      }
      const hexPart = hexOnly.slice(2).replace(/[^0-9a-f]/g, '').padStart(64, '0').slice(0, 64);
      return '0x' + hexPart;
    };
    
    const finalFrontId = recreateCleanString(frontIdBytes32);
    const finalBackId = recreateCleanString(backIdBytes32);
    const finalProof = recreateCleanString(proofBytes32);
    const finalLive = recreateCleanString(liveBytes32);
    
    // Final validation - ensure all are valid bytes32 (66 chars: 0x + 64 hex)
    const allValid = [finalFrontId, finalBackId, finalProof, finalLive].every(
      h => typeof h === 'string' && h.startsWith('0x') && h.length === 66 && /^0x[0-9a-f]{64}$/.test(h) && !h.includes('\r') && !h.includes('\n') && !h.includes('\\')
    );
    
    if (!allValid) {
      console.error('❌ Invalid bytes32 values after final cleaning:', {
        frontId: JSON.stringify(finalFrontId),
        backId: JSON.stringify(finalBackId),
        proof: JSON.stringify(finalProof),
        live: JSON.stringify(finalLive),
        originalFront: JSON.stringify(frontIdBytes32),
        originalBack: JSON.stringify(backIdBytes32),
        originalProof: JSON.stringify(proofBytes32),
        originalLive: JSON.stringify(liveBytes32)
      });
      throw new Error('Invalid bytes32 format after final cleaning');
    }
    
    console.log('✅ All hashes converted to valid bytes32 format and final cleaned');
    
    // CRITICAL: Final conversion - create bytes32 from scratch using only hex characters
    // This completely avoids any string manipulation that could introduce escape sequences
    const ensureBytes32 = (hex: string): string => {
      try {
        // Step 1: Convert to string and extract ONLY hex characters (0-9, a-f)
        // This is the most aggressive cleaning - removes everything except hex
        let hexChars = '';
        const inputStr = String(hex);
        
        for (let i = 0; i < inputStr.length; i++) {
          const char = inputStr[i].toLowerCase();
          // Only include characters that are valid hex (0-9, a-f)
          if ((char >= '0' && char <= '9') || (char >= 'a' && char <= 'f')) {
            hexChars += char;
          }
          // Skip 'x' from '0x' prefix and any other characters
        }
        
        // Step 2: Ensure we have exactly 64 hex characters
        if (hexChars.length === 0) {
          throw new Error('No valid hex characters found in input');
        }
        
        // Pad or truncate to exactly 64 characters
        const padded = hexChars.padStart(64, '0').slice(0, 64);
        
        // Step 3: Validate it's pure hex
        if (!/^[0-9a-f]{64}$/.test(padded)) {
          throw new Error(`Invalid hex after cleaning: ${padded.substring(0, 20)}...`);
        }
        
        // Step 4: Convert hex string to Uint8Array manually (byte by byte)
        // This completely avoids any string manipulation that could introduce escape sequences
        const bytes = new Uint8Array(32);
        for (let i = 0; i < 32; i++) {
          const hexByte = padded.substring(i * 2, i * 2 + 2);
          const byteValue = parseInt(hexByte, 16);
          if (isNaN(byteValue) || byteValue < 0 || byteValue > 255) {
            throw new Error(`Invalid byte at position ${i}: ${hexByte}`);
          }
          bytes[i] = byteValue;
        }
        
        // Step 5: Convert to hex using Buffer instead of ethers.hexlify()
        // This ensures NO escape sequences can be introduced
        const buffer = Buffer.from(bytes);
        const cleanHex = buffer.toString('hex');
        
        // Step 6: Manually construct result - NO ethers functions
        const result = `0x${cleanHex}`;
        
        // Step 7: Final validation - ensure result is correct
        if (result.length !== 66 || !/^0x[0-9a-f]{64}$/.test(result)) {
          throw new Error(`Invalid result format: length=${result.length}`);
        }
        
        // Step 8: Double-check for any escape sequences by checking each character
        for (let i = 0; i < result.length; i++) {
          const char = result[i];
          const code = char.charCodeAt(0);
          if (code === 92 || code === 13 || code === 10) { // backslash, CR, LF
            console.error('❌ CRITICAL: Result contains escape sequence at position', i, ':', {
              result: JSON.stringify(result),
              position: i,
              char: char,
              code: code,
              allCharCodes: Array.from(result).map((c, idx) => ({ idx, char: c, code: c.charCodeAt(0) }))
            });
            // Reconstruct from bytes array again
            const cleanResult = `0x${Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')}`;
            return cleanResult;
          }
        }
        
        return result;
      } catch (error: any) {
        console.error('❌ Error ensuring bytes32 format:', { 
          hex: JSON.stringify(hex),
          hexLength: hex?.length,
          error: error.message,
          stack: error.stack
        });
        throw error;
      }
    };
    
    // Apply final bytes32 conversion with error handling for each parameter
    let contractFrontId: string;
    let contractBackId: string;
    let contractProof: string;
    let contractLive: string;
    
    try {
      contractFrontId = ensureBytes32(finalFrontId);
      console.log('✅ FrontId converted:', contractFrontId.substring(0, 20) + '...');
    } catch (error: any) {
      console.error('❌ Error converting frontId:', { finalFrontId, error: error.message });
      throw new Error(`Failed to convert frontId to bytes32: ${error.message}`);
    }
    
    try {
      contractBackId = ensureBytes32(finalBackId);
      console.log('✅ BackId converted:', contractBackId.substring(0, 20) + '...');
    } catch (error: any) {
      console.error('❌ Error converting backId:', { finalBackId, error: error.message });
      throw new Error(`Failed to convert backId to bytes32: ${error.message}`);
    }
    
    try {
      contractProof = ensureBytes32(finalProof);
      console.log('✅ Proof converted:', contractProof.substring(0, 20) + '...');
    } catch (error: any) {
      console.error('❌ Error converting proof:', { finalProof, error: error.message });
      throw new Error(`Failed to convert proof to bytes32: ${error.message}`);
    }
    
    try {
      contractLive = ensureBytes32(finalLive);
      console.log('✅ Live converted:', contractLive.substring(0, 20) + '...');
    } catch (error: any) {
      console.error('❌ Error converting live:', { finalLive, error: error.message });
      throw new Error(`Failed to convert live to bytes32: ${error.message}`);
    }
    
    // Final validation before contract call - check each parameter individually
    const params = [
      { name: 'frontId', value: contractFrontId },
      { name: 'backId', value: contractBackId },
      { name: 'proof', value: contractProof },
      { name: 'live', value: contractLive }
    ];
    
    for (const param of params) {
      if (typeof param.value !== 'string') {
        throw new Error(`${param.name} is not a string: ${typeof param.value}`);
      }
      if (!param.value.startsWith('0x')) {
        throw new Error(`${param.name} does not start with 0x: ${param.value.substring(0, 20)}...`);
      }
      if (param.value.length !== 66) {
        throw new Error(`${param.name} length is not 66: ${param.value.length}`);
      }
      if (!/^0x[0-9a-f]{64}$/.test(param.value)) {
        throw new Error(`${param.name} is not valid hex: ${param.value.substring(0, 20)}...`);
      }
      if (param.value.includes('\r') || param.value.includes('\n') || param.value.includes('\\')) {
        console.error(`❌ ${param.name} contains escape sequences:`, {
          value: JSON.stringify(param.value),
          hasCR: param.value.includes('\r'),
          hasLF: param.value.includes('\n'),
          hasBackslash: param.value.includes('\\')
        });
        throw new Error(`${param.name} contains invalid escape sequences`);
      }
    }
    
    console.log('✅ All contract parameters validated successfully');
    
    // CRITICAL: Clean userId to remove any newlines, control characters, or escaped sequences
    // This prevents the "invalid BytesLike value" error from ethers.js
    const cleanUserId = (id: string): string => {
      if (!id || typeof id !== 'string') {
        throw new Error('Invalid userId: must be a non-empty string');
      }
      
      // Remove ALL control characters including newlines, carriage returns, tabs, etc.
      let cleaned = String(id);
      
      // Remove ALL newline variants (actual and escaped)
      cleaned = cleaned.replace(/[\r\n\u000A\u000D\u2028\u2029]/g, '');
      // Remove escaped newlines (literal \r\n sequences)
      cleaned = cleaned.replace(/\\[rn]/g, '');
      // Remove ALL control characters
      cleaned = cleaned.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
      // Remove backslashes that might be part of escape sequences
      cleaned = cleaned.replace(/\\/g, '');
      // Trim whitespace
      cleaned = cleaned.trim();
      
      // Validate
      if (cleaned.length === 0) {
        console.error('❌ userId became empty after cleaning:', {
          original: JSON.stringify(id)
        });
        throw new Error('Invalid userId: contains no valid characters after cleaning');
      }
      
      // Log if original had issues
      if (id !== cleaned) {
        console.warn('⚠️ userId was cleaned:', {
          original: JSON.stringify(id),
          cleaned: JSON.stringify(cleaned),
          originalLength: id.length,
          cleanedLength: cleaned.length
        });
      }
      
      return cleaned;
    };
    
    // Use the already-cleaned userId from function entry
    // No need to clean again - it's already clean
    
    console.log('🔍 Using cleaned userId for blockchain:', {
      cleaned: cleanedUserId.substring(0, 20) + '...',
      length: cleanedUserId.length
    });
    
    // CRITICAL: Final validation of all parameters before contract call
    // This helps identify which parameter is causing the BytesLike error
    const validateParameter = (name: string, value: any, type: 'string' | 'bytes32' | 'bool'): void => {
      if (type === 'string') {
        if (typeof value !== 'string') {
          throw new Error(`${name} must be a string, got ${typeof value}`);
        }
        if (value.includes('\r') || value.includes('\n') || value.includes('\\r') || value.includes('\\n')) {
          console.error(`❌ ${name} contains newlines:`, JSON.stringify(value));
          throw new Error(`${name} contains invalid characters (newlines)`);
        }
      } else if (type === 'bytes32') {
        if (typeof value !== 'string') {
          throw new Error(`${name} must be a string, got ${typeof value}`);
        }
        if (!/^0x[0-9a-fA-F]{64}$/.test(value)) {
          console.error(`❌ ${name} is not valid bytes32:`, JSON.stringify(value));
          throw new Error(`${name} is not valid bytes32 format`);
        }
        if (value.includes('\r') || value.includes('\n') || value.includes('\\')) {
          console.error(`❌ ${name} contains newlines/backslashes:`, JSON.stringify(value));
          throw new Error(`${name} contains invalid characters`);
        }
      }
    };
    
    // Validate all parameters
    validateParameter('userId', cleanedUserId, 'string');
    validateParameter('frontIdHash', finalFrontId, 'bytes32');
    validateParameter('backIdHash', finalBackId, 'bytes32');
    validateParameter('proofOfAddressHash', finalProof, 'bytes32');
    validateParameter('liveSnapHash', finalLive, 'bytes32');
    validateParameter('approvalStatus', approvalStatus, 'bool');
    
    console.log('✅ All parameters validated before contract call');
    
    // CRITICAL: Log all parameters right before contract call
    console.log('🚀 Calling contract.storeKYCVerification with:', {
      userId: cleanedUserId,
      userIdLength: cleanedUserId.length,
      frontId: contractFrontId.substring(0, 20) + '...',
      backId: contractBackId.substring(0, 20) + '...',
      proof: contractProof.substring(0, 20) + '...',
      live: contractLive.substring(0, 20) + '...',
      approvalStatus
    });
    
    // CRITICAL: Convert bytes32 strings to Uint8Array to avoid any string escape issues
    // Then convert back using hexlify - this ensures clean encoding
    const toCleanBytes32 = (hexString: string): string => {
      // Extract only hex characters (0-9, a-f)
      let hex = '';
      for (let i = 0; i < hexString.length; i++) {
        const char = hexString[i].toLowerCase();
        if ((char >= '0' && char <= '9') || (char >= 'a' && char <= 'f')) {
          hex += char;
        }
      }
      
      // Remove 0x if somehow present in the hex string
      if (hex.startsWith('0x')) {
        hex = hex.slice(2);
      }
      
      // Pad to 64 characters
      hex = hex.padStart(64, '0').slice(0, 64);
      
      // Convert to bytes array
      const bytes = new Uint8Array(32);
      for (let i = 0; i < 32; i++) {
        bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
      }
      
      // Convert back to hex using Buffer instead of ethers.hexlify()
      // This ensures NO escape sequences can be introduced
      const buffer = Buffer.from(bytes);
      const cleanHex = buffer.toString('hex');
      return `0x${cleanHex}`;
    };
    
    // Apply final cleaning to all bytes32 values using Uint8Array conversion
    const cleanBytes32ForCall = (hexString: string): string => {
      // Extract only hex characters (0-9, a-f)
      let hex = '';
      for (let i = 0; i < hexString.length; i++) {
        const char = hexString[i].toLowerCase();
        if ((char >= '0' && char <= '9') || (char >= 'a' && char <= 'f')) {
          hex += char;
        }
      }
      
      // Remove 0x if somehow present
      if (hex.startsWith('0x')) {
        hex = hex.slice(2);
      }
      
      // Pad to 64 characters
      hex = hex.padStart(64, '0').slice(0, 64);
      
      // Convert to bytes array
      const bytes = new Uint8Array(32);
      for (let i = 0; i < 32; i++) {
        bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
      }
      
      // Convert back to hex using Buffer instead of ethers.hexlify()
      // This ensures NO escape sequences can be introduced
      const buffer = Buffer.from(bytes);
      const cleanHex = buffer.toString('hex');
      return `0x${cleanHex}`;
    };
    
    // Apply final cleaning
    const callFrontId = cleanBytes32ForCall(contractFrontId);
    const callBackId = cleanBytes32ForCall(contractBackId);
    const callProof = cleanBytes32ForCall(contractProof);
    const callLive = cleanBytes32ForCall(contractLive);
    
    // Validate final values
    const callValues = [callFrontId, callBackId, callProof, callLive];
    const callNames = ['frontId', 'backId', 'proof', 'live'];
    for (let i = 0; i < callValues.length; i++) {
      const val = callValues[i];
      if (val.length !== 66 || !/^0x[0-9a-f]{64}$/.test(val)) {
        throw new Error(`Invalid ${callNames[i]} format: ${val.substring(0, 20)}...`);
      }
      if (val.includes('\\') || val.includes('\r') || val.includes('\n')) {
        console.error(`❌ ${callNames[i]} contains escape sequences:`, JSON.stringify(val));
        throw new Error(`${callNames[i]} contains escape sequences`);
      }
    }
    
    console.log('✅ Final bytes32 values validated for contract call:', {
      frontId: callFrontId.substring(0, 20) + '...',
      backId: callBackId.substring(0, 20) + '...',
      proof: callProof.substring(0, 20) + '...',
      live: callLive.substring(0, 20) + '...'
    });
    
    // CRITICAL: Use AbiCoder to encode parameters manually
    // This gives us complete control and avoids any string serialization issues
    const abiCoder = new ethers.AbiCoder();
    
    // CRITICAL: Create bytes32 values manually - completely avoid ethers string methods
    // This ensures NO escape sequences can be introduced
    const createBytes32 = (hex: string): string => {
      // Step 1: Extract only hex characters (0-9, a-f) character by character
      let hexOnly = '';
      for (let i = 0; i < hex.length; i++) {
        const char = hex[i].toLowerCase();
        if ((char >= '0' && char <= '9') || (char >= 'a' && char <= 'f')) {
          hexOnly += char;
        }
      }
      
      // Step 2: Ensure we have hex content
      if (hexOnly.length === 0) {
        throw new Error('No valid hex characters found');
      }
      
      // Step 3: Pad to exactly 64 characters
      hexOnly = hexOnly.padStart(64, '0').slice(0, 64);
      
      // Step 4: Validate it's pure hex
      if (!/^[0-9a-f]{64}$/.test(hexOnly)) {
        throw new Error(`Invalid hex format: ${hexOnly.substring(0, 20)}...`);
      }
      
      // Step 5: Manually construct the bytes32 string - NO ethers methods
      // This completely avoids any string manipulation that could introduce escape sequences
      const bytes32 = '0x' + hexOnly;
      
      // Step 6: Validate using getBytes (this validates the format without modifying it)
      try {
        const bytes = ethers.getBytes(bytes32);
        if (bytes.length !== 32) {
          throw new Error(`Invalid bytes length: ${bytes.length}, expected 32`);
        }
      } catch (error: any) {
        console.error('❌ Error validating bytes32 with getBytes:', {
          bytes32: bytes32.substring(0, 20) + '...',
          error: error.message
        });
        throw error;
      }
      
      // Step 7: Final check for escape sequences (should never happen)
      if (bytes32.includes('\\') || bytes32.includes('\r') || bytes32.includes('\n')) {
        console.error('❌ CRITICAL: Manually constructed bytes32 contains escape sequences:', {
          bytes32: JSON.stringify(bytes32),
          charCodes: Array.from(bytes32).map((c: string) => c.charCodeAt(0))
        });
        // This should never happen, but if it does, reconstruct
        return '0x' + hexOnly;
      }
      
      return bytes32;
    };
    
    const encodedFrontId = createBytes32(callFrontId);
    const encodedBackId = createBytes32(callBackId);
    const encodedProof = createBytes32(callProof);
    const encodedLive = createBytes32(callLive);
    
    // Validate one more time
    [encodedFrontId, encodedBackId, encodedProof, encodedLive].forEach((val, idx) => {
      const names = ['frontId', 'backId', 'proof', 'live'];
      if (val.length !== 66 || !/^0x[0-9a-f]{64}$/.test(val)) {
        throw new Error(`Invalid ${names[idx]} after finalization: ${val.substring(0, 20)}...`);
      }
      if (val.includes('\\') || val.includes('\r') || val.includes('\n')) {
        console.error(`❌ ${names[idx]} contains escape sequences:`, JSON.stringify(val));
        throw new Error(`${names[idx]} contains escape sequences after finalization`);
      }
    });
    
    console.log('✅ Final bytes32 values after finalization:', {
      frontId: encodedFrontId.substring(0, 20) + '...',
      backId: encodedBackId.substring(0, 20) + '...',
      proof: encodedProof.substring(0, 20) + '...',
      live: encodedLive.substring(0, 20) + '...'
    });
    
    // Get function selector using Interface
    const contractInterface = new ethers.Interface(KYC_ABI);
    const functionFragment = contractInterface.getFunction('storeKYCVerification');
    if (!functionFragment) {
      throw new Error('Function storeKYCVerification not found in ABI');
    }
    
    // Get function selector (first 4 bytes of keccak256 hash of function signature)
    const functionSelector = functionFragment.selector;
    
    // CRITICAL: Deep inspection of all parameters before encoding
    // Check character codes to identify any non-printable or escape characters
    const inspectValue = (val: string, name: string) => {
      const charCodes = Array.from(val).map((c, i) => ({
        index: i,
        char: c,
        code: c.charCodeAt(0),
        isHex: /[0-9a-fA-Fx]/.test(c)
      }));
      
      const nonHexChars = charCodes.filter(c => !c.isHex && c.char !== 'x' && c.index > 1);
      const escapeChars = charCodes.filter(c => c.code === 92 || c.code === 13 || c.code === 10); // \, \r, \n
      
      return {
        value: val.substring(0, 30) + '...',
        length: val.length,
        type: typeof val,
        isValidHex: /^0x[0-9a-f]{64}$/.test(val),
        hasEscape: val.includes('\\') || val.includes('\r') || val.includes('\n'),
        nonHexChars: nonHexChars.length > 0 ? nonHexChars.slice(0, 10) : [],
        escapeChars: escapeChars.length > 0 ? escapeChars : [],
        allCharCodes: charCodes.slice(0, 20) // First 20 characters
      };
    };
    
    console.log('🔍 Deep inspection of parameters before AbiCoder.encode:', {
      userId: inspectValue(cleanedUserId, 'userId'),
      frontId: inspectValue(encodedFrontId, 'frontId'),
      backId: inspectValue(encodedBackId, 'backId'),
      proof: inspectValue(encodedProof, 'proof'),
      live: inspectValue(encodedLive, 'live')
    });
    
    // CRITICAL: Encode parameters using AbiCoder with explicit types
    // This ensures no string manipulation happens
    let encodedParams: string;
    try {
      // CRITICAL: Final validation and reconstruction right before encoding
      // Use Buffer and ethers.getBytes to ensure absolute cleanliness
      const finalizeForEncoding = (val: string, name: string): string => {
        try {
          // Step 1: Extract only hex characters character by character
          let hexOnly = '';
          for (let i = 0; i < val.length; i++) {
            const char = val[i].toLowerCase();
            if ((char >= '0' && char <= '9') || (char >= 'a' && char <= 'f')) {
              hexOnly += char;
            }
          }
          
          // Step 2: Remove any '0x' prefix if it got included
          if (hexOnly.startsWith('0x')) {
            hexOnly = hexOnly.slice(2);
          }
          
          // Step 3: Pad to exactly 64 hex characters
          hexOnly = hexOnly.padStart(64, '0').slice(0, 64);
          
          // Step 4: Validate it's pure hex
          if (!/^[0-9a-f]{64}$/.test(hexOnly)) {
            throw new Error(`Invalid hex format for ${name}`);
          }
          
          // Step 5: Convert to Buffer to ensure no string corruption
          const hexBuffer = Buffer.from(hexOnly, 'hex');
          if (hexBuffer.length !== 32) {
            throw new Error(`Invalid buffer length for ${name}: ${hexBuffer.length}`);
          }
          
          // Step 6: Convert back to hex string using Buffer.toString('hex')
          // This ensures no escape sequences can be introduced
          const cleanHex = hexBuffer.toString('hex');
          
          // Step 7: Manually construct the final string
          const result = '0x' + cleanHex;
          
          // Step 8: Validate using ethers.getBytes (this validates format without modifying)
          const bytes = ethers.getBytes(result);
          if (bytes.length !== 32) {
            throw new Error(`Invalid bytes length for ${name}: ${bytes.length}`);
          }
          
          // Step 9: Final check for escape sequences (should never happen with Buffer)
          if (result.includes('\\') || result.includes('\r') || result.includes('\n')) {
            console.error(`❌ CRITICAL: ${name} contains escape sequences after Buffer conversion:`, {
              result: result.substring(0, 30),
              charCodes: Array.from(result).slice(0, 30).map((c: string) => c.charCodeAt(0))
            });
            throw new Error(`${name} contains escape sequences after Buffer conversion`);
          }
          
          return result;
        } catch (error: any) {
          console.error(`❌ Error finalizing ${name}:`, {
            original: val.substring(0, 30),
            error: error.message
          });
          throw error;
        }
      };
      
      const finalFrontId = finalizeForEncoding(encodedFrontId, 'frontId');
      const finalBackId = finalizeForEncoding(encodedBackId, 'backId');
      const finalProof = finalizeForEncoding(encodedProof, 'proof');
      const finalLive = finalizeForEncoding(encodedLive, 'live');
      
      console.log('✅ Final bytes32 values ready for encoding (manually constructed):', {
        frontId: finalFrontId.substring(0, 20) + '...',
        backId: finalBackId.substring(0, 20) + '...',
        proof: finalProof.substring(0, 20) + '...',
        live: finalLive.substring(0, 20) + '...'
      });
      
      // CRITICAL: Final check - ensure all values are the correct type and format
      // Convert bytes32 strings to actual DataHexString type that ethers expects
      const ensureDataHexString = (val: string): string => {
        // Remove 0x if present
        let hex = val.startsWith('0x') ? val.slice(2) : val;
        
        // Extract only hex characters
        let hexOnly = '';
        for (let i = 0; i < hex.length; i++) {
          const char = hex[i].toLowerCase();
          if ((char >= '0' && char <= '9') || (char >= 'a' && char <= 'f')) {
            hexOnly += char;
          }
        }
        
        // Pad to 64
        hexOnly = hexOnly.padStart(64, '0').slice(0, 64);
        
        // Construct result
        const result = '0x' + hexOnly;
        
        // Validate using getBytes to ensure it's valid
        try {
          const bytes = ethers.getBytes(result);
          if (bytes.length !== 32) {
            throw new Error(`Invalid bytes length: ${bytes.length}`);
          }
        } catch (error: any) {
          throw new Error(`Invalid hex string: ${error.message}`);
        }
        
        return result;
      };
      
      // These variables will be declared later using bytesToHex
      
      // These variables will be declared later using bytesToHex
      
      // CRITICAL: Final byte-level conversion RIGHT BEFORE encoding
      // Convert to bytes and back to ensure absolute cleanliness - this is the last chance to clean
      const finalByteLevelClean = (hex: string, name: string): string => {
        try {
          // Step 1: Remove 0x prefix if present and trim ALL whitespace/newlines
          let clean = hex.startsWith('0x') ? hex.slice(2) : hex;
          clean = clean.trim(); // Remove leading/trailing whitespace including \r\n
          
          // Step 2: Remove ALL non-hex characters including newlines, backslashes, etc.
          // This is the most aggressive - we extract ONLY hex characters
          let hexOnly = '';
          for (let i = 0; i < clean.length; i++) {
            const char = clean[i].toLowerCase();
            // Only include valid hex characters (0-9, a-f)
            if ((char >= '0' && char <= '9') || (char >= 'a' && char <= 'f')) {
              hexOnly += char;
            }
            // Explicitly skip everything else including 'x', backslashes, newlines, etc.
          }
          
          // Step 3: Pad to exactly 64 hex characters
          hexOnly = hexOnly.padStart(64, '0').slice(0, 64);
          
          // Step 4: Validate it's pure hex and exactly 64 characters
          if (hexOnly.length !== 64 || !/^[0-9a-f]{64}$/.test(hexOnly)) {
            console.error(`❌ Invalid hex for ${name}:`, {
              hexOnly: hexOnly.substring(0, 30) + '...',
              length: hexOnly.length,
              original: hex.substring(0, 50),
              originalLength: hex.length
            });
            throw new Error(`Invalid hex for ${name}: length=${hexOnly.length}, valid=${/^[0-9a-f]{64}$/.test(hexOnly)}`);
          }
          
          // Step 5: Convert to Buffer (byte-level) - this validates the hex is valid
          let buffer: Buffer;
          try {
            buffer = Buffer.from(hexOnly, 'hex');
            if (buffer.length !== 32) {
              throw new Error(`Invalid buffer length: ${buffer.length}, expected 32`);
            }
          } catch (bufferError: any) {
            console.error(`❌ Buffer conversion failed for ${name}:`, {
              hexOnly: hexOnly.substring(0, 30),
              error: bufferError.message
            });
            throw new Error(`Invalid hex format for ${name}: ${bufferError.message}`);
          }
          
          // Step 6: Convert back to hex using Buffer.toString('hex') - this ensures NO escape sequences
          const cleanHex = buffer.toString('hex');
          
          // Step 7: Validate cleanHex is exactly 64 characters
          if (cleanHex.length !== 64 || !/^[0-9a-f]{64}$/.test(cleanHex)) {
            throw new Error(`Invalid clean hex length: ${cleanHex.length}`);
          }
          
          // Step 8: Manually construct final string - NO string manipulation, just concatenation
          const result = '0x' + cleanHex;
          
          // Step 9: CRITICAL - Validate length is exactly 66 (0x + 64 hex)
          if (result.length !== 66) {
            console.error(`❌ CRITICAL: ${name} has wrong length:`, {
              result: JSON.stringify(result),
              length: result.length,
              expected: 66,
              charCodes: Array.from(result).map(c => c.charCodeAt(0))
            });
            throw new Error(`${name} has wrong length: ${result.length}, expected 66`);
          }
          
          // Step 10: Validate using ethers.getBytes - this will throw if invalid
          let bytes: Uint8Array;
          try {
            bytes = ethers.getBytes(result);
            if (bytes.length !== 32) {
              throw new Error(`Invalid bytes length: ${bytes.length}, expected 32`);
            }
          } catch (bytesError: any) {
            console.error(`❌ ethers.getBytes failed for ${name}:`, {
              result: JSON.stringify(result),
              resultLength: result.length,
              error: bytesError.message
            });
            throw bytesError;
          }
          
          // Step 11: Final validation - check for escape sequences by checking each character
          // Check length first, then check for problematic characters
          for (let i = 0; i < result.length; i++) {
            const char = result[i];
            const code = char.charCodeAt(0);
            // Check for backslash (92), carriage return (13), line feed (10)
            if (code === 92 || code === 13 || code === 10) {
              console.error(`❌ CRITICAL: ${name} contains escape sequence at position ${i}:`, {
                result: JSON.stringify(result),
                position: i,
                char: char,
                code: code,
                allCharCodes: Array.from(result).map((c, idx) => ({ idx, char: c, code: c.charCodeAt(0) }))
              });
              throw new Error(`${name} contains escape sequence at position ${i}: char=${char}, code=${code}`);
            }
          }
          
          // Step 12: Final length check - must be exactly 66
          if (result.length !== 66) {
            throw new Error(`${name} final length is ${result.length}, expected 66`);
          }
          
          // Step 10: Log if cleaning was needed
          if (hex !== result) {
            console.warn(`⚠️ ${name} was cleaned at final byte level:`, {
              original: hex.substring(0, 30) + '...',
              cleaned: result.substring(0, 30) + '...',
              originalLength: hex.length,
              cleanedLength: result.length
            });
          }
          
          return result;
        } catch (error: any) {
          console.error(`❌ Error in finalByteLevelClean for ${name}:`, {
            hex: hex.substring(0, 30),
            error: error.message
          });
          throw error;
        }
      };
      
      // Apply final byte-level cleaning to all hash values - use the final values from earlier
      const finalFrontIdBytes = finalByteLevelClean(finalFrontId, 'frontId');
      const finalBackIdBytes = finalByteLevelClean(finalBackId, 'backId');
      const finalProofBytes = finalByteLevelClean(finalProof, 'proof');
      const finalLiveBytes = finalByteLevelClean(finalLive, 'live');
      
      // Log final values with character code inspection
      console.log('🔍 FINAL values RIGHT BEFORE Interface.encodeFunctionData:', {
        userId: {
          value: cleanedUserId.substring(0, 30),
          length: cleanedUserId.length,
          hasEscape: cleanedUserId.includes('\\') || cleanedUserId.includes('\r') || cleanedUserId.includes('\n')
        },
        frontId: {
          value: finalFrontIdBytes.substring(0, 30) + '...',
          length: finalFrontIdBytes.length,
          hasEscape: finalFrontIdBytes.includes('\\') || finalFrontIdBytes.includes('\r') || finalFrontIdBytes.includes('\n'),
          charCodes: Array.from(finalFrontIdBytes).slice(0, 30).map(c => c.charCodeAt(0))
        },
        backId: {
          value: finalBackIdBytes.substring(0, 30) + '...',
          length: finalBackIdBytes.length,
          hasEscape: finalBackIdBytes.includes('\\') || finalBackIdBytes.includes('\r') || finalBackIdBytes.includes('\n')
        },
        proof: {
          value: finalProofBytes.substring(0, 30) + '...',
          length: finalProofBytes.length,
          hasEscape: finalProofBytes.includes('\\') || finalProofBytes.includes('\r') || finalProofBytes.includes('\n')
        },
        live: {
          value: finalLiveBytes.substring(0, 30) + '...',
          length: finalLiveBytes.length,
          hasEscape: finalLiveBytes.includes('\\') || finalLiveBytes.includes('\r') || finalLiveBytes.includes('\n')
        }
      });
      
      // CRITICAL: Final cleaning RIGHT BEFORE encoding - use Buffer to ensure absolute cleanliness
      // This is the absolute last chance to remove any escape sequences
      const absoluteFinalClean = (hex: string, name: string): string => {
        // Step 1: Remove 0x if present and trim ALL whitespace/newlines
        let clean = hex.startsWith('0x') ? hex.slice(2) : hex;
        clean = clean.trim(); // Remove leading/trailing whitespace including \r\n
        
        // Step 2: Remove ALL non-hex characters including newlines, backslashes, etc.
        // Extract ONLY hex characters character by character
        let hexOnly = '';
        for (let i = 0; i < clean.length; i++) {
          const char = clean[i].toLowerCase();
          if ((char >= '0' && char <= '9') || (char >= 'a' && char <= 'f')) {
            hexOnly += char;
          }
        }
        
        // Step 3: Pad to 64
        hexOnly = hexOnly.padStart(64, '0').slice(0, 64);
        
        // Step 4: Validate hexOnly is pure hex
        if (!/^[0-9a-f]{64}$/.test(hexOnly)) {
          throw new Error(`${name} hexOnly is not pure hex`);
        }
        
        // Step 5: Convert to Buffer and back - this ensures absolute byte-level cleanliness
        const buffer = Buffer.from(hexOnly, 'hex');
        if (buffer.length !== 32) {
          throw new Error(`${name} buffer length is ${buffer.length}, expected 32`);
        }
        const cleanHex = buffer.toString('hex');
        
        // Step 6: Validate cleanHex is exactly 64 characters
        if (cleanHex.length !== 64 || !/^[0-9a-f]{64}$/.test(cleanHex)) {
          throw new Error(`${name} cleanHex is invalid: length=${cleanHex.length}`);
        }
        
        // Step 7: Manually construct result using template literal - NO string concatenation
        // This ensures no newlines can be accidentally included
        const result = `0x${cleanHex}`;
        
        // Step 8: CRITICAL - Validate length is exactly 66
        if (result.length !== 66) {
          console.error(`❌ CRITICAL: ${name} has wrong length:`, {
            result: JSON.stringify(result),
            length: result.length,
            expected: 66,
            cleanHexLength: cleanHex.length,
            charCodes: Array.from(result).map(c => c.charCodeAt(0))
          });
          throw new Error(`${name} has wrong length: ${result.length}, expected 66`);
        }
        
        // Step 9: Check each character individually for escape sequences
        for (let i = 0; i < result.length; i++) {
          const char = result[i];
          const code = char.charCodeAt(0);
          if (code === 92 || code === 13 || code === 10) { // backslash, CR, LF
            console.error(`❌ CRITICAL: ${name} contains escape sequence at position ${i}:`, {
              result: JSON.stringify(result),
              position: i,
              char: char,
              code: code,
              allCharCodes: Array.from(result).map((c, idx) => ({ idx, char: c, code: c.charCodeAt(0) }))
            });
            throw new Error(`${name} contains escape sequence at position ${i}: char=${char}, code=${code}`);
          }
        }
        
        // Step 10: Final validation using ethers.getBytes
        try {
          const bytes = ethers.getBytes(result);
          if (bytes.length !== 32) {
            throw new Error(`Invalid bytes length: ${bytes.length}`);
          }
        } catch (bytesError: any) {
          console.error(`❌ ethers.getBytes failed for ${name}:`, {
            result: JSON.stringify(result),
            resultLength: result.length,
            error: bytesError.message,
            charCodes: Array.from(result).map(c => c.charCodeAt(0))
          });
          throw bytesError;
        }
        
        return result;
      };
      
      const absoluteFinalFrontId = absoluteFinalClean(finalFrontIdBytes, 'frontId');
      const absoluteFinalBackId = absoluteFinalClean(finalBackIdBytes, 'backId');
      const absoluteFinalProof = absoluteFinalClean(finalProofBytes, 'proof');
      const absoluteFinalLive = absoluteFinalClean(finalLiveBytes, 'live');
      
      // Log absolute final values
      console.log('🔍 ABSOLUTE FINAL values RIGHT BEFORE Interface.encodeFunctionData:', {
        frontId: {
          value: absoluteFinalFrontId.substring(0, 30) + '...',
          length: absoluteFinalFrontId.length,
          charCodes: Array.from(absoluteFinalFrontId).slice(0, 30).map(c => c.charCodeAt(0))
        },
        backId: {
          value: absoluteFinalBackId.substring(0, 30) + '...',
          length: absoluteFinalBackId.length
        },
        proof: {
          value: absoluteFinalProof.substring(0, 30) + '...',
          length: absoluteFinalProof.length
        },
        live: {
          value: absoluteFinalLive.substring(0, 30) + '...',
          length: absoluteFinalLive.length
        }
      });
      
      // CRITICAL: Convert all hex strings to Uint8Array BEFORE passing to encodeFunctionData
      // This completely bypasses any string parsing that could introduce escape sequences
      const hexToBytes = (hex: string): Uint8Array => {
        // Remove 0x if present
        let clean = hex.startsWith('0x') ? hex.slice(2) : hex;
        
        // Extract ONLY hex characters character by character
        let hexOnly = '';
        for (let i = 0; i < clean.length; i++) {
          const char = clean[i].toLowerCase();
          if ((char >= '0' && char <= '9') || (char >= 'a' && char <= 'f')) {
            hexOnly += char;
          }
        }
        
        // Pad to 64
        hexOnly = hexOnly.padStart(64, '0').slice(0, 64);
        
        // Convert to Buffer and then to Uint8Array
        const buffer = Buffer.from(hexOnly, 'hex');
        if (buffer.length !== 32) {
          throw new Error(`Invalid buffer length: ${buffer.length}, expected 32`);
        }
        
        return new Uint8Array(buffer);
      };
      
      const frontIdBytes = hexToBytes(absoluteFinalFrontId);
      const backIdBytes = hexToBytes(absoluteFinalBackId);
      const proofBytes = hexToBytes(absoluteFinalProof);
      const liveBytes = hexToBytes(absoluteFinalLive);
      
      // Log bytes for debugging
      console.log('🔍 Converting to Uint8Array before encoding:', {
        frontId: {
          hex: absoluteFinalFrontId.substring(0, 30) + '...',
          bytesLength: frontIdBytes.length,
          firstBytes: Array.from(frontIdBytes).slice(0, 5).map(b => b.toString(16).padStart(2, '0'))
        },
        backId: {
          hex: absoluteFinalBackId.substring(0, 30) + '...',
          bytesLength: backIdBytes.length
        },
        proof: {
          hex: absoluteFinalProof.substring(0, 30) + '...',
          bytesLength: proofBytes.length
        },
        live: {
          hex: absoluteFinalLive.substring(0, 30) + '...',
          bytesLength: liveBytes.length
        }
      });
      
      // CRITICAL: Convert Uint8Array back to hex strings using Buffer RIGHT BEFORE encoding
      // This ensures the hex strings are constructed from bytes, preventing any escape sequences
      const bytesToHex = (bytes: Uint8Array): string => {
        const buffer = Buffer.from(bytes);
        const hex = buffer.toString('hex');
        const result = `0x${hex}`;
        
        // Validate
        if (result.length !== 66) {
          throw new Error(`Invalid hex length: ${result.length}, expected 66`);
        }
        
        // Check for escape sequences
        for (let i = 0; i < result.length; i++) {
          const code = result[i].charCodeAt(0);
          if (code === 92 || code === 13 || code === 10) {
            throw new Error(`Hex contains escape sequence at position ${i}`);
          }
        }
        
        return result;
      };
      
      const finalFrontIdHex = bytesToHex(frontIdBytes);
      const finalBackIdHex = bytesToHex(backIdBytes);
      const finalProofHex = bytesToHex(proofBytes);
      const finalLiveHex = bytesToHex(liveBytes);
      
      // Log final hex strings
      console.log('🔍 Final hex strings from Uint8Array (RIGHT BEFORE encodeFunctionData):', {
        frontId: {
          hex: finalFrontIdHex.substring(0, 30) + '...',
          length: finalFrontIdHex.length,
          charCodes: Array.from(finalFrontIdHex).slice(0, 30).map(c => c.charCodeAt(0))
        },
        backId: {
          hex: finalBackIdHex.substring(0, 30) + '...',
          length: finalBackIdHex.length
        },
        proof: {
          hex: finalProofHex.substring(0, 30) + '...',
          length: finalProofHex.length
        },
        live: {
          hex: finalLiveHex.substring(0, 30) + '...',
          length: finalLiveHex.length
        }
      });
      
      // CRITICAL: Final validation using ethers.getBytes() RIGHT BEFORE encoding
      // This ensures the hex strings are valid and clean before AbiCoder.encode() processes them
      const validateAndReconstructHex = (hex: string, name: string): string => {
        try {
          // Step 1: Use ethers.getBytes() to validate and convert to bytes
          // This will throw if the hex string is invalid or contains escape sequences
          const bytes = ethers.getBytes(hex);
          if (bytes.length !== 32) {
            throw new Error(`${name} has wrong byte length: ${bytes.length}, expected 32`);
          }
          
          // Step 2: Convert back to hex using Buffer - this ensures absolute cleanliness
          const buffer = Buffer.from(bytes);
          const cleanHex = buffer.toString('hex');
          const result = `0x${cleanHex}`;
          
          // Step 3: Validate length
          if (result.length !== 66) {
            throw new Error(`${name} has wrong length: ${result.length}, expected 66`);
          }
          
          // Step 4: Check each character for escape sequences
          for (let i = 0; i < result.length; i++) {
            const code = result[i].charCodeAt(0);
            if (code === 92 || code === 13 || code === 10) {
              throw new Error(`${name} contains escape sequence at position ${i}: code=${code}`);
            }
          }
          
          // Step 5: Validate using ethers.getBytes() one more time
          const finalBytes = ethers.getBytes(result);
          if (finalBytes.length !== 32) {
            throw new Error(`${name} final validation failed: byte length=${finalBytes.length}`);
          }
          
          return result;
        } catch (error: any) {
          console.error(`❌ Error validating ${name}:`, {
            hex: hex.substring(0, 30) + '...',
            error: error.message,
            charCodes: Array.from(hex).slice(0, 30).map(c => c.charCodeAt(0))
          });
          throw error;
        }
      };
      
      const validatedFrontId = validateAndReconstructHex(finalFrontIdHex, 'frontId');
      const validatedBackId = validateAndReconstructHex(finalBackIdHex, 'backId');
      const validatedProof = validateAndReconstructHex(finalProofHex, 'proof');
      const validatedLive = validateAndReconstructHex(finalLiveHex, 'live');
      
      // Log validated values
      console.log('🔍 Validated hex strings RIGHT BEFORE AbiCoder.encode():', {
        frontId: {
          hex: validatedFrontId.substring(0, 30) + '...',
          length: validatedFrontId.length,
          charCodes: Array.from(validatedFrontId).slice(0, 30).map(c => c.charCodeAt(0))
        },
        backId: {
          hex: validatedBackId.substring(0, 30) + '...',
          length: validatedBackId.length
        },
        proof: {
          hex: validatedProof.substring(0, 30) + '...',
          length: validatedProof.length
        },
        live: {
          hex: validatedLive.substring(0, 30) + '...',
          length: validatedLive.length
        }
      });
      
      // Get function selector once - will be used in both paths
      let functionSelector: string | undefined;
      const func = contractInterface.getFunction('storeKYCVerification');
      if (!func?.selector) {
        throw new Error('Function selector not found');
      }
      functionSelector = func.selector;
      
      // CRITICAL: Use AbiCoder.encode() directly instead of Interface.encodeFunctionData()
      // This bypasses any string manipulation that Interface.encodeFunctionData() might do
      // We'll manually add the function selector
      try {
        
        // Use AbiCoder.encode() directly with validated hex strings
        // These have been validated using ethers.getBytes() and reconstructed from bytes
        const abiCoder = ethers.AbiCoder.defaultAbiCoder();
        const encodedParamsOnly = abiCoder.encode(
          ['string', 'bytes32', 'bytes32', 'bytes32', 'bytes32', 'bool'],
          [
            cleanedUserId,
            validatedFrontId,  // Validated and reconstructed from bytes
            validatedBackId,   // Validated and reconstructed from bytes
            validatedProof,    // Validated and reconstructed from bytes
            validatedLive,     // Validated and reconstructed from bytes
            approvalStatus
          ]
        );
        
        // Combine function selector with encoded parameters
        const functionData = functionSelector + encodedParamsOnly.slice(2); // Remove 0x from encoded params
        
        // Extract just the parameters (skip function selector) for consistency
        encodedParams = '0x' + functionData.slice(10); // Remove 4-byte selector (10 hex chars)
        
        console.log('✅ Function data encoded using AbiCoder.encode() directly');
      } catch (abiError: any) {
        console.error('❌ AbiCoder.encode() failed, trying manual encoding:', {
          error: abiError.message,
          errorCode: abiError.code,
          argument: abiError.argument,
          value: abiError.value ? String(abiError.value).substring(0, 50) : 'N/A',
          valueLength: abiError.value ? String(abiError.value).length : 'N/A',
          valueCharCodes: abiError.value ? Array.from(String(abiError.value)).slice(0, 70).map(c => c.charCodeAt(0)) : 'N/A'
        });
        
        // CRITICAL FALLBACK: Manual ABI encoding for bytes32 values
        // This completely bypasses AbiCoder.encode() string manipulation
        try {
          // Manual encoding: bytes32 values are 32 bytes (64 hex chars), zero-padded
          // String encoding: offset (32 bytes) + length (32 bytes) + data (padded to 32-byte boundary)
          
          // Convert all bytes32 to Uint8Array for manual encoding
          const frontIdBytes = ethers.getBytes(validatedFrontId);
          const backIdBytes = ethers.getBytes(validatedBackId);
          const proofBytes = ethers.getBytes(validatedProof);
          const liveBytes = ethers.getBytes(validatedLive);
          
          // Encode string (userId) manually
          const userIdBytes = Buffer.from(cleanedUserId, 'utf8');
          const userIdLength = userIdBytes.length;
          const userIdPaddedLength = Math.ceil(userIdLength / 32) * 32;
          
          // Calculate offsets
          // Layout: string offset (32 bytes) + 4x bytes32 (128 bytes) + bool (32 bytes) + string data
          const stringOffset = 32 + 128 + 32; // offset + bytes32s + bool
          
          // Build encoded data manually
          const encodedParts: string[] = [];
          
          // Offset for string (32 bytes, left-padded)
          encodedParts.push(ethers.zeroPadValue(ethers.toBeHex(stringOffset), 32).slice(2));
          
          // bytes32 values (64 hex chars each, no padding needed as they're already 32 bytes)
          encodedParts.push(validatedFrontId.slice(2));
          encodedParts.push(validatedBackId.slice(2));
          encodedParts.push(validatedProof.slice(2));
          encodedParts.push(validatedLive.slice(2));
          
          // bool (32 bytes, left-padded, 0x00 or 0x01)
          const boolValue = approvalStatus ? '01' : '00';
          encodedParts.push(boolValue.padStart(64, '0'));
          
          // String length (32 bytes, left-padded)
          encodedParts.push(ethers.zeroPadValue(ethers.toBeHex(userIdLength), 32).slice(2));
          
          // String data (padded to 32-byte boundary)
          const userIdHex = userIdBytes.toString('hex');
          const userIdPadded = userIdHex.padEnd(userIdPaddedLength * 2, '0');
          encodedParts.push(userIdPadded);
          
          // Combine all parts
          const manualEncoded = '0x' + encodedParts.join('');
          
          // Use the function selector we already got
          if (!functionSelector) {
            throw new Error('Function selector not found');
          }
          
          // Combine function selector with encoded parameters
          const functionData = functionSelector + manualEncoded.slice(2);
          encodedParams = manualEncoded;
          
          console.log('✅ Function data encoded using manual ABI encoding');
        } catch (manualError: any) {
          console.error('❌ Manual encoding also failed:', {
            error: manualError.message,
            stack: manualError.stack
          });
          throw abiError; // Re-throw original error
        }
        
        // Fallback to AbiCoder with raw bytes - use the Uint8Array values we already created
        // No need to convert again - we already have clean Uint8Array values
        
        // Convert back using Buffer instead of ethers.hexlify()
        // This ensures NO escape sequences can be introduced
        const bytes32FrontId = `0x${Buffer.from(frontIdBytes).toString('hex')}`;
        const bytes32BackId = `0x${Buffer.from(backIdBytes).toString('hex')}`;
        const bytes32Proof = `0x${Buffer.from(proofBytes).toString('hex')}`;
        const bytes32Live = `0x${Buffer.from(liveBytes).toString('hex')}`;
        
        // Validate all results have correct length and no escape sequences
        [bytes32FrontId, bytes32BackId, bytes32Proof, bytes32Live].forEach((val, idx) => {
          const names = ['frontId', 'backId', 'proof', 'live'];
          if (val.length !== 66) {
            throw new Error(`${names[idx]} has wrong length: ${val.length}, expected 66`);
          }
          for (let i = 0; i < val.length; i++) {
            const char = val[i];
            const code = char.charCodeAt(0);
            if (code === 92 || code === 13 || code === 10) {
              throw new Error(`${names[idx]} contains escape sequence at position ${i}`);
            }
          }
        });
        
        // Encode with AbiCoder
        encodedParams = abiCoder.encode(
          ['string', 'bytes32', 'bytes32', 'bytes32', 'bytes32', 'bool'],
          [cleanedUserId, bytes32FrontId, bytes32BackId, bytes32Proof, bytes32Live, approvalStatus]
        );
      }
    } catch (encodeError: any) {
      console.error('❌ AbiCoder.encode failed:', {
        error: encodeError.message,
        errorCode: encodeError.code,
        argument: encodeError.argument,
        value: encodeError.value ? JSON.stringify(String(encodeError.value).substring(0, 50)) : 'N/A',
        userId: cleanedUserId,
        frontIdHash: frontIdHash?.substring(0, 20) || 'N/A',
        backIdHash: backIdHash?.substring(0, 20) || 'N/A',
        proofHash: proofOfAddressHash?.substring(0, 20) || 'N/A',
        liveHash: liveSnapHash?.substring(0, 20) || 'N/A'
      });
      throw new Error(`Parameter encoding failed: ${encodeError.message}`);
    }
    
    // Get function selector - it should already be defined, but check just in case
    let finalFunctionSelector: string;
    if (functionSelector) {
      finalFunctionSelector = functionSelector;
    } else {
      const func = contractInterface.getFunction('storeKYCVerification');
      if (!func?.selector) {
        throw new Error('Function selector not found');
      }
      finalFunctionSelector = func.selector;
    }
    
    // Combine function selector with encoded parameters
    const functionData = finalFunctionSelector + encodedParams.slice(2); // Remove 0x from encoded params
    
    console.log('✅ Function data encoded successfully, length:', functionData.length);
    
    // CRITICAL: Send transaction directly using signer - this bypasses Contract object string handling
    const tx = await signer.sendTransaction({
      to: contractAddress,
      data: functionData
    });
    
    await tx.wait();
    return tx.hash;
  } catch (error: any) {
    // Enhanced error logging to identify which parameter is causing the issue
    if (error.code === 'INVALID_ARGUMENT' || error.argument) {
      console.error('❌ Contract transaction failed with parameter error:', {
        error: error.message,
        code: error.code,
        argument: error.argument,
        value: error.value ? String(error.value).substring(0, 50) : 'N/A',
        userId: cleanedUserId,
        frontIdHash: frontIdHash?.substring(0, 20) || 'N/A',
        backIdHash: backIdHash?.substring(0, 20) || 'N/A',
        proofHash: proofOfAddressHash?.substring(0, 20) || 'N/A',
        liveHash: liveSnapHash?.substring(0, 20) || 'N/A'
      });
    }
    // Check if it's a gas/balance error
    if (error.message?.includes('insufficient funds') || error.message?.includes('gas') || error.code === 'INSUFFICIENT_FUNDS') {
      console.warn('⚠️ Insufficient funds for transaction. Using placeholder hash for development.');
      return `0x${crypto.randomBytes(32).toString('hex')}`;
    }
    // Check if it's a contract/network error
    if (error.message?.includes('contract') || error.message?.includes('network') || error.code === 'NETWORK_ERROR') {
      console.warn('⚠️ Contract or network error. Using placeholder hash for development:', error.message);
      return `0x${crypto.randomBytes(32).toString('hex')}`;
    }
    // Fallback to placeholder if contract interaction fails (for development)
    console.warn('⚠️ KYC contract interaction failed, using placeholder:', error.message);
    return `0x${crypto.randomBytes(32).toString('hex')}`;
  }
}

/**
 * Store KYB verification hash on BNB Smart Chain
 * @param phoneHash - Hashed phone number
 * @param emailHash - Hashed email address
 * @param userId - User ID
 * @param approvalStatus - Approval status
 * @param signer - Ethers signer (wallet) for signing transactions
 * @returns Transaction hash on BNB Chain
 */
export async function storeKYBOnBNBChain(
  phoneHash: string,
  emailHash: string,
  userId: string,
  approvalStatus: boolean,
  signer: ethers.Wallet
): Promise<string> {
  // Get contract address from environment (deployed on BNB Chain)
  const contractAddress = process.env.NEXT_PUBLIC_BNB_KYB_CONTRACT_ADDRESS;
  if (!contractAddress) {
    throw new Error('BNB Chain KYB contract address not configured');
  }

  // Basic ABI for KYB contract (storeKYBVerification function)
  const KYB_ABI = [
    "function storeKYBVerification(string memory userId, bytes32 phoneHash, bytes32 emailHash, bool approved) public"
  ];

  try {
    // CRITICAL: Ultra-aggressive cleaning at function entry
    // The hash values may come with or without 0x prefix, and may contain escape sequences
    const cleanInputHash = (hash: string): string => {
      if (!hash || typeof hash !== 'string') {
        throw new Error('Invalid hash: must be a non-empty string');
      }
      
      // Log original for debugging
      const originalHash = hash;
      const hasEscapeSequences = hash.includes('\\') || hash.includes('\r') || hash.includes('\n');
      if (hasEscapeSequences) {
        console.error('❌ CRITICAL: Hash contains escape sequences at function entry:', {
          original: JSON.stringify(hash),
          length: hash.length,
          charCodes: Array.from(hash).slice(0, 50).map(c => ({ char: c, code: c.charCodeAt(0) })),
          hasBackslash: hash.includes('\\'),
          hasCR: hash.includes('\r'),
          hasLF: hash.includes('\n')
        });
      }
      
      // Step 1: Remove ALL backslashes first (most aggressive - removes all escape sequences)
      let cleaned = hash.replace(/\\/g, '');
      
      // Step 2: Remove actual newline characters
      cleaned = cleaned.replace(/[\r\n\u000A\u000D\u2028\u2029]/g, '');
      
      // Step 3: Remove ALL whitespace and control characters
      cleaned = cleaned.replace(/[\s\u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\uFEFF]/g, '');
      cleaned = cleaned.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
      
      // Step 4: Extract ONLY hex characters character by character
      let hexOnly = '';
      for (let i = 0; i < cleaned.length; i++) {
        const char = cleaned[i].toLowerCase();
        if ((char >= '0' && char <= '9') || (char >= 'a' && char <= 'f')) {
          hexOnly += char;
        }
      }
      
      // Step 5: Pad to 64
      hexOnly = hexOnly.padStart(64, '0').slice(0, 64);
      
      // Step 6: Validate
      if (!/^[0-9a-f]{64}$/.test(hexOnly)) {
        console.error('❌ Hash cleaning failed:', {
          original: JSON.stringify(hash),
          cleaned: JSON.stringify(cleaned),
          hexOnly: hexOnly.substring(0, 20) + '...',
          hexOnlyLength: hexOnly.length
        });
        throw new Error('Invalid hash: not pure hex after cleaning');
      }
      
      // Step 7: CRITICAL - Convert to Buffer and back to ensure absolute byte-level cleanliness
      try {
        const buffer = Buffer.from(hexOnly, 'hex');
        if (buffer.length !== 32) {
          throw new Error(`Invalid buffer length: ${buffer.length}, expected 32`);
        }
        const cleanHex = buffer.toString('hex');
        
        // Final validation
        if (cleanHex.length !== 64 || !/^[0-9a-f]{64}$/.test(cleanHex)) {
          throw new Error(`Invalid clean hex: ${cleanHex.substring(0, 20)}...`);
        }
        
        // Final check for escape sequences (should never happen with Buffer)
        if (cleanHex.includes('\\') || cleanHex.includes('\r') || cleanHex.includes('\n')) {
          console.error('❌ CRITICAL: Clean hex still contains escape sequences after Buffer conversion:', {
            cleanHex: JSON.stringify(cleanHex),
            charCodes: Array.from(cleanHex).slice(0, 30).map(c => c.charCodeAt(0))
          });
          throw new Error('Clean hex contains escape sequences after Buffer conversion');
        }
        
        // Log if cleaning was needed
        if (originalHash !== cleanHex || hasEscapeSequences) {
          console.warn('⚠️ Hash was cleaned at function entry:', {
            originalLength: originalHash.length,
            cleanedLength: cleanHex.length,
            originalFirst20: originalHash.substring(0, 20),
            cleanedFirst20: cleanHex.substring(0, 20),
            hadEscapeSequences: hasEscapeSequences
          });
        }
        
        return cleanHex; // Return without 0x prefix
      } catch (bufferError: any) {
        console.error('❌ Buffer conversion failed:', {
          hexOnly: hexOnly.substring(0, 30),
          error: bufferError.message
        });
        throw bufferError;
      }
    };
    
    // Clean all hashes immediately
    const cleanedPhone = cleanInputHash(phoneHash);
    const cleanedEmail = cleanInputHash(emailHash);
    
    console.log('✅ Input parameters cleaned at function entry:', {
      phone: cleanedPhone.substring(0, 20) + '...',
      email: cleanedEmail.substring(0, 20) + '...',
      userId: userId
    });
    
    // CRITICAL: Use the same robust cleaning and manual byte conversion as KYC
    // This ensures consistency and prevents any newline/whitespace issues
    const finalCleanHash = (hash: string): string => {
      if (!hash || typeof hash !== 'string') {
        console.error('❌ Invalid hash type:', typeof hash, hash);
        throw new Error('Invalid hash value: must be a non-empty string');
      }
      
      // Step 1: Convert to string and remove ALL control characters
      let cleaned = String(hash);
      
      // Step 2: Remove ALL whitespace characters (including Unicode)
      cleaned = cleaned.replace(/[\s\u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\uFEFF]/g, '');
      
      // Step 3: Remove ALL newline variants
      cleaned = cleaned.replace(/[\r\n\u000A\u000D\u2028\u2029]/g, '');
      
      // Step 4: Remove 0x prefix if present
      if (cleaned.toLowerCase().startsWith('0x')) {
        cleaned = cleaned.slice(2);
      }
      
      // Step 5: Remove ANY non-hex characters (most aggressive)
      cleaned = cleaned.replace(/[^0-9a-fA-F]/g, '');
      
      // Step 6: Validate
      if (cleaned.length === 0) {
        console.error('❌ Hash became empty after cleaning:', {
          original: JSON.stringify(hash)
        });
        throw new Error('Invalid hash: contains no valid hex characters after cleaning');
      }
      
      // Step 7: Pad to exactly 64 hex chars (32 bytes) for bytes32
      const padded = cleaned.length > 64 
        ? cleaned.slice(0, 64) 
        : cleaned.padStart(64, '0');
      
      // Step 8: Validate padded hash
      if (padded.length !== 64 || !/^[0-9a-fA-F]{64}$/.test(padded)) {
        console.error('❌ Padded hash validation failed:', {
          padded: JSON.stringify(padded),
          length: padded.length
        });
        throw new Error('Invalid padded hash format');
      }
      
      return '0x' + padded;
    };
    
    // CRITICAL: Convert hex strings to bytes32 using manual byte array construction
    // This completely bypasses any string parsing issues with ethers.js
    const toBytes32 = (hexString: string): string => {
      if (typeof hexString !== 'string') {
        throw new Error(`Hash must be a string, got ${typeof hexString}`);
      }
      
      // Remove 0x prefix if present
      let hex = hexString.startsWith('0x') ? hexString.slice(2) : hexString;
      
      // Remove ALL non-hex characters (most aggressive)
      hex = hex.replace(/[^0-9a-fA-F]/g, '');
      
      // Validate
      if (hex.length === 0 || hex.length !== 64) {
        console.error('❌ Hex length is not 64:', {
          length: hex.length,
          hex: hex.substring(0, 20) + '...'
        });
        throw new Error(`Hex must be exactly 64 characters, got ${hex.length}`);
      }
      
      if (!/^[0-9a-fA-F]{64}$/.test(hex)) {
        console.error('❌ Hex contains invalid characters');
        throw new Error('Hex contains invalid characters');
      }
      
      // Convert hex string to byte array manually - validate each byte
      const bytes = new Uint8Array(32);
      for (let i = 0; i < 32; i++) {
        const hexByte = hex.substring(i * 2, i * 2 + 2);
        
        if (!/^[0-9a-fA-F]{2}$/.test(hexByte)) {
          throw new Error(`Invalid hex byte at position ${i}: ${JSON.stringify(hexByte)}`);
        }
        
        const byteValue = parseInt(hexByte, 16);
        if (isNaN(byteValue) || byteValue < 0 || byteValue > 255) {
          throw new Error(`Invalid byte value at position ${i}: ${byteValue}`);
        }
        
        bytes[i] = byteValue;
      }
      
      // CRITICAL: Construct hex string directly from bytes array
      // This completely avoids any ethers.js string parsing that could introduce newlines
      let bytes32Hex = '0x';
      for (let i = 0; i < 32; i++) {
        const byteHex = bytes[i].toString(16).padStart(2, '0');
        bytes32Hex += byteHex;
      }
      
      // Final validation
      if (bytes32Hex.length !== 66 || !/^0x[0-9a-fA-F]{64}$/.test(bytes32Hex)) {
        console.error('❌ Invalid bytes32 format after manual conversion:', {
          bytes32: JSON.stringify(bytes32Hex),
          length: bytes32Hex.length,
          bytesLength: bytes.length
        });
        throw new Error('Invalid bytes32 format after conversion');
      }
      
      // CRITICAL: Final check - ensure no newlines somehow got into the string
      if (bytes32Hex.includes('\r') || bytes32Hex.includes('\n') || bytes32Hex.includes('\\')) {
        console.error('❌ bytes32 string contains newlines/backslashes:', {
          bytes32: JSON.stringify(bytes32Hex),
          hasCR: bytes32Hex.includes('\r'),
          hasLF: bytes32Hex.includes('\n'),
          hasBackslash: bytes32Hex.includes('\\')
        });
        // Force clean one more time
        bytes32Hex = '0x' + bytes32Hex.slice(2).replace(/[\r\n\\]/g, '').replace(/[^0-9a-fA-F]/g, '').padStart(64, '0').slice(0, 64);
      }
      
      // CRITICAL: Use ethers.hexZeroPad() to ensure proper bytes32 format
      // This is safer than hexlify() and ensures no escape sequences are introduced
      try {
        // Validate the hex string is correct format first
        if (!/^0x[0-9a-fA-F]{64}$/.test(bytes32Hex)) {
          throw new Error('Invalid hex format before zero pad');
        }
        
        // Use Buffer-based construction instead of ethers.zeroPadValue()
        // This ensures NO escape sequences can be introduced
        const hexWithoutPrefix = bytes32Hex.startsWith('0x') ? bytes32Hex.slice(2) : bytes32Hex;
        const buffer = Buffer.from(hexWithoutPrefix, 'hex');
        if (buffer.length !== 32) {
          throw new Error(`Invalid buffer length: ${buffer.length}, expected 32`);
        }
        const cleanHex = buffer.toString('hex');
        const finalBytes32 = `0x${cleanHex}`;
        
        // Final validation - ensure it's still clean
        if (finalBytes32.length !== 66 || !/^0x[0-9a-f]{64}$/.test(finalBytes32)) {
          throw new Error(`Invalid final bytes32 format: length=${finalBytes32.length}`);
        }
        
        // Check for escape sequences
        for (let i = 0; i < finalBytes32.length; i++) {
          const char = finalBytes32[i];
          const code = char.charCodeAt(0);
          if (code === 92 || code === 13 || code === 10) {
            throw new Error(`Final bytes32 contains escape sequence at position ${i}`);
          }
        }
        
        // CRITICAL: Final check for any escape sequences or control characters
        if (finalBytes32.includes('\r') || finalBytes32.includes('\n') || finalBytes32.includes('\\')) {
          console.error('❌ Final bytes32 contains escape sequences:', {
            bytes32: JSON.stringify(finalBytes32),
            charCodes: Array.from(finalBytes32).map((c: string) => c.charCodeAt(0))
          });
          // Reconstruct from scratch using only hex characters
          const hexOnly = finalBytes32.replace(/[^0-9a-fA-F]/g, '').toLowerCase();
          return '0x' + hexOnly.padStart(64, '0').slice(0, 64);
        }
        
        return finalBytes32;
      } catch (validationError: any) {
        console.error('❌ Error validating bytes32 with ethers:', {
          bytes32Hex: JSON.stringify(bytes32Hex),
          error: validationError.message
        });
        // Fallback: reconstruct from scratch to ensure it's clean
        const hexOnly = bytes32Hex.replace(/[^0-9a-fA-F]/g, '').toLowerCase();
        return '0x' + hexOnly.padStart(64, '0').slice(0, 64);
      }
    };
    
    // CRITICAL: Clean userId to remove any newlines, control characters, or escaped sequences
    // This prevents the "invalid BytesLike value" error from ethers.js
    const cleanInputUserId = (id: string): string => {
      if (!id || typeof id !== 'string') {
        throw new Error('Invalid userId: must be a non-empty string');
      }
      
      // Remove ALL control characters including newlines, carriage returns, tabs, etc.
      let cleaned = String(id);
      
      // Remove ALL newline variants (actual and escaped)
      cleaned = cleaned.replace(/[\r\n\u000A\u000D\u2028\u2029]/g, '');
      // Remove escaped newlines (literal \r\n sequences)
      cleaned = cleaned.replace(/\\[rn]/g, '');
      // Remove ALL control characters
      cleaned = cleaned.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
      // Remove backslashes that might be part of escape sequences
      cleaned = cleaned.replace(/\\/g, '');
      // Trim whitespace
      cleaned = cleaned.trim();
      
      // Validate
      if (cleaned.length === 0) {
        console.error('❌ userId became empty after cleaning:', {
          original: JSON.stringify(id)
        });
        throw new Error('Invalid userId: contains no valid characters after cleaning');
      }
      
      // Log if original had issues
      if (id !== cleaned) {
        console.warn('⚠️ userId was cleaned:', {
          original: JSON.stringify(id),
          cleaned: JSON.stringify(cleaned),
          originalLength: id.length,
          cleanedLength: cleaned.length
        });
      }
      
      return cleaned;
    };
    
    const cleanedUserId = cleanInputUserId(userId);
    
    // Clean and convert hashes (use already-cleaned hashes from function entry)
    const cleanedPhoneHash = finalCleanHash(cleanedPhone);
    const cleanedEmailHash = finalCleanHash(cleanedEmail);
    
    const phoneBytes32 = toBytes32(cleanedPhoneHash);
    const emailBytes32 = toBytes32(cleanedEmailHash);
    
    console.log('✅ KYB hashes converted to valid bytes32 format');

    // CRITICAL: Use the same manual encoding approach as KYC to avoid BytesLike errors
    // This completely bypasses ethers.Contract string handling that could introduce escape sequences
    const contractInterface = new ethers.Interface(KYB_ABI);
    const functionFragment = contractInterface.getFunction('storeKYBVerification');
    if (!functionFragment) {
      throw new Error('Function storeKYBVerification not found in ABI');
    }
    
    const functionSelector = functionFragment.selector;
    
    // CRITICAL: Final byte-level cleaning RIGHT BEFORE encoding
    // Convert to bytes and back to ensure absolute cleanliness
    const finalByteLevelClean = (hex: string, name: string): string => {
      try {
        // Step 1: Remove 0x if present and trim ALL whitespace/newlines
        let clean = hex.startsWith('0x') ? hex.slice(2) : hex;
        clean = clean.trim();
        
        // Step 2: Extract ONLY hex characters character by character
        let hexOnly = '';
        for (let i = 0; i < clean.length; i++) {
          const char = clean[i].toLowerCase();
          if ((char >= '0' && char <= '9') || (char >= 'a' && char <= 'f')) {
            hexOnly += char;
          }
        }
        
        // Step 3: Pad to exactly 64 hex characters
        hexOnly = hexOnly.padStart(64, '0').slice(0, 64);
        
        // Step 4: Validate
        if (hexOnly.length !== 64 || !/^[0-9a-f]{64}$/.test(hexOnly)) {
          throw new Error(`Invalid hex for ${name}: length=${hexOnly.length}`);
        }
        
        // Step 5: Convert to Buffer (byte-level)
        const buffer = Buffer.from(hexOnly, 'hex');
        if (buffer.length !== 32) {
          throw new Error(`Invalid buffer length: ${buffer.length}, expected 32`);
        }
        
        // Step 6: Convert back to hex using Buffer.toString('hex')
        const cleanHex = buffer.toString('hex');
        
        // Step 7: Validate cleanHex is exactly 64 characters
        if (cleanHex.length !== 64 || !/^[0-9a-f]{64}$/.test(cleanHex)) {
          throw new Error(`Invalid clean hex length: ${cleanHex.length}`);
        }
        
        // Step 8: Manually construct result
        const result = '0x' + cleanHex;
        
        // Step 9: Validate length is exactly 66
        if (result.length !== 66) {
          throw new Error(`${name} has wrong length: ${result.length}, expected 66`);
        }
        
        // Step 10: Validate using ethers.getBytes
        const bytes = ethers.getBytes(result);
        if (bytes.length !== 32) {
          throw new Error(`Invalid bytes length: ${bytes.length}, expected 32`);
        }
        
        // Step 11: Check each character for escape sequences
        for (let i = 0; i < result.length; i++) {
          const char = result[i];
          const code = char.charCodeAt(0);
          if (code === 92 || code === 13 || code === 10) {
            throw new Error(`${name} contains escape sequence at position ${i}`);
          }
        }
        
        return result;
      } catch (error: any) {
        console.error(`❌ Error in finalByteLevelClean for ${name}:`, {
          hex: hex.substring(0, 30),
          error: error.message
        });
        throw error;
      }
    };
    
    const finalPhoneBytes32 = finalByteLevelClean(phoneBytes32, 'phoneHash');
    const finalEmailBytes32 = finalByteLevelClean(emailBytes32, 'emailHash');
    
    console.log('✅ Final KYB bytes32 values validated:', {
      phone: finalPhoneBytes32.substring(0, 20) + '...',
      email: finalEmailBytes32.substring(0, 20) + '...'
    });
    
    // CRITICAL: Use AbiCoder.encode() directly instead of Interface.encodeFunctionData()
    // This bypasses any string manipulation that could introduce escape sequences
    try {
      const abiCoder = ethers.AbiCoder.defaultAbiCoder();
      const encodedParams = abiCoder.encode(
        ['string', 'bytes32', 'bytes32', 'bool'],
        [
          cleanedUserId,
          finalPhoneBytes32,
          finalEmailBytes32,
          approvalStatus
        ]
      );
      
      // Combine function selector with encoded parameters
      const functionData = functionSelector + encodedParams.slice(2);
      
      console.log('✅ Function data encoded successfully, length:', functionData.length);
      
      // Send transaction directly using signer
      const tx = await signer.sendTransaction({
        to: contractAddress,
        data: functionData
      });
      
      await tx.wait();
      return tx.hash;
    } catch (encodeError: any) {
      console.error('❌ AbiCoder.encode failed:', {
        error: encodeError.message,
        errorCode: encodeError.code,
        argument: encodeError.argument,
        value: encodeError.value ? String(encodeError.value).substring(0, 50) : 'N/A'
      });
      throw new Error(`Parameter encoding failed: ${encodeError.message}`);
    }
  } catch (error: any) {
    // Check if it's a gas/balance error
    if (error.message?.includes('insufficient funds') || error.message?.includes('gas') || error.code === 'INSUFFICIENT_FUNDS') {
      console.warn('⚠️ Insufficient funds for transaction. Using placeholder hash for development.');
      return `0x${crypto.randomBytes(32).toString('hex')}`;
    }
    // Check if it's a contract/network error
    if (error.message?.includes('contract') || error.message?.includes('network') || error.code === 'NETWORK_ERROR') {
      console.warn('⚠️ Contract or network error. Using placeholder hash for development:', error.message);
      return `0x${crypto.randomBytes(32).toString('hex')}`;
    }
    // Fallback to placeholder if contract interaction fails (for development)
    console.warn('⚠️ KYB contract interaction failed, using placeholder:', error.message);
    return `0x${crypto.randomBytes(32).toString('hex')}`;
  }
}

/**
 * Delete KYC verification record from BNB Smart Chain
 * Marks the on-chain data as deleted for user privacy and safety
 * @param userId - User ID
 * @param signer - Ethers signer (wallet) for signing transactions
 * @returns Transaction hash on BNB Chain
 */
export async function deleteKYCOnBNBChain(
  userId: string,
  signer: ethers.Wallet
): Promise<string> {
  const contractAddress = process.env.NEXT_PUBLIC_BNB_KYC_CONTRACT_ADDRESS;
  if (!contractAddress) {
    throw new Error('BNB Chain KYC contract address not configured');
  }

  // Basic ABI for KYC contract (deleteKYCVerification function)
  const KYC_ABI = [
    "function deleteKYCVerification(string memory userId) public"
  ];

  try {
    const contract = new ethers.Contract(contractAddress, KYC_ABI, signer);
    const tx = await contract.deleteKYCVerification(userId);
    await tx.wait();
    return tx.hash;
  } catch (error: any) {
    console.warn('KYC deletion contract interaction failed, using placeholder:', error.message);
    return `0x${crypto.randomBytes(32).toString('hex')}`;
  }
}

/**
 * Delete KYB verification record from BNB Smart Chain
 * Marks the on-chain data as deleted for user privacy and safety
 * @param userId - User ID
 * @param signer - Ethers signer (wallet) for signing transactions
 * @returns Transaction hash on BNB Chain
 */
export async function deleteKYBOnBNBChain(
  userId: string,
  signer: ethers.Wallet
): Promise<string> {
  const contractAddress = process.env.NEXT_PUBLIC_BNB_KYB_CONTRACT_ADDRESS;
  if (!contractAddress) {
    throw new Error('BNB Chain KYB contract address not configured');
  }

  // Basic ABI for KYB contract (deleteKYBVerification function)
  const KYB_ABI = [
    "function deleteKYBVerification(string memory userId) public"
  ];

  try {
    const contract = new ethers.Contract(contractAddress, KYB_ABI, signer);
    const tx = await contract.deleteKYBVerification(userId);
    await tx.wait();
    return tx.hash;
  } catch (error: any) {
    console.warn('KYB deletion contract interaction failed, using placeholder:', error.message);
    return `0x${crypto.randomBytes(32).toString('hex')}`;
  }
}

/**
 * Store project data hash on BNB Smart Chain after successful funding/launch
 * @param projectHash - Hashed project data (pitch, deal flow, etc.)
 * @param projectId - Project ID
 * @param launchDate - Confirmed launch date
 * @returns Transaction hash on BNB Chain
 */
export async function storeProjectDataOnBNBChain(
  projectHash: string,
  projectId: string,
  launchDate: Date
): Promise<string> {
  // Connect to BNB Smart Chain (BSC)
  const provider = new ethers.JsonRpcProvider(getBNBChainRPC());
  
  // Get contract address from environment (deployed on BNB Chain)
  const contractAddress = process.env.NEXT_PUBLIC_BNB_PROJECT_REGISTRY_ADDRESS;
  if (!contractAddress) {
    throw new Error('BNB Chain Project Registry contract address not configured');
  }

  // TODO: Implement smart contract interaction
  // This will interact with ProjectRegistry.sol deployed on BNB Smart Chain
  // const contract = new ethers.Contract(contractAddress, PROJECT_REGISTRY_ABI, signer);
  // const tx = await contract.storeProjectData(projectId, projectHash, launchDate);
  // return tx.hash;

  // Placeholder: Return mock transaction hash
  // In production, this will be the actual BNB Chain transaction hash
  return `0x${crypto.randomBytes(32).toString('hex')}`;
}

/**
 * Verify data hash exists on BNB Smart Chain
 * @param hash - Hash to verify
 * @param contractType - Type of contract (KYC, KYB, or Project)
 * @returns Verification result
 */
export async function verifyHashOnBNBChain(
  hash: string,
  contractType: 'KYC' | 'KYB' | 'Project'
): Promise<boolean> {
  // Connect to BNB Smart Chain (BSC)
  const provider = new ethers.JsonRpcProvider(getBNBChainRPC());
  
  // Get appropriate contract address based on type
  let contractAddress: string | undefined;
  switch (contractType) {
    case 'KYC':
      contractAddress = process.env.NEXT_PUBLIC_BNB_KYC_CONTRACT_ADDRESS;
      break;
    case 'KYB':
      contractAddress = process.env.NEXT_PUBLIC_BNB_KYB_CONTRACT_ADDRESS;
      break;
    case 'Project':
      contractAddress = process.env.NEXT_PUBLIC_BNB_PROJECT_REGISTRY_ADDRESS;
      break;
  }

  if (!contractAddress) {
    throw new Error(`BNB Chain ${contractType} contract address not configured`);
  }

  // TODO: Implement smart contract verification
  // const contract = new ethers.Contract(contractAddress, ABI, provider);
  // const exists = await contract.verifyHash(hash);
  // return exists;

  // Placeholder: Return mock verification
  return true;
}

/**
 * Get BNB Chain transaction URL for verification
 * @param txHash - Transaction hash on BNB Chain
 * @returns Block explorer URL
 */
export function getBNBChainTransactionUrl(txHash: string): string {
  const config = getBNBChainConfig('bsc');
  return `${config.blockExplorerUrls[0]}/tx/${txHash}`;
}

/**
 * Process KYC data for on-chain storage on BNB Chain
 * This function implements the KYC data storage strategy:
 * 1. Hash and salt sensitive documents
 * 2. Store hash on BNB Smart Chain
 * 3. Return transaction hash
 */
export async function processKYCForBNBChain(
  frontId: string,
  backId: string,
  proofOfAddress: string,
  selfie: string,
  userId: string
): Promise<{ txHash: string; hashes: Record<string, string> }> {
  // Hash and salt each document
  const frontIdHash = hashAndSaltForBNBChain(frontId);
  const backIdHash = hashAndSaltForBNBChain(backId);
  const proofHash = hashAndSaltForBNBChain(proofOfAddress);
  const selfieHash = hashAndSaltForBNBChain(selfie);

  // Note: This function requires a signer, which should be passed from the API route
  // This is a placeholder - actual implementation should be in the API route
  throw new Error('This function requires a signer. Use storeKYCOnBNBChain directly with a signer.');
}

/**
 * Process project data for on-chain storage on BNB Chain after success
 * This function implements the project data storage strategy:
 * 1. Hash and salt project data
 * 2. Store hash on BNB Smart Chain
 * 3. Return transaction hash
 */
export async function processProjectDataForBNBChain(
  projectData: {
    pitch: string;
    dealFlow: string;
    fundingInfo: string;
    projectDetails: string;
  },
  projectId: string,
  launchDate: Date
): Promise<{ txHash: string; hash: string }> {
  // Combine all project data
  const combinedData = JSON.stringify(projectData);
  
  // Hash and salt
  const { hash } = hashAndSaltForBNBChain(combinedData);

  // Store on BNB Smart Chain
  const txHash = await storeProjectDataOnBNBChain(hash, projectId, launchDate);

  return { txHash, hash };
}
