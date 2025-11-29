export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { dbAdmin, assertSuperAdmin } from "@/lib/server/adminServer";

export async function POST(req: Request) {
  try {
    const dec = await assertSuperAdmin(req);
    
    // OPTIMIZED: Better JSON parsing with error handling
    let body: any = {};
    try {
      const text = await req.text();
      if (text) {
        body = JSON.parse(text);
      }
    } catch (e: any) {
      console.error('Error parsing JSON:', e?.message || e);
      return NextResponse.json({ error: "Invalid JSON format" }, { status: 400 });
    }
    
    const { type, name, website, country, logoUrl, orgId } = body;
    if (!type || !name) {
      return NextResponse.json({ error: "Missing type/name" }, { status: 400 });
    }

  const ref = orgId ? dbAdmin.collection("organizations").doc(orgId)
                    : dbAdmin.collection("organizations").doc();

  await ref.set({
    type, name,
    website: website||null,
    country: country||null,
    logoUrl: logoUrl||null,
    members: [{ uid: dec.uid, role: "owner" }],
    kyb: { status: "not_started" },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  await dbAdmin.collection("audit").add({
    type: "admin_create_org",
    actorUid: dec.uid,
    subject: { orgId: ref.id },
    delta: { type, name },
    ts: Date.now(),
    immutable: true
  });

    return NextResponse.json({ ok: true, orgId: ref.id });
  } catch (error: any) {
    console.error('Error creating organization:', error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
