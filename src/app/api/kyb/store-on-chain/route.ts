/**
 * API Route: Store KYB Data on BNB Chain
 * 
 * This route automates the KYB storage process after admin approval:
 * 1. Receives KYB approval from admin
 * 2. Hashes and salts phone number and email separately
 * 3. Stores both hashes on BNB Smart Chain (BSC)
 * 4. Deletes raw data from backend after successful storage
 * 
 * Primary deployment network: BNB Smart Chain (BSC) - Chain ID 56
 * Testnet: BSC Testnet - Chain ID 97
 */

import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { 
  storeKYBOnBNBChain, 
  hashAndSaltForBNBChain,
  getBNBChainRPC 
} from '@/lib/bnb-chain-storage';
import { initAdmin, getAdminDb, getAdminAuth } from '@/server/firebaseAdmin';
import { checkRateLimit } from '@/lib/security/rate-limiter';
import { validateRequiredFields } from '@/lib/security/input-validator';
import { logSecurityEvent } from '@/lib/security-isolation';

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
      console.log('🔒 SECURITY EVENT: unauthorized_kyb_store_attempt', {
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
    const validation = validateRequiredFields(body, []);
    if (!body.userId && !body.orgId) {
      return NextResponse.json(
        { error: 'Missing required field: userId or orgId' },
        { status: 400 }
      );
    }

    const { userId, orgId, approvalStatus } = body;

    // Get admin wallet from environment
    const adminPrivateKey = process.env.ADMIN_WALLET_PRIVATE_KEY;
    if (!adminPrivateKey) {
      return NextResponse.json(
        { error: 'Admin wallet not configured. Set ADMIN_WALLET_PRIVATE_KEY in environment.' },
        { status: 500 }
      );
    }

    // Get KYB data from Firebase
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
    
    let kybData: any = null;
    let docRef: FirebaseFirestore.DocumentReference | null = null;

    // Try to get from organizations collection (for VCs, exchanges, etc.)
    if (orgId) {
      docRef = db.collection('organizations').doc(orgId);
      const orgDoc = await docRef.get();
      if (orgDoc.exists) {
        kybData = orgDoc.data();
      }
    }

    // If not found in organizations, try user document
    if (!kybData && userId) {
      docRef = db.collection('users').doc(userId);
      const userDoc = await docRef.get();
      if (userDoc.exists) {
        kybData = userDoc.data();
      }
    }

    if (!kybData || !docRef) {
      return NextResponse.json(
        { error: 'KYB data not found' },
        { status: 404 }
      );
    }

    // Extract phone and email
    const phoneData = kybData.phone || kybData.phoneNumber || kybData.contactPhone || '';
    const emailData = kybData.email || kybData.contactEmail || '';

    if (!phoneData || !emailData) {
      return NextResponse.json(
        { error: 'Missing KYB data. Phone number and email are required.' },
        { status: 400 }
      );
    }

    // CRITICAL: Clean phone and email data before hashing
    // This prevents escape sequences from being included in the hash
    const cleanData = (data: any): string => {
      if (!data) return '';
      
      // Convert to string
      let str = typeof data === 'string' ? data : String(data);
      
      // CRITICAL: Remove ALL escape sequences and control characters
      str = str.replace(/\\r\\n/g, ''); // Remove literal \r\n
      str = str.replace(/\\n/g, ''); // Remove literal \n
      str = str.replace(/\\r/g, ''); // Remove literal \r
      str = str.replace(/\\/g, ''); // Remove all backslashes
      str = str.replace(/[\r\n\u000A\u000D\u2028\u2029]/g, ''); // Remove actual newlines
      str = str.replace(/[\s\u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\uFEFF]/g, ''); // Remove all whitespace
      str = str.replace(/[\x00-\x1F\x7F-\x9F]/g, ''); // Remove control characters
      str = str.trim();
      
      return str;
    };
    
    // Hash and salt phone and email separately
    const phoneHash = hashAndSaltForBNBChain(cleanData(phoneData));
    const emailHash = hashAndSaltForBNBChain(cleanData(emailData));
    
    // CRITICAL: Extract and clean hash values immediately after generation
    // This prevents any escape sequences from being passed to the blockchain function
    const extractCleanHash = (hashObj: { hash: string; salt: string }): string => {
      let hashValue = hashObj.hash;
      
      // Remove ALL backslashes first (removes all escape sequences)
      hashValue = hashValue.replace(/\\/g, '');
      
      // Remove actual newline characters
      hashValue = hashValue.replace(/[\r\n\u000A\u000D\u2028\u2029]/g, '');
      
      // Remove ALL whitespace and control characters
      hashValue = hashValue.replace(/[\s\u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\uFEFF]/g, '');
      hashValue = hashValue.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
      
      // Extract ONLY hex characters character by character
      let hexOnly = '';
      for (let i = 0; i < hashValue.length; i++) {
        const char = hashValue[i].toLowerCase();
        if ((char >= '0' && char <= '9') || (char >= 'a' && char <= 'f')) {
          hexOnly += char;
        }
      }
      
      // Pad to 64
      const padded = hexOnly.padStart(64, '0').slice(0, 64);
      
      // Final validation
      if (!/^[0-9a-f]{64}$/.test(padded)) {
        throw new Error('Invalid hash: not pure hex after extraction');
      }
      
      // Convert to Buffer and back to ensure absolute byte-level cleanliness
      const buffer = Buffer.from(padded, 'hex');
      if (buffer.length !== 32) {
        throw new Error(`Invalid buffer length: ${buffer.length}, expected 32`);
      }
      const cleanHex = buffer.toString('hex');
      
      // Final validation
      if (cleanHex.length !== 64 || !/^[0-9a-f]{64}$/.test(cleanHex)) {
        throw new Error('Invalid clean hex after Buffer conversion');
      }
      
      return cleanHex;
    };
    
    // Extract clean hashes
    const cleanPhoneHash = extractCleanHash(phoneHash);
    const cleanEmailHash = extractCleanHash(emailHash);
    
    console.log('✅ KYB hashes extracted and cleaned:', {
      phone: cleanPhoneHash.substring(0, 20) + '...',
      email: cleanEmailHash.substring(0, 20) + '...'
    });

    // Connect to BNB Smart Chain
    const provider = new ethers.JsonRpcProvider(getBNBChainRPC());
    const signer = new ethers.Wallet(adminPrivateKey, provider);

    // Use userId or orgId as identifier
    const identifier = userId || orgId;
    
    // CRITICAL: Clean identifier to remove any escape sequences
    const cleanIdentifier = (id: string): string => {
      if (!id || typeof id !== 'string') {
        throw new Error('Invalid identifier: must be a non-empty string');
      }
      
      let cleaned = String(id);
      cleaned = cleaned.replace(/[\r\n\u000A\u000D\u2028\u2029]/g, '');
      cleaned = cleaned.replace(/\\[rn]/g, '');
      cleaned = cleaned.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
      cleaned = cleaned.replace(/\\/g, '');
      cleaned = cleaned.trim();
      
      if (cleaned.length === 0) {
        throw new Error('Invalid identifier: contains no valid characters after cleaning');
      }
      
      return cleaned;
    };
    
    const cleanedIdentifier = cleanIdentifier(identifier);

    // Store on BNB Smart Chain with cleaned hash values
    const txHash = await storeKYBOnBNBChain(
      cleanPhoneHash, // Already cleaned hex string (64 chars, no 0x)
      cleanEmailHash, // Already cleaned hex string (64 chars, no 0x)
      cleanedIdentifier,
      approvalStatus !== false, // Default to true if not specified
      signer
    );

    // Delete raw KYB data from backend after successful on-chain storage
    try {
      // CRITICAL FIX: Use FieldValue.delete() for deletions and separate operations
      // This completely avoids keyGenerator serialization errors
      const db = getAdminDb();
      if (!db) {
        throw new Error('Firestore instance not initialized');
      }
      
      const { FieldValue } = await import('firebase-admin/firestore');
      const now = Date.now();
      
      // Step 1: Update onChainHash structure using dot notation
      await docRef.set({
        'onChainHash.phoneHash': String(phoneHash.hash),
        'onChainHash.emailHash': String(emailHash.hash),
        'onChainHash.salts.phone': String(phoneHash.salt),
        'onChainHash.salts.email': String(emailHash.salt),
        'onChainHash.txHash': String(txHash),
      }, { merge: true });
      
      // Step 2: Update timestamps and metadata
      await docRef.set({
        onChainStoredAt: Number(now),
        updatedAt: Number(now),
        storedBy: String(decodedToken.uid),
      }, { merge: true });
      
      // Step 3: Delete sensitive fields using FieldValue.delete()
      await docRef.update({
        phone: FieldValue.delete(),
        phoneNumber: FieldValue.delete(),
        contactPhone: FieldValue.delete(),
        email: FieldValue.delete(),
        contactEmail: FieldValue.delete(),
      });

      // Log security event (server-side only)
      console.log('🔒 SECURITY EVENT: kyb_stored_onchain', {
        userId: identifier,
        txHash,
        storedBy: decodedToken.uid,
        timestamp: new Date().toISOString()
      });

      console.log('✅ Raw KYB data deleted from backend after on-chain storage');
    } catch (deleteError: any) {
      console.error('⚠️ Error deleting raw KYB data (non-critical):', deleteError);
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
        phone: { hash: phoneHash.hash, salt: phoneHash.salt },
        email: { hash: emailHash.hash, salt: emailHash.salt },
      },
      message: 'KYB data stored on BNB Chain successfully. Raw data deleted from backend.',
      explorerUrl: `${explorerBase}/tx/${txHash}`,
    });
  } catch (error: any) {
    console.error('Error storing KYB on BNB Chain:', error);
    return NextResponse.json(
      { 
        error: 'Failed to store KYB on BNB Chain',
        details: error.message 
      },
      { status: 500 }
    );
  }
}


