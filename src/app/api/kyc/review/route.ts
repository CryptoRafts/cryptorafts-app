export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import { adminDb as db } from '@/lib/firebase.admin';
// Note: firebase-admin uses different API - using collection().doc() instead

export async function POST(request: NextRequest) {
  try {
    const { vendorRef, userId, status } = await request.json();

  if (!vendorRef || !userId || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Simulate RaftAI decision
    const decision = {
      status: status === 'completed' ? 'approved' : 'pending',
      riskScore: Math.floor(Math.random() * 100),
      reasons: status === 'completed' ? [] : ['Identity verification pending'],
      updatedAt: new Date()
    };

    // Update user KYC status (firebase-admin API)
    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }
    const userRef = db.collection('users').doc(userId);
    await userRef.update({
      kyc: {
        status: decision.status,
        riskScore: decision.riskScore,
        reasons: decision.reasons,
        vendorRef,
        updatedAt: new Date()
      },
      updatedAt: new Date()
    });

    // Update user claims if approved
    if (decision.status === 'approved') {
      console.log(`KYC approved for user ${userId}`);
    }

    return NextResponse.json({ success: true, decision });
  } catch (error) {
    console.error('Error processing KYC review:', error);
    return NextResponse.json({ error: 'Failed to process KYC review' }, { status: 500 });
  }
}
