/**
 * API Route to Toggle Auto-Posting
 * Server-side route to handle auto-posting toggle with proper Firestore permissions
 * Falls back to client-side Firestore if Admin SDK is not available
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, FieldValue } from '@/lib/firebaseAdmin';

export async function POST(request: NextRequest) {
  try {
    const { enabled } = await request.json();

    if (typeof enabled !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'Invalid request: enabled must be a boolean' },
        { status: 400 }
      );
    }

    // Try Admin SDK first (preferred method)
    let db;
    try {
      db = getAdminDb();
      if (!db) {
        throw new Error('Admin DB returned null');
      }
    } catch (dbError: any) {
      console.error('❌ [AUTO-POSTING] Firebase Admin DB not available:', dbError?.message);
      console.log('🔄 [AUTO-POSTING] Admin SDK not configured - this is OK, using alternative method');
      
      // Return instructions for setting up Admin SDK, but don't fail
      // The client-side code will handle the write using Firestore rules
      return NextResponse.json({
        success: false,
        error: 'Firebase Admin SDK not configured',
        details: 'Please set FIREBASE_SERVICE_ACCOUNT_B64 in Vercel environment variables',
        fallback: 'Client-side Firestore will be used instead',
        help: 'See: https://console.firebase.google.com/project/cryptorafts-b9067/settings/serviceaccounts/adminsdk'
      }, { status: 503 });
    }

    // Use Admin SDK to write
    const settingsRef = db.collection('blog_settings').doc('auto_posting');
    
    const updateData: any = {
      enabled,
      updatedAt: FieldValue.serverTimestamp(),
    };
    
    if (enabled) {
      updateData.startedAt = FieldValue.serverTimestamp();
      updateData.stoppedAt = null;
    } else {
      updateData.stoppedAt = FieldValue.serverTimestamp();
      updateData.startedAt = null;
    }
    
    await settingsRef.set(updateData, { merge: true });

    console.log(`✅ Auto-posting ${enabled ? 'enabled' : 'disabled'}`);

    return NextResponse.json({
      success: true,
      enabled,
      message: `Auto-posting ${enabled ? 'started' : 'stopped'} successfully`
    });

  } catch (error: any) {
    console.error('❌ [AUTO-POSTING] Error toggling auto-posting:', error);
    console.error('❌ [AUTO-POSTING] Error stack:', error?.stack);
    
    // Check if it's a Firebase Admin initialization error
    if (error?.message?.includes('Firebase Admin') || error?.message?.includes('not initialized')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Firebase Admin not initialized',
          details: 'Please check FIREBASE_SERVICE_ACCOUNT_B64 environment variable in Vercel',
          help: 'Go to Vercel Dashboard → Settings → Environment Variables and add FIREBASE_SERVICE_ACCOUNT_B64'
        },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to toggle auto-posting',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
