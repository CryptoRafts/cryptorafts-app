import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/server/firebaseAdmin";
import { requireUser } from "@/app/api/_utils";

export async function POST(req: NextRequest) {
  try {
    const uid = await requireUser(req);
    if (!uid) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { projectId, ...pitchData } = body;

    // Verify project ownership
    const db = getAdminDb();
    if (!db) {
      return NextResponse.json({ error: "Service temporarily unavailable" }, { status: 503 });
    }
    const projectRef = db.doc(`projects/${projectId}`);
    const projectSnap = await projectRef.get();
    
    if (!projectSnap.exists) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const project = projectSnap.data();
    if (project?.founderId !== uid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if pitch is already submitted and locked
    if (project.pitch?.submitted && project.pitch?.oneTime) {
      return NextResponse.json({ error: "Pitch already submitted" }, { status: 400 });
    }

    // Call RaftAI service for pitch analysis
    const raftaiResponse = await fetch(`${process.env.RAFTAI_SERVICE_URL}/analyze-pitch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RAFTAI_SERVICE_TOKEN}`,
        'X-Idempotency-Key': `pitch-${projectId}-${Date.now()}`
      },
      body: JSON.stringify({
        projectId,
        title: pitchData.title,
        sector: pitchData.sector,
        chain: pitchData.chain,
        stage: pitchData.stage,
        valuePropOneLine: pitchData.valuePropOneLine,
        product: pitchData.product,
        problem: pitchData.problem,
        solution: pitchData.solution,
        tokenomics: pitchData.tokenomics,
        team: pitchData.team,
        roadmap: pitchData.roadmap
      })
    });

    if (!raftaiResponse.ok) {
      throw new Error('RaftAI service unavailable');
    }

    const analysis = await raftaiResponse.json();

    // Update project with RaftAI analysis
    await projectRef.set({
      raftai: {
        rating: analysis.rating,
        score: analysis.score,
        summary: analysis.summary,
        risks: analysis.risks,
        recommendations: analysis.recs,
        analyzedAt: Date.now()
      },
      updatedAt: Date.now()
    }, { merge: true });

    // Update user onboarding step
    await db.doc(`users/${uid}`).set({
      onboarding: {
        step: 'completed',
        pitchSubmitted: Date.now(),
        updatedAt: Date.now()
      },
      updatedAt: Date.now()
    }, { merge: true });

    // Update custom claims
    const auth = getAdminAuth();
    if (!auth) {
      console.error('Admin auth not available');
      return NextResponse.json({ error: "Service temporarily unavailable" }, { status: 503 });
    }
    const user = await auth.getUser(uid);
    const prevClaims = user.customClaims || {};
    
    await auth.setCustomUserClaims(uid, {
      ...prevClaims,
      onboardingStep: 'completed',
      pitchSubmitted: true
    });

    return NextResponse.json({
      success: true,
      analysis
    });

  } catch (error) {
    console.error('Pitch analysis error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
