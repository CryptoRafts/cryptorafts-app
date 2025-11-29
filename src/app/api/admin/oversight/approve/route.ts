import { NextRequest, NextResponse } from "next/server";
import { adminDb, assertSuperAdmin, writeAudit } from "@/lib/server/adminAuth";

/** POST { reqId } */
export async function POST(req: NextRequest){
  try{
    const idToken = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    if (!idToken) return NextResponse.json({ error:"Unauthorized" }, { status:401 });
    const ip = req.headers.get("x-forwarded-for") || (req as any).ip || null;
    const actor = await assertSuperAdmin({ idToken, ip });

    const { reqId } = await req.json();
    if (!reqId) return NextResponse.json({ error:"reqId required" }, { status:400 });

    const ref = adminDb.collection("oversight").doc("requests").collection("items").doc(reqId);
    const snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ error:"Not found" }, { status:404 });

    const data = snap.data() || {};
    if (data.status !== "pending") return NextResponse.json({ error:"Not pending" }, { status:400 });

    const approvals = Array.isArray(data.approvals)? data.approvals: [];
    if (approvals.find((a:any)=> a.uid===actor.uid)) {
      return NextResponse.json({ error:"Same approver not allowed" }, { status:400 });
    }

    approvals.push({ uid: actor.uid, at: Date.now() });

    // For demo: require 2 approvers then mark approved
    const status = approvals.length >= 2 ? "approved" : "pending";
    await ref.set({ approvals, status, updatedAt: Date.now() }, { merge:true });

    await writeAudit({ type:"oversight_approve", actorUid: actor.uid, subject:{ uid: data?.subject?.uid, orgId: data?.subject?.orgId }, delta:{ reqId, afterStatus: status } });

    return NextResponse.json({ ok:true, status });
  }catch(e:any){
    const code = e?.status || 500;
    return NextResponse.json({ error: e?.message || "Server error" }, { status: code });
  }
}
