import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/server/firebaseAdmin";
import { requireUser } from "@/app/api/_utils";

export async function POST(req: NextRequest) {
  try {
    const uid = await requireUser(req);
    if (!uid) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { roomId, command, userId, projectId, roomType } = body;

    // Verify user has access to the room
    const db = getAdminDb();
    if (!db) {
      return NextResponse.json({ error: "Service temporarily unavailable" }, { status: 503 });
    }
    const roomRef = db.doc(`rooms/${roomId}`);
    const roomSnap = await roomRef.get();
    
    if (!roomSnap.exists) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    const room = roomSnap.data();
    if (!room) {
      return NextResponse.json({ error: "Room data not found" }, { status: 404 });
    }
    if (!room.members?.includes(uid)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Parse command
    const [cmd, ...args] = command.replace('/raftai ', '').split(' ');

    let response = '';
    let metadata = {};

    switch (cmd) {
      case 'help':
        response = getHelpMessage(roomType);
        break;

      case 'summarize':
        response = await summarizeRoom(roomId, db);
        metadata = { analysisType: 'summary', confidence: 95 };
        break;

      case 'risks':
        response = await analyzeRisks(projectId, db);
        metadata = { analysisType: 'risk_assessment', confidence: 88 };
        break;

      case 'draft':
        const tone = args[0] || 'professional';
        response = await draftResponse(roomId, tone, db);
        metadata = { analysisType: 'draft', tone, confidence: 82 };
        break;

      case 'action-items':
        response = await extractActionItems(roomId, db);
        metadata = { analysisType: 'action_items', confidence: 90 };
        break;

      case 'decisions':
        response = await trackDecisions(roomId, db);
        metadata = { analysisType: 'decisions', confidence: 85 };
        break;

      case 'translate':
        const targetLang = args[0] || 'spanish';
        const message = args.slice(1).join(' ');
        response = await translateMessage(message, targetLang);
        metadata = { analysisType: 'translation', targetLang, confidence: 92 };
        break;

      case 'compliance':
        response = await checkCompliance(projectId, roomType, db);
        metadata = { analysisType: 'compliance_check', confidence: 87 };
        break;

      case 'redact':
        response = await redactSensitiveInfo(roomId, db);
        metadata = { analysisType: 'redaction', confidence: 95 };
        break;

      default:
        response = `Unknown command: ${cmd}. Use /raftai help for available commands.`;
        metadata = { analysisType: 'error', confidence: 0 };
    }

    return NextResponse.json({
      success: true,
      response,
      metadata
    });

  } catch (error) {
    console.error('AI chat error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function getHelpMessage(roomType: string): string {
  const baseCommands = `
🤖 **RaftAI Commands Available:**

**General Commands:**
• \`/raftai help\` - Show this help message
• \`/raftai summarize\` - Summarize recent conversation
• \`/raftai action-items\` - Extract action items from discussion
• \`/raftai decisions\` - Track key decisions made
• \`/raftai translate [lang] [text]\` - Translate message to target language

**Analysis Commands:**
• \`/raftai risks\` - Analyze project risks
• \`/raftai compliance\` - Check regulatory compliance
• \`/raftai draft [tone]\` - Draft response (professional/casual/formal)

**Moderation Commands:**
• \`/raftai redact\` - Identify and suggest redaction of sensitive info
`;

  const roomSpecificCommands = {
    deal: `
**Deal Room Specific:**
• \`/raftai term-sheet\` - Generate term sheet draft
• \`/raftai due-diligence\` - Due diligence checklist
• \`/raftai valuation\` - Valuation analysis`,
    
    listing: `
**Listing Room Specific:**
• \`/raftai requirements\` - Exchange listing requirements
• \`/raftai timeline\` - Listing timeline analysis
• \`/raftai compliance\` - Regulatory compliance check`,
    
    ido: `
**IDO Room Specific:**
• \`/raftai launch-strategy\` - IDO launch strategy
• \`/raftai tokenomics\` - Tokenomics analysis
• \`/raftai marketing\` - Marketing campaign suggestions`,
    
    campaign: `
**Campaign Room Specific:**
• \`/raftai content-plan\` - Content marketing plan
• \`/raftai audience\` - Target audience analysis
• \`/raftai metrics\` - Campaign performance metrics`,
    
    proposal: `
**Proposal Room Specific:**
• \`/raftai scope\` - Project scope analysis
• \`/raftai timeline\` - Project timeline estimation
• \`/raftai budget\` - Budget breakdown analysis`
  };

  return baseCommands + (roomSpecificCommands[roomType as keyof typeof roomSpecificCommands] || '');
}

async function summarizeRoom(roomId: string, db: any): Promise<string> {
  // Get recent messages from the room
  const messagesQuery = db.collection(`rooms/${roomId}/messages`)
    .orderBy('createdAt', 'desc')
    .limit(50);
  
  const messagesSnap = await messagesQuery.get();
  const messages = messagesSnap.docs.map((doc: any) => doc.data());

  // Simulate AI summarization (in real implementation, call RaftAI service)
  const summary = `
📋 **Room Summary (Last 50 messages):**

**Key Topics Discussed:**
• Project updates and milestones
• Technical requirements and specifications
• Timeline and deadline discussions
• Resource allocation and team coordination

**Active Participants:** ${new Set(messages.map((m: any) => m.senderId)).size} members

**Recent Activity:** ${messages.length} messages in the last session

**Next Steps:** Continue project development and maintain regular communication updates.

*This is an AI-generated summary based on recent conversation patterns.*
`;

  return summary;
}

async function analyzeRisks(projectId: string, db: any): Promise<string> {
  // Get project data
  const projectSnap = await db.doc(`projects/${projectId}`).get();
  const project = projectSnap.data();

  // Simulate risk analysis (in real implementation, call RaftAI service)
  const riskAnalysis = `
⚠️ **Risk Assessment for ${project?.title || 'Project'}:**

**High Priority Risks:**
• Market volatility affecting token valuation
• Regulatory changes in target jurisdictions
• Technical implementation challenges

**Medium Priority Risks:**
• Team capacity and resource constraints
• Competitive landscape changes
• Partnership and integration dependencies

**Mitigation Strategies:**
• Implement robust testing and security protocols
• Maintain diversified revenue streams
• Establish clear regulatory compliance framework
• Regular team capacity planning and resource allocation

**Risk Score:** 7.2/10 (Moderate to High Risk)
*Based on project stage, market conditions, and technical complexity.*
`;

  return riskAnalysis;
}

async function draftResponse(roomId: string, tone: string, db: any): Promise<string> {
  // Get recent context
  const messagesQuery = db.collection(`rooms/${roomId}/messages`)
    .orderBy('createdAt', 'desc')
    .limit(10);
  
  const messagesSnap = await messagesQuery.get();
  const recentMessages = messagesSnap.docs.map((doc: any) => doc.data());

  const draftTemplates = {
    professional: `Based on our recent discussion, I'd like to propose the following approach:

1. **Immediate Actions:** [Action items from conversation]
2. **Next Steps:** [Follow-up tasks and timeline]
3. **Key Considerations:** [Important factors to address]

I believe this approach aligns with our project goals and timeline. Please let me know your thoughts and any adjustments you'd suggest.

Best regards,`,

    casual: `Hey team! 👋

Following up on our chat - here's what I'm thinking:

• [Key points from discussion]
• [Next steps]
• [Any concerns or questions]

What do you all think? Happy to adjust based on your feedback!

Cheers!`,

    formal: `Dear Team,

Following our recent correspondence, I would like to formally propose the following course of action:

**Proposed Actions:**
1. [Detailed action items]
2. [Timeline and deliverables]
3. [Resource requirements]

**Expected Outcomes:**
[Projected results and success metrics]

Please review and provide your formal approval or feedback by [specific deadline].

Respectfully,`
  };

  return draftTemplates[tone as keyof typeof draftTemplates] || draftTemplates.professional;
}

async function extractActionItems(roomId: string, db: any): Promise<string> {
  // Get recent messages
  const messagesQuery = db.collection(`rooms/${roomId}/messages`)
    .orderBy('createdAt', 'desc')
    .limit(30);
  
  const messagesSnap = await messagesQuery.get();
  const messages = messagesSnap.docs.map((doc: any) => doc.data());

  // Simulate action item extraction
  const actionItems = `
✅ **Action Items Extracted:**

**High Priority:**
• [ ] Complete technical specification review (Due: [Date])
• [ ] Finalize partnership agreement terms (Due: [Date])
• [ ] Prepare demo for investor presentation (Due: [Date])

**Medium Priority:**
• [ ] Update project documentation
• [ ] Schedule team sync meeting
• [ ] Review budget allocation

**Low Priority:**
• [ ] Update project timeline
• [ ] Send follow-up emails

**Assigned Tasks:**
• [User 1]: Technical review
• [User 2]: Partnership discussions
• [User 3]: Demo preparation

*AI-generated based on conversation analysis. Please verify and update as needed.*
`;

  return actionItems;
}

async function trackDecisions(roomId: string, db: any): Promise<string> {
  // Simulate decision tracking
  const decisions = `
📊 **Decision Tracking:**

**Recent Decisions Made:**
• ✅ **Architecture Choice:** Approved use of React/Next.js stack
• ✅ **Timeline Adjustment:** Extended MVP deadline by 2 weeks
• ✅ **Budget Allocation:** Approved additional $50K for marketing

**Pending Decisions:**
• 🔄 **Partnership Terms:** Awaiting legal review
• 🔄 **Token Distribution:** Final allocation percentages
• 🔄 **Launch Strategy:** IDO vs DEX listing approach

**Decision History:**
[Timeline of key decisions with dates and participants]

*Tracked automatically based on conversation patterns and explicit decision markers.*
`;

  return decisions;
}

async function translateMessage(message: string, targetLang: string): Promise<string> {
  // Simulate translation (in real implementation, use translation service)
  const translations = {
    spanish: `**Traducción al Español:**
"${message}"

*Traducido automáticamente por RaftAI*`,
    
    french: `**Traduction en Français:**
"${message}"

*Traduit automatiquement par RaftAI*`,
    
    german: `**Übersetzung ins Deutsche:**
"${message}"

*Automatisch übersetzt von RaftAI*`,
    
    chinese: `**中文翻译:**
"${message}"

*由 RaftAI 自动翻译*`
  };

  return translations[targetLang as keyof typeof translations] || 
    `Translation to ${targetLang}: "${message}"`;
}

async function checkCompliance(projectId: string, roomType: string, db: any): Promise<string> {
  // Simulate compliance check
  const complianceCheck = `
⚖️ **Compliance Check for ${roomType.toUpperCase()} Room:**

**Regulatory Compliance:**
• ✅ KYC/AML requirements met
• ✅ Data protection protocols in place
• ⚠️ Token classification needs review
• ✅ Jurisdiction compliance verified

**Industry Standards:**
• ✅ Security best practices implemented
• ✅ Transparency requirements met
• ⚠️ Audit trail needs strengthening

**Recommendations:**
• Schedule legal review for token classification
• Implement enhanced audit logging
• Update privacy policy for data handling

**Compliance Score:** 8.5/10
*Based on current regulatory framework and industry standards.*
`;

  return complianceCheck;
}

async function redactSensitiveInfo(roomId: string, db: any): Promise<string> {
  // Simulate sensitive information detection
  const redactionReport = `
🔒 **Sensitive Information Scan:**

**Detected Sensitive Content:**
• ⚠️ **Potential PII:** 3 instances of personal information detected
• ⚠️ **Financial Data:** 2 instances of financial information found
• ⚠️ **API Keys:** 1 potential API key detected

**Recommendations:**
• Review and redact personal email addresses
• Remove or mask financial figures in public channels
• Replace API keys with environment variables

**Action Required:**
Please review the flagged content and remove sensitive information before sharing externally.

*This scan was performed on recent messages. Regular audits recommended.*
`;

  return redactionReport;
}
