import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, getAdminAuth, FieldValue } from "@/lib/firebaseAdmin";

export async function POST(req: NextRequest){
  try{
    const { projectId } = await req.json();
    if(!projectId) return NextResponse.json({error:"Missing projectId"}, {status:400});

    const token = req.headers.get("Authorization")?.replace("Bearer ","");
    if(!token) return NextResponse.json({error:"Unauthenticated"}, {status:401});
    
    const auth = getAdminAuth();
    const decoded = await auth.verifyIdToken(token).catch(()=>null);
    if(!decoded) return NextResponse.json({error:"Invalid token"}, {status:401});
    const uid = decoded.uid;

    const db = getAdminDb();
    
    // Get project
    const projRef = db.collection("projects").doc(projectId);
    const projSnap = await projRef.get();
    if(!projSnap.exists) return NextResponse.json({error:"Project not found"}, {status:404});
    const proj = projSnap.data()!;

    // Update project status
    await projRef.update({
      influencerAction: 'rejected',
      influencerActionBy: uid,
      influencerActionAt: Date.now(),
      updatedAt: Date.now()
    });

    // Update or create relation
    const rid = `${uid}_${projectId}`;
    await db.collection("relations").doc(rid).set({
      influencerId: uid, 
      projectId, 
      founderId: proj.founderId,
      status: "rejected", 
      updatedAt: Date.now(), 
      createdAt: FieldValue.serverTimestamp()
    }, { merge:true });

    return NextResponse.json({ 
      success: true,
      message: "Campaign rejected"
    });
    
  }catch(e:any){
    console.error('❌ [INFLUENCER REJECT API] Error:', e);
    return NextResponse.json({error: String(e?.message||e)}, {status:500});
  }
}

