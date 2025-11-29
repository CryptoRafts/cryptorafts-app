import { NextResponse } from "next/server";

export async function GET() {
  try {
    return NextResponse.json({ 
      status: "success", 
      message: "Simple test endpoint working",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({ 
      status: "error", 
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
