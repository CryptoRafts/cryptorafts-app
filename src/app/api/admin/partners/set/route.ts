import { NextRequest, NextResponse } from "next/server";
import { adminDb, assertSuperAdmin, writeAudit } from "@/lib/server/adminAuth";

/** POST { type: "vcs|exchanges|idos|influencers|agencies", items: [{name,logoUrl,link,verified}] } */
export async function POST(req: NextRequest){
  try{
    const idToken = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    if (!idToken) return NextResponse.json({ error:"Unauthorized" }, { status:401 });
    const ip = req.headers.get("x-forwarded-for") || (req as any).ip || null;
    const actor = await assertSuperAdmin({ idToken, ip });

    const { type, items } = await req.json();
    const allowed = new Set(["vcs","exchanges","idos","influencers","agencies"]);
    if (!allowed.has(type)) return NextResponse.json({ error:"Invalid type" }, { status:400 });

    const ref = adminDb.collection("partnerLists").doc(type);
    await ref.set({ items: Array.isArray(items)? items: [] }, { merge:true });

    await writeAudit({ type:"partners_set", actorUid: actor.uid, delta:{ type, count: (items||[]).length } });

    return NextResponse.json({ ok:true });
  }catch(e:any){
    const code = e?.status || 500;
    return NextResponse.json({ error: e?.message || "Server error" }, { status: code });
  }
}
