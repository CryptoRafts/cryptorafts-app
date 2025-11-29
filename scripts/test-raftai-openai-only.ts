/**
 * RaftAI OpenAI Direct Test
 * Tests OpenAI integration without Firebase dependencies
 */

// Set OpenAI API key
const API_KEY = process.env.OPENAI_API_KEY || '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';
process.env.OPENAI_API_KEY = API_KEY;

import { openaiService } from '../src/lib/raftai/openai-service';

// Test data
const testPitchData = {
  projectId: 'test_project_' + Date.now(),
  title: 'Test DeFi Protocol',
  projectName: 'Test DeFi Protocol',
  name: 'Test DeFi Protocol',
  description: 'A revolutionary DeFi protocol that simplifies decentralized finance for mainstream users. Our platform combines liquidity provision, yield farming, and automated trading in a single, user-friendly interface.',
  problem: 'Current DeFi platforms are too complex for average users. High gas fees, confusing interfaces, and lack of security make DeFi inaccessible to 95% of potential users.',
  solution: 'We provide a simplified DeFi platform with one-click operations, gas optimization, and built-in security features. Our AI-powered interface guides users through complex operations.',
  sector: 'DeFi',
  chain: 'Ethereum',
  stage: 'MVP',
  fundingGoal: 5000000,
  pitch: {
    projectName: 'Test DeFi Protocol',
    projectDescription: 'A revolutionary DeFi protocol that simplifies decentralized finance',
    problem: 'Current DeFi platforms are too complex for average users',
    solution: 'We provide a simplified DeFi platform with one-click operations',
    sector: 'DeFi',
    chain: 'Ethereum',
    stage: 'MVP',
    targetAudience: 'Mainstream crypto users',
    marketSize: '$50B DeFi market',
    competitiveAdvantage: 'Simplified UX, AI-powered, gas optimization',
    tokenomics: {
      totalSupply: 1000000000,
      allocations: {
        public: '40%',
        team: '20%',
        investors: '25%',
        treasury: '15%'
      },
      vesting: '4-year linear vesting for team and investors'
    },
    teamMembers: [
      {
        name: 'John Doe',
        role: 'CEO & Founder',
        bio: '10+ years in blockchain, former CTO at major DeFi protocol',
        linkedin: 'https://linkedin.com/in/johndoe',
        twitter: 'https://twitter.com/johndoe'
      },
      {
        name: 'Jane Smith',
        role: 'CTO',
        bio: 'Expert in smart contract development, 5+ years Solidity',
        linkedin: 'https://linkedin.com/in/janesmith'
      }
    ],
    documents: {
      pitchDeck: 'https://example.com/pitch-deck.pdf',
      whitepaper: 'https://example.com/whitepaper.pdf',
      tokenomics: 'https://example.com/tokenomics.pdf',
      roadmap: 'https://example.com/roadmap.pdf',
      projectLogo: 'https://example.com/logo.png'
    }
  },
  documents: {
    pitchDeck: { url: 'https://example.com/pitch-deck.pdf' },
    whitepaper: { url: 'https://example.com/whitepaper.pdf' },
    tokenomics: { url: 'https://example.com/tokenomics.pdf' },
    roadmap: { url: 'https://example.com/roadmap.pdf' }
  },
  tokenomics: {
    totalSupply: 1000000000,
    allocations: {
      public: '40%',
      team: '20%',
      investors: '25%',
      treasury: '15%'
    }
  }
};

