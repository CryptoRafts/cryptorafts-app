import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/server/firebaseAdmin";
import { raftai } from "@/lib/raftai";

export async function POST(req: NextRequest) {
  try {
    // Verify webhook signature (implement based on your KYC vendor)
    const signature = req.headers.get('x-webhook-signature');
    const body = await req.text();
    
    // In production, verify the webhook signature here
    // const isValid = verifyWebhookSignature(body, signature, process.env.KYC_WEBHOOK_SECRET);
    // if (!isValid) {
    //   return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    // }

    const webhookData = JSON.parse(body);
    
    // Extract KYC result from vendor payload
    const { 
      userId, 
      vendorRef, 
      status, 
      riskScore, 
      reasons, 
      cooldownUntil,
      decision 
    } = webhookData;

    if (!userId || !vendorRef) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Process with RaftAI
    const raftaiResult = await raftai.processKYC(userId, {
      vendorRef,
      status,
      riskScore,
      reasons,
      cooldownUntil,
      decision
    });

    // Update user document
    const db = getAdminDb();
    await db.doc(`users/${userId}`).set({
      kyc: {
        status: raftaiResult.status,
        riskScore: raftaiResult.riskScore,
        reasons: raftaiResult.reasons,
        vendorRef,
        cooldownUntil: raftaiResult.cooldownUntil,
        updatedAt: Date.now()
      },
      kycStatus: raftaiResult.status,
      updatedAt: Date.now()
    }, { merge: true });

    // Update custom claims
    const adminAuth = getAdminAuth();
    await adminAuth.setCustomUserClaims(userId, {
      kycStatus: raftaiResult.status,
      profileCompleted: raftaiResult.status === 'approved'
    });

    // Update onboarding step if KYC approved
    if (raftaiResult.status === 'approved') {
      await db.doc(`users/${userId}`).update({
        onboardingStep: 'kyb_decision',
        updatedAt: Date.now()
      });
    }

    // Send notification (implement notification service)
    // await sendNotification(userId, {
    //   type: 'kyc_result',
    //   status: raftaiResult.status,
    //   message: `Your KYC verification has been ${raftaiResult.status}`
    // });

    return NextResponse.json({
      success: true,
      message: "KYC webhook processed successfully"
    });

  } catch (error) {
    console.error("KYC webhook error:", error);
    return NextResponse.json(
      { error: "Failed to process KYC webhook" },
      { status: 500 }
    );
  }
}

// Helper function to verify webhook signature (implement based on your vendor)
function verifyWebhookSignature(body: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;
  
  // Implement HMAC verification based on your KYC vendor's requirements
  // This is a placeholder implementation
  return true;
}
