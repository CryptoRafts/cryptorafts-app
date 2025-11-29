import { NextRequest, NextResponse } from 'next/server';
import { blogService } from '@/lib/blog-service';

/**
 * GET /api/blog/analytics
 * Get blog analytics data
 * Admin only
 */
export async function GET(request: NextRequest) {
  try {
    const analytics = await blogService.getAnalytics();
    
    return NextResponse.json({ success: true, analytics });
  } catch (error: any) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

