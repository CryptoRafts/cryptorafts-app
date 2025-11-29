import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/server/firebaseAdmin";

export async function GET(req: NextRequest) {
  try {
    // Get user ID from auth token
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const adminAuth = getAdminAuth();
    if (!adminAuth) {
      return NextResponse.json({ error: "Service temporarily unavailable" }, { status: 503 });
    }
    const decodedToken = await adminAuth.verifyIdToken(token);
    const uid = decodedToken.uid;

    // Verify role and KYC status
    if (decodedToken.role !== "influencer") {
      return NextResponse.json({ error: "not_influencer" }, { status: 403 });
    }

    if (decodedToken.kycStatus !== "approved" && decodedToken.kycStatus !== "verified") {
      return NextResponse.json({ error: "kyc_not_approved" }, { status: 403 });
    }

    const db = getAdminDb();
    if (!db) {
      return NextResponse.json({ error: "Service temporarily unavailable" }, { status: 503 });
    }
    
    // Get query parameters for filters
    const url = new URL(req.url);
    const category = url.searchParams.get("category");
    const payoutType = url.searchParams.get("payoutType");
    const dueWindow = url.searchParams.get("dueWindow");

    // Build query for campaigns
    let campaignsQuery = db.collection("campaigns")
      .where("status", "==", "active")
      .where("visibility", "==", "public");

    // Apply filters
    if (category) {
      campaignsQuery = campaignsQuery.where("category", "==", category);
    }
    if (payoutType) {
      campaignsQuery = campaignsQuery.where("payoutType", "==", payoutType);
    }

    const campaignsSnapshot = await campaignsQuery.get();
    const campaigns: any[] = [];

    for (const doc of campaignsSnapshot.docs) {
      const campaignData = doc.data();
      
      // Filter by due window if specified
      if (dueWindow) {
        const dueDate = campaignData.dueDate?.toMillis?.() || 0;
        const now = Date.now();
        const windowMs = parseInt(dueWindow) * 24 * 60 * 60 * 1000; // days to ms
        
        if (dueDate < now || dueDate > now + windowMs) {
          continue;
        }
      }

      // Check if influencer already accepted this campaign
      const acceptanceRef = db.collection("campaignAcceptances")
        .where("campaignId", "==", doc.id)
        .where("influencerId", "==", uid);
      
      const acceptanceSnapshot = await acceptanceRef.get();
      const isAccepted = !acceptanceSnapshot.empty;

      campaigns.push({
        id: doc.id,
        ...campaignData,
        isAccepted,
        acceptedAt: isAccepted ? acceptanceSnapshot.docs[0].data().acceptedAt : null
      });
    }

    return NextResponse.json({ campaigns });
  } catch (error: any) {
    console.error("Error fetching campaigns:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

