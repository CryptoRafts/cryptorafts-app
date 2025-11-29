import { NextRequest, NextResponse } from 'next/server';
import { raftAIService } from '@/lib/raftai.service';

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    const signature = request.headers.get('x-signature') || '';
    
    const data = JSON.parse(payload);
    
    // Process RaftAI webhook
    await raftAIService.processWebhook(data, signature);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('RaftAI webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
