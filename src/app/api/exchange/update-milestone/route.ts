export const runtime = 'nodejs';

import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb, initAdmin } from "@/server/firebaseAdmin";
import { getApps } from "firebase-admin/app";

export async function POST(req: NextRequest) {
  try {
    // Initialize Firebase Admin
    const apps = getApps();
    if (apps.length === 0) {
      const initResult = initAdmin();
      if (!initResult) {
        console.error('❌ [EXCHANGE-MILESTONE] Failed to initialize Firebase Admin');
        return NextResponse.json({ error: 'Firebase Admin initialization failed' }, { status: 503 });
      }
    } else {
      // Update cached instances from existing apps
      const existingApp = apps[0];
      const { getFirestore } = await import('firebase-admin/firestore');
      const { getAuth } = await import('firebase-admin/auth');
      // Force update cached instances
      if (!getAdminDb() || !getAdminAuth()) {
        initAdmin();
      }
    }

    const auth = getAdminAuth();
    const db = getAdminDb();

    if (!auth || !db) {
      console.error('❌ [EXCHANGE-MILESTONE] Firebase Admin services not available');
      return NextResponse.json({ error: 'Firebase services not available' }, { status: 503 });
    }

    // Get auth token from header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(token);
    } catch (error: any) {
      console.error('❌ [EXCHANGE-MILESTONE] Token verification failed:', error);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = decodedToken.uid;
    const body = await req.json();
    const { projectId, milestone, completed } = body;

    if (!projectId || !milestone) {
      return NextResponse.json({ error: 'Missing projectId or milestone' }, { status: 400 });
    }

    // Verify project exists and is accepted by this exchange
    const projectRef = db.collection('projects').doc(projectId);
    const projectDoc = await projectRef.get();

    if (!projectDoc.exists) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const projectData = projectDoc.data();
    // Allow any exchange user to update milestones if project is accepted by any exchange
    if (projectData?.exchangeAction !== 'accepted') {
      return NextResponse.json({ error: 'Project must be accepted by an exchange to update milestones' }, { status: 403 });
    }

    // Update milestone
    const milestones = projectData.milestones || {};
    milestones[milestone] = {
      completed: completed === true,
      updatedAt: new Date(),
      updatedBy: userId
    };

    await projectRef.update({
      milestones: milestones
    });

    console.log(`✅ [EXCHANGE-MILESTONE] Milestone ${milestone} updated to ${completed} for project ${projectId}`);

    return NextResponse.json({ 
      success: true,
      milestone: milestones[milestone]
    });

  } catch (error: any) {
    console.error('❌ [EXCHANGE-MILESTONE] Error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to update milestone' 
    }, { status: 500 });
  }
}

