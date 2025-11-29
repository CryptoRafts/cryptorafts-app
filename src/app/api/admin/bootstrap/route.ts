import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/server/firebaseAdmin";

/**
 * POST /api/admin/bootstrap
 * Body: { idToken: string }
 * - Verifies Firebase ID token
 * - If email matches allowed admin email, sets custom claim admin.super:true
 * - Returns { ok:true }
 */
const ADMIN_EMAIL = "anasshamsiggc@gmail.com";

export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json();
    if (!idToken) return NextResponse.json({ error:"missing_token" }, { status: 400 });
    const adminAuth = getAdminAuth();
    if (!adminAuth) return NextResponse.json({ error:"auth_not_available" }, { status: 500 });
    const decoded = await adminAuth.verifyIdToken(idToken, true);
    const email = decoded.email || "";
    if (email.toLowerCase() !== ADMIN_EMAIL) {
      return NextResponse.json({ error:"forbidden" }, { status: 403 });
    }
    // set claim
    const prev = (await adminAuth.getUser(decoded.uid)).customClaims || {};
    await adminAuth.setCustomUserClaims(decoded.uid, { ...prev, admin: { ...(prev.admin||{}), super: true } });

    return NextResponse.json({ ok:true, email });
  } catch (e:any) {
    return NextResponse.json({ error:e?.message||"error" }, { status: 500 });
  }
}
