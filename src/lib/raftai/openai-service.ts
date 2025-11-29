/**
 * RaftAI OpenAI Integration Service
 * Real AI-powered analysis using OpenAI GPT models
 */

import OpenAI from 'openai';

class OpenAIService {
  private static instance: OpenAIService;
  private client: OpenAI | null = null;
  private enabled: boolean = false;

  private constructor() {
    this.initialize();
  }

  private initialize() {
    // Check both server-side (process.env) and client-side (window) for API key
    let apiKey = process.env.OPENAI_API_KEY;
    
    // For client-side, check if API key is available in environment
    if (typeof window !== 'undefined' && !apiKey) {
      // Client-side: API key should be in environment variables at build time
      // or passed via server-side rendering
      apiKey = (window as any).__OPENAI_API_KEY__;
    }
    
    // Also check NEXT_PUBLIC_OPENAI_API_KEY for client-side access (if needed)
    if (!apiKey) {
      apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    }
    
    if (apiKey && apiKey.length > 20 && apiKey.startsWith('sk-')) {
      try {
        this.client = new OpenAI({
          apiKey: apiKey,
        });
        this.enabled = true;
        console.log('✅ OpenAI Service: Initialized successfully with API key');
      } catch (error) {
        console.error('❌ OpenAI Service: Initialization failed:', error);
        this.enabled = false;
      }
    } else {
      if (apiKey) {
        console.warn('⚠️ OpenAI Service: API key format invalid (should start with sk-)');
      } else {
        console.warn('⚠️ OpenAI Service: API key not configured (OPENAI_API_KEY or NEXT_PUBLIC_OPENAI_API_KEY)');
      }
      this.enabled = false;
    }
  }

  static getInstance(): OpenAIService {
    if (!OpenAIService.instance) {
      OpenAIService.instance = new OpenAIService();
    }
    return OpenAIService.instance;
  }

  isEnabled(): boolean {
    return this.enabled && this.client !== null;
  }

