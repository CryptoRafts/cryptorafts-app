import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/server/firebaseAdmin";
import { requireUser } from "@/app/api/_utils";

export async function POST(req: NextRequest) {
  try {
    const uid = await requireUser(req);
    if (!uid) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { userId, vendorRef, livenessScore, faceMatchScore, documents } = body;

    if (userId !== uid) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    // Call RaftAI service for KYC verification
    const raftaiResponse = await fetch(`${process.env.RAFTAI_SERVICE_URL}/kyc/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RAFTAI_SERVICE_TOKEN}`,
        'X-Idempotency-Key': `kyc-${uid}-${Date.now()}`
      },
      body: JSON.stringify({
        userId,
        vendorRef,
        livenessScore,
        faceMatchScore,
        documents
      })
    });

    if (!raftaiResponse.ok) {
      throw new Error('RaftAI service unavailable');
    }

    const decision = await raftaiResponse.json();

    // Update user document with KYC status    
    const db = getAdminDb();
    if (!db) return NextResponse.json({ error: "Database not available" }, { status: 503 });
    await db.doc(`users/${uid}`).set({
      kyc: {
        status: decision.status,
        riskScore: decision.riskScore,
        reasons: decision.reasons,
        vendorRef,
        updatedAt: Date.now()
      },
      onboarding: {
        step: decision.status === 'approved' ? 'kyb_decision' : 'kyc',
        updatedAt: Date.now()
      },
      updatedAt: Date.now()
    }, { merge: true });

    // Update custom claims
    const auth = getAdminAuth();
    if (!auth) return NextResponse.json({ error: "Auth not available" }, { status: 503 });
    const user = await auth.getUser(uid);
    const prevClaims = user.customClaims || {};
    
    await auth.setCustomUserClaims(uid, {
      ...prevClaims,
      kycStatus: decision.status,
      kyc_verified: decision.status === 'approved'
    });

    return NextResponse.json(decision);

  } catch (error) {
    console.error('KYC verification error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
