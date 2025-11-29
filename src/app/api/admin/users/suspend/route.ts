import { NextRequest, NextResponse } from "next/server";
import { adminDb, assertSuperAdmin, writeAudit } from "@/lib/server/adminAuth";

/** POST { uid, suspend: boolean, reason, until? } */
export async function POST(req: NextRequest){
  try{
    const idToken = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    if (!idToken) return NextResponse.json({ error:"Unauthorized" }, { status:401 });
    const ip = req.headers.get("x-forwarded-for") || (req as any).ip || null;
    const actor = await assertSuperAdmin({ idToken, ip });

    const { uid, suspend, reason, until } = await req.json();
    if (!uid || typeof suspend!=="boolean") return NextResponse.json({ error:"uid/suspend required" }, { status:400 });

    const ref = adminDb.collection("users").doc(uid);
    await ref.set({
      status: suspend ? "suspended":"active",
      suspended: suspend ? { active:true, reason: reason||"unspecified", until: until||null } : { active:false }
    }, { merge:true });

    await writeAudit({ type:"user_suspend", actorUid: actor.uid, subject:{ uid }, delta:{ suspend, reason, until } });

    return NextResponse.json({ ok:true });
  }catch(e:any){
    const code = e?.status || 500;
    return NextResponse.json({ error: e?.message || "Server error" }, { status: code });
  }
}
