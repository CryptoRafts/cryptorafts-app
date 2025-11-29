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
        console.error('❌ [DELETE-DEMO] Failed to initialize Firebase Admin');
        return NextResponse.json({ error: 'Firebase Admin initialization failed' }, { status: 503 });
      }
    } else {
      if (!getAdminDb() || !getAdminAuth()) {
        initAdmin();
      }
    }

    const auth = getAdminAuth();
    const db = getAdminDb();

    if (!auth || !db) {
      console.error('❌ [DELETE-DEMO] Firebase Admin services not available');
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
      console.error('❌ [DELETE-DEMO] Token verification failed:', error);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const projectsRef = db.collection('projects');

    // Find and delete old demo projects
    const demoProjectNames = ['CryptoSwap Protocol', 'MetaVerse Gaming Platform'];
    const snapshot = await projectsRef.where('name', 'in', demoProjectNames).get();

    const deletedIds: string[] = [];
    const batch = db.batch();
    
    snapshot.forEach((doc) => {
      batch.delete(doc.ref);
      deletedIds.push(doc.id);
    });

    if (deletedIds.length > 0) {
      await batch.commit();
      console.log(`✅ [DELETE-DEMO] Deleted ${deletedIds.length} old demo projects`);
    }

    return NextResponse.json({ 
      success: true,
      deletedCount: deletedIds.length,
      deletedIds
    });

  } catch (error: any) {
    console.error('❌ [DELETE-DEMO] Error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to delete demo projects' 
    }, { status: 500 });
  }
}