  /**
   * Comprehensive Real-Time Due-Diligence Analysis with GPT-4
   * Analyzes pitch deck, whitepaper, smart contracts, all docs, team, market, tokenomics
   */
  async analyzePitchWithAI(pitchData: any): Promise<{
    executiveSummary: string; // 2-line executive summary
    findings: Array<{
      category: string;
      finding: string;
      source: string;
      timestamp: string;
      evidence: string;
    }>;
    riskDrivers: Array<{
      risk: string;
      severity: 'high' | 'medium' | 'low';
      remediation: string;
      evidence: string;
    }>;
    comparableProjects: Array<{
      project: string;
      similarity: string;
      marketPosition: string;
    }>;
    marketOutlook: {
      narrative: string;
      marketFit: 'excellent' | 'good' | 'moderate' | 'poor';
      trends: string[];
      opportunity: string;
    };
    tokenomicsReview: {
      assessment: string;
      strengths: string[];
      concerns: string[];
      recommendations: string[];
    };
    teamAnalysis: {
      overall: string;
      members: Array<{
        name: string;
        role: string;
        linkedinVerified: boolean;
        credibility: string;
        flags: string[];
      }>;
      linkedinLinks: string[];
    };
    auditHistory: {
      status: string;
      findings: string[];
      links: string[];
    };
    onChainActivity: {
      status: string;
      findings: string[];
      addresses: string[];
    };
    riskScore: number; // 1-100
    confidence: number; // 0-100
    unverifiableClaims: string[];
    summary: string;
    strengths: string[];
    risks: string[];
    recommendations: string[];
    score: number;
    rating: 'high' | 'normal' | 'low';
  }> {
    if (!this.isEnabled()) {
      throw new Error('OpenAI service not available');
    }

    // Extract all available data
    const documents = pitchData.pitch?.documents || pitchData.documents || {};
    const teamMembers = pitchData.pitch?.teamMembers || pitchData.teamMembers || pitchData.team || [];
    const tokenomics = pitchData.pitch?.tokenomics || pitchData.tokenomics || {};
    const problem = pitchData.pitch?.problem || pitchData.problem || '';
    const solution = pitchData.pitch?.solution || pitchData.solution || '';
    const marketSize = pitchData.pitch?.marketSize || pitchData.marketSize || '';
    const competitiveAdvantage = pitchData.pitch?.competitiveAdvantage || pitchData.competitiveAdvantage || '';
    const description = pitchData.description || pitchData.projectDescription || pitchData.pitch?.projectDescription || '';

    // Build comprehensive prompt for real-time due-diligence
    const currentDate = new Date().toISOString();
    const prompt = `You are RaftAI, an expert Web3 investment analyst performing COMPLETE REAL-TIME DUE-DILIGENCE analysis. 
Current Date/Time: ${currentDate}
Analyze this project with 100% accuracy, citing sources and providing evidence for all claims. This is REAL-TIME analysis - use current market data and trends.

PROJECT INFORMATION:
Title: ${pitchData.title || pitchData.projectName || pitchData.name || 'N/A'}
Description: ${description}
Problem Statement: ${problem}
Solution: ${solution}
Target Market: ${pitchData.pitch?.targetAudience || pitchData.targetAudience || 'N/A'}
Market Size: ${marketSize}
Competitive Advantage: ${competitiveAdvantage}
Sector: ${pitchData.sector || pitchData.pitch?.sector || 'N/A'}
Chain: ${pitchData.chain || pitchData.pitch?.chain || 'N/A'}
Stage: ${pitchData.stage || pitchData.pitch?.stage || 'N/A'}
Funding Goal: $${pitchData.fundingGoal || pitchData.pitch?.fundingGoal || 'Not specified'}

DOCUMENTS PROVIDED:
${documents.pitchDeck ? `✓ Pitch Deck: ${typeof documents.pitchDeck === 'string' ? documents.pitchDeck : documents.pitchDeck.url || documents.pitchDeck.downloadURL || 'Available'}` : '✗ Pitch Deck: Missing'}
${documents.whitepaper ? `✓ Whitepaper: ${typeof documents.whitepaper === 'string' ? documents.whitepaper : documents.whitepaper.url || documents.whitepaper.downloadURL || 'Available'}` : '✗ Whitepaper: Missing'}
${documents.tokenomics ? `✓ Tokenomics: ${typeof documents.tokenomics === 'string' ? documents.tokenomics : documents.tokenomics.url || documents.tokenomics.downloadURL || 'Available'}` : '✗ Tokenomics: Missing'}
${documents.roadmap ? `✓ Roadmap: ${typeof documents.roadmap === 'string' ? documents.roadmap : documents.roadmap.url || documents.roadmap.downloadURL || 'Available'}` : '✗ Roadmap: Missing'}

TOKENOMICS DATA:
${JSON.stringify(tokenomics, null, 2)}

TEAM MEMBERS (${teamMembers.length}):
${teamMembers.map((member: any, idx: number) => `
${idx + 1}. Name: ${member.name || member.fullName || 'N/A'}
   Role: ${member.role || member.position || member.title || 'N/A'}
   LinkedIn: ${member.linkedin || member.linkedIn || 'Not provided'}
   Twitter: ${member.twitter || 'Not provided'}
   Bio: ${member.bio || member.description || 'Not provided'}
`).join('')}

PERFORM COMPREHENSIVE ANALYSIS:

1. EXECUTIVE SUMMARY (2 lines max):
   Provide a concise 2-line summary of the project's viability and key investment thesis.

2. FINDINGS WITH SOURCES:
   Analyze all documents, team members, tokenomics, problem-solution fit, market opportunity.
   For each finding, provide:
   - Category (Document Analysis, Team Verification, Tokenomics, Market Analysis, etc.)
   - Finding description
   - Source (which document/section, LinkedIn profile, etc.)
   - Timestamp (current date/time)
   - Evidence (specific quotes, data points, links)

3. RISK DRIVERS & REMEDIATION:
   Identify all risks with:
   - Risk description
   - Severity (high/medium/low)
   - Remediation steps
   - Evidence supporting the risk

4. COMPARABLE PROJECTS & MARKET OUTLOOK:
   - List 3-5 comparable projects in the same sector
   - Explain similarity and market position
   - Provide market narrative
   - Assess market fit (excellent/good/moderate/poor)
   - Current market trends affecting this project
   - Market opportunity assessment

5. TOKENOMICS REVIEW:
   - Overall assessment
   - Strengths
   - Concerns
   - Recommendations

6. TEAM ANALYSIS:
   - Overall team assessment (strengths, gaps, experience level)
   - For each team member:
     * Verify LinkedIn profile URL format (if provided - note: cannot access external URLs, but verify format)
     * Assess credibility based on role, bio, experience mentioned
     * Flag any concerns (missing LinkedIn, vague bio, etc.)
   - List all LinkedIn links provided
   - Assess team completeness for the project stage

7. AUDIT HISTORY:
   - Check if any audit information is mentioned in the provided data
   - Status (if any audits mentioned in documents/description)
   - Findings from mentioned audits
   - Links to audit reports (if mentioned in data)

8. ON-CHAIN ACTIVITY:
   - Check if any on-chain activity, smart contracts, or blockchain addresses are mentioned
   - Status (if any on-chain activity mentioned in documents/description)
   - Findings from mentioned on-chain activity
   - Contract addresses (if mentioned in the provided data)

9. RISK SCORE (1-100):
   Calculate comprehensive risk score based on:
   - Document completeness and quality
   - Team credibility and experience
   - Tokenomics sustainability
   - Market fit and competition
   - Problem-solution validation
   - Technical feasibility
   - Regulatory compliance
   - Execution risk

10. CONFIDENCE LEVEL (0-100):
    Based on data completeness and verifiability

11. UNVERIFIABLE CLAIMS:
    List any claims that cannot be verified with provided sources

12. STRENGTHS, RISKS, RECOMMENDATIONS:
    Comprehensive lists based on full analysis

Provide response as JSON with this exact structure:
{
  "executiveSummary": "2-line summary",
  "findings": [{"category": "...", "finding": "...", "source": "...", "timestamp": "...", "evidence": "..."}],
  "riskDrivers": [{"risk": "...", "severity": "high|medium|low", "remediation": "...", "evidence": "..."}],
  "comparableProjects": [{"project": "...", "similarity": "...", "marketPosition": "..."}],
  "marketOutlook": {
    "narrative": "...",
    "marketFit": "excellent|good|moderate|poor",
    "trends": ["..."],
    "opportunity": "..."
  },
  "tokenomicsReview": {
    "assessment": "...",
    "strengths": ["..."],
    "concerns": ["..."],
    "recommendations": ["..."]
  },
  "teamAnalysis": {
    "overall": "...",
    "members": [{"name": "...", "role": "...", "linkedinVerified": true/false, "credibility": "...", "flags": ["..."]}],
    "linkedinLinks": ["..."]
  },
  "auditHistory": {
    "status": "...",
    "findings": ["..."],
    "links": ["..."]
  },
  "onChainActivity": {
    "status": "...",
    "findings": ["..."],
    "addresses": ["..."]
  },
  "riskScore": <number 1-100>,
  "confidence": <number 0-100>,
  "unverifiableClaims": ["..."],
  "summary": "Overall summary",
  "strengths": ["..."],
  "risks": ["..."],
  "recommendations": ["..."],
  "score": <number 0-100>,
  "rating": "high|normal|low"
}

Prioritize accuracy. Cite specific sources. Use current date/time for timestamps. Be thorough and professional.`;

    try {
      const response = await this.client!.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are RaftAI, a Web3 investment intelligence system performing real-time due-diligence. Always respond with valid JSON only, no markdown formatting. Be thorough, accurate, and cite sources.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2, // Very low temperature for maximum accuracy and consistency
        max_tokens: 6000, // Increased for comprehensive detailed analysis
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('Empty response from OpenAI');
      }

      let analysis;
      try {
        // Try to parse JSON - handle cases where response might have markdown code blocks
        let jsonContent = content.trim();
        if (jsonContent.startsWith('```json')) {
          jsonContent = jsonContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (jsonContent.startsWith('```')) {
          jsonContent = jsonContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }
        analysis = JSON.parse(jsonContent);
      } catch (parseError: any) {
        console.error('❌ RaftAI: Failed to parse OpenAI response as JSON:', parseError);
        console.error('Raw response (first 1000 chars):', content.substring(0, 1000));
        throw new Error(`Invalid JSON response from OpenAI: ${parseError.message}`);
      }
      
      // Validate critical fields and calculate missing ones
      if (analysis.score === undefined || analysis.score === null) {
        if (analysis.riskScore !== undefined && analysis.riskScore !== null) {
          analysis.score = Math.max(0, Math.min(100, 100 - analysis.riskScore));
          console.warn('⚠️ RaftAI: Calculated score from riskScore:', analysis.score);
        } else {
          analysis.score = 50;
          console.warn('⚠️ RaftAI: Missing score, using default: 50');
        }
      }
      
      if (analysis.riskScore === undefined || analysis.riskScore === null) {
        if (analysis.score !== undefined && analysis.score !== null) {
          analysis.riskScore = Math.max(0, Math.min(100, 100 - analysis.score));
          console.warn('⚠️ RaftAI: Calculated riskScore from score:', analysis.riskScore);
        } else {
          analysis.riskScore = 50;
          console.warn('⚠️ RaftAI: Missing riskScore, using default: 50');
        }
      }
      
      // Ensure all required fields exist with defaults
      return {
        executiveSummary: analysis.executiveSummary || analysis.summary || 'Analysis completed',
        findings: analysis.findings || [],
        riskDrivers: analysis.riskDrivers || [],
        comparableProjects: analysis.comparableProjects || [],
        marketOutlook: analysis.marketOutlook || {
          narrative: analysis.summary || '',
          marketFit: 'moderate',
          trends: [],
          opportunity: ''
        },
        tokenomicsReview: analysis.tokenomicsReview || {
          assessment: '',
          strengths: [],
          concerns: [],
          recommendations: []
        },
        teamAnalysis: analysis.teamAnalysis || {
          overall: '',
          members: [],
          linkedinLinks: []
        },
        auditHistory: analysis.auditHistory || {
          status: 'Not provided',
          findings: [],
          links: []
        },
        onChainActivity: analysis.onChainActivity || {
          status: 'Not provided',
          findings: [],
          addresses: []
        },
        riskScore: analysis.riskScore || (100 - (analysis.score || 50)),
        confidence: analysis.confidence || 75,
        unverifiableClaims: analysis.unverifiableClaims || [],
        summary: analysis.summary || analysis.executiveSummary || '',
        strengths: analysis.strengths || [],
        risks: analysis.risks || [],
        recommendations: analysis.recommendations || [],
        score: analysis.score || 50,
        rating: analysis.rating || 'normal'
      };
    } catch (error: any) {
      // Enhanced error handling with specific messages
      if (error.code === 'insufficient_quota' || error.status === 429) {
        console.error('⚠️ RaftAI: OpenAI API quota exceeded or rate limited:', error.message);
        console.log('📊 RaftAI: Falling back to enhanced simulation mode...');
        // Don't throw - let the caller handle fallback
        throw new Error('OPENAI_QUOTA_EXCEEDED');
      } else if (error.status === 401) {
        console.error('❌ RaftAI: OpenAI API key invalid or expired');
        throw new Error('OPENAI_AUTH_ERROR');
      } else if (error.status === 404) {
        console.error('❌ RaftAI: OpenAI model not found');
        throw new Error('OPENAI_MODEL_ERROR');
      } else {
        console.error('❌ RaftAI: OpenAI comprehensive pitch analysis error:', error.message);
        throw error;
      }
    }
  }

