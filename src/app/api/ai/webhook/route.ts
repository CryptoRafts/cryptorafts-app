export const dynamic = "force-dynamic";
export async function POST(req: Request){
  return new Response(JSON.stringify({ ok:true }), { status:200 });
}
