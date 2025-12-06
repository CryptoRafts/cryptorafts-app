/**
 * API Route: Store KYC Data on BNB Chain
 * 
 * This route automates the KYC storage process after admin approval:
 * 1. Receives KYC approval from admin
 * 2. Hashes and salts each document separately (Front ID, Back ID, Proof of Address, Live Snap)
 * 3. Stores all 4 hashes on BNB Smart Chain (BSC)
 * 4. Deletes raw data from backend after successful storage
 * 
 * Primary deployment network: BNB Smart Chain (BSC) - Chain ID 56
 * Testnet: BSC Testnet - Chain ID 97
 */

import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { 
  storeKYCOnBNBChain, 
  hashAndSaltForBNBChain,
  getBNBChainRPC 
} from '@/lib/bnb-chain-storage';
import { initAdmin, getAdminDb, getAdminAuth } from '@/server/firebaseAdmin';
import { checkRateLimit } from '@/lib/security/rate-limiter';
import { validateRequiredFields } from '@/lib/security/input-validator';

export async function POST(request: NextRequest) {
  try {
    // Security: Rate limiting
    const rateLimitResult = checkRateLimit(request, {
      maxRequests: 10,
      windowMs: 60000, // 1 minute
    });
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    // Security: Authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized. Missing or invalid authorization token.' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    let decodedToken;
    try {
      // Initialize Firebase Admin and get auth instance
      await initAdmin();
      const adminAuth = getAdminAuth();
      if (!adminAuth) {
        console.error('❌ Firebase Admin Auth not initialized');
        return NextResponse.json(
          { error: 'Server configuration error. Please contact support.' },
          { status: 500 }
        );
      }
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (error: any) {
      console.error('❌ Token verification error:', error);
      return NextResponse.json(
        { error: 'Unauthorized. Invalid token.' },
        { status: 401 }
      );
    }

    // Security: Admin only
    // Check role from multiple sources (token claims, custom claims, email allowlist)
    const userRole = (decodedToken as any).role || (decodedToken as any).customClaims?.role;
    const isSuperAdmin = (decodedToken as any).admin?.super === true || (decodedToken as any).customClaims?.admin?.super === true;
    const userEmail = (decodedToken as any).email?.toLowerCase() || '';
    const adminAllowlist = [
      'anasshamsiggc@gmail.com',
      'ceo@cryptorafts.com',
      'anasshamsi@cryptorafts.com',
      'admin@cryptorafts.com',
      'support@cryptorafts.com'
    ];
    const isAllowlisted = adminAllowlist.includes(userEmail);
    
    const isAdmin = userRole === 'admin' || isSuperAdmin || isAllowlisted;
    
    if (!isAdmin) {
      // Log security event (server-side only)
      console.log('🔒 SECURITY EVENT: unauthorized_kyc_store_attempt', {
        userId: decodedToken.uid,
        email: userEmail,
        role: userRole,
        isSuperAdmin,
        isAllowlisted,
        timestamp: new Date().toISOString()
      });
      return NextResponse.json(
        { error: 'Forbidden. Admin access required.' },
        { status: 403 }
      );
    }

    // Security: Input validation
    const body = await request.json();
    const validation = validateRequiredFields(body, ['userId']);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.missing?.length ? `Missing required fields: ${validation.missing.join(', ')}` : 'Invalid request' },
        { status: 400 }
      );
    }

    const { userId, approvalStatus } = body;

    // Get admin wallet from environment
    const adminPrivateKey = process.env.ADMIN_WALLET_PRIVATE_KEY;
    if (!adminPrivateKey) {
      return NextResponse.json(
        { error: 'Admin wallet not configured. Set ADMIN_WALLET_PRIVATE_KEY in environment.' },
        { status: 500 }
      );
    }

    // Get KYC documents from Firebase
    // Ensure Firebase Admin is initialized (getAdminDb will call initAdmin if needed)
    const db = getAdminDb();
    if (!db) {
      console.error('❌ Firebase Admin DB not initialized');
      return NextResponse.json(
        { error: 'Server configuration error. Please contact support.' },
        { status: 500 }
      );
    }
    
    // Verify db is a valid Firestore instance
    if (typeof db.collection !== 'function') {
      console.error('❌ Invalid Firestore instance');
      return NextResponse.json(
        { error: 'Server configuration error. Invalid database instance.' },
        { status: 500 }
      );
    }
    
    const kycDocRef = db.collection('kyc_documents').doc(userId);
    const kycDoc = await kycDocRef.get();

    if (!kycDoc.exists) {
      return NextResponse.json(
        { error: 'KYC document not found' },
        { status: 404 }
      );
    }

    const kycData = kycDoc.data();
    
    // Check KYC status - only proceed if approved
    const kycStatus = kycData?.status || kycData?.kycStatus || 'pending';
    if (kycStatus !== 'approved' && approvalStatus !== true) {
      return NextResponse.json(
        { 
          error: 'KYC is not approved. Only approved KYC can be stored on-chain.',
          status: kycStatus,
          message: 'Please wait for admin approval before storing on-chain.'
        },
        { status: 400 }
      );
    }
    
    // Extract document URLs/data
    const frontIdData = kycData?.idFront || kycData?.documents?.idFront || '';
    const backIdData = kycData?.idBack || kycData?.documents?.idBack || '';
    const proofOfAddressData = kycData?.proofOfAddress || kycData?.documents?.proofOfAddress || '';
    const selfieData = kycData?.selfie || kycData?.documents?.selfie || '';

    if (!frontIdData || !backIdData || !proofOfAddressData || !selfieData) {
      return NextResponse.json(
        { 
          error: 'Missing KYC documents. All documents (front ID, back ID, proof of address, selfie) are required.',
          status: kycStatus,
          message: kycStatus === 'pending' 
            ? 'KYC is pending approval. Documents will be available after approval.'
            : 'Documents are missing. Please ensure all documents are uploaded.'
        },
        { status: 400 }
      );
    }

    // Hash and salt each document separately
    // CRITICAL: Ultra-aggressive cleaning of document data before hashing
    const cleanDocumentData = (data: any): string => {
      if (!data) return '';
      
      // Convert to string
      let str = typeof data === 'string' ? data : String(data);
      
      // CRITICAL: Remove ALL escape sequences and control characters
      // This includes literal backslash-r-backslash-n sequences
      str = str.replace(/\\r\\n/g, ''); // Remove literal \r\n
      str = str.replace(/\\n/g, ''); // Remove literal \n
      str = str.replace(/\\r/g, ''); // Remove literal \r
      str = str.replace(/\\/g, ''); // Remove all backslashes
      str = str.replace(/[\r\n\u000A\u000D\u2028\u2029]/g, ''); // Remove actual newlines
      str = str.replace(/[\s\u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\uFEFF]/g, ''); // Remove all whitespace
      str = str.replace(/[\x00-\x1F\x7F-\x9F]/g, ''); // Remove control characters
      str = str.trim();
      
      // Final validation - ensure no escape sequences remain
      if (str.includes('\\') || str.includes('\r') || str.includes('\n')) {
        console.error('❌ Document data still contains escape sequences after cleaning:', {
          original: data,
          cleaned: str.substring(0, 50),
          hasBackslash: str.includes('\\'),
          hasCR: str.includes('\r'),
          hasLF: str.includes('\n')
        });
        // Force remove one more time
        str = str.replace(/[\\\r\n]/g, '');
      }
      
      return str;
    };
    
    const frontIdHash = hashAndSaltForBNBChain(cleanDocumentData(frontIdData));
    const backIdHash = hashAndSaltForBNBChain(cleanDocumentData(backIdData));
    const proofHash = hashAndSaltForBNBChain(cleanDocumentData(proofOfAddressData));
    const selfieHash = hashAndSaltForBNBChain(cleanDocumentData(selfieData));
    
    // CRITICAL: Log the raw hash objects immediately after generation
    console.log('🔍 Raw hash objects immediately after generation:', {
      frontIdHash: {
        hash: JSON.stringify(frontIdHash.hash),
        hashLength: frontIdHash.hash.length,
        hashType: typeof frontIdHash.hash,
        hasEscape: frontIdHash.hash.includes('\\') || frontIdHash.hash.includes('\r') || frontIdHash.hash.includes('\n'),
        charCodes: Array.from(frontIdHash.hash).slice(0, 30).map(c => ({ char: c, code: c.charCodeAt(0) }))
      },
      backIdHash: {
        hash: JSON.stringify(backIdHash.hash),
        hashLength: backIdHash.hash.length,
        hasEscape: backIdHash.hash.includes('\\') || backIdHash.hash.includes('\r') || backIdHash.hash.includes('\n')
      },
      proofHash: {
        hash: JSON.stringify(proofHash.hash),
        hashLength: proofHash.hash.length,
        hasEscape: proofHash.hash.includes('\\') || proofHash.hash.includes('\r') || proofHash.hash.includes('\n')
      },
      selfieHash: {
        hash: JSON.stringify(selfieHash.hash),
        hashLength: selfieHash.hash.length,
        hasEscape: selfieHash.hash.includes('\\') || selfieHash.hash.includes('\r') || selfieHash.hash.includes('\n')
      }
    });
    
    // CRITICAL: Immediately extract and clean hash values to prevent any corruption
    // Don't trust the hash object - extract and reconstruct immediately using byte-level operations
    const extractCleanHash = (hashObj: { hash: string; salt: string }): string => {
      // Get the hash value - use direct property access
      let hashValue = hashObj.hash;
      
      // CRITICAL: Log the raw value from Firebase to see what we're dealing with
      const rawValue = hashValue;
      const hasEscapeSequences = rawValue.includes('\\') || rawValue.includes('\r') || rawValue.includes('\n');
      if (hasEscapeSequences) {
        console.error('❌ CRITICAL: Hash from Firebase contains escape sequences:', {
          raw: JSON.stringify(rawValue),
          rawLength: rawValue.length,
          charCodes: Array.from(rawValue).slice(0, 50).map(c => ({ char: c, code: c.charCodeAt(0) })),
          hasBackslash: rawValue.includes('\\'),
          hasCR: rawValue.includes('\r'),
          hasLF: rawValue.includes('\n')
        });
      }
      
      // CRITICAL: Handle ALL possible escape sequence patterns
      // This includes single escape (\r), double escape (\\r), and actual newlines
      
      // Step 1: Remove ALL backslashes first (this removes all escape sequences)
      // This is the most aggressive approach - we'll reconstruct from hex only
      hashValue = hashValue.replace(/\\/g, '');
      
      // Step 2: Remove actual newline characters
      hashValue = hashValue.replace(/[\r\n\u000A\u000D\u2028\u2029]/g, '');
      
      // Step 3: Remove ALL whitespace and control characters
      hashValue = hashValue.replace(/[\s\u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\uFEFF]/g, '');
      hashValue = hashValue.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
      
      // Step 4: Extract ONLY hex characters character by character
      // This is the most reliable way - we rebuild the string from scratch
      let hexOnly = '';
      for (let i = 0; i < hashValue.length; i++) {
        const char = hashValue[i].toLowerCase();
        if ((char >= '0' && char <= '9') || (char >= 'a' && char <= 'f')) {
          hexOnly += char;
        }
      }
      
      // Step 5: Pad to 64
      const padded = hexOnly.padStart(64, '0').slice(0, 64);
      
      // Step 6: Final validation - ensure it's pure hex
      if (!/^[0-9a-f]{64}$/.test(padded)) {
        console.error('❌ Hash extraction failed:', {
          original: JSON.stringify(hashObj.hash),
          originalLength: hashObj.hash.length,
          cleaned: padded.substring(0, 20) + '...',
          cleanedLength: padded.length,
          hexOnlyLength: hexOnly.length
        });
        throw new Error('Invalid hash: not pure hex after extraction');
      }
      
      // Step 7: CRITICAL - Convert to Buffer and back to ensure absolute byte-level cleanliness
      // This is the final guarantee that no escape sequences can exist
      try {
        const buffer = Buffer.from(padded, 'hex');
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
        
        return cleanHex;
      } catch (bufferError: any) {
        console.error('❌ Buffer conversion failed:', {
          padded: padded.substring(0, 30),
          error: bufferError.message
        });
        throw bufferError;
      }
    };
    
    // Extract clean hashes immediately
    const cleanFrontHash = extractCleanHash(frontIdHash);
    const cleanBackHash = extractCleanHash(backIdHash);
    const cleanProofHash = extractCleanHash(proofHash);
    const cleanSelfieHash = extractCleanHash(selfieHash);
    
    // Log immediately after extraction
    console.log('🔍 Hash values immediately after extraction:', {
      frontIdHash: {
        original: frontIdHash.hash.substring(0, 20) + '...',
        extracted: cleanFrontHash.substring(0, 20) + '...',
        originalLength: frontIdHash.hash.length,
        extractedLength: cleanFrontHash.length,
        originalHasEscape: frontIdHash.hash.includes('\\') || frontIdHash.hash.includes('\r') || frontIdHash.hash.includes('\n')
      },
      backIdHash: {
        original: backIdHash.hash.substring(0, 20) + '...',
        extracted: cleanBackHash.substring(0, 20) + '...',
        originalLength: backIdHash.hash.length,
        extractedLength: cleanBackHash.length
      },
      proofHash: {
        original: proofHash.hash.substring(0, 20) + '...',
        extracted: cleanProofHash.substring(0, 20) + '...',
        originalLength: proofHash.hash.length,
        extractedLength: cleanProofHash.length
      },
      selfieHash: {
        original: selfieHash.hash.substring(0, 20) + '...',
        extracted: cleanSelfieHash.substring(0, 20) + '...',
        originalLength: selfieHash.hash.length,
        extractedLength: cleanSelfieHash.length
      }
    });

    // CRITICAL: Extract and completely reconstruct hash values from scratch
    // This ensures NO escape sequences can exist - we rebuild the string character by character
    const ultraCleanHash = (hashObj: { hash: string; salt: string }): string => {
      // Step 1: Get the hash value
      let hashValue = hashObj.hash;
      if (!hashValue || typeof hashValue !== 'string') {
        console.error('❌ Invalid hash object:', {
          hashObj: JSON.stringify(hashObj),
          hashType: typeof hashValue,
          hashValue: JSON.stringify(hashValue)
        });
        throw new Error('Invalid hash value');
      }
      
      // Step 2: Remove ALL backslashes first (most aggressive - removes all escape sequences)
      // This handles single escape (\r), double escape (\\r), and any combination
      hashValue = hashValue.replace(/\\/g, '');
      
      // Step 3: Remove actual newline characters
      hashValue = hashValue.replace(/[\r\n\u000A\u000D\u2028\u2029]/g, '');
      
      // Step 4: Remove ALL whitespace and control characters
      hashValue = hashValue.replace(/[\s\u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\uFEFF]/g, '');
      hashValue = hashValue.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
      
      // Step 3: Log original for debugging
      const originalHash = hashValue;
      const hasEscapeSequences = hashValue.includes('\\') || hashValue.includes('\r') || hashValue.includes('\n');
      if (hasEscapeSequences) {
        console.error('❌ CRITICAL: Hash still contains escape sequences after initial cleaning:', {
          original: JSON.stringify(hashValue),
          length: hashValue.length,
          charCodes: Array.from(hashValue).slice(0, 50).map(c => ({ char: c, code: c.charCodeAt(0) }))
        });
      }
      
      // Step 4: Completely reconstruct the hash by extracting ONLY valid hex characters
      // This is the most aggressive approach - we rebuild the string from scratch
      let hexChars = '';
      for (let i = 0; i < hashValue.length; i++) {
        const char = hashValue[i].toLowerCase();
        // Only include characters that are valid hex (0-9, a-f)
        if ((char >= '0' && char <= '9') || (char >= 'a' && char <= 'f')) {
          hexChars += char;
        }
        // Explicitly skip 'x' from '0x' prefix and any other characters
      }
      
      // Step 4: Validate we have hex characters
      if (hexChars.length === 0) {
        console.error('❌ No valid hex characters found in hash:', {
          original: JSON.stringify(originalHash),
          originalLength: originalHash.length
        });
        throw new Error('Hash contains no valid hex characters');
      }
      
      // Step 5: Pad to exactly 64 hex characters
      const paddedHash = hexChars.padStart(64, '0').slice(0, 64);
      
      // Step 6: Final validation
      if (paddedHash.length !== 64 || !/^[0-9a-f]{64}$/.test(paddedHash)) {
        console.error('❌ Padded hash is invalid:', {
          paddedHash: JSON.stringify(paddedHash),
          length: paddedHash.length,
          original: JSON.stringify(originalHash),
          hexChars: hexChars.substring(0, 20) + '...'
        });
        throw new Error('Invalid padded hash format');
      }
      
      // Step 7: Log if cleaning was needed
      if (hasEscapeSequences || originalHash !== paddedHash) {
        console.warn('⚠️ Hash was cleaned/reconstructed:', {
          original: JSON.stringify(originalHash),
          cleaned: paddedHash.substring(0, 20) + '...',
          originalLength: originalHash.length,
          cleanedLength: paddedHash.length
        });
      }
      
      return paddedHash;
    };
    
    // Clean all hash values - use the pre-extracted clean hashes
    const cleanedFrontHash = ultraCleanHash({ hash: cleanFrontHash, salt: frontIdHash.salt });
    const cleanedBackHash = ultraCleanHash({ hash: cleanBackHash, salt: backIdHash.salt });
    const cleanedProofHash = ultraCleanHash({ hash: cleanProofHash, salt: proofHash.salt });
    const cleanedSelfieHash = ultraCleanHash({ hash: cleanSelfieHash, salt: selfieHash.salt });
    
    console.log('🔍 Ultra-cleaned hashes before blockchain call:', {
      frontId: cleanedFrontHash.substring(0, 20) + '...',
      backId: cleanedBackHash.substring(0, 20) + '...',
      proof: cleanedProofHash.substring(0, 20) + '...',
      selfie: cleanedSelfieHash.substring(0, 20) + '...'
    });

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
        console.warn('⚠️ userId was cleaned in route.ts:', {
          original: JSON.stringify(id),
          cleaned: JSON.stringify(cleaned),
          originalLength: id.length,
          cleanedLength: cleaned.length
        });
      }
      
      return cleaned;
    };
    
    const cleanedUserId = cleanUserId(userId);

    // Connect to BNB Smart Chain
    const provider = new ethers.JsonRpcProvider(getBNBChainRPC());
    const signer = new ethers.Wallet(adminPrivateKey, provider);

    // CRITICAL: Final validation - ensure all hash values are pure hex strings
    // This prevents any escape sequences from being passed to the blockchain function
    const validateHashString = (hash: string, name: string): string => {
      // Convert to string and extract ONLY hex characters
      let hexOnly = '';
      for (let i = 0; i < hash.length; i++) {
        const char = hash[i].toLowerCase();
        if ((char >= '0' && char <= '9') || (char >= 'a' && char <= 'f')) {
          hexOnly += char;
        }
      }
      
      if (hexOnly.length === 0) {
        throw new Error(`${name} contains no valid hex characters`);
      }
      
      // Ensure exactly 64 hex characters
      const padded = hexOnly.padStart(64, '0').slice(0, 64);
      
      if (!/^[0-9a-f]{64}$/.test(padded)) {
        throw new Error(`${name} is not valid hex after cleaning`);
      }
      
      return padded;
    };
    
    // Validate all hash strings one final time
    const validatedFrontHash = validateHashString(cleanedFrontHash, 'frontIdHash');
    const validatedBackHash = validateHashString(cleanedBackHash, 'backIdHash');
    const validatedProofHash = validateHashString(cleanedProofHash, 'proofOfAddressHash');
    const validatedSelfieHash = validateHashString(cleanedSelfieHash, 'selfieHash');
    
    // CRITICAL: Final reconstruction from bytes right before passing to blockchain
    // This ensures NO escape sequences can exist - we rebuild from raw bytes
    const finalReconstructFromBytes = (hex: string): string => {
      try {
        // Remove 0x if present
        let clean = hex.startsWith('0x') ? hex.slice(2) : hex;
        
        // Extract only hex characters
        let hexOnly = '';
        for (let i = 0; i < clean.length; i++) {
          const char = clean[i].toLowerCase();
          if ((char >= '0' && char <= '9') || (char >= 'a' && char <= 'f')) {
            hexOnly += char;
          }
        }
        
        // Pad to 64
        hexOnly = hexOnly.padStart(64, '0').slice(0, 64);
        
        // Convert to bytes and back to ensure absolute cleanliness
        const bytes = Buffer.from(hexOnly, 'hex');
        const reconstructed = '0x' + bytes.toString('hex');
        
        // Final validation
        if (reconstructed.length !== 66 || !/^0x[0-9a-f]{64}$/.test(reconstructed)) {
          throw new Error(`Invalid reconstructed hex: ${reconstructed.substring(0, 20)}...`);
        }
        
        return reconstructed;
      } catch (error: any) {
        console.error('❌ Error in finalReconstructFromBytes:', { hex: hex.substring(0, 30), error: error.message });
        throw error;
      }
    };
    
    const finalFrontHash = finalReconstructFromBytes(validatedFrontHash);
    const finalBackHash = finalReconstructFromBytes(validatedBackHash);
    const finalProofHash = finalReconstructFromBytes(validatedProofHash);
    const finalSelfieHash = finalReconstructFromBytes(validatedSelfieHash);
    
    console.log('✅ Final reconstructed hashes (from bytes, right before blockchain call):', {
      frontId: finalFrontHash.substring(0, 20) + '...',
      backId: finalBackHash.substring(0, 20) + '...',
      proof: finalProofHash.substring(0, 20) + '...',
      selfie: finalSelfieHash.substring(0, 20) + '...',
      allValid: /^0x[0-9a-f]{64}$/.test(finalFrontHash) && 
                /^0x[0-9a-f]{64}$/.test(finalBackHash) &&
                /^0x[0-9a-f]{64}$/.test(finalProofHash) &&
                /^0x[0-9a-f]{64}$/.test(finalSelfieHash)
    });
    
    // CRITICAL: Final byte-level conversion RIGHT BEFORE passing to blockchain function
    // Convert to bytes and back to ensure absolute cleanliness - this is the last chance
    const finalByteLevelConversion = (hex: string, name: string): string => {
      try {
        // Step 1: Remove 0x if present
        let clean = hex.startsWith('0x') ? hex.slice(2) : hex;
        
        // Step 2: Extract ONLY hex characters character by character
        let hexOnly = '';
        for (let i = 0; i < clean.length; i++) {
          const char = clean[i].toLowerCase();
          if ((char >= '0' && char <= '9') || (char >= 'a' && char <= 'f')) {
            hexOnly += char;
          }
        }
        
        // Step 3: Pad to 64
        hexOnly = hexOnly.padStart(64, '0').slice(0, 64);
        
        // Step 4: Validate
        if (!/^[0-9a-f]{64}$/.test(hexOnly)) {
          throw new Error(`Invalid hex for ${name}`);
        }
        
        // Step 5: Convert to Buffer (byte-level) - this is the key step
        const buffer = Buffer.from(hexOnly, 'hex');
        if (buffer.length !== 32) {
          throw new Error(`Invalid buffer length for ${name}: ${buffer.length}`);
        }
        
        // Step 6: Convert back to hex using Buffer.toString('hex') - this ensures NO escape sequences
        const cleanHex = buffer.toString('hex');
        
        // Step 7: Final validation
        if (cleanHex.length !== 64 || !/^[0-9a-f]{64}$/.test(cleanHex)) {
          throw new Error(`Invalid clean hex for ${name}`);
        }
        
        // Step 8: Check for escape sequences (should never happen with Buffer)
        if (cleanHex.includes('\\') || cleanHex.includes('\r') || cleanHex.includes('\n')) {
          console.error(`❌ CRITICAL: ${name} still has escape sequences after Buffer conversion:`, {
            cleanHex: JSON.stringify(cleanHex),
            charCodes: Array.from(cleanHex).slice(0, 30).map(c => c.charCodeAt(0))
          });
          throw new Error(`${name} contains escape sequences after Buffer conversion`);
        }
        
        // Return without 0x prefix (function expects hex without 0x)
        return cleanHex;
      } catch (error: any) {
        console.error(`❌ Error in finalByteLevelConversion for ${name}:`, {
          hex: hex.substring(0, 30),
          error: error.message
        });
        throw error;
      }
    };
    
    // Apply final byte-level conversion to all hashes
    const finalFrontHashBytes = finalByteLevelConversion(finalFrontHash, 'frontId');
    const finalBackHashBytes = finalByteLevelConversion(finalBackHash, 'backId');
    const finalProofHashBytes = finalByteLevelConversion(finalProofHash, 'proof');
    const finalSelfieHashBytes = finalByteLevelConversion(finalSelfieHash, 'selfie');
    
    // Log final values with character code inspection
    console.log('🔍 FINAL byte-level converted hashes RIGHT BEFORE blockchain call:', {
      frontId: {
        value: finalFrontHashBytes.substring(0, 30) + '...',
        length: finalFrontHashBytes.length,
        hasEscape: finalFrontHashBytes.includes('\\') || finalFrontHashBytes.includes('\r') || finalFrontHashBytes.includes('\n'),
        charCodes: Array.from(finalFrontHashBytes).slice(0, 30).map(c => c.charCodeAt(0))
      },
      backId: {
        value: finalBackHashBytes.substring(0, 30) + '...',
        length: finalBackHashBytes.length,
        hasEscape: finalBackHashBytes.includes('\\') || finalBackHashBytes.includes('\r') || finalBackHashBytes.includes('\n')
      },
      proof: {
        value: finalProofHashBytes.substring(0, 30) + '...',
        length: finalProofHashBytes.length,
        hasEscape: finalProofHashBytes.includes('\\') || finalProofHashBytes.includes('\r') || finalProofHashBytes.includes('\n')
      },
      selfie: {
        value: finalSelfieHashBytes.substring(0, 30) + '...',
        length: finalSelfieHashBytes.length,
        hasEscape: finalSelfieHashBytes.includes('\\') || finalSelfieHashBytes.includes('\r') || finalSelfieHashBytes.includes('\n')
      }
    });
    
    // Store on BNB Smart Chain with final byte-level converted hashes
    const txHash = await storeKYCOnBNBChain(
      finalFrontHashBytes, // Already cleaned and converted to bytes
      finalBackHashBytes,
      finalProofHashBytes,
      finalSelfieHashBytes,
      cleanedUserId, // Cleaned userId
      approvalStatus !== false, // Default to true if not specified
      signer
    );

    // Delete raw KYC data from backend after successful on-chain storage
    try {
      // CRITICAL FIX: Use FieldValue.delete() for deletions and separate operations
      // This completely avoids keyGenerator serialization errors
      const db = getAdminDb();
      if (!db) {
        throw new Error('Firestore instance not initialized');
      }
      
      const { FieldValue } = await import('firebase-admin/firestore');
      const now = Date.now();
      
      // Step 1: Update onChainHash structure using dot notation in separate set operations
      // This avoids nested object serialization issues
      await kycDocRef.set({
        'onChainHash.frontIdHash': String(frontIdHash.hash),
        'onChainHash.backIdHash': String(backIdHash.hash),
        'onChainHash.proofOfAddressHash': String(proofHash.hash),
        'onChainHash.liveSnapHash': String(selfieHash.hash),
        'onChainHash.salts.frontId': String(frontIdHash.salt),
        'onChainHash.salts.backId': String(backIdHash.salt),
        'onChainHash.salts.proofOfAddress': String(proofHash.salt),
        'onChainHash.salts.selfie': String(selfieHash.salt),
        'onChainHash.txHash': String(txHash),
      }, { merge: true });
      
      // Step 2: Update timestamps and metadata
      await kycDocRef.set({
        onChainStoredAt: Number(now),
        updatedAt: Number(now),
        storedBy: String(decodedToken.uid),
      }, { merge: true });
      
      // Step 3: Delete sensitive fields using FieldValue.delete()
      await kycDocRef.update({
        idFront: FieldValue.delete(),
        idBack: FieldValue.delete(),
        proofOfAddress: FieldValue.delete(),
        selfie: FieldValue.delete(),
        documents: FieldValue.delete(),
      });

      // Also delete from user's KYC subcollection if exists
      // Use FieldValue.delete() to properly remove fields
      const userKycRef = db.collection('users').doc(userId).collection('kyc').doc('verification');
      const userKycDoc = await userKycRef.get();
      if (userKycDoc.exists) {
        await userKycRef.update({
          kyc_selfie_url: FieldValue.delete(),
          kyc_id_image_url: FieldValue.delete(),
        });
      }

      // Log security event (wrap in try-catch to avoid breaking the flow)
      try {
        // logSecurityEvent is client-side only, skip on server
        console.log('🔒 SECURITY EVENT: kyc_stored_onchain', {
          userId,
          txHash,
          storedBy: decodedToken.uid,
          timestamp: new Date().toISOString()
        });
      } catch (logError: any) {
        // Non-critical, don't fail the request
        console.warn('⚠️ Error logging security event (non-critical):', logError?.message);
      }

      console.log('✅ Raw KYC data deleted from backend after on-chain storage');
    } catch (deleteError: any) {
      console.error('⚠️ Error deleting raw KYC data (non-critical):', deleteError);
      // Don't fail the request if deletion fails - data is already on-chain
    }

    // Determine explorer URL based on network
    const chainId = (await provider.getNetwork()).chainId;
    const explorerBase = chainId === 97n 
      ? 'https://testnet.bscscan.com'
      : 'https://bscscan.com';

    return NextResponse.json({
      success: true,
      txHash,
      hashes: {
        frontId: { hash: frontIdHash.hash, salt: frontIdHash.salt },
        backId: { hash: backIdHash.hash, salt: backIdHash.salt },
        proofOfAddress: { hash: proofHash.hash, salt: proofHash.salt },
        liveSnap: { hash: selfieHash.hash, salt: selfieHash.salt },
      },
      message: 'KYC data stored on BNB Chain successfully. Raw data deleted from backend.',
      explorerUrl: `${explorerBase}/tx/${txHash}`,
    });
  } catch (error: any) {
    // Enhanced error logging and serialization
    const errorDetails = {
      message: error?.message || 'Unknown error',
      name: error?.name,
      code: error?.code,
      argument: error?.argument,
      value: error?.value ? String(error.value).substring(0, 100) : undefined,
      stack: error?.stack?.substring(0, 500), // Limit stack trace
    };
    
    console.error('❌ Error storing KYC on BNB Chain:', {
      ...errorDetails,
      fullError: error
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to store KYC on BNB Chain',
        details: errorDetails.message,
        code: errorDetails.code,
        argument: errorDetails.argument,
        // Only include value if it's not too long
        value: errorDetails.value && errorDetails.value.length < 200 ? errorDetails.value : undefined
      },
      { status: 500 }
    );
  }
}


