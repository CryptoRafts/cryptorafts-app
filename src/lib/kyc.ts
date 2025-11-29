import crypto from "crypto";

type StartParams =
  | { type: "KYC"; userId: string }
  | { type: "KYB"; userId: string; orgId: string };

type StartResult = { vendorRef: string; clientToken: string };

const BASE = process.env.SUMSUB_BASE_URL || "https://api.sumsub.com";
const APP  = process.env.SUMSUB_APP_TOKEN!;
const SEC  = process.env.SUMSUB_SECRET!;

// Build Sumsub signature
function sign(method:string, path:string, body:string){
  const ts = Math.floor(Date.now()/1000).toString();
  const hmac = crypto.createHmac("sha256", SEC);
  hmac.update(ts + method.toUpperCase() + path + body);
  const sig = hmac.digest("hex");
  return { ts, sig };
}

async function ssFetch(path:string, method:"GET"|"POST", bodyObj?: any){
  const body = bodyObj ? JSON.stringify(bodyObj) : "";
  const { ts, sig } = sign(method, path, body);

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-App-Token": APP,
      "X-App-Access-Ts": ts,
      "X-App-Access-Sig": sig,
    } as any,
    body: body || undefined
  });

  if (!res.ok) {
    const text = await res.text().catch(()=> "");
    throw new Error(`Sumsub ${method} ${path} ${res.status}: ${text}`);
  }
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  return res.text();
}

// Ensure applicant exists and return id
async function ensureApplicant(externalUserId:string, isCompany:boolean){
  // Try create
  const levelName = process.env.SUMSUB_LEVEL_NAME || "basic-kyc-level";
  const path = `/resources/applicants?levelName=${encodeURIComponent(levelName)}&externalUserId=${encodeURIComponent(externalUserId)}`;

  try {
    const payload:any = isCompany
      ? { type: "COMPANY" }
      : { type: "PERSON" };

    const created = await ssFetch(path, "POST", payload);
    return created?.id || created?.applicantId || created?.applicant?.id;
  } catch (e:any){
    // If duplicate, fetch by externalUserId
    if (String(e.message||"").includes("409")) {
      const list:any = await ssFetch(`/resources/applicants/-;externalUserId=${encodeURIComponent(externalUserId)}`, "GET");
      const found = Array.isArray(list) && list.length ? list[0] : list?.items?.[0];
      const id = found?.id || found?.applicantId || found?.applicant?.id;
      if (id) return id;
    }
    throw e;
  }
}

// Create SDK access token
async function createSdkToken(applicantId:string, ttl:number = 600){
  const data:any = await ssFetch(`/resources/applicants/${applicantId}/sdkIntegrations/accessTokens?ttlInSecs=${ttl}`, "POST");
  // Sumsub returns { token: "..." }
  return data?.token || data?.accessToken || data;
}

export function getKycAdapter(kind: "KYC" | "KYB"){
  return {
    async startSession(p: StartParams): Promise<StartResult>{
      if (!APP || !SEC) throw new Error("vendor_not_configured");
      if (kind === "KYC" && p.type !== "KYC") throw new Error("wrong_adapter");
      if (kind === "KYB" && p.type !== "KYB") throw new Error("wrong_adapter");

      if (p.type === "KYC") {
        const externalId = p.userId;
        const applicantId = await ensureApplicant(externalId, false);
        const token = await createSdkToken(applicantId);
        return { vendorRef: applicantId, clientToken: token };
      } else {
        // KYB: company applicant keyed by orgId, include userId for traceability
        const externalId = `${p.orgId}::${p.userId}`;
        const applicantId = await ensureApplicant(externalId, true);
        const token = await createSdkToken(applicantId);
        return { vendorRef: applicantId, clientToken: token };
      }
    }
  };
}
