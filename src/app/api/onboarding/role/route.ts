import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/server/firebaseAdmin";

export async function POST(req: NextRequest){
  try{
    const { role } = await req.json();
    const uid = req.headers.get("x-user-id")||"";
    if (!uid || !role) return NextResponse.json({ error:"bad_request" }, { status:400 });

    const allowed = new Set(["founder","vc","exchange","ido","influencer","agency","admin"]);
    if (!allowed.has(role)) return NextResponse.json({ error:"invalid_role" }, { status:400 });

    // For development/testing, if Firebase is not properly configured, return success with cookies
    try {
      const db = getAdminDb();
      if (!db) {
        return NextResponse.json({ error: "Database not available" }, { status: 503 });
      }
      const ref = db.doc(`users/${uid}`);
      const snap = await ref.get();
      const data = snap.exists ? snap.data() : {};
      const locked = data?.profileCompleted === true;

      if (locked) {
        // Locked after profile: do not change
        return NextResponse.json({ ok:true, locked:true, role: data?.role || null });
      }

      await ref.set({
        role,
        onboardingStep: "profile",
        onboarding: { step: "profile", completed: { role: Date.now() } },
        profileCompleted: false,
        updatedAt: new Date()
      }, { merge:true });

      const auth = getAdminAuth();
      if (!auth) {
        return NextResponse.json({ error: "Auth not available" }, { status: 503 });
      }
      const user = await auth.getUser(uid);
      const prev = user.customClaims || {};
      await auth.setCustomUserClaims(uid, { 
        ...prev, 
        role, 
        profileCompleted: false, 
        onboardingStep: "profile",
        iat: Math.floor(Date.now()/1000) 
      });
    } catch (firebaseError) {
      console.warn("Firebase operation failed, continuing with cookies only:", firebaseError);
      // Continue with just setting cookies for development
    }

    // Set the role cookie for middleware
    const response = NextResponse.json({ ok:true, role, firebase: "skipped" });
    response.cookies.set("cr_role", role, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });
    
    // Set admin cookie if role is admin
    if (role === "admin") {
      response.cookies.set("cr_admin", "true", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7 // 7 days
      });
    }

    return response;
  }catch(e:any){
    console.error("Role API error:", e);
    return NextResponse.json({ error: e?.message || "server_error" }, { status:500 });
  }
}
