export const dynamic = "force-dynamic";
async function proxy(req: Request, path: string) {
  const base = process.env.RAFTAI_BASE_URL!;
  const key = process.env.RAFTAI_API_KEY!;
  if (!base || !key) return new Response(JSON.stringify({ ok:false, error:"RaftAI not configured" }), { status: 501 });
  const body = await req.text();
  const r = await fetch(base + path, { method:"POST", headers:{ "content-type":"application/json", "authorization": "Bearer "+key }, body, cache:"no-store" });
  if (r.status===202) return new Response(JSON.stringify({ ok:true, status:"processing" }), { status:202 });
  const j = await r.text();
  return new Response(j, { status: r.status, headers: { "content-type":"application/json" } });
}
export async function POST(req: Request) { return proxy(req, "/scores/reputation"); }
