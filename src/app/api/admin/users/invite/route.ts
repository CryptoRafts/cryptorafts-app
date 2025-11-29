export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { authAdmin, dbAdmin, assertSuperAdmin } from "@/lib/server/adminServer";

const ROLES = new Set(["founder","vc","exchange","ido","influencer","agency","admin"]);

export async function POST(req: Request) {
  await assertSuperAdmin(req);
  const { email, role, orgId, displayName } = await req.json().catch(()=>({}));

  if (!email || !ROLES.has(role)) {
    return NextResponse.json({ error: "Invalid email/role" }, { status: 400 });
  }

  // Create or fetch user
  let user = await authAdmin.getUserByEmail(email).catch(async () => {
    return await authAdmin.createUser({
      email,
      password: Math.random().toString(36).slice(2) + "Aa1!",
      emailVerified: true,
      displayName: displayName || email.split("@")[0],
    });
  });

  // Set custom claims (no KYC/KYB needed for admin)
  const claims: Record<string, any> = { ...(user.customClaims || {}), role } as Record<string, any>;
  if (role === "admin") (claims as any)["admin"] = { super: false }; // super is manual promotion script
  await authAdmin.setCustomUserClaims(user.uid, claims);

  // Create/merge user doc
  const userRef = dbAdmin.doc(`users/${user.uid}`);
  const docData: any = {
    role,
    status: "active",
    profileCompleted: false,
    onboarding: { createdByAdmin: true, invitedAt: Date.now() },
    updatedAt: Date.now(),
  };

  // org attach for org roles
  if (["vc","exchange","ido","agency"].includes(role)) {
    if (!orgId) return NextResponse.json({ error: "orgId required for org roles" }, { status: 400 });
    docData.orgId = orgId;

    const orgRef = dbAdmin.doc(`organizations/${orgId}`);
    await dbAdmin.runTransaction(async (tx) => {
      const snap = await tx.get(orgRef);
      if (!snap.exists) throw new Error("Org not found");
      const data = snap.data() || {};
      const members = Array.isArray(data.members) ? data.members : [];
      if (!members.some((m:any)=>m.uid===user.uid)) {
        members.push({ uid:user.uid, role:"viewer" });
        tx.update(orgRef, { members, updatedAt: Date.now() });
      }
    });
  }

  await userRef.set(docData, { merge: true });

  // audit
  await dbAdmin.collection("audit").add({
    type: "admin_invite_user",
    actorUid: null,
    subject: { uid: user.uid, role },
    delta: { email, role, orgId: orgId || null },
    ts: Date.now(),
    immutable: true
  });

  return NextResponse.json({ ok: true, uid: user.uid });
}
