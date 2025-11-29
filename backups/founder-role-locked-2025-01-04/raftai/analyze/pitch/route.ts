import { NextRequest, NextResponse } from 'next/server';
import { raftAIService } from '@/lib/raftai.service';

export async function POST(request: NextRequest) {
  try {
    const { userId, pitchData } = await request.json();
    
    if (!userId || !pitchData) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await raftAIService.analyzePitch(userId, pitchData);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Pitch analysis error:', error);
    return NextResponse.json(
      { error: 'Analysis failed' },
      { status: 500 }
    );
  }
}
