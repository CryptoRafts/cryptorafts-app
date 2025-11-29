import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/server/firebaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const auth = getAdminAuth();
    const db = getAdminDb();
    
    if (!auth || !db) {
      return NextResponse.json({ error: "Service temporarily unavailable" }, { status: 503 });
    }
    
    // Get user by email
    let user;
    try {
      user = await auth.getUserByEmail(email);
    } catch (error) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Set admin claims
    const customClaims = {
      role: "admin",
      admin: { super: true },
      profileCompleted: true,
      kycStatus: "approved",
      kybStatus: "approved"
    };

    await auth.setCustomUserClaims(user.uid, customClaims);

    // Update user document in Firestore
    await db.doc(`users/${user.uid}`).set({
      role: "admin",
      status: "active",
      profileCompleted: true,
      admin: { super: true },
      kycStatus: "approved",
      kybStatus: "approved",
      email: email,
      updatedAt: Date.now()
    }, { merge: true });

    return NextResponse.json({ 
      success: true, 
      message: "Admin permissions set successfully",
      userId: user.uid,
      email: email,
      claims: customClaims
    });

  } catch (error: any) {
    console.error("Error fixing admin permissions:", error);
    return NextResponse.json({ 
      error: "Failed to set admin permissions", 
      details: error.message 
    }, { status: 500 });
  }
}
