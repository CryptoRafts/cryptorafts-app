import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      kyc_legal_name,
      kyc_dob,
      kyc_country,
      kyc_id_type,
      kyc_id_number_masked,
      kyc_selfie_url,
      kyc_id_image_url
    } = body;

    // Validate required fields
    if (!kyc_legal_name || !kyc_dob || !kyc_country || !kyc_id_type || !kyc_selfie_url) {
      return NextResponse.json(
        { error: 'Missing required KYC fields' },
        { status: 400 }
      );
    }

    // Simulate RaftAI verification process
    // In production, this would call the actual RaftAI service
    const verificationResult = await simulateRaftAIVerification({
      kyc_legal_name,
      kyc_dob,
      kyc_country,
      kyc_id_type,
      kyc_id_number_masked,
      kyc_selfie_url,
      kyc_id_image_url
    });

    return NextResponse.json(verificationResult);
  } catch (error) {
    console.error('KYC verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function simulateRaftAIVerification(data: any) {
  // Simulate processing delay (≤5s SLA)
  const processingTime = Math.random() * 3000 + 1000; // 1-4 seconds
  await new Promise(resolve => setTimeout(resolve, processingTime));
  
  // Generate verification result based on input quality
  let score = Math.floor(Math.random() * 100);
  
  // Adjust score based on data completeness
  if (data.kyc_id_image_url) {
    score += 10; // Bonus for providing ID image
  }
  
  if (data.kyc_legal_name.length > 10) {
    score += 5; // Bonus for longer names (more complete)
  }
  
  // Ensure score is within bounds
  score = Math.min(100, Math.max(0, score));
  
  const decision = score >= 70 ? 'APPROVED' : 'REJECTED';
  
  const reasons = decision === 'APPROVED' ? 
    [
      'Identity verified successfully',
      'Face match confirmed',
      'Document validation passed',
      'Risk assessment completed'
    ] :
    [
      'Face match failed',
      'Document quality insufficient',
      'Identity verification failed',
      'High risk assessment'
    ];

  return {
    decision,
    risk_score: score,
    reasons,
    sla: processingTime / 1000,
    confidence: Math.random() * 0.3 + 0.7, // 70-100%
    timestamp: new Date().toISOString(),
    verification_id: `kyc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  };
}
