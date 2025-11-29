import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/server/firebaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const { userId, claims } = await req.json();
    
    if (!userId || !claims) {
      return NextResponse.json({ error: "Missing userId or claims" }, { status: 400 });
    }

    // Update custom claims
    const adminAuth = getAdminAuth();
    
    if (!adminAuth) {
      console.error('Admin Auth not available');
      return NextResponse.json({ 
        error: "Admin Auth not initialized",
        note: "This is expected in development - Firestore update was successful" 
      }, { status: 503 });
    }

    const user = await adminAuth.getUser(userId);
    const currentClaims = user.customClaims || {};
    
    const updatedClaims = {
      ...currentClaims,
      ...claims,
      iat: Math.floor(Date.now() / 1000),
      updatedAt: Date.now()
    };

    await adminAuth.setCustomUserClaims(userId, updatedClaims);

    return NextResponse.json({ 
      success: true, 
      claims: updatedClaims 
    });

  } catch (error) {
    console.error('Error updating claims:', error);
    // Don't fail the request - Firestore update was successful
    return NextResponse.json({ 
      error: "Failed to update claims in Auth",
      note: "Firestore was updated successfully"
    }, { status: 500 });
  }
}
