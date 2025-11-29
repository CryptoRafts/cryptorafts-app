import { NextResponse } from "next/server";

// Mock KYC: quick rule-of-thumb scoring + decision
export async function POST(req: Request){
  const body = await req.json().catch(()=>({}));
  const name = (body?.name||"").toString();
  const files = Array.isArray(body?.files) ? body.files : [];

  // Ultra simple "heuristic": if at least 2 files and a name, verify fast
  const ok = name.trim().length >= 2 && files.length >= 2;
  const score = Math.min(100, 60 + (files.length*10));
  const res = ok
    ? { status:"verified", score, reasons:[], cooldownUntil:null }
    : { status:"rejected", score:40, reasons:["Insufficient documents"], cooldownUntil:new Date(Date.now()+60_000).toISOString() };

  return NextResponse.json(res, { status: 200 });
}
