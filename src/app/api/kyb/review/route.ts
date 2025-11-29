export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import { adminDb as db } from '@/lib/firebase.admin';
// Note: firebase-admin uses different API

export async function POST(request: NextRequest) {
  try {
    const { vendorRef, orgId, status } = await request.json();

    if (!vendorRef || !orgId || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Simulate RaftAI decision
    const decision = {
      status: status === 'completed' ? 'approved' : 'pending',
      riskScore: Math.floor(Math.random() * 100),
      reasons: status === 'completed' ? [] : ['Document verification pending'],
      updatedAt: new Date()
    };

    // Update organization KYB status (firebase-admin API)
    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }
    const orgRef = db.collection('organizations').doc(orgId);
    await orgRef.update({
      kyb: {
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
      // This would trigger a webhook to update user claims
      // For now, we'll simulate the update
      console.log(`KYB approved for org ${orgId}`);
    }

    return NextResponse.json({ success: true, decision });
  } catch (error) {
    console.error('Error processing KYB review:', error);
    return NextResponse.json({ error: 'Failed to process KYB review' }, { status: 500 });
  }
}
