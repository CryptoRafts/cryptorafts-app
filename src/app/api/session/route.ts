import { NextRequest, NextResponse } from "next/server";

export async function DELETE(req: NextRequest) {
  try {
    // This endpoint is called during sign out to clear server-side session data
    // For now, we'll just return success since Firebase handles the auth state
    console.log('Session API: Clearing session data');
    
    return NextResponse.json({ 
      success: true, 
      message: "Session cleared successfully" 
    });
  } catch (error) {
    console.error('Session API Error:', error);
    return NextResponse.json({ 
      error: "Failed to clear session" 
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    // This endpoint can be used to check session status
    return NextResponse.json({ 
      success: true, 
      message: "Session endpoint is working" 
    });
  } catch (error) {
    console.error('Session API Error:', error);
    return NextResponse.json({ 
      error: "Session check failed" 
    }, { status: 500 });
  }
}
