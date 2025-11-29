import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Test Firebase Admin initialization without making actual calls
    const { getAdminAuth } = await import("@/server/firebaseAdmin");
    
    try {
      const auth = getAdminAuth();
      if (!auth) {
        throw new Error("Auth not available");
      }
      return NextResponse.json({ 
        status: "success", 
        message: "Firebase Admin auth initialized successfully",
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      return NextResponse.json({ 
        status: "error", 
        message: "Firebase Admin initialization failed",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ 
      status: "error", 
      message: "Failed to import Firebase Admin",
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
