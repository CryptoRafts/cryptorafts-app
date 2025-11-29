export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { authAdmin, dbAdmin, assertSuperAdmin } from "@/lib/server/adminServer";

export async function POST(req: Request) {
  await assertSuperAdmin(req);
  const { uid, claimsDelta } = await req.json().catch(()=>({}));
  if (!uid || typeof claimsDelta !== "object") {
    return NextResponse.json({ error: "uid/claimsDelta required" }, { status: 400 });
  }

  const user = await authAdmin.getUser(uid);
  const claims = { ...(user.customClaims || {}), ...claimsDelta };
  await authAdmin.setCustomUserClaims(uid, claims);

  await dbAdmin.collection("audit").add({
    type: "admin_set_claims",
    actorUid: null,
    subject: { uid },
    delta: claimsDelta,
    ts: Date.now(),
    immutable: true
  });

  return NextResponse.json({ ok: true });
}
