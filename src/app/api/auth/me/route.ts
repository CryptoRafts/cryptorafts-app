export const runtime = 'nodejs';
// src/app/api/auth/me/route.ts
// Get Current User & Claims

import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    // Check if Firebase Admin is available
    if (!auth || !db) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable' },
        { status: 503 }
      );
    }

    // Get access token from Authorization header
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No access token' },
        { status: 401 }
      );
    }

    const accessToken = authHeader.substring(7); // Remove 'Bearer '

    // Verify access token
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(accessToken);
    } catch (error) {
      console.error('Invalid access token:', error);
      return NextResponse.json(
        { error: 'Invalid access token' },
        { status: 401 }
      );
    }

    const userId = decodedToken.uid;

    // Get user data from Firestore
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userData = userDoc.data();

    // Get custom claims
    const userRecord = await auth.getUser(userId);
    const claims = userRecord.customClaims || {};

    // Return user data and claims
    return NextResponse.json({
      user: {
        uid: userId,
        email: userRecord.email,
        displayName: userData?.displayName || userData?.display_name || userRecord.displayName,
        photoURL: userData?.photoURL || userRecord.photoURL,
      },
      claims: {
        role: claims.role || userData?.role || 'user',
        ...claims,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


