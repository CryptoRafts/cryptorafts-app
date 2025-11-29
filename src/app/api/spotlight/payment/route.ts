import { NextRequest, NextResponse } from 'next/server';
import { SpotlightService } from '@/lib/spotlight-service';
import Stripe from 'stripe';

const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

export async function POST(request: NextRequest) {
  try {
    const { applicationId, paymentMethod } = await request.json();

    if (!applicationId) {
      return NextResponse.json(
        { error: 'Application ID is required' },
        { status: 400 }
      );
    }

    // Get application details
    const applications = await SpotlightService.getAllApplications();
    const application = applications.find(app => app.id === applicationId);

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    if (application.paymentStatus === 'completed') {
      return NextResponse.json(
        { error: 'Payment already completed' },
        { status: 400 }
      );
    }

    if (paymentMethod === 'stripe') {
      if (!stripe) {
        return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
      }
      // Create Stripe checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `${application.slotType === 'premium' ? 'Premium' : 'Featured'} Spotlight - ${application.projectName}`,
                description: `Verified Spotlight placement for ${application.projectName}`,
                images: [application.logoUrl],
              },
              unit_amount: application.monthlyPrice * 100, // Convert to cents
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/spotlight/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/spotlight/apply`,
        metadata: {
          applicationId: applicationId,
          projectName: application.projectName,
          slotType: application.slotType,
        },
      });

      // Update application with Stripe session ID
      await SpotlightService.updatePaymentStatus(
        applicationId,
        'pending',
        session.id
      );

      return NextResponse.json({
        sessionId: session.id,
        url: session.url,
      });
    } else if (paymentMethod === 'crypto') {
      // For crypto payments, we'll generate a payment address and amount
      const cryptoPayment = {
        address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh', // This would be dynamically generated
        amount: application.monthlyPrice,
        currency: 'USD',
        network: 'Bitcoin', // This would be configurable
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
      };

      return NextResponse.json({
        cryptoPayment,
        instructions: 'Send the exact amount to the provided address. Payment will be confirmed within 30 minutes.',
      });
    }

    return NextResponse.json(
      { error: 'Invalid payment method' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Payment processing error:', error);
    return NextResponse.json(
      { error: 'Payment processing failed' },
      { status: 500 }
    );
  }
}

// Webhook for Stripe payment confirmation
export async function PUT(request: NextRequest) {
  try {
    const { sessionId, status } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Get the Stripe session to find the application ID
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
    }
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const applicationId = session.metadata?.applicationId;

    if (!applicationId) {
      return NextResponse.json(
        { error: 'Application ID not found in session metadata' },
        { status: 400 }
      );
    }

    // Update payment status based on Stripe session status
    let paymentStatus = 'pending';
    if (session.payment_status === 'paid') {
      paymentStatus = 'completed';
    } else if (session.payment_status === 'unpaid') {
      paymentStatus = 'failed';
    }

    await SpotlightService.updatePaymentStatus(applicationId, paymentStatus, sessionId);

    return NextResponse.json({
      success: true,
      paymentStatus,
      applicationId,
    });

  } catch (error) {
    console.error('Payment status update error:', error);
    return NextResponse.json(
      { error: 'Failed to update payment status' },
      { status: 500 }
    );
  }
}


