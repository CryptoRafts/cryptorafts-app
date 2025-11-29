/**
 * RaftAI Comprehensive Test Script
 * Tests all RaftAI functionality including OpenAI integration
 */

// Set OpenAI API key for testing (from command line or environment)
if (process.argv.includes('--api-key')) {
  const keyIndex = process.argv.indexOf('--api-key');
  if (process.argv[keyIndex + 1]) {
    process.env.OPENAI_API_KEY = process.argv[keyIndex + 1];
  }
}

// Initialize Firebase first (optional - RaftAI works without it)
try {
  const { initializeApp } = require('firebase/app');
  const { getFirestore } = require('firebase/firestore');
  
  // Minimal Firebase config for testing
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'test-key',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'test.firebaseapp.com',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'test-project',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'test.appspot.com',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || 'test-app-id'
  };

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  // Make db available globally for raftai
  (global as any).__FIREBASE_DB__ = db;
} catch (error) {
  console.warn('⚠️  Firebase initialization skipped (using test mode)');
}

import { raftai } from '../src/lib/raftai';
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

async function testRaftAI() {
  console.log('🧪 Starting RaftAI Comprehensive Test...\n');
  
  // Test 1: Check OpenAI Service Status
  console.log('📋 Test 1: OpenAI Service Status');
  console.log('─────────────────────────────────────');
  const isOpenAIEnabled = openaiService.isEnabled();
  console.log(`OpenAI Enabled: ${isOpenAIEnabled ? '✅ YES' : '❌ NO'}`);
  if (!isOpenAIEnabled) {
    console.log('⚠️  WARNING: OpenAI API key not configured. RaftAI will use simulation mode.');
    console.log('   To enable real-time analysis, set OPENAI_API_KEY in .env.local\n');
  } else {
    console.log('✅ OpenAI is properly configured for real-time analysis\n');
  }
  
  // Test 2: Run Pitch Analysis
  console.log('📋 Test 2: Pitch Analysis Execution');
  console.log('─────────────────────────────────────');
  console.log('Project:', testPitchData.title);
  console.log('Sector:', testPitchData.sector);
  console.log('Team Size:', testPitchData.pitch.teamMembers.length);
  console.log('Documents:', {
    pitchDeck: !!testPitchData.pitch.documents.pitchDeck,
    whitepaper: !!testPitchData.pitch.documents.whitepaper,
    tokenomics: !!testPitchData.pitch.documents.tokenomics,
    roadmap: !!testPitchData.pitch.documents.roadmap
  });
  console.log('\n⏳ Running analysis...\n');
  
  try {
    const startTime = Date.now();
    const result = await raftai.analyzePitch('test_user_' + Date.now(), testPitchData);
    const processingTime = Date.now() - startTime;
    
    console.log('✅ Analysis Complete!');
    console.log(`⏱️  Processing Time: ${processingTime}ms (${(processingTime / 1000).toFixed(2)}s)\n`);
    
    // Test 3: Verify Analysis Results
    console.log('📋 Test 3: Analysis Results Verification');
    console.log('─────────────────────────────────────');
    
    const checks = {
      'Score exists': typeof result.score === 'number' && result.score >= 0 && result.score <= 100,
      'Viability exists': ['high', 'medium', 'low'].includes(result.viability),
      'Summary exists': typeof result.summary === 'string' && result.summary.length > 0,
      'Recommendations array': Array.isArray(result.recommendations),
      'Risks array': Array.isArray(result.risks),
      'Strengths array': Array.isArray(result.strengths),
      'Next steps array': Array.isArray(result.nextSteps),
      'Executive Summary': !!result.executiveSummary,
      'Findings array': Array.isArray(result.findings),
      'Risk Drivers array': Array.isArray(result.riskDrivers),
      'Comparable Projects': Array.isArray(result.comparableProjects),
      'Market Outlook': !!result.marketOutlook,
      'Tokenomics Review': !!result.tokenomicsReview,
      'Team Analysis': !!result.teamAnalysis,
      'Risk Score': typeof result.riskScore === 'number',
      'Confidence': typeof result.confidence === 'number',
      'Unverifiable Claims': Array.isArray(result.unverifiableClaims)
    };
    
    let allPassed = true;
    for (const [check, passed] of Object.entries(checks)) {
      const status = passed ? '✅' : '❌';
      console.log(`${status} ${check}`);
      if (!passed) allPassed = false;
    }
    
    console.log('\n📊 Analysis Summary:');
    console.log('─────────────────────────────────────');
    console.log(`Score: ${result.score}/100`);
    console.log(`Risk Score: ${result.riskScore || 'N/A'}/100`);
    console.log(`Confidence: ${result.confidence || 'N/A'}%`);
    console.log(`Viability: ${result.viability.toUpperCase()}`);
    console.log(`Rating: ${result.rating || 'N/A'}`);
    console.log(`\nExecutive Summary:\n${result.executiveSummary || result.summary}`);
    console.log(`\nFindings: ${result.findings?.length || 0}`);
    console.log(`Risk Drivers: ${result.riskDrivers?.length || 0}`);
    console.log(`Comparable Projects: ${result.comparableProjects?.length || 0}`);
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
    
    console.log(`\nUnverifiable Claims: ${result.unverifiableClaims?.length || 0}`);
    
    // Test 4: Verify Real-Time Analysis
    console.log('\n📋 Test 4: Real-Time Analysis Verification');
    console.log('─────────────────────────────────────');
    if (isOpenAIEnabled) {
      const isRealTime = processingTime < 60000 && result.findings && result.findings.length > 0;
      console.log(`Real-Time Analysis: ${isRealTime ? '✅ YES' : '⚠️  MAYBE'}`);
      console.log(`Analysis Source: ${result.findings?.length > 0 ? 'OpenAI GPT-4' : 'Simulation'}`);
    } else {
      console.log('Real-Time Analysis: ❌ NO (OpenAI not configured)');
      console.log('Analysis Source: Simulation Mode');
    }
    
    // Test 5: Data Quality Check
    console.log('\n📋 Test 5: Data Quality Check');
    console.log('─────────────────────────────────────');
    const qualityChecks = {
      'Summary length': result.summary.length > 50,
      'Has recommendations': result.recommendations.length > 0,
      'Has risks': result.risks.length > 0,
      'Has strengths': result.strengths.length > 0,
      'Score in valid range': result.score >= 0 && result.score <= 100,
      'Has findings with sources': result.findings?.some((f: any) => f.source && f.timestamp) || false,
      'Has risk drivers with severity': result.riskDrivers?.some((r: any) => r.severity && r.remediation) || false,
      'Team analysis complete': result.teamAnalysis?.members?.length === testPitchData.pitch.teamMembers.length || false
    };
    
    for (const [check, passed] of Object.entries(qualityChecks)) {
      const status = passed ? '✅' : '❌';
      console.log(`${status} ${check}`);
    }
    
    console.log('\n' + '='.repeat(50));
    if (allPassed) {
      console.log('✅ ALL TESTS PASSED - RaftAI is working perfectly!');
    } else {
      console.log('⚠️  SOME TESTS FAILED - Review the results above');
    }
    console.log('='.repeat(50));
    
    return { success: allPassed, result, processingTime };
    
  } catch (error: any) {
    console.error('\n❌ Test Failed with Error:');
    console.error('─────────────────────────────────────');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    return { success: false, error: error.message };
  }
}

// Run test
if (require.main === module) {
  testRaftAI()
    .then((result) => {
      if (result.success) {
        console.log('\n✅ RaftAI test completed successfully!');
        process.exit(0);
      } else {
        console.log('\n❌ RaftAI test failed!');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('\n❌ Fatal error during test:', error);
      process.exit(1);
    });
}

export { testRaftAI, testPitchData };

