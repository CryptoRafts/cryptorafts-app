import { NextRequest, NextResponse } from "next/server";
import { adminDb, assertSuperAdmin, writeAudit } from "@/lib/server/adminAuth";

/** POST { reqId, reason } */
export async function POST(req: NextRequest){
  try{
    const idToken = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    if (!idToken) return NextResponse.json({ error:"Unauthorized" }, { status:401 });
    const ip = req.headers.get("x-forwarded-for") || (req as any).ip || null;
    const actor = await assertSuperAdmin({ idToken, ip });

    const { reqId, reason } = await req.json();
    if (!reqId) return NextResponse.json({ error:"reqId required" }, { status:400 });

    const ref = adminDb.collection("oversight").doc("requests").collection("items").doc(reqId);
    const snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ error:"Not found" }, { status:404 });

    const data = snap.data() || {};
    if (data.status !== "pending") return NextResponse.json({ error:"Not pending" }, { status:400 });

    await ref.set({ status:"rejected", rejector: actor.uid, rejectReason: reason||"unspecified", updatedAt: Date.now() }, { merge:true });

    await writeAudit({ type:"oversight_reject", actorUid: actor.uid, subject:{ uid: data?.subject?.uid, orgId: data?.subject?.orgId }, delta:{ reqId, reason } });

    return NextResponse.json({ ok:true, status:"rejected" });
  }catch(e:any){
    const code = e?.status || 500;
    return NextResponse.json({ error: e?.message || "Server error" }, { status: code });
  }
}