  /**
   * Chat assistant with context awareness
   */
  async chatWithContext(
    message: string,
    context: {
      projectId?: string;
      userRole: string;
      conversationHistory?: Array<{ role: string; content: string }>;
    }
  ): Promise<string> {
    if (!this.isEnabled()) {
      throw new Error('OpenAI service not available');
    }

    const systemPrompt = `You are RaftAI, the intelligent assistant for Cryptorafts, a Web3 trust and investment platform.

Current Context:
- User Role: ${context.userRole}
- Project ID: ${context.projectId || 'None'}

Your role is to:
1. Provide expert Web3 and blockchain insights
2. Help with investment analysis and due diligence
3. Ensure compliance and risk assessment
4. Moderate conversations for safety
5. Be professional, concise, and helpful

Always maintain trust, transparency, and accuracy. If you don't know something, say so.`;

    try {
      const messages: any[] = [
        { role: 'system', content: systemPrompt },
      ];

      // Add conversation history if available
      if (context.conversationHistory && context.conversationHistory.length > 0) {
        messages.push(...context.conversationHistory.slice(-5)); // Last 5 messages
      }

      // Add current message
      messages.push({ role: 'user', content: message });

      const response = await this.client!.chat.completions.create({
        model: 'gpt-4o',
        messages,
        temperature: 0.8,
        max_tokens: 800,
      });

      return response.choices[0].message.content || 'I apologize, I could not generate a response.';
    } catch (error) {
      console.error('OpenAI chat error:', error);
      throw error;
    }
  }

