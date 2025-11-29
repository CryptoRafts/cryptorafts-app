import { NextRequest, NextResponse } from 'next/server';
import { db, getDb } from '@/lib/firebase.client';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    // Validate email
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Get Firestore instance
    const dbInstance = getDb();
    if (!dbInstance) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 500 }
      );
    }

    // Check if email already exists
    const subscribersRef = collection(dbInstance, 'subscribers');
    const existingQuery = query(subscribersRef, where('email', '==', email.toLowerCase().trim()));
    const existingDocs = await getDocs(existingQuery);

    if (!existingDocs.empty) {
      return NextResponse.json(
        { message: 'Email already subscribed', alreadySubscribed: true },
        { status: 200 }
      );
    }

    // Add subscriber to Firestore
    await addDoc(subscribersRef, {
      email: email.toLowerCase().trim(),
      subscribedAt: serverTimestamp(),
      source: 'homepage',
      active: true,
      unsubscribed: false,
    });

    return NextResponse.json(
      { message: 'Successfully subscribed', success: true },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Email subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to subscribe. Please try again.' },
      { status: 500 }
    );
  }
}

