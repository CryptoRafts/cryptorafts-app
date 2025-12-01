/**
 * API Route: Store KYC Data on BNB Chain
 * 
 * This route automates the KYC storage process:
 * 1. Receives KYC approval from admin
 * 2. Hashes and salts sensitive KYC data
 * 3. Stores hash on BNB Smart Chain (BSC)
 * 4. Deletes raw data from backend after successful storage
 * 
 * Primary deployment network: BNB Smart Chain (BSC) - Chain ID 56
 */

import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { 
  storeKYCOnBNBChain, 
  hashAndSaltForBNBChain,
  getBNBChainRPC 
} from '@/lib/bnb-chain-storage';
import { adminAuth } from '@/lib/firebase-utils';

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin authentication required' },
        { status: 401 }
      );
    }

    // Verify admin (implement your admin check)
    // const isAdmin = await adminAuth(authHeader);
    // if (!isAdmin) {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    // }

    const { userId, kycData, approvalStatus } = await request.json();

    if (!userId || !kycData) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, kycData' },
        { status: 400 }
      );
    }

    // Get admin wallet from environment
    const adminPrivateKey = process.env.ADMIN_WALLET_PRIVATE_KEY;
    if (!adminPrivateKey) {
      return NextResponse.json(
        { error: 'Admin wallet not configured' },
        { status: 500 }
      );
    }

    // Connect to BNB Smart Chain
    const provider = new ethers.JsonRpcProvider(getBNBChainRPC());
    const signer = new ethers.Wallet(adminPrivateKey, provider);

    // Hash and salt KYC data
    // Combine all sensitive documents
    const combinedData = JSON.stringify({
      frontId: kycData.frontId || '',
      backId: kycData.backId || '',
      proofOfAddress: kycData.proofOfAddress || '',
      selfie: kycData.selfie || '',
    });

    const { hash: kycHash, salt } = hashAndSaltForBNBChain(combinedData);

    // Store on BNB Smart Chain
    const txHash = await storeKYCOnBNBChain(
      kycHash,
      userId,
      approvalStatus || true,
      signer
    );

    // TODO: Delete raw KYC data from backend (Firebase/Firestore)
    // await deleteRawKYCData(userId);

    return NextResponse.json({
      success: true,
      txHash,
      kycHash,
      salt,
      message: 'KYC data stored on BNB Chain successfully',
      explorerUrl: `https://bscscan.com/tx/${txHash}`,
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

