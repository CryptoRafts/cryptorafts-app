export const dynamic = "force-dynamic";
export async function POST(){
  return new Response(JSON.stringify({ ok:false, error:"Upload signer not configured" }), { status:501 });
}
