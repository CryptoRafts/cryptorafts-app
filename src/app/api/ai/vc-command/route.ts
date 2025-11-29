export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { adminDb as db } from '@/lib/firebase.admin';

export async function POST(request: NextRequest) {
  try {
    // Check if Firebase Admin is available
    if (!db) {
      return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 });
    }

    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const adminAuth = getAuth();
    if (!adminAuth) {
      return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 });
    }
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    if (!decodedToken.role || decodedToken.role !== 'vc') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { sessionId, command, input, context } = await request.json();

    if (!sessionId || !command || !input || !context) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Rate limiting check
    const rateLimitKey = `ai_command_${decodedToken.uid}`;
    const rateLimitDoc = await db.collection('rateLimits').doc(rateLimitKey).get();
    
    if (rateLimitDoc.exists) {
      const rateLimitData = rateLimitDoc.data();
      const now = Date.now();
      const windowStart = now - (60 * 1000); // 1 minute window
      
      if (rateLimitData?.lastRequest && rateLimitData.lastRequest > windowStart) {
        if (rateLimitData.count >= 10) { // 10 requests per minute
          return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
        }
      }
    }

    // Update rate limit
    await db.collection('rateLimits').doc(rateLimitKey).set({
      count: (rateLimitDoc.data()?.count || 0) + 1,
      lastRequest: Date.now()
    }, { merge: true });

    // Process AI command
    const startTime = Date.now();
    let output = '';

    try {
      switch (command) {
        case 'brief':
          output = await generateProjectBrief(JSON.parse(input));
          break;
        case 'risks':
          output = await analyzeProjectRisks(JSON.parse(input));
          break;
        case 'draft':
          output = await draftTermSheet(JSON.parse(input));
          break;
        case 'action-items':
          output = await extractActionItems(JSON.parse(input));
          break;
        case 'decisions':
          output = await summarizeDecisions(JSON.parse(input));
          break;
        case 'translate':
          output = await translateMessage(JSON.parse(input));
          break;
        case 'compliance':
          output = await checkCompliance(JSON.parse(input));
          break;
        case 'redact':
          output = await redactSensitiveInfo(JSON.parse(input));
          break;
        case 'rank':
          output = await rankProjectsByThesis(JSON.parse(input));
          break;
        case 'agenda':
          output = await generateMeetingAgenda(JSON.parse(input));
          break;
        case 'checklist':
          output = await generateDueDiligenceChecklist(JSON.parse(input));
          break;
        case 'trends':
          output = await analyzeMarketTrends(JSON.parse(input));
          break;
        default:
          throw new Error(`Unknown command: ${command}`);
      }
    } catch (error) {
      console.error('AI command processing error:', error);
      throw error;
    }

    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      output,
      processingTime
    });

  } catch (error) {
    console.error('AI command API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// AI Command Implementations

async function generateProjectBrief(data: any): Promise<string> {
  const { project } = data;
  
  return `# Project Brief: ${project.title}

## Overview
${project.description || 'No description available'}

## Key Details
- **Sector**: ${project.sector}
- **Chain**: ${project.chain}
- **Stage**: ${project.stage}
- **Value Proposition**: ${project.valueProp}

## Team
${project.team?.map((member: any) => `- ${member.name}: ${member.role}`).join('\n') || 'No team information available'}

## Traction
${project.traction ? `
- Users: ${project.traction.users || 'N/A'}
- Revenue: ${project.traction.revenue ? `$${project.traction.revenue.toLocaleString()}` : 'N/A'}
- Partnerships: ${project.traction.partnerships?.length || 0}
` : 'No traction data available'}

## RaftAI Analysis
${project.raftai ? `
- Rating: ${project.raftai.rating}
- Score: ${project.raftai.score}/100
- Summary: ${project.raftai.summary}
- Risks: ${project.raftai.risks?.map((risk: any) => `- ${risk.description} (${risk.severity})`).join('\n') || 'None identified'}
` : 'No AI analysis available'}

## Recommendation
Based on the available information, this project shows ${project.raftai?.rating === 'High' ? 'strong potential' : project.raftai?.rating === 'Normal' ? 'moderate potential' : 'limited potential'} for investment consideration.`;
}

async function analyzeProjectRisks(data: any): Promise<string> {
  const { project } = data;
  
  const risks = [
    {
      category: 'Market Risk',
      severity: 'Medium',
      description: 'Competitive landscape and market saturation concerns',
      mitigation: 'Conduct thorough market analysis and competitive positioning review'
    },
    {
      category: 'Technical Risk',
      severity: 'High',
      description: 'Blockchain technology complexity and scalability challenges',
      mitigation: 'Review technical architecture and scalability roadmap'
    },
    {
      category: 'Regulatory Risk',
      severity: 'High',
      description: 'Evolving regulatory environment for blockchain projects',
      mitigation: 'Ensure compliance with current and anticipated regulations'
    },
    {
      category: 'Team Risk',
      severity: 'Medium',
      description: 'Team experience and execution capability',
      mitigation: 'Verify team credentials and track record'
    },
    {
      category: 'Tokenomics Risk',
      severity: 'Medium',
      description: 'Token distribution and economic model sustainability',
      mitigation: 'Review tokenomics model and vesting schedules'
    }
  ];

  return `# Risk Analysis: ${project.title}

## Identified Risks

${risks.map(risk => `
### ${risk.category} (${risk.severity})
**Description**: ${risk.description}
**Mitigation**: ${risk.mitigation}
`).join('\n')}

## Risk Assessment Summary
- **High Risk**: ${risks.filter(r => r.severity === 'High').length} items
- **Medium Risk**: ${risks.filter(r => r.severity === 'Medium').length} items
- **Low Risk**: ${risks.filter(r => r.severity === 'Low').length} items

## Recommendations
1. Conduct thorough due diligence on high-risk areas
2. Request additional documentation and clarifications
3. Consider staged investment approach
4. Implement regular monitoring and reporting requirements`;
}

async function draftTermSheet(data: any): Promise<string> {
  const { project, dealTerms } = data;
  
  return `# Term Sheet: ${project.title}

## Investment Terms
- **Investment Amount**: $${dealTerms.amount.toLocaleString()}
- **Pre-Money Valuation**: $${dealTerms.valuation.toLocaleString()}
- **Post-Money Valuation**: $${(dealTerms.valuation + dealTerms.amount).toLocaleString()}
- **Equity Percentage**: ${dealTerms.equity}%
- **Vesting Schedule**: ${dealTerms.vesting || 'Standard 4-year vesting with 1-year cliff'}

## Key Terms
- **Investment Structure**: SAFE (Simple Agreement for Future Equity)
- **Liquidation Preference**: 1x non-participating
- **Anti-Dilution**: Weighted average
- **Board Composition**: 2 founders, 1 investor, 1 independent
- **Information Rights**: Monthly financial reports, annual audited statements
- **Pro Rata Rights**: Right to participate in future rounds

## Conditions Precedent
- Completion of due diligence
- Execution of definitive agreements
- Regulatory approvals (if required)
- Key personnel employment agreements

## Timeline
- **Term Sheet Execution**: [Date]
- **Due Diligence Period**: 30 days
- **Closing**: 45 days from term sheet execution

## Additional Rights
${dealTerms.rights?.map((right: string) => `- ${right}`).join('\n') || '- Standard investor rights'}

---
*This term sheet is non-binding except for exclusivity and confidentiality provisions.*`;
}

async function extractActionItems(data: any): Promise<string> {
  const { messages } = data;
  
  // Simple extraction logic - in production, this would use more sophisticated NLP
  const actionItems = [
    {
      item: 'Review technical documentation',
      assignee: 'Technical Team',
      dueDate: 'Next week',
      priority: 'High'
    },
    {
      item: 'Schedule follow-up meeting',
      assignee: 'Investment Team',
      dueDate: 'This week',
      priority: 'Medium'
    },
    {
      item: 'Prepare due diligence checklist',
      assignee: 'Legal Team',
      dueDate: 'Next week',
      priority: 'High'
    }
  ];

  return `# Action Items

${actionItems.map((item, index) => `
## ${index + 1}. ${item.item}
- **Assignee**: ${item.assignee}
- **Due Date**: ${item.dueDate}
- **Priority**: ${item.priority}
`).join('\n')}

## Summary
- **Total Items**: ${actionItems.length}
- **High Priority**: ${actionItems.filter(i => i.priority === 'High').length}
- **Medium Priority**: ${actionItems.filter(i => i.priority === 'Medium').length}
- **Low Priority**: ${actionItems.filter(i => i.priority === 'Low').length}`;
}

async function summarizeDecisions(data: any): Promise<string> {
  const { messages } = data;
  
  return `# Meeting Decisions Summary

## Key Decisions Made
1. **Investment Decision**: Proceed with due diligence phase
2. **Timeline**: Target closing within 45 days
3. **Due Diligence Scope**: Technical, legal, and financial review
4. **Next Steps**: Schedule technical deep dive session

## Action Items
- Technical team to review architecture
- Legal team to prepare term sheet
- Financial team to analyze projections

## Follow-up Required
- Schedule technical review meeting
- Prepare due diligence materials
- Coordinate with founder team

## Status
- **Current Phase**: Due Diligence
- **Next Milestone**: Technical Review
- **Target Date**: [Date]`;
}

async function translateMessage(data: any): Promise<string> {
  const { message, targetLanguage } = data;
  
  // Simple translation logic - in production, this would use a translation service
  const translations: Record<string, string> = {
    'es': 'Hola, este es un mensaje de prueba traducido al español.',
    'fr': 'Bonjour, ceci est un message de test traduit en français.',
    'de': 'Hallo, dies ist eine Testnachricht ins Deutsche übersetzt.',
    'ja': 'こんにちは、これは日本語に翻訳されたテストメッセージです。',
    'zh': '你好，这是翻译成中文的测试消息。'
  };

  return translations[targetLanguage] || `Translation to ${targetLanguage}: ${message}`;
}

async function checkCompliance(data: any): Promise<string> {
  const { project } = data;
  
  return `# Compliance Check: ${project.title}

## Regulatory Compliance
- **Securities Law**: Review required for token distribution
- **AML/KYC**: Ensure proper identity verification
- **Tax Implications**: Consider tax treatment of tokens
- **Jurisdictional Issues**: Verify compliance in target markets

## Recommendations
1. Consult with legal counsel on securities law compliance
2. Implement robust AML/KYC procedures
3. Review tax implications with tax advisor
4. Ensure compliance with target market regulations

## Risk Assessment
- **Compliance Risk**: Medium
- **Regulatory Risk**: High
- **Legal Risk**: Medium

## Next Steps
- Engage legal counsel for compliance review
- Prepare compliance documentation
- Implement compliance monitoring procedures`;
}

async function redactSensitiveInfo(data: any): Promise<string> {
  const { content } = data;
  
  // Simple redaction logic - in production, this would use more sophisticated NLP
  const redactedContent = content
    .replace(/\b\d{4}-\d{4}-\d{4}-\d{4}\b/g, '[REDACTED CARD NUMBER]')
    .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[REDACTED SSN]')
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[REDACTED EMAIL]')
    .replace(/\b\d{3}-\d{3}-\d{4}\b/g, '[REDACTED PHONE]');

  return redactedContent;
}

async function rankProjectsByThesis(data: any): Promise<string> {
  const { organization, projects } = data;
  
  const rankings = projects.map((project: any, index: number) => ({
    projectId: project.id,
    score: Math.floor(Math.random() * 40) + 60, // Random score between 60-100
    reasoning: `Strong alignment with ${organization.thesis.sectors.join(', ')} focus areas`
  }));

  return JSON.stringify(rankings);
}

async function generateMeetingAgenda(data: any): Promise<string> {
  const { project, meetingType } = data;
  
  return `# Meeting Agenda: ${project.title}

## Meeting Type: ${meetingType.replace('_', ' ').toUpperCase()}

## Agenda Items
1. **Project Overview** (10 minutes)
   - Company introduction
   - Problem statement and solution
   - Market opportunity

2. **Technical Deep Dive** (20 minutes)
   - Architecture overview
   - Technology stack
   - Scalability considerations

3. **Business Model** (15 minutes)
   - Revenue streams
   - Go-to-market strategy
   - Competitive positioning

4. **Financial Review** (15 minutes)
   - Financial projections
   - Funding requirements
   - Use of funds

5. **Q&A Session** (20 minutes)
   - Open discussion
   - Clarifications
   - Next steps

## Preparation Required
- Review project documentation
- Prepare technical questions
- Analyze financial projections
- Research competitive landscape

## Expected Outcomes
- Understanding of project fundamentals
- Identification of key risks and opportunities
- Decision on next steps in investment process`;
}

async function generateDueDiligenceChecklist(data: any): Promise<string> {
  const { project } = data;
  
  return `# Due Diligence Checklist: ${project.title}

## Technical Due Diligence
- [ ] Code review and architecture assessment
- [ ] Security audit and penetration testing
- [ ] Scalability and performance testing
- [ ] Technology stack evaluation
- [ ] Intellectual property review

## Business Due Diligence
- [ ] Market analysis and competitive landscape
- [ ] Business model validation
- [ ] Customer and user research
- [ ] Partnership and distribution channels
- [ ] Regulatory compliance review

## Financial Due Diligence
- [ ] Financial statements and projections
- [ ] Revenue model and pricing strategy
- [ ] Cost structure and unit economics
- [ ] Funding history and cap table
- [ ] Tax and accounting compliance

## Legal Due Diligence
- [ ] Corporate structure and governance
- [ ] Contracts and agreements
- [ ] Intellectual property rights
- [ ] Regulatory compliance
- [ ] Litigation and legal issues

## Team Due Diligence
- [ ] Founder and team background checks
- [ ] Reference checks and testimonials
- [ ] Skills and experience assessment
- [ ] Equity and compensation structure
- [ ] Key personnel retention plans

## Risk Assessment
- [ ] Market and competitive risks
- [ ] Technical and operational risks
- [ ] Financial and liquidity risks
- [ ] Regulatory and legal risks
- [ ] Team and execution risks`;
}

async function analyzeMarketTrends(data: any): Promise<string> {
  const { sector, chain } = data;
  
  return `# Market Trends Analysis: ${sector} on ${chain}

## Current Market Conditions
- **Market Size**: Growing rapidly with increasing adoption
- **Competition**: Intense with new entrants regularly
- **Regulation**: Evolving with increasing clarity
- **Technology**: Advancing with new innovations

## Key Trends
1. **Adoption Growth**: Increasing mainstream adoption
2. **Institutional Interest**: Growing institutional investment
3. **Regulatory Clarity**: Improving regulatory framework
4. **Technology Innovation**: Continuous technological advancement

## Opportunities
- Early mover advantage in emerging markets
- Partnership opportunities with established players
- Innovation in user experience and accessibility
- Regulatory compliance and security focus

## Risks
- Market volatility and regulatory uncertainty
- Competition from established players
- Technology obsolescence risk
- Regulatory changes and compliance costs

## Investment Implications
- Focus on projects with strong fundamentals
- Consider regulatory compliance and security
- Evaluate competitive positioning and differentiation
- Assess team capability and execution track record`;
}

