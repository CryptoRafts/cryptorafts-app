import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/server/firebaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing or invalid authorization header" }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const adminAuth = getAdminAuth();
    if (!adminAuth) {
      return NextResponse.json({ error: "Service temporarily unavailable" }, { status: 503 });
    }
    
    // Verify the token
    const decoded = await adminAuth.verifyIdToken(token);
    
    // Check if user has admin role in claims or Firestore
    const claims = decoded as any;
    let isAdmin = claims.role === 'admin' || 
                  (claims.admin && claims.admin.super === true) ||
                  claims.isSuperAdmin === true;
    
    // If not admin in claims, check Firestore
    if (!isAdmin) {
      try {
        const db = getAdminDb();
        if (!db) {
          return NextResponse.json({ error: "Service temporarily unavailable" }, { status: 503 });
        }
        const userDoc = await db.collection('users').doc(decoded.uid).get();
        
        if (userDoc.exists) {
          const userData = userDoc.data();
          isAdmin = userData?.role === 'admin' || 
                   userData?.isSuperAdmin === true ||
                   (userData?.admin && userData.admin.super === true);
        }
      } catch (error) {
        console.error("Error checking user role in Firestore:", error);
      }
    }
    
    if (!isAdmin) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    return NextResponse.json({ 
      success: true, 
      user: {
        uid: decoded.uid,
        email: decoded.email,
        role: claims.role,
        admin: claims.admin
      }
    });

  } catch (error: any) {
    console.error("Admin guard verification failed:", error);
    return NextResponse.json({ 
      error: "Token verification failed", 
      details: error.message 
    }, { status: 401 });
  }
}
