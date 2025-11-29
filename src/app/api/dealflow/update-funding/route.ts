import { NextRequest, NextResponse } from "next/server";
import { initAdmin } from "@/server/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: NextRequest) {
  try {
    const { db } = initAdmin();
    const body = await req.json();
    const { projectId, raised, investorCount } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    if (raised === undefined && investorCount === undefined) {
      return NextResponse.json(
        { error: "At least one field (raised or investorCount) is required" },
        { status: 400 }
      );
    }

    const updateData: any = {
      updatedAt: FieldValue.serverTimestamp()
    };

    if (raised !== undefined) {
      updateData['funding.raised'] = raised;
    }

    if (investorCount !== undefined) {
      updateData['funding.investorCount'] = investorCount;
    }

    await db.collection('projects').doc(projectId).update(updateData);

    return NextResponse.json({
      success: true,
      message: "Funding data updated successfully"
    });
  } catch (error: any) {
    console.error("Error updating funding:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update funding data" },
      { status: 500 }
    );
  }
}

