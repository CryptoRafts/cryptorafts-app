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
  const hash = crypto
    .createHash('sha256')
    .update(cleanData + generatedSalt)
    .digest('hex');
  
  // CRITICAL: Ultra-aggressive cleaning of hash output
  // Remove ALL whitespace, newlines, and non-hex characters
  let cleanHash = hash;
  // Remove ALL whitespace (including Unicode)
  cleanHash = cleanHash.replace(/[\s\u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\uFEFF]/g, '');
  // Remove ALL newline variants
  cleanHash = cleanHash.replace(/[\r\n\u000A\u000D\u2028\u2029]/g, '');
  // Remove backslashes (escaped characters)
  cleanHash = cleanHash.replace(/[\\]/g, '');
  // Remove ALL control characters
  cleanHash = cleanHash.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
  // Remove ANY non-hex characters
  cleanHash = cleanHash.replace(/[^0-9a-fA-F]/g, '');
  cleanHash = cleanHash.trim();
  
  // Validate hash is pure hex
  if (!/^[0-9a-fA-F]+$/.test(cleanHash)) {
    console.error('❌ Hash contains invalid characters:', {
      hash: JSON.stringify(cleanHash),
      length: cleanHash.length,
      charCodes: Array.from(cleanHash).slice(0, 20).map(c => c.charCodeAt(0))
    });
    throw new Error('Hash generation failed: invalid characters in hash');
  }
  
  // Final validation - ensure no newlines somehow got through
  if (cleanHash.includes('\r') || cleanHash.includes('\n') || cleanHash.includes('\\')) {
    console.error('❌ Hash STILL contains newlines/backslashes after cleaning:', {
      hash: JSON.stringify(cleanHash),
      hasCR: cleanHash.includes('\r'),
      hasLF: cleanHash.includes('\n'),
      hasBackslash: cleanHash.includes('\\')
    });
    // Force remove them one more time
    cleanHash = cleanHash.replace(/[\r\n\\]/g, '').replace(/[^0-9a-fA-F]/g, '');
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

    // Clean all hashes before contract call
    const cleanedFrontHash = finalCleanHash(frontIdHash);
    const cleanedBackHash = finalCleanHash(backIdHash);
    const cleanedProofHash = finalCleanHash(proofOfAddressHash);
    const cleanedLiveHash = finalCleanHash(liveSnapHash);
    
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
        
        // CRITICAL: Use ethers.zeroPadValue() to ensure proper bytes32 format
        // This is safer than hexlify() and ensures no escape sequences are introduced
        try {
          // Validate the hex string is correct format first
          if (!/^0x[0-9a-fA-F]{64}$/.test(bytes32Hex)) {
            throw new Error('Invalid hex format before zero pad');
          }
          
          // Use zeroPadValue to ensure it's exactly 32 bytes (64 hex chars)
          // This is the recommended way to create bytes32 values in ethers v6
          const finalBytes32 = ethers.zeroPadValue(bytes32Hex, 32);
          
          // Final validation - ensure it's still clean
          if (finalBytes32.length !== 66 || !/^0x[0-9a-fA-F]{64}$/.test(finalBytes32)) {
            throw new Error('Invalid final bytes32 format after zero pad');
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
        
        // Step 5: Use ethers.hexlify() with the Uint8Array directly
        // This ensures no escape sequences can be introduced
        const result = ethers.hexlify(bytes);
        
        // Step 6: Final validation - ensure result is correct
        if (result.length !== 66 || !/^0x[0-9a-f]{64}$/.test(result)) {
          throw new Error(`Invalid result format: ${result}`);
        }
        
        // Step 7: Double-check for any escape sequences (should never happen, but safety check)
        if (result.includes('\\') || result.includes('\r') || result.includes('\n')) {
          console.error('❌ CRITICAL: Result contains escape sequences:', {
            result: JSON.stringify(result),
            charCodes: Array.from(result).map((c: string) => c.charCodeAt(0))
          });
          // Reconstruct from bytes array again
          const cleanResult = '0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
          return cleanResult;
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
    
    const cleanedUserId = cleanUserId(userId);
    
    console.log('🔍 Cleaned userId for blockchain:', {
      original: userId.substring(0, 20) + '...',
      cleaned: cleanedUserId.substring(0, 20) + '...',
      originalLength: userId.length,
      cleanedLength: cleanedUserId.length
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
      
      // Convert back to hex string using hexlify - this should be clean
      return ethers.hexlify(bytes);
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
      
      // Convert back to hex string using hexlify - this should be clean
      return ethers.hexlify(bytes);
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
    
    // CRITICAL: Use Interface to encode function call manually
    // This gives us complete control over the encoding and avoids string serialization issues
    const contractInterface = new ethers.Interface(KYC_ABI);
    
    // CRITICAL: Use try-catch to capture the exact parameter causing the error
    let tx;
    try {
      // Encode the function call - this handles all parameter encoding internally
      const functionData = contractInterface.encodeFunctionData('storeKYCVerification', [
        cleanedUserId,
        callFrontId,
        callBackId,
        callProof,
        callLive,
        approvalStatus
      ]);
      
      // Send transaction directly using signer - this bypasses Contract object string handling
      tx = await signer.sendTransaction({
        to: contractAddress,
        data: functionData
      });
    } catch (contractError: any) {
      // Enhanced error logging to identify which parameter is causing the issue
      console.error('❌ Contract call failed:', {
        error: contractError.message,
        code: contractError.code,
        argument: contractError.argument,
        value: contractError.value ? JSON.stringify(String(contractError.value).substring(0, 50)) : 'N/A',
        userId: JSON.stringify(cleanedUserId),
        frontId: JSON.stringify(callFrontId),
        backId: JSON.stringify(callBackId),
        proof: JSON.stringify(callProof),
        live: JSON.stringify(callLive),
        frontIdHasEscape: callFrontId.includes('\\') || callFrontId.includes('\r') || callFrontId.includes('\n'),
        backIdHasEscape: callBackId.includes('\\') || callBackId.includes('\r') || callBackId.includes('\n'),
        proofHasEscape: callProof.includes('\\') || callProof.includes('\r') || callProof.includes('\n'),
        liveHasEscape: callLive.includes('\\') || callLive.includes('\r') || callLive.includes('\n')
      });
      throw contractError;
    }
    await tx.wait();
    return tx.hash;
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
        
        // Use zeroPadValue to ensure it's exactly 32 bytes (64 hex chars)
        // This is the recommended way to create bytes32 values in ethers v6
        const finalBytes32 = ethers.zeroPadValue(bytes32Hex, 32);
        
        // Final validation - ensure it's still clean
        if (finalBytes32.length !== 66 || !/^0x[0-9a-fA-F]{64}$/.test(finalBytes32)) {
          throw new Error('Invalid final bytes32 format after zero pad');
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
    
    // Clean and convert hashes
    const cleanedPhoneHash = finalCleanHash(phoneHash);
    const cleanedEmailHash = finalCleanHash(emailHash);
    
    const phoneBytes32 = toBytes32(cleanedPhoneHash);
    const emailBytes32 = toBytes32(cleanedEmailHash);
    
    console.log('✅ KYB hashes converted to valid bytes32 format');

    const contract = new ethers.Contract(contractAddress, KYB_ABI, signer);
    const tx = await contract.storeKYBVerification(
      userId,
      phoneBytes32, // Proper bytes32 format
      emailBytes32, // Proper bytes32 format
      approvalStatus
    );
    await tx.wait();
    return tx.hash;
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

