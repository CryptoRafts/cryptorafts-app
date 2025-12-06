/**
 * API Route: Delete KYC Data from BNB Chain
 * 
 * This route deletes (marks as deleted) KYC data on-chain after admin approval:
 * 1. Receives deletion request from admin
 * 2. Calls smart contract to mark data as deleted
 * 3. Updates Firebase with deletion transaction hash
 * 
 * This ensures user privacy and safety by removing sensitive data from active use.
 * 
 * Primary deployment network: BNB Smart Chain (BSC) - Chain ID 56
 * Testnet: BSC Testnet - Chain ID 97
 */

import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { 
  deleteKYCOnBNBChain,
  getBNBChainRPC 
} from '@/lib/bnb-chain-storage';
import { initAdmin, getAdminDb } from '@/server/firebaseAdmin';
import { getAuth } from 'firebase-admin/auth';
import { checkRateLimit } from '@/lib/security/rate-limiter';
import { validateRequiredFields } from '@/lib/security/input-validator';
import { logSecurityEvent } from '@/lib/security-isolation';

export async function POST(request: NextRequest) {
  try {
    // Security: Rate limiting
    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(`kyc_delete_${clientIp}`)) {
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
      await initAdmin();
      const adminAuth = getAuth();
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (error: any) {
      return NextResponse.json(
        { error: 'Unauthorized. Invalid token.' },
        { status: 401 }
      );
    }

    // Security: Admin only
    const userRole = (decodedToken as any).role;
    if (userRole !== 'admin') {
      await logSecurityEvent(decodedToken.uid, 'unauthorized_kyc_deletion_attempt', {
        userId: decodedToken.uid,
        role: userRole
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
        { error: validation.error },
        { status: 400 }
      );
    }

    const { userId } = body;

    // Get admin wallet from environment
    const adminPrivateKey = process.env.ADMIN_WALLET_PRIVATE_KEY;
    if (!adminPrivateKey) {
      return NextResponse.json(
        { error: 'Admin wallet not configured. Set ADMIN_WALLET_PRIVATE_KEY in environment.' },
        { status: 500 }
      );
    }

    // Connect to BNB Smart Chain
    const provider = new ethers.JsonRpcProvider(getBNBChainRPC());
    const signer = new ethers.Wallet(adminPrivateKey, provider);

    // Delete on-chain (mark as deleted)
    const txHash = await deleteKYCOnBNBChain(userId, signer);

    // Update Firebase with deletion info
    try {
      const db = await getAdminDb();
      const kycDocRef = db.collection('kyc_documents').doc(userId);
      await kycDocRef.update({
        onChainDeleted: true,
        onChainDeleteTxHash: txHash,
        onChainDeletedAt: new Date(),
        onChainDeletedBy: decodedToken.uid,
      });

      // Log security event
      await logSecurityEvent(decodedToken.uid, 'kyc_onchain_deleted', {
        userId,
        txHash,
        deletedBy: decodedToken.uid
      });
    } catch (firebaseError: any) {
      console.error('⚠️ Error updating Firebase (non-critical):', firebaseError);
      // Don't fail the request if Firebase update fails - deletion is already on-chain
    }

    // Determine explorer URL based on network
    const chainId = (await provider.getNetwork()).chainId;
    const explorerBase = chainId === 97n 
      ? 'https://testnet.bscscan.com'
      : 'https://bscscan.com';

    return NextResponse.json({
      success: true,
      txHash,
      message: 'KYC data deleted from BNB Chain successfully. Data marked as deleted for user privacy.',
      explorerUrl: `${explorerBase}/tx/${txHash}`,
    });
  } catch (error: any) {
    console.error('Error deleting KYC from BNB Chain:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete KYC on BNB Chain',
        details: error.message 
      },
      { status: 500 }
    );
  }
}


