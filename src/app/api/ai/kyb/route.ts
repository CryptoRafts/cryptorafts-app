import { NextResponse } from "next/server";

// Mock KYB: optional flow, similar quick check
export async function POST(req: Request){
  const body = await req.json().catch(()=>({}));
  const company = (body?.company||"").toString();
  const files = Array.isArray(body?.files) ? body.files : [];

  const ok = company.trim().length >= 2 && files.length >= 2;
  const score = Math.min(100, 65 + (files.length*8));
  const res = ok
    ? { status:"verified", score, reasons:[], cooldownUntil:null }
    : { status:"rejected", score:45, reasons:["Company docs missing"], cooldownUntil:new Date(Date.now()+60_000).toISOString() };

  return NextResponse.json(res, { status: 200 });
}
