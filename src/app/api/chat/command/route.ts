export const dynamic = "force-dynamic";
export async function POST(req: Request){
  const { cid, text } = await req.json();
  return new Response(JSON.stringify({ ok:true, cid, accepted:true, text }), { status:202 });
}
