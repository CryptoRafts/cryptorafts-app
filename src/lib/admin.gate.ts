import { NextRequest } from "next/server";
import { getAdminAuth } from "@/server/firebaseAdmin";

function ipAllowed(req: NextRequest){
  const allow = (process.env.ADMIN_IP_ALLOWLIST||"").trim();
  if (!allow) return true;
  const ips = new Set(allow.split(",").map(s=>s.trim()).filter(Boolean));
  const forwardedFor = req.headers.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim() || "";
  return ips.has(ip);
}

export async function assertSuperAdmin(req: NextRequest){
  if (!ipAllowed(req)) return { ok:false, code:403, msg:"IP not allowed" };

  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return { ok:false, code:401, msg:"Missing bearer token" };

  let decoded;
  try { 
    const adminAuth = getAdminAuth();
    if (!adminAuth) {
      console.error("Admin auth not initialized");
      return { ok:false, code:500, msg:"Admin auth unavailable" };
    }
    decoded = await adminAuth.verifyIdToken(token, true); 
  } 
  catch (error: any) { 
    console.error("Token verification failed:", error);
    return { ok:false, code:401, msg:"Invalid token" }; 
  }

  const email = (decoded.email || "").toLowerCase();
  const allowlist = (process.env.ADMIN_ALLOWLIST || "anasshamsiggc@gmail.com,ceo@cryptorafts.com,anasshamsi@cryptorafts.com,admin@cryptorafts.com,support@cryptorafts.com").split(",").map(e => e.trim().toLowerCase());
  
  // Check if email is in allowlist
  const emailOk = allowlist.includes(email);
  // Check if user has admin claims
  const claimOk = (decoded as any).admin && (decoded as any).admin.super === true;

  if (!emailOk && !claimOk) return { ok:false, code:403, msg:"Not an admin" };

  return { ok:true, uid: decoded.uid, email: decoded.email||null };
}
