import { NextRequest, NextResponse } from 'next/server';
import { kycKybService } from '@/lib/kyc-kyb.service';

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    const signature = request.headers.get('x-signature') || '';
    
    // Verify webhook signature
    if (!kycKybService.verifyWebhookSignature(payload, signature)) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const data = JSON.parse(payload);
    
    // Process KYB webhook
    await kycKybService.processKYBWebhook(data);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('KYB webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
