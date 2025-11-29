export const runtime = 'nodejs';
import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb, initAdmin } from "@/server/firebaseAdmin";
import { getApps } from "firebase-admin/app";

export async function GET(req: NextRequest){
  try{
    // Test Firebase Admin initialization
    const appsBefore = getApps();
    console.log(`📊 [TEST] Apps before init: ${appsBefore.length}`);
    
    const initResult = initAdmin();
    console.log(`📊 [TEST] initAdmin result: ${initResult ? 'SUCCESS' : 'FAILED'}`);
    
    const appsAfter = getApps();
    console.log(`📊 [TEST] Apps after init: ${appsAfter.length}`);
    
    const auth = getAdminAuth();
    const db = getAdminDb();
    
    return NextResponse.json({ 
      success: true,
      appsBefore: appsBefore.length,
      appsAfter: appsAfter.length,
      initResult: initResult ? 'SUCCESS' : 'FAILED',
      authAvailable: !!auth,
      dbAvailable: !!db,
      environment: {
        hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
        hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
        hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
        hasB64: !!process.env.FIREBASE_SERVICE_ACCOUNT_B64,
        b64Length: process.env.FIREBASE_SERVICE_ACCOUNT_B64?.length || 0,
        nodeEnv: process.env.NODE_ENV,
        vercel: !!process.env.VERCEL
      }
    });
    
  }catch(e:any){
    console.error('❌ [TEST] Error:', e);
    return NextResponse.json({
      success: false,
      error: String(e?.message||e),
      stack: e?.stack
    }, {status:500});
  }
}

