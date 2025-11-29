import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/server/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: NextRequest) {
  try {
    const { action, data, timestamp } = await req.json();
    
    if (!action) {
      return NextResponse.json({ error: "Missing action" }, { status: 400 });
    }

    // Get user ID from Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing or invalid authorization" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    
    // Verify token and get user ID
    const { getAdminAuth } = await import("@/server/firebaseAdmin");
    const auth = getAdminAuth();
    if (!auth) {
      return NextResponse.json({ error: "Service temporarily unavailable" }, { status: 503 });
    }
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;

    // Log audit event
    const { getAdminDb } = await import("@/server/firebaseAdmin");
    const db = getAdminDb();
    if (!db) {
      return NextResponse.json({ error: "Service temporarily unavailable" }, { status: 503 });
    }
    await db.collection("auditLogs").add({
      action,
      data,
      userId,
      timestamp: timestamp || FieldValue.serverTimestamp(),
      ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown",
      userAgent: req.headers.get("user-agent") || "unknown"
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error logging audit event:", error);
    return NextResponse.json({ error: "Failed to log audit event" }, { status: 500 });
  }
}
