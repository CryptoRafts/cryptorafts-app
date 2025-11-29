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
    const { orgId, status, reason } = await req.json();

    if (!orgId || !["verified","rejected"].includes(status)) {
      return NextResponse.json({ error:"bad_request" }, { status: 400 });
    }

    const db = admin.firestore();
    await db.collection("organizations").doc(orgId).set({
      kyb: {
        status,
        reasons: status==="rejected" && reason ? [reason] : [],
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }
    }, { merge:true });

    // Optionally mark all org members' kybStatus in claims (read by client)
    const membersSnap = await db.collection("users").where("orgId","==",orgId).get();
    const batch = db.batch();
    membersSnap.docs.forEach(d=>{
      batch.set(d.ref, { kyb: { status, updatedAt: admin.firestore.FieldValue.serverTimestamp() } }, { merge:true });
    });
    await batch.commit();

    await db.collection("audit").add({
      type: "kyb_update_admin",
      actorUid: null,
      subject: { orgId },
      delta: { status, reason: reason||null },
      ts: admin.firestore.FieldValue.serverTimestamp(),
      immutable: true
    });

    return NextResponse.json({ ok:true });
  }catch(e:any){
    return NextResponse.json({ error: e?.message||"error" }, { status: 401 });
  }
}
