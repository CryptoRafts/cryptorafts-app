import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/app/api/_utils";
import { getAdminDb } from "@/server/firebaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const uid = await requireUser(req);
    if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const { vendorRef, status } = await req.json();
    
    // Simulate 5-second AI review
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // AI review logic (mock)
    const aiDecision = Math.random() > 0.2 ? "approved" : "rejected"; // 80% approval rate
    const aiReasons = aiDecision === "rejected" ? ["Document quality insufficient", "Identity verification failed"] : [];
    
    // Update user document
    const userRef = getAdminDb().doc(`users/${uid}`);
    await userRef.update({
      kyc: {
        status: aiDecision,
        vendorRef,
        reviewedAt: Date.now(),
        aiDecision,
        reasons: aiReasons
      },
      updatedAt: Date.now()
    });

    return NextResponse.json({ 
      status: aiDecision, 
      reasons: aiReasons,
      reviewedAt: Date.now()
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Review failed" }, { status: 500 });
  }
}
