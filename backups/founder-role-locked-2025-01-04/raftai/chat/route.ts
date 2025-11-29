import { NextRequest, NextResponse } from 'next/server';
import { raftAIService } from '@/lib/raftai.service';

export async function POST(request: NextRequest) {
  try {
    const { userId, message, context } = await request.json();
    
    if (!userId || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await raftAIService.chat(userId, message, context);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('RaftAI chat error:', error);
    return NextResponse.json(
      { error: 'Chat failed' },
      { status: 500 }
    );
  }
}
