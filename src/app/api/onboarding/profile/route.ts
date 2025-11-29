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
    const { profileCompleted, onboardingStep } = body;

    // Update user document
    const db = getAdminDb();
    if (!db) return NextResponse.json({ error: "Database not available" }, { status: 503 });
    await db.doc(`users/${uid}`).set({
      profileCompleted: profileCompleted || false,
      onboarding: {
        step: onboardingStep || 'kyc',
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
      profileCompleted: profileCompleted || false,
      onboardingStep: onboardingStep || 'kyc'
    });

    return NextResponse.json({ 
      success: true,
      profileCompleted,
      onboardingStep
    });

  } catch (error) {
    console.error('Profile completion error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
