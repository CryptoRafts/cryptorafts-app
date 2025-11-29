import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/server/firebaseAdmin";

export async function GET(req: NextRequest) {
  try {
    // Test Firebase connection
    const db = getAdminDb();
    if (!db) {
      return NextResponse.json({ 
        success: false, 
        message: "Firebase not available",
        timestamp: new Date().toISOString()
      }, { status: 503 });
    }
    const testDoc = await db.doc('test/connection').get();
    
    return NextResponse.json({ 
      success: true, 
      message: "Firebase connection successful",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Firebase test error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