  /**
   * Chat with JSON response format
   */
  async chatWithJSON(
    message: string,
    context?: {
      projectId?: string;
      userRole?: string;
      conversationHistory?: Array<{ role: string; content: string }>;
    }
  ): Promise<string> {
    if (!this.isEnabled()) {
      throw new Error('OpenAI service not available');
    }

    const systemPrompt = context?.userRole 
      ? `You are a helpful assistant for Cryptorafts. User Role: ${context.userRole}. Respond with JSON only.`
      : 'You are a helpful assistant. Respond with JSON only.';

    try {
      const messages: any[] = [
        { role: 'system', content: systemPrompt },
      ];

      // Add conversation history if available
      if (context?.conversationHistory && context.conversationHistory.length > 0) {
        messages.push(...context.conversationHistory.slice(-5));
      }

      // Add current message
      messages.push({ role: 'user', content: message });

      const response = await this.client!.chat.completions.create({
        model: 'gpt-4o',
        messages,
        temperature: 0.8,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      });

      return response.choices[0].message.content || '{}';
    } catch (error) {
      console.error('OpenAI chat JSON error:', error);
      throw error;
    }
  }

  /**
   * Analyze KYC documents for risk assessment
   */
  async analyzeKYCRisk(kycData: any): Promise<{
    riskAssessment: string;
    recommendations: string[];
    suspiciousIndicators: string[];
  }> {
    if (!this.isEnabled()) {
      throw new Error('OpenAI service not available');
    }

    const prompt = `Analyze this KYC data for potential risks:

Name: ${kycData.personalInfo?.fullName}
Nationality: ${kycData.personalInfo?.nationality}
Document Type: ${kycData.documents?.idDocument?.type}
Address: ${kycData.personalInfo?.address}

Provide risk assessment as JSON:
{
  "riskAssessment": "Overall risk level and reasoning",
  "recommendations": ["rec 1", "rec 2"],
  "suspiciousIndicators": ["indicator 1", "indicator 2"] or []
}`;

    try {
      const response = await this.client!.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a compliance expert. Analyze KYC data for risk. Respond with JSON only.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 500,
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('Empty response from OpenAI');
      }

      return JSON.parse(content);
    } catch (error) {
      console.error('OpenAI KYC analysis error:', error);
      throw error;
    }
  }

  /**
   * Generate executive summary
   */
  async generateSummary(content: string, maxLength: number = 200): Promise<string> {
    if (!this.isEnabled()) {
      throw new Error('OpenAI service not available');
    }

    try {
      const response = await this.client!.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `Summarize the following in ${maxLength} characters or less. Be concise and professional.`,
          },
          {
            role: 'user',
            content,
          },
        ],
        temperature: 0.5,
        max_tokens: Math.ceil(maxLength / 4),
      });

      return response.choices[0].message.content || content.substring(0, maxLength);
    } catch (error) {
      console.error('OpenAI summary error:', error);
      return content.substring(0, maxLength);
    }
  }

  /**
   * Extract action items from conversation
   */
  async extractActionItems(conversation: string): Promise<string[]> {
    if (!this.isEnabled()) {
      throw new Error('OpenAI service not available');
    }

    try {
      const response = await this.client!.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'Extract clear action items from this conversation. Return JSON array: {"actionItems": ["item1", "item2"]}',
          },
          {
            role: 'user',
            content: conversation,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 300,
      });

      const content = response.choices[0].message.content;
      if (!content) return [];

      const result = JSON.parse(content);
      return result.actionItems || [];
    } catch (error) {
      console.error('OpenAI action items error:', error);
      return [];
    }
  }

  /**
   * Detect sentiment and compliance issues
   */
  async moderateContent(text: string): Promise<{
    safe: boolean;
    categories: string[];
    reasoning: string;
  }> {
    if (!this.isEnabled()) {
      throw new Error('OpenAI service not available');
    }

    try {
      const moderation = await this.client!.moderations.create({
        input: text,
      });

      const result = moderation.results[0];
      const flaggedCategories = Object.entries(result.categories)
        .filter(([_, flagged]) => flagged)
        .map(([category]) => category);

      return {
        safe: !result.flagged,
        categories: flaggedCategories,
        reasoning: flaggedCategories.length > 0 
          ? `Content flagged for: ${flaggedCategories.join(', ')}`
          : 'Content is safe',
      };
    } catch (error) {
      console.error('OpenAI moderation error:', error);
      // Fail safe - allow content if moderation fails
      return {
        safe: true,
        categories: [],
        reasoning: 'Moderation check unavailable',
      };
    }
  }
}

// Export singleton instance
export const openaiService = OpenAIService.getInstance();
export { OpenAIService };

