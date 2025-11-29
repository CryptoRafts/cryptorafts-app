import { NextRequest } from "next/server";
import { getAdminAuth } from "@/server/firebaseAdmin";

export async function requireUser(req: NextRequest){
  const hdr = req.headers.get("authorization") || "";
  const m = hdr.match(/^Bearer\s+(.+)$/i);
  if (!m) return null;
  try {
    const adminAuth = getAdminAuth();
    if (!adminAuth) return null;
    const decoded = await adminAuth.verifyIdToken(m[1], true);
    return decoded.uid as string;
  } catch {
    return null;
  }
}
