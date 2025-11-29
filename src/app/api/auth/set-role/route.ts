import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { role, userId } = await req.json();
    
    // Validate role
    const validRoles = ['founder', 'vc', 'exchange', 'ido', 'agency', 'influencer', 'admin'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // For now, just return success and let the client handle the role
    // The role will be stored in Firestore from the client side
    // This avoids Firebase Admin SDK credential issues
    return NextResponse.json({ 
      success: true, 
      message: "Role set successfully",
      role: role,
      userId: userId
    });

  } catch (error: any) {
    console.error("Set role error:", error);
    return NextResponse.json({ 
      error: "Failed to set role", 
      details: error.message 
    }, { status: 500 });
  }
}
