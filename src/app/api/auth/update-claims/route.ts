import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/server/firebaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const { uid, claims } = await req.json();
    
    if (!uid || !claims) {
      return NextResponse.json({ error: "Missing uid or claims" }, { status: 400 });
    }

    // Update custom claims
    const adminAuth = getAdminAuth();
    if (!adminAuth) {
      return NextResponse.json({ error: "Service temporarily unavailable" }, { status: 503 });
    }
    await adminAuth.setCustomUserClaims(uid, claims);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating custom claims:", error);
    return NextResponse.json({ error: "Failed to update claims" }, { status: 500 });
  }
}
