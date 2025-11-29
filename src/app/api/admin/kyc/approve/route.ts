import { NextRequest, NextResponse } from "next/server";
import { admin } from "@/lib/server/adminAuth";

async function assertSuperAdmin(req: NextRequest){
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if(!token) throw new Error("Missing bearer token");
  const decoded = await admin.auth().verifyIdToken(token);
  if (!decoded || !(decoded.admin?.super===true || decoded.admin_super===true)) {
    throw new Error("Not admin");
  }
  return decoded;
}

export async function POST(req: NextRequest) {
  try{
    await assertSuperAdmin(req);
    const { uid, status, reason } = await req.json();

    if (!uid || !["verified","rejected"].includes(status)) {
      return NextResponse.json({ error:"bad_request" }, { status: 400 });
    }

    const db = admin.firestore();
    await db.collection("users").doc(uid).set({
      kyc: {
        status,
        reasons: status==="rejected" && reason ? [reason] : [],
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }
    }, { merge:true });

    // Optional: update custom claims
    await admin.auth().setCustomUserClaims(uid, {
      ...(await admin.auth().getUser(uid).then(u => u.customClaims || {})),
      kycStatus: status
    });

    await db.collection("audit").add({
      type: "kyc_update_admin",
      actorUid: null,
      subject: { uid },
      delta: { status, reason: reason||null },
      ts: admin.firestore.FieldValue.serverTimestamp(),
      immutable: true
    });

    return NextResponse.json({ ok:true });
  }catch(e:any){
    return NextResponse.json({ error: e?.message||"error" }, { status: 401 });
  }
}
