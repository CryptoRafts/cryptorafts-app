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
    const { userId } = body;

    if (userId !== uid) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    // Generate vendor session token (simulated)
    const vendorRef = `kyc_${uid}_${Date.now()}`;
    const clientToken = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Update user document with KYC session info
    const db = getAdminDb();
    if (!db) return NextResponse.json({ error: "Database not available" }, { status: 503 });
    await db.doc(`users/${uid}`).set({
      kyc: {
        status: 'pending',
        vendorRef,
        clientToken,
        startedAt: Date.now()
      },
      updatedAt: Date.now()
    }, { merge: true });

    // In a real implementation, you would:
    // 1. Create a session with your KYC vendor (Jumio, Onfido, etc.)
    // 2. Get the actual vendor reference and client token
    // 3. Store the session details securely

    return NextResponse.json({
      success: true,
      vendorRef,
      clientToken,
      message: "KYC session started successfully"
    });

  } catch (error) {
    console.error("KYC start error:", error);
    return NextResponse.json(
      { error: "Failed to start KYC session" },
      { status: 500 }
    );
  }
}
