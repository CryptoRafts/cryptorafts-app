export const runtime = 'nodejs';
import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb, initAdmin } from "@/server/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

// Initialize Firebase Admin on module load
if (typeof window === 'undefined') {
  initAdmin();
}

export async function POST(req: NextRequest){
  try{
    const { projectId } = await req.json();
    if(!projectId) return NextResponse.json({error:"Missing projectId"}, {status:400});

    const token = req.headers.get("Authorization")?.replace("Bearer ","");
    if(!token) return NextResponse.json({error:"Unauthenticated"}, {status:401});
    
    // Initialize Firebase Admin first - with retry logic and better error handling
    let auth = getAdminAuth();
    if (!auth) {
      console.log('🔄 [EXCHANGE REJECT API] Firebase Admin Auth not found, initializing...');
      try {
        const { initAdmin } = await import('@/server/firebaseAdmin');
        const app = initAdmin();
        if (app) {
          auth = getAdminAuth();
        }
      } catch (initError: any) {
        console.error('❌ [EXCHANGE REJECT API] Initialization error:', initError?.message || initError);
      }
      
      if (!auth) {
        try {
          const { getAuth } = await import('firebase-admin/auth');
          const { getApps } = await import('firebase-admin/app');
          const apps = getApps();
          if (apps.length > 0) {
            auth = getAuth(apps[0]);
          }
        } catch (explicitError: any) {
          console.error('❌ [EXCHANGE REJECT API] Explicit initialization error:', explicitError?.message || explicitError);
        }
      }
      
      if (!auth) {
        return NextResponse.json({
          error: "Firebase Admin initialization failed",
          details: "Server configuration error. Please check Firebase Admin credentials."
        }, {status:503});
      }
    }
    
    const decoded = await auth.verifyIdToken(token).catch((err) => {
      console.error('❌ [EXCHANGE REJECT API] Token verification failed:', err);
      return null;
    });
    if(!decoded) return NextResponse.json({error:"Invalid or expired token"}, {status:401});
    const uid = decoded.uid;
    console.log(`✅ [EXCHANGE REJECT API] Authenticated user: ${uid}`);

    let db = getAdminDb();
    if (!db) {
      console.log('🔄 [EXCHANGE REJECT API] Firebase Admin DB not found, initializing...');
      try {
        const { initAdmin } = await import('@/server/firebaseAdmin');
        const app = initAdmin();
        if (app) {
          db = getAdminDb();
        }
      } catch (initError: any) {
        console.error('❌ [EXCHANGE REJECT API] DB initialization error:', initError?.message || initError);
      }
      
      if (!db) {
        try {
          const { getFirestore } = await import('firebase-admin/firestore');
          const { getApps } = await import('firebase-admin/app');
          const apps = getApps();
          if (apps.length > 0) {
            db = getFirestore(apps[0]);
          }
        } catch (explicitError: any) {
          console.error('❌ [EXCHANGE REJECT API] Explicit DB initialization error:', explicitError?.message || explicitError);
        }
      }
      
      if (!db) {
        return NextResponse.json({ 
          error: "Firebase Admin database initialization failed",
          details: "Server configuration error. Please check Firebase Admin credentials."
        }, { status: 503 });
      }
    }
    
    // Get project
    const projRef = db.collection("projects").doc(projectId);
    const projSnap = await projRef.get();
    if(!projSnap.exists) return NextResponse.json({error:"Project not found"}, {status:404});
    const proj = projSnap.data()!;

    // Update project status
    await projRef.update({
      exchangeAction: 'rejected',
      exchangeActionBy: uid,
      exchangeActionAt: Date.now(),
      updatedAt: Date.now()
    });

    // Update or create relation
    const rid = `${uid}_${projectId}`;
    await db.collection("relations").doc(rid).set({
      exchangeId: uid, 
      projectId, 
      founderId: proj.founderId,
      status: "rejected", 
      updatedAt: Date.now(), 
      createdAt: FieldValue.serverTimestamp()
    }, { merge:true });

    return NextResponse.json({ 
      success: true,
      message: "Listing request rejected"
    });
    
  }catch(e:any){
    console.error('❌ [EXCHANGE REJECT API] Error in reject-pitch:', e);
    console.error('❌ [EXCHANGE REJECT API] Error stack:', e?.stack);
    
    // Provide more helpful error messages
    let errorMessage = 'Internal server error';
    let errorDetails = String(e?.message || e);
    
    if (errorDetails.includes('Could not load the default credentials') || 
        errorDetails.includes('Application Default Credentials')) {
      errorMessage = 'Firebase Admin credentials not configured';
      errorDetails = 'Server needs Firebase Admin service account credentials. Please configure FIREBASE_SERVICE_ACCOUNT_B64 or FIREBASE_PRIVATE_KEY environment variables.';
    } else if (errorDetails.includes('Permission denied') || errorDetails.includes('permission-denied')) {
      errorMessage = 'Permission denied';
      errorDetails = 'You do not have permission to perform this action.';
    } else if (errorDetails.includes('not found') || errorDetails.includes('does not exist')) {
      errorMessage = 'Resource not found';
    }
    
    return NextResponse.json({
      error: errorMessage,
      details: errorDetails,
      type: e?.name || 'UnknownError'
    }, {status:500});
  }
}

