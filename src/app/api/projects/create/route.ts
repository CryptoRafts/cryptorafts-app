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
    const {
      title,
      sector,
      chain,
      stage,
      valuePropOneLine,
      product,
      problem,
      solution,
      tokenomics,
      team,
      roadmap,
      files
    } = body;

    // Validate required fields
    if (!title || !sector || !chain || !stage || !valuePropOneLine) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if user already has a project (one-time submission)
    const db = getAdminDb();
    if (!db) return NextResponse.json({ error: "Database not available" }, { status: 503 });
    const existingProjectQuery = await db.collection('projects')
      .where('founderId', '==', uid)
      .where('pitch.submitted', '==', true)
      .limit(1)
      .get();

    if (!existingProjectQuery.empty) {
      return NextResponse.json(
        { error: "Project already submitted. Only one pitch per founder is allowed." },
        { status: 400 }
      );
    }

    // Create project document
    const projectData = {
      founderId: uid,
      title,
      sector,
      chain,
      stage,
      valuePropOneLine,
      product: product || {},
      problem: problem || '',
      solution: solution || '',
      tokenomics: tokenomics || {},
      team: team || [],
      roadmap: roadmap || [],
      files: files || [],
      pitch: {
        submitted: true,
        oneTime: true,
        at: Date.now(),
        data: body
      },
      raftai: {
        rating: 'Pending',
        score: 0,
        summary: '',
        risks: [],
        recommendations: [],
        analyzedAt: null
      },
      badges: {
        kyc: false,
        kyb: false,
        audit: false,
        doxxed: false
      },
      visibility: {
        discoverable: false,
        publicFields: [],
        privateFields: []
      },
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const projectRef = await db!.collection('projects').add(projectData);
    const projectId = projectRef.id;

    // Update user's onboarding step
    await db!.doc(`users/${uid}`).update({
      onboardingStep: 'complete',
      updatedAt: Date.now()
    });

    // Trigger AI analysis
    try {
      const aiResponse = await fetch(`${process.env.NEXT_PUBLIC_RAFTAI_SERVICE_URL}/analyze-pitch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.RAFTAI_SERVICE_TOKEN}`
        },
        body: JSON.stringify({
          projectId,
          title,
          sector,
          chain,
          stage,
          valuePropOneLine,
          product,
          problem,
          solution,
          tokenomics,
          team,
          roadmap
        })
      });

      if (aiResponse.ok) {
        const aiResult = await aiResponse.json();
        
        // Update project with AI analysis
        await db!.doc(`projects/${projectId}`).update({
          'raftai.rating': aiResult.rating,
          'raftai.score': aiResult.score,
          'raftai.summary': aiResult.summary,
          'raftai.risks': aiResult.risks,
          'raftai.recommendations': aiResult.recs,
          'raftai.analyzedAt': Date.now(),
          updatedAt: Date.now()
        });

        // Update visibility if rating meets threshold
        if (aiResult.rating === 'High' || aiResult.score >= 80) {
          await db!.doc(`projects/${projectId}`).update({
            'visibility.discoverable': true,
            'visibility.publicFields': ['title', 'sector', 'chain', 'stage', 'valuePropOneLine'],
            updatedAt: Date.now()
          });
        }
      }
    } catch (aiError) {
      console.error('AI analysis failed:', aiError);
      // Continue without failing the project creation
    }

    return NextResponse.json({
      success: true,
      projectId,
      message: "Project created successfully"
    });

  } catch (error) {
    console.error("Project creation error:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}
