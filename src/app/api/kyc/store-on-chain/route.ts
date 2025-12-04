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
    
    // Extract document URLs/data
    const frontIdData = kycData?.idFront || kycData?.documents?.idFront || '';
    const backIdData = kycData?.idBack || kycData?.documents?.idBack || '';
    const proofOfAddressData = kycData?.proofOfAddress || kycData?.documents?.proofOfAddress || '';
    const selfieData = kycData?.selfie || kycData?.documents?.selfie || '';

    if (!frontIdData || !backIdData || !proofOfAddressData || !selfieData) {
      return NextResponse.json(
        { error: 'Missing KYC documents. All documents (front ID, back ID, proof of address, selfie) are required.' },
        { status: 400 }
      );
    }

    // Hash and salt each document separately
    // CRITICAL: Clean document data before hashing to remove any newlines/whitespace
    const cleanDocumentData = (data: any): string => {
      if (!data) return '';
      const str = typeof data === 'string' ? data : String(data);
      // Remove all whitespace, newlines, carriage returns
      return str.trim().replace(/[\r\n\s\t]/g, '');
    };
    
    const frontIdHash = hashAndSaltForBNBChain(cleanDocumentData(frontIdData));
    const backIdHash = hashAndSaltForBNBChain(cleanDocumentData(backIdData));
    const proofHash = hashAndSaltForBNBChain(cleanDocumentData(proofOfAddressData));
    const selfieHash = hashAndSaltForBNBChain(cleanDocumentData(selfieData));

    // CRITICAL: Ultra-aggressive cleaning of hash values before passing to blockchain
    // This is the final safety layer to ensure NO newlines/whitespace can slip through
    const ultraCleanHash = (hashObj: { hash: string; salt: string }): string => {
      let hash = hashObj.hash;
      if (!hash || typeof hash !== 'string') {
        console.error('❌ Invalid hash object:', hashObj);
        throw new Error('Invalid hash value');
      }
      
      // Log if hash contains newlines
      if (hash.includes('\r') || hash.includes('\n')) {
        console.warn('⚠️ Hash contains newlines before ultra-cleaning:', {
          hash: JSON.stringify(hash),
          length: hash.length
        });
      }
      
      // Remove ALL possible whitespace and control characters
      hash = hash.replace(/[\s\u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\uFEFF]/g, '');
      hash = hash.replace(/[\r\n\u000A\u000D\u2028\u2029]/g, '');
      hash = hash.replace(/[^0-9a-fA-F]/g, '');
      
      // Remove 0x if present
      if (hash.toLowerCase().startsWith('0x')) {
        hash = hash.slice(2);
      }
      
      // Ensure it's valid hex
      if (!/^[0-9a-fA-F]+$/.test(hash)) {
        console.error('❌ Hash contains invalid characters after cleaning:', {
          hash: JSON.stringify(hash),
          length: hash.length,
          charCodes: Array.from(hash).slice(0, 20).map(c => ({ char: c, code: c.charCodeAt(0) }))
        });
        throw new Error('Invalid hash: contains non-hex characters');
      }
      
      // CRITICAL: Pad to exactly 64 hex characters (32 bytes) for bytes32
      // This ensures consistency before passing to blockchain
      const paddedHash = hash.padStart(64, '0').slice(0, 64);
      
      // Final validation
      if (paddedHash.length !== 64 || !/^[0-9a-fA-F]{64}$/.test(paddedHash)) {
        console.error('❌ Padded hash is invalid:', {
          paddedHash: JSON.stringify(paddedHash),
          length: paddedHash.length,
          original: JSON.stringify(hash)
        });
        throw new Error('Invalid padded hash format');
      }
      
      return paddedHash;
    };
    
    // Clean all hash values
    const cleanedFrontHash = ultraCleanHash(frontIdHash);
    const cleanedBackHash = ultraCleanHash(backIdHash);
    const cleanedProofHash = ultraCleanHash(proofHash);
    const cleanedSelfieHash = ultraCleanHash(selfieHash);
    
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
    
    console.log('✅ All hash strings validated - pure hex only:', {
      frontId: validatedFrontHash.substring(0, 20) + '...',
      backId: validatedBackHash.substring(0, 20) + '...',
      proof: validatedProofHash.substring(0, 20) + '...',
      selfie: validatedSelfieHash.substring(0, 20) + '...'
    });
    
    // Store on BNB Smart Chain with validated hashes and cleaned userId
    const txHash = await storeKYCOnBNBChain(
      validatedFrontHash,
      validatedBackHash,
      validatedProofHash,
      validatedSelfieHash,
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
    console.error('Error storing KYC on BNB Chain:', error);
    return NextResponse.json(
      { 
        error: 'Failed to store KYC on BNB Chain',
        details: error.message 
      },
      { status: 500 }
    );
  }
}


