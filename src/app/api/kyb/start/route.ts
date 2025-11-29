import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, orgId } = body;

    // For now, accept any request with userId (we'll add proper auth later)
    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    // In a real implementation, you would integrate with a KYB vendor like Jumio, Onfido, etc.
    // For now, we'll return a mock response
    const mockResponse = {
      vendorRef: `kyb_${orgId || userId}_${Date.now()}`,
      clientToken: `token_${orgId || userId}_${Date.now()}`,
      status: 'pending',
      message: 'KYB session created successfully'
    };

    console.log('KYB API: Created session for user:', userId, 'org:', orgId);

    return NextResponse.json(mockResponse);
  } catch (error: any) {
    console.error('KYB API Error:', error);
    return NextResponse.json({ error: error.message || "Failed to start KYB" }, { status: 500 });
  }
}
