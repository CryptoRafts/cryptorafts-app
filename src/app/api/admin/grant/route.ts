import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/server/firebaseAdmin";

const ALLOWLIST = new Set([
  "anasshamsiggc@gmail.com".toLowerCase(),
  "ceo@cryptorafts.com".toLowerCase(),
  "anasshamsi@cryptorafts.com".toLowerCase(),
  "admin@cryptorafts.com".toLowerCase(),
  "support@cryptorafts.com".toLowerCase(),
  // Add more admin emails as needed
]);

export async function POST(req: NextRequest){
  try{
    const hdr = req.headers.get("authorization") || "";
    const m = hdr.match(/^Bearer\s+(.+)$/i);
    if (!m) return NextResponse.json({ error:"unauthorized" }, { status:401 });

    const adminAuth = getAdminAuth();
    if (!adminAuth) {
      return NextResponse.json({ error: "Service temporarily unavailable" }, { status: 503 });
    }
    
    const decoded = await adminAuth.verifyIdToken(m[1], true);
    const uid = decoded.uid;
    const email = (req.headers.get("x-user-email") || (decoded as any).email || "").toLowerCase();

    console.log("Admin grant attempt:", { email, uid, allowlisted: ALLOWLIST.has(email) });

    if (!email || !ALLOWLIST.has(email)) {
      return NextResponse.json({ ok:true, granted:false, reason: "not_allowlisted" });
    }

    const adminDb = getAdminDb();
    if (!adminDb) {
      return NextResponse.json({ error: "Service temporarily unavailable" }, { status: 503 });
    }

    await adminDb.doc(`users/${uid}`).set({ admin: { super: true }, role: "admin", updatedAt: Date.now() }, { merge:true });
    const prev = (decoded as any).claims || {};
    await adminAuth.setCustomUserClaims(uid, { ...prev, admin: { super:true }, role: "admin", iat: Math.floor(Date.now()/1000) });

    console.log("Admin granted successfully:", { email, uid });

    // Set the role and admin cookies for middleware
    const response = NextResponse.json({ ok:true, granted:true });
    response.cookies.set("cr_role", "admin", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });
    response.cookies.set("cr_admin", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    return response;
  } catch(e:any){
    console.error("Admin grant error:", e);
    return NextResponse.json({ error:"server_error", detail: e?.message || String(e) }, { status:500 });
  }
}