async function testOpenAIDirectly() {
  console.log('🧪 Testing RaftAI OpenAI Integration Directly\n');
  console.log('='.repeat(60));
  
  // Test 1: Check OpenAI Service
  console.log('\n📋 Test 1: OpenAI Service Status');
  console.log('─'.repeat(60));
  const isEnabled = openaiService.isEnabled();
  console.log(`OpenAI Enabled: ${isEnabled ? '✅ YES' : '❌ NO'}`);
  
  if (!isEnabled) {
    console.log('\n❌ OpenAI service is not enabled. Check API key configuration.');
    return { success: false, error: 'OpenAI not enabled' };
  }
  
  console.log('✅ OpenAI service is ready!\n');
  
  // Test 2: Run Analysis
  console.log('📋 Test 2: Running Comprehensive Analysis');
  console.log('─'.repeat(60));
  console.log('Project:', testPitchData.title);
  console.log('Sector:', testPitchData.sector);
  console.log('Team Size:', testPitchData.pitch.teamMembers.length);
  console.log('Documents:', {
    pitchDeck: !!testPitchData.pitch.documents.pitchDeck,
    whitepaper: !!testPitchData.pitch.documents.whitepaper,
    tokenomics: !!testPitchData.pitch.documents.tokenomics,
    roadmap: !!testPitchData.pitch.documents.roadmap
  });
  console.log('\n⏳ Calling OpenAI GPT-4 for analysis...\n');
  
  try {
    const startTime = Date.now();
    const result = await openaiService.analyzePitchWithAI(testPitchData);
    const processingTime = Date.now() - startTime;
    
    console.log(`✅ Analysis Complete!`);
    console.log(`⏱️  Processing Time: ${processingTime}ms (${(processingTime / 1000).toFixed(2)}s)\n`);
    
    // Test 3: Verify Results
    console.log('📋 Test 3: Analysis Results Verification');
    console.log('─'.repeat(60));
    
    const checks = {
      'Executive Summary': typeof result.executiveSummary === 'string' && result.executiveSummary.length > 0,
      'Score (0-100)': typeof result.score === 'number' && result.score >= 0 && result.score <= 100,
      'Risk Score (1-100)': typeof result.riskScore === 'number' && result.riskScore >= 1 && result.riskScore <= 100,
      'Confidence (0-100)': typeof result.confidence === 'number' && result.confidence >= 0 && result.confidence <= 100,
      'Rating': ['high', 'normal', 'low'].includes(result.rating),
      'Findings Array': Array.isArray(result.findings) && result.findings.length > 0,
      'Risk Drivers Array': Array.isArray(result.riskDrivers) && result.riskDrivers.length > 0,
      'Comparable Projects': Array.isArray(result.comparableProjects),
      'Market Outlook': !!result.marketOutlook && typeof result.marketOutlook === 'object',
      'Tokenomics Review': !!result.tokenomicsReview && typeof result.tokenomicsReview === 'object',
      'Team Analysis': !!result.teamAnalysis && typeof result.teamAnalysis === 'object',
      'Audit History': !!result.auditHistory && typeof result.auditHistory === 'object',
      'On-Chain Activity': !!result.onChainActivity && typeof result.onChainActivity === 'object',
      'Unverifiable Claims': Array.isArray(result.unverifiableClaims),
      'Summary': typeof result.summary === 'string' && result.summary.length > 0,
      'Strengths Array': Array.isArray(result.strengths) && result.strengths.length > 0,
      'Risks Array': Array.isArray(result.risks) && result.risks.length > 0,
      'Recommendations Array': Array.isArray(result.recommendations) && result.recommendations.length > 0
    };
    
    let allPassed = true;
    let passedCount = 0;
    let totalCount = Object.keys(checks).length;
    
    for (const [check, passed] of Object.entries(checks)) {
      const status = passed ? '✅' : '❌';
      console.log(`${status} ${check}`);
      if (passed) passedCount++;
      if (!passed) allPassed = false;
    }
    
    console.log(`\n📊 Results: ${passedCount}/${totalCount} checks passed\n`);
    
    // Display Analysis Summary
    console.log('📋 Test 4: Analysis Summary');
    console.log('─'.repeat(60));
    console.log(`Score: ${result.score}/100`);
    console.log(`Risk Score: ${result.riskScore}/100`);
    console.log(`Confidence: ${result.confidence}%`);
    console.log(`Rating: ${result.rating.toUpperCase()}`);
    console.log(`\nExecutive Summary:\n${result.executiveSummary}`);
    console.log(`\nFindings: ${result.findings.length}`);
    if (result.findings.length > 0) {
      console.log('\nSample Finding:');
      const sample = result.findings[0];
      console.log(`  Category: ${sample.category}`);
      console.log(`  Finding: ${sample.finding}`);
      console.log(`  Source: ${sample.source}`);
    }
    console.log(`\nRisk Drivers: ${result.riskDrivers.length}`);
    if (result.riskDrivers.length > 0) {
      console.log('\nSample Risk Driver:');
      const sample = result.riskDrivers[0];
      console.log(`  Risk: ${sample.risk}`);
      console.log(`  Severity: ${sample.severity.toUpperCase()}`);
      console.log(`  Remediation: ${sample.remediation}`);
    }
    console.log(`\nComparable Projects: ${result.comparableProjects.length}`);
    console.log(`Team Members Analyzed: ${result.teamAnalysis?.members?.length || 0}`);
    console.log(`LinkedIn Links: ${result.teamAnalysis?.linkedinLinks?.length || 0}`);
    
    if (result.marketOutlook) {
      console.log(`\nMarket Fit: ${result.marketOutlook.marketFit.toUpperCase()}`);
      console.log(`Market Trends: ${result.marketOutlook.trends?.length || 0}`);
    }
    
    if (result.tokenomicsReview) {
      console.log(`\nTokenomics Strengths: ${result.tokenomicsReview.strengths?.length || 0}`);
      console.log(`Tokenomics Concerns: ${result.tokenomicsReview.concerns?.length || 0}`);
    }
    
    console.log(`\nUnverifiable Claims: ${result.unverifiableClaims.length}`);
    console.log(`Strengths: ${result.strengths.length}`);
    console.log(`Risks: ${result.risks.length}`);
    console.log(`Recommendations: ${result.recommendations.length}`);
    
    console.log('\n' + '='.repeat(60));
    if (allPassed) {
      console.log('✅ ALL TESTS PASSED - RaftAI OpenAI Integration Working Perfectly!');
    } else {
      console.log('⚠️  SOME TESTS FAILED - Review the results above');
    }
    console.log('='.repeat(60));
    
    return { success: allPassed, result, processingTime, passedCount, totalCount };
    
  } catch (error: any) {
    console.error('\n❌ Test Failed with Error:');
    console.error('─'.repeat(60));
    console.error('Error:', error.message);
    if (error.stack) {
      console.error('\nStack:', error.stack);
    }
    return { success: false, error: error.message };
  }
}

// Run test
if (require.main === module) {
  testOpenAIDirectly()
    .then((result) => {
      if (result.success) {
        console.log('\n✅ RaftAI OpenAI test completed successfully!');
        process.exit(0);
      } else {
        console.log('\n❌ RaftAI OpenAI test failed!');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('\n❌ Fatal error during test:', error);
      process.exit(1);
    });
}

export { testOpenAIDirectly, testPitchData };

