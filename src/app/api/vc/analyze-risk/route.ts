import { NextRequest, NextResponse } from 'next/server';
import { VCRiskAnalyzer, type ProjectData } from '@/lib/vc-risk-analyzer';

export async function POST(req: NextRequest) {
  try {
    // Get authorization
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await req.json();
    const { projectData } = body as { projectData: ProjectData };

    if (!projectData) {
      return NextResponse.json(
        { error: 'Missing project data' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!projectData.name || !projectData.sector || !projectData.stage) {
      return NextResponse.json(
        { error: 'Missing required fields: name, sector, stage' },
        { status: 400 }
      );
    }

    // Perform risk analysis
    const analysis = VCRiskAnalyzer.analyzeProject(projectData);

    // Log analysis for monitoring
    console.log('VC Risk Analysis completed:', {
      project: projectData.name,
      overallRisk: analysis.overallRisk,
      riskScore: analysis.riskScore,
      decision: analysis.investmentRecommendation.decision,
      redFlags: analysis.redFlags.length
    });

    // Return analysis results
    return NextResponse.json({
      success: true,
      analysis,
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('Error in VC risk analysis:', error);
    return NextResponse.json(
      { 
        error: 'Risk analysis failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET(req: NextRequest) {
  return NextResponse.json({
    status: 'healthy',
    service: 'VC Risk Analyzer',
    version: '1.0.0',
    timestamp: Date.now()
  });
}

