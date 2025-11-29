import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, orgId } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    // Update user's KYB status to approved
    try {
      const { doc, updateDoc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase.client');
      
      if (!db) return NextResponse.json({ error: "Database not available" }, { status: 503 });
      await updateDoc(doc(db!, 'users', userId), {
        'kyb.status': 'approved',
        'kyb.approvedAt': new Date(),
        'kyb.riskScore': 85,
        'kyb.approvedBy': 'system',
        updatedAt: new Date()
      });
      console.log('✅ User KYB status updated to approved in Firestore');
    } catch (updateError) {
      console.error('Failed to update user KYB status:', updateError);
      return NextResponse.json({ error: "Failed to update KYB status" }, { status: 500 });
    }

    // Simulate KYB approval response
    const approvalResponse = {
      status: 'approved',
      riskScore: 85,
      approvedAt: new Date().toISOString(),
      message: 'Organization KYB approved successfully'
    };

    console.log('KYB API: Approved KYB for user:', userId, 'org:', orgId);

    return NextResponse.json(approvalResponse);
  } catch (error: any) {
    console.error('KYB Approval API Error:', error);
    return NextResponse.json({ error: error.message || "Failed to approve KYB" }, { status: 500 });
  }
}
